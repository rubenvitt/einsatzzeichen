import { compose, type CatalogPorts, type ContrastRequirement } from '@einsatzzeichen/core';
import type { Drawing, OrganizationId, SymbolSpec } from '@einsatzzeichen/schema';
import { baseDrawing } from './base-symbols.js';
import { organizationColor } from './organizations.js';
import { MINIMUM_TEXT_CONTRAST } from './pictograms/contrast-contract.js';
import { pictogram } from './pictograms/index.js';
import { strengthHead } from './strengths.js';
import { describeSymbolSpec } from './labels.js';
import {
  ANHANG_E_A_RECIPES,
  ANHANG_E_B_RECIPES,
  ANHANG_E_C_RECIPES,
} from './recipes-anhang-e.js';

const PORTS: CatalogPorts = {
  baseDrawing,
  organizationColor,
  strengthHead,
  pictogram,
};

export function composeFromCatalog(spec: SymbolSpec, title?: string): Drawing {
  return compose(spec, PORTS, {
    ...(title !== undefined ? { title } : {}),
    description: describeSymbolSpec(spec),
  });
}

export interface Recipe {
  title: string;
  referenceAsset: string;
  spec: SymbolSpec;
}

/**
 * Zusammengesetzte Zeichen, die den Kompositionsmotor gegen die Referenz belegen.
 *
 * Die drei Einträge unten sind die Belegfälle des Motors aus dem Kernslice — je einer für
 * Kopfzone als Stapel (C.1.1), als Reihe (C.1.2) und am gedrehten Quadrat (D.3.7). Die 16
 * Einträge aus `ANHANG_E_A_RECIPES` sind der erste Bestand, der über Belegfälle hinausgeht:
 * ein vollständiger Abschnitt der Baseline, gebaut aus denselben Mechanismen. Die zwölf aus
 * `ANHANG_E_B_RECIPES` setzen ihn fort und belegen zusätzlich, dass die Zonenregel gegen alle
 * Kopfzonenbreiten trägt — E-a war ein Block aus `gruppe`, E-b bringt `zug` und `trupp` dazu.
 * Mit den neun aus `ANHANG_E_C_RECIPES` ist E.1 mit 37 Darstellungen vollständig; sie belegen
 * als erste, dass die Zonenregel auch gegen eine **zweite Körperform** trägt (E.1.37 auf
 * `building`).
 */
export const RECIPES = {
  ...ANHANG_E_A_RECIPES,
  ...ANHANG_E_B_RECIPES,
  ...ANHANG_E_C_RECIPES,
  'C.1.1': {
    title: 'Löschstaffel',
    referenceAsset: 'C.1.1_Löschstaffel.svg',
    spec: {
      kind: 'formation',
      organization: 'feuerwehr',
      strength: 'staffel',
      capabilities: ['fire-fighting'],
    },
  },
  'C.1.2': {
    title: 'Löschgruppe',
    referenceAsset: 'C.1.2_Löschgruppe.svg',
    spec: {
      kind: 'formation',
      organization: 'feuerwehr',
      strength: 'gruppe',
      capabilities: ['fire-fighting'],
    },
  },
  'D.3.7': {
    title: 'Zugführer der Feuerwehr',
    referenceAsset: 'D.3.7_Zugführer der Feuerwehr.svg',
    spec: {
      kind: 'person',
      organization: 'feuerwehr',
      strength: 'zug',
    },
  },
} as const satisfies Record<string, Recipe>;

/**
 * Kontrastvertrag der Beschriftungszonen. Ein Piktogramm deklariert seine Paare selbst
 * (`contrastPairs`), eine Komposition kann das nicht: ihre Farben entstehen erst beim
 * Zusammensetzen aus Grundzeichen, Organisation und Beschriftung. Diese Funktion leitet die
 * Anforderung deshalb aus dem Bestand ab statt sie zu wiederholen — jede Organisation, für die
 * ein Rezept eine Beschriftung im Körper führt, bekommt eine Anforderung „weiss auf ihrer
 * Körperfarbe" mit der **Textschwelle** 4,5:1, nicht mit den 3:1 für grafische Objekte.
 *
 * Ohne diese Ableitung wäre der weisse Text der einzige Ink im Katalog ohne Kontrastvertrag —
 * die Piktogrammpaare decken ihn nicht ab, weil er zu keinem Piktogramm gehört. Genau diese
 * Anforderung hat `blau` in beiden Alternativthemes nachgezogen (siehe `render-themes.ts`).
 */
export function labelContrastRequirements(): readonly ContrastRequirement[] {
  const organizations = new Set<OrganizationId>();
  for (const recipe of Object.values<Recipe>(RECIPES)) {
    if (recipe.spec.labels === undefined || recipe.spec.organization === undefined) continue;
    organizations.add(recipe.spec.organization);
  }
  return [...organizations].map((organization) => ({
    foreground: 'weiss',
    background: organizationColor(organization),
    context: `Beschriftung im Körper auf Organisation ${organization}`,
    minimum: MINIMUM_TEXT_CONTRAST,
  }));
}
