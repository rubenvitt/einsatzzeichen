import { unitsToMm } from '@einsatzzeichen/schema';
import { deriveRing, parseRectilinearPath, type SubpathBounds } from './path-geometry.js';

/** Achsparallele Hülle in Millimetern, Drehung bereits eingerechnet. */
export interface BoundsMm {
  minXMm: number;
  minYMm: number;
  maxXMm: number;
  maxYMm: number;
}

/**
 * Nach Aussagekraft geordnet:
 * `ring`    — Mittellinie aus einem Außen-/Innenring-Paar, exakt
 * `bounds`  — Füllfläche (rect, circle, polygon), exakt
 * `rect`    — Füllrechteck, gegebenenfalls gedreht
 * `circle`  — Füllkreis
 * `outline` — Außenkante eines Pfads mit mehr als zwei Teilpfaden, um halbe Strichstärke zu groß
 */
export type ShapeKind = 'ring' | 'bounds' | 'rect' | 'circle' | 'outline';

export interface FingerprintShape {
  kind: ShapeKind;
  boundsMm: BoundsMm;
  /** Nur bei `ring`: aus dem Ringabstand zurückgerechnete Strichstärke. */
  strokeWidthMm?: number;
  rotate?: number;
  fill?: string;
}

export interface Fingerprint {
  asset: string;
  viewBox: { width: number; height: number };
  layers: string[];
  fills: string[];
  shapes: FingerprintShape[];
  curvedPaths: number;
}

const LAYER_LABELS: Record<string, string> = {
  'Grundfläche': 'Grundfläche',
  'Flächige_Fülung': 'Flächige_Fülung',
  'Takt_Zeichen__x28_umgewandelt_x29_': 'Takt_Zeichen (umgewandelt)',
  'Takt._Zeichen__x28_Typo_x29_': 'Takt. Zeichen (Typo)',
};

function mm(units: number): number {
  return Math.round(unitsToMm(units) * 1000) / 1000;
}

function normalizeFill(value: string): string {
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toLowerCase();
  return value.toLowerCase();
}

function attrs(fragment: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const match of fragment.matchAll(/([\w:-]+)="([^"]*)"/g)) {
    const [, key, value] = match;
    if (key !== undefined && value !== undefined) result[key] = value;
  }
  return result;
}

function num(value: string | undefined, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Wertet `translate(tx ty) rotate(a)` aus, wie es der Illustrator-Export für
 * gedrehte Quadrate erzeugt, und liefert den Mittelpunkt im Zielkoordinatensystem.
 */
function resolveRotation(
  transform: string | undefined,
  cx: number,
  cy: number,
): { angle: number; cx: number; cy: number } | null {
  if (!transform) return null;
  const rotate = /rotate\(\s*(-?[\d.]+)\s*\)/.exec(transform);
  if (!rotate?.[1]) return null;
  const angle = Number(rotate[1]);

  const translate = /translate\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)\s*\)/.exec(transform);
  const tx = num(translate?.[1]);
  const ty = num(translate?.[2]);

  const rad = (angle * Math.PI) / 180;
  const rx = cx * Math.cos(rad) - cy * Math.sin(rad);
  const ry = cx * Math.sin(rad) + cy * Math.cos(rad);

  return { angle, cx: rx + tx, cy: ry + ty };
}

function boundsFromPoints(points: ReadonlyArray<readonly [number, number]>): BoundsMm {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return {
    minXMm: mm(Math.min(...xs)),
    minYMm: mm(Math.min(...ys)),
    maxXMm: mm(Math.max(...xs)),
    maxYMm: mm(Math.max(...ys)),
  };
}

/** Hülle eines gegebenenfalls gedrehten Rechtecks, in SVG-Einheiten hinein, in mm hinaus. */
function rectBounds(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: { angle: number; cx: number; cy: number } | null,
): BoundsMm {
  const corners: Array<readonly [number, number]> = [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
  ];
  if (!rotation) return boundsFromPoints(corners);

  const rad = (rotation.angle * Math.PI) / 180;
  return boundsFromPoints(
    corners.map(([px, py]) => {
      const dx = px - (x + width / 2);
      const dy = py - (y + height / 2);
      return [
        rotation.cx + dx * Math.cos(rad) - dy * Math.sin(rad),
        rotation.cy + dx * Math.sin(rad) + dy * Math.cos(rad),
      ] as const;
    }),
  );
}

function subpathBounds(subpaths: SubpathBounds[]): BoundsMm {
  return {
    minXMm: mm(Math.min(...subpaths.map((s) => s.minX))),
    minYMm: mm(Math.min(...subpaths.map((s) => s.minY))),
    maxXMm: mm(Math.max(...subpaths.map((s) => s.maxX))),
    maxYMm: mm(Math.max(...subpaths.map((s) => s.maxY))),
  };
}

export function extractFingerprint(svg: string, asset: string): Fingerprint {
  const viewBoxMatch = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  const viewBox = {
    width: num(viewBoxMatch?.[1], 0),
    height: num(viewBoxMatch?.[2], 0),
  };

  const layers: string[] = [];
  for (const match of svg.matchAll(/<g id="([^"]+)"/g)) {
    const raw = match[1];
    if (raw === undefined) continue;
    layers.push(LAYER_LABELS[raw] ?? raw);
  }

  const fills = new Set<string>();
  const shapes: FingerprintShape[] = [];
  let curvedPaths = 0;

  for (const match of svg.matchAll(/<rect([^>]*)\/>/g)) {
    const a = attrs(match[1] ?? '');
    const width = num(a['width']);
    const height = num(a['height']);
    // Die Grundfläche ist ein transparentes Bounding-Rect und trägt keine Information.
    if (a['fill'] === 'none') continue;
    if (a['fill'] !== undefined) fills.add(normalizeFill(a['fill']));

    const x = num(a['x']);
    const y = num(a['y']);
    const rotation = resolveRotation(a['transform'], x + width / 2, y + height / 2);

    const shape: FingerprintShape = {
      kind: 'rect',
      boundsMm: rectBounds(x, y, width, height, rotation),
    };
    if (a['fill'] !== undefined) shape.fill = normalizeFill(a['fill']);
    if (rotation) shape.rotate = rotation.angle;
    shapes.push(shape);
  }

  for (const match of svg.matchAll(/<circle([^>]*)\/>/g)) {
    const a = attrs(match[1] ?? '');
    if (a['fill'] !== undefined && a['fill'] !== 'none') fills.add(normalizeFill(a['fill']));
    const cx = num(a['cx']);
    const cy = num(a['cy']);
    const r = num(a['r']);
    const shape: FingerprintShape = {
      kind: 'circle',
      boundsMm: { minXMm: mm(cx - r), minYMm: mm(cy - r), maxXMm: mm(cx + r), maxYMm: mm(cy + r) },
    };
    if (a['fill'] !== undefined && a['fill'] !== 'none') shape.fill = normalizeFill(a['fill']);
    shapes.push(shape);
  }

  // Polygone tragen bei mehreren Grundzeichen die Füllfläche — 1.7 Gebäude etwa
  // hat gar kein Füllrechteck. Ohne diese Schleife bliebe der Fingerprint leer.
  for (const match of svg.matchAll(/<polygon([^>]*)\/>/g)) {
    const a = attrs(match[1] ?? '');
    if (a['fill'] === 'none') continue;
    if (a['fill'] !== undefined) fills.add(normalizeFill(a['fill']));
    const raw = (a['points'] ?? '').trim().split(/[\s,]+/).map(Number);
    const points: Array<readonly [number, number]> = [];
    for (let i = 0; i + 1 < raw.length; i += 2) {
      const x = raw[i];
      const y = raw[i + 1];
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      points.push([x, y] as const);
    }
    if (points.length === 0) continue;
    const shape: FingerprintShape = { kind: 'bounds', boundsMm: boundsFromPoints(points) };
    if (a['fill'] !== undefined) shape.fill = normalizeFill(a['fill']);
    shapes.push(shape);
  }

  for (const match of svg.matchAll(/<path([^>]*)\/>/g)) {
    const a = attrs(match[1] ?? '');
    if (a['fill'] !== undefined && a['fill'] !== 'none') fills.add(normalizeFill(a['fill']));
    const d = a['d'];
    if (d === undefined) continue;

    const subpaths = parseRectilinearPath(d);
    if (subpaths === null) {
      curvedPaths += 1;
      continue;
    }
    if (subpaths.length === 0) continue;

    const ring = deriveRing(subpaths);
    if (ring) {
      shapes.push({
        kind: 'ring',
        boundsMm: {
          minXMm: mm(ring.x),
          minYMm: mm(ring.y),
          maxXMm: mm(ring.x + ring.width),
          maxYMm: mm(ring.y + ring.height),
        },
        strokeWidthMm: mm(ring.strokeWidth),
      });
      continue;
    }

    // Mehr als zwei Teilpfade (1.7 Gebäude: Außenring, Innenring, Dachlinie) oder
    // kein Ringpaar. Die Außenkante ist um eine halbe Strichstärke zu groß und
    // wird deshalb als schwächere Art `outline` geführt.
    shapes.push({ kind: 'outline', boundsMm: subpathBounds(subpaths) });
  }

  return {
    asset,
    viewBox,
    layers,
    fills: [...fills].sort(),
    shapes,
    curvedPaths,
  };
}
