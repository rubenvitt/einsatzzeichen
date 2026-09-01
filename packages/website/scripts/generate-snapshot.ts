import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSnapshot } from '../src/lib/snapshot-build.js';
import { writeSnapshotFile } from '../src/lib/snapshot-file.js';

const OUTPUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../public/catalog-snapshot.json',
);

/**
 * Erzeugt den Katalog-Snapshot vor `astro dev` und `astro build` (Spec §5.3). Kein stiller
 * Rückfall: jeder Fehler aus `buildSnapshot()` — fehlender Katalogeintrag, doppelter Slug,
 * unableitbares Kapitel — beendet den Lauf mit Exit 1 und Klartext (Spec §7).
 *
 * Ziel ist `public/`, nicht mehr `src/generated/` (LFH-500): von dort liefert Astro die Datei
 * unverändert als `/catalog-snapshot.json` aus. Damit ist derselbe Snapshot zweierlei — die
 * Bauzeit-Quelle für `loadSnapshot()` (Node) und der Laufzeit-Endpunkt für `fetchSnapshot()`
 * (Browser). Eine Datei, keine zwei Stände, die auseinanderlaufen könnten.
 *
 * Geschrieben wird über `writeSnapshotFile()` und damit atomar (LFH-503). Dieses Skript hängt an
 * `predev`, `prebuild` und `precheck` und läuft deshalb regelmäßig neben einem fremden Prozess,
 * der dieselbe Datei liest — ein `writeFileSync` auf den Zielnamen kürzt 1,3 MB erst auf null und
 * gäbe diesem Leser eine halbe Datei.
 */
function main(): void {
  const snapshot = buildSnapshot();
  mkdirSync(dirname(OUTPUT), { recursive: true });
  const json = JSON.stringify(snapshot, null, 0);
  writeSnapshotFile(OUTPUT, json);
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
