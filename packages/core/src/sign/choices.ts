import type { BodySign, SignChoiceField, StateId, SymbolKind } from '@einsatzzeichen/schema';
import {
  BODY_VARIANT_IDS,
  CAPABILITY_IDS,
  FUNCTION_ROLE_IDS,
  ORGANIZATION_IDS,
  STATE_IDS,
  SYMBOL_KINDS,
  TECHNICAL_FILL_TOKENS,
  VEHICLE_CATEGORY_IDS,
} from '@einsatzzeichen/schema';
import { functionRole } from '../geometry/function-roles.js';
import {
  BODY_VARIANT_LABELS,
  ORGANIZATION_LABELS,
  VEHICLE_CATEGORY_LABELS,
  symbolKindChoiceLabel,
} from '../geometry/labels.js';
import { check } from './check.js';
import { kindFamilyOf } from './families.js';
import {
  COLOR_LABELS,
  HEAD_GROUP_LABELS,
  SIGN_HEAD_VALUES,
  headGroupOf,
  headLabel,
  stateGroupLabel,
  stateLabel,
  taskLabel,
} from './labels.js';
import { isTendency } from './resolve.js';

/** Ein Wert eines Feldes, mit Namen und Befund an der übrigen Beschreibung. */
export interface Choice {
  readonly value: string;
  /** Deutscher Name für die Auswahl. */
  readonly label: string;
  /** Gruppe für lange Listen (Familie, Kopfart, Zustandsgruppe). */
  readonly group?: string;
  /** Ob der Wert in der Beschreibung schon gesetzt (bei Listen: enthalten) ist. */
  readonly selected: boolean;
  /** `measured` und `derived` wie `check`; `blocked`: die Beschreibung trüge den Wert nicht. */
  readonly status: 'measured' | 'derived' | 'blocked';
  /** Bei `blocked` der Grund in einem Satz. */
  readonly why?: string;
}

/** Eine Beschreibung im Aufbau: nur für `choices(draft, 'kind')` darf die Art noch fehlen. */
export type SignDraft = Omit<BodySign, 'kind'> & { readonly kind?: SymbolKind };

export interface ChoicesOptions {
  /** Nur diese Werte prüfen, in dieser Reihenfolge; ein Wert außerhalb der Liste wirft `RangeError`. */
  readonly candidates?: readonly string[];
}

interface FieldTable {
  readonly values: readonly string[];
  readonly list: boolean;
  readonly label: (value: string) => string;
  readonly group?: (value: string) => string | undefined;
}

const FIELDS: Readonly<Record<SignChoiceField, FieldTable>> = {
  kind: {
    values: SYMBOL_KINDS,
    list: false,
    label: (v) => symbolKindChoiceLabel(v as SymbolKind),
    group: (v) => kindFamilyOf(v as SymbolKind).label,
  },
  variant: { values: BODY_VARIANT_IDS, list: false, label: (v) => BODY_VARIANT_LABELS[v as keyof typeof BODY_VARIANT_LABELS] },
  organization: { values: ORGANIZATION_IDS, list: false, label: (v) => ORGANIZATION_LABELS[v as keyof typeof ORGANIZATION_LABELS] },
  color: { values: TECHNICAL_FILL_TOKENS, list: false, label: (v) => COLOR_LABELS[v as keyof typeof COLOR_LABELS] },
  tasks: { values: CAPABILITY_IDS, list: true, label: (v) => taskLabel(v as (typeof CAPABILITY_IDS)[number]) },
  head: {
    values: SIGN_HEAD_VALUES,
    list: false,
    label: (v) => headLabel(v as (typeof SIGN_HEAD_VALUES)[number]),
    group: (v) => {
      const group = headGroupOf(v);
      return group === undefined ? undefined : HEAD_GROUP_LABELS[group];
    },
  },
  role: { values: FUNCTION_ROLE_IDS, list: false, label: (v) => functionRole(v as (typeof FUNCTION_ROLE_IDS)[number]).title },
  chassis: { values: VEHICLE_CATEGORY_IDS, list: false, label: (v) => VEHICLE_CATEGORY_LABELS[v as keyof typeof VEHICLE_CATEGORY_LABELS] },
  states: {
    values: STATE_IDS,
    list: true,
    label: (v) => stateLabel(v as StateId),
    group: (v) => stateGroupLabel(v as StateId),
  },
};

/** Die Felder, für die `choices` antwortet. */
export const SIGN_CHOICE_FIELDS: readonly SignChoiceField[] = Object.freeze(Object.keys(FIELDS) as SignChoiceField[]);

/**
 * Welche Werte eines Feldes zur übrigen Beschreibung passen, mit Namen. Jeder Wert wird in die
 * Beschreibung gesetzt und über `check` geprüft (streng, ohne Weglassen).
 *
 * - Einzelwerte ersetzen den gesetzten Wert; `organization` und `color` ersetzen sich gegenseitig.
 * - Listen (`tasks`, `states`) hängen den Wert an; eine Tendenz ersetzt eine gesetzte Tendenz.
 * - Ein gesetzter Wert trägt `selected: true` und den Befund der Beschreibung, wie sie ist.
 * - `kind` fragt, welche Art die übrige Beschreibung trägt; nur dafür darf die Art fehlen.
 *
 * Für freistehende Zeichen bleibt `freestandingVocabulary` aus `@einsatzzeichen/core/exact`.
 */
export function choices(sign: SignDraft, field: 'kind', options?: ChoicesOptions): Choice[];
export function choices(sign: BodySign, field: SignChoiceField, options?: ChoicesOptions): Choice[];
export function choices(sign: SignDraft, field: SignChoiceField, options: ChoicesOptions = {}): Choice[] {
  const table = Object.hasOwn(FIELDS, field) ? FIELDS[field] : undefined;
  if (table === undefined) {
    throw new RangeError(`Für „${String(field)}“ gibt es keine Auswahl; Felder: ${SIGN_CHOICE_FIELDS.join(', ')}.`);
  }
  if (field !== 'kind' && sign.kind === undefined) {
    throw new TypeError(`Auswahl für „${field}“ braucht eine Art: setze zuerst kind.`);
  }
  const known = new Set(table.values);
  const candidates = options.candidates ?? table.values;
  for (const candidate of candidates) {
    if (!known.has(candidate)) throw new RangeError(`„${candidate}“ ist kein Wert von ${field}.`);
  }

  const current = (sign as Record<string, unknown>)[field];
  const selected: readonly string[] = table.list
    ? Array.isArray(current)
      ? (current as string[])
      : []
    : typeof current === 'string'
      ? [current]
      : [];

  let asIs: ReturnType<typeof check> | undefined;
  return candidates.map((value) => {
    const isSelected = selected.includes(value);
    const result = isSelected ? (asIs ??= check(sign as BodySign)) : check(withValue(sign, field, value, selected));
    const group = table.group?.(value);
    return {
      value,
      label: table.label(value),
      ...(group === undefined ? {} : { group }),
      selected: isSelected,
      ...(result.ok
        ? { status: result.fidelity }
        : { status: 'blocked' as const, why: result.issues[0]?.message ?? 'Nicht zeichenbar.' }),
    };
  });
}

function withValue(sign: SignDraft, field: SignChoiceField, value: string, selected: readonly string[]): BodySign {
  const next: Record<string, unknown> = { ...sign };
  if (field === 'organization') delete next.color;
  if (field === 'color') delete next.organization;
  if (field === 'tasks') next.tasks = [...selected, value];
  else if (field === 'states') {
    const kept = isTendency(value as StateId) ? selected.filter((s) => !isTendency(s as StateId)) : selected;
    next.states = [...kept, value];
  } else next[field] = value;
  return next as unknown as BodySign;
}
