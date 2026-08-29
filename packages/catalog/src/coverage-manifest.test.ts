import { describe, expect, it } from 'vitest';
import {
  DEFAULT_VIEWBOX_MM,
  entryKey,
  LEADERSHIP_IDS,
  type CatalogEntry,
} from '@einsatzzeichen/schema';
import {
  COVERAGE_MANIFEST,
  technicalReviewForAnhangI,
} from './coverage-manifest.js';
import { checkCoverage, findPrimaryViolations, releaseBlockers } from './coverage-gate.js';
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
  it('exportiert Manifestmetadaten als tief readonly Typvertrag', () => {
    if (false) {
      // @ts-expect-error Das veröffentlichte Manifest ist unveränderlich.
      COVERAGE_MANIFEST.coreVersion = 'manipuliert';
      const entry = COVERAGE_MANIFEST.entries[0];
      // @ts-expect-error Auch eine einzelne Manifestzeile ist unveränderlich.
      entry.title = 'Manipuliert';
      // @ts-expect-error Auch verschachtelte Reviewdaten sind unveränderlich.
      entry.review.technical.status = 'pending';
    }
    expect(true).toBe(true);
  });

  it('friert Manifest, Zeilen und verschachtelte Metadaten tief ein', () => {
    const entry = COVERAGE_MANIFEST.entries[0];
    expect(Object.isFrozen(COVERAGE_MANIFEST)).toBe(true);
    expect(Object.isFrozen(COVERAGE_MANIFEST.scope)).toBe(true);
    expect(Object.isFrozen(COVERAGE_MANIFEST.entries)).toBe(true);
    expect(Object.isFrozen(entry)).toBe(true);
    expect(Object.isFrozen(entry.testEvidence)).toBe(true);
    expect(Object.isFrozen(entry.review)).toBe(true);
    expect(Object.isFrozen(entry.review.technical)).toBe(true);
  });

  it('weist Laufzeitmutationen an Manifestzeilen zurück', () => {
    const entry = COVERAGE_MANIFEST.entries[0];
    const originalTitle = entry.title;
    const titleWasSet = Reflect.set(entry, 'title', 'Manipuliert');
    const observedTitle = entry.title;
    if (titleWasSet) Reflect.set(entry, 'title', originalTitle);

    expect(titleWasSet).toBe(false);
    expect(observedTitle).toBe(originalTitle);
  });

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

  it('enthält exakt 544 Zeilen mit 288 Elementdarstellungen', () => {
    const elementRows = COVERAGE_MANIFEST.entries.filter((entry) => entry.coverage === 'element');
    const pictogramRows = elementRows.filter(
      (entry) =>
        entry.implementation.startsWith('capability.') ||
        entry.implementation.startsWith('state.') ||
        entry.implementation.startsWith('comms.') ||
        entry.implementation.startsWith('damage.') ||
        entry.implementation.startsWith('wildfire.') ||
        entry.implementation.startsWith('leadership.') ||
        entry.implementation.startsWith('water-rescue-personnel.'),
    );
    const counts = COVERAGE_MANIFEST.entries.reduce<Record<string, number>>((acc, e) => {
      acc[e.coverage] = (acc[e.coverage] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({
      // Seit LFH-424 alle vierzehn Grundzeichen aus Kapitel 1 statt acht.
      'catalog-entry': 14,
      // 3 Belegfälle des Kompositionsmotors plus die 68 Zeichen aus Anhang E — 16 aus
      // Teilslice E-a, zwölf aus E-b und neun aus E-c (damit ist E.1 vollständig), 21 aus E-d,
      // fünf aus E-e und fünf aus E-f. **68 und damit vollständig** seit E.2.6 am 18. August 2026
      // nachgezogen wurde; die Lückenlosigkeit hält der Test „führt Anhang E lückenlos" unten
      // fest, und erst er trägt das `E` im `scope`. Dazu elf Zeilen aus F-a und 14 aus F-b:
      // F.1.3 sowie F.1.12 bis F.1.22 einschließlich der Alternativen von F.1.12 und F.1.15.
      // F-a umfasst zehn
      // Abschnitte, denn `F.1.11` führt als erster Abschnitt des Katalogs neben `primary` eine
      // `alternative` — die Zeile zählt einzeln, weil das Manifest Darstellungen zählt und nicht
      // Abschnitte, weil F.1.3 dort noch bewusst offen blieb; F-b baut es mit `foot-band`.
      // F-d ergänzt F.2.10 bis F.2.17 als acht reine Anwendungen des Fahrzeugvertrags.
      // G ergänzt 21 Rezepte, H drei, I-c, I-d, I-f und I-g je vier, I-e fünf, I-b sieben,
      // I.3 elf, I-j drei, I-k drei, C.1.3 eins und N neun.
      // Anhang D ergänzt 26 neue Rezepte; D.3.7 bleibt eine Migration desselben Schlüssels.
      'composition-recipe': 242,
      // 269 Piktogramme plus acht Manifest-Organisationen, vier
      // Stärkegrade und sieben Fahrwerkszonen — fünf Fahrzeugkategorien aus 5.1.1 und die beiden
      // Anhängerfahrwerke aus 5.1.2.4/5.1.2.5, die der Teilslice E.2 vermessen hat.
      // `amphibienfahrzeug` hat weiterhin keinen Eintrag, weil seine Wellenlinie nur als
      // Strichhülle vermessen ist.
      element: 288,
    });
    expect(COVERAGE_MANIFEST.entries).toHaveLength(544);
    expect(elementRows).toHaveLength(288);
    expect(pictogramRows).toHaveLength(269);
    expect(elementRows.filter((entry) => !pictogramRows.includes(entry))).toHaveLength(19);
  });

  it('führt I-d, I-e, I-f, I-g, I-b und I.3.1 bis I.3.11 literal mit getrennten Technikreviews', () => {
    const reviewGroupByKey = new Map<string, string>([
      ...['I.1.5', 'I.1.6', 'I.1.7', 'I.1.8'].map((key) => [key, 'I-d'] as const),
      ...['I.1.9', 'I.1.9#alternative', 'I.1.10', 'I.1.11', 'I.1.12'].map(
        (key) => [key, 'I-e'] as const,
      ),
      ...['I.1.13', 'I.1.14', 'I.1.15', 'I.1.16'].map((key) => [key, 'I-f'] as const),
      ...['I.1.17', 'I.1.18', 'I.1.19', 'I.1.20'].map((key) => [key, 'I-g'] as const),
      ...['I.2.1', 'I.2.2', 'I.2.3'].map((key) => [key, 'I-b-land'] as const),
      ...['I.2.4', 'I.2.5', 'I.2.6', 'I.2.7'].map((key) => [key, 'I-b-trailer'] as const),
      ...Array.from({ length: 11 }, (_, index) => `I.3.${index + 1}`).map(
        (key) => [key, 'I.3'] as const,
      ),
    ]);
    const rows = COVERAGE_MANIFEST.entries.filter((entry) => {
      const key = `${entry.sourceId.slice('bbk-babz-2025:'.length)}${entry.variant === 'alternative' ? '#alternative' : ''}`;
      return reviewGroupByKey.has(key);
    });

    expect(rows).toHaveLength(35);
    expect(rows.map((entry) => `${entry.sourceId.slice('bbk-babz-2025:'.length)}${entry.variant === 'alternative' ? '#alternative' : ''}`).sort(
      (left, right) => left.localeCompare(right, 'de', { numeric: true }),
    )).toEqual([...reviewGroupByKey.keys()].sort(
      (left, right) => left.localeCompare(right, 'de', { numeric: true }),
    ));

    const expectedReviewPhrase = {
      'I-d': 'I.1.5-I.1.8 passed',
      'I-e': 'I.1.9-I.1.12 passed',
      'I-f': 'I.1.13-I.1.16 passed',
      'I-g': 'I.1.17-I.1.20 passed',
      'I-b-land': 'I.2.1-I.2.3 passed',
      'I-b-trailer': 'I.2.4-I.2.7 passed',
      'I.3': 'I.3.1-I.3.11 passed',
    } as const;

    for (const row of rows) {
      const key = `${row.sourceId.slice('bbk-babz-2025:'.length)}${row.variant === 'alternative' ? '#alternative' : ''}`;
      const group = reviewGroupByKey.get(key);
      expect(group).toBeDefined();
      expect(row.coverage).toBe('composition-recipe');
      expect(row.implementation).toBe(`recipe.${key}`);
      expect(row.testEvidence).toEqual(['body-fingerprint', 'svg-snapshot']);
      expect(row.review.technical).toMatchObject({
        status: 'approved',
        reviewer: 'rv',
        date: group === 'I-f' ? '2026-08-28' : '2026-08-27',
      });
      expect(row.review.technical.note).toContain(expectedReviewPhrase[group as keyof typeof expectedReviewPhrase]);
      expect(row.review.domain.status).toBe('pending');
    }

    const technicalReviewAt = (key: string) =>
      rows.find((row) => `${row.sourceId.slice('bbk-babz-2025:'.length)}${row.variant === 'alternative' ? '#alternative' : ''}` === key)
        ?.review.technical;
    expect(technicalReviewAt('I.2.1')).not.toBe(technicalReviewAt('I.2.4'));

    for (const section of [
      'I.1.5', 'I.1.6', 'I.1.7', 'I.1.8',
      'I.1.9', 'I.1.10', 'I.1.11', 'I.1.12',
      'I.1.13', 'I.1.14', 'I.1.15', 'I.1.16',
      'I.1.17', 'I.1.18', 'I.1.19', 'I.1.20',
      'I.2.1', 'I.2.2', 'I.2.3', 'I.2.4', 'I.2.5', 'I.2.6', 'I.2.7',
    ]) {
      expect(COVERAGE_MANIFEST.scope).toContain(section);
    }
    expect(COVERAGE_MANIFEST.scope).toContain('I.3');
    expect(COVERAGE_MANIFEST.scope).not.toContain('I');
    expect(COVERAGE_MANIFEST.scope).not.toContain('I.1');
    expect(COVERAGE_MANIFEST.scope).not.toContain('I.2');
  });

  it('führt I.4.1 bis I.4.3 literal mit eigenem technischem Review und engem Scope', () => {
    const rows = COVERAGE_MANIFEST.entries.filter((entry) =>
      entry.sourceId.startsWith('bbk-babz-2025:I.4.'),
    );
    expect(rows.map((entry) => ({
      section: entry.sourceId.slice('bbk-babz-2025:'.length),
      referenceAsset: entry.referenceAsset,
      evidence: entry.testEvidence,
    }))).toEqual([
      {
        section: 'I.4.1',
        referenceAsset: 'I.4.1_Wasserrettungsstation_ortsgebunden.svg',
        evidence: ['body-fingerprint', 'svg-snapshot'],
      },
      {
        section: 'I.4.2',
        referenceAsset: 'I.4.2_Slip-Stelle.svg',
        evidence: ['body-fingerprint', 'svg-snapshot'],
      },
      {
        section: 'I.4.3',
        referenceAsset: 'I.4.3_Anlegestelle für Boote.svg',
        evidence: ['body-fingerprint', 'svg-snapshot'],
      },
    ]);

    const expectedReview = {
      status: 'approved',
      reviewer: 'rv',
      date: '2026-08-27',
      note:
        'I.4.1-I.4.3 passed independently measured circle and body-mark geometry, fail-closed kind/variant/bounds, literal recipe, direct-snapshot and multi-size gates. I.4.1 reuses circle-12/raised-gable as geometry only; white Hilfsorganisation bodies and all domain classifications remain pending.',
    };
    for (const row of rows) {
      expect(row.coverage).toBe('composition-recipe');
      expect(row.review.technical).toEqual(expectedReview);
      expect(row.review.domain.status).toBe('pending');
    }

    expect(COVERAGE_MANIFEST.scope).toContain('I.4.1');
    expect(COVERAGE_MANIFEST.scope).toContain('I.4.2');
    expect(COVERAGE_MANIFEST.scope).toContain('I.4.3');
    expect(COVERAGE_MANIFEST.scope).not.toContain('I.4');
  });

  it('führt I-k exakt als I.5.1 bis I.5.3 und bewahrt den vollständigen I.5-Scope', () => {
    const rows = COVERAGE_MANIFEST.entries.filter((entry) =>
      /^bbk-babz-2025:I\.5\.[1-3]$/.test(entry.sourceId),
    );
    expect(rows.map((row) => ({
      section: row.sourceId.slice('bbk-babz-2025:'.length),
      implementation: row.implementation,
      coverage: row.coverage,
      testEvidence: row.testEvidence,
      domain: row.review.domain,
    }))).toEqual([
      {
        section: 'I.5.1', implementation: 'recipe.I.5.1', coverage: 'composition-recipe',
        testEvidence: ['body-fingerprint', 'svg-snapshot'], domain: { status: 'pending' },
      },
      {
        section: 'I.5.2', implementation: 'recipe.I.5.2', coverage: 'composition-recipe',
        testEvidence: ['body-fingerprint', 'svg-snapshot'], domain: { status: 'pending' },
      },
      {
        section: 'I.5.3', implementation: 'recipe.I.5.3', coverage: 'composition-recipe',
        testEvidence: ['body-fingerprint', 'svg-snapshot'], domain: { status: 'pending' },
      },
    ]);
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.review.technical).toMatchObject({
        status: 'approved', reviewer: 'rv', date: '2026-08-27',
      });
      expect(row.review.technical.note).toMatch(/measured|gemessen/i);
      expect(row.review.technical.note).toMatch(/diamond|Raute/i);
      expect(row.review.technical.note).toMatch(/wave|Welle/i);
      expect(row.review.technical.note).toMatch(/label|Text/i);
    }
    expect(COVERAGE_MANIFEST.scope).toEqual(expect.arrayContaining(
      Array.from({ length: 8 }, (_, index) => `I.5.${index + 1}`),
    ));
    expect(COVERAGE_MANIFEST.scope).not.toContain('I.5');
  });

  it('führt I.5.4 bis I.5.8 als fünf direkte Wasserrettungs-Piktogramme', () => {
    const rows = COVERAGE_MANIFEST.entries.filter((entry) =>
      entry.implementation.startsWith('water-rescue-personnel.'),
    );
    expect(rows.map((entry) => [entry.sourceId, entry.implementation])).toEqual([
      ['bbk-babz-2025:I.5.4', 'water-rescue-personnel.team-leader'],
      ['bbk-babz-2025:I.5.5', 'water-rescue-personnel.group-leader'],
      ['bbk-babz-2025:I.5.6', 'water-rescue-personnel.platoon-leader'],
      ['bbk-babz-2025:I.5.7', 'water-rescue-personnel.formation-leader'],
      ['bbk-babz-2025:I.5.8', 'water-rescue-personnel.technical-advisor'],
    ]);
    for (const row of rows) {
      expect(row.coverage).toBe('element');
      expect(row.testEvidence).toEqual(['svg-snapshot', 'pictogram-contract']);
      expect(row.review.technical).toMatchObject({
        status: 'approved', reviewer: 'rv', date: '2026-08-27',
      });
      expect(row.review.technical.note).toContain('I.5.4 bis I.5.8');
      expect(row.review.domain).toEqual({ status: 'pending' });
    }
  });

  it('routet technische Anhang-I-Reviews schlüsselgenau und lehnt unbekannte Abschnitte ab', () => {
    const technicalReviewAt = (
      section: string,
      variant: 'primary' | 'alternative' = 'primary',
    ) => COVERAGE_MANIFEST.entries.find(
      (entry) => entry.sourceId === `bbk-babz-2025:${section}` && entry.variant === variant,
    )?.review.technical;

    expect(technicalReviewForAnhangI('I.1.1')).toBe(technicalReviewAt('I.1.1'));
    expect(technicalReviewForAnhangI('I.1.5')).toBe(technicalReviewAt('I.1.5'));
    expect(technicalReviewForAnhangI('I.1.9')).toBe(technicalReviewAt('I.1.9'));
    expect(technicalReviewForAnhangI('I.1.9#alternative')).toBe(
      technicalReviewAt('I.1.9', 'alternative'),
    );
    expect(technicalReviewForAnhangI('I.1.13')).toBe(technicalReviewAt('I.1.13'));
    expect(technicalReviewForAnhangI('I.1.17')).toBe(technicalReviewAt('I.1.17'));
    expect(technicalReviewForAnhangI('I.2.1')).toBe(technicalReviewAt('I.2.1'));
    expect(technicalReviewForAnhangI('I.2.4')).toBe(technicalReviewAt('I.2.4'));
    expect(technicalReviewForAnhangI('I.3.1')).toBe(technicalReviewAt('I.3.1'));
    expect(technicalReviewForAnhangI('I.4.1')).toBe(technicalReviewAt('I.4.1'));
    expect(technicalReviewForAnhangI('I.5.1')).toBe(technicalReviewAt('I.5.1'));
    expect(technicalReviewForAnhangI('I.1.1')).not.toBe(technicalReviewForAnhangI('I.1.5'));
    expect(technicalReviewForAnhangI('I.1.5')).not.toBe(technicalReviewForAnhangI('I.1.9'));
    expect(technicalReviewForAnhangI('I.1.9')).not.toBe(technicalReviewForAnhangI('I.1.13'));
    expect(technicalReviewForAnhangI('I.1.13')).not.toBe(technicalReviewForAnhangI('I.1.17'));
    expect(technicalReviewForAnhangI('I.1.17')).not.toBe(technicalReviewForAnhangI('I.2.1'));
    expect(technicalReviewForAnhangI('I.2.1')).not.toBe(technicalReviewForAnhangI('I.2.4'));
    expect(technicalReviewForAnhangI('I.2.1')).not.toBe(technicalReviewForAnhangI('I.3.1'));
    for (const section of ['I.1.21', 'I.2.8', 'I.3.12', 'I.4.4']) {
      expect(() => technicalReviewForAnhangI(section), section).toThrow(
        new RegExp(`${section.replaceAll('.', '\\.')}.*zugeordnet`),
      );
    }
  });

  it('führt I.1.1 bis I.1.4 einzeln und ohne erfundene Fachfreigabe', () => {
    const expectedSections = new Set(['I.1.1', 'I.1.2', 'I.1.3', 'I.1.4']);
    const rows = COVERAGE_MANIFEST.entries.filter((entry) =>
      expectedSections.has(entry.sourceId.slice('bbk-babz-2025:'.length)),
    );
    expect(rows.map((entry) => ({
      section: entry.sourceId.slice('bbk-babz-2025:'.length),
      implementation: entry.implementation,
      referenceAsset: entry.referenceAsset,
    }))).toEqual([
      {
        section: 'I.1.1', implementation: 'recipe.I.1.1',
        referenceAsset: 'I.1.1_Wasserrettungstrupp.svg',
      },
      {
        section: 'I.1.2', implementation: 'recipe.I.1.2',
        referenceAsset: 'I.1.2_Wasserrettungsgruppe.svg',
      },
      {
        section: 'I.1.3', implementation: 'recipe.I.1.3',
        referenceAsset: 'I.1.3_Wasserrettungszug.svg',
      },
      {
        section: 'I.1.4', implementation: 'recipe.I.1.4',
        referenceAsset: 'I.1.4_Wasserrettungsverband.svg',
      },
    ]);

    const expectedReview = {
      status: 'approved',
      reviewer: 'rv',
      date: '2026-08-27',
      note:
        'I.1.1-I.1.4 passed literal strength and technical-head geometry, the independently ' +
        'measured water-rescue formation mark, recipe, direct-snapshot and multi-size gates. ' +
        'No organization or global Verband strength is inferred; domain classification remains pending.',
    };
    for (const row of rows) {
      expect(row.coverage).toBe('composition-recipe');
      expect(row.testEvidence).toEqual(['body-fingerprint', 'svg-snapshot']);
      expect(row.review.technical).toEqual(expectedReview);
      expect(row.review.domain).toEqual({ status: 'pending' });
    }

    expect(rows).toHaveLength(4);
    for (const section of ['I.1.1', 'I.1.2', 'I.1.3', 'I.1.4']) {
      expect(COVERAGE_MANIFEST.scope).toContain(section);
    }
    expect(COVERAGE_MANIFEST.scope).not.toContain('I');
    expect(COVERAGE_MANIFEST.scope).not.toContain('I.1');
  });

  it('bindet C.1.3 an das aktuelle technische Review und nur an seinen eigenen Scope', () => {
    const entry = COVERAGE_MANIFEST.entries.find(
      (candidate) => candidate.sourceId === 'bbk-babz-2025:C.1.3',
    );
    expect(entry).toMatchObject({
      variant: 'primary',
      implementation: 'recipe.C.1.3',
      referenceAsset: 'C.1.3_Löschzug einer Feuerwehr.svg',
      coverage: 'composition-recipe',
      review: {
        technical: { status: 'approved', reviewer: 'rv', date: '2026-08-26' },
        domain: { status: 'pending' },
      },
    });
    expect(COVERAGE_MANIFEST.scope.filter((section) => section.startsWith('C'))).toEqual([
      'C.1.1',
      'C.1.2',
      'C.1.3',
    ]);
  });

  it('bewahrt das technische F-e-Review für F.3.1 bis F.3.11', () => {
    const entries = COVERAGE_MANIFEST.entries.filter((entry) =>
      /^bbk-babz-2025:F\.3\.(?:[1-9]|10|11)$/.test(entry.sourceId),
    );
    expect(entries.map((entry) => entry.sourceId)).toEqual(
      Array.from({ length: 11 }, (_, index) => `bbk-babz-2025:F.3.${index + 1}`),
    );
    expect(entries.every((entry) => entry.review.technical.status === 'approved')).toBe(true);
    expect(entries.every((entry) => entry.review.technical.note?.includes(
      'Die Quellgeometrie von F.3.5 ist mit J.3.2 identisch; die bestehende ' +
        'Katalogfassung J.3.2 bleibt mit stationBody(17, 11.5) abweichend und ihre Korrektur ' +
        'liegt außerhalb dieses Teilslices.',
    ) === true)).toBe(true);
    expect(entries.every((entry) => entry.review.domain.status === 'pending')).toBe(true);
    expect(COVERAGE_MANIFEST.scope).toContain('F');
  });

  it('führt exakt zehn D.1-Darstellungen', () => {
    const rows = COVERAGE_MANIFEST.entries.filter((entry) =>
      entry.sourceId.startsWith('bbk-babz-2025:D.1.'),
    );
    expect(rows.map((entry) => entryKey(entry.sourceId, entry.variant))).toEqual([
      'bbk-babz-2025:D.1.2#primary',
      'bbk-babz-2025:D.1.3#primary',
      'bbk-babz-2025:D.1.4#primary',
      'bbk-babz-2025:D.1.5#primary',
      'bbk-babz-2025:D.1.6#primary',
      'bbk-babz-2025:D.1.7#primary',
      'bbk-babz-2025:D.1.8#primary',
      'bbk-babz-2025:D.1.9#primary',
      'bbk-babz-2025:D.1.9#alternative',
      'bbk-babz-2025:D.1.1#primary',
    ]);
  });

  it('führt D.2.1 bis D.2.7 direkt mit technischem Nachweis und offenem Fachreview', () => {
    const rows = COVERAGE_MANIFEST.entries.filter((entry) =>
      entry.sourceId.startsWith('bbk-babz-2025:D.2.'),
    );
    expect(rows.map((entry) => [entry.sourceId, entry.implementation])).toEqual([
      ['bbk-babz-2025:D.2.1', 'leadership.staging-area'],
      ['bbk-babz-2025:D.2.2', 'leadership.staging-area-with-reporting-head'],
      ['bbk-babz-2025:D.2.3', 'leadership.reporting-head'],
      ['bbk-babz-2025:D.2.4', 'leadership.guide-post'],
      ['bbk-babz-2025:D.2.5', 'leadership.control-center'],
      ['bbk-babz-2025:D.2.6', 'leadership.helicopter-landing-zone'],
      ['bbk-babz-2025:D.2.7', 'leadership.helicopter-landing-site'],
    ]);
    expect(rows.every((entry) => entry.testEvidence.join(',') ===
      'svg-snapshot,pictogram-contract')).toBe(true);
    expect(rows.every((entry) => entry.review.technical.note?.includes(
      'normalisierten Kreis-, Dach-, Text- und Innengeometrien',
    ) === true)).toBe(true);
    expect(rows.every((entry) => entry.review.domain.status === 'pending')).toBe(true);
  });

  it('führt Anhang E lückenlos und trägt damit das `E` im beanspruchten Umfang', () => {
    // **Der Test, ohne den das `E` im `scope` eine unwiderlegbare Behauptung wäre.**
    // `uncoveredScope` prüft an einem Präfix nur, ob **eine** Zeile mit ihm beginnt; `E` bestünde
    // also schon mit einer einzigen E.1-Zeile. Genau deshalb standen die Abschnitte bis zum
    // 18. August 2026 einzeln. Diese Zeile ersetzt 31 Umfangszeilen durch eine geprüfte Aussage.
    //
    // Abgeleitet aus den **Manifesteinträgen** und nicht aus `RECIPES`, weil der `scope` eine
    // Aussage über das Manifest ist und hier neben der Lückenlosigkeit auch `scope` und
    // `uncoveredScope` geprüft werden — beides gibt es in `RECIPES` nicht.
    //
    // Was diese Zeile ausdrücklich **nicht** ist: eine zweite, unabhängige Quelle. Die E-Zeilen
    // des Manifests entstehen aus `RECIPES`; ein Rezept ohne Manifestzeile ist strukturell
    // unmöglich, und die abgeleitete Abschnittsmenge ist deshalb mengengleich mit der aus
    // `RECIPES`. Der Schwestertest in `recipes.test.ts` ist Redundanz und keine Gegenprobe. Wer
    // eine echte zweite Quelle will, müsste gegen `taktische-zeichen/` zählen.
    const abschnitte = COVERAGE_MANIFEST.entries
      .map((entry) => entry.sourceId.slice(entry.sourceId.indexOf(':') + 1))
      .filter((section) => section.startsWith('E.'));
    const erwartet = [
      ...Array.from({ length: 37 }, (_, index) => `E.1.${index + 1}`),
      ...Array.from({ length: 31 }, (_, index) => `E.2.${index + 1}`),
    ];
    // Numerisch und nicht lexikografisch sortiert — `localeCompare` stellt `E.1.10` vor `E.1.2`
    // und machte jeden Fehlschlag unlesbar.
    const numerisch = (section: string) =>
      section.split('.').slice(1).map(Number).reduce((acc, part) => acc * 1000 + part, 0);
    expect([...abschnitte].sort((a, b) => numerisch(a) - numerisch(b))).toEqual(erwartet);
    expect(abschnitte).toHaveLength(68);
    expect(new Set(abschnitte).size).toBe(68);

    // Und der Umfang führt `E` genau einmal, ohne Rest aus der abschnittsweisen Zeit.
    expect(COVERAGE_MANIFEST.scope.filter((chapter) => chapter.startsWith('E'))).toEqual(['E']);
    expect(releaseBlockers().uncoveredScope).toEqual([]);
  });

  it('trägt für 1.14 die Geometrieregression statt eines Körper-Fingerprints', () => {
    // Sein Kennwertartefakt führt shapes: [] — matchFingerprint bricht ab, bevor es den Körper
    // ansieht. Eine Zeile mit `body-fingerprint` behauptete dort ein Gate, das nicht läuft.
    // 1.14 ist seit dem Teilslice E.2 der **einzige** solche Fall: als einzige Datei des
    // Kapitels neben 1.13 führt sie überhaupt keine Ebene `Flächige_Fülung`, es gibt also keine
    // Körperfläche zu erfassen. Das behebt kein Extraktorausbau.
    const bySection = (section: string) =>
      COVERAGE_MANIFEST.entries.find((entry) => entry.sourceId === `bbk-babz-2025:${section}`);
    expect(bySection('1.14')?.testEvidence).toEqual(['body-geometry-regression', 'svg-snapshot']);

    // Die vier Kurvenkörper 1.3, 1.4, 1.5 und 1.9 sind seit dem Extraktorausbau gegatet: ihre
    // Füllebene liefert `kind: 'bounds'`, matchFingerprint läuft und besteht. 1.13 war es schon
    // vorher — sein Artefakt führt die Strichhülle, verglichen mit `bodyGeometry:
    // 'stroke-outline'`.
    for (const section of ['1.3', '1.4', '1.5', '1.9', '1.13']) {
      expect(bySection(section)?.testEvidence, section).toEqual(['body-fingerprint', 'svg-snapshot']);
    }
  });

  /**
   * Die zwölf Zeichen, deren **Umsetzung** von der Referenzdatei abweicht und die deshalb ein
   * technisches Review mit `status: 'deviation'` tragen: sieben aus Anhang F — F.1.1, F.1.2,
   * F.1.3, F.1.13, F.1.21, F.2.2 sowie F.2.17 als siebte F-Abweichung —, aus E-b E.1.17
   * (mittiges Kürzel der
   * Referenz 2,0009 mm links der Körpermitte) sowie E.1.19 und E.1.24 (drei Marken im Körper, die
   * der Katalog nicht abbildet), aus E-c E.1.31 (zwei senkrechte Balken an der Stelle der
   * Kopfzone, für die es keinen StrengthId gibt), aus E-e E.2.26 (Anker des THW-Laufs 1,0 mm
   * weiter rechts als in der Referenz). Die 28 Füllflächen-, Grundlinien- und Kürzelbefunde der
   * sechs Teilslices sind hier **nicht** aufgeführt: dort weicht die Quelle von sich selbst ab
   * und die Umsetzung folgt der Mehrheit der Quelle, ihr Review bleibt `approved` mit
   * Befundvermerk.
   *
   * **Dass 30 neue Zeilen nur eine einzige Abweichung hinzufügen, ist das Ergebnis der ersten
   * Bauphase dieses Slice** und keine Nachlässigkeit der zweiten: E.2.15 wäre ohne den L-Rahmen
   * als Zusatzprimitiv der zweite Fall nach dem Muster von E.1.19/E.1.24 gewesen.
   */
  // In der Reihenfolge des Manifests und nicht alphabetisch: die Rezeptzeilen entstehen aus
  // `RECIPES`, und dort steht Anhang F vor Anhang E. Der Test unten vergleicht die Liste als
  // Folge, damit eine still verschobene Zeile auffällt.
  const TECHNICAL_DEVIATIONS = [
    'bbk-babz-2025:F.1.1#primary',
    'bbk-babz-2025:F.1.2#primary',
    'bbk-babz-2025:F.1.3#primary',
    'bbk-babz-2025:F.1.13#primary',
    'bbk-babz-2025:F.1.21#primary',
    'bbk-babz-2025:F.2.2#primary',
    'bbk-babz-2025:F.2.17#primary',
    'bbk-babz-2025:E.1.17#primary',
    'bbk-babz-2025:E.1.19#primary',
    'bbk-babz-2025:E.1.24#primary',
    'bbk-babz-2025:E.1.31#primary',
    'bbk-babz-2025:E.2.26#primary',
  ];

  it('trägt für jeden Eintrag eine Referenzdatei und beide Reviewrollen', () => {
    // Die Zusage ist „kein Eintrag ohne zurechenbares technisches Review", nicht „jeder Eintrag
    // approved". Sie wird deshalb nicht auf eine Statusmenge aufgeweicht, sondern nennt die zwölf
    // Abweichungen einzeln: jede andere Zeile muss `approved` sein, und die zwölf genannten
    // müssen zusätzlich eine Notiz führen. Eine unbeabsichtigte dreizehnte `deviation` fällt hier
    // ebenso auf wie eine weggefallene.
    for (const entry of COVERAGE_MANIFEST.entries) {
      expect(entry.referenceAsset).toMatch(/\.svg$/);
      if (TECHNICAL_DEVIATIONS.includes(entryKey(entry.sourceId, entry.variant))) {
        expect(entry.review.technical.status).toBe('deviation');
        expect(entry.review.technical.note?.trim()).not.toBe('');
        expect(entry.review.technical.note).toBeDefined();
      } else {
        expect(entry.review.technical.status).toBe('approved');
      }
      expect(entry.review.technical.reviewer).toBe('rv');
      expect(entry.review.domain.status).toBe('pending');
    }
  });

  it('führt genau zwölf technische Abweichungen: sieben aus F, drei aus E-b und je eine aus E-c/E-e', () => {
    // Gegenrichtung des Tests oben: dort wird für bekannte Schlüssel `deviation` verlangt, hier,
    // dass es keine weiteren gibt. Ohne diese Hälfte bliebe eine still hinzugekommene Abweichung
    // an einer anderen Zeile unbemerkt, weil der `else`-Zweig sie nie zu sehen bekäme.
    //
    // F-a führt F.1.1 (Kopfbalken) und F.1.2 (Symmetrieabweichung). F-b ergänzt F.1.3, F.1.13
    // und F.1.21: jeweils unbegriffene Kopfbalken; die zentralen Innenformen von F.1.13/F.1.21
    // sind dagegen als rein geometrische TechnicalBodyMarkIds gebaut.
    const deviations = COVERAGE_MANIFEST.entries
      .filter((entry) => entry.review.technical.status === 'deviation')
      .map((entry) => entryKey(entry.sourceId, entry.variant));
    expect(deviations).toEqual(TECHNICAL_DEVIATIONS);
  });

  it('trägt für alle 14 F-b-Darstellungen das eigene Review vom 25. August', () => {
    const rows = COVERAGE_MANIFEST.entries.filter((entry) =>
      entry.sourceId === 'bbk-babz-2025:F.1.3' ||
      /^bbk-babz-2025:F\.1\.(1[2-9]|2[0-2])$/.test(entry.sourceId),
    );
    expect(rows).toHaveLength(14);
    for (const row of rows) {
      expect(row.review.technical.date).toBe('2026-08-25');
      expect(row.review.technical.note).toContain('finale Task-6-Kontaktbogen');
    }
  });

  it('trägt für alle 14 F-c-Darstellungen das eigene Review vom 25. August', () => {
    const rows = COVERAGE_MANIFEST.entries.filter((entry) =>
      /^bbk-babz-2025:F\.2\.[1-9]$/.test(entry.sourceId),
    );
    expect(rows).toHaveLength(14);
    for (const row of rows) {
      expect(row.review.technical.date).toBe('2026-08-25');
      expect(row.review.technical.note).toContain('finale Task-6-Kontaktbogen');
      expect(row.review.domain.status).toBe('pending');
    }
  });

  it('trägt für alle acht F-d-Darstellungen das eigene Review vom 26. August', () => {
    const rows = COVERAGE_MANIFEST.entries.filter((entry) =>
      /^bbk-babz-2025:F\.2\.(1[0-7])$/.test(entry.sourceId),
    );
    expect(rows).toHaveLength(8);
    for (const row of rows) {
      expect(row.review.technical.date).toBe('2026-08-26');
      expect(row.review.technical.note).toContain('finale Task-6-Kontaktbogen');
      expect(row.review.domain.status).toBe('pending');
    }
  });

  it('trägt für alle acht F-f-Darstellungen ein technisches Review vom 26. August', () => {
    const rows = COVERAGE_MANIFEST.entries.filter((entry) =>
      /^bbk-babz-2025:F\.3\.(1[2-9])$/.test(entry.sourceId),
    );
    expect(rows).toHaveLength(8);
    for (const row of rows) {
      expect(row.review.technical.status).toBe('approved');
      expect(row.review.technical.date).toBe('2026-08-26');
      expect(row.review.technical.note).toContain('finale Task-6-Kontaktbogen');
      expect(row.review.domain.status).toBe('pending');
    }
  });

  it('beansprucht F erst mit exakt 58 Source-IDs, acht Altkeys und 66 Recipekeys', () => {
    const rows = COVERAGE_MANIFEST.entries.filter(
      (entry) => entry.coverage === 'composition-recipe' && entry.sourceId.startsWith('bbk-babz-2025:F.'),
    );
    const sourceIds = rows.map((entry) => entry.sourceId.slice('bbk-babz-2025:'.length));
    const recipeKeys = rows.map((entry) => entry.implementation.slice('recipe.'.length));
    const expectedSourceIds = [
      ...Array.from({ length: 22 }, (_, index) => `F.1.${index + 1}`),
      ...Array.from({ length: 17 }, (_, index) => `F.2.${index + 1}`),
      ...Array.from({ length: 19 }, (_, index) => `F.3.${index + 1}`),
    ];
    const expectedAlternativeKeys = [
      'F.1.11#alternative', 'F.1.12#alternative', 'F.1.15#alternative',
      'F.2.1#alternative', 'F.2.2#alternative', 'F.2.3#alternative',
      'F.2.4#alternative', 'F.2.5#alternative',
    ];
    expect([...new Set(sourceIds)].sort()).toEqual([...expectedSourceIds].sort());
    expect(new Set(sourceIds).size).toBe(58);
    expect(recipeKeys.filter((key) => key.includes('#')).sort()).toEqual(
      [...expectedAlternativeKeys].sort(),
    );
    expect(new Set(recipeKeys).size).toBe(66);
    expect(recipeKeys).toHaveLength(66);
    expect(sourceIds.some((section) => /^F\.3\.(?:2[0-9]|[3-9][0-9])$/.test(section))).toBe(false);
    expect(COVERAGE_MANIFEST.scope.filter((chapter) => chapter === 'F')).toEqual(['F']);
    expect(releaseBlockers().uncoveredScope).toEqual([]);
  });

  it('beansprucht G erst mit exakt allen 21 primary-Referenzen und pending Fachreviews', () => {
    const rows = COVERAGE_MANIFEST.entries.filter(
      (entry) => entry.coverage === 'composition-recipe' && entry.sourceId.startsWith('bbk-babz-2025:G.'),
    );
    const expectedIds = [
      'G.1',
      ...Array.from({ length: 5 }, (_, index) => `G.1.${index + 1}`),
      'G.2',
      ...Array.from({ length: 3 }, (_, index) => `G.2.${index + 1}`),
      'G.3',
      ...Array.from({ length: 5 }, (_, index) => `G.3.${index + 1}`),
      ...Array.from({ length: 5 }, (_, index) => `G.${index + 4}`),
    ];
    expect(rows.map((entry) => entry.sourceId.slice('bbk-babz-2025:'.length))).toEqual(expectedIds);
    expect(rows).toHaveLength(21);
    expect(rows.every((entry) => entry.variant === 'primary')).toBe(true);
    expect(rows.every((entry) => entry.review.domain.status === 'pending')).toBe(true);
    expect(rows.every((entry) => entry.review.technical.status === 'approved')).toBe(true);
    expect(rows.every((entry) => entry.review.technical.note?.includes(
      '21-Karten-Referenzvergleich wurde in Originalauflösung gesichtet',
    ) === true)).toBe(true);
    expect(rows.every((entry) => entry.review.technical.note?.includes(
      'G.3.2 ist dokumentiert',
    ) === true)).toBe(true);
    expect(COVERAGE_MANIFEST.scope.filter((chapter) => chapter === 'G')).toEqual(['G']);
    expect(releaseBlockers().uncoveredScope).toEqual([]);
  });

  it('trennt F.2.17s Quellenbefund y 6,096 von der bewussten gemeinsamen Fahrzeughülle', () => {
    const row = COVERAGE_MANIFEST.entries.find(
      (entry) => entry.sourceId === 'bbk-babz-2025:F.2.17',
    );
    expect(row).toBeDefined();
    expect(row?.review.technical.status).toBe('deviation');
    expect(row?.review.technical.note).toMatch(/Befund an der Referenzdatei:.*6[,.]096/);
    expect(row?.review.technical.note).toMatch(
      /Abweichung der Umsetzung:.*gemeinsame.*Fahrzeughülle.*keine.*eigene.*Variante/i,
    );
  });

  it('meldet keine fehlenden, doppelten oder primary-verletzenden Einträge', () => {
    const { missing, duplicates, invalidPrimary, violations } = checkCoverage();
    expect({ missing, duplicates, invalidPrimary, violations }).toEqual({
      missing: [],
      duplicates: [],
      invalidPrimary: [],
      violations: [],
    });
  });

  it('hat keine Abweichungen, Evidenzlücken oder Scope-Lücken', () => {
    const blockers = releaseBlockers();
    expect(blockers.domainReviewDeviations).toEqual([]);
    expect(blockers.sourceDomainReviewDeviations).toEqual([]);
    expect(blockers.profileDomainReviewDeviations).toEqual([]);
    expect(blockers.withoutTestEvidence).toEqual([]);
    expect(blockers.uncoveredScope).toEqual([]);
  });

  it('nennt die BABZ-Empfehlungen als Baseline', () => {
    // `CoverageManifest.baseline` ist auf `SourceId` getippt, damit nur eine registrierte Quelle
    // dort stehen kann — welche, sagt der Typ nicht. `checkBaselinePrefix` prüft die Einträge
    // gegen genau diesen Wert und wäre allein selbstbezüglich: Baseline und Präfixe gemeinsam
    // umgestellt bliebe das Gate grün. Dieser Test hält den Wert fest.
    expect(COVERAGE_MANIFEST.baseline).toBe('bbk-babz-2025');
  });

  it('haelt D.3.7 unter stabilem Manifestkey mit eigenem Funktionsreview', () => {
    const entry = COVERAGE_MANIFEST.entries.find(
      (candidate) => candidate.sourceId === 'bbk-babz-2025:D.3.7',
    );
    expect(entry).toMatchObject({
      variant: 'primary', implementation: 'recipe.D.3.7', coverage: 'composition-recipe',
    });
    expect(entry?.review.technical.note).toContain('gemessenen Funktionsvertrag');
    expect(entry?.review.technical.note).toContain('rechte geschlossene Raute');
  });

  it('führt D.3.1 bis D.3.15 vollständig', () => {
    const entries = COVERAGE_MANIFEST.entries.filter((entry) =>
      /^bbk-babz-2025:D\.3\.(?:[1-9]|1[0-5])$/.test(entry.sourceId),
    );
    expect(entries.map((entry) => entry.sourceId)).toEqual(
      Array.from({ length: 15 }, (_, index) => `bbk-babz-2025:D.3.${index + 1}`),
    );
    expect(entries.every((entry) => entry.review.technical.status === 'approved')).toBe(true);
    expect(entries.every((entry) => entry.review.domain.status === 'pending')).toBe(true);
  });

  it('beweist exakt 37 Anhang-D-Darstellungen, 36 neue Keys und den vollständigen D-Scope', () => {
    const expectedKeys = [
      'D.1.1#primary',
      'D.1.2#primary',
      'D.1.3#primary',
      'D.1.4#primary',
      'D.1.5#primary',
      'D.1.6#primary',
      'D.1.7#primary',
      'D.1.8#primary',
      'D.1.9#primary',
      'D.1.9#alternative',
      ...Array.from({ length: 7 }, (_, index) => `D.2.${index + 1}#primary`),
      ...Array.from({ length: 15 }, (_, index) => `D.3.${index + 1}#primary`),
      ...Array.from({ length: 5 }, (_, index) => `D.4.${index + 1}#primary`),
    ];
    const actualKeys = COVERAGE_MANIFEST.entries
      .filter((entry) => entry.sourceId.startsWith('bbk-babz-2025:D.'))
      .map((entry) => `${entry.sourceId.slice('bbk-babz-2025:'.length)}#${entry.variant}`);

    expect(actualKeys).toHaveLength(37);
    expect(new Set(actualKeys).size).toBe(37);
    expect(new Set(actualKeys)).toEqual(new Set(expectedKeys));
    expect(actualKeys.filter((key) => key === 'D.3.7#primary')).toHaveLength(1);
    expect(actualKeys.filter((key) => key !== 'D.3.7#primary')).toHaveLength(36);

    const leadershipDefinitions = ALL_PICTOGRAMS
      .filter((definition) => definition.id.startsWith('leadership.'))
      .map((definition) => [definition.section, definition.id]);
    expect(leadershipDefinitions).toEqual([
      ['D.1.1', 'leadership.command-post-in-operation'],
      ['D.2.1', 'leadership.staging-area'],
      ['D.2.2', 'leadership.staging-area-with-reporting-head'],
      ['D.2.3', 'leadership.reporting-head'],
      ['D.2.4', 'leadership.guide-post'],
      ['D.2.5', 'leadership.control-center'],
      ['D.2.6', 'leadership.helicopter-landing-zone'],
      ['D.2.7', 'leadership.helicopter-landing-site'],
      ['D.3.14', 'leadership.technical-advisor-thw'],
      ['D.3.15', 'leadership.red-cross-commissioner'],
    ]);
    expect(leadershipDefinitions.map(([, id]) => id.slice('leadership.'.length)))
      .toEqual([...LEADERSHIP_IDS]);

    expect(COVERAGE_MANIFEST.scope.filter((chapter) => chapter === 'D')).toHaveLength(1);
    expect(COVERAGE_MANIFEST.scope).not.toContain('D.3.7');
    expect(COVERAGE_MANIFEST.scope.filter((chapter) => chapter.startsWith('D'))).toEqual(['D']);
    expect(releaseBlockers().uncoveredScope).toEqual([]);
  });

  it('beansprucht nur den Umfang dieses Slice', () => {
    expect(COVERAGE_MANIFEST.scope).toEqual([
      '1',
      '2',
      '4',
      // `5.1.1` und nicht `5.1`: von Kapitel 5.1 sind allein die Fahrzeugkategorien aus 5.1.1
      // umgesetzt, und auch dort nicht alle — 5.1.1.4 (Amphibienfahrzeug), 5.1.1.7 bis 5.1.1.9
      // fehlen. `5.1` bestünde `uncoveredScope` trotzdem, weil jede 5.1.1.x-Zeile mit `5.1.`
      // beginnt.
      '5.1.1',
      '5.4',
      '5.8',
      'C.1.1',
      'C.1.2',
      'C.1.3',
      'D',
      // Anhang E seit dem 18. August 2026 als **ein** `E` statt `E.1` plus 30 E.2-Einzelzeilen.
      // Die Zusammenziehung hängt nicht daran, dass sie kürzer ist, sondern daran, dass sie
      // widerlegbar wurde: `uncoveredScope` prüft an einem Präfix nur, ob **eine** Zeile mit ihm
      // beginnt, und `E` bestünde deshalb schon mit einer einzigen E.1-Zeile. Getragen wird die
      // Aussage vom Test „führt Anhang E lückenlos" weiter oben, der die 68 Abschnitte aus den
      // Manifesteinträgen ableitet. Bis E.2.6 fehlte, ließ sich dieser Test nicht schreiben.
      'E',
      'F',
      'G',
      'H',
      'I.1.1',
      'I.1.2',
      'I.1.3',
      'I.1.4',
      'I.1.5',
      'I.1.6',
      'I.1.7',
      'I.1.8',
      'I.1.9',
      'I.1.10',
      'I.1.11',
      'I.1.12',
      'I.1.13',
      'I.1.14',
      'I.1.15',
      'I.1.16',
      'I.1.17',
      'I.1.18',
      'I.1.19',
      'I.1.20',
      'I.2.1',
      'I.2.2',
      'I.2.3',
      'I.2.4',
      'I.2.5',
      'I.2.6',
      'I.2.7',
      'I.3',
      'I.4.1',
      'I.4.2',
      'I.4.3',
      'I.5.1',
      'I.5.2',
      'I.5.3',
      'I.5.4',
      'I.5.5',
      'I.5.6',
      'I.5.7',
      'I.5.8',
      'J.1',
      'J.2',
      'J.3',
      'J.4',
      'K',
      'L',
      'M',
      'N',
    ]);
  });

  it('führt Anhang N mit neun primary-Zeilen und eigenem technischem Review', () => {
    const rows = COVERAGE_MANIFEST.entries.filter(
      (entry) => entry.coverage === 'composition-recipe' && entry.sourceId.startsWith('bbk-babz-2025:N.'),
    );
    expect(rows.map((entry) => entry.sourceId)).toEqual([
      'bbk-babz-2025:N.1.1', 'bbk-babz-2025:N.1.2', 'bbk-babz-2025:N.1.3',
      'bbk-babz-2025:N.1.4', 'bbk-babz-2025:N.1.5', 'bbk-babz-2025:N.1.6',
      'bbk-babz-2025:N.2.1', 'bbk-babz-2025:N.2.2', 'bbk-babz-2025:N.2.3',
    ]);
    expect(rows.every((entry) => entry.variant === 'primary')).toBe(true);
    expect(rows.every((entry) => entry.testEvidence.includes('body-fingerprint'))).toBe(true);
    expect(rows.every((entry) => entry.review.technical.status === 'approved')).toBe(true);
    expect(rows.every((entry) => entry.review.technical.date === '2026-08-26')).toBe(true);
    expect(rows.every((entry) => entry.review.technical.note?.includes('kommunaler Bauhof') === true)).toBe(true);
    expect(rows.every((entry) => entry.review.technical.note?.includes('Beauftragter Dritter') === true)).toBe(true);
    expect(rows.every((entry) => entry.review.domain.status === 'pending')).toBe(true);
  });

  it('führt F.1 vollständig innerhalb des nun mengenexakt belegten F-Scope', () => {
    const sections = COVERAGE_MANIFEST.entries
      .filter((entry) => entry.sourceId.startsWith('bbk-babz-2025:F.1.'))
      .map((entry) => entry.sourceId.slice('bbk-babz-2025:'.length).replace(/#.*$/, ''));
    expect(new Set(sections)).toEqual(new Set(Array.from({ length: 22 }, (_, index) => `F.1.${index + 1}`)));
    expect(COVERAGE_MANIFEST.scope).toContain('F');
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
    const definitionKeys = new Set(ALL_PICTOGRAMS.map(pictogramVariantKey));
    const rows = COVERAGE_MANIFEST.entries
      .filter((entry) => definitionKeys.has(entryKey(entry.implementation, entry.variant)))
      .map((entry) => entryKey(entry.implementation, entry.variant))
      .sort();
    expect(rows).toHaveLength(269);
    expect(rows).toEqual([...definitionKeys].sort());
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

  it('führt das vollständige Kapitel 4 im beanspruchten Umfang und 4.3.2 als Eintrag', () => {
    // Der Scope wächst nie vorauseilend: ein Kapitel im Scope ohne Eintrag ist ein
    // Release-Blocker, und die Erweiterung vor dem Inhalt erzeugt genau die Falschaussage,
    // die das Manifest verhindern soll.
    expect(COVERAGE_MANIFEST.scope).toContain('4');
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

  it('trennt den freigegebenen D.1-Review identisch vom freigegebenen State-Technikreview', () => {
    const capabilityRows = COVERAGE_MANIFEST.entries.filter((entry) =>
      entry.implementation.startsWith('capability.'),
    );
    const stateRows = COVERAGE_MANIFEST.entries.filter((entry) =>
      entry.implementation.startsWith('state.'),
    );
    const capabilityReview = capabilityRows[0]!.review.technical;
    const stateReview = stateRows[0]!.review.technical;

    expect(capabilityRows).toHaveLength(92);
    expect(stateRows).toHaveLength(67);
    expect(capabilityRows.every((entry) => entry.review.technical === capabilityReview)).toBe(true);
    expect(capabilityReview).toMatchObject({
      status: 'approved',
      date: '2026-08-06',
    });
    expect(stateRows.every((entry) => entry.review.technical === stateReview)).toBe(true);
    expect(stateReview).toEqual({
      status: 'approved',
      reviewer: 'rv',
      date: '2026-08-07',
      note:
        'Fingerprint-Gate für Piktogramme nicht anwendbar. Für Kapitel 5.8 bestehen Snapshot, ' +
        'Kommando, Box und Standalone-Clipping gegen die 32×32-mm-ViewBox sowie die globalen ' +
        'Mehrgrößen-, viewBox-, Metadaten- und expliziten Kontrast-Gates; die 67/67-Sichtprüfung ' +
        'ist in docs/reviews/2026-08-07-d2-visual-qa.md dokumentiert.',
    });
    expect(stateReview).not.toBe(capabilityReview);
  });
});
