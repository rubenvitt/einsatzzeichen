import { describe, expect, it } from 'vitest';
import {
  MANIFEST_DOMAIN_REVIEWS,
  manifestDomainReviewFor,
} from './domain-reviews.js';

describe('LFH-481 Fachreview-Ledger', () => {
  const keys = ['I.1.1', 'I.1.2', 'I.1.3', 'I.1.4']
    .map((section) => `bbk-babz-2025:${section}#primary`);

  it('führt genau vier neue fachlich offene Einzelentscheidungen', () => {
    expect(keys.map((key) => [key, manifestDomainReviewFor(key)]))
      .toEqual(keys.map((key) => [key, { status: 'pending' }]));
    expect(Object.keys(MANIFEST_DOMAIN_REVIEWS)).toHaveLength(501);
  });
});
