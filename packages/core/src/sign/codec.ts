import type { BodySign, Sign, SignExact, SignText } from '@einsatzzeichen/schema';
import {
  BODY_VARIANT_IDS,
  CAPABILITY_IDS,
  FREESTANDING_KINDS,
  FUNCTION_ROLE_IDS,
  ORGANIZATION_IDS,
  STATE_IDS,
  SYMBOL_KINDS,
  TECHNICAL_FILL_TOKENS,
  VEHICLE_CATEGORY_IDS,
  isFreestandingSign,
} from '@einsatzzeichen/schema';
import {
  SpecParseError,
  canonicalAnySpec,
  decodeTextParam,
  encodeTextParam,
  parseAnySpec,
  readFreestandingAt,
  readSymbolSpecAt,
  readTextAt,
} from '../spec-codec.js';
import { fromExact } from './from-exact.js';
import { SIGN_HEAD_VALUES } from './labels.js';

/** Formatversion der Hülle `{"v":2,"sign":{…}}`. Version 1 (`spec`/`freestanding`) bleibt lesbar. */
export const SIGN_FORMAT_VERSION = 2;

/** Feldreihenfolge der kanonischen Beschreibung. */
const BODY_KEYS = [
  'kind',
  'variant',
  'organization',
  'color',
  'tasks',
  'head',
  'role',
  'chassis',
  'states',
  'text',
  'exact',
] as const satisfies readonly (keyof BodySign)[];

const TEXT_KEYS = [
  'center',
  'centerSize',
  'topLeft',
  'topLeftLines',
  'bottomLeft',
  'bottomCenter',
  'bottomRight',
  'below',
  'aboveLeft',
  'belowRight',
  'surfaceBelowLeft',
  'surfaceBelowRight',
] as const satisfies readonly (keyof SignText)[];

const BODY_KEY_SET: ReadonlySet<string> = new Set(BODY_KEYS);
const TEXT_KEY_SET: ReadonlySet<string> = new Set(TEXT_KEYS);
const FREESTANDING_KIND_SET: ReadonlySet<unknown> = new Set(FREESTANDING_KINDS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function describeValue(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'eine Liste';
  if (typeof value === 'string') return `„${value}“`;
  return typeof value;
}

function oneOf(values: readonly string[], value: unknown, path: string, what: string): string {
  if (typeof value !== 'string' || !values.includes(value)) {
    throw new SpecParseError(path, `${describeValue(value)} ist kein Wert für ${what}.`);
  }
  return value;
}

function listOf(values: readonly string[], value: unknown, path: string, what: string): string[] {
  if (!Array.isArray(value)) throw new SpecParseError(path, `erwartet eine Liste, gefunden ${describeValue(value)}.`);
  return value.map((entry, index) => oneOf(values, entry, `${path}[${index}]`, what));
}

/** Wie in jeder Spec: Zeichenkette ohne einzelne Surrogate, die ein URL-Parameter verfälschen würde. */
function text(value: unknown, path: string): string {
  return readTextAt(value, path);
}

function readText(value: unknown, path: string): SignText | undefined {
  if (!isRecord(value)) throw new SpecParseError(path, `erwartet ein Objekt, gefunden ${describeValue(value)}.`);
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    if (!TEXT_KEY_SET.has(key)) {
      throw new SpecParseError(`${path}.${key}`, `unbekannte Textzone „${key}“; erlaubt sind ${TEXT_KEYS.join(', ')}.`);
    }
  }
  for (const key of TEXT_KEYS) {
    const entry = value[key];
    if (entry === undefined) continue;
    const at = `${path}.${key}`;
    if (key === 'centerSize') out[key] = oneOf(['normal', 'large'], entry, at, 'centerSize');
    else if (key === 'topLeftLines') {
      if (!Array.isArray(entry) || entry.length !== 2) {
        throw new SpecParseError(at, 'erwartet genau zwei Zeilen.');
      }
      out[key] = [text(entry[0], `${at}[0]`), text(entry[1], `${at}[1]`)];
    } else out[key] = text(entry, at);
  }
  return Object.keys(out).length > 0 ? (out as SignText) : undefined;
}

function readExact(kind: string, value: unknown, path: string): SignExact | undefined {
  if (!isRecord(value)) throw new SpecParseError(path, `erwartet ein Objekt, gefunden ${describeValue(value)}.`);
  if (Object.hasOwn(value, 'kind')) {
    throw new SpecParseError(`${path}.kind`, 'die Art steht in der Beschreibung, nicht in exact.');
  }
  const { kind: _kind, ...rest } = readSymbolSpecAt({ ...value, kind }, path);
  return Object.keys(rest).length > 0 ? rest : undefined;
}

/** Liest eine Beschreibung streng und gibt sie kanonisch zurück (Feldreihenfolge, ohne Leeres). */
function readSign(value: unknown, path: string): Sign {
  if (!isRecord(value)) throw new SpecParseError(path, `erwartet eine Beschreibung, gefunden ${describeValue(value)}.`);
  if (!Object.hasOwn(value, 'kind') || value.kind === undefined) {
    throw new SpecParseError(`${path}.kind`, 'Pflichtfeld „kind“ fehlt.');
  }
  if (FREESTANDING_KIND_SET.has(value.kind)) return readFreestandingAt(value, path);
  const kind = oneOf(SYMBOL_KINDS, value.kind, `${path}.kind`, 'kind');
  for (const key of Object.keys(value)) {
    if (!BODY_KEY_SET.has(key)) {
      throw new SpecParseError(`${path}.${key}`, `unbekanntes Feld „${key}“; erlaubt sind ${BODY_KEYS.join(', ')}.`);
    }
  }
  if (value.organization !== undefined && value.color !== undefined) {
    throw new SpecParseError(`${path}.color`, 'organization und color schließen sich aus.');
  }
  const out: Record<string, unknown> = { kind };
  const at = (key: string): string => `${path}.${key}`;
  if (value.variant !== undefined) out.variant = oneOf(BODY_VARIANT_IDS, value.variant, at('variant'), 'variant');
  if (value.organization !== undefined) out.organization = oneOf(ORGANIZATION_IDS, value.organization, at('organization'), 'organization');
  if (value.color !== undefined) out.color = oneOf(TECHNICAL_FILL_TOKENS, value.color, at('color'), 'color');
  if (value.tasks !== undefined) {
    const tasks = listOf(CAPABILITY_IDS, value.tasks, at('tasks'), 'tasks');
    if (tasks.length > 0) out.tasks = tasks;
  }
  if (value.head !== undefined) out.head = oneOf(SIGN_HEAD_VALUES, value.head, at('head'), 'head');
  if (value.role !== undefined) out.role = oneOf(FUNCTION_ROLE_IDS, value.role, at('role'), 'role');
  if (value.chassis !== undefined) out.chassis = oneOf(VEHICLE_CATEGORY_IDS, value.chassis, at('chassis'), 'chassis');
  if (value.states !== undefined) {
    const states = listOf(STATE_IDS, value.states, at('states'), 'states');
    if (states.length > 0) out.states = states;
  }
  if (value.text !== undefined) {
    const read = readText(value.text, at('text'));
    if (read !== undefined) out.text = read;
  }
  if (value.exact !== undefined) {
    const read = readExact(kind, value.exact, at('exact'));
    if (read !== undefined) out.exact = read;
  }
  return out as unknown as BodySign;
}

/** Kanonische Form: Felder in fester Reihenfolge, leere Listen und Objekte entfernt. Wirft `SpecParseError`. */
export function canonicalSign(sign: Sign): Sign {
  return isFreestandingSign(sign) ? canonicalAnySpec(sign) : readSign(sign, '$');
}

/** Kanonisches JSON in der Hülle `{"v":2,"sign":{…}}`. */
export function serialize(sign: Sign): string {
  return `{"v":${SIGN_FORMAT_VERSION},"sign":${JSON.stringify(canonicalSign(sign))}}`;
}

/**
 * Liest eine Beschreibung: die Hülle `{"v":2,"sign":{…}}`, die alte Hülle `{"v":1,"spec"|"freestanding":…}`
 * (über `fromExact`) und nackte Baupläne ohne Hülle, wie sie alte Baukasten-Links tragen. Als
 * JSON-Zeichenkette oder schon geparst. Wirft `SpecParseError` mit Pfad in die Eingabe.
 * Kombinationsregeln prüft `parse` nicht; dafür ist `check` da.
 */
export function parse(input: string | unknown): Sign {
  let value: unknown = input;
  if (typeof input === 'string') {
    try {
      value = JSON.parse(input);
    } catch (error) {
      throw new SpecParseError('$', `kein gültiges JSON (${(error as Error).message}).`);
    }
  }
  if (isRecord(value) && value.v === SIGN_FORMAT_VERSION) {
    for (const key of Object.keys(value)) {
      if (key !== 'v' && key !== 'sign') {
        throw new SpecParseError(`$.${key}`, `unbekanntes Feld „${key}“ in der Hülle; erlaubt sind v und sign.`);
      }
    }
    if (value.sign === undefined) throw new SpecParseError('$.sign', 'Pflichtfeld „sign“ fehlt in der Hülle.');
    return readSign(value.sign, '$.sign');
  }
  if (isRecord(value) && Object.hasOwn(value, 'v') && value.v !== 1) {
    throw new SpecParseError(
      '$.v',
      `Formatversion ${describeValue(value.v)} wird nicht gelesen; diese Fassung kennt 1 und ${SIGN_FORMAT_VERSION}.`,
    );
  }
  return fromExact(parseAnySpec(value));
}

/** URL-Form: base64url ohne Füllzeichen über das UTF-8 von `serialize`. */
export function encodeSignParam(sign: Sign): string {
  return encodeTextParam(serialize(sign));
}

/** Umkehrung von `encodeSignParam`; liest auch die Parameter aus `encodeSpecParam` und `encodeAnySpecParam`. */
export function decodeSignParam(param: string): Sign {
  return parse(decodeTextParam(param));
}
