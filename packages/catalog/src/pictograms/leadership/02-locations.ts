import type { Point, Primitive, Style } from '@einsatzzeichen/schema';
import { DEFAULT_VIEWBOX_MM } from '@einsatzzeichen/schema';
import { defineLeadership, type PictogramContrastPair } from '../catalog-definition.js';

const LOCATION_STROKE_WIDTH_MM = 0.5;

const BLACK_STROKE = Object.freeze({
  fill: 'none',
  stroke: 'schwarz',
  strokeWidth: LOCATION_STROKE_WIDTH_MM,
} satisfies Style);

const BLACK_FILL = Object.freeze({
  fill: 'schwarz',
  stroke: 'none',
} satisfies Style);

const YELLOW_CIRCLE = Object.freeze({
  fill: 'gelb',
  stroke: 'schwarz',
  strokeWidth: LOCATION_STROKE_WIDTH_MM,
} satisfies Style);

const LOCATION_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'gelb',
    context: 'schwarze Kontur und Innenmarke auf gelber Ortsfläche',
  },
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'schwarze Außenkontur auf der Ausgabeoberfläche',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

function locationCircle(cy = 16): Primitive {
  return {
    type: 'circle',
    role: 'pictogram',
    cx: 16,
    cy,
    r: 12,
    style: { ...YELLOW_CIRCLE },
  };
}

function loweredLocationCircle(): Primitive {
  return locationCircle(18);
}

/** Gemessener Giebel der abgesenkten Ortszeichen D.2.5 und D.2.7. */
function locationRoof(): Primitive {
  return {
    type: 'polyline',
    role: 'pictogram',
    points: [[3, 11], [16, 1], [29, 11]],
    style: { ...BLACK_STROKE },
  };
}

/**
 * Der Bereitstellungsrahmen besitzt in D.2.1 und D.2.2 dieselbe gewölbte Oberkante. Die zweite
 * Fassung liegt unter dem Meldekopf um 1,5 mm tiefer; ihre Bodenlinie ist um 1 mm abgesenkt.
 */
function stagingFrame(withReportingHead: boolean): Primitive {
  const top = withReportingHead ? 12.55 : 11.06;
  const controlY = withReportingHead ? 14.7 : 13.2;
  const bottom = withReportingHead ? 22 : 21;
  return {
    type: 'path',
    role: 'pictogram',
    d: `M 8 ${bottom} H 24 V ${top} C 19 ${controlY} 13 ${controlY} 8 ${top} Z`,
    style: { ...BLACK_STROKE },
  };
}

function locationText(
  content: string,
  options: {
    x: number;
    y: number;
    sizeMm: number;
    boxMm: { xMm: number; yMm: number; widthMm: number; heightMm: number };
    minRenderPx: number;
  },
): Primitive {
  return {
    type: 'text',
    role: 'pictogram',
    content,
    x: options.x,
    y: options.y,
    sizeMm: options.sizeMm,
    anchor: 'middle',
    baseline: 'alphabetic',
    boxMm: { ...options.boxMm },
    minRenderPx: options.minRenderPx,
    style: { ...BLACK_FILL },
  };
}

/** Zwei zur Kreismitte weisende Dreiecke; D.2.7 übernimmt sie mit dem abgesenkten Mittelpunkt. */
function landingTriangles(cy: number): readonly Primitive[] {
  const left: readonly Point[] = [[7, cy - 3], [16, cy], [7, cy + 3]];
  const right: readonly Point[] = [[25, cy - 3], [25, cy + 3], [16, cy]];
  return [left, right].map((points) => ({
    type: 'polyline' as const,
    role: 'pictogram' as const,
    points,
    closed: true,
    style: { ...BLACK_FILL },
  }));
}

export const LOCATION_PICTOGRAMS = [
  defineLeadership({
    section: 'D.2.1',
    id: 'staging-area',
    title: 'Bereitstellungsraum',
    referenceAsset: 'D.2.1_Bereitstellungsraum.svg',
    viewBox: DEFAULT_VIEWBOX_MM,
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
    primitives: [locationCircle(), stagingFrame(false)],
    contrastPairs: LOCATION_CONTRAST,
  }),
  defineLeadership({
    section: 'D.2.2',
    id: 'staging-area-with-reporting-head',
    title: 'Bereitstellungsraum mit Meldekopf',
    referenceAsset: 'D.2.2_Bereitstellungsraum mit Meldekopf.svg',
    viewBox: DEFAULT_VIEWBOX_MM,
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
    primitives: [
      locationCircle(),
      stagingFrame(true),
      locationText('M', {
        x: 16,
        y: 12,
        sizeMm: 6.5,
        boxMm: { xMm: 13.654, yMm: 7.131, widthMm: 4.693, heightMm: 4.869 },
        minRenderPx: 64,
      }),
    ],
    contrastPairs: LOCATION_CONTRAST,
  }),
  defineLeadership({
    section: 'D.2.3',
    id: 'reporting-head',
    title: 'Meldekopf',
    referenceAsset: 'D.2.3_Meldekopf.svg',
    viewBox: DEFAULT_VIEWBOX_MM,
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
    primitives: [
      locationCircle(),
      locationText('M', {
        x: 16,
        y: 19,
        sizeMm: 10,
        boxMm: { xMm: 12.481, yMm: 11.698, widthMm: 7.037, heightMm: 7.302 },
        minRenderPx: 32,
      }),
    ],
    contrastPairs: LOCATION_CONTRAST,
  }),
  defineLeadership({
    section: 'D.2.4',
    id: 'guide-post',
    title: 'Lotsenstelle',
    referenceAsset: 'D.2.4_Lotsenstelle.svg',
    viewBox: DEFAULT_VIEWBOX_MM,
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
    primitives: [
      locationCircle(),
      locationText('L', {
        x: 16.365,
        y: 19,
        sizeMm: 10,
        boxMm: { xMm: 14.375, yMm: 12.125, widthMm: 4.4375, heightMm: 6.875 },
        minRenderPx: 32,
      }),
    ],
    contrastPairs: LOCATION_CONTRAST,
  }),
  defineLeadership({
    section: 'D.2.5',
    id: 'control-center',
    title: 'Leitstelle',
    referenceAsset: 'D.2.5_Leitstelle.svg',
    viewBox: DEFAULT_VIEWBOX_MM,
    box: { xMm: 3, yMm: 1, widthMm: 26, heightMm: 29 },
    primitives: [
      loweredLocationCircle(),
      locationRoof(),
      locationText('LtS', {
        x: 16.238,
        y: 22,
        sizeMm: 10,
        boxMm: { xMm: 9.5625, yMm: 15, widthMm: 13.75, heightMm: 7.125 },
        minRenderPx: 32,
      }),
    ],
    contrastPairs: LOCATION_CONTRAST,
  }),
  defineLeadership({
    section: 'D.2.6',
    id: 'helicopter-landing-zone',
    title: 'Hubschrauberlandezone',
    referenceAsset: 'D.2.6_Hubschrauberlandezone.svg',
    viewBox: DEFAULT_VIEWBOX_MM,
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
    primitives: [locationCircle(), ...landingTriangles(16)],
    contrastPairs: LOCATION_CONTRAST,
  }),
  defineLeadership({
    section: 'D.2.7',
    id: 'helicopter-landing-site',
    title: 'Hubschrauberlandeplatz',
    referenceAsset: 'D.2.7_Hubschrauberlandeplatz.svg',
    viewBox: DEFAULT_VIEWBOX_MM,
    box: { xMm: 3, yMm: 1, widthMm: 26, heightMm: 29 },
    primitives: [loweredLocationCircle(), locationRoof(), ...landingTriangles(18)],
    contrastPairs: LOCATION_CONTRAST,
  }),
] as const;
