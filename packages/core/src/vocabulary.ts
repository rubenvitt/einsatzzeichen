import {
  ADMIN_LEVEL_IDS,
  ANIMAL_STATE_IDS,
  BODY_VARIANT_IDS,
  CAPABILITY_IDS,
  FUNCTION_ROLE_IDS,
  LINE_IDS,
  MOVEMENT_IDS,
  ORGANIZATION_IDS,
  STATE_IDS,
  STRENGTH_IDS,
  SYMBOL_KINDS,
  TECHNICAL_BODY_MARK_IDS,
  TECHNICAL_FILL_TOKENS,
  TECHNICAL_HEAD_MARK_IDS,
  TENDENCY_IDS,
  UNIT_GROUPING_IDS,
  VEHICLE_CATEGORY_IDS,
  WEATHER_INTENSITIES,
  WEATHER_STATE_IDS,
  isFreestandingSpec,
  type AnimalStateSpec,
  type AnySpec,
  type ColorToken,
  type DepictionVariant,
  type Drawing,
  type FreestandingKind,
  type LineSpec,
  type MovementSpec,
  type SymbolSpec,
  type WeatherSpec,
} from '@einsatzzeichen/schema';
import type { ComposeOptions } from './compose.js';
import { drawSymbol } from './default-ports.js';
import { drawFreestanding, type FreestandingDrawOptions } from './draw-freestanding.js';
import { NotMeasuredError, type NotMeasuredScope } from './not-measured.js';
import { explainRejection, type ExplainedIssue } from './rules/rule-explanations.js';
import { CompositionError } from './validate.js';

/**
 * Vokabular je Stand der Spec (LFH-578): welche Werte ein Feld überhaupt kennt, welche davon zur
 * übrigen Beschreibung passen — und für eine ganze Spec, ob sie trägt und warum nicht.
 *
 * Das ist, was eine Oberfläche oder ein Skript braucht, um sich aus der Grammatik zu speisen
 * (LFH-561). Bis hierher stand es als Probe in der Website (`allowedValues` im Baukasten); der
 * Baukasten ist jetzt ein Konsument dieser Datei.
 *
 * **Warum probiert und nicht nachgeschlagen wird.** Eine Tabelle „erlaubte Werte je Feld" ließe
 * sich nicht ehrlich schreiben: ob ein Wert trägt, hängt an vermessenen Fassungen, Profilen,
 * Zonen und dem Kontext, den `compose()` aus den Ports baut. Also wird jeder Kandidat einmal über
 * `drawSymbol()` gezeichnet — denselben Weg, den jeder Nutzer geht. Ein nacktes
 * `validateSpec(spec)` wäre schneller, aber falsch, und zwar in beide Richtungen: ohne den
 * Kontext aus aufgelöster Funktionsfassung und Verwaltungskopf lehnt es jede Funktionsfassung ab
 * (25 Rezepte, etwa D.1.2 Katastrophenschutzstab; nachgezählt am 29.09.2026), und was erst beim
 * Zeichnen geprüft wird — vermessene Fassungen, Profile, Zonen — sieht es gar nicht.
 *
 * **Drei Ausgänge, nicht zwei.** Eine Regel lehnt ab (`CompositionError`, erklärt über
 * `explainRejection`), oder die Referenz führt keine vermessene Fassung (`NotMeasuredError`, mit
 * ihrer Reichweite `scope`) — das sind Befunde. Alles andere ist ein Programmfehler oder eine
 * Eingabe außerhalb des Typs (etwa eine Zahl in `designation`) und fliegt weiter. Würde er
 * gefangen, käme jeder Kandidat in jedem Feld als gesperrt zurück und behauptete eine Datenlücke,
 * die es nicht gibt.
 */

/* --- Wertevorrat je Feld ---------------------------------------------------------------- */

/**
 * Was ein Feld der `SymbolSpec` aufnehmen kann.
 *
 * - `one-of` — genau ein Wert aus `values`.
 * - `list` — eine Liste aus `values`; die Reihenfolge ist Teil des Zeichens (Übermalung und
 *   vorgelesene Beschreibung, siehe `spec-codec.ts`). Das Vokabular fragt hier „lässt sich der
 *   Wert **anhängen**?".
 * - `flag` — nur `true` oder weglassen (`whiteInnerContour`). Ein Schalter hat keinen Vorrat zum
 *   Auswählen; ob er passt, beantwortet `checkSpec({ ...spec, whiteInnerContour: true })`.
 * - `text` — freier Text (`designation`); ob er passt, hängt an seiner Breite, nicht an einem Wert.
 * - `structured` — ein Objekt mit eigener Feldmenge (`labels`, siehe `BodyLabels`).
 */
export type SpecFieldDomain =
  | { readonly shape: 'one-of'; readonly values: readonly string[] }
  | { readonly shape: 'list'; readonly values: readonly string[] }
  | { readonly shape: 'flag' }
  | { readonly shape: 'text' }
  | { readonly shape: 'structured' };

type OneOf = Extract<SpecFieldDomain, { shape: 'one-of' }>;
type List = Extract<SpecFieldDomain, { shape: 'list' }>;

/*
 * Generisch über den Werttyp, damit `SPEC_FIELD_VALUES.strength.values` als
 * `readonly StrengthId[]` und nicht als `readonly string[]` im Typ steht — dieselbe Enge, die
 * `vocabulary()` über `SpecFieldValue` an seine Ergebnisse weitergibt.
 */
const oneOf = <V extends string>(values: readonly V[]) =>
  Object.freeze({ shape: 'one-of' as const, values });
const list = <V extends string>(values: readonly V[]) =>
  Object.freeze({ shape: 'list' as const, values });
const FLAG = Object.freeze({ shape: 'flag' } as const);
const TEXT = Object.freeze({ shape: 'text' } as const);
const STRUCTURED = Object.freeze({ shape: 'structured' } as const);

/*
 * Über die Schlüssel des Schema-Typs vollständig, wie die Feldtabellen in `spec-codec.ts`:
 * bekommt `SymbolSpec` ein neues Feld, lehnt der Compiler diese Tabelle ab, bis es hier einen
 * Eintrag hat. Das Vokabular kann ein neues Feld also nicht still übergehen.
 *
 * Die Werte kommen aus denselben Wertelisten des Schemas, gegen die `parseSpec` liest — der Test
 * prüft jeden Wert gegen den Leser, damit beide Vorräte nicht auseinanderlaufen.
 */
const FIELD_TABLE = {
  kind: oneOf(SYMBOL_KINDS),
  functionRole: oneOf(FUNCTION_ROLE_IDS),
  bodyVariant: oneOf(BODY_VARIANT_IDS),
  organization: oneOf(ORGANIZATION_IDS),
  // Ohne die Tinten-Tokens: sie färben Läufe, keine Körperfläche (LFH-990).
  technicalFill: oneOf<ColorToken>(TECHNICAL_FILL_TOKENS),
  whiteInnerContour: FLAG,
  strength: oneOf(STRENGTH_IDS),
  technicalHeadMark: oneOf(TECHNICAL_HEAD_MARK_IDS),
  administrativeLevel: oneOf(ADMIN_LEVEL_IDS),
  unitGrouping: oneOf(UNIT_GROUPING_IDS),
  vehicleCategory: oneOf(VEHICLE_CATEGORY_IDS),
  // Der volle Vorrat wie im Leser: Wetter, Tierzustand und Tendenz erscheinen im Vokabular als
  // von einer Regel gesperrt, nicht als unbekannt.
  states: list(STATE_IDS),
  tendency: oneOf(TENDENCY_IDS),
  capabilities: list(CAPABILITY_IDS),
  // Der volle lesbare Vorrat, nicht nur die irgendwo vermessenen Marken (`BODY_MARK_IDS`): eine
  // Kennung ohne jede Fassung ist ein Befund des Vokabulars („nicht vermessen"), kein
  // unbekannter Wert.
  bodyMarks: list(Object.freeze([...CAPABILITY_IDS, ...TECHNICAL_BODY_MARK_IDS])),
  // Ein Objekt aus Körpermarke und Fassungskennung (LFH-786), kein Wert zum Anhängen: welche
  // Fassung an einer Marke vermessen ist, hängt an Marke und Körperfassung zugleich.
  bodyMarkRenditions: STRUCTURED,
  designation: TEXT,
  labels: STRUCTURED,
} as const satisfies { readonly [K in keyof Required<SymbolSpec>]: SpecFieldDomain };

/** Die Felder, deren Werte sich aufzählen und damit probieren lassen. */
export type VocabularyField = {
  [K in keyof typeof FIELD_TABLE]: (typeof FIELD_TABLE)[K] extends OneOf | List ? K : never;
}[keyof typeof FIELD_TABLE];

/** Wertevorrat je Feld der `SymbolSpec`, eingefroren. */
export const SPEC_FIELD_VALUES: typeof FIELD_TABLE = Object.freeze(FIELD_TABLE);

/**
 * Der Typ eines einzelnen Wertes von `field` — bei Listenfeldern der Elementtyp. Damit lässt sich
 * ein Befund ohne Umwandlung zurückschreiben: `{ ...spec, strength: option.value }`.
 */
export type SpecFieldValue<K extends VocabularyField> = K extends VocabularyField
  ? // Verteilt über K: bei einer Feldunion die Union der Einzelwerte, nicht die der Felder.
    NonNullable<SymbolSpec[K]> extends readonly (infer E)[]
    ? E
    : NonNullable<SymbolSpec[K]>
  : never;

/** Der Wertevorrat eines Feldes — derselbe Eintrag wie in `SPEC_FIELD_VALUES`. */
export function specFieldValues<K extends keyof SymbolSpec>(field: K): (typeof FIELD_TABLE)[K] {
  return SPEC_FIELD_VALUES[field];
}

const fieldNames = Object.keys(FIELD_TABLE) as (keyof typeof FIELD_TABLE)[];

/** Alle Felder mit aufzählbarem Vorrat, in der Reihenfolge der Tabelle. */
export const VOCABULARY_FIELDS: readonly VocabularyField[] = Object.freeze(
  fieldNames.filter((field): field is VocabularyField => {
    const { shape } = FIELD_TABLE[field];
    return shape === 'one-of' || shape === 'list';
  }),
);

/** Die Felder, die eine Liste tragen und deshalb anhängen statt ersetzen. */
export const LIST_SPEC_FIELDS: readonly VocabularyField[] = Object.freeze(
  VOCABULARY_FIELDS.filter((field) => FIELD_TABLE[field].shape === 'list'),
);

/* --- Wertevorrat der freistehenden Zeichen (LFH-577) ------------------------------------ */

const DEPICTION_VARIANTS: readonly DepictionVariant[] = Object.freeze(['primary', 'alternative']);

/*
 * Je Art über die Schlüssel ihres Schema-Typs vollständig, wie `FIELD_TABLE`: bekommt eine Art ein
 * Feld, lehnt der Compiler die Tabelle ab, bis es hier einen Eintrag hat. `kind` steht mit genau
 * einem Wert darin — die Art selbst, damit jede Tabelle alle Felder ihrer Spec nennt.
 */
const FREESTANDING_TABLE = {
  movement: {
    kind: oneOf(['movement'] as const),
    movement: oneOf(MOVEMENT_IDS),
    // Der Verlauf und die Zeichenfläche sind Zahlen, kein Vorrat: ob sie tragen, sagt erst die
    // Zeichnung (`checkAnySpec`).
    path: STRUCTURED,
    canvasMm: STRUCTURED,
  } satisfies { readonly [K in keyof Required<MovementSpec>]: SpecFieldDomain },
  line: {
    kind: oneOf(['line'] as const),
    line: oneOf(LINE_IDS),
    path: STRUCTURED,
    // Der volle lesbare Vorrat: dass nur 2.20 eine Stärke trägt und nur der Zug vermessen ist,
    // sagen Regel und Zeichnung, nicht der Vorrat.
    strength: oneOf(STRENGTH_IDS),
    variant: oneOf(DEPICTION_VARIANTS),
    canvasMm: STRUCTURED,
  } satisfies { readonly [K in keyof Required<LineSpec>]: SpecFieldDomain },
  weather: {
    kind: oneOf(['weather'] as const),
    values: list(WEATHER_STATE_IDS),
    intensity: oneOf(WEATHER_INTENSITIES),
  } satisfies { readonly [K in keyof Required<WeatherSpec>]: SpecFieldDomain },
  'animal-state': {
    kind: oneOf(['animal-state'] as const),
    state: oneOf(ANIMAL_STATE_IDS),
    variant: oneOf(DEPICTION_VARIANTS),
  } satisfies { readonly [K in keyof Required<AnimalStateSpec>]: SpecFieldDomain },
} as const satisfies { readonly [K in FreestandingKind]: Readonly<Record<string, SpecFieldDomain>> };

/**
 * Wertevorrat je Feld der freistehenden Spec-Art, je Art (`movement`, `line`, `weather`,
 * `animal-state`) — das Gegenstück zu `SPEC_FIELD_VALUES`. Die Werte kommen aus denselben
 * Wertelisten, gegen die `parseAnySpec` liest.
 */
export const FREESTANDING_FIELD_VALUES: typeof FREESTANDING_TABLE = Object.freeze(
  Object.fromEntries(
    Object.entries(FREESTANDING_TABLE).map(([kind, table]) => [kind, Object.freeze(table)]),
  ) as typeof FREESTANDING_TABLE,
);

/* --- Prüfung einer ganzen Spec ---------------------------------------------------------- */

/**
 * Ergebnis von `checkSpec`: die Zeichnung, oder warum es keine gibt.
 *
 * `reason` unterscheidet die beiden Befunde. Nicht zu verwechseln mit `ExplainedIssue.reason`
 * in den einzelnen Meldungen — dort ist es die Begründung der Regel in einem Satz.
 */
export type SpecCheck =
  | { readonly ok: true; readonly drawing: Drawing }
  /** Eine oder mehrere Regeln lehnen ab; jede Meldung mit Titel, Erklärung und Feld. */
  | { readonly ok: false; readonly reason: 'rule'; readonly issues: ExplainedIssue[] }
  /**
   * Die Referenz führt für diese Zusammenstellung keine vermessene Fassung. `scope: 'value'`:
   * der Wert ist nirgends vermessen; `'combination'`: eine andere Art oder Variante trägt ihn.
   */
  | {
      readonly ok: false;
      readonly reason: 'not-measured';
      readonly scope: NotMeasuredScope;
      readonly message: string;
    };

/**
 * Die erklärbare Ablehnung für eine ganze Spec: zeichnet sie über `drawSymbol()` und gibt statt
 * eines Wurfs ein Ergebnis zurück. Regelverletzungen kommen erklärt (`explainRejection`), eine
 * Vermessungslücke mit ihrer Reichweite; jeder andere Fehler fliegt weiter.
 *
 * Fail-closed wie `explainRejection`: eine Meldung ohne Erklärung im Regelwerk wirft. Die Tests
 * von `core` halten jede Regelkennung erklärt; ein solcher Wurf ist ein Fehler dieses Pakets.
 */
export function checkSpec(spec: SymbolSpec, options?: ComposeOptions): SpecCheck {
  return checkDrawing(() => drawSymbol(spec, options));
}

/** Die drei Ausgänge einer Zeichnung als Ergebnis, für beide Spec-Arten gleich. */
function checkDrawing(draw: () => Drawing): SpecCheck {
  try {
    return { ok: true, drawing: draw() };
  } catch (error) {
    if (error instanceof CompositionError) {
      return { ok: false, reason: 'rule', issues: explainRejection(error) };
    }
    if (error instanceof NotMeasuredError) {
      return { ok: false, reason: 'not-measured', scope: error.scope, message: error.message };
    }
    throw error;
  }
}

/**
 * `checkSpec` für beide Spec-Arten: eine `SymbolSpec` genau wie `checkSpec`, ein freistehendes
 * Zeichen über `drawFreestanding`. Dieselben drei Ausgänge — Zeichnung, erklärte Regelverstöße
 * (`FREESTANDING_RULE_EXPLANATIONS`), Vermessungslücke mit Reichweite.
 *
 * Ein Verlauf, den die Zeichnung nicht tragen kann (zu kurz für Pfeilköpfe oder Striche, aus der
 * Zeichenfläche ragend, ein zu spitzer Knick am Doppelschaft), ist weder Regel noch Lücke: er
 * fliegt als gewöhnlicher Fehler weiter, wie jede Eingabe, die `checkSpec` nicht erklären kann.
 */
export function checkAnySpec(spec: AnySpec, options?: FreestandingDrawOptions): SpecCheck {
  return isFreestandingSpec(spec)
    ? checkDrawing(() => drawFreestanding(spec, options))
    : checkSpec(spec, options);
}

/* --- Vokabular ---------------------------------------------------------------------------- */

/**
 * Befund zu einem Kandidaten. `selected` sagt, ob der Wert in der gefragten Spec schon gesetzt
 * (bei Listen: enthalten) ist.
 */
export type VocabularyOption<K extends VocabularyField = VocabularyField> =
  | {
      readonly value: SpecFieldValue<K>;
      readonly selected: boolean;
      readonly status: 'allowed';
      /**
       * Gesetzt, wenn die Zeichnung mit diesem Wert abgeleitete Teile trägt
       * (`Drawing.derivations`): zulässig, aber nicht an einem Original vermessen.
       */
      readonly derived?: true;
    }
  | {
      readonly value: SpecFieldValue<K>;
      readonly selected: boolean;
      readonly status: 'blocked';
      readonly reason: 'rule';
      readonly issues: ExplainedIssue[];
    }
  | {
      readonly value: SpecFieldValue<K>;
      readonly selected: boolean;
      readonly status: 'blocked';
      readonly reason: 'not-measured';
      readonly scope: NotMeasuredScope;
      readonly message: string;
    };

/**
 * Eine Beschreibung im Aufbau: wie `SymbolSpec`, aber ohne Pflicht zu `kind`. Nur für
 * `vocabulary(draft, 'kind')` — der Einstieg eines Skripts, das bei `{}` beginnt.
 */
export type SpecDraft = Omit<SymbolSpec, 'kind'> & { kind?: SymbolSpec['kind'] };

export interface VocabularyOptions<K extends VocabularyField = VocabularyField> {
  /**
   * Nur diese Kandidaten prüfen, in dieser Reihenfolge — etwa die Werte, die eine Oberfläche
   * gerade anzeigt. Ohne Angabe der ganze Vorrat aus `SPEC_FIELD_VALUES`. Ein Wert außerhalb des
   * Vorrats wirft einen `RangeError`, statt als „gesperrt" zu erscheinen.
   */
  readonly candidates?: readonly SpecFieldValue<K>[];
}

function toOption<K extends VocabularyField>(
  value: SpecFieldValue<K>,
  selected: boolean,
  check: SpecCheck,
): VocabularyOption<K> {
  if (check.ok) {
    return check.drawing.derivations !== undefined && check.drawing.derivations.length > 0
      ? { value, selected, status: 'allowed', derived: true }
      : { value, selected, status: 'allowed' };
  }
  if (check.reason === 'rule') {
    return { value, selected, status: 'blocked', reason: 'rule', issues: check.issues };
  }
  return {
    value,
    selected,
    status: 'blocked',
    reason: 'not-measured',
    scope: check.scope,
    message: check.message,
  };
}

/**
 * Welche Werte eines Feldes zur übrigen Spec passen: jeder Kandidat wird in die Spec gesetzt und
 * über `checkSpec()` gezeichnet.
 *
 * - **Einzelwert-Felder** ersetzen den gesetzten Wert durch den Kandidaten.
 * - **Listenfelder** (`LIST_SPEC_FIELDS`) hängen den Kandidaten an die bestehende Auswahl an:
 *   gefragt ist, ob er sich **hinzufügen** lässt, nicht ob er allein trüge.
 * - **Der gesetzte Wert** (bei Listen: jeder enthaltene) trägt `selected: true` und den Befund der
 *   Spec, wie sie ist — ein zweites Anhängen desselben Werts wäre keine sinnvolle Frage. Trägt die
 *   Spec aus einem anderen Grund nicht, erscheint er deshalb gesperrt; eine Oberfläche, die den
 *   eigenen Wert nie sperren will, entscheidet das an `selected`.
 * - **`kind`** ist Pflicht, und daraus folgt die Semantik: gefragt wird, welche Grundzeichenart die
 *   **übrige** Auswahl trägt. Nur hier darf die Spec noch ohne `kind` sein (`SpecDraft`); ein
 *   Skript beginnt also bei `vocabulary({}, 'kind')` und bekommt die nackten Grundformen geprüft.
 *   Jedes andere Feld verlangt eine gesetzte Grundzeichenart und wirft sonst einen `TypeError` —
 *   ohne sie gäbe es nichts, woran ein Wert zu zeichnen wäre.
 *
 * Die Spec muss in der Form stimmen (etwa aus `parseSpec`); ein Programmfehler beim Zeichnen
 * fliegt wie bei `checkSpec` weiter.
 */
export function vocabulary(
  spec: SpecDraft,
  field: 'kind',
  options?: VocabularyOptions<'kind'>,
): VocabularyOption<'kind'>[];
export function vocabulary<K extends VocabularyField>(
  spec: SymbolSpec,
  field: K,
  options?: VocabularyOptions<K>,
): VocabularyOption<K>[];
export function vocabulary(
  spec: SpecDraft,
  field: VocabularyField,
  options: VocabularyOptions = {},
): VocabularyOption[] {
  const domain: SpecFieldDomain | undefined = Object.hasOwn(FIELD_TABLE, field)
    ? FIELD_TABLE[field]
    : undefined;
  if (domain === undefined || (domain.shape !== 'one-of' && domain.shape !== 'list')) {
    throw new RangeError(
      `Das Feld „${String(field)}“ hat keinen aufzählbaren Wertevorrat; ` +
        `Vokabular gibt es für: ${VOCABULARY_FIELDS.join(', ')}.`,
    );
  }
  if (field !== 'kind' && spec.kind === undefined) {
    throw new TypeError(
      `Vokabular für „${field}“ braucht eine Grundzeichenart: setze zuerst kind ` +
        '(welche passen, sagt vocabulary(spec, "kind")).',
    );
  }

  // Zur Laufzeit wird trotz enger Typen geprüft: ein Aufrufer ohne Typprüfung (JavaScript,
  // Werte aus einer Adresse) kommt genauso hierher.
  const known = new Set<string>(domain.values);
  const candidates = (options.candidates ?? domain.values) as readonly SpecFieldValue<VocabularyField>[];
  for (const candidate of candidates) {
    if (!known.has(candidate)) {
      throw new RangeError(`„${candidate}“ ist kein Wert von ${field}.`);
    }
  }

  const isList = domain.shape === 'list';
  const current: unknown = spec[field];
  const selected: readonly string[] = isList
    ? Array.isArray(current)
      ? (current as readonly string[])
      : []
    : typeof current === 'string'
      ? [current]
      : [];

  // Der Befund der Spec, wie sie ist — nur gerechnet, wenn ein gesetzter Wert gefragt wird.
  let asIs: SpecCheck | undefined;
  return candidates.map((value) => {
    if (selected.includes(value)) {
      asIs ??= checkSpec(spec as SymbolSpec);
      return toOption(value, true, asIs);
    }
    const next = { ...spec, [field]: isList ? [...selected, value] : value } as SymbolSpec;
    return toOption(value, false, checkSpec(next));
  });
}
