import {
  ADMIN_LEVEL_LABELS,
  BODY_VARIANT_LABELS,
  COLOR_LABELS,
  KIND_FAMILIES,
  ORGANIZATION_LABELS,
  STRENGTH_LABELS,
  TECHNICAL_HEAD_MARK_LABELS,
  UNIT_GROUPING_LABELS,
  VEHICLE_CATEGORY_LABELS,
  choices,
  decodeSignParam,
  encodeSignParam,
  functionRole,
  headGroupOf,
  kindFamilyOf,
  pictogram,
  symbolKindChoiceLabel,
  type Choice,
  type Fidelity,
  type KindFamily,
  type Omission,
} from '@einsatzzeichen/core';
import {
  CAPABILITY_IDS,
  FREESTANDING_KINDS,
  TENDENCY_IDS,
  isFreestandingSign,
  type BodySign,
  type FreestandingKind,
  type FreestandingSpec,
  type PictogramId,
  type Sign,
  type SignChoiceField,
  type SignText,
  type SignTextZone,
  type SymbolKind,
} from '@einsatzzeichen/schema';
import { FREESTANDING_KIND_LABELS, defaultFreestandingSpec } from './builder-freestanding.js';

/**
 * Der Zustand des Baukastens auf der **Beschreibung** (ESZ-150, Schritt 2 aus
 * `docs/decisions/2026-11-06-esz-149-beschreibung-und-bauplan.md`).
 *
 * Bis ESZ-149 setzte der Baukasten eine `SymbolSpec` als Formular zusammen und erbte damit jede
 * Vermischung von Bedeutung und Bauplan: zwei Felder für eine Fähigkeit, sechs Kopffelder für einen
 * Platz, Millimeterwerte neben Begriffen. Jetzt hält er eine `Sign`. Gezeichnet wird über
 * `draw()` (wirft nie, sagt `fidelity` und `omitted`), gefragt wird über `choices()` (Namen und
 * Befund je Wert). Der Bauplan steht nur noch im Expertenteil.
 *
 * Reine Funktionen; die Insel hält nur den React-State.
 */

/** Startzeichen: eine taktische Formation ohne jede Zutat. */
export const DEFAULT_SIGN: BodySign = { kind: 'formation' };

const FREESTANDING_KIND_SET: ReadonlySet<string> = new Set(FREESTANDING_KINDS);
const TENDENCY_SET: ReadonlySet<string> = new Set(TENDENCY_IDS);

/** Die Felder mit Auswahl, die der Baukasten als Abschnitt zeigt — ohne `kind` und `tasks`. */
export const PROBED_FIELDS = [
  'organization',
  'color',
  'variant',
  'chassis',
  'head',
  'role',
  'states',
] as const satisfies readonly SignChoiceField[];

export type ProbedField = (typeof PROBED_FIELDS)[number];

/** Befund je Feld: alle Werte mit Namen und Status, wie `choices()` sie liefert. */
export type SignProbe = ReadonlyMap<ProbedField, readonly Choice[]>;

/* --- Ändern ------------------------------------------------------------------------------ */

/**
 * Die Art wechseln. Innerhalb der Zeichen mit Körper bleibt die Beschreibung stehen, bis auf
 * `variant` und `exact`: beide gehören zu genau einer Art (eine zweite Zeichnung, ein Bauplan),
 * an einer anderen Art behaupteten sie etwas, das niemand gewählt hat. Was an der neuen Art nicht
 * passt, lässt `draw` weg und nennt es; der Abschnitt dazu bleibt sichtbar, solange der Wert
 * gesetzt ist, damit er sich entfernen lässt.
 *
 * Ein freistehendes Zeichen beginnt bei der Ausgangsauswahl seiner Art; die Arten teilen kein
 * Feld. Der Weg zurück zu einem Zeichen mit Körper beginnt beim nackten Körper.
 */
export function changeKind(sign: Sign, kind: SymbolKind | FreestandingKind): Sign {
  if (FREESTANDING_KIND_SET.has(kind)) {
    if (sign.kind === kind) return sign;
    return defaultFreestandingSpec(kind as FreestandingKind);
  }
  if (isFreestandingSign(sign)) return { kind: kind as SymbolKind };
  if (sign.kind === kind) return sign;
  const { variant: _variant, exact: _exact, ...rest } = sign;
  return { ...rest, kind: kind as SymbolKind } as BodySign;
}

/**
 * Einen Einzelwert setzen oder (mit `undefined`) entfernen. Organisation und Farbe ohne
 * Organisation schließen sich aus; wer das eine setzt, nimmt das andere zurück.
 */
export function setSingle(
  sign: BodySign,
  field: Exclude<ProbedField, 'states'>,
  value: string | undefined,
): BodySign {
  const next: Record<string, unknown> = { ...sign };
  if (value === undefined || value === '') delete next[field];
  else next[field] = value;
  if (value !== undefined && field === 'organization') delete next.color;
  if (value !== undefined && field === 'color') delete next.organization;
  return next as unknown as BodySign;
}

/**
 * Einen Listenwert (`tasks`, `states`) an- oder abwählen. Eine Tendenz ersetzt eine gesetzte
 * Tendenz, weil ein Zeichen höchstens eine trägt; so baut ein Klick nie eine Beschreibung, die
 * `draw` sofort wieder kürzen müsste. Eine leere Liste fällt ganz weg.
 */
export function toggleList(sign: BodySign, field: 'tasks' | 'states', value: string): BodySign {
  const current: readonly string[] = (sign[field] as readonly string[] | undefined) ?? [];
  let values: string[];
  if (current.includes(value)) values = current.filter((entry) => entry !== value);
  else if (field === 'states' && TENDENCY_SET.has(value)) {
    values = [...current.filter((entry) => !TENDENCY_SET.has(entry)), value];
  } else values = [...current, value];
  const next: Record<string, unknown> = { ...sign };
  if (values.length === 0) delete next[field];
  else next[field] = values;
  return next as unknown as BodySign;
}

/**
 * Eine Textzone setzen; leerer Text entfernt sie. Ohne mittigen Text fällt auch seine Größe weg,
 * sonst stünde eine Größe ohne Lauf da. Ohne Zone fällt `text` ganz weg.
 */
export function setText(sign: BodySign, zone: Exclude<SignTextZone, 'topLeftLines'>, value: string): BodySign {
  const text: Record<string, unknown> = { ...(sign.text ?? {}) };
  if (value === '') delete text[zone];
  else text[zone] = value;
  if (zone === 'center' && value === '') delete text.centerSize;
  return withText(sign, text);
}

/** Die zweizeilige Zone oben links: gesetzt nur, wenn beide Zeilen Text tragen. */
export function setTopLeftLines(sign: BodySign, first: string, second: string): BodySign {
  const text: Record<string, unknown> = { ...(sign.text ?? {}) };
  if (first === '' && second === '') delete text.topLeftLines;
  else text.topLeftLines = [first, second];
  return withText(sign, text);
}

/** Größe des mittigen Laufs; `normal` ist die Vorgabe und wird nicht gespeichert. */
export function setCenterSize(sign: BodySign, size: 'normal' | 'large'): BodySign {
  const text: Record<string, unknown> = { ...(sign.text ?? {}) };
  if (size === 'normal') delete text.centerSize;
  else text.centerSize = size;
  return withText(sign, text);
}

function withText(sign: BodySign, text: Record<string, unknown>): BodySign {
  const next: Record<string, unknown> = { ...sign };
  if (Object.keys(text).length === 0) delete next.text;
  else next.text = text as SignText;
  return next as unknown as BodySign;
}

/** Der Text einer Zone als Zeichenkette für ein Eingabefeld. */
export function textOf(sign: BodySign, zone: Exclude<SignTextZone, 'topLeftLines'>): string {
  const value = sign.text?.[zone];
  return typeof value === 'string' ? value : '';
}

/* --- Welche Werte passen ----------------------------------------------------------------- */

/**
 * Probiert jedes Feld aus `PROBED_FIELDS` an der Beschreibung durch (`choices()` aus `core`).
 * `tasks` fehlt hier mit Absicht: rund 90 Fachaufgaben brauchen beim ersten Mal je Art mehrere
 * hundert Millisekunden; der Baukasten fragt sie deshalb nur für die gerade sichtbaren Kacheln ab
 * (`probeTasks`).
 */
export function probeSign(sign: BodySign): SignProbe {
  return new Map(PROBED_FIELDS.map((field) => [field, choices(sign, field)]));
}

/** Befund für die genannten Fachaufgaben, in ihrer Reihenfolge. */
export function probeTasks(sign: BodySign, candidates: readonly string[]): Choice[] {
  if (candidates.length === 0) return [];
  return choices(sign, 'tasks', { candidates });
}

/** Ein Abschnitt erscheint, wenn ein Wert gesetzt ist oder wenigstens einer passt. */
export function sectionVisible(entries: readonly Choice[] | undefined): boolean {
  if (entries === undefined) return false;
  return entries.some((entry) => entry.selected || entry.status !== 'blocked');
}

/**
 * Teilt die Werte eines Feldes: was hier passt (gesetzte Werte immer, auch wenn die Beschreibung
 * als Ganzes nicht trägt) und was nicht. Das Zweite zeigt die Insel eingeklappt mit Grund, statt
 * jeden gesperrten Wert in die Liste zu stellen (Konzept ESZ-148, Abschnitt 4.2).
 */
export function splitChoices(entries: readonly Choice[]): { fitting: Choice[]; blocked: Choice[] } {
  const fitting: Choice[] = [];
  const blocked: Choice[] = [];
  for (const entry of entries) {
    if (entry.selected || entry.status !== 'blocked') fitting.push(entry);
    else blocked.push(entry);
  }
  return { fitting, blocked };
}

/** Werte nach ihrer Gruppe, in der Reihenfolge des ersten Auftretens. */
export function groupChoices(entries: readonly Choice[]): { group: string | undefined; entries: Choice[] }[] {
  const groups: { group: string | undefined; entries: Choice[] }[] = [];
  for (const entry of entries) {
    const found = groups.find((candidate) => candidate.group === entry.group);
    if (found === undefined) groups.push({ group: entry.group, entries: [entry] });
    else found.entries.push(entry);
  }
  return groups;
}

/* --- Fachaufgaben ------------------------------------------------------------------------ */

/** Alle Fachaufgaben mit Namen, für die Suche im Abschnitt. */
export const TASK_OPTIONS: readonly { value: string; label: string }[] = CAPABILITY_IDS.map((id) => ({
  value: id,
  label: taskName(id),
}));

function taskName(id: string): string {
  try {
    return pictogram(`capability.${id}` as PictogramId).title;
  } catch {
    return id;
  }
}

function normalize(text: string): string {
  return text
    .toLocaleLowerCase('de-DE')
    .replaceAll('ä', 'ae')
    .replaceAll('ö', 'oe')
    .replaceAll('ü', 'ue')
    .replaceAll('ß', 'ss');
}

/** Suchtext in der Form, in der verglichen wird: klein, Umlaute ausgeschrieben, ohne Rand. */
function needleOf(query: string): string {
  return normalize(query.trim());
}

/** Ein Wert passt zur Suche, wenn sein Name, seine Kennung oder seine Gruppe sie enthält. */
function matches(option: { value: string; label: string; group?: string | undefined }, needle: string): boolean {
  return (
    normalize(option.label).includes(needle) ||
    option.value.includes(needle) ||
    (option.group !== undefined && normalize(option.group).includes(needle))
  );
}

/** Fachaufgaben, deren Name oder Kennung die Suche enthält; leere Suche liefert alle. */
export function searchTasks(query: string): readonly { value: string; label: string }[] {
  const needle = needleOf(query);
  if (needle === '') return TASK_OPTIONS;
  return TASK_OPTIONS.filter((option) => matches(option, needle));
}

/* --- Suche in langen Auswahlen ----------------------------------------------------------- */

/**
 * Ab mehr als so vielen Werten bekommt eine Auswahl ein Suchfeld (ESZ-152): Funktion (26),
 * Zustand (61), freistehendes Piktogramm (260). Kopf (15) und Farbe (12) bleiben ohne. Gezählt
 * wird über alle Werte des Feldes, passende wie gesperrte, damit das Feld beim Bearbeiten nicht
 * auftaucht und wieder verschwindet.
 */
export const CHOICE_SEARCH_THRESHOLD = 16;

/** Ob eine Auswahl lang genug für ein Suchfeld ist. */
export function choiceSearchable(entries: readonly Choice[]): boolean {
  return entries.length > CHOICE_SEARCH_THRESHOLD;
}

/**
 * Werte einer Auswahl, deren Name, Kennung oder Gruppe die Suche enthält, mit derselben
 * Umlautschreibung wie `searchTasks`. Gesetzte Werte bleiben immer stehen, damit man sie auch
 * während einer Suche sieht und zurücknehmen kann. Leere Suche liefert alle.
 */
export function searchChoices(entries: readonly Choice[], query: string): Choice[] {
  const needle = needleOf(query);
  if (needle === '') return [...entries];
  return entries.filter((entry) => entry.selected || matches(entry, needle));
}

/* --- Namen und Status -------------------------------------------------------------------- */

/** Deutscher Name eines Wertes, für Marken und die Zeile „was fehlt“. Fällt auf den Wert zurück. */
export function valueLabel(field: string, value: string): string {
  try {
    switch (field) {
      case 'kind':
        return FREESTANDING_KIND_SET.has(value)
          ? FREESTANDING_KIND_LABELS[value as FreestandingKind]
          : symbolKindChoiceLabel(value as SymbolKind);
      case 'organization':
        return ORGANIZATION_LABELS[value as keyof typeof ORGANIZATION_LABELS] ?? value;
      case 'color':
        return COLOR_LABELS[value as keyof typeof COLOR_LABELS] ?? value;
      case 'variant':
        return BODY_VARIANT_LABELS[value as keyof typeof BODY_VARIANT_LABELS] ?? value;
      case 'chassis':
        return VEHICLE_CATEGORY_LABELS[value as keyof typeof VEHICLE_CATEGORY_LABELS] ?? value;
      case 'role':
        return functionRole(value as Parameters<typeof functionRole>[0]).title;
      case 'tasks':
        return taskName(value);
      case 'states':
        return pictogram(`state.${value}` as PictogramId).title;
      case 'head':
        return headName(value);
      default:
        return value;
    }
  } catch {
    return value;
  }
}

function headName(value: string): string {
  switch (headGroupOf(value)) {
    case 'strength':
      return STRENGTH_LABELS[value as keyof typeof STRENGTH_LABELS];
    case 'unit-grouping':
      return UNIT_GROUPING_LABELS[value as keyof typeof UNIT_GROUPING_LABELS];
    case 'administrative-level':
      return ADMIN_LEVEL_LABELS[value as keyof typeof ADMIN_LEVEL_LABELS];
    case 'technical-head-mark':
      return TECHNICAL_HEAD_MARK_LABELS[value as keyof typeof TECHNICAL_HEAD_MARK_LABELS];
    default:
      return value;
  }
}

const FIELD_NAMES: Readonly<Record<string, string>> = {
  kind: 'Art',
  organization: 'Organisation',
  color: 'Farbe',
  variant: 'Darstellung',
  chassis: 'Fahrwerk',
  head: 'Größe und Ebene',
  role: 'Funktion',
  tasks: 'Fachaufgabe',
  states: 'Zustand',
};

/** Die Textzonen mit ihren Namen, in Lesereihenfolge. Die ersten drei stehen immer offen. */
export const TEXT_ZONES: readonly { zone: Exclude<SignTextZone, 'topLeftLines'>; label: string }[] = [
  { zone: 'center', label: 'Mitte' },
  { zone: 'bottomRight', label: 'Unten rechts' },
  { zone: 'below', label: 'Darunter' },
  { zone: 'topLeft', label: 'Oben links' },
  { zone: 'bottomLeft', label: 'Unten links' },
  { zone: 'bottomCenter', label: 'Unten mittig' },
  { zone: 'aboveLeft', label: 'Über dem Zeichen links' },
  { zone: 'belowRight', label: 'Unter dem Zeichen rechts' },
  { zone: 'surfaceBelowLeft', label: 'Darunter links' },
  { zone: 'surfaceBelowRight', label: 'Darunter rechts' },
];

/** Wie viele Textzonen immer offen stehen. */
export const OPEN_TEXT_ZONES = 3;

/** Eine Zeile „was fehlt“: Feld, Wert und Grund in Klarsprache. */
export function omissionLine(omission: Omission): { what: string; why: string } {
  const { field, value, why } = omission;
  if (field.startsWith('text.')) {
    const zone = field.slice('text.'.length);
    const name = zone === 'topLeftLines' ? 'Oben links, zweizeilig' : (TEXT_ZONES.find((entry) => entry.zone === zone)?.label ?? zone);
    return { what: `Text ${name} „${value}“`, why };
  }
  if (field.startsWith('exact.')) return { what: `Bauplan ${field.slice('exact.'.length)}`, why };
  return { what: `${FIELD_NAMES[field] ?? field} „${valueLabel(field, value)}“`, why };
}

/** Kennung eines Wertes, der im Bild fehlt, für den Abgleich mit Marken im Formular. */
export function omittedKeys(omitted: readonly Omission[]): ReadonlySet<string> {
  return new Set(omitted.map((omission) => `${omission.field}:${omission.value}`));
}

export const FIDELITY_LABELS: Readonly<Record<Fidelity, string>> = Object.freeze({
  measured: 'Vermessen',
  derived: 'Abgeleitet',
  simplified: 'Vereinfacht',
});

/* --- Familien ---------------------------------------------------------------------------- */

/** Die Familie, in der die Art der Beschreibung steht. */
export function familyOf(sign: Sign): KindFamily {
  return kindFamilyOf(sign.kind);
}

export { KIND_FAMILIES };

/** Name einer Art für die Unterauswahl in einer Familie. */
export function kindLabel(kind: SymbolKind | FreestandingKind): string {
  return valueLabel('kind', kind);
}

/* --- Link -------------------------------------------------------------------------------- */

/**
 * Die URL-Form: `encodeSignParam` aus `core`, die Hülle `{"v":2,"sign":{…}}` in base64url. Gespeichert
 * wird die Absicht, nicht die Fassungswahl von heute.
 */
export function encodeSign(sign: Sign): string {
  return encodeSignParam(sign);
}

/**
 * Liest einen Link streng: v2, die alte Hülle `{"v":1,…}` und rohe Baupläne von vor LFH-577 (über
 * `fromExact`). Alte Baukasten-Links bleiben damit gültig. Wirft `SpecParseError`.
 */
export function decodeSign(param: string): Sign {
  return decodeSignParam(param);
}

/** Ob die Beschreibung ein Zeichen mit Körper ist. */
export function isBodySign(sign: Sign): sign is BodySign {
  return !isFreestandingSign(sign);
}

export type { FreestandingSpec };
