import { ANHANG_C_ASSISTANCE_POWER_RECIPES } from './recipes-anhang-c/assistance-power.js';
import { ANHANG_C_CBRN_TRANSPORT_WATER_RECIPES } from './recipes-anhang-c/cbrn-transport-water.js';
import { ANHANG_C_FIRE_FIGHTING_RECIPES } from './recipes-anhang-c/fire-fighting.js';
import { ANHANG_C_HEIGHT_RESCUE_LIFTING_RECIPES } from './recipes-anhang-c/height-rescue-lifting.js';

/**
 * Die C.2-Fixtures aus LFH-786: jede Darstellung aus C.2, die ein Kapitel-4-Piktogramm im Körper
 * trägt. C.2.1 bis C.2.3, C.2.19, C.2.21 und C.2.22 tragen keines und gehören nicht dazu.
 *
 * Seit LFH-787 steht hier auch eine C.1-Fixture: C.1.4 (Rüstzug) trägt dieselbe Technische
 * Hilfeleistung wie C.2.18 und steht deshalb in dessen Familiendatei (`assistance-power.ts`).
 * C.1.1 bis C.1.3, C.1.7 und C.1.8 bleiben in `recipes.ts`.
 */
export const ANHANG_C_2_RECIPES = {
  ...ANHANG_C_FIRE_FIGHTING_RECIPES,
  ...ANHANG_C_HEIGHT_RESCUE_LIFTING_RECIPES,
  ...ANHANG_C_CBRN_TRANSPORT_WATER_RECIPES,
  ...ANHANG_C_ASSISTANCE_POWER_RECIPES,
};
