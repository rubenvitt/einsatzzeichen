import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  VERBATIM_TABLE_COMMAND,
  VERBATIM_TABLE_MODULE,
  verbatimTableSource,
} from './combination-provenance.js';

/**
 * Drift-Gate der verbatim-Tabelle in core (LFH-581).
 *
 * `symbolProvenance` in core liest eine generierte Tabelle, weil core weder die Rezepte noch die
 * Kennwerte der Originale mitbringt (Größen-Gate, Paketrichtung). Die Tabelle ist damit eine
 * Abschrift — und eine Abschrift darf nicht still veralten. Ändert sich ein Rezept, der
 * Körpervergleich, eine Vergleichsausnahme oder `specKey`, rechnet dieser Test die Tabelle aus dem
 * Körpervergleich neu und verlangt Byte-Gleichheit mit dem Modul in core.
 */
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const modulePath = resolve(repoRoot, VERBATIM_TABLE_MODULE);

describe('verbatim-Tabelle in core', () => {
  it('entspricht dem neu gerechneten Körpervergleich', () => {
    const hint =
      `${VERBATIM_TABLE_MODULE} weicht vom Körpervergleich der Fixtures ab. ` +
      `Neu erzeugen mit \`${VERBATIM_TABLE_COMMAND}\` und die Änderung prüfen.`;
    expect(existsSync(modulePath), hint).toBe(true);
    expect(readFileSync(modulePath, 'utf8'), hint).toBe(verbatimTableSource());
  });
});
