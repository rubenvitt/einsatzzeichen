import type { ColorToken, Primitive } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import {
  defineState,
  type CatalogPictogramDefinition,
  type PictogramContrastPair,
} from '../catalog-definition.js';
import { stateCircle, statePath } from './authoring.js';

const TACTICAL_BLACK_WIDTH = 1;
const TACTICAL_COLOR_WIDTH = 0.55;
const SIGNAL_BLACK_WIDTH = 1;
const SIGNAL_COLOR_WIDTH = 0.55;

/** Schwarzer Halo ist der sichtbare Trenner zwischen Farbe und ihrer Umgebung. */
function haloStroke(d: string, color: ColorToken): readonly Primitive[] {
  return [
    statePath(d, {
      fill: 'none',
      stroke: 'schwarz',
      strokeWidth: TACTICAL_BLACK_WIDTH,
    }),
    statePath(d, {
      fill: 'none',
      stroke: color,
      strokeWidth: TACTICAL_COLOR_WIDTH,
    }),
  ];
}

/** Weisse Innenflaeche, schwarze Kontur und schmalere farbige Signallinie. */
function framedStroke(d: string, color: ColorToken): readonly Primitive[] {
  return [
    statePath(d, {
      fill: 'weiss',
      stroke: 'schwarz',
      strokeWidth: SIGNAL_BLACK_WIDTH,
    }),
    statePath(d, {
      fill: 'none',
      stroke: color,
      strokeWidth: SIGNAL_COLOR_WIDTH,
    }),
  ];
}

function filledSignalCircle(cx: number, cy: number, r: number): Primitive {
  return stateCircle(cx, cy, r, {
    fill: 'rot',
    stroke: 'schwarz',
    strokeWidth: 0.5,
  });
}

function filledSignalPath(d: string): Primitive {
  return statePath(d, {
    fill: 'rot',
    stroke: 'schwarz',
    strokeWidth: 0.5,
  });
}

const TACTICAL_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'Schwarzer Aussenhalo der freistehenden Taktikmarke',
  },
  {
    foreground: 'schwarz',
    background: 'rot',
    context: 'Schwarzer Halo an der roten Taktikmarke',
  },
  {
    foreground: 'schwarz',
    background: 'hellblau',
    context: 'Schwarzer Halo am blauen Richtungselement',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

const WATER_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'Schwarze Aussenkontur des Wasserzeichens',
  },
  {
    foreground: 'schwarz',
    background: 'weiss',
    context: 'Schwarze Kontur auf weisser Innenflaeche',
  },
  {
    foreground: 'schwarz',
    background: 'hellblau',
    context: 'Schwarzer Halo an blauer Wassergeometrie',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

const SIGNAL_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'Schwarze Aussenkontur des Gefahrzeichens',
  },
  {
    foreground: 'schwarz',
    background: 'weiss',
    context: 'Schwarze Gefahrkontur auf weisser Innenflaeche',
  },
  {
    foreground: 'schwarz',
    background: 'rot',
    context: 'Schwarze Kontur an roter Signalgeometrie',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

const FREE_SIGNAL_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'Schwarzer Halo der freistehenden Signalform',
  },
  {
    foreground: 'schwarz',
    background: 'rot',
    context: 'Schwarzer Halo an roter Signalgeometrie',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

const TRIANGLE = 'M 16 2 L 30 29 H 2 Z';
const FLOOD_OVAL =
  'M 2 16 C 2 8 8 3 16 3 C 24 3 30 8 30 16 C 30 24 24 29 16 29 C 8 29 2 24 2 16 Z';

const TACTIC_GEOMETRY = {
  rescue: {
    boundary: 'M 8 4 L 4 7 V 25 L 8 28',
    boundaryColor: 'rot',
    arrow:
      'M 8 8 C 13 11 17 12 21 12 L 21 8 L 29 16 L 21 24 L 21 20 C 17 20 13 21 8 24',
    arrowColor: 'hellblau',
  },
  attack: {
    boundary: 'M 24 4 L 28 7 V 25 L 24 28',
    boundaryColor: 'rot',
    arrow:
      'M 4 8 C 10 11 14 12 19 12 L 19 8 L 25 16 L 19 24 L 19 20 C 14 20 10 21 4 24',
    arrowColor: 'hellblau',
  },
  defense: {
    boundary: 'M 28 4 L 24 7 V 25 L 28 28',
    boundaryColor: 'hellblau',
    arrow:
      'M 3 8 C 9 11 13 12 17 12 L 17 8 L 23 16 L 17 24 L 17 20 C 13 20 9 21 3 24',
    arrowColor: 'rot',
  },
  retreat: {
    boundary: 'M 3 4 L 7 7 V 25 L 3 28',
    boundaryColor: 'rot',
    arrow:
      'M 10 8 C 15 11 19 12 23 12 L 23 8 L 30 16 L 23 24 L 23 20 C 19 20 15 21 10 24',
    arrowColor: 'hellblau',
  },
} as const;

type TacticKind = keyof typeof TACTIC_GEOMETRY;

function tacticalPrimitives(kind: TacticKind): readonly Primitive[] {
  const geometry = TACTIC_GEOMETRY[kind];
  return [
    ...haloStroke(geometry.boundary, geometry.boundaryColor),
    ...haloStroke(geometry.arrow, geometry.arrowColor),
  ];
}

function floodedAreaPrimitives(): readonly Primitive[] {
  const waves =
    'M 7 9 C 8 9 8.5 7 10 7 C 11.5 7 12 9 13 9 ' +
    'M 19 9 C 20 9 20.5 7 22 7 C 23.5 7 24 9 25 9 ' +
    'M 5 16 C 6.5 16 7 14 8.5 14 C 10 14 10.5 16 12 16 ' +
    'M 20 16 C 21.5 16 22 14 23.5 14 C 25 14 25.5 16 27 16 ' +
    'M 7 23 C 8 23 8.5 21 10 21 C 11.5 21 12 23 13 23 ' +
    'M 19 23 C 20 23 20.5 21 22 21 C 23.5 21 24 23 25 23';
  const waterInitial = 'M 12 12 L 14.5 21 L 16 16 L 17.5 21 L 20 12';
  return [
    ...framedStroke(FLOOD_OVAL, 'hellblau'),
    ...haloStroke(waves, 'hellblau'),
    ...haloStroke(waterInitial, 'hellblau'),
  ];
}

function waterIngressPrimitives(): readonly Primitive[] {
  const waves =
    'M 8 18 C 10 16 12 16 14 18 C 16 20 18 20 20 18 C 22 16 24 16 26 18 ' +
    'M 8 22 C 10 20 12 20 14 22 C 16 24 18 24 20 22 C 22 20 24 20 26 22';
  return [
    ...framedStroke(TRIANGLE, 'hellblau'),
    ...haloStroke(waves, 'hellblau'),
  ];
}

function suspectedPrimaryPrimitives(): readonly Primitive[] {
  const question =
    'M 8 9 C 9 5 12 4 16 4 C 21 4 24 7 24 11 ' +
    'C 24 15 21 17 18 18.5 C 15 20 14 21.5 14 24';
  return [...haloStroke(question, 'rot'), filledSignalCircle(14, 28, 1)];
}

function suspectedAlternativePrimitives(): readonly Primitive[] {
  const question =
    'M 11 12 C 12 9 14 8 16.5 8 C 20 8 22 10 22 13 ' +
    'C 22 16 20 17 17.5 18.5 C 16 19.5 15.5 20.5 15.5 22';
  return [
    ...framedStroke(TRIANGLE, 'rot'),
    ...haloStroke(question, 'rot'),
    filledSignalCircle(15.5, 25, 1),
  ];
}

function acutePrimaryPrimitives(): readonly Primitive[] {
  return [
    filledSignalPath('M 15 5 H 17 V 23 H 15 Z'),
    filledSignalCircle(16, 28, 1.5),
  ];
}

function acuteAlternativePrimitives(): readonly Primitive[] {
  return [
    ...framedStroke(TRIANGLE, 'rot'),
    filledSignalPath('M 15 8 H 17 V 21 H 15 Z'),
    filledSignalCircle(16, 25, 1.2),
  ];
}

export const TACTICS_HAZARDS_STATES = deepFreeze([
  defineState({
    section: '5.8.1.1',
    id: 'tactical-rescue',
    title: 'Einsatztaktik: Retten',
    referenceAsset: '5.8.1.1_Einsatztaktik_Retten.svg',
    box: { xMm: 4, yMm: 4, widthMm: 25, heightMm: 24 },
    contrastPairs: TACTICAL_CONTRAST,
    primitives: tacticalPrimitives('rescue'),
  }),
  defineState({
    section: '5.8.1.2',
    id: 'tactical-attack',
    title: 'Einsatztaktik: Angreifen',
    referenceAsset: '5.8.1.2_Einsatztaktik_Angreifen.svg',
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
    contrastPairs: TACTICAL_CONTRAST,
    primitives: tacticalPrimitives('attack'),
  }),
  defineState({
    section: '5.8.1.3',
    id: 'tactical-defense',
    title: 'Einsatztaktik: Verteidigen',
    referenceAsset: '5.8.1.3_Einsatztaktik_Verteidigen.svg',
    box: { xMm: 3, yMm: 4, widthMm: 25, heightMm: 24 },
    contrastPairs: TACTICAL_CONTRAST,
    primitives: tacticalPrimitives('defense'),
  }),
  defineState({
    section: '5.8.1.4',
    id: 'tactical-retreat',
    title: 'Einsatztaktik: Rückzug',
    referenceAsset: '5.8.1.4_Einsatztaktik_Rückzug.svg',
    box: { xMm: 3, yMm: 4, widthMm: 27, heightMm: 24 },
    contrastPairs: TACTICAL_CONTRAST,
    primitives: tacticalPrimitives('retreat'),
  }),
  defineState({
    section: '5.8.1.5',
    id: 'flooded-area',
    title: 'Überschwemmtes Gebiet',
    referenceAsset: '5.8.1.5_Überschwemmtes Gebiet.svg',
    box: { xMm: 2, yMm: 3, widthMm: 28, heightMm: 26 },
    contrastPairs: WATER_CONTRAST,
    primitives: floodedAreaPrimitives(),
  }),
  defineState({
    section: '5.8.1.6',
    id: 'water-ingress-hazard',
    title: 'Gefahr durch Wassereinbruch',
    referenceAsset: '5.8.1.6_Gefahr durch Wassereinbruch.svg',
    box: { xMm: 2, yMm: 2, widthMm: 28, heightMm: 27 },
    contrastPairs: WATER_CONTRAST,
    primitives: waterIngressPrimitives(),
  }),
  defineState({
    section: '5.8.1.13',
    id: 'suspected-situation',
    title: 'Hinweis auf Vermutung',
    referenceAsset: '5.8.1.13_Hinweis auf Vermutung.svg',
    box: { xMm: 8, yMm: 4, widthMm: 16, heightMm: 25 },
    contrastPairs: FREE_SIGNAL_CONTRAST,
    primitives: suspectedPrimaryPrimitives(),
  }),
  defineState({
    section: '5.8.1.13',
    id: 'suspected-situation',
    variant: 'alternative',
    title: 'Hinweis auf Vermutung',
    referenceAsset: '5.8.1.13_Hinweis auf Vermutung_2.svg',
    box: { xMm: 2, yMm: 2, widthMm: 28, heightMm: 27 },
    contrastPairs: SIGNAL_CONTRAST,
    primitives: suspectedAlternativePrimitives(),
  }),
  defineState({
    section: '5.8.1.14',
    id: 'acute-situation',
    title: 'Hinweis auf akute Situation',
    referenceAsset: '5.8.1.14_Hinweis auf akute Situation.svg',
    box: { xMm: 14.5, yMm: 5, widthMm: 3, heightMm: 24.5 },
    contrastPairs: FREE_SIGNAL_CONTRAST,
    primitives: acutePrimaryPrimitives(),
  }),
  defineState({
    section: '5.8.1.14',
    id: 'acute-situation',
    variant: 'alternative',
    title: 'Hinweis auf akute Situation',
    referenceAsset: '5.8.1.14_Hinweis auf akute Situation_2.svg',
    box: { xMm: 2, yMm: 2, widthMm: 28, heightMm: 27 },
    contrastPairs: SIGNAL_CONTRAST,
    primitives: acuteAlternativePrimitives(),
  }),
] satisfies readonly CatalogPictogramDefinition[]);
