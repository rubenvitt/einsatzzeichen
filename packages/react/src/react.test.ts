import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWBOX_MM, PALETTE, type Drawing } from '@einsatzzeichen/schema';
import { REFERENCE_THEME, renderSvg, type RenderTheme } from '@einsatzzeichen/core';
import { Einsatzzeichen, splitSvgMarkup, svgAttributeToReactProp } from './index.js';

const formation: Drawing = {
  viewBox: DEFAULT_VIEWBOX_MM,
  title: 'Taktische Formation',
  description: 'Eine taktische Formation.',
  children: [
    {
      type: 'rect',
      role: 'body',
      x: 1,
      y: 6,
      width: 30,
      height: 20,
      style: { fill: 'weiss', stroke: 'schwarz', strokeWidth: 0.5 },
    },
  ],
};

/**
 * Vergleicht zwei `<svg>`-Markups attributweise plus Inhalt: React serialisiert die Props in
 * eigener Reihenfolge, die Byte-Reihenfolge des Starttags ist daher kein Vergleichskriterium.
 */
function expectSameSvg(actual: string, expected: string): void {
  const a = splitSvgMarkup(actual);
  const e = splitSvgMarkup(expected);
  expect(a.attributes).toEqual(e.attributes);
  expect(a.innerHtml).toBe(e.innerHtml);
}

describe('splitSvgMarkup', () => {
  it('zerlegt ein renderSvg-Ergebnis in Wurzelattribute und Inhalt', () => {
    const svg = renderSvg(formation, { size: 64, idPrefix: 'probe' });
    const parts = splitSvgMarkup(svg);
    expect(parts.attributes).toEqual({
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 90.709 90.709',
      width: '64',
      height: '64',
      role: 'img',
      'aria-labelledby': 'probe-title probe-desc',
    });
    expect(parts.innerHtml.startsWith('<title id="probe-title">Taktische Formation</title>')).toBe(
      true,
    );
    expect(parts.innerHtml).toContain('<rect ');
    expect(parts.innerHtml).not.toContain('</svg>');
  });

  it('verarbeitet Präfix-Attribute, Attribute ohne Wert und einfache Anführungszeichen', () => {
    const parts = splitSvgMarkup(
      `<svg\n  xmlns:xlink="http://www.w3.org/1999/xlink" data-x='a "b"' hidden>x</svg>`,
    );
    expect(parts.attributes).toEqual({
      'xmlns:xlink': 'http://www.w3.org/1999/xlink',
      'data-x': 'a "b"',
      hidden: '',
    });
    expect(parts.innerHtml).toBe('x');
  });

  it('wirft, wenn kein Wurzel-<svg> vorliegt', () => {
    expect(() => splitSvgMarkup('<div>kein svg</div>')).toThrow(/<svg/u);
    expect(() => splitSvgMarkup('<svg xmlns="x">offen')).toThrow(/<\/svg>/u);
  });
});

describe('svgAttributeToReactProp', () => {
  it('bildet SVG-Attributnamen auf React-Props ab', () => {
    expect(svgAttributeToReactProp('class')).toBe('className');
    expect(svgAttributeToReactProp('aria-labelledby')).toBe('aria-labelledby');
    expect(svgAttributeToReactProp('data-foo-bar')).toBe('data-foo-bar');
    expect(svgAttributeToReactProp('xmlns:xlink')).toBe('xmlnsXlink');
    expect(svgAttributeToReactProp('xlink:href')).toBe('xlinkHref');
    expect(svgAttributeToReactProp('stroke-width')).toBe('strokeWidth');
    expect(svgAttributeToReactProp('viewBox')).toBe('viewBox');
  });
});

describe('Einsatzzeichen', () => {
  it('erzeugt dasselbe Markup wie renderSvg', () => {
    const html = renderToStaticMarkup(createElement(Einsatzzeichen, { drawing: formation, size: 64 }));
    expectSameSvg(html, renderSvg(formation, { size: 64 }));
    expect(html).toContain('<title id="ez-title">Taktische Formation</title>');
  });

  it('reicht idPrefix und theme durch', () => {
    const theme: RenderTheme = {
      ...REFERENCE_THEME,
      id: 'test',
      palette: { ...PALETTE, schwarz: '#123456' },
    };
    const html = renderToStaticMarkup(
      createElement(Einsatzzeichen, { drawing: formation, idPrefix: 'karte', theme }),
    );
    expectSameSvg(html, renderSvg(formation, { idPrefix: 'karte', theme }));
    expect(html).toContain('aria-labelledby="karte-title karte-desc"');
    expect(html).toContain('stroke="#123456"');
  });

  it('setzt className und style auf der Wurzel', () => {
    const html = renderToStaticMarkup(
      createElement(Einsatzzeichen, {
        drawing: formation,
        className: 'zeichen',
        style: { display: 'block' },
      }),
    );
    const { attributes, innerHtml } = splitSvgMarkup(html);
    expect(attributes.class).toBe('zeichen');
    expect(attributes.style).toBe('display:block');
    expect(innerHtml).toBe(splitSvgMarkup(renderSvg(formation)).innerHtml);
  });
});
