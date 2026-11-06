import type {
  AdminLevelId,
  CapabilityId,
  FreestandingKind,
  SignHead,
  StateId,
  StrengthId,
  TechnicalFillToken,
  TechnicalHeadMarkId,
  UnitGroupingId,
} from '@einsatzzeichen/schema';
import {
  ADMIN_LEVEL_IDS,
  STRENGTH_IDS,
  TECHNICAL_HEAD_MARK_IDS,
  UNIT_GROUPING_IDS,
} from '@einsatzzeichen/schema';
import { stateGroup, stateValueGroup } from '../blocks/state-groups.js';
import {
  ADMIN_LEVEL_LABELS,
  STRENGTH_LABELS,
  TECHNICAL_HEAD_MARK_LABELS,
  UNIT_GROUPING_LABELS,
} from '../geometry/labels.js';
import { pictogram } from '../geometry/pictograms/index.js';

/**
 * Deutsche Namen der Farben ohne Organisation (`BodySign.color`, im Bauplan `technicalFill`).
 * Die Tokens selbst sind Bezeichner (`weiss`, `gruen`) und gehören in keine Auswahlliste.
 */
export const COLOR_LABELS: Readonly<Record<TechnicalFillToken, string>> = Object.freeze({
  schwarz: 'Schwarz',
  weiss: 'Weiß',
  rot: 'Rot',
  blau: 'Blau',
  gelb: 'Gelb',
  gruen: 'Grün',
  hellgruen: 'Hellgrün',
  orange: 'Orange',
  braun: 'Braun',
  grau: 'Grau',
  hellgrau: 'Hellgrau',
  hellblau: 'Hellblau',
});

/** Namen der freistehenden Arten für eine Auswahl neben den Grundzeichenarten. */
export const FREESTANDING_KIND_LABELS: Readonly<Record<FreestandingKind, string>> = Object.freeze({
  movement: 'Bewegung (Pfeil)',
  line: 'Linie oder Grenze',
  weather: 'Wetter',
  'animal-state': 'Tierzustand',
  state: 'Zustand',
  pictogram: 'Piktogramm',
});

/** Die vier Arten einer Kopfangabe, nach der Liste, aus der der Wert stammt. */
export type SignHeadGroup = 'strength' | 'unit-grouping' | 'administrative-level' | 'technical-head-mark';

export const HEAD_GROUP_LABELS: Readonly<Record<SignHeadGroup, string>> = Object.freeze({
  strength: 'Stärke',
  'unit-grouping': 'Verband',
  'administrative-level': 'Verwaltungsstufe',
  'technical-head-mark': 'Technische Kopfmarke',
});

const STRENGTH_SET: ReadonlySet<string> = new Set(STRENGTH_IDS);
const UNIT_GROUPING_SET: ReadonlySet<string> = new Set(UNIT_GROUPING_IDS);
const ADMIN_LEVEL_SET: ReadonlySet<string> = new Set(ADMIN_LEVEL_IDS);
const TECHNICAL_HEAD_MARK_SET: ReadonlySet<string> = new Set(TECHNICAL_HEAD_MARK_IDS);

/** Alle Kopfwerte in Auswahlreihenfolge: Stärke, Verband, Verwaltungsstufe, technische Kopfmarke. */
export const SIGN_HEAD_VALUES: readonly SignHead[] = Object.freeze([
  ...STRENGTH_IDS,
  ...UNIT_GROUPING_IDS,
  ...ADMIN_LEVEL_IDS,
  ...TECHNICAL_HEAD_MARK_IDS,
]);

/** Aus welcher Liste ein Kopfwert stammt; `undefined` für einen unbekannten Wert. */
export function headGroupOf(value: string): SignHeadGroup | undefined {
  if (STRENGTH_SET.has(value)) return 'strength';
  if (UNIT_GROUPING_SET.has(value)) return 'unit-grouping';
  if (ADMIN_LEVEL_SET.has(value)) return 'administrative-level';
  if (TECHNICAL_HEAD_MARK_SET.has(value)) return 'technical-head-mark';
  return undefined;
}

export function headLabel(value: SignHead): string {
  switch (headGroupOf(value)) {
    case 'strength':
      return STRENGTH_LABELS[value as StrengthId];
    case 'unit-grouping':
      return UNIT_GROUPING_LABELS[value as UnitGroupingId];
    case 'administrative-level':
      return ADMIN_LEVEL_LABELS[value as AdminLevelId];
    case 'technical-head-mark':
      return TECHNICAL_HEAD_MARK_LABELS[value as TechnicalHeadMarkId];
    default:
      return value;
  }
}

/** Titel der Fähigkeit aus Kapitel 4, wie ihn das Piktogrammregister führt. */
export function taskLabel(value: CapabilityId): string {
  return pictogram(`capability.${value}` as Parameters<typeof pictogram>[0]).title;
}

/** Titel des Zustands aus Kapitel 5.8, wie ihn das Piktogrammregister führt. */
export function stateLabel(value: StateId): string {
  return pictogram(`state.${value}` as Parameters<typeof pictogram>[0]).title;
}

/** Die Gruppe aus 5.8, in der ein Zustand steht, mit ihrem Titel. */
export function stateGroupLabel(value: StateId): string {
  return stateGroup(stateValueGroup(value)).title;
}
