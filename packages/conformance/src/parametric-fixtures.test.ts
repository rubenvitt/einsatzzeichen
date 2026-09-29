import { describe, expect, it } from 'vitest';
import {
  ARIMO_CAP_HEIGHT_FRACTION,
  PARAMETRIC_BLOCKS,
  blockEntry,
  boundsOfMm,
  lineDrawing,
  movementDrawing,
  strokeBoundsOfMm,
  type BoundsMm,
} from '@einsatzzeichen/core';
import { PALETTE, type Drawing, type Primitive } from '@einsatzzeichen/schema';
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
  readonly fills: readonly string[];
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
        {
          path: fixture.path,
          ...(fixture.strength === undefined ? {} : { strength: fixture.strength }),
          ...(fixture.variant === undefined ? {} : { variant: fixture.variant }),
        },
        fixture.canvasMm,
      );
}

function hullOf(primitives: readonly Primitive[]): BoundsMm {
  const all = primitives.map((primitive) => {
    if (primitive.type === 'polyline') return strokeBoundsOfMm(primitive);
    const bounds = boundsOfMm(primitive);
    const half = primitive.type === 'circle' && primitive.style?.stroke !== undefined ? (primitive.style.strokeWidth ?? 0) / 2 : 0;
    return { minX: bounds.minX - half, minY: bounds.minY - half, maxX: bounds.maxX + half, maxY: bounds.maxY + half };
  });
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
  it('führt jede Darstellung jedes Bausteins mit Zeichnung als Fixture', () => {
    const measured = PARAMETRIC_BLOCKS.filter((entry) => blockEntry(entry.id)?.binding.status === 'measured');
    expect(measured).toHaveLength(PARAMETRIC_BLOCKS.length);
    expect(PARAMETRIC_FIXTURES.map((fixture) => fixture.asset)).toEqual(measured.flatMap((entry) => entry.assets));
    for (const fixture of PARAMETRIC_FIXTURES) {
      const entry = PARAMETRIC_BLOCKS.find((candidate) => candidate.assets.includes(fixture.asset));
      expect(entry?.id, fixture.asset).toBe(`${fixture.category}/${fixture.valueId}`);
      const alternative = entry?.assets.indexOf(fixture.asset) !== 0;
      expect(fixture.category === 'line' && fixture.variant === 'alternative', fixture.asset).toBe(alternative);
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
  const arrows = PARAMETRIC_FIXTURES.filter(
    (fixture) => fixture.category === 'arrow' && fingerprintOf(fixture.asset).shapes.length > 0,
  );

  it('führt 5.2.1 bis 5.2.5 mit Hülle, 5.2.6 als Kurvenpfad', () => {
    expect(arrows.map((fixture) => fixture.asset.slice(0, 5))).toEqual(['5.2.1', '5.2.2', '5.2.3', '5.2.4', '5.2.5']);
    expect(fingerprintOf('5.2.6_Sammeln_Zusammenführen.svg').curvedPaths).toBe(1);
  });

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
  const lines = PARAMETRIC_FIXTURES.filter(
    (fixture) => fixture.category === 'line' && fixture.valueId.startsWith('boundary-'),
  );

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

describe('Linien mit Marken aus Kapitel 2 gegen das Kennzahlenartefakt', () => {
  const marked = PARAMETRIC_FIXTURES.filter(
    (fixture) => fixture.category === 'line' && !fixture.valueId.startsWith('boundary-'),
  );

  it('führt 2.14 in zwei Darstellungen, 2.15 und 2.16', () => {
    expect(marked.map((fixture) => fixture.asset)).toEqual([
      '2.14_Escape Route.svg',
      '2.14_Escape Route_2.svg',
      '2.15_Riegelstellung.svg',
      '2.16_Brandausbreitung.svg',
    ]);
  });

  it.each(marked.map((fixture) => [fixture.asset, fixture] as const))(
    'zeichnet %s in der einzigen Farbe der Referenz, als Kurvenpfad ohne Form im Artefakt',
    (asset, fixture) => {
      const fingerprint = fingerprintOf(asset);
      expect(fingerprint.shapes).toEqual([]);
      expect(fingerprint.curvedPaths).toBe(1);
      expect(fingerprint.fills).toHaveLength(1);
      const colors = new Set(
        drawFixture(fixture).children.map((child) => {
          const style = child.style ?? {};
          return style.stroke !== undefined && style.stroke !== 'none' ? style.stroke : style.fill;
        }),
      );
      expect(colors.size, asset).toBe(1);
      const [token] = [...colors];
      expect(PALETTE[token as keyof typeof PALETTE], asset).toBe(fingerprint.fills[0]);
    },
  );
});
