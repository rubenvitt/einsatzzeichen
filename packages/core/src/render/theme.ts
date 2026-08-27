import {
  PALETTE,
  type ColorPalette,
  type ColorToken,
  type RgbHex,
} from '@einsatzzeichen/schema';
import { assertValidRenderTheme } from './theme-validation.js';

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
   * Körperkontur, adressiert über den expliziten `Style.bodyStrokeDashToken`. Die Körperfüllung
   * allein aktiviert keine Signatur, weil derselbe Farbtoken auch technisch verwendet werden kann.
   */
  readonly bodyStrokeDashes?: Readonly<Partial<Record<ColorToken, readonly number[]>>>;
}

/** Unveränderte, aus dem BABZ-Referenzbestand extrahierte Darstellung. */
export const REFERENCE_THEME: RenderTheme = Object.freeze({
  id: 'reference',
  palette: PALETTE,
  surface: '#ffffff',
});

export function colorFor(theme: RenderTheme, token: ColorToken): RgbHex {
  assertValidRenderTheme(theme);
  return theme.palette[token];
}
