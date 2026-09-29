/**
 * Die Zeichnung zu einer Manifestzeile für den Pixelvergleich (`reference-diff`).
 *
 * Übernommen aus `packages/review/src/data/drawings.ts` (Fachreview-Werkzeug), damit der
 * Vergleich genau das Bild rechnet, das der Fachreviewer im Werkzeug sieht. Die CLI darf das
 * private Paket `review` nicht importieren (Paketgrenze, `repository-policy.ts`), deshalb steht
 * die Bildung hier ein zweites Mal. Beide Stellen müssen gleich bleiben, bis die Funktion in ein
 * gemeinsames veröffentlichtes Paket wandert.
 *
 * Vier Wege je nach Coverage-Art: Katalogeintrag (Darstellung der Zeilenvariante), Rezept,
 * Piktogramm (ID und Variante) und Trägerzeichen für Elemente, die ohne Körper nicht sichtbar
 * sind (Organisationsfarbe, Stärkegrad, Fahrzeugkategorie). Fail-closed: ohne Zeichnung wirft der
 * Aufbau mit Manifestschlüssel und Grund.
 */
import { RECIPES, composeFromCatalog, type Recipe } from '@einsatzzeichen/conformance';
import { ALL_PICTOGRAMS, BASE_SYMBOLS, describePictogram } from '@einsatzzeichen/core';
import {
  ORGANIZATION_IDS,
  STRENGTH_IDS,
  VEHICLE_CATEGORY_IDS,
  entryKey,
  type CatalogEntry,
  type CoverageEntry,
  type DepictionVariant,
  type Drawing,
  type OrganizationId,
  type StrengthId,
  type SymbolSpec,
  type VehicleCategoryId,
} from '@einsatzzeichen/schema';

const RECIPE_PREFIX = 'recipe.';

const CATALOG_ENTRIES_BY_ID = new Map<string, CatalogEntry>(
  Object.values(BASE_SYMBOLS).map((entry) => [entry.id, entry]),
);

type CatalogPictogram = (typeof ALL_PICTOGRAMS)[number];

/** Piktogramme über ID **und** Variante — `4.1.6#primary` und `4.1.6#alternative` sind zwei Bilder. */
const PICTOGRAMS_BY_KEY = new Map<string, CatalogPictogram>(
  ALL_PICTOGRAMS.map((definition) => [`${definition.id}#${definition.variant}`, definition]),
);

/** Anhängerfahrwerke gehören an den Anhängerrumpf, nicht an das Landfahrzeug. */
const TRAILER_CATEGORIES: ReadonlySet<VehicleCategoryId> = new Set([
  'anhaenger-ein-rad',
  'anhaenger-zwei-raeder',
]);

/** Das Trägerzeichen zu `<art>.<taxonomie-id>` oder `undefined`, wenn es kein Trägerelement ist. */
function carrierSpecFor(implementation: string): SymbolSpec | undefined {
  const dot = implementation.indexOf('.');
  if (dot === -1) return undefined;
  const kind = implementation.slice(0, dot);
  const id = implementation.slice(dot + 1);
  if (kind === 'organization' && (ORGANIZATION_IDS as readonly string[]).includes(id)) {
    return { kind: 'formation', organization: id as OrganizationId };
  }
  if (kind === 'strength' && (STRENGTH_IDS as readonly string[]).includes(id)) {
    return { kind: 'formation', strength: id as StrengthId };
  }
  if (kind === 'vehicle-category' && (VEHICLE_CATEGORY_IDS as readonly string[]).includes(id)) {
    const category = id as VehicleCategoryId;
    return TRAILER_CATEGORIES.has(category)
      ? { kind: 'trailer', vehicleCategory: category }
      : { kind: 'vehicle-land', vehicleCategory: category };
  }
  return undefined;
}

function failed(key: string, reason: string, cause: unknown): Error {
  const detail = cause instanceof Error ? cause.message : String(cause);
  return new Error(`Manifestzeile "${key}": ${reason} — ${detail}`, { cause });
}

function catalogEntryDrawing(entry: CoverageEntry, key: string): Drawing {
  const catalogEntry = CATALOG_ENTRIES_BY_ID.get(entry.implementation);
  if (catalogEntry === undefined) {
    throw new Error(
      `Manifestzeile "${key}" nennt den Katalogeintrag "${entry.implementation}", den der ` +
        'Katalog nicht führt.',
    );
  }
  const depiction = catalogEntry.depictions.find(
    (candidate) => candidate.variant === entry.variant,
  );
  if (depiction === undefined) {
    throw new Error(
      `Manifestzeile "${key}": Katalogeintrag "${catalogEntry.id}" hat keine Darstellung ` +
        `"${entry.variant}".`,
    );
  }
  return depiction.drawing;
}

function recipeDrawing(entry: CoverageEntry, key: string): Drawing {
  if (!entry.implementation.startsWith(RECIPE_PREFIX)) {
    throw new Error(
      `Manifestzeile "${key}" trägt coverage "composition-recipe", aber die Implementierung ` +
        `"${entry.implementation}" beginnt nicht mit "${RECIPE_PREFIX}".`,
    );
  }
  const name = entry.implementation.slice(RECIPE_PREFIX.length);
  const recipe: Recipe | undefined = (RECIPES as Record<string, Recipe>)[name];
  if (recipe === undefined) {
    throw new Error(`Manifestzeile "${key}" nennt das Rezept "${name}", das der Katalog nicht führt.`);
  }
  try {
    return composeFromCatalog(recipe.spec, recipe.title);
  } catch (cause) {
    throw failed(key, `Rezept "${name}" ließ sich nicht komponieren`, cause);
  }
}

function pictogramDrawing(implementation: string, variant: DepictionVariant): Drawing | undefined {
  const definition = PICTOGRAMS_BY_KEY.get(`${implementation}#${variant}`);
  if (definition === undefined) return undefined;
  return {
    viewBox: definition.viewBox,
    children: definition.primitives,
    title: definition.title,
    description: describePictogram(definition),
  };
}

function elementDrawing(entry: CoverageEntry, key: string): Drawing {
  const pictogram = pictogramDrawing(entry.implementation, entry.variant);
  if (pictogram !== undefined) return pictogram;

  const spec = carrierSpecFor(entry.implementation);
  if (spec === undefined) {
    throw new Error(
      `Manifestzeile "${key}": Element "${entry.implementation}" ist weder ein Piktogramm der ` +
        `Variante "${entry.variant}" noch ein Trägerelement (organization.*, strength.*, ` +
        'vehicle-category.*).',
    );
  }
  try {
    return composeFromCatalog(spec, entry.title);
  } catch (cause) {
    throw failed(key, `Trägerzeichen für "${entry.implementation}" ließ sich nicht bilden`, cause);
  }
}

/** Die Zeichnung einer Manifestzeile, je nach Coverage-Art auf einem der vier Wege. */
export function drawingForManifestEntry(entry: CoverageEntry): Drawing {
  const key = entryKey(entry.sourceId, entry.variant);
  switch (entry.coverage) {
    case 'catalog-entry':
      return catalogEntryDrawing(entry, key);
    case 'composition-recipe':
      return recipeDrawing(entry, key);
    case 'element':
      return elementDrawing(entry, key);
    default: {
      const unhandled: never = entry.coverage;
      throw new Error(`Manifestzeile "${key}" trägt die unbekannte Coverage-Art "${String(unhandled)}".`);
    }
  }
}
