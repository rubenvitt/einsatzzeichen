import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { GrammarEvidence, GrammarFinding, SymbolSpec } from '@einsatzzeichen/schema';
import { BODY_MARK_COMBINATION_OVERRIDES } from '../geometry/body-marks.js';
import { PLANNED_CAPABILITY_RULES } from '../rules/planned-capability-rules.js';
import { validateSpec } from '../validate.js';
import {
  CAPABILITY_COMBINATION_EXCEPTIONS,
  CAPABILITY_COMBINATION_RULES,
  capabilityCombinationForm,
  capabilityCombinationRule,
} from './capability-combinations.js';

/**
 * Gate der Mehrfachfähigkeiten (LFH-567) in `core`: Form der Daten, die benannten Ausnahmen gegen
 * die Kombinationsfassungen in `body-marks.ts`, und die Zusage „vorgemerkt, nicht in Kraft" gegen
 * `validateSpec`. Die Fixtures gegen die Rezepte prüft `conformance`.
 */

const PACKAGES = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const REPO = resolve(PACKAGES, '..');

/** `definedAt` ist relativ zu `packages/`, Entscheidungsnotizen relativ zum Repository. */
function pathOf(definedAt: string): { file: string; lines?: [number, number] } {
  const [path = '', range] = definedAt.split(':');
  const file = path.startsWith('docs/') ? resolve(REPO, path) : resolve(PACKAGES, path);
  if (range === undefined) return { file };
  const [from, to = from] = range.split('–').map(Number);
  return { file, lines: [from ?? 0, to ?? 0] };
}

function evidenceOf(finding: GrammarFinding<unknown>): readonly GrammarEvidence[] {
  return finding.status === 'evidenced' ? finding.evidence : [];
}

function findingsOf(
  rule: (typeof CAPABILITY_COMBINATION_RULES)[number],
): readonly GrammarFinding<unknown>[] {
  return [
    rule.arrangement,
    rule.order,
    rule.maxObserved,
    rule.perSign,
    rule.otherForms,
  ];
}

describe('Regeln für mehrere Fähigkeiten', () => {
  it('führt je Darstellung genau eine Regel am richtigen Spec-Feld', () => {
    expect(CAPABILITY_COMBINATION_RULES.map((rule) => [rule.presentation, rule.field])).toEqual([
      ['flush', 'bodyMarks'],
      ['box', 'capabilities'],
    ]);
    expect(capabilityCombinationRule('box').field).toBe('capabilities');
  });

  it('belegt die Überlagerung randbündig und lässt die Boxfassung offen', () => {
    const flush = capabilityCombinationRule('flush');
    expect(flush.arrangement).toMatchObject({ status: 'evidenced', value: 'overlay' });
    expect(flush.order).toMatchObject({ status: 'evidenced', value: 'irrelevant' });
    expect(flush.maxObserved).toMatchObject({ status: 'evidenced', value: 3 });

    const box = capabilityCombinationRule('box');
    expect(box.arrangement.status).toBe('open');
    expect(box.perSign).toMatchObject({ status: 'proposed', value: 1 });
    expect(box.maxObserved).toMatchObject({ status: 'evidenced', value: 0 });
    expect(box.forms).toEqual([]);
    expect(box.exceptions).toEqual([]);
  });

  it('führt keinen Befund ohne Beleg, Begründung oder Frage', () => {
    for (const rule of CAPABILITY_COMBINATION_RULES) {
      for (const finding of findingsOf(rule)) {
        switch (finding.status) {
          case 'evidenced':
            expect(finding.evidence.length, rule.presentation).toBeGreaterThan(0);
            break;
          case 'proposed':
            expect(finding.reason.trim().length, rule.presentation).toBeGreaterThan(40);
            break;
          case 'open':
            expect(finding.question.trim(), rule.presentation).toMatch(/\?$/u);
            break;
        }
      }
    }
  });

  it('zeigt mit jedem Quelltextbeleg auf eine Datei, die es gibt, und auf Zeilen in ihr', () => {
    for (const rule of CAPABILITY_COMBINATION_RULES) {
      for (const evidence of findingsOf(rule).flatMap(evidenceOf)) {
        if (!('definedAt' in evidence)) continue;
        const { file, lines } = pathOf(evidence.definedAt);
        expect(existsSync(file), evidence.definedAt).toBe(true);
        if (lines === undefined) continue;
        const length = readFileSync(file, 'utf8').split('\n').length;
        expect(lines[0], evidence.definedAt).toBeGreaterThan(0);
        expect(lines[1], evidence.definedAt).toBeLessThanOrEqual(length);
      }
    }
  });

  it('führt jede Körperfassung einmal und jede Fixture an genau einer Stelle', () => {
    const flush = capabilityCombinationRule('flush');
    const keys = flush.forms.map((entry) => `${entry.kind}/${entry.variant ?? '-'}`);
    expect(new Set(keys).size).toBe(keys.length);

    const fixtures = flush.forms.flatMap((entry) => [...entry.fixtures, ...entry.exceptions]);
    expect(new Set(fixtures).size).toBe(fixtures.length);
    // Festgenagelt: 15 Fixtures mit zwei oder mehr Fähigkeiten an sieben Körperfassungen, davon
    // vier als benannte Ausnahme. Die Zählung selbst prüft `conformance` gegen die Rezepte.
    expect(flush.forms).toHaveLength(7);
    expect(fixtures).toHaveLength(15);
    expect(flush.forms.flatMap((entry) => entry.exceptions)).toHaveLength(4);
  });

  it('schlägt die Fassung nach und liefert ohne Beleg nichts', () => {
    expect(capabilityCombinationForm('flush', 'formation')?.fixtures).toContain('F.1.4');
    expect(capabilityCombinationForm('flush', 'vehicle-land', 'plain-wheel-pair')?.exceptions)
      .toEqual(['F.2.5#alternative']);
    expect(capabilityCombinationForm('flush', 'building')).toBeUndefined();
    expect(capabilityCombinationForm('box', 'formation')).toBeUndefined();
  });
});

describe('Benannte Ausnahmen der Überlagerung', () => {
  it('stimmen in beide Richtungen mit den Kombinationsfassungen aus body-marks.ts überein', () => {
    const asKey = (kind: string, variant: string | undefined, marks: readonly string[]) =>
      `${kind}/${variant ?? '-'}/${[...marks].sort().join('+')}`;
    const here = CAPABILITY_COMBINATION_EXCEPTIONS.map((exception) => ({
      key: asKey(exception.kind, exception.variant, exception.marks),
      overrides: [...exception.overrides].sort(),
    }));
    const there = BODY_MARK_COMBINATION_OVERRIDES.map((entry) => ({
      key: asKey(entry.kind, entry.bodyVariant, entry.marks),
      overrides: [...entry.overrides].sort(),
    }));
    expect(here).toEqual(there);
  });

  it('steht an der Körperfassung ihrer Fixture als Ausnahme', () => {
    for (const exception of CAPABILITY_COMBINATION_EXCEPTIONS) {
      const entry = capabilityCombinationForm('flush', exception.kind, exception.variant);
      expect(entry?.exceptions, exception.fixture).toContain(exception.fixture);
      expect(entry?.fixtures, exception.fixture).not.toContain(exception.fixture);
    }
    expect(capabilityCombinationRule('flush').exceptions).toBe(CAPABILITY_COMBINATION_EXCEPTIONS);
  });

  it('nennt ihren Fundort mit Zeilen, die den Eintrag der Fixture tragen', () => {
    for (const exception of CAPABILITY_COMBINATION_EXCEPTIONS) {
      const { file, lines } = pathOf(exception.definedAt);
      expect(lines, exception.definedAt).toBeDefined();
      if (lines === undefined) continue;
      const text = readFileSync(file, 'utf8').split('\n').slice(lines[0] - 1, lines[1]).join('\n');
      expect(text, exception.fixture).toContain(`${exception.fixture}:`);
      for (const mark of exception.marks) {
        expect(text, `${exception.fixture} ${mark}`).toContain(`'${mark}'`);
      }
    }
  });
});

describe('Vorgemerkte Regeln der Mehrfachfähigkeiten sind nicht in Kraft', () => {
  it('benutzt nur vorgemerkte Kennungen, und jede vorgemerkte Kennung wird benutzt', () => {
    const planned = PLANNED_CAPABILITY_RULES.map((rule) => rule.id);
    const used = new Set(CAPABILITY_COMBINATION_RULES.flatMap((rule) => rule.plannedRules));
    expect([...used].filter((id) => !planned.includes(id))).toEqual([]);
    expect(planned.filter((id) => !used.has(id))).toEqual([]);
  });

  it('lässt zwei Boxfähigkeiten heute zu, wie die Daten es beschreiben', () => {
    const spec: SymbolSpec = {
      kind: 'formation',
      organization: 'feuerwehr',
      strength: 'staffel',
      capabilities: ['fire-fighting', 'service-water'],
    };
    expect(validateSpec(spec)).toEqual([]);
  });

  it('lässt Box- und randbündige Fassung zusammen heute zu', () => {
    const spec: SymbolSpec = {
      kind: 'formation',
      organization: 'hilfsorganisation',
      capabilities: ['fire-fighting'],
      bodyMarks: ['medical-service'],
    };
    expect(validateSpec(spec).map((issue) => issue.rule))
      .not.toContain('capabilities-presentation-mixed');
    expect(validateSpec(spec)).toEqual([]);
  });
});
