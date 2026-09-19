import {
  DEFAULT_STROKE_WIDTH_MM,
  type Point,
  type Primitive,
  type Style,
} from '@einsatzzeichen/schema';
import {
  defineWaterRescuePersonnel,
  type CatalogPictogramDefinition,
  type PictogramContrastPair,
} from '../catalog-definition.js';

/**
 * Wasserrettungspersonal I.5.4 bis I.5.8. Maße an der Referenz abgelesen, Geometrie eigenständig
 * konstruiert: alle Konturen sind 0,5-mm-Striche auf ihrer Mittellinie, die Flächen echte
 * Füllungen.
 *
 * - Raute: halbe Diagonale 13 mm (Außenkante der Referenz 26,71 mm breit, abzüglich Strich),
 *   Mitte x = 16 mm, y = 18 mm bei den Führern (Kopfzone darüber) und y = 16 mm beim Fachberater.
 *   Nur die Außenkontur sitzt in der Referenz 0,022 mm höher (Spitzen außen bei 4,624 und
 *   31,331 mm); diese Messung ist übernommen, weil die lange Diagonale sonst über die ganze Länge
 *   einen Pixelsaum gegen die Referenz zieht. Füllung, Kappe, Wellen und Innenraute liegen auf
 *   dem runden Raster um 18 bzw. 16 mm.
 * - Führer I.5.4 bis I.5.7: schwarze, gefüllte Kappe von der Spitze bis zur Schulterlinie
 *   5 mm darunter (y = 10 mm).
 * - Fachberater I.5.8: offene Kappe wie D.3.14/D.3.15 — ein waagerechter Strich 5 mm unter der
 *   Spitze (y = 8 mm) von Rautenkante zu Rautenkante.
 * - Zwei Wellen, je zwei Perioden von 4 mm zwischen x = 12 und 20 mm, 1 mm Hub (Wellental 4,5 mm,
 *   Wellenberg 3,5 mm unter der Rautenmitte, zweite Welle 2 mm tiefer).
 * - Innenraute: halbe Diagonale 4 mm, Mitte 3 mm unter der Rautenmitte.
 */
const STROKE = Object.freeze({
  fill: 'none',
  stroke: 'schwarz',
  strokeWidth: DEFAULT_STROKE_WIDTH_MM,
} satisfies Style);

const BLACK_FILL = Object.freeze({
  fill: 'schwarz',
  stroke: 'none',
} satisfies Style);

const WATER_RESCUE_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'weiss',
    context: 'schwarze Führungs-, Wasser- und Innengeometrie auf dem weißen Rautenfeld',
  },
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'schwarze Außenkontur und Kopfmarke auf der Ausgabeoberfläche',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

const HALF_DIAGONAL_MM = 13;
const CAP_DEPTH_MM = 5;

function diamond(cx: number, cy: number, half: number): readonly Point[] {
  const r = (value: number): number => Number(value.toFixed(3));
  return [[cx, r(cy - half)], [r(cx + half), cy], [cx, r(cy + half)], [r(cx - half), cy]];
}

/**
 * Eine Welle als Strich: Täler bei x = 12, 16, 20 mm, Berge bei 14 und 18 mm. Jede halbe Periode
 * ist eine Kubik mit waagerechten Tangenten an Tal und Berg; die Stützpunkte liegen 0,73 mm nach
 * innen, damit die Steigung in der Mitte der einer Sinuswelle gleicher Höhe entspricht
 * (0,5 · π / 2 ≈ 0,785).
 */
function wave(troughY: number): Primitive {
  const crestY = troughY - 1;
  const segments: string[] = [];
  for (let index = 0; index < 4; index += 1) {
    const x0 = 12 + index * 2;
    const [from, to] = index % 2 === 0 ? [troughY, crestY] : [crestY, troughY];
    segments.push(`C ${x0 + 0.73} ${from} ${x0 + 1.27} ${to} ${x0 + 2} ${to}`);
  }
  return {
    type: 'path',
    role: 'pictogram',
    d: `M 12 ${troughY} ${segments.join(' ')}`,
    style: { ...STROKE },
  };
}

/** Rautenkörper mit Kappe, Wellen und Innenraute um die Mitte (16, cy). */
function waterRescueBody(advisor: boolean): readonly Primitive[] {
  const cy = advisor ? 16 : 18;
  const outlineCy = cy - 0.022;
  // Auf 0,001 mm gerundet, damit keine Gleitkommareste (4,978000…0015) in der IR landen.
  const top = Number((outlineCy - HALF_DIAGONAL_MM).toFixed(3));
  // Schulterlinie 5 mm unter der Spitze (Fachberater: Strich auf 8 mm; Führer: Kappenunterkante
  // auf 10 mm).
  const shoulderY = cy - 8;
  const cap: Primitive = advisor
    ? {
        type: 'line', role: 'pictogram',
        x1: 16 - CAP_DEPTH_MM, y1: shoulderY, x2: 16 + CAP_DEPTH_MM, y2: shoulderY,
        style: { ...STROKE },
      }
    : {
        type: 'polyline', role: 'pictogram',
        points: [[16, top], [16 + CAP_DEPTH_MM, shoulderY], [16 - CAP_DEPTH_MM, shoulderY]],
        closed: true,
        style: { ...BLACK_FILL },
      };
  return [
    {
      type: 'polyline', role: 'pictogram', points: diamond(16, outlineCy, HALF_DIAGONAL_MM), closed: true,
      style: { ...STROKE, fill: 'weiss' },
    },
    cap,
    wave(cy - 4.5),
    wave(cy - 2.5),
    {
      type: 'polyline', role: 'pictogram', points: diamond(16, cy + 3, 4), closed: true,
      style: { ...STROKE },
    },
  ];
}

/** Kopfkreis der Führungsstärke: Durchmesser 3 mm, Mitte 2,5 mm unter der Oberkante. */
function headCircle(cx: number): Primitive {
  return {
    type: 'circle', role: 'pictogram', cx, cy: 2.5, r: 1.5,
    style: { ...BLACK_FILL },
  };
}

export const WATER_RESCUE_PERSONNEL_PICTOGRAMS = [
  defineWaterRescuePersonnel({
    section: 'I.5.4',
    id: 'team-leader',
    title: 'Truppführer Wasserrettungstrupp',
    referenceAsset: 'I.5.4_Truppführer Wasserrettungstrupp.svg',
    box: { xMm: 2.75, yMm: 1, widthMm: 26.5, heightMm: 30.25 },
    primitives: [...waterRescueBody(false), headCircle(16)],
    contrastPairs: WATER_RESCUE_CONTRAST,
  }),
  defineWaterRescuePersonnel({
    section: 'I.5.5',
    id: 'group-leader',
    title: 'Gruppenführer Wasserrettungsgruppe',
    referenceAsset: 'I.5.5_Gruppenführer Wasserrettungsgruppe.svg',
    box: { xMm: 2.75, yMm: 1, widthMm: 26.5, heightMm: 30.25 },
    primitives: [...waterRescueBody(false), headCircle(11), headCircle(21)],
    contrastPairs: WATER_RESCUE_CONTRAST,
  }),
  defineWaterRescuePersonnel({
    section: 'I.5.6',
    id: 'platoon-leader',
    title: 'Zugführer Wasserrettungszug',
    referenceAsset: 'I.5.6_Zugführer Wasserrettungszug.svg',
    box: { xMm: 2.75, yMm: 1, widthMm: 26.5, heightMm: 30.25 },
    primitives: [...waterRescueBody(false), headCircle(11), headCircle(16), headCircle(21)],
    contrastPairs: WATER_RESCUE_CONTRAST,
  }),
  defineWaterRescuePersonnel({
    section: 'I.5.7',
    id: 'formation-leader',
    title: 'Verbandsführer Wasserrettungsverband',
    referenceAsset: 'I.5.7_Verbandsführer Wasserrettungsverband.svg',
    box: { xMm: 2.75, yMm: 0.25, widthMm: 26.5, heightMm: 31 },
    primitives: [
      ...waterRescueBody(false),
      // Senkrechter Verbandsbalken 1,5 mm breit mittig über der Rautenspitze. Die Referenz lässt
      // ihn am Blattrand (y = 0) beginnen; das Clipping-Gate schlägt die halbe Strichbreite der
      // Raute pauschal auf die ganze Box auf, deshalb beginnt er hier 0,25 mm tiefer.
      {
        type: 'rect', role: 'pictogram', x: 15.25, y: 0.25, width: 1.5, height: 3.75,
        style: { ...BLACK_FILL },
      },
    ],
    contrastPairs: WATER_RESCUE_CONTRAST,
  }),
  defineWaterRescuePersonnel({
    section: 'I.5.8',
    id: 'technical-advisor',
    title: 'Fachberater Wasserrettung',
    referenceAsset: 'I.5.8_Fachberater Wasserrettung.svg',
    box: { xMm: 2.75, yMm: 2.75, widthMm: 26.5, heightMm: 26.5 },
    primitives: waterRescueBody(true),
    contrastPairs: WATER_RESCUE_CONTRAST,
  }),
] as const satisfies readonly CatalogPictogramDefinition[];
