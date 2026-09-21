import { matchFingerprint, specKey } from '@einsatzzeichen/core';
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
      // Heute tragen alle 242 Rezepte verschiedene Schlüssel. Käme eine Kollision hinzu, wäre die
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

function reviewForFixture(fixture: string): ReviewSet | undefined {
  const implementation = `recipe.${fixture}`;
  return COVERAGE_MANIFEST.entries.find((entry) => entry.implementation === implementation)
    ?.review;
}

/**
 * `verbatim`, wenn der `specKey` gleich dem einer Fixture ist, deren Körpervergleich mit dem
 * Original besteht; sonst `derived`. Siehe die Einschränkung am Typ `CombinationProvenance`.
 */
export function combinationProvenance(spec: SymbolSpec): CombinationProvenance {
  const found = index().get(specKey(spec));
  if (found === undefined) return { status: 'derived' };
  const review = reviewForFixture(found.fixture);
  return {
    status: 'verbatim',
    claim: 'body-hull',
    fixture: found.fixture,
    referenceAsset: found.referenceAsset,
    ...(review === undefined ? {} : { review }),
  };
}
