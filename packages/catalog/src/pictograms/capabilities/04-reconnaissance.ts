import { deepFreeze } from '../../readonly-data.js';
import { strokeCapability as icon } from '../authoring.js';

/** Piktogramme des Kapitels 4.4: eigenständige Konstruktionen nach der Bildidee der Referenz. */
export const RECONNAISSANCE_CAPABILITIES = deepFreeze([
  icon({ section: '4.4.1', id: 'reconnaissance', title: 'Erkunden',
    referenceAsset: '4.4.1_Erkunden.svg', d: 'M 5 24 L 27 8' }),
  icon({ section: '4.4.2', id: 'biological-location', title: 'Orten, biologisch',
    referenceAsset: '4.4.2_Orten biologisch.svg',
    d: 'M 7 24 L 12 13 L 17 24 M 17 24 L 22 13 L 27 24 M 12 13 H 22 M 22 13 L 25 8 L 28 14 Z' }),
  icon({ section: '4.4.3', id: 'technical-location', title: 'Orten, technisch',
    referenceAsset: '4.4.3_Orten technisch.svg',
    d: 'M 6 22 C 6 13 12 8 19 9 M 19 9 L 15 13 L 24 22 M 24 22 H 28 M 24 22 V 18' }),
] as const);
