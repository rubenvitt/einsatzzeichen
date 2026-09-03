/**
 * Die Zeichnung zu einer Manifestzeile — für **alle** 544, ohne Lücke.
 *
 * `buildSnapshot` der Website zeichnet nur `catalog-entry` und `composition-recipe`; die 288
 * `element`-Zeilen fallen dort durch. Für ein Werkzeug, in dem ein Mensch jede Zeile einzeln
 * entscheidet, ist das der Unterschied zwischen Prüfen und Raten: 53 % der Zeilen hätten kein
 * Bild. Deshalb vier Fälle statt zweier (Designnotiz vom 3. September 2026, Abschnitt 4).
 *
 * Fail-closed in jedem Zweig: lässt sich keine Zeichnung bilden, wirft der Aufbau mit
 * Manifestschlüssel und Grund. Kein Platzhalter und kein `undefined` — eine unsichtbare Zeile
 * wäre eine blind entschiedene Zeile.
 */
import {
  ALL_PICTOGRAMS,
  BASE_SYMBOLS,
  RECIPES,
  composeFromCatalog,
  describePictogram,
  type Recipe,
} from '@einsatzzeichen/catalog';
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
import type { CarrierContext } from '../contract.js';

/** Zeichnung einer Manifestzeile, bei Trägerzeichen samt der Begründung für die Oberfläche. */
export interface RowDrawing {
  drawing: Drawing;
  /** Nur gesetzt, wenn die Zeile über ein Trägerzeichen dargestellt wird. */
  carrierContext?: CarrierContext;
}

const RECIPE_PREFIX = 'recipe.';

const CATALOG_ENTRIES_BY_ID = new Map<string, CatalogEntry>(
  Object.values(BASE_SYMBOLS).map((entry) => [entry.id, entry]),
);

/**
 * Der Definitionstyp aus dem Paketindex abgeleitet, statt ihn aus `pictograms/catalog-definition`
 * zu importieren: dieser Unterpfad gehört nicht zur öffentlichen Fläche des Katalogpakets.
 */
type CatalogPictogram = (typeof ALL_PICTOGRAMS)[number];

/**
 * Piktogramme über ID **und** Variante. Die Variante gehört in den Schlüssel: `4.1.6#primary`
 * und `4.1.6#alternative` sind zwei getrennt zu prüfende Bildideen derselben ID, und ein
 * Schlüssel ohne Variante zeigte in einer der beiden Zeilen das falsche Bild.
 */
const PICTOGRAMS_BY_KEY = new Map<string, CatalogPictogram>(
  ALL_PICTOGRAMS.map((definition) => [`${definition.id}#${definition.variant}`, definition]),
);

/**
 * Ein Trägerzeichen für ein Element, das ohne Körper nicht beurteilbar ist: eine
 * Organisationsfarbe braucht eine Fläche, ein Stärkegrad eine Kopfzone, eine Fahrzeugkategorie
 * ein Fahrwerk. Der Träger ist Kontext und nicht Teil der geprüften Aussage — die Erklärung
 * sagt das an der Darstellung, damit niemand den Rechteckkörper mitprüft.
 */
interface Carrier {
  spec: SymbolSpec;
  context: CarrierContext;
}

function organizationCarrier(id: OrganizationId): Carrier {
  return {
    spec: { kind: 'formation', organization: id },
    context: {
      host: 'formation',
      explanation:
        'Die Organisationsfarbe ist auf einer taktischen Formation gezeigt. Der Rechteckkörper ' +
        'ist nur Träger der Farbe und nicht Teil der geprüften Aussage.',
    },
  };
}

function strengthCarrier(id: StrengthId): Carrier {
  return {
    spec: { kind: 'formation', strength: id },
    context: {
      host: 'formation',
      explanation:
        'Der Stärkegrad ist als Kopfmarke über einer taktischen Formation gezeigt. Der Körper ' +
        'ist nur Träger der Kopfzone und nicht Teil der geprüften Aussage.',
    },
  };
}

function vehicleCategoryCarrier(id: VehicleCategoryId): Carrier {
  return {
    spec: { kind: 'vehicle-land', vehicleCategory: id },
    context: {
      host: 'vehicle-land',
      explanation:
        'Die Fahrzeugkategorie ist als Fahrwerkszone unter einem Landfahrzeug gezeigt. Der ' +
        'Fahrzeugrumpf ist nur Träger des Fahrwerks und nicht Teil der geprüften Aussage.',
    },
  };
}

/**
 * Der Träger zu einer Element-ID der Form `<art>.<taxonomie-id>` — oder `undefined`, wenn die ID
 * kein Trägerelement bezeichnet. Der Teil hinter dem Punkt wird gegen die Wertelisten des Schemas
 * geprüft und nicht blind zugesichert: eine unbekannte ID soll den Aufruf mit Nennung des
 * Manifestschlüssels abbrechen und nicht erst tief in `composeFromCatalog`.
 */
function carrierFor(implementation: string): Carrier | undefined {
  const dot = implementation.indexOf('.');
  if (dot === -1) return undefined;
  const kind = implementation.slice(0, dot);
  const id = implementation.slice(dot + 1);
  if (kind === 'organization' && (ORGANIZATION_IDS as readonly string[]).includes(id)) {
    return organizationCarrier(id as OrganizationId);
  }
  if (kind === 'strength' && (STRENGTH_IDS as readonly string[]).includes(id)) {
    return strengthCarrier(id as StrengthId);
  }
  if (kind === 'vehicle-category' && (VEHICLE_CATEGORY_IDS as readonly string[]).includes(id)) {
    return vehicleCategoryCarrier(id as VehicleCategoryId);
  }
  return undefined;
}

/** Hebt einen Fehler aus dem Katalog auf die Manifestzeile, die ihn ausgelöst hat. */
function failed(key: string, reason: string, cause: unknown): Error {
  const detail = cause instanceof Error ? cause.message : String(cause);
  return new Error(`Manifestzeile "${key}": ${reason} — ${detail}`, { cause });
}

/**
 * Die **gemessene** Zeichnung der beanspruchten Darstellung, nicht `composeFromCatalog`: beide
 * liefern dieselbe Geometrie (das ist geprüft), aber nur diese trägt die Abschnittsangabe der
 * Baseline in ihrer Beschreibung — und genau die liest der Fachreviewer mit.
 *
 * Kopiert wird bewusst: die Datenschicht gibt keine Referenz auf das Katalogobjekt heraus.
 */
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
  return structuredClone(depiction.drawing);
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

/**
 * Die Piktogrammdefinition als eigenständige Zeichnung — dieselbe Bildung wie im Renderfall-Gate
 * (`packages/catalog/src/test-support/render-cases.ts`), damit die Oberfläche genau das zeigt,
 * was dort gegatet ist. Der Pfad selbst liegt unter `test-support/` und wird vom Paketindex nicht
 * ausgeliefert; hier stehen deshalb die Bausteine aus dem Paketindex, nicht die Testhilfe.
 */
function pictogramDrawing(
  implementation: string,
  variant: DepictionVariant,
): Drawing | undefined {
  const definition = PICTOGRAMS_BY_KEY.get(`${implementation}#${variant}`);
  if (definition === undefined) return undefined;
  return {
    viewBox: definition.viewBox,
    children: definition.primitives,
    title: definition.title,
    description: describePictogram(definition),
  };
}

function elementDrawing(entry: CoverageEntry, key: string): RowDrawing {
  const pictogram = pictogramDrawing(entry.implementation, entry.variant);
  if (pictogram !== undefined) return { drawing: pictogram };

  const carrier = carrierFor(entry.implementation);
  if (carrier === undefined) {
    throw new Error(
      `Manifestzeile "${key}": Element "${entry.implementation}" ist weder ein Piktogramm der ` +
        `Variante "${entry.variant}" noch ein Trägerelement (organization.*, strength.*, ` +
        'vehicle-category.*). Ohne Zeichnung wäre die Zeile blind zu entscheiden.',
    );
  }
  try {
    return {
      drawing: composeFromCatalog(carrier.spec, entry.title),
      carrierContext: carrier.context,
    };
  } catch (cause) {
    throw failed(key, `Trägerzeichen für "${entry.implementation}" ließ sich nicht bilden`, cause);
  }
}

/** Die Zeichnung einer Manifestzeile, je nach Coverage-Art auf einem der vier Wege. */
export function drawingForManifestEntry(entry: CoverageEntry): RowDrawing {
  const key = entryKey(entry.sourceId, entry.variant);
  switch (entry.coverage) {
    case 'catalog-entry':
      return { drawing: catalogEntryDrawing(entry, key) };
    case 'composition-recipe':
      return { drawing: recipeDrawing(entry, key) };
    case 'element':
      return elementDrawing(entry, key);
    default: {
      // Eine neue Coverage-Art bricht hier bereits die Typprüfung; der Wurf deckt den Fall ab,
      // dass ein Manifest zur Laufzeit einen Wert außerhalb der Union trägt.
      const unhandled: never = entry.coverage;
      throw new Error(`Manifestzeile "${key}" trägt die unbekannte Coverage-Art "${String(unhandled)}".`);
    }
  }
}
