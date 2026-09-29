import { describe, expect, it } from 'vitest';
import { STATE_GROUPS } from '@einsatzzeichen/core';
import fingerprints from './fingerprints.json' with { type: 'json' };
import { INVENTORY_EXCLUSIONS } from './reference-inventory.js';
import {
  PERSON_STATE_FRAMES,
  STATE_HINT_LAYOUTS,
} from '@einsatzzeichen/core/src/layout/state-placement.js';
import { STATE_CARRIER_EVIDENCE, STATE_GROUP_FIXTURES } from './state-group-fixtures.js';

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
      const here = [...STATE_GROUP_FIXTURES, ...STATE_CARRIER_EVIDENCE]
        .filter((fixture) => fixture.group === group.id)
        .map((fixture) => fixture.asset);
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

/**
 * Referenzdateien außerhalb der Beispiele, die einen Zustand an einem Träger zeigen (Durchsicht aller
 * 661 Dateien am 29. September 2026). Das Artefakt erfasst je Datei die Fläche, die den Beleg trägt;
 * sie wird hier gegen die Zahl der Fixture und gegen die Platzierung in `core` gehalten.
 */
describe('Trägerbelege der Zustandsgruppen gegen das Kennzahlenartefakt', () => {
  function shapeOf(asset: string, kind: string, fill: string | undefined): Shape {
    const found = fingerprintOf(asset).shapes.find(
      (shape) => shape.kind === kind && shape.fill === fill,
    );
    expect(found, `${asset}: keine Fläche ${kind}/${fill ?? '-'}`).toBeDefined();
    return found as Shape;
  }

  it('findet jede Fläche mit der angegebenen Hülle im Artefakt', () => {
    for (const evidence of STATE_CARRIER_EVIDENCE) {
      const shape = shapeOf(evidence.asset, evidence.shape.kind, evidence.shape.fill);
      expect(asZoneBounds(shape.boundsMm), evidence.asset).toEqual(evidence.shape.boundsMm);
      if (evidence.shape.rotate !== undefined) expect(shape.rotate, evidence.asset).toBe(evidence.shape.rotate);
    }
  });

  it('hält die Hinweislage an der Gefahr an der Platzierung in core fest', () => {
    for (const asset of ['5.8.1.13_Hinweis auf Vermutung_2.svg', '5.8.1.14_Hinweis auf akute Situation_2.svg']) {
      const evidence = STATE_CARRIER_EVIDENCE.find((item) => item.asset === asset);
      expect(evidence?.shape.boundsMm, asset).toEqual(STATE_HINT_LAYOUTS.hazard.carrierHullMm);
    }
    const example = STATE_GROUP_FIXTURES.find((item) => item.asset === '5.8.1_Beispiel 3.svg');
    expect(example?.carrierHullMm).toEqual(STATE_HINT_LAYOUTS.person.carrierHullMm);
    expect(example?.canvasMm).toEqual(STATE_HINT_LAYOUTS.person.canvasMm);
  });

  it('zeigt an M.6 das unverkleinerte Dreieck der Gefahr 1.11', () => {
    const gefahr = shapeOf('1.11_Gefahr.svg', 'bounds', WHITE);
    const m6 = STATE_CARRIER_EVIDENCE.find((item) => item.asset === 'M.6_Akute Gefahr_Spotfeuer.svg');
    expect(m6?.shape.boundsMm).toEqual(asZoneBounds(gefahr.boundsMm));
  });

  it('hält die drei Rautenlagen aus 5.8.8 an der Platzierung in core fest', () => {
    const byAsset = (asset: string) =>
      STATE_CARRIER_EVIDENCE.find((item) => item.asset === asset)?.shape.boundsMm;
    expect(byAsset('5.8.8.3_Person Verletzt.svg')).toEqual(PERSON_STATE_FRAMES['person-diamond-26mm'].hullMm);
    expect(byAsset('5.8.8.9_Person in Wassergefahr.svg')).toEqual(
      PERSON_STATE_FRAMES['person-diamond-21mm-lowered-4-5mm'].hullMm,
    );
    // 5.8.8.12: das Artefakt erfasst nur den Umriss samt Pfeil. Die Raute um (16 | 14) reicht mit
    // halbem Strich von 0,647 bis 27,353; darunter hängt der Pfeil bis 31,177.
    const raised = PERSON_STATE_FRAMES['person-diamond-26mm-raised-2mm'].hullMm;
    const outline = byAsset('5.8.8.12_Person zu transportieren.svg');
    expect(outline?.minY).toBeCloseTo(raised.minY - 0.5 / Math.SQRT2, 2);
  });

  it('zeigt an L.9 die Diagonalen von 5.8.4.2 unverändert und an L.8 das Kreuz von 5.8.4.1 verkleinert', () => {
    const l9 = STATE_CARRIER_EVIDENCE.find((item) => item.asset === 'L.9_Deichbruch.svg');
    expect(l9?.shape.boundsMm).toEqual(asZoneBounds(shapeOf('5.8.4.2_Teilzerstört.svg', 'outline', undefined).boundsMm));
    const l8 = STATE_CARRIER_EVIDENCE.find((item) => item.asset === 'L.8_Schäden am Außendeich.svg');
    const cross = shapeOf('5.8.4.1_Angeschlagen.svg', 'bounds', '#fa1919').boundsMm;
    const hull = l8?.shape.boundsMm;
    expect(hull).toBeDefined();
    if (hull === undefined) return;
    expect((hull.maxX - hull.minX) / (cross.maxXMm - cross.minXMm)).toBeCloseTo(0.4717, 3);
    expect((hull.minX + hull.maxX) / 2).toBeCloseTo(13.5, 2);
    expect((hull.minY + hull.maxY) / 2).toBeCloseTo(16, 2);
  });
});
