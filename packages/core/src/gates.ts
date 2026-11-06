// `@einsatzzeichen/core/gates` (ESZ-151): Prüfwerkzeug. Regelkataloge (auch geplante und
// zurückgezogene Regeln), die Gates für ViewBox, Piktogramme und Textlaufweiten, Kontrast und
// Barrierefreiheit, Messung und Toleranzen der Fähigkeitsbox und der Formvergleich (Fingerprint).
// Das Prüfpaket `@einsatzzeichen/conformance` und eigene Prüfungen bauen darauf auf; zum Zeichnen
// braucht man nichts davon. Bis 6.x stand es an der Wurzel.
//
// Es bleibt in `core`, weil `explainIssue` (core/exact) den Regelkatalog liest und `conformance`
// Node braucht (Schriftdateien, Dateisystem); ein Browser soll die Gates ohne Node laden können.
export * from './a11y/contrast.js';
export * from './a11y/metadata.js';
export * from './fingerprint.js';
export * from './pictogram-gate.js';
export * from './viewbox-gate.js';
export {
  BOX_TOLERANCE_MM,
  checkTextMetrics,
  textRunIssues,
  type TextMetricsIssue,
  type TextMetricsRule,
} from './text-metrics.js';
export * from './geometry/contrast-exceptions.js';
export * from './geometry/pictograms/contrast-contract.js';
export {
  CAPABILITY_INSET_FLUSH_TOLERANCE_MM,
  CAPABILITY_INSET_REDUCED_UNIFORMITY_LIMIT,
  measureCapabilityInset,
  type CapabilityInsetMeasurement,
} from './blocks/capability-inset-measure.js';
export {
  COMPOSITION_RULE_CATALOG,
  FREESTANDING_RULE_CATALOG,
  RULE_CATALOG,
  RULE_DIMENSIONS,
  RULE_DIMENSION_GAPS,
  ruleCatalogEntry,
  type RuleCatalogEntry,
  type RuleDimension,
  type RuleDimensionCoverage,
  type RuleDimensionGap,
  type RuleKind,
  type RulePhase,
  type RuleReasonSource,
} from './rules/rule-catalog.js';
export { PLANNED_STATE_RULES, RETIRED_STATE_RULES, type PlannedRule, type RetiredRule } from './rules/planned-state-rules.js';
export { PLANNED_CAPABILITY_RULES } from './rules/planned-capability-rules.js';
export { PLANNED_PARAMETRIC_RULES, RETIRED_PARAMETRIC_RULES } from './rules/planned-parametric-rules.js';
