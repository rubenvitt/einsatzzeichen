import { PALETTE, type ColorToken } from '@einsatzzeichen/schema';
import type { RenderTheme } from './theme.js';

const RGB_HEX = /^#[0-9a-fA-F]{6}$/;
const COLOR_TOKENS = Object.keys(PALETTE) as readonly ColorToken[];

function displayed(value: unknown): string {
  return typeof value === 'string' ? JSON.stringify(value) : String(value);
}

function themeLabel(theme: unknown): string {
  if (typeof theme !== 'object' || theme === null || !('id' in theme)) return 'RenderTheme';
  const id = theme.id;
  return typeof id === 'string' ? `RenderTheme ${JSON.stringify(id)}` : 'RenderTheme';
}

function invalid(theme: unknown, path: string, expectation: string, value: unknown): never {
  throw new TypeError(`${themeLabel(theme)}: ${path} ${expectation} (ist ${displayed(value)}).`);
}

function assertRgbHex(theme: RenderTheme, path: string, value: unknown): void {
  if (typeof value !== 'string' || !RGB_HEX.test(value)) {
    invalid(theme, path, 'muss eine RGB-Hexfarbe im Format #RRGGBB sein', value);
  }
}

/** Gemeinsame Fail-Closed-Vertrauensgrenze für alle öffentlichen Theme-Verbraucher. */
export function assertValidRenderTheme(theme: RenderTheme): void {
  if (typeof theme !== 'object' || theme === null) {
    throw new TypeError(`RenderTheme muss ein Objekt sein (ist ${displayed(theme)}).`);
  }

  const palette: unknown = theme.palette;
  if (typeof palette !== 'object' || palette === null || Array.isArray(palette)) {
    invalid(theme, 'palette', 'muss ein Objekt sein', palette);
  }
  const paletteValues = palette as Record<string, unknown>;
  for (const token of COLOR_TOKENS) {
    assertRgbHex(theme, `palette.${token}`, paletteValues[token]);
  }
  assertRgbHex(theme, 'surface', theme.surface);

  const bodyStrokeDashes: unknown = theme.bodyStrokeDashes;
  if (bodyStrokeDashes === undefined) return;
  if (
    typeof bodyStrokeDashes !== 'object' ||
    bodyStrokeDashes === null ||
    Array.isArray(bodyStrokeDashes)
  ) {
    invalid(theme, 'bodyStrokeDashes', 'muss ein Objekt sein', bodyStrokeDashes);
  }

  const dashesByToken = bodyStrokeDashes as Record<string, unknown>;
  for (const token of COLOR_TOKENS) {
    const dash = dashesByToken[token];
    if (dash === undefined) continue;
    if (!Array.isArray(dash)) {
      invalid(theme, `bodyStrokeDashes.${token}`, 'muss ein Array sein', dash);
    }
    for (let index = 0; index < dash.length; index += 1) {
      const value: unknown = dash[index];
      if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
        invalid(
          theme,
          `bodyStrokeDashes.${token}[${index}]`,
          'muss eine endliche Zahl größer als 0 sein',
          value,
        );
      }
    }
  }
}
