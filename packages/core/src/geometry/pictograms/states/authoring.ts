import type { Point, Primitive, Style } from '@einsatzzeichen/schema';

/**
 * 0,5 mm — die Wandstärke der Referenzumrisse (1,417 pt bei 90,709 pt auf 32 mm). Die Mittellinien
 * aller Zustandszeichen liegen auf den an der Referenz abgelesenen Koordinaten; Maße an der
 * Referenz abgelesen, Geometrie eigenständig konstruiert.
 */
export const STATE_STROKE_WIDTH_MM = 0.5;

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

export function statePolygon(
  points: readonly Point[],
  style: Readonly<Style> = STATE_BLACK_STROKE,
): Primitive {
  return statePolyline(points, true, style);
}

export function stateGroup(children: readonly Primitive[]): Primitive {
  return { type: 'group', role: 'pictogram', children };
}

/**
 * Ein Textlauf in der Projektschrift (Arimo), gefüllt statt gestrichen. `boxMm` ist eine
 * Zusicherung des Autors, in die die Glyphen passen müssen (geprüft von `text-ink.test.ts` und
 * `text-metrics.test.ts`); `minRenderPx` ist die kleinste Rendergröße, ab der der Lauf den
 * Mindestschriftgrad von 8 px erreicht (`sizeMm / 32 × px ≥ 8`).
 */
export function stateText(
  content: string,
  options: {
    x: number;
    y: number;
    sizeMm: number;
    boxMm: { xMm: number; yMm: number; widthMm: number; heightMm: number };
    fill: Style['fill'];
    /** 700 für den fetten Schnitt; ohne Angabe regulär. */
    fontWeight?: 400 | 700;
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
    boxMm: options.boxMm,
    minRenderPx: Math.ceil((8 * 32) / options.sizeMm),
    ...(options.fontWeight === undefined ? {} : { fontWeight: options.fontWeight }),
    style: { fill: options.fill, stroke: 'none' },
  };
}

const round3 = (value: number): number => Math.round(value * 1000) / 1000;

function polar(cx: number, cy: number, r: number, degrees: number): Point {
  // Mathematischer Drehsinn (gegen den Uhrzeigersinn) bei nach unten wachsendem y.
  const radians = (degrees * Math.PI) / 180;
  return [round3(cx + r * Math.cos(radians)), round3(cy - r * Math.sin(radians))];
}

/**
 * `C`-Kommandos eines Kreisbogens von `fromDeg` nach `toDeg` (Grad, mathematischer Drehsinn).
 * Das Kommando-Gate lässt kein `A` zu; der Bogen wird deshalb in Stücke von höchstens 90°
 * zerlegt und je Stück durch die übliche Kubik mit Hebellänge 4/3·tan(Δ/4)·r angenähert.
 */
export function arcCommands(
  cx: number,
  cy: number,
  r: number,
  fromDeg: number,
  toDeg: number,
): string {
  const pieces = Math.max(1, Math.ceil(Math.abs(toDeg - fromDeg) / 90));
  const step = (toDeg - fromDeg) / pieces;
  const handle = ((4 / 3) * Math.tan((step * Math.PI) / 720)) * r;
  const commands: string[] = [];
  for (let index = 0; index < pieces; index += 1) {
    const a = fromDeg + index * step;
    const b = a + step;
    const ra = (a * Math.PI) / 180;
    const rb = (b * Math.PI) / 180;
    const [x0, y0] = polar(cx, cy, r, a);
    const [x3, y3] = polar(cx, cy, r, b);
    const c1: Point = [round3(x0 - handle * Math.sin(ra)), round3(y0 - handle * Math.cos(ra))];
    const c2: Point = [round3(x3 + handle * Math.sin(rb)), round3(y3 + handle * Math.cos(rb))];
    commands.push(`C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${x3} ${y3}`);
  }
  return commands.join(' ');
}

export function polarPoint(cx: number, cy: number, r: number, degrees: number): Point {
  return polar(cx, cy, r, degrees);
}
