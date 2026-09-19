import { describe, expect, it } from 'vitest';
import { TEXT_FONT_FAMILY } from '@einsatzzeichen/catalog';
import { embedTextFont } from './render.js';

describe('embedTextFont', () => {
  it('bettet Arimo in ein SVG mit Text ein, weil ein <img> keine Seitenschrift erreicht', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><title>T</title>' +
      `<text x="5" y="5" font-family="${TEXT_FONT_FAMILY}">RKB</text></svg>`;
    const embedded = embedTextFont(svg);
    const root = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">';
    expect(embedded.startsWith(`${root}<style>@font-face{`)).toBe(true);
    expect(embedded).toContain(`font-family:'${TEXT_FONT_FAMILY}'`);
    expect(embedded).toContain('src:url(data:font/ttf;base64,AAEAAA');
    expect(embedded.endsWith('<title>T</title>' + svg.slice(svg.indexOf('<text')))).toBe(true);
  });

  it('lässt ein SVG ohne Text bytegleich', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0 0 L 1 1"/></svg>';
    expect(embedTextFont(svg)).toBe(svg);
  });
});
