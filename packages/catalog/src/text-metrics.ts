import type { TextMetrics } from '@einsatzzeichen/core';
import arimoMetrics from '../assets/arimo-metrics.json' with { type: 'json' };

/**
 * Laufweiten von Arimo für das Textmetrik-Gate in `core` (`checkTextMetrics`, LFH-410) und die
 * Kompositionsprüfung (`CatalogPorts.textMetrics`, LFH-411).
 *
 * Die Quelle ist `assets/arimo-metrics.json`, ein **Generat** aus `Arimo[wght].ttf`
 * (`scripts/font/*`): je cmap-Eintrag der hmtx-Vorschub (`advances`) und die horizontale
 * Bounding-Box der Kontur (`inkExtents`) und die Kerningpaare (`kerning`) der Default-Instanz
 * (Gewicht 400), in Font-Einheiten bei `unitsPerEm` 2048. `inkExtents` führt die volle Box `[xMin, yMin, xMax, yMax]`,
 * y nach oben positiv. Der JSON-Import ist wie bei
 * `fingerprint-index.ts` eine Vertrauensgrenze zu einem Generat, nicht zu TypeScript — der
 * `with { type: 'json' }`-Typ behauptet die Form, prüft sie aber nicht; deshalb Laufzeitvalidierung.
 *
 * Kein Fontparser in `core`, keiner hier: die Metrik ist Datenbestand des Katalogs wie die
 * Schriftdatei selbst. Ob das Generat zur Schriftdatei passt (`sourceSha256`, `subsetSha256`),
 * prüft `fonts.test.ts` neben dem Hash der Schrift.
 */
interface ArimoMetricsFile {
  readonly family: string;
  readonly unitsPerEm: number;
  readonly defaultWeight: number;
  readonly advances: Readonly<Record<string, number>>;
  readonly inkExtents: Readonly<Record<string, readonly [number, number, number, number]>>;
  /** GPOS-`kern`-Paare der Default-Instanz: links → rechts → Vorschubkorrektur, nur Werte ≠ 0. */
  readonly kerning: Readonly<Record<string, Readonly<Record<string, number>>>>;
}

function isCodepointTable(value: unknown, isEntry: (entry: unknown) => boolean): boolean {
  if (typeof value !== 'object' || value === null) return false;
  return Object.entries(value).every(([codepoint, entry]) => /^\d+$/.test(codepoint) && isEntry(entry));
}

const isAdvance = (entry: unknown): boolean =>
  typeof entry === 'number' && Number.isFinite(entry) && entry >= 0;
const isKern = (entry: unknown): boolean => typeof entry === 'number' && Number.isFinite(entry);
const isExtent = (entry: unknown): boolean =>
  Array.isArray(entry) &&
  entry.length === 4 &&
  entry.every((bound) => typeof bound === 'number' && Number.isFinite(bound));

function isArimoMetricsFile(value: unknown): value is ArimoMetricsFile {
  if (typeof value !== 'object' || value === null) return false;
  if (!('family' in value) || !('unitsPerEm' in value)) return false;
  if (!('advances' in value) || !('inkExtents' in value) || !('kerning' in value)) return false;
  if (typeof value.family !== 'string') return false;
  if (typeof value.unitsPerEm !== 'number' || !(value.unitsPerEm > 0)) return false;
  return (
    isCodepointTable(value.advances, isAdvance) &&
    isCodepointTable(value.inkExtents, isExtent) &&
    isCodepointTable(value.kerning, (row) => isCodepointTable(row, isKern))
  );
}

function assertArimoMetrics(value: unknown): ArimoMetricsFile {
  if (!isArimoMetricsFile(value)) {
    throw new Error(
      'packages/catalog/assets/arimo-metrics.json hat nicht die erwartete Form ("family": string, ' +
        '"unitsPerEm": number > 0, "advances": { "<codepoint dezimal>": number ≥ 0 }, ' +
        '"inkExtents": { "<codepoint dezimal>": [xMin, yMin, xMax, yMax] }, ' +
        '"kerning": { "<links>": { "<rechts>": number } }). ' +
        'Aus der Schriftdatei neu erzeugen (scripts/font).',
    );
  }
  return value;
}

const raw: unknown = arimoMetrics;
const file = assertArimoMetrics(raw);

/** Vorschub je Codepoint in em — einmal umgerechnet, damit das Gate nicht bei jedem Zeichen dividiert. */
const ADVANCE_EM = new Map<number, number>(
  Object.entries(file.advances).map(([codepoint, advance]) => [Number(codepoint), advance / file.unitsPerEm]),
);

const INK_EXTENT_EM = new Map<number, readonly [number, number, number, number]>(
  Object.entries(file.inkExtents).map(([codepoint, box]) => [
    Number(codepoint),
    [box[0] / file.unitsPerEm, box[1] / file.unitsPerEm, box[2] / file.unitsPerEm, box[3] / file.unitsPerEm],
  ]),
);

const KERNING_EM = new Map<number, Map<number, number>>(
  Object.entries(file.kerning).map(([left, row]) => [
    Number(left),
    new Map(Object.entries(row).map(([right, value]) => [Number(right), value / file.unitsPerEm])),
  ]),
);

/** Die Schriftfamilie, für die die Metrik gilt — `fonts.ts` bindet dieselbe (`TEXT_FONT_FAMILY`). */
export const TEXT_METRICS_FAMILY = file.family;

export const ARIMO_TEXT_METRICS: TextMetrics = {
  // `undefined` für Codepoints ohne cmap-Eintrag: kein `.notdef`-Vorschub als stiller Ersatz —
  // das Gate meldet den Tofu-Fall (`unknown-glyph`), statt eine Breite zu erfinden.
  advanceEm: (codepoint) => ADVANCE_EM.get(codepoint),
  inkExtentEm: (codepoint) => INK_EXTENT_EM.get(codepoint),
  kerningEm: (left, right) => KERNING_EM.get(left)?.get(right),
};
