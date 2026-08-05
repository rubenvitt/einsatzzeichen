import { describe, expect, it } from 'vitest';
import {
  DEFAULT_VIEWBOX_MM,
  entryKey,
  type CatalogEntry,
  type CoverageEntry,
  type ProfileId,
  type ProfileRecord,
  type SourceRecord,
} from '@einsatzzeichen/schema';
import { BASE_SYMBOLS } from './base-symbols.js';
import { SOURCE_REGISTRY } from './sources.js';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import {
  checkCoverage,
  checkBaselinePrefix,
  checkCatalogSourceRefs,
  checkProfileAgreement,
  checkReviewAttribution,
  countOpenDomainReviews,
  checkElementEntries,
  checkProfileRegistry,
  checkVersions,
  releaseBlockers,
  blockersOf,
} from './coverage-gate.js';
import { PROFILES } from './profiles.js';

// Dieselbe Vorlage wie in `coverage-manifest.test.ts`: beide Dateien brauchen einen
// Katalogeintrag mit einstellbarer Zahl von `primary`-Darstellungen, und ein gemeinsames
// Testmodul für eine einzige Vorlage wäre eine Abhängigkeit ohne Gegenwert.
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
    expect(
      checkReviewAttribution([fixtureCoverageEntry()], (e) => entryKey(e.sourceId, e.variant)),
    ).toEqual([]);
  });

  it('meldet ein approved ohne Reviewer unter Nennung der Rolle', () => {
    const bad = fixtureCoverageEntry({
      review: { technical: { status: 'approved' }, domain: { status: 'pending' } },
    });
    const [violation] = checkReviewAttribution([bad], (e) => entryKey(e.sourceId, e.variant));
    expect(violation?.check).toBe('review-attribution');
    expect(violation?.detail).toContain('technical');
  });

  it('meldet eine Quelle mit unzurechenbarem technischem Review', () => {
    const broken: SourceRecord = {
      ...SOURCE_REGISTRY['bbk-babz-2025'],
      review: { technical: { status: 'approved' }, domain: { status: 'pending' } },
    };
    const [violation] = checkReviewAttribution([broken], (s) => `source:${s.id}`);
    expect(violation?.check).toBe('review-attribution');
    expect(violation?.key).toBe('source:bbk-babz-2025');
    expect(violation?.detail).toContain('technical');
  });

  it('meldet ein Profil mit unzurechenbarem technischem Review', () => {
    const broken: ProfileRecord = {
      ...PROFILES.bund,
      review: { technical: { status: 'approved' }, domain: { status: 'pending' } },
    };
    const [violation] = checkReviewAttribution([broken], (p) => `profile:${p.id}`);
    expect(violation?.check).toBe('review-attribution');
    expect(violation?.key).toBe('profile:bund');
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

describe('Gate-Prüfungen zu Elementen und Versionen', () => {
  it('nimmt einen Elementeintrag an, dessen ID auflösbar ist und dessen Datei ihn belegt', () => {
    const entry = fixtureCoverageEntry({
      sourceId: 'bbk-babz-2025:5.4.2',
      coverage: 'element',
      implementation: 'strength.staffel',
      referenceAsset: '5.4.2_Staffel.svg',
    });
    expect(checkElementEntries([entry])).toEqual([]);
  });

  it('meldet einen Elementeintrag mit unbekannter ID', () => {
    const entry = fixtureCoverageEntry({
      coverage: 'element',
      implementation: 'strength.kompanie',
      referenceAsset: '5.4.5_Kompanie.svg',
    });
    const [violation] = checkElementEntries([entry]);
    expect(violation?.check).toBe('unknown-element');
    expect(violation?.detail).toContain('strength.kompanie');
  });

  it('meldet einen Elementeintrag, dessen Datei das Element nicht belegt', () => {
    const entry = fixtureCoverageEntry({
      sourceId: 'bbk-babz-2025:5.4.2',
      coverage: 'element',
      implementation: 'strength.staffel',
      referenceAsset: '5.4.4_Zug.svg',
    });
    expect(checkElementEntries([entry]).map((v) => v.check)).toEqual(['asset-not-in-element']);
  });

  it('nimmt einen Elementeintrag an, dessen Abschnittsnummer die namensgebende Datei benennt', () => {
    const entry = fixtureCoverageEntry({
      sourceId: 'bbk-babz-2025:2.5',
      coverage: 'element',
      implementation: 'organization.polizei',
      referenceAsset: '2.5_Polizei.svg',
    });
    expect(checkElementEntries([entry])).toEqual([]);
  });

  it('meldet einen Elementeintrag, dessen Abschnittsnummer nicht zur namensgebenden Datei passt', () => {
    // Belegdatei und Element passen zusammen, nur die Abschnittsnummer ist frei erfunden — ohne
    // diese Prüfung behauptete das Manifest, Abschnitt 9.9 dokumentiere die Staffel.
    const entry = fixtureCoverageEntry({
      sourceId: 'bbk-babz-2025:9.9',
      coverage: 'element',
      implementation: 'strength.staffel',
      referenceAsset: '5.4.2_Staffel.svg',
    });
    const violations = checkElementEntries([entry]);
    expect(violations.map((v) => v.check)).toEqual(['section-mismatch']);
    expect(violations[0]?.detail).toContain('9.9');
    expect(violations[0]?.detail).toContain('5.4.2_Staffel.svg');
  });

  it('prüft Elemente nur bei coverage element, nicht bei Katalogeinträgen', () => {
    expect(checkElementEntries([fixtureCoverageEntry()])).toEqual([]);
  });

  it('nimmt einen Eintrag mit registriertem Profil an', () => {
    expect(checkProfileRegistry([fixtureCoverageEntry()], Object.values(PROFILES))).toEqual([]);
  });

  it('meldet einen Eintrag mit einem nicht registrierten Profil', () => {
    const entry = fixtureCoverageEntry({ profile: 'laender' as unknown as ProfileId });
    const [violation] = checkProfileRegistry([entry], Object.values(PROFILES));
    expect(violation?.check).toBe('unknown-profile');
    expect(violation?.detail).toContain('laender');
  });

  it('nimmt Versionen an, die der Form major.minor.patch folgen und den Kern nennen', () => {
    expect(checkVersions('0.1.0', Object.values(PROFILES))).toEqual([]);
  });

  it('meldet eine Kernversion mit falscher Form', () => {
    const [violation] = checkVersions('0.1', Object.values(PROFILES));
    expect(violation?.check).toBe('version-format');
    expect(violation?.key).toBe('coreVersion');
  });

  it('meldet ein Profil, dessen verifiedAgainstCore keine bekannte Kernversion nennt', () => {
    const stale = [{ ...PROFILES.bund, verifiedAgainstCore: '0.0.9' }];
    const [violation] = checkVersions('0.1.0', stale);
    expect(violation?.check).toBe('unknown-core-version');
    expect(violation?.detail).toContain('0.0.9');
  });

  it('meldet ein Profil mit unzulässiger Datenversion', () => {
    const broken = [{ ...PROFILES.bund, version: 'v1' }];
    const checks = checkVersions('0.1.0', broken).map((v) => v.check);
    expect(checks).toEqual(['version-format']);
  });

  it('meldet ein Profil mit unzulässig geformtem verifiedAgainstCore', () => {
    // Nicht dieselbe Prüfung wie eine unbekannte Kernversion: eine unzulässige Form erreicht den
    // Abgleich gegen die bekannten Kernversionen nie.
    expect(
      checkVersions('0.1.0', [{ ...PROFILES.bund, verifiedAgainstCore: 'v1' }]).map((v) => v.check),
    ).toEqual(['version-format']);
  });
});

describe('Release-Blocker für 1.0', () => {
  it('führt jeden Eintrag ohne fachliches Review als Blocker', () => {
    const blockers = releaseBlockers();
    expect(blockers.domainReviewPending).toHaveLength(COVERAGE_MANIFEST.entries.length);
  });

  it('führt genau die zwölf Elementeinträge als ohne Testnachweis', () => {
    const blockers = releaseBlockers();
    expect(blockers.withoutTestEvidence).toHaveLength(12);
    for (const key of blockers.withoutTestEvidence) {
      const entry = COVERAGE_MANIFEST.entries.find(
        (e) => entryKey(e.sourceId, e.variant) === key,
      );
      expect(entry?.coverage).toBe('element');
    }
  });

  it('meldet keinen Scope-Eintrag ohne Manifest-Eintrag', () => {
    expect(releaseBlockers().uncoveredScope).toEqual([]);
  });

  it('erkennt Kapitelpräfixe und vollständige Abschnittsnummern gleichermaßen als abgedeckt', () => {
    // Scope mischt ein Kapitelpräfix ('1', gedeckt über den Punkt-Guard durch '1.1') mit einer
    // vollständigen Abschnittsnummer ('C.1.1', gedeckt über den Gleichheitszweig) — bricht die
    // Erkennung in einer der beiden Richtungen, meldet einer der Scope-Einträge fälschlich offen.
    const prefixEntry = fixtureCoverageEntry({ sourceId: 'bbk-babz-2025:1.1' });
    const fullSectionEntry = fixtureCoverageEntry({ sourceId: 'bbk-babz-2025:C.1.1' });
    const blockers = blockersOf([prefixEntry, fullSectionEntry], ['1', 'C.1.1']);
    expect(blockers.uncoveredScope).toEqual([]);
  });

  it('das echte Manifest führt sowohl Kapitelpräfixe als auch vollständige Abschnittsnummern', () => {
    const sections = COVERAGE_MANIFEST.entries.map((e) => e.sourceId.split(':')[1] ?? '');
    expect(sections).toContain('1.1');
    expect(sections).toContain('5.4.2');
    expect(sections).toContain('C.1.1');
  });

  it('ist ein Testbefund, kein CI-Abbruch: das Gate bleibt trotz offener Blocker grün', () => {
    expect(releaseBlockers().domainReviewPending.length).toBeGreaterThan(0);
    expect(checkCoverage().violations).toEqual([]);
  });
});

describe('blockersOf (parametrisierter Kern von releaseBlockers)', () => {
  it('schützt ein Kapitelpräfix davor, von einer längeren Abschnittsnummer verdeckt zu werden', () => {
    // '5.41' beginnt zwar mit '5.4', ist aber nicht '5.4' plus Punkt plus Rest — der Scope-Eintrag
    // '5.4' muss trotz dieses Eintrags als unabgedeckt gelten.
    const entry = fixtureCoverageEntry({ sourceId: 'bbk-babz-2025:5.41' });
    expect(blockersOf([entry], ['5.4']).uncoveredScope).toEqual(['5.4']);
  });

  it('behandelt einen sourceId ohne Präfixtrenner als eigene, vollständige Abschnittsnummer', () => {
    const entry = fixtureCoverageEntry({ sourceId: 'ohne-trenner' });
    expect(blockersOf([entry], ['ohne-trenner']).uncoveredScope).toEqual([]);
  });

  it('meldet einen Eintrag mit Fingerprint-, aber ohne Snapshot-Nachweis', () => {
    const entry = fixtureCoverageEntry({ fingerprintTest: true, snapshotTest: false });
    expect(blockersOf([entry], []).withoutTestEvidence).toEqual([
      entryKey(entry.sourceId, entry.variant),
    ]);
  });

  it('meldet einen Eintrag mit Snapshot-, aber ohne Fingerprint-Nachweis', () => {
    const entry = fixtureCoverageEntry({ fingerprintTest: false, snapshotTest: true });
    expect(blockersOf([entry], []).withoutTestEvidence).toEqual([
      entryKey(entry.sourceId, entry.variant),
    ]);
  });
});
