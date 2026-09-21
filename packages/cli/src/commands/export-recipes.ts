import { RECIPES, composeFromCatalog } from '@einsatzzeichen/conformance';
import type { Drawing } from '@einsatzzeichen/schema';

/**
 * Rezeptauflösung für `export` — die einzige Stelle des Exportpfads, die das Prüfpaket braucht.
 *
 * Der Export schreibt neben den Grundzeichen jedes zusammengesetzte Zeichen, das der Katalog als
 * Rezept führt. Welche Zeichen das sind (`RECIPES`) und mit welchen Katalog-Ports sie
 * zusammengesetzt werden (`composeFromCatalog`), liegt heute in `@einsatzzeichen/conformance`.
 * Eine Zusammenstellung, mit der `core` ohne Prüfpaket rendert, ist LFH-580; bis dahin kapselt
 * dieses Modul die Kante, damit `export.ts` selbst nur `core` kennt. Die Ports werden hier bewusst
 * nicht nachgebaut: `visual-proof` belegt dieselben Zeichnungen über `composeFromCatalog`, und eine
 * zweite Port-Zusammenstellung könnte davon unbemerkt abweichen.
 */
export interface ExportRecipeDrawing {
  /** Abschnittskennung des Rezepts, zugleich Dateiname ohne Endung. */
  readonly id: string;
  readonly drawing: Drawing;
}

export function* exportRecipeDrawings(): Generator<ExportRecipeDrawing> {
  for (const [section, recipe] of Object.entries(RECIPES)) {
    yield { id: section, drawing: composeFromCatalog(recipe.spec, recipe.title) };
  }
}
