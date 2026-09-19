import type { ColorToken, Point, Primitive, Style } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import {
  defineState,
  type CatalogPictogramDefinition,
  type PictogramContrastPair,
} from '../catalog-definition.js';
import {
  STATE_STROKE_WIDTH_MM,
  arcCommands,
  polarPoint,
  stateCircle,
  stateLine,
  statePath,
  statePolygon,
  statePolyline,
  stateText,
} from './authoring.js';

/**
 * Taktik- und Gefahrenzeichen 5.8.1. Maße an der Referenz abgelesen, Geometrie eigenständig
 * konstruiert.
 *
 * Die Referenz zeichnet ausschließlich in Rot und Hellblau: jeder Strich ist 0,5 mm stark und
 * hat keine schwarze Kontur. Warndreiecke sind weiß gefüllt.
 */
const round3 = (value: number): number => Math.round(value * 1000) / 1000;

function strokeStyle(color: ColorToken, width = STATE_STROKE_WIDTH_MM): Style {
  return { fill: 'none', stroke: color, strokeWidth: width };
}

const RED_FILL: Style = { fill: 'rot', stroke: 'none' };

/** Großes Warndreieck: Ecken (1, 28), (16, 3), (31, 28), weiß gefüllt. */
const HAZARD_TRIANGLE: readonly Point[] = [[1, 28], [16, 3], [31, 28]];
/** Kleines, nach rechts gerücktes Warndreieck der Hinweisvarianten: (7,5, 25), (19, 6), (30,5, 25). */
const NOTICE_TRIANGLE: readonly Point[] = [[7.5, 25], [19, 6], [30.5, 25]];

function triangle(points: readonly Point[], color: ColorToken): Primitive {
  return statePolygon(points, { fill: 'weiss', stroke: color, strokeWidth: STATE_STROKE_WIDTH_MM });
}

const TACTICAL_CONTRAST = [
  {
    foreground: 'rot',
    background: 'surface',
    context: 'Rote Taktikmarke auf Ausgabeoberfläche',
  },
  {
    foreground: 'hellblau',
    background: 'surface',
    context: 'Hellblaue Taktikmarke auf Ausgabeoberfläche',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

const WATER_CONTRAST = [
  {
    foreground: 'hellblau',
    background: 'surface',
    context: 'Hellblaue Außenkontur des Wasserzeichens',
  },
  {
    foreground: 'hellblau',
    background: 'weiss',
    context: 'Hellblaue Wellen auf weißer Innenfläche',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

const SIGNAL_CONTRAST = [
  {
    foreground: 'rot',
    background: 'surface',
    context: 'Rote Außenkontur des Warndreiecks',
  },
  {
    foreground: 'rot',
    background: 'weiss',
    context: 'Rotes Gefahrsymbol auf weißer Innenfläche',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

const NOTICE_CONTRAST = [
  {
    foreground: 'rot',
    background: 'surface',
    context: 'Rotes Hinweiszeichen auf Ausgabeoberfläche',
  },
  {
    foreground: 'rot',
    background: 'weiss',
    context: 'Rote Kontur um die weiße Dreiecksfläche',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

const FREE_SIGNAL_CONTRAST = [
  {
    foreground: 'rot',
    background: 'surface',
    context: 'Freistehendes rotes Hinweiszeichen',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

/*
 * 5.8.1.1–5.8.1.4 Einsatztaktik: eine Klammer und ein Umrisspfeil, beide 0,5 mm.
 * Klammer: 4 mm tief, Schenkel von y = 4 bis 7 und 25 bis 28, Rücken von y = 7 bis 25.
 * Pfeil (Beginn bei x = s): die Schaftkanten laufen gebogen von (s, 8) bzw. (s, 24) nach
 * (s + 13, 11) bzw. (s + 13, 21), die Spitze ist ein rechter Winkel mit Scheitel (s + 21, 16),
 * dessen Schenkel bei y = 8 und 24 senkrecht auf die Schaftkanten zurückspringen.
 */
function tacticalBracket(spineX: number, opensRight: boolean, color: ColorToken): Primitive {
  const tipX = spineX + (opensRight ? 4 : -4);
  return statePolyline(
    [[tipX, 4], [spineX, 7], [spineX, 25], [tipX, 28]],
    false,
    strokeStyle(color),
  );
}

function tacticalArrow(startX: number, color: ColorToken): Primitive {
  const x = (offset: number): number => round3(startX + offset);
  return statePath(
    `M ${x(0)} 8 C ${x(4.1)} 10.05 ${x(8.1)} 11 ${x(13)} 11 L ${x(13)} 8 L ${x(21)} 16 ` +
      `L ${x(13)} 24 L ${x(13)} 21 C ${x(8.1)} 21 ${x(4.1)} 21.95 ${x(0)} 24`,
    strokeStyle(color),
  );
}

interface TacticGeometry {
  /** x des Klammerrückens, Öffnungsrichtung und Farbe. */
  readonly spineX: number;
  readonly opensRight: boolean;
  readonly bracketColor: ColorToken;
  /** x des Pfeilbeginns und Farbe. */
  readonly arrowX: number;
  readonly arrowColor: ColorToken;
}

const TACTICS = {
  rescue: { spineX: 4, opensRight: true, bracketColor: 'rot', arrowX: 8, arrowColor: 'hellblau' },
  attack: { spineX: 28, opensRight: false, bracketColor: 'rot', arrowX: 4, arrowColor: 'hellblau' },
  defense: { spineX: 26, opensRight: true, bracketColor: 'hellblau', arrowX: 3, arrowColor: 'rot' },
  retreat: { spineX: 6, opensRight: false, bracketColor: 'rot', arrowX: 9, arrowColor: 'hellblau' },
} as const satisfies Record<string, TacticGeometry>;

function tacticalPrimitives(kind: keyof typeof TACTICS): readonly Primitive[] {
  const tactic: TacticGeometry = TACTICS[kind];
  return [
    tacticalBracket(tactic.spineX, tactic.opensRight, tactic.bracketColor),
    tacticalArrow(tactic.arrowX, tactic.arrowColor),
  ];
}

/*
 * 5.8.1.5 Überschwemmtes Gebiet: weißes Oval 1…31 × 4…28 mm (vier Kubiken, Hebel 6 bzw. 9 mm),
 * vier Wellenlinien und ein „W". Eine Welle besteht aus Halbwellen von 8/3 mm Breite und 2 mm
 * Höhe; jede Halbwelle ist eine Kubik mit beiden Kontrollpunkten auf ihrer Mitte.
 */
function wave(startX: number, startY: number, otherY: number, halfWaves: number): string {
  const width = 8 / 3;
  const commands = [`M ${startX} ${startY}`];
  let y = startY;
  for (let index = 0; index < halfWaves; index += 1) {
    const from = startX + index * width;
    const next = y === startY ? otherY : startY;
    const middle = round3(from + width / 2);
    commands.push(`C ${middle} ${y} ${middle} ${next} ${round3(from + width)} ${next}`);
    y = next;
  }
  return commands.join(' ');
}

function floodedAreaPrimitives(): readonly Primitive[] {
  const blue = strokeStyle('hellblau');
  return [
    statePath(
      'M 1 16 C 1 10 7 4 16 4 C 25 4 31 10 31 16 C 31 22 25 28 16 28 C 7 28 1 22 1 16 Z',
      { fill: 'weiss', stroke: 'hellblau', strokeWidth: STATE_STROKE_WIDTH_MM },
    ),
    statePath(wave(8, 9, 7, 6), blue),
    statePath(wave(3, 17, 15, 3), blue),
    statePath(wave(21, 15, 17, 3), blue),
    statePath(wave(8, 24, 22, 6), blue),
    statePolyline([[12, 12], [14, 18], [16, 12], [18, 18], [20, 12]], false, blue),
  ];
}

/*
 * 5.8.1.6 Gefahr durch Wassereinbruch: hellblaues Warndreieck mit zwei spiegelsymmetrischen
 * Wellen um x = 16. Obere Welle: Aufschwung von (9, 20) auf den Kamm (11, 18), Tal (16, 22);
 * untere Welle: von (9, 24) auf den Kamm (11, 21), Tal (16, 25). Die linke Hälfte ist aus
 * Kubiken gebaut, die rechte gespiegelt.
 */
type Cubic = readonly [Point, Point, Point];

function mirroredWave(start: Point, leftHalf: readonly Cubic[]): string {
  const mirror = ([x, y]: Point): Point => [round3(32 - x), y];
  const commands = [`M ${start[0]} ${start[1]}`];
  const format = (points: readonly Point[]): string =>
    `C ${points.map(([x, y]) => `${x} ${y}`).join(' ')}`;
  for (const cubic of leftHalf) commands.push(format(cubic));
  const starts: Point[] = [start, ...leftHalf.map((cubic) => cubic[2])];
  for (let index = leftHalf.length - 1; index >= 0; index -= 1) {
    const [c1, c2] = leftHalf[index]!;
    commands.push(format([mirror(c2), mirror(c1), mirror(starts[index]!)]));
  }
  return commands.join(' ');
}

function waterIngressPrimitives(): readonly Primitive[] {
  const blue = strokeStyle('hellblau');
  return [
    triangle(HAZARD_TRIANGLE, 'hellblau'),
    statePath(
      mirroredWave([9, 20], [
        [[9.28, 18.7], [10, 18], [11, 18]],
        [[12.7, 18], [13.3, 19.1], [13.85, 20.15]],
        [[14.35, 21.1], [14.8, 22], [16, 22]],
      ]),
      blue,
    ),
    statePath(
      mirroredWave([9, 24], [
        [[9, 21.3], [10.25, 21], [11, 21]],
        [[12.1, 21], [12.6, 21.9], [13.15, 22.8]],
        [[13.75, 23.9], [14.4, 25], [16, 25]],
      ]),
      blue,
    ),
  ];
}

/*
 * Kennbuchstaben im Warndreieck (5.8.1.7, 5.8.1.8, 5.8.1.10, 5.8.1.11): Projektschrift fett,
 * rot, Grundlinie an der Referenz abgelesen. Die Referenzschrift ist eine schmale fette Grotesk;
 * Schriftgrad und Mitte sind so gewählt, dass Versalhöhe und Laufbreite zusammen am besten
 * decken (Pixelvergleich). Arimo Bold ist breiter, deshalb liegt der Grad unter dem, den die
 * Versalhöhe allein ergäbe.
 */
function hazardText(
  content: string,
  x: number,
  y: number,
  sizeMm: number,
  boxMm: { xMm: number; yMm: number; widthMm: number; heightMm: number },
): Primitive {
  return stateText(content, { x, y, sizeMm, boxMm, fill: 'rot', fontWeight: 700 });
}

function hazardousSubstancesPrimaryPrimitives(): readonly Primitive[] {
  return [
    triangle(HAZARD_TRIANGLE, 'rot'),
    hazardText('GS', 16.1, 24, 8.4, { xMm: 10, yMm: 17.8, widthMm: 12.2, heightMm: 6.6 }),
  ];
}

function hazardousSubstancesAlternativePrimitives(): readonly Primitive[] {
  return [
    triangle(HAZARD_TRIANGLE, 'rot'),
    hazardText('Chlor', 15.9, 24, 6.2, { xMm: 7.7, yMm: 19.2, widthMm: 16.6, heightMm: 5.2 }),
  ];
}

function radioactivityPrimaryPrimitives(): readonly Primitive[] {
  return [
    triangle(HAZARD_TRIANGLE, 'rot'),
    hazardText('A', 16.2, 24, 12.5, { xMm: 11.6, yMm: 15, widthMm: 9.2, heightMm: 9.4 }),
  ];
}

/*
 * 5.8.1.8 Alternative: Strahlenwarnzeichen. Nabe (16, 20): Punkt r = 1 mm, freier Ring bis
 * r = 2 mm. Drei 60°-Flügel (oben, links unten, rechts unten) mit radialen Kanten durch die Nabe;
 * ihr Außenbogen liegt wie in der Referenz auf einem Kreis r = 6,5 mm um (16, 19,5).
 */
const TREFOIL_HUB: Point = [16, 20];
const TREFOIL_OUTER_CENTER: Point = [16, 19.5];
const TREFOIL_OUTER_R = 6.5;

function trefoilOuterPoint(degrees: number): { point: Point; angle: number } {
  const radians = (degrees * Math.PI) / 180;
  const ux = Math.cos(radians);
  const uy = -Math.sin(radians);
  const dx = TREFOIL_HUB[0] - TREFOIL_OUTER_CENTER[0];
  const dy = TREFOIL_HUB[1] - TREFOIL_OUTER_CENTER[1];
  const b = ux * dx + uy * dy;
  const t = -b + Math.sqrt(b * b - (dx * dx + dy * dy - TREFOIL_OUTER_R ** 2));
  const x = TREFOIL_HUB[0] + t * ux;
  const y = TREFOIL_HUB[1] + t * uy;
  const angle =
    (Math.atan2(-(y - TREFOIL_OUTER_CENTER[1]), x - TREFOIL_OUTER_CENTER[0]) * 180) / Math.PI;
  return { point: [round3(x), round3(y)], angle };
}

function trefoilBlade(fromDeg: number, toDeg: number): Primitive {
  const [hx, hy] = TREFOIL_HUB;
  const innerFrom = polarPoint(hx, hy, 2, fromDeg);
  const innerTo = polarPoint(hx, hy, 2, toDeg);
  const outerFrom = trefoilOuterPoint(fromDeg);
  const outerTo = trefoilOuterPoint(toDeg);
  const sweep = ((outerTo.angle - outerFrom.angle) % 360 + 360) % 360;
  const [ox, oy] = TREFOIL_OUTER_CENTER;
  return statePath(
    `M ${innerFrom[0]} ${innerFrom[1]} L ${outerFrom.point[0]} ${outerFrom.point[1]} ` +
      `${arcCommands(ox, oy, TREFOIL_OUTER_R, outerFrom.angle, outerFrom.angle + sweep)} ` +
      `L ${innerTo[0]} ${innerTo[1]} ${arcCommands(hx, hy, 2, toDeg, fromDeg)} Z`,
    RED_FILL,
  );
}

function radioactivityAlternativePrimitives(): readonly Primitive[] {
  return [
    triangle(HAZARD_TRIANGLE, 'rot'),
    trefoilBlade(60, 120),
    trefoilBlade(180, 240),
    trefoilBlade(300, 360),
    stateCircle(TREFOIL_HUB[0], TREFOIL_HUB[1], 1, RED_FILL),
  ];
}

/*
 * 5.8.1.9 Gefahr durch elektrische Energie: Blitz als 0,5-mm-Zickzack (16,05, 9) → (11,95, 16,95)
 * → (19,05, 16,05) → Spitze (14,5, 26) mit offener Pfeilspitze zu (18, 25) und (13,5, 23).
 */
function electricalEnergyPrimitives(): readonly Primitive[] {
  const red = strokeStyle('rot');
  return [
    triangle(HAZARD_TRIANGLE, 'rot'),
    statePolyline([[16.05, 9], [11.95, 16.95], [19.05, 16.05], [14.5, 26]], false, red),
    statePolyline([[18, 25], [14.5, 26], [13.5, 23]], false, red),
  ];
}

function mineralOilPrimitives(): readonly Primitive[] {
  return [
    triangle(HAZARD_TRIANGLE, 'rot'),
    hazardText('Ö', 16, 23, 10.4, { xMm: 12, yMm: 13.8, widthMm: 8, heightMm: 9.7 }),
  ];
}

function explosionPrimitives(): readonly Primitive[] {
  return [
    triangle(HAZARD_TRIANGLE, 'rot'),
    hazardText('Ex', 16.2, 23, 8.3, { xMm: 11.3, yMm: 16.9, widthMm: 10.3, heightMm: 6.5 }),
  ];
}

/*
 * 5.8.1.12 Kampfmittel: Ring r = 5 mm (0,5 mm) um (16, 20), gefüllter Kern r = 3 mm und zwei
 * radiale Zünderstriche von r = 5 bis 7 mm unter 45° und 135°.
 */
function explosiveOrdnancePrimitives(): readonly Primitive[] {
  const red = strokeStyle('rot');
  const fuse = (degrees: number): Primitive => {
    const [x1, y1] = polarPoint(16, 20, 5, degrees);
    const [x2, y2] = polarPoint(16, 20, 7, degrees);
    return stateLine(x1, y1, x2, y2, red);
  };
  return [
    triangle(HAZARD_TRIANGLE, 'rot'),
    stateCircle(16, 20, 5, red),
    stateCircle(16, 20, 3, RED_FILL),
    fuse(135),
    fuse(45),
  ];
}

/*
 * 5.8.1.13 Fragezeichen, 1,2 mm stark, Punkt r = 0,8 mm bei (16, 25). Mittellinie (Einheiten
 * relativ zum Scheitel (16, 5)): Ansatz (−5, 3), Scheitel, rechter Bogen bis (5, 4,5), S-Schwung
 * zur Bauchmitte (0,85, 9), Bauch (−3, 13) und (0, 16), Abschluss (3, 14). Die Alternative ist
 * dieselbe Figur im Maßstab 1 : 2 um den Scheitel (5, 10), 0,8 mm stark, Punkt r = 0,6 mm.
 */
const QUESTION_MARK: readonly (readonly Point[])[] = [
  [[-5, 3]],
  [[-4, 1], [-2.35, 0], [0, 0]],
  [[2.75, 0], [5, 1.65], [5, 4.5]],
  [[5, 7], [2.9, 8], [0.85, 9]],
  [[-1.05, 9.9], [-3, 10.85], [-3, 13]],
  [[-3, 14.65], [-1.65, 16], [0, 16]],
  [[1.4, 16], [2.55, 15.25], [3, 14]],
];

function questionMark(topX: number, topY: number, scale: number, width: number): Primitive {
  const at = ([dx, dy]: Point): string => `${round3(topX + dx * scale)} ${round3(topY + dy * scale)}`;
  const [start, ...curves] = QUESTION_MARK;
  const d = [`M ${at(start![0]!)}`, ...curves.map((points) => `C ${points.map(at).join(' ')}`)];
  return statePath(d.join(' '), strokeStyle('rot', width));
}

function suspectedPrimaryPrimitives(): readonly Primitive[] {
  return [questionMark(16, 5, 1, 1.2), stateCircle(16, 25, 0.8, RED_FILL)];
}

function suspectedAlternativePrimitives(): readonly Primitive[] {
  return [
    triangle(NOTICE_TRIANGLE, 'rot'),
    questionMark(5, 10, 0.5, 0.8),
    stateCircle(5, 20.05, 0.6, RED_FILL),
  ];
}

/*
 * 5.8.1.14 Ausrufezeichen: Balken 1,2 mm breit von y = 5 bis 21 auf x = 16, Punkt r = 0,8 mm bei
 * (16, 25). Alternative: Balken 0,8 mm von y = 10 bis 18 auf x = 6, Punkt r = 0,6 mm bei
 * (6, 20,05), links neben dem kleinen Warndreieck.
 */
function acutePrimaryPrimitives(): readonly Primitive[] {
  return [stateLine(16, 5, 16, 21, strokeStyle('rot', 1.2)), stateCircle(16, 25, 0.8, RED_FILL)];
}

function acuteAlternativePrimitives(): readonly Primitive[] {
  return [
    triangle(NOTICE_TRIANGLE, 'rot'),
    stateLine(6, 10, 6, 18, strokeStyle('rot', 0.8)),
    stateCircle(6, 20.05, 0.6, RED_FILL),
  ];
}

export const TACTICS_HAZARDS_STATES = deepFreeze([
  defineState({
    section: '5.8.1.1',
    id: 'tactical-rescue',
    title: 'Einsatztaktik: Retten',
    referenceAsset: '5.8.1.1_Einsatztaktik_Retten.svg',
    box: { xMm: 4, yMm: 4, widthMm: 25, heightMm: 24 },
    contrastPairs: TACTICAL_CONTRAST,
    primitives: tacticalPrimitives('rescue'),
  }),
  defineState({
    section: '5.8.1.2',
    id: 'tactical-attack',
    title: 'Einsatztaktik: Angreifen',
    referenceAsset: '5.8.1.2_Einsatztaktik_Angreifen.svg',
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
    contrastPairs: TACTICAL_CONTRAST,
    primitives: tacticalPrimitives('attack'),
  }),
  defineState({
    section: '5.8.1.3',
    id: 'tactical-defense',
    title: 'Einsatztaktik: Verteidigen',
    referenceAsset: '5.8.1.3_Einsatztaktik_Verteidigen.svg',
    box: { xMm: 3, yMm: 4, widthMm: 27, heightMm: 24 },
    contrastPairs: TACTICAL_CONTRAST,
    primitives: tacticalPrimitives('defense'),
  }),
  defineState({
    section: '5.8.1.4',
    id: 'tactical-retreat',
    title: 'Einsatztaktik: Rückzug',
    referenceAsset: '5.8.1.4_Einsatztaktik_Rückzug.svg',
    box: { xMm: 2, yMm: 4, widthMm: 28, heightMm: 24 },
    contrastPairs: TACTICAL_CONTRAST,
    primitives: tacticalPrimitives('retreat'),
  }),
  defineState({
    section: '5.8.1.5',
    id: 'flooded-area',
    title: 'Überschwemmtes Gebiet',
    referenceAsset: '5.8.1.5_Überschwemmtes Gebiet.svg',
    box: { xMm: 1, yMm: 4, widthMm: 30, heightMm: 24 },
    contrastPairs: WATER_CONTRAST,
    primitives: floodedAreaPrimitives(),
  }),
  defineState({
    section: '5.8.1.6',
    id: 'water-ingress-hazard',
    title: 'Gefahr durch Wassereinbruch',
    referenceAsset: '5.8.1.6_Gefahr durch Wassereinbruch.svg',
    box: { xMm: 1, yMm: 3, widthMm: 30, heightMm: 25 },
    contrastPairs: WATER_CONTRAST,
    primitives: waterIngressPrimitives(),
  }),
  defineState({
    section: '5.8.1.7',
    id: 'hazardous-substances',
    title: 'Gefährliche Stoffe',
    referenceAsset: '5.8.1.7_Gefährliche Stoffe.svg',
    box: { xMm: 1, yMm: 3, widthMm: 30, heightMm: 25 },
    contrastPairs: SIGNAL_CONTRAST,
    primitives: hazardousSubstancesPrimaryPrimitives(),
  }),
  defineState({
    section: '5.8.1.7',
    id: 'hazardous-substances',
    variant: 'alternative',
    title: 'Gefährliche Stoffe',
    referenceAsset: '5.8.1.7_Gefährliche Stoffe_Chlor.svg',
    box: { xMm: 1, yMm: 3, widthMm: 30, heightMm: 25 },
    contrastPairs: SIGNAL_CONTRAST,
    primitives: hazardousSubstancesAlternativePrimitives(),
  }),
  defineState({
    section: '5.8.1.8',
    id: 'radioactivity-hazard',
    title: 'Gefahr durch Radioaktivität',
    referenceAsset: '5.8.1.8_Gefahr durch Radioaktivität.svg',
    box: { xMm: 1, yMm: 3, widthMm: 30, heightMm: 25 },
    contrastPairs: SIGNAL_CONTRAST,
    primitives: radioactivityPrimaryPrimitives(),
  }),
  defineState({
    section: '5.8.1.8',
    id: 'radioactivity-hazard',
    variant: 'alternative',
    title: 'Gefahr durch Radioaktivität',
    referenceAsset: '5.8.1.8_Gefahr durch Radioaktivität _A.svg',
    box: { xMm: 1, yMm: 3, widthMm: 30, heightMm: 25 },
    contrastPairs: SIGNAL_CONTRAST,
    primitives: radioactivityAlternativePrimitives(),
  }),
  defineState({
    section: '5.8.1.9',
    id: 'electrical-energy-hazard',
    title: 'Gefahr durch elektrische Energie',
    referenceAsset: '5.8.1.9_Gefahr durch elektrische Energie.svg',
    box: { xMm: 1, yMm: 3, widthMm: 30, heightMm: 25 },
    contrastPairs: SIGNAL_CONTRAST,
    primitives: electricalEnergyPrimitives(),
  }),
  defineState({
    section: '5.8.1.10',
    id: 'mineral-oil-hazard',
    title: 'Gefahr durch Mineralöl',
    referenceAsset: '5.8.1.10_Gefahr durch Mineralöl.svg',
    box: { xMm: 1, yMm: 3, widthMm: 30, heightMm: 25 },
    contrastPairs: SIGNAL_CONTRAST,
    primitives: mineralOilPrimitives(),
  }),
  defineState({
    section: '5.8.1.11',
    id: 'explosion-hazard',
    title: 'Gefahr durch Explosion',
    referenceAsset: '5.8.1.11_Gefahr durch Explosion.svg',
    box: { xMm: 1, yMm: 3, widthMm: 30, heightMm: 25 },
    contrastPairs: SIGNAL_CONTRAST,
    primitives: explosionPrimitives(),
  }),
  defineState({
    section: '5.8.1.12',
    id: 'explosive-ordnance-hazard',
    title: 'Gefahr durch explosionsfähige Kampfmittel',
    referenceAsset: '5.8.1.12_Gefahr durch explosionsfähige Kampfmittel.svg',
    box: { xMm: 1, yMm: 3, widthMm: 30, heightMm: 25 },
    contrastPairs: SIGNAL_CONTRAST,
    primitives: explosiveOrdnancePrimitives(),
  }),
  defineState({
    section: '5.8.1.13',
    id: 'suspected-situation',
    title: 'Hinweis auf Vermutung',
    referenceAsset: '5.8.1.13_Hinweis auf Vermutung.svg',
    box: { xMm: 11, yMm: 5, widthMm: 10, heightMm: 20.8 },
    contrastPairs: FREE_SIGNAL_CONTRAST,
    primitives: suspectedPrimaryPrimitives(),
  }),
  defineState({
    section: '5.8.1.13',
    id: 'suspected-situation',
    variant: 'alternative',
    title: 'Hinweis auf Vermutung',
    referenceAsset: '5.8.1.13_Hinweis auf Vermutung_2.svg',
    box: { xMm: 2.5, yMm: 6, widthMm: 28, heightMm: 19 },
    contrastPairs: NOTICE_CONTRAST,
    primitives: suspectedAlternativePrimitives(),
  }),
  defineState({
    section: '5.8.1.14',
    id: 'acute-situation',
    title: 'Hinweis auf akute Situation',
    referenceAsset: '5.8.1.14_Hinweis auf akute Situation.svg',
    box: { xMm: 15.2, yMm: 5, widthMm: 1.6, heightMm: 20.8 },
    contrastPairs: FREE_SIGNAL_CONTRAST,
    primitives: acutePrimaryPrimitives(),
  }),
  defineState({
    section: '5.8.1.14',
    id: 'acute-situation',
    variant: 'alternative',
    title: 'Hinweis auf akute Situation',
    referenceAsset: '5.8.1.14_Hinweis auf akute Situation_2.svg',
    box: { xMm: 5.4, yMm: 6, widthMm: 25.1, heightMm: 19 },
    contrastPairs: NOTICE_CONTRAST,
    primitives: acuteAlternativePrimitives(),
  }),
] satisfies readonly CatalogPictogramDefinition[]);
