import { describe, expect, it } from 'vitest';
import {
  ANIMAL_STATE_IDS,
  FREESTANDING_KINDS,
  WEATHER_STATE_IDS,
  isFreestandingSpec,
  type AnySpec,
} from './freestanding.js';
import { LEADERSHIP_IDS, PICTOGRAM_IDS, WATER_RESCUE_PERSONNEL_IDS } from './pictogram.js';
import { CAPABILITY_IDS, COMMS_IDS, DAMAGE_IDS, STATE_IDS, WILDFIRE_IDS } from './taxonomy.js';
import { SYMBOL_KINDS } from './taxonomy-values.js';

describe('FreestandingSpec', () => {
  it('führt die Arten freistehender Zeichen', () => {
    expect(FREESTANDING_KINDS).toEqual(['movement', 'line', 'weather', 'animal-state', 'state', 'pictogram']);
  });

  it('teilt keinen Art-Diskriminator mit SymbolKind', () => {
    // Der Compiler prüft dasselbe am Typ; dieser Test hält es zur Laufzeit fest, weil `kind` in
    // `parseAnySpec` über die Spec-Art entscheidet.
    const symbolKinds = new Set<string>(SYMBOL_KINDS);
    expect(FREESTANDING_KINDS.filter((kind) => symbolKinds.has(kind))).toEqual([]);
  });

  it('unterscheidet beide Spec-Arten an kind', () => {
    const specs: AnySpec[] = [
      { kind: 'formation' },
      { kind: 'movement', movement: 'directed-movement', path: { points: [[2, 16], [30, 16]] } },
      { kind: 'weather', values: ['weather-sunny'] },
      { kind: 'state', state: 'tactical-rescue' },
      { kind: 'pictogram', pictogram: 'comms.voice-radio' },
    ];
    expect(specs.map(isFreestandingSpec)).toEqual([false, true, true, true, true]);
  });

  it('führt Wetter- und Tierwerte als Teilmengen von STATE_IDS in deren Reihenfolge', () => {
    expect(WEATHER_STATE_IDS).toEqual(STATE_IDS.filter((id) => id.startsWith('weather-')));
    expect(ANIMAL_STATE_IDS).toEqual(STATE_IDS.filter((id) => id.endsWith('-animal')));
  });
});

describe('PICTOGRAM_IDS', () => {
  it('führt jede Kennung aller Piktogrammräume genau einmal, Raum für Raum', () => {
    expect(PICTOGRAM_IDS).toEqual([
      ...CAPABILITY_IDS.map((id) => `capability.${id}`),
      ...STATE_IDS.map((id) => `state.${id}`),
      ...COMMS_IDS.map((id) => `comms.${id}`),
      ...DAMAGE_IDS.map((id) => `damage.${id}`),
      ...WILDFIRE_IDS.map((id) => `wildfire.${id}`),
      ...LEADERSHIP_IDS.map((id) => `leadership.${id}`),
      ...WATER_RESCUE_PERSONNEL_IDS.map((id) => `water-rescue-personnel.${id}`),
    ]);
    expect(new Set(PICTOGRAM_IDS).size).toBe(PICTOGRAM_IDS.length);
    expect(PICTOGRAM_IDS).toHaveLength(254);
    expect(Object.isFrozen(PICTOGRAM_IDS)).toBe(true);
  });
});
