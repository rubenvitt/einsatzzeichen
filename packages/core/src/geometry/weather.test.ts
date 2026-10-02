import { describe, expect, it } from 'vitest';
import type { Primitive, WeatherStateId } from '@einsatzzeichen/schema';
import { boundsOfMm } from '../bounds.js';
import { NotMeasuredError } from '../not-measured.js';
import { renderSvg } from '../render/svg.js';
import { WEATHER_STATES } from './pictograms/states/07-weather.js';
import {
  WEATHER_CLOUD_PRECIPITATION,
  WEATHER_PRECIPITATIONS,
  classifyWeather,
  weatherDrawing,
  type WeatherPrecipitationId,
} from './weather.js';

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

  it('trägt keine Intensität: das ist nach der Entscheidung vom 29.09.2026 eine ungültige Eingabe', () => {
    expect(() => weatherDrawing({ values: ['weather-snowing'], intensity: 'strong' })).toThrow(/Intensität/);
    expect(() => weatherDrawing({ values: ['weather-snowing'], intensity: 'strong' })).not.toThrow(NotMeasuredError);
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

const CENTERS = { weak: [16], moderate: [12, 20], strong: [8, 16, 24], extreme: [4, 12, 20, 28] } as const;
type Intensity = keyof typeof CENTERS;
const SLANT = 7 / 26;

function atCloud(precipitation: WeatherPrecipitationId, intensity: Intensity) {
  return weatherDrawing({ values: ['weather-cloudy', precipitation], intensity });
}

/** Die Wolke an erster Stelle ist dieselbe wie beim Schnee: 3 mm angehoben. */
function expectRaisedCloud(children: readonly Primitive[]) {
  const snowCloud = weatherDrawing({ values: ['weather-cloudy', 'weather-snowing'], intensity: 'weak' }).children[0];
  expect(children[0]).toEqual(snowCloud);
}

describe('Regen, Hagel und Gewitter an der Wolke: wie Schnee gebaut (übertragen, Entscheidung 29.09.2026)', () => {
  it('hebt die Wolke wie beim Schnee um 3 mm an', () => {
    for (const precipitation of ['weather-rainy', 'weather-hailing', 'weather-thunderstorm'] as const) {
      expectRaisedCloud(atCloud(precipitation, 'moderate').children);
    }
  });

  it('Regen: je Stufe ein Strich der Regenspur, 15° geneigt, im Band der Flocke y 23…29, mittig auf der Teilung', () => {
    for (const [intensity, centers] of Object.entries(CENTERS)) {
      const streaks = lines(atCloud('weather-rainy', intensity as Intensity).children);
      expect(streaks, intensity).toHaveLength(centers.length);
      streaks.forEach((line, i) => {
        if (line.type !== 'line') throw new Error('Strich erwartet');
        // Von unten links nach oben rechts wie in 5.8.7.5.
        expect(line.y1).toBeCloseTo(29, 3);
        expect(line.y2).toBeCloseTo(23, 3);
        expect((line.x2 - line.x1) / (line.y1 - line.y2)).toBeCloseTo(SLANT, 3);
        expect((line.x1 + line.x2) / 2).toBeCloseTo(centers[i] as number, 3);
        expect(line.style).toMatchObject({ stroke: 'schwarz', strokeWidth: 0.5 });
      });
    }
  });

  it('Hagel: je Stufe ein Korn r 1,5 mm (3/4 von 5.8.7.6) auf der Spur, Spurstücke bis an die Bandkanten', () => {
    for (const [intensity, centers] of Object.entries(CENTERS)) {
      const children = atCloud('weather-hailing', intensity as Intensity).children;
      const grains = children.filter((child) => child.type === 'circle');
      expect(grains.map((grain) => (grain.type === 'circle' ? [grain.cx, grain.cy, grain.r] : [])), intensity).toEqual(
        centers.map((x) => [x, 26, 1.5]),
      );
      const stubs = lines(children);
      expect(stubs).toHaveLength(2 * centers.length);
      for (const line of stubs) {
        if (line.type !== 'line') continue;
        expect((line.x2 - line.x1) / (line.y1 - line.y2)).toBeCloseTo(SLANT, 3);
        // Jedes Stück reicht von einer Bandkante bis an den Kornrand.
        const touchesEdge = [line.y1, line.y2].some((y) => Math.abs(y - 29) < 1e-3 || Math.abs(y - 23) < 1e-3);
        expect(touchesEdge).toBe(true);
      }
      expect(Math.max(...stubs.map((line) => boundsOfMm(line).maxY))).toBeLessThanOrEqual(29.3);
    }
  });

  it('Gewitter: je Stufe ein Blitz aus 5.8.7.7, auf die Bandhöhe 6 mm verkleinert (1/3), mittig auf der Teilung', () => {
    const catalogBolt = WEATHER_STATES.find((definition) => definition.id === 'state.weather-thunderstorm')?.primitives.slice(0, 2);
    if (catalogBolt === undefined) throw new Error('Blitz fehlt');
    for (const [intensity, centers] of Object.entries(CENTERS)) {
      const polylines = atCloud('weather-thunderstorm', intensity as Intensity).children.filter(
        (child) => child.type === 'polyline',
      );
      expect(polylines, intensity).toHaveLength(2 * centers.length);
      centers.forEach((x, i) => {
        const bolt = polylines.slice(2 * i, 2 * i + 2);
        const minY = Math.min(...bolt.map((part) => (part.type === 'polyline' ? Math.min(...part.points.map((p) => p[1])) : 0)));
        const maxY = Math.max(...bolt.map((part) => (part.type === 'polyline' ? Math.max(...part.points.map((p) => p[1])) : 0)));
        const minX = Math.min(...bolt.map((part) => (part.type === 'polyline' ? Math.min(...part.points.map((p) => p[0])) : 0)));
        const maxX = Math.max(...bolt.map((part) => (part.type === 'polyline' ? Math.max(...part.points.map((p) => p[0])) : 0)));
        expect(minY).toBeCloseTo(23, 2);
        expect(maxY).toBeCloseTo(29, 2);
        expect((minX + maxX) / 2).toBeCloseTo(x, 2);
        expect(maxX - minX).toBeCloseTo(5.6 / 3, 2);
        // Dieselbe Form wie im Katalog: gleiche Punktzahl je Linienzug, Strich 0,5 mm.
        bolt.forEach((part, k) => {
          const original = catalogBolt[k];
          if (part.type !== 'polyline' || original?.type !== 'polyline') throw new Error('Linienzug erwartet');
          expect(part.points).toHaveLength(original.points.length);
          expect(part.style).toEqual(original.style);
        });
      });
    }
  });

  it('benennt die Kombination im Titel', () => {
    expect(atCloud('weather-rainy', 'weak').title).toBe('Wolkig, regnerisch');
    expect(atCloud('weather-hailing', 'weak').title).toBe('Wolkig, hagelnd');
    expect(atCloud('weather-thunderstorm', 'weak').title).toBe('Wolkig, gewittrig');
    expect(atCloud('weather-snowing', 'weak').title).toBe('Wolkig, schneiend');
  });
});

describe('Gültige Kombinationen als Daten (WEATHER_CLOUD_PRECIPITATION)', () => {
  it('führt vier Niederschläge: Schnee belegt, Regen, Hagel und Gewitter vom Eigentümer entschieden', () => {
    expect([...WEATHER_PRECIPITATIONS].sort()).toEqual(
      ['weather-hailing', 'weather-rainy', 'weather-snowing', 'weather-thunderstorm'].sort(),
    );
    expect(WEATHER_CLOUD_PRECIPITATION.carrier).toBe('weather-cloudy');
    expect(WEATHER_CLOUD_PRECIPITATION.maxValues).toBe(2);
    const snow = WEATHER_CLOUD_PRECIPITATION.precipitations['weather-snowing'];
    expect(snow.status).toBe('evidenced');
    if (snow.status === 'evidenced') {
      expect(snow.evidence.map((item) => ('asset' in item ? item.asset : ''))).toEqual([
        '5.8.7_Beispiel_Schneiend_schwach.svg',
        '5.8.7_Beispiel_Schneiend_mittel.svg',
        '5.8.7_Beispiel_Schneiend_stark.svg',
        '5.8.7_Beispiel_Schneiend_extrem.svg',
      ]);
    }
    for (const transferred of ['weather-rainy', 'weather-hailing', 'weather-thunderstorm'] as const) {
      const finding = WEATHER_CLOUD_PRECIPITATION.precipitations[transferred];
      expect(finding, transferred).toMatchObject({ status: 'decided', by: 'owner', decidedOn: '2026-09-29' });
      if (finding.status === 'decided') expect(finding.ref).toMatch(/2026-09-28-lfh-565-kapitel-5-8-bausteine\.md §10/);
    }
    for (const rule of [WEATHER_CLOUD_PRECIPITATION.limit, WEATHER_CLOUD_PRECIPITATION.intensity]) {
      expect(rule).toMatchObject({ status: 'decided', by: 'owner' });
    }
  });

  it('klassifiziert: gezeichnet (vermessen, übertragen, konstruiert) oder ungültig (entschiedene Grenze)', () => {
    expect(classifyWeather({ values: ['weather-sunny'] })).toMatchObject({ kind: 'drawable', basis: 'measured' });
    expect(classifyWeather({ values: ['weather-snowing', 'weather-cloudy'], intensity: 'weak' })).toMatchObject({
      kind: 'drawable',
      basis: 'measured',
    });
    expect(classifyWeather({ values: ['weather-cloudy', 'weather-rainy'], intensity: 'weak' })).toMatchObject({
      kind: 'drawable',
      basis: 'transferred',
    });
    expect(classifyWeather({ values: ['weather-rainy', 'weather-rainy'] })).toMatchObject({
      kind: 'invalid',
      reason: 'duplicate-value',
    });
    expect(
      classifyWeather({ values: ['weather-cloudy', 'weather-snowing', 'weather-rainy'], intensity: 'weak' }),
    ).toMatchObject({ kind: 'invalid', reason: 'too-many-values' });
    expect(classifyWeather({ values: ['weather-snowing'], intensity: 'weak' })).toMatchObject({
      kind: 'invalid',
      reason: 'intensity-without-precipitation-at-cloud',
    });
    // Bis zum 02.10.2026 `not-measured`; seither konstruierte Paare (derive/weather-pair.ts).
    const pair = { kind: 'drawable', form: 'pair', basis: 'constructed' };
    expect(classifyWeather({ values: ['weather-sunny', 'weather-windy'] })).toEqual(pair);
    expect(classifyWeather({ values: ['weather-rainy', 'weather-snowing'] })).toEqual(pair);
    expect(classifyWeather({ values: ['weather-cloudy', 'weather-hailing'] })).toEqual(pair);
  });

  it('weatherDrawing folgt der Klassifikation für jeden Wert und jedes Paar, mit und ohne Intensität', () => {
    const values = WEATHER_STATES.map((definition) => definition.id.replace(/^state\./, '') as WeatherStateId);
    const sets: (readonly [WeatherStateId, ...WeatherStateId[]])[] = [
      ...values.map((a) => [a] as const),
      ...values.flatMap((a, i) => values.slice(i + 1).map((b) => [a, b] as const)),
      ['weather-cloudy', 'weather-snowing', 'weather-hailing'],
    ];
    for (const set of sets) {
      for (const intensity of [undefined, 'strong'] as const) {
        const parameters = intensity === undefined ? { values: set } : { values: set, intensity };
        const verdict = classifyWeather(parameters);
        const label = `${set.join('+')} ${intensity ?? ''}`;
        if (verdict.kind === 'drawable') {
          expect(() => weatherDrawing(parameters), label).not.toThrow();
        } else {
          let error: unknown;
          try {
            weatherDrawing(parameters);
          } catch (caught) {
            error = caught;
          }
          expect(error, label).toBeInstanceOf(Error);
          expect(error, label).not.toBeInstanceOf(NotMeasuredError);
        }
      }
    }
  });
});

describe('Was weder Original noch Entscheidung trägt', () => {
  // Bis zum 02.10.2026 Lücken (`NotMeasuredError`); seither konstruierte Paare, deren Lage
  // derive/weather-pair.test.ts prüft.
  it('zeichnet einen Niederschlag an der Wolke ohne Intensität als Paar', () => {
    for (const precipitation of WEATHER_PRECIPITATIONS) {
      expect(classifyWeather({ values: ['weather-cloudy', precipitation] }), precipitation)
        .toEqual({ kind: 'drawable', form: 'pair', basis: 'constructed' });
      expect(() => weatherDrawing({ values: ['weather-cloudy', precipitation] }), precipitation).not.toThrow();
    }
  });

  it('zeichnet andere Paare nebeneinander', () => {
    expect(classifyWeather({ values: ['weather-cloudy', 'weather-sunny'] }))
      .toEqual({ kind: 'drawable', form: 'pair', basis: 'constructed' });
    expect(weatherDrawing({ values: ['weather-cloudy', 'weather-sunny'] }).title).toBe('Sonnig, wolkig');
    expect(weatherDrawing({ values: ['weather-rainy', 'weather-snowing'] }).title).toBe('Regnerisch, schneiend');
  });

  it('lehnt mehr als die Wolke und einen Niederschlag als ungültige Eingabe ab', () => {
    const three = () =>
      weatherDrawing({ values: ['weather-cloudy', 'weather-snowing', 'weather-windy'], intensity: 'weak' });
    expect(three).toThrow(/höchstens/);
    expect(three).not.toThrow(NotMeasuredError);
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
