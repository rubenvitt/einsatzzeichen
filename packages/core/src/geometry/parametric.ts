import type {
  Drawing,
  LineGapContent,
  LineId,
  LineParameters,
  MovementId,
  MovementParameters,
  PathEndForm,
  PathParameters,
  Point,
  Primitive,
  StrengthId,
} from '@einsatzzeichen/schema';
import { boundsOfMm, strokeBoundsOfMm, type BoundsMm } from '../bounds.js';
import { NotMeasuredError } from '../not-measured.js';
import {
  ARIMO_CAP_HEIGHT_FRACTION,
  MINIMUM_TEXT_RENDER_PX,
  verticalTextBoxMm,
} from '../render/text-policy.js';

/**
 * Pfeile aus 5.2 und Linien aus Kapitel 2 als parametrisierte Bausteine (LFH-566).
 *
 * Diese Bausteine haben keine feste Ausdehnung. Ihre Geometrie entsteht aus einem Verlauf, den der
 * Nutzer setzt: Stützpunkte, oder Anfang, Richtung und Länge (`PathParameters`). Gemessen ist
 * deshalb nicht die Lage, sondern der **Querschnitt**: Strichstärke, Pfeilkopf, Strich- und
 * Lückenlänge, Beschriftung und Marken in der Lücke. Die Referenz legt diese Werte an je einem
 * geraden Verlauf fest; mit genau diesem Verlauf als Parameter bauen die Funktionen hier die
 * Referenz nach, und `conformance/src/parametric-fixtures.test.ts` hält das gegen das
 * Kennzahlenartefakt fest.
 *
 * **Abgelesen am Kennzahlenartefakt, nicht an den Dateien.** Die Referenzdateien sind nicht
 * eingecheckt. `fingerprints.json` führt die Hülle jeder Fläche. Bei den Pfeilen ist das die Hülle
 * des zu einer Fläche umgewandelten Strichs, bei den Grenzen je Strich ein Rechteck, je Marke ein
 * Kreis und je Glyph eine Außenkontur. Kurvenpfade erfasst das Artefakt nicht; die Bausteine, die
 * nur aus Kurven bestehen, bleiben deshalb Lücken (`NotMeasuredError`).
 *
 * Die Anbindung eines Pfeils an ein Grundzeichen ist die Zone `movement-anchor`. Sie ist an keiner
 * Körperform vermessen, weil kein Original einen Pfeil an einem Grundzeichen zeigt.
 */

/**
 * Strichstärke aller Pfeile und Grenzen. Hülle der Grenzstriche 15,75…16,25 bei Achse y 16.
 *
 * Die Primitive tragen `role: 'pictogram'` und fallen damit unter den Strichvertrag der
 * Piktogramme: Ausgabe mit runden statt gegehrten Ecken (`svg.ts`, `canvas.ts`). Die Pfeilspitze
 * liegt in der Ausgabe deshalb 0,104 mm vor der gegehrten Spitze der Referenz. Das IR selbst trifft
 * die Referenz; `strokeBoundsOfMm` rechnet mit Gehrung.
 */
const STROKE_WIDTH_MM = 0.5;
const STROKE = { fill: 'none', stroke: 'schwarz', strokeWidth: STROKE_WIDTH_MM } as const;

/**
 * Ein Pfeil aus 5.2: was am Anfang und am Ende des Verlaufs sitzt, und wie tief der Pfeilkopf ist.
 *
 * Der Pfeilkopf ist ein offener, rechtwinkliger Winkel aus zwei Schenkeln: Tiefe gleich halbe
 * Breite. Das folgt aus der Hülle, nicht aus einer Annahme über die Form. Die Spitze ragt um
 * 0,354 mm über das Verlaufsende hinaus (5.2.1: maxX 30,354 bei Ende 30), das ist die Gehrung eines
 * 0,5-mm-Strichs an einem 90°-Winkel (0,25 · √2). Die Schenkelenden liegen 0,177 mm außerhalb der
 * Schenkelhöhe (5.2.1: minY 9,823 bei Schenkelende 10), das ist die Stumpfkappe eines 45°-Schenkels
 * (0,25 · cos 45°).
 */
interface MovementCrossSection {
  readonly start: PathEndForm;
  readonly end: PathEndForm;
  readonly headDepthMm: number;
}

type MovementGeometry =
  | { readonly status: 'measured'; readonly crossSection: MovementCrossSection; readonly note: string }
  | { readonly status: 'not-measured'; readonly reason: string };

export const MOVEMENT_GEOMETRY: Readonly<Record<MovementId, MovementGeometry>> = Object.freeze({
  // 5.2.1: Hülle 2/9,823/30,354/22,177. Schaft ab x 2 (Stumpfkappe), Kopf 6 mm tief.
  'direction-of-action': {
    status: 'measured',
    crossSection: { start: 'none', end: 'chevron', headDepthMm: 6 },
    note: '5.2.1: Hülle 2/9,823/30,354/22,177 — Schaft ab x 2, Kopf mit Spitze bei 30 und Schenkeln bis y 10 und 22.',
  },
  'start-of-action': {
    status: 'not-measured',
    reason:
      '5.2.2: Die Hülle 1,75/11,823/30,354/20,177 belegt einen Kopf von 4 mm Tiefe am Ende und einen Querstrich bei x 2 (1,75…2,25). Die Länge des Querstrichs belegt sie nicht: jeder Wert bis 8,354 mm ergibt dieselbe Hülle.',
  },
  // 5.2.3: Hülle 2/11,823/30,354/20,177. Wie 5.2.1, Kopf 4 mm tief.
  'directed-movement': {
    status: 'measured',
    crossSection: { start: 'none', end: 'chevron', headDepthMm: 4 },
    note: '5.2.3: Hülle 2/11,823/30,354/20,177 — Schaft ab x 2, Kopf mit Spitze bei 30 und Schenkeln bis y 12 und 20.',
  },
  // 5.2.4: Hülle 1,646/11,823/30,354/20,177. Zwei Köpfe, Spitzen bei 2 und 30.
  'movement-both-directions': {
    status: 'measured',
    crossSection: { start: 'chevron', end: 'chevron', headDepthMm: 4 },
    note: '5.2.4: Hülle 1,646/11,823/30,354/20,177 — Köpfe an beiden Enden, Spitzen bei 2 und 30.',
  },
  'end-of-movement': {
    status: 'not-measured',
    reason:
      '5.2.5: Die Hülle 2/11,823/30,25/20,177 belegt einen Querstrich bei x 30 (bis 30,25) und einen Kopf von 4 mm Halbbreite. Wo der Kopf vor dem Querstrich steht und wie lang der Querstrich ist, belegt sie nicht.',
  },
  gathering: {
    status: 'not-measured',
    reason:
      '5.2.6: Die Darstellung ist ein einziger Kurvenpfad. Das Kennzahlenartefakt erfasst Kurvenpfade nicht (`curvedPaths: 1`, keine Form).',
  },
} satisfies Record<MovementId, MovementGeometry>);

/**
 * Eine Grenze aus Kapitel 2: Strich, Lücke, und was in der Lücke steht.
 *
 * Die Referenz zeigt je Grenze genau eine Periode auf einem Verlauf von x 1 bis 47 bei y 16:
 * Strich, Lücke, Strich. Die Lücke trägt die Beschriftung oder die Marken der Stärke. Wie sich das
 * Muster auf einem längeren Verlauf wiederholt, zeigt kein Original. `layoutDashes` wiederholt es
 * deshalb nach einer **vorgeschlagenen** Regel: die Lücke behält ihre gemessene Länge, die Striche
 * teilen sich den Rest gleich und sind nie kürzer als gemessen.
 */
interface LineCrossSection {
  readonly dashMm: number;
  readonly gapMm: number;
  readonly gap: LineGapContent;
}

type LineGeometry =
  | { readonly status: 'measured'; readonly crossSection: LineCrossSection; readonly note: string }
  | { readonly status: 'not-measured'; readonly reason: string };

const CURVED_AREA_REASON = (section: string, color: string): string =>
  `${section}: Die Darstellung ist ein einziger gefüllter Kurvenpfad in ${color}. Das Kennzahlenartefakt erfasst Kurvenpfade nicht (\`curvedPaths: 1\`, keine Form); belegt sind nur die Zeichenfläche 48 × 32 mm und die Farbe.`;

export const LINE_GEOMETRY: Readonly<Record<LineId, LineGeometry>> = Object.freeze({
  'escape-route': { status: 'not-measured', reason: CURVED_AREA_REASON('2.14', 'Grün (#14a01e), in zwei Darstellungen') },
  'barrier-position': { status: 'not-measured', reason: CURVED_AREA_REASON('2.15', 'Hellblau (#3264fa)') },
  'fire-spread': { status: 'not-measured', reason: CURVED_AREA_REASON('2.16', 'Rot (#fa1919)') },
  // 2.17: Striche 1…17 und 31…47, drei Glyphen T, E, L zwischen x 19,082 und 28,932.
  'boundary-command-area': {
    status: 'measured',
    crossSection: { dashMm: 16, gapMm: 14, gap: { kind: 'text', content: 'TEL' } },
    note: '2.17: Striche 1…17 und 31…47 bei y 15,75…16,25; in der Lücke drei Glyphen zwischen x 19,082 und 28,932, Mitte 24,007.',
  },
  // 2.18: Striche wie 2.17, zwei Glyphen E und A zwischen x 21,038 und 27,662.
  'boundary-section': {
    status: 'measured',
    crossSection: { dashMm: 16, gapMm: 14, gap: { kind: 'text', content: 'EA' } },
    note: '2.18: Striche 1…17 und 31…47; in der Lücke zwei Glyphen zwischen x 21,038 und 27,662.',
  },
  // 2.19: Striche 1…16 und 32…47. Zwei Glyphen gleich breit wie E und A aus 2.18, davor ein
  // Kurvenpfad — ein Glyph mit Rundung. `U` für Unter- ist aus dem Dateinamen gelesen.
  'boundary-subsection': {
    status: 'measured',
    crossSection: { dashMm: 15, gapMm: 16, gap: { kind: 'text', content: 'UEA' } },
    note: '2.19: Striche 1…16 und 32…47; in der Lücke E (2,559 breit) und A (3,716 breit) wie in 2.18, davor ein Kurvenpfad. Das U ist aus dem Dateinamen gelesen, nicht vermessen.',
  },
  // 2.20: Striche 1…18 und 30…47, drei Kreise mit Radius 1 bei x 21, 24 und 27.
  'boundary-with-strength': {
    status: 'measured',
    crossSection: { dashMm: 17, gapMm: 12, gap: { kind: 'strength' } },
    note: '2.20: Striche 1…18 und 30…47; in der Lücke drei gefüllte Kreise, Radius 1, Mitten bei x 21, 24 und 27 auf der Achse.',
  },
} satisfies Record<LineId, LineGeometry>);

/**
 * Beschriftung in der Grenzlücke. Versalhöhe 4,383 mm (Glyphen 13,531…17,914) und Grundlinie
 * 1,914 mm unter der Achse (17,914 bei Achse 16), an 2.17 bis 2.19 gleich. Der Schriftgrad ist wie
 * in `compose.ts` aus der Versalhöhe gerechnet und nicht hingeschrieben: die Glyphen liegen in der
 * Referenz als Kurven vor, in einer schmaleren Schrift als Arimo. Waagerecht steht der Lauf mittig
 * in der Lücke; bei 2.17 liegt die Glyphenmitte 0,007 mm daneben.
 */
const GAP_LABEL_CAP_HEIGHT_MM = 4.383;
const GAP_LABEL_BASELINE_BELOW_AXIS_MM = 1.914;

/**
 * Marken der Stärke in der Grenzlücke: gefüllte Kreise mit Radius 1 mm, 3 mm auseinander, mittig in
 * der Lücke (2.20: 21, 24, 27 bei Lückenmitte 24). Belegt sind nur drei Marken in einer Reihe.
 * Nach 5.4 ist das die Belegung des Zuges (`ROW_OCCUPANCY.zug`, alle drei Plätze). Welche Marken
 * Trupp, Staffel und Gruppe an einer Grenze tragen, zeigt kein Original.
 */
const STRENGTH_MARK_RADIUS_MM = 1;
const STRENGTH_MARK_PITCH_MM = 3;
const STRENGTH_MARK_OFFSETS: Partial<Record<StrengthId, readonly number[]>> = { zug: [-1, 0, 1] };

/** Löst einen Verlauf zu Stützpunkten auf. Wirft bei einem Verlauf ohne Länge. */
export function resolvePathPoints(path: PathParameters): readonly Point[] {
  const points: readonly Point[] =
    'points' in path
      ? path.points
      : [
          path.start,
          [
            path.start[0] + path.lengthMm * Math.cos((path.directionDeg * Math.PI) / 180),
            path.start[1] + path.lengthMm * Math.sin((path.directionDeg * Math.PI) / 180),
          ],
        ];
  if (points.length < 2) {
    throw new Error('Ein Verlauf braucht mindestens zwei Stützpunkte.');
  }
  for (const point of points) {
    if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) {
      throw new Error(`Stützpunkt ${point.join('/')} ist keine endliche Zahl.`);
    }
  }
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1] as Point;
    const [bx, by] = points[i] as Point;
    if (Math.hypot(bx - ax, by - ay) === 0) {
      throw new Error(`Stützpunkt ${i} fällt auf seinen Vorgänger; ein Abschnitt ohne Länge hat keine Richtung.`);
    }
  }
  return points;
}

/** Länge des Verlaufs in Millimetern. */
export function pathLengthMm(points: readonly Point[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1] as Point;
    const [bx, by] = points[i] as Point;
    length += Math.hypot(bx - ax, by - ay);
  }
  return length;
}

/** Punkt und Einheitsrichtung bei Bogenlänge `s` auf dem Verlauf. */
function pointAt(points: readonly Point[], s: number): { point: Point; direction: Point } {
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
function slicePath(points: readonly Point[], from: number, to: number): readonly Point[] {
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

function polyline(points: readonly Point[]): Primitive {
  return { type: 'polyline', role: 'pictogram', points, style: { ...STROKE } };
}

/** Rechtwinkliger Pfeilkopf mit Spitze `tip`, der in Richtung `direction` zeigt. */
function chevron(tip: Point, direction: Point, depthMm: number): Primitive {
  const [ux, uy] = direction;
  const [nx, ny] = [-uy, ux];
  const back: Point = [tip[0] - ux * depthMm, tip[1] - uy * depthMm];
  return polyline([
    [back[0] + nx * depthMm, back[1] + ny * depthMm],
    tip,
    [back[0] - nx * depthMm, back[1] - ny * depthMm],
  ]);
}

function reverseDirection([x, y]: Point): Point {
  return [-x, -y];
}

function hullOf(primitives: readonly Primitive[]): BoundsMm {
  const all = primitives.map((primitive) =>
    primitive.type === 'polyline' ? strokeBoundsOfMm(primitive) : boundsOfMm(primitive),
  );
  return {
    minX: Math.min(...all.map((b) => b.minX)),
    minY: Math.min(...all.map((b) => b.minY)),
    maxX: Math.max(...all.map((b) => b.maxX)),
    maxY: Math.max(...all.map((b) => b.maxY)),
  };
}

function drawingOf(
  title: string,
  children: readonly Primitive[],
  canvasMm: { readonly width: number; readonly height: number },
): Drawing {
  const hull = hullOf(children);
  if (hull.minX < 0 || hull.minY < 0 || hull.maxX > canvasMm.width || hull.maxY > canvasMm.height) {
    throw new Error(
      `${title}: der Verlauf ragt aus der Zeichenfläche ${canvasMm.width} × ${canvasMm.height} mm ` +
        `(Hülle ${hull.minX.toFixed(3)}/${hull.minY.toFixed(3)}/${hull.maxX.toFixed(3)}/${hull.maxY.toFixed(3)}).`,
    );
  }
  return { viewBox: { width: canvasMm.width, height: canvasMm.height }, children, title };
}

/**
 * Ein Pfeil aus 5.2 auf einem frei gesetzten Verlauf. Der Schaft folgt allen Stützpunkten, der
 * Kopf zeigt in Richtung des letzten Abschnitts (bei 5.2.4 zusätzlich entgegen dem ersten).
 *
 * Wirft `NotMeasuredError` für 5.2.2, 5.2.5 und 5.2.6 und für jede Anbindung an ein Grundzeichen.
 * Wirft einen gewöhnlichen Fehler, wenn der Verlauf kürzer ist als seine Köpfe tief sind oder aus
 * der Zeichenfläche ragt.
 */
export function movementDrawing(
  id: MovementId,
  parameters: MovementParameters,
  canvasMm: { readonly width: number; readonly height: number },
): Drawing {
  const geometry = MOVEMENT_GEOMETRY[id];
  if (geometry.status === 'not-measured') throw new NotMeasuredError(geometry.reason, 'value');
  if (parameters.anchor !== undefined) {
    throw new NotMeasuredError(
      `Anbindung an der Kante ${parameters.anchor.edge}: die Zone movement-anchor ist an keiner Körperform vermessen.`,
      'value',
    );
  }
  const points = resolvePathPoints(parameters.path);
  const { start, end, headDepthMm } = geometry.crossSection;
  const heads = (start === 'chevron' ? 1 : 0) + (end === 'chevron' ? 1 : 0);
  const length = pathLengthMm(points);
  if (length <= heads * headDepthMm) {
    throw new Error(
      `${id}: der Verlauf ist ${length.toFixed(3)} mm lang, die Köpfe brauchen mehr als ${heads * headDepthMm} mm.`,
    );
  }
  const children: Primitive[] = [polyline(points)];
  if (end === 'chevron') {
    children.push(chevron(points[points.length - 1] as Point, pointAt(points, length).direction, headDepthMm));
  }
  if (start === 'chevron') {
    children.push(chevron(points[0] as Point, reverseDirection(pointAt(points, 0).direction), headDepthMm));
  }
  return drawingOf(id, children, canvasMm);
}

/**
 * Wie sich Strich und Lücke auf einem Verlauf der Länge `lengthMm` wiederholen: `n` Lücken mit
 * gemessener Länge, `n + 1` Striche, die sich den Rest gleich teilen. `n` ist so groß, dass kein
 * Strich kürzer als gemessen wird. Auf dem Verlauf der Referenz (46 mm) ergibt das genau eine
 * Periode mit den gemessenen Längen.
 */
export function layoutDashes(
  lengthMm: number,
  crossSection: { readonly dashMm: number; readonly gapMm: number },
): { readonly dashes: readonly (readonly [number, number])[]; readonly gapCenters: readonly number[] } {
  const { dashMm, gapMm } = crossSection;
  const gaps = Math.floor((lengthMm - dashMm) / (dashMm + gapMm) + 1e-9);
  if (gaps < 1) {
    throw new Error(
      `Der Verlauf ist ${lengthMm.toFixed(3)} mm lang; eine Grenze braucht mindestens ${2 * dashMm + gapMm} mm für zwei Striche und eine Lücke.`,
    );
  }
  const stretchedDash = (lengthMm - gaps * gapMm) / (gaps + 1);
  const dashes: (readonly [number, number])[] = [];
  const gapCenters: number[] = [];
  let s = 0;
  for (let i = 0; i <= gaps; i++) {
    dashes.push([s, s + stretchedDash]);
    s += stretchedDash;
    if (i < gaps) {
      gapCenters.push(s + gapMm / 2);
      s += gapMm;
    }
  }
  return { dashes, gapCenters };
}

function gapLabel(content: string, center: Point, gapMm: number, viewBoxWidthMm: number): Primitive {
  const sizeMm = GAP_LABEL_CAP_HEIGHT_MM / ARIMO_CAP_HEIGHT_FRACTION;
  const baselineMm = center[1] + GAP_LABEL_BASELINE_BELOW_AXIS_MM;
  const box = verticalTextBoxMm(baselineMm, sizeMm, 'alphabetic');
  return {
    type: 'text',
    role: 'pictogram',
    content,
    x: center[0],
    y: baselineMm,
    sizeMm,
    anchor: 'middle',
    baseline: 'alphabetic',
    boxMm: { xMm: center[0] - gapMm / 2, yMm: box.topMm, widthMm: gapMm, heightMm: box.heightMm },
    minRenderPx: Math.ceil((MINIMUM_TEXT_RENDER_PX * viewBoxWidthMm) / sizeMm),
    style: { fill: 'schwarz' },
  };
}

function strengthMarks(strength: StrengthId, center: Point, direction: Point): Primitive[] {
  const offsets = STRENGTH_MARK_OFFSETS[strength];
  if (offsets === undefined) {
    throw new NotMeasuredError(
      `Grenze mit taktischer Stärke "${strength}": belegt sind nur drei Marken in einer Reihe, also der Zug.`,
      'combination',
    );
  }
  return offsets.map((offset) => ({
    type: 'circle',
    role: 'pictogram',
    cx: center[0] + direction[0] * offset * STRENGTH_MARK_PITCH_MM,
    cy: center[1] + direction[1] * offset * STRENGTH_MARK_PITCH_MM,
    r: STRENGTH_MARK_RADIUS_MM,
    style: { fill: 'schwarz' },
  }));
}

/**
 * Eine Linie oder Grenze aus Kapitel 2 auf einem frei gesetzten Verlauf.
 *
 * Die Beschriftung der Lücke steht aufrecht und nicht entlang des Verlaufs: die Referenz zeigt nur
 * einen waagerechten Verlauf und damit nicht, ob die Schrift sich mitdreht. Die Marken der Stärke
 * folgen dagegen dem Verlauf, weil sie auf ihm liegen.
 *
 * Wirft `NotMeasuredError` für 2.14 bis 2.16 und für jede Stärke außer dem Zug.
 */
export function lineDrawing(
  id: LineId,
  parameters: LineParameters,
  canvasMm: { readonly width: number; readonly height: number },
): Drawing {
  const geometry = LINE_GEOMETRY[id];
  if (geometry.status === 'not-measured') throw new NotMeasuredError(geometry.reason, 'value');
  const { gap } = geometry.crossSection;
  if (gap.kind === 'strength' && parameters.strength === undefined) {
    throw new Error(`${id}: die Grenze mit taktischer Stärke braucht eine Stärke.`);
  }
  if (gap.kind !== 'strength' && parameters.strength !== undefined) {
    throw new Error(`${id}: nur die Grenze mit taktischer Stärke (2.20) trägt eine Stärke.`);
  }
  const points = resolvePathPoints(parameters.path);
  const { dashes, gapCenters } = layoutDashes(pathLengthMm(points), geometry.crossSection);
  const children: Primitive[] = dashes.map(([from, to]) => polyline(slicePath(points, from, to)));
  for (const s of gapCenters) {
    const { point, direction } = pointAt(points, s);
    if (gap.kind === 'text') {
      children.push(gapLabel(gap.content, point, geometry.crossSection.gapMm, canvasMm.width));
    } else {
      children.push(...strengthMarks(parameters.strength as StrengthId, point, direction));
    }
  }
  return drawingOf(id, children, canvasMm);
}
