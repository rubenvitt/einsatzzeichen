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
