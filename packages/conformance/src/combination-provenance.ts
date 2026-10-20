import {
  ALL_PICTOGRAMS,
  PLACES,
  freestandingRedirect,
  matchFingerprint,
  pictogramDrawing,
  specKey,
  symbolProvenance,
} from '@einsatzzeichen/core';
import type { SymbolProvenance } from '@einsatzzeichen/core';
import {
  isFreestandingSpec,
  type Drawing,
  type FreestandingSpec,
  type ReviewSet,
  type StateId,
  type SymbolSpec,
} from '@einsatzzeichen/schema';
import { comparableFingerprint } from './comparison-exceptions.js';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import { fingerprintFor, referenceLacksComparableShape } from './fingerprint-index.js';
import { RECIPES, composeFromCatalog } from './recipes.js';

/**
 * Herkunft einer Kombination (LFH-568).
 *
 * **Einschränkung, die sichtbar bleiben muss:** `verbatim` heißt hier „die **Körperhülle**
 * entspricht dem Original". Der Vergleich (`matchFingerprint`, core/src/fingerprint.ts) prüft
 * heute nur die vier Kanten des `body`-Primitivs gegen den Kennwert der Referenz. Kopfzone,
 * Piktogramme, Körpermarken und Beschriftung sind damit **nicht** belegt — auch nicht bei
 * `verbatim`. Das Feld `claim: 'body-hull'` trägt diese Grenze in jedem Ergebnis mit, und
 * `combination-provenance.test.ts` nagelt sie fest.
 *
 * `legacy` bleibt außen vor (Spec LFH-568): eine Kombination ist entweder eine bestandene Fixture
 * oder abgeleitet. Seit ESZ-136 zählt als Fixture auch eine Spec, die genau eine Kapiteldatei des
 * Piktogrammregisters zeichnet (`claim: 'reference-file'`, siehe `referenceFileIndex`).
 */
export type CombinationProvenance =
  | {
    readonly status: 'verbatim';
    /** Was belegt ist: heute ausschließlich die Körperhülle. */
    readonly claim: 'body-hull';
    /** Rezeptschlüssel der Fixture in `RECIPES`. */
    readonly fixture: string;
    readonly referenceAsset: string;
    /** Reviewstand der Manifestzeile mit `implementation: 'recipe.<fixture>'`, falls vorhanden. */
    readonly review?: ReviewSet;
  }
  | {
    readonly status: 'verbatim';
    /** Was belegt ist: die Zeichnung ist die Einzeldarstellung dieser Kapiteldatei (ESZ-136). */
    readonly claim: 'reference-file';
    /** Abschnitt der Referenz, etwa `5.8.8.7`. */
    readonly section: string;
    readonly referenceAsset: string;
    /** Reviewstand der Manifestzeile des Registerbilds, falls vorhanden. */
    readonly review?: ReviewSet;
  }
  | { readonly status: 'derived' };

interface VerbatimFixture {
  readonly fixture: string;
  readonly referenceAsset: string;
}

/**
 * Fixtures, deren Körperhülle das Prüfpaket gegen ihr Original stellt: jedes Rezept und dazu jeder
 * vermessene Ort aus `PLACES` (heute die Leitstelle D.2.5, `leitstelle-d25.test.ts`). Der Ort
 * steht nicht als zweites Rezept in `RECIPES`, weil das Rezeptsystem D.2.5 über das Piktogramm
 * `leadership.control-center` führt; seine Fixture ist der Abschnitt.
 */
function bodyHullFixtures(): readonly [fixture: string, referenceAsset: string, spec: SymbolSpec][] {
  return [
    ...Object.entries(RECIPES).map(
      ([fixture, recipe]) => [fixture, recipe.referenceAsset, recipe.spec] as [string, string, SymbolSpec],
    ),
    ...Object.values(PLACES).flatMap((entry) =>
      entry.source.basis === 'measured'
        ? [[entry.source.section, entry.source.referenceAsset, entry.spec] as [string, string, SymbolSpec]]
        : [],
    ),
  ];
}

let verbatimIndex: ReadonlyMap<string, VerbatimFixture> | undefined;

/**
 * Baut den Index einmal, beim ersten Aufruf: je Fixture mit vergleichbarer Form wird die Spec
 * komponiert und gegen ihren Kennwert gestellt, mit den benannten Vergleichsausnahmen aus
 * `comparison-exceptions.ts`. Nur bestandene Vergleiche kommen in den Index — die Herkunft wird
 * belegt, nicht aus dem Manifest übernommen. Gemessen am 21.09.2026: rund 15 ms für 241 Fälle.
 *
 * Seit LFH-581 ist dieser Index die **Quelle** der generierten Tabelle in core
 * (`verbatimTableSource`) und des Drift-Gates. `combinationProvenance` selbst liest die Tabelle
 * über `symbolProvenance` — der Index darf deshalb nie aus der Tabelle gespeist werden, sonst
 * prüfte das Gate die Abschrift gegen sich selbst.
 */
function index(): ReadonlyMap<string, VerbatimFixture> {
  if (verbatimIndex !== undefined) return verbatimIndex;
  const built = new Map<string, VerbatimFixture>();
  for (const [fixture, referenceAsset, spec] of bodyHullFixtures()) {
    if (referenceLacksComparableShape(referenceAsset)) continue;
    const comparable = comparableFingerprint(fingerprintFor(referenceAsset));
    const result = matchFingerprint(
      composeFromCatalog(spec),
      comparable.fingerprint,
      comparable.options,
    );
    if (!result.ok) continue;
    const key = specKey(spec);
    const existing = built.get(key);
    if (existing !== undefined) {
      // Heute tragen alle Fixtures verschiedene Schlüssel. Käme eine Kollision hinzu, wäre die
      // Fixture nicht eindeutig — das soll auffallen, nicht still die erste gewinnen.
      throw new Error(
        `combinationProvenance: ${existing.fixture} und ${fixture} tragen denselben specKey.`,
      );
    }
    built.set(key, { fixture, referenceAsset });
  }
  verbatimIndex = built;
  return built;
}

/**
 * Fixtures (Rezeptschlüssel und vermessene Orte), deren Körpervergleich besteht, in
 * `RECIPES`-Reihenfolge, die Orte dahinter.
 */
export function verbatimFixtures(): string[] {
  return [...index().values()].map((entry) => entry.fixture);
}

interface ReferenceFileEntry {
  readonly section: string;
  readonly referenceAsset: string;
}

/** Geometrie ohne Rolle und Titel, Zahlen auf 0,001 mm, Schlüssel sortiert. */
function geometry(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(geometry);
  if (typeof value === 'number') return Math.round(value * 1000) / 1000;
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .filter((key) => key !== 'role')
        .sort()
        .map((key) => [key, geometry((value as Record<string, unknown>)[key])]),
    );
  }
  return value;
}

function sameGeometry(a: Drawing, b: Drawing): boolean {
  const shape = (drawing: Drawing) =>
    JSON.stringify(geometry({ viewBox: drawing.viewBox, children: drawing.children }));
  return shape(a) === shape(b);
}

let referenceFileIndexCache: ReadonlyMap<string, ReferenceFileEntry> | undefined;

/**
 * Specs, die genau eine Kapiteldatei des Piktogrammregisters zeichnen (ESZ-136). Kandidaten sind
 * die kanonischen `SymbolSpec`-Ziele von `freestandingRedirect`: die Person mit einem Zustand aus
 * 5.8.8 und die Gefahr mit einem Hinweis (5.8.1.13/14, zweite Darstellung). Aufgenommen wird nur,
 * was der Beleg trägt: Die Zeichnung der Spec hat keine Ableitungsnotiz und gleicht der
 * Einzeldarstellung aus dem Register in Zeichenfläche, Primitiven und Stil, bis auf die Rolle
 * (`body` statt `pictogram`) und auf 0,001 mm. Die Registerbilder sind in ihren Suiten gegen das
 * Kennzahlenartefakt gegatet.
 *
 * Die Leitstelle D.2.5 ist kein Kandidat, der hier besteht: Ihr Ort setzt das Kürzel aus der
 * Grammatik, nicht wie das Register (`freestanding-canon.test.ts` in core). Sie ist eine Fixture
 * mit Körpervergleich (`bodyHullFixtures`).
 *
 * Wie `index()` ist das eine Quelle der generierten Tabelle und wird nie aus ihr gespeist.
 */
function referenceFileIndex(): ReadonlyMap<string, ReferenceFileEntry> {
  if (referenceFileIndexCache !== undefined) return referenceFileIndexCache;
  const built = new Map<string, ReferenceFileEntry>();
  for (const definition of ALL_PICTOGRAMS) {
    const variant = definition.variant === 'primary' ? {} : { variant: definition.variant };
    const spec: FreestandingSpec = definition.id.startsWith('state.')
      ? { kind: 'state', state: definition.id.slice('state.'.length) as StateId, ...variant }
      : { kind: 'pictogram', pictogram: definition.id, ...variant };
    const target = freestandingRedirect(spec);
    if (target === undefined || isFreestandingSpec(target)) continue;
    const drawing = composeFromCatalog(target);
    if (drawing.derivations !== undefined) continue;
    if (!sameGeometry(drawing, pictogramDrawing(definition.id, definition.variant))) continue;
    const key = specKey(target);
    const clash = built.get(key)?.section ?? index().get(key)?.fixture;
    if (clash !== undefined) {
      // Eine Spec hat genau einen Beleg; zwei Quellen für denselben Schlüssel sollen auffallen.
      throw new Error(
        `combinationProvenance: ${clash} und ${definition.section} tragen denselben specKey.`,
      );
    }
    built.set(key, { section: definition.section, referenceAsset: definition.referenceAsset });
  }
  referenceFileIndexCache = built;
  return built;
}

/** Abschnitte der Specs mit `claim: 'reference-file'`, in Registerreihenfolge. */
export function referenceFileSections(): string[] {
  return [...referenceFileIndex().values()].map((entry) => entry.section);
}

/** Rechnet Zeichenketten nach UTF-16-Codeeinheiten, unabhängig von Locale und Laufzeit. */
function byCodeUnit(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Befehl, der `VERBATIM_TABLE_MODULE` in core neu schreibt; steht im Kopf und in der Gate-Meldung. */
export const VERBATIM_TABLE_COMMAND = 'pnpm cli provenance:table';

/** Pfad des generierten Moduls, relativ zur Repository-Wurzel. */
export const VERBATIM_TABLE_MODULE = 'packages/core/src/provenance/verbatim-table.generated.ts';

function tableRows(entries: Iterable<readonly [string, string, string]>): string[] {
  return [...entries]
    .sort(([, a], [, b]) => byCodeUnit(a, b))
    .map((row) => `  ${JSON.stringify(row)},`);
}

/**
 * Quelltext des generierten core-Moduls mit den beiden verbatim-Tabellen (LFH-581, ESZ-136).
 *
 * Quelle sind der Körpervergleich (`index()`) und der Geometrievergleich mit dem Register
 * (`referenceFileIndex()`) dieses Moduls, **nicht** die Tabellen in core — sonst schriebe der
 * Generator sie aus sich selbst ab und das Drift-Gate (`verbatim-table-drift.test.ts`) wäre
 * wirkungslos. Je Zeile ein JSON-Array `[specKey, Fixture bzw. Abschnitt, Referenz]`, nach der
 * Kennung sortiert (Codeeinheiten, nicht `localeCompare`), damit die Datei unabhängig von der
 * Reihenfolge der Quellen und der Locale Byte für Byte gleich bleibt. Die explizite Typangabe hält
 * die Daten aus der `.d.ts` heraus.
 */
export function verbatimTableSource(): string {
  const bodyHull = tableRows(
    [...index().entries()].map(([key, entry]) => [key, entry.fixture, entry.referenceAsset] as const),
  );
  const referenceFile = tableRows(
    [...referenceFileIndex().entries()].map(([key, entry]) => [key, entry.section, entry.referenceAsset] as const),
  );
  return [
    `// Generiert von \`${VERBATIM_TABLE_COMMAND}\` (LFH-581) — nicht von Hand ändern.`,
    '//',
    '// Quelle: `verbatimTableSource()` in `@einsatzzeichen/conformance`, nur Schlüssel und Namen,',
    '// keine Vergleichsdaten.',
    '// `verbatim-table-drift.test.ts` in conformance rechnet die Tabellen neu und verlangt Gleichheit.',
    '',
    '// Körpervergleich jeder Fixture mit ihrem Original, nur bestandene Fälle (`claim: \'body-hull\'`).',
    '// Je Zeile `[specKey, Fixture, Referenzdatei]`.',
    'export const VERBATIM_TABLE: ReadonlyArray<',
    '  readonly [specKey: string, fixture: string, referenceAsset: string]',
    '> = [',
    ...bodyHull,
    '];',
    '',
    '// Specs, die genau eine Kapiteldatei des Piktogrammregisters zeichnen (ESZ-136,',
    '// `claim: \'reference-file\'`). Je Zeile `[specKey, Abschnitt, Referenzdatei]`.',
    'export const REFERENCE_FILE_TABLE: ReadonlyArray<',
    '  readonly [specKey: string, section: string, referenceAsset: string]',
    '> = [',
    ...referenceFile,
    '];',
    '',
  ].join('\n');
}

/**
 * Reviewstand zur Herkunft aus core (LFH-581) — das optionale Zuschalten des fachlichen
 * Prüfstands. Für `verbatim` mit Körpervergleich die Reviews der Manifestzeile mit
 * `implementation: 'recipe.<fixture>'`, falls vorhanden (ein vermessener Ort hat keine); für
 * `verbatim` mit Referenzdatei die Reviews der Manifestzeile des Registerbilds, das die Spec
 * zeichnet (ESZ-136). Für `derived` immer `undefined`: ein abgeleitetes Zeichen behauptet keine
 * fachliche Freigabe, auch nicht geerbt.
 */
export function provenanceReview(provenance: SymbolProvenance): ReviewSet | undefined {
  if (provenance.status !== 'verbatim') return undefined;
  if (provenance.claim === 'reference-file') {
    const sourceId = `bbk-babz-2025:${provenance.section}`;
    return COVERAGE_MANIFEST.entries.find(
      (entry) =>
        entry.coverage === 'element' &&
        entry.sourceId === sourceId &&
        entry.referenceAsset === provenance.referenceAsset,
    )?.review;
  }
  const implementation = `recipe.${provenance.fixture}`;
  return COVERAGE_MANIFEST.entries.find((entry) => entry.implementation === implementation)
    ?.review;
}

/**
 * `verbatim`, wenn der `specKey` gleich dem einer Fixture ist, deren Körpervergleich mit dem
 * Original besteht, oder dem einer Spec, die genau eine Kapiteldatei des Registers zeichnet; sonst
 * `derived`. Siehe die Einschränkung am Typ `CombinationProvenance`.
 *
 * Seit LFH-581 die Herkunft aus core (`symbolProvenance`, generierte Tabellen) plus der
 * Reviewstand aus dem Manifest (`provenanceReview`). Dass die Tabellen den Vergleichen dieses
 * Moduls entsprechen, hält `verbatim-table-drift.test.ts` fest.
 */
export function combinationProvenance(spec: SymbolSpec): CombinationProvenance {
  const provenance = symbolProvenance(spec);
  if (provenance.status !== 'verbatim') return { status: 'derived' };
  const review = provenanceReview(provenance);
  return { ...provenance, ...(review === undefined ? {} : { review }) };
}
