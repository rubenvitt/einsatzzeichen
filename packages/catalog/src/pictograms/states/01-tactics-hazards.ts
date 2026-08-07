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

export const TACTICS_HAZARDS_STATES = deepFreeze([
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
] satisfies readonly CatalogPictogramDefinition[]);
