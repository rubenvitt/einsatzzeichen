import { describe, expect, it } from 'vitest';
import { RENDER_THEMES, isRenderThemeId, renderTheme } from './render-themes.js';

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
      expect(Object.keys(theme.palette)).toHaveLength(12);
      for (const color of Object.values(theme.palette)) expect(color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
