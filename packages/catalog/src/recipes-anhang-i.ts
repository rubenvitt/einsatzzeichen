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
