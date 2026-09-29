import type { BlockId, BlockZone } from './blocks.js';
import type {
  GrammarEvidence,
  GrammarFinding,
  GrammarFixtureEvidence,
  GrammarSourceEvidence,
} from './grammar-findings.js';

/**
 * Die neun Gruppen aus Kapitel 5.8, in Kapitelreihenfolge 5.8.1 bis 5.8.9 (LFH-565).
 *
 * Eine Gruppe ist die Einheit, für die die Grammatik Zone und Regel führt: „wo am Zeichen" und
 * „mit welchem Träger, wie viele zugleich". Die einzelnen Werte stehen weiter im Bausteinregister
 * (`state/<wert>`, `tendency/<wert>`), die Gruppe fasst sie über den Abschnitt zusammen.
 */
export type StateGroupId =
  | 'tactics-hazards'
  | 'activity'
  | 'tendency'
  | 'damage'
  | 'fire'
  | 'animals'
  | 'weather'
  | 'persons'
  | 'access';

/** Beleg im Quelltext. Seit LFH-567 ein Alias von `GrammarSourceEvidence`. */
export type StateGroupSourceEvidence = GrammarSourceEvidence;

/** Beleg an einem Beispielzeichen der Referenz. Seit LFH-567 ein Alias von `GrammarFixtureEvidence`. */
export type StateGroupFixtureEvidence = GrammarFixtureEvidence;

export type StateGroupEvidence = GrammarEvidence;

/**
 * Stand einer Aussage über eine Gruppe: belegt, empfohlen, offen oder (seit LFH-577) vom Eigentümer
 * entschieden. Seit LFH-567 ein Alias von `GrammarFinding`, den auch Mehrfachfähigkeiten und
 * Sonderformen benutzen.
 */
export type StateGroupFinding<T> = GrammarFinding<T>;

/**
 * Wie die Referenz einen Wert der Gruppe zeichnet:
 *
 * - `mark`: als Marke ohne Träger. Die Darstellung zeigt nur den Zustand.
 * - `carrier-included`: die Darstellung zeichnet ihren Träger selbst mit, etwa die Personenraute
 *   in 5.8.8. Ein solcher Wert ist kein freier Baustein, sondern an diesen Träger gebunden.
 */
export type StateGroupForm = 'mark' | 'carrier-included';

/**
 * Die Regelkennungen einer Gruppe. Seit LFH-577 trägt `SymbolSpec` die Felder `states` und
 * `tendency`: `state-carrier-not-allowed` und `state-group-limit-exceeded` prüft `validateSpec`
 * (Regelkatalog), `tendency-carrier-not-allowed` ist weiter vorgemerkt (`PLANNED_STATE_RULES`),
 * `tendency-limit-exceeded` ist gestrichen, weil `tendency` ein Einzelfeld ist
 * (`RETIRED_STATE_RULES` in `core`).
 */
export interface StateGroupRuleIds {
  /** Ablehnung eines Trägers, den die Gruppe nicht zulässt. */
  readonly carrier: string;
  /** Ablehnung, wenn ein Zeichen mehr Werte der Gruppe trägt als zulässig. */
  readonly limit: string;
}

/** Eine Gruppe aus Kapitel 5.8 mit Zone und Regel. */
export interface StateGroup {
  readonly id: StateGroupId;
  /** Der Abschnitt, z. B. `5.8.1`. Jeder Wert der Gruppe trägt ihn als Präfix seines Abschnitts. */
  readonly section: `5.8.${number}`;
  readonly title: string;
  /** Die Kategorie im Bausteinregister. Nur 5.8.3 ist `tendency`. */
  readonly category: 'state' | 'tendency';
  /** Zahl der Darstellungen im D.2-Inventar, Primär- und Alternativdarstellungen zusammen. */
  readonly depictions: number;
  readonly form: StateGroupFinding<StateGroupForm>;
  /** Wo der Baustein am Zeichen sitzt. */
  readonly zone: StateGroupFinding<BlockZone>;
  /** Mit welchen Trägern die Gruppe kombinierbar ist, als Bausteinkennungen. */
  readonly carriers: StateGroupFinding<readonly BlockId[]>;
  /** Wie viele Werte der Gruppe ein Zeichen zugleich tragen darf. */
  readonly perSign: StateGroupFinding<number>;
  readonly rules: StateGroupRuleIds;
  /**
   * Referenzdateien, die die Gruppe am Träger zeigen: die Beispielzeichen aus Kapitel 5.8 und seit
   * dem 29.09.2026 die Trägerbelege aus der Durchsicht aller 661 Dateien (etwa 5.8.1.13_2, M.6,
   * L.9). Leer heißt: keine.
   */
  readonly fixtures: readonly `${string}.svg`[];
}
