import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { UnitGroupingId } from '@einsatzzeichen/schema';
import { UNIT_GROUPING_BLOCKS } from './head.js';
import { unitGroupingHead } from '../geometry/unit-groupings.js';

/**
 * Laufzeit-Gate der Verbandsbausteine (LFH-577). `measured` muss sich über `unitGroupingHead` zu
 * Geometrie auflösen und im Fundort die Konstante nennen; die Lücke darf nicht auflösen. Die
 * übrigen Kopfbausteine prüft `conformance/src/block-register/head.test.ts`.
 */

const packagesRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

function sourceAt(place: string): string {
  const match = /^([a-z0-9/.-]+\.ts):(\d+)(?:–(\d+))?$/u.exec(place);
  if (match === null) throw new Error(`${place}: kein Fundort der Form pfad.ts:zeile[–zeile]`);
  const [, file, from, to] = match as unknown as [string, string, string, string | undefined];
  return readFileSync(join(packagesRoot, file), 'utf8')
    .split('\n')
    .slice(Number(from) - 1, Number(to ?? from))
    .join('\n');
}

describe('Verbandsbausteine', () => {
  it('führt Verband I und II als vermessen, Verband III als Lücke', () => {
    expect(UNIT_GROUPING_BLOCKS.map((entry) => [entry.valueId, entry.binding.status])).toEqual([
      ['verband-i', 'measured'],
      ['verband-ii', 'measured'],
      ['verband-iii', 'not-measured'],
    ]);
  });

  it('löst jeden vermessenen Eintrag zu Geometrie auf und nennt im Fundort seine Konstante', () => {
    for (const entry of UNIT_GROUPING_BLOCKS) {
      if (entry.binding.status !== 'measured') continue;
      const head = unitGroupingHead(entry.valueId as UnitGroupingId);
      expect(head?.primitives.length, entry.id).toBeGreaterThan(0);
      const constant = `const ${entry.valueId.toUpperCase().replace(/-/gu, '_')}`;
      expect(sourceAt(entry.binding.geometry.definedAt), entry.id).toContain(constant);
      expect(entry.binding.geometry.sourceRefs?.length ?? 0, entry.id).toBeGreaterThan(0);
    }
  });

  it('löst die Lücke nicht auf und nennt Datei, Vorschlag und Fundort des Vorschlags', () => {
    const gap = UNIT_GROUPING_BLOCKS.find((entry) => entry.valueId === 'verband-iii');
    expect(gap?.binding.status).toBe('not-measured');
    if (gap?.binding.status !== 'not-measured') return;
    expect(unitGroupingHead('verband-iii')).toBeUndefined();
    expect(gap.binding.gap.reason).toContain('5.5.3_Bereitschaft (Verband III).svg');
    expect(gap.binding.gap.reason).toContain('x 12, 16 und 20');
    expect(sourceAt(gap.binding.gap.definedAt)).toContain('UNIT_GROUPING_III_PROPOSAL_CX_MM');
  });
});
