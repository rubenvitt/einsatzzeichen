import type { PlannedRule } from './planned-state-rules.js';

/**
 * Vorgemerkte Regeln für mehrere Fähigkeiten in einem Zeichen (LFH-567). Kennung und Inhalt
 * stehen fest, geprüft wird noch nichts.
 *
 * **Warum sie nicht im Regelkatalog stehen.** Anders als bei Kapitel 5.8 fehlt kein Spec-Feld:
 * `capabilities` und `bodyMarks` gibt es. `validateSpec` könnte beide Regeln sofort prüfen. Aber
 * beide lehnen Specs ab, die der Motor heute zeichnet (zwei Boxpiktogramme nebeneinander, Box- und
 * randbündige Fassung übereinander). Einen solchen Funktionsverlust entscheidet der Eigentümer,
 * nicht ein Datenslice. Die Frage steht in
 * `docs/decisions/2026-09-28-lfh-567-mehrfachfaehigkeiten-und-sonderformen.md` §5.
 *
 * Mit der Entscheidung wandern die Einträge in `RULE_CATALOG` und in `validate.ts`;
 * `planned-capability-rules.test.ts` erzwingt, dass eine Kennung dann hier verschwindet.
 */
function planned(id: string, reason: string): PlannedRule {
  return Object.freeze({ id, kind: 'systematik', dimension: 'capabilities', reason, ticket: 'LFH-567' });
}

export const PLANNED_CAPABILITY_RULES: readonly PlannedRule[] = Object.freeze([
  planned(
    'capabilities-box-limit-exceeded',
    'Die Boxfassung trägt höchstens eine Fähigkeit; kein Original zeigt, wie die Systematik zwei Piktogramme in der Box anordnet (der Motor stellt sie seit dem 2. Oktober 2026 abgeleitet nebeneinander).',
  ),
  planned(
    'capabilities-presentation-mixed',
    'Ein Zeichen trägt seine Fähigkeiten entweder in der Boxfassung oder randbündig; beide zugleich legten das Boxpiktogramm über die randbündigen Marken, und kein Original zeigt das.',
  ),
]);
