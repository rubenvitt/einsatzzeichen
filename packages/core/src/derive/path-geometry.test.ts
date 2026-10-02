import { describe, expect, it } from 'vitest';
import { boundsOfMm, shiftY } from '../bounds.js';
import { mapPathPoints, shiftPathY } from './path-geometry.js';

describe('Pfadabbildung (Kopfzone über Pfadkörpern)', () => {
  it('verschiebt jede y-Koordinate, auch in V, C und Q, und lässt H unberührt', () => {
    expect(shiftPathY('M 1 5.75 H 31 V 26 C 20 30, 12 30, 1 26 Q 0 16, 1 5.75 Z', 0.25)).toBe(
      'M 1 6 H 31 V 26.25 C 20 30.25 12 30.25 1 26.25 Q 0 16.25 1 6 Z',
    );
  });

  it('streckt um einen Punkt, ohne Gleitkommarauschen auszugeben', () => {
    expect(mapPathPoints('M 2 2 L 30 30', (x, y) => [16 + (x - 16) * 0.5, 2 + (y - 2) * 0.5]))
      .toBe('M 9 2 L 23 16');
  });

  it('lehnt einen Pfad außerhalb der Autorenkonvention ab, statt ihn teilweise abzubilden', () => {
    expect(() => shiftPathY('M 0 0 l 10 10', 1)).toThrow(/nicht abbildbar/);
  });

  it('shiftY verschiebt einen Pfadkörper samt Hülle', () => {
    const body = { type: 'path' as const, role: 'body' as const, d: 'M 1 9 H 31 V 24 H 1 Z' };
    expect(boundsOfMm(shiftY(body, -3))).toEqual({ minX: 1, minY: 6, maxX: 31, maxY: 21 });
  });

  it('shiftY lehnt einen gedrehten Pfad weiter ab', () => {
    const rotated = {
      type: 'path' as const,
      d: 'M 0 0 L 4 4',
      transform: { rotate: { angle: 45, cx: 2, cy: 2 } },
    };
    expect(() => shiftY(rotated, 1)).toThrow(/gedrehte Primitive/);
  });
});
