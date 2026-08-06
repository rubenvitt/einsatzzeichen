import {
  entryKey,
  isDataVersion,
  unattributedRoles,
  type CatalogEntry,
  type CoverageEntry,
  type ProfileRecord,
  type ReviewSet,
  type SourceId,
} from '@einsatzzeichen/schema';
import { BASE_SYMBOLS } from './base-symbols.js';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import { resolveElement, type ElementDescriptor } from './elements.js';
import { PROFILES } from './profiles.js';
import { SOURCE_REGISTRY, isRegisteredSource } from './sources.js';

/**
 * Katalogeinträge, die nicht genau eine `primary`-Darstellung haben. `CatalogEntry.depictions`
 * ist `readonly Depiction[]` — der Typ erzwingt die im Schema-Kommentar dokumentierte Invariante
 * ("Mindestens eine Darstellung; `primary` genau einmal") nicht. Leeres Array, zwei `primary`,
 * kein `primary` sind alle typkorrekt; die Prüfung sitzt deshalb hier, am Coverage-Gate.
 */
export function findPrimaryViolations(entries: readonly CatalogEntry[]): string[] {
  const violations: string[] = [];
  for (const entry of entries) {
    const primaryCount = entry.depictions.filter((d) => d.variant === 'primary').length;
    if (primaryCount !== 1) violations.push(entry.id);
  }
  return violations;
}

/**
 * Eine Verletzung einer der zehn in Slice 2 hinzugekommenen Prüfungen. Eine gemeinsame Liste
 * statt zehn einzelner Arrays: das CLI gibt sie einheitlich aus, und eine elfte Prüfung kostet
 * keine Änderung an der Rückgabeform.
 */
export interface CoverageViolation {
  /** Kurzname der Prüfung, z. B. 'baseline-prefix'. */
  check: string;
  /** Manifestschlüssel, Katalog-ID oder Registerschlüssel — je nachdem, was geprüft wurde. */
  key: string;
  detail: string;
}

/**
 * Das Präfix jedes `sourceId` muss die Baseline sein — nicht irgendeine registrierte Quelle.
 * Das Präfix bezeichnet die Abschnittsnummerierung, und nur im Hauptdokument ist definiert,
 * dass `5.4.3` „Gruppe" bedeutet.
 */
export function checkBaselinePrefix(
  entries: readonly CoverageEntry[],
  baseline: SourceId,
): CoverageViolation[] {
  const violations: CoverageViolation[] = [];
  for (const entry of entries) {
    const separator = entry.sourceId.indexOf(':');
    const prefix = separator === -1 ? '' : entry.sourceId.slice(0, separator);
    if (prefix !== baseline) {
      violations.push({
        check: 'baseline-prefix',
        key: entryKey(entry.sourceId, entry.variant),
        detail: `Präfix "${prefix}" statt der Baseline "${baseline}".`,
      });
    }
  }
  return violations;
}

/**
 * Jede `primary`-Darstellung eines Katalogeintrags muss mindestens einen Quellenbezug auf eine
 * registrierte Quelle tragen. Das ist die zweite Hälfte der Provenienz: das Manifest-Präfix
 * nennt die Abschnittsnummerierung, dieser Bezug nennt, woraus die Kennzahlen abgeleitet sind.
 */
export function checkCatalogSourceRefs(entries: readonly CatalogEntry[]): CoverageViolation[] {
  const violations: CoverageViolation[] = [];
  for (const entry of entries) {
    const primary = entry.depictions.find((d) => d.variant === 'primary');
    const registered = primary?.sourceRefs.some((ref) => isRegisteredSource(ref.source)) ?? false;
    if (!registered) {
      violations.push({
        check: 'unregistered-source',
        key: entry.id,
        detail: 'Die primary-Darstellung nennt keine registrierte Quelle.',
      });
    }
  }
  return violations;
}

/**
 * Für Zeilen mit `coverage: 'catalog-entry'` ist der Manifestwert `profile` aus dem
 * Katalogeintrag abgeleitet — hier wird die Gleichheit geprüft. Für Rezepte und Elemente ist der
 * Manifestwert die einzige Angabe; dort gibt es nichts zu vergleichen.
 */
export function checkProfileAgreement(
  entries: readonly CoverageEntry[],
  catalog: readonly CatalogEntry[],
): CoverageViolation[] {
  const byId = new Map(catalog.map((entry) => [entry.id, entry]));
  const violations: CoverageViolation[] = [];
  for (const entry of entries) {
    if (entry.coverage !== 'catalog-entry') continue;
    const target = byId.get(entry.implementation);
    if (target === undefined) {
      violations.push({
        check: 'profile-mismatch',
        key: entryKey(entry.sourceId, entry.variant),
        detail: `Kein Katalogeintrag "${entry.implementation}" — das Profil ist nicht ableitbar.`,
      });
      continue;
    }
    if (target.profile !== entry.profile) {
      violations.push({
        check: 'profile-mismatch',
        key: entryKey(entry.sourceId, entry.variant),
        detail: `Manifest nennt "${entry.profile}", der Katalogeintrag "${target.profile}".`,
      });
    }
  }
  return violations;
}

/**
 * Kein `approved` ohne Reviewer und Datum, je Rolle. Ein Status ohne Zurechenbarkeit ist wertlos.
 *
 * Generisch über allem, was ein `ReviewSet` trägt — das sind genau die drei Träger
 * `CoverageEntry`, `SourceRecord` und `ProfileRecord`. Auf `CoverageEntry` verengt hätte die
 * Prüfung nur einen der drei gedeckt, obwohl die Zusage für alle drei gilt; `key` liefert je
 * Träger seine eigene Bezeichnung, weil ein Manifestschlüssel für eine Quelle nicht existiert.
 */
export function checkReviewAttribution<T extends { review: ReviewSet }>(
  items: readonly T[],
  key: (item: T) => string,
): CoverageViolation[] {
  const violations: CoverageViolation[] = [];
  for (const item of items) {
    for (const role of unattributedRoles(item.review)) {
      violations.push({
        check: 'review-attribution',
        key: key(item),
        detail: `Rolle "${role}": approved ohne Reviewer und Datum.`,
      });
    }
  }
  return violations;
}

/** Nur Ausgabe, kein Fehler: wäre sie einer, wäre CI ab dem ersten Tag dauerhaft rot. */
export function countOpenDomainReviews(entries: readonly CoverageEntry[]): number {
  return entries.filter((entry) => entry.review.domain.status !== 'approved').length;
}

/**
 * `resolveElement` wirft bei unbekannter ID — für das Gate ist eine unbekannte ID aber ein
 * Befund und kein Abbruch. Dieser Wrapper übersetzt das eine ins andere, ohne dass
 * `resolveElement` seine Wurf-Semantik aufgeben muss.
 */
function tryResolveElement(id: string): ElementDescriptor | undefined {
  try {
    return resolveElement(id);
  } catch {
    return undefined;
  }
}

/**
 * Abschnittsnummer eines Manifest-Eintrags, also der Teil hinter dem Baseline-Präfix. Wird von
 * `checkElementEntries` und von `blockersOf` verwendet.
 */
function sectionOf(sourceId: string): string {
  const separator = sourceId.indexOf(':');
  return separator === -1 ? sourceId : sourceId.slice(separator + 1);
}

/**
 * Jeder Eintrag mit `coverage: 'element'` muss über `resolveElement` auflösbar sein, und seine
 * genannte Referenzdatei muss in den Belegstellen des Deskriptors vorkommen — damit kann ein
 * Eintrag keine Datei nennen, die das Element nicht belegt.
 *
 * Dazu muss die Abschnittsnummer im `sourceId` zu dem Element passen, das der Eintrag
 * beansprucht. Ohne diese Prüfung ließe sich `'organization.polizei'` von `2.5` auf `9.9` setzen,
 * und das Gate bliebe grün, während das Manifest behauptet, Abschnitt 9.9 der Baseline
 * dokumentiere die Polizeifarbe. Die namensgebende Belegdatei ist bauartbedingt die
 * Abschnittsnummer plus `_` — das gilt für alle dreizehn Elemente und ist der prüfbare Anker.
 * Damit fängt die Prüfung zugleich ein Auseinanderlaufen von `ELEMENTS` und `ELEMENT_SECTIONS`.
 */
export function checkElementEntries(entries: readonly CoverageEntry[]): CoverageViolation[] {
  const violations: CoverageViolation[] = [];
  for (const entry of entries) {
    if (entry.coverage !== 'element') continue;
    const key = entryKey(entry.sourceId, entry.variant);
    const descriptor = tryResolveElement(entry.implementation);
    if (descriptor === undefined) {
      violations.push({
        check: 'unknown-element',
        key,
        detail: `Element "${entry.implementation}" ist im Katalog nicht auflösbar.`,
      });
      continue;
    }
    if (!descriptor.referenceAssets.includes(entry.referenceAsset)) {
      violations.push({
        check: 'asset-not-in-element',
        key,
        detail: `"${entry.referenceAsset}" belegt "${entry.implementation}" nicht.`,
      });
    }
    const section = sectionOf(entry.sourceId);
    const namesake = descriptor.referenceAssets[0] ?? '';
    if (!namesake.startsWith(`${section}_`)) {
      violations.push({
        check: 'section-mismatch',
        key,
        detail: `Abschnitt "${section}" passt nicht zur namensgebenden Belegdatei "${namesake}".`,
      });
    }
  }
  return violations;
}

/**
 * Jeder Eintrag trägt ein im Profilregister existierendes Profil. Der Typ `ProfileId` deckt das
 * für sauber getippte Daten ab; diese Prüfung fängt Einträge, die über eine Typzusicherung oder
 * aus einer künftigen externen Quelle ins Manifest gelangen.
 */
export function checkProfileRegistry(
  entries: readonly CoverageEntry[],
  profiles: readonly ProfileRecord[],
): CoverageViolation[] {
  const known = new Set<string>(profiles.map((record) => record.id));
  const violations: CoverageViolation[] = [];
  for (const entry of entries) {
    if (!known.has(entry.profile)) {
      violations.push({
        check: 'unknown-profile',
        key: entryKey(entry.sourceId, entry.variant),
        detail: `Profil "${entry.profile}" ist nicht registriert.`,
      });
    }
  }
  return violations;
}

/**
 * Jede Datenversion hat die Form `major.minor.patch`, und `verifiedAgainstCore` jedes Profils
 * nennt eine bekannte Kernversion. Für den Kern selbst gilt
 * `verifiedAgainstCore === version === coreVersion`; die Menge der bekannten Kernversionen ist
 * heute einelementig und wächst, sobald eine Versionshistorie geführt wird.
 */
export function checkVersions(
  coreVersion: string,
  profiles: readonly ProfileRecord[],
): CoverageViolation[] {
  const violations: CoverageViolation[] = [];
  if (!isDataVersion(coreVersion)) {
    violations.push({
      check: 'version-format',
      key: 'coreVersion',
      detail: `"${coreVersion}" hat nicht die Form major.minor.patch.`,
    });
  }

  const knownCoreVersions = new Set([coreVersion]);

  for (const record of profiles) {
    if (!isDataVersion(record.version)) {
      violations.push({
        check: 'version-format',
        key: `profile:${record.id}`,
        detail: `version "${record.version}" hat nicht die Form major.minor.patch.`,
      });
    }
    if (!isDataVersion(record.verifiedAgainstCore)) {
      violations.push({
        check: 'version-format',
        key: `profile:${record.id}`,
        detail: `verifiedAgainstCore "${record.verifiedAgainstCore}" hat nicht die Form major.minor.patch.`,
      });
    } else if (!knownCoreVersions.has(record.verifiedAgainstCore)) {
      violations.push({
        check: 'unknown-core-version',
        key: `profile:${record.id}`,
        detail: `verifiedAgainstCore "${record.verifiedAgainstCore}" ist keine bekannte Kernversion.`,
      });
    }
  }
  return violations;
}

/**
 * Das CI-Gate. Die vier Prüfungen aus Slice 1 (Referenzdatei vorhanden, eindeutige Schlüssel,
 * genau eine `primary`-Darstellung) bleiben in ihren eigenen Feldern; die in Slice 2
 * hinzugekommenen Prüfungen sammeln sich in `violations`.
 */
export function checkCoverage(): {
  missing: string[];
  duplicates: string[];
  invalidPrimary: string[];
  violations: CoverageViolation[];
  openDomainReviews: number;
} {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const missing: string[] = [];

  for (const entry of COVERAGE_MANIFEST.entries) {
    const key = entryKey(entry.sourceId, entry.variant);
    if (seen.has(key)) duplicates.push(key);
    seen.add(key);
    if (entry.referenceAsset === '' || entry.implementation === '') missing.push(key);
  }

  const catalog = Object.values(BASE_SYMBOLS);
  const invalidPrimary = findPrimaryViolations(catalog);

  const violations = [
    ...checkBaselinePrefix(COVERAGE_MANIFEST.entries, COVERAGE_MANIFEST.baseline),
    ...checkCatalogSourceRefs(catalog),
    ...checkProfileAgreement(COVERAGE_MANIFEST.entries, catalog),
    ...checkReviewAttribution(COVERAGE_MANIFEST.entries, (e) => entryKey(e.sourceId, e.variant)),
    ...checkReviewAttribution(Object.values(SOURCE_REGISTRY), (s) => `source:${s.id}`),
    ...checkReviewAttribution(Object.values(PROFILES), (p) => `profile:${p.id}`),
    ...checkElementEntries(COVERAGE_MANIFEST.entries),
    ...checkProfileRegistry(COVERAGE_MANIFEST.entries, Object.values(PROFILES)),
    ...checkVersions(COVERAGE_MANIFEST.coreVersion, Object.values(PROFILES)),
  ];

  return {
    missing,
    duplicates,
    invalidPrimary,
    violations,
    openDomainReviews: countOpenDomainReviews(COVERAGE_MANIFEST.entries),
  };
}

export interface ReleaseBlockers {
  /** Manifestschlüssel der Einträge ohne abgeschlossenes fachliches Review. */
  domainReviewPending: string[];
  /**
   * Dieselben Einträge, gezählt je Kapitel und Anhang. Nach dem vollen Katalogausbau tragen
   * mehrere hundert Einträge `domain: pending` und dominieren `domainReviewPending` vollständig.
   * Die Liste bleibt trotzdem ungekürzt — das fachliche Review ist der Engpass zu 1.0, und das
   * darzustellen ist ihr Zweck. Diese Zählung macht daneben sichtbar, welcher Bereich geprüft
   * ist und welcher nicht.
   *
   * Trägt keine Reihenfolge: ECMAScript zählt Objektschlüssel, die kanonische Ganzzahl-Strings
   * sind (`'4'`, `'12'`, …), immer aufsteigend numerisch vor allen anderen Schlüsseln auf —
   * unabhängig von der Einfügereihenfolge. Da Bereiche wie `'1'` bis `'14'` genau solche
   * Schlüssel sind, kann kein `Record` die gewünschte Sortierung tragen. Wer sie braucht, ruft
   * `sortedDomainReviewPendingByArea` auf.
   */
  domainReviewPendingByArea: Record<string, number>;
  /** Manifestschlüssel der Einträge ohne Fingerprint- oder Snapshot-Nachweis. */
  withoutTestEvidence: string[];
  /** Kapitel im Scope, die kein einziger Eintrag trägt. */
  uncoveredScope: string[];
}

/**
 * Bereich einer Abschnittsnummer: der Teil vor dem ersten Punkt. `'4.3.2'` → `'4'`,
 * `'C.1.1'` → `'C'`, `'1'` → `'1'`. Grob genug, dass die Zählung nach dem vollen Ausbau lesbar
 * bleibt, und fein genug, dass Kapitel 4 und Anhang C nicht in einen Topf fallen.
 */
function areaOf(section: string): string {
  const dot = section.indexOf('.');
  return dot === -1 ? section : section.slice(0, dot);
}

/**
 * `domainReviewPendingByArea` als Paare, absteigend nach Anzahl und bei Gleichstand alphabetisch
 * sortiert — die Reihenfolge, die der `Record` selbst nicht tragen kann (siehe dessen
 * Dokumentation). Einzige Stelle, die diese Sortierung herstellt, damit CLI und Tests dieselbe
 * Reihenfolge sehen.
 */
export function sortedDomainReviewPendingByArea(
  byArea: Record<string, number>,
): Array<[area: string, count: number]> {
  return Object.entries(byArea).sort(([areaA, countA], [areaB, countB]) =>
    countB - countA !== 0 ? countB - countA : areaA.localeCompare(areaB),
  );
}

/**
 * Der parametrisierte Kern von `releaseBlockers`, im Muster der Gate-Prüfungen oben: Eingaben
 * als Parameter statt als Modul-Singleton, damit Randfälle — die Punkt-Abgrenzung bei
 * Kapitelpräfixen, ein `sourceId` ohne Trenner, jede Seite des Testnachweis-Oder einzeln — sich
 * mit Fixtures nachstellen lassen, ohne das echte Manifest zu verändern.
 */
export function blockersOf(
  entries: readonly CoverageEntry[],
  scope: readonly string[],
): ReleaseBlockers {
  const domainReviewPending: string[] = [];
  const withoutTestEvidence: string[] = [];
  const pendingByArea = new Map<string, number>();

  for (const entry of entries) {
    const key = entryKey(entry.sourceId, entry.variant);
    if (entry.review.domain.status !== 'approved') {
      domainReviewPending.push(key);
      const area = areaOf(sectionOf(entry.sourceId));
      pendingByArea.set(area, (pendingByArea.get(area) ?? 0) + 1);
    }
    if (!entry.fingerprintTest || !entry.snapshotTest) withoutTestEvidence.push(key);
  }

  const sections = entries.map((entry) => sectionOf(entry.sourceId));
  const uncoveredScope = scope.filter(
    (chapter) =>
      !sections.some((section) => section === chapter || section.startsWith(`${chapter}.`)),
  );

  // Keine Sortierung hier: der `Record` kann sie ohnehin nicht tragen (siehe Dokumentation des
  // Felds). Wer eine Reihenfolge braucht, ruft `sortedDomainReviewPendingByArea` auf.
  const domainReviewPendingByArea = Object.fromEntries(pendingByArea);

  return { domainReviewPending, domainReviewPendingByArea, withoutTestEvidence, uncoveredScope };
}

/**
 * Was Release 1.0 nach den Vision-Kriterien noch blockiert. Läuft als Test, nicht als CI-Abbruch:
 * die Ausgabe ist stabil und prüfbar, aber ein offener Punkt lässt die Pipeline nicht scheitern.
 *
 * Ein ungeklärter Lizenzstatus ist ausdrücklich **kein** Blocker. Wäre er einer, wäre
 * `babz-svg-2025` ein dauerhafter Blocker — und die Architektur beantwortet die unklare Lage
 * bereits: abgeleitete Kennzahlen statt Dateien, eigenständige Geometrie statt übernommener Pfade.
 *
 * Die Vollständigkeit gegenüber der Baseline wird hier bewusst **nicht** gemessen:
 * `uncoveredScope` meldet Lücken innerhalb des beanspruchten Umfangs (`COVERAGE_MANIFEST.scope`),
 * nicht Lücken des Umfangs gegenüber dem Gesamtdokument. Diese zweite Messung bräuchte eine
 * deklarierte Kapitelliste der Baseline, die es noch nicht gibt.
 */
export function releaseBlockers(): ReleaseBlockers {
  return blockersOf(COVERAGE_MANIFEST.entries, COVERAGE_MANIFEST.scope);
}
