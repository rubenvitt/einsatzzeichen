import { CBRN_CAPABILITIES } from './01-cbrn.js';
import { CARE_CAPABILITIES } from './02-care.js';
import { FIRE_FIGHTING_PICTOGRAMS } from './03-fire-fighting.js';
import { RECONNAISSANCE_CAPABILITIES } from './04-reconnaissance.js';
import { RESCUE_CAPABILITIES } from './05-rescue.js';
import type { CatalogPictogramDefinition } from '../catalog-definition.js';
import { deepFreeze } from '../../readonly-data.js';

export const CAPABILITY_PICTOGRAMS: readonly CatalogPictogramDefinition[] = deepFreeze([
  ...CBRN_CAPABILITIES,
  ...CARE_CAPABILITIES,
  ...FIRE_FIGHTING_PICTOGRAMS,
  ...RECONNAISSANCE_CAPABILITIES,
  ...RESCUE_CAPABILITIES,
]);
