import { reviewIssues, type Review, type ReviewSet } from '@einsatzzeichen/schema';

const ZULAESSIGE_STATUS: readonly string[] = ['pending', 'approved', 'deviation'];

/**
 * Die gemeinsame Zusage zur Rolle `domain`, seit das Fachreview-Werkzeug (`packages/review`)
 * existiert: **das Fachreview ist vorhanden und, falls entschieden, zurechenbar** — nicht mehr
 * „es ist noch nichts entschieden".
 *
 * Warum die alte Form weg ist: `expect(review.domain.status).toBe('pending')` war eine Aussage
 * über den heutigen Reviewstand, nicht über eine Invariante. Die erste ehrliche Fachfreigabe
 * hätte sie rot gefärbt und damit genau das Werkzeug blockiert, für das der Ledger gebaut ist.
 *
 * Warum hier und nicht je Datei: dieselbe Prüfung wird in sechs Testdateien gebraucht
 * (`coverage-manifest`, `sources`, `profiles`, `domain-review-questions` und die beiden
 * Piktogramminventare). Sechs Kopien liefen still auseinander, sobald `reviewIssues()` eine
 * weitere Zurechenbarkeitsregel bekommt. Das Modul liegt unter `test-support/`, das die
 * Build-tsconfig des Pakets ausschließt — es wandert also nicht ins Distributionsartefakt.
 *
 * Geprüft wird mit `reviewIssues()` aus `schema`, also mit derselben Funktion, die auch das
 * Coverage-Gate benutzt; ein zweites Regelwerk könnte auseinanderlaufen.
 */
export function fachreviewBefunde(review: ReviewSet, key: string): string[] {
  const domain = review.domain as Review | undefined;
  if (domain === undefined) return [`${key}: kein fachliches Review vorhanden`];
  const befunde: string[] = [];
  if (!ZULAESSIGE_STATUS.includes(domain.status)) {
    befunde.push(`${key}: unzulässiger Fachreviewstatus "${String(domain.status)}"`);
  }
  for (const issue of reviewIssues(review)) {
    if (issue.role !== 'domain') continue;
    befunde.push(`${key}: Fachreview entschieden, aber nicht zurechenbar (${issue.code})`);
  }
  return befunde;
}

/**
 * Dieselbe Prüfung als Zusicherung. Wirft statt `expect` aufzurufen: `test-support/` ist für das
 * Repository-Gate (`pnpm cli verify:repository`) **keine** Testquelle — nur `*.test.ts` darf dort
 * undeklarierte externe Pakete importieren, und `vitest` steht nicht in
 * `packages/catalog/package.json`. Ein geworfener Fehler mit sprechender Meldung lässt den
 * aufrufenden Test genauso fallen und hält die Aufrufstellen bei einer Zeile.
 */
export function erwarteZurechenbaresFachreview(review: ReviewSet, key: string): void {
  const befunde = fachreviewBefunde(review, key);
  if (befunde.length > 0) throw new Error(befunde.join('; '));
}

/**
 * Dieselbe Zusage für ein einzelnes Ledgerobjekt, also für die Einträge aus
 * `MANIFEST_DOMAIN_REVIEWS`, `SOURCE_DOMAIN_REVIEWS` und `PROFILE_DOMAIN_REVIEWS`. Dort gibt es
 * kein `ReviewSet`, weil der Ledger ausschließlich die Rolle `domain` führt; das technische
 * Review wird deshalb als offen ergänzt und bleibt damit ohne Einfluss auf die Befunde.
 */
export function erwarteZurechenbaresFachreviewImLedger(review: Review, key: string): void {
  erwarteZurechenbaresFachreview({ technical: { status: 'pending' }, domain: review }, key);
}
