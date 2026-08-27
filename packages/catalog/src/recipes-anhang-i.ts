import type { Recipe } from './recipes.js';

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

/** I.2.4 bis I.2.7: vier radlose Anhänger mit ausschließlich quellenbelegten Innenmarken. */
export const ANHANG_I_B_RECIPES = {
  'I.2.4': {
    title: 'Anhänger Wasserrettung',
    referenceAsset: 'I.2.4_Anhänger Wasserrettung.svg',
    spec: {
      kind: 'trailer',
      organization: 'hilfsorganisation',
      bodyMarks: ['trailer-water-rescue'],
    },
  },
  'I.2.5': {
    title: 'Anhänger Tauchen',
    referenceAsset: 'I.2.5_Anhänger Tauchen.svg',
    spec: {
      kind: 'trailer',
      organization: 'hilfsorganisation',
      bodyMarks: ['trailer-diving'],
      labels: { center: 'Tauchen', centerBaselineFromBodyBottomMm: 14.5, centerCapHeightMm: 2.919 },
    },
  },
  'I.2.6': {
    title: 'Anhänger Strömungsrettung',
    referenceAsset: 'I.2.6_Anhänger Strömungsrettung.svg',
    spec: {
      kind: 'trailer',
      organization: 'hilfsorganisation',
      bodyMarks: ['trailer-diving'],
      labels: {
        center: 'Strömungsrettung', centerBaselineFromBodyBottomMm: 14.327, centerCapHeightMm: 2.191447,
      },
    },
  },
  'I.2.7': {
    title: 'Bootsanhänger',
    referenceAsset: 'I.2.7_Bootsanhänger.svg',
    spec: {
      kind: 'trailer',
      organization: 'hilfsorganisation',
      bodyMarks: ['trailer-boat-hull'],
    },
  },
} as const satisfies Record<string, Recipe>;
