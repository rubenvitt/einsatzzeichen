import { deepFreeze } from '../../readonly-data.js';
import { WATER_RESCUE_PERSONNEL_PICTOGRAMS as LEADER_PICTOGRAMS } from './01-leaders.js';

/** Direkte Wasserrettungs-Personenpiktogramme aus I.5.4 bis I.5.8. */
export const WATER_RESCUE_PERSONNEL_PICTOGRAMS = deepFreeze([
  ...LEADER_PICTOGRAMS,
]);
