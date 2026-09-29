import type {
  ColorToken,
  Drawing,
  LineGapContent,
  LineId,
  LineParameters,
  MovementAnchorEdge,
  MovementId,
  MovementParameters,
  PathEndForm,
  PathParameters,
  Point,
  Primitive,
  StrengthId,
  SymbolKind,
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
 * **Abgelesen an den Referenzdateien** (29.09.2026, LFH-577; vorher nur am Kennzahlenartefakt).
 * Die Dateien liegen nicht im Repository. Maße an der Referenz abgelesen, Geometrie eigenständig
 * konstruiert; die Zahlen stehen an den Einträgen in pt der Dateien und in mm. Die Linien 2.14 bis
 * 2.16 laufen in der Referenz auf Kurven, ihre Marken sind entlang der aus beiden Strichkanten
 * rekonstruierten Achse gemessen. Das Kennzahlenartefakt prüft weiter die Hüllen
 * (`conformance/src/parametric-fixtures.test.ts`).
 *
 * Die Anbindung eines Pfeils an ein Grundzeichen ist die Zone `movement-anchor`. Belegt ist sie
 * nur an der Personenraute unten (5.8.8.12 bis 5.8.8.14, `anchoredMovementPath`).
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
 * Das Ende eines Pfeils: neben den Formen aus `PathEndForm` der Kopf vor einem Querstrich (5.2.5
 * Ende einer Bewegung) und der Kopf vor einem Ring um das Verlaufsende (5.2.6 Sammeln). Nur hier
 * geführt, damit die öffentliche Werteliste `PathEndForm` unverändert bleibt.
 */
type MovementEndForm = PathEndForm | 'bar-and-chevron' | 'ring-and-chevron';

/**
 * Ein Pfeil aus 5.2: was am Anfang und am Ende des Verlaufs sitzt, wie tief der Pfeilkopf ist und
 * wie viele Schäfte der Pfeil hat.
 *
 * Der Pfeilkopf ist ein offener, rechtwinkliger Winkel aus zwei Schenkeln: Tiefe gleich halbe
 * Breite. An den Dateien abgelesen: die Schenkelkanten laufen unter 45° (Umriss 5.2.3: Schenkel
 * von 74,201|33,514 bis 86,042|45,354 pt, Δx = Δy). Die Spitze ragt um 0,354 mm über das
 * Verlaufsende hinaus (Gehrung eines 0,5-mm-Strichs an 90°, 0,25 · √2), die Schenkelenden liegen
 * 0,177 mm außerhalb (Stumpfkappe eines 45°-Schenkels, 0,25 · cos 45°).
 *
 * - `shaftOffsetsMm`: Abstand jedes Schafts von der Achse, links der Fahrtrichtung negativ. Ein
 *   Schaft auf der Achse läuft bis zur Spitze; zwei Schäfte neben der Achse enden dort, wo sie den
 *   Schenkel treffen, also um ihren Abstand vor der Spitze (rechtwinkliger Kopf).
 * - `barLengthMm`: Länge des Querstrichs am Anfang (`bar`) oder Ende (`bar-and-chevron`), mittig
 *   auf der Achse und quer zu ihr.
 * - `headSetbackMm`: wie weit die Spitze vor dem Verlaufsende steht.
 * - `ringRadiusMm`: Ring um das Verlaufsende (`ring-and-chevron`).
 */
interface MovementCrossSection {
  readonly start: PathEndForm;
  readonly end: MovementEndForm;
  readonly headDepthMm: number;
  readonly shaftOffsetsMm: readonly number[];
  readonly barLengthMm?: number;
  readonly headSetbackMm?: number;
  readonly ringRadiusMm?: number;
}

type MovementGeometry =
  | { readonly status: 'measured'; readonly crossSection: MovementCrossSection; readonly note: string }
  | { readonly status: 'not-measured'; readonly reason: string };

/**
 * Abgelesen an den Referenzdateien (29.09.2026), Einheit pt mit 1 mm = 72/25,4 pt. Alle sechs
 * Pfeile stehen in 32 × 32 mm auf der Achse y 16 (45,354 pt).
 */
export const MOVEMENT_GEOMETRY: Readonly<Record<MovementId, MovementGeometry>> = Object.freeze({
  // 5.2.1: zwei Schaftstriche 38,976…40,393 und 50,315…51,732 pt, Mitten y 14 und 18 mm, ab x 2;
  // sie enden am inneren Schenkelrand. Kopf mit Spitze bei 30, Schenkelenden 24,177|9,823: 6 mm.
  'direction-of-action': {
    status: 'measured',
    crossSection: { start: 'none', end: 'chevron', headDepthMm: 6, shaftOffsetsMm: [-2, 2] },
    note: '5.2.1: zwei Schäfte 2 mm neben der Achse (Mitten y 14 und 18) ab x 2, Kopf 6 mm tief mit Spitze bei 30; Hülle 2/9,823/30,354/22,177.',
  },
  // 5.2.2: Querstrich 4,96…6,377 × 34,015…56,693 pt, also bei x 2 von y 12 bis 20: 8 mm lang.
  // Kopf wie 5.2.3. Dieselben Maße zeigt 5.8.8.12 an der Personenraute.
  'start-of-action': {
    status: 'measured',
    crossSection: { start: 'bar', end: 'chevron', headDepthMm: 4, shaftOffsetsMm: [0], barLengthMm: 8 },
    note: '5.2.2: Querstrich bei x 2 von y 12 bis 20 (8 mm, mittig auf der Achse), Schaft bis zur Spitze bei 30, Kopf 4 mm tief; Hülle 1,75/11,823/30,354/20,177.',
  },
  // 5.2.3: Schaft ab 5,669 pt (x 2), Schenkelenden 74,201|33,514 pt (26,177|11,823), Spitze 30.
  'directed-movement': {
    status: 'measured',
    crossSection: { start: 'none', end: 'chevron', headDepthMm: 4, shaftOffsetsMm: [0] },
    note: '5.2.3: Schaft ab x 2, Kopf 4 mm tief mit Spitze bei 30; Hülle 2/11,823/30,354/20,177.',
  },
  // 5.2.4: Spitzen bei 2 und 30 (Gehrung 4,667 und 86,042 pt), beide Köpfe 4 mm tief.
  'movement-both-directions': {
    status: 'measured',
    crossSection: { start: 'chevron', end: 'chevron', headDepthMm: 4, shaftOffsetsMm: [0] },
    note: '5.2.4: Köpfe an beiden Enden, Spitzen bei 2 und 30, je 4 mm tief; Hülle 1,646/11,823/30,354/20,177.',
  },
  // 5.2.5: Querstrich 84,331…85,748 × 34,015…56,693 pt, also bei x 30 von y 12 bis 20. Die
  // Schenkelenden liegen bei 73,635 pt (25,977 mm), 0,2 mm vor denen von 5.2.3: die Spitze steht
  // bei 29,8, ihre Gehrung (30,154) bleibt im Querstrich. 5.8.8.14 zeigt dieselbe Figur mit 0,1 mm.
  'end-of-movement': {
    status: 'measured',
    crossSection: {
      start: 'none',
      end: 'bar-and-chevron',
      headDepthMm: 4,
      shaftOffsetsMm: [0],
      barLengthMm: 8,
      headSetbackMm: 0.2,
    },
    note: '5.2.5: Querstrich bei x 30 von y 12 bis 20 (8 mm), Kopf 4 mm tief mit Spitze 0,2 mm davor; Hülle 2/11,823/30,25/20,177.',
  },
  // 5.2.6: Ring um 73,701|45,354 pt (26|16) mit Außenradius 12,047 und Innenradius 10,63 pt, also
  // Mittelradius 4 mm. Pfeil wie 5.2.3, Schenkelenden bei 48,69 pt (17,177), Spitze bei x 21: 1 mm
  // vor dem Ring, 5 mm vor seiner Mitte. Die Referenz zeigt genau einen Zulauf.
  gathering: {
    status: 'measured',
    crossSection: {
      start: 'none',
      end: 'ring-and-chevron',
      headDepthMm: 4,
      shaftOffsetsMm: [0],
      headSetbackMm: 5,
      ringRadiusMm: 4,
    },
    note: '5.2.6: Ring mit Radius 4 mm um das Verlaufsende 26|16, Pfeil ab x 2 mit 4 mm tiefem Kopf, Spitze bei x 21, 1 mm vor dem Ring.',
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
  readonly kind: 'dashed';
  readonly dashMm: number;
  readonly gapMm: number;
  readonly gap: LineGapContent;
}

/**
 * Eine Linie aus 2.14 bis 2.16: ein durchgehender, farbiger Strich entlang des Verlaufs, auf dem
 * sich Marken mit fester Teilung wiederholen. Die Marken werden **wiederholt, nicht gestreckt**:
 * Querstrich, Punkt und Pfeilkopf behalten ihre Maße auf jedem Verlauf.
 *
 * - `tick`: Querstrich quer zum Verlauf, links der Fahrtrichtung, von der Achse bis `lengthMm`.
 * - `dot`: gefüllter Punkt mit Radius `radiusMm` auf der Achse.
 * - `dot-and-chevron`: Punkte, dazwischen je ein rechtwinkliger Pfeilkopf mit Schenkeln von
 *   `chevronArmMm`, mittig zwischen zwei Punkten und in Fahrtrichtung.
 */
export type LineMark =
  | { readonly kind: 'tick'; readonly lengthMm: number }
  | { readonly kind: 'dot'; readonly radiusMm: number }
  | { readonly kind: 'dot-and-chevron'; readonly radiusMm: number; readonly chevronArmMm: number };

interface MarkedLineCrossSection {
  readonly kind: 'marked';
  readonly color: ColorToken;
  readonly pitchMm: number;
  readonly mark: LineMark;
}

type LineGeometry =
  | {
      readonly status: 'measured';
      readonly crossSection: LineCrossSection | MarkedLineCrossSection;
      /** Die zweite Darstellung (2.14 Escape Route_2), sonst keine. */
      readonly alternative?: MarkedLineCrossSection;
      readonly note: string;
    }
  | { readonly status: 'not-measured'; readonly reason: string };

/**
 * Querstrich von 2.15 und 2.16: Umriss 0,5 mm breit, die Seitenkanten 2,01…2,03 mm lang ab dem
 * Rand des Linienstrichs, das Strichende 2,26…2,28 mm von der Achse (je 12 bzw. 14 Striche an den
 * Dateien nachgemessen). Gebaut als Strich von der Achse bis 2,25 mm, also 2 mm über den Rand.
 */
const TICK_LENGTH_MM = 2.25;

export const LINE_GEOMETRY: Readonly<Record<LineId, LineGeometry>> = Object.freeze({
  // 2.14: grüner Strich (#14a01e), Umriss 0,5 mm (Kappe 1,268|0,634 pt). Sieben Punkte mit Radius
  // 1,5 mm (Bögen 4,252 pt) auf der Achse, Abstand 7,96…7,97 mm entlang des Verlaufs.
  // 2.14_2: fünf Punkte gleichen Radius, Abstand 12,16…12,19 mm, dazwischen vier rechtwinklige
  // Pfeilköpfe mit 3 mm langen Schenkeln, Spitze in Richtung des Verlaufsendes.
  'escape-route': {
    status: 'measured',
    crossSection: { kind: 'marked', color: 'gruen', pitchMm: 8, mark: { kind: 'dot', radiusMm: 1.5 } },
    alternative: {
      kind: 'marked',
      color: 'gruen',
      pitchMm: 12,
      mark: { kind: 'dot-and-chevron', radiusMm: 1.5, chevronArmMm: 3 },
    },
    note: '2.14: grüner Strich 0,5 mm mit gefüllten Punkten (Radius 1,5 mm) alle 8 mm; zweite Darstellung mit Punkten alle 12 mm und rechtwinkligen Pfeilköpfen (Schenkel 3 mm) dazwischen.',
  },
  // 2.15: hellblauer Strich (#3264fa), zwölf Querstriche auf 52,1 mm Verlauf, Abstand 3,99 mm.
  'barrier-position': {
    status: 'measured',
    crossSection: { kind: 'marked', color: 'hellblau', pitchMm: 4, mark: { kind: 'tick', lengthMm: TICK_LENGTH_MM } },
    note: '2.15: hellblauer Strich 0,5 mm mit Querstrichen links der Fahrtrichtung, 2,25 mm von der Achse, alle 4 mm.',
  },
  // 2.16: roter Strich (#fa1919), vierzehn Querstriche auf 61,8 mm Verlauf, Abstand 4,15 mm.
  'fire-spread': {
    status: 'measured',
    crossSection: { kind: 'marked', color: 'rot', pitchMm: 4, mark: { kind: 'tick', lengthMm: TICK_LENGTH_MM } },
    note: '2.16: roter Strich 0,5 mm mit Querstrichen links der Fahrtrichtung, 2,25 mm von der Achse, alle 4 mm (Referenz 4,15 mm).',
  },
  // 2.17: Striche 1…17 und 31…47, drei Glyphen T, E, L zwischen x 19,082 und 28,932.
  'boundary-command-area': {
    status: 'measured',
    crossSection: { kind: 'dashed', dashMm: 16, gapMm: 14, gap: { kind: 'text', content: 'TEL' } },
    note: '2.17: Striche 1…17 und 31…47 bei y 15,75…16,25; in der Lücke drei Glyphen zwischen x 19,082 und 28,932, Mitte 24,007.',
  },
  // 2.18: Striche wie 2.17, zwei Glyphen E und A zwischen x 21,038 und 27,662.
  'boundary-section': {
    status: 'measured',
    crossSection: { kind: 'dashed', dashMm: 16, gapMm: 14, gap: { kind: 'text', content: 'EA' } },
    note: '2.18: Striche 1…17 und 31…47; in der Lücke zwei Glyphen zwischen x 21,038 und 27,662.',
  },
  // 2.19: Striche 1…16 und 32…47. Drei Glyphen: U (18,822…22,074, der Kurvenpfad mit zwei
  // Stämmen und Bogen unten), E und A gleich breit wie in 2.18.
  'boundary-subsection': {
    status: 'measured',
    crossSection: { kind: 'dashed', dashMm: 15, gapMm: 16, gap: { kind: 'text', content: 'UEA' } },
    note: '2.19: Striche 1…16 und 32…47; in der Lücke U, E und A, E (2,559 breit) und A (3,716 breit) wie in 2.18, das U als Kurvenpfad von x 18,822 bis 22,074.',
  },
  // 2.20: Striche 1…18 und 30…47, drei Kreise mit Radius 1 bei x 21, 24 und 27.
  'boundary-with-strength': {
    status: 'measured',
    crossSection: { kind: 'dashed', dashMm: 17, gapMm: 12, gap: { kind: 'strength' } },
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

function polyline(points: readonly Point[], color: ColorToken = 'schwarz'): Primitive {
  return { type: 'polyline', role: 'pictogram', points, style: { ...STROKE, stroke: color } };
}

/** Rechtwinkliger Pfeilkopf mit Spitze `tip`, der in Richtung `direction` zeigt. */
function chevron(tip: Point, direction: Point, depthMm: number, color: ColorToken = 'schwarz'): Primitive {
  const [ux, uy] = direction;
  const [nx, ny] = [-uy, ux];
  const back: Point = [tip[0] - ux * depthMm, tip[1] - uy * depthMm];
  return polyline(
    [
      [back[0] + nx * depthMm, back[1] + ny * depthMm],
      tip,
      [back[0] - nx * depthMm, back[1] - ny * depthMm],
    ],
    color,
  );
}

function reverseDirection([x, y]: Point): Point {
  return [-x, -y];
}

/**
 * Die sichtbare Ausdehnung: Polyzüge mit Gehrung (`strokeBoundsOfMm`), gestrichene Kreise um die
 * halbe Strichstärke größer, alles andere nach `boundsOfMm`.
 */
function hullOf(primitives: readonly Primitive[]): BoundsMm {
  const all = primitives.map((primitive) => {
    if (primitive.type === 'polyline') return strokeBoundsOfMm(primitive);
    const bounds = boundsOfMm(primitive);
    if (primitive.type !== 'circle' || primitive.style?.stroke === undefined || primitive.style.stroke === 'none') {
      return bounds;
    }
    const half = (primitive.style.strokeWidth ?? STROKE_WIDTH_MM) / 2;
    return { minX: bounds.minX - half, minY: bounds.minY - half, maxX: bounds.maxX + half, maxY: bounds.maxY + half };
  });
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

/** Die Normale links der Fahrtrichtung. Die y-Achse zeigt nach unten, links ist deshalb (y, −x). */
function leftNormal([x, y]: Point): Point {
  return [y, -x];
}

/**
 * Kleinster Innenwinkel an einem Knick, bei dem die Parallelen eines Doppelschafts noch sauber
 * gehren. Bei 45° ist der Gehrungsweg 2,6-mal der Abstand; spitzer würde der innere Schaft bei
 * kurzen Abschnitten über sich selbst laufen. Eine Bauregel, keine Ablesung: die Referenz zeigt
 * 5.2.1 nur gerade.
 */
const MIN_PARALLEL_KNICK_DEG = 45;

/**
 * Der Verlauf um `offsetMm` nach links (negativ) oder rechts (positiv) der Fahrtrichtung versetzt,
 * mit gegehrten Knicken. Der Gehrungspunkt ist der Schnitt der beiden versetzten Abschnitte.
 */
function offsetPolyline(points: readonly Point[], offsetMm: number): readonly Point[] {
  const normals: Point[] = [];
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1] as Point;
    const [bx, by] = points[i] as Point;
    const length = Math.hypot(bx - ax, by - ay);
    normals.push(leftNormal([(bx - ax) / length, (by - ay) / length]));
  }
  const d = -offsetMm;
  return points.map(([x, y], i) => {
    const before = normals[Math.max(0, i - 1)] as Point;
    const after = normals[Math.min(normals.length - 1, i)] as Point;
    const cos = before[0] * after[0] + before[1] * after[1];
    const interiorDeg = 180 - (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
    if (interiorDeg < MIN_PARALLEL_KNICK_DEG) {
      throw new Error(
        `Der Knick bei ${x}|${y} ist mit ${interiorDeg.toFixed(1)}° spitzer als ${MIN_PARALLEL_KNICK_DEG}°; die Parallelen des Doppelschafts lassen sich dort nicht gehren.`,
      );
    }
    const scale = d / (1 + cos);
    return [x + (before[0] + after[0]) * scale, y + (before[1] + after[1]) * scale] as Point;
  });
}

/** Querstrich der Länge `lengthMm`, mittig auf `center` und quer zur Richtung `direction`. */
function bar(center: Point, direction: Point, lengthMm: number): Primitive {
  const [nx, ny] = leftNormal(direction);
  const half = lengthMm / 2;
  return polyline([
    [center[0] + nx * half, center[1] + ny * half],
    [center[0] - nx * half, center[1] - ny * half],
  ]);
}

function ring(center: Point, radiusMm: number): Primitive {
  return { type: 'circle', role: 'pictogram', cx: center[0], cy: center[1], r: radiusMm, style: { ...STROKE } };
}

/**
 * Ein Pfeil aus 5.2 auf einem frei gesetzten Verlauf. Der Schaft folgt allen Stützpunkten, der
 * Kopf zeigt in Richtung des letzten Abschnitts (bei 5.2.4 zusätzlich entgegen dem ersten).
 * Querstrich und Ring sitzen am Verlaufsende bzw. -anfang, quer zum Abschnitt dort; bei 5.2.6 ist
 * das Verlaufsende der Sammelpunkt in der Ringmitte.
 *
 * Das ist die Zeichenfunktion für einen **freistehenden** Pfeil. Eine Anbindung an ein
 * Grundzeichen meldet sie als Lücke: welchen Verlauf ein angebundener Pfeil hat, bestimmt der
 * Körper (`anchoredMovementPath`), nicht der Nutzer.
 *
 * Wirft einen gewöhnlichen Fehler, wenn der Verlauf kürzer ist als seine Köpfe tief sind, wenn ein
 * Doppelschaft (5.2.1) einen zu spitzen Knick nehmen müsste oder wenn er aus der Zeichenfläche
 * ragt.
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
      `Anbindung an der Kante ${parameters.anchor.edge}: ein freistehender Pfeil hat keinen Körper. ` +
        'Die Zone movement-anchor ist nur an der Personenraute unten belegt (anchoredMovementPath).',
      'value',
    );
  }
  const points = resolvePathPoints(parameters.path);
  const { start, end, headDepthMm, shaftOffsetsMm, barLengthMm, headSetbackMm = 0, ringRadiusMm } =
    geometry.crossSection;
  const heads = (start === 'chevron' ? 1 : 0) + 1;
  const length = pathLengthMm(points);
  const needed = heads * headDepthMm + headSetbackMm;
  if (length <= needed) {
    throw new Error(
      `${id}: der Verlauf ist ${length.toFixed(3)} mm lang, die Köpfe brauchen mehr als ${needed} mm.`,
    );
  }
  const tipAt = length - headSetbackMm;
  const children: Primitive[] = shaftOffsetsMm.map((offset) =>
    offset === 0
      ? polyline(slicePath(points, 0, tipAt))
      : polyline(offsetPolyline(slicePath(points, 0, tipAt - Math.abs(offset)), offset)),
  );
  const tip = pointAt(points, tipAt);
  children.push(chevron(tip.point, tip.direction, headDepthMm));
  if (start === 'chevron') {
    children.push(chevron(points[0] as Point, reverseDirection(pointAt(points, 0).direction), headDepthMm));
  }
  if (start === 'bar') children.push(bar(points[0] as Point, pointAt(points, 0).direction, barLengthMm as number));
  const last = pointAt(points, length);
  if (end === 'bar-and-chevron') children.push(bar(last.point, last.direction, barLengthMm as number));
  if (end === 'ring-and-chevron') children.push(ring(last.point, ringRadiusMm as number));
  return drawingOf(id, children, canvasMm);
}

/**
 * Die Pfeile, die ein Original an einem Grundzeichen zeigt: 5.8.8.12 (Person zu transportieren)
 * zeichnet 5.2.2, 5.8.8.13 (Transport einer Person) 5.2.3 und 5.8.8.14 (Person transportiert)
 * 5.2.5 an der Personenraute. Andere Pfeile an einem Körper zeigt kein Original.
 */
const ANCHORED_MOVEMENTS: readonly MovementId[] = ['start-of-action', 'directed-movement', 'end-of-movement'];

/**
 * Überstand des angebundenen Pfeils über die rechte Körperecke. 5.8.8.12 bis 5.8.8.14: Raute bis
 * x 29 (82,205 pt), Pfeilspitze bzw. Querstrich bei x 30 (85,04 pt).
 */
const ANCHORED_OVERHANG_MM = 1;

/** Kantenlänge der Rautenhülle, an der die Anbindung belegt ist (5.8.8.12 bis 5.8.8.14: 3…29). */
const ANCHORED_DIAMOND_MM = 26;

/**
 * Der Verlauf eines Pfeils, der an einen Körper gebunden ist — die Zone `movement-anchor`.
 *
 * Belegt ist genau eine Lage: an der **Personenraute unten** (5.8.8.12 bis 5.8.8.14, Raute 26 mm,
 * um 2 mm angehoben, Hülle 3…29 × 1…27). Der Pfeil liegt dort nicht in eigener Richtung an einer
 * Kante, sondern **parallel zum Körper** auf der Waagerechten durch die untere Ecke (Schaft
 * 75,827…77,244 pt, Mitte y 27), zeigt nach rechts, beginnt am linken Körperrand (x 3) und endet
 * 1 mm hinter dem rechten (x 30). Den Verlauf bestimmt damit der Körper, nicht der Nutzer.
 *
 * `bodyHullMm` ist die Hülle der Körpermittellinie und muss die 26-mm-Raute sein: wer einen Pfeil
 * anbindet, muss den Körper so verkleinern und anheben wie die Referenz (Raute 3…29 × 1…27 in
 * 32 × 32 mm). Jede andere Größe, Kante, jeder andere Träger und jeder andere Pfeil ist eine Lücke
 * (`NotMeasuredError`), statt eine Lage zu raten.
 */
export function anchoredMovementPath(
  id: MovementId,
  carrier: SymbolKind,
  bodyHullMm: BoundsMm,
  edge: MovementAnchorEdge,
): PathParameters {
  if (!ANCHORED_MOVEMENTS.includes(id)) {
    throw new NotMeasuredError(
      `Pfeil ${id} an einem Grundzeichen: belegt sind nur 5.2.2, 5.2.3 und 5.2.5 an der Personenraute (5.8.8.12 bis 5.8.8.14).`,
      'combination',
    );
  }
  if (carrier !== 'person' || edge !== 'body-bottom') {
    throw new NotMeasuredError(
      `Anbindung an ${carrier}, Kante ${edge}: die Zone movement-anchor ist nur an der Personenraute unten belegt (5.8.8.12 bis 5.8.8.14).`,
      'combination',
    );
  }
  const width = bodyHullMm.maxX - bodyHullMm.minX;
  const height = bodyHullMm.maxY - bodyHullMm.minY;
  if (Math.abs(width - ANCHORED_DIAMOND_MM) > 1e-6 || Math.abs(height - ANCHORED_DIAMOND_MM) > 1e-6) {
    throw new NotMeasuredError(
      `Anbindung an eine Raute von ${width.toFixed(3)} × ${height.toFixed(3)} mm: belegt ist nur die 26-mm-Raute aus 5.8.8.12 bis 5.8.8.14. ` +
        'Die volle Raute aus 1.2 (30 mm) ließe dem Pfeil in 32 × 32 mm keinen Platz.',
      'value',
    );
  }
  return {
    points: [
      [bodyHullMm.minX, bodyHullMm.maxY],
      [bodyHullMm.maxX + ANCHORED_OVERHANG_MM, bodyHullMm.maxY],
    ],
  };
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
 * Kleinster Abstand der ersten und letzten Marke vom Verlaufsende. Mit fester Teilung, mittig
 * gesetzt, ergibt genau dieser Wert an allen vier Referenzdarstellungen die abgelesene Anzahl
 * (2.14: 7 Punkte auf 60,36 mm, 2.14_2: 5 auf 58,70, 2.15: 12 Striche auf 52,11, 2.16: 14 auf
 * 61,83); jeder Wert zwischen 2,92 und 4,05 mm täte das. Die Lage weicht dabei um höchstens
 * 1,65 mm von der Referenz ab (2.14_2, erster Punkt), weil die Referenzen die Marken nicht streng
 * mittig setzen. Eine vorgeschlagene Regel, keine Ablesung.
 */
const MARK_END_MARGIN_MM = 3;

/** Bogenlängen der Marken: feste Teilung, mittig auf dem Verlauf, mindestens 3 mm vom Ende. */
function layoutMarks(lengthMm: number, pitchMm: number): readonly number[] {
  const count = Math.floor((lengthMm - 2 * MARK_END_MARGIN_MM) / pitchMm + 1e-9) + 1;
  if (count < 1) return [];
  const first = (lengthMm - (count - 1) * pitchMm) / 2;
  return Array.from({ length: count }, (_, i) => first + i * pitchMm);
}

function markedLine(
  id: LineId,
  points: readonly Point[],
  crossSection: MarkedLineCrossSection,
): Primitive[] {
  const { color, pitchMm, mark } = crossSection;
  const length = pathLengthMm(points);
  const anchors = layoutMarks(length, pitchMm);
  const minimum = mark.kind === 'dot-and-chevron' ? 2 : 1;
  if (anchors.length < minimum) {
    throw new Error(
      `${id}: der Verlauf ist mit ${length.toFixed(3)} mm zu kurz; er braucht Platz für ${minimum === 2 ? 'zwei Punkte und einen Pfeilkopf' : 'eine Marke'} (${(minimum - 1) * pitchMm + 2 * MARK_END_MARGIN_MM} mm).`,
    );
  }
  const children: Primitive[] = [polyline(points, color)];
  for (const s of anchors) {
    const { point, direction } = pointAt(points, s);
    if (mark.kind === 'tick') {
      const [nx, ny] = leftNormal(direction);
      children.push(polyline([point, [point[0] + nx * mark.lengthMm, point[1] + ny * mark.lengthMm]], color));
    } else {
      children.push({ type: 'circle', role: 'pictogram', cx: point[0], cy: point[1], r: mark.radiusMm, style: { fill: color } });
    }
  }
  if (mark.kind === 'dot-and-chevron') {
    const depth = mark.chevronArmMm * Math.SQRT1_2;
    for (let i = 1; i < anchors.length; i++) {
      const middle = ((anchors[i - 1] as number) + (anchors[i] as number)) / 2;
      const tip = pointAt(points, middle + depth / 2);
      children.push(chevron(tip.point, tip.direction, depth, color));
    }
  }
  return children;
}

/**
 * Eine Linie oder Grenze aus Kapitel 2 auf einem frei gesetzten Verlauf.
 *
 * Grenzen (2.17 bis 2.20): Die Beschriftung der Lücke steht aufrecht und nicht entlang des
 * Verlaufs: die Referenz zeigt nur einen waagerechten Verlauf und damit nicht, ob die Schrift sich
 * mitdreht. Die Marken der Stärke folgen dagegen dem Verlauf, weil sie auf ihm liegen.
 *
 * Linien mit Marken (2.14 bis 2.16): ein farbiger Strich entlang aller Stützpunkte, darauf die
 * Marken mit fester Teilung (`layoutMarks`). Querstriche stehen links der Fahrtrichtung; wer den
 * Verlauf umkehrt, setzt sie auf die andere Seite.
 *
 * Wirft `NotMeasuredError` für jede Stärke außer dem Zug. Wirft einen gewöhnlichen Fehler für eine
 * Stärke an der falschen Linie, eine zweite Darstellung außer an 2.14, einen zu kurzen Verlauf und
 * einen Verlauf, der aus der Zeichenfläche ragt.
 */
export function lineDrawing(
  id: LineId,
  parameters: LineParameters,
  canvasMm: { readonly width: number; readonly height: number },
): Drawing {
  const geometry = LINE_GEOMETRY[id];
  if (geometry.status === 'not-measured') throw new NotMeasuredError(geometry.reason, 'value');
  const isStrengthLine = geometry.crossSection.kind === 'dashed' && geometry.crossSection.gap.kind === 'strength';
  if (isStrengthLine && parameters.strength === undefined) {
    throw new Error(`${id}: die Grenze mit taktischer Stärke braucht eine Stärke.`);
  }
  if (!isStrengthLine && parameters.strength !== undefined) {
    throw new Error(`${id}: nur die Grenze mit taktischer Stärke (2.20) trägt eine Stärke.`);
  }
  if (parameters.variant === 'alternative' && geometry.alternative === undefined) {
    throw new Error(`${id}: eine zweite Darstellung gibt es nur bei 2.14 Escape Route.`);
  }
  const points = resolvePathPoints(parameters.path);
  const crossSection =
    parameters.variant === 'alternative' && geometry.alternative !== undefined
      ? geometry.alternative
      : geometry.crossSection;
  if (crossSection.kind === 'marked') return drawingOf(id, markedLine(id, points, crossSection), canvasMm);
  const { gap } = crossSection;
  const { dashes, gapCenters } = layoutDashes(pathLengthMm(points), crossSection);
  const children: Primitive[] = dashes.map(([from, to]) => polyline(slicePath(points, from, to)));
  for (const s of gapCenters) {
    const { point, direction } = pointAt(points, s);
    if (gap.kind === 'text') {
      children.push(gapLabel(gap.content, point, crossSection.gapMm, canvasMm.width));
    } else {
      children.push(...strengthMarks(parameters.strength as StrengthId, point, direction));
    }
  }
  return drawingOf(id, children, canvasMm);
}
