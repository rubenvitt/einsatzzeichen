import type {
  CapabilityId,
  DepictionVariant,
  PictogramBox,
  PictogramDefinition,
  Primitive,
} from '@einsatzzeichen/schema';
import { deepFreeze, type DeepReadonly } from '../readonly-data.js';

export type CatalogPictogramDefinition = DeepReadonly<
  PictogramDefinition & {
    section: `4.${string}`;
    referenceAsset: `${string}.svg`;
  }
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
    // Definitionen übernehmen keine veränderlichen Eingabereferenzen. Der anschließende Freeze
    // hat dadurch keinen überraschenden Seiteneffekt auf Objekte im Besitz des Aufrufers.
    box: structuredClone(input.box),
    primitives: structuredClone(input.primitives),
  });
}
