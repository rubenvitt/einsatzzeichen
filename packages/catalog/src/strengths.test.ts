import { describe, expect, it } from 'vitest';
import type { HeadShape, StrengthId } from '@einsatzzeichen/schema';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import { strengthHead } from './strengths.js';

/**
 * Vermessen an elf Referenzdateien (C.1.1, C.1.2, C.1.3, C.1.7, C.1.8, C.1.9, C.1.11, C.1.13,
 * C.1.14, D.3.7, E.1.18): drei feste Reihenplätze bei cx = 11 / 16 / 21. Jeder Grad bestimmt,
 * welche Plätze belegt sind — `gruppe` lässt die Mitte frei. Das ist der Nachweis, den das
 * Fingerprint-Gate nicht leisten kann: es vergleicht nur `role: 'body'`, nie `role: 'head'`.
 */
const EXPECTED_HEADS = {
  trupp: {
    heightMm: 3,
    marks: [{ cxMm: 16, cyFromTopMm: 1.5, rMm: 1.5 }],
  },
  staffel: {
    heightMm: 7,
    marks: [
      { cxMm: 16, cyFromTopMm: 1.5, rMm: 1.5 },
      { cxMm: 16, cyFromTopMm: 5.5, rMm: 1.5 },
    ],
  },
  gruppe: {
    heightMm: 3,
    marks: [
      { cxMm: 11, cyFromTopMm: 1.5, rMm: 1.5 },
      { cxMm: 21, cyFromTopMm: 1.5, rMm: 1.5 },
    ],
  },
  zug: {
    heightMm: 3,
    marks: [
      { cxMm: 11, cyFromTopMm: 1.5, rMm: 1.5 },
      { cxMm: 16, cyFromTopMm: 1.5, rMm: 1.5 },
      { cxMm: 21, cyFromTopMm: 1.5, rMm: 1.5 },
    ],
  },
} as const satisfies Record<StrengthId, HeadShape>;

const STRENGTH_CASES = Object.entries(EXPECTED_HEADS) as Array<
  [StrengthId, (typeof EXPECTED_HEADS)[StrengthId]]
>;

describe('Stärkeangaben', () => {
  it('bindet den Kopfgeometrie-Claim exakt an die ausgeführten Stärkefälle', () => {
    const tested = STRENGTH_CASES.map(([id]) => `strength.${id}`).sort();
    const claimed = COVERAGE_MANIFEST.entries
      .filter((entry) => entry.testEvidence.includes('head-shape-regression'))
      .map((entry) => entry.implementation)
      .sort();
    expect(tested).toEqual(claimed);
  });

  it.each(STRENGTH_CASES)('reproduziert die vollständige Kopfgeometrie für "%s"', (id, expected) => {
    expect(strengthHead(id)).toEqual(expected);
  });

  it('erzeugt für jeden Stärkegrad eine eigene Kopfzone', () => {
    const shapes = STRENGTH_CASES.map(([id]) => JSON.stringify(strengthHead(id)));
    expect(new Set(shapes).size).toBe(STRENGTH_CASES.length);
  });
});
