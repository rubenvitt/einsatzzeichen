import { deepFreeze } from '../../readonly-data.js';
import {
  defineState,
  type CatalogPictogramDefinition,
  type PictogramContrastPair,
} from '../catalog-definition.js';
import { stateLine } from './authoring.js';

const ACCESS_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'Verkehrs- oder Zugangssymbol auf Ausgabeoberfläche',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

export const ACCESS_STATES = deepFreeze([
  defineState({
    section: '5.8.9.1',
    id: 'route-closed',
    title: 'Gesperrt',
    referenceAsset: '5.8.9.1_Gesperrt.svg',
    box: { xMm: 10, yMm: 2, widthMm: 12, heightMm: 28 },
    contrastPairs: ACCESS_CONTRAST,
    primitives: [
      stateLine(16, 2, 16, 30),
      stateLine(10, 10, 22, 22),
      stateLine(22, 10, 10, 22),
    ],
  }),
  defineState({
    section: '5.8.9.2',
    id: 'one-way-traffic',
    title: 'Einbahnstraßenregelung',
    referenceAsset: '5.8.9.2_Einbahnstraßenregelung.svg',
    box: { xMm: 8, yMm: 2, widthMm: 13, heightMm: 28 },
    contrastPairs: ACCESS_CONTRAST,
    primitives: [
      stateLine(8, 2, 8, 30),
      stateLine(16, 5, 16, 27),
      stateLine(16, 5, 21, 14),
    ],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
