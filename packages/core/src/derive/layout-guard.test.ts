import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWBOX_MM, type Drawing, type SymbolSpec } from '@einsatzzeichen/schema';
import { drawSymbol } from '../default-ports.js';
import { ARIMO_TEXT_METRICS } from '../geometry/text-metrics.js';
import { NotMeasuredError } from '../not-measured.js';
import { assertDerivedLayoutFits } from './layout-guard.js';

describe('Platzprüfung abgeleiteter Zeichnungen', () => {
  // Die Fälle „Giebel und EU-Kopf an der Person“ und „EU-Kopf über der Zustandsfassung der
  // Gefahr“ standen bis zum Fachreview vom 05.10.2026 (LFH-1064) hier; seitdem lehnt die
  // Systematik sie vorher ab (`raised-gable-requires-stationary-kind`,
  // `administrative-level-requires-carrier`).
  it.each([
    // Das Fußband drückt den mittigen Lauf am Wasserrumpf auf das Eckkürzel.
    [{ kind: 'vehicle-water', bodyVariant: 'foot-band', labels: { center: 'LST', bottomRight: 'UEL' } }, /überlappen/],
    [{ kind: 'swap-loader-vehicle', bodyVariant: 'foot-band', unitGrouping: 'verband-iii', labels: { center: 'LST', bottomRight: 'UEL' } }, /überlappen/],
  ] as const)('lehnt %j als Lücke ab, statt falsch zu zeichnen', (spec, reason) => {
    expect(() => drawSymbol(spec as unknown as SymbolSpec)).toThrow(NotMeasuredError);
    expect(() => drawSymbol(spec as unknown as SymbolSpec)).toThrow(reason);
  });

  it('lehnt eine abgeleitete Zeichnung ab, die über die Zeichenfläche ragt', () => {
    // Keine zulässige Spec erreicht diesen Zweig derzeit; geprüft wird er an der Zeichnung selbst.
    const drawing: Drawing = {
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [{ type: 'rect', role: 'head', x: 10, y: -2, width: 12, height: 4, style: { fill: 'schwarz' } }],
      derivations: [{ dimension: 'administrativeLevel', part: 'Kopf', basis: 'constructed', from: 'Probe' }],
    };
    expect(() => assertDerivedLayoutFits(drawing, ARIMO_TEXT_METRICS)).toThrow(/ragt über die Zeichenfläche/);
    expect(assertDerivedLayoutFits({ ...drawing, derivations: [] }, ARIMO_TEXT_METRICS)).toBeDefined();
  });

  it('lässt die ortsfeste Leitstelle mit Kürzeln und Verwaltungsstufe zeichnen', () => {
    const base = {
      kind: 'circle-12', bodyVariant: 'raised-gable', organization: 'fuehrung-leitung',
      bodyMarks: ['circle-solid-cap-4mm'],
    } as const;
    expect(() => drawSymbol({ ...base, labels: { center: 'LST', bottomRight: 'UEL' } })).not.toThrow();
    expect(() => drawSymbol({ ...base, administrativeLevel: 'kreis', labels: { center: 'ILS' } })).not.toThrow();
    expect(() => drawSymbol({ kind: 'post', organization: 'fuehrung-leitung', labels: { center: 'LST', bottomRight: 'UEL' } }))
      .not.toThrow();
  });

  it('prüft vermessene Zeichnungen nicht', () => {
    // Der Wechsellader E.2.15 setzt seinen Lauf in den L-Rahmen; das Original gilt.
    expect(drawSymbol({ kind: 'swap-loader-vehicle', labels: { center: 'AB' } }).derivations).toBeUndefined();
  });
});
