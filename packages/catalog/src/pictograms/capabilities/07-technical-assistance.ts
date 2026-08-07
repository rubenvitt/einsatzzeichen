import { deepFreeze } from '../../readonly-data.js';
import { strokeCapability as icon } from '../authoring.js';

/** Piktogramme des Kapitels 4.7: eigenständige Konstruktionen nach der Bildidee der Referenz. */
export const TECHNICAL_ASSISTANCE_CAPABILITIES = deepFreeze([
  icon({ section: '4.7.1', id: 'water-hazard-control', title: 'Abwehr von Wassergefahren', referenceAsset: '4.7.1_Abwehr von Wassergefahren.svg', d: 'M 5 11 C 8 8 11 15 14 11 C 17 8 20 15 23 11 C 25 9 27 10 28 11 M 5 23 H 16 L 21 9 H 26 L 28 15' }),
  icon({ section: '4.7.2', id: 'excavation', title: 'Baggerarbeiten', referenceAsset: '4.7.2_Baggerarbeiten.svg', d: 'M 5 24 L 12 9 L 20 13 M 20 13 C 22 9 27 10 27 14 C 27 17 24 19 21 17' }),
  icon({ section: '4.7.3', id: 'lighting', title: 'Beleuchten', referenceAsset: '4.7.3_Beleuchten.svg', d: 'M 10 24 V 12 C 10 9 12 8 14 8 C 17 8 19 10 19 13 C 19 15 17 17 15 17 C 13 17 12 16 12 14 M 6 20 H 10 M 19 13 H 27 M 23 10 L 27 13 L 23 16' }),
  icon({ section: '4.7.4', id: 'ventilation', title: 'Belüften', referenceAsset: '4.7.4_Belüften.svg', d: 'M 4 11 H 23 M 19 8 L 23 11 L 19 14 M 4 21 H 23 M 19 18 L 23 21 L 19 24 M 10 8 V 14 M 16 18 V 24' }),
  icon({ section: '4.7.5', id: 'air-extraction', title: 'Entlüften', referenceAsset: '4.7.5_Entlüften.svg', d: 'M 4 13 H 23 M 19 10 L 23 13 L 19 16 M 4 21 H 23 M 19 18 L 23 21 L 19 24 M 10 8 V 16 M 16 18 V 24' }),
  icon({ section: '4.7.6', id: 'explosive-ordnance-clearance', title: 'Kampfmittelräumung', referenceAsset: '4.7.6_Kampfmittelräumung.svg', d: 'M 16 8 C 10 8 6 12 6 16 C 6 21 10 24 16 24 C 22 24 26 21 26 16 C 26 12 22 8 16 8 Z M 16 11 C 12 11 10 13 10 16 C 10 19 12 21 16 21 C 20 21 22 19 22 16 C 22 13 20 11 16 11 Z' }),
  icon({ section: '4.7.7', id: 'hand-tools', title: 'Einsatz von Handwerkzeugen', referenceAsset: '4.7.7_Einsatz von Handwerkzeugen.svg', d: 'M 6 23 L 23 8 M 10 8 L 26 23 M 21 8 L 25 8 L 25 12 M 8 8 L 12 8 L 12 12' }),
  icon({ section: '4.7.8', id: 'forklift-lifting', title: 'Hebearbeit mit Gabelstapler', referenceAsset: '4.7.8_Hebearbeit mit Gabelstapler.svg', d: 'M 10 8 V 24 M 12 8 V 18 H 22 M 22 18 V 20 H 26' }),
  icon({ section: '4.7.9', id: 'crane-lifting', title: 'Hebearbeit mit Kran', referenceAsset: '4.7.9_Hebearbeit mit Kran.svg', d: 'M 9 24 V 8 H 25 V 13 C 25 16 22 17 20 15' }),
  icon({ section: '4.7.10', id: 'lifting-loads-persons', title: 'Heben von Lasten oder Personen', referenceAsset: '4.7.10_Heben von Lasten oder Personen.svg', d: 'M 16 8 V 13 M 13 11 L 16 8 L 19 11 M 16 13 L 22 19 L 16 24 L 10 19 Z' }),
  icon({ section: '4.7.10', id: 'lifting-loads-persons', variant: 'alternative', title: 'Heben von Lasten oder Personen', referenceAsset: '4.7.10_Heben von Lasten oder Personen_Alternative.svg', d: 'M 16 8 V 14 M 13 11 L 16 8 L 19 11 M 11 14 H 21 V 24 H 11 Z' }),
] as const);
