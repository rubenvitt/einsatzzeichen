import { describe, expect, it } from 'vitest';
import {
  FREESTANDING_DEFAULT_CANVAS_MM,
  animalStateDrawing,
  drawFreestanding,
  lineDrawing,
  movementDrawing,
  parseAnySpec,
  pictogram,
  serializeAnySpec,
  validateFreestandingSpec,
  weatherDrawing,
} from '@einsatzzeichen/core';
import type { Drawing } from '@einsatzzeichen/schema';
import { ANIMAL_STATE_FIXTURES, WEATHER_EXAMPLE_FIXTURES } from './freestanding-state-fixtures.js';
import {
  FREESTANDING_SPEC_FIXTURES,
  PICTOGRAM_SPEC_FIXTURES,
  STATE_SPEC_FIXTURES,
} from './freestanding-spec-fixtures.js';
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
  // Zustand freistehend (LFH-798): die Einzeldarstellung aus dem Piktogrammregister. Deren Gates
  // stellen sie gegen das Kennzahlenartefakt (`pictograms/state-inventory.test.ts`).
  const state = STATE_SPEC_FIXTURES.find((fixture) => fixture.asset === asset);
  if (state !== undefined && state.spec.kind === 'state') {
    const definition = pictogram(`state.${state.spec.state}`, state.spec.variant ?? 'primary');
    return { viewBox: definition.viewBox, children: definition.primitives };
  }
  const single = PICTOGRAM_SPEC_FIXTURES.find((fixture) => fixture.asset === asset);
  if (single !== undefined && single.spec.kind === 'pictogram') {
    const definition = pictogram(single.spec.pictogram, single.spec.variant ?? 'primary');
    return { viewBox: definition.viewBox, children: definition.primitives };
  }
  throw new Error(`Keine Fixture für ${asset}`);
}

describe('Freistehende Zeichen über die Spec', () => {
  it('führt jede Referenz der freistehenden Fixtures genau einmal, in ihrer Reihenfolge', () => {
    expect(FREESTANDING_SPEC_FIXTURES.map((fixture) => fixture.asset)).toEqual([
      ...PARAMETRIC_FIXTURES.map((fixture) => fixture.asset),
      ...WEATHER_EXAMPLE_FIXTURES.map((fixture) => fixture.asset),
      ...ANIMAL_STATE_FIXTURES.map((fixture) => fixture.asset),
      ...STATE_SPEC_FIXTURES.map((fixture) => fixture.asset),
      ...PICTOGRAM_SPEC_FIXTURES.map((fixture) => fixture.asset),
    ]);
  });

  it('führt jede Kapiteldatei der übrigen Piktogrammräume als Piktogramm (LFH-834)', () => {
    // 202 Darstellungen außerhalb von 5.8, ohne die Leitstelle D.2.5: die zeichnet ihr Ort.
    expect(PICTOGRAM_SPEC_FIXTURES).toHaveLength(201);
    const perSpace = new Map<string, number>();
    for (const { spec } of PICTOGRAM_SPEC_FIXTURES) {
      if (spec.kind !== 'pictogram') throw new Error('nur Piktogramme erwartet');
      const space = spec.pictogram.slice(0, spec.pictogram.indexOf('.'));
      perSpace.set(space, (perSpace.get(space) ?? 0) + 1);
    }
    expect(Object.fromEntries(perSpace)).toEqual({
      capability: 92,
      comms: 53,
      damage: 28,
      wildfire: 14,
      leadership: 9,
      'water-rescue-personnel': 5,
    });
    expect(PICTOGRAM_SPEC_FIXTURES.map(({ asset }) => asset)).not.toContain('D.2.5_Leitstelle.svg');
  });

  it('führt jede zulässige Kapiteldatei aus 5.8.1 bis 5.8.5 und 5.8.9 als Zustand (LFH-798)', () => {
    // 31 Werte, dazu die zweiten Darstellungen von 5.8.1.7 und 5.8.1.8. Die Hinweise 5.8.1.13/14
    // stehen mit ihrer ersten Darstellung hier; die zweite zeigt sie an der Gefahr und gehört
    // deshalb zu `{ kind: 'hazard', states }`.
    expect(STATE_SPEC_FIXTURES).toHaveLength(33);
    const sections = new Set(STATE_SPEC_FIXTURES.map(({ asset }) => asset.split('_')[0]!.split('.').slice(0, 3).join('.')));
    expect([...sections]).toEqual(['5.8.1', '5.8.2', '5.8.3', '5.8.4', '5.8.5', '5.8.9']);
    expect(STATE_SPEC_FIXTURES.map(({ asset }) => asset)).not.toContain('5.8.1.13_Hinweis auf Vermutung_2.svg');
    expect(STATE_SPEC_FIXTURES.map(({ asset }) => asset)).toContain('5.8.1.7_Gefährliche Stoffe_Chlor.svg');
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
