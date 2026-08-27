import { describe, expect, it } from 'vitest';
import { checkA11yMetadata, checkViewBox } from '@einsatzzeichen/core';
import { DEFAULT_VIEWBOX_MM } from '@einsatzzeichen/schema';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import { pictogramRenderId } from './pictograms/index.js';
import { ALL_PICTOGRAMS } from './pictograms/index.js';
import { RENDER_CASES } from './test-support/render-cases.js';

describe('vollständige Renderfallmenge', () => {
  it('bildet Piktogrammvarianten eindeutig auf Render-IDs ab', () => {
    expect(pictogramRenderId({ id: 'capability.fire-fighting', variant: 'primary' })).toBe(
      'capability.fire-fighting',
    );
    expect(pictogramRenderId({ id: 'capability.fire-fighting', variant: 'alternative' })).toBe(
      'capability.fire-fighting.alternative',
    );
  });

  it('ist nicht leer und über die Implementierungs-ID eindeutig', () => {
    const ids = RENDER_CASES.map((renderCase) => renderCase.id);
    // 518: 14 Grundzeichen, 235 Rezeptfälle und 269 Piktogrammvarianten.
    expect(ids).toHaveLength(518);
    expect(ids.filter((id) => id.startsWith('recipe.'))).toHaveLength(235);

    const anhangIRecipeIds = ids.filter((id) => id.startsWith('recipe.I.'));
    const expectedAnhangIRecipeIds = [
      ...Array.from({ length: 4 }, (_, index) => `recipe.I.1.${index + 1}`),
      ...Array.from({ length: 4 }, (_, index) => `recipe.I.1.${index + 5}`),
      'recipe.I.1.9',
      'recipe.I.1.9#alternative',
      ...Array.from({ length: 3 }, (_, index) => `recipe.I.1.${index + 10}`),
      ...Array.from({ length: 4 }, (_, index) => `recipe.I.1.${index + 17}`),
      ...Array.from({ length: 7 }, (_, index) => `recipe.I.2.${index + 1}`),
      ...Array.from({ length: 11 }, (_, index) => `recipe.I.3.${index + 1}`),
      ...Array.from({ length: 3 }, (_, index) => `recipe.I.4.${index + 1}`),
    ];
    expect(anhangIRecipeIds).toHaveLength(38);
    expect(new Set(anhangIRecipeIds)).toEqual(new Set(expectedAnhangIRecipeIds));

    expect(ids.filter((id) => id.startsWith('recipe.G.'))).toHaveLength(21);
    expect(ids.filter((id) => id.startsWith('recipe.N.'))).toEqual([
      'recipe.N.1.1', 'recipe.N.1.2', 'recipe.N.1.3', 'recipe.N.1.4', 'recipe.N.1.5',
      'recipe.N.1.6', 'recipe.N.2.1', 'recipe.N.2.2', 'recipe.N.2.3',
    ]);
    expect(ids.filter((id) => id.startsWith('recipe.H.'))).toEqual([
      'recipe.H.1',
      'recipe.H.2',
      'recipe.H.3',
    ]);
    expect(ids.filter((id) => id.startsWith('recipe.E.1.'))).toHaveLength(37);
    expect(ids.filter((id) => id.startsWith('recipe.F.1.'))).toHaveLength(25);
    expect(ids).toContain('recipe.F.1.11#alternative');
    expect(ids.filter((id) => id.startsWith('recipe.F.2.'))).toHaveLength(22);
    expect(ids.filter((id) => id.startsWith('recipe.F.3.'))).toHaveLength(19);
    expect(ids.filter((id) => id.startsWith('recipe.E.2.'))).toHaveLength(31);
    expect(ids.filter((id) => id.startsWith('capability.'))).toHaveLength(92);
    expect(ids.filter((id) => id.startsWith('state.'))).toHaveLength(67);
    expect(ids.filter((id) => id.startsWith('comms.'))).toHaveLength(53);
    expect(ids.filter((id) => id.startsWith('damage.'))).toHaveLength(28);
    expect(ids.filter((id) => id.startsWith('wildfire.'))).toHaveLength(14);
    expect(ids.filter((id) => id.startsWith('water-rescue-personnel.'))).toEqual([
      'water-rescue-personnel.formation-leader',
      'water-rescue-personnel.group-leader',
      'water-rescue-personnel.platoon-leader',
      'water-rescue-personnel.team-leader',
      'water-rescue-personnel.technical-advisor',
    ]);
    expect(ids.filter((id) => id.startsWith('leadership.'))).toEqual([
      'leadership.command-post-in-operation',
      'leadership.control-center',
      'leadership.guide-post',
      'leadership.helicopter-landing-site',
      'leadership.helicopter-landing-zone',
      'leadership.red-cross-commissioner',
      'leadership.reporting-head',
      'leadership.staging-area',
      'leadership.staging-area-with-reporting-head',
      'leadership.technical-advisor-thw',
    ]);
    expect(ids.filter(
      (id) =>
        !id.startsWith('recipe.') &&
        !id.startsWith('capability.') &&
        !id.startsWith('state.') &&
        !id.startsWith('comms.') &&
        !id.startsWith('damage.') &&
        !id.startsWith('wildfire.') &&
        !id.startsWith('leadership.') &&
        !id.startsWith('water-rescue-personnel.'),
    )).toHaveLength(14);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('entspricht exakt allen Manifest-Einträgen mit SVG-Snapshot-Nachweis', () => {
    const cases = RENDER_CASES.map((renderCase) => renderCase.id).sort();
    const claimed = COVERAGE_MANIFEST.entries
      .filter((entry) => entry.testEvidence.includes('svg-snapshot'))
      // Zwei Ableitungen, weil es zwei Namensregeln gibt. Ein Piktogramm trägt seine ID ohne
      // Darstellung und bekommt das Suffix hier angehängt (`capability.x` +
      // `capability.x.alternative`). Ein Rezept trägt sie seit F-a **im Schlüssel** — die
      // Implementierungs-ID lautet `recipe.F.1.11#alternative`, weil `RECIPES` beide
      // Darstellungen als eigene Einträge führt und der Schlüssel deshalb eindeutig sein muss.
      // Beide durch `pictogramRenderId` zu schicken hinge dem Rezept die Darstellung ein
      // zweites Mal an (`…#alternative.alternative`) und vergliche eine ID, die es nirgends
      // gibt.
      .map((entry) =>
        entry.coverage === 'composition-recipe'
          ? entry.implementation
          : pictogramRenderId({ id: entry.implementation, variant: entry.variant }),
      )
      .sort();
    expect(cases).toEqual(claimed);
  });

  it.each(RENDER_CASES)('$id trägt vollständige semantische Metadaten', ({ drawing }) => {
    expect(checkA11yMetadata(drawing)).toEqual([]);
  });

  it.each(RENDER_CASES)('$id verwendet seine deklarierte ViewBox und clippt keine Geometrie', ({ drawing }) => {
    expect(checkViewBox(drawing)).toEqual([]);
  });

  it('hält nur D.1.1 rechteckig und alle übrigen Definitionen bei 32×32 mm', () => {
    const rectangular = ALL_PICTOGRAMS.filter(
      (definition) => definition.viewBox.width !== definition.viewBox.height,
    );
    expect(rectangular.map((definition) => [definition.id, definition.viewBox])).toEqual([
      ['leadership.command-post-in-operation', { width: 32, height: 46 }],
    ]);
    for (const definition of ALL_PICTOGRAMS.filter(
      (candidate) => !rectangular.includes(candidate),
    )) {
      expect(definition.viewBox).toEqual(DEFAULT_VIEWBOX_MM);
    }
  });
});
