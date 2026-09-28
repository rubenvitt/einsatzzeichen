import type { BlockId } from './blocks.js';
import type { Point } from './geometry.js';
import type { StateGroupFinding } from './state-groups.js';
import type { StrengthId } from './taxonomy.js';
import type { ZoneAnchorEdge } from './zones.js';

/**
 * Bausteine ohne feste Ausdehnung (LFH-566): die Pfeile aus 5.2 und die Linien und Grenzen aus
 * Kapitel 2. Ihre Geometrie entsteht nicht aus einer Box, sondern aus Nutzerparametern —
 * Stützpunkten, Richtung und Länge. Das ist die erste Bausteinart dieser Art.
 */

/** Bewegung und Maßnahmen aus 5.2, in Kapitelreihenfolge 5.2.1 bis 5.2.6. */
export type MovementId =
  /** 5.2.1 Richtung des Vortragens einer Maßnahme. */
  | 'direction-of-action'
  /** 5.2.2 Beginn einer Maßnahme. */
  | 'start-of-action'
  /** 5.2.3 Gerichtete Bewegung. */
  | 'directed-movement'
  /** 5.2.4 Bewegung in zwei Richtungen. */
  | 'movement-both-directions'
  /** 5.2.5 Ende einer Bewegung. */
  | 'end-of-movement'
  /** 5.2.6 Sammeln, Zusammenführen. */
  | 'gathering';

/**
 * Wertelisten wie in `taxonomy-values.ts`: als Schlüssel eines `Record<X, true>`, damit der
 * Compiler einen fehlenden oder überzähligen Wert ablehnt. Sie stehen hier und nicht dort, weil
 * `SymbolSpec` für beide noch kein Feld hat (LFH-577).
 */
export const MOVEMENT_IDS: readonly MovementId[] = Object.freeze(
  Object.keys({
    'direction-of-action': true,
    'start-of-action': true,
    'directed-movement': true,
    'movement-both-directions': true,
    'end-of-movement': true,
    gathering: true,
  } satisfies Record<MovementId, true>) as MovementId[],
);

/** Linien und Grenzen aus Kapitel 2, in Kapitelreihenfolge 2.14 bis 2.20. */
export type LineId =
  /** 2.14 Escape Route (Fluchtweg), mit einer zweiten Darstellung `2.14_Escape Route_2`. */
  | 'escape-route'
  /** 2.15 Riegelstellung. */
  | 'barrier-position'
  /** 2.16 Brandausbreitung. */
  | 'fire-spread'
  /** 2.17 Grenze Einsatzraum TEL. */
  | 'boundary-command-area'
  /** 2.18 Grenze Einsatzabschnitt. */
  | 'boundary-section'
  /** 2.19 Grenze Unterabschnitt. */
  | 'boundary-subsection'
  /** 2.20 Grenze mit taktischer Stärke. */
  | 'boundary-with-strength';

export const LINE_IDS: readonly LineId[] = Object.freeze(
  Object.keys({
    'escape-route': true,
    'barrier-position': true,
    'fire-spread': true,
    'boundary-command-area': true,
    'boundary-section': true,
    'boundary-subsection': true,
    'boundary-with-strength': true,
  } satisfies Record<LineId, true>) as LineId[],
);

/**
 * Der Verlauf eines Bausteins ohne feste Ausdehnung. Zwei gleichwertige Schreibweisen:
 *
 * - `points`: die Stützpunkte in Millimetern der Zeichenfläche, mindestens zwei. Die Reihenfolge
 *   ist die Richtung: der erste Punkt ist der Anfang, der letzte das Ende.
 * - `start`, `directionDeg`, `lengthMm`: ein gerader Verlauf. `directionDeg` zählt im Koordinaten-
 *   system der Zeichnung, also 0° nach rechts (+x) und 90° nach unten (+y), weil die y-Achse des IR
 *   nach unten zeigt. Das ist keine Kompassrichtung: 0° ist nicht Norden.
 *
 * Beide Schreibweisen löst `core` zu Stützpunkten auf (`resolvePathPoints`).
 */
export type PathParameters =
  | { readonly points: readonly [Point, Point, ...Point[]] }
  | { readonly start: Point; readonly directionDeg: number; readonly lengthMm: number };

/**
 * Die Kanten, an denen ein Pfeil an den Körper eines Grundzeichens gebunden werden kann. Eine
 * Teilmenge von `ZoneAnchorEdge`, damit die Anbindung dieselben Kanten nennt wie das Zonenmodell.
 */
export type MovementAnchorEdge = Extract<
  ZoneAnchorEdge,
  'body-top' | 'body-bottom' | 'body-left' | 'body-right'
>;

/**
 * Die Anbindung eines Pfeils an ein Grundzeichen: an welcher Körperkante der Pfeil beginnt. Die
 * Lage auf der Kante ist die Zone `movement-anchor` des Zonenmodells, und die ist an keiner
 * Körperform vermessen. Wer eine Anbindung angibt, bekommt deshalb heute eine Lücke gemeldet und
 * keine geratene Lage.
 */
export interface MovementAnchor {
  readonly edge: MovementAnchorEdge;
}

/** Der Parametersatz eines Pfeils aus 5.2. */
export interface MovementParameters {
  readonly path: PathParameters;
  readonly anchor?: MovementAnchor;
}

/** Der Parametersatz einer Linie oder Grenze aus Kapitel 2. */
export interface LineParameters {
  readonly path: PathParameters;
  /**
   * Nur bei 2.20 Grenze mit taktischer Stärke, dort Pflicht. Bei jeder anderen Linie ist das Feld
   * ein Fehler, keine stillschweigend übergangene Angabe.
   */
  readonly strength?: StrengthId;
}

/**
 * Stand einer Aussage über einen parametrisierten Baustein. Dieselben drei Zustände wie bei den
 * Zustandsgruppen aus LFH-565: `evidenced` mit Beleg, `proposed` mit Begründung, `open` mit Frage.
 */
export type ParametricFinding<T> = StateGroupFinding<T>;

/**
 * Welche Parameter ein Baustein trägt. Richtung und Länge sind in `path` enthalten und stehen hier
 * nicht einzeln: sie sind keine eigenen Freiheitsgrade, sondern folgen aus den Stützpunkten.
 */
export type ParametricParameter = 'path' | 'anchor' | 'strength';

/**
 * Die Form des Pfadendes. `chevron` ist ein offener, rechtwinkliger Pfeilkopf aus zwei Schenkeln,
 * `bar` ein Querstrich, `none` das stumpfe Ende des Schafts.
 */
export type PathEndForm = 'chevron' | 'bar' | 'none';

/** Wie die Referenz einen Linienbaustein zwischen zwei Strichen unterbricht. */
export type LineGapContent =
  | { readonly kind: 'text'; readonly content: string }
  | { readonly kind: 'strength' };

/**
 * Ein Baustein aus 5.2 oder Kapitel 2 mit Parametersatz, Zone und Regel.
 *
 * `zone` ist bei Pfeilen die Anbindungszone `movement-anchor`, bei Linien `freestanding`: eine
 * Grenze liegt auf der Lagekarte und nicht an einem Körper.
 */
export interface ParametricBlock {
  readonly id: BlockId;
  readonly category: 'arrow' | 'line';
  readonly valueId: MovementId | LineId;
  /** Der Abschnitt der Referenz, z. B. `5.2.1` oder `2.17`. */
  readonly section: string;
  readonly title: string;
  /** Die Parameter, die der Baustein annimmt. */
  readonly parameters: readonly ParametricParameter[];
  /** Die Referenzdateien. Die erste ist die Primärdarstellung. */
  readonly assets: readonly [`${string}.svg`, ...`${string}.svg`[]];
  /** Wie die Geometrie aus den Parametern entsteht, und wie weit das belegt ist. */
  readonly geometry: ParametricFinding<string>;
  /** Mit welchen Grundzeichen ein Pfeil verbunden werden darf. Bei Linien: keinem. */
  readonly carriers: ParametricFinding<readonly BlockId[]>;
  /** Wie der Baustein mit Zustand und Tendenz aus 5.8 zusammengeht. */
  readonly withStateOrTendency: ParametricFinding<string>;
  /** Die vorgemerkten Regeln des Bausteins, als Kennungen aus `PLANNED_PARAMETRIC_RULES`. */
  readonly rules: readonly string[];
}
