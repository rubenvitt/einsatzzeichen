import type { PlannedRule } from './planned-state-rules.js';
import type { RuleDimension } from './rule-catalog.js';

/**
 * Vorgemerkte Regeln für die parametrisierten Bausteine aus 5.2 und Kapitel 2 (LFH-566). Kennung
 * und Inhalt stehen fest, `validateSpec` prüft noch nichts: `SymbolSpec` hat für Pfeile und Linien
 * kein Feld, das kommt mit LFH-577. Aus demselben Grund wie bei `PLANNED_STATE_RULES` stehen die
 * Kennungen deshalb nicht im Regelkatalog.
 *
 * `lineDrawing` lehnt eine Stärke an der falschen Linie schon heute ab, aber als ungültige Eingabe
 * der Zeichenfunktion und ohne Kennung. Als Regel mit Kennung und erklärbarer Ablehnung prüft sie
 * erst `validateSpec`.
 */
function planned(id: string, dimension: RuleDimension, reason: string): PlannedRule {
  return Object.freeze({ id, kind: 'systematik', dimension, reason, ticket: 'LFH-577' });
}

export const PLANNED_PARAMETRIC_RULES: readonly PlannedRule[] = Object.freeze([
  planned(
    'movement-carrier-not-allowed',
    'movement',
    'Ein Pfeil aus 5.2 beginnt nur an den Grundzeichen, die sein Baustein zulässt; an jedem anderen hätte die Anbindung keine belegte Lage.',
  ),
  planned(
    'movement-anchor-conflict',
    'movement',
    'Ein Pfeil bindet nicht an einer Körperkante an, die schon eine Zustands- oder Tendenzrandlage trägt; zwei Bausteine an derselben Stelle sind eine Zonenkollision.',
  ),
  planned(
    'line-anchor-not-allowed',
    'lines-and-boundaries',
    'Linien und Grenzen aus Kapitel 2 liegen frei auf der Lagekarte und binden an kein Grundzeichen an.',
  ),
  planned(
    'line-strength-mismatch',
    'lines-and-boundaries',
    'Die taktische Stärke gehört nur an 2.20 Grenze mit taktischer Stärke: dort ist sie Pflicht, an jeder anderen Linie ein Fehler.',
  ),
]);
