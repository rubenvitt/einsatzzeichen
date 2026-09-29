/**
 * Pixelvergleich Referenz ↔ eigene Darstellung je Manifestzeile (Entscheidungsnotiz vom
 * 19.09.2026, „Maße an der Referenz ablesen“, §3; Methode in der LFH-583-Nachprüfliste).
 *
 * Je Manifestzeile wird die lokale Referenzdatei (`referenceAsset`) und die eigene Darstellung
 * im Theme `reference` mit resvg und `resvgFontOptions()` auf dieselbe Breite gerastert, auf Weiß
 * gelegt und pixelweise verglichen. Zwei Kennzahlen:
 *
 * - **Fläche:** abweichende Pixel geteilt durch alle Pixel. „Deckungsgleich“ heißt höchstens 1 %.
 * - **Strichanteil:** abweichende Pixel geteilt durch die Pixel, auf denen in mindestens einem der
 *   beiden Bilder etwas gezeichnet ist. Strenger bei dünnen Piktogrammen auf viel Weiß.
 *
 * Die Schwellen sind eine Sortierhilfe, kein Urteil — ob ein Befund behoben ist, entscheidet die
 * Sichtprüfung. Dafür schreibt der Befehl auf Wunsch Kontaktbögen (Referenz | eigene |
 * Überlagerung).
 *
 * Der Referenzbestand liegt nie im Repository. Der Befehl liest ihn nur über `--reference-root`,
 * nimmt aus dem Manifest ausschließlich blosse Dateinamen an und schreibt weder den Pfad der
 * Referenzwurzel noch Zeitstempel in die Ausgabe: zwei Läufe auf demselben Stand liefern
 * byte-gleiche Dateien.
 */
import { createHash, randomBytes } from 'node:crypto';
import {
  closeSync,
  constants,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { deflateSync } from 'node:zlib';
import { Resvg } from '@resvg/resvg-js';
import { COVERAGE_MANIFEST, resvgFontOptions } from '@einsatzzeichen/conformance';
import { REFERENCE_THEME, renderSvg } from '@einsatzzeichen/core';
import { entryKey, type CoverageEntry, type Drawing } from '@einsatzzeichen/schema';
import { drawingForManifestEntry } from './reference-diff-drawings.js';

/** Rasterbreite beider Bilder in Pixeln. */
export const REFERENCE_DIFF_RASTER = 512;
/** Ab dieser Differenz in einem Farbkanal (0–255) zählt ein Pixel als abweichend. */
export const REFERENCE_DIFF_CHANNEL_TOLERANCE = 32;
/** Ein Pixel gilt als gezeichnet, wenn ein Kanal unter diesem Wert liegt. */
export const REFERENCE_DIFF_INK_BELOW = 240;
/** Höchster Flächenanteil, der noch als deckungsgleich gilt. */
export const REFERENCE_DIFF_CONGRUENT_AREA = 0.01;
/** Höchster Strichanteil der Gruppe A in der LFH-583-Nachprüfliste. */
export const REFERENCE_DIFF_STROKE_LIMIT = 0.03;
export const DEFAULT_REFERENCE_DIFF_OUTPUT = 'out/reference-diff';

const SHEET_ROWS = 12;
const SHEET_IMAGE = 200;
const SHEET_GAP = 10;
const SHEET_LABEL = 280;
const SHEET_HEADER = 34;
const SHEET_FILE = /^sheet-\d+\.png$/u;

export class ReferenceDiffError extends Error {}

export interface Raster {
  width: number;
  height: number;
  /** RGBA, 8 Bit je Kanal, zeilenweise. */
  pixels: Uint8Array;
}

export interface RasterComparison {
  width: number;
  height: number;
  diffPixels: number;
  inkReference: number;
  inkOwn: number;
  /** Pixel, auf denen in mindestens einem Bild etwas gezeichnet ist. */
  inkUnion: number;
  /** Abweichend und nur in der Referenz gezeichnet. */
  onlyReference: number;
  /** Abweichend und nur in der eigenen Darstellung gezeichnet. */
  onlyOwn: number;
  diffArea: number;
  diffInk: number;
  /**
   * Rot = nur in der Referenz gezeichnet, blau = nur in der eigenen Darstellung, grau = in beiden
   * gleich, orange = in beiden gezeichnet, aber in anderer Farbe, weiß = in keinem.
   */
  overlay: Uint8Array;
}

export type ReferenceDiffStatus = 'compared' | 'missing-reference' | 'size-mismatch';

export interface ReferenceDiffRow {
  key: string;
  section: string;
  variant: string;
  title: string;
  coverage: string;
  implementation: string;
  referenceAsset: string;
  status: ReferenceDiffStatus;
  referenceSize: [number, number] | null;
  ownSize: [number, number];
  diffArea: number | null;
  diffInk: number | null;
  onlyReference: number | null;
  onlyOwn: number | null;
  /** Fläche höchstens `REFERENCE_DIFF_CONGRUENT_AREA`; ohne Vergleich immer `false`. */
  congruent: boolean;
}

export interface ReferenceDiffReport {
  method: {
    raster: number;
    channelTolerance: number;
    inkBelow: number;
    congruentArea: number;
    strokeLimit: number;
    theme: string;
    fonts: { file: string; sha256: string }[];
  };
  filter: string | null;
  summary: {
    rows: number;
    compared: number;
    missingReference: number;
    sizeMismatch: number;
    congruent: number;
    withinStrokeLimit: number;
  };
  rows: ReferenceDiffRow[];
}

export interface ReferenceDiffOptions {
  referenceRoot: string;
  /** Ausgabeverzeichnis, muss unter `out/` liegen. */
  outDir?: string;
  /** Nur Zeilen, deren Abschnitt mit diesem Präfix beginnt (z. B. „C.1“ oder „5.1“). */
  filter?: string;
  /** Kontaktbögen als PNG schreiben. */
  sheets?: boolean;
  /** Nur für Tests: Manifestzeilen statt des eingefrorenen Manifests. */
  entries?: readonly CoverageEntry[];
  /** Nur für Tests: Wurzel, unter der Ausgaben zulässig sind (Standard `out/`). */
  outputBase?: string;
}

export interface ReferenceDiffResult {
  report: ReferenceDiffReport;
  outDir: string;
  files: string[];
}

// ── Vergleich ──

function isInk(pixels: Uint8Array, index: number): boolean {
  return (
    pixels[index]! < REFERENCE_DIFF_INK_BELOW ||
    pixels[index + 1]! < REFERENCE_DIFF_INK_BELOW ||
    pixels[index + 2]! < REFERENCE_DIFF_INK_BELOW
  );
}

/**
 * Vergleicht zwei gleich große Raster pixelweise. Bei abweichender Größe `null` — dann ist
 * keine der beiden Kennzahlen sinnvoll.
 */
export function compareRasters(
  reference: Raster,
  own: Raster,
  tolerance: number = REFERENCE_DIFF_CHANNEL_TOLERANCE,
): RasterComparison | null {
  if (reference.width !== own.width || reference.height !== own.height) return null;
  const a = reference.pixels;
  const b = own.pixels;
  const overlay = new Uint8Array(a.length);
  let diffPixels = 0;
  let inkReference = 0;
  let inkOwn = 0;
  let inkUnion = 0;
  let onlyReference = 0;
  let onlyOwn = 0;
  for (let i = 0; i < a.length; i += 4) {
    const difference = Math.max(
      Math.abs(a[i]! - b[i]!),
      Math.abs(a[i + 1]! - b[i + 1]!),
      Math.abs(a[i + 2]! - b[i + 2]!),
    );
    const inkA = isInk(a, i);
    const inkB = isInk(b, i);
    if (inkA) inkReference++;
    if (inkB) inkOwn++;
    if (inkA || inkB) inkUnion++;
    if (difference > tolerance) {
      diffPixels++;
      if (inkA && !inkB) onlyReference++;
      else if (inkB && !inkA) onlyOwn++;
    }
    const [red, green, blue] =
      inkA && inkB
        ? difference > tolerance
          ? [240, 150, 0]
          : [90, 90, 90]
        : inkA
          ? [230, 40, 40]
          : inkB
            ? [30, 90, 230]
            : [255, 255, 255];
    overlay[i] = red;
    overlay[i + 1] = green;
    overlay[i + 2] = blue;
    overlay[i + 3] = 255;
  }
  const area = reference.width * reference.height;
  return {
    width: reference.width,
    height: reference.height,
    diffPixels,
    inkReference,
    inkOwn,
    inkUnion,
    onlyReference,
    onlyOwn,
    diffArea: area === 0 ? 0 : diffPixels / area,
    diffInk: inkUnion === 0 ? 0 : diffPixels / inkUnion,
    overlay,
  };
}

export function rasterizeForReferenceDiff(svg: string): Raster {
  const image = new Resvg(svg, {
    fitTo: { mode: 'width', value: REFERENCE_DIFF_RASTER },
    font: resvgFontOptions(),
    // Weißer Grund für beide Bilder: sonst zählte transparentes Schwarz (0,0,0,0) als Strich.
    background: '#ffffff',
  }).render();
  return { width: image.width, height: image.height, pixels: new Uint8Array(image.pixels) };
}

// ── PNG ohne Fremdabhängigkeit (für Raster, die resvg nicht selbst erzeugt hat) ──

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data: Buffer): number {
  let c = 0xffffffff;
  for (const byte of data) c = CRC_TABLE[(c ^ byte) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typed = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(typed));
  return Buffer.concat([length, typed, checksum]);
}

export function encodeRgbaPng(raster: Raster): Buffer {
  const { width, height, pixels } = raster;
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // Bittiefe
  header[9] = 6; // RGBA
  const stride = width * 4;
  const scanlines = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    scanlines[y * (stride + 1)] = 0; // Filter „None“
    Buffer.from(pixels.buffer, pixels.byteOffset + y * stride, stride).copy(
      scanlines,
      y * (stride + 1) + 1,
    );
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(scanlines)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Referenzbestand ──

function isErrorWithCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

function resolveReferenceRoot(referenceRoot: string): string {
  let resolved: string;
  try {
    resolved = realpathSync(referenceRoot);
  } catch (error) {
    if (isErrorWithCode(error, 'ENOENT')) {
      throw new ReferenceDiffError(
        `Referenzordner "${referenceRoot}" nicht gefunden. Der Bestand wird nie eingecheckt ` +
          'und muss lokal vorliegen.',
      );
    }
    throw error;
  }
  if (!statSync(resolved).isDirectory()) {
    throw new ReferenceDiffError(`--reference-root "${referenceRoot}" ist kein Verzeichnis.`);
  }
  return resolved;
}

/**
 * Löst `referenceAsset` im Referenzordner auf — dieselbe Grenze wie im Fachreview-Werkzeug
 * (`packages/review/src/server/reference.ts`): blosser Dateiname, nur SVG, und der aufgelöste
 * Pfad bleibt im Ordner. Ein Verstoß ist ein Fehler im Manifest oder im Bestand und bricht ab;
 * eine fehlende Datei wird als Zeile gemeldet.
 */
function readReferenceSvg(root: string, asset: string, key: string): string | undefined {
  const plain =
    asset.length > 0 &&
    asset !== '.' &&
    asset !== '..' &&
    !asset.includes('\0') &&
    !asset.includes('/') &&
    !asset.includes('\\') &&
    basename(asset) === asset;
  if (!plain) {
    throw new ReferenceDiffError(
      `Manifestzeile "${key}": der Referenzname ist kein blosser Dateiname.`,
    );
  }
  if (!asset.toLowerCase().endsWith('.svg')) {
    throw new ReferenceDiffError(`Manifestzeile "${key}": die Referenzdatei "${asset}" ist kein SVG.`);
  }
  let file: string;
  try {
    file = realpathSync(join(root, asset));
  } catch (error) {
    if (isErrorWithCode(error, 'ENOENT')) return undefined;
    throw error;
  }
  if (!file.startsWith(root + sep)) {
    throw new ReferenceDiffError(
      `Manifestzeile "${key}": die Referenzdatei "${asset}" zeigt aus dem Referenzordner hinaus.`,
    );
  }
  return readFileSync(file, 'utf8');
}

// ── Auswahl und Reihenfolge ──

function sectionOf(sourceId: string): string {
  const colon = sourceId.indexOf(':');
  return colon === -1 ? sourceId : sourceId.slice(colon + 1);
}

/** Natürliche Ordnung, damit `5.1.1.10` hinter `5.1.1.9` steht; ohne Locale-Abhängigkeit. */
export function compareKeys(left: string, right: string): number {
  const split = (value: string) => value.split(/(\d+)/u);
  const a = split(left);
  const b = split(right);
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const x = a[i]!;
    const y = b[i]!;
    if (x === y) continue;
    if (i % 2 === 1) return Number(x) - Number(y) || (x < y ? -1 : 1);
    return x < y ? -1 : 1;
  }
  return a.length - b.length;
}

// ── Sicheres Schreiben unter out/ ──

function ensureRealDirectory(directory: string): void {
  try {
    mkdirSync(directory);
  } catch (error) {
    if (!isErrorWithCode(error, 'EEXIST')) throw error;
  }
  const stat = lstatSync(directory);
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new ReferenceDiffError(`Ausgabepfad enthält kein echtes Verzeichnis: ${directory}.`);
  }
}

/** Legt `outDir` unter `base` an und gibt den realen Pfad zurück; Symlinks werden abgewiesen. */
function prepareOutputDirectory(base: string, outDir: string): string {
  const resolvedBase = resolve(base);
  const resolvedOut = resolve(outDir);
  const fromBase = relative(resolvedBase, resolvedOut);
  if (
    fromBase === '' ||
    fromBase === '..' ||
    fromBase.startsWith(`..${sep}`) ||
    isAbsolute(fromBase)
  ) {
    throw new ReferenceDiffError(
      `Ausgaben von reference-diff sind nur in einem Unterverzeichnis von ${relative(process.cwd(), resolvedBase) || resolvedBase}/ zulässig.`,
    );
  }
  ensureRealDirectory(resolvedBase);
  let current = resolvedBase;
  for (const part of fromBase.split(sep)) {
    current = join(current, part);
    ensureRealDirectory(current);
  }
  const realBase = realpathSync(resolvedBase);
  const realOut = realpathSync(current);
  if (!realOut.startsWith(`${realBase}${sep}`)) {
    throw new ReferenceDiffError('Ausgabepfad verlässt die reale Grenze des Ausgabeordners.');
  }
  return realOut;
}

/** Schreibt über eine temporäre Datei und atomisches Umbenennen; kein Symlink, kein Hardlink. */
function writeOutputFile(directory: string, name: string, content: Buffer | string): void {
  const destination = join(directory, name);
  let existing: number | undefined;
  try {
    existing = openSync(destination, constants.O_RDONLY | constants.O_NONBLOCK | constants.O_NOFOLLOW);
    const stat = fstatSync(existing);
    if (!stat.isFile() || stat.nlink !== 1) {
      throw new ReferenceDiffError(
        `Ausgabeziel ${name} muss eine reguläre Datei mit genau einem Hardlink sein.`,
      );
    }
  } catch (error) {
    if (!isErrorWithCode(error, 'ENOENT')) throw error;
  } finally {
    if (existing !== undefined) closeSync(existing);
  }
  const temporary = join(directory, `.${name}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`);
  let descriptor: number | undefined;
  let renamed = false;
  try {
    descriptor = openSync(
      temporary,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
      0o644,
    );
    writeFileSync(descriptor, content);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    renameSync(temporary, destination);
    renamed = true;
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
    if (!renamed) {
      try {
        unlinkSync(temporary);
      } catch (error) {
        if (!isErrorWithCode(error, 'ENOENT')) throw error;
      }
    }
  }
}

// ── Berichte ──

function percent(value: number | null): string {
  return value === null ? '–' : `${(value * 100).toFixed(2).replace('.', ',')} %`;
}

function escapeMarkdown(value: string): string {
  return value.replaceAll('|', '\\|');
}

function markdownReport(report: ReferenceDiffReport): string {
  const { summary, method } = report;
  const lines = [
    '# Pixelvergleich Referenz ↔ eigene Darstellung',
    '',
    `Erzeugt mit \`pnpm cli reference-diff\`${report.filter !== null ? ` (Filter \`${report.filter}\`)` : ''}. ` +
      `Raster ${method.raster} px Breite auf Weiß, Theme \`${method.theme}\`, abweichend ab einer ` +
      `Kanaldifferenz über ${method.channelTolerance}, gezeichnet unter ${method.inkBelow}.`,
    '',
    `- Zeilen: ${summary.rows}`,
    `- verglichen: ${summary.compared}`,
    `- deckungsgleich (Fläche höchstens ${percent(method.congruentArea)}): **${summary.congruent}**`,
    `- Strichanteil höchstens ${percent(method.strokeLimit)}: ${summary.withinStrokeLimit}`,
    `- Referenzdatei fehlt: ${summary.missingReference}`,
    `- Rastergröße weicht ab: ${summary.sizeMismatch}`,
    '',
    'Die Schwellen sind eine Sortierhilfe, kein Urteil. Ob ein Befund behoben ist, entscheidet ' +
      'die Sichtprüfung.',
    '',
    '| Zeile | Titel | Fläche | Strichanteil | deckungsgleich | Referenzdatei |',
    '|---|---|---:|---:|:---:|---|',
    ...report.rows.map((row) => {
      const verdict =
        row.status === 'missing-reference'
          ? 'Referenz fehlt'
          : row.status === 'size-mismatch'
            ? 'Größe weicht ab'
            : row.congruent
              ? 'ja'
              : 'nein';
      return (
        `| ${row.key} | ${escapeMarkdown(row.title)} | ${percent(row.diffArea)} | ` +
        `${percent(row.diffInk)} | ${verdict} | ${escapeMarkdown(row.referenceAsset)} |`
      );
    }),
    '',
  ];
  return lines.join('\n');
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

interface SheetEntry {
  row: ReferenceDiffRow;
  reference?: Buffer;
  own: Buffer;
  overlay?: Buffer;
}

function sheetPng(entries: readonly SheetEntry[]): Buffer {
  const width = SHEET_LABEL + 3 * (SHEET_IMAGE + SHEET_GAP);
  const height = SHEET_HEADER + entries.length * (SHEET_IMAGE + SHEET_GAP) + SHEET_GAP;
  const header = ['Referenz', 'eigene Darstellung', 'Überlagerung']
    .map(
      (label, column) =>
        `<text x="${SHEET_LABEL + column * (SHEET_IMAGE + SHEET_GAP)}" y="22" ` +
        `font-family="Arimo" font-size="14" font-weight="700" fill="#111111">${label}</text>`,
    )
    .join('');
  const body = entries
    .map(({ row, reference, own, overlay }, index) => {
      const y = SHEET_HEADER + index * (SHEET_IMAGE + SHEET_GAP);
      const title = row.title.length > 40 ? `${row.title.slice(0, 39)}…` : row.title;
      const labels =
        `<text x="10" y="${y + 20}" font-family="Arimo" font-size="15" font-weight="700" ` +
        `fill="#111111">${escapeXml(row.key)}</text>` +
        `<text x="10" y="${y + 42}" font-family="Arimo" font-size="12" fill="#30343a">` +
        `${escapeXml(title)}</text>` +
        `<text x="10" y="${y + 64}" font-family="Arimo" font-size="12" fill="#30343a">` +
        `Fläche ${escapeXml(percent(row.diffArea))} · Strich ${escapeXml(percent(row.diffInk))}</text>` +
        (row.status === 'compared'
          ? ''
          : `<text x="10" y="${y + 86}" font-family="Arimo" font-size="12" font-weight="700" ` +
            `fill="#b00020">${row.status === 'missing-reference' ? 'Referenz fehlt' : 'Größe weicht ab'}</text>`);
      const images = [reference, own, overlay]
        .map((png, column) => {
          const x = SHEET_LABEL + column * (SHEET_IMAGE + SHEET_GAP);
          return (
            `<rect x="${x}" y="${y}" width="${SHEET_IMAGE}" height="${SHEET_IMAGE}" ` +
            `fill="#ffffff" stroke="#bbbbbb"/>` +
            (png === undefined
              ? ''
              : `<image x="${x}" y="${y}" width="${SHEET_IMAGE}" height="${SHEET_IMAGE}" ` +
                `preserveAspectRatio="xMidYMid meet" ` +
                `href="data:image/png;base64,${png.toString('base64')}"/>`)
          );
        })
        .join('');
      return labels + images;
    })
    .join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#f4f4f4"/>` +
    `${header}${body}</svg>`;
  return new Resvg(svg, { font: resvgFontOptions(), background: '#f4f4f4' }).render().asPng();
}

// ── Befehl ──

function fontDigests(): { file: string; sha256: string }[] {
  return resvgFontOptions().fontFiles.map((file) => ({
    file: basename(file),
    sha256: createHash('sha256').update(readFileSync(file)).digest('hex'),
  }));
}

function slugOf(key: string): string {
  return key.replace(/[^A-Za-z0-9]+/gu, '-').replace(/^-|-$/gu, '');
}

export function referenceDiff(options: ReferenceDiffOptions): ReferenceDiffResult {
  const root = resolveReferenceRoot(options.referenceRoot);
  const filter = options.filter;
  const entries = (options.entries ?? (COVERAGE_MANIFEST.entries as readonly CoverageEntry[]))
    .filter((entry) => filter === undefined || sectionOf(entry.sourceId).startsWith(filter))
    .map((entry) => ({ entry, key: entryKey(entry.sourceId, entry.variant) }))
    .sort((left, right) => compareKeys(left.key, right.key));
  if (entries.length === 0) {
    throw new ReferenceDiffError(
      filter === undefined
        ? 'Das Manifest enthält keine Zeilen.'
        : `Der Filter "${filter}" trifft keine Manifestzeile.`,
    );
  }

  const rows: ReferenceDiffRow[] = [];
  const sheetEntries: SheetEntry[] = [];
  for (const { entry, key } of entries) {
    const drawing: Drawing = drawingForManifestEntry(entry);
    const ownSvg = renderSvg(drawing, {
      size: REFERENCE_DIFF_RASTER,
      theme: REFERENCE_THEME,
      idPrefix: `reference-diff-${slugOf(key)}`,
    });
    const own = rasterizeForReferenceDiff(ownSvg);
    const referenceSvg = readReferenceSvg(root, entry.referenceAsset, key);
    const reference = referenceSvg === undefined ? undefined : rasterizeForReferenceDiff(referenceSvg);
    const comparison = reference === undefined ? null : compareRasters(reference, own);
    const status: ReferenceDiffStatus =
      reference === undefined ? 'missing-reference' : comparison === null ? 'size-mismatch' : 'compared';
    const row: ReferenceDiffRow = {
      key,
      section: sectionOf(entry.sourceId),
      variant: entry.variant,
      title: entry.title,
      coverage: entry.coverage,
      implementation: entry.implementation,
      referenceAsset: entry.referenceAsset,
      status,
      referenceSize: reference === undefined ? null : [reference.width, reference.height],
      ownSize: [own.width, own.height],
      diffArea: comparison?.diffArea ?? null,
      diffInk: comparison?.diffInk ?? null,
      onlyReference: comparison?.onlyReference ?? null,
      onlyOwn: comparison?.onlyOwn ?? null,
      congruent: comparison !== null && comparison.diffArea <= REFERENCE_DIFF_CONGRUENT_AREA,
    };
    rows.push(row);
    if (options.sheets === true) {
      sheetEntries.push({
        row,
        own: encodeRgbaPng(own),
        ...(reference !== undefined ? { reference: encodeRgbaPng(reference) } : {}),
        ...(comparison !== null
          ? {
              overlay: encodeRgbaPng({
                width: comparison.width,
                height: comparison.height,
                pixels: comparison.overlay,
              }),
            }
          : {}),
      });
    }
  }

  const compared = rows.filter((row) => row.status === 'compared');
  const report: ReferenceDiffReport = {
    method: {
      raster: REFERENCE_DIFF_RASTER,
      channelTolerance: REFERENCE_DIFF_CHANNEL_TOLERANCE,
      inkBelow: REFERENCE_DIFF_INK_BELOW,
      congruentArea: REFERENCE_DIFF_CONGRUENT_AREA,
      strokeLimit: REFERENCE_DIFF_STROKE_LIMIT,
      theme: REFERENCE_THEME.id,
      fonts: fontDigests(),
    },
    filter: filter ?? null,
    summary: {
      rows: rows.length,
      compared: compared.length,
      missingReference: rows.filter((row) => row.status === 'missing-reference').length,
      sizeMismatch: rows.filter((row) => row.status === 'size-mismatch').length,
      congruent: rows.filter((row) => row.congruent).length,
      withinStrokeLimit: compared.filter((row) => row.diffInk! <= REFERENCE_DIFF_STROKE_LIMIT)
        .length,
    },
    rows,
  };

  const outDir = options.outDir ?? DEFAULT_REFERENCE_DIFF_OUTPUT;
  const directory = prepareOutputDirectory(options.outputBase ?? 'out', outDir);
  const files = ['report.json', 'report.md'];
  writeOutputFile(directory, 'report.json', `${JSON.stringify(report, null, 2)}\n`);
  writeOutputFile(directory, 'report.md', markdownReport(report));

  const sheetNames: string[] = [];
  if (options.sheets === true) {
    for (let start = 0; start < sheetEntries.length; start += SHEET_ROWS) {
      const name = `sheet-${String(start / SHEET_ROWS + 1).padStart(2, '0')}.png`;
      writeOutputFile(directory, name, sheetPng(sheetEntries.slice(start, start + SHEET_ROWS)));
      sheetNames.push(name);
    }
  }
  // Kontaktbögen eines früheren, längeren Laufs würden sonst neben den neuen liegen bleiben.
  for (const name of readdirSync(directory)) {
    if (SHEET_FILE.test(name) && !sheetNames.includes(name)) unlinkSync(join(directory, name));
  }
  files.push(...sheetNames);

  return { report, outDir, files };
}
