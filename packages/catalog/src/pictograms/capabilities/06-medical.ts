import { DEFAULT_STROKE_WIDTH_MM, type Point, type Primitive, type Style } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import { defineCapability } from '../catalog-definition.js';

const STROKE: Style = { stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM, fill: 'none' };

function line(x1: number, y1: number, x2: number, y2: number): Primitive {
  return { type: 'line', role: 'pictogram', x1, y1, x2, y2, style: STROKE };
}

/** Das Sanitätskreuz aller 4.6-Zeichen: zwei 28 mm lange Balken durch die Feldmitte (16, 16). */
const CROSS: readonly Primitive[] = [line(16, 2, 16, 30), line(2, 16, 30, 16)];

/** Hülle des Kreuzes; alle Zusätze in 4.6.1–4.6.5 liegen innerhalb. */
const CROSS_BOX = { xMm: 2, yMm: 2, widthMm: 28, heightMm: 28 } as const;

/** Halbe Diagonale eines Kreises mit Radius 8 mm unter 45°: 8 / √2 ≈ 5,66 mm. */
const WHEEL_SPOKE = 5.66;

/**
 * Piktogramme des Kapitels 4.6. Maße an der Referenz abgelesen, Geometrie eigenständig
 * konstruiert: alle Striche 0,5 mm, das Kreuz reicht von 2 bis 30 mm in beiden Achsen.
 */
export const MEDICAL_CAPABILITIES = deepFreeze([
  defineCapability({
    section: '4.6.1',
    id: 'medical-service',
    title: 'Sanität, Grundzeichen',
    referenceAsset: '4.6.1_Sanität Grundzeichen.svg',
    box: CROSS_BOX,
    primitives: CROSS,
  }),
  defineCapability({
    section: '4.6.2',
    id: 'nursing',
    title: 'Pflege',
    referenceAsset: '4.6.2_Pflege.svg',
    box: CROSS_BOX,
    // Kreuz plus ein 10 mm langer senkrechter Strich im linken Arm bei x = 8.
    primitives: [...CROSS, line(8, 11, 8, 21)],
  }),
  defineCapability({
    section: '4.6.3',
    id: 'intensive-care',
    title: 'Rettungswesen / Intensivmedizin',
    referenceAsset: '4.6.3_Rettungswesen_Intensivmedizin.svg',
    box: CROSS_BOX,
    // Kreuz plus ein 10 mm langer senkrechter Strich im rechten Arm bei x = 24.
    primitives: [...CROSS, line(24, 11, 24, 21)],
  }),
  defineCapability({
    section: '4.6.4',
    id: 'physician',
    title: 'Arztwesen',
    referenceAsset: '4.6.4_Arztwesen.svg',
    box: CROSS_BOX,
    // Kreuz plus ein 10 mm langer waagerechter Strich im unteren Arm bei y = 24.
    primitives: [...CROSS, line(11, 24, 21, 24)],
  }),
  defineCapability({
    section: '4.6.5',
    id: 'patient-transport',
    title: 'Patiententransport',
    referenceAsset: '4.6.5_Patiententransport.svg',
    box: CROSS_BOX,
    // Kreuz plus Rad: Kreis mit Radius 8 mm um die Mitte und zwei Speichen unter 45°, die an
    // der Kreislinie enden.
    primitives: [
      ...CROSS,
      { type: 'circle', role: 'pictogram', cx: 16, cy: 16, r: 8, style: STROKE },
      line(16 - WHEEL_SPOKE, 16 - WHEEL_SPOKE, 16 + WHEEL_SPOKE, 16 + WHEEL_SPOKE),
      line(16 + WHEEL_SPOKE, 16 - WHEEL_SPOKE, 16 - WHEEL_SPOKE, 16 + WHEEL_SPOKE),
    ],
  }),
  defineCapability({
    section: '4.6.6',
    id: 'hospital',
    title: 'Krankenhaus',
    referenceAsset: '4.6.6_Krankenhaus.svg',
    box: { xMm: 2, yMm: 4, widthMm: 28, heightMm: 22 },
    // Haus mit weißer Fläche: Wände x 2–30, Boden y 26, Traufe y 9,85, First (16, 4). Darin
    // Traufbalken (y 10) und Querbalken (y 18) über die volle Breite, ein Mittelstrich x 16 von
    // der Traufe bis zum Boden und zwei 8 mm lange Striche bei x 9 und x 23.
    primitives: [
      {
        type: 'polyline',
        role: 'pictogram',
        points: [[2, 26], [2, 9.85], [16, 4], [30, 9.85], [30, 26]] satisfies Point[],
        closed: true,
        style: { ...STROKE, fill: 'weiss' },
      },
      line(2, 10, 30, 10),
      line(2, 18, 30, 18),
      line(16, 10, 16, 26),
      line(9, 14, 9, 22),
      line(23, 14, 23, 22),
    ],
  }),
] as const);
