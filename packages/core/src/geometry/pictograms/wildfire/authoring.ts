import type { ColorToken, Point, Primitive, Style } from '@einsatzzeichen/schema';
import type { PictogramContrastPair } from '../catalog-definition.js';
import { waveD } from '../damage/authoring.js';

/**
 * 0,5 mm — die Wandstärke der Referenzumrisse (1,417 pt bei 90,709 pt auf 32 mm). Alle
 * Koordinaten des Anhangs M sind Mittellinien dieser Umrisse: Maße an der Referenz abgelesen,
 * Geometrie eigenständig konstruiert.
 */
export const WILDFIRE_STROKE_WIDTH_MM = 0.5;

function copyStyle(style: Readonly<Style>): Style {
  return { ...style };
}

export function wildfireStroke(color: ColorToken): Style {
  return { fill: 'none', stroke: color, strokeWidth: WILDFIRE_STROKE_WIDTH_MM };
}

export const WILDFIRE_BLACK_STROKE = Object.freeze(wildfireStroke('schwarz'));
export const WILDFIRE_RED_STROKE = Object.freeze(wildfireStroke('rot'));
export const WILDFIRE_BLUE_STROKE = Object.freeze(wildfireStroke('hellblau'));

/**
 * Die weisse Innenfläche, die jedes M-Zeichen unter seiner Kontur trägt. Sie ist der Grund,
 * warum die Kontrastpaare `weiss` als Hintergrund führen und **nicht** als Vordergrund: `weiss`
 * und `surface` lösen in allen drei Themes auf `#ffffff` auf, ein Paar aus beiden wäre ein
 * Verhältnis von 1:1 und damit ein unerfüllbarer Vertrag — genau der Fall, den
 * `contrastPairProblems` meldet.
 */
export const WILDFIRE_WHITE_BODY = Object.freeze({ fill: 'weiss', stroke: 'none' } satisfies Style);

/**
 * Kontrastpaare für ein M-Zeichen: die farbige Kontur gegen die Ausgabeoberfläche und gegen die
 * weisse Innenfläche, auf der die Binnenzeichnung liegt.
 */
export function wildfireContrast(
  color: ColorToken,
  what: string,
): readonly [PictogramContrastPair, ...PictogramContrastPair[]] {
  return [
    { foreground: color, background: 'surface', context: `${what} auf Ausgabeoberfläche` },
    { foreground: color, background: 'weiss', context: `${what} auf weisser Innenfläche` },
  ];
}

export function wildfirePath(d: string, style: Readonly<Style>): Primitive {
  return { type: 'path', role: 'pictogram', d, style: copyStyle(style) };
}

export function wildfireLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style: Readonly<Style>,
): Primitive {
  return { type: 'line', role: 'pictogram', x1, y1, x2, y2, style: copyStyle(style) };
}

export function wildfirePolyline(
  points: readonly Point[],
  closed: boolean,
  style: Readonly<Style>,
): Primitive {
  return { type: 'polyline', role: 'pictogram', points, closed, style: copyStyle(style) };
}

export function wildfireCircle(
  cx: number,
  cy: number,
  r: number,
  style: Readonly<Style>,
): Primitive {
  return { type: 'circle', role: 'pictogram', cx, cy, r, style: copyStyle(style) };
}

export function wildfireRect(
  x: number,
  y: number,
  width: number,
  height: number,
  style: Readonly<Style>,
): Primitive {
  return { type: 'rect', role: 'pictogram', x, y, width, height, style: copyStyle(style) };
}

/** Der Trägerkreis: Mittelpunkt 16/16, Radius 12 mm. Gemessen, in fünf Zeichen identisch. */
export function wildfireDisc(color: ColorToken): readonly Primitive[] {
  return [
    wildfireCircle(16, 16, 12, WILDFIRE_WHITE_BODY),
    wildfireCircle(16, 16, 12, wildfireStroke(color)),
  ];
}

/** Warndreieck: Grundlinie y = 28 von 1 bis 31 mm, Spitze 16/3. */
const WARNING_TRIANGLE: readonly Point[] = Object.freeze([
  [1, 28],
  [16, 3],
  [31, 28],
] as const);

/** Maßnahmendreieck: dieselbe Form gestürzt — Oberkante y = 4, Spitze 16/29. */
const SUPPLY_TRIANGLE: readonly Point[] = Object.freeze([
  [1, 4],
  [31, 4],
  [16, 29],
] as const);

/**
 * Das Warndreieck der Brandzeichen (Spitze oben) und das Massnahmendreieck der Förderzeichen
 * (Spitze unten). Die Richtung ist die Unterscheidung: aufwärts warnt vor einem Ereignis,
 * abwärts bezeichnet eine Massnahme dagegen.
 */
export function wildfireTriangle(color: ColorToken, pointing: 'up' | 'down'): readonly Primitive[] {
  const points = pointing === 'up' ? WARNING_TRIANGLE : SUPPLY_TRIANGLE;
  return [
    wildfirePolyline(points, true, WILDFIRE_WHITE_BODY),
    wildfirePolyline(points, true, wildfireStroke(color)),
  ];
}

/**
 * Das Flammenzeichen: rechtwinklige Dreiecke mit waagerechter Grundlinie, senkrechter rechter
 * Kante und einer Hypotenuse, die von links unten zur Spitze oben rechts steigt. Bei `count` = 2
 * stehen die Flammen Kante an Kante: die zweite beginnt an der rechten unteren Ecke der ersten.
 */
export function flames(
  leftX: number,
  bottomY: number,
  widthMm: number,
  heightMm: number,
  count: number,
  style: Readonly<Style>,
): Primitive[] {
  const result: Primitive[] = [];
  for (let index = 0; index < count; index += 1) {
    const left = leftX + index * widthMm;
    const right = left + widthMm;
    result.push(
      wildfirePolyline(
        [
          [left, bottomY],
          [right, bottomY - heightMm],
          [right, bottomY],
        ],
        true,
        style,
      ),
    );
  }
  return result;
}

/**
 * Die Wasserförderung in M.11, M.13 und M.14: eine Welle über einem Pfeil, der aus einem kleinen
 * Kreis kommt — der Kreis ist die Entnahmestelle, der Pfeil die Förderrichtung, die Welle das
 * Wasser.
 *
 * - Kreis: Radius 1,5 mm, Mittelpunkt `circleX`/`lineY`.
 * - Pfeil: waagerecht vom Kreisrand bis `tipX`, offene Spitze aus zwei 45°-Schenkeln von 2 mm
 *   Breite und Höhe — so zeichnet die Referenz sie in allen drei Zeichen, anders als die
 *   gefüllten Spitzen des Anhangs L.
 * - Welle: Welle (`waveD`) von 7 bis 25 mm, Periode 9 mm, Berge bei 11,5 und 20,5 mm. Mittellage
 *   und Ausschlag unterscheiden sich je Zeichen.
 */
export function waterSupply(
  circleX: number,
  lineY: number,
  tipX: number,
  waveMidY: number,
  waveAmplitude: number,
  style: Readonly<Style>,
): Primitive[] {
  const radius = 1.5;
  const leg = 2;
  return [
    wildfireCircle(circleX, lineY, radius, style),
    // Der Schaft endet knapp vor der Spitze, damit sein stumpfes Ende in der Schenkelecke liegt.
    wildfireLine(circleX + radius, lineY, tipX - 0.4, lineY, style),
    wildfirePolyline(
      [
        [tipX - leg, lineY - leg],
        [tipX, lineY],
        [tipX - leg, lineY + leg],
      ],
      false,
      style,
    ),
    wildfirePath(waveD(7, 25, waveMidY, waveAmplitude, 9, 11.5), style),
  ];
}
