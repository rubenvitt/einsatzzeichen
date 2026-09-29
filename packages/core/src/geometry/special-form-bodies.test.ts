import { describe, expect, it } from 'vitest';
import type { Primitive, SpecialFormId } from '@einsatzzeichen/schema';
import { boundsOfMm, strokeBoundsOfMm, type BoundsMm } from '../bounds.js';
import { tokenizePath } from '../path-commands.js';
import { SPECIAL_FORM_IDS_DRAWN, specialFormDrawing } from './special-form-bodies.js';

/**
 * Gate der Sonderformen 3.6 bis 3.9 als Zeichnung (LFH-577). Die Sollwerte sind an den
 * Referenzdateien abgelesen (29.09.2026, 1 mm = 90,709/32 px); die Tintenhüllen von 3.6 und 3.9
 * stehen zusätzlich im Kennzahlenartefakt und werden dort in `conformance` gegengeprüft.
 */

function only(id: SpecialFormId): Primitive {
  const children = specialFormDrawing(id).children;
  expect(children, id).toHaveLength(1);
  return children[0] as Primitive;
}

function expectBounds(actual: BoundsMm, expected: BoundsMm, digits = 3): void {
  expect(actual.minX).toBeCloseTo(expected.minX, digits);
  expect(actual.minY).toBeCloseTo(expected.minY, digits);
  expect(actual.maxX).toBeCloseTo(expected.maxX, digits);
  expect(actual.maxY).toBeCloseTo(expected.maxY, digits);
}

/** Tintenhülle eines Pfads aus Mittellinie und halber Strichstärke, nur für achsparallele Enden. */
function inkOfCenterline(bounds: BoundsMm, strokeMm: number): BoundsMm {
  const half = strokeMm / 2;
  return { minX: bounds.minX - half, minY: bounds.minY - half, maxX: bounds.maxX + half, maxY: bounds.maxY };
}

describe('Sonderformen als Zeichnung', () => {
  it('zeichnet alle vier Sonderformen auf der 32-mm-Fläche', () => {
    expect([...SPECIAL_FORM_IDS_DRAWN]).toEqual([
      'drone',
      'two-wheeler',
      'motorized-two-wheeler',
      'temporary-fixed-structure',
    ]);
    for (const id of SPECIAL_FORM_IDS_DRAWN) {
      expect(specialFormDrawing(id).viewBox, id).toEqual({ width: 32, height: 32 });
    }
  });

  it('3.6 Drohne: gefülltes Sechseck, Hülle 4/10/28/22, Scheitel innen 17,273 und außen 22', () => {
    const drone = only('drone');
    expect(drone.type).toBe('polyline');
    if (drone.type !== 'polyline') return;
    expect(drone.closed).toBe(true);
    expect(drone.role).toBe('body');
    expect(drone.style).toEqual({ fill: 'schwarz', stroke: 'none' });
    expect(boundsOfMm(drone)).toEqual({ minX: 4, minY: 10, maxX: 28, maxY: 22 });
    expect(drone.points).toEqual([
      [28, 10],
      [16, 17.273],
      [4, 10],
      [4, 13],
      [16, 22],
      [28, 13],
    ]);
  });

  it('3.7 Zweirad: Halbbogen r 6 um (16|10) und ein Stiel x 16 bis y 28, Strich 0,5 mm', () => {
    const wheel = only('two-wheeler');
    expect(wheel.type).toBe('path');
    if (wheel.type !== 'path') return;
    expect(wheel.role).toBe('body');
    expect(wheel.style).toEqual({ fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 });
    expectBounds(boundsOfMm(wheel), { minX: 10, minY: 4, maxX: 22, maxY: 28 });
    // Tintenhülle der Referenz: x 9,75…22,25, y 3,75…28 (Stielende und Bogenenden stumpf).
    expectBounds(inkOfCenterline(boundsOfMm(wheel), 0.5), { minX: 9.75, minY: 3.75, maxX: 22.25, maxY: 28 });
  });

  it('3.8 Zweirad motorgetrieben: derselbe Bogen, zwei Stiele x 15 und 17 bis y 28', () => {
    const wheel = only('motorized-two-wheeler');
    expect(wheel.type).toBe('path');
    if (wheel.type !== 'path') return;
    expect(wheel.style).toEqual({ fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 });
    expectBounds(boundsOfMm(wheel), { minX: 10, minY: 4, maxX: 22, maxY: 28 });
    // Die Stiele setzen auf der Bogenmittellinie an: y = 10 − √(6² − 1²) = 4,0839.
    expect(wheel.d).toContain('M 15 4.0839 L 15 28');
    expect(wheel.d).toContain('M 17 4.0839 L 17 28');
  });

  it('3.7 und 3.8 nutzen nur die zugelassenen absoluten Kommandos', () => {
    for (const id of ['two-wheeler', 'motorized-two-wheeler'] as const) {
      const wheel = only(id);
      if (wheel.type !== 'path') throw new Error(`${id}: kein Pfad`);
      expect(tokenizePath(wheel.d).problems, id).toEqual([]);
    }
  });

  it('3.9: der Giebel (2|14) → (16|2) → (30|14) trifft die Tintenhülle 1,837/1,671/30,162/14,19', () => {
    const roof = only('temporary-fixed-structure');
    expect(roof.type).toBe('polyline');
    if (roof.type !== 'polyline') return;
    expect(roof.role).toBe('bodyExtra');
    expect(roof.closed ?? false).toBe(false);
    expect(roof.points).toEqual([[2, 14], [16, 2], [30, 14]]);
    expect(roof.style).toEqual({ fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 });
    expectBounds(strokeBoundsOfMm(roof), { minX: 1.837, minY: 1.671, maxX: 30.162, maxY: 14.19 }, 2);
  });

  it('3.9 zeichnet den grauen Platzhalter nicht mit', () => {
    const colors = specialFormDrawing('temporary-fixed-structure').children.flatMap((child) => [
      child.style?.fill,
      child.style?.stroke,
    ]);
    expect(colors).not.toContain('hellgrau');
  });
});
