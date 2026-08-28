import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSnapshot } from '../src/lib/snapshot-build.js';

const OUTPUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../src/generated/catalog-snapshot.json',
);

/**
 * Erzeugt den Katalog-Snapshot vor `astro dev` und `astro build` (Spec §5.3). Kein stiller
 * Rückfall: jeder Fehler aus `buildSnapshot()` — fehlender Katalogeintrag, doppelter Slug,
 * unableitbares Kapitel — beendet den Lauf mit Exit 1 und Klartext (Spec §7).
 */
function main(): void {
  const snapshot = buildSnapshot();
  mkdirSync(dirname(OUTPUT), { recursive: true });
  const json = JSON.stringify(snapshot, null, 0);
  writeFileSync(OUTPUT, json, 'utf8');
  const kib = Math.round(Buffer.byteLength(json, 'utf8') / 1024);
  console.log(
    `Katalog-Snapshot geschrieben: ${snapshot.symbols.length} Zeichen, ` +
      `${snapshot.coverage.matrix.length} Manifestzeilen, ${kib} KiB → ${OUTPUT}`,
  );
}

try {
  main();
} catch (error) {
  console.error(
    'Der Katalog-Snapshot konnte nicht erzeugt werden:',
    error instanceof Error ? error.message : error,
  );
  if (error instanceof Error && error.stack !== undefined) console.error(error.stack);
  process.exit(1);
}
