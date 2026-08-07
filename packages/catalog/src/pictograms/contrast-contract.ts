import { paintTokensOf, type ContrastRequirement } from '@einsatzzeichen/core';
import { ORGANIZATION_COLORS } from '../organizations.js';
import type { CatalogPictogramDefinition } from './catalog-definition.js';

export const MINIMUM_NON_TEXT_CONTRAST = 3;

export function contrastRequirementsFor(
  definition: CatalogPictogramDefinition,
): readonly ContrastRequirement[] {
  if (definition.placement.mode === 'standalone') {
    if (!Array.isArray(definition.contrastPairs) || definition.contrastPairs.length === 0) {
      throw new Error(`Standalone-Piktogramm "${definition.id}" benötigt contrastPairs.`);
    }
    return definition.contrastPairs.map((pair) => ({
      ...pair,
      minimum: MINIMUM_NON_TEXT_CONTRAST,
    }));
  }

  const result: ContrastRequirement[] = [];
  for (const foreground of paintTokensOf(definition.primitives)) {
    result.push({
      foreground,
      background: 'surface',
      context: `${definition.id} ohne Organisationsfüllung`,
      minimum: MINIMUM_NON_TEXT_CONTRAST,
    });
    if (definition.variant !== 'primary') continue;
    for (const [organization, background] of Object.entries(ORGANIZATION_COLORS)) {
      result.push({
        foreground,
        background,
        context: `${definition.id} auf Organisation ${organization}`,
        minimum: MINIMUM_NON_TEXT_CONTRAST,
      });
    }
  }
  return result;
}
