import { deepFreeze } from '../../readonly-data.js';
import type { CatalogPictogramDefinition } from '../catalog-definition.js';
import { TENDENCY_STATES } from './03-tendencies.js';

export { TENDENCY_STATES } from './03-tendencies.js';

export const STATE_PICTOGRAMS = deepFreeze([
  ...TENDENCY_STATES,
] satisfies readonly CatalogPictogramDefinition[]);
