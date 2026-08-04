import { describe, expect, it } from 'vitest';
import { mmToUnits, unitsEqual, unitsToMm, UNITS_PER_MM } from './units.js';

describe('units', () => {
  it('rechnet 1 mm in 2,8346 SVG-Einheiten um', () => {
    expect(UNITS_PER_MM).toBeCloseTo(2.8346456693, 9);
  });

  it('trifft die Grundfläche der Referenz (32 mm = 90.709)', () => {
    expect(unitsEqual(mmToUnits(32), 90.709)).toBe(true);
  });

  it('trifft die Strichstärke der Referenz (0,5 mm = 1.417)', () => {
    expect(unitsEqual(mmToUnits(0.5), 1.417)).toBe(true);
  });

  it('trifft den Körper der Referenz (30 x 20 mm = 85.04 x 56.693)', () => {
    expect(unitsEqual(mmToUnits(30), 85.04)).toBe(true);
    expect(unitsEqual(mmToUnits(20), 56.693)).toBe(true);
  });

  it('trifft die Körperposition mit Kopfzone (9 mm = 25.512)', () => {
    expect(unitsEqual(mmToUnits(9), 25.512)).toBe(true);
  });

  it('toleriert das Exportrauschen der Referenz (2.834 und 2.835)', () => {
    expect(unitsEqual(mmToUnits(1), 2.834)).toBe(true);
    expect(unitsEqual(mmToUnits(1), 2.835)).toBe(true);
  });

  it('lehnt Abweichungen oberhalb der Toleranz ab', () => {
    expect(unitsEqual(90.709, 90.72)).toBe(false);
  });

  it('ist umkehrbar', () => {
    expect(unitsToMm(mmToUnits(17.5))).toBeCloseTo(17.5, 10);
  });
});
