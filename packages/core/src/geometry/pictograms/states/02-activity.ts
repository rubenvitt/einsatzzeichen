import type { ColorToken, Point, Primitive } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import {
  defineState,
  type CatalogPictogramDefinition,
  type PictogramContrastPair,
} from '../catalog-definition.js';
import {
  STATE_STROKE_WIDTH_MM,
  stateCircle,
  statePolyline,
  stateRect,
  stateText,
} from './authoring.js';

/**
 * Aktivitäts- und Ausfallgrade 5.8.2, Maße an der Referenz abgelesen, Geometrie eigenständig
 * konstruiert.
 *
 * Quadrat 4…28 mm (0,5 mm schwarze Kontur), in vier 12-mm-Viertel geteilt. Die Viertel werden im
 * Uhrzeigersinn ab oben rechts rot, die übrigen bleiben grün. Schwarze 0,5-mm-Trennlinien
 * laufen nur zwischen Rot und Grün. In der Mitte ein weißer Kreis mit r = 5 mm und 0,5 mm
 * Kontur, darin die Stufenziffer in der Projektschrift (Ziffernhöhe 4,6 mm, Grundlinie 18,2 mm).
 */
const SQUARE_MM = { min: 4, size: 24 } as const;
const QUARTER_MM = 12;

/** Viertel im Uhrzeigersinn ab oben rechts, jeweils linke obere Ecke. */
const QUARTERS: readonly Point[] = [
  [16, 4],
  [16, 16],
  [4, 16],
  [4, 4],
];

/** Trennlinie zwischen roten und grünen Vierteln; der weiße Kreis deckt die Mitte ab. */
const DIVIDERS: Readonly<Record<ActivityLevel, readonly Point[] | undefined>> = {
  1: [[16, 4], [16, 16], [28, 16]],
  2: [[16, 4], [16, 28]],
  3: [[16, 4], [16, 16], [4, 16]],
  4: undefined,
};

/** Arimo-Ziffer: 6,7 mm Schriftgrad ergibt die 4,6 mm Ziffernhöhe der Referenz. */
const NUMERAL_SIZE_MM = 6.7;
const NUMERAL_BASELINE_MM = 18.2;

type ActivityLevel = 1 | 2 | 3 | 4;

const BLACK_STROKE = {
  fill: 'none',
  stroke: 'schwarz',
  strokeWidth: STATE_STROKE_WIDTH_MM,
} as const;

const ACTIVITY_WITH_GREEN_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'Schwarze Außenkontur des Aktivitätsquadrats',
  },
  {
    foreground: 'schwarz',
    background: 'weiss',
    context: 'Ziffer und Kreisrand auf weißer Innenfläche',
  },
  {
    foreground: 'schwarz',
    background: 'rot',
    context: 'Sektorgrenze auf roter Ausfallfläche',
  },
  {
    foreground: 'schwarz',
    background: 'gruen',
    context: 'Sektorgrenze auf grüner Aktivitätsfläche',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

const ACTIVITY_TOTAL_OUTAGE_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'Schwarze Außenkontur des Aktivitätsquadrats',
  },
  {
    foreground: 'schwarz',
    background: 'weiss',
    context: 'Ziffer und Kreisrand auf weißer Innenfläche',
  },
  {
    foreground: 'schwarz',
    background: 'rot',
    context: 'Schwarze Kontur auf roter Totalausfallfläche',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

function activityPrimitives(level: ActivityLevel): readonly Primitive[] {
  const quarters = QUARTERS.map(([x, y], index) => {
    const fill: ColorToken = index < level ? 'rot' : 'gruen';
    return stateRect(x, y, QUARTER_MM, QUARTER_MM, { fill, stroke: 'none' });
  });
  const divider = DIVIDERS[level];
  return [
    ...quarters,
    ...(divider === undefined ? [] : [statePolyline(divider, false, BLACK_STROKE)]),
    stateRect(SQUARE_MM.min, SQUARE_MM.min, SQUARE_MM.size, SQUARE_MM.size, BLACK_STROKE),
    stateCircle(16, 16, 5, { fill: 'weiss', stroke: 'schwarz', strokeWidth: STATE_STROKE_WIDTH_MM }),
    stateText(String(level), {
      x: 16,
      y: NUMERAL_BASELINE_MM,
      sizeMm: NUMERAL_SIZE_MM,
      boxMm: { xMm: 14, yMm: 13.2, widthMm: 4, heightMm: 5.4 },
      fill: 'schwarz',
    }),
  ];
}

export const ACTIVITY_STATES = deepFreeze([
  defineState({
    section: '5.8.2.1',
    id: 'activity-slightly-increased-outage-up-to-25-percent',
    title: 'Geringfügig erhöhte Aktivität / bis 25 Prozent Ausfall',
    referenceAsset: '5.8.2.1_geringfügig erhöhte Aktivität_bis 25 Prozent Ausfall.svg',
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
    contrastPairs: ACTIVITY_WITH_GREEN_CONTRAST,
    primitives: activityPrimitives(1),
  }),
  defineState({
    section: '5.8.2.2',
    id: 'activity-moderately-increased-outage-up-to-50-percent',
    title: 'Moderat erhöhte Aktivität / bis 50 Prozent Ausfall',
    referenceAsset: '5.8.2.2_moderat erhöhte Aktivität_bis 50 Prozent Ausfall.svg',
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
    contrastPairs: ACTIVITY_WITH_GREEN_CONTRAST,
    primitives: activityPrimitives(2),
  }),
  defineState({
    section: '5.8.2.3',
    id: 'activity-significantly-increased-outage-up-to-75-percent',
    title: 'Deutlich erhöhte Aktivität / bis 75 Prozent Ausfall',
    referenceAsset: '5.8.2.3_deutlich erhöhte Aktivität_bis 75 Prozent Ausfall.svg',
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
    contrastPairs: ACTIVITY_WITH_GREEN_CONTRAST,
    primitives: activityPrimitives(3),
  }),
  defineState({
    section: '5.8.2.4',
    id: 'activity-strongly-increased-total-outage',
    title: 'Stark erhöhte Aktivität / Totalausfall',
    referenceAsset: '5.8.2.4_Stark erhöhte Aktivität_Totalausfall.svg',
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
    contrastPairs: ACTIVITY_TOTAL_OUTAGE_CONTRAST,
    primitives: activityPrimitives(4),
  }),
] satisfies readonly CatalogPictogramDefinition[]);
