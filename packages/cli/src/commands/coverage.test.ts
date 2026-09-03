import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MANIFEST_DOMAIN_REVIEWS,
  PROFILE_DOMAIN_REVIEWS,
  SOURCE_DOMAIN_REVIEWS,
} from '@einsatzzeichen/catalog';
import { reviewIssues, type Review } from '@einsatzzeichen/schema';
import { coverage, openDomainReviewsLine } from './coverage.js';

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Wie viele Ledgereinträge fachlich **offen** sind — abgeleitet aus dem Ledger selbst, nicht
 * abgeschrieben. Offen ist eine Zeile, die noch nicht entschieden ist **oder** deren Entscheidung
 * nicht zurechenbar ist; das ist dieselbe Regel, nach der `countOpenDomainReviews` im
 * Coverage-Gate zählt, hier über `reviewIssues()` aus `schema` nachvollzogen.
 */
function offeneReviews(ledger: Readonly<Record<string, Review>>): number {
  return Object.values(ledger).filter(
    (review) =>
      review.status === 'pending' ||
      reviewIssues({ technical: { status: 'pending' }, domain: review }).some(
        (issue) => issue.role === 'domain',
      ),
  ).length;
}

/**
 * Zurechenbar dokumentierte Abweichungen — der zweite Freigabeblocker neben den offenen Zeilen.
 * Ebenfalls abgeleitet: eine Abweichung ist ein legitimes Reviewergebnis und darf im Ledger
 * auftauchen, ohne diesen Test rot zu färben.
 */
function abweichendeReviews(ledger: Readonly<Record<string, Review>>): number {
  return Object.values(ledger).filter(
    (review) =>
      review.status === 'deviation' &&
      !reviewIssues({ technical: { status: 'pending' }, domain: review }).some(
        (issue) => issue.role === 'domain',
      ),
  ).length;
}

/** Dieselbe Pluralisierung wie in `coverage.ts` — bewusst hier nachgebildet und nicht importiert. */
function gezaehlt(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

describe('coverage CLI', () => {
  it('weist alle Reviewträger getrennt aus und meldet null technische Nachweislücken', () => {
    // **Träger und Reviewstand sind zwei verschiedene Zahlen.** Die Trägerzahlen bleiben
    // festgenagelt (Strukturaussage, siehe unten); die offenen Reviews werden dagegen aus dem
    // Ledger abgeleitet. Früher waren beide dieselbe Zahl — das setzte voraus, dass nichts
    // freigegeben ist, und die erste ehrliche Fachfreigabe hätte diesen Test rot gefärbt.
    const manifestCarriers = Object.keys(MANIFEST_DOMAIN_REVIEWS).length;
    const sourceCarriers = Object.keys(SOURCE_DOMAIN_REVIEWS).length;
    const profileCarriers = Object.keys(PROFILE_DOMAIN_REVIEWS).length;
    const openManifest = offeneReviews(MANIFEST_DOMAIN_REVIEWS);
    const openSources = offeneReviews(SOURCE_DOMAIN_REVIEWS);
    const openProfiles = offeneReviews(PROFILE_DOMAIN_REVIEWS);
    const openReviews = openManifest + openSources + openProfiles;
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
    // Kappen; D.3.7 behält seinen vorhandenen Schlüssel: 492. D.4 schließt bei 497 Zeilen;
    // I-d und I-g ergänzen je vier, I-b und I-j je drei sowie I.5.4 bis I.5.8 fünf direkte
    // Wasserrettungszeilen: insgesamt 516. LFH-480 ergänzt genau acht zuvor fehlende I.3-Zeilen,
    // LFH-483 fünf I-e-Darstellungen, LFH-481 vier I-c-Darstellungen und LFH-489 drei I-k-Rezepte:
    // insgesamt 536. LFH-487 ergänzt die vier fehlenden I.2.4 bis I.2.7: insgesamt 540;
    // LFH-484 ergänzt die vier I-f-Darstellungen I.1.13 bis I.1.16: insgesamt 544.
    expect(manifestCarriers).toBe(544);
    expect(sourceCarriers).toBe(13);
    expect(profileCarriers).toBe(1);
    // Offen kann nie mehr sein als Träger da sind — die einzige Schranke, die der Reviewstand
    // erlaubt. Die frühere Gleichheit (`openReviews === 558`) war keine.
    expect(openReviews).toBeLessThanOrEqual(manifestCarriers + sourceCarriers + profileCarriers);
    expect(lines).toContain('Kernversion: 0.2.0 (Profil "bund": 0.2.0)');
    // **Die Umfangszeile ist wieder kurz.** Der Teilslice E.2 hatte sie auf 47 Einträge gedehnt,
    // weil E.2 mit einem fehlenden Abschnitt nur abschnittsweise behauptbar war. Seit E.2.6
    // gebaut ist, tragen zwei Tests die Lückenlosigkeit — an den Rezepten (`recipes.test.ts`)
    // und an den Manifesteinträgen (`coverage-manifest.test.ts`) —, und erst damit ist das eine
    // `E` eine widerlegbare Aussage statt einer kürzeren. Seit LFH-480 ist I.3 vollständig und
    // darf als Kapitel beansprucht werden; I.1, I.2, I.4 und I.5 bleiben dagegen auf ihre
    // tatsächlich gebauten Einzelabschnitte begrenzt. I.2.1 bis I.2.7 und I.5.1 bis I.5.8
    // werden deshalb weiter einzeln ausgewiesen.
    expect(lines).toContain(
      'Umfang:      1, 2, 4, 5.1.1, 5.4, 5.8, C.1.1, C.1.2, C.1.3, D, E, F, G, H, I.1.1, I.1.2, I.1.3, I.1.4, I.1.5, I.1.6, I.1.7, I.1.8, I.1.9, I.1.10, I.1.11, I.1.12, I.1.13, I.1.14, I.1.15, I.1.16, I.1.17, I.1.18, I.1.19, I.1.20, I.2.1, I.2.2, I.2.3, I.2.4, I.2.5, I.2.6, I.2.7, I.3, I.4.1, I.4.2, I.4.3, I.5.1, I.5.2, I.5.3, I.5.4, I.5.5, I.5.6, I.5.7, I.5.8, J.1, J.2, J.3, J.4, K, L, M, N',
    );
    // Die Ausnahme ist im Betrieb sichtbar und nicht nur im Gate. Sie steht bewusst **nicht** in
    // der Blockerzeile darunter: ein Blocker ist ein offener Punkt, diese Ausnahme ist ein
    // entschiedener.
    expect(lines).toContain(
      'Kontrastausnahmen: weiss auf orange (E.2.6, entschieden am 2026-08-18 durch Projektinhaber)',
    );
    // **Die Invariante ist „CLI und Ledger nennen dieselbe Zahl".** Die Zahlen kommen aus dem
    // Ledger (`offeneReviews`), die Zeile aus `coverage()`; stimmen sie nicht überein, zählt eine
    // der beiden Seiten falsch. Das ist stärker als die frühere Konstante 558, die nur den
    // damaligen Reviewstand abgeschrieben hatte.
    expect(lines).toContain(
      `Offene fachliche Reviews: ${openReviews} ` +
        `(${gezaehlt(openManifest, 'Manifestreview', 'Manifestreviews')}, ` +
        `${gezaehlt(openSources, 'Quellenreview', 'Quellenreviews')}, ` +
        `${gezaehlt(openProfiles, 'Profilreview', 'Profilreviews')})`,
    );
    // Die Zeile bleibt auch nach E.2 wortgleich, obwohl das Manifest inzwischen fünf
    // technische Abweichungen führt (E.1.17, E.1.19, E.1.24, E.1.31, E.2.26): `ReleaseBlockers` liest
    // ausschließlich `review.domain`, und die Zeile sagt das mit „mit domain: deviation" auch.
    // Sie ist damit korrekt und zugleich die Stelle, an der technische Abweichungen im Betrieb
    // unsichtbar bleiben — auffindbar sind sie nur in der Note ihrer Manifestzeile.
    expect(lines).toContain(
      `1.0-Blocker: ${gezaehlt(openManifest, 'Manifestreview', 'Manifestreviews')}, ` +
        `${gezaehlt(openSources, 'Quellenreview', 'Quellenreviews')} und ` +
        `${gezaehlt(openProfiles, 'Profilreview', 'Profilreviews')} ` +
        'noch ohne abgeschlossenes fachliches Review; ' +
        `${gezaehlt(abweichendeReviews(MANIFEST_DOMAIN_REVIEWS), 'Manifestabweichung', 'Manifestabweichungen')}, ` +
        `${gezaehlt(abweichendeReviews(SOURCE_DOMAIN_REVIEWS), 'Quellenabweichung', 'Quellenabweichungen')} und ` +
        `${gezaehlt(abweichendeReviews(PROFILE_DOMAIN_REVIEWS), 'Profilabweichung', 'Profilabweichungen')} mit ` +
        'domain: deviation; 0 ohne Testnachweis, 0 Kapitel im beanspruchten Umfang ohne Eintrag',
    );
    // Die drei Achsen aus §7 der Slice-1-Spezifikation (LFH-413/LFH-414). Die Zahlen sind an
    // `reference-inventory.test.ts` und `rule-coverage.test.ts` festgenagelt; hier zählt, dass
    // sie im Betrieb sichtbar sind und **vor** der Gate-Zeile stehen.
    expect(lines).toContain(
      'Referenzabdeckung:   550/661 Dateien beansprucht; 111 nicht — 83 außerhalb des Umfangs, ' +
        '9 Beispielanwendungen, 1 Übersichtsblatt, 18 zurückgestellt, 0 nicht zugeordnet',
    );
    expect(lines.some((line) => line.startsWith('  Nicht zugeordnet:'))).toBe(false);
    expect(lines).toContain(
      'Regelabdeckung:      14/16 Achsen vollständig belegt; 72 Validierungsregeln ' +
        '(Testfall je Regel durch core-Test erzwungen)',
    );
    expect(lines).toContain(
      '  Achsen mit Lücke:  administrativeLevel 3/6 (gemeinde, bezirk, bundesland); ' +
        'vehicleCategory 7/8 (amphibienfahrzeug)',
    );
    expect(lines).toContain(
      'Generative Reichweite (Stufe 1): 894 gültige Kompositionen aus kind × Körpervariante × ' +
        'Organisation × Kopfzone × Fahrwerk (225720 enumeriert), davon 67 in der Referenz belegt — ' +
        '827 erzeugbar ohne Referenzbeleg, 8 Rezeptsignaturen außerhalb der Stufe ' +
        '(dokumentiert, kein Gate); nicht enumeriert: 88 Fähigkeiten, ' +
        '132 Körpermarken, 25 Funktionsrollen, freie Bezeichnung',
    );
    expect(lines.at(-1)).toBe('Coverage-Gate bestanden.');
    // Expliziter Timeout: `coverage()` rechnet seit LFH-413 `generativeReach()` mit
    // (963 validateSpec-gültige, 894 komponierte Kombinationen) — allein ~140 ms, unter
    // Vitest-Parallellast bis ~4 s gemessen; das 5-s-Standardlimit wäre ein Lastflake.
  }, 30_000);
});

describe('openDomainReviewsLine', () => {
  // Erfundene Zahlen und nicht der echte Ledger: der Nullfall setzt voraus, dass **jeder**
  // Reviewträger fachlich freigegeben ist, und ist gegen den echten Ledger auf absehbare Zeit
  // nicht auslösbar. Er wird deshalb hier geprüft und nicht im Test über
  // `coverage()` — sonst stünde der Zweig ungeprüft da, bis ihn eines Tages echte Daten zum
  // ersten Mal auslösen.
  const carriers = { manifestEntries: 20, sources: 4, profiles: 1 };
  const open = { manifest: '7 Manifestreviews', sources: '2 Quellenreviews', profiles: '1 Profilreview' };

  it('nennt bei null offenen Punkten den Bestand, gegen den die Null gemessen ist', () => {
    expect(openDomainReviewsLine(0, carriers, open)).toBe(
      'Offene fachliche Reviews: keine — alle 25 Reviewträger sind fachlich freigegeben ' +
        '(20 Manifestzeilen, 4 Quellen, 1 Profil)',
    );
  });

  it('zählt sonst die offenen Punkte je Trägerart auf', () => {
    expect(openDomainReviewsLine(10, carriers, open)).toBe(
      'Offene fachliche Reviews: 10 (7 Manifestreviews, 2 Quellenreviews, 1 Profilreview)',
    );
  });
});
