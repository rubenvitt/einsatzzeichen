import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { FREESTANDING_RULE_IDS } from './freestanding-rules.js';
import { VALIDATION_RULE_IDS } from './validation-rules.js';

const here = dirname(fileURLToPath(import.meta.url));

/** Derselbe Quelltextscan wie `validation-rules.test.ts`, auf die Prüfstelle der freistehenden Zeichen. */
function ruleIdsInSource(file: string): Set<string> {
  const source = readFileSync(join(here, file), 'utf8');
  return new Set([...source.matchAll(/rule: '([a-z0-9-]+)'/g)].map((match) => match[1] as string));
}

describe('FREESTANDING_RULE_IDS', () => {
  it('ist mengengleich mit den rule-Literalen in validate-freestanding.ts', () => {
    const inSource = ruleIdsInSource('validate-freestanding.ts');
    const listed = new Set(FREESTANDING_RULE_IDS);
    expect([...inSource].filter((id) => !listed.has(id)).sort(), 'im Quelltext, nicht in der Liste').toEqual([]);
    expect([...listed].filter((id) => !inSource.has(id)).sort(), 'in der Liste, nicht im Quelltext').toEqual([]);
  });

  it('ist alphabetisch sortiert und frei von Dubletten', () => {
    expect([...FREESTANDING_RULE_IDS]).toEqual([...new Set(FREESTANDING_RULE_IDS)].sort());
  });

  it('überschneidet sich nicht mit den Regeln der SymbolSpec', () => {
    const symbol = new Set(VALIDATION_RULE_IDS);
    expect(FREESTANDING_RULE_IDS.filter((id) => symbol.has(id))).toEqual([]);
  });

  it('zählt die Regeln der freistehenden Zeichen', () => {
    expect(FREESTANDING_RULE_IDS).toHaveLength(6);
  });

  it('kommt mit jeder Kennung in einem Testfall vor', () => {
    const tested = readFileSync(join(here, 'validate-freestanding.test.ts'), 'utf8');
    expect(FREESTANDING_RULE_IDS.filter((id) => !tested.includes(`'${id}'`))).toEqual([]);
  });
});
