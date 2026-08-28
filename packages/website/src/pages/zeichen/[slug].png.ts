import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import type { APIRoute, GetStaticPaths } from 'astro';
import { TEXT_FONT_FAMILY, TEXT_FONT_SHA256, resvgFontOptions } from '@einsatzzeichen/catalog';
import { renderSvg } from '@einsatzzeichen/core';
import { loadSnapshot } from '../../lib/snapshot';

/**
 * Das Zeichen als PNG-Datei: `/zeichen/<slug>.png`, 256 px breit, weißer Grund (Spec §3,
 * „Als PNG herunterladen").
 *
 * Für alle, die kein SVG einsetzen können — Präsentationen, Laufkarten, Ausdrucke, ältere
 * Programme. Weiß statt durchsichtig, weil ein durchsichtiges PNG auf dunklen Folien unlesbar wird
 * und niemand den Grund sieht, bevor es gedruckt ist.
 *
 * **Die Schriftbindung ist der heikle Teil.** `@resvg/resvg-js` rastert Text ohne Fontdatei zu null
 * Pixeln — stillschweigend (belegt in `packages/catalog/src/fonts.test.ts`). Kürzel wie „DLRG" oder
 * „MTF" wären dann im Bild einfach weg, und niemand merkte es am Build. `resvgFontOptions()` aus
 * dem Katalog liefert den Pfad zur Arimo-Datei, **aber** dieser Pfad entsteht aus
 * `import.meta.url` der Katalogquelle: im gebündelten Build zeigt er auf das Chunk-Verzeichnis
 * unter `dist/`, nicht auf `packages/catalog/assets`. Genau das ist hier zuerst passiert — die
 * ersten gebauten PNG waren byteweise identisch mit einer Rasterung ganz ohne Schrift.
 *
 * Deshalb: der Pfad wird hier aus dem Arbeitsverzeichnis des Builds abgeleitet, der Fund gegen
 * `TEXT_FONT_SHA256` geprüft, und wenn keine passende Datei da ist, bricht der Build ab. Ein PNG
 * mit unsichtbarem Kürzel wäre schlimmer als ein fehlgeschlagener Build (Spec §7).
 */
const WIDTH = 256;

/** Kandidaten in dieser Reihenfolge: Arbeitsverzeichnis des Builds, dann der Pfad des Katalogs. */
function textFontFile(): string {
  const candidates = [
    resolve(process.cwd(), '../catalog/assets/Arimo[wght].ttf'),
    ...resvgFontOptions().fontFiles,
  ];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    const digest = createHash('sha256').update(readFileSync(candidate)).digest('hex');
    if (digest === TEXT_FONT_SHA256) return candidate;
  }
  throw new Error(
    'Die Schriftdatei des Katalogs (Arimo-Subset) ist von der Website aus nicht auffindbar oder ' +
      'hat einen anderen Inhalt als erwartet. Ohne sie rastert resvg jeden Text zu null Pixeln, ' +
      'und die PNG-Downloads verlören ihre Kürzel. Gesucht wurde in: ' +
      candidates.join(', '),
  );
}

const FONT = {
  fontFiles: [textFontFile()],
  loadSystemFonts: false as const,
  defaultFontFamily: TEXT_FONT_FAMILY,
};

export const getStaticPaths: GetStaticPaths = () =>
  loadSnapshot().symbols.map((symbol) => ({ params: { slug: symbol.slug } }));

export const GET: APIRoute = ({ params }) => {
  const slug = params.slug;
  const symbol = loadSnapshot().symbols.find((entry) => entry.slug === slug);
  if (symbol === undefined) {
    // Kein leeres Bild als Rückfall (Spec §7): eine Route ohne Zeichen ist ein Fehler im Build.
    throw new Error(`Kein Zeichen mit dem Kürzel „${String(slug)}" im Katalog-Snapshot.`);
  }
  const svg = renderSvg(symbol.drawing, { size: WIDTH, idPrefix: symbol.slug });
  const png = new Resvg(svg, { font: FONT, background: '#ffffff' }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'content-type': 'image/png' } });
};
