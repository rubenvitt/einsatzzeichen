import type { Point, Primitive, Style } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import { defineState, type CatalogPictogramDefinition } from '../catalog-definition.js';

const ANIMAL_STROKE = {
  fill: 'none',
  stroke: 'schwarz',
  strokeWidth: 1.2,
} as const satisfies Style;

const ANIMAL_FILL = {
  fill: 'schwarz',
  stroke: 'none',
} as const satisfies Style;

const ANIMAL_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'Tiersilhouette und Zustandsmarke auf Ausgabeoberfläche',
  },
] as const;

function animalLine(x1: number, y1: number, x2: number, y2: number): Primitive {
  return {
    type: 'line',
    role: 'pictogram',
    x1,
    y1,
    x2,
    y2,
    style: ANIMAL_STROKE,
  };
}

function animalSilhouette(): Primitive {
  const points: readonly Point[] = [[4, 9], [9, 9], [16, 27], [23, 9], [28, 9]];
  return {
    type: 'polyline',
    role: 'pictogram',
    points,
    closed: false,
    style: ANIMAL_STROKE,
  };
}

function contaminationNode(cx: number): Primitive {
  return {
    type: 'circle',
    role: 'pictogram',
    cx,
    cy: 5,
    r: 2,
    style: ANIMAL_FILL,
  };
}

export const ANIMAL_STATES = deepFreeze([
  defineState({
    section: '5.8.6.1',
    id: 'sick-animal',
    title: 'Erkranktes Tier',
    referenceAsset: '5.8.6.1_erkranktes Tier.svg',
    box: { xMm: 4, yMm: 9, widthMm: 24, heightMm: 18 },
    contrastPairs: ANIMAL_CONTRAST,
    primitives: [animalSilhouette(), animalLine(16, 10, 16, 18)],
  }),
  defineState({
    section: '5.8.6.2',
    id: 'contaminated-animal',
    title: 'Kontaminiertes Tier',
    referenceAsset: '5.8.6.2_kontaminiertes Tier.svg',
    box: { xMm: 4, yMm: 3, widthMm: 24, heightMm: 24 },
    contrastPairs: ANIMAL_CONTRAST,
    primitives: [
      animalSilhouette(),
      contaminationNode(11),
      contaminationNode(21),
      animalLine(12.5, 6.5, 19.5, 13.5),
      animalLine(19.5, 6.5, 12.5, 13.5),
    ],
  }),
  defineState({
    section: '5.8.6.2',
    id: 'contaminated-animal',
    variant: 'alternative',
    title: 'Kontaminiertes Tier',
    referenceAsset: '5.8.6.2_kontaminiertes Tier_K.svg',
    box: { xMm: 4, yMm: 3, widthMm: 24, heightMm: 24 },
    contrastPairs: ANIMAL_CONTRAST,
    primitives: [
      animalSilhouette(),
      animalLine(6, 3, 6, 8.5),
      animalLine(6, 5.75, 11, 3),
      animalLine(6, 5.75, 11, 8.5),
    ],
  }),
  defineState({
    section: '5.8.6.3',
    id: 'dead-animal',
    title: 'Totes Tier',
    referenceAsset: '5.8.6.3_Totes Tier.svg',
    box: { xMm: 4, yMm: 2, widthMm: 24, heightMm: 25 },
    contrastPairs: ANIMAL_CONTRAST,
    primitives: [
      animalSilhouette(),
      animalLine(16, 2, 16, 13),
      animalLine(10.5, 7.5, 21.5, 7.5),
    ],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
