import type { TechnicalFillToken } from './geometry.js';
import type { FreestandingSpec } from './freestanding.js';
import { FREESTANDING_KINDS } from './freestanding.js';
import type {
  AdminLevelId,
  BodyVariantId,
  CapabilityId,
  FunctionRoleId,
  OrganizationId,
  StateId,
  StrengthId,
  SymbolKind,
  SymbolSpec,
  TechnicalHeadMarkId,
  UnitGroupingId,
  VehicleCategoryId,
} from './taxonomy.js';

/**
 * Die **Beschreibung** eines Zeichens (ESZ-149): was gemeint ist, nicht wie es exakt gebaut wird.
 *
 * Zwei Ebenen statt einer (Entscheidung `docs/decisions/2026-11-06-esz-149-beschreibung-und-bauplan.md`):
 * `Sign` ist die Eingabe für Anwendungen, `SymbolSpec` bleibt der exakte **Bauplan** für Rezepte
 * und Prüfpaket. `resolve()` in `core` macht aus einer Beschreibung einen Bauplan, `fromExact()`
 * den Rückweg. Keine Funktion fällt weg: was die Beschreibung nicht ausdrückt (technische
 * Körpermarken, Fassungen, Millimeterwerte), trägt `exact` als Ergänzung.
 *
 * Freistehende Zeichen sind schon schlank und gehen unverändert ein.
 */
export type Sign = BodySign | FreestandingSpec;

/**
 * Genau eine Angabe der Kopfzone. Die vier Wertelisten sind disjunkt (`trupp` … `zug`,
 * `verband-i` …, `gemeinde` …, `single-vertical-bar` …), deshalb reicht ein Feld ohne Präfix.
 * Die Funktionsfassung belegt die Kopfzone auch, steht aber als `role` eigens, weil sie eine
 * eigene Bedeutung hat.
 */
export type SignHead = StrengthId | UnitGroupingId | AdminLevelId | TechnicalHeadMarkId;

/** Größe des mittigen Laufs; `large` ist der vermessene große Grad am 12-mm-Kreis. */
export type SignCenterSize = 'normal' | 'large';

/**
 * Texte am Zeichen, nach ihrer Lage benannt wie `BodyLabels`, ohne Messwerte. `below` ist die
 * Fußzone unter dem Körper (im Bauplan `designation`).
 */
export interface SignText {
  readonly center?: string;
  readonly centerSize?: SignCenterSize;
  readonly topLeft?: string;
  readonly topLeftLines?: readonly [string, string];
  readonly bottomLeft?: string;
  readonly bottomCenter?: string;
  readonly bottomRight?: string;
  readonly below?: string;
  readonly aboveLeft?: string;
  readonly belowRight?: string;
  readonly surfaceBelowLeft?: string;
  readonly surfaceBelowRight?: string;
}

/** Die Bauplan-Ergänzung: jedes Feld der `SymbolSpec` außer der Art, über den Bauplan gelegt. */
export type SignExact = Partial<Omit<SymbolSpec, 'kind'>>;

interface BodySignFields {
  readonly kind: SymbolKind;
  /** Zweite belegte Zeichnung desselben Grundzeichens (im Bauplan `bodyVariant`). */
  readonly variant?: BodyVariantId;
  /**
   * Fachaufgaben. Ob eine Fähigkeit randbündig oder in der Box steht, wählt die Bibliothek:
   * vermessen vor abgeleitet, randbündig vor Box.
   */
  readonly tasks?: readonly CapabilityId[];
  readonly head?: SignHead;
  /** Funktionsfassung aus Anhang D (im Bauplan `functionRole`). */
  readonly role?: FunctionRoleId;
  /** Fahrwerk eines Fahrzeugs (im Bauplan `vehicleCategory`). */
  readonly chassis?: VehicleCategoryId;
  /** Zustände nach 5.8 und höchstens eine Tendenz, in einer Liste. */
  readonly states?: readonly StateId[];
  readonly text?: SignText;
  /** Bauplan-Ergänzung für alles, was die Beschreibung nicht ausdrückt. */
  readonly exact?: SignExact;
}

/**
 * Ein Zeichen mit Körper. Organisation und Farbe ohne Organisation schließen sich im Typ aus
 * (im Bauplan `organization` und `technicalFill`).
 */
export type BodySign = BodySignFields &
  (
    | { readonly organization?: OrganizationId; readonly color?: never }
    | { readonly color?: TechnicalFillToken; readonly organization?: never }
  );

/** Die Felder einer Beschreibung mit Körper, die eine Auswahl haben. */
export type SignChoiceField =
  | 'kind'
  | 'variant'
  | 'organization'
  | 'color'
  | 'tasks'
  | 'head'
  | 'role'
  | 'chassis'
  | 'states';

/** Die Textzonen der Beschreibung. */
export const SIGN_TEXT_ZONES = Object.freeze([
  'center',
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
] as const satisfies readonly Exclude<keyof SignText, 'centerSize'>[]);

export type SignTextZone = (typeof SIGN_TEXT_ZONES)[number];

const FREESTANDING_KIND_SET: ReadonlySet<string> = new Set(FREESTANDING_KINDS);

/** Trennt `Sign` am Feld `kind`, wie `isFreestandingSpec` die Baupläne. */
export function isFreestandingSign(sign: Sign): sign is FreestandingSpec {
  return FREESTANDING_KIND_SET.has(sign.kind);
}
