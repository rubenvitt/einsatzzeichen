import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWBOX_MM, entryKey, type CatalogEntry } from '@einsatzzeichen/schema';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import { checkCoverage, findPrimaryViolations } from './coverage-gate.js';
import { ALL_PICTOGRAMS, pictogramVariantKey } from './pictograms/index.js';

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

  it('führt 24 Einträge: acht Grundzeichen, drei Rezepte, dreizehn Elemente', () => {
    const counts = COVERAGE_MANIFEST.entries.reduce<Record<string, number>>((acc, e) => {
      acc[e.coverage] = (acc[e.coverage] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ 'catalog-entry': 8, 'composition-recipe': 3, element: 13 });
    expect(COVERAGE_MANIFEST.entries).toHaveLength(24);
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
    expect(COVERAGE_MANIFEST.scope).toEqual([
      '1',
      '2',
      '4.3.1',
      '4.3.2',
      '5.4',
      'C.1.1',
      'C.1.2',
      'D.3.7',
    ]);
  });

  it('meldet Katalogeinträge ohne genau eine primary-Darstellung', () => {
    const none = fixtureEntry('test.none', 0);
    const two = fixtureEntry('test.two', 2);
    const one = fixtureEntry('test.one', 1);

    expect(findPrimaryViolations([none, two, one])).toEqual(['test.none', 'test.two']);
  });
});

describe('Manifest-Einträge für Piktogramme', () => {
  it('bindet jede Piktogrammdefinition an genau eine Manifestzeile', () => {
    const definitions = ALL_PICTOGRAMS.map(pictogramVariantKey).sort();
    const rows = COVERAGE_MANIFEST.entries
      .filter((entry) => entry.coverage === 'element' && entry.implementation.startsWith('capability.'))
      .map((entry) => entryKey(entry.implementation, entry.variant))
      .sort();
    expect(rows).toEqual(definitions);
  });

  it('leitet Abschnitt, Titel und Referenzdatei jeder Piktogrammzeile aus ihrer Definition ab', () => {
    for (const definition of ALL_PICTOGRAMS) {
      const entry = COVERAGE_MANIFEST.entries.find(
        (candidate) =>
          entryKey(candidate.implementation, candidate.variant) === pictogramVariantKey(definition),
      );
      expect(entry).toMatchObject({
        sourceId: `bbk-babz-2025:${definition.section}`,
        variant: definition.variant,
        title: definition.title,
        referenceAsset: definition.referenceAsset,
      });
    }
  });

  function entryFor(section: string) {
    return COVERAGE_MANIFEST.entries.find((entry) => entry.sourceId === `bbk-babz-2025:${section}`);
  }

  it('führt 4.3.2 im beanspruchten Umfang und als Eintrag', () => {
    // Der Scope wächst nie vorauseilend: ein Kapitel im Scope ohne Eintrag ist ein
    // Release-Blocker, und die Erweiterung vor dem Inhalt erzeugt genau die Falschaussage,
    // die das Manifest verhindern soll.
    expect(COVERAGE_MANIFEST.scope).toContain('4.3.2');
    expect(entryFor('4.3.2')).toBeDefined();
  });

  it('gibt Piktogrammen Snapshot- und Vertragsnachweis statt eines Körper-Fingerprints', () => {
    for (const section of ['4.3.1', '4.3.2']) {
      const entry = entryFor(section);
      expect(entry?.coverage).toBe('element');
      // matchFingerprint vergleicht ausschließlich role: 'body' — für ein Piktogramm ist das
      // strukturell unerreichbar und kein Versäumnis.
      expect(entry?.testEvidence).toEqual(['svg-snapshot', 'pictogram-contract']);
    }
  });

  it('weist Organisationen und Stärken mit ihrer arteigenen Evidenz nach', () => {
    expect(entryFor('2.1')?.testEvidence).toEqual(['reference-fill']);
    expect(entryFor('5.4.1')?.testEvidence).toEqual(['head-shape-regression']);
  });

  it('begründet den technical-Status der Piktogramme an den vier Gates', () => {
    const entry = entryFor('4.3.2');
    expect(entry?.review.technical.status).toBe('approved');
    expect(entry?.review.technical.note).toContain('Box');
    expect(entry?.review.technical.note).toContain('Clipping');
    expect(entry?.review.technical.note).toContain('Mehrgrößen');
    expect(entry?.review.technical.note).toContain('viewBox');
    expect(entry?.review.domain.status).toBe('pending');
  });
});
