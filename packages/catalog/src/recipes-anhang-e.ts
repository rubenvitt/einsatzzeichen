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

/**
 * Anhang E, Teilslice E-d: die Landfahrzeuge E.2.1 bis E.2.21 des THW — der erste der drei
 * Blöcke aus E.2 und der erste des Anhangs, der nicht auf `formation` steht.
 *
 * **Was gleich bleibt wie in E.1:** es sind Kompositionen und keine Piktogramme, sie tragen die
 * Körperfarbe `blau` der Organisation `thw`, ihre Bedeutung liegt in den Beschriftungszonen, und
 * die Kürzel sind am Referenzbild abgelesen und nicht aus der Datei gelesen — die Glyphen liegen
 * auch hier in Kurven umgewandelt vor. Abgelesen wurde aus zwei eigenen Rasterungen
 * (Kontaktbogen 620 px je Zeichen, Ausschnittsbogen 1500 px je Lauf) und gegen den Dateinamen
 * gehalten.
 *
 * **Was neu ist, und zwar viererlei.**
 *
 * **Erstens der Körper und die Zone unter ihm.** 19 der 20 gebauten Zeichen stehen auf
 * `vehicle-land`, E.2.15 auf dem eigenen `swap-loader-vehicle`. Die Landfahrzeughülle misst in
 * **allen 20** Landfahrzeugen des Quellblocks E.2.1 bis E.2.21 zahlengleich
 * 1,0001/5,7503/31,0003/26,0004 mm (selbst nachgezählt), der Wechselladerrumpf
 * 2,5001/6,0000/31,0000/24,5004 mm — genau 1 der 661 Referenzdateien. Statt einer Kopfzone tragen sie eine
 * **Fahrwerkszone** unterhalb der Körperunterkante; keines der 31 Zeichen aus E.2 führt
 * überhaupt eine Kopfzone, und `strength` fehlt deshalb in allen 30 Rezepten dieses Slice als
 * Sachaussage und nicht als Lücke.
 *
 * **Zweitens ist die Fahrzeugkategorie an der Strichebene gemessen und nicht aus dem Dateinamen
 * gelesen.** Übrig bleibt nach Abzug des Rahmens genau die Fahrwerksmarke: zwei Ringe auf
 * cx 3,7502/28,2499 (`kfz-kategorie-1`), drei auf 3,7502/16,0001/28,2499 ohne Verbindungsstrich
 * (`kfz-kategorie-2`), dieselben drei mit zwei Balken in den Lücken 5,2433…14,5062 und
 * 17,4932…26,7561 bei y 26,2502…28,0000 (`kfz-kategorie-3`) und ein Stadion
 * 2,2500/26,2502/29,7501/30,2500 (`kettenfahrzeug`). Die Zuschnittsnotiz vom 11. August ist damit
 * in ihrem Abschnitt 6 zu berichtigen: sie hält E.2.4, E.2.6, E.2.7, E.2.8, E.2.9, E.2.11 und
 * E.2.15 für „mit keiner 5.1.1-Datei mengengleich" und trennt E.2.11 von E.2.4/E.2.7. Selbst
 * vermessen tragen E.2.4, E.2.6, E.2.7, E.2.8 und E.2.11 **dieselbe** Strichebene, untereinander
 * punktgleich und mit `5.1.1.3` mengengleich. E.2.9 trägt die Kette und ist mit `5.1.1.5`
 * mengengleich — es ist das einzige Kettenfahrzeug des Anhangs. Damit bleibt allein E.2.15
 * übrig, und auch dort ist die Restmenge das Radpaar der Kategorie 1; der Rest ist sein eigener
 * Körper.
 *
 * **Drittens setzt E.2 seine mittigen Kürzel nicht durchgehend im Normgrad.** Neun der 19
 * mittigen Läufe dieses Blocks sind kleiner gesetzt und tragen deshalb ein gemessenes
 * `centerCapHeightMm`; die übrigen bleiben beim Normwert. Selbst gerastert als Gegenprobe: ohne
 * die gemessenen Zahlen treten sechs Läufe aus der 28-mm-Box, mit 16/6/430/520/313/464
 * Tintenpixeln bei 256 px — mit ihnen null. Eine **Auslöseregel gibt es nicht**, und das ist
 * gemessen und nicht offen: von den neun bräuchten nur drei die Verkleinerung überhaupt.
 *
 * **Viertens ist E.2 nicht durchgehend versal.** `Stapler`, `Telelader`, `Radlader`, `Bagger` und
 * `MastKW` schreiben aus oder beginnen klein, wo E.1 ausschließlich Versalkürzel führt. Eine
 * Kürzelregel „nur Großbuchstaben" wäre an diesem Block falsch. Ebenfalls neu und nur hier: kein
 * einziges Zeichen des Anhangs E.2 belegt die Zone unten links.
 *
 * **E.2.6 fehlt in diesem Block, und zwar begründet** — siehe `ANHANG_E_D_UNGEBAUT`. Damit trägt
 * E-d 20 statt 21 Zeichen und Anhang E 67 statt 68.
 */
export const ANHANG_E_D_RECIPES = {
  'E.2.1': {
    title: 'Personenkraftwagen, straßenfähig',
    referenceAsset: 'E.2.1_Personenkraftwagen_straßenfähig.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'thw',
      vehicleCategory: 'kfz-kategorie-1',
      labels: { center: 'PKW', bottomRight: 'THW' },
    },
  },
  'E.2.2': {
    title: 'Mannschaftstransportwagen, straßenfähig',
    referenceAsset: 'E.2.2_Mannschaftstransportwagen_straßenfähig.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'thw',
      vehicleCategory: 'kfz-kategorie-1',
      labels: { center: 'MTW', bottomRight: 'THW' },
    },
  },
  /**
   * Drei Radringe auf cx 3,7502 / 16,0001 / 28,2499 mm und **kein** Verbindungsstrich — das
   * trennt `kfz-kategorie-2` von `kfz-kategorie-3`, deren Ringe an denselben Stellen stehen. Der
   * Dateiname („geländefähig") sagt dasselbe, entscheidet es aber nicht: E.2.12 und E.2.13 heißen
   * „geländegängig" und tragen dieselbe Marke.
   */
  'E.2.3': {
    title: 'Gerätekraftwagen, geländefähig',
    referenceAsset: 'E.2.3_Gerätekraftwagen_geländefähig.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'thw',
      vehicleCategory: 'kfz-kategorie-2',
      labels: { center: 'GKW', bottomRight: 'THW' },
    },
  },
  /**
   * Das erste Zeichen des Anhangs mit Verbindungsstrichen zwischen den Radringen: die Strichebene
   * führt sieben Teilpfade, darunter die beiden Balken 5,2433…14,5062 und 17,4932…26,7561 bei
   * y 26,2502…28,0000 mm. Zeichengleich mit E.2.7, E.2.8 und E.2.11 (und mit E.2.6, das dieser
   * Block nicht baut).
   */
  'E.2.4': {
    title: 'All Terrain Vehicle, geländegängig',
    referenceAsset: 'E.2.4_All Terrain Vehicle_geländegängig.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'thw',
      vehicleCategory: 'kfz-kategorie-3',
      labels: { center: 'ATV', bottomRight: 'THW' },
    },
  },
  /**
   * Das erste Zeichen des Anhangs mit einem **ausgeschriebenen Wort** statt eines
   * Versalienkürzels. Sein Schriftgrad ist der Normwert, und das ist bei einem Lauf ohne
   * flachfüßige **und** flachköpfige Versalie nicht direkt ablesbar: das `S` überschießt oben wie
   * unten um 0,0850 bzw. 0,0843 mm. Belegt ist der Grad deshalb an zwei anderen Glyphen desselben
   * Laufs — das `t` misst 4,4316 mm, zahlengleich mit dem `t` von `MzPt` (E.2.31), das neben
   * einem flachen `M` von 4,8694 mm steht; und das `r` steht mit maxY 18,0001 mm auf der
   * Normgrundlinie.
   */
  'E.2.5': {
    title: 'Gabelstapler, straßenfähig',
    referenceAsset: 'E.2.5_Gabelstapler_straßenfähig.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'thw',
      vehicleCategory: 'kfz-kategorie-1',
      labels: { center: 'Stapler', bottomRight: 'THW' },
    },
  },
  /**
   * Kappenhöhe 4,3829 mm, gemessen an der einzigen flachen Versalie des Laufs (`T`, Glyphenhülle
   * 4,1035/13,6169/7,4828/17,9998 mm) — 0,9001 des Normwerts.
   *
   * **Das Kürzel widerspricht dem Dateinamen, und der Katalog folgt dem Bild.** Die Datei heißt
   * „Teleskopstapler", gezeichnet ist `Telelader`. Aus zwei eigenen Rasterungen abgelesen und am
   * Glyphenzensus bestätigt: die Typo-Ebene führt neun Glyphen im mittigen Lauf, „Teleskopstapler"
   * hätte vierzehn. Welche der beiden Angaben fachlich trägt, entscheidet die Datei nicht; der
   * Befund steht in `ANHANG_E_D_FINDINGS`.
   */
  'E.2.7': {
    title: 'Teleskopstapler, geländegängig',
    referenceAsset: 'E.2.7_Teleskopstapler_geländegängig.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'thw',
      vehicleCategory: 'kfz-kategorie-3',
      labels: { center: 'Telelader', bottomRight: 'THW', centerCapHeightMm: 4.3829 },
    },
  },
  /**
   * Kappenhöhe 4,3826 mm (`R`, n = 1) — 0,9000 des Normwerts. Acht Glyphen; die Kurzform „BRmG"
   * des Dateinamens erscheint im Bild **nicht**, und zwar in keinem der drei Bergungsräumgeräte
   * (E.2.8 `Radlader`, E.2.9 und E.2.10 je `Bagger`).
   */
  'E.2.8': {
    title: 'Bergungsräumgerät Radlader, geländegängig',
    referenceAsset: 'E.2.8_Bergungsräumgerät Radlader_geländegängig.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'thw',
      vehicleCategory: 'kfz-kategorie-3',
      labels: { center: 'Radlader', bottomRight: 'THW', centerCapHeightMm: 4.3826 },
    },
  },
  /**
   * Das einzige Kettenfahrzeug des Anhangs. Seine Strichebene führt drei Teilpfade, der dritte
   * ist das Stadion 2,2500/26,2502/29,7501/30,2500 mm — die Katalogausgabe (`rect` 2/26,
   * 28 × 4,5 mm, `rx` 2,25) trifft es auf 0,0002 mm.
   *
   * **Das Kürzel ist `Bagger` und nicht „BRmG R".** Die Spezifikation, die dieser Slice aus der
   * Gegenprüfung von LFH-424 übernommen bekommen hat, gibt die Datei nicht wieder; das ist die
   * dritte unabhängige Ablesung mit demselben Ergebnis. Der Glyphenzensus schließt: die Typo-Ebene
   * führt sechs Glyphen im mittigen Lauf und drei im `THW`-Lauf, „BRmG R" hätte fünf getinte
   * Glyphen im mittigen.
   */
  'E.2.9': {
    title: 'Bergungsräumgerät Bagger, Kettenantrieb',
    referenceAsset: 'E.2.9_Bergungsräumgerät Bagger_Kettenantrieb.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'thw',
      vehicleCategory: 'kettenfahrzeug',
      labels: { center: 'Bagger', bottomRight: 'THW' },
    },
  },
  /**
   * Derselbe Lauf `Bagger` wie E.2.9 in derselben Breite (19,4596 mm), aber 0,7691 mm weiter
   * links: Tintenmitte 15,4744 gegen 16,2435 mm. Der Katalog setzt ihn mittig, weil
   * `labelPrimitives` für die mittige Zone nur `anchor: 'middle'` auf die Körpermitte kennt —
   * und weil die Quelle hier von sich selbst abweicht: die 20 übrigen mittigen Läufe des
   * Quellblocks E.2.1 bis E.2.21 liegen zwischen 16,0099 und 16,3781 mm, E.2.10 ist der einzige
   * Ausreißer. Befund, keine
   * Abweichung der Umsetzung.
   */
  'E.2.10': {
    title: 'Bergungsräumgerät Bagger, Radantrieb',
    referenceAsset: 'E.2.10_Bergungsräumgerät Bagger_Radantrieb.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'thw',
      vehicleCategory: 'kfz-kategorie-2',
      labels: { center: 'Bagger', bottomRight: 'THW' },
    },
  },
  /** Die Bindestriche des Dateinamens erscheinen im Bild nicht: drei Glyphen, `ERS`. */
  'E.2.11': {
    title: 'Einsatz-Rettungs-Spinne, geländefähig',
    referenceAsset: 'E.2.11_Einsatz-Rettungs-Spinne_geländefähig.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'thw',
      vehicleCategory: 'kfz-kategorie-3',
      labels: { center: 'ERS', bottomRight: 'THW' },
    },
  },
  /**
   * Kappenhöhe 3,40995 mm — 0,7003 des Normwerts und die kleinste Stufe des Anhangs, einstimmig
   * an `M`, `W` und `L` gemessen. Ohne diese Zahl treten 430 Tintenpixel aus der 28-mm-Box, selbst
   * gerastert bei 256 px: der lauteste der sechs Ausfälle, die der Normgrad in diesem Block
   * erzeugt.
   */
  'E.2.12': {
    title: 'Mehrzweckgerätewagen Ladebordwand, geländegängig',
    referenceAsset: 'E.2.12_Mehrzweckgerätewagen Ladebordwand_geländegängig.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'thw',
      vehicleCategory: 'kfz-kategorie-2',
      labels: { center: 'MzGW Lbw', bottomRight: 'THW', centerCapHeightMm: 3.40995 },
    },
  },
  /**
   * Kappenhöhe 3,40995 mm (0,7002), gemessen an fünf der sechs flachen Versalien; das `I` liegt
   * mit 3,4096 mm eine Exportrundungsstufe darunter. Der breiteste mittige Lauf des Slice.
   *
   * **Zwei Befunde am Dateinamen:** er schreibt die Zahl arabisch („Mannschaftslastwagen 4"), das
   * Bild römisch (`IV`, zwei getrennte Versalien 14,878…16,257 und 16,529…19,429 mm); und er trägt
   * den Tippfehler „geländegänig".
   */
  'E.2.13': {
    title: 'Mannschaftslastwagen 4 Ladebordwand, geländegängig',
    referenceAsset: 'E.2.13_Mannschaftslastwagen 4 Ladebordwand_geländegänig.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'thw',
      vehicleCategory: 'kfz-kategorie-2',
      labels: { center: 'MLW IV Lbw', bottomRight: 'THW', centerCapHeightMm: 3.40995 },
    },
  },
  /**
   * Der sauberste Beleg dafür, dass die E.2-Landfahrzeuge auf den heutigen Konstanten stehen:
   * vier flache Versalien, alle vier 4,8694 mm hoch, Grundlinien 18,0001 und 23,9998 mm bei
   * Körperunterkante 26,0004 mm. Wie E.2.13 schreibt der Dateiname die Zahl arabisch und das Bild
   * römisch (`V`, auf Versalhöhe wie `M`, `L` und `W`).
   */
  'E.2.14': {
    title: 'Mannschaftslastwagen 5, straßenfähig',
    referenceAsset: 'E.2.14_Mannschaftslastwagen 5_straßenfähig.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'thw',
      vehicleCategory: 'kfz-kategorie-1',
      labels: { center: 'MLW V', bottomRight: 'THW' },
    },
  },
  /**
   * Das schwierigste Zeichen dieses Blocks — vier Dinge stehen hier gleichzeitig anders als bei
   * den 19 übrigen, und alle vier sind gemessen:
   *
   * 1. **eigene Körperform** `swap-loader-vehicle` (Füllhülle 2,5001/6,0000/31,0000/24,5004 mm,
   *    genau 1 der 661 Referenzdateien und **nicht** deckungsgleich mit `5.1.1.8`, dessen
   *    Füllkörper 3,9998/6,0000/31,0000/24,9999 misst);
   * 2. **L-Rahmen als Zusatzprimitiv** am Grundzeichen (Innenkontur 1,2499/6,2502/30,7499/25,7503,
   *    Knick auf x 2,2500 und y 24,7505 mm) — er ist der Grund, warum diese Zeile **keine**
   *    `deviation` trägt;
   * 3. **Fahrwerk an der Unterkante des Grundzeichens** (26,0) und nicht an der des Körpers
   *    (24,5004): Radmitte 28,2504 mm wie in allen 25 Fahrwerkszeichen. Ohne diese Bindung säßen
   *    die Räder auf 26,75 mm, 1,5 mm daneben;
   * 4. **mittige Grundlinie 7,5 mm** über der Körperunterkante statt 8,0 — gemessen 17,0000 mm bei
   *    24,5004 mm, als Wert im Profil und nicht als eigener Mechanismus.
   *
   * Das Kürzel ist `LKW`, drei Glyphen; „WLF" oder „Wechsellader" kommen im Bild nicht vor. Die
   * `THW`-Zeile steht dabei regelgerecht 2,0002 mm über der Körperunterkante — die Sonderlage der
   * Beschriftung betrifft allein die mittige Zone.
   */
  'E.2.15': {
    title: 'Wechselladerfahrzeug, straßenfähig',
    referenceAsset: 'E.2.15_Wechselladerfahrzeug_straßenfähig.svg',
    spec: {
      kind: 'swap-loader-vehicle',
      organization: 'thw',
      vehicleCategory: 'kfz-kategorie-1',
      labels: { center: 'LKW', bottomRight: 'THW' },
    },
  },
  /**
   * Kappenhöhe 4,38273 mm. Die vier flachen Versalien des Laufs teilen sich 2:2 auf zwei Werte,
   * die genau **eine** Exportrundungsstufe auseinanderliegen (`L` zweimal 4,382911, `K` und `W` je
   * 4,382558; Schrittweite 0,001 Einheiten = 0,000353 mm). Gegenprobe gegen eine Buchstabenneigung:
   * an den Normläufen E.2.15 und E.2.18 messen `L`, `K` und `W` alle drei exakt 4,869392 mm — es
   * gibt keine, und der Eintrag steht deshalb auf der Mitte der beiden gemessenen Werte.
   *
   * Ohne die Zahl bleibt der Lauf in der Box und ist trotzdem 11 % zu groß — der stille Teil des
   * Befunds, den kein Gate meldet.
   */
  'E.2.16': {
    title: 'Lastkraftwagen Ladekran, straßenfähig',
    referenceAsset: 'E.2.16_Lastkraftwagen Ladekran_straßenfähig.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'thw',
      vehicleCategory: 'kfz-kategorie-1',
      labels: { center: 'LKW Lkr', bottomRight: 'THW', centerCapHeightMm: 4.38273 },
    },
  },
  /**
   * Kappenhöhe 4,38273 mm, dieselbe 2:2-Bindung wie bei E.2.16 und aus demselben Grund aufgelöst.
   *
   * Dieser Lauf **widerlegt die Breitenschwelle**: bei voller Größe bräuchte er in der Referenz
   * 27,16 mm und passte damit in die 28-mm-Box — verkleinert ist er trotzdem. Von den neun
   * verkleinerten Läufen des Anhangs bräuchten nur drei die Verkleinerung.
   */
  'E.2.17': {
    title: 'Lastkraftwagen Ladebordwand, straßenfähig',
    referenceAsset: 'E.2.17_Lastkraftwagen Ladebordwand_straßenfähig.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'thw',
      vehicleCategory: 'kfz-kategorie-1',
      labels: { center: 'LKW Lbw', bottomRight: 'THW', centerCapHeightMm: 4.38273 },
    },
  },
  /**
   * Der Bindestrich ist Teil des mittigen Laufs und **keine eigene Zone**: eigener Glyphenpfad
   * 19,944…21,878 mm bei y 15,551…16,130 mm, also mitten im Lauf. Wer die Grundlinie als kleinstes
   * maxY der Glyphen liest, trennt ihn fälschlich ab und misst 16,1297 statt 18,0001 mm. Wie in
   * E-b setzt der Katalog U+002D.
   */
  'E.2.18': {
    title: 'Lastkraftwagen Kipper, geländefähig',
    referenceAsset: 'E.2.18_Lastkraftwagen Kipper_geländefähig.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'thw',
      vehicleCategory: 'kfz-kategorie-2',
      labels: { center: 'LKW-K', bottomRight: 'THW' },
    },
  },
  /**
   * Kappenhöhe 4,3829 mm, gemessen an `K` und `W`; das `F` liegt mit 4,3833 mm eine
   * Exportrundungsstufe darüber, die Mehrheit entscheidet.
   *
   * **Das abschließende `W` ist eine Versalie** (4,3829 mm wie `K`, Oberkante 13,6172 mm wie `F`
   * und `K`) — die geläufige Schreibung „FüKw" gibt das Bild nicht her; bei 1500 px nachgesehen.
   * Das `ü` ist **ein** Glyph mit zwei Punkten und nicht zwei.
   */
  'E.2.19': {
    title: 'Führungskraftwagen, geländefähig',
    referenceAsset: 'E.2.19_Führungskraftwagen_geländefähig.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'thw',
      vehicleCategory: 'kfz-kategorie-2',
      labels: { center: 'FüKW', bottomRight: 'THW', centerCapHeightMm: 4.3829 },
    },
  },
  /**
   * Kappenhöhe 3,65125 mm — 0,7498 des Normwerts, einstimmig an allen vier flachen Versalien
   * (`F`, `K`, `K`, `W`). Sieben Glyphen; `o` und `m` stehen auf x-Höhe, das abschließende `W` ist
   * wie bei E.2.19 versal.
   */
  'E.2.20': {
    title: 'Führungs- Kommunikationskraftwagen, straßenfähig',
    referenceAsset: 'E.2.20_Führungs- Kommunikationskraftwagen_straßenfähig.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'thw',
      vehicleCategory: 'kfz-kategorie-1',
      labels: { center: 'FüKomKW', bottomRight: 'THW', centerCapHeightMm: 3.65125 },
    },
  },
  /**
   * Kappenhöhe 4,3826 mm, einstimmig an `M`, `K` und `W`. Der Mast ist nicht gezeichnet — die
   * Strichebene führt außer Rahmen und Fahrwerk nichts, und die Bedeutung liegt allein im Kürzel.
   */
  'E.2.21': {
    title: 'Mastkraftwagen, geländefähig',
    referenceAsset: 'E.2.21_Mastkraftwagen_geländefähig.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'thw',
      vehicleCategory: 'kfz-kategorie-2',
      labels: { center: 'MastKW', bottomRight: 'THW', centerCapHeightMm: 4.3826 },
    },
  },
} as const satisfies Record<string, Recipe>;

/**
 * **Das eine Zeichen des Anhangs E, das dieser Slice nicht baut, und der Grund dafür.**
 *
 * Es steht als eigener Export und nicht als Kommentarzeile, damit ein Test es lesen kann: eine
 * fehlende Manifestzeile ist sonst genau die Art Lücke, die niemand bemerkt. Sobald die Zustimmung
 * zur Gate-Änderung vorliegt, wird aus diesem Eintrag ein Rezept, aus `E.1` plus 30 Einzelzeilen
 * ein `E` im Manifest-`scope`, und dieser Export verschwindet.
 */
export const ANHANG_E_D_UNGEBAUT: Readonly<Record<string, string>> = Object.freeze({
  'E.2.6':
    'Gabelstapler öffentliche Gefahrenabwehr, THW betrieben, geländegängig — nicht gebaut, weil ' +
    'die Umsetzung eine Änderung an einem Gate-Vertrag erzwingen würde, für die keine ' +
    'ausdrückliche Zustimmung vorliegt. Gemessen ist alles Übrige. Die **Beschriftung** ist die ' +
    'von E.2.5 („Stapler" mittig, „THW" unten rechts) und weicht von ihr um höchstens 0,0007 mm ' +
    'ab (THW-Lauf 19,9877 gegen 19,9870 an der linken Tintenkante, mittiger Lauf 5,9736 gegen ' +
    '5,9739). Das **Fahrwerk** ist es ausdrücklich nicht: E.2.5 führt vier Teilpfade in der ' +
    'Strichebene und damit zwei Räder (kfz-kategorie-1), E.2.6 sieben und damit drei Räder mit ' +
    'zwei Verbindungsbalken (kfz-kategorie-3, zeichengleich mit E.2.4, E.2.7, E.2.8 und E.2.11). ' +
    'Der Baubeschluss dieses Slice sagt „Fahrwerk und Beschriftung sind zeichengleich mit E.2.5" ' +
    '— die zweite Hälfte hält, die erste ist an der Datei widerlegt. Der zweite Füllpfad trägt ' +
    '#fa8c00 = ' +
    'organizationColor("sonstige-gefahrenabwehr") auf der Hülle 2,0002/7,1138/30,0002/25,0007 mm ' +
    '— punktgleich mit dem blauen Farbfeld der zehn übrigen Landfahrzeuge des Blocks. Damit ist ' +
    'es das einzige Zeichen des Anhangs mit orangem Körper und zugleich weissem Trägerkürzel. ' +
    'Sobald ein Rezept organization: "sonstige-gefahrenabwehr" mit Beschriftung führt, leitet ' +
    'labelContrastRequirements() daraus die Anforderung „weiss auf orange" mit der Textschwelle ' +
    '4,5:1 ab, und die fällt in jedem Theme: selbst nachgerechnet 2,382:1 im Referenz- und im ' +
    'accessible-light-Theme, 2,323:1 im Drucktheme (die Zahlen stehen als Test in ' +
    'a11y-contrast-gate.test.ts). Für accessible-light wäre das lösbar, für print-monochrome ' +
    'nicht: weiss ab 4,5:1 verlangt eine Relativluminanz von höchstens 0,1833, die ' +
    'Piktogrammpaare „schwarz auf orange" verlangen mindestens 0,1000, und der eigene ' +
    'Helligkeitsabstand von mehr als 0,045 je Organisation verlangt Abstand zu rot und blau — das ' +
    'Fenster ist leer. Der Ausweg wäre ein zweiter erklärter Negativbefund im Drucktheme nach dem ' +
    'Muster von „hält Schwarz auf BABZ-Blau im Referenztheme als bekannten Negativbefund fest"; ' +
    'das ändert einen Gate-Vertrag und ist deshalb keine Messfrage, sondern eine Entscheidung.',
});

/**
 * Die neun Referenzdateien aus E-d, deren Bild von ihrem Dateinamen oder deren Geometrie von der
 * Norm der 18 zahlengleichen Landfahrzeuge abweicht. Wie `ANHANG_E_A_FILL_DEFECTS`,
 * `ANHANG_E_B_FILL_FINDINGS` und `ANHANG_E_C_FILL_FINDINGS` stehen sie hier als Datum, damit die
 * Manifestzeile ihren Reviewvermerk daraus ableitet statt den Befund ein zweites Mal zu behaupten.
 *
 * **`FINDINGS` und nicht `FILL_FINDINGS`:** in E.1 betraf jeder Befund die Füllfläche oder eine
 * Grundlinie. Hier sind es drei Klassen, und zwei davon sind in E.1 nicht vorgekommen — ein
 * Kürzel, das dem Dateinamen widerspricht (E.2.7, E.2.8, E.2.9, E.2.13, E.2.14, E.2.15), und ein
 * mittiger Lauf, der nicht auf der Körpermitte steht (E.2.10). Die dritte ist die bekannte:
 * zurückgesetztes Farbfeld und verschobene Grundlinie (E.2.19, E.2.20).
 *
 * Bei allen neun weicht die **Quelle von sich selbst** ab, nicht die Umsetzung von der Quelle. Der
 * Katalog folgt der Mehrheit der Quelle und exportiert den Befund; keine der neun Zeilen trägt
 * deshalb `status: 'deviation'`. E-d hat überhaupt keine deklarierte Abweichung — die einzige des
 * ganzen Teilslice E.2 steht bei E.2.26.
 */
export const ANHANG_E_D_FINDINGS: Readonly<Record<string, string>> = Object.freeze({
  'E.2.7':
    'Der Dateiname führt „Teleskopstapler", das Bild „Telelader". Aus zwei eigenen Rasterungen ' +
    'abgelesen (620 px Kontaktbogen, 1500 px Ausschnitt) und am Glyphenzensus bestätigt: der ' +
    'mittige Lauf führt neun Glyphen, „Teleskopstapler" hätte vierzehn. Der Katalog folgt dem ' +
    'Bild. Welche der beiden Angaben fachlich trägt, entscheidet die Datei nicht.',
  'E.2.8':
    'Der Dateiname führt „Bergungsräumgerät Radlader", das Bild nur „Radlader" (acht Glyphen). ' +
    'Die Kurzform „BRmG" erscheint in keinem der drei Bergungsräumgeräte E.2.8, E.2.9 und ' +
    'E.2.10. Der Katalog folgt dem Bild.',
  'E.2.9':
    'Der Dateiname führt „Bergungsräumgerät Bagger", das Bild „Bagger" (sechs Glyphen im ' +
    'mittigen Lauf, drei im THW-Lauf). Damit ist zugleich die Spezifikation widerlegt, die dieser ' +
    'Slice aus der Gegenprüfung von LFH-424 übernommen bekommen hat und die „BRmG R" nennt — sie ' +
    'hätte fünf getinte Glyphen im mittigen Lauf. Zweimal unabhängig gerastert und abgelesen; die ' +
    'Fahrwerksangabe derselben Spezifikation (Kette, zahlengleich mit 5.1.1.5) stimmt dagegen.',
  'E.2.10':
    'Der mittige Lauf „Bagger" ist mit dem von E.2.9 zeichengleich und in derselben Breite ' +
    'gesetzt (19,4596 mm), steht aber 0,7691 mm weiter links: Tintenmitte 15,4744 gegen ' +
    '16,2435 mm. Die 20 übrigen mittigen Läufe des Quellblocks E.2.1 bis E.2.21 liegen zwischen ' +
    '16,0099 und 16,3781 mm — die Quelle weicht hier von sich selbst ab, und der Katalog folgt ' +
    'der Mehrheit und setzt den Lauf mittig. Der Dateiname trägt zusätzlich „Bergungsräumgerät", ' +
    'was im Bild nicht vorkommt.',
  'E.2.13':
    'Zwei Befunde am Dateinamen: er schreibt die Zahl arabisch („Mannschaftslastwagen 4"), das ' +
    'Bild römisch („IV", zwei getrennte Versalien 14,878…16,257 und 16,529…19,429 mm bei je ' +
    '3,4096 bzw. 3,4100 mm Höhe); und er trägt den Tippfehler „geländegänig". Der Katalog folgt ' +
    'beim Kürzel dem Bild und beim Titel der berichtigten Schreibung.',
  'E.2.14':
    'Der Dateiname schreibt die Zahl arabisch („Mannschaftslastwagen 5"), das Bild römisch („V", ' +
    'Versalhöhe 4,8694 mm wie M, L und W). Zusammen mit E.2.13 der einzige Fall dieser Art im ' +
    'Anhang; die einzigen echten Ziffern in ganz Anhang E stehen in E.2.25.',
  'E.2.15':
    'Der Dateiname führt „Wechselladerfahrzeug", das Bild „LKW" — die Wechseleigenschaft steckt ' +
    'ausschließlich in der Geometrie (eigene Körperform und L-Rahmen), nicht im Kürzel. Zweiter ' +
    'Befund: die mittige Grundlinie liegt 7,5004 mm über der Behälterunterkante (17,0000 bei ' +
    '24,5004 mm) statt der 8,0 mm, die 19 der 20 Landfahrzeuge des Quellblocks führen. Anders ' +
    'als bei E.2.20 ist das kein Ausreißer auf gleichem Körper, sondern eine eigene Körperform ' +
    'mit n = 1 — der Katalog bildet die 7,5 mm deshalb als Wert des Körperprofils ab und weicht ' +
    'hier nicht von der Referenz ab.',
  'E.2.19':
    'Die Organisationsfarbe liegt als Rechteck 2,0002/9,9998/30,0002/25,0003 mm im Körper statt ' +
    'als um 1 mm eingerückte Körperform (Regelfall 2,0002/7,1138/30,0002/25,0007 mm); oberhalb ' +
    'bleibt ein leeres weisses Band. Beide Grundlinien stehen normgerecht. Dieselbe Klasse wie ' +
    'E.1.19 und E.1.24 aus E-b, dort aber gepaart mit einer Markenreihe im Körper, die hier ' +
    'fehlt — die Paarung, die E-b noch vermutet hat, trägt damit nicht. Der Katalog färbt den ' +
    'ganzen Körperpfad, wie in allen 67 Zeichen des Anhangs.',
  'E.2.20':
    'Zwei Befunde in einer Datei. Erstens dasselbe zurückgesetzte Farbfeld wie E.2.19 ' +
    '(2,0002/9,9998/30,0002/25,0003 mm). Zweitens steht die mittige Grundlinie auf 17,5002 mm, ' +
    'also 8,5002 mm über der Körperunterkante statt der 8,0 mm, die 19 der 20 Landfahrzeuge des ' +
    'Quellblocks auf demselben Körper führen. Der Katalog baut 18,0 mm — dieselbe Einordnung wie bei ' +
    'E.1.18/E.1.20/E.1.21 in E-b: weicht die Quelle von sich selbst ab, folgt die Umsetzung der ' +
    'Mehrheit der Quelle. Die Kappenhöhe 3,65125 mm ist davon unberührt und gemessen abgebildet.',
});

/**
 * Anhang E, Teilslice E-e: die Anhänger und Sonderkörper E.2.22 bis E.2.26 des THW — fünf Zeichen
 * und **drei** Körperformen, der formenreichste Block des ganzen Anhangs.
 *
 * **Was gleich bleibt wie in E-d:** Körperfarbe `blau` der Organisation `thw`, Trägerkürzel `THW`
 * unten rechts, keine Kopfzone, keine Zone unten links, Kürzel aus der eigenen Rasterung
 * abgelesen.
 *
 * **Was neu ist.**
 *
 * **Erstens zwei Körperformen ohne Kapitel-1-Abschnitt.** Vier Zeichen stehen auf `trailer`
 * (Füllhülle 3,9998/5,7503/31,0000/26,0004 mm; der Füllpfad kommt in 17 der 661 Referenzdateien
 * byteidentisch vor, mit `5.1.2.1_Anhänger_allgemein.svg` als Quellabschnitt), E.2.26 auf
 * `upright-rectangle` (Mittellinie 3,0000/2,0001/29,0003/30,0001 mm, genau 1 von 661). Die
 * Zuschnittsnotiz vom 11. August hat für beide „kein Grundzeichen" vermerkt; für Kapitel 1 stimmt
 * das, für die Ableitbarkeit nicht — der Anhängerrumpf ist die Deckkurve von `1.3` waagerecht
 * 0,9-fach um x = 31 gestreckt.
 *
 * **Zweitens eine Zusatzgeometrie am Grundzeichen, die keine Beschriftung ist:** die **Deichsel**
 * der vier Anhänger (Innenloch 1,2499/14,7500/3,7500/15,2502 mm, in allen vier E.2-Anhängern und
 * in `5.1.2.1` bis `5.1.2.5` zahlengleich). Sie fährt als `role: 'bodyExtra'` mit und nimmt die
 * Organisationsfarbe **nicht** an.
 *
 * **Drittens zwei neue Fahrwerke, benannt nach der Zeichnung und nicht nach dem Quellbegriff.**
 * Drei der vier Anhänger tragen `anhaenger-ein-rad` (Innenring 15,5000/26,2505/19,5001/30,2503),
 * einer `anhaenger-zwei-raeder` (12,2502/26,2505/16,2500/30,2503 und
 * 17,7504/26,2505/21,7502/30,2503). Warum die Quellbegriffe nicht als IDs taugen, steht in
 * `VehicleCategoryId` — und E.2.22 und E.2.23 sind zwei der drei Belege dafür.
 *
 * **Viertens ist E.2.22 das einzige Zeichen des ganzen Anhangs ohne mittige Beschriftung.** Seine
 * Typo-Ebene führt genau eine Untergruppe mit drei Glyphen, und das ist der `THW`-Lauf. Ein
 * Rezept mit mittigem Kürzel erfände es.
 *
 * **E.2.26 trägt die einzige deklarierte Abweichung des gesamten Teilslice E.2** (Note in
 * `coverage-manifest.ts`): sein `THW`-Lauf steht 1,0 mm weiter links, als
 * `LABEL_SIDE_MARGIN_MM = 2` ergibt. Bei n = 1 und zwei gleich guten Lesarten wird dafür kein
 * Mechanismus gebaut — dieselbe Einordnung wie bei E.1.17.
 */
export const ANHANG_E_E_RECIPES = {
  /**
   * Das **einzige Zeichen des Anhangs E ohne mittige Beschriftung**: seine Typo-Ebene führt genau
   * eine Untergruppe mit drei Glyphen, den `THW`-Lauf (Tinte 19,9873…29,0276 mm bei Grundlinie
   * 23,9998 mm, wie in allen Landfahrzeugen).
   *
   * Und zugleich der erste von drei Belegen dafür, dass die Quellbegriffe der Anhängerfahrwerke
   * nicht als IDs taugen: das **Grundzeichen** trägt die Ein-Rad-Form, die `5.1.2.4` als „von PKW
   * gezogen" führt, während `5.1.2.1_Anhänger_allgemein.svg` selbst nachgemessen überhaupt kein
   * Rad trägt.
   */
  'E.2.22': {
    title: 'Anhänger Grundzeichen',
    referenceAsset: 'E.2.22_Anhänger Grundzeichen.svg',
    spec: {
      kind: 'trailer',
      organization: 'thw',
      vehicleCategory: 'anhaenger-ein-rad',
      labels: { bottomRight: 'THW' },
    },
  },
  /**
   * Der zweite Beleg gegen die Quellbegriffe: der Dateiname sagt „von LKW gezogen", gezeichnet ist
   * die **Ein-Rad**-Form (cx 17,4999 mm) — dieselbe wie beim Grundzeichen E.2.22 und beim
   * „von PKW gezogen" heißenden E.2.25. Der Katalog folgt der Zeichnung.
   *
   * Zweiter Befund, und er betrifft die Lagen: die Farbfläche endet unten bei 22,5002 statt
   * 25,0 mm, und beide Läufe stehen entsprechend höher (Grundlinien 16,5001 und 21,5000 statt
   * 18,0 und 24,0 mm). Der Katalog baut die Normlagen — dieselbe Einordnung wie bei E.1.6/E.1.14
   * in E-a. Weil er den ganzen Körperpfad färbt, steht der `THW`-Lauf dabei auf Blau und nicht,
   * wie in der Referenz, auf dem weissen Rest.
   */
  'E.2.23': {
    title: 'Anhänger Netzersatzanlage, von LKW gezogen',
    referenceAsset: 'E.2.23_Anhänger Netzersatzanlage_von LKW gezogen.svg',
    spec: {
      kind: 'trailer',
      organization: 'thw',
      vehicleCategory: 'anhaenger-ein-rad',
      labels: { center: 'NEA', bottomRight: 'THW' },
    },
  },
  /**
   * Der einzige der vier Anhänger, bei dem Zeichnung und Dateiname zusammenpassen: zwei Räder auf
   * cx 14,2501 und 19,7503 mm, zahlengleich mit `5.1.2.5` („von LKW gezogen").
   *
   * Das abschließende `a` ist ein **Gemeinbuchstabe** — seine Tinte beginnt bei y 13,2080 mm,
   * unterhalb der Versallinie 13,1304 mm der drei anderen Glyphen; bei 1500 px nachgesehen. Also
   * `FüLa` und nicht „FüLA".
   */
  'E.2.24': {
    title: 'Anhänger Führung und Lage, von LKW gezogen',
    referenceAsset: 'E.2.24_Anhänger Führung und Lage_von LKW gezogen.svg',
    spec: {
      kind: 'trailer',
      organization: 'thw',
      vehicleCategory: 'anhaenger-zwei-raeder',
      labels: { center: 'FüLa', bottomRight: 'THW' },
    },
  },
  /**
   * Das **einzige Zeichen in ganz Anhang E mit Ziffern**. Vier Glyphen: Null, ein **Komma** (Tinte
   * 14,4286…15,4940 mm bei y 17,1178…19,0091 mm, also mit Unterlänge unter die Grundlinie — kein
   * Punkt), Sechs und ein kleines `t` nach einem Leerzeichen.
   *
   * Der Grad ist der Normwert, und wie bei E.2.5 ist er nicht direkt ablesbar: der Lauf führt
   * **keine** flachfüßige Glyphe, weshalb sein kleinstes Glyphen-maxY mit 18,0777 mm um den
   * Bogenüberschuss zu tief liegt. Belegt ist der Grad am `t`, das mit 4,4316 mm zahlengleich mit
   * dem `t` von „Stapler" (E.2.5) und „MzPt" (E.2.31) ist — beide stehen im Normgrad.
   */
  'E.2.25': {
    title: 'Anhänger 0,6 t Leergewicht, von PKW gezogen',
    referenceAsset: 'E.2.25_Anhänger 0,6 t Leergewicht_von PKW gezogen.svg',
    spec: {
      kind: 'trailer',
      organization: 'thw',
      vehicleCategory: 'anhaenger-ein-rad',
      labels: { center: '0,6 t', bottomRight: 'THW' },
    },
  },
  /**
   * Das einzige hochkante Zeichen des Anhangs und das einzige ohne jede Zone unterhalb des
   * Körpers: **kein Fahrwerk, keine Deichsel**, und `vehicleCategory` fehlt deshalb als
   * Sachaussage. Die Strichebene führt genau ein Ringpaar (außen 2,7499/1,7501/29,2502/30,2500,
   * innen 3,2501/2,2500/28,7503/29,7501 mm) und ist damit restlos erklärt.
   *
   * Die mittige Grundlinie steht auf 17,0000 mm, also **12,9999 mm** über der Körperunterkante
   * 29,9999 — der größte Abstand aller fünf Körperformen aus E.2 und wie bei E.2.15 ein Wert im
   * Profilmechanismus, kein eigener Mechanismus. Mit `container` (4/4 bis 28/28 mm) ist die Form
   * ausdrücklich nicht deckungsgleich.
   *
   * **Das Leerzeichen im Kürzel ist gemessen und nicht geraten:** die Lücke zwischen dem `W` und
   * dem ersten `A` misst 1,3395 mm, die beiden Lücken innerhalb der Wörter 0,2530 und 0,1126 mm.
   * Bei 1500 px nachgesehen.
   *
   * **Deklarierte Abweichung, die einzige des Teilslice E.2** (Note in `coverage-manifest.ts`):
   * der `THW`-Lauf der Referenz endet rechts bei 26,0269 mm bei einer Körperkante von
   * 29,0001 mm — sein Anker steht also auf 26,0, wo `LABEL_SIDE_MARGIN_MM = 2` die 27,0 ergibt.
   * Zwei gleich gute Lesarten bei n = 1 (maxX − 3,0 oder rechte Kante der Farbfläche − 2,0), und
   * die Marge ist an 30 anderen Zeichen belegt; für einen Einzelfall wird sie nicht aufgebrochen.
   */
  'E.2.26': {
    title: 'Trinkwasseraufbereitungsanlage',
    referenceAsset: 'E.2.26_Trinkwasseraufbereitungsanlage.svg',
    spec: {
      kind: 'upright-rectangle',
      organization: 'thw',
      labels: { center: 'TW AA', bottomRight: 'THW' },
    },
  },
} as const satisfies Record<string, Recipe>;

/**
 * Die vier Referenzdateien aus E-e mit einem Befund; nur E.2.26 fehlt hier, weil seine
 * Besonderheit eine **Abweichung der Umsetzung** ist und keine Abweichung der Quelle von sich
 * selbst — sie steht als `deviation` in `coverage-manifest.ts`.
 *
 * Wie in E-d gilt: bei allen vieren folgt der Katalog der Mehrheit der Quelle und exportiert den
 * Befund; keine der vier Zeilen setzt den Reviewstatus um.
 */
export const ANHANG_E_E_FINDINGS: Readonly<Record<string, string>> = Object.freeze({
  'E.2.22':
    'Das „Anhänger Grundzeichen" trägt die Ein-Rad-Form, die 5.1.2.4 als „von PKW gezogen" ' +
    'führt (Innenring 15,5000/26,2505/19,5001/30,2503 mm), während 5.1.2.1_Anhänger_allgemein.svg ' +
    'selbst nachgemessen überhaupt kein Rad trägt — seine Strichebene führt drei Teilpfade, ' +
    'keinen Ring. Damit ist die Gleichung „ein Rad = von PKW gezogen" aus der Quelle selbst ' +
    'widerlegt; das ist der Grund, warum die beiden Fahrwerks-IDs nach der Zeichnung benannt ' +
    'sind und nicht nach dem Zugfahrzeug. Zweiter Befund, ohne Baufolge: als einziges der 67 ' +
    'gebauten Zeichen des Anhangs trägt es keine mittige Beschriftung.',
  'E.2.23':
    'Zwei Befunde. Erstens sagt der Dateiname „von LKW gezogen", gezeichnet ist die Ein-Rad-Form ' +
    '(cx 17,4999 mm) — dieselbe wie beim Grundzeichen E.2.22 und beim „von PKW gezogen" ' +
    'heißenden E.2.25, während das Schwesterzeichen E.2.24 mit demselben Namenszusatz die zwei ' +
    'Räder von 5.1.2.5 trägt. Der Katalog folgt der Zeichnung. Zweitens endet die Farbfläche ' +
    'unten bei 22,5002 statt 25,0 mm, und beide Läufe stehen um 1,5 bzw. 2,5 mm höher ' +
    '(Grundlinien 16,5001 und 21,5000 statt 18,0 und 24,0 mm; Grundlinienabstand damit 5,0 statt ' +
    '6,0 mm). Der Katalog baut die Normlagen — dieselbe Einordnung wie E.1.6/E.1.14. Weil er den ' +
    'ganzen Körperpfad färbt, steht der THW-Lauf dabei auf Blau und nicht auf dem weissen Rest.',
  'E.2.24':
    'Zwei Befunde. Erstens ist der THW-Lauf zweimal byteidentisch übereinander gezeichnet: die ' +
    'Typo-Ebene führt drei Untergruppen, zwei davon mit derselben Hülle ' +
    '19,9870/21,0806/29,0269/23,9998 mm. Ein Rezept mit einem Lauf gibt die Datei nicht ' +
    'zeichengleich wieder — sichtbar ist der Unterschied nicht, messbar schon. Zweitens liegt die ' +
    'Organisationsfarbe als Rechteck 4,9999/10,0002/30,0002/25,0007 mm im Körper statt als um ' +
    '1 mm eingerückte Körperform; das ist dieselbe Klasse wie E.2.19, E.2.20, E.1.19 und E.1.24, ' +
    'und mit E.2.24 steigt sie auf fünf Fälle über zwei Kapitel. Der Katalog färbt den ganzen ' +
    'Körperpfad.',
  'E.2.25':
    'Der Dateiname führt „Anhänger 0,6 t Leergewicht", das Bild nur „0,6 t" — vier Glyphen, ' +
    'darunter das einzige Komma und die einzigen Ziffern in ganz Anhang E. Zweiter Befund ohne ' +
    'Baufolge, aber als Falle beim Nachmessen: der Lauf führt keine flachfüßige Glyphe, sein ' +
    'kleinstes Glyphen-maxY liegt deshalb mit 18,0777 mm um den Bogenüberschuss unter der ' +
    'tatsächlichen Grundlinie 18,0 mm. Der Schriftgrad ist der Normwert, belegt am t (4,4316 mm, ' +
    'zahlengleich mit dem t in „Stapler" und „MzPt").',
});

/**
 * Anhang E, Teilslice E-f: die Wasserfahrzeuge E.2.27 bis E.2.31 des THW — die letzten fünf
 * Zeichen des Anhangs. Mit ihnen ist Anhang E bei 67 von 68 Abschnitten; es fehlt allein E.2.6
 * (siehe `ANHANG_E_D_UNGEBAUT`).
 *
 * **Was gleich bleibt:** Kompositionen auf einem Grundzeichen, Organisation `thw`, Kürzel aus der
 * eigenen Rasterung, keine Kopfzone, keine Zone unten links, kein Fahrwerk.
 *
 * **Was neu ist, und beides gilt nur für diese fünf.**
 *
 * **Erstens eine zweite, in der Quelle belegte Zeichnung desselben Grundzeichens.** Alle fünf
 * stehen auf `vehicle-water` mit `bodyVariant: 'raised-hull'` (Füllhülle
 * 1,0100/7,9999/30,9894/22,9898 mm, in allen fünf Dateien byteidentisch). Gegenüber
 * `1.5_Wasserfahrzeug.svg` (1,0001/9,0001/31,0000/24,0002) liegt der Rumpf 1,0002 mm höher und ist
 * um den Faktor 0,999318 kleiner. Es ist **keine** eigene `SymbolKind`: fachlich dasselbe
 * Grundzeichen, und `vehicle-water` beansprucht den Abschnitt 1.5 bereits und ist seit LFH-424
 * selbst dagegen gegatet — geändert werden darf es deshalb nicht, es fiele um 2,8 Einheiten bei
 * einer Toleranz von 0,01.
 *
 * **Zweitens die vierte Beschriftungszone.** Alle fünf setzen ihr Trägerkürzel `THW` **unterhalb**
 * des Rumpfes und in der Organisationsfarbe statt weiss im Körper (Tinte
 * 22,5379/24,0806/31,5778/26,9998 mm, Füllung #003296, Versalhöhe 2,9192 mm — in allen fünf gleich
 * bis auf 0,0003 mm an der T-Glyphe von E.2.28). Ein `bottomRight` setzte denselben Lauf weiss in
 * den Rumpf; das ist ein anderes Bild, und kein Gate meldete es. Deshalb `belowRight`, und deshalb
 * trägt keines der fünf Rezepte ein `bottomRight`.
 *
 * Der Zusammenhang zwischen beidem ist gemessen: die Anhebung des Rumpfes um 1,0002 mm schafft
 * genau den Freiraum, in dem dieser Lauf steht: 1,0908 mm zwischen Rumpfunterkante und
 * Textoberkante. Am tieferen Rumpf der elf I.3-Dateien blieben davon 0,0907 mm — das ist eine
 * Rechnung mit dem gemessenen Lauf an einem anderen Rumpf und keine Messung an I.3, denn keine
 * der elf trägt dort einen Lauf.
 *
 * **E.2.27 trägt als einziges der fünf gar kein mittiges Kürzel** — seine Typo-Ebene führt genau
 * einen Lauf, und der steht blau unter dem Rumpf. Die Vorgabe dieses Slice sagt dazu, „das Kürzel
 * stehe weiss im Körper statt blau unter ihm"; das beschreibt die frühere Katalogausgabe und nicht
 * die Quelle. Ein Rezept mit mittigem Kürzel erfände es.
 */
export const ANHANG_E_F_RECIPES = {
  /**
   * Das einzige der fünf **ohne** mittiges Kürzel: eine Typo-Ebene, ein Lauf, und der ist der
   * blaue `THW`-Lauf unterhalb des Rumpfes. Damit ist es zugleich das einzige Zeichen des ganzen
   * Anhangs, dessen einzige fachliche Angabe außerhalb des Körpers steht — `describeSymbolSpec`
   * nimmt die vierte Zone deshalb in die Vorlesebeschreibung auf.
   */
  'E.2.27': {
    title: 'Wasserfahrzeug allgemein',
    referenceAsset: 'E.2.27_Wasserfahrzeug allgemein.svg',
    spec: {
      kind: 'vehicle-water',
      bodyVariant: 'raised-hull',
      organization: 'thw',
      labels: { belowRight: 'THW' },
    },
  },
  /**
   * Sechs Glyphen mit zwei Oberlängen: `k` und `l` reichen bis y 10,947 mm und stehen damit
   * **über** der Versallinie 11,1308 mm des `B`. Die Kappenhöhe ist trotzdem der Normwert,
   * gemessen am `B` (4,8694 mm); die mittige Grundlinie steht auf 16,0002 mm, also 6,9896 mm über
   * der Rumpfunterkante 22,9898 mm.
   */
  'E.2.28': {
    title: 'Kleines Boot',
    referenceAsset: 'E.2.28_Kleines Boot.svg',
    spec: {
      kind: 'vehicle-water',
      bodyVariant: 'raised-hull',
      organization: 'thw',
      labels: { center: 'kl Boot', belowRight: 'THW' },
    },
  },
  /** Kleines `z` zwischen zwei Versalien: 3,4085 mm gegen 4,8694 mm. Grundlinie 16,0002 mm. */
  'E.2.29': {
    title: 'Mehrzweckboot',
    referenceAsset: 'E.2.29_Mehrzweckboot.svg',
    spec: {
      kind: 'vehicle-water',
      bodyVariant: 'raised-hull',
      organization: 'thw',
      labels: { center: 'MzB', belowRight: 'THW' },
    },
  },
  'E.2.30': {
    title: 'Mehrzweckarbeitsboot',
    referenceAsset: 'E.2.30_Mehrzweckarbeitsboot.svg',
    spec: {
      kind: 'vehicle-water',
      bodyVariant: 'raised-hull',
      organization: 'thw',
      labels: { center: 'MzAB', belowRight: 'THW' },
    },
  },
  /**
   * Groß-`M`, klein-`z`, Groß-`P`, klein-`t`; das `t` misst 4,4315 mm und ist damit zahlengleich
   * mit dem `t` in „Stapler" (E.2.5) und „0,6 t" (E.2.25) — der Beleg, an dem der Normgrad jener
   * beiden Läufe hängt, die selbst keine flache Versalie führen.
   */
  'E.2.31': {
    title: 'Mehrzweckponton',
    referenceAsset: 'E.2.31_Mehrzweckponton.svg',
    spec: {
      kind: 'vehicle-water',
      bodyVariant: 'raised-hull',
      organization: 'thw',
      labels: { center: 'MzPt', belowRight: 'THW' },
    },
  },
} as const satisfies Record<string, Recipe>;

/**
 * Die Befunde aus E-f. Anders als in E-d und E-e betrifft **kein einziger** eine Abweichung der
 * Quelle von sich selbst: innerhalb der fünf Dateien ist die Quelle einstimmig, Füll- und
 * Strichebene sind byteidentisch. Die zwei Zeilen halten stattdessen fest, was diese fünf gegen
 * den **übrigen Bestand** unterscheidet — und beides ist eine Fachfrage, die keine Messung
 * beantwortet.
 *
 * Sie stehen deshalb an nur zwei Abschnitten und nicht an allen fünf: E.2.27 trägt den Befund zum
 * Rumpf, weil er dort erstmals auftritt und dort auch die Praemisse dieses Slice widerlegt wird;
 * E.2.31 den zur Doppelung mit Anhang I, weil er dort am schärfsten messbar ist.
 */
export const ANHANG_E_F_FINDINGS: Readonly<Record<string, string>> = Object.freeze({
  'E.2.27':
    'Zwei Befunde. Erstens ist der Rumpf dieser fünf Dateien gegenüber 1.5_Wasserfahrzeug.svg um ' +
    '1,0002 mm angehoben (Sehne auf y 7,9999 statt 9,0001 mm) UND um den Faktor 0,999318 ' +
    'verkleinert (Sehnenlänge 29,9794 gegen 29,9999 mm). Die elf Dateien aus Anhang I.3 teilen ' +
    'die Verkleinerung, nicht die Anhebung: selbst nachgemessen führen alle elf die Füllhülle ' +
    '1,0100/9,0001/30,9894/23,9899 mm. Ob die Anhebung Absicht oder Exportartefakt ist, lässt ' +
    'sich nicht entscheiden; gemessen ist, dass sie genau den Freiraum schafft, in dem das blaue ' +
    'Trägerkürzel steht — 1,0908 mm zwischen Rumpfunterkante 22,9898 und Textoberkante ' +
    '24,0806 mm. Am tieferen I.3-Rumpf blieben davon 0,0907 mm; das ist eine Rechnung und keine ' +
    'Messung an I.3, denn keine der elf I.3-Dateien führt überhaupt einen Lauf unterhalb ihres ' +
    'Rumpfes. Zweitens trägt E.2.27 als einziges der fünf überhaupt kein mittiges Kürzel — seine ' +
    'Typo-Ebene führt genau einen Lauf, und der ist der blaue THW-Lauf unterhalb des Rumpfes. ' +
    'Die Vorgabe dieses Slice, das Kürzel stehe „weiss im Körper statt blau unter ihm", ' +
    'beschreibt damit die frühere Katalogausgabe und nicht die Quelle.',
  'E.2.31':
    'Der mittige Lauf ist mit dem von I.3.7_Mehrzweckponton.svg bis auf 0,000353 mm — eine ' +
    'einzige Exportrundungsstufe — deckungsgleich, dort schwarz statt weiss, und I.3.7 trägt ' +
    'denselben Namen; für E.2.29 gegen I.3.5 und E.2.30 gegen I.3.6 gilt dasselbe auf dieselbe ' +
    'Stufe genau (selbst nachgemessen). Ob das dieselben Zeichen in zwei Anhängen sind, ist eine ' +
    'Fachfrage — heute kollidiert nichts, weil Anhang I nicht im beanspruchten Umfang steht. ' +
    'Dazu ein zweiter, gemessener Unterschied zwischen den beiden Kapiteln: die I.3-Dateien ' +
    'tragen denselben Rumpf 1,0002 mm tiefer (Unterkante 23,9899 mm) und ihre mittige Grundlinie ' +
    'auf derselben absoluten Höhe (15,9999 mm an den fünf I.3-Läufen mit flachfüßiger Glyphe) — ' +
    'ihr Abstand zur Rumpfunterkante ist damit 7,9900 mm, der Normwert, und ihr Lauf ist der ' +
    'Anhebung nicht gefolgt. Für die fünf E.2-Zeichen erzeugen beide Lesarten dasselbe Bild.',
});
