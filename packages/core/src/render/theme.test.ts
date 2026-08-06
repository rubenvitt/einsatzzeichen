import { describe, expect, it } from 'vitest';
import { PALETTE, type ColorPalette } from '@einsatzzeichen/schema';
import { REFERENCE_THEME, colorFor, type RenderTheme } from './theme.js';

describe('RenderTheme', () => {
  it('verwendet als Vorgabe exakt die Referenzpalette', () => {
    expect(REFERENCE_THEME.palette).toBe(PALETTE);
    expect(REFERENCE_THEME.surface).toBe('#ffffff');
  });

  it('löst Tokens aus dem übergebenen Theme statt aus einem globalen Fallback auf', () => {
    const palette: ColorPalette = { ...PALETTE, blau: '#abcdef' };
    const theme: RenderTheme = { id: 'test', palette, surface: '#ffffff' };
    expect(colorFor(theme, 'blau')).toBe('#abcdef');
  });
});

