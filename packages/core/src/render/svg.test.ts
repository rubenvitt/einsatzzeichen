import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_VIEWBOX_MM,
  PALETTE,
  mmToUnits,
  type ColorToken,
  type Drawing,
} from '@einsatzzeichen/schema';
import { formatUnits, renderSvg } from './svg.js';
import type { RenderTheme } from './theme.js';
import { checkViewBox } from '../viewbox-gate.js';

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

  it('löst Farben aus dem übergebenen Theme auf', () => {
    const theme: RenderTheme = {
      id: 'test',
      palette: { ...PALETTE, weiss: '#eeeeee', schwarz: '#111111' },
      surface: '#ffffff',
    };
    const svg = renderSvg(formation, { theme });
    expect(svg).toContain('fill="#eeeeee"');
    expect(svg).toContain('stroke="#111111"');
  });

  it.each(Object.keys(PALETTE) as ColorToken[])(
    'lehnt ein Theme mit fehlendem palette.%s ab',
    (token) => {
      const palette = { ...PALETTE };
      Reflect.deleteProperty(palette, token);
      const theme: RenderTheme = { id: 'unvollständig', palette, surface: '#ffffff' };

      expect(() => renderSvg(formation, { theme })).toThrow(
        `RenderTheme "unvollständig": palette.${token} muss eine RGB-Hexfarbe im Format #RRGGBB sein (ist undefined).`,
      );
    },
  );

  it('leitet keine Organisationskontur allein aus einer weißen Füllung ab', () => {
    const theme: RenderTheme = {
      id: 'test',
      palette: PALETTE,
      surface: '#ffffff',
      bodyStrokeDashes: { weiss: [2, 1] },
    };
    const svg = renderSvg(formation, { theme });
    expect(svg).not.toContain('stroke-dasharray=');
  });

  it('gibt eine explizite nicht-farbliche Körperkontur in Millimetern aus', () => {
    const theme: RenderTheme = {
      id: 'test',
      palette: PALETTE,
      surface: '#ffffff',
      bodyStrokeDashes: { weiss: [2, 1] },
    };
    const signedFormation = {
      ...formation,
      children: formation.children.map((child) => ({
        ...child,
        style: { ...child.style, bodyStrokeDashToken: 'weiss' },
      })),
    } as Drawing;
    const svg = renderSvg(signedFormation, { theme });
    expect(svg).toContain(
      `stroke-dasharray="${formatUnits(mmToUnits(2))} ${formatUnits(mmToUnits(1))}"`,
    );
  });

  it('gibt A11y-Metadaten aus, wenn ein Titel gesetzt ist', () => {
    const svg = renderSvg(formation, { idPrefix: 'ez' });
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-labelledby="ez-title"');
    expect(svg).toContain('<title id="ez-title">Taktische Formation</title>');
  });

  it('verknüpft Titel und Beschreibung gemeinsam in aria-labelledby', () => {
    const svg = renderSvg(
      { ...formation, description: 'Eine taktische Formation.' },
      { idPrefix: 'symbol' },
    );
    expect(svg).toContain('aria-labelledby="symbol-title symbol-desc"');
    expect(svg).toContain('<desc id="symbol-desc">Eine taktische Formation.</desc>');
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

  it('interpretiert size als Pixelbreite und leitet die Höhe aus einer rechteckigen ViewBox ab', () => {
    const rectangular: Drawing = {
      viewBox: { width: 32, height: 46 },
      children: [],
    };

    expect(renderSvg(rectangular, { size: 64 })).toContain('width="64" height="92"');
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, 0, -1, 1.5])(
    'lehnt eine ungültige Pixelbreite %p ab',
    (size) => {
      expect(() => renderSvg(formation, { size })).toThrow();
    },
  );

  it.each([
    { width: 0, height: 46 },
    { width: 32, height: 0 },
    { width: Number.NaN, height: 46 },
    { width: 32, height: Number.POSITIVE_INFINITY },
  ])('lehnt eine ungültige ViewBox %o bei fester Pixelbreite ab', (viewBox) => {
    const drawing: Drawing = { viewBox, children: [] };
    expect(() => renderSvg(drawing, { size: 64 })).toThrow();
  });

  it('skaliert Pfad-Koordinaten über das transform-Attribut und lässt d unverändert', () => {
    const svg = renderSvg({
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'path',
          d: 'M1 6 L31 6 L31 26 L1 26 Z',
          style: { fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 },
        },
      ],
    });
    expect(svg).toContain('<path d="M1 6 L31 6 L31 26 L1 26 Z"');
    expect(svg).toContain('transform="scale(2.8346)"');
    expect(svg).toContain('stroke-width="0.5"');
  });

  it.each(['M\f4\f12 L\f28\f20', 'M 4\f,\f12 L 28\f,\f20'])(
    'serialisiert SVG-wsp Form Feed in %j als parsebares XML',
    (d) => {
      const drawing: Drawing = {
        viewBox: DEFAULT_VIEWBOX_MM,
        children: [
          {
            type: 'path',
            d,
            style: { fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 },
          },
        ],
      };
      expect(checkViewBox(drawing)).toEqual([]);

      const svg = renderSvg(drawing, { size: 32 });
      const image = new Resvg(svg, { font: { loadSystemFonts: false } }).render();
      expect(svg).not.toContain('\f');
      expect(image.width).toBe(32);
      expect(image.height).toBe(32);
      expect(image.asPng().byteLength).toBeGreaterThan(0);
    },
  );

  it('gibt geerbte Nullstriche für normale Primitive und Pfade als unsichtbare Breite aus', () => {
    const svg = renderSvg({
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'group',
          style: { stroke: 'schwarz', strokeWidth: 0 },
          children: [
            { type: 'line', x1: 4, y1: 8, x2: 28, y2: 8 },
            { type: 'path', d: 'M 4 24 L 28 24' },
          ],
        },
      ],
    });
    const lineTag = svg.match(/<line[^>]*\/>/)?.[0];
    const pathTag = svg.match(/<path[^>]*\/>/)?.[0];
    expect(lineTag).toContain('stroke-width="0"');
    expect(pathTag).toContain('stroke-width="0"');
  });

  it('wendet bei Pfaden zuerst die Skalierung und danach die Drehung an', () => {
    const svg = renderSvg({
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'path',
          d: 'M0 0 L10 0 L10 10 L0 10 Z',
          transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
        },
      ],
    });
    expect(svg).toContain('transform="rotate(45 45.354 45.354) scale(2.8346)"');
  });
});

describe('renderSvg — Verschiebung von Gruppen', () => {
  it('gibt die Verschiebung in SVG-Einheiten aus', () => {
    const svg = renderSvg({
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'group',
          transform: { translate: { dxMm: 0, dyMm: 3 } },
          children: [{ type: 'line', x1: 3, y1: 16, x2: 26, y2: 16, style: { stroke: 'schwarz' } }],
        },
      ],
    });
    expect(svg).toContain(`<g transform="translate(0 ${formatUnits(mmToUnits(3))})">`);
    // Die Koordinaten des Kindes bleiben unangetastet — die Verschiebung sitzt an der Gruppe.
    expect(svg).toContain(`y1="${formatUnits(mmToUnits(16))}"`);
  });

  it('setzt die Verschiebung links von einer Drehung', () => {
    // SVG-Transformationen wirken von rechts nach links: rotate muss zuerst auf die
    // Kindkoordinaten wirken, die Verschiebung danach auf das gedrehte Ergebnis. Steht sie
    // rechts, verschiebt sie das Rotationszentrum mit — ein anderes Bild.
    const svg = renderSvg({
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'group',
          transform: { translate: { dxMm: 1, dyMm: 2 }, rotate: { angle: 45, cx: 16, cy: 16 } },
          children: [{ type: 'rect', x: 0, y: 0, width: 4, height: 4 }],
        },
      ],
    });
    const attr = svg.match(/<g transform="([^"]*)">/)?.[1];
    expect(attr).toBeDefined();
    expect(attr?.indexOf('translate(')).toBe(0);
    expect(attr?.indexOf('rotate(')).toBeGreaterThan(0);
  });

  it('gibt eine Verschiebung von null unverkürzt aus', () => {
    // Keine Sonderbehandlung für dx = dy = 0: eine Nullprüfung wäre ein zweiter Codepfad,
    // den der Canvas-Renderer ebenfalls kennen müsste, sonst divergiert die Aufrufspur.
    const svg = renderSvg({
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'group',
          transform: { translate: { dxMm: 0, dyMm: 0 } },
          children: [{ type: 'rect', x: 0, y: 0, width: 4, height: 4 }],
        },
      ],
    });
    expect(svg).toContain('<g transform="translate(0 0)">');
  });
});

describe('renderSvg — Text', () => {
  it('gibt ein Textprimitiv mit Anker, Grundlinie und Schriftfamilie aus', () => {
    const svg = renderSvg({
      viewBox: { width: 32, height: 32 },
      children: [
        {
          type: 'text',
          role: 'pictogram',
          content: 'HRT',
          x: 16,
          y: 20,
          sizeMm: 10,
          anchor: 'middle',
          baseline: 'alphabetic',
          boxMm: { xMm: 6, yMm: 12, widthMm: 20, heightMm: 10 },
        },
      ],
    });
    expect(svg).toContain('<text');
    expect(svg).toContain('text-anchor="middle"');
    expect(svg).toContain('font-family="Arimo"');
    expect(svg).toContain('>HRT</text>');
    expect(svg).not.toContain('font-weight');
  });

  it('maskiert Sonderzeichen im Textinhalt', () => {
    const svg = renderSvg({
      viewBox: { width: 32, height: 32 },
      children: [
        {
          type: 'text',
          content: 'A&B<C',
          x: 16,
          y: 20,
          sizeMm: 10,
          anchor: 'middle',
          baseline: 'alphabetic',
          boxMm: { xMm: 6, yMm: 12, widthMm: 20, heightMm: 10 },
        },
      ],
    });
    expect(svg).toContain('A&amp;B&lt;C');
  });

  it('wird gefüllt statt gestrichen und trägt keinen Piktogramm-Strichvertrag', () => {
    // Anders als Piktogrammpfade (siehe styleAttrs/pictogramStrokeContract in svg.ts): Text hat
    // keine Kontur, die von butt-caps/round-joins profitiert — er wird als Fläche gefüllt.
    const svg = renderSvg({
      viewBox: { width: 32, height: 32 },
      children: [
        {
          type: 'text',
          role: 'pictogram',
          content: 'HRT',
          x: 16,
          y: 20,
          sizeMm: 10,
          anchor: 'middle',
          baseline: 'alphabetic',
          boxMm: { xMm: 6, yMm: 12, widthMm: 20, heightMm: 10 },
          style: { fill: 'schwarz', stroke: 'rot', strokeWidth: 0.5 },
        },
      ],
    });
    const textTag = svg.match(/<text[^>]*>/)?.[0];
    // Nicht nur der Piktogramm-Strichvertrag fehlt — stroke selbst darf trotz gesetztem
    // style.stroke gar nicht erst ausgegeben werden. Sonst striche SVG etwas, das Canvas aus
    // derselben IR nie zeichnet (drawPrimitive in canvas.ts ruft für Text nie strokeText auf).
    expect(textTag).not.toContain('stroke');
  });

  it('bildet die mittige Grundlinie auf dominant-baseline="central" ab', () => {
    const svg = renderSvg({
      viewBox: { width: 32, height: 32 },
      children: [
        {
          type: 'text',
          content: 'HRT',
          x: 16,
          y: 16,
          sizeMm: 10,
          anchor: 'middle',
          baseline: 'middle',
          boxMm: { xMm: 6, yMm: 11, widthMm: 20, heightMm: 10 },
        },
      ],
    });
    expect(svg).toContain('dominant-baseline="central"');
  });
});
