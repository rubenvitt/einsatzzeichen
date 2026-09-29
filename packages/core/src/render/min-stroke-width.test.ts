import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWBOX_MM } from '@einsatzzeichen/schema';
import { effectiveStrokeWidthMm, strokeWidthFloorMm } from './min-stroke-width.js';

describe('strokeWidthFloorMm', () => {
  it('ist ohne Option undefiniert, auch ohne Rastergröße', () => {
    expect(strokeWidthFloorMm(DEFAULT_VIEWBOX_MM, undefined, undefined)).toBeUndefined();
    expect(strokeWidthFloorMm(DEFAULT_VIEWBOX_MM, 16, undefined)).toBeUndefined();
  });

  it('rechnet die Pixeluntergrenze über die ViewBox-Breite in Millimeter um', () => {
    // 32 mm auf 16 px: 1 px ≙ 2 mm, also viermal der Referenzstrich von 0,5 mm.
    expect(strokeWidthFloorMm(DEFAULT_VIEWBOX_MM, 16, 1)).toBe(2);
    expect(strokeWidthFloorMm(DEFAULT_VIEWBOX_MM, 24, 1)).toBeCloseTo(4 / 3, 12);
    expect(strokeWidthFloorMm(DEFAULT_VIEWBOX_MM, 64, 1)).toBe(0.5);
    expect(strokeWidthFloorMm(DEFAULT_VIEWBOX_MM, 32, 0.75)).toBe(0.75);
  });

  it('richtet sich nur nach der Breite, auch bei hoher ViewBox', () => {
    // Die Rasterhöhe wird proportional aufgerundet; der Maßstab folgt der Breite (renderCanvas
    // skaliert mit raster.widthPx / viewBox.width, SVG mit preserveAspectRatio „meet“).
    expect(strokeWidthFloorMm({ width: 32, height: 46 }, 16, 1)).toBe(2);
  });

  it('lehnt eine Untergrenze ohne Rastergröße ab, weil der Pixelmaßstab dann unbekannt ist', () => {
    expect(() => strokeWidthFloorMm(DEFAULT_VIEWBOX_MM, undefined, 1)).toThrow(RangeError);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'lehnt die ungültige Untergrenze %p ab',
    (value) => {
      expect(() => strokeWidthFloorMm(DEFAULT_VIEWBOX_MM, 16, value)).toThrow(RangeError);
    },
  );
});

describe('effectiveStrokeWidthMm', () => {
  it('gibt ohne Untergrenze exakt denselben Wert zurück', () => {
    expect(effectiveStrokeWidthMm(0.5, undefined)).toBe(0.5);
    expect(effectiveStrokeWidthMm(0.1 + 0.2, undefined)).toBe(0.1 + 0.2);
  });

  it('hebt einen dünneren Strich auf die Untergrenze an', () => {
    expect(effectiveStrokeWidthMm(0.5, 2)).toBe(2);
    expect(effectiveStrokeWidthMm(0.4, 0.5)).toBe(0.5);
  });

  it('lässt einen Strich an oder über der Untergrenze unverändert', () => {
    expect(effectiveStrokeWidthMm(1.2, 0.75)).toBe(1.2);
    expect(effectiveStrokeWidthMm(0.5, 0.5)).toBe(0.5);
  });

  it('macht einen bewusst unsichtbaren Nullstrich nicht sichtbar', () => {
    expect(effectiveStrokeWidthMm(0, 2)).toBe(0);
  });
});
