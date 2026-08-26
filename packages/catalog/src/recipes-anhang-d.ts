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
