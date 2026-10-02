import type { BodyVariantId, Point, Primitive, SymbolKind } from '@einsatzzeichen/schema';
import { boundsOfMm, type BoundsMm } from '../bounds.js';
import { baseDrawing } from '../geometry/base-symbols.js';
import { tokenizePath } from '../path-commands.js';
import { applyAffine, boxToBox } from './affine.js';

/**
 * Die Fläche eines Körpers, auf der Piktogramme und Körpermarken stehen dürfen — für **jede**
 * Körperform, auch für die ohne Flächenmodell im Clipping-Gate (Pfade, Polyzüge, Fahrzeugrümpfe).
 *
 * Die Kontur ist die Mittellinie des Körperstrichs als Polygon: Rechtecke (auch gedrehte, die
 * Personenraute) über ihre Ecken, Kreise als 192-Eck, Pfade mit abgetasteten Kurven. Das
 * Fahrwerk und andere Zusatzgeometrie gehören nicht dazu — sie stehen außerhalb des Körpers.
 * Ein Fußband (3-mm-Schwarzband an der Körperunterkante, `foot-band`) gehört dazu, ist aber
 * besetzt: die Fläche endet an seiner Oberkante. So zeichnet die Referenz die Marken an den
 * Fußbandformen (G.1 bis G.8: Zeltdach bis `maxY − 3`).
 */
export interface BodyRegion {
  /** Hülle des Körpers (Mittellinie), wie `compose()` sie an `bodyMark()` gibt. */
  readonly hull: BoundsMm;
  /** Hülle der freien Fläche. */
  readonly bounds: BoundsMm;
  /** Kontur der freien Fläche, geschlossen gedacht (letzter Punkt ≠ erster). */
  readonly polygon: readonly Point[];
  /** Kennung von Körperform und Hülle, für Zwischenspeicher. */
  readonly key: string;
}

const CIRCLE_SEGMENTS = 192;
const CURVE_STEPS = 16;

function rotatePoint([x, y]: Point, angle: number, cx: number, cy: number): Point {
  const rad = (angle * Math.PI) / 180;
  const dx = x - cx;
  const dy = y - cy;
  return [cx + dx * Math.cos(rad) - dy * Math.sin(rad), cy + dx * Math.sin(rad) + dy * Math.cos(rad)];
}

function pathPolygon(d: string): Point[] {
  const { commands } = tokenizePath(d);
  const points: Point[] = [];
  let current: Point = [0, 0];
  let start: Point = [0, 0];
  for (const { command, numbers: n } of commands) {
    switch (command) {
      case 'M':
        current = [n[0] as number, n[1] as number];
        start = current;
        points.push(current);
        break;
      case 'L':
        current = [n[0] as number, n[1] as number];
        points.push(current);
        break;
      case 'H':
        current = [n[0] as number, current[1]];
        points.push(current);
        break;
      case 'V':
        current = [current[0], n[0] as number];
        points.push(current);
        break;
      case 'C': {
        const [x0, y0] = current;
        const [x1, y1, x2, y2, x3, y3] = n as [number, number, number, number, number, number];
        for (let step = 1; step <= CURVE_STEPS; step += 1) {
          const t = step / CURVE_STEPS;
          const u = 1 - t;
          points.push([
            u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
            u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
          ]);
        }
        current = [x3, y3];
        break;
      }
      case 'Q': {
        const [x0, y0] = current;
        const [x1, y1, x2, y2] = n as [number, number, number, number];
        for (let step = 1; step <= CURVE_STEPS; step += 1) {
          const t = step / CURVE_STEPS;
          const u = 1 - t;
          points.push([u * u * x0 + 2 * u * t * x1 + t * t * x2, u * u * y0 + 2 * u * t * y1 + t * t * y2]);
        }
        current = [x2, y2];
        break;
      }
      case 'Z':
        current = start;
        break;
    }
  }
  return dedupe(points);
}

function dedupe(points: readonly Point[]): Point[] {
  const out: Point[] = [];
  for (const point of points) {
    const last = out.at(-1);
    if (last === undefined || Math.hypot(last[0] - point[0], last[1] - point[1]) > 1e-9) out.push(point);
  }
  const first = out[0];
  const last = out.at(-1);
  if (first !== undefined && last !== undefined && out.length > 1 &&
    Math.hypot(first[0] - last[0], first[1] - last[1]) < 1e-9) {
    out.pop();
  }
  return out;
}

/** Kontur eines Körperprimitivs als Polygon. Ein offener Polyzug (Ereignis) gilt als geschlossen. */
export function contourOf(body: Primitive): Point[] {
  const rotate = body.transform?.rotate;
  const turn = (points: Point[]): Point[] =>
    rotate === undefined ? points : points.map((p) => rotatePoint(p, rotate.angle, rotate.cx, rotate.cy));
  switch (body.type) {
    case 'rect':
      return turn([
        [body.x, body.y],
        [body.x + body.width, body.y],
        [body.x + body.width, body.y + body.height],
        [body.x, body.y + body.height],
      ]);
    case 'circle':
      return turn(Array.from({ length: CIRCLE_SEGMENTS }, (_, index) => {
        const angle = (2 * Math.PI * index) / CIRCLE_SEGMENTS;
        return [body.cx + body.r * Math.cos(angle), body.cy + body.r * Math.sin(angle)] as Point;
      }));
    case 'polyline':
      return turn(dedupe(body.points));
    case 'path':
      return turn(pathPolygon(body.d));
    default:
      throw new Error(`Körperkontur: Primitivart "${body.type}" ist kein Körper.`);
  }
}

/** Schneidet ein Polygon an der Waagerechten `y = maxY` ab und behält den oberen Teil. */
function clipBelow(polygon: readonly Point[], maxY: number): Point[] {
  const out: Point[] = [];
  for (let index = 0; index < polygon.length; index += 1) {
    const a = polygon[index] as Point;
    const b = polygon[(index + 1) % polygon.length] as Point;
    const aIn = a[1] <= maxY;
    const bIn = b[1] <= maxY;
    if (aIn) out.push(a);
    if (aIn !== bIn) {
      const t = (maxY - a[1]) / (b[1] - a[1]);
      out.push([a[0] + t * (b[0] - a[0]), maxY]);
    }
  }
  return dedupe(out);
}

function polygonBounds(polygon: readonly Point[]): BoundsMm {
  return {
    minX: Math.min(...polygon.map(([x]) => x)),
    minY: Math.min(...polygon.map(([, y]) => y)),
    maxX: Math.max(...polygon.map(([x]) => x)),
    maxY: Math.max(...polygon.map(([, y]) => y)),
  };
}

/**
 * Oberkante eines Fußbands: ein Nebenprimitiv der Grundzeichnung, das an der Körperunterkante
 * anliegt und unterhalb der Körpermitte beginnt. Erkannt an der Lage, nicht an der Variante, damit
 * jede künftige Fußbandform (auch an weiteren Körperarten) ohne Liste mitzählt.
 */
function footBandTop(children: readonly Primitive[], body: Primitive, hull: BoundsMm): number | undefined {
  const centerY = (hull.minY + hull.maxY) / 2;
  let top: number | undefined;
  for (const child of children) {
    if (child === body || child.role === 'body') continue;
    if (child.type === 'group' || child.type === 'text' || child.type === 'line') continue;
    const fill = child.style?.fill;
    if (fill === undefined || fill === 'none') continue;
    const bounds = boundsOfMm(child);
    if (Math.abs(bounds.maxY - hull.maxY) > 0.3 || bounds.minY <= centerY) continue;
    if (bounds.maxX - bounds.minX < (hull.maxX - hull.minX) / 2) continue;
    top = top === undefined ? bounds.minY : Math.min(top, bounds.minY);
  }
  return top;
}

interface BaseRegion {
  readonly hull: BoundsMm;
  readonly polygon: readonly Point[];
}

const BASE_REGIONS = new Map<string, BaseRegion>();

function baseRegion(kind: SymbolKind, variant: BodyVariantId | undefined): BaseRegion {
  const key = `${kind}|${variant ?? ''}`;
  const cached = BASE_REGIONS.get(key);
  if (cached !== undefined) return cached;
  const drawing = baseDrawing(kind, variant);
  const body = drawing.children.find((child) => child.role === 'body');
  if (body === undefined) throw new Error(`Grundzeichen "${kind}" hat kein body-Primitiv.`);
  const hull = boundsOfMm(body);
  let polygon = contourOf(body);
  const band = footBandTop(drawing.children, body, hull);
  if (band !== undefined) polygon = clipBelow(polygon, band);
  const region = Object.freeze({ hull, polygon: Object.freeze(polygon) });
  BASE_REGIONS.set(key, region);
  return region;
}

/**
 * Die freie Körperfläche einer Art und Variante an der Hülle `placedHull` (Vorgabe: die Hülle
 * der Grundzeichnung). Die Kontur wird von der Grundhülle auf die platzierte Hülle abgebildet —
 * `compose()` verschiebt und verkleinert den Körper nur, es formt ihn nicht um.
 */
export function bodyRegion(
  kind: SymbolKind,
  variant: BodyVariantId | undefined,
  placedHull?: BoundsMm,
): BodyRegion {
  const base = baseRegion(kind, variant);
  const hull = placedHull ?? base.hull;
  const key = `${kind}|${variant ?? ''}|${[hull.minX, hull.minY, hull.maxX, hull.maxY]
    .map((value) => value.toFixed(4)).join(',')}`;
  if (placedHull === undefined) {
    return { hull, bounds: polygonBounds(base.polygon), polygon: base.polygon, key };
  }
  const map = boxToBox(base.hull, placedHull);
  const polygon = base.polygon.map((point) => applyAffine(map, point));
  return { hull, bounds: polygonBounds(polygon), polygon, key };
}

/** Punkt-im-Polygon (gerade/ungerade Kreuzungen). */
export function insidePolygon(polygon: readonly Point[], [x, y]: Point): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i] as Point;
    const [xj, yj] = polygon[j] as Point;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Abstand eines Punkts zur Kontur. */
export function distanceToContour(polygon: readonly Point[], [x, y]: Point): number {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < polygon.length; i += 1) {
    const [ax, ay] = polygon[i] as Point;
    const [bx, by] = polygon[(i + 1) % polygon.length] as Point;
    const dx = bx - ax;
    const dy = by - ay;
    const length2 = dx * dx + dy * dy;
    const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / length2));
    best = Math.min(best, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
  }
  return best;
}

/**
 * Der erste Schnitt des Strahls von `from` in Richtung `toward` mit der Kontur, jenseits von
 * `from`. `undefined`, wenn der Strahl die Kontur nicht trifft.
 */
export function rayToContour(polygon: readonly Point[], from: Point, toward: Point): Point | undefined {
  const dx = toward[0] - from[0];
  const dy = toward[1] - from[1];
  const length = Math.hypot(dx, dy);
  if (length < 1e-9) return undefined;
  const ux = dx / length;
  const uy = dy / length;
  let best: number | undefined;
  for (let i = 0; i < polygon.length; i += 1) {
    const [ax, ay] = polygon[i] as Point;
    const [bx, by] = polygon[(i + 1) % polygon.length] as Point;
    const ex = bx - ax;
    const ey = by - ay;
    const denominator = ux * ey - uy * ex;
    if (Math.abs(denominator) < 1e-12) continue;
    const t = ((ax - from[0]) * ey - (ay - from[1]) * ex) / denominator;
    const s = ((ax - from[0]) * uy - (ay - from[1]) * ux) / denominator;
    if (t > 1e-6 && s >= -1e-9 && s <= 1 + 1e-9 && (best === undefined || t < best)) best = t;
  }
  return best === undefined ? undefined : [from[0] + best * ux, from[1] + best * uy];
}

/** Die Kontur, so dicht abgetastet, dass kein Stück länger als `stepMm` ist. */
function densify(polygon: readonly Point[], stepMm: number): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i] as Point;
    const b = polygon[(i + 1) % polygon.length] as Point;
    const steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / stepMm));
    for (let step = 0; step < steps; step += 1) {
      const t = step / steps;
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  return out;
}

const INSCRIBED = new Map<string, BoundsMm>();

/**
 * Das größte achsparallele Rechteck mit dem Seitenverhältnis `aspect` (Breite : Höhe) in der
 * freien Fläche. Am Kreis und an der Raute ist das für `aspect = 1` das eingeschriebene Quadrat;
 * am Rechteck derselben Proportion die Fläche selbst.
 *
 * Gerechnet über den gewichteten Tschebyschow-Abstand zur dicht abgetasteten Kontur: Ein Rechteck
 * mit Mittelpunkt c und halber Höhe h liegt in der Fläche, solange c in ihr liegt und kein
 * Konturpunkt q echt in ihm (max(|qx − cx| / aspect, |qy − cy|) < h). Das gilt auch für nicht
 * konvexe Körper (Gebiet, Spontanhelfer). Gesucht wird über ein Raster mit Verfeinerung.
 */
export function inscribedRect(region: BodyRegion, aspect: number): BoundsMm {
  const key = `${region.key}|${aspect.toFixed(4)}`;
  const cached = INSCRIBED.get(key);
  if (cached !== undefined) return cached;
  const samples = densify(region.polygon, 0.1);
  const halfHeightAt = (cx: number, cy: number): number => {
    if (!insidePolygon(region.polygon, [cx, cy])) return 0;
    let best = Number.POSITIVE_INFINITY;
    for (const [qx, qy] of samples) {
      const distance = Math.max(Math.abs(qx - cx) / aspect, Math.abs(qy - cy));
      if (distance < best) best = distance;
    }
    return best;
  };
  const { bounds } = region;
  const grid = 24;
  let bestX = (bounds.minX + bounds.maxX) / 2;
  let bestY = (bounds.minY + bounds.maxY) / 2;
  let bestH = halfHeightAt(bestX, bestY);
  for (let i = 0; i <= grid; i += 1) {
    for (let j = 0; j <= grid; j += 1) {
      const cx = bounds.minX + ((bounds.maxX - bounds.minX) * i) / grid;
      const cy = bounds.minY + ((bounds.maxY - bounds.minY) * j) / grid;
      const h = halfHeightAt(cx, cy);
      if (h > bestH + 1e-9) {
        bestH = h;
        bestX = cx;
        bestY = cy;
      }
    }
  }
  let stepX = (bounds.maxX - bounds.minX) / grid;
  let stepY = (bounds.maxY - bounds.minY) / grid;
  for (let round = 0; round < 14; round += 1) {
    let improved = false;
    for (const [ix, iy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]] as const) {
      const cx = bestX + ix * stepX;
      const cy = bestY + iy * stepY;
      const h = halfHeightAt(cx, cy);
      if (h > bestH + 1e-9) {
        bestH = h;
        bestX = cx;
        bestY = cy;
        improved = true;
      }
    }
    if (!improved) {
      stepX /= 2;
      stepY /= 2;
    }
  }
  const halfWidth = bestH * aspect;
  const result = Object.freeze({
    minX: bestX - halfWidth,
    minY: bestY - bestH,
    maxX: bestX + halfWidth,
    maxY: bestY + bestH,
  });
  INSCRIBED.set(key, result);
  return result;
}
