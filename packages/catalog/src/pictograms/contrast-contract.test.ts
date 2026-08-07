import { describe, expect, it } from 'vitest';
import { checkContrast, paintTokensOf } from '@einsatzzeichen/core';
import type { ColorToken } from '@einsatzzeichen/schema';
import { ORGANIZATION_COLORS } from '../organizations.js';
import { ACCESSIBLE_LIGHT_THEME, PRINT_MONOCHROME_THEME } from '../render-themes.js';
import { CAPABILITY_PICTOGRAMS } from './capabilities.js';
import type { CatalogPictogramDefinition } from './catalog-definition.js';
import { contrastRequirementsFor } from './contrast-contract.js';
import { ALL_PICTOGRAMS } from './index.js';
import { STATE_PICTOGRAMS } from './states/index.js';

function declaredPaintTokensOf(
  definition: CatalogPictogramDefinition,
): ReadonlySet<ColorToken> {
  if (definition.placement.mode !== 'standalone') {
    throw new Error(`${definition.id} ist kein Standalone-Piktogramm.`);
  }
  const contrastPairs = definition.contrastPairs;
  if (contrastPairs === undefined) {
    throw new Error(`${definition.id} deklariert keine contrastPairs.`);
  }
  return new Set(
    contrastPairs.flatMap((pair) => [
      pair.foreground,
      ...(pair.background === 'surface' ? [] : [pair.background]),
    ]),
  );
}

describe('Kontrastvertrag für Katalogpiktogramme', () => {
  it('expandiert den bisherigen Capability-Kontrastvertrag unverändert', () => {
    const requirements = ALL_PICTOGRAMS.flatMap(contrastRequirementsFor);
    expect(checkContrast(ACCESSIBLE_LIGHT_THEME, requirements)).toEqual([]);
    expect(checkContrast(PRINT_MONOCHROME_THEME, requirements)).toEqual([]);

    for (const definition of CAPABILITY_PICTOGRAMS) {
      const own = contrastRequirementsFor(definition);
      for (const token of paintTokensOf(definition.primitives)) {
        expect(own.filter((item) => item.foreground === token && item.background === 'surface')).toHaveLength(1);
        const organizationBackgrounds = own
          .filter((item) => item.foreground === token && item.background !== 'surface')
          .map((item) => item.background)
          .sort();
        expect(organizationBackgrounds).toEqual(
          definition.variant === 'primary'
            ? Object.values(ORGANIZATION_COLORS).sort()
            : [],
        );
      }
    }
  });

  it('deklariert für jedes Standalone-State alle tatsächlich verwendeten Farbtoken', () => {
    for (const definition of STATE_PICTOGRAMS) {
      const declared = declaredPaintTokensOf(definition);
      expect(
        [...paintTokensOf(definition.primitives)].filter((token) => !declared.has(token)),
        `${definition.id}#${definition.variant}`,
      ).toEqual([]);
    }
  });

  it('lehnt ein unsicher erzeugtes Standalone-Piktogramm ohne Kontrastpaare fail-closed ab', () => {
    const invalid = {
      ...CAPABILITY_PICTOGRAMS[0],
      placement: { mode: 'standalone' },
      contrastPairs: undefined,
    } as unknown as CatalogPictogramDefinition;

    expect(() => contrastRequirementsFor(invalid)).toThrow(/benötigt contrastPairs/);
  });
});
