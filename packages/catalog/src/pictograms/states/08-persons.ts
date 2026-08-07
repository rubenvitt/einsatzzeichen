import type { Primitive } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import {
  defineState,
  type CatalogPictogramDefinition,
  type PictogramContrastPair,
} from '../catalog-definition.js';
import {
  STATE_BLACK_FILL,
  stateCircle,
  stateLine,
  statePath,
  statePolyline,
} from './authoring.js';

const PERSON_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'Personendiamant und Zustandsmarke auf Ausgabeoberfläche',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

function personDiamond(yOffsetMm = 0): Primitive {
  const top = 4 + yOffsetMm;
  const middle = 15 + yOffsetMm;
  const bottom = 26 + yOffsetMm;
  return statePath(`M 16 ${top} L 27 ${middle} L 16 ${bottom} L 5 ${middle} Z`);
}

function injuryMark(yOffsetMm = 0): Primitive {
  return stateLine(16, 4 + yOffsetMm, 16, 26 + yOffsetMm);
}

function waterPersonDiamond(): Primitive {
  return statePath('M 16 10 L 27 20.5 L 16 31 L 5 20.5 Z');
}

export const PERSON_STATES = deepFreeze([
  defineState({
    section: '5.8.8.1',
    id: 'person-uninjured',
    title: 'Person unverletzt',
    referenceAsset: '5.8.8.1_Person Unverletz.svg',
    box: { xMm: 5, yMm: 4, widthMm: 22, heightMm: 22 },
    contrastPairs: PERSON_CONTRAST,
    primitives: [personDiamond()],
  }),
  defineState({
    section: '5.8.8.2',
    id: 'person-affected',
    title: 'Person betroffen',
    referenceAsset: '5.8.8.2_Person Betroffen.svg',
    box: { xMm: 5, yMm: 2.5, widthMm: 26, heightMm: 23.5 },
    contrastPairs: PERSON_CONTRAST,
    primitives: [
      personDiamond(),
      statePath(
        'M 27.5 2.5 V 10.5 M 27.5 2.5 H 29.25 C 31 2.5 31 6.5 29.25 6.5 H 27.5 M 29.25 6.5 C 31 6.5 31 10.5 29.25 10.5 H 27.5',
      ),
    ],
  }),
  defineState({
    section: '5.8.8.3',
    id: 'person-injured',
    title: 'Person verletzt',
    referenceAsset: '5.8.8.3_Person Verletzt.svg',
    box: { xMm: 5, yMm: 4, widthMm: 22, heightMm: 22 },
    contrastPairs: PERSON_CONTRAST,
    primitives: [personDiamond(), injuryMark()],
  }),
  defineState({
    section: '5.8.8.4',
    id: 'person-injured-triage-category',
    title: 'Person verletzt - Sichtungskategorie',
    referenceAsset: '5.8.8.4_Person Verletzt_Sichtungskategorie.svg',
    box: { xMm: 1.5, yMm: 4, widthMm: 25.5, heightMm: 27 },
    contrastPairs: PERSON_CONTRAST,
    primitives: [
      personDiamond(),
      injuryMark(),
      stateLine(1.5, 23.5, 5.5, 23.5),
      stateLine(3.5, 23.5, 3.5, 31),
      stateLine(1.5, 31, 5.5, 31),
      stateLine(6.5, 23.5, 10.5, 23.5),
      stateLine(8.5, 23.5, 8.5, 31),
      stateLine(6.5, 31, 10.5, 31),
    ],
  }),
  defineState({
    section: '5.8.8.5',
    id: 'person-injured-transport-priority',
    title: 'Person verletzt - Transportpriorität',
    referenceAsset: '5.8.8.5_Person Verletzt_Transportpriorität.svg',
    box: { xMm: 5, yMm: 2.5, widthMm: 26, heightMm: 23.5 },
    contrastPairs: PERSON_CONTRAST,
    primitives: [
      personDiamond(),
      injuryMark(),
      statePath('M 24.5 2.5 H 27.5 M 26 2.5 V 10.5'),
      statePath('M 28.5 10.5 V 2.5 H 29.5 C 31 2.5 31 6.5 29.5 6.5 H 28.5'),
    ],
  }),
  defineState({
    section: '5.8.8.6',
    id: 'person-contaminated',
    title: 'Person kontaminiert',
    referenceAsset: '5.8.8.6_Person Kontaminiert.svg',
    box: { xMm: 5, yMm: 2.5, widthMm: 26.5, heightMm: 23.5 },
    contrastPairs: PERSON_CONTRAST,
    primitives: [
      personDiamond(),
      injuryMark(),
      stateCircle(26.5, 4, 1.5, STATE_BLACK_FILL),
      stateCircle(30, 4, 1.5, STATE_BLACK_FILL),
      stateLine(26.5, 5.5, 30.5, 10.5),
      stateLine(30, 5.5, 25.5, 10.5),
    ],
  }),
  defineState({
    section: '5.8.8.6',
    id: 'person-contaminated',
    variant: 'alternative',
    title: 'Person kontaminiert',
    referenceAsset: '5.8.8.6_Person Kontaminiert_Alternative.svg',
    box: { xMm: 5, yMm: 2.5, widthMm: 26, heightMm: 23.5 },
    contrastPairs: PERSON_CONTRAST,
    primitives: [
      personDiamond(),
      injuryMark(),
      statePath('M 27.5 2.5 V 10.5 M 31 2.5 L 27.5 6.5 L 31 10.5'),
    ],
  }),
  defineState({
    section: '5.8.8.7',
    id: 'person-dead',
    title: 'Person tot',
    referenceAsset: '5.8.8.7_Person Tot.svg',
    box: { xMm: 5, yMm: 4, widthMm: 22, heightMm: 22 },
    contrastPairs: PERSON_CONTRAST,
    primitives: [personDiamond(), injuryMark(), stateLine(10.5, 9.5, 21.5, 9.5)],
  }),
  defineState({
    section: '5.8.8.8',
    id: 'person-missing',
    title: 'Person vermisst',
    referenceAsset: '5.8.8.8_Person Vermisst.svg',
    box: { xMm: 3, yMm: 3, widthMm: 26, heightMm: 26 },
    contrastPairs: PERSON_CONTRAST,
    primitives: [personDiamond(), stateLine(3, 10, 10, 3), stateLine(22, 29, 29, 22)],
  }),
  defineState({
    section: '5.8.8.9',
    id: 'person-in-water-danger',
    title: 'Person in Wassergefahr',
    referenceAsset: '5.8.8.9_Person in Wassergefahr.svg',
    box: { xMm: 4, yMm: 1, widthMm: 27, heightMm: 30 },
    contrastPairs: PERSON_CONTRAST,
    primitives: [
      waterPersonDiamond(),
      statePath('M 4 3.5 C 7 1 10 1 13 3.5 C 16 6 19 6 22 3.5 C 25 1 28 1 31 3.5'),
      statePath('M 4 7 C 7 4.5 10 4.5 13 7 C 16 9.5 19 9.5 22 7 C 25 4.5 28 4.5 31 7'),
    ],
  }),
  defineState({
    section: '5.8.8.10',
    id: 'person-in-distress',
    title: 'Person in Zwangslage',
    referenceAsset: '5.8.8.10_Person in Zwangslage.svg',
    box: { xMm: 3, yMm: 4, widthMm: 26, heightMm: 22 },
    contrastPairs: PERSON_CONTRAST,
    primitives: [personDiamond(), stateLine(3, 4, 29, 4)],
  }),
  defineState({
    section: '5.8.8.11',
    id: 'person-rescued',
    title: 'Person gerettet',
    referenceAsset: '5.8.8.11_Person gerettet.svg',
    box: { xMm: 3, yMm: 4, widthMm: 26, heightMm: 22 },
    contrastPairs: PERSON_CONTRAST,
    primitives: [personDiamond(), stateLine(3, 26, 29, 26)],
  }),
  defineState({
    section: '5.8.8.12',
    id: 'person-to-be-transported',
    title: 'Person zu transportieren',
    referenceAsset: '5.8.8.12_Person zu transportieren.svg',
    box: { xMm: 3, yMm: 2, widthMm: 27, heightMm: 27 },
    contrastPairs: PERSON_CONTRAST,
    primitives: [
      personDiamond(-2),
      stateLine(3, 24, 30, 24),
      stateLine(3, 19, 3, 29),
      statePolyline([[26, 20], [30, 24], [26, 28]]),
    ],
  }),
  defineState({
    section: '5.8.8.13',
    id: 'person-in-transport',
    title: 'Transport einer Person',
    referenceAsset: '5.8.8.13_Transport einer Person.svg',
    box: { xMm: 3, yMm: 2, widthMm: 27, heightMm: 26 },
    contrastPairs: PERSON_CONTRAST,
    primitives: [
      personDiamond(-2),
      stateLine(3, 24, 30, 24),
      statePolyline([[26, 20], [30, 24], [26, 28]]),
    ],
  }),
  defineState({
    section: '5.8.8.14',
    id: 'person-transported',
    title: 'Person transportiert',
    referenceAsset: '5.8.8.14_Person transportiert.svg',
    box: { xMm: 3, yMm: 2, widthMm: 27, heightMm: 27 },
    contrastPairs: PERSON_CONTRAST,
    primitives: [
      personDiamond(-2),
      stateLine(3, 24, 30, 24),
      statePolyline([[26, 20], [30, 24], [26, 28]]),
      stateLine(30, 19, 30, 29),
    ],
  }),
  defineState({
    section: '5.8.8.15',
    id: 'person-needing-special-care',
    title: 'Person besonders betreuungsbedürftig',
    referenceAsset: '5.8.8.15_Person besonders betreuungsbedürftig.svg',
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 27 },
    contrastPairs: PERSON_CONTRAST,
    primitives: [
      personDiamond(),
      stateLine(16, 4, 4, 31),
      stateLine(16, 4, 28, 31),
    ],
  }),
  defineState({
    section: '5.8.8.16',
    id: 'person-care-dependent',
    title: 'Person pflegebedürftig',
    referenceAsset: '5.8.8.16_Person pflegebedürftig.svg',
    box: { xMm: 5, yMm: 4, widthMm: 22, heightMm: 22 },
    contrastPairs: PERSON_CONTRAST,
    primitives: [personDiamond(), stateLine(5, 8, 5, 22)],
  }),
  defineState({
    section: '5.8.8.17',
    id: 'person-mobility-impaired',
    title: 'Person mobilitätseingeschränkt',
    referenceAsset: '5.8.8.17_Person mobilitätseingeschränkt.svg',
    box: { xMm: 5, yMm: 4, widthMm: 22, heightMm: 26.5 },
    contrastPairs: PERSON_CONTRAST,
    primitives: [
      personDiamond(),
      stateCircle(8, 28.5, 2),
      stateCircle(24, 28.5, 2),
    ],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
