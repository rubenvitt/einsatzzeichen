import { deepFreeze } from '../../readonly-data.js';
import { strokeCapability as icon } from '../authoring.js';

export const INFORMATION_COMMUNICATIONS_CAPABILITIES = deepFreeze([
  icon({
    section: '4.9.1',
    id: 'information-communications',
    title: 'Information und Kommunikation / Fernmeldewesen',
    referenceAsset: '4.9.1_Information und Kommunikation Fernmeldewesen.svg',
    d: 'M 5 12 L 13 19 V 10 L 27 21',
  }),
] as const);
