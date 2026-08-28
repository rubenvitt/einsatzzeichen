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
  'above-left-label-requires-measured-body',
  'above-left-metrics-complete',
  'above-left-metrics-within-viewbox',
  'administrative-level-not-measured',
  'below-right-label-requires-measured-body',
  'below-right-label-requires-organization',
  'body-variant-foot-conflict',
  'body-variant-requires-measured-kind',
  'bottom-center-label-requires-measured-body',
  'bottom-right-metrics-complete',
  'bottom-right-metrics-require-bottom-right-label',
  'bottom-right-metrics-require-measured-body',
  'bottom-right-metrics-within-body',
  'center-anchor-override-requires-measured-trailer',
  'center-baseline-not-measured',
  'center-baseline-override-requires-measured-body',
  'center-baseline-positive',
  'center-baseline-requires-center-label',
  'center-box-margin-non-negative',
  'center-box-margin-override-requires-measured-body',
  'center-box-margin-requires-center-label',
  'center-box-margin-within-body',
  'center-cap-height-positive',
  'center-cap-height-requires-center-label',
  'center-label-within-body',
  'chassis-foot-conflict',
  'circle-12-requires-hilfsorganisation',
  'circle-12-requires-organization',
  'circle-top-left-anchor-within-viewbox',
  'circle-top-left-baseline-within-viewbox',
  'circle-top-left-requires-metrics',
  'colored-circle-top-left-not-measured',
  'designation-not-blank',
  'foot-band-head-requires-measured-strength',
  'function-role-body-mark-mismatch',
  'function-role-body-variant-not-measured',
  'function-role-capabilities-not-measured',
  'function-role-head-mismatch',
  'function-role-label-metrics-required',
  'function-role-organization-mismatch',
  'function-role-requires-measured-kind',
  'function-role-requires-measured-layout',
  'head-zone-conflict',
  'in-body-ink-requires-in-body-label',
  'inset-hull-fire-fighting-requires-no-labels',
  'inset-hull-requires-center-label-only',
  'inset-hull-requires-measured-body-mark',
  'inset-hull-requires-measured-organization',
  'label-not-blank',
  'plain-wheel-pair-chassis-conflict',
  'reduced-house-requires-hilfsorganisation',
  'strength-requires-unit',
  'surface-label-foot-conflict',
  'surface-label-requires-measured-body',
  'surface-left-label-requires-measured-anchor',
  'surface-right-label-requires-measured-anchor',
  'technical-fill-organization-conflict',
  'technical-fill-token-invalid',
  'technical-head-mark-not-measured',
  'technical-head-mark-requires-normal-formation',
  'top-left-anchor-within-body',
  'top-left-baseline-within-body',
  'top-left-cap-height-positive',
  'top-left-label-requires-measured-body',
  'top-left-lines-exactly-two',
  'top-left-lines-require-measured-body',
  'top-left-metrics-complete',
  'top-left-metrics-require-measured-vehicle-land',
  'top-left-metrics-require-top-left-label',
  'top-left-metrics-required-by-profile',
  'top-left-metrics-within-body',
  'vehicle-category-requires-vehicle',
]);
