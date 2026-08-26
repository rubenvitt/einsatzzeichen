import type { Recipe } from './recipes.js';

/**
 * Die 21 Logistikzeichen aus Anhang G. Jede Referenz ist eine eigenständige
 * primary-Darstellung; aus der ungleichmäßigen Nummerierung wird keine Vererbung abgeleitet.
 * Weiße Körper werden bis zum ausstehenden Fachreview als `hilfsorganisation` geführt,
 * einschließlich des namentlich als DLRG bezeichneten G.1.2.
 */
export const ANHANG_G_RECIPES = {
  'G.1': {
    title: 'Versorgung mit Verbrauchsgütern',
    referenceAsset: 'G.1_Versorgung mit Verbrauchsgütern.svg',
    spec: {
      kind: 'formation',
      bodyVariant: 'foot-band',
      organization: 'hilfsorganisation',
      bodyMarks: ['fuels-consumables'],
    },
  },
  'G.1.1': {
    title: 'Versorgungstrupp Feuerwehr Materialerhaltung',
    referenceAsset: 'G.1.1_Versorgungstrupp Feuerwehr_Materialerhaltung.svg',
    spec: {
      kind: 'formation',
      bodyVariant: 'foot-band',
      organization: 'feuerwehr',
      strength: 'trupp',
      bodyMarks: ['maintenance'],
    },
  },
  'G.1.2': {
    title: 'Versorgungstrupp DLRG',
    referenceAsset: 'G.1.2_Versorgungstrupp DLRG.svg',
    spec: {
      kind: 'formation',
      bodyVariant: 'foot-band',
      organization: 'hilfsorganisation',
      strength: 'trupp',
      bodyMarks: ['catering'],
      labels: { bottomRight: 'DLRG' },
    },
  },
  'G.1.3': {
    title: 'Versorgungstrupp Feuerwehr Verbrauchsgüter',
    referenceAsset: 'G.1.3_Versorgungstrupp Feuerwehr_Verbrauchsgüter.svg',
    spec: {
      kind: 'formation',
      bodyVariant: 'foot-band',
      organization: 'feuerwehr',
      strength: 'trupp',
      bodyMarks: ['fuels-consumables'],
    },
  },
  'G.1.4': {
    title: 'Verpflegungszug',
    referenceAsset: 'G.1.4_Verpflegungszug.svg',
    spec: {
      kind: 'formation',
      bodyVariant: 'foot-band',
      organization: 'hilfsorganisation',
      strength: 'zug',
      bodyMarks: ['catering'],
    },
  },
  'G.1.5': {
    title: 'Instandhaltungsgruppe',
    referenceAsset: 'G.1.5_Instandhaltungsgruppe.svg',
    spec: {
      kind: 'formation',
      bodyVariant: 'foot-band',
      organization: 'hilfsorganisation',
      strength: 'gruppe',
      bodyMarks: ['maintenance'],
    },
  },
  'G.2': {
    title: 'Versorgung mit Trinkwasser',
    referenceAsset: 'G.2_Versorgung mit Trinkwasser.svg',
    spec: {
      kind: 'formation',
      bodyVariant: 'foot-band',
      organization: 'hilfsorganisation',
      bodyMarks: ['drinking-water'],
    },
  },
  'G.2.1': {
    title: 'Fahrzeug Instandhaltung',
    referenceAsset: 'G.2.1_Fahrzeug Instandhaltung.svg',
    spec: {
      kind: 'vehicle-land',
      bodyVariant: 'foot-band',
      organization: 'hilfsorganisation',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['maintenance'],
    },
  },
  'G.2.2': {
    title: 'Anhänger Technik Sicherheit',
    referenceAsset: 'G.2.2_Anhänger Technik Sicherheit.svg',
    spec: {
      kind: 'trailer',
      bodyVariant: 'foot-band',
      organization: 'hilfsorganisation',
      vehicleCategory: 'anhaenger-ein-rad',
      bodyMarks: ['maintenance'],
    },
  },
  'G.2.3': {
    title: 'Geräteanhänger Feldkochherd',
    referenceAsset: 'G.2.3_Geräteanhänger Feldkochherd.svg',
    spec: {
      kind: 'trailer',
      bodyVariant: 'foot-band',
      organization: 'hilfsorganisation',
      vehicleCategory: 'anhaenger-zwei-raeder',
      bodyMarks: ['meal-preparation'],
    },
  },
  'G.3': {
    title: 'Versorgung mit Brauchwasser',
    referenceAsset: 'G.3_Versorgung mit Brauchwasser.svg',
    spec: {
      kind: 'formation',
      bodyVariant: 'foot-band',
      organization: 'hilfsorganisation',
      bodyMarks: ['water-conveyance'],
    },
  },
  'G.3.1': {
    title: 'Verpflegungsstelle betrieben durch Feuerwehr',
    referenceAsset: 'G.3.1_Verpflegungsstelle_betrieben durch Feuerwehr.svg',
    spec: {
      kind: 'circle-12',
      bodyVariant: 'foot-band',
      organization: 'feuerwehr',
      bodyMarks: ['catering'],
    },
  },
  'G.3.2': {
    title: 'Verpflegungszubereitungsstelle Polizei',
    referenceAsset: 'G.3.2_Verpflegungszubereitungsstelle_betrieben durch Polizei.svg',
    spec: {
      kind: 'circle-12',
      bodyVariant: 'foot-band',
      organization: 'polizei',
      bodyMarks: ['meal-preparation'],
    },
  },
  'G.3.3': {
    title: 'Versorgungsstelle Hilfsorganisation',
    referenceAsset: 'G.3.3_Versorgungsstelle Hilfsorganisation.svg',
    spec: {
      kind: 'circle-12',
      bodyVariant: 'foot-band',
      organization: 'hilfsorganisation',
      bodyMarks: ['fuels-consumables'],
    },
  },
  'G.3.4': {
    title: 'Zentrale Stelle Notversorgung',
    referenceAsset: 'G.3.4_Zentrale Stelle Notversorgung.svg',
    spec: {
      kind: 'circle-12',
      bodyVariant: 'foot-band',
      organization: 'fuehrung-leitung',
      bodyMarks: ['maintenance'],
    },
  },
  'G.3.5': {
    title: 'Mobiler Tankpunkt Diesel Bundeswehr',
    referenceAsset: 'G.3.5_Mobiler Tankpunkt Diesel_betrieben durch Bundeswehr.svg',
    spec: {
      kind: 'circle-12',
      bodyVariant: 'foot-band',
      organization: 'bundeswehr',
      bodyMarks: ['fuels-consumables'],
      labels: { bottomCenter: 'Diesel', belowRight: 'Bw' },
    },
  },
  'G.4': {
    title: 'Versorgung mit Elektrizität',
    referenceAsset: 'G.4_Versorgung mit Elektrizität.svg',
    spec: {
      kind: 'formation',
      bodyVariant: 'foot-band',
      organization: 'hilfsorganisation',
      bodyMarks: ['power-supply'],
    },
  },
  'G.5': {
    title: 'Versorgung mit Verpflegung',
    referenceAsset: 'G.5_Versorgung mit Verpflegung.svg',
    spec: {
      kind: 'formation',
      bodyVariant: 'foot-band',
      organization: 'hilfsorganisation',
      bodyMarks: ['catering'],
    },
  },
  'G.6': {
    title: 'Zubereiten von Verpflegung',
    referenceAsset: 'G.6_Zubereiten von Verpflegung.svg',
    spec: {
      kind: 'formation',
      bodyVariant: 'foot-band',
      organization: 'hilfsorganisation',
      bodyMarks: ['meal-preparation'],
    },
  },
  'G.7': {
    title: 'Instandhaltung',
    referenceAsset: 'G.7_Instandhaltung.svg',
    spec: {
      kind: 'formation',
      bodyVariant: 'foot-band',
      organization: 'hilfsorganisation',
      bodyMarks: ['maintenance'],
    },
  },
  'G.8': {
    title: 'Entsorgung',
    referenceAsset: 'G.8_Entsorgung.svg',
    spec: {
      kind: 'formation',
      bodyVariant: 'foot-band',
      organization: 'hilfsorganisation',
      bodyMarks: ['waste-disposal'],
    },
  },
} as const satisfies Record<string, Recipe>;
