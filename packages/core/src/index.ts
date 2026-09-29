export * from './render/svg.js';
export * from './render/canvas.js';
export * from './render/raster-dimensions.js';
export * from './render/min-stroke-width.js';
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
// Vier Teile der Textpolitik führen nach außen: effectiveTextPx/MINIMUM_TEXT_RENDER_PX, die
// Task 6 als Schnittstelle vorsieht (siehe Brief: "Produces"), CATALOG_TEXT_FONT_WEIGHT (das
// Gewicht allen Katalogtexts, gegen das conformance prüft) sowie TEXT_FONT_FAMILY_ATTR — catalog
// bezieht darüber die Schriftfamilie für `resvgFontOptions()` (siehe fonts.ts), statt sie dort als
// eigenes Literal zu wiederholen. Die Abhängigkeitsrichtung ist ohnehin catalog → core (siehe
// package.json); ohne diesen Export müsste catalog das Literal duplizieren, und eine künftige
// Umbenennung könnte in den beiden Paketen auseinanderlaufen. Die übrigen Exporte von
// text-policy.ts (Baseline-/Anker-Abbildungen) bleiben bewusst intern — sie sind Renderdetail von
// svg.ts/canvas.ts, keine fremdpaketige Schnittstelle.
export {
  ARIMO_CAP_HEIGHT_FRACTION,
  CATALOG_TEXT_FONT_WEIGHT,
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
export {
  CAPABILITY_INSET_FORMS,
  CAPABILITY_INSET_RULE,
  CAPABILITY_UNSCALED_FIT,
  capabilityInsetForm,
  type CapabilityUnscaledFit,
} from './blocks/capability-inset.js';
export {
  CAPABILITY_INSET_FLUSH_TOLERANCE_MM,
  CAPABILITY_INSET_REDUCED_UNIFORMITY_LIMIT,
  measureCapabilityInset,
  type CapabilityInsetMeasurement,
} from './blocks/capability-inset-measure.js';
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
// Die Anhang-C-Körperfassungen mit ihrem Kontext (LFH-786), damit Prüfungen jede Fassung an
// ihrem eigenen Körper zeichnen können. Nur lesend; `bodyMark()` bleibt der einzige Zeichenweg.
export {
  ANHANG_C_BODY_MARK_CONTEXTS,
} from './geometry/body-marks-anhang-c/index.js';
export type { AnhangCContext } from './geometry/body-marks-anhang-c/shared.js';
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
// LFH-577 (Integration, Zeichen mit Körper): die Bausteine hinter den neuen Spec-Feldern
// `unitGrouping`, `states` und `tendency`. `placeStates()` legt Zustände an einen Träger und
// wirft `NotMeasuredError`, wo die Referenz keine Lage zeigt; die Lagen selbst stehen als Daten
// daneben. `stateCarriersOf()` ist der Inhalt der Regel `state-carrier-not-allowed`. Dazu die
// Verbandsköpfe (Port `unitGroupingHead`) und die gezeichneten Sonderformen 3.6–3.9. Der Vorschlag
// für Verband III (`UNIT_GROUPING_III_PROPOSAL_CX_MM`) bleibt bewusst intern: er ist nicht
// vermessen und keine Zusage.
export {
  placeStates,
  type PlacedStateCarrier,
  type PlacedStatePart,
  type StateCarrierInput,
  type StatePlacement,
  type StatePlacementBasis,
  type StatePlacementInput,
  type StateTendencyId,
} from './layout/state-placement.js';
export {
  PERSON_STATE_CORNERS_MM,
  PERSON_STATE_FRAMES,
  STATE_HINT_LAYOUTS,
  type PersonStateCorner,
  type PersonStateFrame,
  type StateCarrierFrameId,
  type StateHintId,
  type StateHintLayout,
} from './layout/state-frames.js';
export { stateCarriersOf } from './blocks/state-groups.js';
export { UNIT_GROUPING_HEADS, unitGroupingHead } from './geometry/unit-groupings.js';
export { SPECIAL_FORM_IDS_DRAWN, specialFormDrawing } from './geometry/special-form-bodies.js';
// LFH-577 (Integration, freistehende Zeichen): Pfeile 5.2, Linien und Grenzen 2.14–2.20, Wetter
// 5.8.7 und Tierzustand 5.8.6 als eigene Spec-Art neben `SymbolSpec` (`FreestandingSpec` im
// Schema). `drawFreestanding()` zeichnet sie, `drawAnySpec()` ist der gemeinsame Einstieg für beide
// Arten. Geprüft wird mit eigenen Regelkennungen (`validateFreestandingSpec`, eigener Katalog und
// eigene Erklärungen, über `explainIssue` erklärbar); der Codec schreibt sie in dieselbe Hülle
// unter den Schlüssel `freestanding`. Die Zeichenfunktionen für Wetter und Tierzustand und die
// Wetterregeln als Datum stehen daneben (`movementDrawing` und `lineDrawing` sind schon exportiert).
export {
  FREESTANDING_DEFAULT_CANVAS_MM,
  describeFreestandingSpec,
  drawAnySpec,
  drawFreestanding,
  type FreestandingDrawOptions,
} from './draw-freestanding.js';
export { validateFreestandingSpec } from './validate-freestanding.js';
export { FREESTANDING_RULE_IDS } from './freestanding-rules.js';
export { FREESTANDING_RULE_CATALOG } from './rules/rule-catalog.js';
export { FREESTANDING_RULE_EXPLANATIONS } from './rules/rule-explanations.js';
export { RETIRED_PARAMETRIC_RULES } from './rules/planned-parametric-rules.js';
export { RETIRED_STATE_RULES, type RetiredRule } from './rules/planned-state-rules.js';
export {
  canonicalAnySpec,
  decodeAnySpecParam,
  encodeAnySpecParam,
  parseAnySpec,
  serializeAnySpec,
} from './spec-codec.js';
export { FREESTANDING_FIELD_VALUES, checkAnySpec } from './vocabulary.js';
export {
  WEATHER_CLOUD_PRECIPITATION,
  WEATHER_PRECIPITATIONS,
  classifyWeather,
  weatherDrawing,
  type WeatherCloudPrecipitationRules,
  type WeatherInvalidReason,
  type WeatherPrecipitationId,
  type WeatherVerdict,
} from './geometry/weather.js';
export { animalStateDrawing } from './geometry/animal-state.js';
