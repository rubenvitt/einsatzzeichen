import { PICTOGRAM_IDS, STATE_IDS, type FreestandingSpec, type StateId } from '@einsatzzeichen/schema';
import { PLACES } from './places.js';
import { describe, expect, it } from 'vitest';
import { freestandingRedirect, validateFreestandingSpec } from './validate-freestanding.js';

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
      { kind: 'state', state: 'tactical-rescue' },
      { kind: 'state', state: 'hazardous-substances', variant: 'alternative' },
      { kind: 'state', state: 'suspected-situation' },
      { kind: 'state', state: 'route-impassable', variant: 'primary' },
      { kind: 'pictogram', pictogram: 'capability.radioactive-materials', variant: 'alternative' },
      { kind: 'pictogram', pictogram: 'comms.voice', variant: 'alternative' },
      { kind: 'pictogram', pictogram: 'leadership.command-post-in-operation' },
      { kind: 'pictogram', pictogram: 'water-rescue-personnel.team-leader' },
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

describe('Zustand freistehend (LFH-798)', () => {
  const byChapter = (prefix: string): StateId[] =>
    STATE_IDS.filter((value) => {
      const group = value.startsWith('person-')
        ? '5.8.8'
        : value.startsWith('weather-')
          ? '5.8.7'
          : value.endsWith('-animal')
            ? '5.8.6'
            : 'andere';
      return group === prefix;
    });

  it('lässt 5.8.1 bis 5.8.5 und 5.8.9 zu, die Taktiken eingeschlossen', () => {
    const drawable = STATE_IDS.filter((value) => rulesOf({ kind: 'state', state: value }).length === 0);
    expect(drawable).toHaveLength(31);
    expect(drawable).toEqual(expect.arrayContaining(['tactical-rescue', 'tactical-retreat', 'tendency-rising', 'route-closed']));
  });

  describe('state-not-canonical', () => {
    it('verweist den Tierzustand 5.8.6 auf animal-state', () => {
      for (const state of byChapter('5.8.6')) {
        expect(rulesOf({ kind: 'state', state }), state).toEqual(['state-not-canonical']);
        expect(freestandingRedirect({ kind: 'state', state })).toEqual({ kind: 'animal-state', state });
      }
      expect(freestandingRedirect({ kind: 'state', state: 'contaminated-animal', variant: 'alternative' })).toEqual({
        kind: 'animal-state',
        state: 'contaminated-animal',
        variant: 'alternative',
      });
    });

    it('verweist das Wetter 5.8.7 auf weather', () => {
      for (const state of byChapter('5.8.7')) {
        expect(rulesOf({ kind: 'state', state }), state).toEqual(['state-not-canonical']);
        expect(freestandingRedirect({ kind: 'state', state })).toEqual({ kind: 'weather', values: [state] });
      }
    });

    it('verweist den Personenzustand 5.8.8 auf die Person mit states', () => {
      expect(byChapter('5.8.8')).toHaveLength(17);
      for (const state of byChapter('5.8.8')) {
        expect(rulesOf({ kind: 'state', state }), state).toEqual(['state-not-canonical']);
        expect(freestandingRedirect({ kind: 'state', state })).toEqual({ kind: 'person', states: [state] });
      }
    });

    it('verweist die Hinweis-Alternativen 5.8.1.13/14 auf die Gefahr mit states', () => {
      for (const state of ['suspected-situation', 'acute-situation'] as const) {
        const spec: FreestandingSpec = { kind: 'state', state, variant: 'alternative' };
        expect(rulesOf(spec), state).toEqual(['state-not-canonical']);
        expect(freestandingRedirect(spec)).toEqual({ kind: 'hazard', states: [state] });
        expect(freestandingRedirect({ kind: 'state', state })).toBeUndefined();
      }
    });

    it('nennt die Spec, die das Bild trägt, in der Meldung', () => {
      const [issue] = validateFreestandingSpec({ kind: 'state', state: 'person-dead' });
      expect(issue?.message).toContain('{"kind":"person","states":["person-dead"]}');
    });
  });

  it('state-variant-not-available: eine zweite Darstellung nur, wo das Register eine führt', () => {
    expect(rulesOf({ kind: 'state', state: 'tactical-attack', variant: 'alternative' })).toEqual([
      'state-variant-not-available',
    ]);
    expect(rulesOf({ kind: 'state', state: 'radioactivity-hazard', variant: 'alternative' })).toEqual([]);
  });

  it('leitet zulässige Werte und die anderen Arten nicht um', () => {
    expect(freestandingRedirect({ kind: 'state', state: 'tactical-rescue' })).toBeUndefined();
    expect(freestandingRedirect({ kind: 'weather', values: ['weather-sunny'] })).toBeUndefined();
  });
});

describe('Piktogramm freistehend (LFH-798/LFH-834)', () => {
  it('lässt jede Kennung außer state.* und der Leitstelle zu', () => {
    const drawable = PICTOGRAM_IDS.filter((id) => rulesOf({ kind: 'pictogram', pictogram: id }).length === 0);
    // 195 Kennungen der Baseline und die zwei Altzeichen aus DV 102 Kapitel 8 (ESZ-137).
    expect(drawable).toHaveLength(197);
    expect(drawable).toContain('comms.teleprinter-transmission');
    expect(drawable).toContain('comms.still-image-transmission');
    expect(drawable.some((id) => id.startsWith('state.'))).toBe(false);
    for (const space of ['capability.', 'comms.', 'damage.', 'wildfire.', 'leadership.', 'water-rescue-personnel.', 'special-form.']) {
      expect(drawable.some((id) => id.startsWith(space)), space).toBe(true);
    }
  });

  describe('pictogram-not-canonical', () => {
    it('verweist state.* auf die Art state', () => {
      expect(rulesOf({ kind: 'pictogram', pictogram: 'state.tactical-rescue' })).toEqual(['pictogram-not-canonical']);
      expect(freestandingRedirect({ kind: 'pictogram', pictogram: 'state.tactical-rescue' })).toEqual({
        kind: 'state',
        state: 'tactical-rescue',
      });
      expect(freestandingRedirect({ kind: 'pictogram', pictogram: 'state.radioactivity-hazard', variant: 'alternative' })).toEqual({
        kind: 'state',
        state: 'radioactivity-hazard',
        variant: 'alternative',
      });
    });

    it('verweist einen Zustand mit eigener Spec gleich auf diese, ohne Umweg über state', () => {
      expect(freestandingRedirect({ kind: 'pictogram', pictogram: 'state.weather-sunny' })).toEqual({
        kind: 'weather',
        values: ['weather-sunny'],
      });
      expect(freestandingRedirect({ kind: 'pictogram', pictogram: 'state.acute-situation', variant: 'alternative' })).toEqual({
        kind: 'hazard',
        states: ['acute-situation'],
      });
    });

    it('verweist die Leitstelle D.2.5 auf ihre Ortskennung', () => {
      expect(rulesOf({ kind: 'pictogram', pictogram: 'leadership.control-center' })).toEqual(['pictogram-not-canonical']);
      expect(freestandingRedirect({ kind: 'pictogram', pictogram: 'leadership.control-center' })).toEqual(
        PLACES['control-center'].spec,
      );
      const [issue] = validateFreestandingSpec({ kind: 'pictogram', pictogram: 'leadership.control-center' });
      expect(issue?.message).toContain('control-center');
    });
  });

  it('pictogram-variant-not-available: eine zweite Darstellung nur, wo das Register eine führt', () => {
    expect(rulesOf({ kind: 'pictogram', pictogram: 'comms.voice-radio', variant: 'alternative' })).toEqual([
      'pictogram-variant-not-available',
    ]);
    expect(rulesOf({ kind: 'pictogram', pictogram: 'damage.dyke-breach', variant: 'alternative' })).toEqual([
      'pictogram-variant-not-available',
    ]);
    expect(rulesOf({ kind: 'pictogram', pictogram: 'capability.lifting-loads-persons', variant: 'alternative' })).toEqual([]);
    // Die Altzeichen (ESZ-137) führen ihre zweite Darstellung, über Draht, im eigenen Register.
    expect(rulesOf({ kind: 'pictogram', pictogram: 'comms.teleprinter-transmission', variant: 'alternative' })).toEqual([]);
    expect(rulesOf({ kind: 'pictogram', pictogram: 'comms.still-image-transmission', variant: 'alternative' })).toEqual([]);
  });

  it('leitet zulässige Piktogramme nicht um', () => {
    expect(freestandingRedirect({ kind: 'pictogram', pictogram: 'comms.voice' })).toBeUndefined();
    expect(freestandingRedirect({ kind: 'pictogram', pictogram: 'comms.teleprinter-transmission' })).toBeUndefined();
  });
});
