/**
 * Die 558 Reviewzeilen: 544 Manifestzeilen, 13 Quellen, ein Profil. Rein und ohne Seiteneffekt —
 * kein `node:fs`, kein Netz. Dateisystem und HTTP sitzen im Server, damit dieselbe Zeilenmenge in
 * einem Test entstehen kann wie im Betrieb.
 *
 * `ReviewRow` ist die interne, reichere Fassung; die Vertragstypen aus `../contract.js` werden in
 * `views.ts` daraus abgeleitet. Der Vertrag trägt bewusst keine `Drawing`: die Oberfläche fordert
 * fertiges SVG über `/api/render` an, damit kein zweiter Renderpfad entsteht. Hier liegt die
 * Zeichnung trotzdem, weil der Server sie zum Rendern braucht.
 */
import {
  COVERAGE_MANIFEST,
  PROFILES,
  SOURCE_REGISTRY,
  areaOf,
  domainReviewQuestionsFor,
  manifestDomainReviewFor,
  profileDomainReviewFor,
  releaseBlockers,
  sectionOf,
  sortedDomainReviewOpenByArea,
  sourceDomainReviewFor,
} from '@einsatzzeichen/catalog';
import {
  entryKey,
  type CoverageEntry,
  type CoverageKind,
  type DepictionVariant,
  type Drawing,
  type ReviewStatus,
} from '@einsatzzeichen/schema';
import {
  carrierId,
  type CarrierContext,
  type CarrierId,
  type CarrierKind,
  type EvidenceChip,
  type ProseSection,
  type QuestionCard,
  type ReviewValue,
} from '../contract.js';
import { drawingForManifestEntry } from './drawings.js';
import { evidenceChips } from './evidence.js';
import { profileProse, sourceProse } from './prose.js';

/** Interne, reichere Fassung einer Reviewzeile; die Vertragstypen werden daraus abgeleitet. */
export interface ReviewRow {
  id: CarrierId;
  kind: CarrierKind;
  key: string;
  label: string;
  title: string;
  area: string;
  section: string;
  domain: ReviewValue;
  variant?: DepictionVariant;
  implementation?: string;
  coverage?: CoverageKind;
  profile?: string;
  referenceAsset?: string;
  technical?: ReviewValue;
  evidence: readonly EvidenceChip[];
  questions: readonly QuestionCard[];
  drawing?: Drawing;
  carrierContext?: CarrierContext;
  prose?: readonly ProseSection[];
}

/**
 * Quellen und Profil sind keine Kapitel und kein Anhang der Baseline; sie bekommen deshalb zwei
 * eigene Bereiche am Ende der Navigation statt in `areaOf` hineingezwängt zu werden.
 */
export const SOURCE_AREA = 'Quellen';
export const PROFILE_AREA = 'Profile';

/** Nur lesende Sicht auf ein `Review` aus dem Ledger — die Ledgerwerte sind tiefgefroren. */
interface ReadonlyReview {
  readonly status: ReviewStatus;
  readonly reviewer?: string;
  readonly date?: string;
  readonly note?: string;
}

/**
 * Erzeugt aus dem eingefrorenen Ledgerwert eine eigene, über JSON übertragbare Kopie. Die
 * optionalen Felder werden nur gesetzt, wenn sie da sind: `{ note: undefined }` und „keine Notiz"
 * sehen im Vertrag gleich aus, unterscheiden sich aber im JSON.
 */
function toReviewValue(review: ReadonlyReview): ReviewValue {
  return {
    status: review.status,
    ...(review.reviewer !== undefined ? { reviewer: review.reviewer } : {}),
    ...(review.date !== undefined ? { date: review.date } : {}),
    ...(review.note !== undefined ? { note: review.note } : {}),
  };
}

function questionCards(key: string): readonly QuestionCard[] {
  return domainReviewQuestionsFor(key).map((question) => ({
    id: question.id,
    question: question.question,
    ...(question.context !== undefined ? { context: question.context } : {}),
  }));
}

/**
 * Die Bereichsreihenfolge der Manifestzeilen: zuerst wie „Offene fachliche Reviews nach Bereich"
 * der Coverage-Zeile (absteigend nach offenen Zeilen, bei Gleichstand alphabetisch), dahinter
 * alphabetisch die Bereiche, die dort nicht vorkommen — also vollständig entschieden sind.
 *
 * Ohne den zweiten Teil verschwände ein fertig geprüfter Bereich aus der Navigation, sobald
 * seine letzte Zeile freigegeben ist. Genau dann will man ihn aber noch ansehen können. Der
 * Parameterschnitt (statt Modul-Singletons) macht diesen Fall prüfbar, ohne das eingefrorene
 * Manifest anzufassen — dasselbe Muster wie `dossierAreaOrder` im Dossier-Kommando.
 */
export function manifestAreaOrder(
  openByArea: Record<string, number>,
  areas: Iterable<string>,
): string[] {
  const order = sortedDomainReviewOpenByArea(openByArea).map(([area]) => area);
  const rest = [...new Set(areas)]
    .filter((area) => !order.includes(area))
    .sort((left, right) => left.localeCompare(right));
  return [...order, ...rest];
}

function manifestRow(entry: CoverageEntry): ReviewRow {
  const key = entryKey(entry.sourceId, entry.variant);
  const section = sectionOf(entry.sourceId);
  const { drawing, carrierContext } = drawingForManifestEntry(entry);
  return {
    id: carrierId('manifest', key),
    kind: 'manifest',
    key,
    label: key,
    title: entry.title,
    area: areaOf(section),
    section,
    // Aus dem Ledger und nicht aus `entry.review.domain`: beide sind dieselbe Zeile (das prüft
    // `domain-reviews.test.ts` in beide Richtungen), aber der Ledger ist die Stelle, in die
    // dieses Werkzeug zurückschreibt. Der fail-closed Zugriff meldet eine Zeile ohne Ledgerplatz
    // sofort, statt sie mit einem stillen Vorgabewert anzuzeigen.
    domain: toReviewValue(manifestDomainReviewFor(key)),
    technical: toReviewValue(entry.review.technical),
    variant: entry.variant,
    implementation: entry.implementation,
    coverage: entry.coverage,
    profile: entry.profile,
    referenceAsset: entry.referenceAsset,
    evidence: evidenceChips(entry.testEvidence),
    questions: questionCards(key),
    drawing,
    ...(carrierContext !== undefined ? { carrierContext } : {}),
  };
}

/**
 * Manifestzeilen in Bereichsreihenfolge, innerhalb eines Bereichs in Manifestreihenfolge. Die
 * Manifestreihenfolge bleibt damit die feine Ordnung — sie folgt der Abschnittsgliederung der
 * Baseline, und eine Umsortierung nach Zeichenkette risse `5.1.1.10` aus `5.1.1.9` heraus.
 */
function manifestRows(): ReviewRow[] {
  const byArea = new Map<string, CoverageEntry[]>();
  for (const entry of COVERAGE_MANIFEST.entries) {
    const area = areaOf(sectionOf(entry.sourceId));
    byArea.set(area, [...(byArea.get(area) ?? []), entry]);
  }
  const order = manifestAreaOrder(releaseBlockers().domainReviewOpenByArea, byArea.keys());
  const rows: ReviewRow[] = [];
  for (const area of order) {
    for (const entry of byArea.get(area) ?? []) rows.push(manifestRow(entry));
  }
  return rows;
}

function sourceRows(): ReviewRow[] {
  return Object.values(SOURCE_REGISTRY).map((source) => ({
    id: carrierId('source', source.id),
    kind: 'source',
    key: source.id,
    label: source.id,
    title: source.title,
    area: SOURCE_AREA,
    // Eine Quelle trägt keine Abschnittsnummer der Baseline; ein erfundener Abschnitt wäre eine
    // Behauptung. Der Vertrag lässt die Zeichenkette hier deshalb ausdrücklich leer.
    section: '',
    domain: toReviewValue(sourceDomainReviewFor(source.id)),
    technical: toReviewValue(source.review.technical),
    evidence: [],
    questions: [],
    prose: sourceProse(source),
  }));
}

function profileRows(): ReviewRow[] {
  return Object.values(PROFILES).map((profile) => ({
    id: carrierId('profile', profile.id),
    kind: 'profile',
    key: profile.id,
    label: profile.id,
    title: profile.title,
    area: PROFILE_AREA,
    section: '',
    domain: toReviewValue(profileDomainReviewFor(profile.id)),
    technical: toReviewValue(profile.review.technical),
    evidence: [],
    questions: [],
    prose: profileProse(profile),
  }));
}

/**
 * Alle 558 Zeilen in Anzeigereihenfolge. Die Funktion baut jedes Mal neu und hält bewusst keinen
 * Modul-Cache: 558 Zeilen sind billig, und ein Cache wäre genau die Stelle, an der die Oberfläche
 * nach einer Freigabe noch den alten Stand zeigte. Wer den Stand festhalten will, hält das
 * Ergebnis selbst — der Aufrufer entscheidet über die Lebensdauer, nicht dieses Modul.
 */
export function buildRows(): readonly ReviewRow[] {
  return [...manifestRows(), ...sourceRows(), ...profileRows()];
}
