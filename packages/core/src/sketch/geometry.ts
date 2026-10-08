import type { Point, Primitive, Style } from '@einsatzzeichen/schema';
import { CATALOG_TEXT_FONT_WEIGHT } from '../render/text-policy.js';
import { ARIMO_TEXT_METRICS } from '../geometry/text-metrics.js';
import { pathLengthMm, resolvePathPoints } from '../geometry/parametric.js';
import { measureTextRun } from '../text-metrics.js';

/**
 * Gemeinsame Rechnungen der Kommunikationsskizze (LFH-1033): Strich, Verlauf, Strichmuster und
 * Text. Alles in Millimetern und in denselben Primitiven wie der Katalog, damit ein Renderer,
 * der `pictogram(…).primitives` zeichnen kann, auch diese Bausteine zeichnet.
 */

/** Strichstärke wie Anhang J (`COMMS_REFERENCE_STROKE_WIDTH_MM`). */
export const SKETCH_STROKE_WIDTH_MM = 0.5;

export const SKETCH_STROKE: Readonly<Style> = Object.freeze({
  fill: 'none',
  stroke: 'schwarz',
  strokeWidth: SKETCH_STROKE_WIDTH_MM,
});

/** Weiße Fläche mit schwarzer Kontur: deckt die Linie, auf der ein Zeichen sitzt. */
export const SKETCH_WHITE_BODY: Readonly<Style> = Object.freeze({
  fill: 'weiss',
  stroke: 'schwarz',
  strokeWidth: SKETCH_STROKE_WIDTH_MM,
});

/** Weiße Fläche ohne Kontur: der Grund hinter einer Marke. */
export const SKETCH_GROUND: Readonly<Style> = Object.freeze({ fill: 'weiss', stroke: 'none' });

const TEXT_FILL: Readonly<Style> = Object.freeze({ fill: 'schwarz', stroke: 'none' });

export function strokePolyline(points: readonly Point[], closed = false, style: Readonly<Style> = SKETCH_STROKE): Primitive {
  return { type: 'polyline', role: 'pictogram', points: points.map(([x, y]) => [x, y] as const), ...(closed ? { closed } : {}), style: { ...style } };
}

/** Ersatzvorschub für ein Zeichen, das die eingebundene Schrift nicht führt (Monospace-Schätzung). */
const UNKNOWN_ADVANCE_EM = 0.6;

/** Versalhöhe der Katalogschrift (Arimo 500) in em, am „H“ gemessen. */
function capHeightEm(): number {
  const metrics = ARIMO_TEXT_METRICS.medium ?? ARIMO_TEXT_METRICS;
  const extent = metrics.inkExtentEm('H'.codePointAt(0) ?? 72);
  if (extent === undefined) throw new Error('Arimo führt kein „H“.');
  return extent[3];
}

export interface TextRunInput {
  readonly content: string;
  readonly x: number;
  /** Grundlinie. */
  readonly y: number;
  readonly sizeMm: number;
  readonly anchor: 'start' | 'middle' | 'end';
}

/**
 * Ein Textlauf in der Katalogschrift, dessen Box aus der Messung folgt: Vorschub und Tinte
 * horizontal, mindestens die Versalhöhe und die Tinte des Inhalts vertikal. Anders als im
 * Katalog ist die Box hier keine Zusicherung am Bild, sondern eine Rechnung — der Text ist frei.
 */
export function textRun({ content, x, y, sizeMm, anchor }: TextRunInput): Primitive {
  const base = {
    type: 'text' as const,
    role: 'pictogram' as const,
    content,
    x,
    y,
    sizeMm,
    anchor,
    baseline: 'alphabetic' as const,
    fontWeight: CATALOG_TEXT_FONT_WEIGHT as 500,
    style: { ...TEXT_FILL },
  };
  const measure = measureTextRun({ ...base, boxMm: { xMm: x, yMm: y, widthMm: 0, heightMm: 0 } }, ARIMO_TEXT_METRICS);
  const width = textAdvanceMm(content, sizeMm);
  const start = anchor === 'start' ? x : anchor === 'middle' ? x - width / 2 : x - width;
  const minX = Math.min(start, measure.inkMinXMm);
  const maxX = Math.max(start + width, measure.inkMaxXMm);
  const ascent = Math.max(capHeightEm() * sizeMm, measure.inkAscentMm);
  return {
    ...base,
    boxMm: { xMm: minX, yMm: y - ascent, widthMm: maxX - minX, heightMm: ascent + measure.inkDescentMm },
  };
}

/** Vorschubsumme eines Laufs in der Katalogschrift; unbekannte Zeichen mit `UNKNOWN_ADVANCE_EM`. */
export function textAdvanceMm(content: string, sizeMm: number): number {
  const probe = {
    type: 'text' as const,
    content,
    x: 0,
    y: 0,
    sizeMm,
    anchor: 'start' as const,
    baseline: 'alphabetic' as const,
    fontWeight: CATALOG_TEXT_FONT_WEIGHT as 500,
    boxMm: { xMm: 0, yMm: 0, widthMm: 0, heightMm: 0 },
  };
  const measure = measureTextRun(probe, ARIMO_TEXT_METRICS);
  return measure.widthMm + measure.unknownCodepoints.length * UNKNOWN_ADVANCE_EM * sizeMm;
}

/** Versalhöhe in mm für einen Schriftgrad. */
export function capHeightMm(sizeMm: number): number {
  return capHeightEm() * sizeMm;
}

/** Ein geprüfter Verlauf: mindestens zwei Stützpunkte, kein Abschnitt ohne Länge. */
export function checkedPath(points: readonly Point[]): readonly Point[] {
  if (points.length < 2) throw new Error('Ein Verlauf braucht mindestens zwei Stützpunkte.');
  return resolvePathPoints({ points: points as [Point, Point, ...Point[]] });
}

export { pathLengthMm };

/** Punkt und Einheitsrichtung bei Bogenlänge `s`. */
export function pointAt(points: readonly Point[], s: number): { point: Point; direction: Point } {
  let remaining = s;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1] as Point;
    const [bx, by] = points[i] as Point;
    const length = Math.hypot(bx - ax, by - ay);
    const direction: Point = [(bx - ax) / length, (by - ay) / length];
    if (remaining <= length || i === points.length - 1) {
      return { point: [ax + direction[0] * remaining, ay + direction[1] * remaining], direction };
    }
    remaining -= length;
  }
  throw new Error('pointAt: Verlauf ohne Abschnitt.');
}

/** Der Teil des Verlaufs zwischen den Bogenlängen `from` und `to`, mit allen Knicken dazwischen. */
export function slicePath(points: readonly Point[], from: number, to: number): readonly Point[] {
  const sliced: Point[] = [pointAt(points, from).point];
  let travelled = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const [ax, ay] = points[i - 1] as Point;
    const [bx, by] = points[i] as Point;
    travelled += Math.hypot(bx - ax, by - ay);
    if (travelled > from && travelled < to) sliced.push(points[i] as Point);
  }
  sliced.push(pointAt(points, to).point);
  return sliced;
}

/**
 * Ein Strichmuster entlang des Verlaufs, wie SVGs `stroke-dasharray`: abwechselnd Strich und
 * Lücke aus `pattern`, beginnend mit einem Strich am Anfang; der letzte Strich endet am Ende.
 * Gebaut als einzelne Polyzüge, weil `Style` kein Strichmuster kennt.
 */
export function dashedAlong(points: readonly Point[], pattern: readonly number[]): Primitive[] {
  if (pattern.length === 0 || pattern.length % 2 !== 0 || pattern.some((value) => !(value > 0))) {
    throw new Error('Ein Strichmuster braucht eine gerade Anzahl positiver Längen.');
  }
  const length = pathLengthMm(points);
  const dashes: Primitive[] = [];
  let s = 0;
  let index = 0;
  while (s < length) {
    const step = pattern[index % pattern.length] as number;
    if (index % 2 === 0) {
      const end = Math.min(s + step, length);
      if (end > s) dashes.push(strokePolyline(slicePath(points, s, end)));
    }
    s += step;
    index += 1;
  }
  return dashes;
}

/** Winkel einer Richtung in Grad, auf (−90°, 90°] gelegt, damit Zeichen nie kopfstehen. */
export function readableAngleDeg([dx, dy]: Point): number {
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (angle > 90) angle -= 180;
  if (angle <= -90) angle += 180;
  return angle;
}
