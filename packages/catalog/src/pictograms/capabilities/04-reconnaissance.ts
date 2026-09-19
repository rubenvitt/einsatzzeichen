import { DEFAULT_STROKE_WIDTH_MM, type Primitive, type Style } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import { strokeCapability as icon } from '../authoring.js';
import { defineCapability } from '../catalog-definition.js';

/** Strich der Referenz: 1,417 pt = 0,5 mm, schwarz, ohne Füllung. */
const STROKE: Style = { stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM, fill: 'none' };

function line(x1: number, y1: number, x2: number, y2: number): Primitive {
  return { type: 'line', role: 'pictogram', x1, y1, x2, y2, style: STROKE };
}

function polyline(...points: Array<[number, number]>): Primitive {
  return { type: 'polyline', role: 'pictogram', points, style: STROKE };
}

/**
 * Piktogramme des Kapitels 4.4. Maße an der Referenz abgelesen, Geometrie eigenständig
 * konstruiert (Umrechnung mm = pt × 32 / 90,709).
 */
export const RECONNAISSANCE_CAPABILITIES = deepFreeze([
  // Freigegeben; bleibt unverändert.
  icon({ section: '4.4.1', id: 'reconnaissance', title: 'Erkunden',
    referenceAsset: '4.4.1_Erkunden.svg', d: 'M 5 24 L 27 8' }),
  defineCapability({
    section: '4.4.2',
    id: 'biological-location',
    title: 'Orten, biologisch',
    referenceAsset: '4.4.2_Orten biologisch.svg',
    box: { xMm: 2, yMm: 6, widthMm: 28.4, heightMm: 20 },
    primitives: [
      // Kopf: nach rechts offener Winkel (2|6)–(7|16)–(2|26), Steigung 2 : 1.
      polyline([2, 6], [7, 16], [2, 26]),
      // Rumpf: waagerechter Strich y = 16 bis zur rechten Dreiecksecke.
      line(7, 16, 30.4, 16),
      // Beine: je ein umgekehrtes V unter dem Rumpf, Spitzen bei x = 7 und x = 20.
      line(7, 16, 12, 26),
      line(20, 16, 15, 26),
      line(20, 16, 25, 26),
      // Schwanz: Dreieck über dem Rumpf, Spitze (25|6), Basis 20–30 mm.
      line(20, 16, 25, 6),
      line(25, 6, 30, 16),
    ],
  }),
  defineCapability({
    section: '4.4.3',
    id: 'technical-location',
    title: 'Orten, technisch',
    referenceAsset: '4.4.3_Orten technisch.svg',
    box: { xMm: 3, yMm: 6, widthMm: 26.25, heightMm: 20.25 },
    primitives: [
      {
        type: 'path',
        role: 'pictogram',
        // Viertelkreis um (17|20) mit 14 mm Radius von (3|20) bis (17|6), k = 0,5523.
        d: 'M 3 20 C 3 12.268 9.268 6 17 6',
        style: STROKE,
      },
      // Blitz: vom Bogen (bei 225°) zur Kreismitte, kurz steil hinauf, dann unter 45° nach
      // rechts unten in die Ecke (29|26).
      polyline([7.1, 10.1], [17, 20], [18, 15], [29, 26]),
      // Pfeilspitze in der Ecke: je 6 mm nach links und nach oben.
      line(23, 26, 29.25, 26),
      line(29, 26.25, 29, 20),
    ],
  }),
] as const);
