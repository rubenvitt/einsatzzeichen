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
 * tragen genau drei Typen: der Manifest-Eintrag (`CoverageEntry`), die Quelle (`SourceRecord`)
 * und das Profil (`ProfileRecord`). Ein Katalogeintrag trägt kein eigenes `review`: sein Review
 * steht auf seiner Manifestzeile, die für `coverage: 'catalog-entry'` 1:1 zu ihm ist und deren
 * Profilgleichheit das Coverage-Gate prüft.
 */
export interface ReviewSet {
  technical: Review;
  domain: Review;
}

const ROLES: readonly ReviewRole[] = ['technical', 'domain'];

export type ReviewIssueCode =
  | 'missing-reviewer'
  | 'invalid-date'
  | 'missing-domain-note'
  | 'missing-deviation-note';

export interface ReviewIssue {
  role: ReviewRole;
  code: ReviewIssueCode;
}

function isIsoDate(value: string | undefined): boolean {
  if (value === undefined || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Validiert abgeschlossene Reviews. `deviation` bedeutet laut Spec ebenfalls „geprüft“ und
 * braucht daher dieselbe Zurechnung wie `approved`, zusätzlich aber eine begründende Notiz.
 * Ein abgeschlossenes fachliches Review braucht ebenfalls eine Notiz oder einen Link zum
 * versionierten Befund; nur dort lassen sich Referenzstand und fachliche Aussage zurechenbar
 * festhalten. `pending` darf eine vorbereitende Notiz tragen, beansprucht jedoch keine Prüfung.
 */
export function reviewIssues(review: ReviewSet): ReviewIssue[] {
  const issues: ReviewIssue[] = [];
  for (const role of ROLES) {
    const entry = review[role];
    if (entry.status === 'pending') continue;
    if (entry.reviewer === undefined || entry.reviewer.trim() === '') {
      issues.push({ role, code: 'missing-reviewer' });
    }
    if (!isIsoDate(entry.date)) issues.push({ role, code: 'invalid-date' });
    const noteMissing = entry.note === undefined || entry.note.trim() === '';
    if (entry.status === 'deviation' && noteMissing) {
      issues.push({ role, code: 'missing-deviation-note' });
    } else if (role === 'domain' && entry.status === 'approved' && noteMissing) {
      issues.push({ role, code: 'missing-domain-note' });
    }
  }
  return issues;
}

/**
 * Rollen mit einem formell unvollständigen abgeschlossenen Review. Ein Status ohne
 * Zurechenbarkeit (oder eine unbegründete Abweichung) ist wertlos; der Typ kann das nicht
 * erzwingen, das Coverage-Gate schon.
 */
export function unattributedRoles(review: ReviewSet): ReviewRole[] {
  return [...new Set(reviewIssues(review).map((issue) => issue.role))];
}
