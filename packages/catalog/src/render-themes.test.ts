import { describe, expect, it } from 'vitest';
import {
  ACCESSIBLE_LIGHT_THEME,
  ORGANIZATION_BODY_DASHES,
  PRINT_MONOCHROME_THEME,
  RENDER_THEMES,
  isRenderThemeId,
  renderTheme,
} from './render-themes.js';

describe('Render-Theme-Register', () => {
  it.each(['reference', 'accessible-light', 'print-monochrome'])('%s ist auflösbar', (id) => {
    expect(isRenderThemeId(id)).toBe(true);
    if (isRenderThemeId(id)) expect(renderTheme(id).id).toBe(id);
  });

  it('lehnt unbekannte Theme-IDs ab', () => {
    expect(isRenderThemeId('unbekannt')).toBe(false);
  });

  it('enthält in jedem totalen Theme ausschließlich sechsstellige RGB-Hexwerte', () => {
    for (const theme of Object.values(RENDER_THEMES)) {
      expect(theme.surface).toMatch(/^#[0-9a-f]{6}$/);
      expect(Object.keys(theme.palette)).toHaveLength(13);
      for (const color of Object.values(theme.palette)) expect(color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('löst den semantischen Funktionslauf in jedem Theme total und nur im Drucktheme invertiert auf', () => {
    const resolved = Object.fromEntries(
      Object.entries(RENDER_THEMES).map(([id, theme]) => [
        id,
        (theme.palette as unknown as Readonly<Record<string, string>>)[
          'funktionslauf-kontrast'
        ],
      ]),
    );
    expect(resolved).toEqual({
      reference: '#000000',
      'accessible-light': '#000000',
      'print-monochrome': '#ffffff',
    });
  });

  it('friert Register, Themes, Paletten und Kontursignaturen tief ein', () => {
    expect(Object.isFrozen(RENDER_THEMES)).toBe(true);
    expect(Object.isFrozen(ORGANIZATION_BODY_DASHES)).toBe(true);
    for (const dash of Object.values(ORGANIZATION_BODY_DASHES)) {
      expect(Object.isFrozen(dash)).toBe(true);
    }
    for (const theme of Object.values(RENDER_THEMES)) {
      expect(Object.isFrozen(theme)).toBe(true);
      expect(Object.isFrozen(theme.palette)).toBe(true);
      if (theme.bodyStrokeDashes !== undefined) {
        expect(Object.isFrozen(theme.bodyStrokeDashes)).toBe(true);
        for (const dash of Object.values(theme.bodyStrokeDashes)) {
          if (dash !== undefined) expect(Object.isFrozen(dash)).toBe(true);
        }
      }
    }
  });

  it('weist Mutationen an Customtheme und innerer Kontursignatur fail-closed ab', () => {
    const mutableTheme = ACCESSIBLE_LIGHT_THEME as { surface: string };
    const originalSurface = mutableTheme.surface;
    let themeMutationError: unknown;
    try {
      mutableTheme.surface = '#000000';
    } catch (error) {
      themeMutationError = error;
    } finally {
      if (!Object.isFrozen(ACCESSIBLE_LIGHT_THEME)) mutableTheme.surface = originalSurface;
    }

    const mutableDash = ORGANIZATION_BODY_DASHES.blau as unknown as number[];
    const originalLength = mutableDash.length;
    let dashMutationError: unknown;
    try {
      mutableDash.push(99);
    } catch (error) {
      dashMutationError = error;
    } finally {
      if (!Object.isFrozen(mutableDash)) mutableDash.length = originalLength;
    }

    expect(themeMutationError).toBeInstanceOf(TypeError);
    expect(dashMutationError).toBeInstanceOf(TypeError);
    expect(ACCESSIBLE_LIGHT_THEME.surface).toBe(originalSurface);
    expect(ORGANIZATION_BODY_DASHES.blau).toHaveLength(originalLength);
    expect(renderTheme('print-monochrome')).toBe(PRINT_MONOCHROME_THEME);
  });
});
