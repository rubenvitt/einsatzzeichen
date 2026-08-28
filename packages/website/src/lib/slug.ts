/**
 * URL-sicherer, stabiler Slug einer semantischen Symbol-ID.
 *
 * Das Präfix `recipe.` fällt weg — es ist eine Implementierungsauskunft des Manifests und keine
 * Eigenschaft des Zeichens; `E.1.1` heißt auf der Website `/zeichen/e-1-1`. Das Präfix `base.`
 * bleibt stehen: es unterscheidet das Grundzeichen `base.formation` von jedem Rezept, das auf
 * derselben Körperform steht.
 *
 * Kein stiller Rückfall: eine ID ohne verwertbare Zeichen wirft, statt einen leeren Slug zu
 * liefern (Spec §7).
 */
export function slugForSymbolId(id: string): string {
  const withoutRecipePrefix = id.startsWith('recipe.') ? id.slice('recipe.'.length) : id;
  const slug = withoutRecipePrefix
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug === '') {
    throw new Error(`Aus der Symbol-ID "${id}" entsteht kein Slug: keine verwertbaren Zeichen.`);
  }
  return slug;
}
