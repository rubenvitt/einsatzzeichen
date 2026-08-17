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

/**
 * Anhang E, Teilslice E-b: die Fachzüge, Zugtrupps, der Stab und die Logistikeinheiten
 * E.1.17 bis E.1.28 des THW.
 *
 * **Die Mechanismen sind dieselben wie in E-a, der Bestand ist es nicht.** Alle zwölf stehen auf
 * derselben Körperform `formation`, tragen dieselbe Organisationsfarbe `blau` und setzen ihre
 * Bedeutung in dieselben drei Beschriftungszonen — kein neuer Stärkegrad, keine neue
 * Organisationsfarbe, kein neuer Kontrastvertrag (`labelContrastRequirements()` deckt THW seit
 * E-a ab). Drei Dinge kommen hinzu:
 *
 * **Erstens die Stärkegrade `zug` und `trupp`.** E-a war ein Block aus `gruppe` mit genau einer
 * Ausnahme; hier stehen vier Fachzüge mit dreimarkiger Kopfreihe, vier Trupps mit einer Marke,
 * drei Fachgruppen mit zwei — und `Stab` ohne jede Kopfzone. Die Kopfzonen selbst sind
 * unverändert aus `strengths.ts`; belegt ist damit erstmals, dass die Zonenregel des
 * Kompositionsmotors gegen alle drei Reihenbreiten trägt, nicht nur gegen die der Gruppe.
 *
 * **Zweitens die Kürzel tragen Bindestriche.** `FZ-FK`, `FZ-Log`, `Log-MW` und vier weitere
 * setzen U+002D, den gewöhnlichen ASCII-Bindestrich. Die Wahl ist gemessen und nicht geraten: die
 * Hyphenklasse (U+002D / U+2010 / U+2011, in Arimo bildgleich, 1,750 × 0,563 mm) trifft den
 * Referenzbalken (1,933 × 0,579 mm) auf 0,18 mm, der Halbgeviertstrich U+2013 verfehlt ihn mit
 * Faktor 2,0. Zwischen den drei bildgleichen Formen entscheidet damit nichts am Bild — deshalb
 * steht hier der lesbarste Zeichencode und nicht der typografisch feinste.
 *
 * **Drittens tragen zehn der zwölf Referenzdateien Befunde an der Füllfläche.** Das ist in E-a
 * die Ausnahme gewesen (zwei von sechzehn), hier ist es der Regelfall. Sie stehen deshalb nicht
 * je Rezept als Prosa, sondern gesammelt als Datum in `ANHANG_E_B_FILL_FINDINGS`, aus dem die
 * Manifestzeilen ihren Reviewvermerk ableiten. Der Katalog baut alle zwölf wie die 22
 * normgerechten E.1-Dateien — Füllfläche 7,0…25,0 mm, Grundlinien 18,0 und 24,0 mm. Dieselbe
 * Entscheidung, die E-a für E.1.6 und E.1.14 getroffen hat, und aus demselben Grund: weicht die
 * Quelle von sich selbst ab, folgt die Umsetzung der Mehrheit der Quelle statt die Abweichung
 * nachzubauen.
 *
 * **Drei Zeichen weichen darüber hinaus bewusst von ihrer Referenz ab** und tragen deshalb ein
 * technisches Review mit `status: 'deviation'` statt `approved` (Noten in `coverage-manifest.ts`):
 * E.1.17, dessen mittiges Kürzel in der Referenz 2,0009 mm links der Körpermitte steht, und
 * E.1.19 sowie E.1.24, deren drei Marken im Körper der Katalog nicht abbildet. Hier weicht — im
 * Unterschied zu den zehn Füllflächenbefunden — die Umsetzung von der Quelle ab, und genau das
 * bezeichnet `deviation` im Reviewmodell.
 */
export const ANHANG_E_B_RECIPES = {
  /**
   * Deklarierte Abweichung. Der mittige Referenzlauf steht **2,0009 mm links der Körpermitte**
   * (sein `F` beginnt bei x 15,913 Einheiten, das von E.1.18 bei 21,585 — Δ 5,672), der Katalog
   * setzt ihn wie alle anderen mittig: `labelPrimitives` kennt für die mittige Zone nur
   * `anchor: 'middle'` auf die Körpermitte. Für n = 1 wird dafür kein Mechanismus gebaut, und die
   * eine Datei ist die schwächste denkbare Stütze für einen: „Fachzug Grundzeichen" ist ein
   * Musterblatt, dessen Kürzel `FZ-` mit dem Trennstrich endet und dahinter die Stelle offen
   * lässt, die die anderen Fachzüge füllen — ein Zeichen, das keine Einheit bezeichnet, sondern
   * die Bauform der übrigen vorführt. Ob seine Linksstellung mit dieser Rolle zu tun hat,
   * entscheidet die Datei nicht.
   */
  'E.1.17': {
    title: 'Fachzug Grundzeichen',
    referenceAsset: 'E.1.17_Fachzug Grundzeichen.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'zug',
      labels: { center: 'FZ-', bottomRight: 'THW' },
    },
  },
  /**
   * Die Datei, von der Zuschnitt und E-a-Notiz Zusatzgeometrie behauptet haben — **sie trägt
   * keine.** Ihre Strichebene führt den Rahmenpfad, eine deckungsgleiche Rahmendublette
   * (Differenz 0,001 Einheiten, identische Ink-Hülle bei gleicher Pixelzahl) und eine
   * gewöhnliche `zug`-Kopfreihe bei cy 9,921. Beide älteren Notizen tragen dazu einen datierten
   * Nachtrag; hier steht der Befund, weil das Rezept sonst die einzige Stelle wäre, an der die
   * widerlegte Behauptung unwidersprochen bliebe.
   */
  'E.1.18': {
    title: 'Fachzug Führung-Kommunikation',
    referenceAsset: 'E.1.18_Fachzug Führung-Kommunikation.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'zug',
      labels: { center: 'FZ-FK', bottomRight: 'THW' },
    },
  },
  /**
   * Deklarierte Abweichung, gemeinsam mit E.1.24. Beide Referenzdateien tragen **drei Marken im
   * Körper** — Kreise r 1,5 mm bei cy 8,100 mm, cx 11/16/21 mm hier, cx 11,047/16,047/21,047 mm
   * bei E.1.24 —, zeichenidentisch mit der `zug`-Kopfreihe und um 4,600 mm nach unten versetzt.
   * Der Katalog bildet sie nicht ab.
   *
   * **Der Grund ist die fehlende Konstante, nicht der fehlende Mechanismus.** Ein Scan über alle
   * 661 Referenzdateien nach Kreisen r = 4,252 Einheiten unterhalb der Kopfzone findet drei
   * Fälle mit drei verschiedenen Konstruktionen: E.1.19 und E.1.24 bei cy 8,100 mit oben
   * verkürzter Füllfläche, `I.1.5_Zugtrupp Wasserrettungszug.svg` bei cy 7,750 mit um 3,45 mm
   * nach unten versetzter Rahmeninnenkante und **ohne** farbige Füllfläche — und
   * `D.1.9_Zugtrupp einer Sanitätseinheit.svg` trägt bei gleichem Begriff **keine** Reihe. Aus
   * drei Konstruktionen über drei Kapitel lässt sich keine Platzierungsregel vermessen; jeder
   * hingeschriebene Wert wäre an einer der drei Dateien falsch. Dieselbe Lage, aus der der
   * Zuschnitt „Typ B" als Variantenachse verworfen hat.
   *
   * Vier Wege sind geprüft und verworfen — die vollständige Begründung steht in der
   * Entscheidungsnotiz, hier die Kurzform: ein `capability.*`-Piktogramm (der einzige Weg zu
   * `placement: {mode:'in-body'}`) würde eine **Fähigkeit** behaupten, wo eine Unterstellung
   * gemeint ist; Geometrie im Rezept gibt es nicht (`SymbolSpec` hat acht Felder, keines für
   * Geometrie); ein zweites Stärkefeld am `SymbolSpec` wäre semantisch richtig (Trupp *eines*
   * Zuges) und scheitert an derselben Zahl; ein Schemaschritt mit zweiter Markenzone ebenso, dazu
   * mit A11y- und Elementregisterfolgen.
   *
   * Gemessen ist bei diesen beiden Dateien nur die **Gleichzeitigkeit**: das oben um 3 mm
   * verkürzte Innenfeld und die Reihe bei cy 8,100 mm treten zusammen auf. Ob die Verkürzung der
   * Reihe Platz schaffen soll, entscheidet die Datei nicht.
   */
  'E.1.19': {
    title: 'Zugtrupp Fachzug Führung-Kommunikation',
    referenceAsset: 'E.1.19_Zugtrupp_Fachzug Führung-Kommunikation.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'trupp',
      labels: { center: 'FZ-FK', bottomRight: 'THW' },
    },
  },
  'E.1.20': {
    title: 'Fachgruppe Führungsunterstützung',
    referenceAsset: 'E.1.20_Fachgruppe Führungsunterstützung.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'gruppe',
      labels: { center: 'F', bottomRight: 'THW' },
    },
  },
  /**
   * Der Sonderfall dieses Blocks: **keine Kopfzone**, wie E.1.3 in E-a. Ein Stab ist keine
   * Einheit einer Mannschaftsstärke, sondern ein Führungsgremium — `spec.strength` fehlt hier
   * bewusst und ist nicht vergessen. Das Zeichen bleibt damit das einzige der zwölf, das sich
   * ohne Kopfzone allein über sein Kürzel von den Fachzügen unterscheidet.
   */
  'E.1.21': {
    title: 'Stab',
    referenceAsset: 'E.1.21_Stab.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      labels: { center: 'Stab', bottomRight: 'THW' },
    },
  },
  /**
   * Der einzige „Typ A" des Blocks und damit der einzige mit Zusatzkennzeichnung unten links.
   * Wie in E-a ist das eine eigene ID und keine Variante: ein Typ B existiert im gesamten
   * Referenzbestand nicht.
   */
  'E.1.22': {
    title: 'Fachgruppe Kommunikation Typ A',
    referenceAsset: 'E.1.22_Fachgruppe Kommunikation Typ A.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'gruppe',
      labels: { center: 'K', bottomLeft: 'A', bottomRight: 'THW' },
    },
  },
  'E.1.23': {
    title: 'Fachzug Logistik',
    referenceAsset: 'E.1.23_Fachzug Logistik.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'zug',
      labels: { center: 'FZ-Log', bottomRight: 'THW' },
    },
  },
  /** Deklarierte Abweichung, dieselbe wie bei E.1.19 — die Begründung steht dort. */
  'E.1.24': {
    title: 'Zugtrupp Fachzug Logistik',
    referenceAsset: 'E.1.24_Zugtrupp_Fachzug Logistik.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'trupp',
      labels: { center: 'FZ-Log', bottomRight: 'THW' },
    },
  },
  'E.1.25': {
    title: 'Fachgruppe Logistik-Verpflegung',
    referenceAsset: 'E.1.25_Fachgruppe Logistik-Verpflegung.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'gruppe',
      labels: { center: 'Log-V', bottomRight: 'THW' },
    },
  },
  /**
   * Das längste Kürzel des Katalogbestands und der Grund, aus dem die Box des mittigen Laufs in
   * `compose.ts` von 26 auf 28 mm geweitet wurde: `Log-MW` braucht in Arimo bei Schriftgrad
   * 7,0786 mm **26,156 mm** Tinte und passte damit auch perfekt zentriert nicht in die alte Box
   * (0,078 mm Überstand je Seite). Die Referenz setzt denselben Lauf mit 25,13 mm — die Ursache
   * ist ausschließlich die Schriftwahl, nicht die Ablesung, und sie ist strichunabhängig
   * (gleicher Überstand mit U+002D, U+2010 und U+2011).
   */
  'E.1.26': {
    title: 'Fachgruppe Logistik Materialwirtschaft',
    referenceAsset: 'E.1.26_Fachgruppe Logistik Materialwirtschaft.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'gruppe',
      labels: { center: 'Log-MW', bottomRight: 'THW' },
    },
  },
  'E.1.27': {
    title: 'Trupp Logistik-Materialerhaltung',
    referenceAsset: 'E.1.27_Trupp Logistik-Materialerhaltung.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'trupp',
      labels: { center: 'Log-M', bottomRight: 'THW' },
    },
  },
  'E.1.28': {
    title: 'Trupp Logistik-Verbrauchsgüterversorgung',
    referenceAsset: 'E.1.28_Trupp Logistik-Verbrauchsgüterversorgung.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'trupp',
      labels: { center: 'Log-VG', bottomRight: 'THW' },
    },
  },
} as const satisfies Record<string, Recipe>;

/**
 * Die zehn Referenzdateien dieses Teilslice, deren blaue Füllfläche und Grundlinien von der Norm
 * der 22 fehlerfreien E.1-Dateien abweichen (Füllfläche 7,0…25,0 mm, mittige Grundlinie 18,0 mm,
 * `THW`-Grundlinie 24,0 mm). Wie `ANHANG_E_A_FILL_DEFECTS` stehen sie hier als Datum, damit die
 * Manifestzeile ihren Reviewvermerk daraus ableitet statt den Befund ein zweites Mal zu
 * behaupten. Nur `E.1.17` und `E.1.22` fehlen hier — sie sind normgerecht.
 *
 * **`FINDINGS` und nicht `DEFECTS`**, obwohl E-a von Defekten spricht: sieben der zehn folgen dem
 * Muster von E.1.6/E.1.14 und sind damit gleich eingeordnet, drei aber nicht. Bei E.1.18, E.1.20
 * und E.1.21 stehen 2,5 mm Fläche gegen 0,5 mm Grundlinie — die Beschriftung wandert **nicht** um
 * den Fehlbetrag der Fläche, wie sie es in E-a tat. Was dort als Defekt lesbar war (eine um
 * denselben Betrag mitverschobene Beschriftung), ist hier ein Befund mit offener Einordnung, und
 * die Benennung des Exports soll das nicht überschreiben.
 */
export const ANHANG_E_B_FILL_FINDINGS: Readonly<Record<string, string>> = Object.freeze({
  'E.1.18':
    'Blaue Füllfläche der Referenz oben um 2,5 mm verkürzt (9,5 statt 7,0 mm), mittige ' +
    'Grundlinie 17,5 statt 18,0 mm, THW-Grundlinie normgerecht bei 24,0 mm. Dieser Befund folgt ' +
    'ausdrücklich **nicht** dem Muster von E.1.6/E.1.14, wo die Beschriftung um genau den ' +
    'Fehlbetrag der Fläche wanderte: hier stehen 2,5 mm Fläche gegen 0,5 mm Grundlinie. Die ' +
    'Einordnung bleibt offen — als Defekt ist das nicht belegt. Gemessen ist, dass Füllung oben ' +
    '9,5 mm und mittige Grundlinie 17,5 mm gemeinsam auftreten. Der Katalog baut das Zeichen ' +
    'wie die 22 normgerechten E.1-Dateien.',
  'E.1.19':
    'Blaue Füllfläche der Referenz oben um 3 mm verkürzt (10,0 statt 7,0 mm), beide Grundlinien ' +
    'normgerecht bei 18,0 und 24,0 mm. Gemessen ist die Gleichzeitigkeit von verkürztem ' +
    'Innenfeld und der Markenreihe bei cy 8,100 mm, nicht eine Absicht: ob die Verkürzung der ' +
    'Reihe Platz schaffen soll, entscheidet die Datei nicht. Der Katalog baut das Zeichen wie ' +
    'die 22 normgerechten E.1-Dateien.',
  'E.1.20':
    'Blaue Füllfläche der Referenz oben um 2,5 mm verkürzt (9,5 statt 7,0 mm), mittige ' +
    'Grundlinie 17,5 statt 18,0 mm, THW-Grundlinie normgerecht bei 24,0 mm. Dieselbe eigene ' +
    'Signatur wie E.1.18 und E.1.21: 2,5 mm Fläche gegen 0,5 mm Grundlinie, damit **nicht** das ' +
    'Muster von E.1.6/E.1.14 und in der Einordnung offen. Der Katalog baut das Zeichen wie die ' +
    '22 normgerechten E.1-Dateien.',
  'E.1.21':
    'Blaue Füllfläche der Referenz oben um 2,5 mm verkürzt (9,5 statt 7,0 mm), mittige ' +
    'Grundlinie 17,5 statt 18,0 mm, THW-Grundlinie normgerecht bei 24,0 mm. Die mittige ' +
    'Grundlinie ist hier **abgeleitet, nicht gemessen**: keine Glyphe von „Stab" hat einen ' +
    'flachen Fuß, und beide Rückrechnungen der Messphase widersprechen sich — sie steht auf ' +
    '17,5 mm, weil Füllung oben 9,5 mm und Grundlinie 17,5 mm bei E.1.18 und E.1.20 gemeinsam ' +
    'auftreten. Wie dort **nicht** das Muster von E.1.6/E.1.14 und in der Einordnung offen. Der ' +
    'Katalog baut das Zeichen wie die 22 normgerechten E.1-Dateien.',
  'E.1.23':
    'Blaue Füllfläche der Referenz unten um 3 mm verkürzt (22,0 statt 25,0 mm), die gesamte ' +
    'Beschriftung um dieselben 3 mm nach oben verschoben (mittige Grundlinie 15,0, ' +
    'THW-Grundlinie 21,0 mm); Rahmen und Kopfzone stehen normal. Das Muster von E.1.6/E.1.14 ' +
    'aus E-a. Der Katalog baut das Zeichen wie die 22 normgerechten E.1-Dateien.',
  'E.1.24':
    'Blaue Füllfläche der Referenz oben um 3 mm verkürzt (10,0 statt 7,0 mm), beide Grundlinien ' +
    'normgerecht bei 18,0 und 24,0 mm. Gemessen ist die Gleichzeitigkeit von verkürztem ' +
    'Innenfeld und der Markenreihe bei cy 8,100 mm, nicht eine Absicht: ob die Verkürzung der ' +
    'Reihe Platz schaffen soll, entscheidet die Datei nicht. Der Katalog baut das Zeichen wie ' +
    'die 22 normgerechten E.1-Dateien.',
  'E.1.25':
    'Blaue Füllfläche der Referenz unten um 2,5 mm verkürzt (22,5 statt 25,0 mm), die gesamte ' +
    'Beschriftung um dieselben 2,5 mm nach oben verschoben (mittige Grundlinie 15,5, ' +
    'THW-Grundlinie 21,5 mm); Rahmen und Kopfzone stehen normal. Das Muster von E.1.6/E.1.14 ' +
    'aus E-a. Der Katalog baut das Zeichen wie die 22 normgerechten E.1-Dateien.',
  'E.1.26':
    'Blaue Füllfläche der Referenz unten um 2,5 mm verkürzt (22,5 statt 25,0 mm), die gesamte ' +
    'Beschriftung um dieselben 2,5 mm nach oben verschoben (mittige Grundlinie 15,5, ' +
    'THW-Grundlinie 21,5 mm); Rahmen und Kopfzone stehen normal. Das Muster von E.1.6/E.1.14 ' +
    'aus E-a. Der Katalog baut das Zeichen wie die 22 normgerechten E.1-Dateien.',
  'E.1.27':
    'Blaue Füllfläche der Referenz unten um 2,5 mm verkürzt (22,5 statt 25,0 mm), die ' +
    'Beschriftung nach oben verschoben (mittige Grundlinie 14,5, THW-Grundlinie 21,5 mm); ' +
    'Rahmen und Kopfzone stehen normal. Im Grundsatz das Muster von E.1.6/E.1.14 aus E-a, mit ' +
    'einem zusätzlichen Befund: der Abstand zwischen mittiger und THW-Grundlinie ist 7,0 mm, wo ' +
    '30 der 37 E.1-Dateien 6,0 mm führen. Der Katalog baut das Zeichen wie die 22 ' +
    'normgerechten E.1-Dateien.',
  'E.1.28':
    'Blaue Füllfläche der Referenz unten um 2,5 mm verkürzt (22,5 statt 25,0 mm), die ' +
    'Beschriftung nach oben verschoben (mittige Grundlinie 14,5, THW-Grundlinie 21,5 mm); ' +
    'Rahmen und Kopfzone stehen normal. Im Grundsatz das Muster von E.1.6/E.1.14 aus E-a, mit ' +
    'einem zusätzlichen Befund: der Abstand zwischen mittiger und THW-Grundlinie ist 7,0 mm, wo ' +
    '30 der 37 E.1-Dateien 6,0 mm führen. Der Katalog baut das Zeichen wie die 22 ' +
    'normgerechten E.1-Dateien.',
});

/**
 * Anhang E, Teilslice E-c: die Trupps, Teams und der Ortsverband E.1.29 bis E.1.37 des THW —
 * die letzten neun der 37 E.1-Abschnitte. Mit ihnen ist E.1 vollständig, und der Manifest-`scope`
 * führt seither `E.1` statt der 37 Einzelabschnitte.
 *
 * **Acht der neun sind wie E-a und E-b gebaut:** Grundzeichen `formation`, Körperfarbe `blau` der
 * Organisation `thw`, Kopfzone aus `strengths.ts` und die Bedeutung in den Beschriftungszonen. Vier
 * Dinge kommen hinzu, und das erste ist das schwerste:
 *
 * **Erstens E.1.37 („Ortsverband") auf dem Gebäudekörper.** Es ist das einzige Zeichen des Anhangs
 * mit dieser Hülle — ihr Füllpolygon steht byteidentisch in genau zwei der 661 Referenzdateien,
 * `1.7_Gebäude.svg` und E.1.37 selbst — und zugleich das erste Zeichen des Katalogs überhaupt, das
 * eine Beschriftung auf eine **andere** Körperform als `formation` setzt. Damit ist eine Zahl bindend geworden, die
 * bis dahin an zwei Lesarten zugleich passte: die mittige Grundlinie rechnet in `compose.ts` seit
 * diesem Teilslice gegen die Körper**unter**kante (`maxY − 8`) statt gegen die Oberkante
 * (`minY + 12`). An `formation` sind beide dieselbe Zahl, am Gebäudekörper stehen 18,0 gegen
 * 15,0 mm — die Begründung steht dort, der verbleibende Millimeter Unterschied zur Referenz in
 * `ANHANG_E_C_FILL_FINDINGS`.
 *
 * **Zweitens die Kopfzone von E.1.31, die keine ist.** Wo die anderen acht einen Stärkegrad tragen,
 * führt „System Bereitstellungsraum 500" zwei senkrechte Balken, für die es keinen `StrengthId`
 * gibt. Der Katalog baut das Zeichen ohne Kopfzone; das ist die einzige deklarierte Abweichung
 * dieses Teilslice und trägt ein technisches Review mit `status: 'deviation'` (Note in
 * `coverage-manifest.ts`).
 *
 * **Drittens hängt die Einordnung zweier Zeichen allein an der Geometrie.** E.1.30 („Media Team")
 * und E.1.36 („Virtual Operations Support Team") tragen kein Stärkewort im Dateinamen und dennoch
 * eine volle Kopfreihe — E.1.30 zwei Marken bei cx 11,0000 und 21,0002 mm, E.1.36 alle drei bei
 * 11,0000/15,9999/21,0002 mm, beide bei cy 3,4999 mm und r 1,5 mm. Die Zuordnung zu `gruppe` bzw.
 * `zug` ruht damit auf Zahl und Lage der Teilpfade und nicht auf dem Titel. Geometrisch ist sie
 * eindeutig, fachlich ist sie ungeprüft.
 *
 * **Viertens eine Falle im Quelltext, die einmal genannt gehört statt dreimal:** E.1.33, E.1.34 und
 * E.1.35 führen ihre `trupp`-Marke als `<circle cx="45.354" cy="9.921" r="4.252"/>` und nicht als
 * Pfad. Wer die Strichebene nur nach `<path>` absucht, hält diese drei fälschlich für
 * kopfzonenlos — und spräche zugleich E.1.37 fälschlich frei, dessen Kopfzone tatsächlich fehlt.
 * Die belastbare Prüfung ist die Teilpfad-Buchführung: bei E.1.29 bis E.1.36 führt die Strichebene
 * genau zwei Formen (Rahmen und Kopfform), bei E.1.37 genau eine mit zwei Teilpfaden — Außen- und
 * Innenkontur des 0,5-mm-Strichs, und damit ist sie restlos erklärt.
 *
 * **Drei der neun Referenzdateien tragen Befunde** (`ANHANG_E_C_FILL_FINDINGS`), sechs sind
 * normgerecht — E.1.30 und E.1.32 bis E.1.36. Über alle 37 E.1-Dateien gemessen sind es 22
 * normgerechte; der Katalog baut auch die 15 übrigen auf deren Werten. Neu gegenüber E-b ist keine
 * Bauart, sondern nur die Zahl: die Norm ist jetzt an allen 37 Dateien belegt statt an 28.
 *
 * Wie die 22 zustande kommen, gehört dazu, weil die Zahl seit E-a in mehreren Notizen steht: **19**
 * sind direkt an einer flachfüßigen Glyphe des mittigen Laufs abgelesen. Drei weitere führen dort
 * keine solche Glyphe (E.1.9 „Öl", E.1.10 „O", E.1.13 „Sp") und stehen mit 18,0848 mm scheinbar
 * 0,0848 mm zu tief — im Band des Bogenunterschnitts runder Füße, der an drei Läufen dieses
 * Teilslice gemessen ist, die beides zugleich führen: E.1.29 S 14,5849 gegen T 14,4999, E.1.31 S
 * 15,0844 gegen B/R 15,0001, E.1.37 O 19,0846 gegen V 18,9999 — 0,0850/0,0843/0,0847 mm. Abzüglich
 * ihres eigenen Überschusses liegen alle drei auf 18,0000 mm. Das `l` von „Öl" taugt dafür übrigens nicht: sein Fuß läuft in
 * eine Kurve aus und endet bei 18,0633 mm, also in einer dritten, nirgends sonst gemessenen
 * Klasse — abgelesen wird deshalb am Ö.
 */
export const ANHANG_E_C_RECIPES = {
  'E.1.29': {
    title: 'Trupp Schwerer Transport',
    referenceAsset: 'E.1.29_Trupp Schwerer Transport.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'trupp',
      labels: { center: 'TS', bottomRight: 'THW' },
    },
  },
  /**
   * Kein Stärkewort im Dateinamen und dennoch die volle `gruppe`-Reihe: zwei Marken r 1,5 mm bei
   * cx 11,0000 und 21,0002 mm, cy 3,4999 mm, Mittelplatz frei. Die Einordnung ruht auf Zahl und
   * Lage der Teilpfade, nicht auf dem Titel — wer die Kopfzone aus dem Dateinamen ableitet, liegt
   * hier falsch. Ob ein „Media Team" fachlich eine Gruppe ist, entscheidet die Datei nicht.
   */
  'E.1.30': {
    title: 'Media Team',
    referenceAsset: 'E.1.30_Media Team.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'gruppe',
      labels: { center: 'MT', bottomRight: 'THW' },
    },
  },
  /**
   * Deklarierte Abweichung, die einzige dieses Teilslice. Die Referenz trägt an der Stelle der
   * Kopfzone **keinen Stärkegrad**, sondern zwei senkrechte Balken: je 1,500 × 4,000 mm bei
   * cx 12,000 und 20,000 mm, y 1,000…5,000 mm, Mitte also bei cy 3,000 mm. Alle vier Stärkegrade
   * sind dagegen aus Kreisen r 1,500 mm gebaut und keiner aus einem Rechteck: `trupp`, `gruppe`
   * und `zug` als Reihe auf den Plätzen 11/16/21 mm (absolut cy 3,500 mm), `staffel` als
   * senkrechter Stapel zweier Marken auf der Mittelachse — weder Form noch Lage stimmen überein,
   * und `StrengthId` kennt nur diese vier. Der Katalog baut das Zeichen
   * deshalb ohne Kopfzone; `spec.strength` fehlt hier als Abweichung und nicht als Versehen. Die
   * vollständige Begründung steht in der Note ihres technischen Reviews (`coverage-manifest.ts`).
   *
   * **Nicht die Fallzahl ist der Grund, sondern die fehlende Bedeutung** — das unterscheidet den
   * Fall von der Innenreihe aus E-b. Der Balkenpfad kommt in genau drei von 661 Referenzdateien vor
   * (E.1.31, `F.1.1_Medizinische Task Force.svg`, `F.1.3_Mobiles Betreuungsmodul 5000.svg`) und
   * dort byteweise identisch; eine vermessene Konstante liegt also vor. Was fehlt, ist der Begriff,
   * den diese Balken tragen — und den vergibt keine Messung.
   *
   * Die Zahl 500 des Dateinamens erscheint im Zeichen nicht: die Typo-Ebene führt genau acht
   * Glyphenpfade, fünf im mittigen Lauf und drei im `THW`-Lauf, und im gesamten E.1 kommt keine
   * Ziffer vor. Der Titel folgt deshalb dem Dateinamen, das Kürzel dem Bild.
   *
   * Die Groß- und Kleinschreibung ist dabei nicht geschätzt, sondern an den Glyphenhüllen
   * gemessen: S, B und R stehen auf Versalhöhe (Oberkanten 10,0457 bzw. zweimal 10,1307 mm bei
   * Grundlinie 15,0001 mm), y und s auf x-Höhe (y 11,5919, s 11,5069 mm — der Unterschied von
   * 0,0850 mm ist derselbe Bogenüberschuss, den die runden Füße nach unten zeigen, hier am
   * Scheitel des s nach oben), und das y trägt eine Unterlänge bis 16,4539 mm.
   */
  'E.1.31': {
    title: 'System Bereitstellungsraum 500',
    referenceAsset: 'E.1.31_System Bereitstellungsraum 500.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      labels: { center: 'SysBR', bottomRight: 'THW' },
    },
  },
  'E.1.32': {
    title: 'Technischer Zug',
    referenceAsset: 'E.1.32_Technischer Zug.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'zug',
      labels: { center: 'TZ', bottomRight: 'THW' },
    },
  },
  'E.1.33': {
    title: 'Trupp Einsatzstellensicherung',
    referenceAsset: 'E.1.33_Trupp Einsatzstellensicherung.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'trupp',
      labels: { center: 'ESS', bottomRight: 'THW' },
    },
  },
  'E.1.34': {
    title: 'Trupp Mobiler Hochwasserpegel',
    referenceAsset: 'E.1.34_Trupp Mobiler Hochwasserpegel.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'trupp',
      labels: { center: 'MHP', bottomRight: 'THW' },
    },
  },
  'E.1.35': {
    title: 'Trupp Unbemannte Luftfahrtsysteme',
    referenceAsset: 'E.1.35_Trupp Unbemannte Luftfahrtsysteme.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'trupp',
      labels: { center: 'UL', bottomRight: 'THW' },
    },
  },
  /**
   * Wie E.1.30 ein Zeichen ohne Stärkewort im Dateinamen, das dennoch eine volle Kopfreihe führt —
   * hier alle drei Plätze (cx 11,0000/15,9999/21,0002 mm, cy 3,4999 mm, r 1,5 mm), also `zug`.
   * Mit vier Glyphen das zweitlängste Kürzel dieses Teilslice — **nicht** das längste, wie hier
   * zunächst stand: `SysBR` (E.1.31) führt fünf Glyphen und ist auch an der Tinte breiter
   * (Referenzlauf 7,4344…24,7287 = 17,294 mm gegen 7,7347…24,4076 = 16,673 mm). Die Sichtprüfung
   * hat die Kleinrasterung deshalb an `SysBR` geführt und `VOST` daneben gestellt.
   */
  'E.1.36': {
    title: 'Virtual Operations Support Team',
    referenceAsset: 'E.1.36_Virtual Operations Support Team.svg',
    spec: {
      kind: 'formation',
      organization: 'thw',
      strength: 'zug',
      labels: { center: 'VOST', bottomRight: 'THW' },
    },
  },
  /**
   * Das einzige Zeichen des Anhangs mit **Gebäudekörper** und der dritte Fall in E.1 ohne
   * Kopfzone nach E.1.3 und E.1.21 — `spec.strength` fehlt hier bewusst. Belegt ist das über die
   * Teilpfad-Buchführung und nicht über die Abwesenheit eines Elementtyps: die Ebene
   * `Takt_Zeichen (umgewandelt)` trägt genau einen Pfad mit zwei Teilpfaden, Außen- und
   * Innenkontur des 0,5-mm-Strichs, und ist damit restlos erklärt.
   *
   * **Die Zuschnittsnotiz vom 11. August ist hier zur Hälfte zu berichtigen.** Sie sagt, E.1.37
   * trage das Polygon aus `1.7_Gebäude.svg` „zeichengleich". Für die **Füllebene** stimmt das: der
   * Punktezug ist in beiden Dateien byteidentisch und kommt in genau zwei der 661 Dateien vor. Für
   * die **Strichebene** nicht: `1.7` führt dort drei Teilpfade und zieht damit eine waagerechte
   * Traufkante bei y 10,000…10,500 mm, E.1.37 führt zwei mit durchgehender Hauskontur und hat diese
   * Kante nicht. `BODIES.building` zeichnet ebenfalls keine Traufkante — der Katalogkörper folgt
   * E.1.37 und nicht `1.7`.
   *
   * Die Füllfläche der Referenz ist zweiteilig (Dachdreieck 4,1035…10,0002 mm, Rechteck
   * 11,0000…24,9999 mm, dazwischen ein weißes Band von 1,0 mm Höhe); `BODIES.building` bildet sie
   * wie überall als **eine** Fläche ab — dieselbe geerbte Eigenschaft von `base-symbols.ts`, die
   * schon in E-a und E-b das weiße Innenfeld der Referenz nicht abbildet, und keine Entscheidung
   * dieses Teilslice.
   */
  'E.1.37': {
    title: 'Ortsverband',
    referenceAsset: 'E.1.37_Ortsverband.svg',
    spec: {
      kind: 'building',
      organization: 'thw',
      labels: { center: 'OV', bottomRight: 'THW' },
    },
  },
} as const satisfies Record<string, Recipe>;

/**
 * Die drei Referenzdateien dieses Teilslice, deren Füllfläche oder Grundlinien von der Norm der 22
 * normgerechten E.1-Dateien abweichen (Füllfläche 7,0…25,0 mm, mittige Grundlinie 18,0 mm,
 * `THW`-Grundlinie 24,0 mm, Grundlinienabstand 6,0 mm). Wie `ANHANG_E_A_FILL_DEFECTS` und
 * `ANHANG_E_B_FILL_FINDINGS` stehen sie hier als Datum, damit die Manifestzeile ihren Reviewvermerk
 * daraus ableitet statt den Befund ein zweites Mal zu behaupten. Die sechs übrigen — E.1.30 und
 * E.1.32 bis E.1.36 — sind normgerecht und fehlen hier deshalb.
 *
 * **`FINDINGS` wie in E-b und nicht `DEFECTS` wie in E-a:** bei E.1.29 folgt die Verschiebung im
 * Grundsatz dem Muster von E.1.6/E.1.14, trägt aber einen Grundlinienabstand, den die Verschiebung
 * nicht erklärt; und bei E.1.37 ist die Abweichung bei n = 1 im gesamten Bestand gar nicht als
 * Defekt entscheidbar. Die Benennung des Exports soll das nicht überschreiben.
 */
export const ANHANG_E_C_FILL_FINDINGS: Readonly<Record<string, string>> = Object.freeze({
  'E.1.29':
    'Blaue Füllfläche der Referenz unten um 2,5 mm verkürzt (22,5 statt 25,0 mm), die ' +
    'Beschriftung nach oben verschoben (mittige Grundlinie 14,5, THW-Grundlinie 21,5 mm); ' +
    'Rahmen und Kopfzone stehen normal. Im Grundsatz das Muster von E.1.6/E.1.14 aus E-a, mit ' +
    'demselben zusätzlichen Befund wie E.1.27 und E.1.28: der Abstand zwischen mittiger und ' +
    'THW-Grundlinie ist 7,0 mm, wo 30 der 37 E.1-Dateien 6,0 mm führen — und die Verschiebung ' +
    'der Fläche erklärt ihn nicht (die Fläche fehlt unten um 2,5 mm, die THW-Zeile wandert um ' +
    '2,5 mm mit, der mittige Lauf um 3,5 mm). Diese Klasse ist mit E.1.29 dreifach belegt. Der ' +
    'Katalog baut das Zeichen wie die 22 normgerechten E.1-Dateien.',
  'E.1.31':
    'Blaue Füllfläche der Referenz unten um 3,0 mm verkürzt (22,0 statt 25,0 mm), die gesamte ' +
    'Beschriftung um dieselben 3,0 mm nach oben verschoben (mittige Grundlinie 15,0, ' +
    'THW-Grundlinie 21,0 mm), Grundlinienabstand normgerecht 6,0 mm; der Rahmen steht normal. ' +
    'Das Muster von E.1.6/E.1.14 aus E-a, in allen vier Größen zahlengleich mit E.1.23 aus E-b — ' +
    'dessen Klasse steigt damit von einem auf zwei Fälle. Der Katalog baut das Zeichen wie die ' +
    '22 normgerechten E.1-Dateien. Die Kopfzone ist von diesem Befund unberührt und eine eigene, ' +
    'schwerere Sache; sie trägt ein technisches Review mit status: deviation.',
  'E.1.37':
    'Das einzige Zeichen des Anhangs mit Gebäudekörper, und der Befund liegt allein an der ' +
    'mittigen Grundlinie: sie steht bei 19,0 statt 18,0 mm, der Grundlinienabstand damit bei 5,0 ' +
    'statt 6,0 mm — das Gegenstück zu den 7,0 mm von E.1.27/E.1.28/E.1.29, während 30 der 37 ' +
    'E.1-Dateien 6,0 mm führen. Drei der vier Normwerte stehen: THW-Grundlinie 23,9995 ≈ 24,0 mm, ' +
    'Unterkante der Füllfläche 24,9999 ≈ 25,0 mm, rechte Tintenkante des THW-Laufs 29,027 mm wie ' +
    'in allen 37 Dateien. Die Oberkante der Füllfläche ist gegen die 7,0 mm der Norm nicht ' +
    'vergleichbar, weil die Füllung bei dieser Körperform zweiteilig ist (Dachdreieck ' +
    '4,1035…10,0002 mm, Rechteck 11,0000…24,9999 mm, dazwischen ein weißes Band von 1,0 mm). Der ' +
    'Katalog folgt der Mehrheit und setzt die mittige Grundlinie auf 18,0 mm; er weicht damit um ' +
    '1,0 mm von der Referenz ab, und das ist im Paarbild sichtbar. E.1.37 ist dabei der einzige ' +
    'Befund des Anhangs, dessen Unterschied allein an der Lage der Beschriftung hängt: die 14 ' +
    'übrigen Befunddateien tragen eine verkürzte Füllfläche und zeigen sie als weißen Streifen, ' +
    'der das Auge führt — hier ist die Fläche unten normgerecht. Ob die 19,0 mm die ' +
    'Konvention des Gebäudekörpers sind oder ein Defekt dieser einen Datei, entscheidet bei n = 1 ' +
    'keine Messung — deshalb steht dies als Befund und nicht als Abweichung der Umsetzung.',
});
