import { describe, expect, it } from 'vitest';
import { VALIDATION_RULE_IDS } from '@einsatzzeichen/core';
import { RULE_EXPLANATIONS, explainIssue } from './rule-explanations.js';

/** Sätze zählen: Punkt, Frage- oder Ausrufezeichen gefolgt von Leerraum. */
function sentenceCount(text: string): number {
  return text.trim().split(/(?<=[.!?])\s+/).length;
}

describe('RULE_EXPLANATIONS', () => {
  it('erklärt jede Regel-ID und keine erfundene', () => {
    expect(Object.keys(RULE_EXPLANATIONS).sort()).toEqual([...VALIDATION_RULE_IDS].sort());
    for (const id of VALIDATION_RULE_IDS) {
      expect(RULE_EXPLANATIONS[id].explanation.length).toBeGreaterThan(40);
      expect(RULE_EXPLANATIONS[id].explanation).not.toMatch(/TODO|TBD/);
    }
  });

  it('führt zu jeder Regel einen Titel und zwei bis vier Sätze', () => {
    for (const id of VALIDATION_RULE_IDS) {
      const entry = RULE_EXPLANATIONS[id];
      expect(entry.title.trim(), id).not.toBe('');
      expect(sentenceCount(entry.explanation), id).toBeGreaterThanOrEqual(2);
      expect(sentenceCount(entry.explanation), id).toBeLessThanOrEqual(4);
    }
  });
});

describe('explainIssue', () => {
  it('gibt die Originalmeldung mit', () => {
    const id = VALIDATION_RULE_IDS[0];
    expect(explainIssue({ rule: id, message: 'x' })).toMatchObject({ rule: id, message: 'x' });
  });

  it('ergänzt Titel und Erklärung der Regel', () => {
    const id = 'strength-requires-unit';
    expect(explainIssue({ rule: id, message: 'y' })).toEqual({
      rule: id,
      message: 'y',
      title: RULE_EXPLANATIONS[id].title,
      explanation: RULE_EXPLANATIONS[id].explanation,
    });
  });

  it('wirft bei einer unbekannten Regel-ID statt eine Erklärung zu erfinden', () => {
    expect(() => explainIssue({ rule: 'gibt-es-nicht', message: 'z' }))
      .toThrow(/gibt-es-nicht/);
  });
});
