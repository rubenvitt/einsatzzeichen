import { describe, expect, it } from 'vitest';
import {
  DEFAULT_VIEWBOX_MM,
  entryKey,
  type CatalogEntry,
  type CoverageEntry,
  type ProfileId,
} from '@einsatzzeichen/schema';
import { BASE_SYMBOLS } from './base-symbols.js';
import {
  COVERAGE_MANIFEST,
  checkCoverage,
  findPrimaryViolations,
  checkBaselinePrefix,
  checkCatalogSourceRefs,
  checkProfileAgreement,
  checkReviewAttribution,
  countOpenDomainReviews,
} from './coverage-manifest.js';

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

function fixtureCoverageEntry(overrides: Partial<CoverageEntry> = {}): CoverageEntry {
  return {
    sourceId: 'bbk-babz-2025:1.1',
    variant: 'primary',
    title: 'Test',
    implementation: 'base.formation',
    referenceAsset: '1.1_Taktische Formation.svg',
    coverage: 'catalog-entry',
    profile: 'bund',
    fingerprintTest: true,
    snapshotTest: true,
    review: {
      technical: { status: 'approved', reviewer: 'rv', date: '2026-08-05' },
      domain: { status: 'pending' },
    },
    ...overrides,
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

describe('Gate-Prüfungen zu Quelle, Profil und Review', () => {
  it('nimmt ein Präfix an, das der Baseline entspricht', () => {
    expect(checkBaselinePrefix([fixtureCoverageEntry()], 'bbk-babz-2025')).toEqual([]);
  });

  it('meldet ein Präfix, das eine andere registrierte Quelle nennt', () => {
    const wrong = fixtureCoverageEntry({ sourceId: 'babz-svg-2025:1.1' });
    const [violation] = checkBaselinePrefix([wrong], 'bbk-babz-2025');
    expect(violation?.check).toBe('baseline-prefix');
    expect(violation?.detail).toContain('babz-svg-2025');
  });

  it('meldet einen sourceId ohne Präfixtrenner', () => {
    const wrong = fixtureCoverageEntry({ sourceId: '1.1' });
    expect(checkBaselinePrefix([wrong], 'bbk-babz-2025')).toHaveLength(1);
  });

  it('nimmt einen Katalogeintrag an, dessen primary eine registrierte Quelle nennt', () => {
    expect(checkCatalogSourceRefs(Object.values(BASE_SYMBOLS))).toEqual([]);
  });

  it('meldet einen Katalogeintrag, dessen primary keine Quelle nennt', () => {
    const entry = fixtureEntry('test.ohne-quelle', 1);
    const [violation] = checkCatalogSourceRefs([entry]);
    expect(violation?.check).toBe('unregistered-source');
    expect(violation?.key).toBe('test.ohne-quelle');
  });

  it('nimmt einen Manifest-Eintrag an, dessen Profil dem Katalogeintrag entspricht', () => {
    const entry = fixtureEntry('base.formation', 1);
    const manifest = fixtureCoverageEntry({ implementation: 'base.formation' });
    expect(checkProfileAgreement([manifest], [entry])).toEqual([]);
  });

  it('meldet einen Manifest-Eintrag, dessen Profil vom Katalogeintrag abweicht', () => {
    // `ProfileId` kennt heute nur `'bund'`; ein echter Abgleichsfehler lässt sich nur über eine
    // Zusicherung herstellen. Die Prüfung ist trotzdem nötig — sie greift, sobald ein zweites
    // Profil existiert.
    const entry = fixtureEntry('base.formation', 1);
    const manifest = fixtureCoverageEntry({
      implementation: 'base.formation',
      profile: 'laender' as unknown as ProfileId,
    });
    const [violation] = checkProfileAgreement([manifest], [entry]);
    expect(violation?.check).toBe('profile-mismatch');
    expect(violation?.detail).toContain('laender');
  });

  it('meldet einen Katalogeintrags-Manifestwert ohne zugehörigen Katalogeintrag', () => {
    const orphan = fixtureCoverageEntry({ implementation: 'base.unbekannt' });
    const [violation] = checkProfileAgreement([orphan], []);
    expect(violation?.check).toBe('profile-mismatch');
    expect(violation?.detail).toContain('base.unbekannt');
  });

  it('prüft das Profil nur bei Katalogeinträgen, nicht bei Rezepten und Elementen', () => {
    const recipe = fixtureCoverageEntry({
      coverage: 'composition-recipe',
      implementation: 'recipe.C.1.1',
    });
    expect(checkProfileAgreement([recipe], [])).toEqual([]);
  });

  it('nimmt einen Eintrag an, dessen approved-Rollen Reviewer und Datum tragen', () => {
    expect(checkReviewAttribution([fixtureCoverageEntry()])).toEqual([]);
  });

  it('meldet ein approved ohne Reviewer unter Nennung der Rolle', () => {
    const bad = fixtureCoverageEntry({
      review: { technical: { status: 'approved' }, domain: { status: 'pending' } },
    });
    const [violation] = checkReviewAttribution([bad]);
    expect(violation?.check).toBe('review-attribution');
    expect(violation?.detail).toContain('technical');
  });

  it('zählt die offenen fachlichen Reviews', () => {
    const open = fixtureCoverageEntry();
    const done = fixtureCoverageEntry({
      review: {
        technical: { status: 'approved', reviewer: 'rv', date: '2026-08-05' },
        domain: { status: 'approved', reviewer: 'rv', date: '2026-08-05' },
      },
    });
    expect(countOpenDomainReviews([open, done, open])).toBe(2);
  });

  it('meldet für das echte Manifest keine Verletzung und alle 23 fachlichen Reviews als offen', () => {
    const result = checkCoverage();
    expect(result.violations).toEqual([]);
    expect(result.openDomainReviews).toBe(COVERAGE_MANIFEST.entries.length);
  });
});
