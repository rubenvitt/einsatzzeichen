import type { Primitive } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import {
  defineState,
  type CatalogPictogramDefinition,
  type PictogramContrastPair,
} from '../catalog-definition.js';
import { statePath } from './authoring.js';

const TENDENCY_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'Schwarze Aussenkante des Tendenzrahmens',
  },
  {
    foreground: 'schwarz',
    background: 'weiss',
    context: 'Pfeil und Rahmen auf weisser Innenflaeche',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

const TENDENCY_GEOMETRY = {
  rising: {
    shaft: 'M 5 27 L 24 8',
    head: 'M 20 7 L 27 5 L 25 12 Z',
  },
  unchanged: {
    shaft: 'M 5 16 H 23',
    head: 'M 22 12 L 28 16 L 22 20 Z',
  },
  falling: {
    shaft: 'M 5 5 L 24 24',
    head: 'M 22 21 L 28 27 L 20 25 Z',
  },
} as const;

type TendencyDirection = keyof typeof TENDENCY_GEOMETRY;

function tendencyPrimitives(direction: TendencyDirection): readonly Primitive[] {
  const geometry = TENDENCY_GEOMETRY[direction];
  return [
    statePath('M 2 2 H 30 V 30 H 2 Z', {
      fill: 'weiss',
      stroke: 'schwarz',
      strokeWidth: 0.8,
    }),
    statePath(geometry.shaft, {
      fill: 'none',
      stroke: 'schwarz',
      strokeWidth: 1,
    }),
    statePath(geometry.head, {
      fill: 'schwarz',
      stroke: 'schwarz',
      strokeWidth: 0.5,
    }),
  ];
}

export const TENDENCY_STATES = deepFreeze([
  defineState({
    section: '5.8.3.1',
    id: 'tendency-rising',
    title: 'Tendenz steigend',
    referenceAsset: '5.8.3.1_Tendenz steigend.svg',
    box: { xMm: 2, yMm: 2, widthMm: 28, heightMm: 28 },
    contrastPairs: TENDENCY_CONTRAST,
    primitives: tendencyPrimitives('rising'),
  }),
  defineState({
    section: '5.8.3.2',
    id: 'tendency-unchanged',
    title: 'Tendenz unverändert',
    referenceAsset: '5.8.3.2_Tendenz unverändert.svg',
    box: { xMm: 2, yMm: 2, widthMm: 28, heightMm: 28 },
    contrastPairs: TENDENCY_CONTRAST,
    primitives: tendencyPrimitives('unchanged'),
  }),
  defineState({
    section: '5.8.3.3',
    id: 'tendency-falling',
    title: 'Tendenz fallend',
    referenceAsset: '5.8.3.3_Tendenz fallend.svg',
    box: { xMm: 2, yMm: 2, widthMm: 28, heightMm: 28 },
    contrastPairs: TENDENCY_CONTRAST,
    primitives: tendencyPrimitives('falling'),
  }),
] satisfies readonly CatalogPictogramDefinition[]);
