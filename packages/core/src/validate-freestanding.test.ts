import type { FreestandingSpec } from '@einsatzzeichen/schema';
import { describe, expect, it } from 'vitest';
import { validateFreestandingSpec } from './validate-freestanding.js';

const LINE_PATH = { points: [[1, 16], [47, 16]] } as const;
const ARROW_PATH = { points: [[2, 16], [30, 16]] } as const;

function rulesOf(spec: FreestandingSpec): string[] {
  return validateFreestandingSpec(spec).map((issue) => issue.rule);
}

describe('validateFreestandingSpec', () => {
  it('lässt die Parametersätze der Referenz ohne Befund durch', () => {
    const valid: FreestandingSpec[] = [
      { kind: 'movement', movement: 'directed-movement', path: ARROW_PATH },
      { kind: 'line', line: 'boundary-section', path: LINE_PATH },
      { kind: 'line', line: 'boundary-with-strength', path: LINE_PATH, strength: 'zug' },
      { kind: 'line', line: 'escape-route', path: LINE_PATH, variant: 'alternative' },
      { kind: 'weather', values: ['weather-sunny'] },
      { kind: 'weather', values: ['weather-cloudy', 'weather-snowing'], intensity: 'weak' },
      { kind: 'animal-state', state: 'contaminated-animal', variant: 'alternative' },
      { kind: 'animal-state', state: 'dead-animal', variant: 'primary' },
    ];
    for (const spec of valid) expect(rulesOf(spec), JSON.stringify(spec)).toEqual([]);
  });

  describe('line-strength-mismatch', () => {
    it('verlangt die Stärke an 2.20', () => {
      expect(rulesOf({ kind: 'line', line: 'boundary-with-strength', path: LINE_PATH })).toEqual([
        'line-strength-mismatch',
      ]);
    });

    it('lehnt eine Stärke an jeder anderen Linie ab', () => {
      const issues = validateFreestandingSpec({ kind: 'line', line: 'boundary-section', path: LINE_PATH, strength: 'zug' });
      expect(issues.map((issue) => issue.rule)).toEqual(['line-strength-mismatch']);
      expect(issues[0]?.message).toContain('boundary-section');
    });
  });

  it('line-variant-not-available: eine zweite Darstellung gibt es nur an 2.14', () => {
    expect(rulesOf({ kind: 'line', line: 'fire-spread', path: LINE_PATH, variant: 'alternative' })).toEqual([
      'line-variant-not-available',
    ]);
  });

  it('animal-state-variant-not-available: eine zweite Darstellung gibt es nur an 5.8.6.2', () => {
    expect(rulesOf({ kind: 'animal-state', state: 'sick-animal', variant: 'alternative' })).toEqual([
      'animal-state-variant-not-available',
    ]);
  });

  it('weather-value-duplicate: ein Wetterwert steht höchstens einmal', () => {
    expect(rulesOf({ kind: 'weather', values: ['weather-cloudy', 'weather-cloudy'] })).toEqual([
      'weather-value-duplicate',
    ]);
  });

  it('weather-values-exceed-limit: höchstens die Wolke und ein Niederschlag', () => {
    expect(
      rulesOf({ kind: 'weather', values: ['weather-cloudy', 'weather-snowing', 'weather-rainy'], intensity: 'weak' }),
    ).toEqual(['weather-values-exceed-limit']);
  });

  it('weather-intensity-without-precipitation: Intensität nur am Niederschlag unter der Wolke', () => {
    expect(rulesOf({ kind: 'weather', values: ['weather-snowing'], intensity: 'strong' })).toEqual([
      'weather-intensity-without-precipitation',
    ]);
    expect(rulesOf({ kind: 'weather', values: ['weather-sunny', 'weather-windy'], intensity: 'weak' })).toEqual([
      'weather-intensity-without-precipitation',
    ]);
  });

  it('meldet eine nicht vermessene Wetterkombination nicht als Regel', () => {
    // Sonne und Wind zeigt kein Original, verboten ist das Paar nicht: das meldet die Zeichnung
    // als Lücke (`NotMeasuredError`), nicht die Prüfung.
    expect(rulesOf({ kind: 'weather', values: ['weather-sunny', 'weather-windy'] })).toEqual([]);
    expect(rulesOf({ kind: 'weather', values: ['weather-cloudy', 'weather-rainy'] })).toEqual([]);
  });
});
