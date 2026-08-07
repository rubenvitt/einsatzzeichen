import { describe, expect, it } from 'vitest';
import { checkBox, checkClipping, checkCommands } from '@einsatzzeichen/core';
import { DEFAULT_VIEWBOX_MM, type Primitive } from '@einsatzzeichen/schema';
import { WEATHER_STATES } from './07-weather.js';

const VIEWBOX_BODY: Primitive = {
  type: 'rect',
  role: 'body',
  x: 0,
  y: 0,
  width: DEFAULT_VIEWBOX_MM.width,
  height: DEFAULT_VIEWBOX_MM.height,
};

function weather(id: string) {
  const definition = WEATHER_STATES.find((candidate) => candidate.id === `state.${id}`);
  if (definition === undefined) throw new Error(`Wetterzustand ${id} fehlt.`);
  return definition;
}

describe('5.8.7 Wetterzustände', () => {
  it('liefert die zehn IDs exakt in Kapitelreihenfolge', () => {
    expect(WEATHER_STATES.map((definition) => definition.id)).toEqual([
      'state.weather-sunny',
      'state.weather-cloudy',
      'state.weather-cloud-cover-four-eighths',
      'state.weather-foggy',
      'state.weather-rainy',
      'state.weather-hailing',
      'state.weather-thunderstorm',
      'state.weather-snowing',
      'state.weather-temperature',
      'state.weather-windy',
    ]);
    expect(WEATHER_STATES.every((definition) => definition.variant === 'primary')).toBe(true);
  });

  it('verwendet zehn paarweise verschiedene Primitivsignaturen', () => {
    const signatures = WEATHER_STATES.map((definition) => JSON.stringify(definition.primitives));
    expect(new Set(signatures).size).toBe(10);
  });

  it('trennt die vier Niederschlagsarten über ihre Geometrie', () => {
    const rain = weather('weather-rainy');
    expect(rain.primitives).toHaveLength(12);
    expect(rain.primitives.every((item) => item.type === 'line')).toBe(true);

    const hail = weather('weather-hailing');
    expect(hail.primitives.filter((item) => item.type === 'circle')).toHaveLength(3);
    expect(hail.primitives.filter((item) => item.type === 'line')).toHaveLength(6);

    const thunder = weather('weather-thunderstorm');
    expect(thunder.primitives).toHaveLength(3);
    expect(thunder.primitives.every((item) => item.type === 'polyline')).toBe(true);

    const snow = weather('weather-snowing');
    expect(snow.primitives).toHaveLength(9);
    expect(snow.primitives.every((item) => item.type === 'line')).toBe(true);
  });

  it('kodiert 4/8-Bedeckung mit gefüllter Hälfte und nicht mit Text', () => {
    const cover = weather('weather-cloud-cover-four-eighths');
    expect(cover.primitives.map((item) => item.type)).toEqual(['circle', 'path', 'line']);
    expect(cover.primitives[0]?.style?.fill).toBe('weiss');
    expect(cover.primitives[1]?.style?.fill).toBe('schwarz');
  });

  it('deklariert Weiß nur für die drei tatsächlich weiß gefüllten Zeichen', () => {
    const whiteFilled = new Set([
      'state.weather-cloudy',
      'state.weather-cloud-cover-four-eighths',
      'state.weather-temperature',
    ]);
    for (const definition of WEATHER_STATES) {
      const expected = whiteFilled.has(definition.id)
        ? [
            {
              foreground: 'schwarz',
              background: 'weiss',
              context: 'schwarze Wetterkontur auf weißer Innenfläche',
            },
            {
              foreground: 'schwarz',
              background: 'surface',
              context: 'schwarze Wetterkontur auf Ausgabeoberfläche',
            },
          ]
        : [
            {
              foreground: 'schwarz',
              background: 'surface',
              context: 'schwarzes Wettermotiv auf Ausgabeoberfläche',
            },
          ];
      expect(definition.contrastPairs).toEqual(expected);
    }
  });

  it('markiert jedes Blatt als pictogram und besteht alle lokalen Gates', () => {
    for (const definition of WEATHER_STATES) {
      expect(definition.primitives.every((primitive) => primitive.role === 'pictogram')).toBe(true);
      expect(checkCommands(definition)).toEqual([]);
      expect(checkBox(definition)).toEqual([]);
      expect(checkClipping(definition, VIEWBOX_BODY)).toEqual([]);
    }
  });
});
