import { deepFreeze } from '../../readonly-data.js';
import type { CatalogPictogramDefinition } from '../catalog-definition.js';
import { OPERATING_MODE_COMMS } from './02-operating-modes.js';

export { OPERATING_MODE_COMMS } from './02-operating-modes.js';

export const COMMS_PICTOGRAMS = deepFreeze([
  ...OPERATING_MODE_COMMS,
] satisfies readonly CatalogPictogramDefinition[]);
