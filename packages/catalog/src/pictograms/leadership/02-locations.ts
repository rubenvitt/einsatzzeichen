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

/** Schwarze Kreiskappe der Leitstelle D.2.5 zwischen Außenkante y=5,75 und Sehne y=10. */
function controlCenterCap(): Primitive {
  return {
    type: 'path',
    role: 'pictogram',
    d:
      'M 6.724 10 H 25.277 C 22.95 7.302 19.564 5.75 16 5.75 ' +
      'C 12.436 5.75 9.05 7.302 6.724 10 Z',
    style: { ...BLACK_FILL },
  };
}

/**
 * Der Bereitstellungsrahmen besitzt in D.2.1 und D.2.2 dieselbe gewölbte Oberkante. Die zweite
 * Fassung liegt unter dem Meldekopf um 1,5 mm tiefer; ihre Bodenlinie ist um 1 mm abgesenkt.
 *
 * Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert: Mittellinie des
 * 0,5-mm-Strichs bei x = 8 und 24 mm, Boden bei 21 bzw. 22 mm, Ecken der Oberkante bei 11 bzw.
 * 12,5 mm. Die Oberkante hängt zur Mitte um 1,5 mm durch (Referenz 12,5 bzw. 14 mm) und steigt an
 * den Ecken mit der Steigung ≈ 0,43 an; eine symmetrische Kubik mit den Stützpunkten 2 mm unter
 * den Ecken und 4,7 mm nach innen ergibt genau diesen Durchhang (¼ · 0 + ¾ · 2 = 1,5 mm).
 */
function stagingFrame(withReportingHead: boolean): Primitive {
  const top = withReportingHead ? 12.5 : 11;
  const controlY = top + 2;
  const bottom = withReportingHead ? 22 : 21;
  return {
    type: 'path',
    role: 'pictogram',
    d: `M 8 ${bottom} H 24 V ${top} C 19.3 ${controlY} 12.7 ${controlY} 8 ${top} Z`,
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
        // Versalhöhe der Referenz 4,87 mm ÷ Arimo-Versalhöhe 0,688 em.
        sizeMm: 7.08,
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
        // Versalhöhe der Referenz 7,30 mm ÷ Arimo-Versalhöhe 0,688 em.
        sizeMm: 10.6,
        boxMm: { xMm: 12.4, yMm: 11.698, widthMm: 7.2, heightMm: 7.302 },
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
        // Arimo ist im „L“ rund 13 % breiter als die Referenzschrift; bei voller Versalhöhe
        // (10,6 mm) wächst die Abweichung, deshalb bleibt der Lauf bei 10 mm auf der
        // Stammposition der Referenz (am Pixelvergleich bestimmt).
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
      controlCenterCap(),
      locationRoof(),
      locationText('LtS', {
        // Wie D.2.4: „LtS“ ist in Arimo rund 14 % breiter als in der Referenzschrift; 10 mm mit
        // der am Pixelvergleich bestimmten Lage deckt besser als die volle Versalhöhe.
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
