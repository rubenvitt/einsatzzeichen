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

    // 357 nach dem Teilslice E.2: 325 nach LFH-424, plus die beiden Anhängerfahrwerke aus
    // 5.1.2.4 und 5.1.2.5, plus die 30 gebauten E.2-Zeichen. E.2.6 fehlt und hat deshalb weder
    // Manifestzeile noch Ledgerplatz.
    expect(manifestReviews).toBe(357);
    expect(sourceReviews).toBe(13);
    expect(profileReviews).toBe(1);
    expect(openReviews).toBe(371);
    // Die Umfangszeile ist mit dem Teilslice E.2 wieder lang geworden, und das ist gewollt: E.1
    // steht seit E-c einzeilig, weil seine 37 Abschnitte vollständig sind, E.2 dagegen
    // abschnittsweise, weil einer der 31 fehlt. Ein `E.2` oder `E` wäre kürzer und behauptete
    // eine Vollständigkeit, die `recipes.test.ts` nicht belegen kann.
    expect(lines).toContain(
      'Umfang:      1, 2, 4, 5.1.1, 5.4, 5.8, C.1.1, C.1.2, D.3.7, E.1, E.2.1, E.2.2, E.2.3, ' +
        'E.2.4, E.2.5, E.2.7, E.2.8, E.2.9, E.2.10, E.2.11, E.2.12, E.2.13, E.2.14, E.2.15, ' +
        'E.2.16, E.2.17, E.2.18, E.2.19, E.2.20, E.2.21, E.2.22, E.2.23, E.2.24, E.2.25, ' +
        'E.2.26, E.2.27, E.2.28, E.2.29, E.2.30, E.2.31, J.1, J.2, J.3, J.4, K, L, M',
    );
    expect(lines).toContain(
      `Offene fachliche Reviews: ${openReviews} ` +
        `(${manifestReviews} Manifestreviews, ${sourceReviews} Quellenreviews, ` +
        `${profileReviews} Profilreview)`,
    );
    // Die Zeile bleibt auch nach E.2 wortgleich, obwohl das Manifest inzwischen fünf
    // technische Abweichungen führt (E.1.17, E.1.19, E.1.24, E.1.31, E.2.26): `ReleaseBlockers` liest
    // ausschließlich `review.domain`, und die Zeile sagt das mit „mit domain: deviation" auch.
    // Sie ist damit korrekt und zugleich die Stelle, an der technische Abweichungen im Betrieb
    // unsichtbar bleiben — auffindbar sind sie nur in der Note ihrer Manifestzeile.
    expect(lines).toContain(
      `1.0-Blocker: ${manifestReviews} Manifestreviews, ${sourceReviews} Quellenreviews und ` +
        `${profileReviews} Profilreview noch ohne abgeschlossenes fachliches Review; ` +
        '0 Manifestabweichungen, 0 Quellenabweichungen und 0 Profilabweichungen mit ' +
        'domain: deviation; 0 ohne Testnachweis, 0 Kapitel im beanspruchten Umfang ohne Eintrag',
    );
    expect(lines.at(-1)).toBe('Coverage-Gate bestanden.');
  });
});
