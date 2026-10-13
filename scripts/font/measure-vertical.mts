/**
 * Misst die vertikalen Tintenanteile der Katalogschrift, aus denen `text-policy.ts` in core seine
 * Konstanten bezieht (`ALPHABETIC_ASCENT_FRACTION`, `ALPHABETIC_DESCENT_FRACTION`,
 * `DIACRITIC_HEADROOM_FRACTION`). Gerastert wird mit `resvgFontOptions()`, also mit genau den
 * Dateien und dem Rasterer der Prüfgates; die Tinte ist die Hülle über den Alphakanal.
 *
 * Je Lauf zwei Auflösungen: asymptotisch (4096 px auf der 32-mm-viewBox, 128 px/mm) und die der
 * Rasterevidenz in `fonts.test.ts` (256 px, 8 px/mm). Bindend ist der jeweils größere Wert; die
 * Konstanten runden ihn auf.
 *
 * Aufruf: `./node_modules/.bin/tsx scripts/font/measure-vertical.mts`
 */
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const R = fileURLToPath(new URL('../../packages/', import.meta.url));
const { resvgFontOptions, TEXT_FONT_FAMILY } = await import(R + 'conformance/src/fonts.ts');

const VIEWBOX_MM = 32;
const BASELINE_MM = 20;
const ANCHOR_X_MM = 2;

type Baseline = 'alphabetic' | 'hanging';

/** Tinte eines Laufs oberhalb und unterhalb des Ankers, in mm (oben positiv). */
function inkAroundAnchor(
  content: string,
  sizeMm: number,
  baseline: Baseline,
  widthPx: number,
  weight: number,
): { aboveMm: number; belowMm: number } {
  const weightAttr = weight === 400 ? '' : ` font-weight="${weight}"`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX_MM} ${VIEWBOX_MM}">` +
    `<text x="${ANCHOR_X_MM}" y="${BASELINE_MM}" dominant-baseline="${baseline}" ` +
    `font-family="${TEXT_FONT_FAMILY}" font-size="${sizeMm}"${weightAttr}>${content}</text></svg>`;
  const image = new Resvg(svg, {
    fitTo: { mode: 'width', value: widthPx },
    font: resvgFontOptions(),
  }).render();
  const { width, height, pixels } = image;
  let top = height;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if ((pixels[(y * width + x) * 4 + 3] ?? 0) > 0) {
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
        break;
      }
    }
  }
  const pxPerMm = widthPx / VIEWBOX_MM;
  const anchorPx = BASELINE_MM * pxPerMm;
  // Dieselbe Zählweise wie `rasterPixelOutsideBox` in fonts.test.ts: Ein Pixel liegt innerhalb,
  // solange seine ganzzahlige Koordinate (die obere Kante) zwischen den Boxkanten liegt.
  return { aboveMm: (anchorPx - top) / pxPerMm, belowMm: (bottom - anchorPx) / pxPerMm };
}

const ASCENT_RUNS = ['Öl', 'ÄÖÜ', 'Sp', 'jgpqy', 'Qj', 'B', 'THW'];
const SIZES_MM = [7.08, 4.24];
const RESOLUTIONS = [
  { label: 'asymptotisch (128 px/mm)', widthPx: 4096 },
  { label: 'Rasterevidenz (8 px/mm)', widthPx: 256 },
];

for (const weight of [400, 500]) {
  console.log(`\n## Stufe ${weight}, baseline alphabetic`);
  for (const { label, widthPx } of RESOLUTIONS) {
    let ascent = { value: 0, run: '' };
    let descent = { value: 0, run: '' };
    for (const sizeMm of SIZES_MM) {
      for (const run of ASCENT_RUNS) {
        const { aboveMm, belowMm } = inkAroundAnchor(run, sizeMm, 'alphabetic', widthPx, weight);
        if (aboveMm / sizeMm > ascent.value) ascent = { value: aboveMm / sizeMm, run: `${run} @ ${sizeMm}` };
        if (belowMm / sizeMm > descent.value) descent = { value: belowMm / sizeMm, run: `${run} @ ${sizeMm}` };
      }
    }
    console.log(
      `${label}: Ober ${ascent.value.toFixed(4)} (${ascent.run}), ` +
        `Unter ${descent.value.toFixed(4)} (${descent.run})`,
    );
  }
  console.log(`## Stufe ${weight}, baseline hanging: Überstand über den Anker je sizeMm`);
  for (const { label, widthPx } of RESOLUTIONS) {
    let headroom = { value: 0, run: '' };
    for (const sizeMm of [4, 10]) {
      for (const run of ['Ä', 'Ö', 'Ü', 'Übung', 'ÄÖÜ']) {
        const { aboveMm } = inkAroundAnchor(run, sizeMm, 'hanging', widthPx, weight);
        if (aboveMm / sizeMm > headroom.value) headroom = { value: aboveMm / sizeMm, run: `${run} @ ${sizeMm}` };
      }
    }
    console.log(`${label}: ${headroom.value.toFixed(4)} (${headroom.run})`);
  }
}
