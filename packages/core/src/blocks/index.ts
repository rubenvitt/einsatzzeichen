// `@einsatzzeichen/core/blocks` (ESZ-149): Bausteine und Geometrie — Grundzeichen, Körpermarken,
// Köpfe, Funktionsfassungen, Piktogramme, Zustände, Register und Namen. Für eigene Zeichenwege
// neben `draw`. Bis 7.0 steht derselbe Inhalt weiter auch an der Wurzel.
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
