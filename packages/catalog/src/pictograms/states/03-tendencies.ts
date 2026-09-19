import type { Point, Primitive } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import {
  defineState,
  type CatalogPictogramDefinition,
  type PictogramContrastPair,
} from '../catalog-definition.js';
import {
  STATE_BLACK_FILL,
  STATE_STROKE_WIDTH_MM,
  stateLine,
  statePolygon,
  stateRect,
} from './authoring.js';

const TENDENCY_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'Schwarze Außenkante des Tendenzrahmens',
  },
  {
    foreground: 'schwarz',
    background: 'weiss',
    context: 'Pfeil und Rahmen auf weißer Innenfläche',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

/**
 * Tendenzpfeile 5.8.3, Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert.
 *
 * Rahmen: weißes Quadrat 2…30 mm mit 0,5 mm schwarzer Kontur. Pfeil: 0,5 mm starker Schaft und
 * gefüllte Spitze, ein gleichschenkliges Dreieck mit 8 mm Basis und 6 mm Höhe; der Schaft endet
 * auf der Basismitte. Waagerecht läuft der Pfeil von (5, 16) bis zur Spitze (27, 16); die
 * Diagonalen beginnen 3 mm innerhalb der Ecke (5, 27) bzw. (5, 5) und enden mit der Spitze bei
 * (27,07, 4,93) bzw. (27,07, 27,07).
 */
const TENDENCY_GEOMETRY = {
  rising: { tail: [5, 27], tip: [27.07, 4.93] },
  unchanged: { tail: [5, 16], tip: [27, 16] },
  falling: { tail: [5, 5], tip: [27.07, 27.07] },
} as const satisfies Record<string, { tail: Point; tip: Point }>;

const HEAD_LENGTH_MM = 6;
const HEAD_HALF_BASE_MM = 4;

type TendencyDirection = keyof typeof TENDENCY_GEOMETRY;

const round3 = (value: number): number => Math.round(value * 1000) / 1000;

function tendencyPrimitives(direction: TendencyDirection): readonly Primitive[] {
  const { tail, tip } = TENDENCY_GEOMETRY[direction];
  const length = Math.hypot(tip[0] - tail[0], tip[1] - tail[1]);
  const ux = (tip[0] - tail[0]) / length;
  const uy = (tip[1] - tail[1]) / length;
  const base: Point = [round3(tip[0] - HEAD_LENGTH_MM * ux), round3(tip[1] - HEAD_LENGTH_MM * uy)];
  const left: Point = [
    round3(base[0] + HEAD_HALF_BASE_MM * uy),
    round3(base[1] - HEAD_HALF_BASE_MM * ux),
  ];
  const right: Point = [
    round3(base[0] - HEAD_HALF_BASE_MM * uy),
    round3(base[1] + HEAD_HALF_BASE_MM * ux),
  ];
  return [
    stateRect(2, 2, 28, 28, { fill: 'weiss', stroke: 'schwarz', strokeWidth: STATE_STROKE_WIDTH_MM }),
    stateLine(tail[0], tail[1], base[0], base[1]),
    statePolygon([left, tip, right], STATE_BLACK_FILL),
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
