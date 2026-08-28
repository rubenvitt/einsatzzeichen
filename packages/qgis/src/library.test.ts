import { describe, expect, it } from 'vitest';
import { renderSvg, type RenderTheme } from '@einsatzzeichen/core';
import { DEFAULT_VIEWBOX_MM, PALETTE, type Drawing } from '@einsatzzeichen/schema';
import { decodeBase64Utf8 } from './base64.test-helper.js';
import { qgisSvgFiles, qgisSymbolLibrary, type QgisSymbolEntry } from './library.js';

const formation: Drawing = {
  viewBox: DEFAULT_VIEWBOX_MM,
  title: 'Taktische Formation – Löschzug „Süd“ & <Test>',
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

const einheit: Drawing = {
  viewBox: DEFAULT_VIEWBOX_MM,
  title: 'Einheit',
  children: [
    {
      type: 'circle',
      role: 'body',
      cx: 16,
      cy: 16,
      r: 10,
      style: { fill: 'rot', stroke: 'schwarz', strokeWidth: 0.5 },
    },
  ],
};

const entries: readonly QgisSymbolEntry[] = [
  { name: 'Löschzug', drawing: formation },
  { name: 'Einheit', drawing: einheit },
];

function base64Payload(xml: string, name: string): string {
  const symbol = xml.slice(xml.indexOf(`name="${name}"`));
  const match = /name="name" value="base64:([^"]*)"/.exec(symbol);
  if (match === null) throw new Error(`Kein Base64-Symbol für ${name} gefunden.`);
  return match[1] ?? '';
}

describe('qgisSymbolLibrary', () => {
  it('erzeugt eine QGIS-Stilbibliothek mit SVG-Markern', () => {
    const xml = qgisSymbolLibrary(entries);
    expect(xml.startsWith('<!DOCTYPE qgis_style>')).toBe(true);
    expect(xml).toContain('<qgis_style version="2">');
    expect(xml).toContain('<symbol type="marker" name="Löschzug" alpha="1" clip_to_extent="1" force_rhr="0">');
    expect(xml).toContain('<symbol type="marker" name="Einheit"');
    expect(xml).toContain('<layer class="SvgMarker" enabled="1" locked="0" pass="0">');
    expect(xml).toContain('<Option type="QString" name="name" value="base64:');
    expect(xml).toContain('<Option type="QString" name="size" value="10"/>');
    expect(xml).toContain('<Option type="QString" name="size_unit" value="MM"/>');
    expect(xml).toContain('<colorramps/>');
    expect(xml).toContain('<symbols3d/>');
    expect(xml.trimEnd().endsWith('</qgis_style>')).toBe(true);
  });

  it('übernimmt sizeMm in die Symbolgröße', () => {
    expect(qgisSymbolLibrary(entries, { sizeMm: 7.5 })).toContain(
      '<Option type="QString" name="size" value="7.5"/>',
    );
  });

  it('schreibt die Größe in fester Dezimalschreibweise', () => {
    expect(() => qgisSymbolLibrary(entries, { sizeMm: 1e-7 })).toThrow(
      'sizeMm muss eine endliche Zahl von mindestens 0.000001 sein (ist 1e-7).',
    );
    expect(qgisSymbolLibrary(entries, { sizeMm: 0.000001 })).toContain(
      '<Option type="QString" name="size" value="0.000001"/>',
    );
    expect(qgisSymbolLibrary(entries, { sizeMm: 1e21 })).toContain(
      '<Option type="QString" name="size" value="1000000000000000000000"/>',
    );
    expect(qgisSymbolLibrary(entries, { sizeMm: 10 })).toContain('name="size" value="10"/>');
  });

  it('bettet exakt das Ergebnis von renderSvg als Base64 ein (inklusive Umlauten)', () => {
    const xml = qgisSymbolLibrary(entries, { idPrefix: 'lz' });
    const svg = decodeBase64Utf8(base64Payload(xml, 'Löschzug'));
    expect(svg).toBe(renderSvg(formation, { idPrefix: 'lz' }));
    expect(svg).toContain('Löschzug „Süd“ &amp; &lt;Test&gt;');
    // Ohne `size`, damit QGIS die Marker frei über `size`/`size_unit` skaliert.
    expect(svg).not.toMatch(/<svg[^>]*\swidth=/);
  });

  it('färbt die SVGs fest ein statt sie über param(fill) zu parametrisieren', () => {
    const svg = decodeBase64Utf8(base64Payload(qgisSymbolLibrary(entries), 'Einheit'));
    expect(svg).toContain(`fill="${PALETTE.rot}"`);
    expect(svg).not.toContain('param(');
  });

  it('löst Farben aus dem übergebenen Theme auf', () => {
    const theme: RenderTheme = {
      id: 'test',
      palette: { ...PALETTE, rot: '#aa0000' },
      surface: '#ffffff',
    };
    const svg = decodeBase64Utf8(base64Payload(qgisSymbolLibrary(entries, { theme }), 'Einheit'));
    expect(svg).toContain('fill="#aa0000"');
    expect(svg).toBe(renderSvg(einheit, { theme }));
  });

  it('escaped Sonderzeichen im Symbolnamen', () => {
    const xml = qgisSymbolLibrary([{ name: 'Löschzug <A> & "B" \'C\'', drawing: formation }]);
    expect(xml).toContain('name="Löschzug &lt;A&gt; &amp; &quot;B&quot; &apos;C&apos;"');
    expect(xml).not.toContain('name="Löschzug <A>');
  });

  it('lehnt doppelte Namen ab', () => {
    expect(() =>
      qgisSymbolLibrary([
        { name: 'Einheit', drawing: einheit },
        { name: 'Einheit', drawing: formation },
      ]),
    ).toThrow('Symbolname "Einheit" ist mehrfach vergeben.');
  });

  it('lehnt leere Namen ab', () => {
    expect(() => qgisSymbolLibrary([{ name: '', drawing: einheit }])).toThrow(
      'Symbolname darf nicht leer sein.',
    );
    expect(() => qgisSymbolLibrary([{ name: '   ', drawing: einheit }])).toThrow(
      'Symbolname darf nicht leer sein.',
    );
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('lehnt sizeMm=%s ab', (sizeMm) => {
    expect(() => qgisSymbolLibrary(entries, { sizeMm })).toThrow(
      `sizeMm muss eine endliche Zahl von mindestens 0.000001 sein (ist ${String(sizeMm)}).`,
    );
  });

  it('liefert bei leerer Eingabe eine gültige, leere Bibliothek', () => {
    const xml = qgisSymbolLibrary([]);
    expect(xml).toContain('<symbols/>');
    expect(xml).not.toContain('<symbol ');
  });
});

describe('qgisSvgFiles', () => {
  it('liefert je Eintrag eine SVG-Datei mit sicherem Pfad', () => {
    const files = qgisSvgFiles([
      { name: 'Löschzug 1/2 <A> & "B"', drawing: formation },
      { name: 'einheit.v2-final', drawing: einheit },
    ]);
    expect(files.map((file) => file.path)).toEqual(['L_schzug_1_2__A_____B_.svg', 'einheit.v2-final.svg']);
    expect(files[0]?.content).toBe(renderSvg(formation));
    expect(files[1]?.content).toBe(renderSvg(einheit));
  });

  it('reicht Theme und idPrefix an renderSvg durch', () => {
    const theme: RenderTheme = {
      id: 'test',
      palette: { ...PALETTE, rot: '#aa0000' },
      surface: '#ffffff',
    };
    const [file] = qgisSvgFiles([{ name: 'Einheit', drawing: einheit }], { theme, idPrefix: 'x' });
    expect(file?.content).toBe(renderSvg(einheit, { theme, idPrefix: 'x' }));
  });

  it('lehnt Namen ab, die nach der Bereinigung kollidieren', () => {
    expect(() =>
      qgisSvgFiles([
        { name: 'Löschzug', drawing: formation },
        { name: 'L schzug', drawing: einheit },
      ]),
    ).toThrow('Dateiname "L_schzug.svg" ist mehrfach vergeben (aus "Löschzug" und "L schzug").');
  });

  it('lehnt leere und doppelte Namen wie die Bibliothek ab', () => {
    expect(() => qgisSvgFiles([{ name: '', drawing: einheit }])).toThrow(
      'Symbolname darf nicht leer sein.',
    );
    expect(() =>
      qgisSvgFiles([
        { name: 'Einheit', drawing: einheit },
        { name: 'Einheit', drawing: formation },
      ]),
    ).toThrow('Symbolname "Einheit" ist mehrfach vergeben.');
  });
});
