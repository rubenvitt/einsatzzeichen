import {
  DEFAULT_VIEWBOX_MM,
  type BodyVariantId,
  type AdminLevelId,
  type FunctionRoleDefinition,
  type FunctionRoleTextRun,
  type AdministrativeHeadShape,
  type OrganizationId,
  type StrengthId,
  type SymbolKind,
  type SymbolSpec,
} from '@einsatzzeichen/schema';
import { profileFor } from './layout/profiles.js';
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
 * Grundzeichenarten, an denen die Referenz eine Fahrwerkszone zeichnet. Gemessen, nicht
 * angenommen (18. August 2026): von den 31 Zeichen des Anhangs E.2 tragen **25** ein Fahrwerk —
 * 20 auf dem Landfahrzeugkörper, vier auf dem Anhängerrumpf, eines auf dem Wechselladerrumpf. Die
 * fünf Wasserfahrzeuge E.2.27 bis E.2.31 tragen keines, E.2.26 auf dem Hochkantrechteck auch
 * nicht, und keine der drei Luftfahrzeugdateien 5.1.4.1 bis 5.1.4.3 trägt eines.
 *
 * Bis LFH-424 hieß diese Menge „Fahrzeuge" und enthielt alle drei Fahrzeugarten. Das war eine
 * Annahme aus dem Wort „Fahrzeugkategorie" — die Referenz stützt sie nicht. LFH-424 zog sie auf
 * das Landfahrzeug zusammen; der Teilslice E.2 fügt die beiden Körperformen hinzu, die er
 * vermessen hat.
 *
 * **Was diese Menge ausdrücklich NICHT erzwingt: die Paarung von Kategorie und Körperform.** Eine
 * Fahrzeugkategorie, die im Bestand nur an einer dieser drei Formen vorkommt, lässt sich an jeder
 * der drei spezifizieren, ohne dass eine Regel widerspricht — der Katalog liefert dann klaglos
 * eine Zeichnung, die an keiner Referenzdatei belegt ist. Das ist bewusst nicht gebaut: bei vier
 * Belegdateien je Paarung wäre die Regel geraten und nicht vermessen
 * (`docs/decisions/2026-08-18-anhang-e2.md`, Abschnitt „Offene Kanten"). Wer die Lücke schließt,
 * schließt sie dort und nicht hier.
 */
const CHASSIS_KINDS = new Set<SymbolKind>([
  'vehicle-land',
  'trailer',
  'swap-loader-vehicle',
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

/** Exakte, aus den Quellen vermessene Art-/Variantenpaare; alle anderen bleiben fail-closed. */
const BODY_VARIANT_KINDS: Readonly<Record<BodyVariantId, ReadonlySet<SymbolKind>>> = {
  'raised-hull': new Set<SymbolKind>(['vehicle-air', 'vehicle-water']),
  'inset-hull': new Set<SymbolKind>(['vehicle-water']),
  'foot-band': new Set<SymbolKind>(['formation', 'vehicle-land', 'trailer', 'circle-12']),
  'plain-wheel-pair': new Set<SymbolKind>(['vehicle-land']),
  'raised-gable': new Set<SymbolKind>(['circle-12']),
  'inverted-hull-track': new Set<SymbolKind>(['vehicle-land']),
  'fixed-wing-hull': new Set<SymbolKind>(['vehicle-air']),
  'raised-circle-1mm': new Set<SymbolKind>(['circle-12']),
};

export interface ValidationContext {
  functionRole?: FunctionRoleDefinition;
  administrativeHead?: AdministrativeHeadShape;
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

function administrativeLevelId(value: unknown): value is AdminLevelId {
  return value === 'gemeinde' || value === 'kreis' || value === 'bezirk' ||
    value === 'bundesland' || value === 'nationalstaat' ||
    value === 'europaeische-union';
}

function organizationId(value: unknown): value is OrganizationId {
  return value === 'feuerwehr' || value === 'thw' || value === 'fuehrung-leitung' ||
    value === 'polizei' || value === 'bundespolizei' || value === 'bundeswehr' ||
    value === 'sonstige-gefahrenabwehr' || value === 'zivile-einheiten' ||
    value === 'hilfsorganisation';
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
 * Farbige 12-mm-Kreisverträge außerhalb der weißen F.3-Fassung. Die technischen Marken sind
 * sichtbare Geometrie-IDs; die Tabelle behauptet keine Abschnitts- oder Rezeptsemantik.
 */
const MEASURED_COLORED_CIRCLE_CONTRACTS = [
  {
    bodyVariant: undefined,
    organization: 'zivile-einheiten',
    bodyMark: 'spontaneous-helper-collection-arrow',
  },
  {
    bodyVariant: undefined,
    organization: 'feuerwehr',
    bodyMark: 'spontaneous-helper-contact-double-arrow',
  },
  {
    bodyVariant: 'raised-circle-1mm',
    organization: 'zivile-einheiten',
    bodyMark: 'circle-information-stem',
  },
] as const satisfies ReadonlyArray<{
  readonly bodyVariant: SymbolSpec['bodyVariant'];
  readonly organization: SymbolSpec['organization'];
  readonly bodyMark: NonNullable<SymbolSpec['bodyMarks']>[number];
}>;

const COLORED_NORMAL_CIRCLE_ONLY_MARKS = new Set<
  NonNullable<SymbolSpec['bodyMarks']>[number]
>([
  'spontaneous-helper-collection-arrow',
  'spontaneous-helper-contact-double-arrow',
]);

function hasMeasuredColoredCircleContract(spec: SymbolSpec): boolean {
  if (spec.kind !== 'circle-12') return false;
  const [bodyMark, ...additionalBodyMarks] = spec.bodyMarks ?? [];
  return additionalBodyMarks.length === 0 && bodyMark !== undefined &&
    MEASURED_COLORED_CIRCLE_CONTRACTS.some((contract) =>
      contract.bodyVariant === spec.bodyVariant &&
      contract.organization === spec.organization &&
      contract.bodyMark === bodyMark);
}

function hasMeasuredCircleOrganizationContract(spec: SymbolSpec): boolean {
  if (spec.kind !== 'circle-12') return false;
  if (hasMeasuredColoredCircleContract(spec)) return true;

  const isWhiteF3Contract = spec.organization === 'hilfsorganisation' &&
    (spec.bodyVariant === undefined || spec.bodyVariant === 'raised-gable');
  return isWhiteF3Contract &&
    !(spec.bodyMarks ?? []).some((mark) => COLORED_NORMAL_CIRCLE_ONLY_MARKS.has(mark));
}

const INSET_HULL_LABEL_FIELDS = new Set<PropertyKey>(['accessibilityMode', 'center']);

type InsetHullLabelPreparation =
  | { readonly valid: false }
  | {
      readonly valid: true;
      readonly labels: NonNullable<SymbolSpec['labels']>;
    };

/**
 * Der eingesenkten Wasserfahrzeughülle sind nur zwei einfache Datenfelder belegt. `Object.keys`
 * genügt dafür nicht: geerbte Werte liest `compose()` über die Prototypkette, Accessors können
 * beim Lesen Code ausführen, und nicht-enumerable bzw. Symbolfelder blieben unsichtbar. Akzeptiert
 * werden deshalb ausschließlich eigene, aufzählbare Datenfelder eines normalen oder
 * null-prototype-Objekts; jede andere Objektform bleibt fail-closed.
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
    Object.defineProperty(snapshot, key, {
      configurable: false,
      enumerable: true,
      value: descriptor.value,
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
      if (!organizationId(expectedOrganization) || spec.organization !== expectedOrganization) {
        issues.push({
          rule: 'function-role-organization-mismatch',
          message: 'Die Organisation entspricht nicht der exakt vermessenen Funktionsfassung.',
        });
      }
      const headMatches = expectedHead === 'none'
        ? spec.strength === undefined && spec.administrativeLevel === undefined &&
          expectedStrength === undefined && expectedAdministrativeLevel === undefined &&
          headTopMm === undefined
        : expectedHead === 'strength'
          ? strengthId(expectedStrength) && expectedAdministrativeLevel === undefined &&
            spec.strength === expectedStrength && spec.administrativeLevel === undefined &&
            finite(headTopMm)
          : expectedHead === 'administrative' && expectedStrength === undefined &&
            administrativeLevelId(expectedAdministrativeLevel) &&
            spec.strength === undefined &&
            spec.administrativeLevel === expectedAdministrativeLevel && finite(headTopMm) &&
            context.administrativeHead !== undefined;
      if (!headMatches) {
        issues.push({
          rule: 'function-role-head-mismatch',
          message: `Die Kopfzone entspricht nicht der vermessenen Fassung "${String(expectedHead)}".`,
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
      const allowedBodyMarks = definitionValue.allowedBodyMarks;
      if (spec.bodyMarks?.some(
        (id) => !Array.isArray(allowedBodyMarks) || !allowedBodyMarks.includes(id),
      )) {
        issues.push({
          rule: 'function-role-body-mark-mismatch',
          message: 'Mindestens eine Koerpermarke ist fuer diese Funktionsfassung nicht vermessen.',
        });
      }
    }
    if (spec.bodyVariant !== undefined) {
      issues.push({
        rule: 'function-role-body-variant-not-measured',
        message: 'Koerpervarianten sind mit gemessenen Funktionsfassungen nicht kombiniert belegt.',
      });
    }
    if (spec.capabilities !== undefined) {
      issues.push({
        rule: 'function-role-capabilities-not-measured',
        message: 'Standard-Piktogramme sind mit gemessenen Funktionsfassungen nicht kombiniert belegt.',
      });
    }
  }
  const profile = profileFor(spec.kind, spec.bodyVariant);

  if (
    spec.bodyVariant !== undefined &&
    !BODY_VARIANT_KINDS[spec.bodyVariant].has(spec.kind)
  ) {
    issues.push({
      rule: 'body-variant-requires-measured-kind',
      message:
        `Die Körpervariante "${spec.bodyVariant}" ist für "${spec.kind}" nicht vermessen. ` +
        'Varianten fallen weder auf eine andere Körperart noch auf deren Normalfassung zurück.',
    });
  }

  const isInsetWatercraft =
    spec.kind === 'vehicle-water' && spec.bodyVariant === 'inset-hull';

  if (isInsetWatercraft && spec.organization !== 'hilfsorganisation') {
    issues.push({
      rule: 'inset-hull-requires-hilfsorganisation',
      message: 'inset-hull requires the measured white Hilfsorganisation body.',
    });
  }

  if (isInsetWatercraft) {
    // I.3.5 bis I.3.7 belegen ausschließlich den mittigen Lauf. Das generische Labelmodell ist
    // inzwischen breiter als dieser Vertrag (unter anderem durch die vermessenen N-Metriken).
    // Deshalb erlauben wir die zwei bekannten nicht bzw. genau so gerenderten Felder explizit,
    // statt eine Liste verbotener Zonen zu pflegen, die beim nächsten Feld still veraltet.
    const hasUnmeasuredLabelZone = hasInvalidInsetHullLabelData;

    if (hasUnmeasuredLabelZone || spec.designation !== undefined) {
      issues.push({
        rule: 'inset-hull-requires-center-label-only',
        message:
          'inset-hull supports only the measured center label zone and non-rendering ' +
          'accessibility metadata.',
      });
    }
  }

  if (spec.strength !== undefined && !UNIT_KINDS.has(spec.kind)) {
    issues.push({
      rule: 'strength-requires-unit',
      message:
        `Eine Stärkeangabe ist nur an taktischen Einheiten zulässig. ` +
        `"${spec.kind}" ist keine Einheit.`,
    });
  }

  if (
    spec.kind === 'formation' &&
    spec.bodyVariant === 'foot-band' &&
    spec.strength === 'staffel'
  ) {
    issues.push({
      rule: 'foot-band-head-requires-measured-strength',
      message:
        'Am gebänderten Formationskörper sind nur Trupp, Gruppe und Zug vermessen. Die Staffel ' +
        'würde den Körper verschieben; wie das Fußband mitwandert, ist nicht belegt.',
    });
  }

  if (spec.vehicleCategory !== undefined && !CHASSIS_KINDS.has(spec.kind)) {
    issues.push({
      rule: 'vehicle-category-requires-vehicle',
      message:
        'Eine Fahrzeugkategorie ist nur am Landfahrzeug, am Anhängerrumpf und am ' +
        `Wechselladerrumpf belegt. "${spec.kind}" trägt in der Referenz keine Fahrwerkszone.`,
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
      (spec.kind === 'vehicle-land' && spec.bodyVariant === 'plain-wheel-pair') ||
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

  // Die Verwaltungsstufenabdeckung ist bewusst partiell: Nur die drei in D.3/D.4 vermessenen
  // Koepfe werden zusammen mit ihrer exakt aufgeloesten Funktionsrolle akzeptiert. Gemeinde,
  // Bezirk und Bundesland bleiben fail-closed.
  if (
    spec.administrativeLevel !== undefined &&
    (context.administrativeHead === undefined || !resolvedFunctionRole)
  ) {
    issues.push({
      rule: 'administrative-level-not-measured',
      message:
        `Die Verwaltungsstufe "${spec.administrativeLevel}" besitzt keinen aufgeloesten ` +
        'gemessenen Kopf aus D.3/D.4.',
    });
  }

  // Deckt ausdrücklich **nur** Stärke gegen Verwaltungsstufe. Die Entscheidungsnotiz vom
  // 4. August 2026, Abschnitt 2, schreibt dieser Regel zusätzlich die Fahrzeugkategorie zu — das
  // ist falsch, `spec.vehicleCategory` kommt hier nicht vor, und die Begründung „belegen beide die
  // Kopfzone" trüge für sie geometrisch auch nicht: die Stärke sitzt oben, das Fahrwerk unten.
  //
  // Diese Kollision ist von der partiellen Abdeckungsprüfung darüber unabhängig: Auch eine mit
  // Verwaltungskopf und Funktionsrolle vollständig aufgeloeste Stufe bleibt zusammen mit einer
  // Stärkeangabe geometrisch unzulässig. Die Regel wird nicht durch einen Typ ersetzt, der die
  // Kollision unmöglich macht: eine unterscheidende Vereinigung über `SymbolSpec` (etwa
  // `head: {strength} | {administrativeLevel}`) zöge alle Rezepte und ihre Tests nach. Die
  // Entscheidung steht in der Notiz vom 18. August 2026, damit sie nicht als Versäumnis gelesen
  // wird.
  if (spec.strength !== undefined && spec.administrativeLevel !== undefined) {
    issues.push({
      rule: 'head-zone-conflict',
      message:
        'Stärkeangabe und Verwaltungsstufe belegen beide die Kopfzone und schließen sich aus.',
    });
  }

  if (spec.designation !== undefined && spec.designation.trim() === '') {
    issues.push({
      rule: 'designation-not-blank',
      message: 'Eine Bezeichnung darf nicht leer oder nur aus Leerzeichen bestehen.',
    });
  }

  // Die Beschriftungszone steht **unterhalb** des Körpers; Lage und Tinte sind profilabhängig.
  // E.2.27 bis E.2.31 belegen die tatsächliche Tintenlage und Organisationsfarbe am angehobenen
  // Wasserrumpf (Tinte 22,5379/24,0806/31,5778/26,9998 mm, Füllung #003296, in allen fünf
  // Dateien gleich bis auf 0,0003 mm). Das Profil modelliert diese Lage körperrelativ mit
  // 4,01 mm vertikal und 0,5618 mm horizontal; wie `compose.ts` dokumentiert, ist diese Zerlegung
  // eine Modellierungsentscheidung und keine direkte Messung der beiden Abstände. G.3.5 führt
  // am gebänderten 12-mm-Kreis eigene schwarze Profilwerte von 1,0 mm und 3,0 mm.
  //
  // Beide Wertesätze bleiben auf ihr jeweiliges Profil und dessen Hülle begrenzt; daraus folgt
  // keine Übertragung auf weitere Körperformen. Auf einer `formation` erzeugten sie einen Lauf,
  // den keine Referenzdatei zeigt — und kein Gate meldete ihn: der Fingerprint sieht nur
  // `role: 'body'`, die Rasterprüfung nur die selbst deklarierte Box.
  if (
    spec.labels?.belowRight !== undefined &&
    profileFor(spec.kind, spec.bodyVariant).belowRight === undefined
  ) {
    issues.push({
      rule: 'below-right-label-requires-measured-body',
      message:
        'Die Beschriftungszone unterhalb des Körpers verlangt ein vermessenes Körperprofil. ' +
        `Für "${spec.kind}" mit Variante "${spec.bodyVariant ?? 'normal'}" fehlt es.`,
    });
  }

  // Dieselbe Bauart eine Zone weiter oben: die Grundlinie des Laufs oben links ist an der
  // Formation (5,0 mm unter der Oberkante) und an den F.2-Landfahrzeugen (Profildefault 6,75 mm)
  // gemessen. Andere Körperprofile führen keinen Wert und werden abgelehnt statt still einen der
  // beiden zu erben. Am Gebäudekörper führte schon der Formationsanker 2,5 mm aus dem Polygon
  // heraus (dessen Kante läuft dort erst ab 5,286 mm).
  if (
    spec.labels?.topLeft !== undefined &&
    profile.topLeftBaselineFromBodyTopMm === undefined
  ) {
    issues.push({
      rule: 'top-left-label-requires-measured-body',
      message:
        'Die Beschriftungszone oben links ist an der taktischen Formation und an den ' +
        'F.2-Landfahrzeugprofilen vermessen. Für ' +
        `"${spec.kind}" mit Variante "${spec.bodyVariant ?? 'normal'}" gibt es keine Messung, ` +
        'aus der ihre Lage folgte.',
    });
  }

  const isCircle12 = spec.kind === 'circle-12';
  const isMeasuredCircleVariant = isCircle12 &&
    (spec.bodyVariant === undefined || spec.bodyVariant === 'raised-gable');
  if (
    isMeasuredCircleVariant &&
    spec.labels?.topLeft !== undefined &&
    spec.labels.topLeftMetrics === undefined
  ) {
    issues.push({
      rule: 'circle-top-left-requires-metrics',
      message:
        'Ein topLeft-Lauf am 12-mm-Kreis verlangt immer den vollständigen vermessenen ' +
        'Metriksatz; die beiden Kreisfassungen haben keinen allgemeinen Profildefault.',
    });
  }
  if (
    spec.labels?.topLeft !== undefined &&
    profile.requiresTopLeftMetrics === true &&
    spec.labels.topLeftMetrics === undefined
  ) {
    issues.push({
      rule: 'top-left-metrics-required-by-profile',
      message:
        'Dieses Körperprofil belegt den topLeft-Lauf ausschließlich mit einem vollständigen ' +
        'quellenspezifischen Metriksatz; ein Profildefault wäre nur eine Teilmessung.',
    });
  }
  if (
    isCircle12 &&
    spec.bodyVariant === 'foot-band' &&
    spec.organization === undefined
  ) {
    issues.push({
      rule: 'circle-12-requires-organization',
      message: 'Der gebänderte 12-mm-Kreis verlangt die Organisationsfarbe seiner Körperfläche.',
    });
  }
  if (
    isCircle12 &&
    spec.bodyVariant !== 'foot-band' &&
    !hasMeasuredCircleOrganizationContract(spec)
  ) {
    issues.push({
      rule: 'circle-12-requires-hilfsorganisation',
      message:
        'Der 12-mm-Kreis verlangt einen vollständig vermessenen Organisationsvertrag: die ' +
        'weiße HiOrg-Fassung aus F.3 oder genau eine der farbigen technischen ' +
        'Art-/Varianten-/Markenfassungen. Fehlende oder vertauschte Werte sind nicht belegt.',
    });
  }
  if (
    hasMeasuredColoredCircleContract(spec) &&
    (spec.labels?.topLeft !== undefined || spec.labels?.topLeftMetrics !== undefined)
  ) {
    issues.push({
      rule: 'colored-circle-top-left-not-measured',
      message:
        'Die exakt vermessenen farbigen Kreisverträge führen keinen topLeft-Lauf und keine ' +
        'zugehörigen F.3-Metriken. Diese weißen Kreislabelverträge werden nicht vererbt.',
    });
  }
  if (
    spec.kind === 'reduced-house' &&
    spec.organization !== 'hilfsorganisation'
  ) {
    issues.push({
      rule: 'reduced-house-requires-hilfsorganisation',
      message:
        'Die reduzierte Hauskontur ist in beiden F.3-Belegen ausschließlich als weiße ' +
        'HiOrg-Körperfläche vermessen. Andere oder fehlende Organisationszuordnungen sind ' +
        'auch ohne Beschriftung nicht belegt.',
    });
  }

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
    const isMeasuredVehicleLand = spec.kind === 'vehicle-land' &&
      (spec.bodyVariant === undefined || spec.bodyVariant === 'foot-band');
    const isMeasuredFixedWing = spec.kind === 'vehicle-air' &&
      spec.bodyVariant === 'fixed-wing-hull';
    if (!isMeasuredVehicleLand && !isMeasuredCircleVariant && !isMeasuredFixedWing) {
      issues.push({
        rule: 'top-left-metrics-require-measured-vehicle-land',
        message:
          'Individuelle topLeft-Metriken sind nur am normalen und gebänderten F.2-Landfahrzeug ' +
          'sowie den beiden F.3-Kreisfassungen und am Festflügel-Luftfahrzeug vermessen. Andere ' +
          'Arten und Varianten behalten ihre eigenen Profilwerte.',
      });
    }
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

    if (isMeasuredFixedWing) {
      const bodyBounds = profile.measuredBodyBoundsMm;
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
            'vertikalen Textbox innerhalb der vermessenen Körperhülle liegen.',
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

  if (
    spec.labels?.aboveLeft !== undefined &&
    profile.aboveLeftBaselineFromBodyTopMm === undefined
  ) {
    issues.push({
      rule: 'above-left-label-requires-measured-body',
      message:
        'Die Beschriftungszone oberhalb links ist allein am Luftfahrzeug aus F.2.7 vermessen. ' +
        `Für "${spec.kind}" gibt es keine Messung, aus der ihre Lage folgte.`,
    });
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
      const bodyBounds = profile.measuredBodyBoundsMm;
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
            'Der abgeleitete aboveLeft-Lauf muss mit seinem Anker innerhalb der vermessenen ' +
            'Profilbox und mit seiner vollständigen Textbox innerhalb der 32-mm-ViewBox liegen.',
        });
      }
    }
  }

  if (
    spec.labels?.topLeftLines !== undefined &&
    (
      profileFor(spec.kind, spec.bodyVariant).topLeftLines === undefined ||
      (spec.bodyVariant !== undefined && !BODY_VARIANT_KINDS[spec.bodyVariant].has(spec.kind))
    )
  ) {
    issues.push({
      rule: 'top-left-lines-require-measured-body',
      message:
        'Die zweizeilige obere Beschriftungszone ist allein am Landfahrzeug aus F.2.8 ' +
        `vermessen. Für "${spec.kind}" gibt es keine Messung, aus der ihre Lage folgte.`,
    });
  }

  if (spec.labels?.topLeftLines !== undefined && spec.labels.topLeftLines.length !== 2) {
    issues.push({
      rule: 'top-left-lines-exactly-two',
      message: 'Die zweizeilige obere Beschriftungszone muss exakt zwei Zeilen enthalten.',
    });
  }

  if (
    (spec.labels?.surfaceBelowLeft !== undefined || spec.labels?.surfaceBelowRight !== undefined) &&
    profileFor(spec.kind, spec.bodyVariant).surfaceLabels === undefined
  ) {
    issues.push({
      rule: 'surface-label-requires-measured-body',
      message: 'Schwarze Oberflächenläufe sind nur an den dafür vermessenen Körperprofilen zulässig.',
    });
  }
  if (
    spec.labels?.surfaceBelowLeft !== undefined &&
    profileFor(spec.kind, spec.bodyVariant).surfaceLabels !== undefined &&
    profileFor(spec.kind, spec.bodyVariant).surfaceLabels?.leftAnchorFromBodyLeftMm === undefined
  ) {
    issues.push({
      rule: 'surface-left-label-requires-measured-anchor',
      message: 'Der linke schwarze Oberflächenlauf verlangt einen links vermessenen Anker.',
    });
  }
  if (
    spec.labels?.surfaceBelowRight !== undefined &&
    profileFor(spec.kind, spec.bodyVariant).surfaceLabels !== undefined &&
    profileFor(spec.kind, spec.bodyVariant).surfaceLabels?.rightAnchorFromBodyRightMm === undefined
  ) {
    issues.push({
      rule: 'surface-right-label-requires-measured-anchor',
      message: 'Der rechte schwarze Oberflächenlauf verlangt einen rechts vermessenen Anker.',
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
  if (
    spec.labels?.centerBaselineFromBodyBottomMm !== undefined &&
    profile.allowsCenterBaselineOverride !== true
  ) {
    issues.push({
      rule: 'center-baseline-override-requires-measured-body',
      message: 'Eine abweichende mittige Grundlinie ist nur an einem dafür vermessenen Körperprofil zulässig.',
    });
  }
  if (
    spec.labels?.centerBaselineFromBodyBottomMm !== undefined &&
    profile.measuredCenterBaselineOverridesMm !== undefined &&
    !profile.measuredCenterBaselineOverridesMm.includes(spec.labels.centerBaselineFromBodyBottomMm)
  ) {
    issues.push({
      rule: 'center-baseline-not-measured',
      message:
        'Die abweichende mittige Grundlinie muss einem an diesem Körperprofil vermessenen Wert entsprechen.',
    });
  }
  if (
    spec.labels?.centerAnchorFromBodyLeftMm !== undefined &&
    (
      spec.labels.center === undefined ||
      !Number.isFinite(spec.labels.centerAnchorFromBodyLeftMm) ||
      profile.allowsCenterAnchorOverride !== true ||
      profile.measuredCenterAnchorFromBodyLeftMm === undefined ||
      spec.labels.centerAnchorFromBodyLeftMm !== profile.measuredCenterAnchorFromBodyLeftMm
    )
  ) {
    issues.push({
      rule: 'center-anchor-override-requires-measured-trailer',
      message:
        'Ein abweichender mittiger x-Anker ist nur am vermessenen Anhängerprofil und nur mit ' +
        'dessen vollständigem gemessenen Anker zulässig.',
    });
  }
  if (
    spec.labels?.centerBaselineFromBodyBottomMm !== undefined &&
    profile.allowsCenterBaselineOverride === true
  ) {
    const bodyBounds = profile.measuredBodyBoundsMm;
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
          'innerhalb der vermessenen Körperhülle liegen.',
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
    (
      profile.allowsCenterBoxMarginOverride !== true ||
      profile.measuredBodyBoundsMm === undefined
    )
  ) {
    issues.push({
      rule: 'center-box-margin-override-requires-measured-body',
      message:
        'Ein individueller Rand der mittigen Textbox ist nur an einer vermessenen ' +
        'Körperhülle zulässig.',
    });
  }
  if (
    centerBoxMarginMm !== undefined &&
    Number.isFinite(centerBoxMarginMm) &&
    centerBoxMarginMm >= 0 &&
    profile.allowsCenterBoxMarginOverride === true &&
    profile.measuredBodyBoundsMm !== undefined
  ) {
    const bodyWidthMm = profile.measuredBodyBoundsMm.maxX - profile.measuredBodyBoundsMm.minX;
    if (centerBoxMarginMm * 2 >= bodyWidthMm) {
      issues.push({
        rule: 'center-box-margin-within-body',
        message:
          'Der beidseitige Rand der mittigen Textbox muss eine positive Boxbreite innerhalb ' +
          'der vermessenen Körperhülle übrig lassen.',
      });
    }
  }

  if (
    spec.labels?.bottomCenter !== undefined &&
    profileFor(spec.kind, spec.bodyVariant).bottomCenterBaselineFromBodyBottomMm === undefined
  ) {
    issues.push({
      rule: 'bottom-center-label-requires-measured-body',
      message:
        'Die Beschriftungszone unten mittig ist an der taktischen Formation (2,0 mm über der ' +
        'Körperunterkante, F.1.18/F.1.20) und am gebänderten 12-mm-Kreis (6,0 mm über der ' +
        `Körperunterkante, G.3.5) vermessen. Für "${spec.kind}" mit Variante ` +
        `"${spec.bodyVariant ?? 'normal'}" gibt es keine Messung, aus der ihre Lage folgte.`,
    });
  }

  // Nur Profile mit Organisations-Tinte brauchen eine Organisation, die diese Farbe liefert.
  // Das G.3.5-Kreisband trägt `belowRight` dagegen ausdrücklich schwarz; seine unabhängige
  // Organisationspflicht für die Körperfläche wird weiter oben separat geprüft.
  if (
    spec.labels?.belowRight !== undefined &&
    profileFor(spec.kind, spec.bodyVariant).belowRight?.ink === 'organization' &&
    spec.organization === undefined
  ) {
    issues.push({
      rule: 'below-right-label-requires-organization',
      message:
        'Dieses Körperprofil führt die Beschriftungszone unterhalb des Körpers in der ' +
        'Organisationsfarbe (#003296 an E.2.27 bis E.2.31). Ohne Organisation hat sie keine ' +
        'gemessene Farbe.',
    });
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
    const profileBounds = profileFor(spec.kind, spec.bodyVariant).bottomRightMetricsBounds;

    if (spec.labels?.bottomRight === undefined || spec.labels.bottomRight.trim() === '') {
      issues.push({
        rule: 'bottom-right-metrics-require-bottom-right-label',
        message:
          'Gemessene bottomRight-Metriken verlangen einen nichtleeren Lauf; ohne ihn würden ' +
          'Versalhöhe, Grundlinie, Anker und Box still verschluckt.',
      });
    }
    if (profileBounds === undefined) {
      issues.push({
        rule: 'bottom-right-metrics-require-measured-body',
        message:
          'Individuelle bottomRight-Metriken sind nur an einem Körperprofil mit vollständig ' +
          'vermessener relativer Textbox zulässig.',
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
            'Schriftmetriken muss innerhalb der vermessenen Körperhülle liegen.',
        });
      }
    }
  }

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
