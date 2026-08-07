import type { Primitive } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import {
  defineState,
  type CatalogPictogramDefinition,
  type PictogramContrastPair,
} from '../catalog-definition.js';
import { STATE_BLACK_FILL, stateCircle, stateLine, statePath } from './authoring.js';

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
] satisfies readonly CatalogPictogramDefinition[]);
