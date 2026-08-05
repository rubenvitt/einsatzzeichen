import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWBOX_MM, entryKey, type CatalogEntry } from '@einsatzzeichen/schema';
import { COVERAGE_MANIFEST, checkCoverage, findPrimaryViolations } from './coverage-manifest.js';

function fixtureEntry(id: string, primaryCount: number): CatalogEntry {
  return {
    id,
    title: 'Test',
    kind: 'formation',
    profile: 'bund',
    depictions: Array.from({ length: primaryCount }, () => ({
      variant: 'primary' as const,
      drawing: { viewBox: DEFAULT_VIEWBOX_MM, children: [] },
      sourceRefs: [],
    })),
  };
}

describe('Coverage-Manifest', () => {
  it('ist über Quellen-ID und Variante eindeutig keyfähig', () => {
    const keys = COVERAGE_MANIFEST.entries.map((e) => entryKey(e.sourceId, e.variant));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('enthält beide Eintragsarten', () => {
    const kinds = new Set(COVERAGE_MANIFEST.entries.map((e) => e.coverage));
    expect(kinds).toContain('catalog-entry');
    expect(kinds).toContain('composition-recipe');
  });

  it('trägt für jeden Eintrag eine Referenzdatei und beide Reviewrollen', () => {
    for (const entry of COVERAGE_MANIFEST.entries) {
      expect(entry.referenceAsset).toMatch(/\.svg$/);
      expect(entry.review.technical.status).toBe('approved');
      expect(entry.review.technical.reviewer).toBe('rv');
      expect(entry.review.domain.status).toBe('pending');
    }
  });

  it('meldet keine fehlenden, doppelten oder primary-verletzenden Einträge', () => {
    expect(checkCoverage()).toEqual({ missing: [], duplicates: [], invalidPrimary: [] });
  });

  it('beansprucht nur den Umfang dieses Slice', () => {
    expect(COVERAGE_MANIFEST.scope).toEqual(['1', '2', '4.3.1', '5.4', 'C.1.1', 'C.1.2', 'D.3.7']);
  });

  it('meldet Katalogeinträge ohne genau eine primary-Darstellung', () => {
    const none = fixtureEntry('test.none', 0);
    const two = fixtureEntry('test.two', 2);
    const one = fixtureEntry('test.one', 1);

    expect(findPrimaryViolations([none, two, one])).toEqual(['test.none', 'test.two']);
  });
});
