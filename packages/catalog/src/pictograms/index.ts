import type { CapabilityId, PictogramDefinition, PictogramId, Primitive } from '@einsatzzeichen/schema';
import { CAPABILITY_PICTOGRAMS } from './capabilities.js';

/**
 * Alle Piktogramme des Katalogs, ein Modul je Bereich. In D.0 trägt nur `capability.` Einträge;
 * `state.`, `comms.`, `damage.` und `wildfire.` kommen in D.2 bis D.4 als eigene Module hinzu und
 * werden hier zusammengeführt.
 */
const PICTOGRAMS: Partial<Record<PictogramId, PictogramDefinition>> = {
  ...CAPABILITY_PICTOGRAMS,
};

/**
 * Löst eine Piktogramm-ID auf und wirft bei einer ID ohne Definition — dasselbe Muster wie
 * `organizationColor`, `baseDrawing` und `resolveElement`. Ein stilles `undefined` würde als
 * leeres Piktogramm gerendert und wäre schwerer zu bemerken als ein Fehler.
 */
export function pictogram(id: PictogramId): PictogramDefinition {
  const definition = PICTOGRAMS[id];
  if (definition === undefined) {
    throw new Error(`Kein Piktogramm "${id}" im Katalog.`);
  }
  return definition;
}

/** Alle definierten Piktogramme. Eingabe der Gate-Tests. */
export const ALL_PICTOGRAMS: readonly PictogramDefinition[] = Object.values(PICTOGRAMS).filter(
  (definition): definition is PictogramDefinition => definition !== undefined,
);

/**
 * Übergangswrapper für den bestehenden `capabilityPictogram`-Port in `compose`. Entfällt, sobald
 * `CatalogPorts` auf `pictogram` umgestellt ist.
 *
 * Kopiert flach in ein mutables Array: `CatalogPorts.capabilityPictogram` in `core` verlangt
 * unverändert `Primitive[]`, `PictogramDefinition.primitives` ist aber `readonly Primitive[]`.
 * `compose` bleibt in diesem Task unberührt, die Kopie überbrückt den Unterschied an dieser Stelle.
 */
export function capabilityPictogram(id: CapabilityId): Primitive[] {
  return [...pictogram(`capability.${id}`).primitives];
}
