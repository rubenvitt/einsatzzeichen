import type { Recipe } from './recipes.js';

export const ANHANG_I_D_RECIPES = {
  'I.1.5': {
    title: 'Zugtrupp Wasserrettungszug',
    referenceAsset: 'I.1.5_Zugtrupp Wasserrettungszug.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'trupp',
      bodyMarks: ['formation-water-rescue-compact', 'formation-solid-cap-3.7mm-three-hole-row'],
    },
  },
  'I.1.6': {
    title: 'Führungstrupp Wasserrettung',
    referenceAsset: 'I.1.6_Führungstrupp Wasserrettung.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'trupp',
      bodyMarks: ['formation-water-rescue-compact', 'formation-solid-cap-3mm'],
    },
  },
  'I.1.7': {
    title: 'Führungsgruppe Wasserrettung',
    referenceAsset: 'I.1.7_Führungsgruppe Wasserrettung.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'gruppe',
      bodyMarks: ['formation-water-rescue-compact', 'formation-solid-cap-3mm'],
    },
  },
  'I.1.8': {
    title: 'Führungsstaffel Wasserrettung',
    referenceAsset: 'I.1.8_Führungsstaffel Wasserrettung.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'staffel',
      bodyMarks: ['formation-water-rescue-compact', 'formation-solid-cap-3mm'],
    },
  },
} as const satisfies Record<string, Recipe>;

/**
 * LFH-485 / Anhang I-g: vier weiße Wasserrettungsformationen. Die Wasserrettungsmarke ist die
 * separat vermessene kompakte Formationsfassung. Dreieckspaar und Winkel bleiben geometrisch
 * getrennt, damit weder die kombinierte F.1.16-Zeichnung noch eine ungeklärte Drohnensemantik
 * übernommen wird. Der Textlauf der ersten beiden Rezepte steht auf y=10,0 mm; seine aus dem
 * einzigen versalen S idealisierte Versalhöhe beträgt 2,5 mm.
 */
export const ANHANG_I_G_RECIPES = {
  'I.1.17': {
    title: 'Strömungsrettungstrupp',
    referenceAsset: 'I.1.17_Strömungsrettungstrupp.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'trupp',
      bodyMarks: ['water-rescue'],
      labels: {
        center: 'Strömungsrettung',
        centerBaselineFromBodyBottomMm: 16,
        centerCapHeightMm: 2.5,
        centerBoxMarginMm: 0.5,
      },
    },
  },
  'I.1.18': {
    title: 'Strömungsrettungsgruppe',
    referenceAsset: 'I.1.18_Strömungsrettungsgruppe.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'gruppe',
      bodyMarks: ['water-rescue'],
      labels: {
        center: 'Strömungsrettung',
        centerBaselineFromBodyBottomMm: 16,
        centerCapHeightMm: 2.5,
        centerBoxMarginMm: 0.5,
      },
    },
  },
  'I.1.19': {
    title: 'Trupp Luftunterstützte Wasserrettung',
    referenceAsset: 'I.1.19_Trupp Luftunterstützte Wasserrettung.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'trupp',
      bodyMarks: ['water-rescue', 'formation-opposed-triangles-top'],
    },
  },
  'I.1.20': {
    title: 'Trupp Drohne',
    referenceAsset: 'I.1.20_Trupp Drohne.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'trupp',
      bodyMarks: ['water-rescue', 'formation-chevron-top'],
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
      labels: {
        center: 'Tauchen',
        centerAnchorFromBodyLeftMm: 8.24,
        centerBaselineFromBodyBottomMm: 14.5,
        centerCapHeightMm: 2.919,
      },
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
        center: 'Strömungsrettung',
        centerBaselineFromBodyBottomMm: 14.327,
        centerCapHeightMm: 2.191447,
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
export const ANHANG_I_J_RECIPES = {
  'I.4.1': {
    title: 'Wasserrettungsstation, ortsgebunden',
    referenceAsset: 'I.4.1_Wasserrettungsstation_ortsgebunden.svg',
    spec: {
      kind: 'circle-12',
      bodyVariant: 'raised-gable',
      organization: 'hilfsorganisation',
      bodyMarks: ['circle-two-waves-diamond'],
    },
  },
  'I.4.2': {
    title: 'Slip-Stelle',
    referenceAsset: 'I.4.2_Slip-Stelle.svg',
    spec: {
      kind: 'circle-12',
      organization: 'hilfsorganisation',
      bodyMarks: ['circle-diagonal-double-arrow-offset-bowl'],
    },
  },
  'I.4.3': {
    title: 'Anlegestelle für Boote',
    referenceAsset: 'I.4.3_Anlegestelle für Boote.svg',
    spec: {
      kind: 'circle-12',
      organization: 'hilfsorganisation',
      bodyMarks: ['circle-wide-bowl'],
    },
  },
} as const satisfies Record<string, Recipe>;
