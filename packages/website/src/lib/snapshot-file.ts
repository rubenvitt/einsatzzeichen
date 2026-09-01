import { randomBytes } from 'node:crypto';
import { closeSync, constants, fsyncSync, openSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

/**
 * Das Schreiben des Snapshots — getrennt vom Generator, damit es einen Test bekommen kann.
 * Vitest sammelt nur Tests unterhalb von `src/` eines Pakets (`vitest.config.ts`);
 * `packages/website/scripts/` gehört nicht dazu, ein Test neben dem Skript wäre eine Attrappe,
 * die nie läuft.
 *
 * Node ist hier absichtlich im Spiel: dieses Modul gehört zur Bauzeit und wird von keiner Insel
 * geladen.
 */

function isErrorWithCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' && error !== null && (error as NodeJS.ErrnoException).code === code
  );
}

/**
 * Schreibt den Snapshot so, dass ein gleichzeitiger Leser nie eine halbe Datei sieht: erst
 * vollständig in eine temporäre Datei, dann ein `rename` über den Zielnamen.
 *
 * Der Wettlauf, den das beendet, ist beobachtet worden: `pnpm generate` hängt an `predev`,
 * `prebuild` und `precheck` und läuft damit regelmäßig neben einem `vitest`, der dieselbe
 * 1,3-MB-Datei liest. Ein `writeFileSync` auf den Zielnamen kürzt sie erst auf null und füllt sie
 * dann — wer in diesem Moment liest, bekommt einen `JSON.parse`-Fehler an wechselnder Stelle und
 * keinen Hinweis darauf, woher er kommt. Nach dem `rename` sieht ein Leser entweder den alten oder
 * den neuen Stand, und ein bereits geöffneter Deskriptor liest den alten vollständig zu Ende.
 *
 * Die temporäre Datei entsteht **im Zielverzeichnis** und nicht in `os.tmpdir()`: `rename` ist nur
 * innerhalb eines Dateisystems atomar, über eine Grenze hinweg fällt Node auf Kopieren zurück und
 * der Wettlauf wäre wieder da.
 *
 * Dieselbe Folge fährt `writeVisualProof` in `packages/cli/src/commands/visual-proof.ts`, dort aber
 * mit `O_NOFOLLOW` und einer `nlink`-Prüfung auf dem Ziel. Das ist ein Sicherheitsvertrag gegen
 * einen Pfad aus der Kommandozeile; hier ist das Ziel fest verdrahtet und liegt im eigenen Paket,
 * die Prüfungen hätten nichts zu prüfen. `O_EXCL` bleibt trotzdem: zwei gleichzeitige Generatoren
 * dürfen sich nicht dieselbe temporäre Datei teilen.
 */
export function writeSnapshotFile(destination: string, contents: string): void {
  const temporary = join(
    dirname(destination),
    `.${basename(destination)}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`,
  );
  let descriptor: number | undefined;
  let renamed = false;
  try {
    descriptor = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o644);
    writeFileSync(descriptor, contents, 'utf8');
    // Ohne `fsync` steht der Inhalt nur im Seitencache; nach einem Stromausfall zeigte der
    // Zielname dann auf eine leere Datei — sichtbar vollständig, tatsächlich nicht geschrieben.
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    renameSync(temporary, destination);
    renamed = true;
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
    // Beim Aufräumen darf kein zweiter Fehler den ersten verdecken: ist die temporäre Datei nie
    // entstanden (etwa weil das Zielverzeichnis fehlt), soll der Aufrufer den `open`-Fehler sehen
    // und keinen `unlink`-Fehler.
    if (!renamed) {
      try {
        unlinkSync(temporary);
      } catch (error) {
        if (!isErrorWithCode(error, 'ENOENT')) throw error;
      }
    }
  }
}
