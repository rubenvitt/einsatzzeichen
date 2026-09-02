import type { Review, ReviewSet } from '@einsatzzeichen/schema';
import { withoutReferenceFilenames } from './snapshot-redaction.js';
import type { ReviewSummary } from './snapshot.js';

/**
 * Die Reviewmarken des Katalogs auf die vier Felder verengt, die der Snapshot trägt. Zwischen
 * beiden liegt die Schwärzung — deshalb steht diese Verengung neben `snapshot-redaction.ts` und
 * nicht im Orchestrator: eine Notiz, die ungeschwärzt in den Snapshot geriete, wäre ein
 * Auslieferungsfehler und kein Formatierungsfehler.
 *
 * `toReviewSummary` und nicht `reviewSummary`: `review-summary.ts` im selben Verzeichnis
 * exportiert bereits eine Funktion dieses Namens, die etwas anderes tut — sie zählt eine ganze
 * Menge, statt eine einzelne Marke umzuformen. Zwei gleichnamige Funktionen mit unvereinbaren
 * Signaturen nebeneinander sind ein Fehlimport, den niemand sieht.
 */

/** `Review` → `ReviewSummary`, Feld für Feld statt per Spread: der Snapshot trägt nur diese vier. */
export function toReviewSummary(review: Review): ReviewSummary {
  return {
    status: review.status,
    ...(review.reviewer !== undefined ? { reviewer: review.reviewer } : {}),
    ...(review.date !== undefined ? { date: review.date } : {}),
    ...(review.note !== undefined ? { note: withoutReferenceFilenames(review.note) } : {}),
  };
}

export function reviewSetSummary(
  review: ReviewSet,
): { technical: ReviewSummary; domain: ReviewSummary } {
  return { technical: toReviewSummary(review.technical), domain: toReviewSummary(review.domain) };
}
