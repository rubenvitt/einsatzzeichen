import type { BoundsMm } from '../bounds.js';
import type {
  MovementAnchorEdge,
  PathParameters,
  Point,
  Primitive,
  StrengthId,
  SymbolKind,
} from '@einsatzzeichen/schema';
import { noteDerivation } from './record.js';

/**
 * Ableitungen an den freistehenden Zeichen aus Kapitel 2 und 5.2 (Eigentümerentscheid vom
 * 02.10.2026: zulassen, abgeleitet): die Stärken außer dem Zug an der Grenze 2.20 und die
 * Anbindung eines Pfeils an einen Körper außerhalb der Personenraute. Die Wetterpaare stehen in
 * `weather-pair.ts`.
 */

/**
 * Belegung der Grenzlücke je Stärke, in Teilungen (3 mm) entlang (`along`) und quer (`across`)
 * zum Verlauf. Vermessen ist nur der Zug (2.20: drei Marken in einer Reihe). Die übrigen Stärken
 * folgen der Kopfzone aus 5.4 (`strengths.ts`), weil sie dieselbe Aussage trägt:
 *
 * - Trupp belegt dort den mittleren der drei Reihenplätze, Gruppe die beiden äußeren
 *   (`ROW_OCCUPANCY`) — an der Grenze dieselben Plätze der Reihe.
 * - Die Staffel steht dort als **Stapel** aus zwei Marken quer zur Reihe (`stackHead`). An der
 *   Grenze heißt quer zur Reihe quer zum Verlauf; der Abstand ist die Teilung der Reihe, also
 *   eine halbe Teilung zu jeder Seite der Achse.
 */
const DERIVED_BOUNDARY_SLOTS: Readonly<Record<Exclude<StrengthId, 'zug'>, readonly (readonly [number, number])[]>> = {
  trupp: [[0, 0]],
  gruppe: [[-1, 0], [1, 0]],
  staffel: [[0, -0.5], [0, 0.5]],
};

/**
 * Die Stärkemarken einer Grenze für eine Stärke ohne vermessene Fassung, mittig in der Lücke um
 * `center`. Radius und Teilung sind die des Zuges an 2.20 (r 1 mm, 3 mm).
 */
export function derivedBoundaryStrengthMarks(
  strength: Exclude<StrengthId, 'zug'>,
  center: Point,
  direction: Point,
  radiusMm: number,
  pitchMm: number,
): Primitive[] {
  noteDerivation({
    dimension: 'strength',
    part: `Marken der Stärke "${strength}" in der Lücke der Grenze 2.20`,
    basis: 'transferred',
    from: '2.20 (Zug: r 1 mm, Teilung 3 mm) und Kopfzone 5.4 (Belegung der Reihenplätze, Stapel der Staffel)',
  });
  // Normale links der Fahrtrichtung, wie `leftNormal` in parametric.ts; die Staffel liegt
  // symmetrisch, das Vorzeichen ändert das Bild nicht.
  const normal: Point = [direction[1], -direction[0]];
  return DERIVED_BOUNDARY_SLOTS[strength].map(([along, across]) => ({
    type: 'circle',
    role: 'pictogram',
    cx: center[0] + (direction[0] * along + normal[0] * across) * pitchMm,
    cy: center[1] + (direction[1] * along + normal[1] * across) * pitchMm,
    r: radiusMm,
    style: { fill: 'schwarz' },
  }));
}

/** Überstand des angebundenen Pfeils über das Ende der Kante (5.8.8.12 bis 5.8.8.14: 1 mm). */
const ANCHORED_OVERHANG_MM = 1;

/**
 * Der Verlauf eines an einen Körper gebundenen Pfeils außerhalb der belegten Lage (Personenraute
 * unten, 26-mm-Raute, 5.2.2/5.2.3/5.2.5). Übertragen wird die Regel dieser Lage: Der Pfeil liegt
 * **parallel zur Kante** auf der Geraden durch die Hüllkante, beginnt an ihrem Anfang und endet
 * 1 mm hinter ihrem Ende. „Anfang“ ist an waagerechten Kanten links (Leserichtung, wie belegt),
 * an senkrechten oben. Jeder Pfeil, jeder Träger und jede Hüllgröße nimmt diese Regel; ob der
 * Verlauf in die Zeichenfläche passt, prüft erst die Zeichnung (`movementDrawing`).
 */
export function derivedAnchoredMovementPath(
  movement: string,
  carrier: SymbolKind,
  hull: BoundsMm,
  edge: MovementAnchorEdge,
): PathParameters {
  noteDerivation({
    dimension: 'movement',
    part: `Anbindung von ${movement} an ${carrier}, Kante ${edge}`,
    basis: 'transferred',
    from: '5.8.8.12–5.8.8.14: parallel zur Kante, vom Kantenanfang bis 1 mm über ihr Ende',
  });
  switch (edge) {
    case 'body-bottom':
      return { points: [[hull.minX, hull.maxY], [hull.maxX + ANCHORED_OVERHANG_MM, hull.maxY]] };
    case 'body-top':
      return { points: [[hull.minX, hull.minY], [hull.maxX + ANCHORED_OVERHANG_MM, hull.minY]] };
    case 'body-left':
      return { points: [[hull.minX, hull.minY], [hull.minX, hull.maxY + ANCHORED_OVERHANG_MM]] };
    case 'body-right':
      return { points: [[hull.maxX, hull.minY], [hull.maxX, hull.maxY + ANCHORED_OVERHANG_MM]] };
  }
}
