import {
  PALETTE,
  type ColorPalette,
  type ColorToken,
  type RgbHex,
} from '@einsatzzeichen/schema';

/**
 * Farbvertrag am Rendererrand. `surface` ist der Untergrund, gegen den Kontrast zugesichert wird;
 * transparente SVGs können ihren späteren Untergrund nicht selbst erkennen.
 */
export interface RenderTheme {
  readonly id: string;
  readonly palette: ColorPalette;
  readonly surface: RgbHex;
  /**
   * Optionale, nicht-farbliche Organisationsmarke: Strich-/Lückenlängen in Millimetern für die
   * Körperkontur, adressiert über den semantischen Fülltoken des Körpers.
   */
  readonly bodyStrokeDashes?: Readonly<Partial<Record<ColorToken, readonly number[]>>>;
}

/** Unveränderte, aus dem BABZ-Referenzbestand extrahierte Darstellung. */
export const REFERENCE_THEME: RenderTheme = {
  id: 'reference',
  palette: PALETTE,
  surface: '#ffffff',
};

export function colorFor(theme: RenderTheme, token: ColorToken): RgbHex {
  return theme.palette[token];
}
