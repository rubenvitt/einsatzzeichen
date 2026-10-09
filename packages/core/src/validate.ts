import {
  BODY_MARK_RENDITION_IDS,
  DEFAULT_VIEWBOX_MM,
  STATE_IDS,
  TECHNICAL_FILL_TOKENS,
  type BodyMarkId,
  type BodyMarkRenditionId,
  type AdminLevelId,
  type FunctionRoleDefinition,
  type FunctionRoleTextRun,
  type AdministrativeHeadShape,
  type OrganizationId,
  type StateGroupId,
  type StateId,
  type StrengthId,
  type SymbolKind,
  type SymbolSpec,
  type TechnicalFillToken,
  type TechnicalHeadMarkId,
} from '@einsatzzeichen/schema';
import { stateCarriersOf, stateValueGroup } from './blocks/state-groups.js';
import { isAllowedBodyVariant } from './derive/body-variant-pairs.js';
import { bodyMarkRenditionsAnywhere } from './derive/body-marks.js';
import type { BoundsMm } from './bounds.js';
import { bodyBoundsMm } from './derive/body-bounds.js';
import { plainLabelValue } from './label-snapshot.js';
import { profileFor } from './layout/profiles.js';
import {
  functionRoleHeadIsFree,
  functionRoleOrganizationIsFree,
} from './derive/function-roles.js';
import { ARIMO_CAP_HEIGHT_FRACTION, verticalTextBoxMm } from './render/text-policy.js';

export interface ValidationIssue {
  /** Stabile Regel-ID. Wird später in der Dokumentation verlinkt. */
  rule: string;
  message: string;
}

export class CompositionError extends Error {
  constructor(readonly issues: ValidationIssue[]) {
    super(
      `Unzulässige Kombination:\n${issues.map((i) => `  [${i.rule}] ${i.message}`).join('\n')}`,
    );
    this.name = 'CompositionError';
  }
}

/** Grundzeichenarten, die eine taktische Einheit darstellen und eine Stärke tragen dürfen. */
const UNIT_KINDS = new Set<SymbolKind>(['formation', 'person']);

/**
 * Grundzeichenarten, die eine Fahrzeugkategorie tragen dürfen: die Fahrzeuge. Die Kategorie aus
 * Kapitel 5.1 beschreibt das Fahrwerk eines Fahrzeugs; an einer Einheit, einer Stelle oder einem
 * Gebäude hat sie keine Bedeutung (Systematik).
 *
 * Vermessen ist die Fahrwerkszone nur an drei dieser Formen (18. August 2026): von den 31
 * Zeichen des Anhangs E.2 tragen **25** ein Fahrwerk — 20 auf dem Landfahrzeugkörper, vier auf
 * dem Anhängerrumpf, eines auf dem Wechselladerrumpf. Die fünf Wasserfahrzeuge E.2.27 bis E.2.31
 * und die drei Luftfahrzeugdateien 5.1.4.1 bis 5.1.4.3 tragen keines. Seit dem
 * Eigentümerentscheid vom 02.10.2026 ist das keine Sperre mehr. Das Fachreview vom 05.10.2026
 * engt den Fahrzeugkörper ein (`CHASSIS_BODY_KINDS`): am Luftfahrzeug keine Kategorie, am
 * Wasserfahrzeug nur das Amphibienfahrzeug mit übertragener Zone (`derive/vehicle-category.ts`).
 * Bis LFH-424 stand hier schon einmal diese Menge — damals als Annahme, jetzt als Systematik.
 *
 * **Was diese Menge nicht erzwingt: die Paarung von Kategorie und Körperform.** Eine
 * Anhängerkategorie am Landfahrzeug oder eine Kfz-Kategorie am Anhänger widerspricht keiner Regel;
 * gezeichnet wird sie mit den vermessenen Radplätzen der Kategorie
 * (`docs/decisions/2026-08-18-anhang-e2.md`, Abschnitt „Offene Kanten").
 */
const VEHICLE_KINDS = new Set<SymbolKind>([
  'vehicle-land',
  'trailer',
  'swap-loader-vehicle',
  'vehicle-water',
  'vehicle-air',
]);

/**
 * Fahrzeugkörper, deren Fahrwerk Kapitel 5.1 beschreibt: Landfahrzeug, Anhänger- und
 * Wechselladerrumpf (Fachreview vom 05.10.2026, LFH-1064). Rad, Kette, Schiene und
 * Geländegängigkeit sind Fahrwerke eines Landfahrzeugs; an Hubschrauber oder Flächenflugzeug
 * sagen sie fachlich nichts. Am Wasserfahrzeug ist das Amphibienfahrzeug (5.1.1.4) der eine
 * sinnvolle Fall, und nur ihn lässt `vehicle-category-requires-chassis-body` dort zu.
 */
const CHASSIS_BODY_KINDS = new Set<SymbolKind>(['vehicle-land', 'trailer', 'swap-loader-vehicle']);

/**
 * Träger einer Verwaltungsstufe (Fachreview vom 05.10.2026, LFH-1064): Die Stufe sagt, auf
 * welcher Ebene eine Führung, Behörde oder Stelle angesiedelt ist. Das sind Formation und Person,
 * die Stelle als Kreis (`post`, `circle-12`) und das Gebäude, zu dem die reduzierte Hauskontur
 * aus F.3 gehört. Fahrzeug, Gefahr, Maßnahme oder Ereignis haben keine Verwaltungsebene; dort
 * wäre die Stufe eher mit einer Stärkeangabe zu verwechseln.
 */
const ADMINISTRATIVE_LEVEL_KINDS = new Set<SymbolKind>([
  'formation',
  'person',
  'post',
  'circle-12',
  'building',
  'reduced-house',
]);

/** Vermessene Normalhülle des F.2-Landfahrzeugs: x 1…31 / y 5,75…26 mm. */
const F2_VEHICLE_LAND_BODY_HEIGHT_MM = 20.25;
/** Rechte Innenmarge der bestehenden `topLeft`-Box: absolut x 29, relativ zur linken Hülle 28. */
const F2_TOP_LEFT_BOX_RIGHT_FROM_BODY_LEFT_MM = 28;
/** Rechte Kante der F.3-`topLeft`-Box: Kreis maxX 28 minus 2-mm-Innenmarge. */
const F3_CIRCLE_TOP_LEFT_BOX_RIGHT_MM = 26;
/** Rechte Innenmarge der einzeiligen oberen Labelboxen, identisch zur Komposition. */
const TOP_LABEL_BOX_RIGHT_INSET_MM = 2;
/** Bestehende Default-Versalhöhe des mittigen Laufs in der Komposition. */
const DEFAULT_CENTER_LABEL_CAP_HEIGHT_MM = 4.87;

export interface ValidationContext {
  functionRole?: FunctionRoleDefinition;
  administrativeHead?: AdministrativeHeadShape;
}

/**
 * Die Körperhülle, gegen die je-Spec-Metriken geprüft werden: vermessen, wo das Profil sie führt,
 * sonst die des Körperprimitivs (`bodyBoundsMm`). `undefined` für ein Art-/Variantenpaar ohne
 * Grundzeichen — das meldet bereits `body-variant-requires-measured-kind`.
 */
function hullOf(spec: SymbolSpec): BoundsMm | undefined {
  try {
    return bodyBoundsMm(spec.kind, spec.bodyVariant);
  } catch {
    return undefined;
  }
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function strengthId(value: unknown): value is StrengthId {
  return value === 'trupp' || value === 'staffel' || value === 'gruppe' || value === 'zug';
}

function technicalHeadMarkId(value: unknown): value is TechnicalHeadMarkId {
  return value === 'single-vertical-bar' || value === 'double-vertical-bar';
}

function administrativeLevelId(value: unknown): value is AdminLevelId {
  return value === 'gemeinde' || value === 'kreis' || value === 'bezirk' ||
    value === 'bundesland' || value === 'nationalstaat' ||
    value === 'europaeische-union';
}

function organizationId(value: unknown): value is OrganizationId {
  return value === 'feuerwehr' || value === 'thw' || value === 'fuehrung-leitung' ||
    value === 'polizei' || value === 'bundeswehr' ||
    value === 'sonstige-gefahrenabwehr' || value === 'zivile-einheiten' ||
    value === 'hilfsorganisation';
}

const TECHNICAL_FILL_TOKEN_SET: ReadonlySet<unknown> = new Set(TECHNICAL_FILL_TOKENS);

/** Ein Palettentoken, der füllen darf — die Tinten-Tokens färben nur Läufe (LFH-990). */
function technicalFillToken(value: unknown): value is TechnicalFillToken {
  return TECHNICAL_FILL_TOKEN_SET.has(value);
}

function containsText(primitive: unknown): boolean {
  if (!record(primitive)) return false;
  return primitive.type === 'text' ||
    (primitive.type === 'group' && Array.isArray(primitive.children) &&
      primitive.children.some(containsText));
}

function validRoleRun(run: unknown): run is FunctionRoleTextRun {
  if (!record(run)) return false;
  const box = run.boxMm;
  if (!record(box)) return false;
  return typeof run.content === 'string' && run.content.trim() !== '' &&
    finite(run.anchorXMm) && finite(run.baselineYMm) && finite(run.sizeMm) && run.sizeMm > 0 &&
    (run.anchor === 'start' || run.anchor === 'middle' || run.anchor === 'end') &&
    box !== undefined && finite(box.xMm) && finite(box.yMm) && finite(box.widthMm) &&
    finite(box.heightMm) && box.widthMm > 0 && box.heightMm > 0 &&
    box.xMm >= 0 && box.yMm >= 0 &&
    box.xMm + box.widthMm <= DEFAULT_VIEWBOX_MM.width &&
    box.yMm + box.heightMm <= DEFAULT_VIEWBOX_MM.height &&
    typeof run.minRenderPx === 'number' && Number.isInteger(run.minRenderPx) &&
    run.minRenderPx > 0 &&
    (run.ink === 'body-contrast' || run.ink === 'schwarz' ||
      run.ink === 'funktionslauf-kontrast' || run.ink === 'weiss' ||
      run.ink === 'rot' || run.ink === 'blau' || run.ink === 'gelb' ||
      run.ink === 'gruen' || run.ink === 'hellgruen' || run.ink === 'orange' ||
      run.ink === 'braun' || run.ink === 'grau' || run.ink === 'hellgrau' ||
      run.ink === 'hellblau') &&
    (run.contrastBackground === 'body' || run.contrastBackground === 'surface' ||
      run.contrastBackground === 'schwarz' || run.contrastBackground === 'weiss' ||
      run.contrastBackground === 'rot' || run.contrastBackground === 'blau' ||
      run.contrastBackground === 'gelb' || run.contrastBackground === 'gruen' ||
      run.contrastBackground === 'hellgruen' || run.contrastBackground === 'orange' ||
      run.contrastBackground === 'braun' || run.contrastBackground === 'grau' ||
      run.contrastBackground === 'hellgrau' || run.contrastBackground === 'hellblau');
}

function roleRunsOverlap(left: FunctionRoleTextRun, right: FunctionRoleTextRun): boolean {
  const a = left.boxMm;
  const b = right.boxMm;
  return a.xMm < b.xMm + b.widthMm && a.xMm + a.widthMm > b.xMm &&
    a.yMm < b.yMm + b.heightMm && a.yMm + a.heightMm > b.yMm;
}

/**
 * Die Felder von `BodyLabels`. Seit dem 2. Oktober 2026 trägt die eingesenkte Hülle jede Zone
 * (abgeleitet vom angehobenen Wasserrumpf); die Liste schließt weiter unbekannte Schlüssel aus.
 */
const INSET_HULL_LABEL_FIELDS = new Set<PropertyKey>([
  'accessibilityMode',
  'inBodyInk',
  'center',
  'centerAnchorFromBodyLeftMm',
  'centerBaselineFromBodyBottomMm',
  'centerBoxMarginMm',
  'centerCapHeightMm',
  'bottomLeft',
  'bottomCenter',
  'bottomRight',
  'bottomRightMetrics',
  'topLeft',
  'topLeftMetrics',
  'aboveLeft',
  'aboveLeftMetrics',
  'topLeftLines',
  'belowRight',
  'surfaceBelowLeft',
  'surfaceBelowRight',
] satisfies readonly (keyof NonNullable<SymbolSpec['labels']>)[]);

type InsetHullLabelPreparation =
  | { readonly valid: false }
  | {
      readonly valid: true;
      readonly labels: NonNullable<SymbolSpec['labels']>;
    };

/**
 * Die Beschriftung der eingesenkten Wasserfahrzeughülle wird als Datenschnappschuss geprüft.
 * `Object.keys` genügt dafür nicht: geerbte Werte liest `compose()` über die Prototypkette,
 * Accessors können beim Lesen Code ausführen, und nicht-enumerable bzw. Symbolfelder blieben
 * unsichtbar. Akzeptiert werden deshalb ausschließlich eigene, aufzählbare Datenfelder der
 * bekannten Zonen eines normalen oder null-prototype-Objekts, eine Ebene tief ebenso für Felder
 * und Metrikobjekte; jede andere Objektform bleibt fail-closed.
 */
function prepareInsetHullLabelData(value: unknown): InsetHullLabelPreparation {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { valid: false };
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return { valid: false };

  const snapshot = Object.create(null) as NonNullable<SymbolSpec['labels']>;
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string' || !INSET_HULL_LABEL_FIELDS.has(key)) {
      return { valid: false };
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor?.enumerable !== true || !Object.hasOwn(descriptor, 'value')) {
      return { valid: false };
    }
    const plain = plainLabelValue(descriptor.value);
    if (plain === undefined) return { valid: false };
    Object.defineProperty(snapshot, key, {
      configurable: false,
      enumerable: true,
      value: plain.value,
      writable: false,
    });
  }

  return { valid: true, labels: Object.freeze(snapshot) };
}

function validatePreparedSpec(
  spec: SymbolSpec,
  hasInvalidInsetHullLabelData: boolean,
  context: ValidationContext = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const definitionValue: unknown = context.functionRole;
  const resolvedFunctionRole = spec.functionRole !== undefined &&
    record(definitionValue) && definitionValue.id === spec.functionRole;

  if (spec.technicalFill !== undefined && !technicalFillToken(spec.technicalFill)) {
    issues.push({
      rule: 'technical-fill-token-invalid',
      message:
        'Eine technische Körperfüllung muss einen bekannten Farbtoken verwenden, der füllen darf; ' +
        'die Tinten-Tokens färben nur Läufe.',
    });
  }
  if (spec.technicalFill !== undefined && spec.organization !== undefined) {
    issues.push({
      rule: 'technical-fill-organization-conflict',
      message:
        'Technische Körperfüllung und Organisation schließen sich aus: nur die Organisation ' +
        'trägt eine nicht-farbliche Kontursignatur.',
    });
  }

  if (spec.functionRole !== undefined) {
    if (spec.kind !== 'formation' && spec.kind !== 'person') {
      issues.push({
        rule: 'function-role-requires-measured-kind',
        message: 'Eine gemessene Funktion ist nur an Formation oder Person belegt.',
      });
    }
    if (!resolvedFunctionRole) {
      issues.push({
        rule: 'function-role-requires-measured-layout',
        message: 'Die Funktion verlangt ihre exakt aufgeloeste gemessene Layoutdefinition.',
      });
    } else {
      if (definitionValue.kind !== spec.kind) {
        issues.push({
          rule: 'function-role-requires-measured-kind',
          message: `Die Funktion "${spec.functionRole}" ist nicht fuer "${spec.kind}" vermessen.`,
        });
      }
      const layout = record(definitionValue.layout) ? definitionValue.layout : undefined;
      const headTopMm = layout?.headTopMm;
      const expectedHead = definitionValue.expectedHead;
      const expectedOrganization = definitionValue.expectedOrganization;
      const expectedStrength = definitionValue.expectedStrength;
      const expectedAdministrativeLevel = definitionValue.expectedAdministrativeLevel;
      // Rollen der Führung und Leitung nennen ihre Organisation nicht im Titel und stehen in
      // jeder Farbe; die übrigen binden sie (derive/function-roles.ts).
      if (
        !organizationId(expectedOrganization) ||
        (spec.organization !== expectedOrganization &&
          !functionRoleOrganizationIsFree(expectedOrganization))
      ) {
        issues.push({
          rule: 'function-role-organization-mismatch',
          message:
            'Die Funktion nennt ihre Organisation im Titel; eine andere oder fehlende ' +
            'Organisation widerspräche ihr.',
        });
      }
      // Erst die Definition in sich: ihre Kopfart, ihr Kopfwert und ihre Kopflage müssen
      // zusammenpassen. Dann die Spec: genau dieser Kopf — oder, an einer kopffreien
      // Leitungsrolle, jeder andere, ein zusätzlicher oder keiner.
      const definitionHeadConsistent = expectedHead === 'none'
        ? expectedStrength === undefined && expectedAdministrativeLevel === undefined &&
          headTopMm === undefined
        : expectedHead === 'strength'
          ? strengthId(expectedStrength) && expectedAdministrativeLevel === undefined &&
            finite(headTopMm)
          : expectedHead === 'administrative' && expectedStrength === undefined &&
            administrativeLevelId(expectedAdministrativeLevel) && finite(headTopMm);
      const specHeadMatches = expectedHead === 'none'
        ? spec.strength === undefined && spec.administrativeLevel === undefined
        : expectedHead === 'strength'
          ? spec.strength === expectedStrength && spec.administrativeLevel === undefined
          : spec.strength === undefined &&
            spec.administrativeLevel === expectedAdministrativeLevel &&
            context.administrativeHead !== undefined;
      const headMatches = definitionHeadConsistent && (
        specHeadMatches || functionRoleHeadIsFree(definitionValue.id, expectedOrganization)
      );
      if (!headMatches) {
        issues.push({
          rule: 'function-role-head-mismatch',
          message:
            `Die Kopfzone widerspricht der Funktion: sie nennt ihre Kopfzone "${String(expectedHead)}" ` +
            'im Titel.',
        });
      }
      const body = record(layout?.body) ? layout.body : undefined;
      const bodyAdditions = layout?.bodyAdditions;
      const decorations = layout?.decorations;
      const roleRuns = layout?.roleRuns;
      const layoutValid = body?.type === 'rect' && body.role === 'body' &&
        finite(body.x) && finite(body.y) && finite(body.width) && finite(body.height) &&
        body.width > 0 && body.height > 0 && Array.isArray(bodyAdditions) &&
        Array.isArray(decorations) && Array.isArray(roleRuns) &&
        roleRuns.length <= 2 && !decorations.some(containsText);
      if (!layoutValid) {
        issues.push({
          rule: 'function-role-requires-measured-layout',
          message: 'Die Funktionsfassung muss einen vollstaendigen, textfreien Geometrieplan liefern.',
        });
      }
      if (Array.isArray(roleRuns)) {
        const runs: unknown[] = [
          ...roleRuns,
          ...(layout?.carrierRun === undefined ? [] : [layout.carrierRun]),
        ];
        const validRuns = runs.filter(validRoleRun);
        if (
          validRuns.length !== runs.length ||
          validRuns.some((run, index) =>
            validRuns.slice(index + 1).some((other) => roleRunsOverlap(run, other)))
        ) {
          issues.push({
            rule: 'function-role-label-metrics-required',
            message: 'Jeder Funktionslauf braucht vollstaendige sichtbare Metriken ohne Boxueberlagerung.',
          });
        }
      }
    }
    // Körpervariante, Piktogramme und weitere Körpermarken an einer Funktion zeichnet der
    // Rollenzweig abgeleitet (derive/function-roles.ts); die Variante selbst prüft
    // `body-variant-requires-measured-kind`.
  }
  const hull = hullOf(spec);

  // Seit dem 2. Oktober 2026 nur noch Systematik: gesperrt bleibt eine Variante, die eine Form
  // einer anderen Art benennt (Rumpf, Flügel, Personraute, Kreis). Übertragbare Modifikatoren
  // zeichnet der Motor abgeleitet (`derive/body-variant-pairs.ts`).
  //
  // Der Giebel („ortsfest“, 3.9) ist kein artgebundener Rumpf, aber er meint temporär ortsfeste
  // Strukturen und steht deshalb nur an Stelle, Formation, Gebäude, Container und den
  // Fahrzeugkörpern mit Fahrgestell (Fachreview vom 05.10.2026, LFH-1064). Seine Ablehnung trägt
  // eine eigene Kennung, weil der Grund ein anderer ist als bei Rumpf, Flügel oder Raute.
  if (
    spec.bodyVariant === 'raised-gable' &&
    !isAllowedBodyVariant(spec.kind, spec.bodyVariant)
  ) {
    issues.push({
      rule: 'raised-gable-requires-stationary-kind',
      message:
        `Der Giebel bedeutet „ortsfest“ (3.9) und steht nur an Stelle, Formation, Gebäude, ` +
        `Container, Landfahrzeug, Anhänger und Wechsellader; an "${spec.kind}" ist „ortsfest“ ` +
        'selbstverständlich, sinnlos oder widerspricht der Art.',
    });
  } else if (
    spec.bodyVariant !== undefined &&
    !isAllowedBodyVariant(spec.kind, spec.bodyVariant)
  ) {
    issues.push({
      rule: 'body-variant-requires-measured-kind',
      message:
        `Die Körpervariante "${spec.bodyVariant}" benennt eine Form, die "${spec.kind}" nicht ` +
        'trägt. Varianten fallen weder auf eine andere Körperart noch auf deren Normalfassung zurück.',
    });
  }

  const isInsetWatercraft =
    spec.kind === 'vehicle-water' && spec.bodyVariant === 'inset-hull';

  // Organisation und Körpermarken an der eingesenkten Hülle sind seit dem 2. Oktober 2026 frei:
  // jede Organisation füllt den Rumpf (`derive/inset-hull-organization.ts`), unvermessene Marken
  // überträgt `derive/body-marks.ts`. Entfallen: `inset-hull-requires-measured-organization` und
  // `inset-hull-requires-measured-body-mark`.

  // Seit dem 2. Oktober 2026 trägt die eingesenkte Hülle jede Beschriftungszone und die
  // Bezeichnung; vermessen ist am I.3-Vertrag weiter nur der mittige Lauf, die übrigen Zonen
  // leitet `derive/label-zones.ts` vom angehobenen Wasserrumpf ab. Die Kennung bleibt für die
  // Härtung des Schnappschusses: nur eigene Datenfelder bekannter Zonen (siehe
  // `prepareInsetHullLabelData`).
  if (isInsetWatercraft && hasInvalidInsetHullLabelData) {
    issues.push({
      rule: 'inset-hull-requires-center-label-only',
      message:
        'inset-hull labels must be plain own data fields of the known label zones; accessors, ' +
        'inherited, symbol or unknown fields are rejected.',
    });
  }

  if (spec.strength !== undefined && !UNIT_KINDS.has(spec.kind)) {
    issues.push({
      rule: 'strength-requires-unit',
      message:
        `Eine Stärkeangabe ist nur an taktischen Einheiten zulässig. ` +
        `"${spec.kind}" ist keine Einheit.`,
    });
  }

  if (spec.vehicleCategory !== undefined && !VEHICLE_KINDS.has(spec.kind)) {
    issues.push({
      rule: 'vehicle-category-requires-vehicle',
      message:
        'Eine Fahrzeugkategorie beschreibt das Fahrwerk eines Fahrzeugs und steht nur an ' +
        `Fahrzeugen. "${spec.kind}" ist kein Fahrzeug.`,
    });
  }

  // Fachreview vom 05.10.2026 (LFH-1064): Die Kategorien aus 5.1 beschreiben das Fahrwerk eines
  // Landfahrzeugs. Am Luftfahrzeug ist jede gesperrt, am Wasserfahrzeug jede außer dem
  // Amphibienfahrzeug (5.1.1.4). Ein Nichtfahrzeug meldet allein die Regel davor.
  if (
    spec.vehicleCategory !== undefined && VEHICLE_KINDS.has(spec.kind) &&
    !CHASSIS_BODY_KINDS.has(spec.kind) &&
    !(spec.kind === 'vehicle-water' && spec.vehicleCategory === 'amphibienfahrzeug')
  ) {
    issues.push({
      rule: 'vehicle-category-requires-chassis-body',
      message:
        'Eine Fahrzeugkategorie beschreibt das Fahrwerk eines Landfahrzeugs und steht nur an ' +
        'Landfahrzeug, Anhänger und Wechsellader; am Wasserfahrzeug nur das Amphibienfahrzeug ' +
        `(5.1.1.4). "${spec.vehicleCategory}" an "${spec.kind}" ist fachlich ohne Bedeutung.`,
    });
  }

  // Fahrwerkszone und Fußzone belegen denselben Streifen unterhalb des Körpers, und **kein**
  // Zeichen des Referenzbestands trägt beides. Gemessen (18. August 2026): das Fahrwerk reicht von
  // der Körperunterkante bis 4,75 mm darunter (26,0004 bis 30,7502 mm bei den Landfahrzeugen),
  // die Fußzone beginnt 1 mm unter der Körperunterkante (`HEAD_GAP_MM`) und ist 4 mm hoch. Die
  // Überschneidung beträgt 3,75 mm bei einer Zonenhöhe von 4 mm.
  //
  // Deshalb eine Ablehnung und keine Ausweichregel: wohin die Fußzone rückte, wenn ein Zeichen
  // beides trüge, ist nicht belegt — unterhalb des Fahrwerks begänne sie bei 31,75 mm und verließe
  // die 32-mm-Grundfläche. Die Referenz beschriftet ihre Fahrzeuge stattdessen **im** Körper
  // (`spec.labels`), und das ist mit einer Fahrwerkszone zulässig: alle 25 E.2-Zeichen mit
  // Fahrwerk tun genau das (21 mit einer Fahrzeugkategorie, vier mit einem Anhängerfahrwerk) —
  // E.2 tun genau das.
  //
  // Die übrigen Zonen unterhalb des Körpers (Lauf unterhalb rechts, Oberflächenläufe) prüft
  // `below-body-zone-conflict`; diese Regel bleibt bei Fahrwerk und Bezeichnung.
  if (spec.vehicleCategory !== undefined && spec.designation !== undefined) {
    issues.push({
      rule: 'chassis-foot-conflict',
      message:
        'Fahrzeugkategorie und Bezeichnung belegen beide den Streifen unterhalb des Körpers und ' +
        'schließen sich aus. Anhang E.2 beschriftet seine Fahrzeuge in den Körperzonen.',
    });
  }

  if (spec.bodyVariant === 'plain-wheel-pair' && spec.vehicleCategory !== undefined) {
    issues.push({
      rule: 'plain-wheel-pair-chassis-conflict',
      message:
        'Die Variante plain-wheel-pair zeichnet bereits zwei vermessene Radringe. Eine ' +
        'Fahrzeugkategorie würde eine zweite, nicht belegte Fahrwerksgeometrie darüberlegen.',
    });
  }

  if (
    spec.designation !== undefined &&
    (
      // Das Radpaar hängt an jedem Fahrzeugkörper unter der Unterkante, auch abgeleitet.
      spec.bodyVariant === 'plain-wheel-pair' ||
      (spec.kind === 'vehicle-air' &&
        (spec.bodyVariant === 'raised-hull' || spec.bodyVariant === 'fixed-wing-hull'))
    )
  ) {
    issues.push({
      rule: 'body-variant-foot-conflict',
      message:
        'Die sichtbare Zusatzgeometrie dieser Körpervariante belegt den Streifen unterhalb des ' +
        'Körpers. Eine Bezeichnung in der Fußzone würde sie überlagern oder die viewBox verlassen.',
    });
  }

  if (
    spec.designation !== undefined &&
    (spec.labels?.surfaceBelowLeft !== undefined || spec.labels?.surfaceBelowRight !== undefined)
  ) {
    issues.push({
      rule: 'surface-label-foot-conflict',
      message:
        'Bezeichnung und schwarze Oberflächenläufe belegen denselben Streifen unterhalb des ' +
        'Körpers. Ohne vermessene Ausweichposition schließen sie sich aus.',
    });
  }

  // Zonenkollisionen der Beschriftungszonen außerhalb des Körpers, sichtbar geworden mit ihrer
  // Freigabe an jeder Körperform (2. Oktober 2026). Der Lauf oberhalb links steht im Streifen der
  // Kopfzone; Fahrwerk, Bezeichnung, Lauf unterhalb rechts und Oberflächenläufe teilen den
  // Streifen unter dem Körper. Eine Ausweichlage gibt es nicht: über der Kopfzone und unter dem
  // Fahrwerk endet die 32-mm-Grundfläche. Die Paare Fahrwerk/Bezeichnung und
  // Bezeichnung/Oberflächenlauf decken weiter `chassis-foot-conflict` und
  // `surface-label-foot-conflict` ab.
  if (
    spec.labels?.aboveLeft !== undefined &&
    (spec.strength !== undefined || spec.technicalHeadMark !== undefined ||
      spec.unitGrouping !== undefined || spec.administrativeLevel !== undefined ||
      // Der Giebel („ortsgebunden“) steht im selben Streifen über dem Körper.
      spec.bodyVariant === 'raised-gable')
  ) {
    issues.push({
      rule: 'above-left-label-head-conflict',
      message:
        'Der Lauf oberhalb links und die Kopfzone oder der Giebel belegen denselben Streifen über ' +
        'dem Körper und schließen sich aus.',
    });
  }
  const hasChassis = spec.vehicleCategory !== undefined || spec.bodyVariant === 'plain-wheel-pair';
  const hasSurfaceLabel =
    spec.labels?.surfaceBelowLeft !== undefined || spec.labels?.surfaceBelowRight !== undefined;
  if (
    (hasChassis && (spec.labels?.belowRight !== undefined || hasSurfaceLabel)) ||
    (spec.labels?.belowRight !== undefined &&
      (spec.labels.surfaceBelowRight !== undefined || spec.designation !== undefined))
  ) {
    issues.push({
      rule: 'below-body-zone-conflict',
      message:
        'Fahrwerk, Bezeichnung, der Lauf unterhalb rechts und die schwarzen Oberflächenläufe ' +
        'belegen denselben Streifen unter dem Körper; je Seite trägt er nur einen davon.',
    });
  }

  if (spec.administrativeLevel !== undefined && !ADMINISTRATIVE_LEVEL_KINDS.has(spec.kind)) {
    issues.push({
      rule: 'administrative-level-requires-carrier',
      message:
        'Eine Verwaltungsstufe sagt, auf welcher Ebene eine Führung, Behörde oder Stelle ' +
        'angesiedelt ist, und steht nur an Formation, Person, Stelle und Gebäude. ' +
        `"${spec.kind}" hat keine Verwaltungsebene.`,
    });
  }

  if (
    spec.technicalHeadMark !== undefined &&
    !technicalHeadMarkId(spec.technicalHeadMark)
  ) {
    issues.push({
      rule: 'technical-head-mark-not-measured',
      message:
        `Die technische Kopfmarke "${String(spec.technicalHeadMark)}" ist nicht vermessen.`,
    });
  }

  // Deckt Stärke, Verwaltungsstufe und technische Kopfmarke gegeneinander sowie die technische
  // Kopfmarke gegen eine Funktionsfassung mit eigenem Kopf ab. Eine Funktionsfassung ist
  // nicht pauschal eine weitere Kopfquelle: bestehende Rollen binden selbst genau eine Stärke,
  // Verwaltungsstufe oder kopflose Fassung und müssen unverändert gültig bleiben.
  // Die Entscheidungsnotiz vom
  // 4. August 2026, Abschnitt 2, schreibt dieser Regel zusätzlich die Fahrzeugkategorie zu — das
  // ist falsch, `spec.vehicleCategory` kommt hier nicht vor, und die Begründung „belegen beide die
  // Kopfzone" trüge für sie geometrisch auch nicht: die Stärke sitzt oben, das Fahrwerk unten.
  //
  // Diese Kollision ist Systematik und keine Messsperre: Auch eine mit Verwaltungskopf und
  // Funktionsrolle vollständig aufgeloeste Stufe bleibt zusammen mit einer Stärkeangabe
  // geometrisch unzulässig — eine Kopfzone, ein Kopf. Die Regel wird nicht durch einen Typ ersetzt, der die
  // Kollision unmöglich macht: eine unterscheidende Vereinigung über `SymbolSpec` (etwa
  // `head: {strength} | {administrativeLevel}`) zöge alle Rezepte und ihre Tests nach. Die
  // Entscheidung steht in der Notiz vom 18. August 2026, damit sie nicht als Versäumnis gelesen
  // wird.
  //
  // Seit LFH-577 belegt auch der Verband (`unitGrouping`) die Kopfzone. Kein Original setzt seine
  // Balken zusammen mit Stärkepunkten, Verwaltungssternen, einer technischen Kopfmarke oder einer
  // Funktionsfassung (`docs/decisions/2026-09-29-lfh-577-verband-5-5.md` §2); er zählt deshalb
  // wie die technische Kopfmarke, auch gegen die Funktionsfassung.
  const explicitHeadOccupants = [
    spec.strength,
    spec.administrativeLevel,
    spec.technicalHeadMark,
    spec.unitGrouping,
  ].filter((value) => value !== undefined).length;
  // Eine Funktion ohne eigenen Kopf (`expectedHead: 'none'`) lässt die Kopfzone frei; dort
  // stehen Kopfmarke oder Verband wie am normalen Körper (Entscheidung vom 2. Oktober 2026).
  const functionRoleLeavesHeadFree = resolvedFunctionRole && record(definitionValue) &&
    definitionValue.expectedHead === 'none';
  if (
    explicitHeadOccupants > 1 ||
    ((spec.technicalHeadMark !== undefined || spec.unitGrouping !== undefined) &&
      spec.functionRole !== undefined && !functionRoleLeavesHeadFree)
  ) {
    issues.push({
      rule: 'head-zone-conflict',
      message:
        'Mehrere Angaben belegen dieselbe Kopfzone und schließen sich aus.',
    });
  }

  if (spec.designation !== undefined && spec.designation.trim() === '') {
    issues.push({
      rule: 'designation-not-blank',
      message: 'Eine Bezeichnung darf nicht leer oder nur aus Leerzeichen bestehen.',
    });
  }

  // Die Messsperren `circle-top-left-requires-metrics`, `circle-12-requires-organization`,
  // `circle-12-requires-hilfsorganisation`, `colored-circle-top-left-not-measured` und
  // `reduced-house-requires-hilfsorganisation` sind am 2. Oktober 2026 gefallen
  // (`derive/circle.ts`): Jede Organisation, auch keine, füllt den Kreis und die reduzierte
  // Hauskontur, und ein topLeft-Lauf am 12-mm-Kreis ohne Metriksatz übernimmt den vermessenen
  // F.3.3- bzw. F.3.5-Satz.
  const isMeasuredCircleVariant = spec.kind === 'circle-12' &&
    (spec.bodyVariant === undefined || spec.bodyVariant === 'raised-gable');

  const topLeftMetrics = spec.labels?.topLeftMetrics as unknown;
  if (topLeftMetrics !== undefined) {
    const metricsRecord = typeof topLeftMetrics === 'object' && topLeftMetrics !== null &&
        !Array.isArray(topLeftMetrics)
      ? topLeftMetrics as Record<string, unknown>
      : undefined;
    const capHeightMm = metricsRecord?.capHeightMm;
    const baselineFromBodyTopMm = metricsRecord?.baselineFromBodyTopMm;
    const anchorFromBodyLeftMm = metricsRecord?.anchorFromBodyLeftMm;

    if (spec.labels?.topLeft === undefined || spec.labels.topLeft.trim() === '') {
      issues.push({
        rule: 'top-left-metrics-require-top-left-label',
        message:
          'Gemessene Metriken der oberen linken Zone verlangen einen nichtleeren topLeft-Lauf; ' +
          'ohne ihn würden alle drei Maße still verschluckt.',
      });
    }
    // Seit dem 2. Oktober 2026 an jeder Körperform zulässig. Die Grenzen bleiben: am F.2-Landfahrzeug
    // und an den beiden F.3-Kreisfassungen ihre vermessenen Boxen, sonst die Körperhülle.
    const isMeasuredVehicleLand = spec.kind === 'vehicle-land' &&
      (spec.bodyVariant === undefined || spec.bodyVariant === 'foot-band');
    if (
      metricsRecord === undefined ||
      !Object.hasOwn(metricsRecord, 'capHeightMm') ||
      !Object.hasOwn(metricsRecord, 'baselineFromBodyTopMm') ||
      !Object.hasOwn(metricsRecord, 'anchorFromBodyLeftMm')
    ) {
      issues.push({
        rule: 'top-left-metrics-complete',
        message:
          'Gemessene topLeft-Metriken müssen Versalhöhe, Grundlinie und Anker gemeinsam führen; ' +
          'ein partielles Objekt würde unbelegte Profilwerte hineinmischen.',
      });
    }
    if (!(typeof capHeightMm === 'number' && Number.isFinite(capHeightMm) && capHeightMm > 0)) {
      issues.push({
        rule: 'top-left-cap-height-positive',
        message: 'Die Versalhöhe des topLeft-Laufs muss endlich und größer als null sein.',
      });
    }
    if (isMeasuredVehicleLand) {
      if (
        !(typeof baselineFromBodyTopMm === 'number' &&
          Number.isFinite(baselineFromBodyTopMm) &&
          typeof capHeightMm === 'number' &&
          Number.isFinite(capHeightMm) &&
          baselineFromBodyTopMm >= capHeightMm &&
          baselineFromBodyTopMm <= F2_VEHICLE_LAND_BODY_HEIGHT_MM)
      ) {
        issues.push({
          rule: 'top-left-baseline-within-body',
          message:
            'Die topLeft-Grundlinie muss mindestens eine Versalhöhe unter der Körperoberkante ' +
            `und höchstens ${F2_VEHICLE_LAND_BODY_HEIGHT_MM} mm darunter liegen.`,
        });
      }
      if (
        !(typeof anchorFromBodyLeftMm === 'number' &&
          Number.isFinite(anchorFromBodyLeftMm) &&
          anchorFromBodyLeftMm >= 0 &&
          anchorFromBodyLeftMm <= F2_TOP_LEFT_BOX_RIGHT_FROM_BODY_LEFT_MM)
      ) {
        issues.push({
          rule: 'top-left-anchor-within-body',
          message:
            'Der topLeft-Anker muss endlich sein und innerhalb der vermessenen Landfahrzeugbox ' +
            `zwischen 0 und ${F2_TOP_LEFT_BOX_RIGHT_FROM_BODY_LEFT_MM} mm liegen.`,
        });
      }
    }

    if (!isMeasuredVehicleLand && !isMeasuredCircleVariant) {
      const bodyBounds = hull;
      let metricsWithinBody = false;
      if (
        bodyBounds !== undefined &&
        typeof capHeightMm === 'number' && Number.isFinite(capHeightMm) && capHeightMm > 0 &&
        typeof baselineFromBodyTopMm === 'number' && Number.isFinite(baselineFromBodyTopMm) &&
        typeof anchorFromBodyLeftMm === 'number' && Number.isFinite(anchorFromBodyLeftMm)
      ) {
        const anchorXMm = bodyBounds.minX + anchorFromBodyLeftMm;
        const baselineYMm = bodyBounds.minY + baselineFromBodyTopMm;
        const box = verticalTextBoxMm(
          baselineYMm,
          capHeightMm / ARIMO_CAP_HEIGHT_FRACTION,
          'alphabetic',
        );
        metricsWithinBody = anchorXMm >= bodyBounds.minX &&
          anchorXMm <= bodyBounds.maxX - TOP_LABEL_BOX_RIGHT_INSET_MM &&
          box.topMm >= bodyBounds.minY &&
          box.topMm + box.heightMm <= bodyBounds.maxY;
      }
      if (!metricsWithinBody) {
        issues.push({
          rule: 'top-left-metrics-within-body',
          message:
            'Der vollständige topLeft-Lauf muss mit endlichem Anker und seiner abgeleiteten ' +
            'vertikalen Textbox innerhalb der Körperhülle liegen.',
        });
      }
    }

    if (isMeasuredCircleVariant) {
      const circleMinXMm = 4;
      const circleMinYMm = spec.bodyVariant === 'raised-gable' ? 6 : 4;
      const anchorXMm = typeof anchorFromBodyLeftMm === 'number'
        ? circleMinXMm + anchorFromBodyLeftMm
        : Number.NaN;
      if (
        !(Number.isFinite(anchorXMm) &&
          anchorXMm >= 0 &&
          anchorXMm <= F3_CIRCLE_TOP_LEFT_BOX_RIGHT_MM)
      ) {
        issues.push({
          rule: 'circle-top-left-anchor-within-viewbox',
          message:
            'Der relative Kreislabel-Anker darf außerhalb der Kreisfläche beginnen, seine ' +
            'absolute Lage muss aber innerhalb der 32-mm-ViewBox liegen und darf die rechte ' +
            `Kante der deklarierten Textbox bei ${F3_CIRCLE_TOP_LEFT_BOX_RIGHT_MM} mm nicht ` +
            'überschreiten.',
        });
      }

      let verticalBoxWithinViewBox = false;
      if (
        typeof baselineFromBodyTopMm === 'number' &&
        Number.isFinite(baselineFromBodyTopMm) &&
        typeof capHeightMm === 'number' &&
        Number.isFinite(capHeightMm) &&
        capHeightMm > 0
      ) {
        const baselineYMm = circleMinYMm + baselineFromBodyTopMm;
        const sizeMm = capHeightMm / ARIMO_CAP_HEIGHT_FRACTION;
        const box = verticalTextBoxMm(baselineYMm, sizeMm, 'alphabetic');
        verticalBoxWithinViewBox = box.topMm >= 0 &&
          box.topMm + box.heightMm <= DEFAULT_VIEWBOX_MM.height;
      }
      if (!verticalBoxWithinViewBox) {
        issues.push({
          rule: 'circle-top-left-baseline-within-viewbox',
          message:
            'Die relative Kreislabel-Grundlinie darf außerhalb der Kreisfläche liegen, die ' +
            'daraus berechnete Textbox muss aber vollständig innerhalb der 32-mm-ViewBox bleiben.',
        });
      }
    }
  }

  const aboveLeftMetrics = spec.labels?.aboveLeftMetrics as unknown;
  if (aboveLeftMetrics !== undefined) {
    const record = typeof aboveLeftMetrics === 'object' && aboveLeftMetrics !== null &&
      !Array.isArray(aboveLeftMetrics)
      ? aboveLeftMetrics as Record<string, unknown>
      : undefined;
    const invalidOrIncomplete =
      spec.labels?.aboveLeft === undefined ||
      record === undefined ||
      !Object.hasOwn(record, 'capHeightMm') ||
      !Object.hasOwn(record, 'baselineFromBodyTopMm') ||
      !Object.hasOwn(record, 'anchorFromBodyLeftMm') ||
      !(typeof record.capHeightMm === 'number' && Number.isFinite(record.capHeightMm) &&
        record.capHeightMm > 0) ||
      !(typeof record.baselineFromBodyTopMm === 'number' &&
        Number.isFinite(record.baselineFromBodyTopMm)) ||
      !(typeof record.anchorFromBodyLeftMm === 'number' &&
        Number.isFinite(record.anchorFromBodyLeftMm));
    if (invalidOrIncomplete) {
      issues.push({
        rule: 'above-left-metrics-complete',
        message: 'Gemessene aboveLeft-Metriken verlangen Lauf, Versalhöhe, Grundlinie und Anker.',
      });
    }
    if (!invalidOrIncomplete && record !== undefined) {
      const bodyBounds = hull;
      const capHeightMm = record.capHeightMm as number;
      const baselineYMm = (bodyBounds?.minY ?? Number.NaN) +
        (record.baselineFromBodyTopMm as number);
      const anchorXMm = (bodyBounds?.minX ?? Number.NaN) +
        (record.anchorFromBodyLeftMm as number);
      const box = verticalTextBoxMm(
        baselineYMm,
        capHeightMm / ARIMO_CAP_HEIGHT_FRACTION,
        'alphabetic',
      );
      const boxRightXMm = (bodyBounds?.maxX ?? Number.NaN) - TOP_LABEL_BOX_RIGHT_INSET_MM;
      if (
        bodyBounds === undefined ||
        anchorXMm < 0 ||
        anchorXMm > boxRightXMm ||
        box.topMm < 0 ||
        box.topMm + box.heightMm > DEFAULT_VIEWBOX_MM.height
      ) {
        issues.push({
          rule: 'above-left-metrics-within-viewbox',
          message:
            'Der abgeleitete aboveLeft-Lauf muss mit seinem Anker innerhalb der Profilbox der ' +
            'Körperhülle und mit seiner vollständigen Textbox innerhalb der 32-mm-ViewBox liegen.',
        });
      }
    }
  }

  if (spec.labels?.topLeftLines !== undefined && spec.labels.topLeftLines.length !== 2) {
    issues.push({
      rule: 'top-left-lines-exactly-two',
      message: 'Die zweizeilige obere Beschriftungszone muss exakt zwei Zeilen enthalten.',
    });
  }

  if (
    spec.labels?.centerBaselineFromBodyBottomMm !== undefined &&
    spec.labels.center === undefined
  ) {
    issues.push({
      rule: 'center-baseline-requires-center-label',
      message: 'Eine gemessene mittige Grundlinie verlangt einen mittigen Lauf.',
    });
  }
  if (
    spec.labels?.centerBaselineFromBodyBottomMm !== undefined &&
    !(Number.isFinite(spec.labels.centerBaselineFromBodyBottomMm) &&
      spec.labels.centerBaselineFromBodyBottomMm > 0)
  ) {
    issues.push({
      rule: 'center-baseline-positive',
      message: 'Der Abstand der mittigen Grundlinie muss endlich und größer als null sein.',
    });
  }
  // Abweichende Grundlinie und Anker des mittigen Laufs sind seit dem 2. Oktober 2026 an jeder
  // Körperform zulässig; außerhalb der vermessenen Listen zeichnet `compose()` sie als abgeleitet.
  // Die Grenze ist die Körperhülle (`center-label-within-body`, Anker unten).
  if (
    spec.labels?.centerAnchorFromBodyLeftMm !== undefined &&
    (
      spec.labels.center === undefined ||
      !Number.isFinite(spec.labels.centerAnchorFromBodyLeftMm) ||
      hull === undefined ||
      spec.labels.centerAnchorFromBodyLeftMm < 0 ||
      spec.labels.centerAnchorFromBodyLeftMm > hull.maxX - hull.minX
    )
  ) {
    // Die Kennung stammt aus der Zeit, als nur der Anhänger (I.2.5) einen Anker führte; seit
    // dem 2. Oktober 2026 prüft sie nur noch Lauf, Endlichkeit und Hülle. Sie bleibt als API stehen.
    issues.push({
      rule: 'center-anchor-override-requires-measured-trailer',
      message:
        'Ein abweichender mittiger x-Anker verlangt einen mittigen Lauf und einen endlichen Wert ' +
        'innerhalb der Körperhülle.',
    });
  }
  if (spec.labels?.centerBaselineFromBodyBottomMm !== undefined) {
    const bodyBounds = hull;
    const capHeightMm = spec.labels.centerCapHeightMm ?? DEFAULT_CENTER_LABEL_CAP_HEIGHT_MM;
    const baselineYMm = (bodyBounds?.maxY ?? Number.NaN) -
      spec.labels.centerBaselineFromBodyBottomMm;
    const box = verticalTextBoxMm(
      baselineYMm,
      capHeightMm / ARIMO_CAP_HEIGHT_FRACTION,
      'alphabetic',
    );
    if (
      bodyBounds === undefined ||
      !Number.isFinite(baselineYMm) ||
      !Number.isFinite(capHeightMm) ||
      capHeightMm <= 0 ||
      box.topMm < bodyBounds.minY ||
      box.topMm + box.heightMm > bodyBounds.maxY
    ) {
      issues.push({
        rule: 'center-label-within-body',
        message:
          'Die aus Grundlinie und Versalhöhe abgeleitete mittige Textbox muss vollständig ' +
          'innerhalb der Körperhülle liegen.',
      });
    }
  }

  const centerBoxMarginMm = spec.labels?.centerBoxMarginMm;
  if (centerBoxMarginMm !== undefined && spec.labels?.center === undefined) {
    issues.push({
      rule: 'center-box-margin-requires-center-label',
      message: 'Ein individueller Rand der mittigen Textbox verlangt einen mittigen Lauf.',
    });
  }
  if (
    centerBoxMarginMm !== undefined &&
    !(Number.isFinite(centerBoxMarginMm) && centerBoxMarginMm >= 0)
  ) {
    issues.push({
      rule: 'center-box-margin-non-negative',
      message: 'Der Rand der mittigen Textbox muss endlich und mindestens null sein.',
    });
  }
  if (
    centerBoxMarginMm !== undefined &&
    Number.isFinite(centerBoxMarginMm) &&
    centerBoxMarginMm >= 0
  ) {
    const bodyWidthMm = hull === undefined ? 0 : hull.maxX - hull.minX;
    if (centerBoxMarginMm * 2 >= bodyWidthMm) {
      issues.push({
        rule: 'center-box-margin-within-body',
        message:
          'Der beidseitige Rand der mittigen Textbox muss eine positive Boxbreite innerhalb ' +
          'der Körperhülle übrig lassen.',
      });
    }
  }

  // Die gemessene Versalhöhe des mittigen Laufs. Ohne mittigen Lauf hätte sie keine Wirkung —
  // und eine Angabe ohne Wirkung ist genau der stille Ausfall, den `administrative-level` und
  // `label-not-blank` an anderer Stelle abfangen.
  if (spec.labels?.centerCapHeightMm !== undefined && spec.labels.center === undefined) {
    issues.push({
      rule: 'center-cap-height-requires-center-label',
      message:
        'Eine Versalhöhe für den mittigen Lauf ohne mittigen Lauf hat keine Wirkung und würde ' +
        'still verschluckt.',
    });
  }

  if (
    spec.labels?.centerCapHeightMm !== undefined &&
    !(Number.isFinite(spec.labels.centerCapHeightMm) && spec.labels.centerCapHeightMm > 0)
  ) {
    issues.push({
      rule: 'center-cap-height-positive',
      message:
        'Die Versalhöhe des mittigen Laufs muss endlich und größer als null sein; sie ist eine ' +
        `Messung an der Referenzdatei (erhalten: ${String(spec.labels.centerCapHeightMm)}).`,
    });
  }

  const hasInBodyLabel = [
    spec.labels?.center,
    spec.labels?.topLeft,
    spec.labels?.bottomLeft,
    spec.labels?.bottomCenter,
    spec.labels?.bottomRight,
    ...(spec.labels?.topLeftLines ?? []),
  ].some((value) => typeof value === 'string' && value.trim() !== '');
  if (spec.labels?.inBodyInk !== undefined && !hasInBodyLabel) {
    issues.push({
      rule: 'in-body-ink-requires-in-body-label',
      message:
        'Ein gemessener Tintenoverride verlangt mindestens einen nichtleeren Textlauf im Körper; ' +
        'oberhalb oder auf der Ausgabeoberfläche liegende Läufe verwenden eigene Tintenverträge.',
    });
  }

  const bottomRightMetrics = spec.labels?.bottomRightMetrics as unknown;
  if (bottomRightMetrics !== undefined) {
    const record = typeof bottomRightMetrics === 'object' && bottomRightMetrics !== null &&
        !Array.isArray(bottomRightMetrics)
      ? bottomRightMetrics as Record<string, unknown>
      : undefined;
    const required = [
      'capHeightMm',
      'baselineFromBodyTopMm',
      'anchorFromBodyLeftMm',
      'boxLeftFromBodyLeftMm',
      'boxWidthMm',
    ] as const;
    const complete = record !== undefined && required.every((field) =>
      Object.hasOwn(record, field));
    // Ohne vermessene Textbox am Profil gilt die Körperhülle (seit dem 2. Oktober 2026).
    const profileBounds = profileFor(spec.kind, spec.bodyVariant).bottomRightMetricsBounds ??
      (hull === undefined
        ? undefined
        : { widthMm: hull.maxX - hull.minX, heightMm: hull.maxY - hull.minY });

    if (spec.labels?.bottomRight === undefined || spec.labels.bottomRight.trim() === '') {
      issues.push({
        rule: 'bottom-right-metrics-require-bottom-right-label',
        message:
          'Gemessene bottomRight-Metriken verlangen einen nichtleeren Lauf; ohne ihn würden ' +
          'Versalhöhe, Grundlinie, Anker und Box still verschluckt.',
      });
    }
    if (!complete) {
      issues.push({
        rule: 'bottom-right-metrics-complete',
        message:
          'Gemessene bottomRight-Metriken müssen Versalhöhe, Grundlinie, Anker, Boxanfang und ' +
          'Boxbreite gemeinsam führen.',
      });
    }

    if (complete && profileBounds !== undefined && record !== undefined) {
      const capHeightMm = record.capHeightMm;
      const baselineFromBodyTopMm = record.baselineFromBodyTopMm;
      const anchorFromBodyLeftMm = record.anchorFromBodyLeftMm;
      const boxLeftFromBodyLeftMm = record.boxLeftFromBodyLeftMm;
      const boxWidthMm = record.boxWidthMm;
      const finiteNumbers = [
        capHeightMm,
        baselineFromBodyTopMm,
        anchorFromBodyLeftMm,
        boxLeftFromBodyLeftMm,
        boxWidthMm,
      ].every((value) => typeof value === 'number' && Number.isFinite(value));
      let withinBody = false;
      if (
        finiteNumbers &&
        typeof capHeightMm === 'number' && capHeightMm > 0 &&
        typeof baselineFromBodyTopMm === 'number' &&
        typeof anchorFromBodyLeftMm === 'number' &&
        typeof boxLeftFromBodyLeftMm === 'number' &&
        typeof boxWidthMm === 'number' && boxWidthMm > 0
      ) {
        const boxRightFromBodyLeftMm = boxLeftFromBodyLeftMm + boxWidthMm;
        const sizeMm = capHeightMm / ARIMO_CAP_HEIGHT_FRACTION;
        const verticalBox = verticalTextBoxMm(
          baselineFromBodyTopMm,
          sizeMm,
          'alphabetic',
        );
        withinBody = boxLeftFromBodyLeftMm >= 0 &&
          boxRightFromBodyLeftMm <= profileBounds.widthMm &&
          anchorFromBodyLeftMm >= boxLeftFromBodyLeftMm &&
          anchorFromBodyLeftMm <= boxRightFromBodyLeftMm &&
          verticalBox.topMm >= 0 &&
          verticalBox.topMm + verticalBox.heightMm <= profileBounds.heightMm;
      }
      if (!withinBody) {
        issues.push({
          rule: 'bottom-right-metrics-within-body',
          message:
            'Die vollständige bottomRight-Textbox einschließlich Anker und vertikaler ' +
            'Schriftmetriken muss innerhalb der Körperhülle liegen.',
        });
      }
    }
  }

  issues.push(...stateIssues(spec));

  // Dieselbe Regel wie für `designation`, je Zone einzeln benannt: ein leerer Lauf erzeugte ein
  // Textprimitiv ohne Tinte, das jedes Gate besteht und im Bild fehlt — genau der lautlose
  // Ausfall, den die Fußzone mit ihrem festen Schriftgrad vermeidet.
  for (const [zone, value] of Object.entries(spec.labels ?? {})) {
    if (zone === 'inBodyInk') continue;
    if (typeof value === 'string' && value.trim() === '') {
      issues.push({
        rule: 'label-not-blank',
        message: `Die Beschriftungszone "${zone}" darf nicht leer oder nur aus Leerzeichen bestehen.`,
      });
    }
    if (Array.isArray(value)) {
      for (const line of value) {
        if (typeof line === 'string' && line.trim() === '') {
          issues.push({
            rule: 'label-not-blank',
            message: `Die Beschriftungszone "${zone}" darf keine leere Einzelzeile enthalten.`,
          });
        }
      }
    }
  }

  // Fähigkeiten in der Boxfassung sind seit dem 2. Oktober 2026 an jeder Körperform zugelassen:
  // `compose()` zeichnet sie in der vermessenen Körperfassung, wo das Paar eine hat, und passt
  // sonst die Einzeldarstellung ins Innenfeld ein (`derive/capabilities.ts`). Die Regeln
  // `capabilities-pictogram-has-measured-rendition` und `-overflows-body` (LFH-787 „AB“) sind
  // damit entfallen.

  // LFH-786: Fassungskennungen je Körpermarke (`bodyMarkRenditions`). Seit dem 2. Oktober 2026
  // verengt: Eine Kennung, die für diese Marke irgendwo in Anhang C vermessen ist, überträgt
  // `bodyMark()` an jedes andere Paar (`derive/body-marks.ts`). Abgelehnt wird nur noch, was keine
  // Lücke, sondern eine falsche Angabe ist: eine Kennung, die für diese Marke nirgends vermessen
  // ist, und eine Kennung an einer Marke, die die Spec gar nicht zeichnet — sie bliebe sonst still
  // wirkungslos. Gelesen werden nur eigene Schlüssel.
  const renditions = spec.bodyMarkRenditions as unknown;
  if (renditions !== undefined) {
    const record = typeof renditions === 'object' && renditions !== null &&
        !Array.isArray(renditions)
      ? renditions as Record<string, unknown>
      : undefined;
    const problems: string[] = record === undefined
      ? ['`bodyMarkRenditions` muss ein Objekt aus Körpermarke und Fassungskennung sein.']
      : [];
    for (const mark of record === undefined ? [] : Object.keys(record)) {
      const rendition = record?.[mark];
      if (!(spec.bodyMarks ?? []).includes(mark as BodyMarkId)) {
        problems.push(`Die Fassung für "${mark}" verlangt diese Marke in \`bodyMarks\`.`);
        continue;
      }
      const measured = bodyMarkRenditionsAnywhere(mark as BodyMarkId);
      if (
        typeof rendition !== 'string' ||
        !(BODY_MARK_RENDITION_IDS as readonly string[]).includes(rendition) ||
        !measured.includes(rendition as BodyMarkRenditionId)
      ) {
        problems.push(
          `Die Fassung "${String(rendition)}" ist für "${mark}" nirgends vermessen; ` +
            (measured.length === 0
              ? 'die Marke hat nur ihre Grundfassung.'
              : `vermessen sind ${measured.map((id) => `"${id}"`).join(', ')}.`),
        );
      }
    }
    for (const message of problems) {
      issues.push({ rule: 'body-mark-rendition-not-measured', message });
    }
  }
  return issues;
}

export interface SymbolSpecAnalysis {
  readonly spec: SymbolSpec;
  readonly issues: ValidationIssue[];
}

/**
 * Prüft die Original-Spec und erzeugt für den einzigen prototypkritischen Vertrag genau einen
 * descriptor-basierten Labelsnapshot. Die weitere Validierung liest bei `inset-hull` bereits
 * diesen Snapshot: Proxy-`get`-Traps und geerbte Werte können dadurch weder die Validierung noch
 * einen späteren Konsumenten von der geprüften Datenansicht abkoppeln. Andere Profile behalten
 * dieselbe Spec- und Labelreferenz.
 */
export function analyzeSymbolSpec(
  spec: SymbolSpec,
  context: ValidationContext = {},
): SymbolSpecAnalysis {
  const isInsetWatercraft =
    spec.kind === 'vehicle-water' && spec.bodyVariant === 'inset-hull';
  const insetHullLabels = isInsetWatercraft && spec.labels !== undefined
    ? prepareInsetHullLabelData(spec.labels)
    : undefined;
  const preparedSpec = isInsetWatercraft
    ? Object.freeze({
        ...spec,
        ...(insetHullLabels === undefined
          ? {}
          : { labels: insetHullLabels.valid ? insetHullLabels.labels : undefined }),
      })
    : spec;

  return {
    spec: preparedSpec,
    issues: validatePreparedSpec(preparedSpec, insetHullLabels?.valid === false, context),
  };
}

export function validateSpec(
  spec: SymbolSpec,
  context: ValidationContext = {},
): ValidationIssue[] {
  return analyzeSymbolSpec(spec, context).issues;
}

/**
 * Gruppen aus 5.8, die nicht in `SymbolSpec.states` gehören: Wetter (5.8.7) und Tierzustand
 * (5.8.6) sind freistehende Zeichen mit eigener Spec-Art, die Tendenz (5.8.3) hat ihr eigenes Feld
 * `tendency` (Entscheidungen des Eigentümers vom 29.09.2026, `docs/decisions/
 * 2026-09-28-lfh-565-kapitel-5-8-bausteine.md` §8).
 */
const NOT_ATTACHABLE_STATE_GROUPS: Readonly<Partial<Record<StateGroupId, string>>> = {
  weather: 'ist ein freistehendes Wetterzeichen (5.8.7)',
  animals: 'ist ein freistehender Tierzustand (5.8.6)',
  tendency: 'ist eine Tendenz (5.8.3) und gehört in das Feld "tendency"',
};

/**
 * Skalen, von denen ein Zeichen höchstens einen Wert trägt (Entscheidung des Eigentümers vom
 * 29.09.2026, dort Punkt 7): zwei Stufen derselben Skala widersprechen sich, und zwei
 * Personenzustände an einer Raute zeigt kein Original — die Verbindungen „verletzt und …" sind in
 * 5.8.8 eigene Werte. Die Hinweise „?" und „!" aus 5.8.1 sind keine Skala; sie schließen sich mit
 * eigener Regel aus (`HINT_STATES`).
 */
const ONE_PER_SIGN_STATE_GROUPS: readonly StateGroupId[] = ['activity', 'damage', 'fire', 'persons'];
/**
 * „Hinweis auf Vermutung" (5.8.1.13) und „Hinweis auf akute Situation" (5.8.1.14): höchstens einer
 * je Zeichen, analog zur Tendenz (Fachreview vom 05.10.2026, LFH-1064). Dieselbe Sache kann nicht
 * zugleich vermutet und akut sein; wer beides meint, hat zwei Lagen und setzt zwei Zeichen. Vom
 * 02.10.2026 bis dahin standen beide abgeleitet untereinander in der Randlage.
 */
const HINT_STATES: readonly StateId[] = ['suspected-situation', 'acute-situation'];
const KNOWN_STATE_IDS: ReadonlySet<StateId> = new Set<StateId>(STATE_IDS);
/** Einsatztaktik 5.8.1.1 bis 5.8.1.4. */
const STATE_TACTICS: ReadonlySet<StateId> = new Set<StateId>([
  'tactical-rescue',
  'tactical-attack',
  'tactical-defense',
  'tactical-retreat',
]);

/**
 * Die Regeln zu `SymbolSpec.states` (LFH-577). Sie prüfen, ob ein Zustand an dieses Zeichen darf
 * und wie viele zugleich; **wo** er steht, entscheidet danach `compose()` — vermessen oder aus den
 * belegten Lagen abgeleitet (`derive/states.ts`). Gebunden ist nur noch der Personenzustand 5.8.8
 * an die Person (`stateCarriersOf`); jeder andere Wert steht an jedem Grundzeichen.
 */
function stateIssues(spec: SymbolSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const attachable: StateId[] = [];
  // Eine Liste außerhalb des Typs (etwa aus JSON am Leser vorbei) prüft diese Funktion nicht; sie
  // wirft auch nicht. Unbekannte Werte lehnt `parseSpec` mit Pfad ab.
  const values: readonly unknown[] = Array.isArray(spec.states) ? spec.states : [];
  for (const value of values.filter((item): item is StateId => KNOWN_STATE_IDS.has(item as StateId))) {
    const reason = NOT_ATTACHABLE_STATE_GROUPS[stateValueGroup(value)];
    if (reason !== undefined) {
      issues.push({
        rule: 'state-value-not-attachable',
        message: `Der Zustand "${value}" ${reason}; er steht nicht in "states".`,
      });
    } else {
      attachable.push(value);
    }
  }

  for (const value of attachable) {
    // Taktik zuerst und ohne Trägerbefund: sie steht an gar keinem Träger, ein Hinweis auf die
    // Person führte in die nächste Ablehnung.
    if (STATE_TACTICS.has(value)) {
      issues.push({
        rule: 'state-tactics-not-allowed',
        message:
          `Die Einsatztaktik "${value}" (5.8.1.1 bis 5.8.1.4) steht nicht an einem Träger; ` +
          'sie ist ein eigenes Zeichen.',
      });
      continue;
    }
    const carriers = stateCarriersOf(value);
    if (carriers !== undefined && !carriers.includes(`base-symbol/${spec.kind}`)) {
      issues.push({
        rule: 'state-carrier-not-allowed',
        message:
          `Der Zustand "${value}" steht nur an ${carriers.map((id) => `"${id.slice('base-symbol/'.length)}"`).join(' oder ')}, ` +
          `nicht an "${spec.kind}".`,
      });
    }
  }

  const perScale = new Map<string, StateId[]>();
  for (const value of attachable) {
    const group = stateValueGroup(value);
    const scale = ONE_PER_SIGN_STATE_GROUPS.includes(group) ? group : undefined;
    if (scale !== undefined) perScale.set(scale, [...(perScale.get(scale) ?? []), value]);
  }
  for (const values of perScale.values()) {
    if (values.length < 2) continue;
    issues.push({
      rule: 'state-group-limit-exceeded',
      message:
        `${values.join(' und ')} gehören zur selben Skala; ein Zeichen trägt davon höchstens einen Wert.`,
    });
  }
  const hints = HINT_STATES.filter((hint) => attachable.includes(hint));
  if (hints.length > 1) {
    issues.push({
      rule: 'state-hint-limit-exceeded',
      message:
        `${hints.join(' und ')} schließen sich aus: Dieselbe Sache ist nicht zugleich vermutet ` +
        'und akut. Ein Zeichen trägt höchstens einen Hinweis; zwei Lagen sind zwei Zeichen.',
    });
  }
  return issues;
}
