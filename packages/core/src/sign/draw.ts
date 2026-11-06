import type {
  AnySpec,
  BodySign,
  Drawing,
  FreestandingSpec,
  Sign,
  SignText,
  SymbolSpec,
} from '@einsatzzeichen/schema';
import { isFreestandingSign } from '@einsatzzeichen/schema';
import { drawFreestanding } from '../draw-freestanding.js';
import { NotMeasuredError } from '../not-measured.js';
import { explainRejection } from '../rules/rule-explanations.js';
import { canonicalAnySpec } from '../spec-codec.js';
import { specKey } from '../spec-key.js';
import { CompositionError } from '../validate.js';
import { headGroupOf } from './labels.js';
import { attempt, isDerived, isTendency, resolveBody, type Attempt } from './resolve.js';

/** Wie treu das Bild die Beschreibung zeigt. */
export type Fidelity = 'measured' | 'derived' | 'simplified';

/**
 * Was `draw` weglassen musste. `field` ist der Pfad in der Beschreibung (`tasks`, `head`,
 * `text.center`, `exact.labels`, bei einem nicht zeichenbaren Zeichen `kind`), `value` der
 * weggelassene Wert, `why` der Grund in einem Satz.
 */
export interface Omission {
  readonly field: string;
  readonly value: string;
  readonly why: string;
}

export interface Drawn {
  /** Nie leer: zur Not der Körper, sonst der konkrete Punkt. */
  readonly drawing: Drawing;
  /** Der Bauplan, der tatsächlich gezeichnet wurde. */
  readonly exact: AnySpec;
  /**
   * `measured`: alles an einer Fassung der Referenz vermessen. `derived`: vollständig, aber mit
   * abgeleiteten Teilen (`drawing.derivations`). `simplified`: etwas fehlt, siehe `omitted`.
   */
  readonly fidelity: Fidelity;
  readonly omitted: readonly Omission[];
  /** Stabiler Schlüssel des gezeichneten Bauplans, für Cache und Kartenbilder. */
  readonly key: string;
}

export interface DrawOptions {
  readonly title?: string;
  readonly description?: string;
}

/**
 * Zeichnet eine Beschreibung. **Wirft nie wegen einer Regel oder Vermessungslücke**: trägt die
 * Beschreibung als Ganzes nicht, baut `draw` das Zeichen in fester Reihenfolge wieder auf und
 * lässt weg, was nicht passt. Was fehlt, steht mit Grund in `omitted`, und `fidelity` ist
 * `simplified`. Wer kein Weglassen will, fragt vorher `check`.
 *
 * Reihenfolge (wichtig vor weniger wichtig): Art, Organisation, Farbe, Variante, Fahrwerk, Kopf,
 * Funktion, jede Fachaufgabe, jede Textzone, jeder Zustand, jedes Feld aus `exact`. Begonnen wird
 * beim nackten Körper; jedes Teil bleibt, wenn das Zeichen mit ihm noch zeichnet. Zeichnet nicht
 * einmal der Körper, kommt der konkrete Punkt. Ein freistehendes Zeichen, das nicht zeichnet,
 * wird ebenfalls zum Punkt.
 */
export function draw(sign: Sign, options: DrawOptions = {}): Drawn {
  return isFreestandingSign(sign) ? drawFreestandingSign(sign, options) : drawBodySign(sign, options);
}

function drawFreestandingSign(sign: FreestandingSpec, options: DrawOptions): Drawn {
  try {
    const drawing = drawFreestanding(sign, options);
    return {
      drawing,
      exact: sign,
      fidelity: isDerived(drawing) ? 'derived' : 'measured',
      omitted: [],
      key: freestandingKey(sign),
    };
  } catch (error) {
    return pointFallback(sign.kind, error, options);
  }
}

function drawBodySign(given: BodySign, options: DrawOptions): Drawn {
  // Was der Bauplan gar nicht tragen kann, fällt vor dem ersten Versuch weg und steht in
  // `omitted`: ein Kopfwert aus keiner Liste und jede Tendenz nach der ersten.
  const { sign, dropped } = withoutUnresolvable(given);
  const full = resolveBody(sign);
  const first = withOptions(full.spec, full.attempt, options);
  if (first.ok) return done(full.spec, first.drawing, dropped);

  const base: BodySign = { kind: sign.kind };
  const baseSpec = resolveBody(base).spec;
  const baseAttempt = attempt(baseSpec, options);
  if (!baseAttempt.ok) return pointFallback(sign.kind, baseAttempt.error, options);

  let current = base;
  let currentSpec = baseSpec;
  let currentDrawing = baseAttempt.drawing;
  const omitted: Omission[] = [...dropped];
  for (const part of partsOf(sign)) {
    const candidate = part.add(current);
    const resolved = resolveBody(candidate);
    const result = withOptions(resolved.spec, resolved.attempt, options);
    if (result.ok) {
      current = candidate;
      currentSpec = resolved.spec;
      currentDrawing = result.drawing;
    } else {
      omitted.push({ field: part.field, value: part.value, why: whyOf(result.error) });
    }
  }
  return done(currentSpec, currentDrawing, omitted);
}

function withoutUnresolvable(sign: BodySign): { sign: BodySign; dropped: Omission[] } {
  const dropped: Omission[] = [];
  let clean: BodySign = sign;
  if (sign.head !== undefined && headGroupOf(sign.head) === undefined) {
    dropped.push({
      field: 'head',
      value: String(sign.head),
      why: `„${String(sign.head)}“ ist weder Stärke noch Verband, Verwaltungsstufe oder technische Kopfmarke.`,
    });
    const { head: _head, ...rest } = clean;
    clean = rest as BodySign;
  }
  const states = sign.states ?? [];
  const firstTendency = states.find(isTendency);
  const extra = states.filter((state) => isTendency(state) && state !== firstTendency);
  if (extra.length > 0) {
    for (const state of extra) {
      dropped.push({ field: 'states', value: state, why: 'Ein Zeichen trägt höchstens eine Tendenz.' });
    }
    clean = { ...clean, states: states.filter((state) => !extra.includes(state)) };
  }
  return { sign: clean, dropped };
}

/** Der Versuch aus der Fassungswahl gilt nur ohne Optionen; mit Titel wird neu gezeichnet. */
function withOptions(spec: SymbolSpec, known: Attempt | undefined, options: DrawOptions): Attempt {
  if (known !== undefined && !known.ok) return known;
  if (known !== undefined && options.title === undefined && options.description === undefined) return known;
  return attempt(spec, options);
}

function done(spec: SymbolSpec, drawing: Drawing, omitted: readonly Omission[]): Drawn {
  return {
    drawing,
    exact: spec,
    fidelity: omitted.length > 0 ? 'simplified' : isDerived(drawing) ? 'derived' : 'measured',
    omitted,
    key: specKey(spec),
  };
}

const POINT: SymbolSpec = Object.freeze({ kind: 'point' });

function pointFallback(kind: string, error: unknown, options: DrawOptions): Drawn {
  const result = attempt(POINT, options);
  if (!result.ok) throw result.error;
  return done(POINT, result.drawing, [{ field: 'kind', value: kind, why: whyOf(error) }]);
}

/** Der Grund eines gescheiterten Versuchs in einem Satz. */
export function whyOf(error: unknown): string {
  if (error instanceof CompositionError) {
    try {
      const [first] = explainRejection(error);
      if (first !== undefined) return first.message;
    } catch {
      // Eine Regel ohne Erklärung fällt auf die rohe Meldung zurück.
    }
    return error.issues[0]?.message ?? error.message;
  }
  if (error instanceof NotMeasuredError) return error.message;
  return error instanceof Error ? error.message : String(error);
}

function freestandingKey(spec: FreestandingSpec): string {
  try {
    return JSON.stringify(canonicalAnySpec(spec));
  } catch {
    return JSON.stringify(spec);
  }
}

interface Part {
  readonly field: string;
  readonly value: string;
  readonly add: (sign: BodySign) => BodySign;
}

const TEXT_ORDER = [
  'center',
  'bottomRight',
  'bottomLeft',
  'bottomCenter',
  'topLeft',
  'topLeftLines',
  'below',
  'aboveLeft',
  'belowRight',
  'surfaceBelowLeft',
  'surfaceBelowRight',
] as const satisfies readonly Exclude<keyof SignText, 'centerSize'>[];

/** Die Teile einer Beschreibung in der Reihenfolge, in der `draw` sie wieder aufbaut. */
function partsOf(sign: BodySign): Part[] {
  const parts: Part[] = [];
  const set = (field: keyof BodySign, value: string, patch: Partial<Record<keyof BodySign, unknown>>): void => {
    parts.push({ field, value, add: (s) => ({ ...s, ...patch }) as BodySign });
  };
  if (sign.organization !== undefined) set('organization', sign.organization, { organization: sign.organization });
  if (sign.color !== undefined) set('color', sign.color, { color: sign.color });
  if (sign.variant !== undefined) set('variant', sign.variant, { variant: sign.variant });
  if (sign.chassis !== undefined) set('chassis', sign.chassis, { chassis: sign.chassis });
  if (sign.head !== undefined) set('head', sign.head, { head: sign.head });
  if (sign.role !== undefined) set('role', sign.role, { role: sign.role });
  for (const task of sign.tasks ?? []) {
    parts.push({ field: 'tasks', value: task, add: (s) => ({ ...s, tasks: [...(s.tasks ?? []), task] }) });
  }
  const text = sign.text ?? {};
  for (const zone of TEXT_ORDER) {
    const value = text[zone];
    if (value === undefined) continue;
    const patch: Partial<SignText> =
      zone === 'center' && text.centerSize !== undefined ? { center: text.center, centerSize: text.centerSize } : { [zone]: value };
    parts.push({
      field: `text.${zone}`,
      value: Array.isArray(value) ? value.join(' / ') : (value as string),
      add: (s) => ({ ...s, text: { ...s.text, ...patch } }),
    });
  }
  for (const state of sign.states ?? []) {
    parts.push({ field: 'states', value: state, add: (s) => ({ ...s, states: [...(s.states ?? []), state] }) });
  }
  for (const [key, value] of Object.entries(sign.exact ?? {})) {
    if (value === undefined) continue;
    parts.push({
      field: `exact.${key}`,
      value: typeof value === 'string' ? value : JSON.stringify(value),
      add: (s) => ({ ...s, exact: { ...s.exact, [key]: value } }),
    });
  }
  return parts;
}

/**
 * Die Zeichnung zu einer Eingabe, die eine fertige `Drawing` oder eine Beschreibung sein darf —
 * für Kanäle wie React, MapLibre und das Web Component, die beides annehmen. Eine Zeichnung
 * erkennt sie an `viewBox` und `children`; alles andere geht durch `draw`.
 */
export function drawingOf(input: Drawing | Sign, options: DrawOptions = {}): Drawing {
  return isDrawing(input) ? input : draw(input, options).drawing;
}

function isDrawing(input: Drawing | Sign): input is Drawing {
  return 'viewBox' in input && 'children' in input;
}
