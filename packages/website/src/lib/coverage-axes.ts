import type { CoverageAxis } from './snapshot.js';

/**
 * Die Achse mit diesem Label — oder ein sichtbarer Fehler zur Buildzeit. `coverage.axes.find(…)
 * ?? …` an der Aufrufstelle würde bei einem Tippfehler im Label oder einer umbenannten Achse
 * still `undefined` in die Seite rendern; diese Funktion bricht stattdessen mit Klartext ab,
 * welches Label gesucht wurde und welche tatsächlich im Snapshot stehen.
 */
export function axisByLabel(axes: readonly CoverageAxis[], label: string): CoverageAxis {
  const axis = axes.find((candidate) => candidate.label === label);
  if (axis === undefined) {
    throw new Error(
      `Keine Coverage-Achse mit Label "${label}" im Snapshot. Vorhanden: ` +
        `${axes.map((candidate) => candidate.label).join(', ')}.`,
    );
  }
  return axis;
}
