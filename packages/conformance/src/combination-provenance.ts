import { matchFingerprint, specKey, symbolProvenance } from '@einsatzzeichen/core';
import type { SymbolProvenance } from '@einsatzzeichen/core';
import type { ReviewSet, SymbolSpec } from '@einsatzzeichen/schema';
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
 * oder abgeleitet.
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
  | { readonly status: 'derived' };

interface VerbatimFixture {
  readonly fixture: string;
  readonly referenceAsset: string;
}

let verbatimIndex: ReadonlyMap<string, VerbatimFixture> | undefined;

/**
 * Baut den Index einmal, beim ersten Aufruf: je Rezept mit vergleichbarer Form wird die Spec
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
  for (const [fixture, recipe] of Object.entries(RECIPES)) {
    if (referenceLacksComparableShape(recipe.referenceAsset)) continue;
    const comparable = comparableFingerprint(fingerprintFor(recipe.referenceAsset));
    const result = matchFingerprint(
      composeFromCatalog(recipe.spec),
      comparable.fingerprint,
      comparable.options,
    );
    if (!result.ok) continue;
    const key = specKey(recipe.spec);
    const existing = built.get(key);
    if (existing !== undefined) {
      // Heute tragen alle 279 Rezepte verschiedene Schlüssel. Käme eine Kollision hinzu, wäre die
      // Fixture nicht eindeutig — das soll auffallen, nicht still die erste gewinnen.
      throw new Error(
        `combinationProvenance: ${existing.fixture} und ${fixture} tragen denselben specKey.`,
      );
    }
    built.set(key, { fixture, referenceAsset: recipe.referenceAsset });
  }
  verbatimIndex = built;
  return built;
}

/** Rezeptschlüssel aller Fixtures, deren Körpervergleich besteht, in `RECIPES`-Reihenfolge. */
export function verbatimFixtures(): string[] {
  return [...index().values()].map((entry) => entry.fixture);
}

/** Rechnet Zeichenketten nach UTF-16-Codeeinheiten, unabhängig von Locale und Laufzeit. */
function byCodeUnit(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Befehl, der `VERBATIM_TABLE_MODULE` in core neu schreibt; steht im Kopf und in der Gate-Meldung. */
export const VERBATIM_TABLE_COMMAND = 'pnpm cli provenance:table';

/** Pfad des generierten Moduls, relativ zur Repository-Wurzel. */
export const VERBATIM_TABLE_MODULE = 'packages/core/src/provenance/verbatim-table.generated.ts';

/**
 * Quelltext des generierten core-Moduls mit der verbatim-Tabelle (LFH-581).
 *
 * Quelle ist der Körpervergleich dieses Moduls (`index()`), **nicht** die Tabelle in core —
 * sonst schriebe der Generator die Tabelle aus sich selbst ab und das Drift-Gate
 * (`verbatim-table-drift.test.ts`) wäre wirkungslos. Je Zeile ein JSON-Array
 * `[specKey, Fixture, Referenz]`, nach Fixture sortiert (Codeeinheiten, nicht `localeCompare`),
 * damit die Datei unabhängig von der Rezeptreihenfolge und der Locale Byte für Byte gleich bleibt.
 * Die explizite Typangabe hält die Daten aus der `.d.ts` heraus.
 */
export function verbatimTableSource(): string {
  const rows = [...index().entries()]
    .sort(([, a], [, b]) => byCodeUnit(a.fixture, b.fixture))
    .map(([key, entry]) => `  ${JSON.stringify([key, entry.fixture, entry.referenceAsset])},`);
  return [
    `// Generiert von \`${VERBATIM_TABLE_COMMAND}\` (LFH-581) — nicht von Hand ändern.`,
    '//',
    '// Quelle: `verbatimTableSource()` in `@einsatzzeichen/conformance` — der Körpervergleich jeder',
    '// Fixture mit ihrem Original, nur bestandene Fälle. Je Zeile `[specKey, Fixture, Referenzdatei]`,',
    '// nur Schlüssel und Namen, keine Vergleichsdaten.',
    '// `verbatim-table-drift.test.ts` in conformance rechnet die Tabelle neu und verlangt Gleichheit.',
    'export const VERBATIM_TABLE: ReadonlyArray<',
    '  readonly [specKey: string, fixture: string, referenceAsset: string]',
    '> = [',
    ...rows,
    '];',
    '',
  ].join('\n');
}

/**
 * Reviewstand zur Herkunft aus core (LFH-581) — das optionale Zuschalten des fachlichen
 * Prüfstands. Für `verbatim` die Reviews der Manifestzeile mit `implementation: 'recipe.<fixture>'`,
 * falls vorhanden; für `derived` immer `undefined`: ein abgeleitetes Zeichen behauptet keine
 * fachliche Freigabe, auch nicht geerbt.
 */
export function provenanceReview(provenance: SymbolProvenance): ReviewSet | undefined {
  if (provenance.status !== 'verbatim') return undefined;
  const implementation = `recipe.${provenance.fixture}`;
  return COVERAGE_MANIFEST.entries.find((entry) => entry.implementation === implementation)
    ?.review;
}

/**
 * `verbatim`, wenn der `specKey` gleich dem einer Fixture ist, deren Körpervergleich mit dem
 * Original besteht; sonst `derived`. Siehe die Einschränkung am Typ `CombinationProvenance`.
 *
 * Seit LFH-581 die Herkunft aus core (`symbolProvenance`, generierte Tabelle) plus der
 * Reviewstand aus dem Manifest (`provenanceReview`). Dass die Tabelle dem Körpervergleich dieses
 * Moduls entspricht, hält `verbatim-table-drift.test.ts` fest.
 */
export function combinationProvenance(spec: SymbolSpec): CombinationProvenance {
  const provenance = symbolProvenance(spec);
  if (provenance.status !== 'verbatim') return { status: 'derived' };
  const review = provenanceReview(provenance);
  return {
    status: 'verbatim',
    claim: 'body-hull',
    fixture: provenance.fixture,
    referenceAsset: provenance.referenceAsset,
    ...(review === undefined ? {} : { review }),
  };
}
