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

  it('erfindet keine Fachfreigabe', () => {
    const manifestReviews = Object.values(MANIFEST_DOMAIN_REVIEWS);
    const sourceReviews = Object.values(SOURCE_DOMAIN_REVIEWS);
    const profileReviews = Object.values(PROFILE_DOMAIN_REVIEWS);
    const reviews = [...manifestReviews, ...sourceReviews, ...profileReviews];
    expect(manifestReviews).toHaveLength(198);
    expect(sourceReviews).toHaveLength(13);
    expect(profileReviews).toHaveLength(1);
    expect(reviews).toHaveLength(212);
    expect(reviews.every((review) => review.status === 'pending')).toBe(true);
  });

  it('wirft für einen nicht inventarisierten Manifestschlüssel', () => {
    expect(() => manifestDomainReviewFor('bbk-babz-2025:9.9#primary')).toThrow(/9\.9/);
  });
});
