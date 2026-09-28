import type { StateGroupId, ZoneBoundsMm } from '@einsatzzeichen/schema';

/**
 * Die sieben Beispielzeichen aus Kapitel 5.8 als Fixtures der Zustandsgruppen (LFH-565).
 *
 * D.2 hat sie bewusst ohne Manifestzeile gelassen und „einer späteren Rezept-/Conformance-
 * Coverageaufgabe" zugewiesen (`docs/decisions/2026-08-07-kapitel-5-8-zustaende-d2.md` §7). Im
 * Referenzinventar stehen sie weiter als `disposition: 'example'`. Hier bekommen sie ihre Rolle als
 * Testfall der Grammatik: sie belegen Zone und Träger ihrer Gruppe in `STATE_GROUPS`
 * (`core/src/blocks/state-groups.ts`).
 *
 * **Was abgelesen ist und was nicht.** Die Referenzdateien sind nicht eingecheckt. Abgelesen ist
 * deshalb am Kennzahlenartefakt `fingerprints.json`, das nur Zeichenfläche und Hüllen gefüllter
 * Flächen führt. Der Träger ist gefüllt und damit ablesbar. Die Marke ist ein umgewandelter Pfad
 * ohne Hülle und damit nicht ablesbar. Jede Zahl unten hält `state-group-fixtures.test.ts` gegen
 * das Artefakt fest; wird es neu erzeugt und die Zahl weicht ab, fällt das dort auf.
 */
export interface StateGroupFixture {
  readonly asset: `${string}.svg`;
  readonly group: StateGroupId;
  /** Zeichenfläche des Beispiels in Millimetern. */
  readonly canvasMm: { readonly width: number; readonly height: number };
  /** Hülle des gefüllten Trägers im Beispiel. */
  readonly carrierHullMm: ZoneBoundsMm;
  /** Woran der Träger zu erkennen ist. */
  readonly carrierShape: 'rotated-square' | 'filled-bounds';
  /** Die Darstellung derselben Gruppe, mit der der Träger verglichen wird, oder `null`. */
  readonly comparedWith: `${string}.svg` | null;
}

const TACTICS_CANVAS = { width: 36, height: 32 } as const;
const PERSON_RIGHT: ZoneBoundsMm = { minX: 15, minY: 6, maxX: 35, maxY: 26 };
const PERSON_LEFT: ZoneBoundsMm = { minX: 11, minY: 6, maxX: 31, maxY: 26 };

const WEATHER_CANVAS = { width: 32, height: 32 } as const;
/** Die Wolke aus 5.8.7.2, um 3 mm angehoben. */
const RAISED_CLOUD: ZoneBoundsMm = { minX: 1, minY: 3, maxX: 31, maxY: 21.001 };

function tactics(asset: `${string}.svg`, carrierHullMm: ZoneBoundsMm): StateGroupFixture {
  return {
    asset,
    group: 'tactics-hazards',
    canvasMm: TACTICS_CANVAS,
    carrierHullMm,
    carrierShape: 'rotated-square',
    comparedWith: null,
  };
}

function weather(asset: `${string}.svg`): StateGroupFixture {
  return {
    asset,
    group: 'weather',
    canvasMm: WEATHER_CANVAS,
    carrierHullMm: RAISED_CLOUD,
    carrierShape: 'filled-bounds',
    comparedWith: '5.8.7.2_Wolkig.svg',
  };
}

export const STATE_GROUP_FIXTURES: readonly StateGroupFixture[] = Object.freeze([
  tactics('5.8.1_Beispiel 1.svg', PERSON_RIGHT),
  tactics('5.8.1_Beispiel 2.svg', PERSON_RIGHT),
  tactics('5.8.1_Beispiel 3.svg', PERSON_LEFT),
  weather('5.8.7_Beispiel_Schneiend_schwach.svg'),
  weather('5.8.7_Beispiel_Schneiend_mittel.svg'),
  weather('5.8.7_Beispiel_Schneiend_stark.svg'),
  weather('5.8.7_Beispiel_Schneiend_extrem.svg'),
]);
