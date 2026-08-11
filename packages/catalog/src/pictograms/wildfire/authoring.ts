import type { ColorToken, Point, Primitive, Style } from '@einsatzzeichen/schema';
import type { PictogramContrastPair } from '../catalog-definition.js';

/** Dieselbe Strichbreite wie bei allen freistehenden Zeichen des Katalogs. */
export const WILDFIRE_STROKE_WIDTH_MM = 1;

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

const WARNING_TRIANGLE: readonly Point[] = Object.freeze([
  [1.2, 27.9],
  [16, 3.2],
  [30.8, 27.9],
] as const);

const SUPPLY_TRIANGLE: readonly Point[] = Object.freeze([
  [1.2, 4.1],
  [30.8, 4.1],
  [16, 28.8],
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
 * Das Flammenzeichen: ein rechtwinkliges Dreieck mit senkrechter rechter Kante und einer
 * Hypotenuse, die nach links unten fällt. `count` bestimmt, ob eine Flamme steht (M.4) oder
 * zwei nebeneinander (M.5 und die übrigen Brandzeichen).
 */
export function flame(
  rightX: number,
  topY: number,
  bottomY: number,
  widthMm: number,
  count: number,
  style: Readonly<Style>,
): Primitive[] {
  const flames: Primitive[] = [];
  for (let index = 0; index < count; index += 1) {
    const right = rightX + index * (widthMm + 0.65);
    flames.push(
      wildfirePolyline(
        [
          [right - widthMm, bottomY],
          [right, topY],
          [right, bottomY],
        ],
        true,
        style,
      ),
    );
  }
  return flames;
}

/**
 * Die Wasserförderung: eine Wellenlinie über einem Kreis mit Pfeil. In M.11, M.13 und M.14
 * identisch aufgebaut und nur unterschiedlich platziert — der Kreis ist die Entnahmestelle, der
 * Pfeil die Förderrichtung, die Welle das Wasser.
 *
 * Die Pfeilspitze ist bewusst **offen** (zwei Striche) und nicht gefüllt: so zeichnet die
 * Referenz sie in allen drei Zeichen, anders als die gefüllten Spitzen des Anhangs L.
 */
export function waterSupply(
  circleX: number,
  circleY: number,
  arrowEndX: number,
  waveY: number,
  waveFromX: number,
  waveToX: number,
  style: Readonly<Style>,
): Primitive[] {
  const round = (value: number): number => Math.round(value * 1000) / 1000;
  // Vier nach oben gewölbte Bögen, wie die Referenz sie über der Entnahmestelle führt.
  const count = 4;
  const step = (waveToX - waveFromX) / count;
  let wave = `M ${round(waveFromX)} ${round(waveY)}`;
  for (let index = 0; index < count; index += 1) {
    const startX = waveFromX + step * index;
    wave += ` Q ${round(startX + step / 2)} ${round(waveY - 2)} ${round(startX + step)} ${round(waveY)}`;
  }
  return [
    wildfireCircle(circleX, circleY, 1.25, style),
    wildfireLine(circleX + 1.25, circleY, arrowEndX, circleY, style),
    wildfirePolyline(
      [
        [arrowEndX - 1.6, circleY - 1.6],
        [arrowEndX, circleY],
        [arrowEndX - 1.6, circleY + 1.6],
      ],
      false,
      style,
    ),
    wildfirePath(wave, style),
  ];
}
