import { describe, expect, it } from 'vitest';
import type { StrengthId } from '@einsatzzeichen/schema';
import { strengthHead } from './strengths.js';

const ALL: readonly StrengthId[] = ['trupp', 'staffel', 'gruppe', 'zug'];

/**
 * Vermessen an elf Referenzdateien (C.1.1, C.1.2, C.1.3, C.1.7, C.1.8, C.1.9, C.1.11, C.1.13,
 * C.1.14, D.3.7, E.1.18): drei feste Reihenplätze bei cx = 11 / 16 / 21. Jeder Grad bestimmt,
 * welche Plätze belegt sind — `gruppe` lässt die Mitte frei. Das ist der Nachweis, den das
 * Fingerprint-Gate nicht leisten kann: es vergleicht nur `role: 'body'`, nie `role: 'head'`.
 */
const ROW_CASES: ReadonlyArray<readonly [StrengthId, readonly number[]]> = [
  ['trupp', [16]],
  ['gruppe', [11, 21]],
  ['zug', [11, 16, 21]],
];

describe('Stärkeangaben', () => {
  it('setzt die Staffel als zwei senkrecht gestapelte Punkte', () => {
    const head = strengthHead('staffel');
    expect(head.marks).toHaveLength(2);
    expect(head.heightMm).toBeCloseTo(7, 6);
    for (const mark of head.marks) {
      expect(mark.cxMm).toBeCloseTo(16, 6);
      expect(mark.rMm).toBeCloseTo(1.5, 6);
    }
    expect(head.marks.map((m) => m.cyFromTopMm)).toEqual([1.5, 5.5]);
  });

  it('setzt die waagerechte Reihe 3 mm hoch mit Marken auf halber Höhe', () => {
    const head = strengthHead('gruppe');
    expect(head.heightMm).toBeCloseTo(3, 6);
    for (const mark of head.marks) expect(mark.cyFromTopMm).toBeCloseTo(1.5, 6);
  });

  it('erzeugt für jeden Stärkegrad mindestens eine Marke', () => {
    for (const id of ALL) expect(strengthHead(id).marks.length).toBeGreaterThan(0);
  });

  it('erzeugt für jeden Stärkegrad eine eigene Kopfzone', () => {
    const shapes = ALL.map((id) => JSON.stringify(strengthHead(id)));
    expect(new Set(shapes).size).toBe(ALL.length);
  });

  it.each(ROW_CASES)('setzt die Reihe für "%s" auf die vermessenen cx-Plätze', (id, expectedCx) => {
    const head = strengthHead(id);
    expect(head.marks.map((m) => m.cxMm)).toEqual(expectedCx);
  });
});
