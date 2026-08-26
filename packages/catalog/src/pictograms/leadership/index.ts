import { deepFreeze } from '../../readonly-data.js';
import { COMMAND_POST_PICTOGRAMS } from './01-command-post.js';
import { LOCATION_PICTOGRAMS } from './02-locations.js';

/** Direkte Führungszeichen aus Anhang D in Abschnittsreihenfolge. */
export const LEADERSHIP_PICTOGRAMS = deepFreeze([
  ...COMMAND_POST_PICTOGRAMS,
  ...LOCATION_PICTOGRAMS,
]);
