import { deepFreeze } from '../../readonly-data.js';
import { strokeCapability as icon } from '../authoring.js';

/** Piktogramme des Kapitels 4.6: eigenständige Konstruktionen nach der Bildidee der Referenz. */
export const MEDICAL_CAPABILITIES = deepFreeze([
  icon({ section: '4.6.1', id: 'medical-service', title: 'Sanität, Grundzeichen',
    referenceAsset: '4.6.1_Sanität Grundzeichen.svg', d: 'M 16 8 V 24 M 7 16 H 25' }),
  icon({ section: '4.6.2', id: 'nursing', title: 'Pflege',
    referenceAsset: '4.6.2_Pflege.svg', d: 'M 16 8 V 24 M 7 16 H 25 M 10 12 V 20' }),
  icon({ section: '4.6.3', id: 'intensive-care', title: 'Rettungswesen / Intensivmedizin',
    referenceAsset: '4.6.3_Rettungswesen_Intensivmedizin.svg',
    d: 'M 16 8 V 24 M 7 16 H 25 M 10 13 V 19 M 22 13 V 19' }),
  icon({ section: '4.6.4', id: 'physician', title: 'Arztwesen',
    referenceAsset: '4.6.4_Arztwesen.svg', d: 'M 16 8 V 24 M 7 16 H 25 M 12 20 H 20' }),
  icon({ section: '4.6.5', id: 'patient-transport', title: 'Patiententransport',
    referenceAsset: '4.6.5_Patiententransport.svg',
    d: 'M 16 8 V 24 M 7 16 H 25 M 16 10 C 12 10 9 13 9 16 C 9 20 12 22 16 22 C 20 22 23 20 23 16 C 23 13 20 10 16 10 Z M 11 11 L 21 21 M 21 11 L 11 21' }),
  icon({ section: '4.6.6', id: 'hospital', title: 'Krankenhaus',
    referenceAsset: '4.6.6_Krankenhaus.svg',
    d: 'M 6 24 V 12 L 16 8 L 26 12 V 24 Z M 16 12 V 22 M 10 17 H 22 M 10 14 V 22 M 22 14 V 22' }),
] as const);
