import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import {
  COVERAGE_MANIFEST,
  DOMAIN_REVIEW_QUESTIONS,
  PROFILES,
  SOURCE_REGISTRY,
  domainReviewQuestionIssues,
  domainReviewQuestionsFor,
  referenceInventoryAssets,
  releaseBlockers,
  sortedDomainReviewOpenByArea,
} from '@einsatzzeichen/catalog';
import type { CoverageEntry, Review, TestEvidenceKind } from '@einsatzzeichen/schema';
import { entryKey } from '@einsatzzeichen/schema';

/**
 * Evidenzkürzel je Nachweisart. Die fünf Kürzel FP, RS, FARBE, KOPF und PG sind in Abschnitt 3
 * des Übergabedokuments vom 6. August 2026 definiert. **GEO** und **FW** sind neu und deshalb im
 * Generat eigens erklärt: `body-geometry-regression` ist kein FP — der Erwartungswert steht in
 * der Testdatei, nicht im Kennwertartefakt —, und `chassis-shape-regression` ist kein KOPF, weil
 * Fahrwerksmarken an der Körperunterkante verankern und vom Kopfgate nie erfasst werden. Beide
 * unter ein vorhandenes Kürzel zu schieben, hieße dem Reviewer eine Herkunft vorzutäuschen.
 */
export const EVIDENCE_CODES: Record<TestEvidenceKind, string> = {
  'body-fingerprint': 'FP',
  'body-geometry-regression': 'GEO',
  'svg-snapshot': 'RS',
  'reference-fill': 'FARBE',
  'head-shape-regression': 'KOPF',
  'chassis-shape-regression': 'FW',
  'pictogram-contract': 'PG',
};

export const EVIDENCE_LEGEND: ReadonlyArray<readonly [code: string, meaning: string]> = [
  ['FP', 'Körperhülle gegen die Kennzahlen des lokalen Referenz-SVGs (`matchFingerprint`); nicht das vollständige Bild.'],
  ['GEO', 'Körpergeometrie gegen in der Testdatei festgenagelte Messwerte — dort, wo das Kennwertartefakt keine vergleichbare Form führt. Kein FP: andere Provenienz des Erwartungswerts.'],
  ['RS', 'Datei- und Mehrgrößen-Rastersnapshot der eigenen Ausgabe; Regressionsschutz, kein Referenzvergleich.'],
  ['FARBE', 'Palettenwert gegen die im Referenzartefakt gefundene Füllfarbe.'],
  ['KOPF', 'Programmatische Prüfung der vermessenen Kopfmarken.'],
  ['FW', 'Programmatische Prüfung der vermessenen Fahrwerksmarken (Kapitel 5.1). Kein KOPF: eigene Zone, eigenes Gate.'],
  ['PG', 'Piktogramm besteht Kommando-, Box-, Clipping- und Snapshot-Gate; Bildidee und Verwechslungsfreiheit bleiben ungeprüft.'],
];

/** Wie `areaOf` in `coverage-gate.ts`: der Teil der Abschnittsnummer vor dem ersten Punkt. */
function areaOf(sourceId: string): string {
  const separator = sourceId.indexOf(':');
  const section = separator === -1 ? sourceId : sourceId.slice(separator + 1);
  const dot = section.indexOf('.');
  return dot === -1 ? section : section.slice(0, dot);
}

function cell(text: string | undefined): string {
  return (text ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function code(text: string): string {
  return `\`${text.replace(/`/g, '')}\``;
}

function reviewCell(review: Review): string {
  const parts: string[] = [review.status];
  if (review.reviewer !== undefined) parts.push(review.reviewer);
  if (review.date !== undefined) parts.push(review.date);
  return parts.join(', ');
}

interface StatusCount {
  pending: number;
  approved: number;
  deviation: number;
}

function countStatuses(reviews: readonly Review[]): StatusCount {
  const count: StatusCount = { pending: 0, approved: 0, deviation: 0 };
  for (const review of reviews) count[review.status] += 1;
  return count;
}

function countRow(label: string, count: StatusCount): string {
  const total = count.pending + count.approved + count.deviation;
  return `| ${label} | ${count.pending} | ${count.approved} | ${count.deviation} | ${total} |`;
}

/**
 * Der Referenzasset-Dateiname. `basename` ist eine Schutzschranke, kein Normalfall: das
 * Manifest führt heute ausschließlich Dateinamen aus `fingerprints.json`, aber das Dossier ist
 * ein Übergabedokument und darf unter keinen Umständen einen lokalen Pfad ausgeben.
 */
function assetCell(entry: CoverageEntry, known: ReadonlySet<string>): string {
  if (entry.referenceAsset === '') return '—';
  const name = basename(entry.referenceAsset);
  return known.has(name) ? code(name) : `${code(name)} (nicht im Kennwertartefakt)`;
}

function evidenceCell(entry: CoverageEntry): string {
  const codes = [...new Set(entry.testEvidence.map((kind) => EVIDENCE_CODES[kind]))];
  return codes.length === 0 ? '—' : codes.join(', ');
}

/**
 * Reihenfolge der Bereiche im Dossier: zuerst wie die Coverage-Zeile „Offene fachliche Reviews
 * nach Bereich" (absteigend nach offenen Zeilen, bei Gleichstand alphabetisch), dahinter
 * alphabetisch die Bereiche, die in `openByArea` nicht vorkommen — also vollständig
 * abgeschlossen sind. Eigene Funktion mit Parametern statt Modul-Singletons, damit der Fall
 * „ein Bereich ist komplett approved" testbar ist, ohne das eingefrorene Manifest anzufassen.
 */
export function dossierAreaOrder(
  openByArea: Record<string, number>,
  areas: Iterable<string>,
): string[] {
  const order = sortedDomainReviewOpenByArea(openByArea).map(([area]) => area);
  const rest = [...new Set(areas)]
    .filter((area) => !order.includes(area))
    .sort((a, b) => a.localeCompare(b));
  return [...order, ...rest];
}

export class ReviewDossierError extends Error {}

/** Das Dossier als Markdown. Deterministisch — keine Zeitstempel, keine lokalen Pfade. */
export function renderReviewDossier(): string {
  const entries = COVERAGE_MANIFEST.entries as readonly CoverageEntry[];
  const sources = Object.values(SOURCE_REGISTRY);
  const profiles = Object.values(PROFILES);
  const blockers = releaseBlockers();
  const known = new Set(referenceInventoryAssets());

  const manifestCount = countStatuses(entries.map((entry) => entry.review.domain));
  const sourceCount = countStatuses(sources.map((source) => source.review.domain));
  const profileCount = countStatuses(profiles.map((profile) => profile.review.domain));

  const lines: string[] = [];
  const out = (line = '') => lines.push(line);

  out('# Fachreview-Dossier (Generat)');
  out();
  out('> Erzeugt mit `pnpm cli review-dossier`. Dieses Dokument **bereitet** das fachliche Review vor;');
  out('> es erteilt keine Freigabe und ändert keinen Reviewstatus. Freigeben darf nur eine benannte');
  out('> Person mit einsatztaktischer Fachkunde, und zwar im Ledger `packages/catalog/src/domain-reviews.ts`.');
  out();
  out(`- Baseline: ${code(COVERAGE_MANIFEST.baseline)}`);
  out(
    `- Kernversion: ${COVERAGE_MANIFEST.coreVersion}` +
      ` (Profil ${code(PROFILES.bund.id)}: ${PROFILES.bund.version})`,
  );
  out(`- Umfang: ${COVERAGE_MANIFEST.scope.join(', ')}`);
  out(
    `- Offene fachliche Reviews: ${blockers.domainReviewOpen.length} Manifest, ` +
      `${blockers.sourceDomainReviewOpen.length} Quellen, ` +
      `${blockers.profileDomainReviewOpen.length} Profil`,
  );
  out();
  out('| Trägerart | offen (pending) | approved | deviation | gesamt |');
  out('|---|---|---|---|---|');
  out(countRow('Manifestzeilen', manifestCount));
  out(countRow('Quellen', sourceCount));
  out(countRow('Profile', profileCount));
  out();
  out('## Evidenzkürzel');
  out();
  out('Technische Hilfen, keine fachlichen Freigaben. Hergeleitet aus `testEvidence` je Manifestzeile:');
  out();
  for (const [abbreviation, meaning] of EVIDENCE_LEGEND) out(`- **${abbreviation}:** ${meaning}`);
  out();
  out('Die Spalte „Fachreview" zeigt `status[, reviewer, date]` des Domain-Reviews; „note" dessen Notiz.');
  out('Die Spalte „Fragen" nennt die IDs der offenen Fachfragen aus dem Register; ihr Wortlaut steht');
  out('am Ende jedes Bereichs.');

  const byArea = new Map<string, CoverageEntry[]>();
  for (const entry of entries) {
    const area = areaOf(entry.sourceId);
    byArea.set(area, [...(byArea.get(area) ?? []), entry]);
  }
  const areaOrder = dossierAreaOrder(blockers.domainReviewOpenByArea, byArea.keys());

  out();
  out('## Manifestreviews nach Bereich');
  for (const area of areaOrder) {
    const areaEntries = byArea.get(area) ?? [];
    const count = countStatuses(areaEntries.map((entry) => entry.review.domain));
    const label = /^\d/.test(area) ? `Kapitel ${area}` : `Anhang ${area}`;
    out();
    out(`### ${label} — ${count.pending} offen, ${count.approved} approved, ${count.deviation} deviation`);
    out();
    out('| Manifestschlüssel | Titel | Implementierung | Referenzasset | Evidenz | Fachreview | note | Fragen |');
    out('|---|---|---|---|---|---|---|---|');
    const questionIds = new Set<string>();
    for (const entry of areaEntries) {
      const key = entryKey(entry.sourceId, entry.variant);
      const questions = domainReviewQuestionsFor(key);
      for (const question of questions) questionIds.add(question.id);
      out(
        `| ${code(key)} | ${cell(entry.title)} | ${code(entry.implementation)} | ` +
          `${assetCell(entry, known)} | ${evidenceCell(entry)} | ${reviewCell(entry.review.domain)} | ` +
          `${cell(entry.review.domain.note)} | ${questions.map((q) => q.id).join(', ')} |`,
      );
    }
    if (questionIds.size > 0) {
      out();
      out(`#### Offene Fachfragen zu ${label}`);
      out();
      for (const question of DOMAIN_REVIEW_QUESTIONS) {
        if (!questionIds.has(question.id)) continue;
        out(`- **${question.id}** (${question.keys.map((k) => code(k)).join(', ')})`);
        out(`  ${question.question}`);
        if (question.context !== undefined) out(`  _${question.context}_`);
      }
    }
  }

  out();
  out('## Quellenreviews');
  out();
  out('| Quelle | Titel | Art | Fachreview | note |');
  out('|---|---|---|---|---|');
  for (const source of sources) {
    out(
      `| ${code(source.id)} | ${cell(source.title)} | ${source.kind} | ` +
        `${reviewCell(source.review.domain)} | ${cell(source.review.domain.note)} |`,
    );
  }

  out();
  out('## Profilreviews');
  out();
  out('| Profil | Titel | Version | Fachreview | note |');
  out('|---|---|---|---|---|');
  for (const profile of profiles) {
    out(
      `| ${code(profile.id)} | ${cell(profile.title)} | ${profile.version} | ` +
        `${reviewCell(profile.review.domain)} | ${cell(profile.review.domain.note)} |`,
    );
  }
  out();
  return lines.join('\n');
}

export interface ReviewDossierOptions {
  /** Zielpfad; ohne Angabe geht das Markdown auf stdout. */
  out?: string;
  /**
   * Quelle der Registerprüfung; Standard ist das echte Register. Als Parameter, damit der
   * Fehlpfad testbar ist, ohne das eingefrorene Register zu verbiegen.
   */
  registerIssues?: () => string[];
}

/**
 * Wirft `ReviewDossierError`, wenn das Fragenregister nicht zum Ledger passt — ein Dossier mit
 * toten Fragen wäre für den Reviewer schlimmer als keines. Die CLI meldet das auf stderr mit
 * Exit 1 (Muster der übrigen Kommandos).
 */
export function reviewDossier(options: ReviewDossierOptions = {}): void {
  const issues = (options.registerIssues ?? domainReviewQuestionIssues)();
  if (issues.length > 0) {
    throw new ReviewDossierError(
      'Fachfragenregister inkonsistent zum Ledger, kein Dossier erzeugt:\n' +
        issues.map((issue) => `  - ${issue}`).join('\n'),
    );
  }
  const markdown = renderReviewDossier();
  if (options.out === undefined) {
    process.stdout.write(markdown);
    return;
  }
  mkdirSync(dirname(options.out), { recursive: true });
  writeFileSync(options.out, markdown, 'utf8');
  console.log(`Review-Dossier nach ${options.out} geschrieben (${markdown.length} Zeichen).`);
}
