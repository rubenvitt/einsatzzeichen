import type { Recipe } from './recipes.js';

/** Anhang H: veterinärmedizinische Formationen mit orangefarbenem Körper. */
export const ANHANG_H_RECIPES = {
  'H.1': {
    title: 'Veterinärzug',
    referenceAsset: 'H.1_Veterinärzug.svg',
    spec: {
      kind: 'formation',
      organization: 'sonstige-gefahrenabwehr',
      strength: 'zug',
      bodyMarks: ['veterinary'],
    },
  },
  'H.2': {
    title: 'Tier-Dekontaminationsgruppe',
    referenceAsset: 'H.2_Tier-Dekontaminationsgruppe.svg',
    spec: {
      kind: 'formation',
      organization: 'sonstige-gefahrenabwehr',
      strength: 'gruppe',
      bodyMarks: ['h-veterinary-decontamination'],
    },
  },
  'H.3': {
    title: 'Schlacht- und Untersuchungsgruppe',
    referenceAsset: 'H.3_Schlacht- und Untersuchungsgruppe.svg',
    spec: {
      kind: 'formation',
      organization: 'sonstige-gefahrenabwehr',
      strength: 'gruppe',
      bodyMarks: ['h-veterinary-slaughter'],
    },
  },
} as const satisfies Record<string, Recipe>;
