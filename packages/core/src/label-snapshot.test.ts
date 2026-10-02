import { describe, expect, it } from 'vitest';
import type { SymbolSpec } from '@einsatzzeichen/schema';
import { plainLabelValue } from './label-snapshot.js';
import { validateSpec } from './validate.js';

describe('Labelschnappschuss der eingesenkten Hülle', () => {
  it('kopiert einfache Werte, Felder und Metrikobjekte eingefroren', () => {
    expect(plainLabelValue('MzB')).toEqual({ value: 'MzB' });
    const lines = plainLabelValue(['A', 'B']);
    expect(lines?.value).toEqual(['A', 'B']);
    expect(Object.isFrozen(lines?.value)).toBe(true);
    const metrics = plainLabelValue({ capHeightMm: 2.9, baselineFromBodyTopMm: 5, anchorFromBodyLeftMm: 1.5 });
    expect(metrics?.value).toEqual({ capHeightMm: 2.9, baselineFromBodyTopMm: 5, anchorFromBodyLeftMm: 1.5 });
    expect(Object.isFrozen(metrics?.value)).toBe(true);
  });

  it('lehnt Accessoren, fremde Prototypen und verschachtelte Objekte ab', () => {
    const accessor = Object.defineProperty({}, 'capHeightMm', { enumerable: true, get: () => 2.9 });
    expect(plainLabelValue(accessor)).toBeUndefined();
    expect(plainLabelValue(new (class Metrics { capHeightMm = 2.9 })())).toBeUndefined();
    expect(plainLabelValue({ nested: { capHeightMm: 2.9 } })).toBeUndefined();
    expect(plainLabelValue([['A']])).toBeUndefined();
  });

  it('hält die Härtung an der eingesenkten Hülle auch in Metrikobjekten', () => {
    const accessor = Object.defineProperty(
      { capHeightMm: 2.9, baselineFromBodyTopMm: 5 },
      'anchorFromBodyLeftMm',
      { enumerable: true, get: () => 1.5 },
    );
    const spec = {
      kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'hilfsorganisation',
      labels: { topLeft: 'MzB', topLeftMetrics: accessor },
    } as unknown as SymbolSpec;
    expect(validateSpec(spec).map((issue) => issue.rule)).toContain('inset-hull-requires-center-label-only');
  });
});
