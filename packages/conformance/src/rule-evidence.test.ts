import { describe, expect, it } from 'vitest';
import {
  COMPOSITION_RULE_CATALOG,
  CompositionError,
  FREESTANDING_RULE_CATALOG,
  RULE_CATALOG,
  drawFreestanding,
  validateSpec,
} from '@einsatzzeichen/core';
import {
  FREESTANDING_RULE_EVIDENCE,
  RULE_EVIDENCE,
  RULE_EVIDENCE_GAPS,
  freestandingRuleEvidenceTriggers,
  ruleEvidenceTriggers,
} from './rule-evidence.js';

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
    // 50 Prüfregeln und sechs Kompositionsregeln, abzüglich der drei Lücken. Bis zum 2. Oktober 2026
    // 81; die Messsperren sind dem Ableiten gewichen
    // (docs/decisions/2026-10-02-ableiten-statt-messsperre.md).
    expect(RULE_EVIDENCE).toHaveLength(53);
  });

  it('nagelt die Lücken fest', () => {
    expect(gapIds).toEqual([
      'function-role-label-metrics-required',
      'function-role-run-too-wide',
      'function-role-run-unknown-glyph',
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
    // Genau diese zwei Funktionsrollenregeln feuern ohne vermessene Fassung nicht (ohne Kontext
    // meldet validateSpec stattdessen `function-role-requires-measured-layout`); es sind zugleich
    // die einzigen `validateSpec+catalog`-Fälle. `function-role-body-mark-mismatch` ist am
    // 2. Oktober 2026 entfallen: Körpermarken stehen seitdem auch im Rollenkörper.
    const needsCatalog = RULE_EVIDENCE
      .filter((item) => item.via === 'validateSpec+catalog')
      .filter((item) => !validateSpec(item.spec).some((issue) => issue.rule === item.rule))
      .map((item) => item.rule);
    expect(needsCatalog).toEqual([
      'function-role-head-mismatch',
      'function-role-organization-mismatch',
    ]);
  });

  it('meldet in 49 von 53 Fällen nur die eigene Regel', () => {
    // Randregeln verletzen oft eine allgemeinere mit. Die vier Fälle, die zusätzlich eine
    // andere Regel melden, stehen hier, damit ein neuer Mitläufer auffällt. Seit dem 2. Oktober
    // 2026 entfallen `colored-circle-top-left-not-measured` und
    // `function-role-body-variant-not-measured` mit ihren Regeln. `below-body-zone-conflict` meldet
    // die Läufe unter dem Körper allein; `chassis-foot-conflict` bleibt bei Fahrwerk und Bezeichnung.
    const withOthers = RULE_EVIDENCE
      .filter((item) => new Set(ruleEvidenceTriggers(item)).size > 1)
      .map((item) => item.rule);
    expect(withOthers).toEqual([
      'center-baseline-positive',
      'function-role-requires-measured-kind',
      'surface-label-foot-conflict',
      'top-left-metrics-complete',
    ]);
  });
});

describe('FREESTANDING_RULE_EVIDENCE', () => {
  // Dasselbe Gate für die freistehende Spec-Art (LFH-577): je Regel ein Fall, zur Laufzeit
  // ausgelöst, und keine Regel ohne Fall.
  it.each(FREESTANDING_RULE_EVIDENCE.map((item) => [item.rule, item] as const))('%s: der Fall löst die Regel aus', (_rule, item) => {
    expect(freestandingRuleEvidenceTriggers(item)).toEqual([item.rule]);
  });

  it('ist mengengleich mit FREESTANDING_RULE_CATALOG, alphabetisch, ohne Lücke', () => {
    const ids = FREESTANDING_RULE_EVIDENCE.map((item) => item.rule);
    expect(ids).toEqual(FREESTANDING_RULE_CATALOG.map((rule) => rule.id));
    expect(ids).toEqual([...new Set(ids)].sort());
  });

  it('lehnt jeden Fall auch beim Zeichnen mit derselben Regel ab', () => {
    for (const item of FREESTANDING_RULE_EVIDENCE) {
      let caught: unknown;
      try {
        drawFreestanding(item.spec);
      } catch (error) {
        caught = error;
      }
      expect(caught, item.rule).toBeInstanceOf(CompositionError);
      expect((caught as CompositionError).issues.map((issue) => issue.rule), item.rule).toEqual([item.rule]);
    }
  });
});
