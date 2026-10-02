import type { Point, Primitive } from '@einsatzzeichen/schema';
import { tokenizePath } from '../path-commands.js';

/**
 * Ebene Hilfsgeometrie der abgeleiteten Körperformen: Umriss als Polygon, Parallelversatz,
 * Schnitt mit einem waagerechten Streifen, Skalierung eines Primitivs.
 *
 * **Warum Polygone und keine exakten Kurven.** Abgeleitet wird an Körpern, die kein Original in
 * dieser Fassung zeigt; vermessen ist dort nur die Ausgangsform. Ein fein abgetasteter Umriss
 * (Sehnenfehler unter 0,005 mm, zwei Größenordnungen unter der Strichbreite) trägt jeden
 * Körpertyp — Rechteck, Raute, Kreis, Polyzug, Kubikpfad — mit **einem** Verfahren. Exakte
 * Kurvenversätze wie `deckCurveInnerField` bleiben den vermessenen Feldern vorbehalten.
 */

export type Vec = readonly [number, number];

/** Abtastschritte je Kubik und je Vollkreis. */
const CUBIC_STEPS = 24;
const CIRCLE_STEPS = 96;

const DECIMALS = 4;

export function round(value: number): number {
  const rounded = Number(value.toFixed(DECIMALS));
  return Object.is(rounded, -0) ? 0 : rounded;
}

function rotate(point: Vec, angleDeg: number, cx: number, cy: number): Vec {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = point[0] - cx;
  const dy = point[1] - cy;
  return [cx + dx * Math.cos(rad) - dy * Math.sin(rad), cy + dx * Math.sin(rad) + dy * Math.cos(rad)];
}

function cubic(p0: Vec, p1: Vec, p2: Vec, p3: Vec, t: number): Vec {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}

/** Die Unterpfade eines `d`-Strings als Punktzüge, Kubiken und Quadratiken abgetastet. */
function pathRings(d: string): Vec[][] {
  const { commands, problems } = tokenizePath(d);
  if (problems.length > 0) throw new Error(`outline: Pfad nicht lesbar (${problems.join('; ')}).`);
  const rings: Vec[][] = [];
  let ring: Vec[] = [];
  let current: Vec = [0, 0];
  for (const { command, numbers: n } of commands) {
    switch (command) {
      case 'M':
        if (ring.length > 0) rings.push(ring);
        current = [n[0]!, n[1]!];
        ring = [current];
        break;
      case 'L':
        current = [n[0]!, n[1]!];
        ring.push(current);
        break;
      case 'H':
        current = [n[0]!, current[1]];
        ring.push(current);
        break;
      case 'V':
        current = [current[0], n[0]!];
        ring.push(current);
        break;
      case 'C':
      case 'Q': {
        const start = current;
        const [c1, c2, end]: [Vec, Vec, Vec] = command === 'C'
          ? [[n[0]!, n[1]!], [n[2]!, n[3]!], [n[4]!, n[5]!]]
          : (() => {
              const q: Vec = [n[0]!, n[1]!];
              const e: Vec = [n[2]!, n[3]!];
              return [
                [start[0] + (2 / 3) * (q[0] - start[0]), start[1] + (2 / 3) * (q[1] - start[1])],
                [e[0] + (2 / 3) * (q[0] - e[0]), e[1] + (2 / 3) * (q[1] - e[1])],
                e,
              ];
            })();
        for (let i = 1; i <= CUBIC_STEPS; i += 1) ring.push(cubic(start, c1, c2, end, i / CUBIC_STEPS));
        current = end;
        break;
      }
      case 'Z':
        break;
    }
  }
  if (ring.length > 0) rings.push(ring);
  return rings;
}

/** Entfernt doppelte Folgepunkte und einen Schlusspunkt, der den Anfang wiederholt. */
function dedupe(ring: readonly Vec[]): Vec[] {
  const out: Vec[] = [];
  for (const point of ring) {
    const last = out.at(-1);
    if (last === undefined || Math.hypot(point[0] - last[0], point[1] - last[1]) > 1e-9) out.push(point);
  }
  const first = out[0];
  const last = out.at(-1);
  if (first !== undefined && last !== undefined && out.length > 1 &&
    Math.hypot(first[0] - last[0], first[1] - last[1]) <= 1e-9) out.pop();
  return out;
}

/**
 * Der Umriss eines flächigen Körperprimitivs (Mittellinie) als geschlossenes Polygon. Ein offener
 * Polyzug wird als geschlossen gelesen: seine Fläche ist die, die er umgreift.
 */
export function outlineOf(primitive: Primitive): Vec[] {
  switch (primitive.type) {
    case 'rect': {
      const { x, y, width, height } = primitive;
      const corners: Vec[] = [[x, y], [x + width, y], [x + width, y + height], [x, y + height]];
      const turn = primitive.transform?.rotate;
      return turn === undefined ? corners : corners.map((c) => rotate(c, turn.angle, turn.cx, turn.cy));
    }
    case 'circle':
      return Array.from({ length: CIRCLE_STEPS }, (_, i): Vec => {
        const a = (2 * Math.PI * i) / CIRCLE_STEPS;
        return [primitive.cx + primitive.r * Math.cos(a), primitive.cy + primitive.r * Math.sin(a)];
      });
    case 'polyline':
      return dedupe(primitive.points.map((p): Vec => [p[0], p[1]]));
    case 'path': {
      const rings = pathRings(primitive.d);
      if (rings.length !== 1) {
        throw new Error(`outline: Körperpfad mit ${rings.length} Unterpfaden wird nicht abgeleitet.`);
      }
      return dedupe(rings[0]!);
    }
    default:
      throw new Error(`outline: kein flächiges Körperprimitiv (${primitive.type}).`);
  }
}

/** Offene Strichzüge eines Zusatzprimitivs (Deichsel, Rahmen, Traufe) für Abstandsprüfungen. */
export function strokeChainsOf(primitive: Primitive): Vec[][] {
  switch (primitive.type) {
    case 'line':
      return [[[primitive.x1, primitive.y1], [primitive.x2, primitive.y2]]];
    case 'polyline': {
      const points = primitive.points.map((p): Vec => [p[0], p[1]]);
      return [primitive.closed === true && points.length > 0 ? [...points, points[0]!] : points];
    }
    case 'path':
      return pathRings(primitive.d);
    case 'rect':
    case 'circle': {
      const ring = outlineOf(primitive);
      return [[...ring, ring[0]!]];
    }
    default:
      return [];
  }
}

/** Vorzeichenbehaftete Fläche (positiv = im Uhrzeigersinn in SVG-Koordinaten, y nach unten). */
function signedArea(ring: readonly Vec[]): number {
  let sum = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}

/**
 * Parallelversatz eines Polygons um `insetMm` nach innen, mit Gehrung (die Versatzgeraden
 * benachbarter Kanten schneiden sich). Das ist der Versatz, den ein Zeichenprogramm mit
 * „Pfad verschieben, Ecken spitz" erzeugt, und an konvexen Ecken der exakte Parallelversatz.
 */
export function offsetRing(ring: readonly Vec[], insetMm: number): Vec[] {
  const points = dedupe(ring);
  const n = points.length;
  // Innen liegt bei positiver Fläche (Uhrzeigersinn, y nach unten) rechts der Laufrichtung.
  const side = signedArea(points) > 0 ? 1 : -1;
  const lines = points.map((a, i) => {
    const b = points[(i + 1) % n]!;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const length = Math.hypot(dx, dy);
    const nx = (-dy / length) * side;
    const ny = (dx / length) * side;
    return { p: [a[0] + nx * insetMm, a[1] + ny * insetMm] as Vec, d: [dx / length, dy / length] as Vec };
  });
  return lines.map((line, i) => {
    const previous = lines[(i - 1 + n) % n]!;
    const cross = previous.d[0] * line.d[1] - previous.d[1] * line.d[0];
    if (Math.abs(cross) < 1e-9) return line.p;
    const wx = line.p[0] - previous.p[0];
    const wy = line.p[1] - previous.p[1];
    const t = (wx * line.d[1] - wy * line.d[0]) / cross;
    return [previous.p[0] + t * previous.d[0], previous.p[1] + t * previous.d[1]] as Vec;
  });
}

/**
 * Schnitt eines Polygons mit der Halbebene `y >= limit` (`keep: 'below'`) oder `y <= limit`
 * (`keep: 'above'`) — Sutherland-Hodgman an einer waagerechten Geraden.
 */
export function clipRingY(ring: readonly Vec[], limit: number, keep: 'above' | 'below'): Vec[] {
  const inside = (p: Vec): boolean => (keep === 'below' ? p[1] >= limit : p[1] <= limit);
  const out: Vec[] = [];
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    const aIn = inside(a);
    const bIn = inside(b);
    if (aIn) out.push(a);
    if (aIn !== bIn) {
      const t = (limit - a[1]) / (b[1] - a[1]);
      out.push([a[0] + t * (b[0] - a[0]), limit]);
    }
  }
  return dedupe(out);
}

/** Ein Polygon als geschlossener `d`-String aus Geraden, auf 4 Nachkommastellen. */
export function ringPath(ring: readonly Vec[]): string {
  const [first, ...rest] = ring.map((p) => `${round(p[0])} ${round(p[1])}`);
  if (first === undefined) throw new Error('ringPath: leeres Polygon.');
  return `M ${first} ${rest.map((p) => `L ${p}`).join(' ')} Z`;
}

/** Ob ein Polygon ein achsparalleles Rechteck ist (vier Ecken, Kanten waagerecht/senkrecht). */
export function axisRect(ring: readonly Vec[]): { x: number; y: number; width: number; height: number } | undefined {
  if (ring.length !== 4) return undefined;
  const xs = [...new Set(ring.map((p) => round(p[0])))];
  const ys = [...new Set(ring.map((p) => round(p[1])))];
  if (xs.length !== 2 || ys.length !== 2) return undefined;
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

/** Kürzester Abstand zweier Strecken; null, wenn sie sich schneiden. */
export function segmentDistance(a1: Vec, a2: Vec, b1: Vec, b2: Vec): number {
  const orient = (p: Vec, q: Vec, r: Vec): number =>
    (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const o1 = orient(a1, a2, b1);
  const o2 = orient(a1, a2, b2);
  const o3 = orient(b1, b2, a1);
  const o4 = orient(b1, b2, a2);
  if (o1 * o2 < 0 && o3 * o4 < 0) return 0;
  const pointSegment = (p: Vec, s1: Vec, s2: Vec): number => {
    const dx = s2[0] - s1[0];
    const dy = s2[1] - s1[1];
    const length2 = dx * dx + dy * dy;
    const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - s1[0]) * dx + (p[1] - s1[1]) * dy) / length2));
    return Math.hypot(p[0] - (s1[0] + t * dx), p[1] - (s1[1] + t * dy));
  };
  return Math.min(
    pointSegment(a1, b1, b2),
    pointSegment(a2, b1, b2),
    pointSegment(b1, a1, a2),
    pointSegment(b2, a1, a2),
  );
}

/** Kürzester Abstand zwischen zwei Punktzügen (jeweils als offene Kette gelesen). */
export function chainDistance(a: readonly Vec[], b: readonly Vec[]): number {
  let best = Infinity;
  for (let i = 0; i + 1 < a.length; i += 1) {
    for (let j = 0; j + 1 < b.length; j += 1) {
      best = Math.min(best, segmentDistance(a[i]!, a[i + 1]!, b[j]!, b[j + 1]!));
      if (best === 0) return 0;
    }
  }
  return best;
}

/** Eine gleichmäßige Skalierung um einen Ankerpunkt, auf alle Koordinaten eines Primitivs. */
export interface Scaling {
  readonly factor: number;
  readonly originX: number;
  readonly originY: number;
}

function scalePoint([x, y]: Vec | Point, s: Scaling): [number, number] {
  return [round(s.originX + s.factor * (x - s.originX)), round(s.originY + s.factor * (y - s.originY))];
}

/** Bildet jede Koordinate eines `d`-Strings getrennt nach Achse ab; die Kommandos bleiben. */
export function mapPath(d: string, mapX: (x: number) => number, mapY: (y: number) => number): string {
  const { commands, problems } = tokenizePath(d);
  if (problems.length > 0) throw new Error(`mapPath: Pfad nicht lesbar (${problems.join('; ')}).`);
  const fx = (x: number): number => round(mapX(x));
  const fy = (y: number): number => round(mapY(y));
  return commands.map(({ command, numbers: n }) => {
    switch (command) {
      case 'H':
        return `H ${fx(n[0]!)}`;
      case 'V':
        return `V ${fy(n[0]!)}`;
      case 'Z':
        return 'Z';
      default: {
        const pairs: string[] = [];
        for (let i = 0; i + 1 < n.length; i += 2) pairs.push(`${fx(n[i]!)} ${fy(n[i + 1]!)}`);
        return `${command} ${pairs.join(', ')}`;
      }
    }
  }).join(' ');
}

function scalePath(d: string, s: Scaling): string {
  return mapPath(
    d,
    (x) => s.originX + s.factor * (x - s.originX),
    (y) => s.originY + s.factor * (y - s.originY),
  );
}

/**
 * Skaliert ein Primitiv um `s.origin`. Der Typ bleibt erhalten — ein Rechteck bleibt ein
 * Rechteck, eine Raute ein gedrehtes Rechteck —, weil die Layoutprofile ihn erwarten
 * (`rectBody` verschiebt nur Rechtecke, `rotatedSquareProfile` nur gedrehte). Strichbreiten
 * bleiben unverändert: der Strich ist an jeder Fassung 0,5 mm.
 */
export function scalePrimitive(primitive: Primitive, s: Scaling): Primitive {
  switch (primitive.type) {
    case 'rect': {
      const [x, y] = scalePoint([primitive.x, primitive.y], s);
      const turn = primitive.transform?.rotate;
      return {
        ...primitive,
        x,
        y,
        width: round(primitive.width * s.factor),
        height: round(primitive.height * s.factor),
        ...(turn === undefined
          ? {}
          : (() => {
              const [cx, cy] = scalePoint([turn.cx, turn.cy], s);
              return { transform: { ...primitive.transform, rotate: { ...turn, cx, cy } } };
            })()),
      };
    }
    case 'circle': {
      const [cx, cy] = scalePoint([primitive.cx, primitive.cy], s);
      return { ...primitive, cx, cy, r: round(primitive.r * s.factor) };
    }
    case 'polyline':
      return { ...primitive, points: primitive.points.map((p) => scalePoint(p, s)) };
    case 'line': {
      const [x1, y1] = scalePoint([primitive.x1, primitive.y1], s);
      const [x2, y2] = scalePoint([primitive.x2, primitive.y2], s);
      return { ...primitive, x1, y1, x2, y2 };
    }
    case 'path':
      return { ...primitive, d: scalePath(primitive.d, s) };
    default:
      throw new Error(`scalePrimitive: ${primitive.type} wird nicht skaliert.`);
  }
}
