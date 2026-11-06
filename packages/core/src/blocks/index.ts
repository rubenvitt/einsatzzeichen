// `@einsatzzeichen/core/blocks` (ESZ-149): Bausteine und Geometrie — Grundzeichen, Körpermarken,
// Köpfe, Funktionsfassungen, Piktogramme, Zustände, Register und Namen. Für eigene Zeichenwege
// neben `draw`.
//
// Vor dem Sternexport aus `geometry/body-marks.js`: der benannte Export verdeckt dessen
// vermessenen `bodyMark` und leitet für jedes andere Paar ab, wie an der Wurzel.
export { bodyMark, bodyMarkRun, hasFlushRendition, type BodyMarkRun } from '../derive/body-marks.js';
export * from '../geometry/base-symbols.js';
export * from '../geometry/body-marks.js';
export { ANHANG_C_BODY_MARK_CONTEXTS } from '../geometry/body-marks-anhang-c/index.js';
export type { AnhangCContext } from '../geometry/body-marks-anhang-c/shared.js';
export * from '../geometry/vehicle-categories.js';
export * from '../geometry/organizations.js';
export * from '../geometry/strengths.js';
export * from '../geometry/technical-head-marks.js';
export * from '../geometry/administrative-heads.js';
export * from '../geometry/function-roles.js';
export * from '../geometry/parametric.js';
export * from '../geometry/pictograms/index.js';
export * from '../geometry/labels.js';
export { UNIT_GROUPING_HEADS, unitGroupingHead } from '../geometry/unit-groupings.js';
export { SPECIAL_FORM_IDS_DRAWN, specialFormDrawing } from '../geometry/special-form-bodies.js';
export { pictogramDrawing } from '../geometry/standalone-pictogram.js';
export {
  WEATHER_CLOUD_PRECIPITATION,
  WEATHER_PRECIPITATIONS,
  classifyWeather,
  weatherDrawing,
  type WeatherCloudPrecipitationRules,
  type WeatherInvalidReason,
  type WeatherPrecipitationId,
  type WeatherVerdict,
} from '../geometry/weather.js';
export { animalStateDrawing } from '../geometry/animal-state.js';
export { administrativeHeadOrDerived, unitGroupingHeadOrDerived } from '../derive/head-zone.js';
export {
  BLOCK_CATEGORIES,
  BLOCK_CATEGORY_GAPS,
  BLOCK_ENTRIES,
  BLOCK_REGISTER,
  blockEntry,
  blockGaps,
  type BlockGapEntry,
} from './register.js';
export { STATE_GROUPS, stateCarriersOf, stateGroup, stateGroupOf } from './state-groups.js';
export { ARROW_BLOCKS, LINE_BLOCKS, PARAMETRIC_BLOCKS, parametricBlock } from './parametric.js';
export {
  placeStates,
  type PlacedStateCarrier,
  type PlacedStatePart,
  type StateCarrierInput,
  type StatePlacement,
  type StatePlacementBasis,
  type StatePlacementInput,
  type StateTendencyId,
} from '../layout/state-placement.js';
export { DRONE_BODY_MARKS, SPECIAL_FORMS, specialForm } from '../layout/special-forms.js';
export { PLACES, drawPlace, type PlaceEntry, type PlaceSource } from '../places.js';

// ── Seit 7.0 (ESZ-151) nur noch hier: Geometrie, Layout und Text, die bis 6.x an der Wurzel standen ──
export { boundsOfMm, shiftY, strokeBoundsOfMm, type BoundsMm } from '../bounds.js';
export { bodyBoundsMeasured, bodyBoundsMm } from '../derive/body-bounds.js';
export { CIRCLE_VARIANT_PAIRS, LARGE_CENTER_CAP_HEIGHT_MM, circleTopLeftInk } from '../derive/circle.js';
export { noteDerivation } from '../derive/record.js';
export * from '../layout/profiles.js';
export * from '../layout/zones.js';
export {
  PERSON_STATE_CORNERS_MM,
  PERSON_STATE_FRAMES,
  STATE_HINT_LAYOUTS,
  type PersonStateCorner,
  type PersonStateFrame,
  type StateCarrierFrameId,
  type StateHintId,
  type StateHintLayout,
} from '../layout/state-frames.js';
export * from '../path-commands.js';
export { formatUnits } from '../render/format.js';
export { SURFACE_MARK_ROLES, colorFor, contrastSurface, paintColor } from '../render/theme.js';
export { ORGANIZATION_BODY_DASHES } from '../geometry/render-themes.js';
export { effectiveStrokeWidthMm, strokeWidthFloorMm } from '../render/min-stroke-width.js';
export {
  CATALOG_TEXT_FONT_WEIGHT,
  MINIMUM_TEXT_RENDER_PX,
  TEXT_CAP_HEIGHT_FRACTION,
  effectiveTextPx,
  textSizeForCapHeightMm,
} from '../render/text-policy.js';
export * from '../geometry/text-metrics.js';
export {
  measureTextRun,
  textWidthMm,
  type TextMetrics,
  type TextRunMeasure,
  type TextWidth,
} from '../text-metrics.js';
export * from '../geometry/readonly-data.js';
export type {
  CatalogPictogramDefinition,
  LegacyPictogramDefinition,
  PictogramContrastPair,
  PictogramPlacement,
  PictogramSection,
  RegisteredPictogramDefinition,
} from '../geometry/pictograms/catalog-definition.js';
export {
  CAPABILITY_COMBINATION_EXCEPTIONS,
  CAPABILITY_COMBINATION_RULES,
  capabilityCombinationForm,
  capabilityCombinationRule,
} from './capability-combinations.js';
export {
  CAPABILITY_INSET_FORMS,
  CAPABILITY_INSET_RULE,
  CAPABILITY_UNSCALED_FIT,
  capabilityInsetForm,
  type CapabilityUnscaledFit,
} from './capability-inset.js';
