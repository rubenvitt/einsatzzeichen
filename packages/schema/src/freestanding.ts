import type {
  AnimalStateId,
  LineId,
  MovementId,
  PathParameters,
  WeatherIntensity,
  WeatherStateId,
} from './parametric.js';
import type { DepictionVariant } from './provenance.js';
import type { StrengthId, SymbolKind, SymbolSpec } from './taxonomy.js';

/**
 * Freistehende Zeichen als eigene Spec-Art neben `SymbolSpec` (LFH-577, Entscheidung des
 * Eigentümers vom 29.09.2026).
 *
 * Pfeile aus 5.2, Linien und Grenzen aus Kapitel 2, Wetter aus 5.8.7 und Tierzustände aus 5.8.6
 * stehen ohne Grundzeichen auf der Lagekarte. Sie haben weder Körper noch Zonen: ein Pfeil hat einen
 * Verlauf, das Wetter kombiniert Werte miteinander, der Tierzustand bringt seinen Träger mit. In
 * `SymbolSpec` wären sie Felder, die mit fast jedem anderen Feld unvereinbar sind. Deshalb eine
 * eigene Art, mit `kind` als Unterscheidungsmerkmal — dasselbe Feld wie bei `SymbolSpec`, damit
 * `AnySpec` sich an einer Stelle aufteilen lässt.
 *
 * Eine Pfeilanbindung an einen Körper gibt es hier nicht: belegt ist sie nur an der Personenraute
 * in 5.8.8.12 bis 5.8.8.14, und dort gehört der Pfeil zum Personenzustand (`states` an `person`).
 */

/** Die Zeichenfläche eines Zeichens mit Verlauf, in Millimetern. */
export interface CanvasMm {
  readonly width: number;
  readonly height: number;
}

/**
 * Ein Pfeil aus 5.2. `path` ist der Verlauf auf der Zeichenfläche; ohne `canvasMm` gilt die Fläche
 * der Referenz (32 × 32 mm).
 */
export interface MovementSpec {
  readonly kind: 'movement';
  readonly movement: MovementId;
  readonly path: PathParameters;
  readonly canvasMm?: CanvasMm;
}

/**
 * Eine Linie oder Grenze aus Kapitel 2. Ohne `canvasMm` gilt die Fläche der Referenz (48 × 32 mm).
 * `strength` nur an 2.20 (dort Pflicht), `variant: 'alternative'` nur an 2.14.
 */
export interface LineSpec {
  readonly kind: 'line';
  readonly line: LineId;
  readonly path: PathParameters;
  readonly strength?: StrengthId;
  readonly variant?: DepictionVariant;
  readonly canvasMm?: CanvasMm;
}

/**
 * Ein Wetterzeichen aus 5.8.7: ein Wert allein, oder die Wolke mit einem Niederschlag und einer
 * Intensität. Die Reihenfolge der Werte zählt nicht.
 */
export interface WeatherSpec {
  readonly kind: 'weather';
  readonly values: readonly [WeatherStateId, ...WeatherStateId[]];
  readonly intensity?: WeatherIntensity;
}

/** Ein Tierzustand aus 5.8.6. `variant: 'alternative'` nur am kontaminierten Tier (mit „K“). */
export interface AnimalStateSpec {
  readonly kind: 'animal-state';
  readonly state: AnimalStateId;
  readonly variant?: DepictionVariant;
}

/** Die freistehende Spec-Art. */
export type FreestandingSpec = MovementSpec | LineSpec | WeatherSpec | AnimalStateSpec;

/** Der Art-Diskriminator freistehender Zeichen. */
export type FreestandingKind = FreestandingSpec['kind'];

/** Jede Beschreibung eines Zeichens: mit Grundzeichen oder freistehend. */
export type AnySpec = SymbolSpec | FreestandingSpec;

/**
 * Wache zur Übersetzungszeit: kein Art-Diskriminator freistehender Zeichen darf eine
 * Grundzeichenart sein. `SymbolKind` kennt etwa schon `'area'` und `'point'`; ein Pfeil namens
 * `'point'` machte `AnySpec` mehrdeutig.
 */
type Disjoint<A, B> = [Extract<A, B>] extends [never] ? true : false;
true satisfies Disjoint<FreestandingKind, SymbolKind>;

/** Die Arten in fester Reihenfolge; vollständig per Typ wie `SYMBOL_KINDS`. */
export const FREESTANDING_KINDS: readonly FreestandingKind[] = Object.freeze(
  Object.keys({
    movement: true,
    line: true,
    weather: true,
    'animal-state': true,
  } satisfies Record<FreestandingKind, true>) as FreestandingKind[],
);

/** Die zehn Wetterwerte aus 5.8.7, in Kapitelreihenfolge. */
export const WEATHER_STATE_IDS: readonly WeatherStateId[] = Object.freeze(
  Object.keys({
    'weather-sunny': true,
    'weather-cloudy': true,
    'weather-cloud-cover-four-eighths': true,
    'weather-foggy': true,
    'weather-rainy': true,
    'weather-hailing': true,
    'weather-thunderstorm': true,
    'weather-snowing': true,
    'weather-temperature': true,
    'weather-windy': true,
  } satisfies Record<WeatherStateId, true>) as WeatherStateId[],
);

/** Die drei Tierzustände aus 5.8.6, in Kapitelreihenfolge. */
export const ANIMAL_STATE_IDS: readonly AnimalStateId[] = Object.freeze(
  Object.keys({
    'sick-animal': true,
    'contaminated-animal': true,
    'dead-animal': true,
  } satisfies Record<AnimalStateId, true>) as AnimalStateId[],
);

const FREESTANDING_KIND_SET: ReadonlySet<string> = new Set(FREESTANDING_KINDS);

/** Trennt `AnySpec` am Feld `kind`. */
export function isFreestandingSpec(spec: AnySpec): spec is FreestandingSpec {
  return FREESTANDING_KIND_SET.has(spec.kind);
}
