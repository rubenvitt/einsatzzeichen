import type { Recipe } from './recipes.js';

export const ANHANG_I_A_RECIPES = {
  'I.5.1': {
    title: 'Einsatzkraft Wasserrettung',
    referenceAsset: 'I.5.1_Einsatzkraft Wasserrettung.svg',
    spec: {
      kind: 'person',
      bodyVariant: 'compact-person-diamond-26mm',
      technicalFill: 'weiss',
      bodyMarks: ['double-wave-inner-diamond-8mm'],
    },
  },
  'I.5.2': {
    title: 'Strömungsretter',
    referenceAsset: 'I.5.2_Strömungsretter.svg',
    spec: {
      kind: 'person',
      bodyVariant: 'compact-person-diamond-26mm-lowered-2mm',
      technicalFill: 'weiss',
      bodyMarks: ['double-wave-inner-diamond-8mm'],
      labels: {
        aboveLeft: 'Strömungsretter',
        aboveLeftMetrics: {
          capHeightMm: 2.432746,
          anchorFromBodyLeftMm: -2,
          baselineFromBodyTopMm: -1.5,
        },
      },
    },
  },
  'I.5.3': {
    title: 'Taucher',
    referenceAsset: 'I.5.3_Taucher.svg',
    spec: {
      kind: 'person',
      bodyVariant: 'compact-person-diamond-26mm-lowered-2mm',
      technicalFill: 'weiss',
      bodyMarks: ['double-wave-inner-diamond-8mm'],
      labels: {
        aboveLeft: 'Taucher',
        aboveLeftMetrics: {
          capHeightMm: 2.919225,
          anchorFromBodyLeftMm: -2,
          baselineFromBodyTopMm: -1,
        },
      },
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
} as const satisfies Record<string, Recipe>;
