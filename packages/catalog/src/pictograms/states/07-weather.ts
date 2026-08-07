import type { Point, Primitive, Style } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import { defineState, type CatalogPictogramDefinition } from '../catalog-definition.js';

const WEATHER_STROKE = {
  fill: 'none',
  stroke: 'schwarz',
  strokeWidth: 1.2,
} as const satisfies Style;

const WEATHER_WHITE = {
  fill: 'weiss',
  stroke: 'schwarz',
  strokeWidth: 1.2,
} as const satisfies Style;

const WEATHER_BLACK = {
  fill: 'schwarz',
  stroke: 'none',
} as const satisfies Style;

const SNOW_STROKE = {
  fill: 'none',
  stroke: 'schwarz',
  strokeWidth: 1.8,
} as const satisfies Style;

const BLACK_ON_SURFACE = [
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'schwarzes Wettermotiv auf Ausgabeoberfläche',
  },
] as const;

const BLACK_ON_WHITE_AND_SURFACE = [
  {
    foreground: 'schwarz',
    background: 'weiss',
    context: 'schwarze Wetterkontur auf weißer Innenfläche',
  },
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'schwarze Wetterkontur auf Ausgabeoberfläche',
  },
] as const;

function weatherLine(x1: number, y1: number, x2: number, y2: number): Primitive {
  return {
    type: 'line',
    role: 'pictogram',
    x1,
    y1,
    x2,
    y2,
    style: WEATHER_STROKE,
  };
}

function snowLine(x1: number, y1: number, x2: number, y2: number): Primitive {
  return {
    type: 'line',
    role: 'pictogram',
    x1,
    y1,
    x2,
    y2,
    style: SNOW_STROKE,
  };
}

function weatherPolyline(points: readonly Point[], closed = false): Primitive {
  return {
    type: 'polyline',
    role: 'pictogram',
    points,
    closed,
    style: WEATHER_STROKE,
  };
}

function weatherCircle(
  cx: number,
  cy: number,
  r: number,
  style: Style = WEATHER_STROKE,
): Primitive {
  return { type: 'circle', role: 'pictogram', cx, cy, r, style };
}

function weatherPath(d: string, style: Style): Primitive {
  return { type: 'path', role: 'pictogram', d, style };
}

function sunPrimitives(): readonly Primitive[] {
  return [
    weatherCircle(16, 16, 6),
    weatherLine(16, 3, 16, 7),
    weatherLine(16, 25, 16, 29),
    weatherLine(3, 16, 7, 16),
    weatherLine(25, 16, 29, 16),
    weatherLine(6, 6, 9, 9),
    weatherLine(23, 23, 26, 26),
    weatherLine(23, 9, 26, 6),
    weatherLine(6, 26, 9, 23),
  ];
}

function rainPrimitives(): readonly Primitive[] {
  return [7, 16, 25].flatMap((x) =>
    [4, 10, 16, 22].map((y) => weatherLine(x + 1, y, x - 1, y + 5)),
  );
}

function hailPrimitives(): readonly Primitive[] {
  return [8, 16, 24].flatMap((x) => [
    weatherLine(x + 1, 4, x - 1, 12),
    weatherCircle(x, 16, 2),
    weatherLine(x + 1, 20, x - 1, 28),
  ]);
}

function lightning(offsetX: number): Primitive {
  return weatherPolyline([
    [offsetX + 3, 4],
    [offsetX, 15],
    [offsetX + 4, 15],
    [offsetX + 1, 28],
    [offsetX + 8, 13],
    [offsetX + 4, 13],
    [offsetX + 7, 4],
  ]);
}

function snowPrimitives(): readonly Primitive[] {
  return [6.5, 16, 25.5].flatMap((cx) => [
    snowLine(cx, 11, cx, 21),
    snowLine(cx - 3, 13, cx + 3, 19),
    snowLine(cx - 3, 19, cx + 3, 13),
  ]);
}

export const WEATHER_STATES = deepFreeze([
  defineState({
    section: '5.8.7.1',
    id: 'weather-sunny',
    title: 'Sonnig',
    referenceAsset: '5.8.7.1_Sonnig.svg',
    box: { xMm: 3, yMm: 3, widthMm: 26, heightMm: 26 },
    contrastPairs: BLACK_ON_SURFACE,
    primitives: sunPrimitives(),
  }),
  defineState({
    section: '5.8.7.2',
    id: 'weather-cloudy',
    title: 'Wolkig',
    referenceAsset: '5.8.7.2_Wolkig.svg',
    box: { xMm: 4, yMm: 7, widthMm: 26, heightMm: 19 },
    contrastPairs: BLACK_ON_WHITE_AND_SURFACE,
    primitives: [
      weatherPath(
        'M 4 22 C 4 18 7 15 11 15 C 12 10 16 7 21 9 ' +
          'C 24 10 26 13 26 16 C 29 17 30 20 28 23 ' +
          'C 27 25 25 26 22 26 H 9 C 6 26 4 24 4 22 Z',
        WEATHER_WHITE,
      ),
    ],
  }),
  defineState({
    section: '5.8.7.3',
    id: 'weather-cloud-cover-four-eighths',
    title: 'Bedeckung des Himmels 4 von 8',
    referenceAsset: '5.8.7.3_Bedeckung des Himmels 4 von 8.svg',
    box: { xMm: 5, yMm: 5, widthMm: 22, heightMm: 22 },
    contrastPairs: BLACK_ON_WHITE_AND_SURFACE,
    primitives: [
      weatherCircle(16, 16, 11, WEATHER_WHITE),
      weatherPath(
        'M 16 5 C 10 5 5 10 5 16 C 5 22 10 27 16 27 Z',
        WEATHER_BLACK,
      ),
      weatherLine(16, 5, 16, 27),
    ],
  }),
  defineState({
    section: '5.8.7.4',
    id: 'weather-foggy',
    title: 'Nebelig',
    referenceAsset: '5.8.7.4_Nebelig.svg',
    box: { xMm: 4, yMm: 10, widthMm: 24, heightMm: 12 },
    contrastPairs: BLACK_ON_SURFACE,
    primitives: [
      weatherLine(4, 10, 28, 10),
      weatherLine(4, 16, 28, 16),
      weatherLine(4, 22, 28, 22),
    ],
  }),
  defineState({
    section: '5.8.7.5',
    id: 'weather-rainy',
    title: 'Regnerisch',
    referenceAsset: '5.8.7.5_Regnerisch.svg',
    box: { xMm: 6, yMm: 4, widthMm: 20, heightMm: 23 },
    contrastPairs: BLACK_ON_SURFACE,
    primitives: rainPrimitives(),
  }),
  defineState({
    section: '5.8.7.6',
    id: 'weather-hailing',
    title: 'Hagelnd',
    referenceAsset: '5.8.7.6_Hagelnd.svg',
    box: { xMm: 6, yMm: 4, widthMm: 20, heightMm: 24 },
    contrastPairs: BLACK_ON_SURFACE,
    primitives: hailPrimitives(),
  }),
  defineState({
    section: '5.8.7.7',
    id: 'weather-thunderstorm',
    title: 'Gewittrig',
    referenceAsset: '5.8.7.7_Gewittrig.svg',
    box: { xMm: 2, yMm: 4, widthMm: 26, heightMm: 24 },
    contrastPairs: BLACK_ON_SURFACE,
    primitives: [lightning(2), lightning(11), lightning(20)],
  }),
  defineState({
    section: '5.8.7.8',
    id: 'weather-snowing',
    title: 'Schneiend',
    referenceAsset: '5.8.7.8_Schneiend.svg',
    box: { xMm: 3.5, yMm: 11, widthMm: 25, heightMm: 10 },
    contrastPairs: BLACK_ON_SURFACE,
    primitives: snowPrimitives(),
  }),
] satisfies readonly CatalogPictogramDefinition[]);
