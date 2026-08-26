import type { Recipe } from './recipes.js';

/**
 * Anhang N: sechs Fahrzeuge weiterer Träger und drei Zeichen für Spontanhelfende bzw. einen
 * Notfallinformationspunkt. Die Trägerzuordnungen bilden ausschließlich die vermessenen
 * Organisationsfarben ab; ihre fachliche Bestätigung bleibt ausstehend. Insbesondere erzeugt
 * der Dateinamensbestandteil „geländegängig“ keine zusätzliche Semantik.
 */
export const ANHANG_N_RECIPES = {
  'N.1.1': {
    title: 'Bergeräumpanzer Bundeswehr',
    referenceAsset: 'N.1.1_Bergeräumpanzer_Bundeswehr.svg',
    spec: {
      kind: 'vehicle-land',
      bodyVariant: 'inverted-hull-track',
      organization: 'bundeswehr',
      vehicleCategory: 'kettenfahrzeug',
      bodyMarks: ['land-horizontal-blade-bent-upright'],
    },
  },
  'N.1.2': {
    title: 'Transportfahrzeug kommunaler Bauhof, geländegängig',
    referenceAsset: 'N.1.2_Transportfahrzeug_kommunaler Bauhof_geländegängig.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'sonstige-gefahrenabwehr',
      vehicleCategory: 'kfz-kategorie-2',
      bodyMarks: ['ring-5mm-offset-down-3-5mm-eight-spokes'],
      labels: { inBodyInk: 'schwarz', topLeftLines: ['Kipper,', '26 t'] },
    },
  },
  'N.1.3': {
    title: 'Einsatzfahrzeug Bundespolizei',
    referenceAsset: 'N.1.3_Einsatzfahrzeug_Bundespolizei.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'bundespolizei',
      vehicleCategory: 'kfz-kategorie-1',
      labels: { inBodyInk: 'schwarz', center: 'BuPol', centerBaselineFromBodyBottomMm: 6.5 },
    },
  },
  'N.1.4': {
    title: 'Drehflügler Bundeswehr CH-53, Außentraglast 7 t',
    referenceAsset: 'N.1.4_Drehflügler_Bundeswehr_CH-53_Außentraglast 7t.svg',
    spec: {
      kind: 'vehicle-air',
      bodyVariant: 'raised-hull',
      organization: 'bundeswehr',
      bodyMarks: ['air-quartering-up-arrow-box'],
      labels: {
        inBodyInk: 'schwarz',
        aboveLeft: 'CH-53',
        aboveLeftMetrics: {
          capHeightMm: 2.919225,
          baselineFromBodyTopMm: -1,
          anchorFromBodyLeftMm: -0.01,
        },
        bottomRight: '7',
        bottomRightMetrics: {
          capHeightMm: 2.750245,
          baselineFromBodyTopMm: 13.000087,
          anchorFromBodyLeftMm: 21.99,
          boxLeftFromBodyLeftMm: 19.24,
          boxWidthMm: 5.5,
        },
        surfaceBelowRight: 'BW',
      },
    },
  },
  'N.1.5': {
    title: 'Löschflugzeug Beauftragter Dritter, 5.000 l',
    referenceAsset: 'N.1.5_Löschflugzeug_Beauftragter Dritter_5.000l.svg',
    spec: {
      kind: 'vehicle-air',
      bodyVariant: 'fixed-wing-hull',
      organization: 'sonstige-gefahrenabwehr',
      bodyMarks: ['air-horizontal-left-chevron'],
      labels: {
        inBodyInk: 'schwarz',
        topLeft: '5.000',
        topLeftMetrics: {
          capHeightMm: 2.919225,
          baselineFromBodyTopMm: 7,
          anchorFromBodyLeftMm: 5.99,
        },
      },
    },
  },
  'N.1.6': {
    title: 'Erkundungsflugzeug Feuerwehr Cessna 172',
    referenceAsset: 'N.1.6_Erkundungsflugzeug_Feuerwehr_Cessna 172.svg',
    spec: {
      kind: 'vehicle-air',
      bodyVariant: 'fixed-wing-hull',
      organization: 'feuerwehr',
      bodyMarks: ['air-rising-diagonal'],
      labels: {
        aboveLeft: 'Cessna 172',
        aboveLeftMetrics: {
          capHeightMm: 2.919225,
          baselineFromBodyTopMm: -1,
          anchorFromBodyLeftMm: -0.01,
        },
      },
    },
  },
  'N.2.1': {
    title: 'Sammelraum Spontanhelfer',
    referenceAsset: 'N.2.1_Sammelraum_Spontanhelfer.svg',
    spec: {
      kind: 'circle-12',
      organization: 'zivile-einheiten',
      bodyMarks: ['spontaneous-helper-collection-arrow'],
    },
  },
  'N.2.2': {
    title: 'Kontaktstelle Spontanhelfer',
    referenceAsset: 'N.2.2_Kontaktstelle_Spontanhelfer.svg',
    spec: {
      kind: 'circle-12',
      organization: 'feuerwehr',
      bodyMarks: ['spontaneous-helper-contact-double-arrow'],
    },
  },
  'N.2.3': {
    title: 'Notfallinformationspunkt',
    referenceAsset: 'N.2.3_Notfallinformationspunkt.svg',
    spec: {
      kind: 'circle-12',
      bodyVariant: 'raised-circle-1mm',
      organization: 'zivile-einheiten',
      bodyMarks: ['circle-information-stem'],
      labels: { surfaceBelowLeft: '291300', surfaceBelowRight: 'ZIV' },
    },
  },
} as const satisfies Record<string, Recipe>;
