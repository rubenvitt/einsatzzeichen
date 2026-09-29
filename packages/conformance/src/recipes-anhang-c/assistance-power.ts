import type { Recipe } from '../recipes.js';

export const ANHANG_C_ASSISTANCE_POWER_RECIPES = {
  'C.2.18': {
    title: 'Rüstwagen',
    referenceAsset: 'C.2.18_Rüstwagen.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      // Referenz: zwei Räder, Mitten x 3,75 und 28,25.
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['technical-assistance'],
    },
  },
  'C.2.30': {
    title: 'Feuerwehr Netzersatzanlage 120 kVA',
    referenceAsset: 'C.2.30_Feuerwehr Netzersatzanlage 120 kVA.svg',
    spec: {
      kind: 'trailer',
      bodyVariant: 'foot-band',
      organization: 'feuerwehr',
      // Referenz: ein Rad, Mitte (17,5|28,25); Deichsel y 15 ab x 1; Fußband y 23…26.
      vehicleCategory: 'anhaenger-ein-rad',
      bodyMarks: ['power-supply'],
      // Referenz: schwarzes „120“ oben links, Grundlinie y 12,5 (6,75 unter der Körperoberkante
      // 5,75), linke Tintenkante 5,76 (Anker etwa 1,5 mm rechts der Körperkante 4). Die Ziffern
      // sind 2,75 mm hoch: das ist die Ziffernhöhe beim Profilschriftgrad, keine eigene
      // Versalhöhe (wie „12/9“ in C.2.14), deshalb ohne topLeftMetrics.
      labels: { topLeft: '120', inBodyInk: 'koerperlauf-kontrast' },
    },
  },
  // LFH-787: C.1.4 steht hier und nicht bei C.1.1 bis C.1.8 in `recipes.ts`, weil es dieselbe
  // Marke wie C.2.18 trägt und `recipes.ts` Fundorte mit Zeilennummern führt. Am Ende dieser
  // Datei, damit der Fundort `assistance-power.ts:29` (C.2.30) stehen bleibt.
  'C.1.4': {
    title: 'Rüstzug einer Feuerwehr',
    referenceAsset: 'C.1.4_Rüstzug einer Feuerwehr.svg',
    spec: {
      kind: 'formation',
      organization: 'feuerwehr',
      // Referenz: drei Kreise r 1,5 bei x 11, 16 und 21, y 3,5; kein Lauf.
      strength: 'zug',
      bodyMarks: ['technical-assistance'],
    },
  },
} as const satisfies Record<string, Recipe>;
