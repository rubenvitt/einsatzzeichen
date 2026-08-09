import { deepFreeze } from '../../readonly-data.js';
import type { CatalogPictogramDefinition } from '../catalog-definition.js';
import { OPERATING_MODE_COMMS } from './02-operating-modes.js';
import { DEVICE_COMMS } from './03-devices.js';

export { OPERATING_MODE_COMMS } from './02-operating-modes.js';
export { DEVICE_COMMS } from './03-devices.js';

export const COMMS_PICTOGRAMS = deepFreeze([
  ...OPERATING_MODE_COMMS,
  ...DEVICE_COMMS,
] satisfies readonly CatalogPictogramDefinition[]);
