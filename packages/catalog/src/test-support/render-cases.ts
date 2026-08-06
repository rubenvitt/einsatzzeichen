import { DEFAULT_VIEWBOX_MM, type CatalogEntry, type Drawing } from '@einsatzzeichen/schema';
import { BASE_SYMBOLS } from '../base-symbols.js';
import { describePictogram } from '../labels.js';
import { ALL_PICTOGRAMS, pictogramRenderId } from '../pictograms/index.js';
import { RECIPES, composeFromCatalog } from '../recipes.js';

export interface RenderCase {
  id: string;
  drawing: Drawing;
}

function primaryDrawing(entry: CatalogEntry): Drawing {
  const primary = entry.depictions.filter((depiction) => depiction.variant === 'primary');
  if (primary.length !== 1 || primary[0] === undefined) {
    throw new Error(
      `Renderfall "${entry.id}" benötigt genau eine primary-Darstellung, fand ${primary.length}.`,
    );
  }
  return primary[0].drawing;
}

const bases: RenderCase[] = Object.values(BASE_SYMBOLS).map((entry) => ({
  id: entry.id,
  drawing: primaryDrawing(entry),
}));

const recipes: RenderCase[] = Object.entries(RECIPES).map(([section, recipe]) => ({
  id: `recipe.${section}`,
  drawing: composeFromCatalog(recipe.spec, recipe.title),
}));

const pictograms: RenderCase[] = ALL_PICTOGRAMS.map((definition) => ({
  id: pictogramRenderId(definition),
  drawing: {
    viewBox: DEFAULT_VIEWBOX_MM,
    children: definition.primitives,
    title: definition.title,
    description: describePictogram(definition),
  },
}));

/** Eine einzige, deterministisch sortierte Eingabe für Raster-, viewBox- und Metadaten-Gates. */
export const RENDER_CASES: readonly RenderCase[] = [...bases, ...recipes, ...pictograms].sort(
  (first, second) => first.id.localeCompare(second.id),
);
