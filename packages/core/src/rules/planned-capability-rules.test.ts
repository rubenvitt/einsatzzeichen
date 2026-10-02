import { describe, expect, it } from 'vitest';
import { VALIDATION_RULE_IDS } from '../validation-rules.js';
import { PLANNED_CAPABILITY_RULES } from './planned-capability-rules.js';
import { PLANNED_STATE_RULES } from './planned-state-rules.js';
import { RULE_DIMENSION_GAPS, ruleCatalogEntry } from './rule-catalog.js';

/**
 * Die vorgemerkten Regeln der Mehrfachfähigkeiten (LFH-567). Sie sind **nicht in Kraft**; dieser
 * Test hält die Grenze zum Regelkatalog in beide Richtungen fest, wie für Kapitel 5.8.
 */
describe('Vorgemerkte Regeln für mehrere Fähigkeiten', () => {
  it('hat eindeutige Kennungen mit Begründung, Ticket und Dimension', () => {
    const ids = PLANNED_CAPABILITY_RULES.map((rule) => rule.id);
    expect(ids).toEqual(['capabilities-box-limit-exceeded', 'capabilities-presentation-mixed']);
    for (const rule of PLANNED_CAPABILITY_RULES) {
      expect(rule.id, rule.id).toMatch(/^[a-z0-9-]+$/);
      expect(rule.reason.trim(), rule.id).not.toBe('');
      expect(rule.ticket, rule.id).toBe('LFH-567');
      expect(rule.dimension, rule.id).toBe('capabilities');
      expect(rule.kind, rule.id).toBe('systematik');
    }
  });

  it('steht weder im Regelkatalog noch in der Liste der geprüften Regeln', () => {
    for (const rule of PLANNED_CAPABILITY_RULES) {
      expect(ruleCatalogEntry(rule.id), rule.id).toBeUndefined();
      expect(VALIDATION_RULE_IDS as readonly string[], rule.id).not.toContain(rule.id);
    }
  });

  it('überschneidet sich nicht mit den vorgemerkten Regeln aus Kapitel 5.8', () => {
    const state = new Set(PLANNED_STATE_RULES.map((rule) => rule.id));
    expect(PLANNED_CAPABILITY_RULES.filter((rule) => state.has(rule.id))).toEqual([]);
  });

  // Von LFH-587 (29.09.2026) bis zum 2. Oktober 2026 trug die Dimension Regeln in Kraft, zuletzt
  // `capabilities-pictogram-has-measured-rendition` und `capabilities-pictogram-overflows-body`.
  // Beide betrafen die Einsetzbarkeit eines einzelnen Piktogramms; seit „ableiten statt ablehnen“
  // zeichnet der Motor sie. Für die Anordnung mehrerer gelten die vorgemerkten Regeln weiter.
  it('gilt nur, solange der Katalog die Anordnung mehrerer Boxfähigkeiten als Lücke führt', () => {
    const gap = RULE_DIMENSION_GAPS.find((candidate) => candidate.dimension === 'capabilities');
    expect(gap?.coverage).toBe('partial');
    expect(gap?.note).toContain('PLANNED_CAPABILITY_RULES');
  });
});
