import { describe, expect, it } from 'vitest';
import {
  FREESTANDING_DEFAULT_CANVAS_MM,
  animalStateDrawing,
  drawFreestanding,
  lineDrawing,
  movementDrawing,
  parseAnySpec,
  serializeAnySpec,
  validateFreestandingSpec,
  weatherDrawing,
} from '@einsatzzeichen/core';
import type { Drawing } from '@einsatzzeichen/schema';
import { ANIMAL_STATE_FIXTURES, WEATHER_EXAMPLE_FIXTURES } from './freestanding-state-fixtures.js';
import { FREESTANDING_SPEC_FIXTURES } from './freestanding-spec-fixtures.js';
import { PARAMETRIC_FIXTURES } from './parametric-fixtures.js';

/**
 * Die Referenzen der freistehenden Zeichen über die Spec (LFH-577): jede Datei aus
 * `PARAMETRIC_FIXTURES` und `freestanding-state-fixtures.ts` als `FreestandingSpec`, gezeichnet über
 * `drawFreestanding`. Die Zeichnung muss dieselbe sein wie über die Zeichenfunktion, die die
 * bisherigen Gates gegen das Kennzahlenartefakt prüfen — damit gelten deren Hüllen auch für den
 * Weg über die Spec.
 */

function directDrawing(asset: string): Drawing {
  const parametric = PARAMETRIC_FIXTURES.find((fixture) => fixture.asset === asset);
  if (parametric !== undefined) {
    return parametric.category === 'arrow'
      ? movementDrawing(parametric.valueId, { path: parametric.path }, parametric.canvasMm)
      : lineDrawing(
          parametric.valueId,
          {
            path: parametric.path,
            ...(parametric.strength === undefined ? {} : { strength: parametric.strength }),
            ...(parametric.variant === undefined ? {} : { variant: parametric.variant }),
          },
          parametric.canvasMm,
        );
  }
  const weather = WEATHER_EXAMPLE_FIXTURES.find((fixture) => fixture.asset === asset);
  if (weather !== undefined) return weatherDrawing(weather.parameters);
  const animal = ANIMAL_STATE_FIXTURES.find((fixture) => fixture.asset === asset);
  if (animal !== undefined) return animalStateDrawing(animal.parameters);
  throw new Error(`Keine Fixture für ${asset}`);
}

describe('Freistehende Zeichen über die Spec', () => {
  it('führt jede Referenz der freistehenden Fixtures genau einmal, in ihrer Reihenfolge', () => {
    expect(FREESTANDING_SPEC_FIXTURES.map((fixture) => fixture.asset)).toEqual([
      ...PARAMETRIC_FIXTURES.map((fixture) => fixture.asset),
      ...WEATHER_EXAMPLE_FIXTURES.map((fixture) => fixture.asset),
      ...ANIMAL_STATE_FIXTURES.map((fixture) => fixture.asset),
    ]);
  });

  it('kommt ohne eigene Zeichenfläche aus: die Vorgabe ist die Fläche der Referenz', () => {
    for (const fixture of PARAMETRIC_FIXTURES) {
      const expected = fixture.category === 'arrow' ? FREESTANDING_DEFAULT_CANVAS_MM.movement : FREESTANDING_DEFAULT_CANVAS_MM.line;
      expect(fixture.canvasMm, fixture.asset).toEqual(expected);
    }
    for (const { spec } of FREESTANDING_SPEC_FIXTURES) expect('canvasMm' in spec).toBe(false);
  });

  it.each(FREESTANDING_SPEC_FIXTURES.map((fixture) => [fixture.asset, fixture] as const))(
    '%s: drawFreestanding zeichnet wie die Zeichenfunktion',
    (asset, fixture) => {
      expect(validateFreestandingSpec(fixture.spec)).toEqual([]);
      const drawn = drawFreestanding(fixture.spec);
      const direct = directDrawing(asset);
      expect(drawn.viewBox).toEqual(direct.viewBox);
      expect(drawn.children).toEqual(direct.children);
      expect(drawn.description?.trim()).not.toBe('');
    },
  );

  it('übersteht die Rundreise über den Codec für jede Referenz', () => {
    for (const { asset, spec } of FREESTANDING_SPEC_FIXTURES) {
      expect(drawFreestanding(parseAnySpec(serializeAnySpec(spec)) as typeof spec).children, asset).toEqual(
        drawFreestanding(spec).children,
      );
    }
  });
});
