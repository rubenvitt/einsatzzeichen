import type { Recipe } from '../recipes.js';

/*
 * C.2.4 bis C.2.13, C.2.29 und C.2.31: Brandbekämpfung (4.3.1) randbündig am Landfahrzeug, am
 * Anhänger und am Kettenfahrzeug (LFH-786). Die Körperfassungen stehen in
 * `core/src/geometry/body-marks-anhang-c/fire-fighting.ts`.
 *
 * Fahrwerk aus der Geometrie abgelesen: zwei Räder bei x 3,75 / 28,25 → Kategorie 1, drei Räder
 * (zusätzlich x 16) → Kategorie 2 (nur C.2.10), der Anhänger mit einem Rad bei x 17,5, die
 * Löschdrohne mit der Kette des Kettenfahrzeugs.
 *
 * Beschriftung: Versalhöhe 2,9192 mm (`F` 9,5807…12,4999 in C.2.6), Grundlinie 12,5 mm =
 * 6,75 mm unter der Körperoberkante 5,75, linke Tintenkante 2,5887 (`T`) bzw. 2,8677 (`K`) —
 * zurückgerechnet mit dem Arimo-Seitenlager (T 46, K 168 von 2048 Einheiten bei 4,2431 mm
 * Schriftgrad) auf den Anker 2,494 bzw. 2,520, also den Profildefault 1,5 mm ab der linken
 * Körperkante. Nur C.2.10 weicht ab (`topLeftMetrics`, siehe dort).
 */

/** Kurzform der Löschfahrzeuge C.2.4 bis C.2.13 mit Profildefault-Beschriftung. */
function landFireFighting(
  title: string,
  referenceAsset: string,
  topLeft: string,
): Recipe {
  return {
    title,
    referenceAsset,
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['fire-fighting'],
      labels: { inBodyInk: 'koerperlauf-kontrast', topLeft },
    },
  };
}

export const ANHANG_C_FIRE_FIGHTING_RECIPES = {
  'C.2.4': landFireFighting(
    'Tragkraftspritzenfahrzeug',
    'C.2.4_Tragkraftspritzenfahrzeug.svg',
    'TSF',
  ),
  'C.2.5': landFireFighting(
    'Tragkraftspritzenfahrzeug mit Wasser',
    'C.2.5_Tragkraftspritzenfahrzeug mit Wasser.svg',
    'TSF-W',
  ),
  'C.2.6': landFireFighting('Kleinlöschfahrzeug', 'C.2.6_Kleinlöschfahrzeug.svg', 'KLF'),
  'C.2.7': landFireFighting(
    'Mittleres Löschfahrzeug',
    'C.2.7_Mittleres Löschfahrzeug.svg',
    'MLF',
  ),
  'C.2.8': landFireFighting('Löschfahrzeug 10', 'C.2.8_Löschfahrzeug 10.svg', '(H)LF 10'),
  'C.2.9': landFireFighting('Löschfahrzeug 20', 'C.2.9_Löschfahrzeug 20.svg', '(H)LF 20'),
  /**
   * C.2.10: drei Räder (Kategorie 2) und ein um 0,5 mm höherer Lauf. Selbst vermessen: `L` von
   * y 9,0808 bis 12,0000 (Versalhöhe 2,9192, Grundlinie 12,0 = 6,25 mm unter der Oberkante 5,75),
   * linke Tintenkante 2,8681; abzüglich des Arimo-Seitenlagers von `L` (168/2048 × 4,2431 mm =
   * 0,3481) liegt der Anker bei x 2,5200, 1,5200 mm rechts der Körperkante. Die Tintenkante gleicht
   * der von `KLF` (2,8677) bis auf 0,0004 mm, und derselbe Rückrechnungsweg ergibt dort 1,5196: die
   * 0,02 mm gegen den Profildefault 1,5 sind dessen Rundung, keine Eigenheit von C.2.10. Neu ist
   * allein die Grundlinie, 0,5 mm höher als der Default.
   */
  'C.2.10': {
    title: 'Löschgruppenfahrzeug 20 Katastrophenschutz',
    referenceAsset: 'C.2.10_Löschgruppenfahrzeug 20 Katastrophenschutz.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-2',
      bodyMarks: ['fire-fighting'],
      labels: {
        inBodyInk: 'koerperlauf-kontrast',
        topLeft: 'LF 20 KatS',
        topLeftMetrics: {
          capHeightMm: 2.919225,
          baselineFromBodyTopMm: 6.25,
          anchorFromBodyLeftMm: 1.520031,
        },
      },
    },
  },
  'C.2.11': landFireFighting(
    'Tanklöschfahrzeug 2000',
    'C.2.11_Tanklöschfahrzeug 2000.svg',
    'TLF 2.000',
  ),
  'C.2.12': landFireFighting(
    'Tanklöschfahrzeug 3000',
    'C.2.12_Tanklöschfahrzeug 3000.svg',
    'TLF 3.000',
  ),
  'C.2.13': landFireFighting(
    'Tanklöschfahrzeug 4000',
    'C.2.13_Tanklöschfahrzeug 4000.svg',
    'TLF 4.000',
  ),
  'C.2.29': {
    title: 'Tragkraftspritzenanhänger',
    referenceAsset: 'C.2.29_Tragkraftspritzenanhänger.svg',
    spec: {
      kind: 'trailer',
      organization: 'feuerwehr',
      vehicleCategory: 'anhaenger-ein-rad',
      bodyMarks: ['fire-fighting'],
    },
  },
  'C.2.31': {
    title: 'geschützte Löschdrohne',
    referenceAsset: 'C.2.31_geschützte Löschdrohne.svg',
    spec: {
      kind: 'vehicle-land',
      bodyVariant: 'inverted-hull-track',
      organization: 'feuerwehr',
      vehicleCategory: 'kettenfahrzeug',
      bodyMarks: ['fire-fighting', 'track-chevron-top'],
    },
  },
} as const satisfies Record<string, Recipe>;
