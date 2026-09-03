/**
 * Der Schreibweg des Fachreview-Werkzeugs (Design §6). Nach außen sichtbar sind genau drei
 * Funktionen: der reine Umschreiber für den Ledger-Quelltext, der reine Einfüger für das
 * Reviewer-Register und die beiden Dateioperationen darüber.
 */
export { insertReviewerSource, rewriteLedgerSource } from './rewrite.js';
export { LEDGER_CONSTANTS, addReviewer, writeDomainReview } from './write.js';
