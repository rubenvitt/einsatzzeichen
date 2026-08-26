import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderSvg } from '@einsatzzeichen/core';
import { BASE_SYMBOLS, baseDrawing } from './base-symbols.js';
import { RECIPES, composeFromCatalog } from './recipes.js';

describe('SVG-Snapshots', () => {
  it('schreibt exakt 151 direkte SVG-Snapshots', () => {
    const snapshots = readdirSync(new URL('./__snapshots__/', import.meta.url), {
      withFileTypes: true,
    }).filter((entry) => entry.isFile() && entry.name.endsWith('.svg'));
    expect(snapshots).toHaveLength(151);
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
