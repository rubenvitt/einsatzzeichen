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
});
