/**
 * Alle Regelkennungen, die `validateSpec` in `ValidationIssue.rule` ausgeben kann — in
 * alphabetischer Reihenfolge, nicht in Prüfreihenfolge.
 *
 * **Warum eine zweite Liste neben `validate.ts`.** Die Kennungen stehen dort als
 * Inline-Literale an ihrer Prüfung (`rule: '…'`), und das ist richtig so: die Regel und ihr
 * Name gehören zusammen. Was fehlte, war eine **zählbare** Menge — die Regelabdeckung
 * (LFH-413) soll sagen können „n Regeln, jede mit Testfall", und das geht nur gegen eine Liste.
 * `validate.ts` selbst um einen Export zu erweitern gehört einem anderen Slice; dieses Modul
 * bleibt deshalb eine reine Datenliste ohne Import aus `validate.ts`.
 *
 * Die Liste ist in beide Richtungen gegatet (`validation-rules.test.ts`): sie enthält jede
 * Kennung aus dem Quelltext von `validate.ts` und keine, die dort nicht steht. Dazu erzwingt
 * derselbe Test, dass jede Kennung in einem Testfall (`validate.test.ts` oder
 * `validation-rules.cases.test.ts`) vorkommt. Erst dadurch ist die Aussage „Testfall je Regel"
 * eine Eigenschaft des Pakets und keine Behauptung des Katalogs.
 */
export const VALIDATION_RULE_IDS: readonly string[] = Object.freeze([
  'above-left-label-head-conflict',
  'above-left-metrics-complete',
  'above-left-metrics-within-viewbox',
  'below-body-zone-conflict',
  'body-mark-rendition-not-measured',
  'body-variant-foot-conflict',
  'body-variant-requires-measured-kind',
  'bottom-right-metrics-complete',
  'bottom-right-metrics-require-bottom-right-label',
  'bottom-right-metrics-within-body',
  'center-anchor-override-requires-measured-trailer',
  'center-baseline-positive',
  'center-baseline-requires-center-label',
  'center-box-margin-non-negative',
  'center-box-margin-requires-center-label',
  'center-box-margin-within-body',
  'center-cap-height-positive',
  'center-cap-height-requires-center-label',
  'center-label-within-body',
  'chassis-foot-conflict',
  'circle-top-left-anchor-within-viewbox',
  'circle-top-left-baseline-within-viewbox',
  'designation-not-blank',
  'function-role-head-mismatch',
  'function-role-label-metrics-required',
  'function-role-organization-mismatch',
  'function-role-requires-measured-kind',
  'function-role-requires-measured-layout',
  'head-zone-conflict',
  'in-body-ink-requires-in-body-label',
  'inset-hull-requires-center-label-only',
  'label-not-blank',
  'plain-wheel-pair-chassis-conflict',
  'state-carrier-not-allowed',
  'state-group-limit-exceeded',
  'state-tactics-not-allowed',
  'state-value-not-attachable',
  'strength-requires-unit',
  'surface-label-foot-conflict',
  'technical-fill-organization-conflict',
  'technical-fill-token-invalid',
  'technical-head-mark-not-measured',
  'top-left-anchor-within-body',
  'top-left-baseline-within-body',
  'top-left-cap-height-positive',
  'top-left-lines-exactly-two',
  'top-left-metrics-complete',
  'top-left-metrics-require-top-left-label',
  'top-left-metrics-within-body',
  'vehicle-category-requires-vehicle',
]);
