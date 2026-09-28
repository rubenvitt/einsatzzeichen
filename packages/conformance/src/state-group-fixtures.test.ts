import { describe, expect, it } from 'vitest';
import { STATE_GROUPS } from '@einsatzzeichen/core';
import fingerprints from './fingerprints.json' with { type: 'json' };
import { INVENTORY_EXCLUSIONS } from './reference-inventory.js';
import { STATE_GROUP_FIXTURES } from './state-group-fixtures.js';

/**
 * Gate der Kapitel-5.8-Fixtures (LFH-565): jede Zahl aus `STATE_GROUP_FIXTURES` gegen das
 * eingecheckte Kennzahlenartefakt, und die Fixtures gegen `STATE_GROUPS` in `core` und gegen das
 * Referenzinventar.
 */

interface Bounds {
  readonly minXMm: number;
  readonly minYMm: number;
  readonly maxXMm: number;
  readonly maxYMm: number;
}

interface Shape {
  readonly kind: string;
  readonly boundsMm: Bounds;
  readonly fill?: string;
  readonly rotate?: number;
}

interface Fingerprint {
  readonly asset: string;
  readonly viewBox?: { readonly width: number; readonly height: number };
  readonly shapes: readonly Shape[];
}

const FINGERPRINTS = fingerprints as readonly Fingerprint[];

/** Die Referenz misst in Punkt: 1 mm = 72 / 25,4 pt. */
const PT_PER_MM = 72 / 25.4;
const WHITE = '#ffffff';

function fingerprintOf(asset: string): Fingerprint {
  const found = FINGERPRINTS.find((candidate) => candidate.asset === asset);
  if (found === undefined) throw new Error(`Kein Eintrag im Kennzahlenartefakt: ${asset}`);
  return found;
}

/** Die gefüllten weißen Flächen: das ist, was das Artefakt vom Träger erfasst. */
function whiteShapes(fingerprint: Fingerprint): readonly Shape[] {
  return fingerprint.shapes.filter((shape) => shape.fill === WHITE);
}

function asZoneBounds(bounds: Bounds) {
  return { minX: bounds.minXMm, minY: bounds.minYMm, maxX: bounds.maxXMm, maxY: bounds.maxYMm };
}

describe('Fixtures der Zustandsgruppen gegen das Kennzahlenartefakt', () => {
  it('führt genau die sieben Beispiele, die D.2 an diese Aufgabe verwiesen hat', () => {
    const examples = INVENTORY_EXCLUSIONS.filter(
      (exclusion) =>
        exclusion.disposition === 'example' &&
        exclusion.decidedIn === 'docs/decisions/2026-08-07-kapitel-5-8-zustaende-d2.md',
    ).map((exclusion) => exclusion.asset);
    expect(STATE_GROUP_FIXTURES.map((fixture) => fixture.asset).sort()).toEqual([...examples].sort());
    expect(examples).toHaveLength(7);
  });

  it('stimmt mit den Fixtures jeder Gruppe in core überein', () => {
    for (const group of STATE_GROUPS) {
      const here = STATE_GROUP_FIXTURES.filter((fixture) => fixture.group === group.id).map(
        (fixture) => fixture.asset,
      );
      expect(here, group.id).toEqual([...group.fixtures]);
    }
  });

  it('liest die Zeichenfläche am Artefakt ab', () => {
    for (const fixture of STATE_GROUP_FIXTURES) {
      const viewBox = fingerprintOf(fixture.asset).viewBox;
      expect(viewBox, fixture.asset).toBeDefined();
      expect((viewBox?.width ?? 0) / PT_PER_MM, fixture.asset).toBeCloseTo(fixture.canvasMm.width, 2);
      expect((viewBox?.height ?? 0) / PT_PER_MM, fixture.asset).toBeCloseTo(fixture.canvasMm.height, 2);
    }
  });

  it('liest den Träger als einzige weiße Fläche mit der angegebenen Hülle ab', () => {
    for (const fixture of STATE_GROUP_FIXTURES) {
      const [carrier, ...others] = whiteShapes(fingerprintOf(fixture.asset));
      expect(others, fixture.asset).toEqual([]);
      expect(carrier, fixture.asset).toBeDefined();
      if (carrier === undefined) continue;
      expect(asZoneBounds(carrier.boundsMm), fixture.asset).toEqual(fixture.carrierHullMm);
      if (fixture.carrierShape === 'rotated-square') {
        expect(carrier.kind, fixture.asset).toBe('rect');
        expect(carrier.rotate, fixture.asset).toBe(45);
        const width = carrier.boundsMm.maxXMm - carrier.boundsMm.minXMm;
        const height = carrier.boundsMm.maxYMm - carrier.boundsMm.minYMm;
        expect(width, fixture.asset).toBe(height);
      } else {
        expect(carrier.kind, fixture.asset).toBe('bounds');
      }
    }
  });

  it('zeigt an 5.8.1 den Träger als 20-mm-Raute, senkrecht mittig auf der verbreiterten Fläche', () => {
    for (const fixture of STATE_GROUP_FIXTURES.filter((item) => item.group === 'tactics-hazards')) {
      const hull = fixture.carrierHullMm;
      expect(hull.maxX - hull.minX, fixture.asset).toBe(20);
      expect((hull.minY + hull.maxY) / 2, fixture.asset).toBe(fixture.canvasMm.height / 2);
      expect(fixture.canvasMm.width, fixture.asset).toBeGreaterThan(32);
    }
  });

  it('zeigt an 5.8.7 die Wolke aus 5.8.7.2, gleich breit und gleich hoch, um 3 mm angehoben', () => {
    for (const fixture of STATE_GROUP_FIXTURES.filter((item) => item.group === 'weather')) {
      expect(fixture.comparedWith, fixture.asset).toBe('5.8.7.2_Wolkig.svg');
      const [cloud] = whiteShapes(fingerprintOf(fixture.comparedWith ?? ''));
      expect(cloud, fixture.asset).toBeDefined();
      if (cloud === undefined) continue;
      const hull = fixture.carrierHullMm;
      expect(hull.minX, fixture.asset).toBeCloseTo(cloud.boundsMm.minXMm, 2);
      expect(hull.maxX, fixture.asset).toBeCloseTo(cloud.boundsMm.maxXMm, 2);
      expect(hull.maxY - hull.minY, fixture.asset).toBeCloseTo(
        cloud.boundsMm.maxYMm - cloud.boundsMm.minYMm,
        2,
      );
      expect(cloud.boundsMm.minYMm - hull.minY, fixture.asset).toBeCloseTo(3, 2);
    }
  });
});
