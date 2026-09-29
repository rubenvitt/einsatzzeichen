/**
 * Klartext zu jeder Regel, die `validateSpec()` melden oder die Komposition werfen kann.
 *
 * Seit LFH-579 gehören die Regeltexte zur API, nicht zur Website: Titel, Erklärung und das
 * kuratierte Spec-Feld stehen in `@einsatzzeichen/core` (`src/rules/rule-explanations.ts`), und
 * die Website ist einer ihrer Konsumenten. Diese Datei hält nur die bisherigen Namen, damit der
 * Builder und die Symbolseiten ihre Importe behalten. Der Builder und der Abschnitt „Zulässige
 * Kombinationen“ zeigen weiter nicht nur die Meldung, sondern auch, was die Regel verlangt,
 * worauf sie sich stützt und was sich an der Spec ändern lässt.
 *
 * `explainIssue()` liefert seitdem zusätzlich die Katalogdaten der Regel (Art, Dimension, Phase,
 * Begründung, Quelle); die bisherigen Felder sind unverändert.
 */
export {
  COMPOSITION_RULE_EXPLANATIONS,
  RULE_EXPLANATIONS,
  RULE_FIELDS,
  explainIssue,
  type ExplainedIssue,
  type RuleExplanation,
  type RuleField,
} from '@einsatzzeichen/core';

/**
 * Kennung einer Regel mit Erklärung. Vorher der Literaltyp der Tabellenschlüssel; der Kern führt
 * die Tabellen bewusst ohne Literaltyp (sonst stünde jeder Satz ein zweites Mal in seiner
 * `.d.ts`), deshalb hier nur noch `string`. Genutzt wird der Name derzeit nirgends.
 */
export type RuleId = string;
