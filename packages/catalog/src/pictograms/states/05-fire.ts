import type { Point, Primitive, Style } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import { defineState, type CatalogPictogramDefinition } from '../catalog-definition.js';

const FIRE_STROKE = {
  fill: 'none',
  stroke: 'rot',
  strokeWidth: 1.3,
} as const satisfies Style;

const FIRE_CONTRAST = [
  {
    foreground: 'rot',
    background: 'surface',
    context: 'rote Flammenkontur auf Ausgabeoberfläche',
  },
] as const;

function flame(points: readonly Point[]): Primitive {
  return {
    type: 'polyline',
    role: 'pictogram',
    points,
    closed: true,
    style: FIRE_STROKE,
  };
}

export const FIRE_STATES = deepFreeze([
  defineState({
    section: '5.8.5.1',
    id: 'incipient-fire',
    title: 'Entstehungsbrand',
    referenceAsset: '5.8.5.1_Entstehungsbrand.svg',
    box: { xMm: 12, yMm: 7, widthMm: 8, heightMm: 18 },
    contrastPairs: FIRE_CONTRAST,
    primitives: [flame([[12, 25], [20, 25], [20, 7]])],
  }),
  defineState({
    section: '5.8.5.2',
    id: 'developed-fire',
    title: 'Fortentwickelter Brand',
    referenceAsset: '5.8.5.2_fortentwickelter Brand.svg',
    box: { xMm: 5, yMm: 7, widthMm: 22, heightMm: 18 },
    contrastPairs: FIRE_CONTRAST,
    primitives: [
      flame([[5, 25], [15, 25], [15, 7]]),
      flame([[17, 25], [27, 25], [27, 7]]),
    ],
  }),
  defineState({
    section: '5.8.5.3',
    id: 'fully-developed-fire',
    title: 'Vollbrand',
    referenceAsset: '5.8.5.3_Vollbrand.svg',
    box: { xMm: 3, yMm: 7, widthMm: 26, heightMm: 18 },
    contrastPairs: FIRE_CONTRAST,
    primitives: [
      flame([[3, 25], [11, 25], [11, 7]]),
      flame([[12, 25], [20, 25], [20, 7]]),
      flame([[21, 25], [29, 25], [29, 7]]),
    ],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
