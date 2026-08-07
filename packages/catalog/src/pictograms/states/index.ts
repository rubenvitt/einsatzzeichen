import { deepFreeze } from '../../readonly-data.js';
import type { CatalogPictogramDefinition } from '../catalog-definition.js';
import { ACTIVITY_STATES } from './02-activity.js';
import { TENDENCY_STATES } from './03-tendencies.js';

export { ACTIVITY_STATES } from './02-activity.js';
export { TENDENCY_STATES } from './03-tendencies.js';

export const STATE_PICTOGRAMS = deepFreeze([
  ...ACTIVITY_STATES,
  ...TENDENCY_STATES,
] satisfies readonly CatalogPictogramDefinition[]);
