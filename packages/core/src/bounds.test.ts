import { describe, expect, it } from 'vitest';
import type { Primitive } from '@einsatzzeichen/schema';
import { boundsOfMm, shiftY } from './bounds.js';

const rotate = { angle: 45, cx: 16, cy: 16 };

describe('shiftY — Drehung', () => {
  it('verschiebt ein unrotiertes rect um deltaMm', () => {
    const primitive: Primitive = { type: 'rect', x: 1, y: 6, width: 30, height: 20 };
    const shifted = shiftY(primitive, 3);
    expect(shifted.type).toBe('rect');
    if (shifted.type === 'rect') expect(shifted.y).toBe(9);
  });

  it('wirft für ein gedrehtes rect, statt das Rotationszentrum zurückzulassen', () => {
    const primitive: Primitive = { type: 'rect', x: 1, y: 1, width: 30, height: 30, transform: { rotate } };
    expect(() => shiftY(primitive, 3)).toThrow(/gedrehte Primitive/);
  });

  it('wirft für einen gedrehten circle', () => {
    const primitive: Primitive = { type: 'circle', cx: 16, cy: 16, r: 10, transform: { rotate } };
    expect(() => shiftY(primitive, 3)).toThrow(/gedrehte Primitive/);
  });

  it('wirft für eine gedrehte line', () => {
    const primitive: Primitive = {
      type: 'line',
      x1: 1,
      y1: 1,
      x2: 30,
      y2: 30,
      transform: { rotate },
    };
    expect(() => shiftY(primitive, 3)).toThrow(/gedrehte Primitive/);
  });

  it('wirft für eine gedrehte polyline', () => {
    const primitive: Primitive = {
      type: 'polyline',
      points: [
        [1, 1],
        [30, 30],
      ],
      transform: { rotate },
    };
    expect(() => shiftY(primitive, 3)).toThrow(/gedrehte Primitive/);
  });
});

describe('boundsOfMm — Verschiebung von Gruppen', () => {
  it('verschiebt die Hülle einer Gruppe um dxMm und dyMm', () => {
    const group: Primitive = {
      type: 'group',
      transform: { translate: { dxMm: 2, dyMm: 3 } },
      children: [{ type: 'rect', x: 1, y: 6, width: 30, height: 20 }],
    };
    expect(boundsOfMm(group)).toEqual({ minX: 3, minY: 9, maxX: 33, maxY: 29 });
  });

  it('lässt eine Gruppe aus reinen Pfaden nicht vergleichbar, auch mit Verschiebung', () => {
    // Die Nichtvergleichbarkeit wird strukturell weitergereicht: eine Verschiebung darf aus
    // "keine Ausdehnung" nicht die Zahl 3 machen, sonst verfälschte eine Piktogramm-Gruppe
    // aus Pfaden die Hülle ihrer Geschwister.
    const group: Primitive = {
      type: 'group',
      transform: { translate: { dxMm: 0, dyMm: 3 } },
      children: [{ type: 'path', d: 'M 4 4 L 8 8' }],
    };
    expect(boundsOfMm(group)).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
  });

  it('lehnt eine Verschiebung an einem Primitiv ab, das keine Gruppe ist', () => {
    const shifted: Primitive = {
      type: 'rect',
      x: 1,
      y: 6,
      width: 30,
      height: 20,
      transform: { translate: { dxMm: 0, dyMm: 3 } },
    };
    expect(() => boundsOfMm(shifted)).toThrow(/nur an Gruppen/);
  });
});
