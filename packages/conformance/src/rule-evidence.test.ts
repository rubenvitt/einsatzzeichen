import { describe, expect, it } from 'vitest';
import { COMPOSITION_RULE_CATALOG, RULE_CATALOG, validateSpec } from '@einsatzzeichen/core';
import { RULE_EVIDENCE, RULE_EVIDENCE_GAPS, ruleEvidenceTriggers } from './rule-evidence.js';

const catalogIds = [...RULE_CATALOG, ...COMPOSITION_RULE_CATALOG].map((rule) => rule.id);
const evidenceIds = RULE_EVIDENCE.map((item) => item.rule);
const gapIds = RULE_EVIDENCE_GAPS.map((gap) => gap.rule);

describe('RULE_EVIDENCE', () => {
  // Das eigentliche Gate: jeder Fall wird ausgeführt. Ein Fall, dessen Regel nicht feuert, fällt
  // hier einzeln mit seiner Kennung auf.
  it.each(RULE_EVIDENCE.map((item) => [item.rule, item] as const))('%s: der Fall löst die Regel aus', (_rule, item) => {
    expect(ruleEvidenceTriggers(item)).toContain(item.rule);
  });

  it('ist mengengleich mit beiden Regelkatalogen, zusammen mit den Lücken', () => {
    const covered = new Set([...evidenceIds, ...gapIds]);
    expect(catalogIds.filter((id) => !covered.has(id)), 'im Katalog, ohne Fall und ohne Lücke').toEqual([]);
    expect([...covered].filter((id) => !catalogIds.includes(id)).sort(), 'Fall oder Lücke ohne Katalogregel').toEqual([]);
    expect(gapIds.filter((id) => evidenceIds.includes(id)), 'zugleich Fall und Lücke').toEqual([]);
  });

  it('führt je Regel genau einen Fall, alphabetisch', () => {
    expect(evidenceIds).toEqual([...new Set(evidenceIds)].sort());
    expect(RULE_EVIDENCE).toHaveLength(74);
  });

  it('nagelt die Lücken fest', () => {
    expect(gapIds).toEqual([
      'function-role-label-metrics-required',
      'function-role-run-too-wide',
      'function-role-run-unknown-glyph',
      'surface-right-label-requires-measured-anchor',
    ]);
    for (const gap of RULE_EVIDENCE_GAPS) {
      expect(gap.reason.length, gap.rule).toBeGreaterThan(40);
      expect(gap.location, gap.rule).toMatch(/^packages\//);
    }
  });

  it('belegt Beschreibungsregeln an der Beschreibung und Kompositionsregeln erst in der Komposition', () => {
    const phase = new Map([...RULE_CATALOG, ...COMPOSITION_RULE_CATALOG].map((rule) => [rule.id, rule.phase]));
    for (const item of RULE_EVIDENCE) {
      if (phase.get(item.rule) === 'composition') {
        expect(item.via, item.rule).toBe('composeFromCatalog');
        // Die Beschreibung selbst ist gültig; erst der gesetzte Lauf verletzt die Regel.
        expect(validateSpec(item.spec), item.rule).toEqual([]);
      } else {
        expect(item.via, item.rule).not.toBe('composeFromCatalog');
      }
    }
  });

  it('nennt die Fälle, die den Katalogkontext brauchen', () => {
    // Genau diese drei Funktionsrollenregeln feuern ohne vermessene Fassung nicht (ohne Kontext
    // meldet validateSpec stattdessen `function-role-requires-measured-layout`). Die beiden
    // übrigen `validateSpec+catalog`-Fälle feuern auch ohne Kontext.
    const needsCatalog = RULE_EVIDENCE
      .filter((item) => item.via === 'validateSpec+catalog')
      .filter((item) => !validateSpec(item.spec).some((issue) => issue.rule === item.rule))
      .map((item) => item.rule);
    expect(needsCatalog).toEqual([
      'function-role-body-mark-mismatch',
      'function-role-head-mismatch',
      'function-role-organization-mismatch',
    ]);
  });

  it('meldet in 68 von 74 Fällen nur die eigene Regel', () => {
    // Randregeln verletzen oft eine allgemeinere mit. Die sechs Fälle, die zusätzlich eine
    // andere Regel melden, stehen hier, damit ein neuer Mitläufer auffällt.
    const withOthers = RULE_EVIDENCE
      .filter((item) => new Set(ruleEvidenceTriggers(item)).size > 1)
      .map((item) => item.rule);
    expect(withOthers).toEqual([
      'center-baseline-positive',
      'colored-circle-top-left-not-measured',
      'function-role-body-variant-not-measured',
      'function-role-requires-measured-kind',
      'surface-label-foot-conflict',
      'top-left-metrics-complete',
    ]);
  });
});
