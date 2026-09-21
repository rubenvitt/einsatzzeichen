import { fileURLToPath } from 'node:url';
import { TEXT_FONT_FAMILY_ATTR } from '@einsatzzeichen/core';

/**
 * Die einzige Schrift des Projekts. Sie liegt als Datei im Repository, weil `@resvg/resvg-js`
 * mit `loadSystemFonts: false` überhaupt keinen Text rastert und mit Systemschriften ein
 * maschinenabhängiges Ergebnis liefert — beides würde die Snapshot-Evidenz entwerten.
 *
 * Der Wert selbst kommt aus core (`TEXT_FONT_FAMILY_ATTR` in text-policy.ts), nicht als eigenes
 * Literal: core setzt `font-family` in svg.ts/canvas.ts, catalog bindet dieselbe Schrift für die
 * Rasterung (`resvgFontOptions()` unten). Zwei Literale wären ohne erzwungene Synchronisation
 * auseinanderlaufbar; die Abhängigkeitsrichtung catalog → core ist bereits gegeben.
 */
export const TEXT_FONT_FAMILY = TEXT_FONT_FAMILY_ATTR;

export const TEXT_FONT_PATH = fileURLToPath(
  new URL('../assets/Arimo[wght].ttf', import.meta.url),
);

/**
 * Prüfsumme des Upstream-Originals (Google Fonts, Arimo 1.341, 496 268 Byte), aus dem das
 * eingecheckte Subset erzeugt wurde. `scripts/font/subset-arimo.sh` prüft den Download dagegen,
 * bevor es etwas erzeugt — der Wert ist die Provenienzkette, nicht die Datei im Repository.
 */
export const TEXT_FONT_SOURCE_SHA256 =
  'e43898b143ec826ac8cb4034816458a7047fbe0836558de2a1f8c6223ae3e0ca';

/**
 * Prüfsumme der eingecheckten Datei: seit 2026-08-28 ein Subset des Originals (82 756 statt
 * 496 268 Byte, −83,3 %), erzeugt mit fontTools 4.63.0 durch `scripts/font/subset-arimo.sh`:
 *
 *   pyftsubset 'Arimo[wght].ttf' --output-file=… \
 *     --unicodes='U+0000-00FF,U+0100-017F,U+0180-024F,U+2000-206F,U+20AC,U+2122,U+2212,U+FEFF,U+FFFD' \
 *     --layout-features='*' --notdef-glyph --notdef-outline --recommended-glyphs \
 *     --name-IDs='*' --name-legacy --name-languages='*' --glyph-names \
 *     --no-prune-unicode-ranges --no-prune-codepage-ranges --no-recalc-bounds
 *
 * Die wght-Achse (400–700) bleibt erhalten (visual-proof.ts setzt font-weight 700), Hinting und
 * die Kopftabellen ebenso — alle 256 SVG- und 526 Kontaktbogen-Snapshots rastern mit dem Subset
 * bit-identisch. Eine ausgetauschte Schrift ist damit ein Testfehler und kein stiller
 * Snapshot-Drift.
 */
export const TEXT_FONT_SHA256 = 'e68be22b52529b0541129578216dab440cb00026114868370b6d34798b2ce5a3';

/**
 * Statische Fettinstanz (wght 700) derselben Schrift, aus dem Subset erzeugt von
 * `scripts/font/subset-arimo.sh` (fontTools `varLib.instancer`, Zeitstempel unverändert, damit die
 * Datei reproduzierbar ist). Nötig, weil resvg 2.6 die wght-Achse der variablen Datei nicht
 * auswertet: `font-weight="700"` rastert mit ihr allein bit-identisch zu 400. Liegt diese Datei
 * zusätzlich vor, wählt resvg sie für fett gesetzte Läufe (`fontWeight: 700` am Textprimitiv);
 * nicht fette Läufe rastern unverändert. Einen kursiven Schnitt führt das Projekt nicht.
 */
export const TEXT_FONT_BOLD_PATH = fileURLToPath(
  new URL('../assets/Arimo-Bold.ttf', import.meta.url),
);

/** Prüfsumme der eingecheckten Fettinstanz. */
export const TEXT_FONT_BOLD_SHA256 =
  '0f8eb8ed8b92a80cbbbcadb382089e8fda8d50015b0e36212c341c1a6b96341a';

export function resvgFontOptions(): {
  fontFiles: string[];
  loadSystemFonts: false;
  defaultFontFamily: string;
} {
  return {
    fontFiles: [TEXT_FONT_PATH, TEXT_FONT_BOLD_PATH],
    loadSystemFonts: false,
    defaultFontFamily: TEXT_FONT_FAMILY,
  };
}
