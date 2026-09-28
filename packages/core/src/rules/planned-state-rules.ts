import type { RuleDimension, RuleKind } from './rule-catalog.js';

/**
 * Vorgemerkte Regeln für Kapitel 5.8 (LFH-565) — Kennung und Inhalt stehen fest, geprüft wird noch
 * nichts.
 *
 * **Warum sie nicht im Regelkatalog stehen.** `RULE_CATALOG` ist mengengleich mit
 * `VALIDATION_RULE_IDS`, und diese Liste enthält genau die Kennungen, die `validate.ts` auslöst
 * (Quelltextscan in `validation-rules.test.ts`, Laufzeitbeleg in `conformance/src/rule-evidence.ts`).
 * Eine Regel für Zustände kann `validateSpec` erst prüfen, wenn `SymbolSpec` ein Feld für sie hat —
 * das ist LFH-577. Stünden die Kennungen schon im Katalog, bräche dessen Kernaussage „der Katalog
 * enthält, was der Motor prüft".
 *
 * Die Regeln sind **je Dimension** gefasst und nicht je Gruppe: welche Träger und wie viele Werte
 * eine Gruppe zulässt, steht als Datum in `STATE_GROUPS` (`core/src/blocks/state-groups.ts`). Das
 * ist dasselbe Muster wie bei `strength-requires-unit`, das eine Regel für alle Stärken ist.
 *
 * Mit LFH-577 wandern die Einträge in `RULE_CATALOG`; `planned-state-rules.test.ts` erzwingt, dass
 * eine Kennung dann hier verschwindet und nicht an beiden Stellen steht.
 */
export interface PlannedRule {
  readonly id: string;
  readonly kind: RuleKind;
  readonly dimension: RuleDimension;
  /** Warum es die Regel geben soll, in einem Satz. */
  readonly reason: string;
  /** Das Ticket, mit dem die Regel in Kraft tritt. */
  readonly ticket: string;
}

function planned(id: string, dimension: RuleDimension, reason: string): PlannedRule {
  return Object.freeze({ id, kind: 'systematik', dimension, reason, ticket: 'LFH-577' });
}

export const PLANNED_STATE_RULES: readonly PlannedRule[] = Object.freeze([
  planned(
    'state-carrier-not-allowed',
    'state',
    'Ein Zustand gehört nur an die Träger, die seine Gruppe zulässt; an jedem anderen Grundzeichen hätte er keine belegte Lage und keine belegte Bedeutung.',
  ),
  planned(
    'state-group-limit-exceeded',
    'state',
    'Ein Zeichen trägt aus einer Zustandsgruppe höchstens so viele Werte, wie die Gruppe zulässt; zwei Stufen derselben Skala widersprechen sich.',
  ),
  planned(
    'tendency-carrier-not-allowed',
    'tendency',
    'Eine Tendenz gehört nur an die Träger, die die Gruppe 5.8.3 zulässt.',
  ),
  planned(
    'tendency-limit-exceeded',
    'tendency',
    'Ein Zeichen trägt höchstens so viele Tendenzen, wie die Gruppe 5.8.3 zulässt; steigend, unverändert und fallend schließen einander aus.',
  ),
]);
