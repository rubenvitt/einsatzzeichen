import type { Recipe } from './recipes.js';

/**
 * Kapitel 5.1, die acht Behälterzeichen (ESZ-117): Wechsellader und Kraftfahrzeug mit
 * Wechselbehälter (5.1.1.8/9), die beiden Anhänger mit Behälter (5.1.2.2/3) und die vier
 * Behälter selbst (5.1.3.1 bis 5.1.3.4). Jedes ist eine eigene Körperart in
 * `core/src/geometry/container-bodies.ts`; die Rezepte stellen sie so dar, wie die Referenz sie
 * zeigt: weiss, ohne Organisation.
 *
 * Fahrwerk tragen allein die beiden Kraftfahrzeuge, und zwar das aus 5.1.1.1 — die Referenz
 * zeichnet dort zwei Räder unter dem L-Rahmen, die mit `kfz-kategorie-1` zahlengleich sind. Die
 * Anhänger 5.1.2.2/3 tragen wie 5.1.2.1 gar kein Rad; ihre Fahrwerke kommen erst über
 * `anhaenger-ein-rad` oder `anhaenger-zwei-raeder` dazu.
 */
export const KAPITEL_5_1_RECIPES = {
  '5.1.1.8': {
    title: 'Wechsellader mit Abrollbehälter',
    referenceAsset: '5.1.1.8_Kraftfahrzeug_straßenfähig_Wechsellader.svg',
    spec: { kind: 'roll-off-loader', vehicleCategory: 'kfz-kategorie-1' },
  },
  '5.1.1.9': {
    title: 'Kraftfahrzeug mit Wechselbehälter',
    referenceAsset: '5.1.1.9_Kraftfahrzeug_straßenfähig_Wechselbehälter.svg',
    spec: { kind: 'swap-container-carrier', vehicleCategory: 'kfz-kategorie-1' },
  },
  '5.1.2.2': {
    title: 'Anhänger mit Abrollbehälter',
    referenceAsset: '5.1.2.2_Anhänger_Abrollbehälter.svg',
    spec: { kind: 'roll-off-trailer' },
  },
  '5.1.2.3': {
    title: 'Anhänger mit Wechselbehälter',
    referenceAsset: '5.1.2.3_Anhänger_Wechselbehälter.svg',
    spec: { kind: 'swap-container-trailer' },
  },
  '5.1.3.1': {
    title: 'Abrollbehälter',
    referenceAsset: '5.1.3.1_Abrollbehälter.svg',
    spec: { kind: 'roll-off-container' },
  },
  '5.1.3.2': {
    title: 'Wechselbehälter',
    referenceAsset: '5.1.3.2_Wechselbehälter.svg',
    spec: { kind: 'swap-container' },
  },
  '5.1.3.3': {
    title: 'Wechselbrücke',
    referenceAsset: '5.1.3.3_Wechselbrücke.svg',
    spec: { kind: 'swap-body' },
  },
  '5.1.3.4': {
    title: 'Behälter, zieh- und schiebbar',
    referenceAsset: '5.1.3.4_Zieh- und schiebbar.svg',
    spec: { kind: 'wheeled-container' },
  },
} as const satisfies Record<string, Recipe>;
