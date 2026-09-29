import { describe, expect, it } from 'vitest';
import type { Primitive, WeatherStateId } from '@einsatzzeichen/schema';
import { boundsOfMm } from '../bounds.js';
import { NotMeasuredError } from '../not-measured.js';
import { renderSvg } from '../render/svg.js';
import { WEATHER_STATES } from './pictograms/states/07-weather.js';
import { weatherDrawing } from './weather.js';

/**
 * Wetterzeichen aus 5.8.7 als freistehendes Zeichen (LFH-577): ein Wert allein ist das
 * Katalogpiktogramm, Wolke und Schnee zusammen tragen eine Intensität in vier Stufen.
 */

function lines(children: readonly Primitive[]) {
  return children.filter((child) => child.type === 'line');
}

/** Mitten der Flocken: jede Flocke besteht aus drei Durchmessern, der senkrechte zuerst. */
function flakeCenters(children: readonly Primitive[]): number[] {
  return lines(children)
    .filter((line) => line.type === 'line' && Math.abs(line.x1 - line.x2) < 1e-9)
    .map((line) => (line.type === 'line' ? line.x1 : Number.NaN));
}

describe('Ein Wetterwert allein', () => {
  it('ist das Katalogpiktogramm des Werts in 32 × 32 mm', () => {
    for (const definition of WEATHER_STATES) {
      const value = definition.id.replace(/^state\./, '') as WeatherStateId;
      const drawing = weatherDrawing({ values: [value] });
      expect(drawing.viewBox).toEqual({ width: 32, height: 32 });
      expect(drawing.children, value).toEqual(definition.primitives);
    }
  });

  it('trägt keine Intensität', () => {
    expect(() => weatherDrawing({ values: ['weather-snowing'], intensity: 'strong' })).toThrow(NotMeasuredError);
  });
});

describe('Schnee an der Wolke mit Intensität (5.8.7_Beispiel_Schneiend_*)', () => {
  it('hebt die Wolke um 3 mm an: Hülle 1/3/31/21 wie im Kennzahlenartefakt', () => {
    const drawing = weatherDrawing({ values: ['weather-cloudy', 'weather-snowing'], intensity: 'weak' });
    const cloud = drawing.children.find((child) => child.type === 'path');
    if (cloud?.type !== 'path') throw new Error('Wolke fehlt');
    const standalone = WEATHER_STATES.find((definition) => definition.id === 'state.weather-cloudy')?.primitives[0];
    expect(cloud.style).toEqual(standalone?.style);
    // Dieselbe Kontur wie 5.8.7.2, nur 3 mm höher; die Wolke von 5.8.7.2 liegt bei y 6 bis 24.
    const coordinates = (d: string) => d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    const raised = coordinates(cloud.d);
    const original = coordinates(standalone?.type === 'path' ? standalone.d : '');
    expect(raised).toHaveLength(original.length);
    raised.forEach((value, i) => expect(value).toBeCloseTo(i % 2 === 0 ? (original[i] as number) : (original[i] as number) - 3, 2));
  });

  it('zeichnet schwach, mittel, stark und extrem als eine bis vier Flocken, 8 mm Teilung, mittig', () => {
    const expected = { weak: [16], moderate: [12, 20], strong: [8, 16, 24], extreme: [4, 12, 20, 28] } as const;
    for (const [intensity, centers] of Object.entries(expected)) {
      const drawing = weatherDrawing({
        values: ['weather-cloudy', 'weather-snowing'],
        intensity: intensity as keyof typeof expected,
      });
      expect(flakeCenters(drawing.children), intensity).toEqual(centers);
    }
  });

  it('zeichnet die Flocke kleiner als in 5.8.7.8: Radius 3 mm um y 26, drei Durchmesser, 0,5 mm', () => {
    const drawing = weatherDrawing({ values: ['weather-snowing', 'weather-cloudy'], intensity: 'weak' });
    const flake = lines(drawing.children);
    expect(flake).toHaveLength(3);
    for (const line of flake) {
      if (line.type !== 'line') continue;
      expect(Math.hypot(line.x2 - line.x1, line.y2 - line.y1)).toBeCloseTo(6, 3);
      expect((line.y1 + line.y2) / 2).toBeCloseTo(26, 3);
      expect(line.style).toMatchObject({ stroke: 'schwarz', strokeWidth: 0.5 });
    }
    const bottom = Math.max(...flake.map((line) => boundsOfMm(line).maxY));
    // Referenz: senkrechter Durchmesser endet bei 82,235 pt = 29,011 mm.
    expect(bottom).toBeCloseTo(29, 1);
  });

  it('gibt die Kombination als SVG aus', () => {
    const svg = renderSvg(weatherDrawing({ values: ['weather-cloudy', 'weather-snowing'], intensity: 'extreme' }));
    expect(svg).toContain('<path');
  });
});

describe('Was die Referenz nicht zeigt', () => {
  it('meldet Wolke und Schnee ohne Intensität als Lücke', () => {
    expect(() => weatherDrawing({ values: ['weather-cloudy', 'weather-snowing'] })).toThrow(NotMeasuredError);
  });

  it('meldet jede andere Kombination als Lücke', () => {
    for (const other of ['weather-rainy', 'weather-hailing', 'weather-thunderstorm', 'weather-sunny'] as const) {
      expect(() => weatherDrawing({ values: ['weather-cloudy', other], intensity: 'weak' }), other).toThrow(NotMeasuredError);
    }
    expect(() => weatherDrawing({ values: ['weather-cloudy', 'weather-snowing', 'weather-windy'], intensity: 'weak' }))
      .toThrow(NotMeasuredError);
  });

  it('lehnt einen doppelten Wert als ungültige Eingabe ab', () => {
    let error: unknown;
    try {
      weatherDrawing({ values: ['weather-snowing', 'weather-snowing'] });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(NotMeasuredError);
  });
});
