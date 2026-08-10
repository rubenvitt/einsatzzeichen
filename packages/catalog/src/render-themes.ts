import { PALETTE, type ColorPalette } from '@einsatzzeichen/schema';
import { REFERENCE_THEME, type RenderTheme } from '@einsatzzeichen/core';
import { deepFreeze } from './readonly-data.js';

const ACCESSIBLE_LIGHT_PALETTE: ColorPalette = deepFreeze({
  ...PALETTE,
  // Einzige aktuelle Referenzfarbe unter 3:1 zu schwarzem Piktogramm-Ink. Der neue Wert bleibt
  // klar blau, erreicht aber 4,75:1. Das Referenztheme bleibt davon vollständig unberührt.
  blau: '#4a73d9',
} satisfies ColorPalette);

const PRINT_MONOCHROME_PALETTE: ColorPalette = deepFreeze({
  schwarz: '#000000',
  weiss: '#ffffff',
  rot: '#666666',
  blau: '#777777',
  gelb: '#dddddd',
  gruen: '#888888',
  hellgruen: '#cccccc',
  orange: '#aaaaaa',
  braun: '#999999',
  grau: '#5f5f5f',
  hellgrau: '#bbbbbb',
  // Anhang M setzt in M.12 bis M.14 hellblaue Geometrie ohne schwarze Kontur direkt auf die
  // Oberfläche. Mit dem früheren #eeeeee erreichte sie dort 1,16:1 und wäre im Druck praktisch
  // unsichtbar gewesen. #808080 ist zweiseitig gebunden: 3,95:1 gegen die weisse Oberfläche und
  // 5,32:1 gegen Schwarz — letzteres fordern die bestehenden Paare der Zustandszeichen, die
  // schwarze Kontur an blauer Wassergeometrie führen.
  hellblau: '#808080',
} satisfies ColorPalette);

/**
 * Zweiter visueller Kanal neben der Füllfarbe. Ein leerer Wert bedeutet bewusst „durchgezogen“;
 * alle anderen Signaturen sind in Millimetern angegeben und bleiben beim Skalieren stabil.
 */
export const ORGANIZATION_BODY_DASHES = deepFreeze({
  rot: [],
  blau: [2, 1.5],
  gelb: [4, 2],
  gruen: [6, 2],
  orange: [6, 2, 1, 2],
  braun: [2, 2, 2, 4],
  hellgrau: [8, 2],
} as const);

export const ACCESSIBLE_LIGHT_THEME: RenderTheme = deepFreeze({
  id: 'accessible-light',
  palette: ACCESSIBLE_LIGHT_PALETTE,
  surface: '#ffffff',
  bodyStrokeDashes: ORGANIZATION_BODY_DASHES,
} satisfies RenderTheme);

export const PRINT_MONOCHROME_THEME: RenderTheme = deepFreeze({
  id: 'print-monochrome',
  palette: PRINT_MONOCHROME_PALETTE,
  surface: '#ffffff',
  bodyStrokeDashes: ORGANIZATION_BODY_DASHES,
} satisfies RenderTheme);

export const RENDER_THEMES = deepFreeze({
  reference: REFERENCE_THEME,
  'accessible-light': ACCESSIBLE_LIGHT_THEME,
  'print-monochrome': PRINT_MONOCHROME_THEME,
} as const satisfies Record<string, RenderTheme>);

export type RenderThemeId = keyof typeof RENDER_THEMES;

export function isRenderThemeId(value: string): value is RenderThemeId {
  return Object.hasOwn(RENDER_THEMES, value);
}

export function renderTheme(id: RenderThemeId): RenderTheme {
  return RENDER_THEMES[id];
}
