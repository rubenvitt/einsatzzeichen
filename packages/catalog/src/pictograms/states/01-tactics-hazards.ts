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

function haloCircleStroke(
  cx: number,
  cy: number,
  r: number,
  color: ColorToken,
): readonly Primitive[] {
  return [
    stateCircle(cx, cy, r, {
      fill: 'none',
      stroke: 'schwarz',
      strokeWidth: SIGNAL_BLACK_WIDTH,
    }),
    stateCircle(cx, cy, r, {
      fill: 'none',
      stroke: color,
      strokeWidth: SIGNAL_COLOR_WIDTH,
    }),
  ];
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

function hazardousSubstancesPrimaryPrimitives(): readonly Primitive[] {
  const glyph =
    'M 13 11 C 12 9 10.5 8 9 8 C 6 8 5 11 5 16 C 5 21 6.5 24 10 24 ' +
    'C 12 24 13.5 23 14 21 V 16 H 10 ' +
    'M 26 10 C 24 8 20 8 18 10 C 16 12 17 14 20 15 L 23 16 ' +
    'C 26 17 26 21 24 23 C 22 25 18 24 16 22';
  return [...framedStroke(TRIANGLE, 'rot'), ...haloStroke(glyph, 'rot')];
}

function hazardousSubstancesAlternativePrimitives(): readonly Primitive[] {
  const glyph =
    'M 11.2 14 H 10 Q 9 14 9 17.5 Q 9 21 10 21 H 11.2 ' +
    'M 11.8 14 V 21 M 14 14 V 21 M 11.8 17.5 H 14 ' +
    'M 14.6 14 V 21 H 16.8 ' +
    'M 17.4 17.5 Q 17.4 14 18.6 14 Q 19.8 14 19.8 17.5 ' +
    'Q 19.8 21 18.6 21 Q 17.4 21 17.4 17.5 ' +
    'M 20.5 21 V 14 H 21.8 Q 23 14 23 16 Q 23 18 21.8 18 H 20.5 ' +
    'M 21.8 18 L 23.2 21';
  return [...framedStroke(TRIANGLE, 'rot'), ...haloStroke(glyph, 'rot')];
}

function radioactivityPrimaryPrimitives(): readonly Primitive[] {
  return [
    ...framedStroke(TRIANGLE, 'rot'),
    ...haloStroke('M 10 24 L 16 8 L 22 24 M 12 19 H 20', 'rot'),
  ];
}

function radioactivityAlternativePrimitives(): readonly Primitive[] {
  return [
    ...framedStroke(TRIANGLE, 'rot'),
    filledSignalPath(
      'M 14.5 15.2 C 12.8 12.8 12.5 9.2 14 6 C 14.8 4.6 17.2 4.6 18 6 ' +
        'C 19.5 9.2 19.2 12.8 17.5 15.2 C 16.6 14.8 15.4 14.8 14.5 15.2 Z',
    ),
    filledSignalPath(
      'M 13.8 17 C 10.8 16.4 7.6 17.4 5.5 20 C 4.6 21.2 5.8 23.4 7.4 23.6 ' +
        'C 10.9 24 13.8 22.2 15 19.5 C 14.3 18.8 14 17.9 13.8 17 Z',
    ),
    filledSignalPath(
      'M 18.2 17 C 21.2 16.4 24.4 17.4 26.5 20 C 27.4 21.2 26.2 23.4 24.6 23.6 ' +
        'C 21.1 24 18.2 22.2 17 19.5 C 17.7 18.8 18 17.9 18.2 17 Z',
    ),
    filledSignalCircle(16, 18, 1.4),
  ];
}

function electricalEnergyPrimitives(): readonly Primitive[] {
  return [
    ...framedStroke(TRIANGLE, 'rot'),
    filledSignalPath('M 16 7 L 11 16 L 16 15 L 13 25 L 22 14 L 17 15 L 20 7 Z'),
  ];
}

function mineralOilPrimitives(): readonly Primitive[] {
  const letter =
    'M 11 16 C 11 11 13 9 16 9 C 19 9 21 11 21 16 ' +
    'C 21 21 19 23 16 23 C 13 23 11 21 11 16 Z';
  return [
    ...framedStroke(TRIANGLE, 'rot'),
    ...haloStroke(letter, 'rot'),
    filledSignalCircle(14, 6.5, 0.8),
    filledSignalCircle(18, 6.5, 0.8),
  ];
}

function explosionPrimitives(): readonly Primitive[] {
  const glyph =
    'M 9 9 H 16 M 9 9 V 23 M 9 16 H 15 M 9 23 H 16 ' +
    'M 18 12 L 25 23 M 25 12 L 18 23';
  return [...framedStroke(TRIANGLE, 'rot'), ...haloStroke(glyph, 'rot')];
}

function explosiveOrdnancePrimitives(): readonly Primitive[] {
  return [
    ...framedStroke(TRIANGLE, 'rot'),
    ...haloCircleStroke(16, 17, 5, 'rot'),
    filledSignalCircle(16, 17, 3),
    ...haloStroke('M 11.5 12.5 L 9 10 M 20.5 12.5 L 23 10', 'rot'),
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
    section: '5.8.1.7',
    id: 'hazardous-substances',
    title: 'Gefährliche Stoffe',
    referenceAsset: '5.8.1.7_Gefährliche Stoffe.svg',
    box: { xMm: 2, yMm: 2, widthMm: 28, heightMm: 27 },
    contrastPairs: SIGNAL_CONTRAST,
    primitives: hazardousSubstancesPrimaryPrimitives(),
  }),
  defineState({
    section: '5.8.1.7',
    id: 'hazardous-substances',
    variant: 'alternative',
    title: 'Gefährliche Stoffe',
    referenceAsset: '5.8.1.7_Gefährliche Stoffe_Chlor.svg',
    box: { xMm: 2, yMm: 2, widthMm: 28, heightMm: 27 },
    contrastPairs: SIGNAL_CONTRAST,
    primitives: hazardousSubstancesAlternativePrimitives(),
  }),
  defineState({
    section: '5.8.1.8',
    id: 'radioactivity-hazard',
    title: 'Gefahr durch Radioaktivität',
    referenceAsset: '5.8.1.8_Gefahr durch Radioaktivität.svg',
    box: { xMm: 2, yMm: 2, widthMm: 28, heightMm: 27 },
    contrastPairs: SIGNAL_CONTRAST,
    primitives: radioactivityPrimaryPrimitives(),
  }),
  defineState({
    section: '5.8.1.8',
    id: 'radioactivity-hazard',
    variant: 'alternative',
    title: 'Gefahr durch Radioaktivität',
    referenceAsset: '5.8.1.8_Gefahr durch Radioaktivität _A.svg',
    box: { xMm: 2, yMm: 2, widthMm: 28, heightMm: 27 },
    contrastPairs: SIGNAL_CONTRAST,
    primitives: radioactivityAlternativePrimitives(),
  }),
  defineState({
    section: '5.8.1.9',
    id: 'electrical-energy-hazard',
    title: 'Gefahr durch elektrische Energie',
    referenceAsset: '5.8.1.9_Gefahr durch elektrische Energie.svg',
    box: { xMm: 2, yMm: 2, widthMm: 28, heightMm: 27 },
    contrastPairs: SIGNAL_CONTRAST,
    primitives: electricalEnergyPrimitives(),
  }),
  defineState({
    section: '5.8.1.10',
    id: 'mineral-oil-hazard',
    title: 'Gefahr durch Mineralöl',
    referenceAsset: '5.8.1.10_Gefahr durch Mineralöl.svg',
    box: { xMm: 2, yMm: 2, widthMm: 28, heightMm: 27 },
    contrastPairs: SIGNAL_CONTRAST,
    primitives: mineralOilPrimitives(),
  }),
  defineState({
    section: '5.8.1.11',
    id: 'explosion-hazard',
    title: 'Gefahr durch Explosion',
    referenceAsset: '5.8.1.11_Gefahr durch Explosion.svg',
    box: { xMm: 2, yMm: 2, widthMm: 28, heightMm: 27 },
    contrastPairs: SIGNAL_CONTRAST,
    primitives: explosionPrimitives(),
  }),
  defineState({
    section: '5.8.1.12',
    id: 'explosive-ordnance-hazard',
    title: 'Gefahr durch explosionsfähige Kampfmittel',
    referenceAsset: '5.8.1.12_Gefahr durch explosionsfähige Kampfmittel.svg',
    box: { xMm: 2, yMm: 2, widthMm: 28, heightMm: 27 },
    contrastPairs: SIGNAL_CONTRAST,
    primitives: explosiveOrdnancePrimitives(),
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
