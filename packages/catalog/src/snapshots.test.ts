import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderSvg } from '@einsatzzeichen/core';
import { BASE_SYMBOLS, baseDrawing } from './base-symbols.js';
import { RECIPES, composeFromCatalog } from './recipes.js';

describe('SVG-Snapshots', () => {
  it('schreibt exakt 241 direkte SVG-Snapshots', () => {
    const snapshots = readdirSync(new URL('./__snapshots__/', import.meta.url), {
      withFileTypes: true,
    }).filter((entry) => entry.isFile() && entry.name.endsWith('.svg'));
    const names = snapshots.map((entry) => entry.name);
    expect(snapshots).toHaveLength(241);
    expect(names).toContain('C.1.3.svg');
    expect(names).toContain('G.1.svg');
    expect(names).toContain('G.8.svg');
    expect(names).toContain('I.1.5.svg');
    expect(names).toContain('I.1.6.svg');
    expect(names).toContain('I.1.7.svg');
    expect(names).toContain('I.1.8.svg');
    expect(names).toContain('I.1.9.svg');
    expect(names).toContain('I.1.9#alternative.svg');
    expect(names).toContain('I.1.10.svg');
    expect(names).toContain('I.1.11.svg');
    expect(names).toContain('I.1.12.svg');
    expect(names).toContain('I.2.1.svg');
    expect(names).toContain('I.2.2.svg');
    expect(names).toContain('I.2.3.svg');
    expect(names).toContain('I.1.17.svg');
    expect(names).toContain('I.1.18.svg');
    expect(names).toContain('I.1.19.svg');
    expect(names).toContain('I.1.20.svg');
    for (const section of Array.from({ length: 11 }, (_, index) => `I.3.${index + 1}`)) {
      expect(names).toContain(`${section}.svg`);
    }
    for (const section of Array.from({ length: 3 }, (_, index) => `I.4.${index + 1}`)) {
      expect(names).toContain(`${section}.svg`);
    }
    expect(names).toContain('N.1.1.svg');
    expect(names).toContain('N.2.3.svg');
  });

  it.each(Object.values(BASE_SYMBOLS).map((entry) => entry.kind))(
    'rendert das Grundzeichen %s unverändert',
    async (kind) => {
      await expect(renderSvg(baseDrawing(kind), { size: 64 })).toMatchFileSnapshot(
        `./__snapshots__/base.${kind}.svg`,
      );
    },
  );

  it.each(Object.entries(RECIPES))(
    'rendert das Rezept %s unverändert',
    async (section, recipe) => {
      const svg = renderSvg(composeFromCatalog(recipe.spec, recipe.title), { size: 64 });
      await expect(svg).toMatchFileSnapshot(`./__snapshots__/${section}.svg`);
    },
  );
});
