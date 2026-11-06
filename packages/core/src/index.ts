// `@einsatzzeichen/core` ab 7.0 (ESZ-151): die Beschreibung und ihre Ausgabe, sonst nichts.
//
// Wer ein Zeichen will, beschreibt es (`Sign`), zeichnet es mit `draw` und gibt es mit
// `renderSvg` oder `renderCanvas` aus. Alles andere steht in einem Subpfad:
//
// - `@einsatzzeichen/core/exact`  — der Bauplan (`SymbolSpec`): `drawSymbol`, `compose`, Regeln,
//   Vokabular, Codecs v1, Herkunft, `resolve`/`fromExact`
// - `@einsatzzeichen/core/blocks` — Bausteine, Geometrie, Layout, Textlaufweiten
// - `@einsatzzeichen/core/sketch` — die Kommunikationsskizze
// - `@einsatzzeichen/core/gates`  — Prüfwerkzeug: Regelkataloge, Gates, Kontrast, Fingerprint
//
// Den Umstieg von 6.x schreibt `einsatzzeichen codemod:7` (Paket `@einsatzzeichen/cli`).
// Entscheidung: docs/decisions/2026-11-06-esz-151-wurzel-7-0.md

// ── Beschreibung (ESZ-149) ──
export * from './sign/index.js';
export type { Drawing } from '@einsatzzeichen/schema';

// ── Ausgabe ──
export { renderSvg, ID_PREFIX_PATTERN, type SvgOptions } from './render/svg.js';
export { renderCanvas, type CanvasOptions } from './render/canvas.js';
export { REFERENCE_THEME, type RenderHalo, type RenderTheme } from './render/theme.js';
export {
  ACCESSIBLE_LIGHT_THEME,
  DARK_THEME,
  PRINT_MONOCHROME_THEME,
  RENDER_THEMES,
  isRenderThemeId,
  renderTheme,
  type RenderThemeId,
} from './geometry/render-themes.js';
// Rasterkanäle (Karte, Canvas) brauchen Pixelmaß und Mindeststrich.
export { rasterDimensionsForWidth, type RasterDimensions } from './render/raster-dimensions.js';
export { RASTER_MIN_STROKE_WIDTH_PX } from './render/min-stroke-width.js';
// Die Schriftfamilie der Kürzel, um `@einsatzzeichen/core/fonts/*` zu laden (Browser, resvg).
export { TEXT_FONT_FAMILY_ATTR } from './render/text-policy.js';
