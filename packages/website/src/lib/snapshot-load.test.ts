import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { snapshotValueImports } from './snapshot-import-guard.js';
import { assertSnapshot } from './snapshot-schema.js';

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
 *
 * `assertSnapshot` kommt seit LFH-503 aus dem reinen `snapshot-schema.js` und nicht mehr aus
 * `snapshot.js`, das es nur re-exportiert. Der Unterschied ist kein Stil: `snapshot.ts` trägt den
 * eager `import.meta.glob`, den Vite zu einem statischen Import übersetzt — schon der Wertimport
 * von `assertSnapshot` ließ diesen Testlauf `public/catalog-snapshot.json` öffnen (mit `strace`
 * gemessen), und `pnpm generate` schreibt genau diese Datei mitten hinein, wenn nebenher jemand
 * `predev`, `prebuild` oder `precheck` startet. Der Fehlschlag war nicht reproduzierbar, weil er
 * am Zeitpunkt hing und nicht am Code.
 *
 * Der Preis: den Glob in `snapshot.ts` prüft danach kein Test mehr. Bricht dort etwas — Pfad,
 * Glob-Option, Re-Export —, meldet es erst `astro check` oder der Website-Build.
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

/**
 * Der zweite Halbsatz derselben Regel, und der schwerer zu sehende: `loadSnapshot()` **aufzurufen**
 * ist nicht die einzige Art, die erzeugte Datei in einen Testlauf zu ziehen. Es genügt, `snapshot.js`
 * als Wert zu importieren — der eager `import.meta.glob` darin hängt an der Modulkette, nicht am
 * Aufruf. Genau so las diese Datei die 1,3-MB-JSON, ohne dass eine Zeile davon zu sehen war.
 *
 * Die Prüflogik ist dieselbe wie beim Inselwächter (`snapshot-import-guard.ts`); dort geht es um
 * das Browserbündel, hier um den Wettlauf mit `pnpm generate`.
 */
it('kein Test importiert `snapshot.js` als Wert', () => {
  const offenders = testFilesUnder(SRC_DIR).flatMap((path) =>
    snapshotValueImports(readFileSync(path, 'utf-8')).map((line) => `${path}: ${line}`),
  );

  expect(
    offenders,
    'Diese Tests ziehen über `snapshot.js` die erzeugte `public/catalog-snapshot.json` in den ' +
      'Testlauf, die `pnpm generate` nebenher neu schreibt. `assertSnapshot` und die Typen kommen ' +
      'aus `snapshot-schema.js`, die Daten aus `buildSnapshot()`.',
  ).toEqual([]);
});
