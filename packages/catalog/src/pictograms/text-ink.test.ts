import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';
import { renderSvg } from '@einsatzzeichen/core';
import { DEFAULT_VIEWBOX_MM, type Primitive } from '@einsatzzeichen/schema';
import { resvgFontOptions } from '../fonts.js';
import { ALL_PICTOGRAMS, pictogramVariantKey } from './index.js';

/**
 * Die eine Zusicherung im Katalog, hinter der kein Gate steht.
 *
 * `boxMm` ist bei Text keine Messung, sondern eine Vorgabe: `boundsOfMm` gibt sie unverändert
 * zurück, und `checkBox` prüft nur, dass sie in der Piktogrammbox liegt — nicht, dass der Text
 * tatsächlich hineinpasst. Eine zu klein deklarierte Box fällt damit in keinem der vier Gates
 * auf. `docs/decisions/2026-08-09-textprimitiv-und-fusszone.md` benennt diese Lücke ausdrücklich
 * als offen.
 *
 * Dieser Test schließt sie für den Katalogbestand: er rastert jeden Textlauf einzeln und zählt
 * die dunklen Pixel außerhalb seiner deklarierten Box. Er ersetzt kein allgemeines
 * Textmetrik-Gate in `core` — er prüft die Zeichen, die es gibt, nicht die Form an sich.
 *
 * Warum nicht in `core`: die Rasterung braucht eine Schriftbindung, und die liegt in `catalog`
 * (`fonts.ts`). Die Paketrichtung `catalog → core` bliebe sonst nicht erhalten.
 */
const RASTER_PX = 512;
const PX_PER_MM = RASTER_PX / DEFAULT_VIEWBOX_MM.width;

/**
 * Ein Pixel Toleranz an jeder Kante. Die Rasterung setzt Kantenglättung ein: das äußerste
 * Pixel einer Glyphe ist ein Mischwert und kann bei exakt bündiger Box eine Zeile weiter
 * erscheinen, ohne dass die Box zu klein wäre.
 */
const EDGE_TOLERANCE_PX = 1;

type TextPrimitive = Extract<Primitive, { type: 'text' }>;

function textsOf(primitives: readonly Primitive[]): readonly TextPrimitive[] {
  return primitives.flatMap((primitive) =>
    primitive.type === 'text'
      ? [primitive]
      : primitive.type === 'group'
        ? textsOf(primitive.children)
        : [],
  );
}

function inkOutsideBox(text: TextPrimitive): { outside: number; dark: number } {
  const svg = renderSvg(
    { viewBox: DEFAULT_VIEWBOX_MM, children: [text] },
    { size: RASTER_PX, idPrefix: 'text-ink' },
  );
  const { pixels } = new Resvg(svg, { font: resvgFontOptions(), background: 'white' }).render();

  const left = text.boxMm.xMm * PX_PER_MM - EDGE_TOLERANCE_PX;
  const right = (text.boxMm.xMm + text.boxMm.widthMm) * PX_PER_MM + EDGE_TOLERANCE_PX;
  const top = text.boxMm.yMm * PX_PER_MM - EDGE_TOLERANCE_PX;
  const bottom = (text.boxMm.yMm + text.boxMm.heightMm) * PX_PER_MM + EDGE_TOLERANCE_PX;

  let outside = 0;
  let dark = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i]! >= 128) continue;
    dark++;
    const pixel = i / 4;
    const x = pixel % RASTER_PX;
    const y = Math.floor(pixel / RASTER_PX);
    if (x < left || x > right || y < top || y > bottom) outside++;
  }
  return { outside, dark };
}

const WITH_TEXT = ALL_PICTOGRAMS.flatMap((definition) =>
  textsOf(definition.primitives).map(
    (text) => [`${pictogramVariantKey(definition)} "${text.content}"`, text] as const,
  ),
);

describe('Texttinte gegen die deklarierte Box', () => {
  it.runIf(WITH_TEXT.length > 0).each(WITH_TEXT)('hält %s in seiner boxMm', (_label, text) => {
    const { outside, dark } = inkOutsideBox(text);
    // Der Dunkelpixel-Zähler unterscheidet „passt hinein" von „rastert gar nicht": ohne
    // Schriftbindung liefert resvg ein leeres Bild, und ein leeres Bild hätte trivial null
    // Pixel außerhalb der Box.
    expect(dark).toBeGreaterThan(100);
    expect(outside).toBe(0);
  });

  it('prüft überhaupt etwas, sobald der Katalog Text trägt', () => {
    // Ohne diese Zusicherung wäre die Suite auch dann grün, wenn die Fallliste oben durch einen
    // Umbau leer liefe — der Katalog trägt seit J.3 typografische Zeichen.
    expect(WITH_TEXT.length).toBeGreaterThan(0);
  });
});
