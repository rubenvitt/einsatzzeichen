import { deepFreeze } from '../../readonly-data.js';
import type { CatalogPictogramDefinition } from '../catalog-definition.js';
import { TACTICS_HAZARDS_STATES } from './01-tactics-hazards.js';
import { ACTIVITY_STATES } from './02-activity.js';
import { TENDENCY_STATES } from './03-tendencies.js';
import { DAMAGE_STATES } from './04-damage.js';
import { FIRE_STATES } from './05-fire.js';
import { ANIMAL_STATES } from './06-animals.js';
import { PERSON_STATES } from './08-persons.js';

export { TACTICS_HAZARDS_STATES } from './01-tactics-hazards.js';
export { ACTIVITY_STATES } from './02-activity.js';
export { TENDENCY_STATES } from './03-tendencies.js';
export { DAMAGE_STATES } from './04-damage.js';
export { FIRE_STATES } from './05-fire.js';
export { ANIMAL_STATES } from './06-animals.js';
export { PERSON_STATES } from './08-persons.js';

export const STATE_PICTOGRAMS = deepFreeze([
  ...TACTICS_HAZARDS_STATES,
  ...ACTIVITY_STATES,
  ...TENDENCY_STATES,
  ...DAMAGE_STATES,
  ...FIRE_STATES,
  ...ANIMAL_STATES,
  ...PERSON_STATES,
] satisfies readonly CatalogPictogramDefinition[]);
