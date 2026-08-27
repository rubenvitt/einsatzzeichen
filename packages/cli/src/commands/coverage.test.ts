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

    // 358 mit E.2.6: 325 nach LFH-424, plus die beiden Anhängerfahrwerke aus 5.1.2.4 und
    // 5.1.2.5, plus die 31 Zeichen aus E.2. Mit dem am 18. August 2026 nachgezogenen E.2.6 hat
    // jeder Abschnitt des Anhangs E eine Manifestzeile und einen Ledgerplatz. Seit dem Teilslice
    // F-a **369**: elf Zeilen für zehn Abschnitte. F-b ergänzt 14 Darstellungen — F.1.3,
    // F.1.12 bis F.1.22 und die Alternativen von F.1.12/F.1.15 — auf insgesamt 383. F-c ergänzt
    // 14 Darstellungen aus F.2.1 bis F.2.9 einschließlich fünf Alternativen: insgesamt 397. F-d
    // ergänzt F.2.10 bis F.2.17 lückenlos mit acht weiteren Fahrzeugen: insgesamt 405. F-e
    // ergänzt elf Platzzeichen aus F.3.1 bis F.3.11: insgesamt 416. F-f schließt F.3 mit den
    // Acht Zeichen F.3.12 bis F.3.19 ergeben 424. G ergänzt 21, H und I-a je drei,
    // C.1.3 eine und N neun weitere Darstellungen auf insgesamt 461. D.1 ergänzt zehn aus
    // D.1.1 bis D.1.9 einschließlich der Alternative von D.1.9: 471. D.2 ergänzt die sieben
    // Ortsdefinitionen: 478. D.3 ergänzt zwölf neue Rezepte und zwei direkte offene
    // Kappen; D.3.7 behält seinen vorhandenen Schlüssel: 492. D.4 schließt bei 497 Zeilen.
    // I-c, I-d und I-g ergänzen je vier, I-j drei literale Wasserrettungszeilen: 512.
    expect(manifestReviews).toBe(512);
    expect(sourceReviews).toBe(13);
    expect(profileReviews).toBe(1);
    expect(openReviews).toBe(526);
    // **Die Umfangszeile ist wieder kurz.** Der Teilslice E.2 hatte sie auf 47 Einträge gedehnt,
    // weil E.2 mit einem fehlenden Abschnitt nur abschnittsweise behauptbar war. Seit E.2.6
    // gebaut ist, tragen zwei Tests die Lückenlosigkeit — an den Rezepten (`recipes.test.ts`)
    // und an den Manifesteinträgen (`coverage-manifest.test.ts`) —, und erst damit ist das eine
    // `E` eine widerlegbare Aussage statt einer kürzeren. I-c, I-d und I-g bleiben dagegen
    // jeweils auf ihren vier gebauten Einzelabschnitten statt pauschal auf `I.1` oder `I` begrenzt.
    expect(lines).toContain(
      'Umfang:      1, 2, 4, 5.1.1, 5.4, 5.8, C.1.1, C.1.2, C.1.3, D, E, F, G, H, I.1.1, I.1.2, I.1.3, I.1.4, I.1.5, I.1.6, I.1.7, I.1.8, I.1.17, I.1.18, I.1.19, I.1.20, I.3.5, I.3.6, I.3.7, I.4.1, I.4.2, I.4.3, J.1, J.2, J.3, J.4, K, L, M, N',
    );
    // Die Ausnahme ist im Betrieb sichtbar und nicht nur im Gate. Sie steht bewusst **nicht** in
    // der Blockerzeile darunter: ein Blocker ist ein offener Punkt, diese Ausnahme ist ein
    // entschiedener.
    expect(lines).toContain(
      'Kontrastausnahmen: weiss auf orange (E.2.6, entschieden am 2026-08-18 durch Projektinhaber)',
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
