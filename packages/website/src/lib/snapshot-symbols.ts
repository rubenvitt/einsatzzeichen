import { BASE_SYMBOLS, RECIPES, composeFromCatalog, type Recipe } from '@einsatzzeichen/catalog';
import { entryKey, type CatalogEntry, type CoverageEntry, type Depiction } from '@einsatzzeichen/schema';
import { slugForSymbolId } from './slug.js';
import { contrastExceptionForSection } from './snapshot-contrast.js';
import { reviewSetSummary } from './snapshot-review.js';
import { chapterForSection, registryIdOf, sectionOf } from './snapshot-sections.js';
import { citationOf } from './snapshot-sources.js';
import type { SymbolSummary } from './snapshot.js';

/**
 * Aus einer Manifestzeile wird ein Zeichen des Snapshots — für Katalogeinträge und für Rezepte
 * getrennt, weil beide ihre Quelle, ihre Zeichnung und ihre `spec` verschieden herleiten.
 *
 * Hier laufen die übrigen `snapshot-*`-Module zusammen: Abschnitte, Zitat, Kontrastausnahme,
 * Reviewmarken, Slug. Dass die Richtung nur diese eine ist — von den Blättern hierher und von hier
 * in `snapshot-build.ts` —, hält den Schnitt zyklenfrei.
 */

const CATALOG_ENTRIES_BY_ID = new Map<string, CatalogEntry>(
  Object.values(BASE_SYMBOLS).map((entry) => [entry.id, entry]),
);

/**
 * Die semantische ID einer Katalogeintrag-Darstellung. Für die `primary`-Darstellung ist das die
 * ID des Eintrags selbst (Spec §5.3); eine zweite Darstellung hängt ihre Variante an, damit sie
 * einen eigenen Slug bekommt statt die erste zu überschreiben.
 */
function depictionId(entry: CatalogEntry, depiction: Depiction): string {
  return depiction.variant === 'primary' ? entry.id : `${entry.id}#${depiction.variant}`;
}

export function symbolForCatalogEntry(row: CoverageEntry): SymbolSummary {
  const entry = CATALOG_ENTRIES_BY_ID.get(row.implementation);
  if (entry === undefined) {
    throw new Error(
      `Manifestzeile "${entryKey(row.sourceId, row.variant)}" nennt den Katalogeintrag ` +
        `"${row.implementation}", den der Katalog nicht führt.`,
    );
  }
  const depiction = entry.depictions.find((candidate) => candidate.variant === row.variant);
  if (depiction === undefined) {
    throw new Error(
      `Katalogeintrag "${entry.id}" hat keine Darstellung "${row.variant}", die die ` +
        'Manifestzeile beansprucht.',
    );
  }
  const reference = depiction.sourceRefs[0];
  const section = sectionOf(row.sourceId);
  const contrastException = contrastExceptionForSection(section);
  const id = depictionId(entry, depiction);
  // Die gemessene Zeichnung der Darstellung, nicht `composeFromCatalog`: beide liefern dieselbe
  // Geometrie (geprüft), aber nur diese trägt die BABZ-Abschnittsangabe in der Beschreibung.
  // `spec` ist die Fassung, mit der der Builder dasselbe Zeichen wieder herstellt — ein
  // Grundzeichen ist genau seine Art.
  return {
    id,
    slug: slugForSymbolId(id),
    title: entry.title,
    kind: 'catalog-entry',
    spec: { kind: entry.kind },
    drawing: structuredClone(depiction.drawing) as SymbolSummary['drawing'],
    sourceId: row.sourceId,
    variant: row.variant,
    source: {
      id: reference?.source ?? registryIdOf(row.sourceId),
      citation: citationOf(reference?.source ?? registryIdOf(row.sourceId)),
      ...(reference?.page !== undefined ? { page: String(reference.page) } : {}),
    },
    chapter: chapterForSection(section),
    profile: row.profile,
    synonyms: [...(entry.synonyms ?? [])],
    legacyIds: [...(entry.legacyIds ?? [])],
    review: reviewSetSummary(row.review),
    evidence: [...row.testEvidence],
    ...(contrastException !== undefined ? { contrastException } : {}),
  };
}

const RECIPE_PREFIX = 'recipe.';

export function symbolForRecipe(row: CoverageEntry): SymbolSummary {
  if (!row.implementation.startsWith(RECIPE_PREFIX)) {
    throw new Error(
      `Manifestzeile "${entryKey(row.sourceId, row.variant)}" trägt coverage ` +
        `"composition-recipe", aber die Implementierung "${row.implementation}" beginnt nicht ` +
        `mit "${RECIPE_PREFIX}".`,
    );
  }
  const key = row.implementation.slice(RECIPE_PREFIX.length);
  const recipe: Recipe | undefined = (RECIPES as Record<string, Recipe>)[key];
  if (recipe === undefined) {
    throw new Error(`Manifestzeile nennt das Rezept "${key}", das der Katalog nicht führt.`);
  }
  const section = sectionOf(row.sourceId);
  const contrastException = contrastExceptionForSection(section);
  const registryId = registryIdOf(row.sourceId);
  // Rezepte tragen keine `sourceRefs`; ihre Quelle ist die Baseline, aus deren Abschnittsnummer
  // der Manifestschlüssel gebildet ist. Deshalb auch keine Seitenangabe.
  return {
    id: row.implementation,
    slug: slugForSymbolId(row.implementation),
    title: recipe.title,
    kind: 'composition-recipe',
    spec: structuredClone(recipe.spec) as SymbolSummary['spec'],
    drawing: composeFromCatalog(recipe.spec, recipe.title),
    sourceId: row.sourceId,
    variant: row.variant,
    source: { id: registryId, citation: citationOf(registryId) },
    chapter: chapterForSection(section),
    profile: row.profile,
    synonyms: [],
    legacyIds: [],
    review: reviewSetSummary(row.review),
    evidence: [...row.testEvidence],
    ...(contrastException !== undefined ? { contrastException } : {}),
  };
}
