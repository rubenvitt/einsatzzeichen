import type {
  CapabilityId,
  ColorToken,
  DepictionVariant,
  PictogramBox,
  PictogramDefinition,
  Primitive,
} from '@einsatzzeichen/schema';
import { deepFreeze, type DeepReadonly } from '../readonly-data.js';

export type PictogramSection = `4.${string}` | `5.8.${string}`;

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

export function defineCapability(input: CapabilityDefinitionInput): CatalogPictogramDefinition {
  return deepFreeze({
    section: input.section,
    id: `capability.${input.id}`,
    variant: input.variant ?? 'primary',
    title: input.title,
    referenceAsset: input.referenceAsset,
    placement: { mode: 'in-body', bodyKind: 'formation' } as const,
    // Definitionen übernehmen keine veränderlichen Eingabereferenzen. Der anschließende Freeze
    // hat dadurch keinen überraschenden Seiteneffekt auf Objekte im Besitz des Aufrufers.
    box: structuredClone(input.box),
    primitives: structuredClone(input.primitives),
  });
}
