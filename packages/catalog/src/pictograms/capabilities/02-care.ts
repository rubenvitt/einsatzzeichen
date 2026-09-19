import { DEFAULT_STROKE_WIDTH_MM, type Primitive, type Style } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import { defineCapability } from '../catalog-definition.js';

/** Strich der Referenz: 1,417 pt = 0,5 mm, schwarz, ohne Füllung. */
const STROKE: Style = { stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM, fill: 'none' };

function line(x1: number, y1: number, x2: number, y2: number): Primitive {
  return { type: 'line', role: 'pictogram', x1, y1, x2, y2, style: STROKE };
}

/**
 * Grundzeichen der Betreuung: offener Winkel (1|28)–(16|3)–(31|28) als 0,5-mm-Strich. 4.2.1 und
 * 4.2.2 teilen ihn.
 */
const CARE_ROOF: Primitive = {
  type: 'polyline',
  role: 'pictogram',
  points: [[1, 28], [16, 3], [31, 28]],
  style: STROKE,
};

/**
 * Piktogramme des Kapitels 4.2. Maße an der Referenz abgelesen, Geometrie eigenständig
 * konstruiert (Umrechnung mm = pt × 32 / 90,709).
 */
export const CARE_CAPABILITIES = deepFreeze([
  defineCapability({
    section: '4.2.1',
    id: 'care',
    title: 'Betreuung',
    referenceAsset: '4.2.1_Betreuung Grundzeichne.svg',
    box: { xMm: 1, yMm: 3, widthMm: 30, heightMm: 25 },
    primitives: [CARE_ROOF],
  }),
  defineCapability({
    section: '4.2.2',
    id: 'psychosocial-emergency-care',
    title: 'PSNV',
    referenceAsset: '4.2.2_PSNV.svg',
    box: { xMm: 1, yMm: 3, widthMm: 30, heightMm: 25.3 },
    primitives: [
      CARE_ROOF,
      // Kürzel „PSNV" in der Projektschrift auf der Grundlinie y = 28 mm (Referenz: 79,37 pt),
      // Versalhöhe 4,87 mm (13,803 pt), Lauf von x ≈ 8,0 bis 24,2 mm. Die Referenz setzt
      // halbfett, dafür steht der Fettschnitt (700); er läuft in Arimo breiter (≈ 7,0–25,7 mm).
      {
        type: 'text',
        role: 'pictogram',
        content: 'PSNV',
        x: 16.1,
        y: 28,
        sizeMm: 7.05,
        anchor: 'middle',
        baseline: 'alphabetic',
        boxMm: { xMm: 6.5, yMm: 22.5, widthMm: 19.3, heightMm: 5.8 },
        minRenderPx: 64,
        fontWeight: 700,
        style: { fill: 'schwarz', stroke: 'none' },
      },
    ],
  }),
  defineCapability({
    section: '4.2.3',
    id: 'pastoral-care',
    title: 'Seelsorge',
    referenceAsset: '4.2.3_Seelsorge.svg',
    box: { xMm: 5.83, yMm: 2, widthMm: 20.34, heightMm: 28 },
    // Doppelkreuz: zwei senkrechte Striche bei x = 14 und 18 mm (y 2–30), zwei Querbalken bei
    // y = 10 und 13,5 mm (x 5,83–26,17).
    primitives: [
      line(14, 2, 14, 30),
      line(18, 2, 18, 30),
      line(5.83, 10, 26.17, 10),
      line(5.83, 13.5, 26.17, 13.5),
    ],
  }),
  defineCapability({
    section: '4.2.4',
    id: 'temporary-accommodation-resting',
    title: 'Temporäre Unterbringung mit Ruhemöglichkeit',
    referenceAsset: '4.2.4_Temporäre Unterbringung mit Ruhemöglichkeit.svg',
    box: { xMm: 2, yMm: 8, widthMm: 28, heightMm: 16 },
    primitives: [
      // Bettpfosten x = 2 und 30 mm (y 8–24), Liegefläche y = 19 mm dazwischen.
      line(2, 8, 2, 24),
      line(30, 8, 30, 24),
      line(2, 19, 30, 19),
      {
        type: 'path',
        role: 'pictogram',
        // Decke: flacher Bogen von Pfosten zu Pfosten, Scheitel (16|12).
        d: 'M 2 18.3 C 3.6 13.45 7.55 12 16 12 C 24.45 12 28.4 13.45 30 18.3',
        style: STROKE,
      },
    ],
  }),
  defineCapability({
    section: '4.2.5',
    id: 'temporary-accommodation-seating',
    title: 'Temporäre Unterbringung mit Sitzmöglichkeit',
    referenceAsset: '4.2.5_Temporäre Unterbringung mit Sitzmöglichkeit.svg',
    box: { xMm: 9, yMm: 3, widthMm: 14.25, heightMm: 25 },
    // Stuhl im Profil: Lehne x = 9 mm (y 3–28), Sitz y = 16 mm bis x = 23 mm, Bein x = 23 mm bis
    // y = 28 mm. Einzelstriche mit stumpfen Enden, damit die äußere Ecke rechtwinklig bleibt.
    primitives: [line(9, 3, 9, 28), line(9, 16, 23.25, 16), line(23, 15.75, 23, 28)],
  }),
] as const);
