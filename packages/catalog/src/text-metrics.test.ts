import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';
import {
  CompositionError,
  checkTextMetrics,
  measureTextRun,
  renderSvg,
  textWidthMm,
} from '@einsatzzeichen/core';
import { DEFAULT_VIEWBOX_MM, type Primitive } from '@einsatzzeichen/schema';
import { TEXT_FONT_FAMILY, resvgFontOptions } from './fonts.js';
import { composeFromCatalog } from './recipes.js';
import { RENDER_CASES } from './test-support/render-cases.js';
import { ARIMO_TEXT_METRICS, TEXT_METRICS_FAMILY } from './text-metrics.js';

type TextPrimitive = Extract<Primitive, { type: 'text' }>;

/**
 * Dieselbe Auflösung wie die Rasterevidenz in `fonts.test.ts` (`footInkAgainstBox`: 256 px auf
 * der 32-mm-viewBox = 8 px/mm). Eigener Helfer, weil `fonts.test.ts` einem anderen Slice gehört
 * und seine Helfer nicht exportiert.
 */
const RASTER_PX = 256;
const PX_PER_MM = RASTER_PX / DEFAULT_VIEWBOX_MM.width;

/** Linke und rechte Tintenkante (Alpha > 0) eines isoliert gerasterten Laufs, in mm. */
function inkExtentMm(run: TextPrimitive): { minXMm: number; maxXMm: number } {
  const svg = renderSvg({ viewBox: DEFAULT_VIEWBOX_MM, children: [run] }, { size: RASTER_PX });
  const image = new Resvg(svg, { font: resvgFontOptions() }).render();
  const pixels = image.pixels;
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const alpha = pixels[(y * image.width + x) * 4 + 3] ?? 0;
      if (alpha === 0) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
  }
  if (!Number.isFinite(minX)) throw new Error(`Lauf "${run.content}" hat keine Tinte erzeugt.`);
  // Ein Pixel deckt [x, x+1): die rechte Tintenkante liegt am Ende des letzten Pixels.
  return { minXMm: minX / PX_PER_MM, maxXMm: (maxX + 1) / PX_PER_MM };
}

function run(content: string, sizeMm: number, anchor: TextPrimitive['anchor'] = 'middle'): TextPrimitive {
  return {
    type: 'text',
    content,
    // Der Anker so, dass der Lauf in der viewBox bleibt — ein an der viewBox geclippter Lauf
    // hätte eine gerasterte Kante, die nichts über die Schrift sagt.
    x: anchor === 'start' ? 1 : anchor === 'end' ? 31 : 16,
    y: 12,
    sizeMm,
    anchor,
    baseline: 'alphabetic',
    // Die Box ist für die Kalibrierung unerheblich — gemessen wird die Tinte, nicht die Box.
    boxMm: { xMm: 0, yMm: 0, widthMm: 32, heightMm: 32 },
    style: { fill: 'schwarz' },
  };
}

describe('ARIMO_TEXT_METRICS', () => {
  it('gilt für dieselbe Schriftfamilie, die der Renderer bindet', () => {
    expect(TEXT_METRICS_FAMILY).toBe(TEXT_FONT_FAMILY);
  });

  it('kennt den Grundbestand (ASCII, Umlaute, ß) und meldet Tofu als unbekannt', () => {
    expect(textWidthMm('Zug ÄÖÜäöüß 0-9/', 1, ARIMO_TEXT_METRICS).unknownCodepoints).toEqual([]);
    // U+1F600 (Emoji) führt Arimo nicht.
    expect(ARIMO_TEXT_METRICS.advanceEm(0x1f600)).toBeUndefined();
  });

  it('liefert Vorschübe in em der 2048er-Einheit (Leerzeichen 569/2048)', () => {
    expect(ARIMO_TEXT_METRICS.advanceEm(0x20)).toBeCloseTo(569 / 2048, 12);
  });
});

/**
 * Kalibrierung: Die gerechnete Tinte (Vorschübe mit Kerning, an den Enden auf die
 * Glyphen-Bounding-Box gekürzt) muss die gerasterte Tinte **überdecken** — links wie rechts —,
 * sonst wäre das Gate nicht konservativ; und sie darf nicht grob überschätzen, sonst meldete es
 * Boxen, die die Rasterevidenz belegt. Läufe wie in `fonts.test.ts` (Fußzone 4 mm,
 * Beschriftungen 7,08 / 4,24 mm), dazu Kerning-Kandidaten (AV, Ty, Ta) und Glyphen, die über
 * ihren Vorschub hinausragen können (j, f).
 *
 * Die Schranke ist **ein Rasterpixel** (1/8 mm) je Seite: der Renderer setzt die Tinte
 * subpixelgenau, das Raster rundet auf ganze Pixel, und die Alpha-Prüfung nimmt auch das
 * äußerste Mischpixel mit. Das ist dieselbe Schwelle wie `BOX_TOLERANCE_MM` im Gate.
 */
describe('Kalibrierung: gerechnete gegen gerasterte Tinte (8 px/mm)', () => {
  const cases: readonly [string, number, TextPrimitive['anchor']][] = [
    ['Zug jgpqy', 4, 'middle'],
    ['Übung', 4, 'middle'],
    ['ÄÖÜ', 4, 'middle'],
    ['Strömungsretter', 4.24, 'middle'],
    ['MTF', 7.08, 'middle'],
    ['AVA Ty', 7.08, 'start'],
    ['GW Tauchen', 4.63, 'start'],
    ['jjj fff', 7.08, 'end'],
    ['VoIP', 10, 'middle'],
    ['KatSL', 10.61, 'middle'],
  ];
  const onePixelMm = 1 / PX_PER_MM;

  it.each(cases)('"%s" bei %s mm: Tinte liegt innerhalb eines Pixels um die Rechnung', (content, sizeMm, anchor) => {
    const primitive = run(content, sizeMm, anchor);
    const metric = measureTextRun(primitive, ARIMO_TEXT_METRICS);
    const ink = inkExtentMm(primitive);
    expect(ink.minXMm).toBeGreaterThanOrEqual(metric.inkMinXMm - onePixelMm);
    expect(ink.minXMm).toBeLessThanOrEqual(metric.inkMinXMm + onePixelMm);
    expect(ink.maxXMm).toBeLessThanOrEqual(metric.inkMaxXMm + onePixelMm);
    expect(ink.maxXMm).toBeGreaterThanOrEqual(metric.inkMaxXMm - onePixelMm);
  });
});

describe('Katalogbestand unter dem Textmetrik-Gate', () => {
  it.each(RENDER_CASES)('$id: jeder Textlauf passt in seine deklarierte Box', ({ drawing }) => {
    expect(checkTextMetrics(drawing, ARIMO_TEXT_METRICS)).toEqual([]);
  });

  it('wirft designation-too-wide über den echten Katalog-Port für eine zu lange Fußzone', () => {
    let thrown: unknown;
    try {
      composeFromCatalog({ kind: 'formation', designation: 'Wasserrettungszugführung' });
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(CompositionError);
    const issues = (thrown as CompositionError).issues;
    expect(issues.map((issue) => issue.rule)).toEqual(['designation-too-wide']);
    expect(issues[0]?.message).toContain('"Wasserrettungszugführung"');
    expect(issues[0]?.message).toContain('30 mm');
  });

  it('lässt eine Fußzone durch, die in die 30-mm-Körperbreite passt', () => {
    // „Wasserrettung" misst bei 4 mm rund 25,6 mm Tinte; „Wasserrettungszug" schon 34,0 mm.
    const drawing = composeFromCatalog({ kind: 'formation', designation: 'Wasserrettung' });
    expect(checkTextMetrics(drawing, ARIMO_TEXT_METRICS)).toEqual([]);
  });
});
