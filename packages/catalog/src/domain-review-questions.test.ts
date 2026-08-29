import { describe, expect, it } from 'vitest';
import {
  DOMAIN_REVIEW_QUESTIONS,
  domainReviewQuestionIssues,
  domainReviewQuestionsFor,
} from './domain-review-questions.js';
import { MANIFEST_DOMAIN_REVIEWS } from './domain-reviews.js';

describe('Fachfragenregister', () => {
  it('nennt nur Schlüssel mit Ledgerplatz, keine doppelten IDs und keine leeren Fragen', () => {
    expect(domainReviewQuestionIssues()).toEqual([]);
  });

  it('ist eingefroren und ändert keinen Reviewstatus', () => {
    expect(Object.isFrozen(DOMAIN_REVIEW_QUESTIONS)).toBe(true);
    for (const question of DOMAIN_REVIEW_QUESTIONS) {
      expect(Object.isFrozen(question)).toBe(true);
      expect(question.question.trim().length).toBeGreaterThan(0);
    }
    // Das Register hängt am Ledger, nicht umgekehrt: es stellt Fragen, es setzt keinen Status.
    // Seit der Sammelfreigabe vom 28.08.2026 trägt jede genannte Zeile `approved` — das Register
    // bleibt trotzdem stehen und hält fest, worüber der Projektinhaber entschieden hat.
    for (const question of DOMAIN_REVIEW_QUESTIONS) {
      for (const key of question.keys) {
        expect(MANIFEST_DOMAIN_REVIEWS[key].status).toBe('approved');
      }
    }
  });

  it('findet die Fragen zu einem Schlüssel in Registerreihenfolge', () => {
    const ids = domainReviewQuestionsFor('bbk-babz-2025:1.13#primary').map((q) => q.id);
    expect(ids).toEqual(['Q-1-ereignis-ohne-organisation']);
    expect(domainReviewQuestionsFor('bbk-babz-2025:9.9#primary')).toEqual([]);
    // Die Anhängerfrage hängt an Kapitel 5.1 **und** an E.2 — einmal formuliert, beidseitig
    // auffindbar.
    expect(domainReviewQuestionsFor('bbk-babz-2025:E.2.23#primary').map((q) => q.id)).toContain(
      'Q-5.1-anhaenger-ein-oder-zwei-raeder',
    );
  });

  it('deckt die Blöcke Kapitel 1, 2, 5.1 und die Anhänge D bis N ab', () => {
    const covered = new Set<string>(DOMAIN_REVIEW_QUESTIONS.flatMap((q) => [...q.keys]));
    for (const key of [
      'bbk-babz-2025:1.13#primary',
      'bbk-babz-2025:2.2#primary',
      'bbk-babz-2025:5.1.2.4#primary',
      'bbk-babz-2025:D.1.1#primary',
      'bbk-babz-2025:D.2.7#primary',
      'bbk-babz-2025:D.3.15#primary',
      'bbk-babz-2025:D.4.5#primary',
      'bbk-babz-2025:E.1.1#primary',
      'bbk-babz-2025:E.2.31#primary',
      'bbk-babz-2025:F.1.11#alternative',
      'bbk-babz-2025:F.3.19#primary',
      'bbk-babz-2025:G.8#primary',
      'bbk-babz-2025:I.5.8#primary',
      'bbk-babz-2025:N.2.3#primary',
    ]) {
      expect(covered.has(key), key).toBe(true);
    }
  });
});
