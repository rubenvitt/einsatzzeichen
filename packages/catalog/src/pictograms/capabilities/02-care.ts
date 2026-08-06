import { deepFreeze } from '../../readonly-data.js';
import { strokeCapability as icon } from '../authoring.js';

export const CARE_CAPABILITIES = deepFreeze([
  icon({ section: '4.2.1', id: 'care', title: 'Betreuung',
    referenceAsset: '4.2.1_Betreuung Grundzeichne.svg', d: 'M 6 24 L 16 8 L 26 24' }),
  icon({ section: '4.2.2', id: 'psychosocial-emergency-care', title: 'PSNV',
    referenceAsset: '4.2.2_PSNV.svg',
    d: 'M 6 24 L 16 8 L 26 24 M 9 20 V 14 H 12 C 15 14 15 18 12 18 H 9 M 17 14 L 19 20 L 21 14 L 23 20 L 25 14' }),
  icon({ section: '4.2.3', id: 'pastoral-care', title: 'Seelsorge',
    referenceAsset: '4.2.3_Seelsorge.svg', d: 'M 16 8 V 24 M 10 13 H 22 M 9 16 H 23' }),
  icon({ section: '4.2.4', id: 'temporary-accommodation-resting',
    title: 'Temporäre Unterbringung mit Ruhemöglichkeit',
    referenceAsset: '4.2.4_Temporäre Unterbringung mit Ruhemöglichkeit.svg',
    d: 'M 6 8 V 24 M 26 8 V 24 M 6 18 C 9 12 23 12 26 18 M 6 19 H 26' }),
  icon({ section: '4.2.5', id: 'temporary-accommodation-seating',
    title: 'Temporäre Unterbringung mit Sitzmöglichkeit',
    referenceAsset: '4.2.5_Temporäre Unterbringung mit Sitzmöglichkeit.svg',
    d: 'M 10 8 V 24 M 10 16 H 20 V 24' }),
] as const);
