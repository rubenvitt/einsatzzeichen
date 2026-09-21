import type { Primitive } from '@einsatzzeichen/schema';
import { defineLeadership } from '../catalog-definition.js';

const BLACK_STROKE = {
  fill: 'none' as const,
  stroke: 'schwarz' as const,
  strokeWidth: 0.5,
};

/**
 * Die Quelle führt einen am Rahmen angeschnittenen Anschluss und vierzehn gleich lange schwarze
 * Teilstriche zwischen Körper und Außenkreuz. Die Werte sind auf Millimeter normalisiert:
 * Schritt 1,749 × 1,374 mm, sichtbarer Teil 1,166 × 0,917 mm. Einzelne Linien statt
 * importierter Pfaddaten halten die gemessene Strichfolge im gemeinsamen Primitivvertrag.
 */
function tetherDashes(): Primitive[] {
  return [
    {
      type: 'line',
      role: 'pictogram',
      x1: 1,
      y1: 21,
      x2: 1.75,
      y2: 21.59,
      style: BLACK_STROKE,
    },
    ...Array.from({ length: 14 }, (_, index) => ({
      type: 'line' as const,
      role: 'pictogram' as const,
      x1: Number((2.173 + index * 1.749).toFixed(3)),
      y1: Number((21.921 + index * 1.3741).toFixed(3)),
      x2: Number((3.339 + index * 1.749).toFixed(3)),
      y2: Number((22.838 + index * 1.3741).toFixed(3)),
      style: BLACK_STROKE,
    })),
  ];
}

const COMMAND_POST_PRIMITIVES: readonly Primitive[] = [
  {
    type: 'rect',
    role: 'pictogram',
    x: 1,
    y: 1,
    width: 30,
    height: 20,
    style: { fill: 'gelb', stroke: 'none' },
  },
  {
    type: 'rect',
    role: 'pictogram',
    x: 1,
    y: 1,
    width: 30,
    height: 20,
    style: BLACK_STROKE,
  },
  {
    type: 'rect',
    role: 'pictogram',
    x: 1,
    y: 1,
    width: 30,
    height: 3,
    style: { fill: 'schwarz', stroke: 'none' },
  },
  {
    type: 'text',
    role: 'pictogram',
    content: 'Bezeichnung',
    x: 2.673,
    y: 13,
    sizeMm: 4.243,
    anchor: 'start',
    baseline: 'alphabetic',
    boxMm: { xMm: 2.673, yMm: 9.971, widthMm: 24.3, heightMm: 3.927 },
    minRenderPx: 61,
    style: { fill: 'schwarz', stroke: 'none' },
  },
  ...tetherDashes(),
  {
    type: 'line',
    role: 'pictogram',
    x1: 26.879,
    y1: 40.879,
    x2: 31.121,
    y2: 45.121,
    style: BLACK_STROKE,
  },
  {
    type: 'line',
    role: 'pictogram',
    x1: 31.121,
    y1: 40.879,
    x2: 26.879,
    y2: 45.121,
    style: BLACK_STROKE,
  },
];

export const COMMAND_POST_PICTOGRAMS = [
  defineLeadership({
    section: 'D.1.1',
    id: 'command-post-in-operation',
    title: 'Befehlsstelle im Einsatz',
    referenceAsset: 'D.1.1_Befehlsstelle im Einsatz.svg',
    viewBox: { width: 32, height: 46 },
    box: { xMm: 1, yMm: 1, widthMm: 30.121, heightMm: 44.121 },
    primitives: COMMAND_POST_PRIMITIVES,
    contrastPairs: [
      {
        foreground: 'schwarz',
        background: 'gelb',
        context: 'schwarze Kappe, Kontur und Bezeichnung auf der gelben Befehlsstellenfläche',
      },
      {
        foreground: 'schwarz',
        background: 'surface',
        context: 'gestrichelte Verbindung und Außenkreuz auf der Ausgabeoberfläche',
      },
    ],
  }),
] as const;
