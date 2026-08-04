import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { extractFingerprint, type Fingerprint } from '../scan/extract.js';

const REFERENCE_DIR = 'taktische-zeichen';
const OUTPUT = 'packages/catalog/src/fingerprints.json';

export interface AuditOptions {
  /** Nur Dateien, deren Name mit diesem Präfix beginnt (z. B. "1." oder "C.1.1"). */
  filter?: string;
  /** Nur ausgeben, nichts schreiben. */
  print?: boolean;
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

export function auditReference(options: AuditOptions = {}): Fingerprint[] {
  let files: string[];
  try {
    files = readdirSync(REFERENCE_DIR).filter((name) => name.endsWith('.svg'));
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      throw new Error(
        `Referenzordner "${REFERENCE_DIR}" nicht gefunden. Der Bestand wird nie eingecheckt ` +
          `und muss lokal vorliegen.`,
        { cause: error },
      );
    }
    // Andere Ursachen (fehlende Leserechte, kaputter Symlink, kein Verzeichnis …)
    // sind keine "Bestand fehlt lokal"-Situation und dürfen nicht so ausgegeben werden.
    throw error;
  }

  const selected = options.filter
    ? files.filter((name) => name.startsWith(options.filter as string))
    : files;
  selected.sort();

  const fingerprints = selected.map((name) =>
    extractFingerprint(readFileSync(join(REFERENCE_DIR, name), 'utf8'), name),
  );

  if (options.print === true) {
    console.log(JSON.stringify(fingerprints, null, 2));
    return fingerprints;
  }

  writeFileSync(OUTPUT, `${JSON.stringify(fingerprints, null, 2)}\n`, 'utf8');
  console.log(`${fingerprints.length} Kennzahlensätze nach ${OUTPUT} geschrieben.`);
  return fingerprints;
}
