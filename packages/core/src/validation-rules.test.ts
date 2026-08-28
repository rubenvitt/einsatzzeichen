import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { VALIDATION_RULE_IDS } from './validation-rules.js';

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Quelltextscan statt Import: die Kennungen sind in `validate.ts` Inline-Literale an ihrer
 * Prüfung und werden nirgends als Wert exportiert. Der Scan liest genau das Muster
 * `rule: '<kennung>'`, das jede Prüfung verwendet — ein anders geschriebenes Literal
 * (Template, Variable) fiele durch und bräche diesen Test in Richtung „Liste zu lang"
 * oder „Liste zu kurz"; beides ist gewollt.
 */
function ruleIdsInSource(file: string): Set<string> {
  const source = readFileSync(join(here, file), 'utf8');
  return new Set([...source.matchAll(/rule: '([a-z0-9-]+)'/g)].map((match) => match[1] as string));
}

describe('VALIDATION_RULE_IDS', () => {
  it('ist mengengleich mit den rule-Literalen in validate.ts', () => {
    const inSource = ruleIdsInSource('validate.ts');
    const listed = new Set(VALIDATION_RULE_IDS);
    expect([...inSource].filter((id) => !listed.has(id)).sort(), 'im Quelltext, nicht in der Liste').toEqual([]);
    expect([...listed].filter((id) => !inSource.has(id)).sort(), 'in der Liste, nicht im Quelltext').toEqual([]);
  });

  it('ist alphabetisch sortiert und frei von Dubletten', () => {
    expect([...VALIDATION_RULE_IDS]).toEqual([...new Set(VALIDATION_RULE_IDS)].sort());
  });

  it('zählt die Regeln des Kernslices', () => {
    // Wächst mit `validate.ts`. Die Zahl steht hier, damit `rule-coverage` im Katalog sie nicht
    // erraten muss und eine neue Regel sichtbar hier und in der Liste ankommt.
    expect(VALIDATION_RULE_IDS).toHaveLength(72);
  });

  it('kommt mit jeder Kennung in einem Testfall vor — oder in einem benannten Todo', () => {
    // Die Testfälle liegen in zwei Dateien: die gewachsene `validate.test.ts` und die mit
    // LFH-413 ergänzte `validation-rules.cases.test.ts` für die Regeln, die dort fehlten.
    // Geprüft wird das Vorkommen der Kennung als String-Literal im Quelltext der Testdatei;
    // die Fälle in `validation-rules.cases.test.ts` lösen jede Regel tatsächlich mit
    // `validateSpec` aus. Eine Regel, die aus einer `SymbolSpec` heraus derzeit nicht auslösbar
    // ist, steht dort als `it.todo('<kennung>: …')` — sie zählt hier ausdrücklich **nicht** als
    // getestet, sondern als benannte Lücke, und die Liste der Lücken ist unten festgenagelt.
    const cases = readFileSync(join(here, 'validation-rules.cases.test.ts'), 'utf8');
    const tested = readFileSync(join(here, 'validate.test.ts'), 'utf8') + cases;
    const todo = new Set([...cases.matchAll(/it\.todo\('([a-z0-9-]+):/g)].map((m) => m[1] as string));
    const untested = VALIDATION_RULE_IDS.filter(
      (id) => !tested.includes(`'${id}'`) && !todo.has(id),
    );
    expect(untested).toEqual([]);
    expect([...todo].sort()).toEqual(['surface-right-label-requires-measured-anchor']);
  });
});
