import { describe, expect, it } from 'vitest';
import { entryKey } from '@einsatzzeichen/schema';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import {
  MANIFEST_DOMAIN_REVIEWS,
  PROFILE_DOMAIN_REVIEWS,
  SOURCE_DOMAIN_REVIEWS,
  manifestDomainReviewFor,
  ownerDomainApproval,
  profileDomainReviewFor,
  sourceDomainReviewFor,
} from './domain-reviews.js';
import { PROFILES } from './profiles.js';
import { SOURCE_REGISTRY } from './sources.js';

/**
 * Die Sammelfreigabe des Projektinhabers vom 28. August 2026, hier bewusst **ausgeschrieben**
 * und nicht aus `ownerDomainApproval()` bezogen: sonst prüfte der Test die Fabrik gegen sich
 * selbst. Jeder Ledgerplatz muss genau diesen Wortlaut tragen.
 */
const OWNER_APPROVAL = {
  status: 'approved',
  reviewer: 'Ruben Vitt',
  date: '2026-08-28',
  note: 'Fachlich freigegeben durch den Projektinhaber am 28.08.2026 (Sammelfreigabe im Rahmen von LFH-429).',
} as const;

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

    // Seit der Sammelfreigabe ist `pending` der Wert, der hier **nicht** entstehen darf: eine
    // erteilte Freigabe darf sich ebenso wenig still zurücknehmen lassen wie sie sich still
    // erteilen ließ.
    try {
      mutableReview.status = 'pending';
    } catch (error) {
      mutationError = error;
    } finally {
      if (!Object.isFrozen(review)) mutableReview.status = originalStatus;
    }

    expect(mutationError).toBeInstanceOf(TypeError);
    expect(review.status).toBe('approved');
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

  it('führt für I-d genau vier einzeln geführte Fachreviews', () => {
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
      expect(manifestDomainReviewFor(key)).toEqual(OWNER_APPROVAL);
    }
  });

  it('führt für I-e genau fünf einzeln geführte Fachreviews', () => {
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
      expect(manifestDomainReviewFor(key)).toEqual(OWNER_APPROVAL);
    }
  });

  it('führt für I-b genau sieben einzeln geführte Fachreviews', () => {
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
    for (const key of keys) {
      expect(manifestDomainReviewFor(key)).toEqual(OWNER_APPROVAL);
    }
  });

  it('führt für I-k exakt drei einzeln geführte Fachreviews', () => {
    const keys = Object.keys(MANIFEST_DOMAIN_REVIEWS).filter((key) =>
      /^bbk-babz-2025:I\.5\.[1-3]#primary$/.test(key),
    );
    expect(keys).toEqual([
      'bbk-babz-2025:I.5.1#primary',
      'bbk-babz-2025:I.5.2#primary',
      'bbk-babz-2025:I.5.3#primary',
    ]);
    for (const key of keys) {
      expect(manifestDomainReviewFor(key)).toEqual(OWNER_APPROVAL);
    }
  });

  it('führt für I.3 genau elf einzeln geführte Fachreviews', () => {
    const keys = Object.keys(MANIFEST_DOMAIN_REVIEWS).filter((key) =>
      /^bbk-babz-2025:I\.3\.(?:[1-9]|1[01])#primary$/.test(key),
    );
    expect(keys).toEqual(
      Array.from({ length: 11 }, (_, index) => `bbk-babz-2025:I.3.${index + 1}#primary`),
    );
    for (const key of keys) {
      expect(manifestDomainReviewFor(key)).toEqual(OWNER_APPROVAL);
    }
  });

  it('führt für LFH-485 genau vier einzeln geführte I-g-Fachreviews', () => {
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
      expect(manifestDomainReviewFor(key)).toEqual(OWNER_APPROVAL);
    }
  });

  it('führt für LFH-484 genau vier einzeln geführte I-f-Fachreviews', () => {
    const keys = Object.keys(MANIFEST_DOMAIN_REVIEWS).filter((key) =>
      /^bbk-babz-2025:I\.1\.1[3-6]#primary$/.test(key),
    );
    expect(keys).toEqual([
      'bbk-babz-2025:I.1.13#primary',
      'bbk-babz-2025:I.1.14#primary',
      'bbk-babz-2025:I.1.15#primary',
      'bbk-babz-2025:I.1.16#primary',
    ]);
    for (const key of keys) {
      expect(manifestDomainReviewFor(key)).toEqual(OWNER_APPROVAL);
    }
  });

  it('führt für I-j genau drei eigene, einzeln geführte Fachreviews', () => {
    const keys = Object.keys(MANIFEST_DOMAIN_REVIEWS).filter((key) =>
      key.startsWith('bbk-babz-2025:I.4.'),
    );
    expect(keys).toEqual([
      'bbk-babz-2025:I.4.1#primary',
      'bbk-babz-2025:I.4.2#primary',
      'bbk-babz-2025:I.4.3#primary',
    ]);
    for (const key of keys) {
      expect(manifestDomainReviewFor(key)).toEqual(OWNER_APPROVAL);
    }
  });

  it('führt für I-c genau vier eigene einzeln geführte Fachreviews', () => {
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
    for (const key of keys) {
      expect(manifestDomainReviewFor(key)).toEqual(OWNER_APPROVAL);
    }
  });

  it('trägt die Sammelfreigabe des Projektinhabers auf jedem einzelnen Ledgerplatz', () => {
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
    // F-d ergänzt acht einzelne, einzeln geführte Reviewplätze für F.2.10 bis F.2.17. F-e
    // ergänzt elf für F.3.1 bis F.3.11 und F-f die acht verbleibenden für F.3.12 bis F.3.19.
    // Anhang D schließt den damaligen Stand bei 497. I-c, I-d, I-f und I-g ergänzen je vier, I-e
    // und I.5.4 bis I.5.8 je fünf, I-b sieben, I.3 elf, I-j drei und I-k drei. Der integrierte
    // Stand schließt nach LFH-484 bei 544.
    expect(manifestReviews).toHaveLength(544);
    expect(sourceReviews).toHaveLength(13);
    expect(profileReviews).toHaveLength(1);
    expect(reviews).toHaveLength(558);
    // Kein Ledgerplatz bleibt offen, und keiner trägt eine Freigabe ohne Zurechnung: Reviewer,
    // ISO-Datum und Notiz sind für ein abgeschlossenes fachliches Review Pflicht
    // (`reviewIssues` in `packages/schema/src/review.ts`).
    expect(reviews.every((review) => review.status === 'approved')).toBe(true);
    expect(reviews.every((review) => review.reviewer === 'Ruben Vitt')).toBe(true);
    expect(reviews.every((review) => review.date === '2026-08-28')).toBe(true);
    expect(reviews.every((review) => (review.note ?? '').includes(OWNER_APPROVAL.note))).toBe(true);
  });

  it('gibt je Aufruf ein eigenes Freigabeobjekt mit genau dem beschlossenen Wortlaut aus', () => {
    expect(ownerDomainApproval()).toEqual(OWNER_APPROVAL);
    expect(ownerDomainApproval()).not.toBe(ownerDomainApproval());
    // Eine vorbereitende Notiz aus der Bauphase bleibt vorn stehen, die Freigabe hängt dahinter.
    expect(ownerDomainApproval('Befund.').note).toBe(`Befund. ${OWNER_APPROVAL.note}`);
  });

  it('führt den stabilen D.3.7-Schluessel trotz technischer Migration mit eigener Freigabe', () => {
    expect(MANIFEST_DOMAIN_REVIEWS['bbk-babz-2025:D.3.7#primary'])
      .toEqual(OWNER_APPROVAL);
  });

  it('hält alle fünfzehn D.3-Darstellungen einzeln freigegeben', () => {
    const references = Array.from({ length: 15 }, (_, index) => `D.3.${index + 1}`);
    expect(references.map((reference) =>
      MANIFEST_DOMAIN_REVIEWS[`bbk-babz-2025:${reference}#primary` as keyof typeof MANIFEST_DOMAIN_REVIEWS],
    )).toEqual(references.map(() => OWNER_APPROVAL));
  });

  it('hält alle fünf D.4-Funktionsträger einzeln freigegeben', () => {
    const references = Array.from({ length: 5 }, (_, index) => `D.4.${index + 1}`);
    expect(references.map((reference) =>
      MANIFEST_DOMAIN_REVIEWS[`bbk-babz-2025:${reference}#primary` as keyof typeof MANIFEST_DOMAIN_REVIEWS],
    )).toEqual(references.map(() => OWNER_APPROVAL));
  });

  it('hält alle sieben D.2-Ortsdefinitionen einzeln freigegeben', () => {
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
    )).toEqual(references.map(() => OWNER_APPROVAL));
  });

  it('behält den HiOrg-Befund beider D.1.9-Darstellungen neben der Freigabe', () => {
    for (const variant of ['primary', 'alternative'] as const) {
      const review = MANIFEST_DOMAIN_REVIEWS[`bbk-babz-2025:D.1.9#${variant}`];
      expect(review.status).toBe('approved');
      // Die vorbereitende Notiz aus der Bauphase ist nicht verloren gegangen: sie steht vor der
      // Freigabe und sagt weiterhin, woraus die Organisationszuordnung abgeleitet ist.
      expect(review.note).toContain('hilfsorganisation');
      expect(review.note).toContain('weißen Fläche');
      expect(review.note).toContain(OWNER_APPROVAL.note);
    }
  });

  it('wirft für einen nicht inventarisierten Manifestschlüssel', () => {
    expect(() => manifestDomainReviewFor('bbk-babz-2025:9.9#primary')).toThrow(/9\.9/);
  });
});
