import { describe, expect, it } from 'vitest';
import {
  ANIMAL_STATE_IDS,
  FREESTANDING_KINDS,
  WEATHER_STATE_IDS,
  isFreestandingSpec,
  type AnySpec,
} from './freestanding.js';
import { STATE_IDS } from './taxonomy.js';
import { SYMBOL_KINDS } from './taxonomy-values.js';

describe('FreestandingSpec', () => {
  it('führt die vier Arten freistehender Zeichen', () => {
    expect(FREESTANDING_KINDS).toEqual(['movement', 'line', 'weather', 'animal-state']);
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
    ];
    expect(specs.map(isFreestandingSpec)).toEqual([false, true, true]);
  });

  it('führt Wetter- und Tierwerte als Teilmengen von STATE_IDS in deren Reihenfolge', () => {
    expect(WEATHER_STATE_IDS).toEqual(STATE_IDS.filter((id) => id.startsWith('weather-')));
    expect(ANIMAL_STATE_IDS).toEqual(STATE_IDS.filter((id) => id.endsWith('-animal')));
  });
});
