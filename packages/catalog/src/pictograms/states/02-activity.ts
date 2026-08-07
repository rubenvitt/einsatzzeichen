import type {
  ColorToken,
  Primitive,
} from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import {
  defineState,
  type CatalogPictogramDefinition,
  type PictogramContrastPair,
} from '../catalog-definition.js';
import { stateCircle, statePath } from './authoring.js';

const SECTORS = [
  'M 16 3 H 29 V 16 H 16 Z',
  'M 16 16 H 29 V 29 H 16 Z',
  'M 3 16 H 16 V 29 H 3 Z',
  'M 3 3 H 16 V 16 H 3 Z',
] as const;

const DIVIDERS = {
  1: 'M 16 3 V 16 H 29',
  2: 'M 16 3 V 29',
  3: 'M 16 3 V 16 H 3',
  4: undefined,
} as const;

const NUMERALS = {
  1: 'M 16 11 V 21 M 14 13 L 16 11 H 18',
  2: 'M 12.5 13 C 13 10 19 10 19.5 13 C 20 15 18 16 16 17.5 L 12.5 21 H 20',
  3: 'M 12.5 12 C 15 10 19.5 10.5 19.5 13.5 C 19.5 15 18 16 16 16 ' +
    'C 18 16 20 17 20 19 C 20 22 15 23 12.5 21',
  4: 'M 19 21 V 11 L 12 18 H 21',
} as const;

type ActivityLevel = keyof typeof NUMERALS;

const ACTIVITY_WITH_GREEN_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'Schwarze Aussenkontur des Aktivitaetsquadrats',
  },
  {
    foreground: 'schwarz',
    background: 'weiss',
    context: 'Ziffer und Kreisrand auf weisser Innenflaeche',
  },
  {
    foreground: 'schwarz',
    background: 'rot',
    context: 'Sektorgrenze auf roter Ausfallflaeche',
  },
  {
    foreground: 'schwarz',
    background: 'gruen',
    context: 'Sektorgrenze auf gruener Aktivitaetsflaeche',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

const ACTIVITY_TOTAL_OUTAGE_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'Schwarze Aussenkontur des Aktivitaetsquadrats',
  },
  {
    foreground: 'schwarz',
    background: 'weiss',
    context: 'Ziffer und Kreisrand auf weisser Innenflaeche',
  },
  {
    foreground: 'schwarz',
    background: 'rot',
    context: 'Schwarze Kontur auf roter Totalausfallflaeche',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

function activityPrimitives(level: ActivityLevel): readonly Primitive[] {
  const sectors = SECTORS.map((d, index) => {
    const fill: ColorToken = index < level ? 'rot' : 'gruen';
    return statePath(d, { fill });
  });
  const divider = DIVIDERS[level];
  return [
    ...sectors,
    ...(divider === undefined
      ? []
      : [statePath(divider, {
          fill: 'none',
          stroke: 'schwarz',
          strokeWidth: 1,
        })]),
    statePath('M 3 3 H 29 V 29 H 3 Z', {
      fill: 'none',
      stroke: 'schwarz',
      strokeWidth: 1,
    }),
    stateCircle(16, 16, 5.25, {
      fill: 'weiss',
      stroke: 'schwarz',
      strokeWidth: 1,
    }),
    statePath(NUMERALS[level], {
      fill: 'none',
      stroke: 'schwarz',
      strokeWidth: 1.4,
    }),
  ];
}

export const ACTIVITY_STATES = deepFreeze([
  defineState({
    section: '5.8.2.1',
    id: 'activity-slightly-increased-outage-up-to-25-percent',
    title: 'Geringfügig erhöhte Aktivität / bis 25 Prozent Ausfall',
    referenceAsset: '5.8.2.1_geringfügig erhöhte Aktivität_bis 25 Prozent Ausfall.svg',
    box: { xMm: 3, yMm: 3, widthMm: 26, heightMm: 26 },
    contrastPairs: ACTIVITY_WITH_GREEN_CONTRAST,
    primitives: activityPrimitives(1),
  }),
  defineState({
    section: '5.8.2.2',
    id: 'activity-moderately-increased-outage-up-to-50-percent',
    title: 'Moderat erhöhte Aktivität / bis 50 Prozent Ausfall',
    referenceAsset: '5.8.2.2_moderat erhöhte Aktivität_bis 50 Prozent Ausfall.svg',
    box: { xMm: 3, yMm: 3, widthMm: 26, heightMm: 26 },
    contrastPairs: ACTIVITY_WITH_GREEN_CONTRAST,
    primitives: activityPrimitives(2),
  }),
  defineState({
    section: '5.8.2.3',
    id: 'activity-significantly-increased-outage-up-to-75-percent',
    title: 'Deutlich erhöhte Aktivität / bis 75 Prozent Ausfall',
    referenceAsset: '5.8.2.3_deutlich erhöhte Aktivität_bis 75 Prozent Ausfall.svg',
    box: { xMm: 3, yMm: 3, widthMm: 26, heightMm: 26 },
    contrastPairs: ACTIVITY_WITH_GREEN_CONTRAST,
    primitives: activityPrimitives(3),
  }),
  defineState({
    section: '5.8.2.4',
    id: 'activity-strongly-increased-total-outage',
    title: 'Stark erhöhte Aktivität / Totalausfall',
    referenceAsset: '5.8.2.4_Stark erhöhte Aktivität_Totalausfall.svg',
    box: { xMm: 3, yMm: 3, widthMm: 26, heightMm: 26 },
    contrastPairs: ACTIVITY_TOTAL_OUTAGE_CONTRAST,
    primitives: activityPrimitives(4),
  }),
] satisfies readonly CatalogPictogramDefinition[]);
