import type { Recipe } from './recipes.js';

/**
 * Anhang E, Teilslice E-a: die Bergungs- und Fachgruppen E.1.1 bis E.1.16 des THW.
 *
 * **Alle 16 sind Kompositionen, keine Piktogramme.** Sie stehen auf dem Grundzeichen
 * `formation` (Körperhülle 1/6 bis 31/26 mm, zeichengleich mit `1.1_Taktische Formation.svg`),
 * tragen die Körperfarbe `blau` der Organisation `thw` (#003296) und — bis auf E.1.3 — die
 * Kopfzone des Stärkegrads `gruppe` aus `strengths.ts`. Ihre Bedeutung liegt danach
 * ausschließlich in den Beschriftungszonen: ohne sein Kürzel ist E.1.1 von E.1.7 nicht zu
 * unterscheiden, beide sind dasselbe blaue Rechteck mit zwei Kopfmarken.
 *
 * **Die Kürzel sind am Referenzbild abgelesen, nicht aus der Datei gelesen.** Die Glyphen
 * liegen dort in Kurven umgewandelt vor (Ebene `Takt. Zeichen (Typo)`), aus dem SVG ist kein
 * Buchstabe auslesbar — derselbe Weg wie bei Anhang J
 * (`docs/decisions/2026-08-09-anhang-j-ist-typografisch.md`): Kürzel aus der Rasterung ablesen,
 * Bedeutung gegen den Dateinamen halten, beides in der Sichtprüfung gegenprüfen
 * (`docs/reviews/2026-08-12-e-a-visual-qa.md`).
 *
 * **`Typ A` ist eine eigene ID, keine Variante.** Sechs der 16 Dateien tragen „Typ A" im Namen
 * und ein „A" in der linken unteren Zone; ein Typ B existiert im gesamten Referenzbestand
 * nicht. Die Slice-Spec (`docs/decisions/2026-08-11-anhang-e-zuschnitt.md`, Abschnitt 5) hat
 * das entschieden — jedes der 16 Zeichen trägt genau eine `primary`-Darstellung und keine
 * einzige `alternative`.
 */
export const ANHANG_E_A_RECIPES = {
  'E.1.1': {
    title: 'Bergungsgruppe',
    referenceAsset: 'E.1.1_Bergungsgruppe.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'gruppe',
      labels: { center: 'B', bottomRight: 'THW' },
    },
  },
  'E.1.2': {
    title: 'Bergungsgruppe Abstützsystem Holz',
    referenceAsset: 'E.1.2_Bergungsgruppe_Abstützsystem Holz.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'gruppe',
      labels: { center: 'B', bottomLeft: 'ASH', bottomRight: 'THW' },
    },
  },
  /**
   * Der Sonderfall des Blocks: **keine Kopfzone.** Die Referenzdatei trägt in der Ebene
   * `Takt_Zeichen (umgewandelt)` nur den Rahmenpfad, während alle 15 anderen dort zusätzlich
   * die beiden Kopfmarken des Stärkegrads `gruppe` führen. Ein Einsatznachsorgeteam ist damit
   * ein Zeichen ohne Stärkeangabe — `spec.strength` fehlt hier bewusst und ist nicht vergessen.
   */
  'E.1.3': {
    title: 'Einsatznachsorgeteam',
    referenceAsset: 'E.1.3_Einsatznachsorgeteam.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      labels: { center: 'ENT', bottomRight: 'THW' },
    },
  },
  'E.1.4': {
    title: 'Fachgruppe Bergungstauchen',
    referenceAsset: 'E.1.4_Fachgruppe Bergungstauchen.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'gruppe',
      labels: { center: 'BT', bottomRight: 'THW' },
    },
  },
  'E.1.5': {
    title: 'Fachgruppe Brückenbau',
    referenceAsset: 'E.1.5_Fachgruppe Brückenbau.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'gruppe',
      labels: { center: 'BrB', bottomRight: 'THW' },
    },
  },
  /**
   * Eine von zwei Dateien mit fehlerhafter Füllfläche in der Referenz: ihr blaues Innenfeld ist
   * 42,52 statt 51,024 Einheiten hoch (3 mm zu kurz), und die gesamte Beschriftung ist um
   * dieselben 3 mm nach oben verschoben — der Rahmen und die Kopfzone stehen dagegen normal.
   * Gerastert zeigt die Datei einen weißen Streifen zwischen Innenfeld und unterem Rahmen.
   * Der Katalog baut sie wie die anderen 14; der Befund steht in der `note` des technischen
   * Reviews ihrer Manifestzeile (`technicalReviewFor` in `coverage-manifest.ts`) und im
   * Sichtprüfungsbericht. **Kein `deviation`-Status:** der bezeichnet im Reviewmodell eine
   * bewusste Abweichung der Umsetzung von ihrer Quelle. Hier weicht die Quelle von sich selbst
   * ab, und die Umsetzung folgt den 14 fehlerfreien Dateien — dieselbe Einordnung wie bei den
   * beiden Farbbefunden aus D.4.
   */
  'E.1.6': {
    title: 'Fachgruppe Elektroversorgung',
    referenceAsset: 'E.1.6_Fachgruppe Elektroversorgung.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'gruppe',
      labels: { center: 'E', bottomRight: 'THW' },
    },
  },
  'E.1.7': {
    title: 'Fachgruppe Infrastruktur',
    referenceAsset: 'E.1.7_Fachgruppe Infrastruktur.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'gruppe',
      labels: { center: 'I', bottomRight: 'THW' },
    },
  },
  'E.1.8': {
    title: 'Fachgruppe Notversorgung und Notinstandsetzung',
    referenceAsset: 'E.1.8_Fachgruppe Notversorgung und Notinstandsetzung.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'gruppe',
      labels: { center: 'N', bottomRight: 'THW' },
    },
  },
  'E.1.9': {
    title: 'Fachgruppe Ölschaden Typ A',
    referenceAsset: 'E.1.9_Fachgruppe Ölschaden Typ A.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'gruppe',
      labels: { center: 'Öl', bottomLeft: 'A', bottomRight: 'THW' },
    },
  },
  'E.1.10': {
    title: 'Fachgruppe Ortung Typ A',
    referenceAsset: 'E.1.10_Fachgruppe Ortung Typ A.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'gruppe',
      labels: { center: 'O', bottomLeft: 'A', bottomRight: 'THW' },
    },
  },
  'E.1.11': {
    title: 'Fachgruppe Räumen Typ A',
    referenceAsset: 'E.1.11_Fachgruppe Räumen Typ A.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'gruppe',
      labels: { center: 'R', bottomLeft: 'A', bottomRight: 'THW' },
    },
  },
  'E.1.12': {
    title: 'Fachgruppe Schwere Bergung Typ A',
    referenceAsset: 'E.1.12_Fachgruppe Schwere Bergung Typ A.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'gruppe',
      labels: { center: 'SB', bottomLeft: 'A', bottomRight: 'THW' },
    },
  },
  'E.1.13': {
    title: 'Fachgruppe Sprengen',
    referenceAsset: 'E.1.13_Fachgruppe Sprengen.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'gruppe',
      labels: { center: 'Sp', bottomRight: 'THW' },
    },
  },
  /** Die zweite Datei mit zu kurzer Füllfläche (43,937 statt 51,024 Einheiten, 2,5 mm) — siehe E.1.6. */
  'E.1.14': {
    title: 'Fachgruppe Trinkwasserversorgung',
    referenceAsset: 'E.1.14_Fachgruppe Trinkwasserversorgung.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'gruppe',
      labels: { center: 'TW', bottomRight: 'THW' },
    },
  },
  'E.1.15': {
    title: 'Fachgruppe Wassergefahren Typ A',
    referenceAsset: 'E.1.15_Fachgruppe Wassergefahren Typ A.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'gruppe',
      labels: { center: 'W', bottomLeft: 'A', bottomRight: 'THW' },
    },
  },
  'E.1.16': {
    title: 'Fachgruppe Wasserschaden Pumpen Typ A',
    referenceAsset: 'E.1.16_Fachgruppe Wasserschaden Pumpen Typ A.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'gruppe',
      labels: { center: 'WP', bottomLeft: 'A', bottomRight: 'THW' },
    },
  },
} as const satisfies Record<string, Recipe>;

/**
 * Die beiden Referenzdateien, deren blaue Füllfläche zu kurz ist. Sie stehen hier als Datum und
 * nicht nur im Prosakommentar, damit die Manifestzeile ihren Reviewvermerk daraus ableitet statt
 * den Befund ein zweites Mal zu behaupten.
 */
export const ANHANG_E_A_FILL_DEFECTS: Readonly<Record<string, string>> = Object.freeze({
  'E.1.6':
    'Blaue Füllfläche der Referenz 42,52 statt 51,024 Einheiten hoch (3 mm zu kurz), die ' +
    'gesamte Beschriftung um dieselben 3 mm nach oben verschoben; Rahmen und Kopfzone stehen ' +
    'normal. Der Katalog baut das Zeichen wie die 14 fehlerfreien.',
  'E.1.14':
    'Blaue Füllfläche der Referenz 43,937 statt 51,024 Einheiten hoch (2,5 mm zu kurz), die ' +
    'gesamte Beschriftung um dieselben 2,5 mm nach oben verschoben; Rahmen und Kopfzone stehen ' +
    'normal. Der Katalog baut das Zeichen wie die 14 fehlerfreien.',
});
