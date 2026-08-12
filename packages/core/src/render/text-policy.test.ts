import { describe, expect, it } from 'vitest';
import {
  ALPHABETIC_ASCENT_FRACTION,
  ALPHABETIC_DESCENT_FRACTION,
  ARIMO_CAP_HEIGHT_FRACTION,
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
    // `alphabetic` ist seit Anhang E gemessen (siehe unten) und fehlt hier deshalb; `middle`
    // bleibt ungemessen — Arimos Central-Metrik liegt weder auf der Grundlinie noch auf der
    // Hanging-Linie und bräuchte eine eigene Messreihe.
    expect(() => verticalTextBoxMm(27, 4, 'middle')).toThrow();
  });
});

describe('Grundlinienmetrik für boxMm (Anhang E)', () => {
  // Werte wie in compose.ts' Beschriftungszonen: mittiges Kürzel bei Grundlinie 18 mm und
  // 7,08 mm Schriftgrad, die beiden unteren Läufe bei Grundlinie 24 mm und 4,24 mm. Die
  // Rasterprüfung in fonts.test.ts bestätigt die Anteile indirekt über Pixelzählung; dieser
  // Test pinnt die Arithmetik.
  it('spannt die Box bei baseline "alphabetic" um die Grundlinie herum auf', () => {
    const box = verticalTextBoxMm(18, 7.08, 'alphabetic');
    expect(box.topMm).toBeCloseTo(18 - 7.08 * ALPHABETIC_ASCENT_FRACTION, 10);
    expect(box.topMm + box.heightMm).toBeCloseTo(18 + 7.08 * ALPHABETIC_DESCENT_FRACTION, 10);
    // Anders als bei `hanging` liegt der Anker **innerhalb** der Box, nicht an ihrer Oberkante.
    expect(box.topMm).toBeLessThan(18);
    expect(box.topMm + box.heightMm).toBeGreaterThan(18);
  });

  it('hält beide Anteile an der Zeilenmetrik von Arimo', () => {
    // hhea-Ascender 1854/2048 = 0,9053. Der gemessene Anteil bleibt darunter: die Box ist enger
    // als die Zeilenmetrik der Schrift, nicht deren Übernahme.
    expect(ALPHABETIC_ASCENT_FRACTION).toBeLessThan(1854 / 2048);
    // hhea-Descender 434/2048 = 0,21191. Der gemessene Anteil (0,212) trifft ihn auf drei
    // Nachkommastellen — ein Befund der Messung, keine Herleitung aus der Tabelle. Bricht diese
    // Übereinstimmung bei einem Schriftwechsel, ist die Messung neu zu führen.
    expect(ALPHABETIC_DESCENT_FRACTION).toBeCloseTo(434 / 2048, 3);
    // Beide müssen die Versalhöhe überschreiten: über dem großen O steht der Umlautpunkt.
    expect(ALPHABETIC_ASCENT_FRACTION).toBeGreaterThan(ARIMO_CAP_HEIGHT_FRACTION);
  });
});
