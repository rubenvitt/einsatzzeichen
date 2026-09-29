import { describe, expect, it } from 'vitest';
import { boundsOfMm } from '@einsatzzeichen/core';
import { animalStateDrawing } from '@einsatzzeichen/core/src/geometry/animal-state.js';
import { STATE_PICTOGRAMS } from '@einsatzzeichen/core/src/geometry/pictograms/states/index.js';
import { weatherDrawing } from '@einsatzzeichen/core/src/geometry/weather.js';
import fingerprints from './fingerprints.json' with { type: 'json' };
import { referenceInventoryAssets } from './fingerprint-index.js';
import { ANIMAL_STATE_FIXTURES, WEATHER_EXAMPLE_FIXTURES } from './freestanding-state-fixtures.js';

/**
 * Gate der freistehenden Zeichen aus 5.8.6 und 5.8.7 (LFH-577). Die Wolke der Wetterbeispiele
 * trifft ihre Hülle im Kennzahlenartefakt; die Flocken erfasst das Artefakt nicht, ihre Lage prüft
 * `core/src/geometry/weather.test.ts` an den Zahlen, die an den Dateien abgelesen sind.
 */

interface Fingerprint {
  readonly asset: string;
  readonly viewBox: { readonly width: number; readonly height: number };
  readonly shapes: readonly { readonly kind: string; readonly boundsMm: Record<'minXMm' | 'minYMm' | 'maxXMm' | 'maxYMm', number>; readonly fill?: string }[];
}

const FINGERPRINTS = fingerprints as readonly Fingerprint[];
const PT_PER_MM = 72 / 25.4;
/** Rundung des Extraktors; die Wolke ist aus Bézierbögen auf 0,001 mm gebaut. */
const TOLERANCE_MM = 0.002;

function fingerprintOf(asset: string): Fingerprint {
  const found = FINGERPRINTS.find((candidate) => candidate.asset === asset);
  if (found === undefined) throw new Error(`Kein Eintrag im Kennzahlenartefakt: ${asset}`);
  return found;
}

describe('Wetterbeispiele 5.8.7', () => {
  it('nennen nur Dateien aus dem Referenzinventar, in 32 × 32 mm', () => {
    const inventory = new Set(referenceInventoryAssets());
    for (const fixture of WEATHER_EXAMPLE_FIXTURES) {
      expect(inventory.has(fixture.asset), fixture.asset).toBe(true);
      const { viewBox } = fingerprintOf(fixture.asset);
      expect(viewBox.width / PT_PER_MM).toBeCloseTo(32, 3);
      expect(weatherDrawing(fixture.parameters).viewBox).toEqual({ width: 32, height: 32 });
    }
  });

  it.each(WEATHER_EXAMPLE_FIXTURES.map((fixture) => [fixture.asset, fixture] as const))(
    'trifft mit %s die Hülle der angehobenen Wolke',
    (asset, fixture) => {
      const [cloud] = fingerprintOf(asset).shapes;
      expect(cloud?.fill).toBe('#ffffff');
      const drawn = weatherDrawing(fixture.parameters).children.find((child) => child.type === 'path');
      if (drawn === undefined || cloud === undefined) throw new Error(`${asset}: Wolke fehlt`);
      const bounds = boundsOfMm(drawn);
      expect(Math.abs(bounds.minX - cloud.boundsMm.minXMm), 'minX').toBeLessThan(TOLERANCE_MM);
      expect(Math.abs(bounds.minY - cloud.boundsMm.minYMm), 'minY').toBeLessThan(TOLERANCE_MM);
      expect(Math.abs(bounds.maxX - cloud.boundsMm.maxXMm), 'maxX').toBeLessThan(TOLERANCE_MM);
      expect(Math.abs(bounds.maxY - cloud.boundsMm.maxYMm), 'maxY').toBeLessThan(TOLERANCE_MM);
    },
  );
});

describe('Tierzustände 5.8.6', () => {
  it('zeichnen je Datei das Katalogpiktogramm mit derselben Referenzdatei', () => {
    const inventory = new Set(referenceInventoryAssets());
    for (const fixture of ANIMAL_STATE_FIXTURES) {
      expect(inventory.has(fixture.asset), fixture.asset).toBe(true);
      const definition = STATE_PICTOGRAMS.find((candidate) => candidate.referenceAsset === fixture.asset);
      expect(animalStateDrawing(fixture.parameters).children, fixture.asset).toEqual(definition?.primitives);
    }
  });

  it('führen jede Darstellung aus 5.8.6 genau einmal', () => {
    const catalog = STATE_PICTOGRAMS.filter((definition) => definition.section.startsWith('5.8.6')).map((definition) => definition.referenceAsset);
    expect(ANIMAL_STATE_FIXTURES.map((fixture) => fixture.asset)).toEqual(catalog);
  });
});
