import {
  ANIMAL_STATE_IDS,
  FREESTANDING_KINDS,
  LINE_IDS,
  MOVEMENT_IDS,
  WEATHER_INTENSITIES,
  WEATHER_STATE_IDS,
  type FreestandingSpec,
  type SymbolSpec,
} from '@einsatzzeichen/schema';
import { describe, expect, it } from 'vitest';
import { drawFreestanding } from './draw-freestanding.js';
import { parseAnySpec } from './spec-codec.js';
import { FREESTANDING_FIELD_VALUES, checkAnySpec, checkSpec } from './vocabulary.js';

const LINE_PATH = { points: [[1, 16], [47, 16]] } as const;

describe('FREESTANDING_FIELD_VALUES', () => {
  it('führt je Art den Wertevorrat ihrer Felder', () => {
    expect(Object.keys(FREESTANDING_FIELD_VALUES)).toEqual([...FREESTANDING_KINDS]);
    expect(FREESTANDING_FIELD_VALUES.movement.movement).toEqual({ shape: 'one-of', values: MOVEMENT_IDS });
    expect(FREESTANDING_FIELD_VALUES.line.line).toEqual({ shape: 'one-of', values: LINE_IDS });
    expect(FREESTANDING_FIELD_VALUES.line.variant).toEqual({ shape: 'one-of', values: ['primary', 'alternative'] });
    expect(FREESTANDING_FIELD_VALUES.weather.values).toEqual({ shape: 'list', values: WEATHER_STATE_IDS });
    expect(FREESTANDING_FIELD_VALUES.weather.intensity).toEqual({ shape: 'one-of', values: WEATHER_INTENSITIES });
    expect(FREESTANDING_FIELD_VALUES['animal-state'].state).toEqual({ shape: 'one-of', values: ANIMAL_STATE_IDS });
    expect(FREESTANDING_FIELD_VALUES.movement.path).toEqual({ shape: 'structured' });
  });

  it('nennt nur Werte, die der Leser annimmt', () => {
    // Derselbe Abgleich wie für SPEC_FIELD_VALUES: beide Vorräte dürfen nicht auseinanderlaufen.
    for (const value of FREESTANDING_FIELD_VALUES.line.strength.values) {
      expect(() => parseAnySpec({ kind: 'line', line: 'boundary-with-strength', path: LINE_PATH, strength: value })).not.toThrow();
    }
    for (const value of FREESTANDING_FIELD_VALUES.weather.values.values) {
      expect(() => parseAnySpec({ kind: 'weather', values: [value] })).not.toThrow();
    }
  });
});

describe('checkAnySpec', () => {
  it('prüft eine SymbolSpec genau wie checkSpec', () => {
    const spec: SymbolSpec = { kind: 'hazard', strength: 'gruppe' };
    expect(checkAnySpec(spec)).toEqual(checkSpec(spec));
  });

  it('gibt für ein gültiges freistehendes Zeichen die Zeichnung zurück', () => {
    const spec: FreestandingSpec = { kind: 'weather', values: ['weather-cloudy', 'weather-rainy'], intensity: 'moderate' };
    expect(checkAnySpec(spec)).toEqual({ ok: true, drawing: drawFreestanding(spec) });
  });

  it('erklärt einen Regelverstoß mit Titel, Feld und Dimension', () => {
    const result = checkAnySpec({ kind: 'weather', values: ['weather-cloudy', 'weather-snowing', 'weather-rainy'] });
    expect(result.ok).toBe(false);
    if (result.ok || result.reason !== 'rule') throw new Error('Regelverstoß erwartet');
    expect(result.issues.map((issue) => [issue.rule, issue.field, issue.dimension])).toEqual([
      ['weather-values-exceed-limit', 'values', 'weather'],
    ]);
  });

  it('zeichnet eine bis zum 02.10.2026 unvermessene Kombination abgeleitet', () => {
    const check = checkAnySpec({ kind: 'line', line: 'boundary-with-strength', path: LINE_PATH, strength: 'gruppe' });
    expect(check.ok).toBe(true);
    if (check.ok) {
      expect(check.drawing.derivations).toEqual([expect.objectContaining({ dimension: 'strength', basis: 'transferred' })]);
    }
  });

  it('lässt einen Verlauf, der nicht passt, als gewöhnlichen Fehler fliegen', () => {
    // Zu kurz für den Pfeilkopf: keine Regel und keine Lücke, sondern eine Eingabe, die die
    // Zeichnung nicht tragen kann.
    expect(() => checkAnySpec({ kind: 'movement', movement: 'directed-movement', path: { points: [[2, 16], [4, 16]] } })).toThrow(
      /Verlauf ist 2\.000 mm lang/,
    );
  });
});
