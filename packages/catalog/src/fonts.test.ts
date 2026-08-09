import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Resvg, type RenderedImage } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';
import { compose, renderSvg, type CatalogPorts } from '@einsatzzeichen/core';
import { DEFAULT_VIEWBOX_MM, type Primitive, type Drawing } from '@einsatzzeichen/schema';
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

/**
 * Ein Textprimitiv, wie es in den beiden Rasterevidenz-Tests unten gerastert wird — einmal
 * definiert, damit keine der beiden Prüfungen ihre eigene, potenziell abweichende Zeichnung
 * mitbringt. `style.fill` ist gesetzt: ein Textprimitiv ohne Stil rastert (wie jedes andere
 * Primitiv auch, siehe `styleAttrs` in svg.ts) mit `fill="none"` — unsichtbar unabhängig von der
 * Schriftbindung. Ohne den Fill wäre der Dunkelheitstest weiter unten sinnlos.
 */
function sampleTextSvg(): string {
  return renderSvg(
    {
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
          style: { fill: 'schwarz' },
        },
      ],
    },
    { size: 256 },
  );
}

/**
 * Zählt Pixel, die sowohl deckend als auch dunkel sind. Ein reiner Prüfung nur des Rot-Kanals
 * (`pixels[i] < 128`) würde nicht unterscheiden: `@resvg/resvg-js` liefert einen transparenten
 * Hintergrund als `(0, 0, 0, 0)` — Rot ist dort ebenfalls 0. Ohne den Alpha-Kanal in der Prüfung
 * zählte jedes Hintergrundpixel als "dunkel", und ein komplett leeres Bild (Text mit `fill="none"`
 * oder ganz ohne Schriftbindung gerastert) bestünde denselben Test wie ein korrekt gerastertes
 * Kürzel. Nachgemessen: bei dieser Zeichnung liefert die reine Rot-Kanal-Zählung in beiden Fällen
 * 65536 (die volle 256×256-Fläche), der alphabewusste Zähler dagegen 0 ohne und ~3000 mit
 * wirkender Schriftbindung.
 */
function countDarkInkPixels(image: RenderedImage): number {
  const pixels = image.pixels; // einmal abgreifen: `image.pixels` ist ein teurer Getter, siehe
  // unten — pro Schleifendurchlauf neu zugegriffen, wird aus einer linearen eine quadratische
  // Laufzeit (bei 256 px ~65 000 Zugriffe auf ein 65 000 Byte großes Array).
  let dark = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3] ?? 0;
    const red = pixels[index] ?? 0;
    if (alpha > 0 && red < 128) dark++;
  }
  return dark;
}

/**
 * Katalog-Doppel für die Fußzonen-Ratserprüfungen unten: liefert ausschließlich den Körper der
 * Taktischen Formation aus `base-symbols.ts` (`x:1, y:6, width:30, height:20`), alles andere ist
 * für diese Prüfungen unerheblich und lehnt einen Aufruf explizit ab, statt still einen falschen
 * Wert zu liefern — dasselbe Muster wie in `compose.test.ts`.
 */
const formationCatalog: CatalogPorts = {
  baseDrawing: () => ({
    viewBox: DEFAULT_VIEWBOX_MM,
    children: [{ type: 'rect', role: 'body', x: 1, y: 6, width: 30, height: 20 } satisfies Primitive],
  }),
  organizationColor: () => {
    throw new Error('Für diese Prüfung nicht aufgerufen.');
  },
  strengthHead: () => {
    throw new Error('Für diese Prüfung nicht aufgerufen.');
  },
  pictogram: () => {
    throw new Error('Für diese Prüfung nicht aufgerufen.');
  },
};

interface InkAgainstBox {
  /** Anzahl deckender (Alpha > 0) Pixel im gesamten Bild. */
  inkPixelCount: number;
  /** Davon außerhalb der deklarierten `boxMm`, in Pixelkoordinaten umgerechnet. */
  outsideBoxCount: number;
}

/**
 * Rastert die Fußzone einer `compose()`-Zeichnung isoliert (ohne Körper/Kopf/Piktogramm — die
 * würden bei der Innerhalb-Prüfung nur stören) und vergleicht die tatsächliche Tinte gegen die
 * vom Primitiv deklarierte `boxMm`. Das ist der Ersatz für die verlorene geometrische Messung
 * aus Task 8 (siehe Primitive-Kommentar in geometry.ts: `boxMm` ist bei Text eine Zusicherung
 * des Autors, keine Messung — kein Gate prüft mehr, ob Glyphen über sie hinausragen).
 */
function footInkAgainstBox(designation: string): InkAgainstBox {
  const drawing = compose({ kind: 'formation', designation }, formationCatalog);
  const foot = drawing.children.find((primitive) => primitive.role === 'foot');
  if (foot?.type !== 'text') throw new Error('compose() hat keine Text-Fußzone erzeugt.');

  const size = 256;
  const isolated: Drawing = { viewBox: drawing.viewBox, children: [foot] };
  const svg = renderSvg(isolated, { size });
  const image = new Resvg(svg, { font: resvgFontOptions() }).render();
  const pixels = image.pixels; // einmal abgreifen, siehe countDarkInkPixels oben.
  const scale = size / drawing.viewBox.width;
  const boxMinXPx = foot.boxMm.xMm * scale;
  const boxMaxXPx = (foot.boxMm.xMm + foot.boxMm.widthMm) * scale;
  const boxMinYPx = foot.boxMm.yMm * scale;
  const boxMaxYPx = (foot.boxMm.yMm + foot.boxMm.heightMm) * scale;

  let inkPixelCount = 0;
  let outsideBoxCount = 0;
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const alpha = pixels[(y * image.width + x) * 4 + 3] ?? 0;
      if (alpha === 0) continue;
      inkPixelCount++;
      if (x < boxMinXPx || x > boxMaxXPx || y < boxMinYPx || y > boxMaxYPx) outsideBoxCount++;
    }
  }
  return { inkPixelCount, outsideBoxCount };
}

describe('Rasterevidenz für Text (resvgFontOptions())', () => {
  it('rastert dieselbe Textzeichnung zweimal byteidentisch', () => {
    const svg = sampleTextSvg();
    const a = new Resvg(svg, { font: resvgFontOptions() }).render().asPng();
    const b = new Resvg(svg, { font: resvgFontOptions() }).render().asPng();
    expect(Buffer.compare(a, b)).toBe(0);
  });

  /**
   * Der wichtigere der beiden Tests. `@resvg/resvg-js` rastert Text ohne Schriftbindung zu
   * **null Pixeln** (siehe Kommentar zu `TEXT_FONT_FAMILY` in fonts.ts) — und das
   * Mehrgrößengate war bislang genau so konfiguriert (`loadSystemFonts: false`, ohne
   * `fontFiles`), laut eigenem Kommentar für Determinismus. Ein leeres Bild wäre also ein
   * bestandener Snapshot gewesen: der Byteidentitäts-Test oben bestünde ein durchgängig leeres
   * Bild ebenso wie ein korrekt gerastertes Kürzel, denn er prüft nur "immer gleich", nicht
   * "überhaupt etwas". Dieser Test verlangt stattdessen eine Mindestzahl dunkler, deckender
   * Pixel und unterscheidet damit "rendert korrekt" von "rendert gar nicht". Ohne ihn ist die
   * ganze Rasterevidenz dieser Datei wertlos.
   */
  it('rastert Text überhaupt — die Fläche ist nicht leer', () => {
    const svg = sampleTextSvg();
    const image = new Resvg(svg, { font: resvgFontOptions() }).render();
    expect(countDarkInkPixels(image)).toBeGreaterThan(100);
  });

  it('hält die deklarierte boxMm auch für Unterlängen ein („g"/„j"/„p"/„q"/„y" in „Zug jgpqy")', () => {
    // Offener Punkt aus Task 8: `boxMm` ist bei Text eine Zusicherung des Autors, keine Messung
    // (siehe Primitive-Kommentar in geometry.ts). Kein Gate prüft mehr, ob Glyphen über sie
    // hinausragen — am ehesten gefährdet: Unterlängen, die unter die Grundlinie reichen. Diese
    // Rasterprüfung ist der Ersatz für die verlorene geometrische Messung: sie rastert den echten
    // `compose()`-Ausgang und vergleicht die tatsächliche Tinte (Alpha-Kanal) gegen die
    // deklarierte Box in Pixelkoordinaten. Absichtlich alle fünf Unterlängen-Buchstaben des
    // lateinischen Alphabets in einem String, nicht nur „g" (wie im Brief für „2. Zug"
    // vorgeschlagen) — die Grenze soll nicht am zufällig mildesten Fall bestehen.
    const { inkPixelCount, outsideBoxCount } = footInkAgainstBox('Zug jgpqy');
    expect(inkPixelCount).toBeGreaterThan(0);
    expect(outsideBoxCount).toBe(0);
  });

  it('dokumentiert eine offene Lücke: Umlaut-Diakritika ragen über die deklarierte Box hinaus', () => {
    // Kein Bestehen-Test, sondern eine Charakterisierung des IST-Zustands (Zusatzauftrag 1 aus
    // dem Task-9-Brief, über den dort ausdrücklich benannten Unterlängen-Fall hinaus geprüft):
    // Anders als Unterlängen (Test oben, hält robust auch mit allen fünf Buchstaben) ragen
    // Diakritika über Großbuchstaben — Ü, Ä, Ö, in deutschen Bezeichnungen nicht selten (z. B.
    // „Übung") — über die Kapitälchenhöhe und damit über die deklarierte boxMm-Oberkante hinaus.
    // Gemessen bei 256 px (32-mm-viewBox, 8 px/mm): mindestens 24 von rund 1100 Ink-Pixeln liegen
    // außerhalb der Box, mit einem Überstand von 4 px (0,5 mm) oben. Bewusst nicht behoben — die
    // Box wird nicht stillschweigend vergrößert (siehe FOOT_TEXT_SIZE_MM-Begründung in
    // compose.ts) — sondern hier festgehalten, damit der Befund nicht erneut entdeckt werden
    // muss. Kandidat für Task 10 oder eine eigene Folgeaufgabe.
    const { inkPixelCount, outsideBoxCount } = footInkAgainstBox('Übung');
    expect(inkPixelCount).toBeGreaterThan(0);
    expect(outsideBoxCount).toBeGreaterThan(0);
  });
});
