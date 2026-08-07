import type { Point, Primitive, Style } from '@einsatzzeichen/schema';

export const STATE_STROKE_WIDTH_MM = 1;

export const STATE_BLACK_STROKE = Object.freeze({
  fill: 'none',
  stroke: 'schwarz',
  strokeWidth: STATE_STROKE_WIDTH_MM,
} satisfies Style);

export const STATE_BLACK_FILL = Object.freeze({
  fill: 'schwarz',
  stroke: 'none',
} satisfies Style);

function copyStyle(style: Readonly<Style>): Style {
  return { ...style };
}

export function statePath(
  d: string,
  style: Readonly<Style> = STATE_BLACK_STROKE,
): Primitive {
  return {
    type: 'path',
    role: 'pictogram',
    d,
    style: copyStyle(style),
  };
}

export function stateLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style: Readonly<Style> = STATE_BLACK_STROKE,
): Primitive {
  return {
    type: 'line',
    role: 'pictogram',
    x1,
    y1,
    x2,
    y2,
    style: copyStyle(style),
  };
}

export function statePolyline(
  points: readonly Point[],
  closed = false,
  style: Readonly<Style> = STATE_BLACK_STROKE,
): Primitive {
  return {
    type: 'polyline',
    role: 'pictogram',
    points,
    closed,
    style: copyStyle(style),
  };
}

export function stateCircle(
  cx: number,
  cy: number,
  r: number,
  style: Readonly<Style> = STATE_BLACK_STROKE,
): Primitive {
  return {
    type: 'circle',
    role: 'pictogram',
    cx,
    cy,
    r,
    style: copyStyle(style),
  };
}

export function stateRect(
  x: number,
  y: number,
  width: number,
  height: number,
  style: Readonly<Style> = STATE_BLACK_STROKE,
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
