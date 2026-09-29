import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { VERBATIM_TABLE_MODULE, verbatimTableSource } from '@einsatzzeichen/conformance';
import { writeProvenanceTable } from './provenance-table.js';

describe('provenance:table', () => {
  const roots: string[] = [];
  afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
  });

  it('schreibt das generierte core-Modul unter die angegebene Wurzel', () => {
    const root = mkdtempSync(join(tmpdir(), 'provenance-table-'));
    roots.push(root);

    const result = writeProvenanceTable({ root });

    expect(result.file).toBe(join(root, VERBATIM_TABLE_MODULE));
    // 241 bis LFH-786, dazu die 37 Anhang-C-Fixtures.
    expect(result.rows).toBe(278);
    expect(readFileSync(result.file, 'utf8')).toBe(verbatimTableSource());
  });
});
