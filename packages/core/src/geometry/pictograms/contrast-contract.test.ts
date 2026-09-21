import { describe, expect, it } from 'vitest';
import { checkContrast, paintTokensOf } from '../../a11y/contrast.js';
import type { RenderTheme } from '../../render/theme.js';
import { PALETTE, type ColorToken } from '@einsatzzeichen/schema';
import { unexpectedContrastIssues } from '../contrast-exceptions.js';
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
import { LEADERSHIP_PICTOGRAMS } from './leadership/index.js';
import { STATE_PICTOGRAMS } from './states/index.js';
import { WATER_RESCUE_PERSONNEL_PICTOGRAMS } from './water-rescue-personnel/index.js';

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

function undeclaredPaintTokensOf(
  definition: CatalogPictogramDefinition,
): readonly ColorToken[] {
  const declared = declaredPaintTokensOf(definition);
  return [...paintTokensOf(definition.primitives)].filter((token) => !declared.has(token));
}

describe('Kontrastvertrag für Katalogpiktogramme', () => {
  it('expandiert den Capability-Kontrastvertrag über Oberfläche und Organisationen', () => {
    const requirements = ALL_PICTOGRAMS.flatMap(contrastRequirementsFor);
    // Entschiedene Ausnahmen (contrast-exceptions.ts, etwa roter Text wie in der Referenz) sind
    // gedeckt; jeder andere Befund fällt weiter auf.
    expect(unexpectedContrastIssues(checkContrast(ACCESSIBLE_LIGHT_THEME, requirements))).toEqual([]);
    expect(unexpectedContrastIssues(checkContrast(PRINT_MONOCHROME_THEME, requirements))).toEqual([]);

    // Weiß ist in diesen vier Zeichen ausschließlich eine eingefasste Füllfläche (weiße Fläche mit
    // eigener schwarzer bzw. roter Kontur) und deshalb kein Vordergrund.
    const enclosedOnly = new Set([
      'capability.radioactive-materials#alternative:weiss',
      'capability.biological-materials#alternative:weiss',
      'capability.chemical-materials#alternative:weiss',
      'capability.hospital#primary:weiss',
    ]);
    const seenEnclosed: string[] = [];
    for (const definition of CAPABILITY_PICTOGRAMS) {
      const own = contrastRequirementsFor(definition);
      for (const token of paintTokensOf(definition.primitives)) {
        const key = `${definition.id}#${definition.variant}:${token}`;
        if (enclosedOnly.has(key)) {
          seenEnclosed.push(key);
          expect(own.filter((item) => item.foreground === token), key).toEqual([]);
          continue;
        }
        expect(own.filter((item) => item.foreground === token && item.background === 'surface')).toHaveLength(1);
        // Text auf einer eingefassten Füllfläche (4.1.6 bis 4.1.8 alternativ: rot auf weiss)
        // ist ein eigenes Paar und kein Organisationshintergrund.
        const organizationBackgrounds = own
          .filter((item) =>
            item.foreground === token &&
            item.background !== 'surface' &&
            !item.context.includes('Text auf Füllfläche'))
          .map((item) => item.background)
          .sort();
        expect(organizationBackgrounds).toEqual(
          definition.variant === 'primary'
            ? Object.values(ORGANIZATION_COLORS).sort()
            : [],
        );
      }
    }
    expect(seenEnclosed.sort()).toEqual([...enclosedOnly].sort());
  });

  it('deklariert für State, Leadership und Wasserrettungspersonal alle tatsächlich verwendeten Farbtoken', () => {
    for (const definition of [
      ...STATE_PICTOGRAMS,
      ...LEADERSHIP_PICTOGRAMS,
      ...WATER_RESCUE_PERSONNEL_PICTOGRAMS,
    ]) {
      expect(
        undeclaredPaintTokensOf(definition),
        `${definition.id}#${definition.variant}`,
      ).toEqual([]);
    }
  });

  it('meldet bei einer mutierten Wasserrettungsdefinition ein verwendetes, aber nicht deklariertes Farbtoken', () => {
    const original = WATER_RESCUE_PERSONNEL_PICTOGRAMS[0];
    const mutated = {
      ...original,
      primitives: [
        ...original.primitives,
        {
          type: 'circle', role: 'pictogram', cx: 16, cy: 16, r: 1,
          style: { fill: 'rot', stroke: 'none' },
        },
      ],
    } as CatalogPictogramDefinition;

    expect(undeclaredPaintTokensOf(mutated)).toEqual(['rot']);
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

  it('erbt den Textstil aus der umschließenden Gruppe und lässt gegen denselben Hintergrund die strengere Schwelle gewinnen', () => {
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
        // Derselbe Token 'schwarz' malt hier Nichttext auf demselben Hintergrund (Oberfläche bzw.
        // Körper) wie der Text — gegen diesen Hintergrund gewinnt die Textschwelle.
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
  it('wertet eine eingefasste Füllfläche nicht als Vordergrund, eine frei gemalte Fläche derselben Farbe schon', () => {
    const base = { ...CAPABILITY_PICTOGRAMS[0], id: 'capability.test-enclosed-fill' };
    const enclosed = {
      ...base,
      primitives: [
        {
          type: 'rect', role: 'pictogram', x: 4, y: 4, width: 24, height: 24,
          style: { fill: 'weiss', stroke: 'schwarz', strokeWidth: 0.5 },
        },
      ],
    } as unknown as CatalogPictogramDefinition;
    expect(contrastRequirementsFor(enclosed).map((item) => item.foreground)).not.toContain('weiss');

    const free = {
      ...base,
      primitives: [
        ...enclosed.primitives,
        { type: 'circle', role: 'pictogram', cx: 16, cy: 16, r: 2, style: { fill: 'weiss', stroke: 'none' } },
      ],
    } as unknown as CatalogPictogramDefinition;
    expect(contrastRequirementsFor(free)).toContainEqual(
      expect.objectContaining({ foreground: 'weiss', background: 'surface' }),
    );
  });

  it('legt die Textschwelle nur gegen den tatsächlichen Hintergrund des Textes an', () => {
    // 5.8.2.1: Die Stufenziffer steht schwarz auf dem weißen Kreis, die schwarzen Sektorgrenzen
    // liegen auf Rot und Grün. Nur Schwarz auf Weiß ist ein Textpaar.
    const activity = STATE_PICTOGRAMS.find(
      (candidate) => candidate.id === 'state.activity-slightly-increased-outage-up-to-25-percent',
    );
    expect(activity).toBeDefined();
    const minimumOf = (background: string) =>
      contrastRequirementsFor(activity!).find(
        (item) => item.foreground === 'schwarz' && item.background === background,
      )?.minimum;
    expect(minimumOf('weiss')).toBe(MINIMUM_TEXT_CONTRAST);
    expect(minimumOf('rot')).toBe(MINIMUM_NON_TEXT_CONTRAST);
    expect(minimumOf('gruen')).toBe(MINIMUM_NON_TEXT_CONTRAST);
    expect(minimumOf('surface')).toBe(MINIMUM_NON_TEXT_CONTRAST);
  });

  it('prüft Text auf einer eingefassten Füllfläche gegen diese Fläche statt gegen die Oberfläche', () => {
    // 4.1.6 alternativ: rotes „A“ im weiß gefüllten Warndreieck mit roter Kontur.
    const triangle = CAPABILITY_PICTOGRAMS.find(
      (candidate) =>
        candidate.id === 'capability.radioactive-materials' && candidate.variant === 'alternative',
    );
    expect(triangle).toBeDefined();
    const requirements = contrastRequirementsFor(triangle!);
    expect(requirements).toContainEqual(expect.objectContaining({
      foreground: 'rot', background: 'weiss', minimum: MINIMUM_TEXT_CONTRAST,
    }));
    expect(requirements).toContainEqual(expect.objectContaining({
      foreground: 'rot', background: 'surface', minimum: MINIMUM_NON_TEXT_CONTRAST,
    }));
  });

  it('erzeugt die Anforderung für Text auf einem nicht deklarierten Hintergrund selbst', () => {
    const original = STATE_PICTOGRAMS.find(
      (candidate) => candidate.id === 'state.activity-slightly-increased-outage-up-to-25-percent',
    );
    expect(original).toBeDefined();
    if (original === undefined || original.placement.mode !== 'standalone') return;
    const withoutWhite = {
      ...original,
      contrastPairs: (original.contrastPairs ?? []).filter((pair) => pair.background !== 'weiss'),
    } as unknown as CatalogPictogramDefinition;
    expect(contrastRequirementsFor(withoutWhite)).toContainEqual(expect.objectContaining({
      foreground: 'schwarz', background: 'weiss', minimum: MINIMUM_TEXT_CONTRAST,
    }));
  });

  it('fällt bei nicht bestimmbarem Texthintergrund auf die strenge Schwelle für alle Paare zurück', () => {
    // Eine gedrehte Gruppe um die Füllfläche: ihre Lage ist hier nicht auflösbar.
    const rotated = {
      ...CAPABILITY_PICTOGRAMS[0],
      id: 'capability.test-rotated-group',
      primitives: [
        {
          type: 'group',
          transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
          children: [
            {
              type: 'rect', role: 'pictogram', x: 8, y: 8, width: 16, height: 16,
              style: { fill: 'weiss', stroke: 'schwarz', strokeWidth: 0.5 },
            },
          ],
        },
        {
          type: 'text', role: 'pictogram', content: 'X', x: 16, y: 18, sizeMm: 4,
          anchor: 'middle', baseline: 'alphabetic',
          boxMm: { xMm: 14, yMm: 14, widthMm: 4, heightMm: 4 },
          style: { fill: 'rot' },
        },
        { type: 'line', role: 'pictogram', x1: 2, y1: 2, x2: 30, y2: 2, style: { stroke: 'rot' } },
      ],
    } as unknown as CatalogPictogramDefinition;
    const rot = contrastRequirementsFor(rotated).filter((item) => item.foreground === 'rot');
    expect(rot.length).toBeGreaterThan(0);
    expect(rot.every((item) => item.minimum === MINIMUM_TEXT_CONTRAST)).toBe(true);
  });
});
