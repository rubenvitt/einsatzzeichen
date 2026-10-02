import type {
  Drawing,
  FunctionRoleDefinition,
  FunctionRoleId,
  FunctionRoleTextRun,
  Primitive,
  SymbolSpec,
} from '@einsatzzeichen/schema';
import { boundsOfMm, type BoundsMm } from '../bounds.js';
import { FUNCTION_ROLE_DEFINITIONS } from '../geometry/function-roles.js';
import { strengthHead } from '../geometry/strengths.js';
import { HEAD_GAP_MM, placeHead, type LayoutProfile } from '../layout/profiles.js';
import {
  affineBetween,
  fitIntoRoleBody,
  fitRunsVertically,
  FIT_MARGIN_MM,
  isIdentityAffine,
  mapPrimitive,
  mapRoleRun,
  runBounds,
  unionBounds,
} from './function-role-fit.js';
import { noteDerivation } from './record.js';

/*
 * Funktionsrollen jenseits ihrer vermessenen Festfassung (Entscheidung vom 2. Oktober 2026).
 *
 * Jede Funktionsrolle des Katalogs ist ein vermessenes Original mit fester Trägerart,
 * Organisation und Kopfzone. Welche dieser Bindungen zur Bedeutung gehört, entscheidet der
 * Titel der Rolle:
 *
 * - Die **Trägerart** gehört immer dazu. Eine Funktion ist eine Führungskraft (Person) oder eine
 *   Führungsstelle (Formation); der Zugführer an der Formation wäre der Zugtrupp, und beide
 *   Gegenstücke stehen als eigene IDs im Katalog (`incident-command` und `incident-commander`).
 *   `function-role-requires-measured-kind` bleibt deshalb Systematik.
 * - Die **Organisation** gehört dazu, wenn der Titel sie nennt (Zugführer der Feuerwehr,
 *   Kreisbrandmeister, Zugführer Technischer Zug, Sanitäts- und Betreuungszugführer der
 *   Hilfsorganisationen). Die Rollen der Führung und Leitung (Einsatzleiter, EAL, UEAL, TEL,
 *   OrgL, LNA …) nennen keine; sie dürfen in jeder Organisationsfarbe oder ohne Organisation
 *   stehen.
 * - Der **Kopf** gehört dazu, wenn der Titel ihn nennt: Zug- und Gruppenführer ihre Stärke,
 *   die Führungsgruppe ihre Gruppe, der Kreisbrandmeister und der Leiter der Kreisleitstelle
 *   ihren Kreis, der Leiter einer internationalen Hilfsaktion seine überstaatliche Ebene. Alle
 *   übrigen Leitungsrollen sind kopffrei: Sie dürfen eine andere, eine zusätzliche oder gar keine
 *   Kopfangabe tragen.
 *
 * Alles, was dabei nicht exakt der Festfassung entspricht, zeichnet `resolveFunctionRoleLayout`
 * aus der nächstliegenden vermessenen Fassung und meldet es als abgeleitet.
 */

/** Rollen, deren Titel die Kopfzone nennt, obwohl sie zur Führung und Leitung gehören. */
const HEAD_BOUND_BY_TITLE: ReadonlySet<string> = new Set<FunctionRoleId>([
  // „Führungsgruppe“: die Gruppe ist Teil des Namens.
  'technical-incident-command-group',
  // „Kreisleitstelle“: der Kreis ist Teil des Namens.
  'district-control-center-director',
  // „internationale Hilfsaktion“: die überstaatliche Ebene ist Teil des Namens.
  'international-relief-operation-director',
]);

/** Die Organisation, deren Rollen ihre Organisation nicht im Titel tragen. */
const GENERIC_LEADERSHIP_ORGANIZATION = 'fuehrung-leitung';

/**
 * Ob eine Rolle in anderer Organisationsfarbe oder ohne Organisation stehen darf. Nimmt die
 * ungeprüften Felder der Definition entgegen, weil `validateSpec` auch eine zur Laufzeit
 * fehlerhafte Fassung beurteilen muss.
 */
export function functionRoleOrganizationIsFree(expectedOrganization: unknown): boolean {
  return expectedOrganization === GENERIC_LEADERSHIP_ORGANIZATION;
}

/** Ob eine Rolle eine andere, zusätzliche oder keine Kopfangabe tragen darf. */
export function functionRoleHeadIsFree(id: unknown, expectedOrganization: unknown): boolean {
  return functionRoleOrganizationIsFree(expectedOrganization) &&
    typeof id === 'string' && !HEAD_BOUND_BY_TITLE.has(id);
}

/** Ob die Kopfangaben der Spec genau der Festfassung entsprechen. */
function headMatchesDefinition(definition: FunctionRoleDefinition, spec: SymbolSpec): boolean {
  if (spec.technicalHeadMark !== undefined || spec.unitGrouping !== undefined) return false;
  return spec.strength === definition.expectedStrength &&
    spec.administrativeLevel === definition.expectedAdministrativeLevel;
}

/**
 * Ob die Spec exakt die vermessene Festfassung beschreibt. Nur dann zeichnet der Rollenzweig
 * die Fassung unverändert und ohne Ableitungsnotiz.
 */
export function functionRoleSpecIsMeasured(
  definition: FunctionRoleDefinition,
  spec: SymbolSpec,
): boolean {
  return spec.bodyVariant === undefined &&
    spec.organization === definition.expectedOrganization &&
    headMatchesDefinition(definition, spec);
}

/**
 * Die vermessene Fassung derselben Trägerart, deren Kopf die Spec übernimmt — oder `undefined`,
 * wenn keine passt (Staffel an der Person, Stärke am Formationskörper ohne Gruppenfassung,
 * technische Kopfmarke und Verband).
 *
 * Zuerst die Fassung mit genau dieser Kopfangabe; die Rolle selbst geht vor, sonst die erste in
 * Katalogreihenfolge. Fehlt sie bei einer Stärke, gilt eine Fassung mit einer Stärke derselben
 * Kopfhöhe, deren Körper dem Kopf schon ausweicht (`requiredTopMm`): der Trupp ist dieselbe
 * Reihe wie der Zug, nur mit der Mitte allein besetzt, und übernimmt deshalb die Lage des
 * Zugführers.
 */
function headTemplate(
  definition: FunctionRoleDefinition,
  spec: SymbolSpec,
  requiredTopMm: number | undefined,
): { template: FunctionRoleDefinition; exact: boolean } | undefined {
  if (spec.technicalHeadMark !== undefined || spec.unitGrouping !== undefined) return undefined;
  if (headMatchesDefinition(definition, spec)) return { template: definition, exact: true };
  const candidates = Object.values(FUNCTION_ROLE_DEFINITIONS)
    .filter((candidate) => candidate.kind === definition.kind);
  const exact = candidates.find((candidate) => headMatchesDefinition(candidate, spec));
  if (exact !== undefined) return { template: exact, exact: true };
  if (spec.strength === undefined || spec.administrativeLevel !== undefined || requiredTopMm === undefined) {
    return undefined;
  }
  const heightMm = strengthHead(spec.strength).heightMm;
  const similar = candidates
    .filter((candidate) =>
      candidate.expectedStrength !== undefined &&
      candidate.layout.headTopMm !== undefined &&
      strengthHead(candidate.expectedStrength).heightMm === heightMm &&
      boundsOfMm(candidate.layout.body).minY >= requiredTopMm - 1e-9)
    .sort((a, b) => boundsOfMm(a.layout.body).minY - boundsOfMm(b.layout.body).minY);
  return similar[0] === undefined ? undefined : { template: similar[0], exact: false };
}

function headDimension(spec: SymbolSpec): string {
  if (spec.strength !== undefined) return 'strength';
  if (spec.administrativeLevel !== undefined) return 'administrativeLevel';
  if (spec.technicalHeadMark !== undefined) return 'technicalHeadMark';
  if (spec.unitGrouping !== undefined) return 'unitGrouping';
  return 'functionRole';
}

export interface FunctionRoleLayoutInput {
  readonly definition: FunctionRoleDefinition;
  readonly spec: SymbolSpec;
  /** Das Profil der Art und Variante, wie `compose()` es wählt. */
  readonly profile: LayoutProfile;
  /**
   * Höhe der Kopfzone: Stärke, technische Kopfmarke, Verband oder Verwaltungsstufe. Ohne Kopf
   * `undefined`.
   */
  readonly headHeightMm: number | undefined;
  /** Die Grundzeichnung der Variante, nur wenn die Spec eine Körpervariante trägt. */
  readonly variantDrawing?: Drawing;
}

function variantBaseOf(
  drawing: Drawing | undefined,
): { body: Primitive; extras: readonly Primitive[] } | undefined {
  if (drawing === undefined) return undefined;
  const body = drawing.children.find((child) => child.role === 'body');
  if (body === undefined) throw new Error('Die Variantenzeichnung hat kein body-Primitiv.');
  return { body, extras: drawing.children.filter((child) => child !== body) };
}

export interface FunctionRoleLayout {
  /** Ob die Fassung unverändert vermessen gezeichnet wird. */
  readonly measured: boolean;
  /** Der platzierte Rollenkörper. */
  readonly body: Primitive;
  /** Zusatzgeometrie: Körperzusätze der Fassung und, an einer Variante, deren Zusätze (Fußband). */
  readonly extras: readonly Primitive[];
  readonly decorations: readonly Primitive[];
  /** Rollen- und Trägerläufe, in dieser Reihenfolge. */
  readonly runs: readonly FunctionRoleTextRun[];
  /** Oberkante der Kopfzone für einen Kopf der Höhe `heightMm`; immer endlich. */
  headBoxFor(heightMm: number): { topMm: number; bottomMm: number };
  /** Flächen im Körper, die eingepasste Piktogramme und Marken freilassen müssen. */
  readonly occupied: readonly BoundsMm[];
}

function withStyleOf(target: Primitive, source: Primitive): Primitive {
  return { ...target, role: 'body', ...(source.style === undefined ? {} : { style: source.style }) };
}

/**
 * Die Fassung einer Funktionsrolle für die Spec: unverändert, wenn die Spec die Festfassung
 * beschreibt; sonst auf den Körper umgerechnet, den Kopf, Variante und Organisation verlangen.
 *
 * - Organisation: Füllung wie am normalen Körper (setzt `compose()`), die Läufe im Körper tragen
 *   die aus der Füllung abgeleitete Tinte (`body-contrast`, aufgelöst über
 *   `functionRoleTextInk`).
 * - Kopf: Lage und Körper aus der vermessenen Fassung mit genau diesem Kopf (etwa der Zugführer
 *   für `zug`, die Kreisrollen für `kreis`); ohne solche Fassung über `placeHead` und das Profil
 *   der Art, wie am normalen Körper.
 * - Variante: der Variantenkörper der Grundzeichnung, wenn nötig dem Kopf ausgewichen; die
 *   Läufe werden mitgestreckt und dem Fußband ausweichend eingepasst.
 */
export function resolveFunctionRoleLayout(input: FunctionRoleLayoutInput): FunctionRoleLayout {
  const { definition, spec, profile, headHeightMm } = input;
  const variantBase = variantBaseOf(input.variantDrawing);
  const layout = definition.layout;
  const roleBody = layout.body;
  const roleRuns = [
    ...layout.roleRuns,
    ...(layout.carrierRun === undefined ? [] : [layout.carrierRun]),
  ];
  const fallbackHead = (heightMm: number) => placeHead(profile, heightMm);

  if (functionRoleSpecIsMeasured(definition, spec)) {
    const headTopMm = layout.headTopMm;
    return {
      measured: true,
      body: roleBody,
      extras: layout.bodyAdditions,
      decorations: layout.decorations,
      runs: roleRuns,
      headBoxFor: (heightMm) => headTopMm === undefined
        ? fallbackHead(heightMm)
        : { topMm: headTopMm, bottomMm: headTopMm + heightMm },
      occupied: occupiedOf(layout.decorations, [], roleRuns),
    };
  }

  const from = `function-role:${definition.id}`;
  const placedHeadTopMm = headHeightMm === undefined
    ? undefined
    : fallbackHead(headHeightMm).bottomMm + HEAD_GAP_MM;
  const match = headTemplate(definition, spec, placedHeadTopMm);
  const template = match?.template;
  const templateHeadTopMm = template?.layout.headTopMm;
  const headTopFor = (heightMm: number): number =>
    templateHeadTopMm ?? fallbackHead(heightMm).topMm;

  // Ausgangskörper: der Variantenkörper, sonst der Körper der Fassung mit diesem Kopf, sonst
  // der eigene.
  let target: Primitive = variantBase?.body ?? template?.layout.body ?? roleBody;
  const unplacedTarget = target;
  if (headHeightMm !== undefined && (variantBase !== undefined || template === undefined)) {
    // Der Kopf verlangt eine Oberkante des Körpers: die der vermessenen Fassung mit diesem Kopf
    // oder, ohne sie, die aus `placeHead` plus Kopfabstand.
    const requiredTopMm = template !== undefined
      ? boundsOfMm(template.layout.body).minY
      : placedHeadTopMm!;
    if (boundsOfMm(target).minY < requiredTopMm - 1e-9) {
      target = profile.place(target, requiredTopMm - HEAD_GAP_MM);
    }
  }
  const placedBody = withStyleOf(target, roleBody);

  const roleBounds = boundsOfMm(roleBody);
  const targetBounds = boundsOfMm(placedBody);
  const affine = affineBetween(roleBounds, targetBounds);
  const organizationDeviates = spec.organization !== definition.expectedOrganization;
  let runs = roleRuns.map((run) => {
    const mapped = mapRoleRun(run, affine);
    // Fremde Farbe: Läufe im Körper nehmen die Tinte aus der Füllung, wie jede Beschriftung im
    // Körper. Trägerläufe stehen auf der Ausgabeoberfläche und bleiben schwarz.
    return organizationDeviates && run.contrastBackground === 'body'
      ? { ...mapped, ink: 'body-contrast' as const }
      : mapped;
  });
  const decorations = layout.decorations.map((primitive) => mapPrimitive(primitive, affine));
  const variantExtras = variantBase === undefined
    ? []
    : variantBase.extras.map((primitive) =>
        mapPrimitive(primitive, affineBetween(boundsOfMm(variantBase.body), boundsOfMm(target))));
  const extras = [
    ...layout.bodyAdditions.map((primitive) => mapPrimitive(primitive, affine)),
    ...variantExtras,
  ];

  // Läufe im Körper weichen der Zusatzgeometrie der Variante (Fußband) aus.
  const bodyRunIndexes = runs
    .map((run, index) => (run.contrastBackground === 'body' ? index : -1))
    .filter((index) => index >= 0);
  const bodyRuns = bodyRunIndexes.map((index) => runs[index]!);
  const bodyRunsUnion = unionBounds(bodyRuns.map(runBounds));
  if (bodyRunsUnion !== undefined && variantExtras.length > 0) {
    const centerY = (bodyRunsUnion.minY + bodyRunsUnion.maxY) / 2;
    const blockers = [...decorations, ...variantExtras].map((primitive) => boundsOfMm(primitive));
    const topMm = Math.max(
      targetBounds.minY,
      ...blockers.filter((box) => (box.minY + box.maxY) / 2 < centerY).map((box) => box.maxY),
    ) + FIT_MARGIN_MM / 2;
    const bottomMm = Math.min(
      targetBounds.maxY,
      ...blockers.filter((box) => (box.minY + box.maxY) / 2 >= centerY).map((box) => box.minY),
    ) - FIT_MARGIN_MM / 2;
    const fitted = fitRunsVertically(bodyRuns, topMm, bottomMm);
    if (fitted.moved) {
      runs = runs.map((run, index) => {
        const position = bodyRunIndexes.indexOf(index);
        return position < 0 ? run : fitted.runs[position]!;
      });
      noteDerivation({
        dimension: 'bodyVariant',
        part: 'Funktionsläufe der Zusatzgeometrie der Variante ausweichend eingepasst',
        basis: 'constructed',
        from,
      });
    }
  }

  if (organizationDeviates) {
    noteDerivation({
      dimension: 'organization',
      part: spec.organization === undefined
        ? 'Funktionsfassung ohne Organisation, Lauftinte aus der Körperfüllung'
        : 'Funktionsfassung in anderer Organisationsfarbe, Lauftinte aus der Körperfüllung',
      basis: 'transferred',
      from,
    });
  }
  if (!headMatchesDefinition(definition, spec)) {
    noteDerivation({
      dimension: headDimension(spec),
      part: headHeightMm === undefined
        ? 'Funktionsfassung ohne Kopfzone, Körper der kopflosen Fassung'
        : template === undefined
          ? 'Kopfzone an der Funktionsfassung über placeHead und Profil der Art'
          : match?.exact === true
            ? 'Kopfzone an der Funktionsfassung, Lage und Körper der Fassung mit diesem Kopf'
            : 'Kopfzone an der Funktionsfassung, Lage und Körper der Fassung mit gleich hohem Kopf',
      basis: template === undefined ? 'constructed' : 'transferred',
      from: template === undefined ? `${from} + placeHead` : `function-role:${template.id}`,
    });
  }
  if (variantBase !== undefined) {
    noteDerivation({
      dimension: 'bodyVariant',
      part: isIdentityAffine(affine) && unplacedTarget === target
        ? 'Funktionsfassung auf dem Variantenkörper'
        : 'Funktionsfassung auf den Variantenkörper umgerechnet',
      basis: 'transferred',
      from,
    });
  }

  return {
    measured: false,
    body: placedBody,
    extras,
    decorations,
    runs,
    headBoxFor: (heightMm) => {
      const topMm = headTopFor(heightMm);
      return { topMm, bottomMm: topMm + heightMm };
    },
    occupied: occupiedOf(decorations, variantExtras, runs),
  };
}

function occupiedOf(
  decorations: readonly Primitive[],
  extras: readonly Primitive[],
  runs: readonly FunctionRoleTextRun[],
): BoundsMm[] {
  return [
    ...decorations.map((primitive) => boundsOfMm(primitive)),
    ...extras.map((primitive) => boundsOfMm(primitive)),
    ...runs.filter((run) => run.contrastBackground === 'body').map(runBounds),
  ];
}

/**
 * Piktogramme (`capabilities`) in der Funktionsfassung. Keine Referenz kombiniert beides; das
 * Piktogramm weicht den Läufen, der Kappe oder dem Balken, der Zusatzgeometrie und den schon
 * gesetzten Körpermarken (`bodyMarks`) aus, im größten freien Bereich des Körpers.
 */
export function fitFunctionRolePictograms(
  pictograms: readonly Primitive[],
  layout: FunctionRoleLayout,
  definition: FunctionRoleDefinition,
  bodyMarks: readonly Primitive[] = [],
): readonly Primitive[] {
  if (pictograms.length === 0) return pictograms;
  const occupied = [...layout.occupied, ...bodyMarks.map((mark) => boundsOfMm(mark))];
  const fitted = fitIntoRoleBody(pictograms, layout.body, occupied);
  noteDerivation({
    dimension: 'capabilities',
    part: fitted.moved
      ? 'Piktogramm in den freien Bereich der Funktionsfassung eingepasst'
      : 'Piktogramm in der Standardbox der Funktionsfassung',
    basis: fitted.moved ? 'constructed' : 'transferred',
    from: `function-role:${definition.id}`,
  });
  return fitted.primitives;
}

/**
 * Körpermarken an der Funktionsfassung. Die zur Fassung vermessenen Marken an der vermessenen
 * Fassung bleiben unverändert. Jede andere Marke steht an der Rollenkörperhülle, wie
 * `bodyMark()` sie dort zeichnet, und weicht bei einer Überschneidung den Läufen aus.
 */
export function fitFunctionRoleBodyMarks(
  marks: readonly Primitive[],
  layout: FunctionRoleLayout,
  definition: FunctionRoleDefinition,
  spec: SymbolSpec,
): readonly Primitive[] {
  const markIds = spec.bodyMarks ?? [];
  if (marks.length === 0 || markIds.length === 0) return marks;
  const allMeasured = markIds.every((id) => definition.allowedBodyMarks.includes(id));
  if (allMeasured && layout.measured) return marks;
  const fitted = fitIntoRoleBody(marks, layout.body, layout.occupied);
  noteDerivation({
    dimension: 'bodyMarks',
    part: fitted.moved
      ? 'Körpermarke den Funktionsläufen ausweichend eingepasst'
      : 'Körpermarke an der Hülle der Funktionsfassung',
    basis: fitted.moved ? 'constructed' : 'transferred',
    from: `function-role:${definition.id}`,
  });
  return fitted.primitives;
}
