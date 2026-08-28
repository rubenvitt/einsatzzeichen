import { describe, expect, it } from 'vitest';
import { CompositionError, VALIDATION_RULE_IDS } from '@einsatzzeichen/core';
import { composeFromCatalog } from '@einsatzzeichen/catalog/src/recipes.js';
import type { SymbolSpec } from '@einsatzzeichen/schema';
import {
  COMPOSITION_RULE_EXPLANATIONS,
  RULE_EXPLANATIONS,
  explainIssue,
} from './rule-explanations.js';

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

  it('reicht konkrete Werte in der Meldung unverändert durch', () => {
    const id = VALIDATION_RULE_IDS[0];
    const message = 'Breite 14.5 mm überschreitet 14.327 mm';
    expect(explainIssue({ rule: id, message })).toMatchObject({ rule: id, message });
  });
});

/**
 * Die sechs Kennungen, die `assertTextRunsFit()` in `packages/core/src/compose.ts` bildet: drei
 * Präfixe × zwei Endungen. Aufgezählt, weil `core` sie nicht exportiert — gegengeprüft werden sie
 * unten über den echten Kompositionsweg, nicht gegen diese Liste.
 */
const COMPOSITION_RULE_IDS = ['designation', 'label', 'function-role-run'].flatMap((prefix) => [
  `${prefix}-too-wide`,
  `${prefix}-unknown-glyph`,
]);

/** Wirft die Komposition und gibt die Meldungen zurück; alles andere ist ein Testfehler. */
function issuesOf(spec: SymbolSpec) {
  try {
    composeFromCatalog(spec);
  } catch (error) {
    if (error instanceof CompositionError) return error.issues;
    throw error;
  }
  throw new Error(`Diese Spec komponierte, statt abzulehnen: ${JSON.stringify(spec)}`);
}

describe('COMPOSITION_RULE_EXPLANATIONS', () => {
  it('erklärt genau die sechs Kennungen aus assertTextRunsFit', () => {
    expect(Object.keys(COMPOSITION_RULE_EXPLANATIONS).sort()).toEqual(
      [...COMPOSITION_RULE_IDS].sort(),
    );
  });

  it('führt zu jeder Regel einen Titel und zwei bis vier Sätze', () => {
    for (const id of COMPOSITION_RULE_IDS) {
      const entry = COMPOSITION_RULE_EXPLANATIONS[id];
      expect(entry.title.trim(), id).not.toBe('');
      expect(entry.explanation.length, id).toBeGreaterThan(40);
      expect(entry.explanation, id).not.toMatch(/TODO|TBD/);
      expect(sentenceCount(entry.explanation), id).toBeGreaterThanOrEqual(2);
      expect(sentenceCount(entry.explanation), id).toBeLessThanOrEqual(4);
    }
  });

  it('überschneidet sich nicht mit der Prüftabelle', () => {
    // Sonst antworteten zwei Einträge auf dieselbe Kennung, und die Reihenfolge in
    // `explainIssue` träfe stillschweigend eine Entscheidung.
    const validation = new Set(Object.keys(RULE_EXPLANATIONS));
    expect(Object.keys(COMPOSITION_RULE_EXPLANATIONS).filter((id) => validation.has(id))).toEqual(
      [],
    );
  });
});

/**
 * Der eigentliche Gattertest: nicht die Tabelle gegen die eigene Liste, sondern gegen die
 * Kennung, die `compose()` wirklich wirft. Benennt der Kern ein Präfix um, fällt das hier auf.
 *
 * Vier der sechs Kennungen sind so erreichbar. `function-role-run-too-wide` und
 * `function-role-run-unknown-glyph` sind es nicht: die Läufe stammen aus `layout.roleRuns` und
 * `layout.carrierRun` der vermessenen Funktionsfassung, also aus Katalogdaten, die die
 * Katalogtests bereits gegen dasselbe Gate halten. Ein Fall dafür ließe sich nur konstruieren,
 * indem der Test eine kaputte Fassung erfindet — das belegte dann die Erfindung, nicht den Kern.
 */
describe('Kompositionsregeln über den echten Weg', () => {
  const cases: [string, SymbolSpec, string][] = [
    ['zu breite Fußzone', { kind: 'formation', designation: 'x'.repeat(40) }, 'designation-too-wide'],
    ['Fußzone ohne Vorschub', { kind: 'formation', designation: '🚒' }, 'designation-unknown-glyph'],
    [
      'zu breiter Beschriftungslauf',
      { kind: 'formation', labels: { center: 'x'.repeat(40) } },
      'label-too-wide',
    ],
    [
      'Beschriftungslauf ohne Vorschub',
      { kind: 'formation', labels: { center: '🚒' } },
      'label-unknown-glyph',
    ],
  ];

  for (const [name, spec, expectedRule] of cases) {
    it(`${name} wirft ${expectedRule} und wird erklärt`, () => {
      const issues = issuesOf(spec);
      expect(issues.map((issue) => issue.rule)).toContain(expectedRule);
      for (const issue of issues) {
        const explained = explainIssue(issue);
        expect(explained.title.trim(), issue.rule).not.toBe('');
        expect(explained.explanation.length, issue.rule).toBeGreaterThan(40);
        expect(explained.message, issue.rule).toBe(issue.message);
      }
    });
  }
});
