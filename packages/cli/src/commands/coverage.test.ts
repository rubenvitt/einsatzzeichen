import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MANIFEST_DOMAIN_REVIEWS,
  PROFILE_DOMAIN_REVIEWS,
  SOURCE_DOMAIN_REVIEWS,
} from '@einsatzzeichen/catalog';
import { coverage } from './coverage.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('coverage CLI', () => {
  it('weist alle Reviewträger getrennt aus und meldet null technische Nachweislücken', () => {
    const manifestReviews = Object.keys(MANIFEST_DOMAIN_REVIEWS).length;
    const sourceReviews = Object.keys(SOURCE_DOMAIN_REVIEWS).length;
    const profileReviews = Object.keys(PROFILE_DOMAIN_REVIEWS).length;
    const openReviews = manifestReviews + sourceReviews + profileReviews;
    const lines: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((message?: unknown) => {
      lines.push(String(message));
    });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    coverage();

    expect(manifestReviews).toBe(191);
    expect(sourceReviews).toBe(12);
    expect(profileReviews).toBe(1);
    expect(openReviews).toBe(204);
    expect(lines).toContain('Umfang:      1, 2, 4, 5.4, 5.8, C.1.1, C.1.2, D.3.7');
    expect(lines).toContain(
      `Offene fachliche Reviews: ${openReviews} ` +
        `(${manifestReviews} Manifestreviews, ${sourceReviews} Quellenreviews, ` +
        `${profileReviews} Profilreview)`,
    );
    expect(lines).toContain(
      `1.0-Blocker: ${manifestReviews} Manifestreviews, ${sourceReviews} Quellenreviews und ` +
        `${profileReviews} Profilreview noch ohne abgeschlossenes fachliches Review; ` +
        '0 Manifestabweichungen, 0 Quellenabweichungen und 0 Profilabweichungen mit ' +
        'domain: deviation; 0 ohne Testnachweis, 0 Kapitel im beanspruchten Umfang ohne Eintrag',
    );
    expect(lines.at(-1)).toBe('Coverage-Gate bestanden.');
  });
});
