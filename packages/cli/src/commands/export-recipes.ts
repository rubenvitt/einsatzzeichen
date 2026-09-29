import { RECIPES } from '@einsatzzeichen/conformance';
import { drawSymbol } from '@einsatzzeichen/core';
import type { Drawing } from '@einsatzzeichen/schema';

/**
 * Rezeptauflösung für `export` — die einzige Stelle des Exportpfads, die das Prüfpaket braucht.
 *
 * Der Export schreibt neben den Grundzeichen jedes zusammengesetzte Zeichen, das der Katalog als
 * Rezept führt. Welche Zeichen das sind (`RECIPES`), liegt in `@einsatzzeichen/conformance`;
 * dieses Modul kapselt die Kante, damit `export.ts` selbst nur `core` kennt. Gezeichnet wird seit
 * LFH-580 mit `drawSymbol()` aus `core` und dessen Standardbelegung — derselben, die `visual-proof`
 * nutzt, sodass keine zweite Port-Zusammenstellung unbemerkt abweichen kann.
 */
export interface ExportRecipeDrawing {
  /** Abschnittskennung des Rezepts, zugleich Dateiname ohne Endung. */
  readonly id: string;
  readonly drawing: Drawing;
}

export function* exportRecipeDrawings(): Generator<ExportRecipeDrawing> {
  for (const [section, recipe] of Object.entries(RECIPES)) {
    yield { id: section, drawing: drawSymbol(recipe.spec, { title: recipe.title }) };
  }
}
