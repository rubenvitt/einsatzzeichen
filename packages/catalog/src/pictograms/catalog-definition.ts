import type {
  CapabilityId,
  ColorToken,
  CommsId,
  DamageId,
  DepictionVariant,
  Drawing,
  LeadershipId,
  PictogramBox,
  PictogramDefinition,
  Primitive,
  StateId,
  WaterRescuePersonnelId,
  WildfireId,
} from '@einsatzzeichen/schema';
import { DEFAULT_VIEWBOX_MM } from '@einsatzzeichen/schema';
import { checkViewBox } from '@einsatzzeichen/core';
import { deepFreeze, type DeepReadonly } from '../readonly-data.js';

/**
 * Anders als die drei bisherigen Räume haben K, L und M eine **flache** Nummerierung: `K.7` ist
 * vollständig, wo `J.1.7` drei Ebenen brauchte. Deshalb `K.${string}` und nicht `K.${string}.${string}`.
 */
export type PictogramSection =
  | `4.${string}`
  | `5.8.${string}`
  | `J.${string}`
  | `K.${string}`
  | `L.${string}`
  | `M.${string}`
  | `D.${string}`
  | `I.5.${string}`;

export interface PictogramContrastPair {
  readonly foreground: ColorToken;
  readonly background: ColorToken | 'surface';
  readonly context: string;
}

export type PictogramPlacement =
  | { readonly mode: 'in-body'; readonly bodyKind: 'formation' }
  | { readonly mode: 'standalone' };

type CommonCatalogPictogramDefinition = PictogramDefinition & {
  readonly section: PictogramSection;
  readonly referenceAsset: `${string}.svg`;
};

export type CatalogPictogramDefinition = DeepReadonly<
  | (CommonCatalogPictogramDefinition & {
      readonly placement: { readonly mode: 'in-body'; readonly bodyKind: 'formation' };
      readonly contrastPairs?: never;
    })
  | (CommonCatalogPictogramDefinition & {
      readonly placement: { readonly mode: 'standalone' };
      readonly contrastPairs: readonly [PictogramContrastPair, ...PictogramContrastPair[]];
    })
>;

export interface CapabilityDefinitionInput {
  readonly section: `4.${string}`;
  readonly id: CapabilityId;
  readonly variant?: DepictionVariant;
  readonly title: string;
  readonly referenceAsset: `${string}.svg`;
  readonly box: PictogramBox;
  readonly primitives: readonly Primitive[];
}

export interface StateDefinitionInput {
  readonly section: `5.8.${string}`;
  readonly id: StateId;
  readonly variant?: DepictionVariant;
  readonly title: string;
  readonly referenceAsset: `${string}.svg`;
  readonly box: PictogramBox;
  readonly primitives: readonly Primitive[];
  readonly contrastPairs: readonly [PictogramContrastPair, ...PictogramContrastPair[]];
}

export function defineCapability(input: CapabilityDefinitionInput): CatalogPictogramDefinition {
  return deepFreeze({
    section: input.section,
    id: `capability.${input.id}`,
    variant: input.variant ?? 'primary',
    title: input.title,
    referenceAsset: input.referenceAsset,
    placement: { mode: 'in-body', bodyKind: 'formation' } as const,
    viewBox: DEFAULT_VIEWBOX_MM,
    // Definitionen übernehmen keine veränderlichen Eingabereferenzen. Der anschließende Freeze
    // hat dadurch keinen überraschenden Seiteneffekt auf Objekte im Besitz des Aufrufers.
    box: structuredClone(input.box),
    primitives: structuredClone(input.primitives),
  });
}

export function defineState(input: StateDefinitionInput): CatalogPictogramDefinition {
  return deepFreeze({
    section: input.section,
    id: `state.${input.id}`,
    variant: input.variant ?? 'primary',
    title: input.title,
    referenceAsset: input.referenceAsset,
    placement: { mode: 'standalone' } as const,
    contrastPairs: structuredClone(input.contrastPairs),
    viewBox: DEFAULT_VIEWBOX_MM,
    box: structuredClone(input.box),
    primitives: structuredClone(input.primitives),
  });
}

export interface CommsDefinitionInput {
  readonly section: `J.${string}`;
  readonly id: CommsId;
  readonly variant?: DepictionVariant;
  readonly title: string;
  readonly referenceAsset: `${string}.svg`;
  readonly box: PictogramBox;
  readonly primitives: readonly Primitive[];
  readonly contrastPairs: readonly [PictogramContrastPair, ...PictogramContrastPair[]];
}

export function defineComms(input: CommsDefinitionInput): CatalogPictogramDefinition {
  return deepFreeze({
    section: input.section,
    id: `comms.${input.id}`,
    variant: input.variant ?? 'primary',
    title: input.title,
    referenceAsset: input.referenceAsset,
    placement: { mode: 'standalone' } as const,
    contrastPairs: structuredClone(input.contrastPairs),
    viewBox: DEFAULT_VIEWBOX_MM,
    box: structuredClone(input.box),
    primitives: structuredClone(input.primitives),
  });
}

/**
 * Schadenszeichen aus K **und** L. Der Abschnitt ist deshalb über beide Anhänge getypt, während
 * die ID aus dem gemeinsamen `DamageId`-Raum stammt — die Begründung für die Zusammenlegung steht
 * an `DAMAGE_IDS` in `taxonomy.ts`.
 */
export interface DamageDefinitionInput {
  readonly section: `K.${string}` | `L.${string}`;
  readonly id: DamageId;
  readonly variant?: DepictionVariant;
  readonly title: string;
  readonly referenceAsset: `${string}.svg`;
  readonly box: PictogramBox;
  readonly primitives: readonly Primitive[];
  readonly contrastPairs: readonly [PictogramContrastPair, ...PictogramContrastPair[]];
}

export function defineDamage(input: DamageDefinitionInput): CatalogPictogramDefinition {
  return deepFreeze({
    section: input.section,
    id: `damage.${input.id}`,
    variant: input.variant ?? 'primary',
    title: input.title,
    referenceAsset: input.referenceAsset,
    placement: { mode: 'standalone' } as const,
    contrastPairs: structuredClone(input.contrastPairs),
    viewBox: DEFAULT_VIEWBOX_MM,
    box: structuredClone(input.box),
    primitives: structuredClone(input.primitives),
  });
}

export interface WildfireDefinitionInput {
  readonly section: `M.${string}`;
  readonly id: WildfireId;
  readonly variant?: DepictionVariant;
  readonly title: string;
  readonly referenceAsset: `${string}.svg`;
  readonly box: PictogramBox;
  readonly primitives: readonly Primitive[];
  readonly contrastPairs: readonly [PictogramContrastPair, ...PictogramContrastPair[]];
}

export function defineWildfire(input: WildfireDefinitionInput): CatalogPictogramDefinition {
  return deepFreeze({
    section: input.section,
    id: `wildfire.${input.id}`,
    variant: input.variant ?? 'primary',
    title: input.title,
    referenceAsset: input.referenceAsset,
    placement: { mode: 'standalone' } as const,
    contrastPairs: structuredClone(input.contrastPairs),
    viewBox: DEFAULT_VIEWBOX_MM,
    box: structuredClone(input.box),
    primitives: structuredClone(input.primitives),
  });
}

export interface LeadershipDefinitionInput {
  readonly section: `D.${string}`;
  readonly id: LeadershipId;
  readonly variant?: DepictionVariant;
  readonly title: string;
  readonly referenceAsset: `${string}.svg`;
  /** Kein Default: D.1.1 belegt als erstes direktes Zeichen eine 32×46-mm-Ansicht. */
  readonly viewBox: Drawing['viewBox'];
  readonly box: PictogramBox;
  readonly primitives: readonly Primitive[];
  readonly contrastPairs: readonly [PictogramContrastPair, ...PictogramContrastPair[]];
}

function validatedLeadershipViewBox(input: LeadershipDefinitionInput): Drawing['viewBox'] {
  const candidate = input.viewBox as unknown;
  if (
    typeof candidate !== 'object' ||
    candidate === null ||
    !('width' in candidate) ||
    !('height' in candidate) ||
    typeof candidate.width !== 'number' ||
    typeof candidate.height !== 'number' ||
    !Number.isFinite(candidate.width) ||
    !Number.isFinite(candidate.height) ||
    candidate.width <= 0 ||
    candidate.height <= 0
  ) {
    throw new Error(
      'leadership-viewbox-required: Leadership benötigt eine positive, endliche ViewBox.',
    );
  }

  const viewBox = { width: candidate.width, height: candidate.height };
  const outside = checkViewBox({ viewBox, children: input.primitives })
    .filter((issue) => issue.rule === 'outside-viewbox');
  if (outside.length > 0) {
    throw new Error(
      `leadership-outside-viewbox: ${outside.map((issue) => issue.detail).join(' ')}`,
    );
  }
  return viewBox;
}

export function defineLeadership(input: LeadershipDefinitionInput): CatalogPictogramDefinition {
  const viewBox = validatedLeadershipViewBox(input);
  return deepFreeze({
    section: input.section,
    id: `leadership.${input.id}`,
    variant: input.variant ?? 'primary',
    title: input.title,
    referenceAsset: input.referenceAsset,
    placement: { mode: 'standalone' } as const,
    contrastPairs: structuredClone(input.contrastPairs),
    viewBox: structuredClone(viewBox),
    box: structuredClone(input.box),
    primitives: structuredClone(input.primitives),
  });
}

export interface WaterRescuePersonnelDefinitionInput {
  readonly section: `I.5.${string}`;
  readonly id: WaterRescuePersonnelId;
  readonly variant?: DepictionVariant;
  readonly title: string;
  readonly referenceAsset: `${string}.svg`;
  readonly box: PictogramBox;
  readonly primitives: readonly Primitive[];
  readonly contrastPairs: readonly [PictogramContrastPair, ...PictogramContrastPair[]];
}

export function defineWaterRescuePersonnel(
  input: WaterRescuePersonnelDefinitionInput,
): CatalogPictogramDefinition {
  return deepFreeze({
    section: input.section,
    id: `water-rescue-personnel.${input.id}`,
    variant: input.variant ?? 'primary',
    title: input.title,
    referenceAsset: input.referenceAsset,
    placement: { mode: 'standalone' } as const,
    contrastPairs: structuredClone(input.contrastPairs),
    viewBox: DEFAULT_VIEWBOX_MM,
    box: structuredClone(input.box),
    primitives: structuredClone(input.primitives),
  });
}
