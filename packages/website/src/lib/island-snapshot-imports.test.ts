import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { snapshotValueImports } from './snapshot-import-guard.js';

/**
 * Der Wächter für die eine Regel, an der LFH-500 hängt: **eine Insel darf `snapshot.ts` nur als
 * Typ importieren.**
 *
 * An `snapshot.ts` hängt der eager `import.meta.glob` auf `public/catalog-snapshot.json`. Ein
 * Wertimport — direkt oder über eine Zwischendatei — zieht die 1,3 MB JSON in jedes Bündel, das
 * die Insel lädt; genau der Zustand vor diesem Task, wo `dist/_astro/snapshot.*.js` mit 1.299.313
 * Bytes im Auslieferungsstand lag. `import type` verschwindet beim Bauen und ist unbedenklich.
 *
 * Warum ein Test und nicht nur ein Kommentar: der Rückfall ist lautlos. Nichts schlägt fehl, kein
 * Typfehler, keine rote Ausgabe — die Seite wird bloß wieder ein Megabyte schwerer, und das sieht
 * niemand ohne Blick in `dist/`. Ein Kommentar hat diesen Rückfall schon einmal nicht verhindert:
 * `CoverageMatrix.tsx` trug ihn, während die beiden anderen Inseln daneben den Lader als Wert
 * zogen.
 *
 * Geprüft wird die Kette, nicht nur die Insel: `snapshot-client.ts` steht bewusst auf dem reinen
 * `snapshot-schema.ts`, und auch das darf nicht zurückrutschen.
 */

const ISLANDS_DIR = fileURLToPath(new URL('../components/islands/', import.meta.url));
const LIB_DIR = fileURLToPath(new URL('.', import.meta.url));

/** Dateien, die eine Insel lädt und die deshalb unter derselben Regel stehen wie sie selbst. */
const ISLAND_REACHABLE = ['snapshot-client.ts', 'snapshot-island.ts'];

/**
 * Die Prüflogik selbst steht in `snapshot-import-guard.ts` — sie hat seit LFH-503 einen zweiten
 * Wächter (`snapshot-load.test.ts`), und eine Testdatei aus einer anderen zu importieren
 * registrierte deren Suiten doppelt. Die Gegenproben unten bleiben hier: sie sind hier entstanden.
 */

function filesIn(dir: string, extension: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return filesIn(path, extension);
    return entry.isFile() && entry.name.endsWith(extension) ? [path] : [];
  });
}

function offendersIn(paths: string[]): string[] {
  return paths.flatMap((path) =>
    snapshotValueImports(readFileSync(path, 'utf-8')).map((line) => `${path}: ${line}`),
  );
}

it('keine Insel importiert `snapshot.ts` als Wert', () => {
  const islands = filesIn(ISLANDS_DIR, '.tsx');
  expect(islands.length, 'Es wurde keine Insel gefunden — läuft der Wächter ins Leere?').toBeGreaterThan(0);

  expect(
    offendersIn(islands),
    'Diese Inseln ziehen den bauzeitlichen Lader und damit die 1,3-MB-JSON-Datei ins ' +
      'Browserbündel. Typen kommen mit `import type`, Daten mit `fetchSnapshot()`.',
  ).toEqual([]);
});

it('die von Inseln geladenen Hilfsmodule importieren `snapshot.ts` nicht als Wert', () => {
  expect(
    offendersIn(ISLAND_REACHABLE.map((name) => join(LIB_DIR, name))),
    'Diese Datei wird von einer Insel geladen und zöge den bauzeitlichen Lader mit. ' +
      '`assertSnapshot` und die Typen kommen aus `snapshot-schema.ts`.',
  ).toEqual([]);
});

/**
 * Gegenprobe: der Wächter oben ist nur etwas wert, wenn er einen Wertimport auch wirklich
 * erkennt. Ohne diese Fälle bliebe unbemerkt, dass ein zu strenges oder zu laxes Muster alles
 * durchwinkt — der erste Entwurf war zu lax und meldete stattdessen falsche Treffer.
 */
describe('snapshotValueImports', () => {
  const offending = [
    "import { loadSnapshot } from '../../lib/snapshot.js';",
    "import snapshot, { type MatrixRow } from './snapshot.js';",
    "import { assertSnapshot, type CatalogSnapshot } from './snapshot.js';",
    "import * as snapshot from '../../lib/snapshot.js';",
  ];

  const allowed = [
    "import type { MatrixRow } from '../../lib/snapshot.js';",
    "import { type MatrixRow, type ReviewSummary } from './snapshot.js';",
    "import { assertSnapshot } from './snapshot-schema.js';",
    "import { fetchSnapshot } from './snapshot-client.js';",
    "import type { CatalogSnapshot } from '../../lib/snapshot-schema.js';",
  ];

  it.each(offending)('meldet %s', (line) => {
    expect(snapshotValueImports(line)).toHaveLength(1);
  });

  it.each(allowed)('lässt %s durch', (line) => {
    expect(snapshotValueImports(line)).toEqual([]);
  });

  it('lässt sich von einem Kommentar über dem Import nicht täuschen', () => {
    const text = [
      '// Nur Typen: ein Wertimport aus `snapshot.ts` zöge dessen `import.meta.glob` in dieses',
      '// Bündel. `import type` wird beim Bauen entfernt.',
      "import type { CatalogSnapshot } from '../../lib/snapshot.js';",
    ].join('\n');
    expect(snapshotValueImports(text)).toEqual([]);
  });

  it('meldet einen Wertimport auch unter einem Kommentar', () => {
    const text = ['/* import ... from irgendwo */', "import { loadSnapshot } from './snapshot.js';"].join('\n');
    expect(snapshotValueImports(text)).toHaveLength(1);
  });
});
