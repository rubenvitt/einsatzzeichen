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
  checkTestEvidence,
  countOpenDomainReviews,
  checkElementEntries,
  checkProfileRegistry,
  checkVersions,
  releaseBlockers,
  blockersOf,
  sortedDomainReviewOpenByArea,
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
    testEvidence: ['body-fingerprint', 'svg-snapshot'],
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

  it('meldet ein kalendarisch ungültiges Datum', () => {
    const bad = fixtureCoverageEntry({
      review: {
        technical: { status: 'approved', reviewer: 'rv', date: '2026-02-30' },
        domain: { status: 'pending' },
      },
    });
    const [violation] = checkReviewAttribution([bad], (e) =>
      entryKey(e.sourceId, e.variant),
    );
    expect(violation?.detail).toContain('ISO-Datum');
  });

  it('meldet eine Abweichung ohne Begründung', () => {
    const bad = fixtureCoverageEntry({
      review: {
        technical: {
          status: 'deviation',
          reviewer: 'rv',
          date: '2026-08-06',
        },
        domain: { status: 'pending' },
      },
    });
    const [violation] = checkReviewAttribution([bad], (e) =>
      entryKey(e.sourceId, e.variant),
    );
    expect(violation?.detail).toContain('Abweichung');
    expect(violation?.detail).toContain('Notiz');
  });

  it('meldet eine fachliche Freigabe ohne Befundnotiz', () => {
    const bad = fixtureCoverageEntry({
      review: {
        technical: { status: 'approved', reviewer: 'rv', date: '2026-08-05' },
        domain: { status: 'approved', reviewer: 'fachreview', date: '2026-08-06' },
      },
    });
    const [violation] = checkReviewAttribution([bad], (e) =>
      entryKey(e.sourceId, e.variant),
    );
    expect(violation?.detail).toContain('Befundnotiz');
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
        domain: {
          status: 'approved',
          reviewer: 'rv',
          date: '2026-08-05',
          note: 'Fachlicher Befund im Test.',
        },
      },
    });
    expect(countOpenDomainReviews([open, done, open])).toBe(2);
  });

  it('zählt ein formal unvollständiges approved weiter als offen', () => {
    const malformed = fixtureCoverageEntry({
      review: {
        technical: { status: 'approved', reviewer: 'rv', date: '2026-08-05' },
        domain: { status: 'approved' },
      },
    });
    expect(countOpenDomainReviews([malformed])).toBe(1);
    expect(blockersOf([malformed], []).domainReviewOpen).toEqual([
      entryKey(malformed.sourceId, malformed.variant),
    ]);
  });

  it('zählt eine zurechenbare Abweichung als abgeschlossen, aber behält sie getrennt als Freigabeblocker', () => {
    const deviation = fixtureCoverageEntry({
      review: {
        technical: { status: 'approved', reviewer: 'rv', date: '2026-08-05' },
        domain: {
          status: 'deviation',
          reviewer: 'fachreview',
          date: '2026-08-06',
          note: 'Bewusste fachliche Abweichung.',
        },
      },
    });

    expect(countOpenDomainReviews([deviation])).toBe(0);
    const blockers = blockersOf([deviation], []);
    expect(blockers.domainReviewOpen).toEqual([]);
    expect(blockers.domainReviewDeviations).toEqual([
      entryKey(deviation.sourceId, deviation.variant),
    ]);
  });

  it('lässt eine formell unvollständige Abweichung offen und aus der Deviation-Liste', () => {
    const malformed = fixtureCoverageEntry({
      review: {
        technical: { status: 'approved', reviewer: 'rv', date: '2026-08-05' },
        domain: { status: 'deviation', reviewer: 'fachreview', date: '2026-08-06' },
      },
    });

    expect(countOpenDomainReviews([malformed])).toBe(1);
    const blockers = blockersOf([malformed], []);
    expect(blockers.domainReviewOpen).toEqual([entryKey(malformed.sourceId, malformed.variant)]);
    expect(blockers.domainReviewDeviations).toEqual([]);
    expect(checkReviewAttribution([malformed], (e) => entryKey(e.sourceId, e.variant))).toHaveLength(1);
  });

  it('trennt zurechenbare Abweichungen auch bei Quellen und Profilen von offenen Reviews', () => {
    const source: SourceRecord = {
      ...SOURCE_REGISTRY['bbk-babz-2025'],
      review: {
        technical: { status: 'approved', reviewer: 'rv', date: '2026-08-05' },
        domain: {
          status: 'deviation',
          reviewer: 'fachreview',
          date: '2026-08-06',
          note: 'Bewusste Quellenabweichung.',
        },
      },
    };
    const profile: ProfileRecord = {
      ...PROFILES.bund,
      review: {
        technical: { status: 'approved', reviewer: 'rv', date: '2026-08-05' },
        domain: {
          status: 'deviation',
          reviewer: 'fachreview',
          date: '2026-08-06',
          note: 'Bewusste Profilabweichung.',
        },
      },
    };

    expect(countOpenDomainReviews([source, profile])).toBe(0);
    const blockers = blockersOf([], [], [source], [profile]);
    expect(blockers.sourceDomainReviewOpen).toEqual([]);
    expect(blockers.sourceDomainReviewDeviations).toEqual([source.id]);
    expect(blockers.profileDomainReviewOpen).toEqual([]);
    expect(blockers.profileDomainReviewDeviations).toEqual([profile.id]);
  });

  it('meldet für den echten Bestand keine Verletzung und alle Reviewträger als offen', () => {
    const result = checkCoverage();
    expect(result.violations).toEqual([]);
    expect(result.openDomainReviews).toBe(
      COVERAGE_MANIFEST.entries.length + Object.keys(SOURCE_REGISTRY).length + Object.keys(PROFILES).length,
    );
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

  it('meldet jede fehlende Pflichtnachweisart einzeln', () => {
    const entry = fixtureCoverageEntry({ testEvidence: [] });
    const violations = checkTestEvidence([entry]);
    expect(violations.map((violation) => violation.check)).toEqual([
      'missing-test-evidence',
      'missing-test-evidence',
    ]);
    expect(violations.map((violation) => violation.detail)).toEqual([
      'Pflichtnachweis "body-fingerprint" fehlt.',
      'Pflichtnachweis "svg-snapshot" fehlt.',
    ]);
  });

  it('lässt einen artfremden Nachweis keinen Pflichtnachweis ersetzen', () => {
    const entry = fixtureCoverageEntry({
      sourceId: 'bbk-babz-2025:2.5',
      coverage: 'element',
      implementation: 'organization.polizei',
      referenceAsset: '2.5_Polizei.svg',
      testEvidence: ['svg-snapshot'],
    });
    expect(checkTestEvidence([entry]).map((violation) => violation.check)).toEqual([
      'unexpected-test-evidence',
      'missing-test-evidence',
    ]);
  });

  it('meldet einen doppelt behaupteten Nachweis', () => {
    const entry = fixtureCoverageEntry({
      testEvidence: ['body-fingerprint', 'body-fingerprint', 'svg-snapshot'],
    });
    expect(checkTestEvidence([entry]).map((violation) => violation.check)).toEqual([
      'duplicate-test-evidence',
    ]);
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
    expect(checkVersions(COVERAGE_MANIFEST.coreVersion, Object.values(PROFILES))).toEqual([]);
  });

  it('meldet eine Kernversion mit falscher Form', () => {
    const [violation] = checkVersions('0.1', Object.values(PROFILES));
    expect(violation?.check).toBe('version-format');
    expect(violation?.key).toBe('coreVersion');
  });

  it('meldet ein Profil, dessen verifiedAgainstCore keine bekannte Kernversion nennt', () => {
    const stale = [{ ...PROFILES.bund, verifiedAgainstCore: '0.0.9' }];
    const [violation] = checkVersions(COVERAGE_MANIFEST.coreVersion, stale);
    expect(violation?.check).toBe('unknown-core-version');
    expect(violation?.detail).toContain('0.0.9');
  });

  it('meldet ein Profil mit unzulässiger Datenversion', () => {
    const broken = [{ ...PROFILES.bund, version: 'v1' }];
    const checks = checkVersions(COVERAGE_MANIFEST.coreVersion, broken).map((v) => v.check);
    expect(checks).toEqual(['version-format']);
  });

  it('meldet ein Profil mit unzulässig geformtem verifiedAgainstCore', () => {
    // Nicht dieselbe Prüfung wie eine unbekannte Kernversion: eine unzulässige Form erreicht den
    // Abgleich gegen die bekannten Kernversionen nie.
    expect(
      checkVersions(
        COVERAGE_MANIFEST.coreVersion,
        [{ ...PROFILES.bund, verifiedAgainstCore: 'v1' }],
      ).map((v) => v.check),
    ).toEqual(['version-format']);
  });
});

describe('Release-Blocker für 1.0', () => {
  it('führt jeden Eintrag ohne fachliches Review als Blocker', () => {
    const blockers = releaseBlockers();
    expect(blockers.domainReviewOpen).toHaveLength(COVERAGE_MANIFEST.entries.length);
  });

  it('führt offene Quellen- und Profilreviews als eigene Blocker', () => {
    const blockers = releaseBlockers();
    expect(blockers.sourceDomainReviewOpen.sort()).toEqual(Object.keys(SOURCE_REGISTRY).sort());
    expect(blockers.profileDomainReviewOpen.sort()).toEqual(Object.keys(PROFILES).sort());
  });

  it('meldet keinen Eintrag ohne seinen arteigenen Pflichtnachweis', () => {
    expect(releaseBlockers().withoutTestEvidence).toEqual([]);
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
    expect(releaseBlockers().domainReviewOpen.length).toBeGreaterThan(0);
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

  it('behandelt eine dokumentierte Abweichung weiterhin als 1.0-Blocker', () => {
    const entry = fixtureCoverageEntry({
      review: {
        technical: { status: 'approved', reviewer: 'rv', date: '2026-08-05' },
        domain: {
          status: 'deviation',
          reviewer: 'fachreview',
          date: '2026-08-06',
          note: 'Bewusste fachliche Abweichung.',
        },
      },
    });
    expect(blockersOf([entry], []).domainReviewDeviations).toEqual([
      entryKey(entry.sourceId, entry.variant),
    ]);
  });

  it('meldet einen Katalogeintrag mit Fingerprint-, aber ohne Snapshot-Nachweis', () => {
    const entry = fixtureCoverageEntry({ testEvidence: ['body-fingerprint'] });
    expect(blockersOf([entry], []).withoutTestEvidence).toEqual([
      entryKey(entry.sourceId, entry.variant),
    ]);
  });

  it('meldet einen Katalogeintrag mit Snapshot-, aber ohne Fingerprint-Nachweis', () => {
    const entry = fixtureCoverageEntry({ testEvidence: ['svg-snapshot'] });
    expect(blockersOf([entry], []).withoutTestEvidence).toEqual([
      entryKey(entry.sourceId, entry.variant),
    ]);
  });

  it('akzeptiert die arteigenen Pflichtnachweise aller drei Elementformen', () => {
    const entries = [
      fixtureCoverageEntry({
        sourceId: 'bbk-babz-2025:2.5',
        coverage: 'element',
        implementation: 'organization.polizei',
        referenceAsset: '2.5_Polizei.svg',
        testEvidence: ['reference-fill'],
      }),
      fixtureCoverageEntry({
        sourceId: 'bbk-babz-2025:5.4.2',
        coverage: 'element',
        implementation: 'strength.staffel',
        referenceAsset: '5.4.2_Staffel.svg',
        testEvidence: ['head-shape-regression'],
      }),
      fixtureCoverageEntry({
        sourceId: 'bbk-babz-2025:4.3.1',
        coverage: 'element',
        implementation: 'capability.fire-fighting',
        referenceAsset: '4.3.1_Brandbekämpfung.svg',
        testEvidence: ['svg-snapshot', 'pictogram-contract'],
      }),
    ];
    expect(blockersOf(entries, []).withoutTestEvidence).toEqual([]);
  });
});

describe('blockersOf — Zählung nach Bereich', () => {
  /** Minimaler Eintrag: nur die Felder, die `blockersOf` liest. */
  function entry(sourceId: string, domainApproved: boolean): CoverageEntry {
    return {
      sourceId,
      variant: 'primary',
      title: sourceId,
      implementation: sourceId,
      referenceAsset: `${sourceId}.svg`,
      coverage: 'element',
      profile: 'bund',
      testEvidence: [],
      review: {
        technical: { status: 'approved', reviewer: 'rv', date: '2026-08-05' },
        domain: domainApproved
          ? {
              status: 'approved',
              reviewer: 'rv',
              date: '2026-08-05',
              note: 'Fachlicher Befund im Test.',
            }
          : { status: 'pending' },
      },
    };
  }

  it('zählt offene fachliche Reviews je Kapitel und Anhang', () => {
    const result = blockersOf(
      [
        entry('bbk-babz-2025:4.3.1', false),
        entry('bbk-babz-2025:4.3.2', false),
        entry('bbk-babz-2025:5.8.1.1', false),
        entry('bbk-babz-2025:C.1.1', true),
      ],
      [],
    );
    expect(result.domainReviewOpenByArea).toEqual({ '4': 2, '5': 1 });
  });

  it('zählt einen Abschnitt ohne Punkt als eigenen Bereich', () => {
    const result = blockersOf([entry('bbk-babz-2025:1', false)], []);
    expect(result.domainReviewOpenByArea).toEqual({ '1': 1 });
  });

  it('ordnet einen sourceId ohne Trenner einem Bereich zu, statt ihn zu verlieren', () => {
    // sectionOf gibt bei fehlendem ':' die ganze Zeichenkette zurück — die Zählung muss auch
    // diesen Randfall abbilden, sonst verschwindet ein Eintrag stillschweigend aus der Statistik.
    const result = blockersOf([entry('4.9.1', false)], []);
    expect(result.domainReviewOpenByArea).toEqual({ '4': 1 });
  });

  it('sortiert absteigend nach Anzahl und bei Gleichstand alphabetisch', () => {
    // `domainReviewOpenByArea` selbst trägt keine Reihenfolge: ECMAScript zählt Schlüssel,
    // die kanonische Ganzzahl-Strings sind ('4', '2', ...), immer aufsteigend numerisch vor
    // allen anderen Schlüsseln auf — unabhängig von der Einfügereihenfolge. Ein Objekt mit den
    // Bereichen '4', '2', 'C' liefert über `Object.keys` daher ['2', '4', 'C'], egal wie die
    // Zählung aufgebaut wurde. Die Sortierung muss deshalb an `sortedDomainReviewOpenByArea`
    // geprüft werden, nicht am `Record`.
    const result = blockersOf(
      [
        entry('bbk-babz-2025:C.1.1', false),
        entry('bbk-babz-2025:4.3.1', false),
        entry('bbk-babz-2025:4.3.2', false),
        entry('bbk-babz-2025:2.1', false),
      ],
      [],
    );
    expect(Object.keys(result.domainReviewOpenByArea).sort()).toEqual(['2', '4', 'C']);
    expect(
      sortedDomainReviewOpenByArea(result.domainReviewOpenByArea).map(([area]) => area),
    ).toEqual(['4', '2', 'C']);
  });

  it('liefert ein leeres Objekt, wenn kein Review offen ist', () => {
    const result = blockersOf([entry('bbk-babz-2025:4.3.1', true)], []);
    expect(result.domainReviewOpenByArea).toEqual({});
  });

  it('lässt die Gesamtzahl und die Bereichssummen übereinstimmen', () => {
    // Am echten Manifest, damit die beiden Zahlen nicht auseinanderlaufen können.
    const blockers = releaseBlockers();
    const sum = Object.values(blockers.domainReviewOpenByArea).reduce((a, b) => a + b, 0);
    expect(sum).toBe(blockers.domainReviewOpen.length);
  });
});
