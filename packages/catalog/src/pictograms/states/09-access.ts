import type { Primitive, Style } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import {
  defineState,
  type CatalogPictogramDefinition,
  type PictogramContrastPair,
} from '../catalog-definition.js';

/**
 * 5.8.9 Zugang. Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert: alle
 * Striche der Referenz sind 0,5 mm breit (1,417 pt) und laufen senkrecht von y = 2 bis 30 mm.
 * Die Strichstärke steht hier ausdrücklich, statt sie aus einem geteilten Helfer zu erben.
 */
const ACCESS_STROKE = {
  fill: 'none',
  stroke: 'schwarz',
  strokeWidth: 0.5,
} as const satisfies Style;

const ACCESS_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'Verkehrs- oder Zugangssymbol auf Ausgabeoberfläche',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

function accessLine(x1: number, y1: number, x2: number, y2: number): Primitive {
  return { type: 'line', role: 'pictogram', x1, y1, x2, y2, style: { ...ACCESS_STROKE } };
}

function accessPolyline(points: readonly (readonly [number, number])[]): Primitive {
  return { type: 'polyline', role: 'pictogram', points, closed: false, style: { ...ACCESS_STROKE } };
}

/** Senkrechter Fahrbahnstrich über die volle Zeichenhöhe (y = 2 … 30 mm). */
function laneLine(x: number): Primitive {
  return accessLine(x, 2, x, 30);
}

export const ACCESS_STATES = deepFreeze([
  defineState({
    section: '5.8.9.1',
    id: 'route-closed',
    title: 'Gesperrt',
    referenceAsset: '5.8.9.1_Gesperrt.svg',
    box: { xMm: 10, yMm: 2, widthMm: 12, heightMm: 28 },
    contrastPairs: ACCESS_CONTRAST,
    // Mittellinie x = 16 und zwei Sperrarme, die sich in (16 | 16) kreuzen: (10 | 11) ↔ (22 | 21).
    primitives: [laneLine(16), accessLine(10, 11, 22, 21), accessLine(22, 11, 10, 21)],
  }),
  defineState({
    section: '5.8.9.2',
    id: 'one-way-traffic',
    title: 'Einbahnstraßenregelung',
    referenceAsset: '5.8.9.2_Einbahnstraßenregelung.svg',
    box: { xMm: 14, yMm: 2, widthMm: 8, heightMm: 28 },
    contrastPairs: ACCESS_CONTRAST,
    // Fahrbahnstrich x = 14; Richtungsstrich x = 18 von y = 27 bis 5 mit Halbpfeil nach (22 | 13).
    primitives: [laneLine(14), accessPolyline([[18, 27], [18, 5], [22, 13]])],
  }),
  defineState({
    section: '5.8.9.3',
    id: 'route-difficult-to-pass',
    title: 'Schwierig befahrbar - teilblockiert',
    referenceAsset: '5.8.9.3_Schwierig befahrbar_Teilblockiert.svg',
    box: { xMm: 14, yMm: 2, widthMm: 4, heightMm: 28 },
    contrastPairs: ACCESS_CONTRAST,
    // Zwei Fahrbahnstriche im Abstand 4 mm um die Zeichenmitte.
    primitives: [laneLine(14), laneLine(18)],
  }),
  defineState({
    section: '5.8.9.4',
    id: 'route-impassable',
    title: 'Unbefahrbar - blockiert',
    referenceAsset: '5.8.9.4_Unbefahrbar_Blockiert.svg',
    box: { xMm: 10, yMm: 2, widthMm: 12, heightMm: 28 },
    contrastPairs: ACCESS_CONTRAST,
    // Vier Fahrbahnstriche im gleichen Abstand von 4 mm, symmetrisch zur Zeichenmitte.
    primitives: [laneLine(10), laneLine(14), laneLine(18), laneLine(22)],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
