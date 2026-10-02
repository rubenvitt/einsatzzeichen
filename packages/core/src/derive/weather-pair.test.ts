import { describe, expect, it } from 'vitest';
import type { Primitive, WeatherStateId } from '@einsatzzeichen/schema';
import { boundsOfMm } from '../bounds.js';
import { drawFreestanding } from '../draw-freestanding.js';
import { WEATHER_STATES } from '../geometry/pictograms/states/07-weather.js';

/**
 * Wetterpaare ohne belegte Anordnung (Eigentümerentscheid 02.10.2026: zulassen, abgeleitet):
 * beide Einzeldarstellungen auf halbe Größe, links und rechts nebeneinander, Strich 0,5 mm.
 */

const VALUES = WEATHER_STATES.map((definition) => definition.id.replace(/^state\./, '') as WeatherStateId);

function hull(primitives: readonly Primitive[]) {
  const bounds = primitives.map((primitive) => boundsOfMm(primitive));
  return {
    minX: Math.min(...bounds.map((b) => b.minX)),
    minY: Math.min(...bounds.map((b) => b.minY)),
    maxX: Math.max(...bounds.map((b) => b.maxX)),
    maxY: Math.max(...bounds.map((b) => b.maxY)),
  };
}

describe('Wetterpaar nebeneinander', () => {
  it('setzt jeden Wert auf halbe Größe in seine Hälfte, in Katalogreihenfolge', () => {
    const drawn = drawFreestanding({ kind: 'weather', values: ['weather-windy', 'weather-sunny'] });
    const sun = WEATHER_STATES.find((definition) => definition.id === 'state.weather-sunny')!;
    const wind = WEATHER_STATES.find((definition) => definition.id === 'state.weather-windy')!;
    const left = drawn.children.slice(0, sun.primitives.length);
    const right = drawn.children.slice(sun.primitives.length);
    expect(right).toHaveLength(wind.primitives.length);
    // Sonne 2…30 → 1…15, Mitte (8 | 16); Wind 1…30 × 12…20 → 16,5…31 × 14…18.
    expect(hull(left)).toEqual({ minX: 1, minY: 9, maxX: 15, maxY: 23 });
    expect(hull(right)).toEqual({ minX: 16.5, minY: 14, maxX: 31, maxY: 18 });
    // Der Strich bleibt 0,5 mm.
    for (const primitive of drawn.children) {
      if (primitive.style?.strokeWidth !== undefined) expect(primitive.style.strokeWidth).toBe(0.5);
    }
    expect(drawn.derivations).toEqual([expect.objectContaining({ dimension: 'values', basis: 'constructed' })]);
  });

  it('zeichnet jedes Paar innerhalb der Fläche, ohne Überschneidung der Hälften', () => {
    for (let i = 0; i < VALUES.length; i++) {
      for (let j = i + 1; j < VALUES.length; j++) {
        const values = [VALUES[i]!, VALUES[j]!] as const;
        const drawn = drawFreestanding({ kind: 'weather', values });
        const first = WEATHER_STATES[i]!.primitives.length;
        const label = values.join('+');
        // Ohne Intensität ist jedes Paar ein Paar, auch die Wolke mit einem Niederschlag.
        expect(drawn.derivations?.[0]?.basis, label).toBe('constructed');
        const left = hull(drawn.children.slice(0, first));
        const right = hull(drawn.children.slice(first));
        expect(left.maxX, label).toBeLessThanOrEqual(16);
        expect(right.minX, label).toBeGreaterThanOrEqual(16);
        expect(left.minX, label).toBeGreaterThanOrEqual(0);
        expect(right.maxX, label).toBeLessThanOrEqual(32);
      }
    }
  });

  it('zeichnet die Wolke mit Niederschlag ohne Intensität als Paar, mit Intensität wie belegt', () => {
    const without = drawFreestanding({ kind: 'weather', values: ['weather-cloudy', 'weather-snowing'] });
    expect(without.derivations?.[0]).toMatchObject({ basis: 'constructed' });
    const withIntensity = drawFreestanding({ kind: 'weather', values: ['weather-cloudy', 'weather-snowing'], intensity: 'weak' });
    expect(withIntensity.derivations).toBeUndefined();
    // Regen an der Wolke ist am 29.09.2026 übertragen entschieden, nicht abgelesen.
    const rain = drawFreestanding({ kind: 'weather', values: ['weather-cloudy', 'weather-rainy'], intensity: 'weak' });
    expect(rain.derivations).toEqual([expect.objectContaining({ dimension: 'values', basis: 'transferred' })]);
  });
});
