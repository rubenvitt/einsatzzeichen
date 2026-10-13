import {
  ANIMAL_STATE_IDS,
  PICTOGRAM_IDS,
  STATE_IDS,
  FREESTANDING_KINDS,
  LINE_IDS,
  MOVEMENT_IDS,
  WEATHER_INTENSITIES,
  WEATHER_STATE_IDS,
  type FreestandingSpec,
  type PictogramId,
  type StateId,
  type StrengthId,
  type SymbolSpec,
  type WeatherStateId,
} from '@einsatzzeichen/schema';
import { describe, expect, expectTypeOf, it } from 'vitest';
import * as core from './index.js';
import { drawFreestanding } from './draw-freestanding.js';
import { parseAnySpec } from './spec-codec.js';
import {
  FREESTANDING_FIELD_VALUES,
  FREESTANDING_VOCABULARY_FIELDS,
  checkAnySpec,
  checkSpec,
  freestandingVocabulary,
  type FreestandingFieldValue,
  type FreestandingVocabularyOption,
} from './vocabulary.js';

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
    // Der volle Vorrat aus 5.8 wie im Leser: Werte mit eigener Spec sperrt eine Regel.
    expect(FREESTANDING_FIELD_VALUES.state.state).toEqual({ shape: 'one-of', values: STATE_IDS });
    expect(FREESTANDING_FIELD_VALUES.state.variant).toEqual({ shape: 'one-of', values: ['primary', 'alternative'] });
    expect(FREESTANDING_FIELD_VALUES.pictogram.pictogram).toEqual({ shape: 'one-of', values: PICTOGRAM_IDS });
  });

  it('nennt nur Werte, die der Leser annimmt', () => {
    // Derselbe Abgleich wie für SPEC_FIELD_VALUES: beide Vorräte dürfen nicht auseinanderlaufen.
    for (const value of FREESTANDING_FIELD_VALUES.line.strength.values) {
      expect(() => parseAnySpec({ kind: 'line', line: 'boundary-with-strength', path: LINE_PATH, strength: value })).not.toThrow();
    }
    for (const value of FREESTANDING_FIELD_VALUES.weather.values.values) {
      expect(() => parseAnySpec({ kind: 'weather', values: [value] })).not.toThrow();
    }
    for (const value of FREESTANDING_FIELD_VALUES.state.state.values) {
      expect(() => parseAnySpec({ kind: 'state', state: value })).not.toThrow();
    }
    for (const value of FREESTANDING_FIELD_VALUES.pictogram.pictogram.values) {
      expect(() => parseAnySpec({ kind: 'pictogram', pictogram: value })).not.toThrow();
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

/** Kennungen je Befund: erlaubt, abgeleitet erlaubt oder die Regeln der Sperre. */
function verdicts<V extends string>(options: readonly FreestandingVocabularyOption<V>[]): Record<string, string> {
  return Object.fromEntries(
    options.map((option) => [
      option.value,
      option.status === 'allowed'
        ? option.derived === true
          ? 'derived'
          : 'allowed'
        : option.reason === 'rule'
          ? option.issues.map((issue) => issue.rule).join('+')
          : 'not-measured',
    ]),
  );
}

describe('FREESTANDING_VOCABULARY_FIELDS (LFH-804)', () => {
  it('nennt je Art die Felder mit aufzählbarem Vorrat, ohne kind', () => {
    expect(FREESTANDING_VOCABULARY_FIELDS).toEqual({
      movement: ['movement'],
      line: ['line', 'strength', 'variant'],
      weather: ['values', 'intensity'],
      'animal-state': ['state', 'variant'],
      state: ['state', 'variant'],
      pictogram: ['pictogram', 'variant'],
    });
  });
});

describe('freestandingVocabulary (LFH-804)', () => {
  it('sperrt im Zustand genau die Werte mit eigener Spec, mit Regel und Erklärung', () => {
    const options = freestandingVocabulary({ kind: 'state', state: 'tactical-rescue' }, 'state');
    expect(options.map((option) => option.value)).toEqual(STATE_IDS);
    expect(options.filter((option) => option.status === 'allowed')).toHaveLength(31);
    const blocked = options.filter((option) => option.status === 'blocked');
    expect(blocked).toHaveLength(30);
    for (const option of blocked) {
      if (option.reason !== 'rule') throw new Error('Regel erwartet');
      expect(option.issues.map((issue) => [issue.rule, issue.field, issue.dimension])).toEqual([
        ['state-not-canonical', 'state', 'state'],
      ]);
    }
    expect(options.filter((option) => option.selected).map((option) => option.value)).toEqual(['tactical-rescue']);
  });

  it('sperrt im Piktogramm state.* und die Leitstelle', () => {
    const options = freestandingVocabulary({ kind: 'pictogram', pictogram: 'comms.voice' }, 'pictogram');
    expect(options).toHaveLength(PICTOGRAM_IDS.length);
    const blocked = options.filter((option) => option.status === 'blocked').map((option) => option.value);
    expect(blocked).toHaveLength(62);
    expect(blocked).toContain('leadership.control-center');
    expect(blocked.filter((id) => !id.startsWith('state.'))).toEqual(['leadership.control-center']);
  });

  it('bietet die Altzeichen aus DV 102 Kapitel 8 an, mit beiden Darstellungen (ESZ-137)', () => {
    const options = freestandingVocabulary({ kind: 'pictogram', pictogram: 'comms.voice' }, 'pictogram');
    for (const id of ['comms.teleprinter-transmission', 'comms.still-image-transmission'] as const) {
      expect(options.find((option) => option.value === id)?.status, id).toBe('allowed');
      expect(verdicts(freestandingVocabulary({ kind: 'pictogram', pictogram: id }, 'variant')), id).toEqual({
        primary: 'allowed',
        alternative: 'allowed',
      });
    }
  });

  it('fragt die Variante gegen das Register', () => {
    expect(verdicts(freestandingVocabulary({ kind: 'state', state: 'tactical-attack' }, 'variant'))).toEqual({
      primary: 'allowed',
      alternative: 'state-variant-not-available',
    });
    expect(verdicts(freestandingVocabulary({ kind: 'pictogram', pictogram: 'comms.voice' }, 'variant'))).toEqual({
      primary: 'allowed',
      alternative: 'allowed',
    });
    expect(verdicts(freestandingVocabulary({ kind: 'animal-state', state: 'sick-animal' }, 'variant'))).toEqual({
      primary: 'allowed',
      alternative: 'animal-state-variant-not-available',
    });
  });

  it('hängt an der Liste der Wetterwerte an und markiert Abgeleitetes', () => {
    const verdict = verdicts(freestandingVocabulary({ kind: 'weather', values: ['weather-cloudy'] }, 'values'));
    // Die Wolke ist gesetzt: ihr Befund ist der der Spec, wie sie ist.
    expect(verdict['weather-cloudy']).toBe('allowed');
    // Wolke und Schnee ohne Intensität zeigt kein Original; die Zeichnung ordnet sie als Paar an.
    expect(verdict['weather-snowing']).toBe('derived');
    expect(verdict['weather-sunny']).toBe('derived');
  });

  it('prüft die Intensität am Paar', () => {
    expect(
      verdicts(freestandingVocabulary({ kind: 'weather', values: ['weather-cloudy', 'weather-snowing'] }, 'intensity')),
    ).toEqual({ weak: 'allowed', moderate: 'allowed', strong: 'allowed', extreme: 'allowed' });
    expect(
      verdicts(freestandingVocabulary({ kind: 'weather', values: ['weather-sunny'] }, 'intensity')).weak,
    ).toBe('weather-intensity-without-precipitation');
  });

  it('prüft die Stärke an der Linie', () => {
    expect(
      verdicts(freestandingVocabulary({ kind: 'line', line: 'boundary-with-strength', path: LINE_PATH, strength: 'zug' }, 'strength')),
    ).toEqual({ trupp: 'derived', staffel: 'derived', gruppe: 'derived', zug: 'allowed' });
    expect(
      Object.values(verdicts(freestandingVocabulary({ kind: 'line', line: 'boundary-section', path: LINE_PATH }, 'strength'))),
    ).toEqual(['line-strength-mismatch', 'line-strength-mismatch', 'line-strength-mismatch', 'line-strength-mismatch']);
  });

  it('prüft nur die gewünschten Kandidaten, in ihrer Reihenfolge', () => {
    const options = freestandingVocabulary({ kind: 'pictogram', pictogram: 'comms.voice' }, 'pictogram', {
      candidates: ['leadership.guide-post', 'state.route-closed'],
    });
    expect(verdicts(options)).toEqual({ 'leadership.guide-post': 'allowed', 'state.route-closed': 'pictogram-not-canonical' });
  });

  it('wirft bei einem Feld ohne Vorrat, bei kind und bei einem Wert außerhalb des Vorrats', () => {
    const spec: FreestandingSpec = { kind: 'movement', movement: 'directed-movement', path: { points: [[2, 16], [30, 16]] } };
    // @ts-expect-error — der Verlauf ist eine Zahlenangabe, kein Vorrat.
    expect(() => freestandingVocabulary(spec, 'path')).toThrow(RangeError);
    // @ts-expect-error — die Art steht fest: andere Arten haben andere Felder.
    expect(() => freestandingVocabulary({ kind: 'state', state: 'route-closed' }, 'kind')).toThrow(RangeError);
    // @ts-expect-error — „funk" ist kein Piktogramm.
    expect(() => freestandingVocabulary({ kind: 'pictogram', pictogram: 'comms.voice' }, 'pictogram', { candidates: ['funk'] })).toThrow(
      RangeError,
    );
  });

  it('ist eng getypt: der Befund lässt sich ohne Umwandlung zurückschreiben', () => {
    expectTypeOf<FreestandingFieldValue<'state', 'state'>>().toEqualTypeOf<StateId>();
    expectTypeOf<FreestandingFieldValue<'pictogram', 'pictogram'>>().toEqualTypeOf<PictogramId>();
    expectTypeOf<FreestandingFieldValue<'weather', 'values'>>().toEqualTypeOf<WeatherStateId>();
    expectTypeOf<FreestandingFieldValue<'line', 'strength'>>().toEqualTypeOf<StrengthId>();
    const spec = { kind: 'state', state: 'route-closed' } as const satisfies FreestandingSpec;
    const [first] = freestandingVocabulary(spec, 'state');
    expectTypeOf(first!.value).toEqualTypeOf<StateId>();
    const next: FreestandingSpec = { ...spec, state: first!.value };
    expect(checkAnySpec(next).ok).toBe(true);
  });

  it('ist im Index exportiert', () => {
    expect(core.freestandingVocabulary).toBe(freestandingVocabulary);
    expect(core.FREESTANDING_VOCABULARY_FIELDS).toBe(FREESTANDING_VOCABULARY_FIELDS);
  });
});
