import type { ContrastIssue } from '@einsatzzeichen/core';
import type { ColorToken } from '@einsatzzeichen/schema';
import { deepFreeze, type DeepReadonly } from './readonly-data.js';

/**
 * Ein Kontrastpaar, das der Katalog **wissentlich** unterhalb seiner eigenen Schwelle führt, weil
 * die Referenz es so zeichnet und keine zulässige Palettenänderung es in allen Themes auflöst.
 *
 * Warum das als Datum im Paket steht und nicht als Zeile in einem Test: eine Ausnahme, die nur im
 * Test steht, ist im Betrieb unsichtbar. Wer den Katalog einsetzt, sieht dann ein Zeichen, dessen
 * Beschriftung im Druck schlechter lesbar ist als jede andere, ohne dass irgendetwas in der
 * Auslieferung das sagt. `pnpm cli coverage` gibt diese Liste deshalb aus, und
 * `a11y-contrast-gate.test.ts` prüft gegen genau sie statt gegen eine aufgeweichte Statusmenge.
 *
 * Eine Ausnahme ist ausdrücklich **keine** `deviation` im Sinne des Manifests: die Umsetzung folgt
 * der Quelle punktgenau. Was abweicht, ist die eigene Kontrastschwelle des Katalogs vom Bild — ein
 * Befund an der Quelle, keine Freiheit der Umsetzung. Sie ist auch kein Freigabeblocker: ein
 * Blocker ist ein offener Punkt, und dieser ist entschieden.
 */
export interface ContrastException {
  /** Vordergrundtoken des ausgenommenen Paars. */
  readonly foreground: ColorToken;
  /** Hintergrundtoken oder die Ausgabeoberfläche. */
  readonly background: ColorToken | 'surface';
  /**
   * Themes, in denen der Befund steht. Ein Theme außerhalb dieser Liste fällt weiter auf.
   *
   * Die Liste nennt **alle** Themes, in denen das Paar gemessen unter der Schwelle liegt — auch
   * solche, die die Themeschleife des Gates heute nicht prüft. Das ist bewusst: die Entscheidung
   * gilt dem Paar in jedem Theme, in dem es auftritt, und nicht der zufälligen Auswahl der
   * geprüften Themes. Wer die Schleife später erweitert, soll dort keine unentschiedene Lage
   * vorfinden, sondern die schon getroffene Entscheidung.
   */
  readonly themeIds: readonly string[];
  /** Abschnitte des Manifests, aus denen das Paar entsteht — die Liste ist gegatet. */
  readonly sections: readonly string[];
  /** Tag der Entscheidung, ISO-8601. */
  readonly decidedOn: string;
  /** Wer entschieden hat. */
  readonly decidedBy: string;
  /** Warum die Ausnahme steht statt einer Lösung. */
  readonly rationale: string;
  /** Die geprüften und verworfenen Alternativen, damit die Entscheidung nachvollziehbar bleibt. */
  readonly rejected: readonly string[];
}

/**
 * **Weiss auf Orange, entschieden am 18. August 2026.**
 *
 * `E.2.6` ist das einzige Zeichen des Referenzbestands mit orangem Körper (`#fa8c00` =
 * `organizationColor('sonstige-gefahrenabwehr')`) **und** weisser Beschriftung darin. Selbst
 * nachgerechnet: 2,382:1 im Referenz- und im accessible-light-Theme, 2,323:1 im Drucktheme, gegen
 * eine Textschwelle von 4,5:1.
 *
 * Das Zeichen ist gebaut, wie die Referenz es zeigt. Die drei geprüften Alternativen stehen in
 * `rejected` und sind dort mit den Zahlen belegt, die sie verworfen haben.
 */
export const CONTRAST_EXCEPTIONS: DeepReadonly<ContrastException[]> = deepFreeze([
  {
    foreground: 'weiss',
    background: 'orange',
    themeIds: ['reference', 'accessible-light', 'print-monochrome'],
    sections: ['E.2.6'],
    decidedOn: '2026-08-18',
    decidedBy: 'Projektinhaber',
    rationale:
      'Weisse Beschriftung auf der Organisationsfarbe orange erreicht 2,382:1 (Referenz- und ' +
      'accessible-light-Theme) bzw. 2,323:1 (Drucktheme) gegen die Textschwelle 4,5:1. Der ' +
      'Katalog baut E.2.6, wie die Referenz es zeichnet; abweichend ist nicht die Umsetzung, ' +
      'sondern die eigene Schwelle des Katalogs. Im Drucktheme ist das Fenster beweisbar leer: ' +
      'weisser Text ab 4,5:1 verlangt eine Relativluminanz von höchstens 0,1833, schwarzer ' +
      'Piktogramm-Ink ab 3:1 eine von mindestens 0,1000, und der geforderte Helligkeitsabstand ' +
      'von mehr als 0,045 je Organisation ist zu rot (0,1329) und blau (0,1812) in genau diesem ' +
      'Band nicht einzuhalten — von 256 Grauwerten erfüllt keiner alle drei Bedingungen.',
    rejected: [
      'Dunkles statt weisses Trägerkürzel: widerspricht dem Bild. Beide Läufe von E.2.6 tragen ' +
        'in der Referenz #ffffff, punktgleich mit E.2.5; die Umsetzung würde die Quelle ' +
        'verlassen und müsste als deviation geführt werden.',
      'Dunkleres Orange nur in accessible-light: dort lösbar — 44 Werte im Farbton von #fa8c00 ' +
        'erfüllen beide Richtungen, etwa #b06300 mit 4,535:1 gegen Weiss und 4,631:1 gegen ' +
        'Schwarz. Verworfen, weil es den Befund nur im Drucktheme stehen ließe und damit eine ' +
        'Ausnahme mit zwei Begründungen erzeugte statt einer.',
      'E.2.6 ungebaut lassen: hält Anhang E dauerhaft bei 67 von 68 Abschnitten und begründet ' +
        'eine Lücke im Bestand mit einer Eigenschaft der Palette. Verworfen, weil die Lücke ' +
        'teurer ist als der dokumentierte Befund.',
    ],
  },
]);

/** Die Ausnahme zu einem Befund, oder `undefined`, wenn keine ihn deckt. */
export function contrastExceptionFor(
  issue: Pick<ContrastIssue, 'foreground' | 'background' | 'themeId'>,
): DeepReadonly<ContrastException> | undefined {
  return CONTRAST_EXCEPTIONS.find(
    (exception) =>
      exception.foreground === issue.foreground &&
      exception.background === issue.background &&
      exception.themeIds.includes(issue.themeId),
  );
}

/**
 * Alle Befunde, die **keine** Ausnahme deckt. Das ist die Menge, die grün sein muss — und zwar
 * ohne Rücksicht darauf, wie viele Ausnahmen es gibt: die Ausnahme wirkt paarweise und
 * themeweise, jedes andere Paar und jedes andere Theme fällt weiter auf.
 */
export function unexpectedContrastIssues(
  issues: readonly ContrastIssue[],
): readonly ContrastIssue[] {
  return issues.filter((issue) => contrastExceptionFor(issue) === undefined);
}

/** Die Befunde, die eine Ausnahme deckt — gezählt, nicht toleriert. */
export function knownContrastIssues(issues: readonly ContrastIssue[]): readonly ContrastIssue[] {
  return issues.filter((issue) => contrastExceptionFor(issue) !== undefined);
}
