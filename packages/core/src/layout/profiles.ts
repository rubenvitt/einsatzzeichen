import type { Primitive, SymbolKind } from '@einsatzzeichen/schema';
import { boundsOfMm } from '../bounds.js';

/**
 * Abstand zwischen der Unterkante der Kopfzone und dem Körperanker.
 * An drei Konstellationen der Referenz belegt: C.1.1 (8 → 9), C.1.2 (5 → 6), D.3.7 (4 → 5).
 */
export const HEAD_GAP_MM = 1;

/** Kleinster Abstand der Kopfzone zum oberen Rand der Grundfläche. */
export const HEAD_TOP_MARGIN_MM = 1;

export type LayoutProfileId = 'rect-body' | 'rotated-square-body' | 'circle-body';

export interface LayoutProfile {
  id: LayoutProfileId;
  /** Oberster Punkt der Körper-Mittellinie ohne Kopfzone. */
  defaultAnchorMm: number;
  /**
   * Setzt den Körper relativ zur Kopfzone. `headBottomMm === null` bedeutet: keine Kopfzone,
   * der Körper behält seine Standardgeometrie.
   */
  place(body: Primitive, headBottomMm: number | null): Primitive;
}

/**
 * Setzt eine Kopfzone bekannter Höhe absolut. Sie wird so tief wie möglich gehängt,
 * damit der Körper auf seinem Standardanker bleiben kann — passt sie dort nicht,
 * rutscht sie an den oberen Rand und der Körper weicht aus.
 *
 * Belegt an: Rechteck + Reihe (6, 3) → 2/5; Rechteck + Stapel (6, 7) → 1/8;
 * gedrehtes Quadrat + Reihe (1, 3) → 1/4.
 */
export function placeHead(
  profile: LayoutProfile,
  headHeightMm: number,
): { topMm: number; bottomMm: number } {
  const topMm = Math.max(
    HEAD_TOP_MARGIN_MM,
    profile.defaultAnchorMm - HEAD_GAP_MM - headHeightMm,
  );
  return { topMm, bottomMm: topMm + headHeightMm };
}

function shiftY(body: Primitive, deltaMm: number): Primitive {
  switch (body.type) {
    case 'rect':
      return { ...body, y: body.y + deltaMm };
    case 'circle':
      return { ...body, cy: body.cy + deltaMm };
    case 'line':
      return { ...body, y1: body.y1 + deltaMm, y2: body.y2 + deltaMm };
    case 'polyline':
      return { ...body, points: body.points.map(([x, y]) => [x, y + deltaMm] as const) };
    case 'group':
      return { ...body, children: body.children.map((c) => shiftY(c, deltaMm)) };
    case 'path':
      throw new Error('Pfad-Primitive können nicht als Körper platziert werden.');
  }
}

/**
 * Verschiebt den Körper, ohne seine Größe zu ändern — und nur so weit wie nötig.
 * C.1.2 (Reihe) bleibt deshalb bei 6 mm wie 1.1, C.1.1 (Stapel) rückt auf 9 mm.
 */
const rectBodyProfile: LayoutProfile = {
  id: 'rect-body',
  defaultAnchorMm: 6,
  place(body, headBottomMm) {
    if (headBottomMm === null) return body;
    const target = Math.max(this.defaultAnchorMm, headBottomMm + HEAD_GAP_MM);
    return shiftY(body, target - boundsOfMm(body).minY);
  },
};

/**
 * Verkleinert das gedrehte Quadrat von oben und hält die Unterkante.
 * Belegt an D.3.7: halbe Diagonale 15 → 13 mm, Mittelpunkt 16 → 18 mm, Unterkante bleibt 31 mm.
 */
const rotatedSquareProfile: LayoutProfile = {
  id: 'rotated-square-body',
  defaultAnchorMm: 1,
  place(body, headBottomMm) {
    if (headBottomMm === null) return body;
    if (body.type !== 'rect' || body.transform?.rotate === undefined) {
      throw new Error('Profil "rotated-square-body" erwartet ein gedrehtes rect als Körper.');
    }
    const bounds = boundsOfMm(body);
    const bottom = bounds.maxY;
    const apex = Math.max(this.defaultAnchorMm, headBottomMm + HEAD_GAP_MM);
    const halfDiagonal = (bottom - apex) / 2;
    const centerY = apex + halfDiagonal;
    const side = halfDiagonal * Math.SQRT2;
    const centerX = (bounds.minX + bounds.maxX) / 2;

    return {
      ...body,
      x: centerX - side / 2,
      y: centerY - side / 2,
      width: side,
      height: side,
      transform: { rotate: { ...body.transform.rotate, cx: centerX, cy: centerY } },
    };
  },
};

/**
 * Kreiskörper mit Kopfzone ist in der Referenz nicht belegt. Bis eine Vermessung vorliegt,
 * wird die Anpassung nicht geraten, sondern abgelehnt.
 */
const circleBodyProfile: LayoutProfile = {
  id: 'circle-body',
  defaultAnchorMm: 2,
  place(body, headBottomMm) {
    if (headBottomMm === null) return body;
    throw new Error(
      'Kreiskörper mit Kopfzone ist nicht belegt. Vor der Umsetzung an der Referenz vermessen.',
    );
  },
};

const PROFILES: Record<SymbolKind, LayoutProfile> = {
  formation: rectBodyProfile,
  'vehicle-land': rectBodyProfile,
  'vehicle-air': rectBodyProfile,
  'vehicle-water': rectBodyProfile,
  building: rectBodyProfile,
  container: rectBodyProfile,
  area: rectBodyProfile,
  measure: rectBodyProfile,
  hazard: rectBodyProfile,
  point: rectBodyProfile,
  event: rectBodyProfile,
  'spontaneous-helper': rectBodyProfile,
  person: rotatedSquareProfile,
  post: circleBodyProfile,
};

export function profileFor(kind: SymbolKind): LayoutProfile {
  return PROFILES[kind];
}
