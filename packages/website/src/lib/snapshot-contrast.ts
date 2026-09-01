import { CONTRAST_EXCEPTIONS } from '@einsatzzeichen/catalog';
import { formatReviewDate } from './review-date.js';
import { COLOR_WORDS } from './snapshot-colors.js';

/**
 * Die Kontrastausnahmen als Prosa — dieselben Daten, die die Coverage-Ausgabe druckt, aber in der
 * Schreibweise der Website.
 *
 * Eigene Datei, weil hier als einzigem Teil des Snapshots ein **Wortlaut** entsteht, den
 * `snapshot-build.test.ts` zeichengenau festhält (er steht auf drei Seiten, zweimal als
 * Listenpunkt und einmal mitten im Satz). Wer den Satzbau ändert, soll nur diese Datei öffnen
 * müssen und dabei sehen, woran er hängt.
 */

/** „E.2.6" → „Abschnitt E.2.6"; mehrere → „Abschnitte E.2.6 und E.2.7". */
function sectionPhrase(sections: readonly string[]): string {
  if (sections.length === 0) return 'ohne Abschnittsangabe';
  if (sections.length === 1) return `Abschnitt ${sections[0]}`;
  const head = sections.slice(0, -1).join(', ');
  return `Abschnitte ${head} und ${sections[sections.length - 1]}`;
}

/**
 * Klartext einer Kontrastausnahme — ein Satzteil, der ohne Nacharbeit in eine Liste und hinter
 * einen Doppelpunkt passt: „Weiß auf Orange, Abschnitt E.2.6 (entschieden am 18.08.2026,
 * Projektinhaber)".
 *
 * Nicht der Wortlaut der Coverage-Ausgabe: die druckt Tokens und ISO-Daten für ein Terminal.
 * Die Zahlen und die Entscheidung sind dieselben, nur die Schreibweise ist die der Website. Wer
 * die Person hinter `decidedBy` in den Satz zieht, tut das in Klammern und ohne Präposition —
 * „durch Projektinhaber" wäre kein deutscher Satz, und der Wert ist frei belegbar.
 */
export function contrastExceptionText(exception: (typeof CONTRAST_EXCEPTIONS)[number]): string {
  const foreground = COLOR_WORDS[exception.foreground];
  const background = COLOR_WORDS[exception.background];
  return (
    `${foreground} auf ${background}, ${sectionPhrase(exception.sections)} ` +
    `(entschieden am ${formatReviewDate(exception.decidedOn)}, ${exception.decidedBy})`
  );
}

export function contrastExceptionForSection(section: string): string | undefined {
  const exception = CONTRAST_EXCEPTIONS.find((candidate) => candidate.sections.includes(section));
  return exception === undefined ? undefined : contrastExceptionText(exception);
}
