import { strokeCapability as icon } from '../authoring.js';
import { deepFreeze } from '../../readonly-data.js';

export const CBRN_CAPABILITIES = deepFreeze([
  icon({
    section: '4.1.1', id: 'cbrn-protection', title: 'ABC-/CBRN-Schutz',
    referenceAsset: '4.1.1_ABC_CBRN-Schutz.svg',
    d: 'M 7 23 L 18 8 M 25 23 L 14 8 M 5 10 C 5 8.9 5.9 8 7 8 C 8.1 8 9 8.9 9 10 C 9 11.1 8.1 12 7 12 C 5.9 12 5 11.1 5 10 M 23 10 C 23 8.9 23.9 8 25 8 C 26.1 8 27 8.9 27 10 C 27 11.1 26.1 12 25 12 C 23.9 12 23 11.1 23 10',
  }),
  icon({
    section: '4.1.2', id: 'cbrn-detection', title: 'Messen, Spüren, Detektieren',
    referenceAsset: '4.1.2_Messen Spüren Detektieren.svg',
    d: 'M 7 23 L 18 8 M 25 23 L 14 8 M 4 17 L 28 13 M 5 10 C 5 8.9 5.9 8 7 8 C 8.1 8 9 8.9 9 10 C 9 11.1 8.1 12 7 12 C 5.9 12 5 11.1 5 10 M 23 10 C 23 8.9 23.9 8 25 8 C 26.1 8 27 8.9 27 10 C 27 11.1 26.1 12 25 12 C 23.9 12 23 11.1 23 10',
  }),
  icon({
    section: '4.1.3', id: 'decontamination', title: 'Dekontaminieren',
    referenceAsset: '4.1.3_Dekontaminieren.svg',
    d: 'M 7 23 L 18 8 M 25 23 L 14 8 M 5 18 V 24 H 11 M 27 18 V 24 H 21 M 5 10 C 5 8.9 5.9 8 7 8 C 8.1 8 9 8.9 9 10 C 9 11.1 8.1 12 7 12 C 5.9 12 5 11.1 5 10 M 23 10 C 23 8.9 23.9 8 25 8 C 26.1 8 27 8.9 27 10 C 27 11.1 26.1 12 25 12 C 23.9 12 23 11.1 23 10',
  }),
  icon({
    section: '4.1.4', id: 'water-environmental-damage-control',
    title: 'Umweltschädenbeseitigung auf Gewässern',
    referenceAsset: '4.1.4_Umweltschädenbeseitigung auf Gewässern.svg',
    d: 'M 7 19 L 17 8 M 25 19 L 15 8 M 5 20 C 8 16 11 24 14 20 C 17 16 20 24 23 20 C 25 18 27 19 28 20 M 5 23 C 8 19 11 24 14 23 C 17 19 20 24 23 23 C 25 21 27 22 28 23',
  }),
  icon({
    section: '4.1.5', id: 'drinking-water-treatment', title: 'Trinkwasseraufbereitung',
    referenceAsset: '4.1.5_Trinkwasseraufbereitung.svg',
    d: 'M 8 20 C 5 17 5 12 9 9 M 8 20 L 5 18 M 8 20 L 8 16 M 24 12 C 27 15 27 20 23 23 M 24 12 L 27 14 M 24 12 L 24 16 M 10 15 C 12 11 14 19 16 15 C 18 11 20 19 22 15 M 15 16 H 19 V 20 M 17 18 H 21',
  }),
  icon({
    section: '4.1.6', id: 'radioactive-materials', title: 'Atomare Stoffe',
    referenceAsset: '4.1.6_Atomare Stoffe.svg',
    d: 'M 16 14 C 14.9 14 14 14.9 14 16 C 14 17.1 14.9 18 16 18 C 17.1 18 18 17.1 18 16 C 18 14.9 17.1 14 16 14 M 15 13 L 10 8 L 7 13 L 13 15 M 19 13 L 22 8 L 27 13 L 19 15 M 14 19 L 11 24 H 21 L 18 19',
  }),
  icon({
    section: '4.1.6', id: 'radioactive-materials', variant: 'alternative',
    title: 'Atomare Stoffe', referenceAsset: '4.1.6_Atomare Stoffe_Alternative.svg', color: 'rot',
    d: 'M 16 8 L 5 24 H 27 Z M 12 21 L 16 12 L 20 21 M 13.5 18 H 18.5',
  }),
  icon({
    section: '4.1.7', id: 'biological-materials', title: 'Biologische Stoffe',
    referenceAsset: '4.1.7_Biologische Stoffe.svg',
    d: 'M 16 13 C 12 8 7 10 8 15 C 9 19 13 19 16 16 C 19 19 23 19 24 15 C 25 10 20 8 16 13 M 16 16 C 11 16 10 21 13 24 M 16 16 C 21 16 22 21 19 24 M 16 13 V 8',
  }),
  icon({
    section: '4.1.7', id: 'biological-materials', variant: 'alternative',
    title: 'Biologische Stoffe', referenceAsset: '4.1.7_Biologische Stoffe_Alternative.svg', color: 'rot',
    d: 'M 16 8 L 5 24 H 27 Z M 13 12 V 21 H 17 C 20 21 20 17 17 17 H 13 M 17 17 C 20 17 20 12 17 12 H 13',
  }),
  icon({
    section: '4.1.8', id: 'chemical-materials', title: 'Chemische Stoffe',
    referenceAsset: '4.1.8_Chemische Stoffe.svg',
    d: 'M 13 8 H 19 V 14 L 24 24 H 8 L 13 14 Z M 11 20 H 21',
  }),
  icon({
    section: '4.1.8', id: 'chemical-materials', variant: 'alternative',
    title: 'Chemische Stoffe', referenceAsset: '4.1.8_Chemische Stoffe_Alternative.svg', color: 'rot',
    d: 'M 16 8 L 5 24 H 27 Z M 20 13 C 18 11 13 11 12 16 C 11 21 17 22 20 19',
  }),
] as const);
