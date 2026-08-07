import { describe, expect, it } from 'vitest';
import { PALETTE, type ColorPalette } from '@einsatzzeichen/schema';
import { REFERENCE_THEME, colorFor, type RenderTheme } from './theme.js';

describe('RenderTheme', () => {
  it('verwendet als Vorgabe exakt die Referenzpalette', () => {
    expect(REFERENCE_THEME.palette).toBe(PALETTE);
    expect(REFERENCE_THEME.surface).toBe('#ffffff');
  });

  it('hält das öffentliche Referenztheme zur Laufzeit unveränderlich', () => {
    const mutableTheme = REFERENCE_THEME as { surface: string };
    const originalSurface = mutableTheme.surface;
    let mutationError: unknown;

    try {
      mutableTheme.surface = '#000000';
    } catch (error) {
      mutationError = error;
    } finally {
      if (!Object.isFrozen(REFERENCE_THEME)) mutableTheme.surface = originalSurface;
    }

    expect(Object.isFrozen(REFERENCE_THEME)).toBe(true);
    expect(Object.isFrozen(REFERENCE_THEME.palette)).toBe(true);
    expect(mutationError).toBeInstanceOf(TypeError);
    expect(REFERENCE_THEME.surface).toBe(originalSurface);
  });

  it('löst Tokens aus dem übergebenen Theme statt aus einem globalen Fallback auf', () => {
    const palette: ColorPalette = { ...PALETTE, blau: '#abcdef' };
    const theme: RenderTheme = { id: 'test', palette, surface: '#ffffff' };
    expect(colorFor(theme, 'blau')).toBe('#abcdef');
  });

  it('lehnt ein injizierbares Theme am öffentlichen colorFor-Export ab', () => {
    const theme: RenderTheme = {
      id: 'injected',
      palette: { ...PALETTE, blau: '#003296" data-injected="yes' },
      surface: '#ffffff',
    };

    expect(() => colorFor(theme, 'blau')).toThrow(
      'RenderTheme "injected": palette.blau muss eine RGB-Hexfarbe im Format #RRGGBB sein (ist "#003296\\" data-injected=\\"yes").',
    );
  });
});
