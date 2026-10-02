import { describe, expect, it } from 'vitest';
import { RECIPES, composeFromCatalog } from './recipes.js';

/**
 * Vermessene Zeichen tragen keine Ableitungsnotiz. Die Snapshots sehen das nicht: die Renderer
 * geben `derivations` nicht aus, ein Rezept mit unerwarteter Notiz bliebe bytegleich. Seit die
 * Beschriftungszonen an jeder Körperform abgeleitet werden (2. Oktober 2026), prüft dieser Test
 * jedes Rezept einzeln.
 */
describe('Rezepte: vermessene Zeichen ohne Ableitung', () => {
  it.each(Object.entries(RECIPES))('%s trägt keine Ableitungsnotiz', (_id, recipe) => {
    expect(composeFromCatalog(recipe.spec, recipe.title).derivations).toBeUndefined();
  });
});
