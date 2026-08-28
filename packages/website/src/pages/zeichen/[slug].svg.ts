import type { APIRoute, GetStaticPaths } from 'astro';
import { renderSvg } from '@einsatzzeichen/core';
import { loadSnapshot } from '../../lib/snapshot';

/**
 * Das Zeichen als SVG-Datei: `/zeichen/<slug>.svg` (Spec §3, „Als SVG herunterladen").
 *
 * Ohne feste Größe — ein SVG ohne `width`/`height` skaliert überall mit, in Word so gut wie in
 * einer Webseite. Wer eine feste Kantenlänge braucht, nimmt das PNG daneben.
 *
 * Gezeichnet wird aus `drawing`, also aus derselben Zeichnung, die auch die Vorschau der
 * Symbolseite zeigt, in der Referenzpalette. Kein Hintergrund: die Fläche bleibt durchsichtig,
 * damit das Zeichen auf jeder Karte und jeder Folie sitzt.
 *
 * Die Route liegt neben `[slug].astro`; Astro unterscheidet beide an der Endung, wie schon bei
 * `kontaktbogen/[datei].svg.ts`.
 */
export const getStaticPaths: GetStaticPaths = () =>
  loadSnapshot().symbols.map((symbol) => ({ params: { slug: symbol.slug } }));

export const GET: APIRoute = ({ params }) => {
  const slug = params.slug;
  const symbol = loadSnapshot().symbols.find((entry) => entry.slug === slug);
  if (symbol === undefined) {
    // Kein leeres SVG als Rückfall (Spec §7): eine Route ohne Zeichen ist ein Fehler im Build.
    throw new Error(`Kein Zeichen mit dem Kürzel „${String(slug)}" im Katalog-Snapshot.`);
  }
  return new Response(renderSvg(symbol.drawing, { idPrefix: symbol.slug }), {
    headers: { 'content-type': 'image/svg+xml; charset=utf-8' },
  });
};
