import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { assertSnapshot } from './snapshot.js';

/** `src/`-Wurzel, von dieser Testdatei aus — hier beginnt die rekursive Suche nach Tests. */
const SRC_DIR = fileURLToPath(new URL('..', import.meta.url));

/** Diese Datei selbst — sie ruft `loadSnapshot` absichtlich nicht auf, prüft aber die Regel. */
const THIS_FILE = fileURLToPath(import.meta.url);

function testFilesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return testFilesUnder(path);
    return entry.isFile() && entry.name.endsWith('.test.ts') ? [path] : [];
  });
}

/**
 * Die ladende Funktion selbst wird hier nicht aufgerufen: die erzeugte Datei ist gitignored und in
 * CI zum Zeitpunkt von `pnpm test` noch nicht da (der Workflow ruft `pnpm test` vor
 * `--filter website check`). Geprüft wird deshalb die Prüfung — und zwar mit `undefined`, also
 * genau dem, was `import.meta.glob` bei fehlender Datei liefert.
 */
describe('assertSnapshot', () => {
  const hint = /pnpm --filter @einsatzzeichen\/website generate/;

  it('nennt den generate-Hinweis, wenn die Datei fehlt', () => {
    expect(() => assertSnapshot(undefined)).toThrow(hint);
  });

  it('nennt den generate-Hinweis bei leerem oder unvollständigem Inhalt', () => {
    for (const broken of [null, {}, { generatedAt: '2026-08-28T00:00:00.000Z', symbols: [] }, { symbols: [{}] }]) {
      expect(() => assertSnapshot(broken), JSON.stringify(broken)).toThrow(hint);
    }
  });

  it('gibt einen vollständigen Snapshot unverändert zurück', () => {
    const snapshot = { generatedAt: '2026-08-28T00:00:00.000Z', symbols: [{ id: 'base.formation' }] };
    expect(assertSnapshot(snapshot)).toBe(snapshot);
  });
});

/**
 * Wächter gegen genau den Fehler, der `pnpm test` in CI vor dem Website-`generate` scheitern
 * ließ: ein Test außerhalb dieser Datei, der `loadSnapshot()` aufruft, trifft auf die noch nicht
 * erzeugte, gitignorete Datei und wirft. Andere Tests bauen den Snapshot stattdessen selbst mit
 * `buildSnapshot()` aus `snapshot-build.js` — rein, ohne Datei. Nur hier, wo `assertSnapshot`
 * selbst geprüft wird, ist `loadSnapshot` überhaupt erlaubt (siehe Kommentar oben).
 */
it('nur diese Datei ruft `loadSnapshot()` auf', () => {
  const offenders = testFilesUnder(SRC_DIR)
    .filter((path) => path !== THIS_FILE)
    .filter((path) => /\bloadSnapshot\(/.test(readFileSync(path, 'utf-8')));

  expect(offenders, 'Diese Tests rufen `loadSnapshot()` auf statt `buildSnapshot()`.').toEqual([]);
});
