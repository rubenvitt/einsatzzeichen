import { describe, expect, it } from 'vitest';
import { technicalHeadMark } from './index.js';

describe('technicalHeadMark()', () => {
  it('liefert den vermessenen einzelnen Vertikalbalken relativ zur Kopfoberkante', () => {
    expect(technicalHeadMark('single-vertical-bar')).toEqual({
      heightMm: 4,
      primitives: [{
        type: 'rect',
        role: 'head',
        x: 15.25,
        y: 0,
        width: 1.5,
        height: 4,
        style: { fill: 'schwarz', stroke: 'none' },
      }],
    });
  });

  it('fällt bei unbekannten technischen Kopfmarken nicht zurück', () => {
    expect(() => Reflect.apply(technicalHeadMark, undefined, ['double-vertical-bar']))
      .toThrow(/Unbekannte technische Kopfmarke/);
  });

  it('teilt ausschließlich tief eingefrorene Geometrie zwischen Aufrufen', () => {
    const first = technicalHeadMark('single-vertical-bar');
    const primitive = first.primitives[0];
    expect(primitive).toBeDefined();
    if (primitive === undefined) return;

    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.primitives)).toBe(true);
    expect(Object.isFrozen(primitive)).toBe(true);
    expect(Object.isFrozen(primitive.style)).toBe(true);
    expect(Reflect.set(primitive, 'x', 0)).toBe(false);

    expect(technicalHeadMark('single-vertical-bar').primitives[0]).toMatchObject({ x: 15.25 });
  });
});
