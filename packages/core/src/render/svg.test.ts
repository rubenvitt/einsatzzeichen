import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWBOX_MM, type Drawing } from '@einsatzzeichen/schema';
import { formatUnits, renderSvg } from './svg.js';

const formation: Drawing = {
  viewBox: DEFAULT_VIEWBOX_MM,
  title: 'Taktische Formation',
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

describe('renderSvg', () => {
  it('kürzt Zahlen auf drei Nachkommastellen ohne nachlaufende Nullen', () => {
    expect(formatUnits(90.70866141732283)).toBe('90.709');
    expect(formatUnits(0)).toBe('0');
    expect(formatUnits(2.8346456692913385)).toBe('2.835');
  });

  it('setzt die viewBox in SVG-Einheiten', () => {
    expect(renderSvg(formation)).toContain('viewBox="0 0 90.709 90.709"');
  });

  it('rechnet Millimeter-Koordinaten in Einheiten um', () => {
    const svg = renderSvg(formation);
    expect(svg).toContain('x="2.835"');
    expect(svg).toContain('y="17.008"');
    expect(svg).toContain('width="85.039"');
    expect(svg).toContain('height="56.693"');
  });

  it('löst Farbtoken auf und setzt die Strichstärke in Einheiten', () => {
    const svg = renderSvg(formation);
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).toContain('stroke="#000000"');
    expect(svg).toContain('stroke-width="1.417"');
  });

  it('gibt A11y-Metadaten aus, wenn ein Titel gesetzt ist', () => {
    const svg = renderSvg(formation, { idPrefix: 'ez' });
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-labelledby="ez-title"');
    expect(svg).toContain('<title id="ez-title">Taktische Formation</title>');
  });

  it('lässt A11y-Metadaten weg, wenn kein Titel gesetzt ist', () => {
    const svg = renderSvg({ viewBox: DEFAULT_VIEWBOX_MM, children: [] });
    expect(svg).not.toContain('<title');
    expect(svg).toContain('aria-hidden="true"');
  });

  it('maskiert Sonderzeichen in Titel und Beschreibung', () => {
    const svg = renderSvg({
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [],
      title: 'Führung & Leitung <Stab>',
    });
    expect(svg).toContain('Führung &amp; Leitung &lt;Stab&gt;');
  });

  it('gibt eine Drehung um einen Mittelpunkt aus', () => {
    const svg = renderSvg({
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'rect',
          x: 5.3934,
          y: 5.3934,
          width: 21.2132,
          height: 21.2132,
          transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
        },
      ],
    });
    expect(svg).toContain('transform="rotate(45 45.354 45.354)"');
  });

  it('rendert Kreis, Linie und geschlossenen Polyzug', () => {
    const svg = renderSvg({
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        { type: 'circle', cx: 16, cy: 16, r: 14 },
        { type: 'line', x1: 1, y1: 16, x2: 31, y2: 16 },
        { type: 'polyline', closed: true, points: [[16, 3], [1, 10], [31, 10]] },
      ],
    });
    expect(svg).toContain('<circle cx="45.354" cy="45.354" r="39.685"');
    expect(svg).toContain('<line x1="2.835" y1="45.354" x2="87.874" y2="45.354"');
    expect(svg).toContain('<polygon points="45.354,8.504 2.835,28.346 87.874,28.346"');
  });

  it('setzt die Pixelgröße, wenn size übergeben wird', () => {
    expect(renderSvg(formation, { size: 64 })).toContain('width="64" height="64"');
  });
});
