import { CBRN_CAPABILITIES } from './01-cbrn.js';
import { FIRE_FIGHTING_PICTOGRAMS } from './03-fire-fighting.js';
import type { CatalogPictogramDefinition } from '../catalog-definition.js';
import { deepFreeze } from '../../readonly-data.js';

export const CAPABILITY_PICTOGRAMS: readonly CatalogPictogramDefinition[] = deepFreeze([
  ...CBRN_CAPABILITIES,
  ...FIRE_FIGHTING_PICTOGRAMS,
]);
