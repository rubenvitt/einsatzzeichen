/**
 * Die beiden Reviewrollen der Vision („mindestens ein technisches und ein fachliches Review").
 * Wird in der Gate-Ausgabe verwendet: die Fehlermeldung nennt die Rolle.
 */
export type ReviewRole = 'technical' | 'domain';

export type ReviewStatus = 'pending' | 'approved' | 'deviation';

export interface Review {
  status: ReviewStatus;
  reviewer?: string;
  /** ISO-Datum, z. B. "2026-08-05". */
  date?: string;
  note?: string;
}

/**
 * Beide Rollen sind Pflicht — eine fehlende Rolle ist kein zulässiger Zustand. Dieselbe Struktur
 * trägt jeder Katalogeintrag, jeder Manifest-Eintrag, jede Quelle und jedes Profil.
 */
export interface ReviewSet {
  technical: Review;
  domain: Review;
}

const ROLES: readonly ReviewRole[] = ['technical', 'domain'];

/**
 * Rollen, deren Status `approved` ist, ohne Reviewer **und** Datum zu nennen. Ein Status ohne
 * Zurechenbarkeit ist wertlos; der Typ kann das nicht erzwingen, das Coverage-Gate schon.
 */
export function unattributedRoles(review: ReviewSet): ReviewRole[] {
  return ROLES.filter((role) => {
    const entry = review[role];
    return entry.status === 'approved' && (entry.reviewer === undefined || entry.date === undefined);
  });
}
