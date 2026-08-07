import type { Primitive, Style } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import { defineState, type CatalogPictogramDefinition } from '../catalog-definition.js';

const DAMAGE_STROKE = {
  fill: 'none',
  stroke: 'rot',
  strokeWidth: 1.5,
} as const satisfies Style;

const DAMAGE_CONTRAST = [
  {
    foreground: 'rot',
    background: 'surface',
    context: 'rote Schadensmarken auf Ausgabeoberfläche',
  },
] as const;

function damageLine(x1: number, y1: number, x2: number, y2: number): Primitive {
  return {
    type: 'line',
    role: 'pictogram',
    x1,
    y1,
    x2,
    y2,
    style: DAMAGE_STROKE,
  };
}

function damageMark(cx: number, cy: number, armMm: number): Primitive {
  return {
    type: 'group',
    role: 'pictogram',
    children: [
      damageLine(cx - armMm, cy - armMm, cx + armMm, cy + armMm),
      damageLine(cx + armMm, cy - armMm, cx - armMm, cy + armMm),
    ],
  };
}

export const DAMAGE_STATES = deepFreeze([
  defineState({
    section: '5.8.4.1',
    id: 'damaged',
    title: 'Angeschlagen',
    referenceAsset: '5.8.4.1_Angeschlagen.svg',
    box: { xMm: 9, yMm: 9, widthMm: 14, heightMm: 14 },
    contrastPairs: DAMAGE_CONTRAST,
    primitives: [damageMark(16, 16, 7)],
  }),
  defineState({
    section: '5.8.4.2',
    id: 'partially-destroyed',
    title: 'Teilzerstört',
    referenceAsset: '5.8.4.2_Teilzerstört.svg',
    box: { xMm: 6, yMm: 6, widthMm: 20, heightMm: 20 },
    contrastPairs: DAMAGE_CONTRAST,
    primitives: [
      damageMark(11, 11, 5),
      damageMark(21, 11, 5),
      damageMark(16, 21, 5),
    ],
  }),
  defineState({
    section: '5.8.4.3',
    id: 'destroyed',
    title: 'Total zerstört',
    referenceAsset: '5.8.4.3_Total zerstört.svg',
    box: { xMm: 4, yMm: 5, widthMm: 24, heightMm: 19 },
    contrastPairs: DAMAGE_CONTRAST,
    primitives: [
      damageMark(8, 9, 4),
      damageMark(16, 9, 4),
      damageMark(24, 9, 4),
      damageMark(12, 20, 4),
      damageMark(20, 20, 4),
    ],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
