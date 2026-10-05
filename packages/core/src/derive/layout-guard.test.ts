import { describe, expect, it } from 'vitest';
import type { SymbolSpec } from '@einsatzzeichen/schema';
import { drawSymbol } from '../default-ports.js';
import { NotMeasuredError } from '../not-measured.js';

describe('Platzprüfung abgeleiteter Zeichnungen', () => {
  it.each([
    // Kopf und Giebel verkleinern die Raute so weit, dass die Eckkürzel an ihrer Untergrenze
    // (`derive/run-scaling.ts`) in den mittigen Lauf reichen. Seit LFH-987 folgen die Läufe dem
    // Körper; erst hier bleibt die Lücke.
    [{ kind: 'person', bodyVariant: 'raised-gable', administrativeLevel: 'europaeische-union', labels: { center: 'AB', topLeft: 'C', bottomLeft: 'D', bottomRight: 'E' } }, /überlappen/],
    [{ kind: 'vehicle-water', bodyVariant: 'foot-band', administrativeLevel: 'gemeinde', labels: { center: 'LST', bottomRight: 'UEL' } }, /überlappen/],
    // Der neun Millimeter hohe EU-Kopf über der Zustandsfassung der Gefahr.
    [{ kind: 'hazard', administrativeLevel: 'europaeische-union', states: ['suspected-situation'] }, /ragt über die Zeichenfläche/],
  ] as const)('lehnt %j als Lücke ab, statt falsch zu zeichnen', (spec, reason) => {
    expect(() => drawSymbol(spec as unknown as SymbolSpec)).toThrow(NotMeasuredError);
    expect(() => drawSymbol(spec as unknown as SymbolSpec)).toThrow(reason);
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
