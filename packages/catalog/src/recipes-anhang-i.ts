import type { Recipe } from './recipes.js';

export const ANHANG_I_C_RECIPES = {
  'I.1.1': {
    title: 'Wasserrettungstrupp',
    referenceAsset: 'I.1.1_Wasserrettungstrupp.svg',
    spec: {
      kind: 'formation',
      strength: 'trupp',
      bodyMarks: ['formation-two-waves-diamond'],
    },
  },
  'I.1.2': {
    title: 'Wasserrettungsgruppe',
    referenceAsset: 'I.1.2_Wasserrettungsgruppe.svg',
    spec: {
      kind: 'formation',
      strength: 'gruppe',
      bodyMarks: ['formation-two-waves-diamond'],
    },
  },
  'I.1.3': {
    title: 'Wasserrettungszug',
    referenceAsset: 'I.1.3_Wasserrettungszug.svg',
    spec: {
      kind: 'formation',
      strength: 'zug',
      bodyMarks: ['formation-two-waves-diamond'],
    },
  },
  'I.1.4': {
    title: 'Wasserrettungsverband',
    referenceAsset: 'I.1.4_Wasserrettungsverband.svg',
    spec: {
      kind: 'formation',
      technicalHeadMark: 'single-vertical-bar',
      bodyMarks: ['formation-two-waves-diamond'],
    },
  },
} as const satisfies Record<string, Recipe>;

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

/**
 * LFH-485 / Anhang I-g: vier weiße Wasserrettungsformationen. Die Wasserrettungsmarke ist die
 * separat vermessene kompakte Formationsfassung. Dreieckspaar und Winkel bleiben geometrisch
 * getrennt, damit weder die kombinierte F.1.16-Zeichnung noch eine ungeklärte Drohnensemantik
 * übernommen wird. Der Textlauf der ersten beiden Rezepte steht auf y=10,0 mm; seine aus dem
 * einzigen versalen S idealisierte Versalhöhe beträgt 2,5 mm.
 */
export const ANHANG_I_G_RECIPES = {
  // LFH-485 / Anhang I-g: Die Wasserrettungsmarke ist die separat vermessene kompakte
  // Formationsfassung. Dreieckspaar und Winkel bleiben geometrisch getrennt. Der Textlauf der
  // ersten beiden Rezepte steht auf y=10,0 mm; die idealisierte Versalhöhe beträgt 2,5 mm.
  'I.1.17': {
    title: 'Strömungsrettungstrupp',
    referenceAsset: 'I.1.17_Strömungsrettungstrupp.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'trupp',
      bodyMarks: ['formation-water-rescue-lower-zone'],
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
      bodyMarks: ['formation-water-rescue-lower-zone'],
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
      bodyMarks: ['formation-water-rescue-lower-zone', 'formation-opposed-triangles-top'],
    },
  },
  'I.1.20': {
    title: 'Trupp Drohne',
    referenceAsset: 'I.1.20_Trupp Drohne.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'trupp',
      bodyMarks: ['formation-water-rescue-lower-zone', 'formation-chevron-top'],
    },
  },
} as const satisfies Record<string, Recipe>;

const I_2_TOP_LEFT_METRICS = {
  capHeightMm: 3.18236,
  baselineFromBodyTopMm: 6.55959,
  anchorFromBodyLeftMm: 1.56869,
} as const;

/** I.2.1 bis I.2.3: die drei literalen Wasserrettungs-Landfahrzeuge aus LFH-486. */
export const ANHANG_I_B_RECIPES = {
  // LFH-486 / Anhang I-b: drei separat vermessene Wasserrettungs-Landfahrzeuge.
  'I.2.1': {
    title: 'Gerätewagen Wasserrettung, geländegängig',
    referenceAsset: 'I.2.1_Gerätewagen Wasserrettung_geländegängig.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'hilfsorganisation',
      vehicleCategory: 'kfz-kategorie-2',
      bodyMarks: ['water-rescue'],
      labels: { topLeft: 'GW', topLeftMetrics: I_2_TOP_LEFT_METRICS },
    },
  },
  'I.2.2': {
    title: 'Gerätewagen Tauchen',
    referenceAsset: 'I.2.2_Gerätewagen Tauchen.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'hilfsorganisation',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['water-rescue'],
      labels: { topLeft: 'GW Tauchen', topLeftMetrics: I_2_TOP_LEFT_METRICS },
    },
  },
  'I.2.3': {
    title: 'Gerätewagen Strömungsrettung',
    referenceAsset: 'I.2.3_Gerätewagen Strömungsrettung.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'hilfsorganisation',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['water-rescue'],
      labels: { topLeft: 'GW SR', topLeftMetrics: I_2_TOP_LEFT_METRICS },
    },
  },
  /** I.2.4 bis I.2.7: vier radlose Anhänger mit ausschließlich quellenbelegten Innenmarken. */
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
  // LFH-479/LFH-480 / Anhang I-a und I-b: die vollständige I.3-Reihe.
  'I.3.1': {
    title: 'Boot allgemein',
    referenceAsset: 'I.3.1_Boot allgemein.svg',
    spec: {
      kind: 'vehicle-water',
      bodyVariant: 'inset-hull',
      organization: 'hilfsorganisation',
    },
  },
  'I.3.2': {
    title: 'Schlauchboot',
    referenceAsset: 'I.3.2_Schlauchboot.svg',
    spec: {
      kind: 'vehicle-water',
      bodyVariant: 'inset-hull',
      organization: 'hilfsorganisation',
      labels: { center: 'Schlauch', centerCapHeightMm: 4.1395 },
    },
  },
  'I.3.3': {
    title: 'Festrumpfschlauchboot',
    referenceAsset: 'I.3.3_Festrumpfschlauchboot.svg',
    spec: {
      kind: 'vehicle-water',
      bodyVariant: 'inset-hull',
      organization: 'hilfsorganisation',
      labels: { center: 'RIB' },
    },
  },
  'I.3.4': {
    title: 'Hochwasserboot',
    referenceAsset: 'I.3.4_Hochwasserboot.svg',
    spec: {
      kind: 'vehicle-water',
      bodyVariant: 'inset-hull',
      organization: 'hilfsorganisation',
      labels: { center: 'HW' },
      bodyMarks: ['inset-hull-wheel-pair'],
    },
  },
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
  'I.3.8': {
    title: 'Rettungsboot Typ 1',
    referenceAsset: 'I.3.8_Rettungsboot_Typ 1.svg',
    spec: {
      kind: 'vehicle-water',
      bodyVariant: 'inset-hull',
      organization: 'hilfsorganisation',
      labels: { center: 'RTB 1' },
    },
  },
  'I.3.9': {
    title: 'Rettungsboot Typ 2',
    referenceAsset: 'I.3.9_Rettungsboot_Typ 2.svg',
    spec: {
      kind: 'vehicle-water',
      bodyVariant: 'inset-hull',
      organization: 'hilfsorganisation',
      labels: { center: 'RTB 2' },
    },
  },
  'I.3.10': {
    title: 'Raft',
    referenceAsset: 'I.3.10_Raft.svg',
    spec: {
      kind: 'vehicle-water',
      bodyVariant: 'inset-hull',
      organization: 'hilfsorganisation',
      labels: { center: 'Raft' },
    },
  },
  'I.3.11': {
    title: 'Feuerlöschboot',
    referenceAsset: 'I.3.11_Feuerlöschboot.svg',
    spec: {
      kind: 'vehicle-water',
      bodyVariant: 'inset-hull',
      organization: 'feuerwehr',
      bodyMarks: ['fire-fighting'],
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

/**
 * Gemeinsame Anhang-I-Aggregation. Die einzelnen LFH-Slices bleiben über ihre exakten Schlüssel
 * und die korrespondierenden technischen Reviews getrennt, werden aber nur einmal in `RECIPES`
 * eingebunden.
 */
export const ANHANG_I_RECIPES = {
  ...ANHANG_I_C_RECIPES,
  ...ANHANG_I_D_RECIPES,
  ...ANHANG_I_E_RECIPES,
  ...ANHANG_I_G_RECIPES,
  ...ANHANG_I_B_RECIPES,
  ...ANHANG_I_A_RECIPES,
  ...ANHANG_I_J_RECIPES,
} as const satisfies Record<string, Recipe>;
