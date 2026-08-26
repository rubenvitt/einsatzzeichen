import { deepFreeze } from '../../readonly-data.js';
import { COMMAND_POST_PICTOGRAMS } from './01-command-post.js';
import { LOCATION_PICTOGRAMS } from './02-locations.js';
import { OPEN_CAP_FUNCTION_PICTOGRAMS } from './03-open-cap-functions.js';

/** Direkte Führungszeichen aus Anhang D in Abschnittsreihenfolge. */
export const LEADERSHIP_PICTOGRAMS = deepFreeze([
  ...COMMAND_POST_PICTOGRAMS,
  ...LOCATION_PICTOGRAMS,
  ...OPEN_CAP_FUNCTION_PICTOGRAMS,
]);
