import { describe, expect, it } from 'vitest';
import { rasterDimensionsForWidth } from '../index.js';

describe('rasterDimensionsForWidth', () => {
  it.each([
    [16, { widthPx: 16, heightPx: 23 }],
    [24, { widthPx: 24, heightPx: 35 }],
    [32, { widthPx: 32, heightPx: 46 }],
    [64, { widthPx: 64, heightPx: 92 }],
    [128, { widthPx: 128, heightPx: 184 }],
    [256, { widthPx: 256, heightPx: 368 }],
    [420, { widthPx: 420, heightPx: 604 }],
  ])('leitet für 32×46 mm aus %i px die proportional aufgerundete Rasterhöhe ab', (widthPx, expected) => {
    expect(rasterDimensionsForWidth({ width: 32, height: 46 }, widthPx)).toEqual(expected);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, 0, -1, 1.5])(
    'lehnt eine ungültige Pixelbreite %p ab',
    (widthPx) => {
      expect(() => rasterDimensionsForWidth({ width: 32, height: 46 }, widthPx)).toThrow();
    },
  );

  it.each([
    { width: 0, height: 46 },
    { width: 32, height: 0 },
    { width: Number.NaN, height: 46 },
    { width: 32, height: Number.POSITIVE_INFINITY },
  ])('lehnt eine ungültige ViewBox %o ab', (viewBox) => {
    expect(() => rasterDimensionsForWidth(viewBox, 64)).toThrow();
  });

  it('akzeptiert eine endliche positive ViewBox mit Millimeterbruchteilen', () => {
    expect(rasterDimensionsForWidth({ width: 20.5, height: 10.25 }, 64)).toEqual({
      widthPx: 64,
      heightPx: 32,
    });
  });
});
