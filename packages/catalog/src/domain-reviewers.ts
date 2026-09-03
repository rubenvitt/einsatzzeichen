import { deepFreeze, type DeepReadonly } from './readonly-data.js';

/**
 * Eine Person mit einsatztaktischer Fachkunde, die im Fachreview-Ledger als Prüfer auftreten darf.
 * Die drei Felder sind das Minimum für Zurechenbarkeit: wer (Kennung), unter welchem Namen die
 * Freigabe im Ledger steht, und woraus die fachliche Berechtigung folgt.
 */
export interface DomainReviewer {
  /** Stabile Kennung, zugleich der Schlüssel im Register. */
  id: string;
  /** Genau der Name, der in `Review.reviewer` steht — hierüber läuft der Abgleich. */
  name: string;
  /** Die einsatztaktische Qualifikation, aus der die Zurechenbarkeit folgt. */
  qualification: string;
}

/**
 * Register der Fachprüfer — **absichtlich leer**.
 *
 * Wozu das Register da ist: eine Fachfreigabe (`domain: approved` oder `deviation`) ist nur so
 * viel wert wie die Person, die sie verantwortet. `reviewIssues()` aus `schema` prüft, dass
 * überhaupt ein Name, ein gültiges ISO-Datum und ein Befund dastehen; es kann aber nicht prüfen,
 * ob der Name jemanden mit einsatztaktischer Fachkunde bezeichnet. Genau diese Lücke schließt das
 * Register: `domain-reviews.test.ts` lässt jede nicht offene Ledgerzeile durchfallen, deren
 * Reviewer hier nicht geführt ist, und das Fachreview-Werkzeug verweigert ohne Registereintrag
 * jeden Schreibvorgang.
 *
 * Warum leer: es gibt heute keine benannte Person mit einsatztaktischer Fachkunde für dieses
 * Projekt. Einen Eintrag zu erfinden wäre genau die vorgetäuschte Fachfreigabe, die die
 * Projektspezifikation verbietet — der leere Zustand ist deshalb kein offener Rest, sondern die
 * wahrheitsgemäße Auskunft. Eingetragen wird ausschließlich durch einen Menschen (über
 * `addReviewer` des Fachreview-Werkzeugs), nie beiläufig durch eine Codeänderung.
 */
export const DOMAIN_REVIEWERS: DeepReadonly<Record<string, DomainReviewer>> = deepFreeze(
  {} satisfies Record<string, DomainReviewer>,
);

/**
 * Ob `name` einer im Register geführten Person gehört. Verglichen wird gegen das Feld `name`,
 * weil im Ledger der Name und nicht die Kennung steht. Exakter Vergleich und kein stiller
 * Rückfall: solange das Register leer ist, ist die Antwort für jeden Namen `false` — und damit
 * fällt jede Fachfreigabe ohne registrierten Prüfer durch das Gate.
 */
export function isRegisteredReviewer(name: string): boolean {
  return Object.values(DOMAIN_REVIEWERS).some((reviewer) => reviewer.name === name);
}
