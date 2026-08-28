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

  it('below-right-label-requires-measured-body: belowRight an der Formation, die kein solches Profil hat', () => {
    expect(rules({ kind: 'formation', labels: { belowRight: 'X' } })).toContain(
      'below-right-label-requires-measured-body',
    );
  });

  it('bottom-center-label-requires-measured-body: bottomCenter am Landfahrzeug ohne vermessene Zone', () => {
    expect(rules({ kind: 'vehicle-land', labels: { bottomCenter: 'X' } })).toContain(
      'bottom-center-label-requires-measured-body',
    );
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

  it('colored-circle-top-left-not-measured: topLeft am vermessenen farbigen Kreisvertrag', () => {
    expect(
      rules({
        kind: 'circle-12',
        organization: 'zivile-einheiten',
        bodyMarks: ['spontaneous-helper-collection-arrow'],
        labels: { topLeft: 'X' },
      }),
    ).toContain('colored-circle-top-left-not-measured');
  });

  it('surface-label-foot-conflict: Bezeichnung und schwarzer Oberflächenlauf zugleich', () => {
    expect(
      rules({ kind: 'vehicle-air', bodyVariant: 'raised-hull', designation: 'A', labels: { surfaceBelowRight: 'B' } }),
    ).toContain('surface-label-foot-conflict');
  });

  // Die Regel verlangt ein Profil, das `surfaceLabels` führt, aber keinen rechten Anker
  // vermessen hat. Beide Profile mit `surfaceLabels` (angehobener Luftfahrzeugrumpf F.2.7,
  // um 1 mm angehobener 12-mm-Kreis) tragen einen rechten Anker; der linke fehlt nur am
  // Luftfahrzeug, was `surface-left-label-requires-measured-anchor` deckt. Die rechte Regel ist
  // damit aus einer `SymbolSpec` heraus derzeit nicht auslösbar — sie ist die Symmetrie zur
  // linken für ein künftiges Profil und bleibt hier als benanntes Todo, nicht als stiller
  // Fehlbestand.
  it.todo('surface-right-label-requires-measured-anchor: kein Profil mit surfaceLabels ohne rechten Anker');

  it('top-left-metrics-required-by-profile: topLeft am Flächenflügler ohne Metriksatz', () => {
    expect(
      rules({ kind: 'vehicle-air', bodyVariant: 'fixed-wing-hull', labels: { topLeft: 'X' } }),
    ).toContain('top-left-metrics-required-by-profile');
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
