import { deepFreeze } from '../../readonly-data.js';
import type { CatalogPictogramDefinition } from '../catalog-definition.js';
import { STRUCTURAL_DAMAGE } from './01-structural.js';
import { DYKE_DAMAGE } from './02-dyke.js';

export { STRUCTURAL_DAMAGE } from './01-structural.js';
export { DYKE_DAMAGE } from './02-dyke.js';

/**
 * Zwei Anhänge, ein ID-Raum: K (Bauwerksschäden) und L (Deichverteidigung). Die Begründung für
 * die Zusammenlegung steht an `DAMAGE_IDS` in `taxonomy.ts`; die Reihenfolge hier folgt der
 * Kapitelreihenfolge, erst K, dann L.
 */
export const DAMAGE_PICTOGRAMS = deepFreeze([
  ...STRUCTURAL_DAMAGE,
  ...DYKE_DAMAGE,
] satisfies readonly CatalogPictogramDefinition[]);
