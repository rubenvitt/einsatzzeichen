/**
 * Wo liegt das Repository — und liegt der Referenzbestand daneben?
 *
 * Beides wird vom Paketverzeichnis aus bestimmt, nicht über `process.cwd()`: `pnpm review` läuft
 * über `pnpm --filter` im Paket, ein direkter `tsx`-Aufruf oft im Wurzelverzeichnis, ein Test in
 * einem dritten. Ein vom Aufrufort abhängiger Pfad hiesse, dass der Ledger einmal geschrieben
 * wird und einmal nicht gefunden wird. Vorbild ist `findSheetDirectory` in
 * `packages/website/src/lib/contact-sheets.ts`; anders als dort ist der Startpunkt hier
 * `import.meta.url`, weil dieses Modul nicht gebündelt wird und im Quellbaum stehen bleibt.
 */
import { statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Der Marker, an dem der pnpm-Workspace erkennbar ist. */
const WORKSPACE_MARKER = 'pnpm-workspace.yaml';

/** Der Ordner mit den lokalen Referenz-SVG. Wird nie eingecheckt (Spec §8). */
export const REFERENCE_DIRECTORY = 'taktische-zeichen';

/** `packages/review` — zwei Ebenen über dieser Datei (`src/server/`). */
export const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

/**
 * Sucht von `start` aufwärts nach `pnpm-workspace.yaml`. Fail-closed: ohne Fund ein Fehler statt
 * eines Rückfalls auf das Arbeitsverzeichnis — ein geratener Wurzelpfad führte zu einem
 * Schreibvorgang in eine fremde Datei.
 */
export function findRepositoryRoot(start: string = PACKAGE_ROOT): string {
  let directory = resolve(start);
  for (;;) {
    if (isFile(join(directory, WORKSPACE_MARKER))) return directory;
    const parent = dirname(directory);
    if (parent === directory) {
      throw new Error(
        `Das Repository-Wurzelverzeichnis wurde nicht gefunden: ${WORKSPACE_MARKER} ist von ` +
          `${resolve(start)} aus in keinem übergeordneten Verzeichnis erreichbar.`,
      );
    }
    directory = parent;
  }
}

/** Ob `taktische-zeichen/` im Repository liegt. Fehlt es, entfällt nur der Referenzvergleich. */
export function hasReferenceRoot(repositoryRoot: string): boolean {
  return isDirectory(join(repositoryRoot, REFERENCE_DIRECTORY));
}
