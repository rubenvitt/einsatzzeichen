import type { Recipe } from './recipes.js';

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
