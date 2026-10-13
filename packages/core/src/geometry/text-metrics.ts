import type { TextMetrics } from '../text-metrics.js';
import textMetrics from '../assets/einsatzzeichen-sans-metrics.json' with { type: 'json' };
import textBoldMetrics from '../assets/einsatzzeichen-sans-bold-metrics.json' with { type: 'json' };
import textMediumMetrics from '../assets/einsatzzeichen-sans-medium-metrics.json' with { type: 'json' };
import textMediumItalicMetrics from '../assets/einsatzzeichen-sans-medium-italic-metrics.json' with { type: 'json' };

/**
 * Laufweiten von „Einsatzzeichen Sans" für das Textmetrik-Gate in `core` (`checkTextMetrics`, LFH-410) und die
 * Kompositionsprüfung (`CatalogPorts.textMetrics`, LFH-411).
 *
 * Die Quelle ist `assets/einsatzzeichen-sans-metrics.json`, ein **Generat** aus `EinsatzzeichenSans-Regular.ttf`
 * (`scripts/font/*`): je cmap-Eintrag der hmtx-Vorschub (`advances`) und die horizontale
 * Bounding-Box der Kontur (`inkExtents`) und die Unterschneidung (`kerning`, in Klassen) der
 * Instanz (Gewicht 400), in Font-Einheiten bei `unitsPerEm` 1000. `inkExtents` führt die volle Box `[xMin, yMin, xMax, yMax]`,
 * y nach oben positiv. Der JSON-Import ist wie bei
 * `fingerprint-index.ts` eine Vertrauensgrenze zu einem Generat, nicht zu TypeScript — der
 * `with { type: 'json' }`-Typ behauptet die Form, prüft sie aber nicht; deshalb Laufzeitvalidierung.
 *
 * Kein Fontparser in `core`, keiner hier: die Metrik ist Layoutdatum, keine Schriftdatei; die
 * Schrift selbst liegt im Prüfpaket. Ob das Generat zur Schriftdatei passt (`sourceSha256`,
 * `subsetSha256`), prüft `conformance/src/fonts.test.ts` neben dem Hash der Schrift.
 */
interface FontMetricsFile {
  readonly family: string;
  readonly unitsPerEm: number;
  readonly defaultWeight: number;
  readonly advances: Readonly<Record<string, number>>;
  readonly inkExtents: Readonly<Record<string, readonly [number, number, number, number]>>;
  /** GPOS-`kern` der Instanz in Klassen, nur Werte ≠ 0 (siehe `KerningClasses`). */
  readonly kerning: KerningClasses;
}

/**
 * Unterschneidung in Klassen, wie `scripts/font/export-metrics.py` sie schreibt (ESZ-114): Jede
 * Zeichenkette in `left` und `right` ist eine Klasse, ihre Zeichen sind die Codepoints darin.
 * `values[l][r]` ist die Vorschubkorrektur zwischen linker Klasse `l` und rechter Klasse `r`; ein
 * Paar ohne Eintrag wird nicht unterschnitten. Ausgerollt wären es je Stufe Zehntausende Paare.
 */
interface KerningClasses {
  readonly left: readonly string[];
  readonly right: readonly string[];
  readonly values: readonly Readonly<Record<string, number>>[];
}

function isCodepointTable(value: unknown, isEntry: (entry: unknown) => boolean): boolean {
  if (typeof value !== 'object' || value === null) return false;
  return Object.entries(value).every(([codepoint, entry]) => /^\d+$/.test(codepoint) && isEntry(entry));
}

const isAdvance = (entry: unknown): boolean =>
  typeof entry === 'number' && Number.isFinite(entry) && entry >= 0;
const isKern = (entry: unknown): boolean => typeof entry === 'number' && Number.isFinite(entry);

/** Klassen als Zeichenketten; kein Codepoint darf in zwei Klassen derselben Seite stehen. */
function isClassList(value: unknown): value is readonly string[] {
  if (!Array.isArray(value)) return false;
  const seen = new Set<string>();
  for (const members of value) {
    if (typeof members !== 'string' || members.length === 0) return false;
    for (const character of members) {
      if (seen.has(character)) return false;
      seen.add(character);
    }
  }
  return true;
}

function isKerningClasses(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  if (!('left' in value) || !('right' in value) || !('values' in value)) return false;
  const { left, right, values } = value;
  if (!isClassList(left) || !isClassList(right) || !Array.isArray(values)) return false;
  if (values.length !== left.length) return false;
  return values.every(
    (row: unknown) =>
      typeof row === 'object' &&
      row !== null &&
      Object.entries(row).every(
        ([index, entry]) => /^\d+$/.test(index) && Number(index) < right.length && isKern(entry),
      ),
  );
}
const isExtent = (entry: unknown): boolean =>
  Array.isArray(entry) &&
  entry.length === 4 &&
  entry.every((bound) => typeof bound === 'number' && Number.isFinite(bound));

function isFontMetricsFile(value: unknown): value is FontMetricsFile {
  if (typeof value !== 'object' || value === null) return false;
  if (!('family' in value) || !('unitsPerEm' in value)) return false;
  if (!('advances' in value) || !('inkExtents' in value) || !('kerning' in value)) return false;
  if (typeof value.family !== 'string') return false;
  if (typeof value.unitsPerEm !== 'number' || !(value.unitsPerEm > 0)) return false;
  return (
    isCodepointTable(value.advances, isAdvance) &&
    isCodepointTable(value.inkExtents, isExtent) &&
    isKerningClasses(value.kerning)
  );
}

function assertFontMetrics(value: unknown): FontMetricsFile {
  if (!isFontMetricsFile(value)) {
    throw new Error(
      'packages/core/src/assets/einsatzzeichen-sans-metrics.json hat nicht die erwartete Form ("family": string, ' +
        '"unitsPerEm": number > 0, "advances": { "<codepoint dezimal>": number ≥ 0 }, ' +
        '"inkExtents": { "<codepoint dezimal>": [xMin, yMin, xMax, yMax] }, ' +
        '"kerning": { "left": [string], "right": [string], "values": [{ "<rechte Klasse>": number }] }). ' +
        'Aus der Schriftdatei neu erzeugen (scripts/font).',
    );
  }
  return value;
}

/** Codepoint → Index seiner Klasse. */
function classIndex(classes: readonly string[]): Map<number, number> {
  const index = new Map<number, number>();
  classes.forEach((members, position) => {
    for (const character of members) index.set(character.codePointAt(0) ?? -1, position);
  });
  return index;
}

function textMetricsFrom(file: FontMetricsFile): TextMetrics {
  const advanceEm = new Map<number, number>(
    Object.entries(file.advances).map(([codepoint, advance]) => [Number(codepoint), advance / file.unitsPerEm]),
  );
  const inkExtentEm = new Map<number, readonly [number, number, number, number]>(
    Object.entries(file.inkExtents).map(([codepoint, box]) => [
      Number(codepoint),
      [box[0] / file.unitsPerEm, box[1] / file.unitsPerEm, box[2] / file.unitsPerEm, box[3] / file.unitsPerEm],
    ]),
  );
  const leftClass = classIndex(file.kerning.left);
  const rightClass = classIndex(file.kerning.right);
  const kerningEm = file.kerning.values.map(
    (row) =>
      new Map(Object.entries(row).map(([right, value]) => [Number(right), value / file.unitsPerEm])),
  );
  return {
    // `undefined` für Codepoints ohne cmap-Eintrag: kein `.notdef`-Vorschub als stiller Ersatz —
    // das Gate meldet den Tofu-Fall (`unknown-glyph`), statt eine Breite zu erfinden.
    advanceEm: (codepoint) => advanceEm.get(codepoint),
    inkExtentEm: (codepoint) => inkExtentEm.get(codepoint),
    kerningEm: (left, right) => {
      const row = leftClass.get(left);
      const column = rightClass.get(right);
      return row === undefined || column === undefined ? undefined : kerningEm[row]?.get(column);
    },
  };
}

const file = assertFontMetrics(textMetrics as unknown);
/** Fettinstanz wght 700 (`assets/EinsatzzeichenSans-Bold.ttf`), dasselbe Format, erzeugt vom selben Skript. */
const boldFile = assertFontMetrics(textBoldMetrics as unknown);
/**
 * Mittlere Instanz wght 500 (`assets/EinsatzzeichenSans-Medium.ttf`), dasselbe Format, erzeugt vom
 * selben Skript. In ihr setzt der Katalog allen Text (`CATALOG_TEXT_FONT_WEIGHT`).
 */
const mediumFile = assertFontMetrics(textMediumMetrics as unknown);
/**
 * Kursive Instanz wght 500 (`assets/EinsatzzeichenSans-MediumItalic.ttf`), dasselbe Format, erzeugt
 * vom selben Skript aus dem kursiven Upstream-Original. Die Tintenränder (`inkExtents`) sind die
 * der geneigten Umrisse; das Gate misst den kursiven Lauf deshalb an seiner eigenen Tinte.
 */
const mediumItalicFile = assertFontMetrics(textMediumItalicMetrics as unknown);

export const TEXT_METRICS_FAMILY = file.family;

export const TEXT_FONT_METRICS: TextMetrics = {
  ...textMetricsFrom(file),
  bold: textMetricsFrom(boldFile),
  medium: textMetricsFrom(mediumFile),
  mediumItalic: textMetricsFrom(mediumItalicFile),
};
