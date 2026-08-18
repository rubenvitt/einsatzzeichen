import { PALETTE, type ColorPalette } from '@einsatzzeichen/schema';
import { REFERENCE_THEME, type RenderTheme } from '@einsatzzeichen/core';
import { deepFreeze } from './readonly-data.js';

const ACCESSIBLE_LIGHT_PALETTE: ColorPalette = deepFreeze({
  ...PALETTE,
  /**
   * Einzige Referenzfarbe unter 3:1 zu schwarzem Piktogramm-Ink; der Ersatzwert bleibt klar
   * blau und erreicht 4,53:1 gegen Schwarz. Das Referenztheme bleibt davon unberührt.
   *
   * **Nachgezogen mit Anhang E (12.08.2026):** Der vorherige Wert `#4a73d9` war allein auf
   * schwarzen Ink hin gewählt (4,75:1) und verfehlte gegen **weissen** Text 4,5:1 knapp — er
   * erreichte 4,425:1. Die 16 Zeichen aus E-a setzen ihre Kürzel weiss auf die Körperfläche und
   * sind damit die ersten Katalogzeichen, für die diese Richtung überhaupt eine Anforderung ist.
   * (Seit dem Teilslice E-b, 17.08.2026, sind es 28 Zeichen. Die Anforderung ist dieselbe und der
   * Farbwert unverändert — die Messung oben stammt vom 12.08.2026 und wird nicht nachdatiert.)
   * Beide Richtungen zugleich lassen nur ein schmales Fenster zu: Weiss ≥ 4,5:1 verlangt eine
   * Relativluminanz ≤ 0,1833, Schwarz ≥ 3:1 eine ≥ 0,1. `#4970d2` liegt mit 0,1766 darin und
   * erfüllt beide Richtungen (weiss 4,63:1, schwarz 4,53:1). Derselbe Befundtyp wie `hellblau`
   * im Drucktheme unten — eine neue Zeichenklasse deckt eine Farbanforderung auf, die vorher
   * niemand stellte.
   */
  blau: '#4970d2',
} satisfies ColorPalette);

const PRINT_MONOCHROME_PALETTE: ColorPalette = deepFreeze({
  schwarz: '#000000',
  weiss: '#ffffff',
  rot: '#666666',
  /**
   * **Nachgezogen mit Anhang E (12.08.2026):** `#777777` erreichte gegen weissen Text 4,478:1
   * und verfehlte die Textschwelle von 4,5:1 um 0,022 — unauffällig, solange kein Zeichen weisse
   * Schrift auf die Organisationsfarbe setzte. Die 16 Zeichen aus E-a tun genau das; seit dem
   * Teilslice E-b (17.08.2026) sind es 28 — Anforderung und Farbwert bleiben dieselben.
   * `#767676` erreicht 4,54:1 gegen Weiss und 4,62:1 gegen Schwarz und hält den geforderten
   * Helligkeitsabstand zu den übrigen Organisationsgrauwerten (0,0483 zu `rot` `#666666`,
   * gefordert > 0,045) — der knappste der sechs Abstände, deshalb hier und nicht dunkler.
   */
  blau: '#767676',
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
  /**
   * `hilfsorganisation` (Kapitel 2.2), seit LFH-424. Hier trägt die Signatur mehr als bei den
   * übrigen sieben: `weiss` ist im Bestand zugleich die neutrale Grundfüllung, ein Körper mit
   * dieser Organisation ist farblich also von einem organisationslosen nicht zu unterscheiden.
   * Der zweite Kanal ist damit der einzige. Eine feine Punktreihe, eindeutig gegen alle sieben
   * bestehenden Signaturen.
   */
  weiss: [1, 2],
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
