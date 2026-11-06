// `@einsatzzeichen/core/exact` (ESZ-149): die Bauplan-Welt. Alles rund um `SymbolSpec` und die
// freistehenden Specs, wie es bis 6.x an der Wurzel stand, dazu der Weg zwischen Beschreibung und
// Bauplan (`resolve`, `fromExact`). Für Rezepte, Prüfpaket und alle, die ein Original exakt
// nachbauen. Bis 6.x stand derselbe Inhalt auch an der Wurzel (seit 7.0 nur noch hier, ESZ-151).
export { DEFAULT_PORTS, drawSymbol } from './default-ports.js';
export * from './compose.js';
export { CompositionError, validateSpec, type ValidationIssue } from './validate.js';
export { VALIDATION_RULE_IDS } from './validation-rules.js';
export * from './not-measured.js';
export { specKey } from './spec-key.js';
export {
  SPEC_FORMAT_VERSION,
  SpecParseError,
  canonicalAnySpec,
  canonicalSpec,
  decodeAnySpecParam,
  decodeSpecParam,
  encodeAnySpecParam,
  encodeSpecParam,
  parseAnySpec,
  parseSpec,
  serializeAnySpec,
  serializeSpec,
} from './spec-codec.js';
export {
  FREESTANDING_FIELD_VALUES,
  FREESTANDING_VOCABULARY_FIELDS,
  LIST_SPEC_FIELDS,
  SPEC_FIELD_VALUES,
  VOCABULARY_FIELDS,
  checkAnySpec,
  checkSpec,
  freestandingVocabulary,
  specFieldValues,
  vocabulary,
  type FreestandingFieldValue,
  type FreestandingVocabularyField,
  type FreestandingVocabularyOption,
  type FreestandingVocabularyOptions,
  type SpecCheck,
  type SpecDraft,
  type SpecFieldDomain,
  type SpecFieldValue,
  type VocabularyField,
  type VocabularyOption,
  type VocabularyOptions,
} from './vocabulary.js';
export {
  COMPOSITION_RULE_EXPLANATIONS,
  FREESTANDING_RULE_EXPLANATIONS,
  RULE_EXPLANATIONS,
  RULE_FIELDS,
  explainIssue,
  explainRejection,
  type ExplainedIssue,
  type RuleExplanation,
  type RuleField,
} from './rules/rule-explanations.js';
export {
  FREESTANDING_DEFAULT_CANVAS_MM,
  describeFreestandingSpec,
  drawAnySpec,
  drawFreestanding,
  referenceMovementSpec,
  type FreestandingDrawOptions,
} from './draw-freestanding.js';
export { freestandingRedirect, validateFreestandingSpec } from './validate-freestanding.js';
export { FREESTANDING_RULE_IDS } from './freestanding-rules.js';
export { describeSymbolSpec } from './geometry/labels.js';
export { symbolProvenance, type SymbolProvenance } from './provenance/symbol-provenance.js';
export {
  anySpecProvenance,
  freestandingProvenance,
  type AnySpecProvenance,
  type FreestandingProvenance,
} from './provenance/freestanding-provenance.js';
export { resolve } from './sign/resolve.js';
export { fromExact } from './sign/from-exact.js';
