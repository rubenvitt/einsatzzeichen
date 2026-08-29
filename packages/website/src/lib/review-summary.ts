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
 * `snapshot.symbols` (Zeichen mit einer eigenen Seite), die Startseite zählt
 * `snapshot.coverage.matrix` (Zeilen des Manifests, also auch Elemente und Piktogramme). Beide
 * Zahlen sind richtig und verschieden; sie zu vermischen wäre der Fehler.
 */
export function reviewSummary(entries: readonly Reviewed[]): ReviewTotals {
  return { technical: count(entries, 'technical'), domain: count(entries, 'domain') };
}
