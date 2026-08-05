import { describe, expect, it } from 'vitest';
import type { Primitive } from '@einsatzzeichen/schema';
import { shiftY } from './bounds.js';

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
