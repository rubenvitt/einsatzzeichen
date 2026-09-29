import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { COVERAGE_MANIFEST } from '@einsatzzeichen/conformance';
import { REFERENCE_THEME, renderSvg } from '@einsatzzeichen/core';
import { entryKey, type CoverageEntry } from '@einsatzzeichen/schema';
import { drawingForManifestEntry } from './reference-diff-drawings.js';
import {
  REFERENCE_DIFF_RASTER,
  ReferenceDiffError,
  compareKeys,
  compareRasters,
  rasterizeForReferenceDiff,
  referenceDiff,
  type Raster,
  type ReferenceDiffOptions,
} from './reference-diff.js';

/*
 * Der echte Referenzbestand liegt nie im Repository und fehlt in CI. Die Tests bauen sich ihre
 * „Referenzen“ deshalb selbst: aus der eigenen Darstellung (muss deckungsgleich sein), als leeres
 * Bild (muss abweichen) oder gar nicht (muss als fehlend gemeldet werden).
 */

const CLI_ENTRY = fileURLToPath(new URL('../index.ts', import.meta.url));
const TSX_ENTRY = fileURLToPath(
  new URL('../../../../node_modules/tsx/dist/cli.mjs', import.meta.url),
);

/** Je Zeichenweg eine Zeile: Katalogeintrag, Trägerzeichen Organisation, Piktogramm, Fahrwerk, Rezept. */
const SAMPLE_KEYS = [
  'bbk-babz-2025:1.1#primary',
  'bbk-babz-2025:2.1#primary',
  'bbk-babz-2025:4.1.1#primary',
  'bbk-babz-2025:5.1.1.1#primary',
  'bbk-babz-2025:C.1.1#primary',
];

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function temporaryDirectory(prefix: string): string {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  temporaryDirectories.push(directory);
  return directory;
}

function sampleEntries(): CoverageEntry[] {
  const byKey = new Map(
    (COVERAGE_MANIFEST.entries as readonly CoverageEntry[]).map((entry) => [
      entryKey(entry.sourceId, entry.variant),
      entry,
    ]),
  );
  return SAMPLE_KEYS.map((key) => {
    const entry = byKey.get(key);
    if (entry === undefined) throw new Error(`Testzeile ${key} fehlt im Manifest.`);
    return entry;
  });
}

function ownSvg(entry: CoverageEntry): string {
  return renderSvg(drawingForManifestEntry(entry), {
    size: REFERENCE_DIFF_RASTER,
    theme: REFERENCE_THEME,
    idPrefix: 'fixture',
  });
}

/** Ein leeres SVG mit derselben viewBox wie die eigene Darstellung, damit die Rastergröße passt. */
function blankSvg(entry: CoverageEntry): string {
  const viewBox = /viewBox="([^"]+)"/u.exec(ownSvg(entry))?.[1];
  if (viewBox === undefined) throw new Error('Eigene Darstellung ohne viewBox.');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"></svg>`;
}

function fixtureReferences(
  entries: readonly CoverageEntry[],
  content: (entry: CoverageEntry) => string | undefined,
): string {
  const root = temporaryDirectory('reference-diff-refs-');
  for (const entry of entries) {
    const svg = content(entry);
    if (svg !== undefined) writeFileSync(join(root, entry.referenceAsset), svg, 'utf8');
  }
  return root;
}

function outputBase(): string {
  return join(temporaryDirectory('reference-diff-out-'), 'out');
}

function raster(width: number, height: number, colors: readonly number[][]): Raster {
  return { width, height, pixels: new Uint8Array(colors.flatMap((rgb) => [...rgb, 255])) };
}

const BLACK = [0, 0, 0];
const WHITE = [255, 255, 255];
const RED = [255, 0, 0];
const BLUE = [0, 0, 255];

describe('compareRasters', () => {
  it('zählt Fläche und Strichanteil nach der Methode der Nachprüfliste', () => {
    const reference = raster(2, 2, [BLACK, WHITE, WHITE, RED]);
    const own = raster(2, 2, [BLACK, BLACK, WHITE, BLUE]);

    const result = compareRasters(reference, own);

    expect(result).not.toBeNull();
    expect(result!.diffPixels).toBe(2);
    expect(result!.diffArea).toBe(2 / 4);
    expect(result!.inkUnion).toBe(3);
    expect(result!.diffInk).toBe(2 / 3);
    expect(result!.onlyReference).toBe(0);
    expect(result!.onlyOwn).toBe(1);
    // grau = gleich gezeichnet, blau = nur eigene, weiß = leer, orange = andere Farbe
    expect([...result!.overlay]).toEqual([
      90, 90, 90, 255, 30, 90, 230, 255, 255, 255, 255, 255, 240, 150, 0, 255,
    ]);
  });

  it('wertet eine Kanaldifferenz von genau 32 noch als gleich', () => {
    const result = compareRasters(raster(1, 1, [[100, 100, 100]]), raster(1, 1, [[132, 100, 100]]));
    expect(result!.diffPixels).toBe(0);
    const beyond = compareRasters(raster(1, 1, [[100, 100, 100]]), raster(1, 1, [[133, 100, 100]]));
    expect(beyond!.diffPixels).toBe(1);
  });

  it('vergleicht verschieden große Raster nicht', () => {
    expect(compareRasters(raster(1, 1, [WHITE]), raster(1, 2, [WHITE, WHITE]))).toBeNull();
  });

  it('legt beide Bilder auf Weiß, damit Transparenz nicht als Strich zählt', () => {
    const empty = rasterizeForReferenceDiff(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>',
    );
    expect(empty.width).toBe(REFERENCE_DIFF_RASTER);
    const result = compareRasters(empty, empty);
    expect(result!.inkUnion).toBe(0);
    expect(result!.diffInk).toBe(0);
    expect(new Set(empty.pixels)).toEqual(new Set([255]));
  });
});

describe('compareKeys', () => {
  it('ordnet Abschnittsnummern natürlich', () => {
    const keys = ['x:5.1.1.10#primary', 'x:5.1.1.9#primary', 'x:C.1#primary', 'x:5.1.1.9#alternative'];
    expect([...keys].sort(compareKeys)).toEqual([
      'x:5.1.1.9#alternative',
      'x:5.1.1.9#primary',
      'x:5.1.1.10#primary',
      'x:C.1#primary',
    ]);
  });
});

/** Führt den Vergleich mit Ausgabe in ein Temp-Verzeichnis aus, nie in das `out/` des Repos. */
function run(options: Omit<ReferenceDiffOptions, 'outputBase' | 'outDir'> & { base?: string }) {
  const base = options.base ?? outputBase();
  const { base: _base, ...rest } = options;
  const outDir = join(base, 'diff');
  return { ...referenceDiff({ ...rest, outputBase: base, outDir }), directory: outDir };
}

describe('referenceDiff', () => {
  it('meldet die eigene Darstellung als Referenz auf jedem Zeichenweg deckungsgleich', () => {
    const entries = sampleEntries();
    const referenceRoot = fixtureReferences(entries, ownSvg);

    const { report, files, directory } = run({ referenceRoot, entries });

    expect(files).toEqual(['report.json', 'report.md']);
    expect(report.summary).toEqual({
      rows: 5,
      compared: 5,
      missingReference: 0,
      sizeMismatch: 0,
      congruent: 5,
      withinStrokeLimit: 5,
    });
    expect(report.rows.map((row) => row.key)).toEqual(SAMPLE_KEYS);
    for (const row of report.rows) {
      expect(row).toMatchObject({ status: 'compared', diffArea: 0, diffInk: 0, congruent: true });
    }
    expect(JSON.parse(readFileSync(join(directory, 'report.json'), 'utf8'))).toEqual(report);
    const markdown = readFileSync(join(directory, 'report.md'), 'utf8');
    expect(markdown).toContain('deckungsgleich (Fläche höchstens 1,00 %): **5**');
    expect(markdown).toContain('| bbk-babz-2025:C.1.1#primary |');
    // Der Pfad der Referenzwurzel gehört nicht in die Ausgabe.
    expect(markdown).not.toContain(referenceRoot);
    expect(readFileSync(join(directory, 'report.json'), 'utf8')).not.toContain(referenceRoot);
  });

  it('meldet ein leeres Referenzbild als abweichend und eine fehlende Datei als fehlend', () => {
    const entries = sampleEntries();
    const [blank, missing] = [entries[0]!, entries[4]!];
    const referenceRoot = fixtureReferences(entries, (entry) =>
      entry === blank ? blankSvg(entry) : entry === missing ? undefined : ownSvg(entry),
    );

    const { report } = run({ referenceRoot, entries });

    const byKey = new Map(report.rows.map((row) => [row.key, row]));
    const blankRow = byKey.get(entryKey(blank.sourceId, blank.variant))!;
    expect(blankRow.status).toBe('compared');
    expect(blankRow.diffArea).toBeGreaterThan(0.01);
    expect(blankRow.onlyOwn).toBeGreaterThan(0);
    expect(blankRow.onlyReference).toBe(0);
    expect(blankRow.congruent).toBe(false);
    expect(byKey.get(entryKey(missing.sourceId, missing.variant))).toMatchObject({
      status: 'missing-reference',
      diffArea: null,
      diffInk: null,
      congruent: false,
    });
    expect(report.summary).toMatchObject({ rows: 5, compared: 4, missingReference: 1, congruent: 3 });
  });

  it('wählt mit --filter nach Abschnittspräfix aus', () => {
    const entries = sampleEntries();
    const referenceRoot = fixtureReferences(entries, ownSvg);

    const { report } = run({ referenceRoot, entries, filter: 'C.' });

    expect(report.filter).toBe('C.');
    expect(report.rows.map((row) => row.key)).toEqual(['bbk-babz-2025:C.1.1#primary']);
    expect(() => run({ referenceRoot, entries, filter: 'Z.' })).toThrow(ReferenceDiffError);
  });

  it('schreibt Kontaktbögen und liefert bei zwei Läufen byte-gleiche Dateien', () => {
    const entries = sampleEntries();
    const referenceRoot = fixtureReferences(entries, (entry) =>
      entry === entries[1] ? blankSvg(entry) : ownSvg(entry),
    );
    const base = outputBase();

    const first = run({ referenceRoot, entries, sheets: true, base });
    const snapshot = new Map(
      first.files.map((name) => [name, readFileSync(join(first.directory, name))]),
    );
    const second = run({ referenceRoot, entries, sheets: true, base });

    expect(first.files).toEqual(['report.json', 'report.md', 'sheet-01.png']);
    expect(second.files).toEqual(first.files);
    for (const name of second.files) {
      expect(readFileSync(join(second.directory, name)).equals(snapshot.get(name)!)).toBe(true);
    }
    const png = snapshot.get('sheet-01.png')!;
    expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

    // Ein Lauf ohne Kontaktbögen räumt die alten weg, damit kein veralteter Bogen liegen bleibt.
    const third = run({ referenceRoot, entries, base });
    expect(third.files).toEqual(['report.json', 'report.md']);
    expect(readdirSync(third.directory).sort()).toEqual(['report.json', 'report.md']);
  });

  it('weist Referenznamen mit Verzeichnisanteil ab', () => {
    const [entry] = sampleEntries();
    const referenceRoot = fixtureReferences([], () => undefined);

    expect(() =>
      run({ referenceRoot, entries: [{ ...entry!, referenceAsset: '../x.svg' }] }),
    ).toThrow(/kein blosser Dateiname/u);
  });

  it('bricht ohne Referenzordner ab und schreibt nur unterhalb der Ausgabewurzel', () => {
    const entries = sampleEntries();
    const referenceRoot = fixtureReferences(entries, ownSvg);
    const base = outputBase();

    expect(() =>
      referenceDiff({ referenceRoot: join(referenceRoot, 'fehlt'), entries, outputBase: base }),
    ).toThrow(/nicht gefunden/u);
    expect(() =>
      referenceDiff({ referenceRoot, entries, outputBase: base, outDir: base }),
    ).toThrow(ReferenceDiffError);
    expect(() =>
      referenceDiff({ referenceRoot, entries, outputBase: base, outDir: join(base, '..', 'daneben') }),
    ).toThrow(ReferenceDiffError);
    expect(existsSync(join(base, '..', 'daneben'))).toBe(false);
  });
});

describe('pnpm cli reference-diff', () => {
  function cli(workingDirectory: string, args: readonly string[]) {
    return spawnSync(process.execPath, [TSX_ENTRY, CLI_ENTRY, 'reference-diff', ...args], {
      cwd: workingDirectory,
      encoding: 'utf8',
    });
  }

  it('verlangt --reference-root', () => {
    const result = cli(temporaryDirectory('reference-diff-cwd-'), []);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('--reference-root');
  });

  it('gibt mit --json nur den Bericht aus und schreibt unter out/ des Arbeitsverzeichnisses', () => {
    const entries = sampleEntries();
    const referenceRoot = fixtureReferences(entries, ownSvg);
    const workingDirectory = temporaryDirectory('reference-diff-cwd-');
    mkdirSync(join(workingDirectory, 'out'));

    const result = cli(workingDirectory, ['--reference-root', referenceRoot, '--filter', 'C.1.1', '--json']);

    expect(result.status, result.stderr).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.summary).toMatchObject({ rows: 1, congruent: 1 });
    expect(existsSync(join(workingDirectory, 'out', 'reference-diff', 'report.json'))).toBe(true);
  });
});
