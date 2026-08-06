import {
  DEFAULT_STROKE_WIDTH_MM,
  type CapabilityId,
  type ColorToken,
  type DepictionVariant,
} from '@einsatzzeichen/schema';
import { defineCapability, type CatalogPictogramDefinition } from './catalog-definition.js';

export const STANDARD_CAPABILITY_BOX = {
  xMm: 4,
  yMm: 8,
  widthMm: 24,
  heightMm: 16,
} as const;

export interface StrokeCapabilityInput {
  section: `4.${string}`;
  id: CapabilityId;
  variant?: DepictionVariant;
  title: string;
  referenceAsset: `${string}.svg`;
  d: string;
  color?: ColorToken;
}

export function strokeCapability(input: StrokeCapabilityInput): CatalogPictogramDefinition {
  return defineCapability({
    section: input.section,
    id: input.id,
    ...(input.variant === undefined ? {} : { variant: input.variant }),
    title: input.title,
    referenceAsset: input.referenceAsset,
    box: STANDARD_CAPABILITY_BOX,
    primitives: [{
      type: 'path',
      role: 'pictogram',
      d: input.d,
      style: {
        fill: 'none',
        stroke: input.color ?? 'schwarz',
        strokeWidth: DEFAULT_STROKE_WIDTH_MM,
      },
    }],
  });
}
