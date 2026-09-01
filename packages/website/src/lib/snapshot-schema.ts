import type { Drawing, SymbolSpec } from '@einsatzzeichen/schema';

/**
 * Die Datengrenze zwischen Katalog und Website (Spec §5.3) — als **reines** Modul: nur Typen und
 * die Prüfung, kein Dateizugriff, kein `import.meta.glob`, kein `node:`-Import.
 *
 * Die Trennung von `snapshot.ts` ist der Grund, aus dem dieses Modul überhaupt existiert
 * (LFH-500). `snapshot-client.ts` läuft im Browser und braucht `assertSnapshot()`; lägen Prüfung
 * und der bauzeitliche Lader weiter in einer Datei, hinge am Wertimport der Prüfung die
 * Modulkette bis zum eager `import.meta.glob` auf die 1,3-MB-JSON-Datei. Ob ein Bündler das
 * wieder wegschüttelt, ist eine Wette auf sein Verhalten — und genau die Wette, die dieser Task
 * beseitigt. Ohne Kette gibt es nichts wegzuschütteln.
 */

export interface ReviewSummary {
  status: 'pending' | 'approved' | 'deviation';
  reviewer?: string;
  date?: string;
  note?: string;
}

export interface SourceSummary {
  id: string;
  title: string;
  /** Zitierform aus Herausgeber, Titel und Auflage — `SourceRecord` führt sie nicht als Feld. */
  citation: string;
  url?: string;
  /** Lizenzstand der Quelle (`SourceRecord.licence.status`): `clarified` oder `unclear`. */
  status: string;
  review: { technical: ReviewSummary; domain: ReviewSummary };
}

export interface SymbolSummary {
  id: string;
  slug: string;
  title: string;
  kind: 'catalog-entry' | 'composition-recipe';
  spec: SymbolSpec;
  drawing: Drawing;
  /** Manifestschlüssel-Quelle, z. B. `bbk-babz-2025:E.1.1`. */
  sourceId: string;
  variant: 'primary' | 'alternative';
  source: { id: string; citation: string; page?: string };
  /** Lesbare Kapitelbezeichnung, z. B. „Anhang E.1" oder „Kapitel 4.6". */
  chapter: string;
  profile: string;
  synonyms: string[];
  legacyIds: string[];
  review: { technical: ReviewSummary; domain: ReviewSummary };
  /** Nachweisarten der Manifestzeile (`CoverageEntry.testEvidence`). */
  evidence: string[];
  /** Klartext der Kontrastausnahme, falls der Abschnitt eine trägt. */
  contrastException?: string;
}

export interface CoverageAxis {
  label: string;
  value: number;
  of?: number;
  detail?: string;
}

export interface MatrixRow {
  key: string;
  sourceId: string;
  variant: string;
  title: string;
  implementation: string;
  /** Fehlt bei `coverage: 'element'` — Elemente und Piktogramme haben keine Symbolseite. */
  slug?: string;
  coverage: string;
  profile: string;
  technical: ReviewSummary;
  domain: ReviewSummary;
  evidence: string[];
}

export interface CoverageSummary {
  baseline: string;
  coreVersion: string;
  scope: string[];
  entries: number;
  sources: number;
  /** Genau die drei Achsen, die `pnpm cli coverage` druckt. */
  axes: CoverageAxis[];
  blockers: { kind: string; key: string; detail?: string }[];
  openDomainReviewsByArea: { area: string; count: number; keys: string[] }[];
  contrastExceptions: string[];
  matrix: MatrixRow[];
}

/** Erlaubte IDs je `SymbolSpec`-Feld mit deutscher Bezeichnung, für den Builder. */
export interface BuilderVocabulary {
  [field: string]: { id: string; label: string }[];
}

export interface CatalogSnapshot {
  generatedAt: string;
  baseline: string;
  coreVersion: string;
  symbols: SymbolSummary[];
  sources: SourceSummary[];
  coverage: CoverageSummary;
  builder: BuilderVocabulary;
  ruleIds: string[];
}

const HINT =
  'Der Katalog-Snapshot fehlt oder ist unvollständig. Erzeugen mit: ' +
  'pnpm --filter @einsatzzeichen/website generate';

/**
 * Die Prüfung getrennt vom Laden, damit sie prüfbar ist: der fehlende Fall ist beim Glob ein
 * `undefined`, und den kann ein Test herstellen, ohne die erzeugte Datei zu löschen. Ein Test,
 * der sie löschte, würde jeden parallelen Lauf im selben Arbeitsverzeichnis stören.
 */
export function assertSnapshot(candidate: unknown): CatalogSnapshot {
  const value = candidate as Partial<CatalogSnapshot> | null | undefined;
  if (
    value === null ||
    value === undefined ||
    typeof value !== 'object' ||
    !Array.isArray(value.symbols) ||
    value.symbols.length === 0 ||
    typeof value.generatedAt !== 'string'
  ) {
    throw new Error(HINT);
  }
  return value as CatalogSnapshot;
}
