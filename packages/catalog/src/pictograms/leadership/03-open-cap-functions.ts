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
 * Gemeinsame, rein geometrische Fassung der offenen Kappe. Sie ist keine oeffentliche
 * Funktionsachse: D.3.14 und D.3.15 bleiben zwei getrennte Leadership-Definitionen.
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
      points: [[16, 2.647], [29.354, 16], [16, 29.354], [2.647, 16]],
      closed: true,
      style: { ...BLACK_STROKE },
    },
    {
      type: 'line',
      role: 'pictogram',
      x1: 11.603,
      y1: 7.75,
      x2: 20.396,
      y2: 7.75,
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
    box: { xMm: 2.397, yMm: 2.397, widthMm: 29.105, heightMm: 27.207 },
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
    box: { xMm: 2.397, yMm: 2.397, widthMm: 28.603, heightMm: 27.207 },
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
