import type { Point, Primitive, Style } from '@einsatzzeichen/schema';

export const COMMS_STROKE_WIDTH_MM = 1;

export const COMMS_BLACK_STROKE = Object.freeze({
  fill: 'none',
  stroke: 'schwarz',
  strokeWidth: COMMS_STROKE_WIDTH_MM,
} satisfies Style);

export const COMMS_BLACK_FILL = Object.freeze({
  fill: 'schwarz',
  stroke: 'none',
} satisfies Style);

/** Weiße Fläche mit schwarzer Kontur — der Körper der Geräte- und Netzzeichen. */
export const COMMS_WHITE_BODY = Object.freeze({
  fill: 'weiss',
  stroke: 'schwarz',
  strokeWidth: COMMS_STROKE_WIDTH_MM,
} satisfies Style);

function copyStyle(style: Readonly<Style>): Style {
  return { ...style };
}

export function commsPath(d: string, style: Readonly<Style> = COMMS_BLACK_STROKE): Primitive {
  return { type: 'path', role: 'pictogram', d, style: copyStyle(style) };
}

export function commsLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style: Readonly<Style> = COMMS_BLACK_STROKE,
): Primitive {
  return { type: 'line', role: 'pictogram', x1, y1, x2, y2, style: copyStyle(style) };
}

export function commsPolyline(
  points: readonly Point[],
  closed = false,
  style: Readonly<Style> = COMMS_BLACK_STROKE,
): Primitive {
  return { type: 'polyline', role: 'pictogram', points, closed, style: copyStyle(style) };
}

export function commsCircle(
  cx: number,
  cy: number,
  r: number,
  style: Readonly<Style> = COMMS_BLACK_STROKE,
): Primitive {
  return { type: 'circle', role: 'pictogram', cx, cy, r, style: copyStyle(style) };
}

/**
 * Ein Kürzel aus Anhang J. Rund ein Drittel der Darstellungen trägt seine Bedeutung nicht in der
 * Geometrie, sondern in zwei bis vier Buchstaben — ohne sie sind `J.3.6`, `J.3.7` und `J.3.8`
 * dasselbe leere Quadrat.
 *
 * Der Helfer setzt zwei Dinge, die der Aufrufer nicht vergessen können soll:
 *
 * - `role: 'pictogram'`. Ohne sie zählt `pictogramStrokeWidths` den Lauf als fremde Rolle und
 *   `checkClipping` macht daraus einen Befund.
 * - Füllung statt Kontur. Text wird gefüllt; eine Strichbreite am Textlauf wäre eine Aussage
 *   über eine Kontur, die es nicht gibt.
 *
 * `boxMm` und `minRenderPx` sind Pflicht und haben bewusst keinen Vorgabewert. Die Box ist bei
 * Text keine Messung, sondern eine Zusicherung, die kein Gate nachrechnet — sie gehört an die
 * Stelle, an der jemand aufs Bild geschaut hat. Und eine pauschale Einsatzgrenze wäre entweder
 * zu streng für die großen Kürzel oder eine leere Zusicherung für die kleinen.
 */
export function commsText(
  content: string,
  options: {
    x: number;
    y: number;
    sizeMm: number;
    boxMm: { xMm: number; yMm: number; widthMm: number; heightMm: number };
    minRenderPx: number;
    anchor?: 'start' | 'middle' | 'end';
    baseline?: 'alphabetic' | 'middle' | 'hanging';
    style?: Readonly<Style>;
  },
): Primitive {
  return {
    type: 'text',
    role: 'pictogram',
    content,
    x: options.x,
    y: options.y,
    sizeMm: options.sizeMm,
    anchor: options.anchor ?? 'middle',
    baseline: options.baseline ?? 'alphabetic',
    boxMm: { ...options.boxMm },
    minRenderPx: options.minRenderPx,
    style: copyStyle(options.style ?? COMMS_BLACK_FILL),
  };
}

export function commsRect(
  x: number,
  y: number,
  width: number,
  height: number,
  style: Readonly<Style> = COMMS_BLACK_STROKE,
  rx?: number,
): Primitive {
  return {
    type: 'rect',
    role: 'pictogram',
    x,
    y,
    width,
    height,
    ...(rx === undefined ? {} : { rx }),
    style: copyStyle(style),
  };
}
