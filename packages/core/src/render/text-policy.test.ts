import { describe, expect, it } from 'vitest';
import {
  DIACRITIC_HEADROOM_FRACTION,
  MINIMUM_TEXT_RENDER_PX,
  effectiveTextPx,
  verticalTextBoxMm,
} from './text-policy.js';

describe('Mindestgröße für Text', () => {
  it('rechnet den Schriftgrad auf die Rendergröße um', () => {
    expect(effectiveTextPx(10, 32, 32)).toBe(10);
    expect(effectiveTextPx(10, 16, 32)).toBe(5);
    expect(effectiveTextPx(10, 256, 32)).toBe(80);
  });

  it('hält die Schwelle als benannte Konstante', () => {
    expect(MINIMUM_TEXT_RENDER_PX).toBeGreaterThan(0);
  });
});

describe('Diakritika-Zuschlag für boxMm (Task 9)', () => {
  // Pinnt die Arithmetik unabhängig von der Rasterprüfung in fonts.test.ts (die den Zuschlag
  // nur indirekt über Pixelzählung bestätigt). Werte wie in compose.ts' Fußzone: footTopMm 27
  // (Körperunterkante 26 mm + HEAD_GAP_MM 1 mm), FOOT_TEXT_SIZE_MM 4 mm.
  it('verschiebt bei baseline "hanging" nur die Oberkante nach oben, die Unterkante bleibt', () => {
    const box = verticalTextBoxMm(27, 4, 'hanging');
    expect(box.topMm).toBeCloseTo(27 - 4 * DIACRITIC_HEADROOM_FRACTION, 10);
    expect(box.topMm).toBeCloseTo(26.5, 10);
    expect(box.heightMm).toBeCloseTo(4.5, 10);
    // Unterkante (topMm + heightMm) bleibt bei anchorYMm + sizeMm — unverändert vom Zuschlag.
    expect(box.topMm + box.heightMm).toBeCloseTo(27 + 4, 10);
  });

  it('lehnt ungemessene baselines ab, statt eine Zahl zu raten', () => {
    expect(() => verticalTextBoxMm(27, 4, 'alphabetic')).toThrow();
    expect(() => verticalTextBoxMm(27, 4, 'middle')).toThrow();
  });
});
