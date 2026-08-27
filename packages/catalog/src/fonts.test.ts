import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Resvg, type RenderedImage } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';
import { compose, renderSvg, type CatalogPorts } from '@einsatzzeichen/core';
import {
  DEFAULT_VIEWBOX_MM,
  type Drawing,
  type Primitive,
  type SymbolSpec,
} from '@einsatzzeichen/schema';
import { TEXT_FONT_FAMILY, TEXT_FONT_PATH, TEXT_FONT_SHA256, resvgFontOptions } from './fonts.js';
import { RECIPES, composeFromCatalog, type Recipe } from './recipes.js';
import { FUNCTION_ROLE_DEFINITIONS } from './function-roles.js';

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
  technicalHeadMark: () => {
    throw new Error('Für diese Prüfung nicht aufgerufen.');
  },
  functionRole: () => {
    throw new Error('Für diese Prüfung nicht aufgerufen.');
  },
  administrativeHead: () => undefined,
  vehicleChassis: () => {
    throw new Error('Für diese Prüfung nicht aufgerufen.');
  },
  pictogram: () => {
    throw new Error('Für diese Prüfung nicht aufgerufen.');
  },
  bodyMark: () => {
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

/**
 * Dieselbe Prüfung wie `footInkAgainstBox`, aber für die Beschriftungen **im** Körper und am
 * echten Katalogausgang statt an einem Doppel: `composeFromCatalog` liefert die Zeichnung, die
 * auch exportiert und gerastert wird. Jeder `role: 'label'`-Lauf wird einzeln isoliert — ein
 * gemeinsames Bild könnte einen Überstand des einen Laufs mit der Tinte des anderen verdecken.
 *
 * Der Ersatz für die verlorene geometrische Messung ist hier besonders nötig: die Boxen sind
 * seitlich eng gefasst (der mittige Lauf bekommt die Körperbreite abzüglich beider Ränder, die
 * beiden unteren je ihre Hälfte bis zur Körpermitte), und keines der vier Gates prüft bei Text
 * gegen die Glyphen.
 */
function labelInkAgainstBox(drawing: Drawing): InkAgainstBox[] {
  const labels = drawing.children.filter((primitive) => primitive.role === 'label');
  if (labels.length === 0) throw new Error('Die Zeichnung trägt keinen Beschriftungslauf.');

  const size = 256;
  return labels.map((label) => {
    if (label.type !== 'text') throw new Error('Ein label-Primitiv ist kein Textprimitiv.');
    const svg = renderSvg({ viewBox: drawing.viewBox, children: [label] }, { size });
    const image = new Resvg(svg, { font: resvgFontOptions() }).render();
    const pixels = image.pixels; // einmal abgreifen, siehe countDarkInkPixels oben.
    const scale = size / drawing.viewBox.width;
    const boxMinXPx = label.boxMm.xMm * scale;
    const boxMaxXPx = (label.boxMm.xMm + label.boxMm.widthMm) * scale;
    const boxMinYPx = label.boxMm.yMm * scale;
    const boxMaxYPx = (label.boxMm.yMm + label.boxMm.heightMm) * scale;

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
  });
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

  it('hält die deklarierte boxMm auch für Umlaut-Diakritika ein („Übung", „ÄÖÜ")', () => {
    // Task-9-Befund, jetzt behoben (Task-9-Fix): `boxMm` ist bei Text eine Zusicherung des
    // Autors, keine Messung (siehe Primitive-Kommentar in geometry.ts) — bei `baseline:
    // 'hanging'` ragten Großbuchstaben-Diakritika (Ä/Ö/Ü) über die deklarierte Boxoberkante
    // hinaus, weil die Hanging-Metrik von Arimo unterhalb der tatsächlichen Akzenthöhe liegt.
    // Dieser Test pinnte ursprünglich den fehlerhaften IST-Zustand: „Übung" bei 256 px
    // (32-mm-viewBox, 8 px/mm) hatte `outsideBoxCount: 24` von rund 1100 Ink-Pixeln, mit einem
    // Überstand von 4 px (0,5 mm) oben. Der Fix führt den gemessenen Zuschlag
    // `DIACRITIC_HEADROOM_FRACTION` in `text-policy.ts` ein (11,3–12,5 % von `sizeMm`, siehe
    // Kommentar dort) und wendet ihn über `verticalTextBoxMm` auf die Fußzonen-`boxMm` in
    // `compose.ts` an. „ÄÖÜ" deckt zusätzlich alle drei deutschen Großbuchstaben-Umlaute ab,
    // nicht nur den in „Übung" enthaltenen Ü-Fall — bei einem künftigen Schriftwechsel bestünde
    // sonst ein Test, der zufällig nur den milderen der drei Akzente prüft. Beide Strings
    // bleiben absichtlich kurz genug, um innerhalb der 30-mm-Breite des `formation`-Körpers zu
    // bleiben — ein zu langes Wort überschritte die Box seitlich, was mit Diakritika nichts zu
    // tun hat und eine eigene, hier nicht behobene Grenze ist (siehe Task-9-Fix-Bericht).
    const umlaut = footInkAgainstBox('Übung');
    expect(umlaut.inkPixelCount).toBeGreaterThan(0);
    expect(umlaut.outsideBoxCount).toBe(0);

    const alleUmlaute = footInkAgainstBox('ÄÖÜ');
    expect(alleUmlaute.inkPixelCount).toBeGreaterThan(0);
    expect(alleUmlaute.outsideBoxCount).toBe(0);
  });

  const labelRecipes = Object.entries<Recipe>(RECIPES).filter(
    ([, recipe]) => recipe.spec.labels !== undefined,
  );

  it('prüft alle Zeichen mit Beschriftungszonen, nicht nur eine Auswahl', () => {
    // Sonst bliebe die Prüfung unten still grün, falls die Rezepte einmal ohne Beschriftung
    // dastünden — dieselbe Rolle wie „rastert Text überhaupt" für die Schriftbindung.
    // 16 Zeichen aus E-a, zwölf aus E-b und neun aus E-c (alle 37 Abschnitte aus E.1), dazu 21
    // aus E-d, fünf aus E-e und fünf aus E-f — **alle 68** Abschnitte des Anhangs E, seit E.2.6
    // am 18. August 2026 nachgezogen wurde. Die Prüfung unten läuft generisch über `RECIPES` und
    // braucht für die neuen Kürzelsätze keine eigene Verdrahtung; die neun je Zeichen gemessenen
    // Kappenhöhen aus E-d sind genau der Grund, aus dem sie hier grün ist (ohne sie treten sechs
    // Läufe aus ihrer Box). E.2.6 braucht keine: sein `Stapler` steht im Normgrad und bleibt in
    // der Box, hier gerastert und nicht angenommen.
    //
    // **75 seit dem Teilslice F-a**: sieben der elf F-Zeichen tragen einen Lauf — F.1.1 und F.1.2
    // (beide „MTF", zeichengleich), F.1.5 („ASB", als einziges unten rechts), F.1.8 („10"), F.1.9
    // und F.1.10 (beide „SEG") und F.1.11 („RettD"). Die vier übrigen (F.1.4, F.1.6, F.1.7,
    // `F.1.11#alternative`) tragen ihre Bedeutung allein in den randbündigen Fachdienstzeichen und
    // haben deshalb hier nichts zu rastern.
    // **85 seit F-b:** zehn der 14 neuen Darstellungen tragen mindestens einen Lauf. Die vier
    // Ausnahmen sind F.1.12#alternative, F.1.15, F.1.15#alternative und F.1.16.
    // **93 seit F-c:** acht der 14 Fahrzeugdarstellungen tragen mindestens einen Lauf; F.2.7
    // belegt die oberhalb liegende Zone und F.2.8 zwei getrennt gerasterte Textprimitive.
    // F-d ergänzt sieben beschriftete Fahrzeuge; allein F.2.15 trägt keinen Lauf.
    // F-e ergänzt die drei vollständig vermessenen Kreisläufe UHS/UHS/50. F-f ergänzt mit
    // F.3.14 genau einen weiteren vermessenen Lauf: `500` im ortsgebundenen Betreuungsplatz.
    // G ergänzt zwei, I-a drei, I-b drei, I-e fünf, I-g zwei und Anhang N sechs beschriftete Rezepte.
    expect(labelRecipes).toHaveLength(125);
  });

  /**
   * Die **vierte** Beschriftungszone. Sie steht hier und nicht bei den Rezepten, weil die 31
   * Zeichen aus E.2 erst die zweite Bauphase einträgt — der Mechanismus muss vorher gegatet sein,
   * sonst fiele die Prüfung genau dann, wenn niemand mehr damit rechnet.
   *
   * Gemessen an den fünf Referenzdateien E.2.27 bis E.2.31 (byteidentisch bis auf 0,0003 mm):
   * Tinte 22,5379 / 24,0806 / 31,5778 / 26,9998 mm.
   */
  const BELOW_RIGHT_SPEC = {
    kind: 'vehicle-water',
    bodyVariant: 'raised-hull',
    organization: 'thw',
    labels: { belowRight: 'THW' },
  } as const satisfies SymbolSpec;

  /** Hülle der deckenden Pixel eines isolierten Laufs, zurück in Millimeter gerechnet. */
  function runInkBoxMm(drawing: Drawing, size: number): {
    minXMm: number;
    minYMm: number;
    maxXMm: number;
    maxYMm: number;
  } {
    const run = drawing.children.find((primitive) => primitive.role === 'label');
    if (run?.type !== 'text') throw new Error('Die Zeichnung trägt keinen Beschriftungslauf.');
    const image = new Resvg(renderSvg({ viewBox: drawing.viewBox, children: [run] }, { size }), {
      font: resvgFontOptions(),
    }).render();
    const pixels = image.pixels;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let y = 0; y < image.height; y++) {
      for (let x = 0; x < image.width; x++) {
        if ((pixels[(y * image.width + x) * 4 + 3] ?? 0) < 128) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    const mm = (value: number): number => (value * drawing.viewBox.width) / size;
    return { minXMm: mm(minX), minYMm: mm(minY), maxXMm: mm(maxX + 1), maxYMm: mm(maxY + 1) };
  }

  it('setzt die vierte Zone an die vermessene Stelle unterhalb des Rumpfes', () => {
    const drawing = composeFromCatalog(BELOW_RIGHT_SPEC, 'Wasserfahrzeug allgemein');
    const ink = runInkBoxMm(drawing, 4096);

    // **Rechte Kante, Grundlinie und Oberkante treffen die Referenz.** Die linke Kante tut es
    // nicht, und das ist kein Zonenfehler: Arimo setzt `THW` 0,499 mm breiter als die Schrift der
    // Referenz (9,539 gegen 9,040 mm). Gegenprobe an der bestehenden Zone unten rechts, wo
    // dieselbe Differenz an derselben Stelle auftritt — sie ist damit eine Eigenschaft der
    // Schriftwahl und nicht dieser Zone.
    expect(ink.maxXMm).toBeCloseTo(31.578, 1);
    expect(ink.minYMm).toBeCloseTo(24.081, 1);
    expect(ink.maxYMm).toBeCloseTo(27.0, 1);
    // Vollständig **unterhalb** des Rumpfes: dessen Unterkante liegt bei 22,9896 mm.
    expect(ink.minYMm).toBeGreaterThan(22.9896);

    const inBody = runInkBoxMm(
      composeFromCatalog(
        { kind: 'vehicle-land', organization: 'thw', labels: { bottomRight: 'THW' } },
        'Vergleichslauf',
      ),
      4096,
    );
    // Derselbe Lauf im selben Grad: gleiche Breite, gleiche Höhe, nur versetzt. Verglichen wird
    // auf **ein Rasterpixel** genau (32 mm / 4096 px = 0,0078 mm) — feiner kann eine Messung am
    // Raster nicht sein, und eine engere Zusicherung wäre eine Behauptung über die Rundung des
    // Rasterers.
    const pixelMm = 32 / 4096;
    expect(Math.abs(ink.maxXMm - ink.minXMm - (inBody.maxXMm - inBody.minXMm))).toBeLessThanOrEqual(
      pixelMm,
    );
    expect(Math.abs(ink.maxYMm - ink.minYMm - (inBody.maxYMm - inBody.minYMm))).toBeLessThanOrEqual(
      pixelMm,
    );
    // Eigener Zeitrahmen: dieser Test rastert **zweimal** bei 4096 px und tastet dabei je
    // 16,8 Millionen Pixel ab. Auf der CI-Maschine reicht das über die Vorgabe von 5 s hinaus
    // (gemessen: der Lauf fiel dort als Zeitüberschreitung, während er lokal in unter 2 s
    // durchläuft). Die Rastergröße bleibt, weil die Zusicherung über die Laufbreite auf **ein**
    // Rasterpixel genau greift — 32 mm / 4096 px = 0,0078 mm; eine kleinere Rasterung würde die
    // Toleranz verdoppeln und damit die Aussage schwächen.
  }, 30_000);

  /**
   * **Die Zusatzgeometrie des Grundzeichens ist der einzige neue Renderpfad ohne Koordinaten-
   * gate.** `matchFingerprint` sieht nur `role: 'body'`, `checkViewBox` prüft nur das Clipping,
   * und `labelInkAgainstBox` nur `role: 'label'` — eine Deichsel, die gar nicht malt, bestünde
   * alle drei. Deshalb hier eine Rasterprüfung: sie zählt tatsächlich schwarze, deckende Pixel in
   * dem Band, in dem die Referenz Geometrie zeichnet.
   *
   * Die Bänder sind so gewählt, dass **allein** die Zusatzgeometrie hineinfällt: bei der Deichsel
   * x 1,5…3,5 mm (die Körperkante des Anhängerrumpfs liegt bei 4,0 mit Strich 0,5, also ab
   * 3,75), beim L-Rahmen die senkrechte Bahn x 0,75…1,25 mm, die 1,25 mm links der Körperkante
   * 2,5 endet.
   */
  function darkInkInBandCount(
    spec: SymbolSpec,
    band: { x0: number; x1: number; y0: number; y1: number },
  ): number {
    const size = 512;
    const drawing = composeFromCatalog(spec, 'Rasterprüfung');
    const image = new Resvg(renderSvg(drawing, { size }), { font: resvgFontOptions() }).render();
    const pixels = image.pixels;
    const scale = size / drawing.viewBox.width;
    let count = 0;
    for (let y = Math.floor(band.y0 * scale); y < Math.ceil(band.y1 * scale); y++) {
      for (let x = Math.floor(band.x0 * scale); x < Math.ceil(band.x1 * scale); x++) {
        const index = (y * image.width + x) * 4;
        const alpha = pixels[index + 3] ?? 0;
        if (alpha <= 200) continue;
        if ((pixels[index] ?? 255) < 80 && (pixels[index + 1] ?? 255) < 80 && (pixels[index + 2] ?? 255) < 80) {
          count++;
        }
      }
    }
    return count;
  }

  it('malt die Deichsel des Anhängers wirklich', () => {
    const band = { x0: 1.5, x1: 3.5, y0: 14, y1: 16 };
    const drawn = darkInkInBandCount(
      {
        kind: 'trailer',
        organization: 'thw',
        vehicleCategory: 'anhaenger-ein-rad',
        labels: { bottomRight: 'THW' },
      },
      band,
    );
    // Zwei waagerechte Bahnen von je 0,5 mm Höhe über 2 mm Breite bei 16 px/mm — das sind
    // 2 · 8 · 32 = 512 Pixel als Sollwert. Geprüft wird gegen die Hälfte davon, damit die Zeile
    // an der Kantenglättung nicht wackelt; ihr Zweck ist die Unterscheidung „malt" von „malt
    // nicht", nicht eine zweite Geometriemessung.
    expect(drawn).toBeGreaterThan(256);

    // Gegenprobe: derselbe Streifen am Landfahrzeug ist leer — dort liegt die blaue Körperfläche.
    expect(
      darkInkInBandCount(
        {
          kind: 'vehicle-land',
          organization: 'thw',
          vehicleCategory: 'kfz-kategorie-1',
          labels: { bottomRight: 'THW' },
        },
        band,
      ),
    ).toBe(0);
  });

  it('malt den L-Rahmen des Wechselladers wirklich', () => {
    const swapLoader = {
      kind: 'swap-loader-vehicle',
      organization: 'thw',
      vehicleCategory: 'kfz-kategorie-1',
      labels: { center: 'LKW', bottomRight: 'THW' },
    } as const satisfies SymbolSpec;
    // Senkrechte Bahn: 0,5 mm breit über 20 mm bei 16 px/mm — Sollwert 8 · 320 = 2560 Pixel.
    expect(darkInkInBandCount(swapLoader, { x0: 0.75, x1: 1.25, y0: 6, y1: 26 })).toBeGreaterThan(
      1280,
    );
    // Waagerechte Bahn unterhalb des Körpers (dessen Unterkante liegt bei 24,5).
    expect(
      darkInkInBandCount(swapLoader, { x0: 2.5, x1: 30, y0: 25.75, y1: 26.25 }),
    ).toBeGreaterThan(1760);
  });

  it('hält bei der vierten Zone die deklarierte boxMm ein', () => {
    for (const { inkPixelCount, outsideBoxCount } of labelInkAgainstBox(
      composeFromCatalog(BELOW_RIGHT_SPEC, 'Wasserfahrzeug allgemein'),
    )) {
      expect(inkPixelCount).toBeGreaterThan(0);
      expect(outsideBoxCount).toBe(0);
    }
  });

  it.each(labelRecipes)(
    'hält bei %s die deklarierte boxMm jedes Beschriftungslaufs ein',
    (_section, recipe) => {
      // Der schärfste Fall des Bestands ist „Öl": der Umlautpunkt steht über der Versalhöhe und
      // war beim Hanging-Zuschlag (Task 9) genau der Befund, den kein Gate gefunden hat. Hier
      // deckt ihn `ALPHABETIC_ASCENT_FRACTION` ab, „Sp" die Unterlänge nach unten und „ASH"/
      // „THW" die seitliche Grenze der halbierten unteren Boxen.
      for (const { inkPixelCount, outsideBoxCount } of labelInkAgainstBox(
        composeFromCatalog(recipe.spec, recipe.title),
      )) {
        expect(inkPixelCount).toBeGreaterThan(0);
        expect(outsideBoxCount).toBe(0);
      }
    },
  );

  it('hält die deklarierte boxMm aller gemessenen Funktionsläufe ein', () => {
    for (const definition of Object.values(FUNCTION_ROLE_DEFINITIONS)) {
      const runs = [
        ...definition.layout.roleRuns,
        ...(definition.layout.carrierRun === undefined ? [] : [definition.layout.carrierRun]),
      ];
      if (runs.length === 0) continue;
      const drawing: Drawing = {
        viewBox: DEFAULT_VIEWBOX_MM,
        children: runs.map((run) => ({
          type: 'text', role: 'label', content: run.content,
          x: run.anchorXMm, y: run.baselineYMm, sizeMm: run.sizeMm,
          anchor: run.anchor, baseline: 'alphabetic', boxMm: run.boxMm,
          minRenderPx: run.minRenderPx,
          style: { fill: run.ink === 'body-contrast' ? 'schwarz' : run.ink },
        })),
      };
      for (const { inkPixelCount, outsideBoxCount } of labelInkAgainstBox(drawing)) {
        expect(inkPixelCount, definition.id).toBeGreaterThan(0);
        expect(outsideBoxCount, definition.id).toBe(0);
      }
    }
  });
});
