import type { Recipe } from './recipes.js';

/** Erster migrierter Verbraucher des gemessenen Anhang-D-Funktionsvertrags. */
export const ANHANG_D_TASK_2_RECIPES = {
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
