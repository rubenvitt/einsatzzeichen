import type { Point, Primitive, Rotation } from '@einsatzzeichen/schema';
import { tokenizePath } from '../path-commands.js';

/**
 * Die Körpermittellinie als Folge gerader Kanten — und daraus die waagerechte Ausdehnung des
 * Körpers in einem Streifen. Gebraucht wird das nur dort, wo eine Beschriftungszone an einer
 * Körperform liegt, an der sie nicht vermessen ist (`label-zones.ts`): ob ein Lauf oben links in
 * der Raute steht oder neben ihrer Spitze, beantwortet die Hülle allein nicht.
 *
 * **Abgetastet, nicht analytisch.** Kubiken und Kreise werden in feste Sehnen zerlegt (24 je
 * Kubik, 96 je Kreis); die größte Sehnenabweichung liegt an den Körpern des Katalogs unter
 * 0,01 mm und damit unter jeder Marge, gegen die die Spannen hier gelesen werden (1 bis 2 mm).
 * Eine Messung ist das ausdrücklich nicht, und darum erzeugt dieses Modul keine Zahl, die eine
 * vermessene Zone ersetzt — es begrenzt nur abgeleitete.
 */

type Segment = readonly [Point, Point];

const CUBIC_STEPS = 24;
const CIRCLE_STEPS = 96;

function rotate([x, y]: Point, rotation: Rotation | undefined): Point {
  if (rotation === undefined) return [x, y];
  const rad = (rotation.angle * Math.PI) / 180;
  const dx = x - rotation.cx;
  const dy = y - rotation.cy;
  return [
    rotation.cx + dx * Math.cos(rad) - dy * Math.sin(rad),
    rotation.cy + dx * Math.sin(rad) + dy * Math.cos(rad),
  ];
}

function chain(points: readonly Point[], closed: boolean): Segment[] {
  const segments: Segment[] = [];
  for (let index = 0; index + 1 < points.length; index++) {
    segments.push([points[index]!, points[index + 1]!]);
  }
  if (closed && points.length > 2) segments.push([points.at(-1)!, points[0]!]);
  return segments;
}

function pathSegments(d: string): Segment[] {
  const { commands, problems } = tokenizePath(d);
  if (problems.length > 0) throw new Error(`body-outline: Pfad nicht zerlegbar — ${problems.join(' ')}`);
  const segments: Segment[] = [];
  let current: Point = [0, 0];
  let start: Point = [0, 0];
  const lineTo = (next: Point): void => {
    segments.push([current, next]);
    current = next;
  };
  const cubicTo = (c1: Point, c2: Point, end: Point): void => {
    const from = current;
    for (let step = 1; step <= CUBIC_STEPS; step++) {
      const t = step / CUBIC_STEPS;
      const u = 1 - t;
      lineTo([
        u * u * u * from[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * end[0],
        u * u * u * from[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * end[1],
      ]);
    }
  };
  for (const { command, numbers } of commands) {
    const n = (index: number): number => numbers[index] ?? 0;
    switch (command) {
      case 'M':
        current = [n(0), n(1)];
        start = current;
        break;
      case 'L':
        lineTo([n(0), n(1)]);
        break;
      case 'H':
        lineTo([n(0), current[1]]);
        break;
      case 'V':
        lineTo([current[0], n(0)]);
        break;
      case 'C':
        cubicTo([n(0), n(1)], [n(2), n(3)], [n(4), n(5)]);
        break;
      case 'Q': {
        const control: Point = [n(0), n(1)];
        const end: Point = [n(2), n(3)];
        const third = 2 / 3;
        cubicTo(
          [current[0] + third * (control[0] - current[0]), current[1] + third * (control[1] - current[1])],
          [end[0] + third * (control[0] - end[0]), end[1] + third * (control[1] - end[1])],
          end,
        );
        break;
      }
      case 'Z':
        lineTo(start);
        break;
    }
  }
  return segments;
}

/** Die Kanten der Körpermittellinie, Drehung eingerechnet. */
export function outlineSegments(body: Primitive): readonly Segment[] {
  const rotation = body.transform?.rotate;
  let segments: Segment[];
  switch (body.type) {
    case 'rect':
      segments = chain(
        [
          [body.x, body.y],
          [body.x + body.width, body.y],
          [body.x + body.width, body.y + body.height],
          [body.x, body.y + body.height],
        ],
        true,
      );
      break;
    case 'circle':
      segments = chain(
        Array.from({ length: CIRCLE_STEPS }, (_, step): Point => {
          const angle = (2 * Math.PI * step) / CIRCLE_STEPS;
          return [body.cx + body.r * Math.cos(angle), body.cy + body.r * Math.sin(angle)];
        }),
        true,
      );
      break;
    case 'polyline':
      segments = chain(body.points, body.closed === true);
      break;
    case 'path':
      segments = pathSegments(body.d);
      break;
    default:
      throw new Error(`body-outline: Körperprimitiv "${body.type}" hat keine Fläche.`);
  }
  return rotation === undefined
    ? segments
    : segments.map(([from, to]): Segment => [rotate(from, rotation), rotate(to, rotation)]);
}

/**
 * Schnittpunkte der Mittellinie mit der Waagerechten `y`, aufsteigend. Halboffen gezählt (eine
 * Kante zählt an ihrem oberen, nicht an ihrem unteren Ende), damit eine Zeile durch einen Knick
 * oder eine waagerechte Kante jeden Rand genau einmal trifft.
 */
function crossingsAt(segments: readonly Segment[], y: number): number[] {
  const xs: number[] = [];
  for (const [[x1, y1], [x2, y2]] of segments) {
    if ((y1 <= y && y < y2) || (y2 <= y && y < y1)) {
      xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
    }
  }
  return xs.sort((a, b) => a - b);
}

export interface SpanMm {
  readonly minX: number;
  readonly maxX: number;
}

/** Abtastzeilen eines Streifens: die Ränder, zwölf Zwischenzeilen und knapp neben jedem Knick. */
function bandRows(segments: readonly Segment[], topMm: number, bottomMm: number): number[] {
  const rows = Array.from({ length: 13 }, (_, index) => topMm + ((bottomMm - topMm) * index) / 12);
  for (const [[, y]] of segments) {
    for (const near of [y - 1e-4, y + 1e-4]) if (near > topMm && near < bottomMm) rows.push(near);
  }
  return rows;
}

/** Die Innenstrecken einer Zeile nach der Gerade-ungerade-Regel. */
function rowIntervals(segments: readonly Segment[], y: number): SpanMm[] {
  const xs = crossingsAt(segments, y);
  const intervals: SpanMm[] = [];
  for (let index = 0; index + 1 < xs.length; index += 2) {
    intervals.push({ minX: xs[index]!, maxX: xs[index + 1]! });
  }
  return intervals;
}

function intersect(left: readonly SpanMm[], right: readonly SpanMm[]): SpanMm[] {
  const result: SpanMm[] = [];
  for (const a of left) {
    for (const b of right) {
      const minX = Math.max(a.minX, b.minX);
      const maxX = Math.min(a.maxX, b.maxX);
      if (maxX > minX) result.push({ minX, maxX });
    }
  }
  return result;
}

/**
 * Die breiteste Strecke, die der Körper im Streifen `topMm…bottomMm` **durchgehend** im Inneren
 * führt: die Innenstrecken jeder Zeile, über den Streifen geschnitten. `undefined`, wenn keine
 * Strecke den ganzen Streifen hindurch innen bleibt — dann passte dort kein Lauf in den Körper.
 * Ein offener Polyzug (der Haken des Ereignisses) zählt wie eine Fläche zwischen seinen Schenkeln.
 */
export function innerSpanMm(
  segments: readonly Segment[],
  topMm: number,
  bottomMm: number,
): SpanMm | undefined {
  let common: SpanMm[] | undefined;
  for (const y of bandRows(segments, topMm, bottomMm)) {
    const intervals = rowIntervals(segments, y);
    common = common === undefined ? intervals : intersect(common, intervals);
    if (common.length === 0) return undefined;
  }
  return common?.reduce((best, next) => (next.maxX - next.minX > best.maxX - best.minX ? next : best));
}

/**
 * Wie weit der Körper im Streifen `topMm…bottomMm` **höchstens** reicht: die äußersten
 * Schnittpunkte über alle Zeilen. `undefined`, wenn der Streifen den Körper nicht berührt. Ein
 * Lauf neben dem Körper muss links von `minX` oder rechts von `maxX` bleiben.
 */
export function outerSpanMm(
  segments: readonly Segment[],
  topMm: number,
  bottomMm: number,
): SpanMm | undefined {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  for (const y of bandRows(segments, topMm, bottomMm)) {
    for (const x of crossingsAt(segments, y)) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
  }
  return Number.isFinite(minX) ? { minX, maxX } : undefined;
}
