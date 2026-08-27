import type { Recipe } from './recipes.js';

/** I.1.9 bis I.1.12: die fünf vermessenen Wasserrettungsformationen. */
export const ANHANG_I_E_RECIPES = {
  'I.1.9': {
    title: 'Bootstrupp Wasserrettungszug',
    referenceAsset: 'I.1.9_Bootstrupp Wasserrettungszug.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'trupp',
      bodyMarks: ['water-rescue'],
      labels: { topLeft: 'Boot' },
    },
  },
  'I.1.9#alternative': {
    title: 'Bootstrupp Wasserrettungszug',
    referenceAsset: 'I.1.9_Bootstrupp Wasserrettungszug_Alternative.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'trupp',
      bodyMarks: ['watercraft-operations'],
      labels: { topLeft: 'WRZ' },
    },
  },
  'I.1.10': {
    title: 'Bootsgruppe Wasserrettung',
    referenceAsset: 'I.1.10_Bootsgruppe Wasserrettung.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'gruppe',
      bodyMarks: ['water-rescue'],
      labels: { topLeft: 'Boot' },
    },
  },
  'I.1.11': {
    title: 'Tauchtrupp',
    referenceAsset: 'I.1.11_Tauchtrupp.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'trupp',
      bodyMarks: ['water-rescue'],
      labels: { topLeft: 'Tauchen' },
    },
  },
  'I.1.12': {
    title: 'Tauchgruppe',
    referenceAsset: 'I.1.12_Tauchgruppe.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'gruppe',
      bodyMarks: ['water-rescue'],
      labels: { topLeft: 'Tauchen' },
    },
  },
} as const satisfies Record<string, Recipe>;

export const ANHANG_I_A_RECIPES = {
  'I.3.5': {
    title: 'Mehrzweckboot',
    referenceAsset: 'I.3.5_Mehrzweckboot.svg',
    spec: {
      kind: 'vehicle-water',
      bodyVariant: 'inset-hull',
      organization: 'hilfsorganisation',
      labels: { center: 'MzB' },
    },
  },
  'I.3.6': {
    title: 'Mehrzweckarbeitsboot',
    referenceAsset: 'I.3.6_Mehrzweckarbeitsboot.svg',
    spec: {
      kind: 'vehicle-water',
      bodyVariant: 'inset-hull',
      organization: 'hilfsorganisation',
      labels: { center: 'MzAB' },
    },
  },
  'I.3.7': {
    title: 'Mehrzweckponton',
    referenceAsset: 'I.3.7_Mehrzweckponton.svg',
    spec: {
      kind: 'vehicle-water',
      bodyVariant: 'inset-hull',
      organization: 'hilfsorganisation',
      labels: { center: 'MzPt' },
    },
  },
} as const satisfies Record<string, Recipe>;
