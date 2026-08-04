import { describe, expect, it } from 'vitest';
import { matchFingerprint } from '@einsatzzeichen/core';
import { BASE_SYMBOLS, baseDrawing } from './base-symbols.js';
import { fingerprintFor } from './fingerprint-index.js';

const REFERENCE: ReadonlyArray<[keyof typeof BASE_SYMBOLS, string]> = [
  ['formation', '1.1_Taktische Formation.svg'],
  ['person', '1.2_Person.svg'],
  ['post', '1.6_Funktionsstelle.svg'],
  ['building', '1.7_Gebäude.svg'],
  ['container', '1.8_Behälter Ressource Raum Funkgerät.svg'],
];

describe('Grundzeichen Kapitel 1', () => {
  it.each(REFERENCE)('trifft die Referenzgeometrie von %s', (kind, asset) => {
    const result = matchFingerprint(baseDrawing(kind), fingerprintFor(asset));
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it.each(REFERENCE)('trägt Quellenbezug und Reviewstatus für %s', (kind) => {
    const entry = BASE_SYMBOLS[kind];
    expect(entry.depictions).toHaveLength(1);
    expect(entry.depictions[0]?.variant).toBe('primary');
    expect(entry.depictions[0]?.sourceRefs[0]?.source).toBe('babz-svg-2025');
    expect(entry.depictions[0]?.sourceRefs[0]?.status).toBe('verbatim');
  });

  it('markiert den Körper jedes Grundzeichens mit der Rolle body', () => {
    for (const [kind] of REFERENCE) {
      const body = baseDrawing(kind).children.find((c) => c.role === 'body');
      expect(body, `${kind} hat kein body-Primitiv`).toBeDefined();
    }
  });
});
