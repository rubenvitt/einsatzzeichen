import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { BodyLabels } from '@einsatzzeichen/schema';
import {
  INPUT_FIELDS,
  NAMED_EXCEPTIONS,
  SPECIAL_VALUE_FIELDS,
  type SpecialValueField,
} from './named-exceptions.js';
import { GRAMMAR_FIXTURES, RECIPES, type Recipe } from './recipes.js';

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const sourceLines = new Map<string, readonly string[]>();
function linesOf(path: string): readonly string[] {
  let lines = sourceLines.get(path);
  if (lines === undefined) {
    lines = readFileSync(`${REPO_ROOT}${path}`, 'utf8').split('\n');
    sourceLines.set(path, lines);
  }
  return lines;
}

const fixtures = Object.entries(GRAMMAR_FIXTURES as Record<string, Recipe>);
const special = new Set<string>(SPECIAL_VALUE_FIELDS);

interface Carried {
  readonly fixture: string;
  readonly field: SpecialValueField;
  readonly value: unknown;
}

/** Was die Fixtures zur Laufzeit tatsächlich tragen — die Gegenseite der Liste. */
function carriedSpecialValues(): Carried[] {
  const carried: Carried[] = [];
  for (const [fixture, recipe] of fixtures) {
    const labels: BodyLabels | undefined = recipe.spec.labels;
    if (labels === undefined) continue;
    for (const field of SPECIAL_VALUE_FIELDS) {
      if (labels[field] !== undefined) carried.push({ fixture, field, value: labels[field] });
    }
  }
  return carried;
}

const id = (fixture: string, field: string): string => `${fixture}/${field}`;

describe('GRAMMAR_FIXTURES', () => {
  it('ist dasselbe Objekt wie RECIPES mit unveränderten 242 Einträgen', () => {
    expect(GRAMMAR_FIXTURES).toBe(RECIPES);
    expect(fixtures).toHaveLength(242);
  });
});

describe('NAMED_EXCEPTIONS: Abgrenzung Sonderwert/Eingabe', () => {
  it('trennt die beiden Feldmengen überschneidungsfrei', () => {
    const input = new Set<string>(INPUT_FIELDS);
    expect(SPECIAL_VALUE_FIELDS.filter((field) => input.has(field))).toEqual([]);
  });

  it('kennt jedes Feld, das irgendeine Fixture in labels setzt', () => {
    const known = new Set<string>([...SPECIAL_VALUE_FIELDS, ...INPUT_FIELDS]);
    const used = new Set<string>();
    for (const [, recipe] of fixtures) {
      for (const key of Object.keys(recipe.spec.labels ?? {})) used.add(key);
    }
    expect([...used].filter((key) => !known.has(key)).sort()).toEqual([]);
  });
});

describe('NAMED_EXCEPTIONS: Gate in beide Richtungen', () => {
  const listed = new Map(NAMED_EXCEPTIONS.map((entry) => [id(entry.fixture, entry.field), entry]));

  it('führt je (Fixture, Feld) höchstens einen Eintrag', () => {
    expect(listed.size).toBe(NAMED_EXCEPTIONS.length);
  });

  it('listet jeden Sonderwert jeder Fixture mit gleichem Wert', () => {
    const missing: string[] = [];
    for (const { fixture, field, value } of carriedSpecialValues()) {
      const entry = listed.get(id(fixture, field));
      if (entry === undefined) {
        missing.push(id(fixture, field));
        continue;
      }
      expect(entry.value, id(fixture, field)).toEqual(value);
    }
    expect(missing).toEqual([]);
  });

  it('führt keinen veralteten Eintrag', () => {
    const recipes = GRAMMAR_FIXTURES as Record<string, Recipe>;
    const stale = NAMED_EXCEPTIONS.filter((entry) => {
      if (!special.has(entry.field)) return true;
      const labels = recipes[entry.fixture]?.spec.labels;
      const carried = labels?.[entry.field];
      if (carried === undefined) return true;
      try {
        expect(carried).toEqual(entry.value);
        return false;
      } catch {
        return true;
      }
    }).map((entry) => id(entry.fixture, entry.field));
    expect(stale).toEqual([]);
  });
});

describe('NAMED_EXCEPTIONS: festgenagelte Zahlen', () => {
  it('zählt 50 Ausnahmen, je Feld festgenagelt', () => {
    const perField = Object.fromEntries(SPECIAL_VALUE_FIELDS.map((field) => [
      field,
      NAMED_EXCEPTIONS.filter((entry) => entry.field === field).length,
    ]));
    expect(perField).toEqual({
      centerCapHeightMm: 16,
      centerBaselineFromBodyBottomMm: 7,
      centerAnchorFromBodyLeftMm: 1,
      centerBoxMarginMm: 2,
      topLeftMetrics: 15,
      aboveLeftMetrics: 4,
      bottomRightMetrics: 1,
      inBodyInk: 4,
    });
    expect(NAMED_EXCEPTIONS).toHaveLength(50);
  });

  it('betrifft genau 37 der 242 Fixtures', () => {
    const affected = [...new Set(NAMED_EXCEPTIONS.map((entry) => entry.fixture))];
    expect(affected).toEqual([
      'E.2.7', 'E.2.8', 'E.2.12', 'E.2.13', 'E.2.16', 'E.2.17', 'E.2.19', 'E.2.20', 'E.2.21',
      'F.2.10', 'F.2.11', 'F.2.12', 'F.2.13', 'F.2.14', 'F.2.16', 'F.2.17',
      'F.3.3', 'F.3.4', 'F.3.5', 'F.3.14',
      'I.1.15', 'I.1.16', 'I.1.17', 'I.1.18',
      'I.2.1', 'I.2.2', 'I.2.3', 'I.2.5', 'I.2.6',
      'I.3.2', 'I.5.2', 'I.5.3',
      'N.1.2', 'N.1.3', 'N.1.4', 'N.1.5', 'N.1.6',
    ]);
    expect(affected).toHaveLength(37);
  });
});

describe('NAMED_EXCEPTIONS: Abschnitt, Fundort und Begründung', () => {
  it.each(NAMED_EXCEPTIONS.map((entry) => [id(entry.fixture, entry.field), entry] as const))(
    '%s nennt Abschnitt, Fundort und Begründung, die im Quelltext stehen',
    (_label, entry) => {
      const recipe = (GRAMMAR_FIXTURES as Record<string, Recipe>)[entry.fixture]!;
      expect(entry.section).toBe(entry.fixture.split('#')[0]);
      expect(recipe.referenceAsset.startsWith(`${entry.section}_`)).toBe(true);

      const found = /^(.+\.ts):(\d+)$/.exec(entry.foundAt);
      expect(found, entry.foundAt).not.toBeNull();
      const line = linesOf(found![1]!)[Number(found![2]) - 1] ?? '';
      expect(line, entry.foundAt).toMatch(new RegExp(`\\b${entry.field}\\s*:`));

      expect(entry.rationale.trim().length).toBeGreaterThan(0);
      for (const reference of entry.rationaleAt.split('; ')) {
        const range = /^(.+?\.(?:ts|md)):(\d+)(?:–(\d+))?$/.exec(reference);
        if (range !== null) {
          const length = linesOf(range[1]!).length;
          const to = Number(range[3] ?? range[2]);
          expect(Number(range[2]), reference).toBeGreaterThan(0);
          expect(to, reference).toBeLessThanOrEqual(length);
          continue;
        }
        const named = /^(.+?\.ts), (?:Test|describe) „(.+)"$/.exec(reference);
        expect(named, reference).not.toBeNull();
        expect(linesOf(named![1]!).join('\n'), reference).toContain(named![2]!);
      }
    },
  );
});
