import {
  DEFAULT_VIEWBOX_MM,
  DEFAULT_STROKE_WIDTH_MM,
  type ColorToken,
  type Primitive,
  type Style,
} from '@einsatzzeichen/schema';
import { defineLeadership, type PictogramContrastPair } from '../catalog-definition.js';

const BLACK_STROKE = Object.freeze({
  fill: 'none',
  stroke: 'schwarz',
  strokeWidth: DEFAULT_STROKE_WIDTH_MM,
} satisfies Style);

const DIAMOND_SIDE_MM = 13 * Math.SQRT2;

/**
 * Gemeinsame, rein geometrische Fassung der offenen Kappe. Sie ist keine öffentliche
 * Funktionsachse: D.3.14 und D.3.15 bleiben zwei getrennte Leadership-Definitionen.
 *
 * Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert: Die Raute ist ein 0,5-mm-
 * Strich, dessen Mittellinie die Ecken bei 3 und 29 mm hat (Außenkante der Referenz 2,65 mm,
 * Innenkante 3,35 mm). Die Kappenlinie liegt mittig zwischen Kappenöffnung (7,75 mm) und
 * Körperoberkante (8,25 mm), also auf 8 mm, und läuft von Rautenkante zu Rautenkante.
 */
function openCapBody(fill: ColorToken): readonly Primitive[] {
  return [
    {
      type: 'rect',
      role: 'pictogram',
      x: 16 - DIAMOND_SIDE_MM / 2,
      y: 16 - DIAMOND_SIDE_MM / 2,
      width: DIAMOND_SIDE_MM,
      height: DIAMOND_SIDE_MM,
      transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
      style: { fill, stroke: 'none' },
    },
    {
      type: 'polyline',
      role: 'pictogram',
      points: [[16, 3], [29, 16], [16, 29], [3, 16]],
      closed: true,
      style: { ...BLACK_STROKE },
    },
    {
      type: 'line',
      role: 'pictogram',
      x1: 11,
      y1: 8,
      x2: 21,
      y2: 8,
      style: { ...BLACK_STROKE },
    },
  ];
}

function text(
  content: string,
  x: number,
  y: number,
  sizeMm: number,
  anchor: 'middle' | 'end',
  boxMm: { xMm: number; yMm: number; widthMm: number; heightMm: number },
  minRenderPx: number,
  fill: ColorToken,
): Primitive {
  return {
    type: 'text',
    role: 'pictogram',
    content,
    x,
    y,
    sizeMm,
    anchor,
    baseline: 'alphabetic',
    boxMm,
    minRenderPx,
    style: { fill, stroke: 'none' },
  };
}

const THW_CONTRAST = [
  {
    foreground: 'weiss',
    background: 'blau',
    context: 'weisser THW-Rollenlauf auf der blauen Funktionsflaeche',
  },
  {
    foreground: 'schwarz',
    background: 'blau',
    context: 'schwarze offene Kappenschulter auf der blauen Funktionsflaeche',
  },
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'schwarze offene Kappe, Kontur und Traegerlauf auf der Ausgabeoberflaeche',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

const RED_CROSS_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'weiss',
    context: 'schwarzer RKB-Rollenlauf auf der weissen Funktionsflaeche',
  },
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'schwarze offene Kappe, Kontur und Traegerlauf auf der Ausgabeoberflaeche',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

export const OPEN_CAP_FUNCTION_PICTOGRAMS = [
  defineLeadership({
    section: 'D.3.14',
    id: 'technical-advisor-thw',
    title: 'Fachberater THW',
    referenceAsset: 'D.3.14_Fachberater THW.svg',
    viewBox: DEFAULT_VIEWBOX_MM,
    box: { xMm: 2.75, yMm: 2.75, widthMm: 28.75, heightMm: 26.5 },
    primitives: [
      ...openCapBody('blau'),
      text(
        'THW', 16, 18.5, 7.08, 'middle',
        { xMm: 8, yMm: 13.2, widthMm: 16.1, heightMm: 5.8 }, 37, 'weiss',
      ),
      text(
        'stv OB', 31.5, 29, 4.243, 'end',
        { xMm: 18.8, yMm: 25.6, widthMm: 12.7, heightMm: 3.65 }, 61, 'schwarz',
      ),
    ],
    contrastPairs: THW_CONTRAST,
  }),
  defineLeadership({
    section: 'D.3.15',
    id: 'red-cross-commissioner',
    title: 'Rotkreuzbeauftragter',
    referenceAsset: 'D.3.15_Rotkreuzbeauftragter.svg',
    viewBox: DEFAULT_VIEWBOX_MM,
    box: { xMm: 2.75, yMm: 2.75, widthMm: 28.25, heightMm: 26.5 },
    primitives: [
      ...openCapBody('weiss'),
      text(
        'RKB', 16, 18.5, 7.08, 'middle',
        { xMm: 9.2, yMm: 13.2, widthMm: 13.8, heightMm: 5.8 }, 37, 'schwarz',
      ),
      text(
        'DRK', 31, 29, 4.243, 'end',
        { xMm: 22.3, yMm: 25.6, widthMm: 8.7, heightMm: 3.65 }, 61, 'schwarz',
      ),
    ],
    contrastPairs: RED_CROSS_CONTRAST,
  }),
] as const;
