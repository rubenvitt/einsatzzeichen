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
 * Stand einer Aussage über eine Gruppe: belegt, empfohlen oder offen. Seit LFH-567 ein Alias von
 * `GrammarFinding`, den auch Mehrfachfähigkeiten und Sonderformen benutzen.
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
 * Die Regelkennungen einer Gruppe. Sie sind **vorgemerkt**, nicht in Kraft: `validateSpec` prüft
 * sie erst, wenn `SymbolSpec` ein Feld für Zustände bekommt (LFH-577). Bis dahin stehen sie in
 * `PLANNED_STATE_RULES` und ausdrücklich nicht im Regelkatalog.
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
  /** Beispielzeichen der Referenz, die die Gruppe am Träger zeigen. Leer heißt: keines. */
  readonly fixtures: readonly `${string}.svg`[];
}
