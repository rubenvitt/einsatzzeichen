import { describe, expect, it } from 'vitest';
import type { SymbolSpec } from '@einsatzzeichen/schema';
import { specKey } from './spec-key.js';

// Die Zählung über alle 242 Rezepte steht in conformance/src/combination-provenance.test.ts: `core`
// darf `catalog` nicht importieren (Importgrenze catalog → core).

const base: SymbolSpec = {
  kind: 'formation',
  organization: 'hilfsorganisation',
  strength: 'trupp',
  bodyMarks: ['medical-service', 'care'],
  labels: {
    topLeft: 'Boot',
    aboveLeftMetrics: { capHeightMm: 2.919225, anchorFromBodyLeftMm: -2, baselineFromBodyTopMm: -1 },
  },
};

describe('specKey()', () => {
  it('ist deterministisch und in der Form festgenagelt', () => {
    expect(specKey(base)).toBe(specKey(base));
    expect(specKey(base)).toBe(
      '{"bodyMarks":["care","medical-service"],"kind":"formation",' +
        '"labels":{"aboveLeftMetrics":{"anchorFromBodyLeftMm":-2,"baselineFromBodyTopMm":-1,' +
        '"capHeightMm":2.919225},"topLeft":"Boot"},"organization":"hilfsorganisation",' +
        '"strength":"trupp"}',
    );
  });

  it('hängt nicht von der Schlüsselreihenfolge ab, auch nicht in verschachtelten Objekten', () => {
    const reordered: SymbolSpec = {
      labels: {
        aboveLeftMetrics: { baselineFromBodyTopMm: -1, capHeightMm: 2.919225, anchorFromBodyLeftMm: -2 },
        topLeft: 'Boot',
      },
      bodyMarks: ['medical-service', 'care'],
      strength: 'trupp',
      organization: 'hilfsorganisation',
      kind: 'formation',
    };
    expect(specKey(reordered)).toBe(specKey(base));
  });

  it('liest bodyMarks und capabilities als Multimenge (Belegstellen im Modulkommentar)', () => {
    expect(specKey({ ...base, bodyMarks: ['care', 'medical-service'] })).toBe(specKey(base));
    expect(specKey({ kind: 'formation', capabilities: ['fire-fighting', 'decontamination'] }))
      .toBe(specKey({ kind: 'formation', capabilities: ['decontamination', 'fire-fighting'] }));
    // Doppelte bleiben erhalten: keine stille Gleichsetzung von ['a', 'a'] und ['a'].
    expect(specKey({ kind: 'formation', bodyMarks: ['care', 'care'] }))
      .not.toBe(specKey({ kind: 'formation', bodyMarks: ['care'] }));
  });

  it('behandelt ein Feld mit undefined wie ein fehlendes Feld', () => {
    expect(specKey({ ...base, designation: undefined, bodyVariant: undefined })).toBe(specKey(base));
    expect(specKey({ ...base, labels: { ...base.labels, center: undefined } })).toBe(specKey(base));
  });

  it('liest keine geerbten Eigenschaften', () => {
    const inherited = Object.create({ designation: 'GEERBT' }) as Record<string, unknown>;
    Object.assign(inherited, base);
    expect(specKey(inherited as unknown as SymbolSpec)).toBe(specKey(base));
  });

  it('unterscheidet Specs, die sich in genau einem Wert unterscheiden', () => {
    const variants: SymbolSpec[] = [
      base,
      { ...base, strength: 'gruppe' },
      { ...base, organization: 'feuerwehr' },
      { ...base, bodyMarks: ['care'] },
      { ...base, bodyMarks: [] },
      { ...base, bodyMarks: undefined },
      { ...base, labels: { ...base.labels, topLeft: 'WRZ' } },
      { ...base, labels: { topLeft: 'Boot' } },
      { ...base, designation: 'Boot' },
      {
        ...base,
        labels: {
          ...base.labels,
          aboveLeftMetrics: { capHeightMm: 2.9, anchorFromBodyLeftMm: -2, baselineFromBodyTopMm: -1 },
        },
      },
    ];
    expect(new Set(variants.map(specKey)).size).toBe(variants.length);
  });

  it('lässt Reihenfolge in anderen Arrays gelten und verweigert nicht endliche Zahlen', () => {
    // Nur die Spec-Felder bodyMarks und capabilities sind Mengen; ein gleichnamiges Feld tiefer im
    // Baum nicht. Der Cast bildet einen Wert, den der Typ heute nicht vorsieht.
    const nested = (marks: string[]) =>
      specKey({ kind: 'formation', labels: { bodyMarks: marks } } as unknown as SymbolSpec);
    expect(nested(['a', 'b'])).not.toBe(nested(['b', 'a']));
    expect(() => specKey({
      ...base,
      labels: { centerCapHeightMm: Number.NaN },
    })).toThrow(/nicht endliche Zahl/);
  });
});
