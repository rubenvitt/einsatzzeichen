import type { PlannedRule, RetiredRule } from './planned-state-rules.js';
import type { RuleDimension } from './rule-catalog.js';

/**
 * Vorgemerkte Regeln für die parametrisierten Bausteine aus 5.2 und Kapitel 2 (LFH-566). Kennung
 * und Inhalt stehen fest, geprüft wird noch nichts. Aus demselben Grund wie bei
 * `PLANNED_STATE_RULES` stehen die Kennungen nicht im Regelkatalog: eine Regel, die keine Spec
 * auslösen kann, bräche dessen Kernaussage „jede Regel hat eine Prüfstelle".
 *
 * **Stand seit LFH-577.** Pfeile und Linien beschreibt die freistehende Spec-Art
 * (`FreestandingSpec`, Entscheidung des Eigentümers vom 29.09.2026). Von den vier vorgemerkten
 * Regeln ist `line-strength-mismatch` in Kraft (`FREESTANDING_RULE_CATALOG`, geprüft von
 * `validateFreestandingSpec`); `line-anchor-not-allowed` ist gestrichen (`RETIRED_PARAMETRIC_RULES`).
 *
 * Vorgemerkt bleiben die beiden Regeln über die **Anbindung eines Pfeils an einen Körper**. Die
 * freistehende Spec-Art hat dafür kein Feld: eine Anbindung gibt es nur, wo ein Original sie
 * belegt, und das ist allein die Personenraute in 5.8.8.12 bis 5.8.8.14, wo der Pfeil zum
 * Personenzustand gehört (`states` an `person`, Verlauf aus `anchoredMovementPath`). Keine Spec
 * kann die Regeln also auslösen. Sie treten in Kraft, sobald ein Original oder eine Entscheidung
 * einen Pfeil an einem weiteren Körper zeigt und die Spec dafür ein Feld bekommt.
 */
function planned(id: string, dimension: RuleDimension, reason: string): PlannedRule {
  return Object.freeze({ id, kind: 'systematik', dimension, reason, ticket: 'LFH-577' });
}

export const PLANNED_PARAMETRIC_RULES: readonly PlannedRule[] = Object.freeze([
  planned(
    'movement-carrier-not-allowed',
    'movement',
    'Ein Pfeil aus 5.2 beginnt nur an den Grundzeichen, die sein Baustein zulässt; an jedem anderen hätte die Anbindung keine belegte Lage.',
  ),
  planned(
    'movement-anchor-conflict',
    'movement',
    'Ein Pfeil bindet nicht an einer Körperkante an, die schon eine Zustands- oder Tendenzrandlage trägt; zwei Bausteine an derselben Stelle sind eine Zonenkollision.',
  ),
]);

/**
 * Gestrichene Kennungen aus 5.2 und Kapitel 2, wie `RETIRED_STATE_RULES` für Kapitel 5.8: hier
 * steht, warum es sie nicht gibt.
 */
export const RETIRED_PARAMETRIC_RULES: readonly RetiredRule[] = Object.freeze([
  Object.freeze({
    id: 'line-anchor-not-allowed',
    dimension: 'lines-and-boundaries',
    reason:
      '`LineSpec` hat kein Feld für eine Anbindung: `parseAnySpec` lehnt ein Feld `anchor` an einer Linie mit Pfad ab, und eine angebundene Linie lässt sich nicht beschreiben. Dass Linien frei auf der Lagekarte liegen, erzwingt die Form.',
    ticket: 'LFH-577',
  } satisfies RetiredRule),
]);
