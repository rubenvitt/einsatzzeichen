import type { Recipe } from '../recipes.js';

/*
 * C.2.14 bis C.2.17, C.2.27 und C.2.28 samt Alternativen: Drehleiter (4.5.3), Teleskopgelenkmast
 * (4.5.4), Kran (4.7.9) und Heben/Räumen (4.7.11) am Landfahrzeug der Feuerwehr (LFH-786).
 * Die Körperfassungen stehen in `core/src/geometry/body-marks-anhang-c/height-rescue-lifting.ts`.
 *
 * Fahrwerk aus den Radringen abgelesen: C.2.14 bis C.2.17 und C.2.27 tragen zwei Ringe um
 * x 3,75 / 28,25 (`kfz-kategorie-1`), C.2.28 drei um x 3,75 / 16,0 / 28,25 ohne
 * Verbindungsstrich (`kfz-kategorie-2`).
 *
 * Alle Läufe oben links stehen auf dem Profildefault: Grundlinie y 12,4992…12,5003 (6,75 mm
 * unter der Körperoberkante 5,75), Versalhöhe 2,9192 (`D`, `H`, `T`, `F` 9,5800…9,5807 bis
 * 12,4992…12,4999). Die Ziffern sind in derselben Schrift nur 2,75 mm hoch: im Lauf
 * „DLAK 12/9“ steht die `1` auf 9,7504…12,5003, genau wie im Lauf „12/9“ allein. Die reinen
 * Ziffernläufe haben also denselben Schriftgrad und brauchen kein `topLeftMetrics`.
 */
export const ANHANG_C_HEIGHT_RESCUE_LIFTING_RECIPES = {
  'C.2.14': {
    title: 'Automatikdrehleiter 12/9',
    referenceAsset: 'C.2.14_Automatikdrehleiter_12-9.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['rescue-aerial-ladder'],
      labels: { topLeft: '12/9', inBodyInk: 'koerperlauf-kontrast' },
    },
  },
  'C.2.14#alternative': {
    title: 'Automatikdrehleiter 12/9',
    referenceAsset: 'C.2.14_Automatikdrehleiter_12-9_Alternative.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['rescue-aerial-ladder'],
      bodyMarkRenditions: { 'rescue-aerial-ladder': 'shifted-right-6.5mm' },
      labels: { topLeft: 'DLAK 12/9', inBodyInk: 'koerperlauf-kontrast' },
    },
  },
  'C.2.15': {
    title: 'Automatikdrehleiter 18/12',
    referenceAsset: 'C.2.15_Automatikdrehleiter_18-12.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['rescue-aerial-ladder'],
      labels: { topLeft: '18/12', inBodyInk: 'koerperlauf-kontrast' },
    },
  },
  'C.2.15#alternative': {
    title: 'Automatikdrehleiter 18/12',
    referenceAsset: 'C.2.15_Automatikdrehleiter_18-12_Alternative.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['rescue-aerial-ladder'],
      bodyMarkRenditions: { 'rescue-aerial-ladder': 'shifted-right-6.5mm' },
      labels: { topLeft: 'DLAK 18/12', inBodyInk: 'koerperlauf-kontrast' },
    },
  },
  'C.2.16': {
    title: 'Automatikdrehleiter 23/12',
    referenceAsset: 'C.2.16_Automatikdrehleiter_23-12.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['rescue-aerial-ladder'],
      labels: { topLeft: '23/12', inBodyInk: 'koerperlauf-kontrast' },
    },
  },
  /**
   * Die Leiter liegt 1 mm höher als in C.2.14_Alternative und C.2.15_Alternative und trifft die
   * linke Korbseite statt der Korbecke; der Korb steht unverändert. Der Lauf „DLAK 23/12“ endet
   * auf derselben Tinte wie „DLAK 18/12“ (rechte Kante 23,6441 in beiden Dateien), einen
   * Platzgrund gibt es also nicht. Möglicherweise ein Zeichenfehler der Quelle; gebaut wie
   * gezeichnet (Fassung `shifted-right-6.5mm-ladder-raised-1mm`).
   */
  'C.2.16#alternative': {
    title: 'Automatikdrehleiter 23/12',
    referenceAsset: 'C.2.16_Automatikdrehleiter_23-12_Alternative.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['rescue-aerial-ladder'],
      bodyMarkRenditions: { 'rescue-aerial-ladder': 'shifted-right-6.5mm-ladder-raised-1mm' },
      labels: { topLeft: 'DLAK 23/12', inBodyInk: 'koerperlauf-kontrast' },
    },
  },
  'C.2.17': {
    title: 'Hubarbeitsbühne',
    referenceAsset: 'C.2.17_Hubarbeitsbühne.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['rescue-articulated-boom'],
      labels: { topLeft: 'HAB', inBodyInk: 'koerperlauf-kontrast' },
    },
  },
  'C.2.17#alternative': {
    title: 'Hubarbeitsbühne',
    referenceAsset: 'C.2.17_Hubarbeitsbühne_Alternative.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['rescue-articulated-boom'],
      bodyMarkRenditions: { 'rescue-articulated-boom': 'shifted-left-1mm' },
      labels: { topLeft: 'TGM', inBodyInk: 'koerperlauf-kontrast' },
    },
  },
  'C.2.27': {
    title: 'Feuerwehrkran 30',
    referenceAsset: 'C.2.27_Feuerwehrkran 30.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['crane-lifting'],
      labels: { topLeft: 'FwK 30', inBodyInk: 'koerperlauf-kontrast' },
    },
  },
  'C.2.27#alternative': {
    title: 'Feuerwehrkran 30',
    referenceAsset: 'C.2.27_Feuerwehrkran 30_Alternative.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['crane-lifting'],
      bodyMarkRenditions: { 'crane-lifting': 'shifted-left-7mm-jib-5mm' },
      labels: { topLeft: '30', inBodyInk: 'koerperlauf-kontrast' },
    },
  },
  /**
   * Der Lauf heißt in der Referenz „Telelader“ (neun Glyphen `T e l e l a d e r`), der Dateiname
   * „Teleskoplader“. Gesetzt ist der gezeichnete Lauf.
   */
  'C.2.28': {
    title: 'Teleskoplader',
    referenceAsset: 'C.2.28_Teleskoplader.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-2',
      bodyMarks: ['lifting-clearing'],
      labels: { topLeft: 'Telelader', inBodyInk: 'koerperlauf-kontrast' },
    },
  },
  'C.2.28#alternative': {
    title: 'Teleskoplader',
    referenceAsset: 'C.2.28_Teleskoplader_Alternative.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-2',
      bodyMarks: ['lifting-clearing'],
      bodyMarkRenditions: { 'lifting-clearing': 'shifted-left-4mm' },
    },
  },
} as const satisfies Record<string, Recipe>;
