import { describe, expect, it } from 'vitest';
import {
  ARIMO_CAP_HEIGHT_FRACTION,
  NotMeasuredError,
  PARAMETRIC_BLOCKS,
  blockEntry,
  boundsOfMm,
  lineDrawing,
  movementDrawing,
  strokeBoundsOfMm,
  type BoundsMm,
} from '@einsatzzeichen/core';
import type { Drawing, LineId, MovementId, Primitive } from '@einsatzzeichen/schema';
import fingerprints from './fingerprints.json' with { type: 'json' };
import { referenceInventoryAssets } from './fingerprint-index.js';
import { PARAMETRIC_FIXTURES, type ParametricFixture } from './parametric-fixtures.js';

/**
 * Gate der parametrisierten Bausteine gegen das Kennzahlenartefakt (LFH-566): mit dem Verlauf der
 * Referenz als Parameter trifft die Zeichnung jede Hülle, die das Artefakt führt, auf die dritte
 * Nachkommastelle. Die Toleranz ist die Rundung des Extraktors.
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
}

interface Fingerprint {
  readonly asset: string;
  readonly viewBox: { readonly width: number; readonly height: number };
  readonly shapes: readonly Shape[];
  readonly curvedPaths: number;
}

const FINGERPRINTS = fingerprints as readonly Fingerprint[];

/** Die Referenz misst in Punkt: 1 mm = 72 / 25,4 pt. */
const PT_PER_MM = 72 / 25.4;
/** Rundung des Extraktors auf drei Millimeterstellen. */
const TOLERANCE_MM = 0.0006;

function fingerprintOf(asset: string): Fingerprint {
  const found = FINGERPRINTS.find((candidate) => candidate.asset === asset);
  if (found === undefined) throw new Error(`Kein Eintrag im Kennzahlenartefakt: ${asset}`);
  return found;
}

function drawFixture(fixture: ParametricFixture): Drawing {
  return fixture.category === 'arrow'
    ? movementDrawing(fixture.valueId, { path: fixture.path }, fixture.canvasMm)
    : lineDrawing(
        fixture.valueId,
        fixture.strength === undefined ? { path: fixture.path } : { path: fixture.path, strength: fixture.strength },
        fixture.canvasMm,
      );
}

function hullOf(primitives: readonly Primitive[]): BoundsMm {
  const all = primitives.map((primitive) =>
    primitive.type === 'polyline' ? strokeBoundsOfMm(primitive) : boundsOfMm(primitive),
  );
  return {
    minX: Math.min(...all.map((b) => b.minX)),
    minY: Math.min(...all.map((b) => b.minY)),
    maxX: Math.max(...all.map((b) => b.maxX)),
    maxY: Math.max(...all.map((b) => b.maxY)),
  };
}

function expectBounds(actual: BoundsMm, expected: Bounds, label: string): void {
  expect(Math.abs(actual.minX - expected.minXMm), `${label} minX`).toBeLessThan(TOLERANCE_MM);
  expect(Math.abs(actual.minY - expected.minYMm), `${label} minY`).toBeLessThan(TOLERANCE_MM);
  expect(Math.abs(actual.maxX - expected.maxXMm), `${label} maxX`).toBeLessThan(TOLERANCE_MM);
  expect(Math.abs(actual.maxY - expected.maxYMm), `${label} maxY`).toBeLessThan(TOLERANCE_MM);
}

describe('Fixtures der parametrisierten Bausteine', () => {
  it('führt je Baustein mit Zeichnung genau seine Primärdarstellung als Fixture', () => {
    const measured = PARAMETRIC_BLOCKS.filter((entry) => blockEntry(entry.id)?.binding.status === 'measured');
    expect(PARAMETRIC_FIXTURES.map((fixture) => fixture.asset)).toEqual(measured.map((entry) => entry.assets[0]));
    for (const fixture of PARAMETRIC_FIXTURES) {
      const entry = PARAMETRIC_BLOCKS.find((candidate) => candidate.assets[0] === fixture.asset);
      expect(entry?.id, fixture.asset).toBe(`${fixture.category}/${fixture.valueId}`);
    }
  });

  it('nennt nur Dateien, die im Referenzinventar stehen', () => {
    const inventory = new Set(referenceInventoryAssets());
    for (const entry of PARAMETRIC_BLOCKS) {
      for (const asset of entry.assets) expect(inventory.has(asset), asset).toBe(true);
    }
  });

  it('trifft die Zeichenfläche der Referenz', () => {
    for (const fixture of PARAMETRIC_FIXTURES) {
      const { viewBox } = fingerprintOf(fixture.asset);
      expect(viewBox.width / PT_PER_MM, fixture.asset).toBeCloseTo(fixture.canvasMm.width, 3);
      expect(viewBox.height / PT_PER_MM, fixture.asset).toBeCloseTo(fixture.canvasMm.height, 3);
      expect(drawFixture(fixture).viewBox).toEqual(fixture.canvasMm);
    }
  });
});

describe('Pfeile aus 5.2 gegen das Kennzahlenartefakt', () => {
  const arrows = PARAMETRIC_FIXTURES.filter((fixture) => fixture.category === 'arrow');

  it.each(arrows.map((fixture) => [fixture.asset, fixture] as const))(
    'trifft die Hülle des umgewandelten Strichs von %s',
    (asset, fixture) => {
      const shapes = fingerprintOf(asset).shapes;
      expect(shapes.map((shape) => shape.kind)).toEqual(['bounds']);
      expectBounds(hullOf(drawFixture(fixture).children), (shapes[0] as Shape).boundsMm, asset);
    },
  );
});

describe('Grenzen aus Kapitel 2 gegen das Kennzahlenartefakt', () => {
  const lines = PARAMETRIC_FIXTURES.filter((fixture) => fixture.category === 'line');

  it.each(lines.map((fixture) => [fixture.asset, fixture] as const))(
    'trifft Striche und Marken von %s',
    (asset, fixture) => {
      const shapes = fingerprintOf(asset).shapes;
      const children = drawFixture(fixture).children;
      const dashes = children.filter((child) => child.type === 'polyline');
      const rects = shapes.filter((shape) => shape.kind === 'rect');
      expect(dashes).toHaveLength(rects.length);
      dashes.forEach((dash, i) => expectBounds(strokeBoundsOfMm(dash), (rects[i] as Shape).boundsMm, `${asset} Strich ${i}`));

      const marks = children.filter((child) => child.type === 'circle');
      const circles = shapes.filter((shape) => shape.kind === 'circle');
      expect(marks).toHaveLength(circles.length);
      marks.forEach((mark, i) => expectBounds(boundsOfMm(mark), (circles[i] as Shape).boundsMm, `${asset} Marke ${i}`));
    },
  );

  it.each(lines.filter((fixture) => fixture.valueId !== 'boundary-with-strength').map((fixture) => [fixture.asset, fixture] as const))(
    'setzt die Beschriftung von %s auf Grundlinie und Versalhöhe der Glyphen',
    (asset, fixture) => {
      const glyphs = fingerprintOf(asset).shapes.filter((shape) => shape.kind === 'outline');
      expect(glyphs.length, asset).toBeGreaterThan(0);
      const label = drawFixture(fixture).children.find((child) => child.type === 'text');
      if (label?.type !== 'text') throw new Error(`${asset}: keine Beschriftung`);
      for (const glyph of glyphs) {
        expect(Math.abs(label.y - glyph.boundsMm.maxYMm), `${asset} Grundlinie`).toBeLessThan(TOLERANCE_MM);
        const capTop = label.y - label.sizeMm * ARIMO_CAP_HEIGHT_FRACTION;
        expect(Math.abs(capTop - glyph.boundsMm.minYMm), `${asset} Versalhöhe`).toBeLessThan(0.0015);
      }
      // Waagerecht mittig in der Lücke. Belegt an 2.17, dessen drei Glyphen alle erfasst sind.
      if (fixture.valueId === 'boundary-command-area') {
        const inkCenter = (Math.min(...glyphs.map((g) => g.boundsMm.minXMm)) + Math.max(...glyphs.map((g) => g.boundsMm.maxXMm))) / 2;
        expect(Math.abs(label.x - inkCenter)).toBeLessThan(0.01);
      }
    },
  );

  it('liest 2.19 als drei Glyphen: E und A wie in 2.18, davor ein Kurvenpfad', () => {
    const width = (asset: string) =>
      fingerprintOf(asset).shapes.filter((shape) => shape.kind === 'outline').map((shape) => shape.boundsMm.maxXMm - shape.boundsMm.minXMm);
    const section = width('2.18_Grenze Einsatzabschnitt.svg');
    const subsection = width('2.19_Grenze Unterabschnitt.svg');
    expect(subsection).toHaveLength(2);
    subsection.forEach((value, i) => expect(Math.abs(value - (section[i] as number))).toBeLessThan(0.002));
    expect(fingerprintOf('2.19_Grenze Unterabschnitt.svg').curvedPaths).toBe(1);
  });
});

describe('Lücken gegen das Kennzahlenartefakt', () => {
  const gaps = PARAMETRIC_BLOCKS.filter((entry) => blockEntry(entry.id)?.binding.status === 'not-measured');

  it('meldet jede Lücke als NotMeasuredError', () => {
    for (const entry of gaps) {
      const draw = () =>
        entry.category === 'arrow'
          ? movementDrawing(entry.valueId as MovementId, { path: { points: [[2, 16], [30, 16]] } }, { width: 32, height: 32 })
          : lineDrawing(entry.valueId as LineId, { path: { points: [[1, 16], [47, 16]] } }, { width: 48, height: 32 });
      expect(draw, entry.id).toThrow(NotMeasuredError);
    }
  });

  it('begründet jede Kurvenlücke mit einer Datei ohne Form', () => {
    for (const entry of gaps.filter((candidate) => ['5.2.6', '2.14', '2.15', '2.16'].includes(candidate.section))) {
      for (const asset of entry.assets) {
        const fingerprint = fingerprintOf(asset);
        expect(fingerprint.shapes, asset).toEqual([]);
        expect(fingerprint.curvedPaths, asset).toBeGreaterThan(0);
      }
    }
  });

  it('liest an 5.2.2 und 5.2.5 den Querstrich ab, aber nicht seine Länge', () => {
    const start = fingerprintOf('5.2.2_Beginn einer Maßnahme.svg').shapes[0]?.boundsMm;
    const end = fingerprintOf('5.2.5_Ende einer Bewegung.svg').shapes[0]?.boundsMm;
    // Querstrich bei x 2 mit 0,5 mm Strich; Kopf von 4 mm Halbbreite am Ende.
    expect(start).toEqual({ minXMm: 1.75, minYMm: 11.823, maxXMm: 30.354, maxYMm: 20.177 });
    // Querstrich bei x 30, keine Pfeilspitze über ihn hinaus.
    expect(end).toEqual({ minXMm: 2, minYMm: 11.823, maxXMm: 30.25, maxYMm: 20.177 });
  });
});
