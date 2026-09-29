import { describe, expect, it } from 'vitest';
import { STATE_GROUPS } from '../blocks/state-groups.js';
import { VALIDATION_RULE_IDS } from '../validation-rules.js';
import { PLANNED_STATE_RULES, RETIRED_STATE_RULES } from './planned-state-rules.js';
import {
  RULE_DIMENSION_GAPS,
  RULE_DIMENSIONS,
  RULE_CATALOG,
  ruleCatalogEntry,
} from './rule-catalog.js';

/**
 * Die vorgemerkten Regeln aus Kapitel 5.8 (LFH-565). Sie sind **nicht in Kraft**; dieser Test hält
 * die Grenze zum Regelkatalog in beide Richtungen fest. Seit LFH-577 stehen zwei davon im Katalog,
 * eine ist gestrichen.
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

  it('führt seit LFH-577 nur noch die Trägerregel der Tendenz', () => {
    expect(PLANNED_STATE_RULES.map((rule) => rule.id)).toEqual(['tendency-carrier-not-allowed']);
  });

  it('streicht die Tendenzgrenze mit Grund und hält sie aus Katalog und Planliste heraus', () => {
    expect(RETIRED_STATE_RULES.map((rule) => rule.id)).toEqual(['tendency-limit-exceeded']);
    for (const rule of RETIRED_STATE_RULES) {
      expect(rule.reason.trim(), rule.id).not.toBe('');
      expect(ruleCatalogEntry(rule.id), rule.id).toBeUndefined();
      expect(PLANNED_STATE_RULES.some((planned) => planned.id === rule.id), rule.id).toBe(false);
    }
  });

  it('führt jede Regelkennung der Zustandsgruppen im Katalog, vorgemerkt oder gestrichen', () => {
    for (const group of STATE_GROUPS) {
      for (const id of [group.rules.carrier, group.rules.limit]) {
        const places = [
          RULE_CATALOG.find((rule) => rule.id === id),
          PLANNED_STATE_RULES.find((rule) => rule.id === id),
          RETIRED_STATE_RULES.find((rule) => rule.id === id),
        ].filter((place) => place !== undefined);
        expect(places, `${group.id}: ${id}`).toHaveLength(1);
        expect(places[0]?.dimension, `${group.id}: ${id}`).toBe(group.category);
      }
    }
  });

  it('wird von mindestens einer Zustandsgruppe benutzt', () => {
    const used = new Set(STATE_GROUPS.flatMap((group) => [group.rules.carrier, group.rules.limit]));
    expect(PLANNED_STATE_RULES.map((rule) => rule.id).filter((id) => !used.has(id))).toEqual([]);
  });
});
