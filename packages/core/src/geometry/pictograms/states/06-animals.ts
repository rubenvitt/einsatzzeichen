import type { Point, Primitive, Style } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import { defineState, type CatalogPictogramDefinition } from '../catalog-definition.js';

/**
 * 5.8.6 Tierzustände. Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert.
 *
 * Tiersilhouette: waagerechte Ohren von x = 2 bis 6 und 26 bis 30 mm, dazwischen ein „V" mit
 * Spitze auf der Mittelachse x = 16. Beim erkrankten und toten Tier liegen die Ohren auf
 * y = 4 mm und die Spitze auf y = 29 mm; beim kontaminierten Tier ist die Silhouette um 5 mm
 * nach unten gerückt (Ohren y = 9, Spitze y = 31 mm), damit über ihr Platz für das
 * Kontaminationszeichen bleibt. Alle Striche 0,5 mm.
 */
const ANIMAL_STROKE = {
  fill: 'none',
  stroke: 'schwarz',
  strokeWidth: 0.5,
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
  return { type: 'line', role: 'pictogram', x1, y1, x2, y2, style: { ...ANIMAL_STROKE } };
}

function animalSilhouette(earY: number, tipY: number): Primitive {
  const points: readonly Point[] = [[2, earY], [6, earY], [16, tipY], [26, earY], [30, earY]];
  return {
    type: 'polyline',
    role: 'pictogram',
    points,
    closed: false,
    style: { ...ANIMAL_STROKE },
  };
}

/** Silhouette des erkrankten und toten Tiers. */
const UPPER_SILHOUETTE = (): Primitive => animalSilhouette(4, 29);
/** Silhouette des kontaminierten Tiers, 5 mm tiefer. */
const LOWER_SILHOUETTE = (): Primitive => animalSilhouette(9, 31);

/**
 * Kontaminationszeichen: zwei volle Scheiben (r = 1,75 mm) in (22,5 | 2) und (30 | 2), dazu zwei
 * sich kreuzende Striche, die unten bei y = 7 mm (x = 23 und 30) beginnen und in der jeweils
 * gegenüberliegenden Scheibe auf deren 1,5-mm-Kreis unter 45° nach innen oben enden.
 */
function contaminationMark(): readonly Primitive[] {
  const disc = (cx: number): Primitive => ({
    type: 'circle',
    role: 'pictogram',
    cx,
    cy: 2,
    r: 1.75,
    style: { ...ANIMAL_FILL },
  });
  const inset = 1.5 * Math.SQRT1_2;
  const round = (value: number): number => Math.round(value * 1000) / 1000;
  return [
    disc(22.5),
    disc(30),
    animalLine(30, 7, round(22.5 + inset), round(2 - inset)),
    animalLine(23, 7, round(30 - inset), round(2 - inset)),
  ];
}

/**
 * Buchstabe „K" in der Projektschrift: Versalhöhe 4,87 mm (Schriftgrad 7,1 mm), Grundlinie
 * y = 7 mm, zentriert auf die Mitte des Referenzbuchstabens bei x = 28,3 mm. `minRenderPx: 64`,
 * weil 7,1 mm bei 32 px nur 7,1 px effektiv ergeben.
 */
function contaminationLetter(): Primitive {
  return {
    type: 'text',
    role: 'pictogram',
    content: 'K',
    x: 28.3,
    y: 7,
    sizeMm: 7.1,
    anchor: 'middle',
    baseline: 'alphabetic',
    boxMm: { xMm: 26, yMm: 2, widthMm: 5, heightMm: 5 },
    minRenderPx: 64,
    style: { ...ANIMAL_FILL },
  };
}

export const ANIMAL_STATES = deepFreeze([
  defineState({
    section: '5.8.6.1',
    id: 'sick-animal',
    title: 'Erkranktes Tier',
    referenceAsset: '5.8.6.1_erkranktes Tier.svg',
    box: { xMm: 2, yMm: 4, widthMm: 28, heightMm: 25 },
    contrastPairs: ANIMAL_CONTRAST,
    // Krankheitsstrich auf der Mittelachse von y = 4 bis 19 mm.
    primitives: [UPPER_SILHOUETTE(), animalLine(16, 4, 16, 19)],
  }),
  defineState({
    section: '5.8.6.2',
    id: 'contaminated-animal',
    title: 'Kontaminiertes Tier',
    referenceAsset: '5.8.6.2_kontaminiertes Tier.svg',
    box: { xMm: 2, yMm: 0.25, widthMm: 29.75, heightMm: 30.75 },
    contrastPairs: ANIMAL_CONTRAST,
    // Krankheitsstrich y = 9 … 23 mm, darüber das Kontaminationszeichen.
    primitives: [LOWER_SILHOUETTE(), animalLine(16, 9, 16, 23), ...contaminationMark()],
  }),
  defineState({
    section: '5.8.6.2',
    id: 'contaminated-animal',
    variant: 'alternative',
    title: 'Kontaminiertes Tier',
    referenceAsset: '5.8.6.2_kontaminiertes Tier_K.svg',
    box: { xMm: 2, yMm: 2, widthMm: 29, heightMm: 29 },
    contrastPairs: ANIMAL_CONTRAST,
    primitives: [LOWER_SILHOUETTE(), animalLine(16, 9, 16, 23), contaminationLetter()],
  }),
  defineState({
    section: '5.8.6.3',
    id: 'dead-animal',
    title: 'Totes Tier',
    referenceAsset: '5.8.6.3_Totes Tier.svg',
    box: { xMm: 2, yMm: 0.25, widthMm: 28, heightMm: 28.75 },
    contrastPairs: ANIMAL_CONTRAST,
    // Kreuz auf der Mittelachse: Längsbalken y = 0 … 19 mm (oben um die halbe Strichstärke
    // gekürzt, damit er in der Zeichenfläche bleibt), Querbalken y = 5 mm von x = 11 bis 21.
    primitives: [
      UPPER_SILHOUETTE(),
      animalLine(16, 0.25, 16, 19),
      animalLine(11, 5, 21, 5),
    ],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
