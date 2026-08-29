import { formatReviewDate } from './review-date.js';
import type { ReviewSummary } from './snapshot.js';

/**
 * Wie viele Einträge auf welchem Prüfstand stehen — für Sätze, die den Freigabestand behaupten.
 *
 * Warum das eine Funktion ist und keine Zeile Prosa: Sätze wie „kein Zeichen ist fachlich
 * freigegeben" waren in fünf Anleitungen von Hand getippt. Sie stimmten am Tag des Schreibens und
 * hätten in dem Moment still gelogen, in dem das erste Fachreview eingetragen wird — kein Test,
 * kein Gate und kein Build hätte davon Notiz genommen. Gezählt wird deshalb aus dem Snapshot, und
 * die Seiten entscheiden am Zählergebnis, welchen Satz sie zeigen.
 */
export interface ReviewCounts {
  approved: number;
  deviation: number;
  pending: number;
  /** Summe der drei — zugleich die Zahl der gezählten Einträge. */
  total: number;
}

export interface ReviewTotals {
  technical: ReviewCounts;
  domain: ReviewCounts;
}

/** Ein gezählter Eintrag: Snapshot-Zeichen und Manifestzeilen tragen beide diese Form. */
export interface Reviewed {
  review: { technical: ReviewSummary; domain: ReviewSummary };
}

function empty(): ReviewCounts {
  return { approved: 0, deviation: 0, pending: 0, total: 0 };
}

/**
 * Zählt eine Achse. Ein unbekannter Status bricht ab, statt still in keiner Zahl aufzutauchen:
 * eine vierte Statusmarke im Katalog würde sonst die Summe der drei kleiner als `total` machen,
 * und jede Seite, die „alle übrigen" aus der Differenz erzählt, erzählte etwas Falsches.
 */
function count(entries: readonly Reviewed[], axis: 'technical' | 'domain'): ReviewCounts {
  const counts = empty();
  for (const entry of entries) {
    const { status } = entry.review[axis];
    if (status !== 'approved' && status !== 'deviation' && status !== 'pending') {
      throw new Error(
        `Unbekannter Reviewstatus "${String(status)}" auf der Achse "${axis}". ` +
          'Bekannt sind: approved, deviation, pending.',
      );
    }
    counts[status] += 1;
    counts.total += 1;
  }
  return counts;
}

/**
 * Beide Prüfstände über dieselbe Menge gezählt.
 *
 * Die Menge bestimmt der Aufrufer, und das ist Absicht: die Anleitungen zählen
 * `snapshot.symbols` (Zeichen mit einer eigenen Seite), die Startseite und die Prüfseite zählen
 * `snapshot.coverage.matrix` (Zeilen der Prüfliste, also auch Bausteine ohne eigene Seite). Beide
 * Zahlen sind richtig und verschieden; sie zu vermischen wäre der Fehler.
 */
export function reviewSummary(entries: readonly Reviewed[]): ReviewTotals {
  return { technical: count(entries, 'technical'), domain: count(entries, 'domain') };
}

/** Eine Zeile der Prüfliste: beide Marken hängen direkt am Objekt, nicht unter `review`. */
export interface ReviewedRow {
  technical: ReviewSummary;
  domain: ReviewSummary;
}

/**
 * Dasselbe für die Prüfliste (`snapshot.coverage.matrix`).
 *
 * Eine eigene Funktion und kein zweiter Zweig in `reviewSummary`: die beiden Datenformen kommen
 * aus derselben Quelle, tragen die Marken aber an verschiedenen Stellen — `SymbolSummary.review`
 * gegen `MatrixRow.technical`/`.domain`. Wer die falsche Form übergibt, bekam vorher erst beim
 * Bauen einen Zugriff auf `undefined`; jetzt sagt es der Typ.
 */
export function reviewSummaryOfRows(rows: readonly ReviewedRow[]): ReviewTotals {
  return reviewSummary(rows.map((row) => ({ review: { technical: row.technical, domain: row.domain } })));
}

/** Prüfer und Tag einer Sammelfreigabe, so wie die Daten sie ausweisen. */
export interface BulkApproval {
  reviewer: string;
  /** ISO-Datum, unverändert aus dem Katalog. */
  date: string;
}

/** Woran eine Sammelfreigabe in der Notiz zu erkennen ist — `domain-reviews.ts` schreibt es hin. */
const BULK_NOTE_MARKER = 'Sammelfreigabe';

/**
 * Die Sammelfreigabe hinter den fachlichen „geprüft"-Marken — oder `undefined`, wenn die Daten
 * keine ausweisen.
 *
 * Warum das geprüft und nicht angenommen wird: die Seiten sagen „als Sammelfreigabe des
 * Projektinhabers, <Name>, <Datum>". Das ist eine Herkunftsbehauptung, und sie stimmt nur, solange
 * alle Freigaben denselben Prüfer, dasselbe Datum und eine Notiz tragen, die sie als Sammelfreigabe
 * ausweist. Trägt eine Freigabe später einen anderen Prüfer, ein anderes Datum oder eine Notiz ohne
 * dieses Wort, verschwindet der Halbsatz von allen Seiten — statt eine Herkunft zu behaupten, die
 * es nicht mehr gibt.
 *
 * Eine einzelne Freigabe ist keine Sammelfreigabe; darunter liegt die Schwelle bei zwei.
 */
export function bulkDomainApproval(entries: readonly Reviewed[]): BulkApproval | undefined {
  const approved = entries
    .map((entry) => entry.review.domain)
    .filter((review) => review.status === 'approved');
  if (approved.length < 2) return undefined;

  const reviewers = new Set(approved.map((review) => review.reviewer));
  const dates = new Set(approved.map((review) => review.date));
  if (reviewers.size !== 1 || dates.size !== 1) return undefined;

  const [reviewer] = reviewers;
  const [date] = dates;
  if (reviewer === undefined || reviewer === '') return undefined;
  if (date === undefined || date === '') return undefined;
  if (!approved.every((review) => review.note?.includes(BULK_NOTE_MARKER) === true)) {
    return undefined;
  }
  return { reviewer, date };
}

/** Dasselbe für die Prüfliste, deren Marken direkt am Objekt hängen. */
export function bulkDomainApprovalOfRows(rows: readonly ReviewedRow[]): BulkApproval | undefined {
  return bulkDomainApproval(rows.map((row) => ({ review: { technical: row.technical, domain: row.domain } })));
}

/**
 * Der Halbsatz, mit dem eine Sammelfreigabe genannt wird — leer, wenn es keine zu nennen gibt.
 *
 * Als Funktion und nicht als fünfmal getippter Satz: die Startseite, die Prüfseite und drei
 * Anleitungen sagen dasselbe, und fünf Fassungen desselben Satzes laufen auseinander, sobald eine
 * davon geändert wird. Der führende Gedankenstrich gehört dazu — die Aufrufer hängen den Halbsatz
 * unmittelbar an ihre eigene Aussage an.
 */
export function bulkApprovalClause(approval: BulkApproval | undefined): string {
  if (approval === undefined) return '';
  return ` — als Sammelfreigabe des Projektinhabers, ${approval.reviewer}, ${formatReviewDate(approval.date)}`;
}
