import type { Point, Primitive } from '@einsatzzeichen/schema';

/** Achsparallele Hülle in Millimetern. */
export interface BoundsMm {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function fromPoints(points: readonly Point[]): BoundsMm {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

function corners(bounds: BoundsMm): Point[] {
  return [
    [bounds.minX, bounds.minY],
    [bounds.maxX, bounds.minY],
    [bounds.maxX, bounds.maxY],
    [bounds.minX, bounds.maxY],
  ];
}

function merge(list: BoundsMm[]): BoundsMm {
  return {
    minX: Math.min(...list.map((b) => b.minX)),
    minY: Math.min(...list.map((b) => b.minY)),
    maxX: Math.max(...list.map((b) => b.maxX)),
    maxY: Math.max(...list.map((b) => b.maxY)),
  };
}

/**
 * Hülle eines Primitivs in Millimetern, inklusive Drehung.
 * Pfad-Primitive liefern eine leere Hülle — Piktogramme werden nicht geometrisch verglichen.
 */
export function boundsOfMm(primitive: Primitive): BoundsMm {
  let base: BoundsMm;

  switch (primitive.type) {
    case 'rect':
      base = {
        minX: primitive.x,
        minY: primitive.y,
        maxX: primitive.x + primitive.width,
        maxY: primitive.y + primitive.height,
      };
      break;
    case 'circle':
      base = {
        minX: primitive.cx - primitive.r,
        minY: primitive.cy - primitive.r,
        maxX: primitive.cx + primitive.r,
        maxY: primitive.cy + primitive.r,
      };
      break;
    case 'line':
      base = fromPoints([
        [primitive.x1, primitive.y1],
        [primitive.x2, primitive.y2],
      ]);
      break;
    case 'polyline':
      base = fromPoints(primitive.points);
      break;
    case 'group':
      base =
        primitive.children.length > 0
          ? merge(primitive.children.map(boundsOfMm))
          : { minX: 0, minY: 0, maxX: 0, maxY: 0 };
      break;
    case 'path':
      base = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
      break;
  }

  const rotate = primitive.transform?.rotate;
  if (!rotate) return base;

  const rad = (rotate.angle * Math.PI) / 180;
  const rotated = corners(base).map(([x, y]): Point => {
    const dx = x - rotate.cx;
    const dy = y - rotate.cy;
    return [
      rotate.cx + dx * Math.cos(rad) - dy * Math.sin(rad),
      rotate.cy + dx * Math.sin(rad) + dy * Math.cos(rad),
    ];
  });
  return fromPoints(rotated);
}
