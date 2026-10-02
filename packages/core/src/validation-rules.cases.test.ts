import { describe, expect, it } from 'vitest';
import type { SymbolSpec } from '@einsatzzeichen/schema';
import { validateSpec } from './validate.js';

/**
 * Testfälle für die Regeln, die `validate.test.ts` vor LFH-413 nicht auslöste. Jeder Fall
 * löst seine Regel tatsächlich mit `validateSpec` aus; die Set-Gleichheit „Regel ↔ Testfall"
 * hält `validation-rules.test.ts`. Die Fälle prüfen bewusst mit `toContain` und nicht
 * `toEqual`: eine Spec, die eine Randregel auslöst, verletzt oft zugleich eine allgemeinere,
 * und hier interessiert nur, dass die genannte Regel feuert.
 */
function rules(spec: SymbolSpec): string[] {
  return validateSpec(spec).map((issue) => issue.rule);
}

describe('Validierungsregeln ohne Fall in validate.test.ts', () => {
  it('above-left-metrics-within-viewbox: aboveLeft-Metriken mit Anker rechts außerhalb der Profilbox', () => {
    expect(
      rules({
        kind: 'vehicle-air',
        bodyVariant: 'raised-hull',
        labels: {
          aboveLeft: 'ITH',
          aboveLeftMetrics: { capHeightMm: 2.5, baselineFromBodyTopMm: 0, anchorFromBodyLeftMm: 100 },
        },
      }),
    ).toContain('above-left-metrics-within-viewbox');
  });

  it('above-left-label-head-conflict: Lauf oberhalb links neben einer Stärke', () => {
    expect(rules({ kind: 'formation', strength: 'gruppe', labels: { aboveLeft: 'ITH' } })).toContain(
      'above-left-label-head-conflict',
    );
  });

  it('below-body-zone-conflict: Fahrwerk und Lauf unterhalb rechts zugleich', () => {
    expect(
      rules({ kind: 'vehicle-land', vehicleCategory: 'kfz-kategorie-1', labels: { belowRight: 'THW' } }),
    ).toContain('below-body-zone-conflict');
  });

  it('center-baseline-positive: mittige Grundlinie 0 mm', () => {
    expect(
      rules({ kind: 'formation', labels: { center: 'X', centerBaselineFromBodyBottomMm: 0 } }),
    ).toContain('center-baseline-positive');
  });

  it('center-label-within-body: mittige Grundlinie weit über der Körperoberkante', () => {
    expect(
      rules({ kind: 'formation', labels: { center: 'X', centerBaselineFromBodyBottomMm: 100 } }),
    ).toContain('center-label-within-body');
  });

  it('surface-label-foot-conflict: Bezeichnung und schwarzer Oberflächenlauf zugleich', () => {
    expect(
      rules({ kind: 'vehicle-air', bodyVariant: 'raised-hull', designation: 'A', labels: { surfaceBelowRight: 'B' } }),
    ).toContain('surface-label-foot-conflict');
  });

  it('top-left-metrics-within-body: topLeft-Metriken am Flächenflügler mit Anker außerhalb der Hülle', () => {
    expect(
      rules({
        kind: 'vehicle-air',
        bodyVariant: 'fixed-wing-hull',
        labels: {
          topLeft: 'X',
          topLeftMetrics: { capHeightMm: 2.5, baselineFromBodyTopMm: 7, anchorFromBodyLeftMm: 100 },
        },
      }),
    ).toContain('top-left-metrics-within-body');
  });
});
