import { describe, expect, it } from 'vitest';
import { entryKey } from '@einsatzzeichen/schema';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import {
  MANIFEST_DOMAIN_REVIEWS,
  PROFILE_DOMAIN_REVIEWS,
  SOURCE_DOMAIN_REVIEWS,
  manifestDomainReviewFor,
  profileDomainReviewFor,
  sourceDomainReviewFor,
} from './domain-reviews.js';
import { PROFILES } from './profiles.js';
import { SOURCE_REGISTRY } from './sources.js';

describe('Fachreview-Ledger', () => {
  it('ist exakt deckungsgleich mit allen Manifestzeilen', () => {
    const manifestKeys = COVERAGE_MANIFEST.entries
      .map((entry) => entryKey(entry.sourceId, entry.variant))
      .sort();
    expect(Object.keys(MANIFEST_DOMAIN_REVIEWS).sort()).toEqual(manifestKeys);
  });

  it('verdrahtet jede Manifestzeile mit genau ihrem Ledger-Eintrag', () => {
    for (const entry of COVERAGE_MANIFEST.entries) {
      const key = entryKey(entry.sourceId, entry.variant);
      expect(entry.review.domain).toBe(manifestDomainReviewFor(key));
    }
  });

  it('hält alle Ledgerwurzeln und ihre einzelnen Reviewobjekte unveränderlich', () => {
    for (const ledger of [
      MANIFEST_DOMAIN_REVIEWS,
      SOURCE_DOMAIN_REVIEWS,
      PROFILE_DOMAIN_REVIEWS,
    ]) {
      expect(Object.isFrozen(ledger)).toBe(true);
      for (const review of Object.values(ledger)) {
        expect(Object.isFrozen(review)).toBe(true);
      }
    }
  });

  it('weist die Mutation eines Quellenreviews fail-closed ab', () => {
    const review = SOURCE_DOMAIN_REVIEWS['bbk-babz-2025'];
    const mutableReview = review as { status: string };
    const originalStatus = mutableReview.status;
    let mutationError: unknown;

    try {
      mutableReview.status = 'approved';
    } catch (error) {
      mutationError = error;
    } finally {
      if (!Object.isFrozen(review)) mutableReview.status = originalStatus;
    }

    expect(mutationError).toBeInstanceOf(TypeError);
    expect(review.status).toBe('pending');
  });

  it('ist auch für Quellen und Profile exakt deckungsgleich und korrekt verdrahtet', () => {
    expect(Object.keys(SOURCE_DOMAIN_REVIEWS).sort()).toEqual(Object.keys(SOURCE_REGISTRY).sort());
    expect(Object.keys(PROFILE_DOMAIN_REVIEWS).sort()).toEqual(Object.keys(PROFILES).sort());
    for (const source of Object.values(SOURCE_REGISTRY)) {
      expect(source.review.domain).toBe(sourceDomainReviewFor(source.id));
    }
    for (const profile of Object.values(PROFILES)) {
      expect(profile.review.domain).toBe(profileDomainReviewFor(profile.id));
    }
  });

  it('verwendet je Reviewträger ein eigenes Fachreviewobjekt', () => {
    const reviews = [
      ...Object.values(MANIFEST_DOMAIN_REVIEWS),
      ...Object.values(SOURCE_DOMAIN_REVIEWS),
      ...Object.values(PROFILE_DOMAIN_REVIEWS),
    ];
    expect(new Set(reviews).size).toBe(reviews.length);
  });

  it('führt für I-d genau vier weiterhin offene Fachreviews', () => {
    const expectedKeys = [
      'bbk-babz-2025:I.1.5#primary',
      'bbk-babz-2025:I.1.6#primary',
      'bbk-babz-2025:I.1.7#primary',
      'bbk-babz-2025:I.1.8#primary',
    ];
    const keys = Object.keys(MANIFEST_DOMAIN_REVIEWS).filter((key) =>
      /^bbk-babz-2025:I\.1\.[5-8]#primary$/.test(key),
    );
    expect(keys).toEqual(expectedKeys);
    for (const key of keys) {
      expect(manifestDomainReviewFor(key)).toEqual({ status: 'pending' });
    }
  });

  it('führt für I-e genau fünf weiterhin offene Fachreviews', () => {
    const expectedKeys = [
      'bbk-babz-2025:I.1.9#primary',
      'bbk-babz-2025:I.1.9#alternative',
      'bbk-babz-2025:I.1.10#primary',
      'bbk-babz-2025:I.1.11#primary',
      'bbk-babz-2025:I.1.12#primary',
    ];
    const keys = Object.keys(MANIFEST_DOMAIN_REVIEWS).filter((key) =>
      /^bbk-babz-2025:I\.1\.(?:9|1[0-2])#(?:primary|alternative)$/.test(key),
    );
    expect(keys).toEqual(expectedKeys);
    for (const key of keys) {
      expect(manifestDomainReviewFor(key)).toEqual({ status: 'pending' });
    }
  });

  it('führt für I-b genau drei weiterhin offene Fachreviews', () => {
    const expectedKeys = [
      'bbk-babz-2025:I.2.1#primary',
      'bbk-babz-2025:I.2.2#primary',
      'bbk-babz-2025:I.2.3#primary',
    ];
    const keys = Object.keys(MANIFEST_DOMAIN_REVIEWS).filter((key) =>
      /^bbk-babz-2025:I\.2\.[1-3]#primary$/.test(key),
    );
    expect(keys).toEqual(expectedKeys);
    for (const key of keys) {
      expect(manifestDomainReviewFor(key)).toEqual({ status: 'pending' });
    }
  });

  it('führt für I-a genau drei weiterhin offene Fachreviews', () => {
    const expectedKeys = [
      'bbk-babz-2025:I.3.5#primary',
      'bbk-babz-2025:I.3.6#primary',
      'bbk-babz-2025:I.3.7#primary',
    ];
    const keys = Object.keys(MANIFEST_DOMAIN_REVIEWS).filter((key) =>
      /^bbk-babz-2025:I\.3\.[5-7]#primary$/.test(key),
    );
    expect(keys).toEqual(expectedKeys);
    for (const key of keys) {
      expect(manifestDomainReviewFor(key)).toEqual({ status: 'pending' });
    }
  });

  it('führt für I-k exakt drei weiterhin offene Fachreviews', () => {
    const keys = Object.keys(MANIFEST_DOMAIN_REVIEWS).filter((key) =>
      /^bbk-babz-2025:I\.5\.[1-3]#primary$/.test(key),
    );
    expect(keys).toEqual([
      'bbk-babz-2025:I.5.1#primary',
      'bbk-babz-2025:I.5.2#primary',
      'bbk-babz-2025:I.5.3#primary',
    ]);
    for (const key of keys) {
      expect(manifestDomainReviewFor(key)).toEqual({ status: 'pending' });
    }
  });

  it('führt für LFH-485 genau vier weiterhin offene I-g-Fachreviews', () => {
    const keys = Object.keys(MANIFEST_DOMAIN_REVIEWS).filter((key) =>
      /^bbk-babz-2025:I\.1\.(?:1[7-9]|20)#primary$/.test(key),
    );
    expect(keys).toEqual([
      'bbk-babz-2025:I.1.17#primary',
      'bbk-babz-2025:I.1.18#primary',
      'bbk-babz-2025:I.1.19#primary',
      'bbk-babz-2025:I.1.20#primary',
    ]);
    for (const key of keys) {
      expect(manifestDomainReviewFor(key)).toEqual({ status: 'pending' });
    }
  });

  it('führt für I-j genau drei eigene, weiterhin offene Fachreviews', () => {
    const keys = Object.keys(MANIFEST_DOMAIN_REVIEWS).filter((key) =>
      key.startsWith('bbk-babz-2025:I.4.'),
    );
    expect(keys).toEqual([
      'bbk-babz-2025:I.4.1#primary',
      'bbk-babz-2025:I.4.2#primary',
      'bbk-babz-2025:I.4.3#primary',
    ]);
    for (const key of keys) {
      expect(manifestDomainReviewFor(key)).toEqual({ status: 'pending' });
    }
  });

  it('erfindet keine Fachfreigabe', () => {
    const manifestReviews = Object.values(MANIFEST_DOMAIN_REVIEWS);
    const sourceReviews = Object.values(SOURCE_DOMAIN_REVIEWS);
    const profileReviews = Object.values(PROFILE_DOMAIN_REVIEWS);
    const reviews = [...manifestReviews, ...sourceReviews, ...profileReviews];
    // 358 mit E.2.6: 325 nach LFH-424 (sechs Grundzeichen aus Kapitel 1, die achte Organisation
    // und die fünf vermessenen Fahrzeugkategorien aus 5.1.1), plus die beiden Anhängerfahrwerke
    // aus 5.1.2.4 und 5.1.2.5 aus der ersten Bauphase von E.2, plus die 31 Zeichen aus E-d, E-e
    // und E-f. **31 und nicht mehr 30:** E.2.6 ist am 18. August 2026 nachgezogen worden und hat
    // damit Manifestzeile und Ledgerplatz.
    //
    // **369 nach F-a:** elf Zeilen für zehn Abschnitte — F.1.1, F.1.2, F.1.4 und
    // F.1.5 bis F.1.11. Neun statt acht, weil `F.1.11` als erster Abschnitt des Katalogs eine zweite
    // Darstellung führt: `#alternative` bekommt einen eigenen Ledgerplatz, weil das Fachreview
    // über die Darstellung entscheidet und nicht über den Abschnitt. Zehn und nicht elf, weil
    // F.1.3 in F-a vermessen und nicht gebaut war. F-b ergänzt 14 Reviewplätze: F.1.3, F.1.12
    // bis F.1.22 und die beiden Alternativdarstellungen; damit sind es hier 383.
    // F-d ergänzt acht einzelne, weiterhin offene Reviewplätze für F.2.10 bis F.2.17. F-e
    // ergänzt elf für F.3.1 bis F.3.11 und F-f die acht verbleibenden für F.3.12 bis F.3.19.
    // Anhang G ergänzt 21, H, I-a, I-b, I-j und I-k je drei, I-d und I-g je vier, I-e fünf
    // sowie I.5.4 bis I.5.8 fünf, C.1.3 eins und N neun. Anhang D ergänzt weitere 36
    // Darstellungen.
    expect(manifestReviews).toHaveLength(524);
    expect(sourceReviews).toHaveLength(13);
    expect(profileReviews).toHaveLength(1);
    expect(reviews).toHaveLength(538);
    expect(reviews.every((review) => review.status === 'pending')).toBe(true);
  });

  it('laesst den stabilen D.3.7-Schluessel trotz technischer Migration fachlich offen', () => {
    expect(MANIFEST_DOMAIN_REVIEWS['bbk-babz-2025:D.3.7#primary'])
      .toEqual({ status: 'pending' });
  });

  it('hält alle fünfzehn D.3-Darstellungen einzeln fachlich offen', () => {
    const references = Array.from({ length: 15 }, (_, index) => `D.3.${index + 1}`);
    expect(references.map((reference) =>
      MANIFEST_DOMAIN_REVIEWS[`bbk-babz-2025:${reference}#primary` as keyof typeof MANIFEST_DOMAIN_REVIEWS],
    )).toEqual(references.map(() => ({ status: 'pending' })));
  });

  it('hält alle fünf D.4-Funktionsträger einzeln fachlich offen', () => {
    const references = Array.from({ length: 5 }, (_, index) => `D.4.${index + 1}`);
    expect(references.map((reference) =>
      MANIFEST_DOMAIN_REVIEWS[`bbk-babz-2025:${reference}#primary` as keyof typeof MANIFEST_DOMAIN_REVIEWS],
    )).toEqual(references.map(() => ({ status: 'pending' })));
  });

  it('hält alle sieben D.2-Ortsdefinitionen einzeln fachlich offen', () => {
    const references = [
      'D.2.1',
      'D.2.2',
      'D.2.3',
      'D.2.4',
      'D.2.5',
      'D.2.6',
      'D.2.7',
    ] as const;

    expect(references.map((reference) =>
      MANIFEST_DOMAIN_REVIEWS[`bbk-babz-2025:${reference}#primary`],
    )).toEqual(references.map(() => ({ status: 'pending' })));
  });

  it('hält die unsichere HiOrg-Zuordnung beider D.1.9-Darstellungen ausdrücklich offen', () => {
    for (const variant of ['primary', 'alternative'] as const) {
      const review = MANIFEST_DOMAIN_REVIEWS[`bbk-babz-2025:D.1.9#${variant}`];
      expect(review.status).toBe('pending');
      expect(review.note).toContain('hilfsorganisation');
      expect(review.note).toContain('weißen Fläche');
    }
  });

  it('wirft für einen nicht inventarisierten Manifestschlüssel', () => {
    expect(() => manifestDomainReviewFor('bbk-babz-2025:9.9#primary')).toThrow(/9\.9/);
  });
});
