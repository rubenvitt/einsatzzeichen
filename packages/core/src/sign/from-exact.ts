import type {
  AnySpec,
  BodyLabels,
  BodySign,
  CapabilityId,
  FreestandingSpec,
  Sign,
  SignExact,
  SignHead,
  SignText,
  StateId,
  SymbolSpec,
} from '@einsatzzeichen/schema';
import { CAPABILITY_IDS, isFreestandingSpec } from '@einsatzzeichen/schema';
import { LARGE_CENTER_CAP_HEIGHT_MM } from '../derive/circle.js';
import { canonicalSpec } from '../spec-codec.js';
import { resolveBody } from './resolve.js';

const CAPABILITY_SET: ReadonlySet<string> = new Set(CAPABILITY_IDS);

/** Felder des Bauplans, die die Beschreibung mit eigenem Namen trägt. */
const MAPPED_SPEC_FIELDS: ReadonlySet<string> = new Set([
  'kind',
  'bodyVariant',
  'organization',
  'technicalFill',
  'strength',
  'unitGrouping',
  'administrativeLevel',
  'technicalHeadMark',
  'functionRole',
  'vehicleCategory',
  'states',
  'tendency',
  'capabilities',
  'bodyMarks',
  'designation',
  'labels',
]);

/** Zonen von `BodyLabels`, die `SignText` gleichnamig trägt. */
const TEXT_ZONES: ReadonlySet<string> = new Set([
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
]);

const HEAD_SPEC_FIELDS = ['strength', 'unitGrouping', 'administrativeLevel', 'technicalHeadMark'] as const;

/**
 * Der Rückweg vom Bauplan zur Beschreibung: so viel wie möglich in den Feldern der Beschreibung,
 * der Rest in `exact`.
 *
 * Zusage: `resolve(fromExact(spec))` ist kanonisch gleich `spec`. Das prüft die Funktion selbst.
 * Lässt sich die Fassungswahl der Fachaufgaben nicht wiederholen (die Auflösung wählte eine
 * andere Fassung als der Bauplan), bleiben die Fachaufgaben in `exact.capabilities` bzw.
 * `exact.bodyMarks`. Trägt auch das nicht, steht alles außer der Art in `exact`; der Weg trägt
 * damit für jeden lesbaren Bauplan. Freistehende Zeichen kommen unverändert zurück.
 *
 * Wirft `SpecParseError`, wenn der Bauplan in der Form nicht stimmt (wie `canonicalSpec`).
 */
export function fromExact(spec: SymbolSpec): BodySign;
export function fromExact(spec: FreestandingSpec): FreestandingSpec;
export function fromExact(spec: AnySpec): Sign;
export function fromExact(spec: AnySpec): Sign {
  if (isFreestandingSpec(spec)) return spec;
  const target = JSON.stringify(canonicalSpec(spec));
  const roundtrips = (sign: BodySign): boolean => {
    try {
      return JSON.stringify(canonicalSpec(resolveBody(sign).spec)) === target;
    } catch {
      return false;
    }
  };

  const full = mapSpec(spec, true);
  if (roundtrips(full)) return full;
  const tasksExact = mapSpec(spec, false);
  if (roundtrips(tasksExact)) return tasksExact;
  const { kind, ...rest } = spec;
  return compactSign({ kind, exact: rest });
}

function mapSpec(spec: SymbolSpec, tasksAsSign: boolean): BodySign {
  const sign: Record<string, unknown> = { kind: spec.kind };
  const exact: Record<string, unknown> = {};

  if (spec.bodyVariant !== undefined) sign.variant = spec.bodyVariant;
  if (spec.organization !== undefined && spec.technicalFill !== undefined) {
    exact.organization = spec.organization;
    exact.technicalFill = spec.technicalFill;
  } else {
    if (spec.organization !== undefined) sign.organization = spec.organization;
    if (spec.technicalFill !== undefined) sign.color = spec.technicalFill;
  }

  const heads = HEAD_SPEC_FIELDS.filter((field) => spec[field] !== undefined);
  if (heads.length === 1) {
    sign.head = spec[heads[0]!] as SignHead;
  } else {
    for (const field of heads) exact[field] = spec[field];
  }

  if (spec.functionRole !== undefined) sign.role = spec.functionRole;
  if (spec.vehicleCategory !== undefined) sign.chassis = spec.vehicleCategory;

  const states: StateId[] = [...(spec.states ?? [])];
  if (spec.tendency !== undefined) states.push(spec.tendency);
  if (states.length > 0) sign.states = states;

  const capabilities = spec.capabilities;
  const bodyMarks = spec.bodyMarks;
  const onlyCapabilities = (marks: readonly string[]): boolean => marks.every((mark) => CAPABILITY_SET.has(mark));
  if (
    tasksAsSign &&
    (capabilities === undefined || bodyMarks === undefined) &&
    (bodyMarks === undefined || onlyCapabilities(bodyMarks))
  ) {
    const tasks = (capabilities ?? bodyMarks ?? []) as readonly CapabilityId[];
    if (tasks.length > 0) sign.tasks = tasks;
    else if (capabilities !== undefined) exact.capabilities = capabilities;
    else if (bodyMarks !== undefined) exact.bodyMarks = bodyMarks;
  } else {
    if (capabilities !== undefined) exact.capabilities = capabilities;
    if (bodyMarks !== undefined) exact.bodyMarks = bodyMarks;
  }

  const text: Record<string, unknown> = {};
  const exactLabels: Record<string, unknown> = {};
  if (spec.designation !== undefined) text.below = spec.designation;
  for (const [zone, value] of Object.entries(spec.labels ?? {}) as [keyof BodyLabels, unknown][]) {
    if (value === undefined) continue;
    if (TEXT_ZONES.has(zone)) text[zone] = value;
    else if (zone === 'centerCapHeightMm' && value === LARGE_CENTER_CAP_HEIGHT_MM) text.centerSize = 'large';
    else exactLabels[zone] = value;
  }
  if (Object.keys(text).length > 0) sign.text = text as SignText;
  if (Object.keys(exactLabels).length > 0) exact.labels = exactLabels;

  for (const [key, value] of Object.entries(spec)) {
    if (value !== undefined && !MAPPED_SPEC_FIELDS.has(key)) exact[key] = value;
  }
  if (Object.keys(exact).length > 0) sign.exact = exact as SignExact;
  return sign as unknown as BodySign;
}

function compactSign(sign: { kind: SymbolSpec['kind']; exact: SignExact }): BodySign {
  return Object.keys(sign.exact).length > 0 ? sign : { kind: sign.kind };
}
