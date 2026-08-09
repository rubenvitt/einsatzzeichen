import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { TEXT_FONT_FAMILY, TEXT_FONT_PATH, TEXT_FONT_SHA256, resvgFontOptions } from './fonts.js';

describe('Textschrift', () => {
  it('liegt im Repository und hat die erwartete Prüfsumme', () => {
    const bytes = readFileSync(TEXT_FONT_PATH);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(TEXT_FONT_SHA256);
  });

  it('schließt Systemschriften aus', () => {
    const options = resvgFontOptions();
    expect(options.loadSystemFonts).toBe(false);
    expect(options.fontFiles).toEqual([TEXT_FONT_PATH]);
    expect(options.defaultFontFamily).toBe(TEXT_FONT_FAMILY);
  });
});
