import type { AnimalStateParameters, WeatherParameters } from '@einsatzzeichen/schema';

/**
 * Die Referenzdateien aus 5.8.6 und 5.8.7 als Fixtures der freistehenden Zeichen (LFH-577).
 *
 * Wie bei Pfeilen und Linien ist ein Original hier ein **Parametersatz**: welche Werte das Zeichen
 * trägt und, beim Schnee an der Wolke, in welcher Intensität. Mit genau diesem Satz müssen
 * `weatherDrawing` und `animalStateDrawing` die Referenz treffen; `freestanding-state-fixtures.test.ts`
 * hält das gegen das Kennzahlenartefakt und gegen die Katalogpiktogramme fest.
 *
 * Die Beispiele zu 5.8.7 sind die einzigen Originale, die zwei Wetterwerte zusammen zeigen; ihre
 * Intensität steht im Dateinamen (schwach, mittel, stark, extrem).
 */
export interface WeatherFixture {
  readonly asset: `${string}.svg`;
  readonly parameters: WeatherParameters;
}

export interface AnimalStateFixture {
  readonly asset: `${string}.svg`;
  readonly parameters: AnimalStateParameters;
}

const SNOW_AT_CLOUD = ['weather-cloudy', 'weather-snowing'] as const;

export const WEATHER_EXAMPLE_FIXTURES: readonly WeatherFixture[] = Object.freeze([
  { asset: '5.8.7_Beispiel_Schneiend_schwach.svg', parameters: { values: SNOW_AT_CLOUD, intensity: 'weak' } },
  { asset: '5.8.7_Beispiel_Schneiend_mittel.svg', parameters: { values: SNOW_AT_CLOUD, intensity: 'moderate' } },
  { asset: '5.8.7_Beispiel_Schneiend_stark.svg', parameters: { values: SNOW_AT_CLOUD, intensity: 'strong' } },
  { asset: '5.8.7_Beispiel_Schneiend_extrem.svg', parameters: { values: SNOW_AT_CLOUD, intensity: 'extreme' } },
]);

export const ANIMAL_STATE_FIXTURES: readonly AnimalStateFixture[] = Object.freeze([
  { asset: '5.8.6.1_erkranktes Tier.svg', parameters: { state: 'sick-animal' } },
  { asset: '5.8.6.2_kontaminiertes Tier.svg', parameters: { state: 'contaminated-animal' } },
  { asset: '5.8.6.2_kontaminiertes Tier_K.svg', parameters: { state: 'contaminated-animal', variant: 'alternative' } },
  { asset: '5.8.6.3_Totes Tier.svg', parameters: { state: 'dead-animal' } },
]);
