import { compose, type CatalogPorts } from '@einsatzzeichen/core';
import type { Drawing, SymbolSpec } from '@einsatzzeichen/schema';
import { baseDrawing } from './base-symbols.js';
import { capabilityPictogram } from './capabilities.js';
import { organizationColor } from './organizations.js';
import { strengthHead } from './strengths.js';

const PORTS: CatalogPorts = {
  baseDrawing,
  organizationColor,
  strengthHead,
  capabilityPictogram,
};

export function composeFromCatalog(spec: SymbolSpec, title?: string): Drawing {
  return compose(spec, PORTS, { ...(title !== undefined ? { title } : {}) });
}

export interface Recipe {
  title: string;
  referenceAsset: string;
  spec: SymbolSpec;
}

/** Zusammengesetzte Zeichen, die den Kompositionsmotor gegen die Referenz belegen. */
export const RECIPES = {
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
