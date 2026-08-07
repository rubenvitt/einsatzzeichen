import { deepFreeze } from '../../readonly-data.js';
import { strokeCapability as icon } from '../authoring.js';

export const VETERINARY_CAPABILITIES = deepFreeze([
  icon({
    section: '4.10.1',
    id: 'veterinary',
    title: 'Veterinärwesen',
    referenceAsset: '4.10.1_Veterinärwesen.svg',
    d: 'M 7 8 H 11 L 16 24 L 21 8 H 25',
  }),
  icon({
    section: '4.10.2',
    id: 'slaughter-culling',
    title: 'Schlachten / Keulen',
    referenceAsset: '4.10.2_Schlachten_Keulen.svg',
    d: 'M 5 13 H 27 M 9 13 L 13 8 L 17 13 Z M 11 16 H 21',
  }),
  icon({
    section: '4.10.3',
    id: 'chicken',
    title: 'Huhn',
    referenceAsset: '4.10.3_Huhn.svg',
    d: 'M 7 8 H 11 L 16 24 L 21 8 H 25 M 5 21 C 7 18 8 22 10 19 C 12 21 12 24 9 24 M 7 18 L 6 16 M 9 18 L 10 16',
  }),
  icon({
    section: '4.10.4',
    id: 'horse',
    title: 'Pferd',
    referenceAsset: '4.10.4_Pferd.svg',
    d: 'M 7 8 H 11 L 16 24 L 21 8 H 25 M 5 23 C 4 20 5 16 8 17 C 10 18 9 21 8 23 M 4 24 H 10',
  }),
  icon({
    section: '4.10.5',
    id: 'cattle',
    title: 'Rind',
    referenceAsset: '4.10.5_Rind.svg',
    d: 'M 7 8 H 11 L 16 24 L 21 8 H 25 M 5 19 C 6 16 8 16 9 19 C 10 16 12 16 13 19 M 5 19 L 6 23 M 13 19 L 12 23 M 7 21 H 11',
  }),
  icon({
    section: '4.10.6',
    id: 'sheep',
    title: 'Schaf',
    referenceAsset: '4.10.6_Schaf.svg',
    d: 'M 7 8 H 11 L 16 24 L 21 8 H 25 M 5 21 C 4 18 6 16 8 18 C 9 15 12 16 12 19 C 15 20 13 24 10 23 C 8 24 5 24 5 21 Z',
  }),
  icon({
    section: '4.10.7',
    id: 'pig',
    title: 'Schwein',
    referenceAsset: '4.10.7_Schwein.svg',
    d: 'M 7 8 H 11 L 16 24 L 21 8 H 25 M 5 20 C 5 16 13 16 13 20 C 13 24 5 24 5 20 Z M 7 20 C 7 19 8 19 8 20 C 8 21 7 21 7 20 M 10 20 C 10 19 11 19 11 20 C 11 21 10 21 10 20',
  }),
] as const);
