import { describe, expect, it } from 'vitest';
import type { SymbolSpec } from '@einsatzzeichen/schema';
import { drawSymbol } from '../default-ports.js';
import { NotMeasuredError } from '../not-measured.js';

describe('Platzprüfung abgeleiteter Zeichnungen', () => {
  it.each([
    // Kopf und Giebel verkleinern den Körper, der mittige Lauf behält seine Normgröße.
    [{ kind: 'formation', bodyVariant: 'raised-gable', strength: 'trupp', labels: { center: 'AB' } }, /breiter oder höher als der Körper/],
    // Eckkürzel und mittiger Lauf auf dem verkleinerten Körper.
    [{ kind: 'formation', bodyVariant: 'raised-gable', administrativeLevel: 'gemeinde', labels: { center: 'AB', topLeft: 'C' } }, /überlappen/],
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
