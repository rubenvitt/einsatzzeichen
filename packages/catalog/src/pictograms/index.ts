import {
  entryKey,
  type DepictionVariant,
  type PictogramId,
} from '@einsatzzeichen/schema';
import { CAPABILITY_PICTOGRAMS } from './capabilities.js';
import { STATE_PICTOGRAMS } from './states/index.js';
import { COMMS_PICTOGRAMS } from './comms/index.js';
import { DAMAGE_PICTOGRAMS } from './damage/index.js';
import { WILDFIRE_PICTOGRAMS } from './wildfire/index.js';
import type { CatalogPictogramDefinition } from './catalog-definition.js';
import { deepFreeze } from '../readonly-data.js';

export function pictogramVariantKey(
  value: Pick<CatalogPictogramDefinition, 'id' | 'variant'>,
): string {
  return entryKey(value.id, value.variant);
}

export function pictogramRenderId(
  value: { readonly id: string; readonly variant: DepictionVariant },
): string {
  return value.variant === 'primary' ? value.id : `${value.id}.${value.variant}`;
}

/** Alle Piktogramme des Katalogs, ein Modul je Bereich — seit D.4 alle fünf Arten. */
export const ALL_PICTOGRAMS: readonly CatalogPictogramDefinition[] = deepFreeze([
  ...CAPABILITY_PICTOGRAMS,
  ...STATE_PICTOGRAMS,
  ...COMMS_PICTOGRAMS,
  ...DAMAGE_PICTOGRAMS,
  ...WILDFIRE_PICTOGRAMS,
]);

export { STATE_PICTOGRAMS } from './states/index.js';
export { COMMS_PICTOGRAMS } from './comms/index.js';
export { DAMAGE_PICTOGRAMS } from './damage/index.js';
export { WILDFIRE_PICTOGRAMS } from './wildfire/index.js';

export function buildPictogramRegistry(
  definitions: readonly CatalogPictogramDefinition[],
): ReadonlyMap<string, CatalogPictogramDefinition> {
  const registry = new Map<string, CatalogPictogramDefinition>();
  for (const definition of definitions) {
    const key = pictogramVariantKey(definition);
    if (registry.has(key)) throw new Error(`Doppeltes Piktogramm "${key}".`);
    registry.set(key, definition);
  }
  return registry;
}

const PICTOGRAMS = buildPictogramRegistry(ALL_PICTOGRAMS);

/**
 * Löst eine Piktogramm-ID auf und wirft bei einer ID ohne Definition — dasselbe Muster wie
 * `organizationColor`, `baseDrawing` und `resolveElement`. Ein stilles `undefined` würde als
 * leeres Piktogramm gerendert und wäre schwerer zu bemerken als ein Fehler.
 */
export function pictogram(
  id: PictogramId,
  variant: DepictionVariant = 'primary',
): CatalogPictogramDefinition {
  const definition = PICTOGRAMS.get(entryKey(id, variant));
  if (definition === undefined) {
    throw new Error(`Kein Piktogramm "${id}" in Variante "${variant}" im Katalog.`);
  }
  return definition;
}
