import { describe, expect, it } from 'vitest';
import { TEXT_FONT_FAMILY } from '@einsatzzeichen/conformance';
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

  it('bettet die Kursivinstanz nur ein, wenn ein Lauf kursiv steht (LFH-585)', () => {
    const svg = (face: string) =>
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">' +
      `<text x="5" y="5" font-family="${TEXT_FONT_FAMILY}" font-weight="500"${face}>Bezeichnung</text></svg>`;
    const upright = embedTextFont(svg(''));
    const italic = embedTextFont(svg(' font-style="italic"'));
    expect(upright.match(/@font-face/g)).toHaveLength(1);
    expect(upright).not.toContain('font-style:italic');
    expect(italic.match(/@font-face/g)).toHaveLength(2);
    expect(italic).toContain(`@font-face{font-family:'${TEXT_FONT_FAMILY}';font-weight:500;font-style:italic;`);
    // Die erste Regel ist in beiden Fällen dieselbe; die Kursive kommt nur hinzu.
    const firstRule = (embedded: string) => embedded.slice(0, embedded.indexOf('}') + 1);
    expect(firstRule(italic)).toBe(firstRule(upright));
  });

  it('lässt ein SVG ohne Text bytegleich', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0 0 L 1 1"/></svg>';
    expect(embedTextFont(svg)).toBe(svg);
  });
});
