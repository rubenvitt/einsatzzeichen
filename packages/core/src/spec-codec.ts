import {
  ADMIN_LEVEL_IDS,
  ANIMAL_STATE_IDS,
  BODY_VARIANT_IDS,
  CAPABILITY_IDS,
  FREESTANDING_KINDS,
  FUNCTION_ROLE_IDS,
  LINE_IDS,
  MOVEMENT_IDS,
  ORGANIZATION_IDS,
  PALETTE,
  STATE_IDS,
  STRENGTH_IDS,
  SYMBOL_KINDS,
  TECHNICAL_BODY_MARK_IDS,
  TECHNICAL_HEAD_MARK_IDS,
  TENDENCY_IDS,
  UNIT_GROUPING_IDS,
  VEHICLE_CATEGORY_IDS,
  WEATHER_INTENSITIES,
  WEATHER_STATE_IDS,
  isFreestandingSpec,
  type AnimalStateSpec,
  type AnySpec,
  type BodyLabelInk,
  type BodyLabels,
  type CanvasMm,
  type DepictionVariant,
  type FreestandingKind,
  type FreestandingSpec,
  type LineSpec,
  type MovementSpec,
  type SymbolSpec,
  type WeatherSpec,
} from '@einsatzzeichen/schema';

/**
 * Kanonische Serialisierung einer `SymbolSpec` (LFH-577): JSON für Dateien und Skripte, base64url
 * für URLs (Baukasten, MapLibre, QGIS).
 *
 * **Die Hülle.** Serialisiert wird nicht die nackte Spec, sondern `{"v":1,"spec":{…}}`:
 *
 * - Die Formatversion gehört zum Format, nicht zum Zeichen. Ein Feld `v` in der Spec selbst wäre
 *   ein neues Feld am Schema-Typ und ließe sich von einer künftigen Spec-Dimension nicht mehr
 *   sauber trennen.
 * - Die Nutzlast steht unter einem **benannten** Schlüssel. Die zweite Spec-Art, die
 *   freistehenden Zeichen (LFH-577), hat den eigenen Schlüssel `freestanding` neben `spec`
 *   (`serializeAnySpec`, `parseAnySpec`), ohne dass sich an `spec` etwas geändert hat. `parseSpec`
 *   lehnt den fremden Schlüssel weiter mit Pfad ab, statt ihn als Formation zu deuten (fail-closed).
 * - `v` bleibt 1, solange Änderungen **additiv** sind: neue optionale Felder (Zustände, Tendenz,
 *   Pfeile, …) lesen neue Leser in alten Dokumenten nie, und ein alter Leser lehnt sie mit Pfad ab
 *   — was richtig ist, weil er sie nicht zeichnen könnte. Erhöht wird `v` nur, wenn ein bestehendes
 *   Feld seine Form oder Bedeutung ändert.
 *
 * **Kanonisch heißt:** Schlüssel alphabetisch sortiert (auch in `labels` und den `…Metrics`),
 * `undefined` wie ein fehlendes Feld, nur eigene aufzählbare Felder. **Nicht** sortiert werden
 * `bodyMarks` und `capabilities` — anders als in `specKey`. Nachgemessen an allen 28 Rezepten mit
 * mindestens zwei Körpermarken (LFH-577, 29.09.2026): jede Umstellung ändert das SVG, und zwar
 * die Übermalungsreihenfolge der Primitive **und** den Beschreibungstext (`<desc>`) für
 * Screenreader. Eine sortierende Form verstieße gegen `decode(encode(x))` zeichnet wie `x`. Zwei
 * Specs, die sich nur in der Reihenfolge unterscheiden, haben deshalb denselben `specKey`, aber
 * verschiedene Serialisierungen; das ist gewollt.
 *
 * **Geprüft wird Form und Wertevorrat, nicht die Grammatik.** Ob Organisation und technische
 * Füllung zusammen erlaubt sind, ob ein Körpermarkenpaar vermessen ist, entscheiden weiterhin
 * `validateSpec` und `compose`. `parseSpec` sichert nur zu, dass das Ergebnis eine `SymbolSpec`
 * im Sinne des Typs ist — mit Werten aus den Wertelisten des Schemas.
 */

/** Formatversion der Hülle `{"v":1,"spec":{…}}`. */
export const SPEC_FORMAT_VERSION = 1;

/**
 * Formfehler beim Lesen einer serialisierten Spec. `path` zeigt in die Eingabe, wie sie gegeben
 * wurde (`$` ist die Wurzel, `$.spec.labels.center` ein Feld in der Hülle, `$.bodyMarks[1]` ein
 * Listeneintrag); `reason` ist die Meldung ohne Pfad, etwa für eine Oberfläche, die den Pfad
 * selbst anzeigt.
 */
export class SpecParseError extends Error {
  readonly path: string;
  readonly reason: string;

  constructor(path: string, reason: string) {
    super(`${path}: ${reason}`);
    this.name = 'SpecParseError';
    this.path = path;
    this.reason = reason;
  }
}

/* --- Leser ------------------------------------------------------------------------------ */

type Reader = (value: unknown, path: string) => unknown;

function describeValue(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'eine Liste';
  if (typeof value === 'string') return `„${value}“`;
  if (typeof value === 'object') return 'ein Objekt';
  return `${typeof value === 'number' ? 'die Zahl' : typeof value} ${String(value)}`;
}

function fieldPath(path: string, key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? `${path}.${key}` : `${path}[${JSON.stringify(key)}]`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Einzelne Surrogate überstehen UTF-8 nicht (TextEncoder macht U+FFFD daraus). */
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

const text: Reader = (value, path) => {
  if (typeof value !== 'string') {
    throw new SpecParseError(path, `erwartet eine Zeichenkette, gefunden ${describeValue(value)}.`);
  }
  if (LONE_SURROGATE.test(value)) {
    throw new SpecParseError(path, 'die Zeichenkette ist kein gültiges Unicode (einzelnes Surrogat).');
  }
  return value;
};

const finiteNumber: Reader = (value, path) => {
  if (typeof value !== 'number') {
    throw new SpecParseError(path, `erwartet eine Zahl in Millimetern, gefunden ${describeValue(value)}.`);
  }
  if (!Number.isFinite(value)) {
    throw new SpecParseError(path, `erwartet eine endliche Zahl, gefunden ${String(value)}.`);
  }
  return value;
};

const literalTrue: Reader = (value, path) => {
  if (value !== true) {
    throw new SpecParseError(path, `erlaubt ist nur true (sonst das Feld weglassen), gefunden ${describeValue(value)}.`);
  }
  return true;
};

/**
 * Wert aus einer geschlossenen Liste. Kurze Listen stehen in der Meldung, lange verweisen auf die
 * exportierte Konstante des Schemas — neunzig Fähigkeiten helfen in einer Fehlermeldung niemandem.
 */
function oneOf(values: readonly string[], listName: string): Reader {
  const allowed = new Set(values);
  const hint = values.length <= 12 ? `erlaubt sind: ${values.join(', ')}` : `erlaubt sind die Werte aus ${listName}`;
  return (value, path) => {
    text(value, path);
    if (!allowed.has(value as string)) {
      throw new SpecParseError(path, `unbekannter Wert ${describeValue(value)}; ${hint}.`);
    }
    return value;
  };
}

/** Liste in gegebener Reihenfolge — die Reihenfolge ist Teil des Zeichens (siehe Modulkopf). */
function list(item: Reader): Reader {
  return (value, path) => {
    if (!Array.isArray(value)) {
      throw new SpecParseError(path, `erwartet eine Liste, gefunden ${describeValue(value)}.`);
    }
    return Array.from(value, (entry, index) => item(entry, `${path}[${index}]`));
  };
}

function pair(item: Reader): Reader {
  return (value, path) => {
    if (!Array.isArray(value) || value.length !== 2) {
      throw new SpecParseError(path, `erwartet eine Liste mit genau zwei Einträgen, gefunden ${describeValue(value)}.`);
    }
    return [item(value[0], `${path}[0]`), item(value[1], `${path}[1]`)];
  };
}

/**
 * Objekt mit geschlossener Feldmenge. Unbekannte Felder werden abgelehnt, nicht übergangen: ein
 * Tippfehler wie `organisation` fiele sonst still weg, und das Zeichen sähe anders aus als gemeint.
 * Das Ergebnis trägt die Schlüssel alphabetisch; `undefined` zählt als fehlend.
 */
function record(fields: Readonly<Record<string, Reader>>, required: readonly string[], what: string): Reader {
  const known = Object.keys(fields).sort();
  return (value, path) => {
    if (!isRecord(value)) {
      throw new SpecParseError(path, `erwartet ein Objekt (${what}), gefunden ${describeValue(value)}.`);
    }
    for (const key of Object.keys(value)) {
      if (!Object.hasOwn(fields, key)) {
        throw new SpecParseError(fieldPath(path, key), `unbekanntes Feld „${key}“ in ${what}.`);
      }
    }
    for (const key of required) {
      if (!Object.hasOwn(value, key) || value[key] === undefined) {
        throw new SpecParseError(fieldPath(path, key), `Pflichtfeld „${key}“ fehlt in ${what}.`);
      }
    }
    const result: Record<string, unknown> = {};
    for (const key of known) {
      if (!Object.hasOwn(value, key)) continue;
      const field = value[key];
      if (field === undefined) continue;
      if (field === null) {
        throw new SpecParseError(fieldPath(path, key), 'null ist kein zulässiger Wert; ein nicht gesetztes Feld wird weggelassen.');
      }
      result[key] = fields[key]!(field, fieldPath(path, key));
    }
    return result;
  };
}

/* --- Feldtabellen ----------------------------------------------------------------------- */

/*
 * Die Tabellen sind über die Schlüssel des Schema-Typs vollständig: bekommt `SymbolSpec` oder
 * `BodyLabels` ein neues Feld, lehnt der Compiler die Tabelle ab, bis es hier einen Leser hat. So
 * kann ein neues Feld nicht still als „unbekannt" abgelehnt werden.
 */
type FieldTable<T> = { readonly [K in keyof Required<T>]: Reader };

const BODY_LABEL_INKS = Object.keys({ schwarz: true, weiss: true } satisfies Record<BodyLabelInk, true>);
const ACCESSIBILITY_MODES = Object.keys({ 'neutral-zones': true } satisfies Record<
  NonNullable<BodyLabels['accessibilityMode']>,
  true
>);
const COLOR_TOKENS = Object.keys(PALETTE);

type TopLeftMetrics = NonNullable<BodyLabels['topLeftMetrics']>;
type AboveLeftMetrics = NonNullable<BodyLabels['aboveLeftMetrics']>;
type BottomRightMetrics = NonNullable<BodyLabels['bottomRightMetrics']>;

const TEXT_RUN_METRICS: FieldTable<TopLeftMetrics> & FieldTable<AboveLeftMetrics> = {
  capHeightMm: finiteNumber,
  baselineFromBodyTopMm: finiteNumber,
  anchorFromBodyLeftMm: finiteNumber,
};

const BOTTOM_RIGHT_METRICS: FieldTable<BottomRightMetrics> = {
  ...TEXT_RUN_METRICS,
  boxLeftFromBodyLeftMm: finiteNumber,
  boxWidthMm: finiteNumber,
};

/** Die Metriksätze sind im Typ vollständig Pflicht — ein halber Satz ist kein Override. */
const textRunMetrics = record(TEXT_RUN_METRICS, Object.keys(TEXT_RUN_METRICS), 'einem Metriksatz');
const bottomRightMetrics = record(BOTTOM_RIGHT_METRICS, Object.keys(BOTTOM_RIGHT_METRICS), 'bottomRightMetrics');

const LABEL_FIELDS: FieldTable<BodyLabels> = {
  accessibilityMode: oneOf(ACCESSIBILITY_MODES, 'accessibilityMode'),
  inBodyInk: oneOf(BODY_LABEL_INKS, 'BodyLabelInk'),
  center: text,
  centerAnchorFromBodyLeftMm: finiteNumber,
  centerBaselineFromBodyBottomMm: finiteNumber,
  centerBoxMarginMm: finiteNumber,
  bottomLeft: text,
  bottomCenter: text,
  bottomRight: text,
  bottomRightMetrics,
  topLeft: text,
  topLeftMetrics: textRunMetrics,
  aboveLeft: text,
  aboveLeftMetrics: textRunMetrics,
  topLeftLines: pair(text),
  belowRight: text,
  surfaceBelowLeft: text,
  surfaceBelowRight: text,
  centerCapHeightMm: finiteNumber,
};

const SPEC_FIELDS: FieldTable<SymbolSpec> = {
  kind: oneOf(SYMBOL_KINDS, 'SYMBOL_KINDS'),
  functionRole: oneOf(FUNCTION_ROLE_IDS, 'FUNCTION_ROLE_IDS'),
  bodyVariant: oneOf(BODY_VARIANT_IDS, 'BODY_VARIANT_IDS'),
  organization: oneOf(ORGANIZATION_IDS, 'ORGANIZATION_IDS'),
  technicalFill: oneOf(COLOR_TOKENS, 'PALETTE (Farbtokens)'),
  whiteInnerContour: literalTrue,
  strength: oneOf(STRENGTH_IDS, 'STRENGTH_IDS'),
  technicalHeadMark: oneOf(TECHNICAL_HEAD_MARK_IDS, 'TECHNICAL_HEAD_MARK_IDS'),
  administrativeLevel: oneOf(ADMIN_LEVEL_IDS, 'ADMIN_LEVEL_IDS'),
  unitGrouping: oneOf(UNIT_GROUPING_IDS, 'UNIT_GROUPING_IDS'),
  vehicleCategory: oneOf(VEHICLE_CATEGORY_IDS, 'VEHICLE_CATEGORY_IDS'),
  // Der volle Vorrat aus 5.8: dass Wetter, Tierzustand und Tendenz nicht in `states` gehören, ist
  // eine Regel (`state-value-not-attachable`), kein Formfehler. Die Reihenfolge bleibt wie bei
  // `bodyMarks` erhalten.
  states: list(oneOf(STATE_IDS, 'STATE_IDS')),
  // Ein Einzelwert: eine Liste lehnt der Leser schon der Form nach ab.
  tendency: oneOf(TENDENCY_IDS, 'TENDENCY_IDS'),
  capabilities: list(oneOf(CAPABILITY_IDS, 'CAPABILITY_IDS')),
  bodyMarks: list(oneOf([...CAPABILITY_IDS, ...TECHNICAL_BODY_MARK_IDS], 'CAPABILITY_IDS und TECHNICAL_BODY_MARK_IDS')),
  designation: text,
  labels: record(LABEL_FIELDS, [], 'labels'),
};

const readSpec = record(SPEC_FIELDS, ['kind'], 'der SymbolSpec');

/* --- Freistehende Zeichen (LFH-577) ------------------------------------------------------- */

/*
 * Dieselben Leser wie für die `SymbolSpec`, je Art eine geschlossene Feldtabelle. Die Art wird
 * zuerst am Feld `kind` gelesen, dann die Tabelle genau dieser Art: ein Feld einer anderen Art
 * (etwa `strength` an einem Pfeil) ist damit ein unbekanntes Feld mit Pfad, keine stille Beigabe.
 */

const positiveNumber: Reader = (value, path) => {
  finiteNumber(value, path);
  if ((value as number) <= 0) {
    throw new SpecParseError(path, `erwartet eine Zahl größer als null, gefunden ${String(value)}.`);
  }
  return value;
};

/** Ein Stützpunkt: genau zwei endliche Zahlen in Millimetern der Zeichenfläche. */
const point = pair(finiteNumber);

/** Liste mit Mindestlänge, etwa zwei Stützpunkte oder ein Wetterwert. */
function listOfAtLeast(item: Reader, minimum: number, what: string): Reader {
  const read = list(item);
  return (value, path) => {
    const result = read(value, path) as unknown[];
    if (result.length < minimum) {
      throw new SpecParseError(path, `erwartet mindestens ${what}, gefunden ${result.length}.`);
    }
    return result;
  };
}

const POINTS_PATH_FIELDS = { points: listOfAtLeast(point, 2, 'zwei Stützpunkte') };
const STRAIGHT_PATH_FIELDS = { start: point, directionDeg: finiteNumber, lengthMm: positiveNumber };
const readPointsPath = record(POINTS_PATH_FIELDS, ['points'], 'dem Verlauf');
const readStraightPath = record(STRAIGHT_PATH_FIELDS, Object.keys(STRAIGHT_PATH_FIELDS), 'dem Verlauf');

/**
 * `PathParameters` hat zwei Schreibweisen, die einander ausschließen: Stützpunkte oder ein gerader
 * Verlauf aus Anfang, Richtung und Länge. Beide zugleich wären zwei Verläufe; welcher gälte, legte
 * der Leser fest statt der Schreiberin — deshalb abgelehnt.
 */
const pathParameters: Reader = (value, path) => {
  if (!isRecord(value)) {
    throw new SpecParseError(path, `erwartet ein Objekt (einen Verlauf), gefunden ${describeValue(value)}.`);
  }
  const has = (key: string) => Object.hasOwn(value, key) && value[key] !== undefined;
  const byPoints = has('points');
  const straight = Object.keys(STRAIGHT_PATH_FIELDS).some(has);
  if (byPoints && straight) {
    throw new SpecParseError(path, 'ein Verlauf ist entweder points oder start, directionDeg und lengthMm, nicht beides.');
  }
  if (byPoints) return readPointsPath(value, path);
  if (straight) return readStraightPath(value, path);
  throw new SpecParseError(path, 'erwartet einen Verlauf: points oder start, directionDeg und lengthMm.');
};

const canvasMm = record(
  { width: positiveNumber, height: positiveNumber } satisfies FieldTable<CanvasMm>,
  ['width', 'height'],
  'canvasMm',
);

const DEPICTION_VARIANTS = Object.keys({ primary: true, alternative: true } satisfies Record<DepictionVariant, true>);

const MOVEMENT_FIELDS: FieldTable<MovementSpec> = {
  kind: oneOf(['movement'], 'FREESTANDING_KINDS'),
  movement: oneOf(MOVEMENT_IDS, 'MOVEMENT_IDS'),
  path: pathParameters,
  canvasMm,
};

const LINE_FIELDS: FieldTable<LineSpec> = {
  kind: oneOf(['line'], 'FREESTANDING_KINDS'),
  line: oneOf(LINE_IDS, 'LINE_IDS'),
  path: pathParameters,
  // Der volle Vorrat: dass die Stärke nur an 2.20 gehört, ist eine Regel
  // (`line-strength-mismatch`), kein Formfehler — wie beim Zustand am falschen Träger.
  strength: oneOf(STRENGTH_IDS, 'STRENGTH_IDS'),
  variant: oneOf(DEPICTION_VARIANTS, 'DepictionVariant'),
  canvasMm,
};

const WEATHER_FIELDS: FieldTable<WeatherSpec> = {
  kind: oneOf(['weather'], 'FREESTANDING_KINDS'),
  // Nur die Wetterwerte aus 5.8.7, nicht der volle Vorrat aus `STATE_IDS`: ein Tierzustand im
  // Wetterzeichen ist kein Wert dieser Art. Die Reihenfolge bleibt wie geschrieben.
  values: listOfAtLeast(oneOf(WEATHER_STATE_IDS, 'WEATHER_STATE_IDS'), 1, 'einen Wetterwert'),
  intensity: oneOf(WEATHER_INTENSITIES, 'WEATHER_INTENSITIES'),
};

const ANIMAL_STATE_FIELDS: FieldTable<AnimalStateSpec> = {
  kind: oneOf(['animal-state'], 'FREESTANDING_KINDS'),
  state: oneOf(ANIMAL_STATE_IDS, 'ANIMAL_STATE_IDS'),
  variant: oneOf(DEPICTION_VARIANTS, 'DepictionVariant'),
};

const FREESTANDING_READERS: { readonly [K in FreestandingKind]: Reader } = {
  movement: record(MOVEMENT_FIELDS, ['kind', 'movement', 'path'], 'einem Pfeil (movement)'),
  line: record(LINE_FIELDS, ['kind', 'line', 'path'], 'einer Linie (line)'),
  weather: record(WEATHER_FIELDS, ['kind', 'values'], 'einem Wetterzeichen (weather)'),
  'animal-state': record(ANIMAL_STATE_FIELDS, ['kind', 'state'], 'einem Tierzustand (animal-state)'),
};

const freestandingKind = oneOf(FREESTANDING_KINDS, 'FREESTANDING_KINDS');

const readFreestanding: Reader = (value, path) => {
  if (!isRecord(value)) {
    throw new SpecParseError(path, `erwartet ein Objekt (ein freistehendes Zeichen), gefunden ${describeValue(value)}.`);
  }
  const kindPath = fieldPath(path, 'kind');
  if (!Object.hasOwn(value, 'kind') || value.kind === undefined) {
    throw new SpecParseError(kindPath, 'Pflichtfeld „kind“ fehlt im freistehenden Zeichen.');
  }
  const kind = freestandingKind(value.kind, kindPath) as FreestandingKind;
  return FREESTANDING_READERS[kind](value, path);
};

const FREESTANDING_KIND_SET: ReadonlySet<unknown> = new Set(FREESTANDING_KINDS);

/* --- Öffentliche API -------------------------------------------------------------------- */

/**
 * Kanonische Form einer Spec: gleichwertig, Schlüssel sortiert, `undefined` entfernt, Listen in
 * ihrer Reihenfolge, keine geteilten Objekte mit dem Original. Prüft dabei die Form wie
 * `parseSpec` und wirft `SpecParseError` — eine kanonische Form gibt es nur für lesbare Specs.
 */
export function canonicalSpec(spec: SymbolSpec): SymbolSpec {
  return readSpec(spec, '$') as SymbolSpec;
}

/**
 * Kanonisches JSON mit Formatversion: `{"v":1,"spec":{…}}`. Zwei Specs mit gleichem Inhalt
 * ergeben dieselbe Zeichenkette, unabhängig von der Schlüsselreihenfolge. Was `parseSpec` nicht
 * wieder läse, wird gar nicht erst geschrieben (`SpecParseError`).
 */
export function serializeSpec(spec: SymbolSpec): string {
  return `{"v":${SPEC_FORMAT_VERSION},"spec":${JSON.stringify(canonicalSpec(spec))}}`;
}

const ENVELOPE_KEYS: ReadonlySet<string> = new Set(['v', 'spec']);

function checkFormatVersion(version: unknown): void {
  if (version !== SPEC_FORMAT_VERSION) {
    throw new SpecParseError(
      '$.v',
      `Formatversion ${describeValue(version).replace(/^die Zahl /, '')} wird nicht gelesen; ` +
        `diese Fassung kennt nur Version ${SPEC_FORMAT_VERSION}.`,
    );
  }
}

/**
 * Liest eine Spec streng: als JSON-Zeichenkette oder als bereits geparster Wert, in der Hülle
 * `{"v":1,"spec":{…}}` oder als nackte `SymbolSpec` (so schrieb der Baukasten bis LFH-577 seine
 * Links). Eine Hülle erkennt der Leser am eigenen Feld `v`. Abgelehnt werden unbekannte Felder,
 * Werte außerhalb der Wertelisten, falsche Typen und `null` — jeweils mit Pfad in die Eingabe.
 * Das Ergebnis ist kanonisch (siehe `canonicalSpec`). Kombinationsregeln prüft es nicht.
 */
export function parseSpec(input: string | unknown): SymbolSpec {
  let value: unknown = input;
  if (typeof input === 'string') {
    try {
      value = JSON.parse(input);
    } catch (error) {
      throw new SpecParseError('$', `kein gültiges JSON (${(error as Error).message}).`);
    }
  }
  if (!isRecord(value)) {
    throw new SpecParseError(
      '$',
      `erwartet ein Objekt — eine SymbolSpec oder die Hülle {"v":${SPEC_FORMAT_VERSION},"spec":{…}} —, gefunden ${describeValue(value)}.`,
    );
  }
  if (!Object.hasOwn(value, 'v')) return readSpec(value, '$') as SymbolSpec;

  checkFormatVersion(value.v);
  for (const key of Object.keys(value)) {
    if (!ENVELOPE_KEYS.has(key)) {
      throw new SpecParseError(fieldPath('$', key), `unbekanntes Feld „${key}“ in der Hülle; erlaubt sind v und spec.`);
    }
  }
  if (!Object.hasOwn(value, 'spec') || value.spec === undefined) {
    throw new SpecParseError('$.spec', 'Pflichtfeld „spec“ fehlt in der Hülle.');
  }
  return readSpec(value.spec, '$.spec') as SymbolSpec;
}

/* --- Beide Spec-Arten (LFH-577) ---------------------------------------------------------- */

/**
 * Kanonische Form einer Spec beider Arten, wie `canonicalSpec`: Schlüssel sortiert, `undefined`
 * entfernt, Listen in ihrer Reihenfolge — auch die Stützpunkte und die Wetterwerte.
 */
export function canonicalAnySpec(spec: SymbolSpec): SymbolSpec;
export function canonicalAnySpec(spec: FreestandingSpec): FreestandingSpec;
export function canonicalAnySpec(spec: AnySpec): AnySpec;
export function canonicalAnySpec(spec: AnySpec): AnySpec {
  return isFreestandingSpec(spec) ? (readFreestanding(spec, '$') as FreestandingSpec) : canonicalSpec(spec);
}

/**
 * Kanonisches JSON für beide Spec-Arten. Eine `SymbolSpec` steht wie bei `serializeSpec` unter
 * `spec` (die Zeichenkette ist dieselbe), ein freistehendes Zeichen unter dem eigenen Schlüssel
 * `freestanding`: `{"v":1,"freestanding":{…}}`. Ein Leser, der nur `parseSpec` kennt, lehnt diesen
 * Schlüssel mit Pfad ab, statt ihn als Grundzeichen zu deuten.
 */
export function serializeAnySpec(spec: AnySpec): string {
  if (!isFreestandingSpec(spec)) return serializeSpec(spec);
  return `{"v":${SPEC_FORMAT_VERSION},"freestanding":${JSON.stringify(canonicalAnySpec(spec))}}`;
}

const ANY_ENVELOPE_KEYS: ReadonlySet<string> = new Set(['v', 'spec', 'freestanding']);

/**
 * Liest eine Spec beider Arten so streng wie `parseSpec`: in der Hülle mit `spec` oder
 * `freestanding` (genau einem von beiden), oder nackt — dann entscheidet das Feld `kind`, welche
 * Art gelesen wird. Abgelehnt werden unbekannte Felder je Art, Werte außerhalb der Wertelisten,
 * ein Verlauf mit weniger als zwei Stützpunkten oder in beiden Schreibweisen zugleich,
 * nicht endliche Zahlen und eine Zeichenfläche ohne positive Maße — jeweils mit Pfad. Regeln wie
 * die Stärke an der falschen Linie prüft erst `validateFreestandingSpec`.
 */
export function parseAnySpec(input: string | unknown): AnySpec {
  let value: unknown = input;
  if (typeof input === 'string') {
    try {
      value = JSON.parse(input);
    } catch (error) {
      throw new SpecParseError('$', `kein gültiges JSON (${(error as Error).message}).`);
    }
  }
  if (!isRecord(value)) {
    throw new SpecParseError(
      '$',
      `erwartet ein Objekt — eine Spec oder die Hülle {"v":${SPEC_FORMAT_VERSION},"spec":{…}} bzw. ` +
        `{"v":${SPEC_FORMAT_VERSION},"freestanding":{…}} —, gefunden ${describeValue(value)}.`,
    );
  }
  if (!Object.hasOwn(value, 'v')) {
    return FREESTANDING_KIND_SET.has(value.kind)
      ? (readFreestanding(value, '$') as FreestandingSpec)
      : (readSpec(value, '$') as SymbolSpec);
  }

  checkFormatVersion(value.v);
  for (const key of Object.keys(value)) {
    if (!ANY_ENVELOPE_KEYS.has(key)) {
      throw new SpecParseError(
        fieldPath('$', key),
        `unbekanntes Feld „${key}“ in der Hülle; erlaubt sind v und entweder spec oder freestanding.`,
      );
    }
  }
  const hasSpec = Object.hasOwn(value, 'spec') && value.spec !== undefined;
  const hasFreestanding = Object.hasOwn(value, 'freestanding') && value.freestanding !== undefined;
  if (hasSpec && hasFreestanding) {
    throw new SpecParseError('$', 'die Hülle trägt entweder spec oder freestanding, nicht beides.');
  }
  if (hasFreestanding) return readFreestanding(value.freestanding, '$.freestanding') as FreestandingSpec;
  if (!hasSpec) throw new SpecParseError('$.spec', 'Pflichtfeld „spec“ oder „freestanding“ fehlt in der Hülle.');
  return readSpec(value.spec, '$.spec') as SymbolSpec;
}

/* --- URL-Form --------------------------------------------------------------------------- */

const BASE64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** Ohne `btoa`/`Buffer`: `btoa` nimmt nur Latin-1, `Buffer` gibt es im Browser nicht. */
function toBase64url(bytes: Uint8Array): string {
  let out = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index]!;
    const b = bytes[index + 1];
    const c = bytes[index + 2];
    out += BASE64URL[a >> 2]! + BASE64URL[((a & 0b11) << 4) | ((b ?? 0) >> 4)]!;
    if (b !== undefined) out += BASE64URL[((b & 0b1111) << 2) | ((c ?? 0) >> 6)]!;
    if (c !== undefined) out += BASE64URL[c & 0b111111]!;
  }
  return out;
}

function fromBase64url(param: string): Uint8Array {
  const body = param.replace(/={1,2}$/, '');
  if (!/^[A-Za-z0-9_-]*$/.test(body) || body.length % 4 === 1) {
    throw new SpecParseError(
      '$',
      'der URL-Parameter ist kein gültiges base64url (erlaubt sind A–Z, a–z, 0–9, „-“ und „_“).',
    );
  }
  const bytes = new Uint8Array(Math.floor((body.length * 3) / 4));
  let buffer = 0;
  let bits = 0;
  let offset = 0;
  for (const character of body) {
    buffer = (buffer << 6) | BASE64URL.indexOf(character);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[offset++] = (buffer >> bits) & 0xff;
    }
  }
  return bytes;
}

/** URL-Form: base64url ohne Füllzeichen über das UTF-8 von `serializeSpec`. */
export function encodeSpecParam(spec: SymbolSpec): string {
  return toBase64url(new TextEncoder().encode(serializeSpec(spec)));
}

/**
 * Umkehrung von `encodeSpecParam`. Liest auch die Links des Baukastens von vor LFH-577
 * (base64url über das rohe JSON der Spec, ohne Hülle) — beide Formen unterscheidet `parseSpec`.
 * Füllzeichen am Ende sind erlaubt. Wirft `SpecParseError`, nie eine leere Spec.
 */
export function decodeSpecParam(param: string): SymbolSpec {
  return parseSpec(utf8OfParam(param));
}

function utf8OfParam(param: string): string {
  const bytes = fromBase64url(param);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new SpecParseError('$', 'der URL-Parameter enthält kein gültiges UTF-8.');
  }
}

/** URL-Form beider Spec-Arten: base64url ohne Füllzeichen über das UTF-8 von `serializeAnySpec`. */
export function encodeAnySpecParam(spec: AnySpec): string {
  return toBase64url(new TextEncoder().encode(serializeAnySpec(spec)));
}

/**
 * Umkehrung von `encodeAnySpecParam`; liest auch jeden Parameter aus `encodeSpecParam` und die
 * alten Baukasten-Links. Wirft `SpecParseError`.
 */
export function decodeAnySpecParam(param: string): AnySpec {
  return parseAnySpec(utf8OfParam(param));
}
