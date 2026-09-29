export * from './render/svg.js';
export * from './render/canvas.js';
export * from './render/raster-dimensions.js';
export * from './render/theme.js';
export * from './bounds.js';
export * from './fingerprint.js';
export * from './layout/profiles.js';
export * from './not-measured.js';
export {
  CompositionError,
  validateSpec,
  type ValidationIssue,
} from './validate.js';
export * from './compose.js';
export { VALIDATION_RULE_IDS } from './validation-rules.js';
export * from './path-commands.js';
export * from './pictogram-gate.js';
// Drei Teile der Textpolitik führen nach außen: effectiveTextPx/MINIMUM_TEXT_RENDER_PX, die
// Task 6 als Schnittstelle vorsieht (siehe Brief: "Produces"), sowie TEXT_FONT_FAMILY_ATTR — catalog
// bezieht darüber die Schriftfamilie für `resvgFontOptions()` (siehe fonts.ts), statt sie dort als
// eigenes Literal zu wiederholen. Die Abhängigkeitsrichtung ist ohnehin catalog → core (siehe
// package.json); ohne diesen Export müsste catalog das Literal duplizieren, und eine künftige
// Umbenennung könnte in den beiden Paketen auseinanderlaufen. Die übrigen Exporte von
// text-policy.ts (Baseline-/Anker-Abbildungen) bleiben bewusst intern — sie sind Renderdetail von
// svg.ts/canvas.ts, keine fremdpaketige Schnittstelle.
export {
  ARIMO_CAP_HEIGHT_FRACTION,
  effectiveTextPx,
  MINIMUM_TEXT_RENDER_PX,
  TEXT_FONT_FAMILY_ATTR,
} from './render/text-policy.js';
export * from './a11y/contrast.js';
export * from './a11y/metadata.js';
export * from './viewbox-gate.js';
export * from './text-metrics.js';
export * from './layout/zones.js';
export {
  BLOCK_CATEGORIES,
  BLOCK_CATEGORY_GAPS,
  BLOCK_ENTRIES,
  BLOCK_REGISTER,
  blockEntry,
  blockGaps,
  type BlockGapEntry,
} from './blocks/register.js';
export { STATE_GROUPS, stateGroup, stateGroupOf } from './blocks/state-groups.js';
export { ARROW_BLOCKS, LINE_BLOCKS, PARAMETRIC_BLOCKS, parametricBlock } from './blocks/parametric.js';
export {
  CAPABILITY_COMBINATION_EXCEPTIONS,
  CAPABILITY_COMBINATION_RULES,
  capabilityCombinationForm,
  capabilityCombinationRule,
} from './blocks/capability-combinations.js';
export { SPECIAL_FORMS, specialForm } from './layout/special-forms.js';
export {
  COMPOSITION_RULE_CATALOG,
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
export { PLANNED_STATE_RULES, type PlannedRule } from './rules/planned-state-rules.js';
export { PLANNED_CAPABILITY_RULES } from './rules/planned-capability-rules.js';
export { PLANNED_PARAMETRIC_RULES } from './rules/planned-parametric-rules.js';
export { specKey } from './spec-key.js';
// Geometrie der Bausteine (LFH-570): Grundzeichen, Körpermarken, Farbe, Stärke, Kopfmarken,
// Verwaltungsstufe, Funktionsfassung, Piktogramme, Beschriftung, Themes, Kontrastbefunde und die
// Arimo-Laufweiten. Vorher in `catalog`; `core` bleibt dabei ohne Node- und Fremdabhängigkeit.
export * from './geometry/base-symbols.js';
export * from './geometry/body-marks.js';
export * from './geometry/vehicle-categories.js';
export * from './geometry/organizations.js';
export * from './geometry/strengths.js';
export * from './geometry/technical-head-marks.js';
export * from './geometry/administrative-heads.js';
export * from './geometry/function-roles.js';
export * from './geometry/parametric.js';
export * from './geometry/pictograms/index.js';
export * from './geometry/render-themes.js';
export * from './geometry/labels.js';
export * from './geometry/contrast-exceptions.js';
export * from './geometry/text-metrics.js';
// Bisher nur innerhalb von `catalog` genutzt; das Prüfpaket braucht sie weiter für seine Daten
// (`deepFreeze`), die Rezepte (`MINIMUM_TEXT_CONTRAST`) und die Piktogrammtypen.
export * from './geometry/readonly-data.js';
export * from './geometry/pictograms/contrast-contract.js';
export type {
  CatalogPictogramDefinition,
  PictogramContrastPair,
  PictogramPlacement,
  PictogramSection,
} from './geometry/pictograms/catalog-definition.js';
// LFH-580: Der Einstieg von der Spec zur Zeichnung ohne Prüfpaket — die Standardbelegung der
// Ports und `drawSymbol()`, das `compose()` damit aufruft.
export { DEFAULT_PORTS, drawSymbol } from './default-ports.js';
// LFH-579: Erklärbare Ablehnung — Titel, Erklärung und kuratiertes Spec-Feld je Regel, vorher in
// der Website. `explainIssue()` verbindet sie mit dem Regelkatalog; unbekannte Kennungen werfen.
export {
  COMPOSITION_RULE_EXPLANATIONS,
  RULE_EXPLANATIONS,
  RULE_FIELDS,
  explainIssue,
  explainRejection,
  type ExplainedIssue,
  type RuleExplanation,
  type RuleField,
} from './rules/rule-explanations.js';
// LFH-581: Herkunft im Produkt — `verbatim` (nur Körperhülle belegt, `claim: 'body-hull'`) oder
// `derived`, aus einer generierten Tabelle ohne Prüfpaket. Der fachliche Reviewstand bleibt in
// conformance (`provenanceReview`, `combinationProvenance`).
export { symbolProvenance, type SymbolProvenance } from './provenance/symbol-provenance.js';
// LFH-577: Kanonische Serialisierung der SymbolSpec — JSON in der Hülle `{"v":1,"spec":{…}}`,
// strenges Lesen mit Pfad in der Fehlermeldung und die base64url-Form für URLs (liest auch die
// alten Baukasten-Links ohne Hülle). Prüft Form und Wertevorrat, nicht die Kombinationsregeln.
export {
  SPEC_FORMAT_VERSION,
  SpecParseError,
  canonicalSpec,
  decodeSpecParam,
  encodeSpecParam,
  parseSpec,
  serializeSpec,
} from './spec-codec.js';
// LFH-578: Vokabular je Stand der Spec — der Wertevorrat je Feld (`SPEC_FIELD_VALUES`), welche
// Werte zur übrigen Spec passen (`vocabulary`, probiert über `drawSymbol`) und die erklärbare
// Ablehnung einer ganzen Spec als Ergebnis statt Wurf (`checkSpec`).
export {
  LIST_SPEC_FIELDS,
  SPEC_FIELD_VALUES,
  VOCABULARY_FIELDS,
  checkSpec,
  specFieldValues,
  vocabulary,
  type SpecCheck,
  type SpecDraft,
  type SpecFieldDomain,
  type SpecFieldValue,
  type VocabularyField,
  type VocabularyOption,
  type VocabularyOptions,
} from './vocabulary.js';
