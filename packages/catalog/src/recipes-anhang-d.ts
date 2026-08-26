import type { Recipe } from './recipes.js';

/** Die neun D.1-Kompositionen; D.1.9 bleibt absichtlich außerhalb des Rollenvertrags. */
export const ANHANG_D_TASK_3_RECIPES = {
  'D.1.2': {
    title: 'Katastrophenschutzleitung im Einsatz',
    referenceAsset: 'D.1.2_Katastrophenschutzleitung im Einsatz.svg',
    spec: {
      kind: 'formation',
      organization: 'fuehrung-leitung',
      functionRole: 'disaster-control-command',
    },
  },
  'D.1.3': {
    title: 'Technische Einsatzleitung Evakuierung im Einsatz',
    referenceAsset: 'D.1.3_Technische Einsatzleitung Evakuierung im Einsatz.svg',
    spec: {
      kind: 'formation',
      organization: 'fuehrung-leitung',
      functionRole: 'technical-incident-command-evacuation',
    },
  },
  'D.1.4': {
    title: 'Einsatzleitung im Einsatz',
    referenceAsset: 'D.1.4_Einsatzleitung im Einsatz.svg',
    spec: {
      kind: 'formation',
      organization: 'fuehrung-leitung',
      functionRole: 'incident-command',
    },
  },
  'D.1.5': {
    title: 'Einsatzabschnittsleitung Nord im Einsatz',
    referenceAsset: 'D.1.5_Einsatzabschnittsleitung Nord im Einsatz.svg',
    spec: {
      kind: 'formation',
      organization: 'fuehrung-leitung',
      functionRole: 'incident-section-command-north',
    },
  },
  'D.1.6': {
    title: 'Unterabschnittsleitung im Einsatz',
    referenceAsset: 'D.1.6._Unterabschnittsleitung im Einsatz.svg',
    spec: {
      kind: 'formation',
      organization: 'fuehrung-leitung',
      functionRole: 'incident-subsection-command',
    },
  },
  'D.1.7': {
    title: 'Führungsgruppe TEL',
    referenceAsset: 'D.1.7_Führungsgruppe TEL.svg',
    spec: {
      kind: 'formation',
      organization: 'fuehrung-leitung',
      strength: 'gruppe',
      functionRole: 'technical-incident-command-group',
    },
  },
  'D.1.8': {
    title: 'Führungsgruppe einer Feuerwehrbereitschaft',
    referenceAsset: 'D.1.8_Führungsgruppe einer Feuerwehrbereitschaft.svg',
    spec: {
      kind: 'formation',
      organization: 'feuerwehr',
      strength: 'gruppe',
      functionRole: 'fire-service-readiness-command-group',
    },
  },
  'D.1.9': {
    title: 'Zugtrupp einer Sanitätseinheit',
    referenceAsset: 'D.1.9_Zugtrupp einer Sanitätseinheit.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'trupp',
      bodyMarks: ['medical-service', 'formation-solid-cap-3mm'],
    },
  },
  'D.1.9#alternative': {
    title: 'Zugtrupp einer Sanitätseinheit',
    referenceAsset: 'D.1.9_Zugtrupp einer Sanitätseinheit_Alternative.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'trupp',
      bodyMarks: ['medical-service', 'formation-solid-cap-4mm-three-hole-row'],
    },
  },
} as const satisfies Record<string, Recipe>;

/** Erster migrierter Verbraucher plus die folgenden D.1-Rezepte im gemeinsamen Datenpfad. */
export const ANHANG_D_TASK_2_RECIPES = {
  ...ANHANG_D_TASK_3_RECIPES,
  'D.3.7': {
    title: 'Zugführer der Feuerwehr',
    referenceAsset: 'D.3.7_Zugführer der Feuerwehr.svg',
    spec: {
      kind: 'person',
      organization: 'feuerwehr',
      strength: 'zug',
      functionRole: 'fire-service-platoon-commander',
      bodyMarks: ['fire-fighting'],
    },
  },
} as const satisfies Record<string, Recipe>;

/** D.3.1 bis D.3.13 vollständig; D.3.7 bleibt dasselbe migrierte Rezeptobjekt aus Task 2. */
export const ANHANG_D_TASK_5_RECIPES = {
  ...ANHANG_D_TASK_3_RECIPES,
  'D.3.1': {
    title: 'Technischer Einsatzleiter',
    referenceAsset: 'D.3.1_Technischer Einsatzleiter LK Ahrweiler.svg',
    spec: {
      kind: 'person',
      organization: 'fuehrung-leitung',
      administrativeLevel: 'kreis',
      functionRole: 'technical-incident-commander',
    },
  },
  'D.3.2': {
    title: 'Einsatzleiter',
    referenceAsset: 'D.3.2_Einsatzleiter.svg',
    spec: {
      kind: 'person',
      organization: 'fuehrung-leitung',
      functionRole: 'incident-commander',
    },
  },
  'D.3.3': {
    title: 'Leitender Notarzt',
    referenceAsset: 'D.3.3_Leitender Notarzt.svg',
    spec: {
      kind: 'person',
      organization: 'fuehrung-leitung',
      administrativeLevel: 'kreis',
      functionRole: 'lead-emergency-physician',
    },
  },
  'D.3.4': {
    title: 'Organisatorischer Leiter',
    referenceAsset: 'D.3.4_Organisatorischer Leiter.svg',
    spec: {
      kind: 'person',
      organization: 'fuehrung-leitung',
      administrativeLevel: 'kreis',
      functionRole: 'organizational-incident-commander',
    },
  },
  'D.3.5': {
    title: 'Einsatzabschnittsleiter',
    referenceAsset: 'D.3.5_Einsatzabschnittsleiter.svg',
    spec: {
      kind: 'person',
      organization: 'fuehrung-leitung',
      functionRole: 'incident-section-commander',
    },
  },
  'D.3.6': {
    title: 'Untereinsatzabschnittsleiter',
    referenceAsset: 'D.3.6_Untereinsatzabschnittsleiter.svg',
    spec: {
      kind: 'person',
      organization: 'fuehrung-leitung',
      functionRole: 'incident-subsection-commander',
    },
  },
  'D.3.7': ANHANG_D_TASK_2_RECIPES['D.3.7'],
  'D.3.8': {
    title: 'Zugführer Technischer Zug',
    referenceAsset: 'D.3.8_Zugführer Technischer Zug THW.svg',
    spec: {
      kind: 'person',
      organization: 'thw',
      strength: 'zug',
      functionRole: 'technical-platoon-commander',
    },
  },
  'D.3.9': {
    title: 'Zugführer Sanitätszug',
    referenceAsset: 'D.3.9_Zugführer Sanitätszug ASB.svg',
    spec: {
      kind: 'person',
      organization: 'hilfsorganisation',
      strength: 'zug',
      functionRole: 'medical-platoon-commander',
      bodyMarks: ['medical-service'],
    },
  },
  'D.3.10': {
    title: 'Zugführer Einsatzeinheit',
    referenceAsset: 'D.3.10_Zugführer Einsatzeinheit DRK.svg',
    spec: {
      kind: 'person',
      organization: 'hilfsorganisation',
      strength: 'zug',
      functionRole: 'operational-unit-platoon-commander',
      bodyMarks: ['medical-service', 'care'],
    },
  },
  'D.3.11': {
    title: 'Zugführer Betreuungszug',
    referenceAsset: 'D.3.11_Zugführer Betreuungszug ASB.svg',
    spec: {
      kind: 'person',
      organization: 'hilfsorganisation',
      strength: 'zug',
      functionRole: 'care-platoon-commander',
      bodyMarks: ['care'],
    },
  },
  'D.3.12': {
    title: 'Gruppenführer Betreuungsgruppe',
    referenceAsset: 'D.3.12_Gruppenführer Betreuungsgruppe Malteser.svg',
    spec: {
      kind: 'person',
      organization: 'hilfsorganisation',
      strength: 'gruppe',
      functionRole: 'care-group-commander',
      bodyMarks: ['care'],
    },
  },
  'D.3.13': {
    title: 'Gruppenführer Schnell-Einsatzgruppe',
    referenceAsset: 'D.3.13_Gruppenführer Schnell-Einsatzgruppe Johanniter.svg',
    spec: {
      kind: 'person',
      organization: 'hilfsorganisation',
      strength: 'gruppe',
      functionRole: 'rapid-response-group-commander',
    },
  },
} as const satisfies Record<string, Recipe>;

/** Anhang D vollständig: fünf übergeordnete Funktionsträger aus den gemessenen D.4-Rollen. */
export const ANHANG_D_TASK_6_RECIPES = {
  ...ANHANG_D_TASK_5_RECIPES,
  'D.4.1': {
    title: 'Leiter Kreisleitstelle Steinfurt',
    referenceAsset: 'D.4.1_Leiter Kreisleitstelle Steinfurt.svg',
    spec: {
      kind: 'person',
      organization: 'fuehrung-leitung',
      administrativeLevel: 'kreis',
      functionRole: 'district-control-center-director',
    },
  },
  'D.4.2': {
    title: 'Kreisbrandmeister Mettmann',
    referenceAsset: 'D.4.2_Kreisbrandmeister Mettmann.svg',
    spec: {
      kind: 'person',
      organization: 'feuerwehr',
      administrativeLevel: 'kreis',
      functionRole: 'district-fire-chief',
    },
  },
  'D.4.3': {
    title: 'Leiter Gefahrenabwehr Mönchengladbach',
    referenceAsset: 'D.4.3_Leiter Gefahrenabwehr Mönchengladbach.svg',
    spec: {
      kind: 'person',
      organization: 'fuehrung-leitung',
      administrativeLevel: 'kreis',
      functionRole: 'hazard-response-director',
    },
  },
  'D.4.4': {
    title: 'Leiter Gefahrenabwehrkräfte Bundespolizei',
    referenceAsset: 'D.4.4_Leiter Gefahrenabwehrkräfte Bundespolizei.svg',
    spec: {
      kind: 'person',
      organization: 'polizei',
      administrativeLevel: 'nationalstaat',
      functionRole: 'hazard-response-forces-director',
    },
  },
  'D.4.5': {
    title: 'Leiter internationalen Hilfsaktion',
    referenceAsset: 'D.4.5_Leiter internationalen Hilfsaktion.svg',
    spec: {
      kind: 'person',
      organization: 'fuehrung-leitung',
      administrativeLevel: 'europaeische-union',
      functionRole: 'international-relief-operation-director',
    },
  },
} as const satisfies Record<string, Recipe>;
