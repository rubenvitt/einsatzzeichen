import type { Recipe } from './recipes.js';

/**
 * Gemeinsame Anhang-I-Aggregation. Die einzelnen LFH-Slices bleiben über ihre exakten Schlüssel
 * und die korrespondierenden technischen Reviews getrennt, werden aber nur einmal in `RECIPES`
 * eingebunden.
 */
export const ANHANG_I_RECIPES = {
  // LFH-482 / Anhang I-d: vier separat vermessene Wasserrettungs-Führungsformationen.
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
