import {
  DEFAULT_STROKE_WIDTH_MM,
  FUNCTION_ROLE_IDS,
  type BodyMarkId,
  type FunctionRoleDefinition,
  type FunctionRoleId,
  type FunctionRoleTextRun,
  type Primitive,
} from '@einsatzzeichen/schema';
import { deepFreeze, type DeepReadonly } from './readonly-data.js';

const BODY_STYLE = {
  fill: 'none' as const,
  stroke: 'schwarz' as const,
  strokeWidth: DEFAULT_STROKE_WIDTH_MM,
};

const BLACK_FILL = { fill: 'schwarz' as const, stroke: 'none' as const };

function roleRun(
  content: string,
  baselineYMm: number,
  sizeMm: number,
  boxMm: FunctionRoleTextRun['boxMm'],
  minRenderPx: number,
  ink: FunctionRoleTextRun['ink'] = 'schwarz',
): FunctionRoleTextRun {
  return {
    content,
    anchorXMm: 16,
    baselineYMm,
    sizeMm,
    anchor: 'middle',
    boxMm,
    minRenderPx,
    ink,
    contrastBackground: 'body',
  };
}

function carrierRun(
  content: string,
  anchorXMm: number,
  baselineYMm: number,
  boxMm: FunctionRoleTextRun['boxMm'],
): FunctionRoleTextRun {
  return {
    content,
    anchorXMm,
    baselineYMm,
    sizeMm: 4.243,
    anchor: 'end',
    boxMm,
    minRenderPx: 61,
    ink: 'schwarz',
    contrastBackground: 'surface',
  };
}

function formationRole(
  id: FunctionRoleId,
  title: string,
  roleRuns: FunctionRoleDefinition['layout']['roleRuns'],
  expectedHead: 'none' | 'strength' = 'none',
): FunctionRoleDefinition {
  return {
    id,
    title,
    kind: 'formation',
    expectedHead,
    allowedBodyMarks: [],
    layout: {
      ...(expectedHead === 'strength' ? { headTopMm: 2 } : {}),
      body: {
        type: 'rect', role: 'body', x: 1, y: 6, width: 30, height: 20,
        style: BODY_STYLE,
      },
      bodyAdditions: [],
      decorations: [{
        type: 'rect', role: 'pictogram', x: 1, y: 6, width: 30, height: 3,
        style: BLACK_FILL,
      }],
      roleRuns,
    },
  };
}

interface PersonRoleOptions {
  id: FunctionRoleId;
  title: string;
  organizationHead?: 'none' | 'strength' | 'administrative';
  bodyCenterYMm?: number;
  halfDiagonalMm?: number;
  capShoulderYMm?: number;
  roleRuns?: FunctionRoleDefinition['layout']['roleRuns'];
  carrierRun?: FunctionRoleTextRun;
  allowedBodyMarks?: readonly BodyMarkId[];
}

function personRole(options: PersonRoleOptions): FunctionRoleDefinition {
  const expectedHead = options.organizationHead ?? 'none';
  const centerY = options.bodyCenterYMm ?? 16;
  const halfDiagonal = options.halfDiagonalMm ?? 13;
  const side = halfDiagonal * Math.SQRT2;
  const shoulderY = options.capShoulderYMm ?? centerY - 8;
  const capHalfWidth = halfDiagonal === 10.5 ? 4 : 5;
  const decorations: Primitive[] = [{
    type: 'polyline',
    role: 'pictogram',
    points: [[16, centerY - halfDiagonal], [16 + capHalfWidth, shoulderY], [16 - capHalfWidth, shoulderY]],
    closed: true,
    style: BLACK_FILL,
  }];
  return {
    id: options.id,
    title: options.title,
    kind: 'person',
    expectedHead,
    allowedBodyMarks: options.allowedBodyMarks ?? [],
    layout: {
      ...(expectedHead === 'strength'
        ? { headTopMm: 1 }
        : expectedHead === 'administrative'
          ? { headTopMm: 0 }
          : {}),
      body: {
        type: 'rect',
        role: 'body',
        x: 16 - side / 2,
        y: centerY - side / 2,
        width: side,
        height: side,
        transform: { rotate: { angle: 45, cx: 16, cy: centerY } },
        style: BODY_STYLE,
      },
      bodyAdditions: [],
      decorations,
      roleRuns: options.roleRuns ?? [],
      ...(options.carrierRun === undefined ? {} : { carrierRun: options.carrierRun }),
    },
  };
}

const FORMATION_LARGE = 10.61;
const PERSON_LARGE = 7.08;
const DEFINITIONS: Record<FunctionRoleId, FunctionRoleDefinition> = {
  'disaster-control-command': formationRole(
    'disaster-control-command',
    'Katastrophenschutzleitung',
    [roleRun('KatSL', 20, FORMATION_LARGE, { xMm: 2.2, yMm: 12.3, widthMm: 28.1, heightMm: 8 }, 25)],
  ),
  'technical-incident-command-evacuation': formationRole(
    'technical-incident-command-evacuation',
    'Technische Einsatzleitung Evakuierung',
    [
      roleRun('TEL', 18, FORMATION_LARGE, { xMm: 6.3, yMm: 10.4, widthMm: 19.3, heightMm: 7.8 }, 25),
      roleRun('Evakuierung', 23, 4.243, { xMm: 4.3, yMm: 19.7, widthMm: 23.5, heightMm: 4.4 }, 61),
    ],
  ),
  'incident-command': formationRole(
    'incident-command',
    'Einsatzleitung',
    [roleRun('EL', 20, FORMATION_LARGE, { xMm: 10.2, yMm: 12.4, widthMm: 12.1, heightMm: 7.8 }, 25)],
  ),
  'incident-section-command-north': formationRole(
    'incident-section-command-north',
    'Einsatzabschnittsleitung Nord',
    [
      roleRun('EAL', 18, FORMATION_LARGE, { xMm: 6.5, yMm: 10.4, widthMm: 19.5, heightMm: 7.8 }, 25),
      roleRun('Nord', 23, 4.243, { xMm: 11.5, yMm: 19.7, widthMm: 9.1, heightMm: 3.7 }, 61),
    ],
  ),
  'incident-subsection-command': formationRole(
    'incident-subsection-command',
    'Untereinsatzabschnittsleitung',
    [roleRun('UEAL', 20, FORMATION_LARGE, { xMm: 2.6, yMm: 12.4, widthMm: 27.1, heightMm: 7.9 }, 25)],
  ),
  'technical-incident-command-group': formationRole(
    'technical-incident-command-group',
    'Führungsgruppe Technische Einsatzleitung',
    [roleRun('TEL', 20, FORMATION_LARGE, { xMm: 6.3, yMm: 12.4, widthMm: 19.3, heightMm: 7.8 }, 25)],
    'strength',
  ),
  'fire-service-readiness-command-group': formationRole(
    'fire-service-readiness-command-group',
    'Führungsgruppe einer Feuerwehrbereitschaft',
    [roleRun('Ber', 20, FORMATION_LARGE, { xMm: 8.4, yMm: 12.4, widthMm: 16, heightMm: 7.9 }, 25)],
    'strength',
  ),
  'technical-incident-commander': personRole({
    id: 'technical-incident-commander', title: 'Technischer Einsatzleiter',
    organizationHead: 'administrative',
    roleRuns: [roleRun('TEL', 18.5, PERSON_LARGE, { xMm: 9.4, yMm: 13.4, widthMm: 13.1, heightMm: 5.4 }, 37)],
    carrierRun: carrierRun('AW', 30.5, 29, { xMm: 23.5, yMm: 25.8, widthMm: 7.2, heightMm: 3.5 }),
  }),
  'incident-commander': personRole({
    id: 'incident-commander', title: 'Einsatzleiter',
    roleRuns: [roleRun('EL', 18.5, PERSON_LARGE, { xMm: 12, yMm: 13.4, widthMm: 8.3, heightMm: 5.4 }, 37)],
  }),
  'lead-emergency-physician': personRole({
    id: 'lead-emergency-physician', title: 'Leitender Notarzt',
    organizationHead: 'administrative',
    roleRuns: [roleRun('LNA', 18.5, PERSON_LARGE, { xMm: 9.4, yMm: 13.4, widthMm: 13.7, heightMm: 5.4 }, 37)],
  }),
  'organizational-incident-commander': personRole({
    id: 'organizational-incident-commander', title: 'Organisatorischer Leiter',
    organizationHead: 'administrative',
    roleRuns: [roleRun('OrgL', 18.5, PERSON_LARGE, { xMm: 8.1, yMm: 13.3, widthMm: 15.8, heightMm: 6.9 }, 37)],
  }),
  'incident-section-commander': personRole({
    id: 'incident-section-commander', title: 'Einsatzabschnittsleiter',
    roleRuns: [roleRun('EAL', 18.5, PERSON_LARGE, { xMm: 9.6, yMm: 13.4, widthMm: 13.1, heightMm: 5.4 }, 37)],
  }),
  'incident-subsection-commander': personRole({
    id: 'incident-subsection-commander', title: 'Untereinsatzabschnittsleiter',
    roleRuns: [roleRun('UEAL', 18.5, PERSON_LARGE, { xMm: 7, yMm: 13.4, widthMm: 18.2, heightMm: 5.5 }, 37)],
  }),
  'fire-service-platoon-commander': personRole({
    id: 'fire-service-platoon-commander', title: 'Zugführer der Feuerwehr',
    organizationHead: 'strength', bodyCenterYMm: 18, capShoulderYMm: 10,
    allowedBodyMarks: ['fire-fighting'],
  }),
  'technical-platoon-commander': personRole({
    id: 'technical-platoon-commander', title: 'Zugführer Technischer Zug',
    organizationHead: 'strength', bodyCenterYMm: 18, capShoulderYMm: 10,
    roleRuns: [roleRun('TZ', 20.5, PERSON_LARGE, { xMm: 11.5, yMm: 15.4, widthMm: 8.8, heightMm: 5.3 }, 37, 'weiss')],
  }),
  'medical-platoon-commander': personRole({
    id: 'medical-platoon-commander', title: 'Zugführer Sanitätszug',
    organizationHead: 'strength', bodyCenterYMm: 18, capShoulderYMm: 10,
    carrierRun: carrierRun('ASB', 30.5, 31, { xMm: 21.75, yMm: 27.8, widthMm: 8.8, heightMm: 3.5 }),
    allowedBodyMarks: ['medical-service'],
  }),
  'operational-unit-platoon-commander': personRole({
    id: 'operational-unit-platoon-commander', title: 'Zugführer Einsatzeinheit',
    organizationHead: 'strength', bodyCenterYMm: 18, capShoulderYMm: 10,
    carrierRun: carrierRun('DRK', 31, 31, { xMm: 22.1, yMm: 27.8, widthMm: 9.1, heightMm: 3.4 }),
    allowedBodyMarks: ['medical-service', 'care'],
  }),
  'care-platoon-commander': personRole({
    id: 'care-platoon-commander', title: 'Zugführer Betreuungszug',
    organizationHead: 'strength', bodyCenterYMm: 18, capShoulderYMm: 10,
    carrierRun: carrierRun('ASB', 30.5, 31, { xMm: 21.75, yMm: 27.8, widthMm: 8.8, heightMm: 3.5 }),
    allowedBodyMarks: ['care'],
  }),
  'care-group-commander': personRole({
    id: 'care-group-commander', title: 'Gruppenführer Betreuungsgruppe',
    organizationHead: 'strength',
    carrierRun: carrierRun('MHD', 31.5, 29, { xMm: 22, yMm: 25.8, widthMm: 9.55, heightMm: 3.4 }),
    allowedBodyMarks: ['care'],
  }),
  'rapid-response-group-commander': personRole({
    id: 'rapid-response-group-commander', title: 'Gruppenführer Schnell-Einsatzgruppe',
    organizationHead: 'strength',
    roleRuns: [roleRun('SEG', 18.5, PERSON_LARGE, { xMm: 8.5, yMm: 13.3, widthMm: 14.75, heightMm: 5.5 }, 37)],
    carrierRun: carrierRun('JUH', 30.5, 29, { xMm: 22.1, yMm: 25.8, widthMm: 8.3, heightMm: 3.5 }),
  }),
  'district-control-center-director': personRole({
    id: 'district-control-center-director', title: 'Leiter Kreisleitstelle',
    organizationHead: 'administrative',
    roleRuns: [roleRun('LtS', 18.5, PERSON_LARGE, { xMm: 11, yMm: 13.3, widthMm: 10.25, heightMm: 5.5 }, 37)],
    carrierRun: carrierRun('ST', 29.5, 29, { xMm: 24, yMm: 25.8, widthMm: 5.65, heightMm: 3.5 }),
  }),
  'district-fire-chief': personRole({
    id: 'district-fire-chief', title: 'Kreisbrandmeister',
    organizationHead: 'administrative',
    roleRuns: [roleRun('KBM', 18.5, PERSON_LARGE, { xMm: 8.625, yMm: 13.4, widthMm: 14.75, heightMm: 5.3 }, 37)],
    carrierRun: carrierRun('ME', 30, 29, { xMm: 23.7, yMm: 25.8, widthMm: 6.5, heightMm: 3.4 }),
  }),
  'hazard-response-director': personRole({
    id: 'hazard-response-director', title: 'Leiter Gefahrenabwehr',
    organizationHead: 'administrative',
    roleRuns: [roleRun('LtrGA', 18.5, PERSON_LARGE, { xMm: 7, yMm: 13.3, widthMm: 18.5, heightMm: 5.5 }, 37)],
    carrierRun: carrierRun('MG', 30, 29, { xMm: 23.25, yMm: 25.8, widthMm: 6.7, heightMm: 3.5 }),
  }),
  'hazard-response-forces-director': personRole({
    id: 'hazard-response-forces-director', title: 'Leiter Gefahrenabwehrkräfte',
    organizationHead: 'administrative', bodyCenterYMm: 18, capShoulderYMm: 10,
    carrierRun: carrierRun('BuPol', 31.75, 31, { xMm: 20.5, yMm: 27.7, widthMm: 11.375, heightMm: 3.6 }),
  }),
  'international-relief-operation-director': personRole({
    id: 'international-relief-operation-director', title: 'Leiter internationale Hilfsaktion',
    organizationHead: 'administrative', bodyCenterYMm: 20.5, halfDiagonalMm: 10.5,
    capShoulderYMm: 14,
  }),
};

const actualIds = Object.keys(DEFINITIONS);
if (
  actualIds.length !== FUNCTION_ROLE_IDS.length ||
  FUNCTION_ROLE_IDS.some((id, index) => actualIds[index] !== id)
) {
  throw new Error('Das Funktionsregister muss FUNCTION_ROLE_IDS vollstaendig und geordnet abbilden.');
}

export const FUNCTION_ROLE_DEFINITIONS: DeepReadonly<
  Record<FunctionRoleId, FunctionRoleDefinition>
> = deepFreeze(DEFINITIONS);

export function functionRole(id: FunctionRoleId): FunctionRoleDefinition {
  return FUNCTION_ROLE_DEFINITIONS[id];
}
