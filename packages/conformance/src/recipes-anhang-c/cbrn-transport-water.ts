import type { Recipe } from '../recipes.js';

/*
 * C.2.20 und C.2.23 bis C.2.26 samt Alternativen: CBRN-Schutz, Messen/Spüren, Dekontaminieren
 * (4.1.1 bis 4.1.3), Transportieren (4.7.19) und Wasserförderung (4.7.26) am Landfahrzeug
 * (LFH-786). Die Körperfassungen stehen in
 * `core/src/geometry/body-marks-anhang-c/cbrn-transport-water.ts`.
 *
 * Fahrwerk aus der Geometrie abgelesen: C.2.20, C.2.23 und C.2.24 mit zwei Rädern bei
 * x 3,75 / 28,25 → Kategorie 1; C.2.25 und C.2.26 mit dreien (zusätzlich x 16) → Kategorie 2.
 * Haupt- und Alternativdarstellung fahren jeweils auf demselben Fahrwerk.
 *
 * Beschriftung oben links: Versalhöhe 2,9192 mm (etwa `W` in „GW-G“ 9,5800…12,4992), Grundlinie
 * 12,5 mm = 6,75 mm unter der Körperoberkante 5,75, bei zwei Zeilen die zweite auf 16,5 mm
 * (10,75 mm unter der Oberkante). Das ist der Profildefault einschließlich des Ankers 1,5 mm ab
 * der linken Körperkante.
 */

export const ANHANG_C_CBRN_TRANSPORT_WATER_RECIPES = {
  'C.2.20': {
    title: 'Gerätewagen Gefahrgut',
    referenceAsset: 'C.2.20_Gerätewagen Gefahrgut.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['cbrn-protection'],
      labels: { inBodyInk: 'koerperlauf-kontrast', topLeft: 'GW-G' },
    },
  },
  'C.2.20#alternative': {
    title: 'Gerätewagen Gefahrgut',
    referenceAsset: 'C.2.20_Gerätewagen Gefahrgut_Alternative.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['cbrn-protection'],
      bodyMarkRenditions: { 'cbrn-protection': 'centered-large-tongs' },
    },
  },
  'C.2.23': {
    title: 'Mannschaftstransportfahrzeug 9-sitzig',
    referenceAsset: 'C.2.23_Mannschaftstransportfahrzeug 9-sitzig.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['transport'],
      labels: { inBodyInk: 'koerperlauf-kontrast', topLeft: 'MTF' },
    },
  },
  /** Statt „MTF“ nur die Sitzzahl „9“; die Marke ist bytegleich mit der Hauptdarstellung. */
  'C.2.23#alternative': {
    title: 'Mannschaftstransportfahrzeug 9-sitzig',
    referenceAsset: 'C.2.23_Mannschaftstransportfahrzeug 9-sitzig_Alternative.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['transport'],
      labels: { inBodyInk: 'koerperlauf-kontrast', topLeft: '9' },
    },
  },
  'C.2.24': {
    title: 'CBRN-Erkundungswagen',
    referenceAsset: 'C.2.24_CBRN-Erkundungswagen.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['cbrn-detection'],
      labels: { inBodyInk: 'koerperlauf-kontrast', topLeftLines: ['CBRN', 'ErkW'] },
    },
  },
  /**
   * Das „P“ steht zwischen den Klammern: Grundlinie y 23,0 (3 mm über der Unterkante 26),
   * Versalhöhe 2,9192 (20,0804…22,9996), linke Tintenkante des Stamms x 21,4615. Es ist das
   * „P“ aus C.1.8 (Stamm 14,6032 bei Anker 16, Versalhöhe 4,8694) auf 0,5995 verkleinert; der
   * Anker liegt damit bei x 21,4615 + 1,3968 × 0,5995 = 22,299, also 21,3 mm ab der linken
   * Körperkante.
   */
  'C.2.25': {
    title: 'Gerätewagen Dekontamination Personal',
    referenceAsset: 'C.2.25_Gerätewagen Dekontamination Personal.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-2',
      bodyMarks: ['decontamination'],
      labels: {
        inBodyInk: 'koerperlauf-kontrast',
        topLeftLines: ['GW', 'Dekon'],
        center: 'P',
        centerAnchorFromBodyLeftMm: 21.3,
        centerBaselineFromBodyBottomMm: 3,
        centerCapHeightMm: 2.919225,
      },
    },
  },
  /**
   * Das „P“ im Normgrad (Versalhöhe 4,8694: 19,1307…24,0001), Grundlinie y 24,0 = 2 mm über der
   * Unterkante. **Nicht ganz mittig:** das „P“ ist das aus C.1.8, um (+0,5002|−1,9998)
   * verschoben (Stamm x 15,1034 statt 14,6032). Sein Anker liegt also bei x 16,5, 15,5 mm ab der
   * linken Körperkante.
   */
  'C.2.25#alternative': {
    title: 'Gerätewagen Dekontamination Personal',
    referenceAsset: 'C.2.25_Gerätewagen Dekontamination Personal_Alternative.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-2',
      bodyMarks: ['decontamination'],
      bodyMarkRenditions: { decontamination: 'centered-large-tongs' },
      labels: {
        inBodyInk: 'koerperlauf-kontrast',
        center: 'P',
        centerAnchorFromBodyLeftMm: 15.5,
        centerBaselineFromBodyBottomMm: 2,
      },
    },
  },
  'C.2.26': {
    title: 'Schlauchwagen Katastrophenschutz',
    referenceAsset: 'C.2.26_Schlauchwagen Katastrophenschutz.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-2',
      bodyMarks: ['water-conveyance'],
      labels: { inBodyInk: 'koerperlauf-kontrast', topLeft: 'SW KatS' },
    },
  },
  'C.2.26#alternative': {
    title: 'Schlauchwagen Katastrophenschutz',
    referenceAsset: 'C.2.26_Schlauchwagen Katastrophenschutz_Alternative.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-2',
      bodyMarks: ['water-conveyance'],
      bodyMarkRenditions: { 'water-conveyance': 'raised-wave-3mm-arrow-3mm' },
    },
  },
} as const satisfies Record<string, Recipe>;
