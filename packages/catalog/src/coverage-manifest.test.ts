import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWBOX_MM, entryKey, type CatalogEntry } from '@einsatzzeichen/schema';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import { checkCoverage, findPrimaryViolations } from './coverage-gate.js';

// Dieselbe Vorlage wie in `coverage-gate.test.ts`: beide Dateien brauchen einen Katalogeintrag
// mit einstellbarer Zahl von `primary`-Darstellungen, und ein gemeinsames Testmodul für eine
// einzige Vorlage wäre eine Abhängigkeit ohne Gegenwert.
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

  it('enthält alle drei Eintragsarten', () => {
    const kinds = new Set(COVERAGE_MANIFEST.entries.map((e) => e.coverage));
    expect(kinds).toContain('catalog-entry');
    expect(kinds).toContain('composition-recipe');
    expect(kinds).toContain('element');
  });

  it('führt 23 Einträge: acht Grundzeichen, drei Rezepte, zwölf Elemente', () => {
    const counts = COVERAGE_MANIFEST.entries.reduce<Record<string, number>>((acc, e) => {
      acc[e.coverage] = (acc[e.coverage] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ 'catalog-entry': 8, 'composition-recipe': 3, element: 12 });
    expect(COVERAGE_MANIFEST.entries).toHaveLength(23);
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
    const { missing, duplicates, invalidPrimary } = checkCoverage();
    expect({ missing, duplicates, invalidPrimary }).toEqual({
      missing: [],
      duplicates: [],
      invalidPrimary: [],
    });
  });

  it('nennt die BABZ-Empfehlungen als Baseline', () => {
    // `CoverageManifest.baseline` ist auf `SourceId` getippt, damit nur eine registrierte Quelle
    // dort stehen kann — welche, sagt der Typ nicht. `checkBaselinePrefix` prüft die Einträge
    // gegen genau diesen Wert und wäre allein selbstbezüglich: Baseline und Präfixe gemeinsam
    // umgestellt bliebe das Gate grün. Dieser Test hält den Wert fest.
    expect(COVERAGE_MANIFEST.baseline).toBe('bbk-babz-2025');
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
