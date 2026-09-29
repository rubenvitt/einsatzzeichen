import { describe, expect, it } from 'vitest';
import * as core from '@einsatzzeichen/core';
import { CompositionError } from '@einsatzzeichen/core';
import { composeFromCatalog } from '@einsatzzeichen/conformance/src/recipes.js';
import type { SymbolSpec } from '@einsatzzeichen/schema';
import {
  COMPOSITION_RULE_EXPLANATIONS,
  RULE_EXPLANATIONS,
  RULE_FIELDS,
  explainIssue,
} from './rule-explanations.js';

/**
 * Seit LFH-579 liegen die Regeltexte im Kern (`packages/core/src/rules/rule-explanations.ts`);
 * dort stehen auch die Gates — Vollständigkeit gegen `VALIDATION_RULE_IDS` und den Regelkatalog
 * in beide Richtungen, Feldzuordnung, Satzzahl und die Fingerabdrücke der 28 Erklärungen, aus
 * denen der Katalog seine Begründung bezieht. Diese Datei prüft nur noch, dass die Website
 * Konsument ist: dieselben Objekte, keine zweite Abschrift, die auseinanderlaufen könnte.
 */
describe('Die Website bezieht die Regeltexte aus dem Kern', () => {
  it('reicht die Tabellen und explainIssue unverändert durch', () => {
    expect(RULE_EXPLANATIONS).toBe(core.RULE_EXPLANATIONS);
    expect(COMPOSITION_RULE_EXPLANATIONS).toBe(core.COMPOSITION_RULE_EXPLANATIONS);
    expect(RULE_FIELDS).toBe(core.RULE_FIELDS);
    expect(explainIssue).toBe(core.explainIssue);
  });
});

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
