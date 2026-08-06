import { FIRE_FIGHTING_PICTOGRAMS } from './03-fire-fighting.js';
import type { CatalogPictogramDefinition } from '../catalog-definition.js';
import { deepFreeze } from '../../readonly-data.js';

export const CAPABILITY_PICTOGRAMS: readonly CatalogPictogramDefinition[] = deepFreeze([
  ...FIRE_FIGHTING_PICTOGRAMS,
]);
