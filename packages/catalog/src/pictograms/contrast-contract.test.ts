import { describe, expect, it } from 'vitest';
import { checkContrast, paintTokensOf } from '@einsatzzeichen/core';
import { ORGANIZATION_COLORS } from '../organizations.js';
import { ACCESSIBLE_LIGHT_THEME, PRINT_MONOCHROME_THEME } from '../render-themes.js';
import { CAPABILITY_PICTOGRAMS } from './capabilities.js';
import { contrastRequirementsFor } from './contrast-contract.js';
import { ALL_PICTOGRAMS } from './index.js';

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
});
