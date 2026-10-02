import type { Point, Primitive, Rotation } from '@einsatzzeichen/schema';
import type { BoundsMm } from '../bounds.js';
import { tokenizePath } from '../path-commands.js';

/**
 * Achsparallele affine Abbildung `x' = tx + sx · x`, `y' = ty + sy · y` — das Werkzeug, mit dem
 * eine vermessene Zeichnung auf eine andere Hülle übertragen wird (Körpermarken, eingepasste
 * Piktogramme). Gespiegelt wird nie: beide Faktoren sind positiv.
 *
 * Anders als `Mapping` in `layout/state-placement.ts` trägt sie zwei Faktoren. Eine randbündige
 * Marke muss an einer anders proportionierten Hülle von Kante zu Kante reichen; dafür genügt ein
 * gemeinsamer Faktor nicht. Kreise bleiben dabei rund (Radius mit dem kleineren Faktor), Pfade
 * werden punktweise abgebildet — eine affine Abbildung führt Bézierkurven in Bézierkurven über.
 */
export interface Affine {
  readonly sx: number;
  readonly sy: number;
  readonly tx: number;
  readonly ty: number;
}

export const IDENTITY_AFFINE: Affine = Object.freeze({ sx: 1, sy: 1, tx: 0, ty: 0 });

const round3 = (value: number): number => {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? 0 : rounded;
};

export function applyAffine(m: Affine, [x, y]: Point): Point {
  return [m.tx + m.sx * x, m.ty + m.sy * y];
}

/** Bildet die Hülle `from` exakt auf `to` ab, je Achse mit eigenem Faktor. */
export function boxToBox(from: BoundsMm, to: BoundsMm): Affine {
  const sx = (to.maxX - to.minX) / (from.maxX - from.minX);
  const sy = (to.maxY - to.minY) / (from.maxY - from.minY);
  return { sx, sy, tx: to.minX - sx * from.minX, ty: to.minY - sy * from.minY };
}

/** Gleichmäßiger Faktor `k` um den Punkt `from`, der dabei nach `to` wandert. */
export function uniformAbout(from: Point, to: Point, k: number): Affine {
  return { sx: k, sy: k, tx: to[0] - k * from[0], ty: to[1] - k * from[1] };
}

export function isUniform(m: Affine): boolean {
  return Math.abs(m.sx - m.sy) < 1e-9;
}

/** Ein stabiler Schlüssel der Abbildung, für Zwischenspeicher. */
export function affineKey(m: Affine): string {
  return [m.sx, m.sy, m.tx, m.ty].map((value) => value.toFixed(6)).join('|');
}

export interface MapOptions {
  /** Strichstärke jedes gestrichenen Primitivs nach der Abbildung; ohne Angabe bleibt sie. */
  readonly strokeWidthMm?: number;
}

function rotatePoint([x, y]: Point, rotate: Rotation): Point {
  const rad = (rotate.angle * Math.PI) / 180;
  const dx = x - rotate.cx;
  const dy = y - rotate.cy;
  return [
    rotate.cx + dx * Math.cos(rad) - dy * Math.sin(rad),
    rotate.cy + dx * Math.sin(rad) + dy * Math.cos(rad),
  ];
}

type PointMap = (point: Point) => Point;

function mapPathData(d: string, map: PointMap): string {
  const { commands, problems } = tokenizePath(d);
  if (problems.length > 0) throw new Error(`Pfad nicht abbildbar: ${problems.join('; ')}`);
  // H und V werden zu L: unter einer Drehung blieben sie nicht achsparallel, und der laufende
  // Punkt ist ohnehin bekannt.
  let current: Point = [0, 0];
  let start: Point = [0, 0];
  const out: string[] = [];
  const emit = (command: string, points: readonly Point[]): void => {
    out.push(`${command} ${points.map((point) => {
      const [x, y] = map(point);
      return `${round3(x)} ${round3(y)}`;
    }).join(', ')}`);
  };
  for (const { command, numbers } of commands) {
    const pairs: Point[] = [];
    for (let index = 0; index + 1 < numbers.length; index += 2) {
      pairs.push([numbers[index] as number, numbers[index + 1] as number]);
    }
    switch (command) {
      case 'M':
        current = pairs[0] as Point;
        start = current;
        emit('M', pairs);
        break;
      case 'L':
      case 'C':
      case 'Q':
        emit(command, pairs);
        current = pairs.at(-1) as Point;
        break;
      case 'H':
        current = [numbers[0] as number, current[1]];
        emit('L', [current]);
        break;
      case 'V':
        current = [current[0], numbers[0] as number];
        emit('L', [current]);
        break;
      case 'Z':
        out.push('Z');
        current = start;
        break;
    }
  }
  return out.join(' ');
}

function mapStyle(style: Primitive['style'], options: MapOptions): Primitive['style'] {
  if (style === undefined) return undefined;
  if (options.strokeWidthMm === undefined || style.strokeWidth === undefined) return style;
  return { ...style, strokeWidth: options.strokeWidthMm };
}

/**
 * Bildet ein Primitiv ab. Drehungen werden in die Geometrie eingerechnet, wo die Abbildung sie
 * nicht erhält (ungleiche Faktoren): ein gedrehtes Rechteck wird dann zum geschlossenen Polyzug.
 * Eine Verschiebung an einer Gruppe geht in die Abbildung ihrer Kinder ein.
 */
export function mapPrimitive(m: Affine, primitive: Primitive, options: MapOptions = {}): Primitive {
  return mapWith(m, primitive, options, (point) => applyAffine(m, point));
}

function mapWith(m: Affine, primitive: Primitive, options: MapOptions, outer: PointMap): Primitive {
  const rotate = primitive.transform?.rotate;
  const translate = primitive.transform?.translate;
  if (primitive.type === 'group') {
    if (rotate !== undefined) throw new Error('Abbildung: gedrehte Gruppen sind nicht belegt.');
    const inner: PointMap = translate === undefined
      ? outer
      : ([x, y]) => outer([x + translate.dxMm, y + translate.dyMm]);
    return {
      type: 'group',
      ...(primitive.role === undefined ? {} : { role: primitive.role }),
      ...(primitive.style === undefined ? {} : { style: primitive.style }),
      children: primitive.children.map((child) => mapWith(m, child, options, inner)),
    };
  }
  const map: PointMap = rotate === undefined ? outer : (point) => outer(rotatePoint(point, rotate));
  const style = mapStyle(primitive.style, options);
  const base = {
    ...(primitive.role === undefined ? {} : { role: primitive.role }),
    ...(style === undefined ? {} : { style }),
  };
  const kMin = Math.min(m.sx, m.sy);
  const pt = (point: Point): Point => {
    const [x, y] = map(point);
    return [round3(x), round3(y)];
  };
  switch (primitive.type) {
    case 'line': {
      const [x1, y1] = pt([primitive.x1, primitive.y1]);
      const [x2, y2] = pt([primitive.x2, primitive.y2]);
      return { type: 'line', ...base, x1, y1, x2, y2 };
    }
    case 'polyline':
      return {
        type: 'polyline',
        ...base,
        points: primitive.points.map(pt),
        ...(primitive.closed === undefined ? {} : { closed: primitive.closed }),
      };
    case 'circle': {
      const [cx, cy] = pt([primitive.cx, primitive.cy]);
      return { type: 'circle', ...base, cx, cy, r: round3(primitive.r * kMin) };
    }
    case 'rect': {
      const { x, y, width, height } = primitive;
      if (rotate !== undefined || primitive.rx !== undefined && !isUniform(m)) {
        if (primitive.rx !== undefined) {
          throw new Error('Abbildung: gerundete Rechtecke mit ungleichen Faktoren sind nicht belegt.');
        }
        return {
          type: 'polyline',
          ...base,
          closed: true,
          points: ([[x, y], [x + width, y], [x + width, y + height], [x, y + height]] as Point[])
            .map(pt),
        };
      }
      const [x0, y0] = pt([x, y]);
      return {
        type: 'rect',
        ...base,
        x: x0,
        y: y0,
        width: round3(width * m.sx),
        height: round3(height * m.sy),
        ...(primitive.rx === undefined ? {} : { rx: round3(primitive.rx * kMin) }),
      };
    }
    case 'path':
      return { type: 'path', ...base, d: mapPathData(primitive.d, map) };
    case 'text': {
      if (rotate !== undefined) throw new Error('Abbildung: gedrehter Text ist nicht belegt.');
      const [x, y] = pt([primitive.x, primitive.y]);
      const [bx, by] = pt([primitive.boxMm.xMm, primitive.boxMm.yMm]);
      const [bx2, by2] = pt([
        primitive.boxMm.xMm + primitive.boxMm.widthMm,
        primitive.boxMm.yMm + primitive.boxMm.heightMm,
      ]);
      return {
        ...primitive,
        ...base,
        x,
        y,
        sizeMm: round3(primitive.sizeMm * kMin),
        boxMm: { xMm: bx, yMm: by, widthMm: round3(bx2 - bx), heightMm: round3(by2 - by) },
        ...(primitive.minRenderPx === undefined
          ? {}
          : { minRenderPx: Math.ceil(primitive.minRenderPx / kMin) }),
      };
    }
  }
}

/** Hülle (Mittellinie) mehrerer Primitive. */
export function unionBounds(bounds: readonly BoundsMm[]): BoundsMm {
  if (bounds.length === 0) throw new Error('unionBounds: keine Hülle.');
  return bounds.reduce((a, b) => ({
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  }));
}
