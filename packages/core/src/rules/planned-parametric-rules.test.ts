import { describe, expect, it } from 'vitest';
import { VALIDATION_RULE_IDS } from '../validation-rules.js';
import { PLANNED_PARAMETRIC_RULES } from './planned-parametric-rules.js';
import { PLANNED_STATE_RULES } from './planned-state-rules.js';
import { RULE_DIMENSION_GAPS, RULE_DIMENSIONS, ruleCatalogEntry } from './rule-catalog.js';

/**
 * Die vorgemerkten Regeln für Pfeile und Linien (LFH-566). Sie sind **nicht in Kraft**; dieser Test
 * hält die Grenze zum Regelkatalog in beide Richtungen fest, wie für Kapitel 5.8.
 */
describe('Vorgemerkte Regeln für 5.2 und Kapitel 2', () => {
  it('hat eindeutige Kennungen mit Begründung und Ticket', () => {
    const ids = PLANNED_PARAMETRIC_RULES.map((rule) => rule.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const rule of PLANNED_PARAMETRIC_RULES) {
      expect(rule.id, rule.id).toMatch(/^[a-z0-9-]+$/);
      expect(rule.reason.trim(), rule.id).not.toBe('');
      expect(rule.ticket, rule.id).toBe('LFH-577');
      expect(RULE_DIMENSIONS, rule.id).toContain(rule.dimension);
    }
  });

  it('überschneidet sich nicht mit den vorgemerkten Regeln aus Kapitel 5.8', () => {
    const state = new Set(PLANNED_STATE_RULES.map((rule) => rule.id));
    expect(PLANNED_PARAMETRIC_RULES.filter((rule) => state.has(rule.id))).toEqual([]);
  });

  it('steht weder im Regelkatalog noch in der Liste der geprüften Regeln', () => {
    for (const rule of PLANNED_PARAMETRIC_RULES) {
      expect(ruleCatalogEntry(rule.id), rule.id).toBeUndefined();
      expect(VALIDATION_RULE_IDS as readonly string[], rule.id).not.toContain(rule.id);
    }
  });

  it('gilt nur für Dimensionen, die der Katalog weiter als regellos führt', () => {
    for (const rule of PLANNED_PARAMETRIC_RULES) {
      const gap = RULE_DIMENSION_GAPS.find((candidate) => candidate.dimension === rule.dimension);
      expect(gap?.coverage, rule.id).toBe('none');
      expect(gap?.note, rule.id).toContain('PLANNED_PARAMETRIC_RULES');
    }
  });
});
