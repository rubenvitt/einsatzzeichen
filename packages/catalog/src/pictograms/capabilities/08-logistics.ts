import { deepFreeze } from '../../readonly-data.js';
import { strokeCapability as icon } from '../authoring.js';

/** Piktogramme des Kapitels 4.8: Versorgung, Logistik und Infrastruktur. */
export const LOGISTICS_CAPABILITIES = deepFreeze([
  icon({ section: '4.8.1', id: 'container-resource', title: 'Behälter', referenceAsset: '4.8.1_Behälter.svg', d: 'M 8 8 V 24 H 24 V 8' }),
  icon({ section: '4.8.2', id: 'fuels-consumables', title: 'Betriebsstoffe / Verbrauchsgüter', referenceAsset: '4.8.2_Betriebsstoffe Verbrauchsgüter.svg', d: 'M 7 8 H 25 L 19 16 V 24 H 13 V 16 Z' }),
  icon({ section: '4.8.3', id: 'bridge', title: 'Brücke', referenceAsset: '4.8.3_Brücke.svg', d: 'M 5 10 L 9 15 H 23 L 27 10 M 5 22 L 9 17 H 23 L 27 22' }),
  icon({ section: '4.8.4', id: 'temporary-bridge-construction', title: 'Behelfsbrückenbau', referenceAsset: '4.8.4_Behelfsbrückenbau.svg', d: 'M 5 8 L 9 13 H 23 L 27 8 M 5 18 L 9 14 H 23 L 27 18 M 12 18 V 24 M 20 18 V 24 M 12 20 H 20' }),
  icon({ section: '4.8.5', id: 'waste-disposal', title: 'Entsorgung', referenceAsset: '4.8.5_Entsorgung.svg', d: 'M 9 11 H 23 L 22 24 H 10 Z M 8 11 H 24 M 13 8 H 19 M 12 14 V 21 M 16 14 V 21 M 20 14 V 21' }),
  icon({ section: '4.8.6', id: 'maintenance', title: 'Instandhaltung', referenceAsset: '4.8.6_Instandhaltung.svg', d: 'M 7 11 C 10 8 13 9 14 12 H 18 C 19 9 22 8 25 11 M 7 21 C 10 24 13 23 14 20 H 18 C 19 23 22 24 25 21 M 14 12 V 20 M 18 12 V 20' }),
  icon({ section: '4.8.7', id: 'sandbag', title: 'Sandsack', referenceAsset: '4.8.7_Sandsack.svg', d: 'M 13 9 H 19 M 14 9 L 13 11 Q 10 11 10 15 L 9 23 H 23 L 22 15 Q 22 11 19 11 L 18 9 M 13 11 H 19' }),
  icon({ section: '4.8.8', id: 'sandbag-filling', title: 'Sandsackbefüllung', referenceAsset: '4.8.8_Sandsackbefüllung.svg', d: 'M 6 8 H 26 L 19 16 H 13 Z M 6 8 V 24 M 26 8 V 24 M 13 16 V 22 H 19 V 16' }),
  icon({ section: '4.8.9', id: 'washing-facility', title: 'Sanitäre Einrichtung / Waschmöglichkeit', referenceAsset: '4.8.9_Sanitäre Einrichtung_Waschmöglichkeit.svg', d: 'M 21 24 V 12 C 21 9 19 8 17 8 C 14 8 12 10 12 13 M 8 15 C 8 12 10 11 12 11 C 14 11 16 12 16 15 Z M 10 18 V 21 M 13 18 V 21 M 16 18 V 21' }),
  icon({ section: '4.8.10', id: 'toilet-facility', title: 'Sanitäre Einrichtung / WC', referenceAsset: '4.8.10_Sanitäre Einrichtung_WC.svg', d: 'M 5 10 L 8 22 L 11 10 L 14 22 L 17 10 M 27 12 C 25 9 20 9 19 15 C 18 21 23 23 27 20' }),
  icon({ section: '4.8.11', id: 'power-supply', title: 'Stromversorgung', referenceAsset: '4.8.11_Stromversorgung.svg', d: 'M 19 8 L 11 18 H 17 L 13 24 L 23 14 H 17 Z' }),
  icon({ section: '4.8.12', id: 'drinking-water', title: 'Trinkwasser', referenceAsset: '4.8.12_Trinkwasser.svg', d: 'M 5 15 H 18 V 12 H 22 V 15 H 26 V 19 M 18 15 V 18' }),
  icon({ section: '4.8.13', id: 'catering', title: 'Verpflegung', referenceAsset: '4.8.13_Verpflegung.svg', d: 'M 16 8 C 9 8 5 11 5 16 C 5 21 9 24 16 24 C 20 24 23 22 25 19 L 16 16 L 25 11 C 23 9 20 8 16 8 Z' }),
  icon({ section: '4.8.14', id: 'meal-preparation', title: 'Verpflegung / Zubereitung', referenceAsset: '4.8.14_Verpflegung_Zubereitung.svg', d: 'M 17 8 C 11 8 7 11 7 16 C 7 21 11 24 17 24 C 21 24 24 22 26 19 L 17 16 L 26 11 C 24 9 21 8 17 8 Z M 5 8 V 24 M 4 8 C 4 10 6 10 6 8 M 4 12 H 6' }),
  icon({ section: '4.8.15', id: 'rapid-deployment-tent', title: 'Schnelleinsatzzelt', referenceAsset: '4.8.15_Schnelleinsatzzelt.svg', d: 'M 7 24 V 12 L 11 8 H 21 L 25 12 V 24' }),
  icon({ section: '4.8.16', id: 'frame-tent', title: 'Stangengerüstzelt', referenceAsset: '4.8.16_Stangengerüstzelt.svg', d: 'M 7 24 L 16 8 L 25 24 Z M 10 8 L 22 24 M 22 8 L 10 24' }),
] as const);
