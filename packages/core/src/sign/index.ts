// ESZ-149: die Beschreibungsebene. `Sign` sagt, was gemeint ist; `resolve` macht daraus den
// Bauplan (`SymbolSpec`), `draw` zeichnet immer, `check` prüft streng, `choices` nennt passende
// Werte mit Namen. Entscheidung: docs/decisions/2026-11-06-esz-149-beschreibung-und-bauplan.md
export { draw, drawingOf, type DrawOptions, type Drawn, type Fidelity, type Omission } from './draw.js';
export { check, type SignCheck, type SignIssue } from './check.js';
export { choices, SIGN_CHOICE_FIELDS, type Choice, type ChoicesOptions, type SignDraft } from './choices.js';
export { describe, type SignDescription } from './describe.js';
export {
  SIGN_FORMAT_VERSION,
  canonicalSign,
  decodeSignParam,
  encodeSignParam,
  parse,
  serialize,
} from './codec.js';
export { resolve } from './resolve.js';
export { fromExact } from './from-exact.js';
export { KIND_FAMILIES, kindFamilyOf, type KindFamily, type KindFamilyId } from './families.js';
export {
  COLOR_LABELS,
  FREESTANDING_KIND_LABELS,
  HEAD_GROUP_LABELS,
  SIGN_HEAD_VALUES,
  headGroupOf,
  type SignHeadGroup,
} from './labels.js';
// Die Typen der Beschreibung stehen in `schema`; hier noch einmal, damit ein Import reicht.
export type {
  BodySign,
  Sign,
  SignCenterSize,
  SignChoiceField,
  SignExact,
  SignHead,
  SignText,
  SignTextZone,
} from '@einsatzzeichen/schema';
