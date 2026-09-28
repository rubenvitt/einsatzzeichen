import { describe, expect, it } from 'vitest';
import { STATE_GROUPS } from '../blocks/state-groups.js';
import { VALIDATION_RULE_IDS } from '../validation-rules.js';
import { PLANNED_STATE_RULES } from './planned-state-rules.js';
import {
  RULE_DIMENSION_GAPS,
  RULE_DIMENSIONS,
  ruleCatalogEntry,
} from './rule-catalog.js';

/**
 * Die vorgemerkten Regeln aus Kapitel 5.8 (LFH-565). Sie sind **nicht in Kraft**; dieser Test hält
 * die Grenze zum Regelkatalog in beide Richtungen fest.
 */
describe('Vorgemerkte Regeln für Kapitel 5.8', () => {
  it('hat eindeutige Kennungen mit Begründung und Ticket', () => {
    const ids = PLANNED_STATE_RULES.map((rule) => rule.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const rule of PLANNED_STATE_RULES) {
      expect(rule.id, rule.id).toMatch(/^[a-z0-9-]+$/);
      expect(rule.reason.trim(), rule.id).not.toBe('');
      expect(rule.ticket, rule.id).toBe('LFH-577');
      expect(RULE_DIMENSIONS, rule.id).toContain(rule.dimension);
    }
  });

  it('steht weder im Regelkatalog noch in der Liste der geprüften Regeln', () => {
    for (const rule of PLANNED_STATE_RULES) {
      expect(ruleCatalogEntry(rule.id), rule.id).toBeUndefined();
      expect(VALIDATION_RULE_IDS as readonly string[], rule.id).not.toContain(rule.id);
    }
  });

  it('gilt nur für Dimensionen, die der Katalog weiter als regellos führt', () => {
    for (const rule of PLANNED_STATE_RULES) {
      const gap = RULE_DIMENSION_GAPS.find((candidate) => candidate.dimension === rule.dimension);
      expect(gap?.coverage, rule.id).toBe('none');
    }
  });

  it('wird von mindestens einer Zustandsgruppe benutzt', () => {
    const used = new Set(STATE_GROUPS.flatMap((group) => [group.rules.carrier, group.rules.limit]));
    expect(PLANNED_STATE_RULES.map((rule) => rule.id).filter((id) => !used.has(id))).toEqual([]);
  });
});
