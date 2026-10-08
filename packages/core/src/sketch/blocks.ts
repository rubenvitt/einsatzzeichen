import type { Point, Primitive } from '@einsatzzeichen/schema';
import {
  SKETCH_GROUND,
  SKETCH_STROKE,
  SKETCH_STROKE_WIDTH_MM,
  SKETCH_WHITE_BODY,
  capHeightMm,
  checkedPath,
  dashedAlong,
  pathLengthMm,
  pointAt,
  readableAngleDeg,
  strokePolyline,
  textAdvanceMm,
  textRun,
} from './geometry.js';

/**
 * Bausteine der taktischen Fernmeldeskizze (BBK Anhang J.5, Musterskizze), die der Katalog nicht
 * hat, weil es zu ihnen keine Referenzdatei gibt (LFH-1033,
 * `docs/decisions/2026-10-08-lfh-1033-kommunikationsskizze.md`). Jedes Maß hier ist
 * **vorgeschlagen**, nicht abgelesen; der Befund je Baustein steht in `SKETCH_BLOCKS`.
 *
 * Die Bausteine liefern Primitive **in Teilen** statt einer fertigen `Drawing`: Wer sie in eine
 * Skizze setzt, braucht Lage, Hervorhebung und Bedienung selbst und zeichnet die Teile einzeln.
 */

// ── Maße (vorgeschlagen, mm) ─────────────────────────────────────────────────────────────────

/** Höhe des Langsechsecks; die Spitzen sind je eine halbe Höhe breit. */
export const SKETCH_CONDITION_SIGN_HEIGHT_MM = 8;
/** Schriftgrad im Bedingungszeichen (Arimo 500). */
export const SKETCH_CONDITION_SIGN_TEXT_MM = 4;
/** Luft zwischen Text und Spitzenansatz, je Seite. */
export const SKETCH_CONDITION_SIGN_PADDING_MM = 4 / 3;
/** Überstand der Sammelschiene links und rechts des Bedingungszeichens. */
export const SKETCH_BUS_BAR_MARGIN_MM = 16 / 3;
/** Zickzack-Marke einer Funkverbindung: Länge entlang der Linie und Ausschlag (Spitze zu Tal). */
export const SKETCH_ZIGZAG_LENGTH_MM = 8;
export const SKETCH_ZIGZAG_HEIGHT_MM = 8 / 3;
/** Grund um die Zickzack-Marke, je Seite. */
export const SKETCH_ZIGZAG_GROUND_MM = 2 / 3;
/** Strichmuster „geplant“: Strich, Lücke. */
export const SKETCH_PLANNED_PATTERN_MM: readonly number[] = Object.freeze([8 / 3, 5 / 3]);
/** Strichmuster der Bereichsgrenze: Strich, Lücke, Punkt, Lücke. */
export const SKETCH_AREA_PATTERN_MM: readonly number[] = Object.freeze([14 / 3, 4 / 3, 2 / 3, 4 / 3]);
/** Schriftgrad des Wortes „geplant“ und der Bereichsbezeichnung. */
export const SKETCH_NOTE_TEXT_MM = 10 / 3;
/** Abstand des Wortes „geplant“ zur Linie bzw. zur Marke. */
export const SKETCH_NOTE_GAP_MM = 4 / 3;
/** Abstand der Bereichsbezeichnung zur linken und oberen Grenze. */
export const SKETCH_AREA_LABEL_INSET_MM = 8 / 3;

// ── Bedingungszeichen ────────────────────────────────────────────────────────────────────────

/** Breite des Langsechsecks samt Spitzen für einen Text; wächst mit dem Text, nie gekürzt. */
export function conditionSignWidth(text: string): number {
  return (
    textAdvanceMm(text, SKETCH_CONDITION_SIGN_TEXT_MM) +
    2 * SKETCH_CONDITION_SIGN_PADDING_MM +
    SKETCH_CONDITION_SIGN_HEIGHT_MM
  );
}

export interface ConditionSign {
  readonly center: Point;
  readonly width: number;
  readonly height: number;
  /** Das Langsechseck, weiß gefüllt, damit es eine Linie darunter deckt. */
  readonly outline: readonly Primitive[];
  /** Der Text, mittig. */
  readonly label: readonly Primitive[];
}

/**
 * Bedingungszeichen (J.5): Langsechseck mit Text, etwa Betriebsart und Sprechgruppe („TMO 311“).
 * Die Breite folgt dem Text in der Katalogschrift; der Text wird nie gekürzt.
 */
export function conditionSign({ text, center }: { readonly text: string; readonly center: Point }): ConditionSign {
  const width = conditionSignWidth(text);
  const height = SKETCH_CONDITION_SIGN_HEIGHT_MM;
  const h = height / 2;
  const [cx, cy] = center;
  const left = cx - width / 2;
  const right = cx + width / 2;
  const outline = strokePolyline(
    [
      [left, cy],
      [left + h, cy - h],
      [right - h, cy - h],
      [right, cy],
      [right - h, cy + h],
      [left + h, cy + h],
    ],
    true,
    SKETCH_WHITE_BODY,
  );
  const label = textRun({
    content: text,
    x: cx,
    y: cy + capHeightMm(SKETCH_CONDITION_SIGN_TEXT_MM) / 2,
    sizeMm: SKETCH_CONDITION_SIGN_TEXT_MM,
    anchor: 'middle',
  });
  return { center: [cx, cy], width, height, outline: [outline], label: [label] };
}

// ── Sammelschiene ────────────────────────────────────────────────────────────────────────────

/** Kleinste Länge einer Sammelschiene: ihr Bedingungszeichen und beidseitig der Überstand. */
export function busBarMinLength(text: string): number {
  return conditionSignWidth(text) + 2 * SKETCH_BUS_BAR_MARGIN_MM;
}

export interface BusBar {
  /** Tatsächliche Länge: die gewünschte, mindestens `busBarMinLength`. */
  readonly length: number;
  /** Die waagerechte Schiene. */
  readonly rail: readonly Primitive[];
  /** Das eingesetzte Bedingungszeichen; es deckt die Schiene. */
  readonly sign: ConditionSign;
}

/**
 * Sammelschiene einer Sprechgruppe (J.5): waagerechte Linie ab `start` mit eingesetztem
 * Bedingungszeichen. Die Schiene ist nie kürzer als ihr Zeichen plus Überstand; das Zeichen
 * bleibt in der Schiene, auch wenn `signCenterX` außerhalb liegt (Vorgabe: Mitte).
 */
export function busBar({
  start,
  length,
  text,
  signCenterX,
}: {
  readonly start: Point;
  readonly length: number;
  readonly text: string;
  readonly signCenterX?: number;
}): BusBar {
  const [x, y] = start;
  const actual = Math.max(length, busBarMinLength(text));
  const half = conditionSignWidth(text) / 2;
  const center = Math.min(
    Math.max(signCenterX ?? x + actual / 2, x + SKETCH_BUS_BAR_MARGIN_MM + half),
    x + actual - SKETCH_BUS_BAR_MARGIN_MM - half,
  );
  return {
    length: actual,
    rail: [{ type: 'line', role: 'pictogram', x1: x, y1: y, x2: x + actual, y2: y, style: { ...SKETCH_STROKE } }],
    sign: conditionSign({ text, center: [center, y] }),
  };
}

// ── Verbindungslinie ─────────────────────────────────────────────────────────────────────────

export type SketchLinkMedium = 'radio' | 'wire';
export type SketchLinkStatus = 'existing' | 'planned';

export interface SketchLinkAnchor {
  /** Mitte des längsten Abschnitts; auf einer Geraden die Mitte des Verlaufs. */
  readonly point: Point;
  /** Linienrichtung dort in Grad, auf (−90°, 90°] gelegt. */
  readonly angleDeg: number;
  /** Einheitsnormale nach unten bzw. (bei senkrechter Linie) nach rechts. */
  readonly normal: Point;
}

export interface SketchLink {
  /** Die Linie: ein Polyzug, bei „geplant“ einzelne Striche. */
  readonly line: readonly Primitive[];
  /** Funk: Grund und Zickzack in der Mitte; sonst leer. */
  readonly mark: readonly Primitive[];
  /** „geplant“: das Wort; sonst leer. */
  readonly word: readonly Primitive[];
  /** Wo ein Zeichen in der Mitte sitzt — die Marke oder ein Zeichen der Verbindungsart. */
  readonly anchor: SketchLinkAnchor;
}

/**
 * Die Mitte des längsten Abschnitts: Dort hat eine Marke den meisten Platz und sitzt nie auf einem
 * Knick. Auf einer Geraden ist das die Mitte des Verlaufs. Bei gleich langen Abschnitten gilt der
 * erste.
 */
function linkAnchor(points: readonly Point[]): SketchLinkAnchor {
  let longest = 0;
  let at = 0;
  let travelled = 0;
  for (let i = 1; i < points.length; i++) {
    const length = pathLengthMm([points[i - 1] as Point, points[i] as Point]);
    if (length > longest) {
      longest = length;
      at = travelled + length / 2;
    }
    travelled += length;
  }
  const { point, direction } = pointAt(points, at);
  let normal: Point = [-direction[1], direction[0]];
  if (normal[1] < 0 || (normal[1] === 0 && normal[0] < 0)) normal = [-normal[0], -normal[1]];
  return { point, angleDeg: readableAngleDeg(direction), normal: [normal[0] + 0, normal[1] + 0] };
}

/** Zickzack mit sechs Schenkeln um `center`, Enden auf der Linie, dahinter der Grund. */
function zigzagMark({ point, angleDeg }: SketchLinkAnchor): Primitive[] {
  const rad = (angleDeg * Math.PI) / 180;
  const u: Point = [Math.cos(rad), Math.sin(rad)];
  const n: Point = [-u[1], u[0]];
  const at = (along: number, across: number): Point => [
    point[0] + u[0] * along + n[0] * across,
    point[1] + u[1] * along + n[1] * across,
  ];
  const l = SKETCH_ZIGZAG_LENGTH_MM / 2;
  const a = SKETCH_ZIGZAG_HEIGHT_MM / 2;
  const g = SKETCH_ZIGZAG_GROUND_MM;
  const ground = strokePolyline(
    [at(-l - g, -a - g), at(l + g, -a - g), at(l + g, a + g), at(-l - g, a + g)],
    true,
    SKETCH_GROUND,
  );
  const zigzag = strokePolyline(
    Array.from({ length: 7 }, (_, i) => at(-l + (i * SKETCH_ZIGZAG_LENGTH_MM) / 6, i === 0 || i === 6 ? 0 : i % 2 === 1 ? -a : a)),
  );
  return [ground, zigzag];
}

/**
 * Verbindung zwischen zwei Stellen auf einem Polyzug beliebiger Länge und Richtung: glatt
 * (leitergebunden) oder mit Zickzack-Marke in der Mitte des längsten Abschnitts (Funk), durchgezogen (bestehend) oder
 * gestrichelt mit dem Wort „geplant“ — „geplant“ trägt immer beides, damit es ohne Farbe und in
 * Graustufen lesbar bleibt.
 *
 * `mark: false` lässt die Marke weg, etwa wenn dort das Zeichen der Verbindungsart sitzt;
 * `clearanceMm` hält das Wort dann so weit von der Linie, wie das Zeichen hoch ist (halbe Höhe).
 */
export function commsLink({
  path,
  medium,
  status,
  mark = true,
  clearanceMm,
}: {
  readonly path: readonly Point[];
  readonly medium: SketchLinkMedium;
  readonly status: SketchLinkStatus;
  readonly mark?: boolean;
  readonly clearanceMm?: number;
}): SketchLink {
  const points = checkedPath(path);
  const anchor = linkAnchor(points);
  const line = status === 'planned' ? dashedAlong(points, SKETCH_PLANNED_PATTERN_MM) : [strokePolyline(points)];
  const withMark = medium === 'radio' && mark;
  const markPrimitives = withMark ? zigzagMark(anchor) : [];
  const word: Primitive[] = [];
  if (status === 'planned') {
    const clearance = clearanceMm ?? (withMark ? SKETCH_ZIGZAG_HEIGHT_MM / 2 : 0);
    const distance = clearance + SKETCH_NOTE_GAP_MM + SKETCH_STROKE_WIDTH_MM;
    const [nx, ny] = anchor.normal;
    const x = anchor.point[0] + nx * distance;
    const y = anchor.point[1] + ny * distance;
    const sideways = Math.abs(nx) > 0.5;
    const cap = capHeightMm(SKETCH_NOTE_TEXT_MM);
    word.push(
      textRun({
        content: 'geplant',
        x,
        // Neben der Linie mittig auf die Versalhöhe, darunter mit der Oberkante am Abstand.
        y: sideways ? y + cap / 2 : y + cap,
        sizeMm: SKETCH_NOTE_TEXT_MM,
        anchor: sideways ? 'start' : 'middle',
      }),
    );
  }
  return { line, mark: markPrimitives, word, anchor };
}

// ── Bereich ──────────────────────────────────────────────────────────────────────────────────

export interface SketchArea {
  /** Die Grenze als Strich-Punkt-Muster auf allen vier Seiten. */
  readonly boundary: readonly Primitive[];
  /** Die Bezeichnung innen oben links. */
  readonly label: readonly Primitive[];
}

/**
 * Bereich (J.5, etwa „Rückwärtiger Bereich“): Rechteck mit Strich-Punkt-Grenze, Bezeichnung innen
 * oben links. Das Muster läuft je Seite neu an, damit jede Ecke mit einem Strich beginnt.
 */
export function commsArea({
  x,
  y,
  width,
  height,
  label,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly label: string;
}): SketchArea {
  if (!(width > 0) || !(height > 0)) throw new Error('Ein Bereich braucht Breite und Höhe.');
  const corners: Point[] = [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
  ];
  const boundary = corners.flatMap((corner, i) =>
    dashedAlong([corner, corners[(i + 1) % corners.length] as Point], SKETCH_AREA_PATTERN_MM),
  );
  const text = textRun({
    content: label,
    x: x + SKETCH_AREA_LABEL_INSET_MM,
    y: y + SKETCH_AREA_LABEL_INSET_MM + capHeightMm(SKETCH_NOTE_TEXT_MM),
    sizeMm: SKETCH_NOTE_TEXT_MM,
    anchor: 'start',
  });
  return { boundary, label: [text] };
}
