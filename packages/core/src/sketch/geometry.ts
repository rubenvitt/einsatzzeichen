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

/**
 * Ersatzvorschub für ein Zeichen, das die eingebundene Schrift nicht führt: ein Geviert, damit
 * auch breite Zeichen (CJK, Emoji) das Bedingungszeichen nicht sprengen.
 */
const UNKNOWN_ADVANCE_EM = 1;
/** Unterlänge, wenn die Tinte eines Laufs wegen unbekannter Zeichen nicht messbar ist. */
const UNKNOWN_DESCENT_EM = 0.25;

let capHeightCache: number | undefined;

/** Versalhöhe der Katalogschrift (Arimo 500) in em, am „H“ gemessen. */
function capHeightEm(): number {
  if (capHeightCache !== undefined) return capHeightCache;
  const metrics = ARIMO_TEXT_METRICS.medium ?? ARIMO_TEXT_METRICS;
  const extent = metrics.inkExtentEm('H'.codePointAt(0) ?? 72);
  if (extent === undefined) throw new Error('Arimo führt kein „H“.');
  capHeightCache = extent[3];
  return capHeightCache;
}

/** Wirft, wenn eine Eingabe keine endliche Zahl ist — wie `resolvePathPoints` für Stützpunkte. */
export function requireFinite(name: string, ...values: readonly number[]): void {
  for (const value of values) {
    if (!Number.isFinite(value)) throw new Error(`${name}: ${value} ist keine endliche Zahl.`);
  }
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
  requireFinite('Textlauf', x, y, sizeMm);
  const measure = measureTextRun({ ...base, boxMm: { xMm: x, yMm: y, widthMm: 0, heightMm: 0 } }, ARIMO_TEXT_METRICS);
  const width = textAdvanceMm(content, sizeMm);
  const start = anchor === 'start' ? x : anchor === 'middle' ? x - width / 2 : x - width;
  const cap = capHeightEm() * sizeMm;
  // Mit unbekannten Zeichen ist die gemessene Tinte unvollständig und anders verankert; die Box
  // folgt dann allein dem Vorschub mit Ersatzbreiten.
  const known = measure.unknownCodepoints.length === 0;
  const minX = known ? Math.min(start, measure.inkMinXMm) : start;
  const maxX = known ? Math.max(start + width, measure.inkMaxXMm) : start + width;
  const ascent = known ? Math.max(cap, measure.inkAscentMm) : cap;
  const descent = known ? measure.inkDescentMm : UNKNOWN_DESCENT_EM * sizeMm;
  return {
    ...base,
    boxMm: { xMm: minX, yMm: y - ascent, widthMm: maxX - minX, heightMm: ascent + descent },
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

/** Ein geprüfter Verlauf: mindestens zwei endliche Stützpunkte, kein Abschnitt ohne Länge. */
export function checkedPath(points: readonly Point[]): readonly Point[] {
  return resolvePathPoints({ points: points as [Point, Point, ...Point[]] });
}

export { pathLengthMm };

/** Punkt und Einheitsrichtung bei Bogenlänge `s` (wie das gleichnamige, nicht exportierte Gegenstück in `geometry/parametric.ts`). */
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
 * Ein Strichmuster entlang des Verlaufs: abwechselnd Strich und Lücke aus `pattern`, gebaut als
 * einzelne Polyzüge, weil `Style` kein Strichmuster kennt. Anders als SVGs `stroke-dasharray`
 * beginnt **und endet** der Verlauf mit dem ersten Strich des Musters, damit eine Linie an ihren
 * Stellen ankommt und ein Rechteck an jeder Ecke geschlossen wirkt: Das Muster wird dafür auf
 * eine ganze Zahl von Perioden plus einen Schlussstrich gestreckt oder gestaucht. Ein Verlauf,
 * der dafür zu kurz ist, bleibt ein einziger Strich.
 */
export function dashedAlong(points: readonly Point[], pattern: readonly number[]): Primitive[] {
  if (pattern.length === 0 || pattern.length % 2 !== 0 || pattern.some((value) => !(value > 0) || !Number.isFinite(value))) {
    throw new Error('Ein Strichmuster braucht eine gerade Anzahl positiver Längen.');
  }
  const length = pathLengthMm(points);
  const period = pattern.reduce((sum, value) => sum + value, 0);
  const first = pattern[0] as number;
  const periods = Math.max(0, Math.round((length - first) / period));
  if (periods === 0) return [strokePolyline(points)];
  const scale = length / (periods * period + first);
  // Lagen als Vielfache der Periode statt als laufende Summe: keine aufgelaufenen Rundungsfehler.
  const offsets: number[] = [];
  let within = 0;
  for (const value of pattern) {
    offsets.push(within);
    within += value;
  }
  const dashes: Primitive[] = [];
  for (let k = 0; k <= periods; k++) {
    for (let i = 0; i < pattern.length; i += 2) {
      if (k === periods && i > 0) break;
      const from = (k * period + (offsets[i] as number)) * scale;
      const to = k === periods ? length : (k * period + (offsets[i] as number) + (pattern[i] as number)) * scale;
      dashes.push(strokePolyline(slicePath(points, from, Math.min(to, length))));
    }
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
