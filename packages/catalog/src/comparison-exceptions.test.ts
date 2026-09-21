import { describe, expect, it } from 'vitest';
import { matchFingerprint } from '@einsatzzeichen/core';
import { BASE_SYMBOLS } from '@einsatzzeichen/core';
import {
  COMPARISON_EXCEPTIONS,
  comparableFingerprint,
  comparisonExceptionFor,
} from './comparison-exceptions.js';
import { fingerprintFor, referenceLacksComparableShape } from './fingerprint-index.js';
import { RECIPES, composeFromCatalog } from './recipes.js';

const recipeEntries = Object.entries(RECIPES);

function drawingOf(subject: 'recipe' | 'base-symbol', key: string) {
  if (subject === 'recipe') {
    const recipe = RECIPES[key as keyof typeof RECIPES];
    return composeFromCatalog(recipe.spec);
  }
  // Die ausgelieferte Geometrie des Katalogeintrags, nicht der Helfer `baseDrawing()` — wie in
  // base-symbols.test.ts: beides deckt sich nur, solange `entry()` intern `baseDrawing()` ruft.
  const [primary] = BASE_SYMBOLS[key as keyof typeof BASE_SYMBOLS].depictions;
  if (primary === undefined) throw new Error(`${key}: BASE_SYMBOLS enthält keine Depiction.`);
  return primary.drawing;
}

describe('COMPARISON_EXCEPTIONS', () => {
  it('führt genau vier benannte Ausnahmen über zehn Fixtures', () => {
    expect(COMPARISON_EXCEPTIONS.map((exception) => [
      exception.id,
      exception.kind,
      exception.decidesOutcome,
      exception.fixtures.map((fixture) => fixture.key),
    ])).toEqual([
      ['d1-cap-covers-ring', 'drop-shape-kind', true,
        ['D.1.2', 'D.1.3', 'D.1.4', 'D.1.5', 'D.1.6', 'D.1.7', 'D.1.8']],
      ['d4-3-star-bounds', 'drop-exact-shapes', true, ['D.4.3']],
      ['i5-3-label-t-outline', 'drop-exact-shapes', false, ['I.5.3']],
      ['1-13-stroke-outline', 'body-geometry', true, ['event']],
    ]);
  });

  it('bindet jede Fixture an die Referenzdatei, die der Bestand für sie führt', () => {
    for (const exception of COMPARISON_EXCEPTIONS) {
      for (const fixture of exception.fixtures) {
        if (exception.subject === 'recipe') {
          expect(RECIPES[fixture.key as keyof typeof RECIPES]?.referenceAsset, fixture.key)
            .toBe(fixture.referenceAsset);
        } else {
          expect(Object.hasOwn(BASE_SYMBOLS, fixture.key), fixture.key).toBe(true);
        }
        // Eine Referenzdatei gehört zu höchstens einer Ausnahme.
        expect(comparisonExceptionFor(fixture.referenceAsset)?.id).toBe(exception.id);
      }
    }
  });

  it('trägt Begründung und Fundort je Ausnahme', () => {
    for (const exception of COMPARISON_EXCEPTIONS) {
      expect(exception.rationale.length, exception.id).toBeGreaterThan(80);
      expect(exception.foundAt, exception.id).toMatch(/packages\//);
    }
  });

  it('Rezepte tragen keine body-geometry-Ausnahme', () => {
    expect(COMPARISON_EXCEPTIONS
      .filter((exception) => exception.subject === 'recipe' && exception.kind === 'body-geometry'))
      .toEqual([]);
  });

  describe('Gate: jede Ausnahme wird gebraucht', () => {
    const cases = COMPARISON_EXCEPTIONS.flatMap((exception) =>
      exception.fixtures.map((fixture) => [
        `${exception.id} / ${fixture.key}`,
        exception,
        fixture,
      ] as const));

    it.each(cases)('%s', (_name, exception, fixture) => {
      const drawing = drawingOf(exception.subject, fixture.key);
      const raw = fingerprintFor(fixture.referenceAsset);
      const comparable = comparableFingerprint(raw);

      expect(matchFingerprint(drawing, comparable.fingerprint, comparable.options))
        .toEqual({ ok: true, problems: [] });

      if (exception.decidesOutcome) {
        // Ohne die Ausnahme scheitert der Vergleich — sonst wäre sie überflüssig.
        expect(matchFingerprint(drawing, raw).ok).toBe(false);
      } else {
        // Ergebnisneutral: der Vergleich besteht auch ohne sie. Gebraucht wird sie, solange die
        // Fremdform im Kennwert steht; `comparableFingerprint` wirft, sobald sie fehlt.
        expect(matchFingerprint(drawing, raw)).toEqual({ ok: true, problems: [] });
        expect(comparable.fingerprint.shapes.length).toBeLessThan(raw.shapes.length);
      }
    });
  });

  it('Gate: keine Ausnahme fehlt — die Rohvergleichsfehler sind genau die ergebnisrelevanten Fixtures', () => {
    const failingRaw = recipeEntries
      .filter(([, recipe]) => !referenceLacksComparableShape(recipe.referenceAsset))
      .filter(([, recipe]) =>
        !matchFingerprint(composeFromCatalog(recipe.spec), fingerprintFor(recipe.referenceAsset)).ok)
      .map(([section]) => section);
    const listed = COMPARISON_EXCEPTIONS
      .filter((exception) => exception.subject === 'recipe' && exception.decidesOutcome)
      .flatMap((exception) => exception.fixtures.map((fixture) => fixture.key));

    expect(failingRaw).toHaveLength(8);
    expect(failingRaw.sort()).toEqual([...listed].sort());
  });

  it('wirft bei veralteter drop-shape-kind-Ausnahme, statt still nichts zu entfernen', () => {
    const d12 = fingerprintFor('D.1.2_Katastrophenschutzleitung im Einsatz.svg');
    expect(() => comparableFingerprint({
      ...d12,
      shapes: d12.shapes.filter((shape) => shape.kind !== 'ring'),
    })).toThrow(/veraltet/);
  });

  it('wirft, wenn die I.5.3-Fremdform nicht mehr exakt der vermessenen entspricht', () => {
    const i53 = fingerprintFor('I.5.3_Taucher.svg');
    expect(() => comparableFingerprint({
      ...i53,
      shapes: i53.shapes.filter((shape) => shape.kind !== 'outline'),
    })).toThrow(/entsprechen nicht exakt/);
  });

  it('lässt Kennwerte ohne Ausnahme unverändert', () => {
    const fingerprint = fingerprintFor(RECIPES['C.1.1'].referenceAsset);
    const comparable = comparableFingerprint(fingerprint);
    expect(comparable.fingerprint).toBe(fingerprint);
    expect(comparable.options).toEqual({});
  });
});
