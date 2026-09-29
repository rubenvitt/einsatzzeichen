import type { RuleDimension, RuleKind } from './rule-catalog.js';

/**
 * Vorgemerkte Regeln für Kapitel 5.8 (LFH-565) — Kennung und Inhalt stehen fest, geprüft wird noch
 * nichts.
 *
 * **Warum sie nicht im Regelkatalog stehen.** `RULE_CATALOG` ist mengengleich mit
 * `VALIDATION_RULE_IDS`, und diese Liste enthält genau die Kennungen, die `validate.ts` auslöst
 * (Quelltextscan in `validation-rules.test.ts`, Laufzeitbeleg in `conformance/src/rule-evidence.ts`:
 * „Regel belegt = ein Testfall löst sie aus"). Eine Regel, die keine Spec auslösen kann, bräche
 * diese Kernaussage.
 *
 * **Stand seit LFH-577.** `SymbolSpec` trägt `states` und `tendency`. Zwei der vier vorgemerkten
 * Regeln sind in den Katalog gewandert und prüfen seitdem (`state-carrier-not-allowed`,
 * `state-group-limit-exceeded`, dazu die neuen `state-tactics-not-allowed` und
 * `state-value-not-attachable`). Übrig bleibt `tendency-carrier-not-allowed`: kein Original zeigt
 * eine Tendenz an einem Träger, und der Eigentümer hat keinen entschieden (`stateCarriersOf` gibt
 * für alle drei Tendenzen `undefined`). Eine Trägerregel hätte also nichts, wogegen sie prüft;
 * jede Tendenz meldet die Komposition stattdessen als nicht vermessen (`placeStates`, Empfehlung
 * der Vorlage `docs/decisions/2026-09-28-lfh-565-kapitel-5-8-bausteine.md` §9 Frage 1). Die Regel
 * tritt in Kraft, sobald ein Träger belegt oder entschieden ist.
 *
 * `tendency-limit-exceeded` ist gestrichen, nicht vorgemerkt (`RETIRED_STATE_RULES`): `tendency`
 * ist ein Einzelfeld, `parseSpec` lehnt eine Liste mit Pfad ab, und eine zweite Tendenz lässt sich
 * gar nicht beschreiben. Die Grenze erzwingt die Form, keine Regel.
 *
 * Die Regeln sind **je Dimension** gefasst und nicht je Gruppe: welche Träger und wie viele Werte
 * eine Gruppe zulässt, steht als Datum in `STATE_GROUPS` (`core/src/blocks/state-groups.ts`). Das
 * ist dasselbe Muster wie bei `strength-requires-unit`, das eine Regel für alle Stärken ist.
 *
 * `planned-state-rules.test.ts` erzwingt, dass eine Kennung hier verschwindet, sobald sie in den
 * Katalog wandert, und nicht an beiden Stellen steht.
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
    'tendency-carrier-not-allowed',
    'tendency',
    'Eine Tendenz gehört nur an die Träger, die die Gruppe 5.8.3 zulässt; solange kein Träger belegt oder entschieden ist, meldet die Komposition jede Tendenz als nicht vermessen.',
  ),
]);

/** Eine Regelkennung, die nie in Kraft tritt, mit dem Grund. */
export interface RetiredRule {
  readonly id: string;
  readonly dimension: RuleDimension;
  readonly reason: string;
  /** Das Ticket, mit dem sie gestrichen wurde. */
  readonly ticket: string;
}

/**
 * Gestrichene Kennungen aus Kapitel 5.8. Sie stehen noch in `STATE_GROUPS` (`rules.limit` der
 * Tendenzgruppe), weil der Typ `StateGroupRuleIds` je Gruppe eine Grenzregel verlangt; hier steht,
 * warum es sie nicht gibt.
 */
export const RETIRED_STATE_RULES: readonly RetiredRule[] = Object.freeze([
  Object.freeze({
    id: 'tendency-limit-exceeded',
    dimension: 'tendency',
    reason:
      '`SymbolSpec.tendency` ist ein Einzelfeld: `parseSpec` lehnt eine Liste mit Pfad ab, und eine zweite Tendenz lässt sich nicht beschreiben. Die Grenze „höchstens eine" erzwingt die Form.',
    ticket: 'LFH-577',
  } satisfies RetiredRule),
]);
