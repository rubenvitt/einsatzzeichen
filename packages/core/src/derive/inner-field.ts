import { DEFAULT_STROKE_WIDTH_MM, type Primitive, type Style } from '@einsatzzeichen/schema';
import { axisRect, clipRingY, offsetRing, outlineOf, ringPath, round, type Vec } from './outline.js';

/**
 * Abgeleitete Innenfelder der weißen Innenkontur (`SymbolSpec.whiteInnerContour`).
 *
 * **Das vermessene Maß.** Alle 68 Dateien des Anhangs E rücken die Organisationsfarbe 1 mm von
 * der Körpermittellinie ein, nachgemessen am 2. Oktober 2026 an zwei Formen: E.1.1 (Rahmen
 * 2,835/17,008 → Innenfeld 5,669/19,842 Einheiten, also 1,000 mm) und E.2.27 (Sehne 22,677 →
 * 25,511 und Radius 42,491 → 39,656 Einheiten, beide 1,000 mm). Keine Datei weicht ab; übertragen
 * wird deshalb dieses Maß und kein anderes.
 *
 * **Woran es hängt.** Gemessen ist es an Körpern mit 0,5-mm-Strich; sichtbar bleibt zwischen
 * Strich und Innenfeld ein weißes Band von 0,75 mm. Dieses Band ist das Merkmal der Innenkontur.
 * An `1.10 Maßnahme` und `1.11 Gefahr` (1-mm-Strich) hielte ein wörtlich übertragener Millimeter
 * nur 0,5 mm Weiß; der Versatz rechnet deshalb vom Strich aus: halbe Strichbreite plus 0,75 mm.
 * Für jeden 0,5-mm-Körper ist das genau der vermessene Millimeter.
 */
export const INNER_WHITE_BAND_MM = 0.75;

/** Versatz des Innenfelds von der Körpermittellinie: halbe Strichbreite plus weißes Band. */
export function innerInsetMm(body: Primitive): number {
  return (body.style?.strokeWidth ?? DEFAULT_STROKE_WIDTH_MM) / 2 + INNER_WHITE_BAND_MM;
}

const INNER_FIELD_STYLE: Style = { stroke: 'none' };

/**
 * Innenfeld eines Kreiskörpers: derselbe Mittelpunkt, Radius um den Versatz kleiner. Generisch
 * für jeden Kreis — `post`, `circle-12` und deren Varianten — und deshalb exportiert.
 */
export function circleInnerField(cxMm: number, cyMm: number, rMm: number, insetMm: number): Primitive {
  return {
    type: 'circle', role: 'innerField', cx: round(cxMm), cy: round(cyMm), r: round(rMm - insetMm),
    style: INNER_FIELD_STYLE,
  };
}

/**
 * Ein waagerechter Streifen, den das Innenfeld ausspart — die Traufe eines Hauskörpers, unter
 * der das Dach getrennt vom Wandfeld gefüllt wird (E.1.37).
 */
export interface InnerFieldGap {
  readonly fromYMm: number;
  readonly toYMm: number;
}

function ringPrimitive(ring: readonly Vec[], closedPolyline: boolean): Primitive {
  const rect = axisRect(ring);
  if (rect !== undefined) {
    return { type: 'rect', role: 'innerField', ...rect, style: INNER_FIELD_STYLE };
  }
  return closedPolyline
    ? {
        type: 'polyline', role: 'innerField', closed: true,
        points: ring.map((p) => [round(p[0]), round(p[1])] as const),
        style: INNER_FIELD_STYLE,
      }
    : { type: 'path', role: 'innerField', d: ringPath(ring), style: INNER_FIELD_STYLE };
}

/**
 * Das Innenfeld eines beliebigen Körperprimitivs: die Körperkontur um `innerInsetMm` nach innen
 * versetzt. Rechteck und gedrehtes Rechteck bleiben Rechtecke, Kreise Kreise; Polyzüge und
 * Pfade werden als Polygon versetzt (`offsetRing`, Gehrung), Kurven dafür fein abgetastet.
 */
export function derivedInnerField(body: Primitive, gap?: InnerFieldGap): readonly Primitive[] {
  const inset = innerInsetMm(body);
  if (gap === undefined && body.type === 'rect') {
    return [{
      type: 'rect', role: 'innerField',
      x: round(body.x + inset), y: round(body.y + inset),
      width: round(body.width - 2 * inset), height: round(body.height - 2 * inset),
      ...(body.transform === undefined ? {} : { transform: body.transform }),
      style: INNER_FIELD_STYLE,
    }];
  }
  if (gap === undefined && body.type === 'circle') {
    return [circleInnerField(body.cx, body.cy, body.r, inset)];
  }
  const inner = offsetRing(outlineOf(body), inset);
  const closedPolyline = body.type === 'polyline' || body.type === 'rect';
  if (gap === undefined) return [ringPrimitive(inner, closedPolyline)];
  return [
    clipRingY(inner, gap.fromYMm, 'above'),
    clipRingY(inner, gap.toYMm, 'below'),
  ]
    .filter((ring) => ring.length >= 3)
    .map((ring) => ringPrimitive(ring, closedPolyline));
}
