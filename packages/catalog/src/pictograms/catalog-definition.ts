import type {
  CapabilityId,
  DepictionVariant,
  PictogramBox,
  PictogramDefinition,
  Primitive,
} from '@einsatzzeichen/schema';

export interface CatalogPictogramDefinition extends PictogramDefinition {
  section: `4.${string}`;
  referenceAsset: `${string}.svg`;
}

export interface CapabilityDefinitionInput {
  section: `4.${string}`;
  id: CapabilityId;
  variant?: DepictionVariant;
  title: string;
  referenceAsset: `${string}.svg`;
  box: PictogramBox;
  primitives: readonly Primitive[];
}

export function defineCapability(input: CapabilityDefinitionInput): CatalogPictogramDefinition {
  return {
    section: input.section,
    id: `capability.${input.id}`,
    variant: input.variant ?? 'primary',
    title: input.title,
    referenceAsset: input.referenceAsset,
    box: input.box,
    primitives: input.primitives,
  };
}
