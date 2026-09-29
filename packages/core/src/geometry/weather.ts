import {
  DEFAULT_VIEWBOX_MM,
  type Drawing,
  type WeatherIntensity,
  type WeatherParameters,
  type WeatherStateId,
} from '@einsatzzeichen/schema';
import { NotMeasuredError } from '../not-measured.js';
import { WEATHER_STATES, cloudPrimitive, snowflake } from './pictograms/states/07-weather.js';

/**
 * Wetterzeichen aus 5.8.7 als freistehendes Zeichen (LFH-577). Maße an der Referenz abgelesen,
 * Geometrie eigenständig konstruiert.
 *
 * Ein Wetterzeichen steht ohne Grundzeichen auf der Lagekarte. Belegt sind zwei Formen:
 *
 * - **Ein Wert allein**: das Katalogpiktogramm aus `07-weather.ts` (5.8.7.1 bis 5.8.7.10).
 * - **Schnee an der Wolke mit Intensität**: die vier Beispiele `5.8.7_Beispiel_Schneiend_schwach`,
 *   `_mittel`, `_stark` und `_extrem`. Die Wolke aus 5.8.7.2 steht 3 mm höher (Hülle 1/3/31/21),
 *   darunter eine bis vier Flocken mit Radius 3 mm um y 26, Teilung 8 mm, mittig auf x 16:
 *   schwach 16; mittel 12, 20; stark 8, 16, 24; extrem 4, 12, 20, 28 (senkrechte Durchmesser
 *   bei 45,354 / 34,016 und 56,693 / 22,677, 45,354 und 68,03 / 11,339 bis 79,37 pt).
 *
 * Die Intensität ist damit die **Anzahl** der Niederschlagsmarken, nicht ihre Größe. Die
 * Flocke an der Wolke ist kleiner als in 5.8.7.8 (Radius 4 mm, Teilung 9 mm); „stark“ ist deshalb
 * nicht dasselbe wie der Wert allein, obwohl beide drei Flocken zeigen.
 *
 * Alles andere zeigt kein Original und meldet eine Lücke: Regen, Hagel und Gewitter an der Wolke,
 * mehr als zwei Werte, Schnee an der Wolke ohne Intensität und eine Intensität ohne Wolke.
 */

/** Anhebung der Wolke über dem Niederschlag: Fläche oben 25,512 statt 34,016 pt. */
const CLOUD_RAISE_MM = 3;
/** Flocke an der Wolke: Radius 3 mm (8,504 pt) um y 26. */
const CLOUD_FLAKE_RADIUS_MM = 3;
const CLOUD_FLAKE_CENTER_Y_MM = 26;
/** Teilung der Flocken an der Wolke, mittig auf der senkrechten Zeichenmitte. */
const CLOUD_FLAKE_PITCH_MM = 8;
const CENTER_X_MM = 16;

const FLAKES_PER_INTENSITY: Readonly<Record<WeatherIntensity, number>> = {
  weak: 1,
  moderate: 2,
  strong: 3,
  extreme: 4,
};

const OPEN_QUESTION =
  'Belegt sind ein Wetterwert allein und Schnee an der Wolke mit Intensität (5.8.7_Beispiel_Schneiend_*). ' +
  'Welche weiteren Werte an die Wolke gehen (Regen, Hagel, Gewitter), wie viele Werte ein Zeichen trägt und ' +
  'welche sich ausschließen, zeigt kein Original.';

function drawingOf(title: string, children: Drawing['children']): Drawing {
  return { viewBox: { ...DEFAULT_VIEWBOX_MM }, children, title };
}

function singleValue(value: WeatherStateId): Drawing {
  const definition = WEATHER_STATES.find((candidate) => candidate.id === `state.${value}`);
  if (definition === undefined) throw new Error(`Unbekannter Wetterwert ${value}.`);
  return drawingOf(definition.title, definition.primitives);
}

function snowAtCloud(intensity: WeatherIntensity): Drawing {
  const count = FLAKES_PER_INTENSITY[intensity];
  const first = CENTER_X_MM - ((count - 1) * CLOUD_FLAKE_PITCH_MM) / 2;
  const flakes = Array.from({ length: count }, (_, i) =>
    snowflake(first + i * CLOUD_FLAKE_PITCH_MM, CLOUD_FLAKE_CENTER_Y_MM, CLOUD_FLAKE_RADIUS_MM),
  ).flat();
  return drawingOf('Wolkig, schneiend', [cloudPrimitive(CLOUD_RAISE_MM), ...flakes]);
}

/**
 * Ein Wetterzeichen aus einem oder mehreren Werten, in 32 × 32 mm. Die Reihenfolge der Werte zählt
 * nicht. Wirft `NotMeasuredError` für jede Kombination, die kein Original zeigt, und einen
 * gewöhnlichen Fehler für einen doppelten Wert.
 */
export function weatherDrawing(parameters: WeatherParameters): Drawing {
  const values = new Set(parameters.values);
  if (values.size !== parameters.values.length) {
    throw new Error(`Ein Wetterwert steht doppelt: ${parameters.values.join(', ')}.`);
  }
  const { intensity } = parameters;
  if (values.size === 1) {
    if (intensity !== undefined) {
      throw new NotMeasuredError(
        `Intensität "${intensity}" an ${parameters.values[0]} allein: die Beispiele zeigen die Intensität nur am Schnee unter der Wolke.`,
        'combination',
      );
    }
    return singleValue(parameters.values[0]);
  }
  if (values.size === 2 && values.has('weather-cloudy') && values.has('weather-snowing')) {
    if (intensity === undefined) {
      throw new NotMeasuredError(
        'Schnee an der Wolke ohne Intensität: die Beispiele zeigen ihn nur in einer der vier Stufen.',
        'combination',
      );
    }
    return snowAtCloud(intensity);
  }
  throw new NotMeasuredError(`Wetterwerte ${parameters.values.join(' + ')}: ${OPEN_QUESTION}`, 'combination');
}
