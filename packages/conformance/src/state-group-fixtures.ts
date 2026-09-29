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

/**
 * Referenzdateien außerhalb der sieben Beispiele, die einen Zustand an einem Träger zeigen —
 * gefunden bei der Durchsicht aller 661 Referenzdateien am 29. September 2026 (LFH-577). Die
 * Marken selbst sind an den Dateien vermessen (`core/src/layout/state-placement.ts`); hier steht,
 * was davon das Kennzahlenartefakt erfasst, damit `state-group-fixtures.test.ts` es festhält.
 */
export interface StateCarrierEvidence {
  readonly asset: `${string}.svg`;
  readonly group: StateGroupId;
  /** Ob die erfasste Fläche den Träger oder die Marke belegt. */
  readonly role: 'carrier' | 'mark';
  /** Die Fläche, wie das Artefakt sie führt. */
  readonly shape: {
    readonly kind: 'bounds' | 'rect' | 'outline';
    readonly fill?: '#ffffff' | '#fa1919';
    readonly rotate?: number;
    readonly boundsMm: ZoneBoundsMm;
  };
  /** Die eigenständige Darstellung, mit der die Fläche verglichen wird, oder `null`. */
  readonly comparedWith: `${string}.svg` | null;
}

/** Das auf 23 × 19 mm verkleinerte Dreieck der Hinweise an der Gefahr. */
const HINT_TRIANGLE: ZoneBoundsMm = { minX: 7.5, minY: 6, maxX: 30.5, maxY: 25 };

export const STATE_CARRIER_EVIDENCE: readonly StateCarrierEvidence[] = Object.freeze([
  {
    asset: '5.8.1.13_Hinweis auf Vermutung_2.svg',
    group: 'tactics-hazards',
    role: 'carrier',
    shape: { kind: 'bounds', fill: '#ffffff', boundsMm: HINT_TRIANGLE },
    comparedWith: '1.11_Gefahr.svg',
  },
  {
    asset: '5.8.1.14_Hinweis auf akute Situation_2.svg',
    group: 'tactics-hazards',
    role: 'carrier',
    shape: { kind: 'bounds', fill: '#ffffff', boundsMm: HINT_TRIANGLE },
    comparedWith: '1.11_Gefahr.svg',
  },
  {
    asset: 'M.6_Akute Gefahr_Spotfeuer.svg',
    group: 'tactics-hazards',
    role: 'carrier',
    shape: { kind: 'bounds', fill: '#ffffff', boundsMm: { minX: 1, minY: 3, maxX: 31, maxY: 28 } },
    comparedWith: '1.11_Gefahr.svg',
  },
  {
    asset: 'L.9_Deichbruch.svg',
    group: 'damage',
    role: 'mark',
    shape: { kind: 'outline', boundsMm: { minX: 4.156, minY: 4.156, maxX: 27.844, maxY: 27.844 } },
    comparedWith: '5.8.4.2_Teilzerstört.svg',
  },
  {
    asset: 'L.8_Schäden am Außendeich.svg',
    group: 'damage',
    role: 'mark',
    shape: {
      kind: 'bounds',
      fill: '#fa1919',
      boundsMm: { minX: 9.08, minY: 11.581, maxX: 17.919, maxY: 20.419 },
    },
    comparedWith: '5.8.4.1_Angeschlagen.svg',
  },
  {
    asset: '5.8.8.3_Person Verletzt.svg',
    group: 'persons',
    role: 'carrier',
    shape: { kind: 'rect', fill: '#ffffff', rotate: 45, boundsMm: { minX: 3, minY: 3, maxX: 29, maxY: 29 } },
    comparedWith: null,
  },
  {
    asset: '5.8.8.12_Person zu transportieren.svg',
    group: 'persons',
    role: 'carrier',
    // Die Füllfläche ist ein Polygon, das das Artefakt nicht erfasst; belegt ist der Umriss samt Pfeil.
    shape: { kind: 'outline', boundsMm: { minX: 2.647, minY: 0.647, maxX: 30.354, maxY: 31.177 } },
    comparedWith: null,
  },
  {
    asset: '5.8.8.9_Person in Wassergefahr.svg',
    group: 'persons',
    role: 'carrier',
    shape: {
      kind: 'rect',
      fill: '#ffffff',
      rotate: 45,
      boundsMm: { minX: 5.5, minY: 10, maxX: 26.5, maxY: 31 },
    },
    comparedWith: null,
  },
] satisfies readonly StateCarrierEvidence[]);
