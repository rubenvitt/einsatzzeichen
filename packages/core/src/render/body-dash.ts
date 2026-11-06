import type { ColorToken, PrimitiveRole } from '@einsatzzeichen/schema';
import type { RenderTheme } from './theme.js';

/**
 * Rollen, deren Kontur die Organisationssignatur (`bodyStrokeDashToken`) strichelt: der Körper und
 * seine noch einmal gezogene Kontur über einem Schadensgrad (`bodyExtra`, LLH-1513/LLH-1550).
 * Ohne `bodyExtra` überdeckte die durchgezogene Wiederholung die gestrichelte Kontur, und die
 * Organisation verlöre ihren nicht-farblichen Kanal. Andere Zusatzkonturen tragen keinen
 * Schlüssel und bleiben durchgezogen.
 */
export const BODY_DASH_ROLES: ReadonlySet<PrimitiveRole> = new Set(['body', 'bodyExtra']);

/** Strichmuster einer Kontur dieser Rolle im Theme, oder `undefined` für durchgezogen. */
export function bodyStrokeDash(
  theme: RenderTheme,
  dashToken: ColorToken | undefined,
  role: PrimitiveRole | undefined,
): readonly number[] | undefined {
  if (dashToken === undefined || role === undefined || !BODY_DASH_ROLES.has(role)) return undefined;
  return theme.bodyStrokeDashes?.[dashToken];
}
