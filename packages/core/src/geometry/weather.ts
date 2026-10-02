import {
  DEFAULT_VIEWBOX_MM,
  type Drawing,
  type GrammarFinding,
  type Primitive,
  type WeatherIntensity,
  type WeatherParameters,
  type WeatherStateId,
} from '@einsatzzeichen/schema';
import { noteDerivation } from '../derive/record.js';
import { weatherPairPrimitives } from '../derive/weather-pair.js';
import {
  WEATHER_STATES,
  cloudPrimitive,
  hailMark,
  lightningMark,
  rainMark,
  snowflake,
} from './pictograms/states/07-weather.js';

/**
 * Wetterzeichen aus 5.8.7 als freistehendes Zeichen (LFH-577, LFH-561). Maße an der Referenz
 * abgelesen, Geometrie eigenständig konstruiert.
 *
 * Ein Wetterzeichen steht ohne Grundzeichen auf der Lagekarte. Es gibt zwei Formen:
 *
 * - **Ein Wert allein**: das Katalogpiktogramm aus `07-weather.ts` (5.8.7.1 bis 5.8.7.10).
 * - **Die Wolke mit einem Niederschlag und einer Intensität.** Belegt ist nur der Schnee, an den
 *   vier Beispielen `5.8.7_Beispiel_Schneiend_schwach`, `_mittel`, `_stark` und `_extrem`: Die Wolke
 *   aus 5.8.7.2 steht 3 mm höher (Hülle 1/3/31/21), darunter eine bis vier Flocken mit Radius 3 mm
 *   um y 26, Teilung 8 mm, mittig auf x 16: schwach 16; mittel 12, 20; stark 8, 16, 24; extrem 4,
 *   12, 20, 28 (senkrechte Durchmesser bei 45,354 / 34,016 und 56,693 / 22,677, 45,354 und 68,03 /
 *   11,339 bis 79,37 pt).
 *
 * Die Intensität ist damit die **Anzahl** der Niederschlagsmarken, nicht ihre Größe. Die Flocke an
 * der Wolke ist kleiner als in 5.8.7.8 (Radius 4 mm, Teilung 9 mm); „stark“ ist deshalb nicht
 * dasselbe wie der Wert allein, obwohl beide drei Flocken zeigen.
 *
 * **Regen, Hagel und Gewitter an der Wolke sind übertragen, nicht abgelesen.** Der Eigentümer hat
 * am 29.09.2026 entschieden, sie wie den Schnee zu bauen. Kein Original zeigt sie. Die Übertragung
 * folgt einer Regel: Jede Marke füllt das Band der Flocke, also y 23 bis 29 (6 mm, der Durchmesser
 * der kleinen Flocke), steht mittig auf derselben Teilung und behält den Strich von 0,5 mm.
 * Elemente mit eigener Größe schrumpfen wie die Flocke auf 3/4.
 *
 * - Regen: ein Strich der Regenspur aus 5.8.7.5, 15° geneigt, über die volle Bandhöhe.
 * - Hagel: das Korn aus 5.8.7.6 mit r 2 → 1,5 mm, die Spur darunter und darüber bis an die
 *   Bandkanten.
 * - Gewitter: der ganze Blitz aus 5.8.7.7, von 18 mm auf die Bandhöhe 6 mm verkleinert, also auf
 *   1/3. Die Kopfarme werden dabei rund 1 mm kurz. Ob das so bleiben soll, muss der Eigentümer
 *   bestätigen.
 *
 * Welche Kombinationen gelten, steht als Datum in `WEATHER_CLOUD_PRECIPITATION`. `classifyWeather`
 * liest es, und `weatherDrawing` zeichnet nur, was es zulässt.
 */

/** Die Vorlage, in der Entscheidung und Übertragung festgehalten sind. */
const DECISION_REF = 'docs/decisions/2026-09-28-lfh-565-kapitel-5-8-bausteine.md §10';
const DECIDED_ON = '2026-09-29';

/** Anhebung der Wolke über dem Niederschlag: Fläche oben 25,512 statt 34,016 pt. */
const CLOUD_RAISE_MM = 3;
/** Flocke an der Wolke: Radius 3 mm (8,504 pt) um y 26. */
const CLOUD_FLAKE_RADIUS_MM = 3;
const CLOUD_MARK_CENTER_Y_MM = 26;
/** Band der Niederschlagsmarken: der Durchmesser der kleinen Flocke, y 23 bis 29. */
const CLOUD_MARK_HEIGHT_MM = 2 * CLOUD_FLAKE_RADIUS_MM;
/** Hagelkorn an der Wolke: r 2 mm aus 5.8.7.6, verkleinert wie die Flocke (4 → 3 mm). */
const CLOUD_HAIL_RADIUS_MM = 2 * (CLOUD_FLAKE_RADIUS_MM / 4);
/** Teilung der Marken an der Wolke, mittig auf der senkrechten Zeichenmitte. */
const CLOUD_MARK_PITCH_MM = 8;
const CENTER_X_MM = 16;

const MARKS_PER_INTENSITY: Readonly<Record<WeatherIntensity, number>> = {
  weak: 1,
  moderate: 2,
  strong: 3,
  extreme: 4,
};

/** Die Niederschläge aus 5.8.7, die an der Wolke stehen dürfen. */
export type WeatherPrecipitationId = Extract<
  WeatherStateId,
  'weather-rainy' | 'weather-hailing' | 'weather-thunderstorm' | 'weather-snowing'
>;

export const WEATHER_PRECIPITATIONS: readonly WeatherPrecipitationId[] = Object.freeze([
  'weather-rainy',
  'weather-hailing',
  'weather-thunderstorm',
  'weather-snowing',
]);

/**
 * Was ein Wetterzeichen tragen darf, als Datum für einen Validierungsschritt.
 *
 * - `maxValues`: höchstens zwei Werte, und dann genau die Wolke (`carrier`) und einen Niederschlag.
 * - `precipitations`: je Niederschlag der Belegstand der Kombination mit der Wolke. Mit dem Wert
 *   (`'with-intensity'`) sagt sie: nur mit einer Intensität.
 * - `limit` und `intensity`: die beiden Grenzen, entschieden am 29.09.2026. Eine Intensität gibt es
 *   nur an einem Niederschlag an der Wolke.
 *
 * Nicht erfasst: andere Paare, etwa Sonne und Wind oder Regen und Schnee ohne Wolke, und ein
 * Niederschlag an der Wolke ohne Intensität. Bis zum 02.10.2026 eine Lücke (`NotMeasuredError`);
 * seither zeichnet sie `weatherDrawing` als konstruiertes Paar (`derive/weather-pair.ts`).
 */
export interface WeatherCloudPrecipitationRules {
  readonly carrier: 'weather-cloudy';
  readonly maxValues: 2;
  readonly precipitations: Readonly<Record<WeatherPrecipitationId, GrammarFinding<'with-intensity'>>>;
  readonly limit: GrammarFinding<2>;
  readonly intensity: GrammarFinding<'only-precipitation-at-cloud'>;
}

function decided<T>(value: T, decision: string): GrammarFinding<T> {
  return { status: 'decided', value, decision, decidedOn: DECIDED_ON, by: 'owner', ref: DECISION_REF };
}

const SNOW_EXAMPLE_NOTE =
  'Wolke 3 mm angehoben, darunter eine bis vier Flocken r 3 mm um y 26 in 8-mm-Teilung; die Intensität steht im Dateinamen.';

const TRANSFERRED_LIKE_SNOW =
  'wird an der Wolke wie der Schnee gebaut: Wolke 3 mm angehoben, darunter eine bis vier Marken in 8-mm-Teilung im Band y 23 bis 29. Übertragen, nicht abgelesen.';

export const WEATHER_CLOUD_PRECIPITATION: WeatherCloudPrecipitationRules = Object.freeze({
  carrier: 'weather-cloudy',
  maxValues: 2,
  precipitations: Object.freeze({
    'weather-snowing': {
      status: 'evidenced',
      value: 'with-intensity',
      evidence: [
        { asset: '5.8.7_Beispiel_Schneiend_schwach.svg', note: SNOW_EXAMPLE_NOTE },
        { asset: '5.8.7_Beispiel_Schneiend_mittel.svg', note: SNOW_EXAMPLE_NOTE },
        { asset: '5.8.7_Beispiel_Schneiend_stark.svg', note: SNOW_EXAMPLE_NOTE },
        { asset: '5.8.7_Beispiel_Schneiend_extrem.svg', note: SNOW_EXAMPLE_NOTE },
      ],
    },
    'weather-rainy': decided('with-intensity', `Regen (5.8.7.5) ${TRANSFERRED_LIKE_SNOW}`),
    'weather-hailing': decided('with-intensity', `Hagel (5.8.7.6) ${TRANSFERRED_LIKE_SNOW}`),
    'weather-thunderstorm': decided('with-intensity', `Gewitter (5.8.7.7) ${TRANSFERRED_LIKE_SNOW}`),
  } satisfies Record<WeatherPrecipitationId, GrammarFinding<'with-intensity'>>),
  limit: decided(2, 'Ein Wetterzeichen trägt höchstens die Wolke und einen Niederschlag.'),
  intensity: decided(
    'only-precipitation-at-cloud',
    'Eine Intensität gibt es nur an einem Niederschlag unter der Wolke, nicht an einem Wert allein.',
  ),
} satisfies WeatherCloudPrecipitationRules);

/** Warum ein Wetterzeichen gegen eine entschiedene Grenze verstößt. */
export type WeatherInvalidReason = 'duplicate-value' | 'too-many-values' | 'intensity-without-precipitation-at-cloud';

/**
 * Urteil über einen Parametersatz. `drawable` mit `basis: 'measured'` ist an einem Original
 * abgelesen, mit `'transferred'` nach der Entscheidung vom 29.09.2026 übertragen, mit
 * `'constructed'` ein Paar ohne belegte Anordnung (`form: 'pair'`, Eigentümerentscheid vom
 * 02.10.2026). `invalid` verstößt gegen eine entschiedene Grenze.
 *
 * Bis zum 02.10.2026 gab es ein drittes Urteil `not-measured` für Paare ohne Beleg; seither wird
 * jedes Paar gezeichnet.
 */
export type WeatherVerdict =
  | {
      readonly kind: 'drawable';
      readonly form: 'single' | 'cloud-with-precipitation' | 'pair';
      readonly basis: 'measured' | 'transferred' | 'constructed';
    }
  | { readonly kind: 'invalid'; readonly reason: WeatherInvalidReason; readonly message: string };

function isPrecipitation(value: WeatherStateId): value is WeatherPrecipitationId {
  return (WEATHER_PRECIPITATIONS as readonly WeatherStateId[]).includes(value);
}

/** Der Niederschlag, wenn die Werte genau die Wolke und einen Niederschlag sind. */
function precipitationAtCloud(values: ReadonlySet<WeatherStateId>): WeatherPrecipitationId | undefined {
  if (values.size !== 2 || !values.has(WEATHER_CLOUD_PRECIPITATION.carrier)) return undefined;
  return [...values].find(isPrecipitation);
}

/** Prüft einen Parametersatz gegen `WEATHER_CLOUD_PRECIPITATION`, ohne zu zeichnen. */
export function classifyWeather(parameters: WeatherParameters): WeatherVerdict {
  const listed = parameters.values.join(' + ');
  const values = new Set(parameters.values);
  if (values.size !== parameters.values.length) {
    return { kind: 'invalid', reason: 'duplicate-value', message: `Ein Wetterwert steht doppelt: ${listed}.` };
  }
  if (values.size > WEATHER_CLOUD_PRECIPITATION.maxValues) {
    return {
      kind: 'invalid',
      reason: 'too-many-values',
      message: `Wetterwerte ${listed}: Ein Wetterzeichen trägt höchstens die Wolke und einen Niederschlag.`,
    };
  }
  const precipitation = precipitationAtCloud(values);
  const { intensity } = parameters;
  if (intensity !== undefined && precipitation === undefined) {
    return {
      kind: 'invalid',
      reason: 'intensity-without-precipitation-at-cloud',
      message: `Intensität "${intensity}" an ${listed}: Eine Intensität gibt es nur an einem Niederschlag unter der Wolke.`,
    };
  }
  if (values.size === 1) return { kind: 'drawable', form: 'single', basis: 'measured' };
  // Kein Original zeigt dieses Paar, oder der Niederschlag an der Wolke hat keine Stufe, die die
  // belegte Anordnung zählen könnte: beides als Paar nebeneinander (derive/weather-pair.ts).
  if (precipitation === undefined || intensity === undefined) {
    return { kind: 'drawable', form: 'pair', basis: 'constructed' };
  }
  const finding = WEATHER_CLOUD_PRECIPITATION.precipitations[precipitation];
  return {
    kind: 'drawable',
    form: 'cloud-with-precipitation',
    basis: finding.status === 'evidenced' ? 'measured' : 'transferred',
  };
}

function drawingOf(title: string, children: Drawing['children']): Drawing {
  return { viewBox: { ...DEFAULT_VIEWBOX_MM }, children, title };
}

function singleValue(value: WeatherStateId): Drawing {
  const definition = WEATHER_STATES.find((candidate) => candidate.id === `state.${value}`);
  if (definition === undefined) throw new Error(`Unbekannter Wetterwert ${value}.`);
  return drawingOf(definition.title, definition.primitives);
}

/** Eine Marke je Stufe, Mitte auf (x | 26). Regen, Hagel und Gewitter sind übertragen. */
const MARK_AT_CLOUD: Readonly<Record<WeatherPrecipitationId, (x: number) => readonly Primitive[]>> = {
  'weather-snowing': (x) => snowflake(x, CLOUD_MARK_CENTER_Y_MM, CLOUD_FLAKE_RADIUS_MM),
  'weather-rainy': (x) => rainMark(x, CLOUD_MARK_CENTER_Y_MM, CLOUD_MARK_HEIGHT_MM),
  'weather-hailing': (x) => hailMark(x, CLOUD_MARK_CENTER_Y_MM, CLOUD_MARK_HEIGHT_MM, CLOUD_HAIL_RADIUS_MM),
  'weather-thunderstorm': (x) => lightningMark(x, CLOUD_MARK_CENTER_Y_MM, CLOUD_MARK_HEIGHT_MM),
};

function precipitationAtCloudDrawing(precipitation: WeatherPrecipitationId, intensity: WeatherIntensity): Drawing {
  if (WEATHER_CLOUD_PRECIPITATION.precipitations[precipitation].status !== 'evidenced') {
    noteDerivation({
      dimension: 'values',
      part: `${precipitation} an der Wolke wie der Schnee gebaut`,
      basis: 'transferred',
      from: `5.8.7_Beispiel_Schneiend_* (${DECISION_REF})`,
    });
  }
  const count = MARKS_PER_INTENSITY[intensity];
  const first = CENTER_X_MM - ((count - 1) * CLOUD_MARK_PITCH_MM) / 2;
  const marks = Array.from({ length: count }, (_, i) => MARK_AT_CLOUD[precipitation](first + i * CLOUD_MARK_PITCH_MM)).flat();
  const title = singleValue(precipitation).title?.toLowerCase() ?? precipitation;
  return drawingOf(`Wolkig, ${title}`, [cloudPrimitive(CLOUD_RAISE_MM), ...marks]);
}

/** Zwei Werte ohne belegte Anordnung, nebeneinander in Katalogreihenfolge. */
function pairDrawing(values: readonly WeatherStateId[]): Drawing {
  const parts = WEATHER_STATES.filter((definition) =>
    values.some((value) => definition.id === `state.${value}`),
  ).map((definition) => ({
    id: definition.id.slice('state.'.length) as WeatherStateId,
    title: definition.title,
    primitives: definition.primitives,
  }));
  const [first, second] = parts;
  if (parts.length !== 2 || first === undefined || second === undefined) {
    throw new Error(`Wetterpaar ${values.join(' + ')}: zwei bekannte Werte erwartet.`);
  }
  return drawingOf(`${first.title}, ${second.title.toLowerCase()}`, weatherPairPrimitives([first, second]));
}

/**
 * Ein Wetterzeichen aus einem Wert, der Wolke mit einem Niederschlag oder zwei Werten
 * nebeneinander, in 32 × 32 mm. Die Reihenfolge der Werte zählt nicht. Wirft ein gewöhnliches
 * `Error`, wenn der Satz gegen eine entschiedene Grenze verstößt (`classifyWeather` → `invalid`).
 */
export function weatherDrawing(parameters: WeatherParameters): Drawing {
  const verdict = classifyWeather(parameters);
  if (verdict.kind === 'invalid') throw new Error(verdict.message);
  if (verdict.form === 'single') return singleValue(parameters.values[0]);
  if (verdict.form === 'pair') return pairDrawing(parameters.values);
  const precipitation = precipitationAtCloud(new Set(parameters.values));
  if (precipitation === undefined || parameters.intensity === undefined) {
    throw new Error('Wetterzeichen: Klassifikation und Zeichnung laufen auseinander.');
  }
  return precipitationAtCloudDrawing(precipitation, parameters.intensity);
}
