import {
  generativeReach,
  referenceInventory,
  ruleCoverage,
  validationRuleCoverage,
} from '@einsatzzeichen/catalog';
import type { CoverageAxis } from './snapshot.js';

/**
 * Die drei Zahlenachsen der Prüfseite. Eigene Datei, weil sie die einzige Stelle des Snapshots
 * ist, die einen Wortlaut aus `packages/cli` doppelt — dass die Dopplung gewollt ist, steht am
 * Kopf der Funktion und soll nicht zwischen acht anderen Verantwortungen verschwinden.
 */

/**
 * Die drei Achsen aus §7 der Slice-1-Spezifikation — dieselben Funktionen und derselbe Wortlaut
 * wie in `packages/cli/src/commands/coverage.ts`. Die Website hängt nicht von `packages/cli` ab;
 * die Zahlen kommen deshalb aus dem Katalog, der Satzbau ist eine bewusste Dopplung der dortigen
 * Vorlage und keine zweite Rechnung.
 *
 * Ausdrücklich nicht übernommen: `inventory.unaccounted`, das die CLI als eigene Zeile druckt —
 * die Liste nennt Referenzdateinamen, und die haben im Snapshot nichts zu suchen (Spec §5.3);
 * die Zahl bleibt. `generativeReach().durationMs` bleibt ebenfalls draußen: eine Messzeit machte
 * den Snapshot bei jedem Lauf verschieden. `axis.missing` steht dagegen drin — das sind
 * Taxonomiewerte, keine Dateien.
 */
export function coverageAxes(): CoverageAxis[] {
  const inventory = referenceInventory();
  const excluded = inventory.excludedByDisposition;
  const axes = ruleCoverage();
  const complete = axes.filter((axis) => axis.missing.length === 0);
  const gaps = axes.filter((axis) => axis.missing.length > 0);
  const rules = validationRuleCoverage();
  const reach = generativeReach();

  return [
    {
      label: 'Referenzabdeckung',
      value: inventory.claimed,
      of: inventory.total,
      detail:
        `${inventory.total - inventory.claimed} nicht — ${inventory.outOfScope} außerhalb des ` +
        `Umfangs, ${excluded.example} Beispielanwendungen, ${excluded['overview-sheet']} ` +
        `Übersichtsblatt, ${excluded.deferred} zurückgestellt, ${inventory.unaccounted.length} ` +
        'nicht zugeordnet',
    },
    {
      label: 'Regelabdeckung',
      value: complete.length,
      of: axes.length,
      detail:
        `${rules.total} Validierungsregeln (Testfall je Regel durch core-Test erzwungen)` +
        (gaps.length === 0
          ? ''
          : `; Achsen mit Lücke: ${gaps
              .map(
                (axis) =>
                  `${axis.id} ${axis.exercised.length}/${axis.values.length} ` +
                  `(${axis.missing.join(', ')})`,
              )
              .join('; ')}`),
    },
    {
      label: 'Generative Reichweite',
      value: reach.valid,
      of: reach.enumerated,
      detail:
        `${reach.valid} gültige Kompositionen aus kind × Körpervariante × Organisation × ` +
        `Kopfzone × Fahrwerk (${reach.enumerated} enumeriert), davon ${reach.referenced} in der ` +
        `Referenz belegt — ${reach.reachOnly} erzeugbar ohne Referenzbeleg, ` +
        `${reach.referencedOutsideReach.length} Rezeptsignaturen außerhalb der Stufe ` +
        '(dokumentiert, kein Gate); nicht enumeriert: ' +
        reach.notEnumerated
          .map((axis) =>
            axis.id === 'capabilities'
              ? `${axis.size} Fähigkeiten`
              : axis.id === 'bodyMarks'
                ? `${axis.size} Körpermarken`
                : axis.id === 'functionRole'
                  ? `${axis.size} Funktionsrollen`
                  : 'freie Bezeichnung',
          )
          .join(', '),
    },
  ];
}
