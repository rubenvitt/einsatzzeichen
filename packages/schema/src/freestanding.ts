import type {
  AnimalStateId,
  LineId,
  MovementId,
  PathParameters,
  WeatherIntensity,
  WeatherStateId,
} from './parametric.js';
import type { PictogramId } from './pictogram.js';
import type { DepictionVariant } from './provenance.js';
import type { StateId, StrengthId, SymbolKind, SymbolSpec } from './taxonomy.js';

/**
 * Freistehende Zeichen als eigene Spec-Art neben `SymbolSpec` (LFH-577, Entscheidung des
 * Eigentümers vom 29.09.2026).
 *
 * Pfeile aus 5.2, Linien und Grenzen aus Kapitel 2, Wetter aus 5.8.7 und Tierzustände aus 5.8.6
 * stehen ohne Grundzeichen auf der Lagekarte; seit LFH-798 auch die Einzeldarstellung eines
 * Zustands aus 5.8 und jedes übrige Einzelpiktogramm des Registers. Sie haben weder Körper noch Zonen: ein Pfeil hat einen
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

/**
 * Ein Tier, mit oder ohne Zustand aus 5.8.6. `variant: 'alternative'` nur am kontaminierten Tier
 * (mit „K“).
 *
 * Ohne `state` zeichnet die Spec das Tier ohne Zustand: nur die Tiersilhouette (LLH-1343). Kein
 * Original zeigt es; abgeleitet ist es aus den drei Tierzuständen, die alle die Silhouette tragen
 * und den Zustand mit Strich, Kreuz oder Kontaminationszeichen ergänzen, wie die Person ohne
 * Zustand (5.8.8.1) die Raute ohne Verletzungsstrich ist.
 */
export interface AnimalStateSpec {
  readonly kind: 'animal-state';
  readonly state?: AnimalStateId;
  readonly variant?: DepictionVariant;
}

/**
 * Die Einzeldarstellung eines Zustands aus 5.8 (LFH-798, Entscheidung des Eigentümers vom
 * 10.10.2026): 5.8.1 bis 5.8.5 und 5.8.9, die Einsatztaktiken 5.8.1.1 bis 5.8.1.4 eingeschlossen.
 * Gezeichnet wird genau die Kapiteldatei. `variant: 'alternative'` nur, wo das Register eine
 * zweite Darstellung führt.
 *
 * Der Wertevorrat ist der volle aus `STATE_IDS`. Wo eine andere Spec genau dieses Bild (Wert und
 * Variante) schon zeichnet, lehnt die Regel `state-not-canonical` ab und nennt sie: Tierzustand →
 * `animal-state`, Wetter → `weather`, Personenzustand in der ersten Darstellung →
 * `{ kind: 'person', states }`, die zweiten Darstellungen der Hinweise 5.8.1.13 und 5.8.1.14 →
 * `{ kind: 'hazard', states }`. Die zweite Darstellung von 5.8.8.6 zeichnet nur diese Art.
 */
export interface StateSpec {
  readonly kind: 'state';
  readonly state: StateId;
  readonly variant?: DepictionVariant;
}

/**
 * Ein Einzelpiktogramm aus den übrigen Räumen des Registers (LFH-798/LFH-834, Entscheidung vom
 * 10.10.2026): Kapitel 4 (`capability.*`), Anhang J (`comms.*`), Schäden aus K und L
 * (`damage.*`), Vegetationsbrand aus M (`wildfire.*`), Führung aus D (`leadership.*`),
 * Wasserrettungspersonal aus I.5 (`water-rescue-personnel.*`) und seit ESZ-134 die Sonderformen
 * 3.6 bis 3.8 (`special-form.*`: Drohne, Zweirad, Zweirad motorgetrieben). Gezeichnet wird genau die
 * Kapiteldatei, auf ihrer eigenen Fläche (D.1.1 steht auf 32 × 46 mm).
 *
 * Eine Fähigkeit aus Kapitel 4 ist als Bild wörtlich, ihre freistehende Verwendung auf der
 * Lagekarte belegt die Referenz aber nicht; die Herkunft vermerkt das. Der Wertevorrat ist der
 * volle aus `PICTOGRAM_IDS`; `state.*` (→ Art `state`) und Führungszeichen mit eigener Spec (die
 * Leitstelle D.2.5 als Ort) lehnt die Regel `pictogram-not-canonical` ab und nennt die Spec.
 * `variant: 'alternative'` nur, wo das Register eine zweite Darstellung führt.
 */
export interface PictogramSpec {
  readonly kind: 'pictogram';
  readonly pictogram: PictogramId;
  readonly variant?: DepictionVariant;
}

/** Die freistehende Spec-Art. */
export type FreestandingSpec =
  | MovementSpec
  | LineSpec
  | WeatherSpec
  | AnimalStateSpec
  | StateSpec
  | PictogramSpec;

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
    state: true,
    pictogram: true,
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
