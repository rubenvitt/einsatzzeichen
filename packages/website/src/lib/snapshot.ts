import type { Drawing, SymbolSpec } from '@einsatzzeichen/schema';

/**
 * Die Datengrenze zwischen Katalog und Website (Spec §5.3). Alles hier ist serialisierbar und
 * frei von lokalen Pfaden; was der Katalog über Referenzdateien weiß, bleibt im Katalog.
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

// Statischer Import: `loadSnapshot()` ist synchron, ein dynamischer Import ginge nicht. Fehlt die
// Datei, scheitert bereits die Auflösung — `predev`/`prebuild` erzeugen sie deshalb vor jedem
// Lauf. Der Hinweis unten fängt den zweiten Fall ab: Datei da, aber leer oder aus einem
// abgebrochenen Lauf.
import snapshot from '../generated/catalog-snapshot.json';

/**
 * Der erzeugte Snapshot. Wirft mit dem Hinweis aus Spec §7, wenn die Datei keinen brauchbaren
 * Snapshot trägt — kein stiller Rückfall auf einen leeren Katalog.
 */
export function loadSnapshot(): CatalogSnapshot {
  const candidate = snapshot as Partial<CatalogSnapshot> | null;
  if (
    candidate === null ||
    typeof candidate !== 'object' ||
    !Array.isArray(candidate.symbols) ||
    candidate.symbols.length === 0 ||
    typeof candidate.generatedAt !== 'string'
  ) {
    throw new Error(
      'Der Katalog-Snapshot fehlt oder ist unvollständig. Erzeugen mit: ' +
        'pnpm --filter @einsatzzeichen/website generate',
    );
  }
  return candidate as CatalogSnapshot;
}
