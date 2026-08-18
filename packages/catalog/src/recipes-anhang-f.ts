import type { Recipe } from './recipes.js';

/**
 * Anhang F, Teilslice F-a: die sanitätsdienstlichen Einheiten F.1.1 bis F.1.11 — elf Abschnitte
 * in zwölf Dateien (F.1.11 trägt eine Alternativdarstellung).
 *
 * **Alle zwölf stehen auf demselben Rechteckkörper** (`formation`, Hülle 1/6 bis 31/26 mm) und
 * tragen ihre Bedeutung in der randbündigen Fachdienstteilung (`bodyMarks`, siehe
 * `body-marks.ts`) und im Kürzel oben links. Der Zuschnitt vom 18. August 2026
 * (`docs/decisions/2026-08-18-anhang-f-zuschnitt.md`) hat für diesen Teilslice zwei fehlende
 * Mechanismen benannt; gemessen sind es drei — die Schriftfarbe kommt dazu (siehe
 * `bodyLabelInk` in `compose.ts`).
 *
 * **Die Organisation ist eine Entscheidung, keine Messung.** Alle 66 F-Dateien führen
 * ausschließlich `#fff`; ob das `hilfsorganisation` (= `weiss`) oder gar keine Organisation
 * bedeutet, sagt die Datei nicht. Der Katalog trägt `hilfsorganisation`: alle 71 bestehenden
 * Rezepte führen eine Organisation, `F.1.5_Sanitätszug ASB` benennt eine Hilfsorganisation im
 * Titel, und im Referenztheme ist das Bild in beiden Lesarten dasselbe (`ORGANIZATION_COLORS`
 * bildet `hilfsorganisation` auf `weiss` ab). Sichtbar wird der Unterschied allein in den beiden
 * anderen Themes, wo `weiss` die Punktsignatur aus `ORGANIZATION_BODY_DASHES` trägt — der zweite
 * Kanal, den LFH-424 für genau diesen Fall eingeführt hat. Die fachliche Zuordnung bleibt einer
 * fachkundigen Person vorbehalten und steht als offene Kante in der Entscheidungsnotiz.
 *
 * **Die Kürzel sind am Referenzbild abgelesen, nicht aus der Datei gelesen** — derselbe Weg wie
 * bei Anhang E und J: die Glyphen liegen in der Ebene `Takt. Zeichen (Typo)` in Kurven
 * umgewandelt vor. Gerastert mit `@resvg/resvg-js` am 18. August 2026 und im Paarbild
 * gegengeprüft (`docs/reviews/2026-08-18-f-a-visual-qa.md`).
 */
export const ANHANG_F_A_RECIPES = {
  /**
   * Die Kopfzone fehlt, und das ist eine erklärte Abweichung: F.1.1 trägt zwei senkrechte Balken
   * (je 1,5 × 4,0 mm auf x 12/20, y 1…5) statt der Marken eines Stärkegrads. Kapitel 5.4 führt
   * vier Stärkegrade und keinen Balken; dieselbe Balkenform steht in genau drei der 661
   * Referenzdateien (E.1.31, F.1.1, F.1.3), deren Namen kein gemeinsames Wort teilen. Der
   * Teilslice E-c hat sie an E.1.31 als Abweichung gebaut, und diese Entscheidung wird hier
   * fortgeschrieben statt umgestoßen — ein fünfter `StrengthId` braucht eine fachliche Zuordnung
   * und keine weitere Messung.
   */
  'F.1.1': {
    title: 'Medizinische Task Force',
    referenceAsset: 'F.1.1_Medizinische Task Force.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      bodyMarks: ['physician'],
      labels: { topLeft: 'MTF' },
    },
  },
  /**
   * **Ein Rezept mit genau einer Marke, und das ist die Aussage.** `cbrn-protection` zeichnet die
   * Fachdienstteilung, die Arztleiste und das Innenzeichen zusammen — die Teilung ist an beiden
   * Armen unterbrochen, damit das Innenzeichen frei steht, und diese Unterbrechung steht in
   * keiner der Einzelzeichnungen. Ein zweiter Eintrag `physician` oder `medical-service` daneben
   * zöge die Arme wieder von Kante zu Kante durch und schlösse die beiden Fenster; die Herleitung
   * steht an der Marke in `body-marks.ts`.
   *
   * Das Kürzel „MTF" ist dasselbe wie bei `F.1.1` — eine Dekontaminationseinheit, die den Lauf
   * ihrer Task Force trägt. Es ist nicht bloß dasselbe Wort: die drei Glyphenpfade der Ebene
   * `Takt. Zeichen (Typo)` sind in beiden Dateien zeichengleich (diff über die drei
   * `d`-Attribute, 18. August 2026). Der Befund steht an der Manifestzeile.
   */
  'F.1.2': {
    title: 'Dekontaminationseinheit für Verletzte',
    referenceAsset: 'F.1.2_Dekontaminationseinheit für Verletzte.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'zug',
      bodyMarks: ['cbrn-protection'],
      labels: { topLeft: 'MTF' },
    },
  },
  /**
   * Zwei randbündige Fachdienstzeichen nebeneinander: die Teilung (4.6.1) und das Zelt (4.2.1) —
   * Sanitätsdienst und Betreuung im selben Zeichen. Die beiden Schenkel des Zelts laufen von der
   * Mitte der Körperoberkante zu den unteren Ecken und zerschneiden dabei die Felder der Teilung;
   * die Referenz zeichnet das als **einen** Umriss, der Katalog als zwei Marken. Im Bild ist es
   * dieselbe Zeichnung.
   */
  'F.1.4': {
    title: 'Einsatzeinheit',
    referenceAsset: 'F.1.4_Einsatzeinheit.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'zug',
      bodyMarks: ['medical-service', 'care'],
    },
  },
  'F.1.5': {
    title: 'Sanitätszug ASB',
    referenceAsset: 'F.1.5_Sanitätszug ASB.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'zug',
      bodyMarks: ['medical-service'],
      // Das einzige Zeichen aus F.1.1 bis F.1.11, das seinen Lauf **nicht** oben links setzt:
      // „ASB" steht unten rechts (Grundlinie 24,0 mm, rechte Tintenkante 29,274) — dieselbe Zone,
      // in der Anhang E sein Trägerkürzel führt.
      labels: { bottomRight: 'ASB' },
    },
  },
  'F.1.6': {
    title: 'Sanitätsgruppe',
    referenceAsset: 'F.1.6_Sanitätsgruppe.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'gruppe',
      bodyMarks: ['medical-service'],
    },
  },
  'F.1.7': {
    title: 'Sanitätsgruppe, arztbesetzt',
    referenceAsset: 'F.1.7_Sanitätsgruppe_arztbesetzt.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'gruppe',
      bodyMarks: ['physician'],
    },
  },
  'F.1.8': {
    title: 'Patiententransportgruppe',
    referenceAsset: 'F.1.8_Patiententransportgruppe.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'gruppe',
      bodyMarks: ['patient-transport'],
      labels: { topLeft: '10' },
    },
  },
  'F.1.9': {
    title: 'Schnelleinsatzgruppe Sanität',
    referenceAsset: 'F.1.9_Schnelleinsatzgruppe Sanität.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'gruppe',
      bodyMarks: ['medical-service'],
      labels: { topLeft: 'SEG' },
    },
  },
  'F.1.10': {
    title: 'Schnelleinsatzgruppe Rettungsdienst',
    referenceAsset: 'F.1.10_Schnelleinsatzgruppe Rettungsdienst.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'gruppe',
      bodyMarks: ['intensive-care'],
      labels: { topLeft: 'SEG' },
    },
  },
  /**
   * Ohne Kopfzone, und das ist gemessen und keine Abweichung: die Ebene `Takt_Zeichen` dieser
   * Datei führt genau einen Pfad — Rahmen und Teilung —, keine Marke und keinen Balken. Derselbe
   * Fall wie E.1.3 im Teilslice E-a.
   */
  'F.1.11': {
    title: 'Rettungsdienst allgemein',
    referenceAsset: 'F.1.11_Rettungsdienst allgemein.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      bodyMarks: ['medical-service'],
      labels: { topLeft: 'RettD' },
    },
  },
  /**
   * **Die erste Alternativdarstellung auf Rezeptebene.** Dasselbe Zeichen wie `F.1.11`, nur trägt
   * es statt des Kürzels „RettD" den senkrechten Balken aus `4.6.3` — Rettungswesen. Der
   * Schlüssel `F.1.11#alternative` erzeugt im Manifest die Zeile
   * `bbk-babz-2025:F.1.11#alternative` neben `#primary`; bis zu diesem Teilslice trug keine
   * einzige Manifestzeile `variant: 'alternative'` außerhalb der Piktogrammregister.
   *
   * Der Titel ist derselbe wie bei `#primary` — der Katalogvertrag verlangt das über alle
   * Darstellungen einer ID, und hier ist es zugleich die Sache: es ist derselbe Rettungsdienst.
   */
  'F.1.11#alternative': {
    title: 'Rettungsdienst allgemein',
    referenceAsset: 'F.1.11_Rettungsdienst allgemein_Alternative.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      bodyMarks: ['intensive-care'],
    },
  },
} as const satisfies Record<string, Recipe>;

/**
 * Befunde an den Referenzdateien selbst — in der Bauart von `ANHANG_E_C_FILL_FINDINGS`: was die
 * Quelle anders macht als ihre eigene Systematik, steht an der Manifestzeile und nicht nur im
 * Kode.
 */
export const ANHANG_F_A_FINDINGS: Readonly<Record<string, string>> = Object.freeze({
  'F.1.1':
    'Die Kopfzone besteht aus zwei senkrechten Balken (je 1,5 × 4,0 mm auf x 12/20, y 1…5) statt ' +
    'aus Marken eines Stärkegrads. Kapitel 5.4 führt vier Stärkegrade (Trupp, Staffel, Gruppe, ' +
    'Zug) und keinen Balken; die Balkenform kommt in genau drei der 661 Referenzdateien vor ' +
    '(E.1.31, F.1.1, F.1.3), und ihre Namen — „System Bereitstellungsraum 500", „Medizinische ' +
    'Task Force", „Mobiles Betreuungsmodul 5000" — teilen kein Wort, aus dem sich ein Begriff ' +
    'ableiten ließe.',
  'F.1.2':
    'Drei Befunde an einer Datei. **Erstens das Innenzeichen:** die Datei heißt ' +
    '„Dekontaminationseinheit für Verletzte", zeichnet aber 4.1.1 (ABC-/CBRN-Schutz) und nicht ' +
    '4.1.3 (Dekontaminieren). Die beiden Kapitel-4-Zeichnungen unterscheiden sich allein im ' +
    'Häkchenpaar an den unteren Schaftenden — in `4.1.3_Dekontaminieren.svg` steht es als ' +
    '`V 20,9998 H 6,5003 V 27,2496 H 12,2506` im Umriss, in F.1.2 laufen beide Schäfte mit einer ' +
    'Stumpfkappe aus. **Zweitens der Lauf:** die drei Glyphenpfade von „MTF" sind zeichengleich ' +
    'mit denen von `F.1.1_Medizinische Task Force.svg` — die Dekontaminationseinheit trägt das ' +
    'Kürzel ihrer Task Force und nicht ein eigenes. **Drittens die Schiefe:** die beiden Schäfte ' +
    'des Innenzeichens haben verschiedene Neigung (dx/dy 0,8412 gegen 0,9120, also 2,3°), und ' +
    'aus dieser einen Schiefe folgt jede Abweichung der Kopf- und Spitzenlagen von der ' +
    'Symmetrieachse — bis zu 0,164 mm. Die drei tragenden Abstände sind dagegen rund: ' +
    'Kopfabstand 7,4997, Spitzenabstand 7,0000, Höhe Kopf → Spitze 6,0001 mm.',
  'F.1.5':
    'Das einzige der elf Zeichen aus F.1.1 bis F.1.11, dessen Lauf nicht oben links steht: „ASB" ' +
    'sitzt unten rechts. Die Zone ist dieselbe, in der Anhang E sein Trägerkürzel führt, und ' +
    '„ASB" ist ein Trägerkürzel — der Arbeiter-Samariter-Bund. Damit ist es zugleich das einzige ' +
    'F-Zeichen, das eine bestimmte Hilfsorganisation benennt.',
  'F.1.8':
    'Der waagerechte Arm der Teilung ist links nur bis zum Transportring gezeichnet (Rechteck ' +
    '1,0…10,5 mm auf y 15,75…16,25), rechts fehlt er ganz. Der Katalog zieht ihn durch; im Bild ' +
    'ist das derselbe Strich, weil die Speichen im Ring auf denselben Linien liegen.',
});

/**
 * Erklärte Abweichungen der Umsetzung von der Referenz. Getrennt von den Befunden: ein Befund ist
 * eine Eigenschaft der Quelle, eine Abweichung eine Entscheidung des Katalogs.
 */
export const ANHANG_F_A_DEVIATIONS: Readonly<Record<string, string>> = Object.freeze({
  'F.1.1':
    'Die beiden Kopfbalken werden nicht gezeichnet: der Katalog kennt für sie keinen Begriff, und ' +
    'ein erfundener fünfter Stärkegrad wäre eine fachliche Behauptung. Dieselbe Abweichung hat ' +
    'der Teilslice E-c an E.1.31 erklärt. Das Zeichen ist damit von einem kopfzonenlosen Zeichen ' +
    'derselben Bauart nicht zu unterscheiden — hier von keinem anderen aus F.1.1 bis F.1.11, ' +
    'weil es als einziges die Arztleiste ohne Kopfzone trägt.',
  'F.1.2':
    'Das Innenzeichen wird symmetrisch zur Körpermitte gezeichnet, die Referenz zeichnet es ' +
    'schief (dritter Befund oben). Der Katalog nimmt die mittlere Neigung der beiden Schäfte ' +
    '(≈ 7/8) und legt die Mitte des Zeichens auf die Körpermitte (16|16) — dieselbe Mitte, auf ' +
    'die auch die beiden Fenster der Teilung gemessen mittig stehen (10…22 und 14…18). Der ' +
    'Grund, es nicht als Exportfehler durchgehen zu lassen und stillschweigend nachzuzeichnen: ' +
    '0,164 mm ist dreizehnmal der Näherungsfehler von 0,0124 mm, den `patient-transport` als ' +
    'solchen abtut. Es ist eine Entscheidung für die Zeichnung, die die Quelle meint, gegen die, ' +
    'die sie zeigt.',
});
