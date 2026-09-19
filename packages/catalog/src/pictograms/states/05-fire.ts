import type { Point, Primitive, Style } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import { defineState, type CatalogPictogramDefinition } from '../catalog-definition.js';

/**
 * 5.8.5 Brandphasen. Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert: jede
 * Flamme ist ein rechtwinkliges Dreieck, 10 mm breit und 24 mm hoch, mit senkrechter Kante
 * rechts, Grundlinie y = 28 mm und Spitze y = 4 mm. Rote Kontur 0,5 mm, weiße Innenfläche
 * (Ebene „Flächige Füllung" der Referenz). Mehrere Flammen stehen lückenlos nebeneinander.
 */
const FIRE_STYLE = {
  fill: 'weiss',
  stroke: 'rot',
  strokeWidth: 0.5,
} as const satisfies Style;

const FIRE_CONTRAST = [
  {
    foreground: 'rot',
    background: 'weiss',
    context: 'rote Flammenkontur auf weißer Flammenfläche',
  },
  {
    foreground: 'rot',
    background: 'surface',
    context: 'rote Flammenkontur auf Ausgabeoberfläche',
  },
] as const;

const FLAME_WIDTH_MM = 10;
const FLAME_TOP_MM = 4;
const FLAME_BASE_MM = 28;

/** Eine Flamme, deren senkrechte Kante bei `rightX` steht. */
function flame(rightX: number): Primitive {
  const points: readonly Point[] = [
    [rightX - FLAME_WIDTH_MM, FLAME_BASE_MM],
    [rightX, FLAME_BASE_MM],
    [rightX, FLAME_TOP_MM],
  ];
  return {
    type: 'polyline',
    role: 'pictogram',
    points,
    closed: true,
    style: { ...FIRE_STYLE },
  };
}

export const FIRE_STATES = deepFreeze([
  defineState({
    section: '5.8.5.1',
    id: 'incipient-fire',
    title: 'Entstehungsbrand',
    referenceAsset: '5.8.5.1_Entstehungsbrand.svg',
    box: { xMm: 11, yMm: 4, widthMm: 10, heightMm: 24 },
    contrastPairs: FIRE_CONTRAST,
    primitives: [flame(21)],
  }),
  defineState({
    section: '5.8.5.2',
    id: 'developed-fire',
    title: 'Fortentwickelter Brand',
    referenceAsset: '5.8.5.2_fortentwickelter Brand.svg',
    box: { xMm: 6, yMm: 4, widthMm: 20, heightMm: 24 },
    contrastPairs: FIRE_CONTRAST,
    primitives: [flame(16), flame(26)],
  }),
  defineState({
    section: '5.8.5.3',
    id: 'fully-developed-fire',
    title: 'Vollbrand',
    referenceAsset: '5.8.5.3_Vollbrand.svg',
    box: { xMm: 1, yMm: 4, widthMm: 30, heightMm: 24 },
    contrastPairs: FIRE_CONTRAST,
    primitives: [flame(11), flame(21), flame(31)],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
