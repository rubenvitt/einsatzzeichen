import { fileURLToPath } from 'node:url';

/**
 * Die einzige Schrift des Projekts. Sie liegt als Datei im Repository, weil `@resvg/resvg-js`
 * mit `loadSystemFonts: false` überhaupt keinen Text rastert und mit Systemschriften ein
 * maschinenabhängiges Ergebnis liefert — beides würde die Snapshot-Evidenz entwerten.
 */
export const TEXT_FONT_FAMILY = 'Arimo';

export const TEXT_FONT_PATH = fileURLToPath(
  new URL('../assets/Arimo[wght].ttf', import.meta.url),
);

/** Eine ausgetauschte Schrift ist damit ein Testfehler und kein stiller Snapshot-Drift. */
export const TEXT_FONT_SHA256 = 'e43898b143ec826ac8cb4034816458a7047fbe0836558de2a1f8c6223ae3e0ca';

export function resvgFontOptions(): {
  fontFiles: string[];
  loadSystemFonts: false;
  defaultFontFamily: string;
} {
  return {
    fontFiles: [TEXT_FONT_PATH],
    loadSystemFonts: false,
    defaultFontFamily: TEXT_FONT_FAMILY,
  };
}
