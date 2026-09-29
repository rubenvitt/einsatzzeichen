import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  VERBATIM_TABLE_MODULE,
  verbatimFixtures,
  verbatimTableSource,
} from '@einsatzzeichen/conformance';

/**
 * Generator der verbatim-Tabelle in core (LFH-581): `pnpm cli provenance:table`.
 *
 * core beantwortet `symbolProvenance(spec)` ohne Prüfpaket aus einer generierten Tabelle. Dieser
 * Befehl schreibt sie aus dem Körpervergleich der Fixtures in conformance neu; das Drift-Gate
 * `packages/conformance/src/verbatim-table-drift.test.ts` verlangt, dass die Datei im Repository
 * genau diesem Ergebnis entspricht. Der Befehl rechnet und schreibt nur — ob die Änderung fachlich
 * stimmt, zeigt der Diff.
 */
export interface ProvenanceTableResult {
  /** Absoluter Pfad der geschriebenen Datei. */
  readonly file: string;
  /** Anzahl der verbatim-Zeilen. */
  readonly rows: number;
}

export function writeProvenanceTable(options: { root?: string } = {}): ProvenanceTableResult {
  const file = join(options.root ?? process.cwd(), VERBATIM_TABLE_MODULE);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, verbatimTableSource());
  return { file, rows: verbatimFixtures().length };
}
