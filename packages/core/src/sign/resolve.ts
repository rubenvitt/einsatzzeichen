import type {
  AnySpec,
  BodyLabels,
  BodySign,
  CapabilityId,
  Drawing,
  FreestandingSpec,
  Sign,
  SignText,
  StateId,
  SymbolSpec,
} from '@einsatzzeichen/schema';
import { TENDENCY_IDS, isFreestandingSign } from '@einsatzzeichen/schema';
import type { ComposeOptions } from '../compose.js';
import { drawSymbol } from '../default-ports.js';
import { LARGE_CENTER_CAP_HEIGHT_MM } from '../derive/circle.js';
import { headGroupOf } from './labels.js';

/** Ausgang eines Zeichenversuchs: Zeichnung oder der Fehler, der sie verhindert hat. */
export type Attempt = { readonly ok: true; readonly drawing: Drawing } | { readonly ok: false; readonly error: unknown };

/** Zeichnet einen Bauplan ohne Wurf. */
export function attempt(spec: SymbolSpec, options?: ComposeOptions): Attempt {
  try {
    return { ok: true, drawing: drawSymbol(spec, options) };
  } catch (error) {
    return { ok: false, error };
  }
}

export function isDerived(drawing: Drawing): boolean {
  return drawing.derivations !== undefined && drawing.derivations.length > 0;
}

const TENDENCY_SET: ReadonlySet<string> = new Set(TENDENCY_IDS);

export function isTendency(state: StateId): boolean {
  return TENDENCY_SET.has(state);
}

/** Textzonen der Beschreibung, die im Bauplan unter `labels` gleich heißen. */
const LABEL_ZONES = [
  'center',
  'topLeft',
  'topLeftLines',
  'bottomLeft',
  'bottomCenter',
  'bottomRight',
  'aboveLeft',
  'belowRight',
  'surfaceBelowLeft',
  'surfaceBelowRight',
] as const satisfies readonly (keyof SignText & keyof BodyLabels)[];

export interface ResolvedBody {
  readonly spec: SymbolSpec;
  /**
   * Der Zeichenversuch, falls die Fassungswahl der Fachaufgaben ihn schon gemacht hat (ohne
   * Optionen). Spart `draw` und `check` einen zweiten Durchlauf.
   */
  readonly attempt?: Attempt;
}

/**
 * Löst eine Beschreibung in ihren Bauplan auf. Freistehende Zeichen sind schon ein Bauplan und
 * kommen unverändert zurück.
 *
 * Auflösung ohne Weglassen und ohne Wurf: was die Regeln an der Beschreibung ablehnen, steht im
 * Bauplan und meldet sich erst beim Zeichnen (`check`). Konventionen setzt die Auflösung keine;
 * was nicht in der Beschreibung steht, steht nicht im Bauplan.
 *
 * Abbildung der Felder: `variant` → `bodyVariant`, `color` → `technicalFill`, `head` → je nach
 * Liste `strength`, `unitGrouping`, `administrativeLevel` oder `technicalHeadMark`, `role` →
 * `functionRole`, `chassis` → `vehicleCategory`, Tendenzen aus `states` → `tendency`, `text` →
 * `labels` und `text.below` → `designation`, `text.centerSize: 'large'` → der vermessene große
 * Grad (`LARGE_CENTER_CAP_HEIGHT_MM`). `exact` liegt zuletzt darüber, `exact.labels` Zone für
 * Zone.
 *
 * Fachaufgaben (`tasks`) gehen in die Fassung, die sich zeichnen lässt, in dieser Reihenfolge:
 * randbündig vermessen, Box vermessen, randbündig abgeleitet, Box abgeleitet. Zeichnet keine,
 * stehen sie in der Box (`capabilities`), der Einzeldarstellung aus Kapitel 4. Setzt `exact`
 * selbst `capabilities` oder `bodyMarks`, kommen die Fachaufgaben dazu, ohne Wahl.
 */
export function resolve(sign: BodySign): SymbolSpec;
export function resolve(sign: FreestandingSpec): FreestandingSpec;
export function resolve(sign: Sign): AnySpec;
export function resolve(sign: Sign): AnySpec {
  return isFreestandingSign(sign) ? sign : resolveBody(sign).spec;
}

export function resolveBody(sign: BodySign): ResolvedBody {
  const spec: Record<string, unknown> = { kind: sign.kind };
  if (sign.variant !== undefined) spec.bodyVariant = sign.variant;
  if (sign.organization !== undefined) spec.organization = sign.organization;
  if (sign.color !== undefined) spec.technicalFill = sign.color;
  if (sign.head !== undefined) {
    const field = HEAD_FIELDS[headGroupOf(sign.head) ?? 'unknown'];
    if (field !== undefined) spec[field] = sign.head;
  }
  if (sign.role !== undefined) spec.functionRole = sign.role;
  if (sign.chassis !== undefined) spec.vehicleCategory = sign.chassis;
  if (sign.states !== undefined) {
    const states = sign.states.filter((state) => !isTendency(state));
    const tendency = sign.states.find(isTendency);
    if (states.length > 0) spec.states = states;
    if (tendency !== undefined) spec.tendency = tendency;
  }

  const labels: Record<string, unknown> = {};
  const text = sign.text;
  if (text !== undefined) {
    for (const zone of LABEL_ZONES) {
      if (text[zone] !== undefined) labels[zone] = text[zone];
    }
    if (text.centerSize === 'large') labels.centerCapHeightMm = LARGE_CENTER_CAP_HEIGHT_MM;
    if (text.below !== undefined) spec.designation = text.below;
  }

  const exact = sign.exact ?? {};
  for (const [key, value] of Object.entries(exact)) {
    if (value === undefined) continue;
    if (key === 'labels') {
      for (const [zone, zoneValue] of Object.entries(value as BodyLabels)) {
        if (zoneValue !== undefined) labels[zone] = zoneValue;
      }
    } else {
      spec[key] = value;
    }
  }
  if (Object.keys(labels).length > 0) spec.labels = labels;

  const tasks = sign.tasks ?? [];
  if (tasks.length === 0) return { spec: spec as unknown as SymbolSpec };

  const fixed: TaskField | undefined =
    exact.capabilities !== undefined ? 'capabilities' : exact.bodyMarks !== undefined ? 'bodyMarks' : undefined;
  if (fixed !== undefined) {
    return { spec: withTasks(spec, fixed, tasks) };
  }
  return chooseTaskField(spec, tasks);
}

const HEAD_FIELDS: Readonly<Record<string, keyof SymbolSpec | undefined>> = {
  strength: 'strength',
  'unit-grouping': 'unitGrouping',
  'administrative-level': 'administrativeLevel',
  'technical-head-mark': 'technicalHeadMark',
  unknown: undefined,
};

type TaskField = 'bodyMarks' | 'capabilities';

function withTasks(spec: Record<string, unknown>, field: TaskField, tasks: readonly CapabilityId[]): SymbolSpec {
  const existing = (spec[field] as readonly string[] | undefined) ?? [];
  const merged = [...existing, ...tasks.filter((task) => !existing.includes(task))];
  return { ...spec, [field]: merged } as unknown as SymbolSpec;
}

/** Vermessen vor abgeleitet, randbündig vor Box; zeichnet keine, die Box. */
function chooseTaskField(spec: Record<string, unknown>, tasks: readonly CapabilityId[]): ResolvedBody {
  const candidates = (['bodyMarks', 'capabilities'] as const).map((field) => {
    const candidate = withTasks(spec, field, tasks);
    return { spec: candidate, attempt: attempt(candidate) };
  });
  const measured = candidates.find((c) => c.attempt.ok && !isDerived(c.attempt.drawing));
  if (measured !== undefined) return measured;
  const derived = candidates.find((c) => c.attempt.ok);
  if (derived !== undefined) return derived;
  return candidates[1]!;
}
