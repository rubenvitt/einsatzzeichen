import { describe, expect, it } from 'vitest';
import { renderSvg, type RenderTheme } from '@einsatzzeichen/core';
import { PALETTE } from '@einsatzzeichen/schema';
import {
  DEFAULT_TAG_NAME,
  defineEinsatzzeichenElement,
  renderElementMarkup,
} from './index.js';
import { formation } from './fixture.test-helper.js';

describe('renderElementMarkup (ohne DOM)', () => {
  it('liefert ohne Zeichnung leeres Markup', () => {
    expect(renderElementMarkup(undefined, {})).toBe('');
  });

  it('liefert ohne Attribute exakt renderSvg(drawing)', () => {
    expect(renderElementMarkup(formation, {})).toBe(renderSvg(formation));
  });

  it('wertet size und id-prefix als Attributstrings aus', () => {
    expect(renderElementMarkup(formation, { size: '64', idPrefix: 'karte' })).toBe(
      renderSvg(formation, { size: 64, idPrefix: 'karte' }),
    );
  });

  it('behandelt null-Attribute wie fehlende', () => {
    expect(renderElementMarkup(formation, { size: null, idPrefix: null })).toBe(
      renderSvg(formation),
    );
  });

  it.each(['0', '-8', '12.5', 'abc', '', 'Infinity', '0x40', '1e2', ' 64 ', '+64'])('wirft bei ungültiger Größe %j', (size) => {
    expect(() => renderElementMarkup(formation, { size })).toThrow(RangeError);
  });

  it('reicht min-stroke-width als Mindeststrichbreite in Pixeln durch (LFH-584)', () => {
    expect(renderElementMarkup(formation, { size: '16', minStrokeWidth: '1' })).toBe(
      renderSvg(formation, { size: 16, minStrokeWidthPx: 1 }),
    );
    expect(renderElementMarkup(formation, { size: '16', minStrokeWidth: '0.75' })).toBe(
      renderSvg(formation, { size: 16, minStrokeWidthPx: 0.75 }),
    );
    expect(renderElementMarkup(formation, { size: '16', minStrokeWidth: null })).toBe(
      renderSvg(formation, { size: 16 }),
    );
  });

  it.each(['0', '-1', '.5', '1.', 'abc', '', ' 1 ', '1e0'])(
    'wirft bei ungültiger Mindeststrichbreite %j',
    (minStrokeWidth) => {
      expect(() => renderElementMarkup(formation, { size: '16', minStrokeWidth })).toThrow(RangeError);
    },
  );

  it('wirft bei min-stroke-width ohne size, weil der Pixelmaßstab fehlt', () => {
    expect(() => renderElementMarkup(formation, { minStrokeWidth: '1' })).toThrow(RangeError);
  });

  it('reicht das Theme durch', () => {
    const theme: RenderTheme = { id: 't', palette: { ...PALETTE, rot: '#123456' }, surface: '#ffffff' };
    expect(renderElementMarkup(formation, { theme })).toBe(renderSvg(formation, { theme }));
  });
});

describe('defineEinsatzzeichenElement in Node', () => {
  it('wirft ohne customElements nicht', () => {
    expect(typeof globalThis.customElements).toBe('undefined');
    expect(() => defineEinsatzzeichenElement()).not.toThrow();
    expect(DEFAULT_TAG_NAME).toBe('einsatzzeichen-symbol');
  });
});
