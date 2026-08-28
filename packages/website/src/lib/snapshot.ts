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

const HINT =
  'Der Katalog-Snapshot fehlt oder ist unvollständig. Erzeugen mit: ' +
  'pnpm --filter @einsatzzeichen/website generate';

/**
 * `import.meta.glob` statt eines statischen Imports — und das ist der ganze Punkt: ein
 * `import … from '../generated/catalog-snapshot.json'` scheitert bei fehlender Datei schon in der
 * Modulauflösung, mit einer Meldung über einen unauflösbaren Pfad. Genau der Fall, den Spec §7
 * beschreibt („jemand startet `astro dev` ohne `generate`"), bekäme dann nicht den Hinweis,
 * sondern eine Bundlermeldung. Ein Glob liefert bei fehlender Datei ein leeres Register, und der
 * Hinweis unten kommt zum Zug.
 *
 * `eager: true` hält `loadSnapshot()` synchron; ein dynamischer Import ginge bei dieser Signatur
 * nicht. Die statische Typisierung der Konsumenten hängt am Rückgabetyp `CatalogSnapshot`, nicht
 * am Import.
 */
const GENERATED = import.meta.glob('../generated/catalog-snapshot.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

function generatedSnapshot(): unknown {
  const found = Object.values(GENERATED);
  return found.length === 1 ? found[0] : undefined;
}

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

/**
 * Der erzeugte Snapshot. Wirft mit dem Hinweis aus Spec §7, wenn die Datei fehlt oder keinen
 * brauchbaren Snapshot trägt — kein stiller Rückfall auf einen leeren Katalog.
 */
export function loadSnapshot(): CatalogSnapshot {
  return assertSnapshot(generatedSnapshot());
}
