import { describe, expect, it } from 'vitest';
import { entryKey, reviewIssues, type Review } from '@einsatzzeichen/schema';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import { DOMAIN_REVIEWERS, isRegisteredReviewer } from './domain-reviewers.js';
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

/**
 * Die Invariante dieser Datei hat sich mit dem Fachreview-Werkzeug (LFH, Design §7) geändert:
 * nicht mehr „keine Freigabe existiert", sondern **„keine Freigabe ohne benannten, registrierten
 * Prüfer, gültiges ISO-Datum und Befund"**. Der alte Zustand war nur solange haltbar, wie nichts
 * freigegeben wurde — die erste echte Freigabe hätte rund fünfzehn Blöcke rot gemacht und das
 * Werkzeug damit unbenutzbar.
 *
 * Geprüft wird mit `reviewIssues()` aus `schema`, also mit genau der Funktion, die auch das
 * Coverage-Gate benutzt; ein zweites Regelwerk könnte auseinanderlaufen. Ergänzt wird sie um das
 * Reviewer-Register: `reviewIssues()` sieht, *dass* ein Name dasteht, aber nicht, ob dahinter
 * eine Person mit einsatztaktischer Fachkunde steht.
 */
function freigabeBefunde(key: string, review: Review): string[] {
  if (review.status === 'pending') return [];
  const befunde = reviewIssues({ technical: { status: 'pending' }, domain: review }).map(
    (issue) => `${key}: ${issue.code}`,
  );
  if (review.reviewer !== undefined && !isRegisteredReviewer(review.reviewer)) {
    befunde.push(`${key}: unbekannter-pruefer`);
  }
  return befunde;
}

/**
 * Ein Name, der im Reviewer-Register garantiert nicht vorkommt: er nennt kein einsatztaktisches
 * Qualifikationsmerkmal, sondern sagt aus, dass er erfunden ist. Als Konstante und nicht als
 * Literal an drei Stellen, damit die Zusicherung „nicht registriert" genau den Namen prüft, der
 * anschließend in den Fixtures steht.
 */
const ERFUNDENER_PRUEFER = 'Dr. Erfunden von Niemalsland (frei erfunden, kein echter Prüfer)';

/**
 * Was an den blockweisen Prüfungen gegatet bleibt: jeder Träger führt ein **eigenes**
 * Reviewobjekt. Ein gemeinsam referenziertes Sammelreview würde beim ersten Freigeben still
 * weitere Zeilen mitfreigeben — genau der Fehler, gegen den das Ledger gebaut ist. Der
 * Statuswert wird hier bewusst nicht mehr festgenagelt.
 */
function erwarteEigeneReviewobjekte(keys: readonly string[]): void {
  const reviews = keys.map((key) => manifestDomainReviewFor(key));
  expect(new Set(reviews).size).toBe(keys.length);
}

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
    // Bewusst ein **anderer** Wert als der aktuelle: der Schreibversuch muss eine echte Änderung
    // sein, sonst prüfte der Test nur, dass sich nichts ändert, weil nichts anders wäre.
    const fremderStatus = originalStatus === 'approved' ? 'deviation' : 'approved';
    let mutationError: unknown;

    try {
      mutableReview.status = fremderStatus;
    } catch (error) {
      mutationError = error;
    } finally {
      if (!Object.isFrozen(review)) mutableReview.status = originalStatus;
    }

    expect(mutationError).toBeInstanceOf(TypeError);
    // Invariante statt Reviewstand: der abgewiesene Schreibversuch hat den Status **nicht**
    // verändert. Vorher stand hier `toBe('pending')` — das prüfte zugleich, dass die Quelle
    // heute offen ist, und wäre bei der ersten Quellenfreigabe rot geworden.
    expect(review.status).toBe(originalStatus);
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

  it('führt für I-d genau vier eigene Fachreview-Ledgerplätze', () => {
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
    erwarteEigeneReviewobjekte(keys);
  });

  it('führt für I-e genau fünf eigene Fachreview-Ledgerplätze', () => {
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
    erwarteEigeneReviewobjekte(keys);
  });

  it('führt für I-b genau sieben eigene Fachreview-Ledgerplätze', () => {
    const expectedKeys = [
      'bbk-babz-2025:I.2.1#primary',
      'bbk-babz-2025:I.2.2#primary',
      'bbk-babz-2025:I.2.3#primary',
      'bbk-babz-2025:I.2.4#primary',
      'bbk-babz-2025:I.2.5#primary',
      'bbk-babz-2025:I.2.6#primary',
      'bbk-babz-2025:I.2.7#primary',
    ];
    const keys = Object.keys(MANIFEST_DOMAIN_REVIEWS).filter((key) =>
      /^bbk-babz-2025:I\.2\.[1-7]#primary$/.test(key),
    );
    expect(keys).toEqual(expectedKeys);
    erwarteEigeneReviewobjekte(keys);
  });

  it('führt für I-k exakt drei eigene Fachreview-Ledgerplätze', () => {
    const keys = Object.keys(MANIFEST_DOMAIN_REVIEWS).filter((key) =>
      /^bbk-babz-2025:I\.5\.[1-3]#primary$/.test(key),
    );
    expect(keys).toEqual([
      'bbk-babz-2025:I.5.1#primary',
      'bbk-babz-2025:I.5.2#primary',
      'bbk-babz-2025:I.5.3#primary',
    ]);
    erwarteEigeneReviewobjekte(keys);
  });

  it('führt für I.3 genau elf eigene Fachreview-Ledgerplätze', () => {
    const keys = Object.keys(MANIFEST_DOMAIN_REVIEWS).filter((key) =>
      /^bbk-babz-2025:I\.3\.(?:[1-9]|1[01])#primary$/.test(key),
    );
    expect(keys).toEqual(
      Array.from({ length: 11 }, (_, index) => `bbk-babz-2025:I.3.${index + 1}#primary`),
    );
    erwarteEigeneReviewobjekte(keys);
  });

  it('führt für LFH-485 genau vier eigene I-g-Ledgerplätze', () => {
    const keys = Object.keys(MANIFEST_DOMAIN_REVIEWS).filter((key) =>
      /^bbk-babz-2025:I\.1\.(?:1[7-9]|20)#primary$/.test(key),
    );
    expect(keys).toEqual([
      'bbk-babz-2025:I.1.17#primary',
      'bbk-babz-2025:I.1.18#primary',
      'bbk-babz-2025:I.1.19#primary',
      'bbk-babz-2025:I.1.20#primary',
    ]);
    erwarteEigeneReviewobjekte(keys);
  });

  it('führt für LFH-484 genau vier eigene I-f-Ledgerplätze', () => {
    const keys = Object.keys(MANIFEST_DOMAIN_REVIEWS).filter((key) =>
      /^bbk-babz-2025:I\.1\.1[3-6]#primary$/.test(key),
    );
    expect(keys).toEqual([
      'bbk-babz-2025:I.1.13#primary',
      'bbk-babz-2025:I.1.14#primary',
      'bbk-babz-2025:I.1.15#primary',
      'bbk-babz-2025:I.1.16#primary',
    ]);
    erwarteEigeneReviewobjekte(keys);
  });

  it('führt für I-j genau drei eigene Fachreview-Ledgerplätze', () => {
    const keys = Object.keys(MANIFEST_DOMAIN_REVIEWS).filter((key) =>
      key.startsWith('bbk-babz-2025:I.4.'),
    );
    expect(keys).toEqual([
      'bbk-babz-2025:I.4.1#primary',
      'bbk-babz-2025:I.4.2#primary',
      'bbk-babz-2025:I.4.3#primary',
    ]);
    erwarteEigeneReviewobjekte(keys);
  });

  it('führt für I-c genau vier eigene Fachreview-Ledgerplätze', () => {
    const expectedKeys = new Set([
      'bbk-babz-2025:I.1.1#primary',
      'bbk-babz-2025:I.1.2#primary',
      'bbk-babz-2025:I.1.3#primary',
      'bbk-babz-2025:I.1.4#primary',
    ]);
    const keys = Object.keys(MANIFEST_DOMAIN_REVIEWS).filter((key) =>
      expectedKeys.has(key),
    );
    expect(keys).toEqual([...expectedKeys]);
    erwarteEigeneReviewobjekte(keys);
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
    // Anhang D schließt den damaligen Stand bei 497. I-c, I-d, I-f und I-g ergänzen je vier, I-e
    // und I.5.4 bis I.5.8 je fünf, I-b sieben, I.3 elf, I-j drei und I-k drei. Der integrierte
    // Stand schließt nach LFH-484 bei 544.
    expect(manifestReviews).toHaveLength(544);
    expect(sourceReviews).toHaveLength(13);
    expect(profileReviews).toHaveLength(1);
    expect(reviews).toHaveLength(558);

    // Die neue Invariante: **keine Freigabe ohne benannten, registrierten Prüfer, gültiges
    // ISO-Datum und Befund.** Offene Zeilen sind erlaubt und liefern nichts; solange alles offen
    // ist, ist die Befundmenge leer. Dass die Prüfung trotzdem greift, zeigt der folgende Test
    // an einem Fixture — ohne ihn wäre dieser hier vakuum-grün.
    const befunde = [
      ...Object.entries(MANIFEST_DOMAIN_REVIEWS),
      ...Object.entries(SOURCE_DOMAIN_REVIEWS),
      ...Object.entries(PROFILE_DOMAIN_REVIEWS),
    ].flatMap(([key, review]) => freigabeBefunde(key, review));
    expect(befunde).toEqual([]);
  });

  it('lässt eine erfundene Fachfreigabe am Fixture nachweislich durchfallen', () => {
    // **Der Test behauptet nicht mehr, das Register sei leer.** Das war eine Aussage über den
    // heutigen Stand und wäre mit dem ersten eingetragenen Prüfer rot geworden — also genau
    // dann, wenn das Fachreview-Werkzeug zum ersten Mal benutzt wird. Geprüft wird stattdessen
    // die Invariante „ein nicht registrierter Prüfer trägt keine Freigabe", mit einem Namen, der
    // im Register garantiert nicht steht. Die Zusicherung dazu steht in der Zeile darunter:
    // stünde er doch drin, fiele der Test auf — statt still zu einer leeren Prüfung zu werden.
    expect(isRegisteredReviewer(ERFUNDENER_PRUEFER)).toBe(false);
    // Gegenrichtung: jeder tatsächlich geführte Prüfer wird auch erkannt. Bei leerem Register
    // ist das vakuum-wahr, ab dem ersten Eintrag eine echte Prüfung von `isRegisteredReviewer`.
    for (const reviewer of Object.values(DOMAIN_REVIEWERS)) {
      expect(isRegisteredReviewer(reviewer.name), reviewer.id).toBe(true);
    }

    expect(freigabeBefunde('fixture:ohne-alles', { status: 'approved' })).toEqual([
      'fixture:ohne-alles: missing-reviewer',
      'fixture:ohne-alles: invalid-date',
      'fixture:ohne-alles: missing-domain-note',
    ]);
    expect(
      freigabeBefunde('fixture:erfundener-pruefer', {
        status: 'approved',
        reviewer: ERFUNDENER_PRUEFER,
        date: '2026-09-03',
        note: 'Sieht richtig aus.',
      }),
    ).toEqual(['fixture:erfundener-pruefer: unbekannter-pruefer']);
    expect(
      freigabeBefunde('fixture:abweichung-ohne-befund', {
        status: 'deviation',
        reviewer: ERFUNDENER_PRUEFER,
        date: '2026-13-01',
      }),
    ).toEqual([
      'fixture:abweichung-ohne-befund: invalid-date',
      'fixture:abweichung-ohne-befund: missing-deviation-note',
      'fixture:abweichung-ohne-befund: unbekannter-pruefer',
    ]);
    // Eine offene Zeile bleibt befundfrei — der Test verlangt keine Freigabe, nur eine saubere.
    expect(freigabeBefunde('fixture:offen', { status: 'pending' })).toEqual([]);
  });

  it('führt den stabilen D.3.7-Schlüssel trotz technischer Migration als eigenen Ledgerplatz', () => {
    const keys = ['bbk-babz-2025:D.3.6#primary', 'bbk-babz-2025:D.3.7#primary', 'bbk-babz-2025:D.3.8#primary'];
    expect(Object.keys(MANIFEST_DOMAIN_REVIEWS).filter((key) => keys.includes(key))).toEqual(keys);
    erwarteEigeneReviewobjekte(keys);
  });

  it('hält alle fünfzehn D.3-Darstellungen mit je eigenem Reviewobjekt', () => {
    const keys = Array.from(
      { length: 15 },
      (_, index) => `bbk-babz-2025:D.3.${index + 1}#primary`,
    );
    expect(Object.keys(MANIFEST_DOMAIN_REVIEWS).filter((key) => keys.includes(key))).toEqual(keys);
    erwarteEigeneReviewobjekte(keys);
  });

  it('hält alle fünf D.4-Funktionsträger mit je eigenem Reviewobjekt', () => {
    const keys = Array.from({ length: 5 }, (_, index) => `bbk-babz-2025:D.4.${index + 1}#primary`);
    expect(Object.keys(MANIFEST_DOMAIN_REVIEWS).filter((key) => keys.includes(key))).toEqual(keys);
    erwarteEigeneReviewobjekte(keys);
  });

  it('hält alle sieben D.2-Ortsdefinitionen mit je eigenem Reviewobjekt', () => {
    const keys = Array.from({ length: 7 }, (_, index) => `bbk-babz-2025:D.2.${index + 1}#primary`);
    expect(Object.keys(MANIFEST_DOMAIN_REVIEWS).filter((key) => keys.includes(key))).toEqual(keys);
    erwarteEigeneReviewobjekte(keys);
  });

  // Solange D.1.9 offen ist, muss die Notiz die unsichere Herleitung benennen — sie ist dort
  // Befundlage, nicht Freigabe. Entscheidet ein Fachprüfer die Zeile, tritt an ihre Stelle sein
  // eigener Befund, und dessen Vorhandensein gatet bereits `freigabeBefunde`. Ein festgenagelter
  // `pending`-Status würde hier genau die Entscheidung verhindern, für die das Werkzeug gebaut ist.
  it('benennt die unsichere HiOrg-Zuordnung beider D.1.9-Darstellungen, solange sie offen sind', () => {
    for (const variant of ['primary', 'alternative'] as const) {
      const review = MANIFEST_DOMAIN_REVIEWS[`bbk-babz-2025:D.1.9#${variant}`];
      if (review.status !== 'pending') {
        expect(review.note ?? '', `D.1.9#${variant}: entschieden, aber ohne Befund`).not.toBe('');
        continue;
      }
      expect(review.note).toContain('hilfsorganisation');
      expect(review.note).toContain('weißen Fläche');
    }
  });

  it('wirft für einen nicht inventarisierten Manifestschlüssel', () => {
    expect(() => manifestDomainReviewFor('bbk-babz-2025:9.9#primary')).toThrow(/9\.9/);
  });
});
