import {
  entryKey,
  type DepictionVariant,
  type LegacyCommsId,
  type LegacySiteId,
  type PictogramId,
} from '@einsatzzeichen/schema';
import { CAPABILITY_PICTOGRAMS } from './capabilities.js';
import { STATE_PICTOGRAMS } from './states/index.js';
import { COMMS_PICTOGRAMS, LEGACY_COMMS } from './comms/index.js';
import { DAMAGE_PICTOGRAMS } from './damage/index.js';
import { WILDFIRE_PICTOGRAMS } from './wildfire/index.js';
import { LEADERSHIP_PICTOGRAMS } from './leadership/index.js';
import { WATER_RESCUE_PERSONNEL_PICTOGRAMS } from './water-rescue-personnel/index.js';
import { SPECIAL_FORM_PICTOGRAMS } from './special-forms/index.js';
import { LEGACY_SITES } from './sites/index.js';
import type {
  CatalogPictogramDefinition,
  LegacyPictogramDefinition,
  RegisteredPictogramDefinition,
} from './catalog-definition.js';
import { deepFreeze } from '../readonly-data.js';

export function pictogramVariantKey(
  value: Pick<RegisteredPictogramDefinition, 'id' | 'variant'>,
): string {
  return entryKey(value.id, value.variant);
}

export function pictogramRenderId(
  value: { readonly id: string; readonly variant: DepictionVariant },
): string {
  return value.variant === 'primary' ? value.id : `${value.id}.${value.variant}`;
}

/** Alle Piktogramme des Katalogs, ein Modul je fachlich getrenntem ID-Bereich. */
export const ALL_PICTOGRAMS: readonly CatalogPictogramDefinition[] = deepFreeze([
  ...CAPABILITY_PICTOGRAMS,
  ...STATE_PICTOGRAMS,
  ...COMMS_PICTOGRAMS,
  ...DAMAGE_PICTOGRAMS,
  ...WILDFIRE_PICTOGRAMS,
  ...LEADERSHIP_PICTOGRAMS,
  ...WATER_RESCUE_PERSONNEL_PICTOGRAMS,
  ...SPECIAL_FORM_PICTOGRAMS,
]);

/**
 * Altzeichen ohne Nachfolger in der Baseline (ESZ-137): Piktogramme aus der Systematik von
 * 2010/2011, belegt an Abschnitt und Seite der DV 102 statt an einer Referenzdatei. Nicht in
 * `ALL_PICTOGRAMS`, weil jede Prüfung dort eine BABZ-Datei voraussetzt (Coverage-Manifest,
 * Fingerprints, Inventar). `pictogram()` und die freistehende Art `pictogram` erreichen sie.
 */
export const LEGACY_PICTOGRAMS: readonly LegacyPictogramDefinition[] = deepFreeze([...LEGACY_COMMS, ...LEGACY_SITES]);

export { isLegacyPictogram } from './catalog-definition.js';
export { STATE_PICTOGRAMS } from './states/index.js';
export { COMMS_PICTOGRAMS } from './comms/index.js';
export { DAMAGE_PICTOGRAMS } from './damage/index.js';
export { WILDFIRE_PICTOGRAMS } from './wildfire/index.js';
export { LEADERSHIP_PICTOGRAMS } from './leadership/index.js';
export { WATER_RESCUE_PERSONNEL_PICTOGRAMS } from './water-rescue-personnel/index.js';
export { SPECIAL_FORM_PICTOGRAMS } from './special-forms/index.js';

export function buildPictogramRegistry<Definition extends RegisteredPictogramDefinition>(
  definitions: readonly Definition[],
): ReadonlyMap<string, Definition> {
  const registry = new Map<string, Definition>();
  for (const definition of definitions) {
    const key = pictogramVariantKey(definition);
    if (registry.has(key)) throw new Error(`Doppeltes Piktogramm "${key}".`);
    registry.set(key, definition);
  }
  return registry;
}

const PICTOGRAMS = buildPictogramRegistry<RegisteredPictogramDefinition>([
  ...ALL_PICTOGRAMS,
  ...LEGACY_PICTOGRAMS,
]);

/**
 * Löst eine Piktogramm-ID auf und wirft bei einer ID ohne Definition — dasselbe Muster wie
 * `organizationColor`, `baseDrawing` und `resolveElement`. Ein stilles `undefined` würde als
 * leeres Piktogramm gerendert und wäre schwerer zu bemerken als ein Fehler.
 */
export function pictogram(
  id: `comms.${LegacyCommsId}` | `site.${LegacySiteId}`,
  variant?: DepictionVariant,
): LegacyPictogramDefinition;
export function pictogram(
  id: Exclude<PictogramId, `comms.${LegacyCommsId}` | `site.${LegacySiteId}`>,
  variant?: DepictionVariant,
): CatalogPictogramDefinition;
export function pictogram(id: PictogramId, variant?: DepictionVariant): RegisteredPictogramDefinition;
export function pictogram(
  id: PictogramId,
  variant: DepictionVariant = 'primary',
): RegisteredPictogramDefinition {
  const definition = PICTOGRAMS.get(entryKey(id, variant));
  if (definition === undefined) {
    throw new Error(`Kein Piktogramm "${id}" in Variante "${variant}" im Katalog.`);
  }
  return definition;
}
