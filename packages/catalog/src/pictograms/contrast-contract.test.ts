import { describe, expect, it } from 'vitest';
import { checkContrast, paintTokensOf, type RenderTheme } from '@einsatzzeichen/core';
import { PALETTE, type ColorToken } from '@einsatzzeichen/schema';
import { ORGANIZATION_COLORS } from '../organizations.js';
import { ACCESSIBLE_LIGHT_THEME, PRINT_MONOCHROME_THEME } from '../render-themes.js';
import { CAPABILITY_PICTOGRAMS } from './capabilities.js';
import type { CatalogPictogramDefinition } from './catalog-definition.js';
import {
  contrastPairProblems,
  contrastRequirementsFor,
  MINIMUM_NON_TEXT_CONTRAST,
  MINIMUM_TEXT_CONTRAST,
} from './contrast-contract.js';
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

  it('legt für Text die höhere Schwelle an', () => {
    expect(MINIMUM_TEXT_CONTRAST).toBe(4.5);
    expect(MINIMUM_NON_TEXT_CONTRAST).toBe(3);
  });

  it('meldet ein Paar aus identischen Farbtoken als Befund', () => {
    // weiss und surface sind beide #ffffff. Das Verhältnis ist 1:1 und die Zusicherung damit
    // unerfüllbar — ein Autor, der sie deklariert, hat den Kontrastvertrag missverstanden.
    const issues = contrastPairProblems([
      { foreground: 'weiss', background: 'surface', context: 'Körper auf Oberfläche' },
    ]);
    expect(issues).toHaveLength(1);
  });

  it('lässt eine echte Farbnachbarschaft durch', () => {
    const issues = contrastPairProblems([
      { foreground: 'schwarz', background: 'surface', context: 'Kontur auf Oberfläche' },
    ]);
    expect(issues).toEqual([]);
  });

  it('prüft je Theme statt nach Tokennamen — eine Kollision nur in einem von zwei Themes ergibt genau diesen einen Treffer', () => {
    // Synthetisches Themepaar: Im ersten löst 'gelb' zufällig auf dieselbe Farbe wie die
    // Oberfläche auf, im zweiten (der echten Palette) nicht. Eine Prüfung, die nur Tokennamen
    // vergliche (z. B. ein hartcodiertes weiss/surface-Verbot), würde diesen Fall nicht abbilden.
    const collidingTheme: RenderTheme = {
      id: 'synthetic-collision',
      palette: { ...PALETTE, gelb: '#ffffff' },
      surface: '#ffffff',
    };
    const distinctTheme: RenderTheme = {
      id: 'synthetic-distinct',
      palette: PALETTE,
      surface: '#ffffff',
    };
    const issues = contrastPairProblems(
      [{ foreground: 'gelb', background: 'surface', context: 'synthetischer Test' }],
      [collidingTheme, distinctTheme],
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.themeIds).toEqual(['synthetic-collision']);
  });

  it('legt für Farbtoken aus Textprimitiven die höhere Schwelle an als für reine Piktogrammtoken', () => {
    const withText = {
      ...CAPABILITY_PICTOGRAMS[0],
      id: 'capability.test-with-text',
      primitives: [
        {
          type: 'text',
          role: 'pictogram',
          content: 'X',
          x: 0,
          y: 0,
          sizeMm: 3,
          anchor: 'middle',
          baseline: 'middle',
          boxMm: { xMm: 0, yMm: 0, widthMm: 3, heightMm: 3 },
          style: { fill: 'schwarz' },
        },
        {
          type: 'circle',
          role: 'pictogram',
          cx: 5,
          cy: 5,
          r: 2,
          style: { fill: 'rot' },
        },
      ],
    } as unknown as CatalogPictogramDefinition;

    const requirements = contrastRequirementsFor(withText);
    const textRequirement = requirements.find(
      (item) => item.foreground === 'schwarz' && item.background === 'surface',
    );
    const nonTextRequirement = requirements.find(
      (item) => item.foreground === 'rot' && item.background === 'surface',
    );
    expect(textRequirement?.minimum).toBe(MINIMUM_TEXT_CONTRAST);
    expect(nonTextRequirement?.minimum).toBe(MINIMUM_NON_TEXT_CONTRAST);
  });

  it('erbt den Textstil aus der umschließenden Gruppe und lässt die strengere Schwelle für denselben Token überall gewinnen', () => {
    const nested = {
      ...CAPABILITY_PICTOGRAMS[0],
      id: 'capability.test-nested-text',
      primitives: [
        {
          type: 'group',
          style: { fill: 'schwarz' },
          children: [
            {
              type: 'text',
              role: 'pictogram',
              content: 'X',
              x: 0,
              y: 0,
              sizeMm: 3,
              anchor: 'middle',
              baseline: 'middle',
              boxMm: { xMm: 0, yMm: 0, widthMm: 3, heightMm: 3 },
              // Kein eigener style — der Fülltoken kommt ausschließlich über die Gruppe.
              // Ein nicht-rekursiver Filter würde diesen Text gar nicht erst finden.
            },
          ],
        },
        // Derselbe Token 'schwarz' malt hier Nichttext — die Textschwelle muss trotzdem für
        // alle seine Anforderungen gelten, nicht nur für die Textprimitive selbst.
        { type: 'circle', role: 'pictogram', cx: 5, cy: 5, r: 2, style: { fill: 'schwarz' } },
        { type: 'circle', role: 'pictogram', cx: 9, cy: 9, r: 2, style: { fill: 'rot' } },
      ],
    } as unknown as CatalogPictogramDefinition;

    const requirements = contrastRequirementsFor(nested);
    const schwarzRequirement = requirements.find(
      (item) => item.foreground === 'schwarz' && item.background === 'surface',
    );
    const rotRequirement = requirements.find(
      (item) => item.foreground === 'rot' && item.background === 'surface',
    );
    expect(schwarzRequirement?.minimum).toBe(MINIMUM_TEXT_CONTRAST);
    expect(rotRequirement?.minimum).toBe(MINIMUM_NON_TEXT_CONTRAST);
  });
});
