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

/**
 * Prüfsumme des aufrechten Upstream-Originals: `IBMPlexSans[wdth,wght].ttf` aus google/fonts
 * (`ofl/ibmplexsans/`, IBM Plex Sans 3.201, 537 244 Byte, Achsen wght 100–700 und wdth 75–100).
 * `scripts/font/derive-einsatzzeichen-sans.sh` prüft den Download dagegen, bevor es etwas erzeugt
 * — der Wert ist die Provenienzkette, nicht eine Datei im Repository.
 */
export const TEXT_FONT_SOURCE_SHA256 =
  '3b031aa4216174205bd8471f88a49b91f093169e9e87bd5262242bc5967fe2e3';

/**
 * Prüfsumme des kursiven Upstream-Originals: `IBMPlexSans-Italic[wdth,wght].ttf` aus demselben
 * Verzeichnis (599 624 Byte, dieselben Achsen). Aus ihm leitet das Skript die Kursivinstanz ab.
 */
export const TEXT_FONT_ITALIC_SOURCE_SHA256 =
  '0b94c5e981993764db32bf9c610ecc60cbd34ad77ec2f10ba03c64ab75124d8e';

/**
 * „Einsatzzeichen Sans" (LFH-790, Option C, Weg R): aus IBM Plex Sans abgeleitet und umbenannt,
 * weil „Plex" ein reservierter Name der OFL ist. Jede der vier Dateien ist eine statische Instanz
 * bei **wdth 86** (die auf die Laufweite der Referenz geeichte Breite) und einer Stufe, erzeugt von
 * `scripts/font/derive-einsatzzeichen-sans.sh`:
 *
 *   pyftsubset <Original> --output-file=… \
 *     --unicodes='U+0000-00FF,U+0100-017F,U+0180-024F,U+2000-206F,U+20AC,U+2122,U+2212,U+FEFF,U+FFFD' \
 *     --layout-features='*' --notdef-glyph --notdef-outline --recommended-glyphs \
 *     --name-IDs='*' --name-legacy --name-languages='*' --glyph-names \
 *     --no-prune-unicode-ranges --no-prune-codepage-ranges --no-recalc-bounds
 *   → fontTools varLib.instancer {wght: <Stufe>, wdth: 86} → neue Namen (derive_instance.py)
 *
 * resvg 2.6 wertet die Achsen einer variablen Schrift nicht aus; deshalb liegt jede Stufe als
 * eigene Datei vor. Die Namen folgen dem Muster, unter dem resvg sie wählt (Notiz LFH-790 §10.5):
 * 400 und 700 sind Regular und Bold der Familie „Einsatzzeichen Sans", 500 heißt „Einsatzzeichen
 * Sans Medium" mit der typografischen Familie „Einsatzzeichen Sans" (Namenseintrag 16).
 *
 * Die Prüfsummen machen eine ausgetauschte Schrift zu einem Testfehler statt zu einem stillen
 * Snapshot-Drift.
 */
export const TEXT_FONT_PATH = fileURLToPath(
  new URL('../assets/EinsatzzeichenSans-Regular.ttf', import.meta.url),
);

/** Prüfsumme der eingecheckten Instanz wght 400. */
export const TEXT_FONT_SHA256 = 'c6bc161fc5f493dc032a2f93930960cbe50afc0b7a689d18a493c2c87b832a3e';

/**
 * Instanz wght 700. Der Katalog setzt keinen fetten Lauf; die Datei dient eigener IR mit
 * `fontWeight: 700`, der Beschriftung von `visual-proof.ts` und den Bildunterschriften der
 * Kontaktbögen (`sans-serif`, fett, über `defaultFontFamily`).
 */
export const TEXT_FONT_BOLD_PATH = fileURLToPath(
  new URL('../assets/EinsatzzeichenSans-Bold.ttf', import.meta.url),
);

/** Prüfsumme der eingecheckten Instanz wght 700. */
export const TEXT_FONT_BOLD_SHA256 =
  '537adabfc02caa06f6a8d93b77d6ad11383d3c579d780f259fe37f08dc66a805';

/**
 * Instanz wght 500 („Medium"). In ihr setzt der Katalog allen Text (`CATALOG_TEXT_FONT_WEIGHT` in
 * core): Die Referenz kennt nur eine Strichstärke, 0,156 × Versalhöhe, und Einsatzzeichen Sans
 * 500 trifft sie genau (Notiz LFH-790 §10.4). Läufe in 400 und 700 rastern mit ihr bit-gleich wie
 * ohne sie.
 */
export const TEXT_FONT_MEDIUM_PATH = fileURLToPath(
  new URL('../assets/EinsatzzeichenSans-Medium.ttf', import.meta.url),
);

/** Prüfsumme der eingecheckten Instanz wght 500. */
export const TEXT_FONT_MEDIUM_SHA256 =
  'bbc9fd666da63061d9eee5d45b7be09a4e5e018fb51a739c2f82c180ac900573';

/**
 * Kursivinstanz wght 500 („Medium Italic"). Die Referenz setzt genau einen Lauf kursiv,
 * „Bezeichnung" in D.1.1. Namen: Familie „Einsatzzeichen Sans Medium" (ID 1), Stil „Italic"
 * (ID 2), typografische Familie „Einsatzzeichen Sans" (ID 16), Stil „Medium Italic" (ID 17),
 * Kursiv-Bit gesetzt.
 *
 * resvg gibt **jedem** kursiven Lauf diese Datei, auch einem, der 400 oder 700 verlangt; ein
 * Browser zeichnete dort eine andere Stufe. Deshalb lässt das Schema `fontStyle: 'italic'` nur
 * zusammen mit `fontWeight: 500` zu; das Textmetrik-Gate in core prüft das. Aufrechte Läufe
 * rastern mit ihr bit-gleich wie ohne sie. Die Schrift neigt um 11,3°, die Referenz um 9,0°, und
 * ihr g ist zweistöckig; beides hingenommen (Notiz LFH-790 §10.4).
 */
export const TEXT_FONT_MEDIUM_ITALIC_PATH = fileURLToPath(
  new URL('../assets/EinsatzzeichenSans-MediumItalic.ttf', import.meta.url),
);

/** Prüfsumme der eingecheckten Kursivinstanz wght 500. */
export const TEXT_FONT_MEDIUM_ITALIC_SHA256 =
  '4f0476a9d3a73853264dd621b45124ba9c2a8b7e7b8ba14bcea7454010be0f50';

export function resvgFontOptions(): {
  fontFiles: string[];
  loadSystemFonts: false;
  defaultFontFamily: string;
} {
  return {
    fontFiles: [
      TEXT_FONT_PATH,
      TEXT_FONT_MEDIUM_PATH,
      TEXT_FONT_BOLD_PATH,
      TEXT_FONT_MEDIUM_ITALIC_PATH,
    ],
    loadSystemFonts: false,
    defaultFontFamily: TEXT_FONT_FAMILY,
  };
}
