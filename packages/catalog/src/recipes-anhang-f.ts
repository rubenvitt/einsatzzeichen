import type { Recipe } from './recipes.js';

/**
 * Anhang F, Teilslice F-a: die sanitätsdienstlichen Einheiten F.1.1 bis F.1.11 — elf Abschnitte
 * in zwölf Dateien (F.1.11 trägt eine Alternativdarstellung). **Dieses Register führt elf davon.**
 * `F.1.3` ist vermessen und nicht gebaut: es bringt drei Zeichnungen mit, die kein anderes Zeichen
 * des Teilslice teilt (Zelt mit anderer Schenkelneigung als F.1.4, schwarzes Fußband, Bett). Die
 * Maße stehen in der Entscheidungsnotiz, Abschnitt 9.
 *
 * **Alle elf stehen auf demselben Rechteckkörper** (`formation`, Hülle 1/6 bis 31/26 mm) und
 * tragen ihre Bedeutung in der randbündigen Fachdienstteilung (`bodyMarks`, siehe
 * `body-marks.ts`) und im Kürzel oben links. Der Zuschnitt vom 18. August 2026
 * (`docs/decisions/2026-08-18-anhang-f-zuschnitt.md`) hat für diesen Teilslice zwei fehlende
 * Mechanismen benannt; gemessen sind es drei — die Schriftfarbe kommt dazu (siehe
 * `bodyLabelInk` in `compose.ts`).
 *
 * **Die Organisation ist eine Entscheidung, keine Messung.** Alle 66 F-Dateien führen
 * ausschließlich `#fff`; ob das `hilfsorganisation` (= `weiss`) oder gar keine Organisation
 * bedeutet, sagt die Datei nicht. Der Katalog trägt `hilfsorganisation`: alle 71 bis dahin bestehenden
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

export const ANHANG_F_B_RECIPES = {
  'F.1.3': {
    title: 'Mobiles Betreuungsmodul 5000',
    referenceAsset: 'F.1.3_Mobiles Betreuungsmodul 5000.svg',
    spec: {
      kind: 'formation',
      bodyVariant: 'foot-band',
      organization: 'hilfsorganisation',
      bodyMarks: ['care', 'temporary-accommodation-resting'],
      labels: { topLeft: '5.000' },
    },
  },
  'F.1.12': {
    title: 'Nachbarschaftliche Soforthilfe',
    referenceAsset: 'F.1.12_Nachbarschaftliche Soforthilfe.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'gruppe',
      bodyMarks: ['medical-service'],
      labels: { topLeft: 'ÜMANV-S' },
    },
  },
  'F.1.12#alternative': {
    title: 'Nachbarschaftliche Soforthilfe',
    referenceAsset: 'F.1.12_Nachbarschaftliche Soforthilfe_Alternative.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'gruppe',
      bodyMarks: ['patient-transport', 'physician', 'intensive-care'],
    },
  },
  'F.1.13': {
    title: 'Behandlungsplatz-Bereitschaft',
    referenceAsset: 'F.1.13_Behandlungsplatz-Bereitschaft.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      bodyMarks: ['care', 'physician', 'ring-7mm-offset-down-1mm'],
      labels: { topLeft: '50' },
    },
  },
  'F.1.14': {
    title: 'Erstversorgungstrupp',
    referenceAsset: 'F.1.14_Erstversorgungstrupp.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'trupp',
      bodyMarks: ['medical-service'],
      labels: { topLeft: 'EVT' },
    },
  },
  'F.1.15': {
    title: 'Arzttrupp',
    referenceAsset: 'F.1.15_Arzttrupp.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'trupp',
      bodyMarks: ['physician'],
    },
  },
  'F.1.15#alternative': {
    title: 'Arzttrupp',
    referenceAsset: 'F.1.15_Arzttrupp_Alternative.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'trupp',
      bodyMarks: ['physician', 'intensive-care'],
    },
  },
  'F.1.16': {
    title: 'Drohnentrupp',
    referenceAsset: 'F.1.16_Drohnentrupp.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'trupp',
      bodyMarks: ['chevron-over-opposed-triangles'],
    },
  },
  'F.1.17': {
    title: 'Gruppe Verpflegung',
    referenceAsset: 'F.1.17_Gruppe Verpflegung.svg',
    spec: {
      kind: 'formation',
      bodyVariant: 'foot-band',
      organization: 'hilfsorganisation',
      strength: 'gruppe',
      bodyMarks: ['care', 'catering'],
      labels: { topLeft: '250' },
    },
  },
  'F.1.18': {
    title: 'Gruppe für soziale Betreuung',
    referenceAsset: 'F.1.18_Gruppe für soziale Betreuung.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'gruppe',
      bodyMarks: ['care'],
      labels: { topLeft: '100', bottomCenter: 'SOZ' },
    },
  },
  'F.1.19': {
    title: 'Gruppe zur Herrichtung von Notunterkünften',
    referenceAsset: 'F.1.19_Gruppe zur Herrichtung von Notunterkünften.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'gruppe',
      bodyMarks: ['care', 'temporary-accommodation-resting'],
      labels: { topLeft: '120' },
    },
  },
  'F.1.20': {
    title: 'Schnelleinsatzgruppe soziale Betreuung',
    referenceAsset: 'F.1.20_Schnelleinsatzgruppe soziale Betreuung.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'gruppe',
      bodyMarks: ['care'],
      labels: { topLeft: '100', bottomCenter: 'SEG' },
    },
  },
  'F.1.21': {
    title: 'Betreuungsplatzbereitschaft 500',
    referenceAsset: 'F.1.21_Betreuungsplatzbereitschaft 500.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      bodyMarks: ['ring-6-5mm-offset-down-2mm-with-roof'],
      labels: { topLeft: '500' },
    },
  },
  'F.1.22': {
    title: 'Transportzug bis 50 Betroffene',
    referenceAsset: 'F.1.22_Transportzug bis 50 Betroffene.svg',
    spec: {
      kind: 'formation',
      organization: 'hilfsorganisation',
      strength: 'zug',
      bodyMarks: ['care', 'patient-transport'],
      labels: { topLeft: '50' },
    },
  },
} as const satisfies Record<string, Recipe>;

/** F.2.1 bis F.2.9: neun Fahrzeugzeichen und fünf bildlich getrennte Alternativen. */
export const ANHANG_F_C_RECIPES = {
  'F.2.1': {
    title: 'KTW',
    referenceAsset: 'F.2.1_KTW.svg',
    spec: { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', organization: 'hilfsorganisation', bodyMarks: ['medical-service'], labels: { topLeft: 'KTW' } },
  },
  'F.2.1#alternative': {
    title: 'KTW',
    referenceAsset: 'F.2.1_KTW_Alternative.svg',
    spec: { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', organization: 'hilfsorganisation', bodyMarks: ['patient-transport'] },
  },
  'F.2.2': {
    title: 'NKTW',
    referenceAsset: 'F.2.2_NKTW.svg',
    spec: {
      kind: 'vehicle-land',
      bodyVariant: 'plain-wheel-pair',
      organization: 'hilfsorganisation',
      bodyMarks: ['medical-service', 'top-center-rect-0-5x0-6mm'],
      labels: { topLeft: 'N-KTW_B' },
    },
  },
  'F.2.2#alternative': {
    title: 'NKTW',
    referenceAsset: 'F.2.2_NKTW_Alternative.svg',
    spec: { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', organization: 'hilfsorganisation', bodyMarks: ['patient-transport'], labels: { topLeft: '2' } },
  },
  'F.2.3': {
    title: 'RTW',
    referenceAsset: 'F.2.3_RTW.svg',
    spec: { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', organization: 'hilfsorganisation', bodyMarks: ['medical-service'], labels: { topLeft: 'RTW' } },
  },
  'F.2.3#alternative': {
    title: 'RTW',
    referenceAsset: 'F.2.3_RTW_Alternative.svg',
    spec: { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', organization: 'hilfsorganisation', bodyMarks: ['patient-transport', 'intensive-care'] },
  },
  'F.2.4': {
    title: 'NEF',
    referenceAsset: 'F.2.4_NEF.svg',
    spec: { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', organization: 'hilfsorganisation', bodyMarks: ['medical-service'], labels: { topLeft: 'NEF' } },
  },
  'F.2.4#alternative': {
    title: 'NEF',
    referenceAsset: 'F.2.4_NEF_Alternative.svg',
    spec: { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', organization: 'hilfsorganisation', bodyMarks: ['physician'] },
  },
  'F.2.5': {
    title: 'NAW',
    referenceAsset: 'F.2.5_NAW.svg',
    spec: { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', organization: 'hilfsorganisation', bodyMarks: ['medical-service'], labels: { topLeft: 'NAW' } },
  },
  'F.2.5#alternative': {
    title: 'NAW',
    referenceAsset: 'F.2.5_NAW_Alternative.svg',
    spec: { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', organization: 'hilfsorganisation', bodyMarks: ['patient-transport', 'intensive-care', 'physician'] },
  },
  'F.2.6': {
    title: 'Rettungstransporthubschrauber mit Winschmöglichkeit',
    referenceAsset: 'F.2.6_Rettungstransporthubschrauber mit Winschmöglichkeit.svg',
    spec: { kind: 'vehicle-air', bodyVariant: 'raised-hull', organization: 'hilfsorganisation', bodyMarks: ['medical-service', 'air-winch-chevron-diamond'] },
  },
  'F.2.7': {
    title: 'Intensivtransporthubschrauber',
    referenceAsset: 'F.2.7_Intensivtransporthubschrauber.svg',
    spec: { kind: 'vehicle-air', bodyVariant: 'raised-hull', organization: 'hilfsorganisation', bodyMarks: ['physician'], labels: { aboveLeft: 'ITH' } },
  },
  'F.2.8': {
    title: 'Gerätewagen Sanitätsdienst',
    referenceAsset: 'F.2.8_Gerätewagen Sanitätsdienst.svg',
    spec: { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', organization: 'hilfsorganisation', bodyMarks: ['medical-service'], labels: { topLeftLines: ['GW-San', '50'] } },
  },
  'F.2.9': {
    title: 'Unfallhilfsstelle',
    referenceAsset: 'F.2.9_Unfallhilfsstelle.svg',
    spec: { kind: 'trailer', organization: 'hilfsorganisation', bodyMarks: ['medical-service'] },
  },
} as const satisfies Record<string, Recipe>;

export const ANHANG_F_C_FINDINGS: Readonly<Record<string, string>> = Object.freeze({
  'F.2.2':
    'Die kleine obere Rechteckmarke ist sichtbar und vermessen, aber in der Quelle nicht ' +
    'begrifflich benannt. Sie bleibt deshalb eine rein geometrische TechnicalBodyMarkId.',
  'F.2.6':
    'Die Pfeil-und-Rauten-Topologie des Winschzeichens ist sichtbar und vermessen; die Quelle ' +
    'belegt aber keine Gleichsetzung mit der Capability lifting-loads-persons. Sie bleibt eine ' +
    'neutrale TechnicalBodyMarkId.',
  'F.2.7': 'Der Lauf „ITH“ liegt vollständig oberhalb der Luftfahrzeughülle.',
  'F.2.8': '„GW-San“ und „50“ sind zwei getrennte linksbündige Läufe mit kleinerem Schriftgrad.',
});

export const ANHANG_F_C_DEVIATIONS: Readonly<Record<string, string>> = Object.freeze({
  'F.2.2':
    'Die fachliche Bedeutung der oberen Rechteckmarke bleibt offen; der technische Name ' +
    'behauptet ausschließlich ihre Geometrie.',
});

/** F.2.10 bis F.2.17: Betreuung auf normalem, gebändertem Land- und Anhängerfahrzeug. */
export const ANHANG_F_D_RECIPES = {
  'F.2.10': {
    title: 'Betreuungskombi',
    referenceAsset: 'F.2.10_Betreuungskombi.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'hilfsorganisation',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['care'],
      labels: {
        topLeft: 'BTKombi',
        topLeftMetrics: {
          capHeightMm: 2.191447,
          baselineFromBodyTopMm: 5.249923,
          anchorFromBodyLeftMm: 0.51423,
        },
      },
    },
  },
  'F.2.11': {
    title: 'Betreuungskombi mit Material zum Einrichten einer Anlaufstelle',
    referenceAsset: 'F.2.11_Betreuungskombi mit Material zum Einrichten einer Anlaufstelle.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'hilfsorganisation',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['care', 'ring-6mm-offset-down-3mm-four-way-stem'],
      labels: {
        topLeft: 'BTKombi',
        topLeftMetrics: {
          capHeightMm: 2.191447,
          baselineFromBodyTopMm: 5.249923,
          anchorFromBodyLeftMm: 0.51423,
        },
      },
    },
  },
  'F.2.12': {
    title: 'Gerätewagen Betreuung',
    referenceAsset: 'F.2.12_Gerätewagen Betreuung.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'hilfsorganisation',
      vehicleCategory: 'kfz-kategorie-2',
      bodyMarks: ['care'],
      labels: {
        topLeft: 'GwBT',
        topLeftMetrics: {
          capHeightMm: 2.919225,
          baselineFromBodyTopMm: 6.249691,
          anchorFromBodyLeftMm: 1.010503,
        },
      },
    },
  },
  'F.2.13': {
    title: 'Betreuungs-LKW mit mobiler Einsatzküche',
    referenceAsset: 'F.2.13_Betreuungs-LKW mit mobiler Einsatzküche.svg',
    spec: {
      kind: 'vehicle-land',
      bodyVariant: 'foot-band',
      organization: 'hilfsorganisation',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['care', 'meal-preparation'],
      labels: {
        topLeft: 'GwBT',
        topLeftMetrics: {
          capHeightMm: 2.919225,
          baselineFromBodyTopMm: 6.249691,
          anchorFromBodyLeftMm: 1.010503,
        },
      },
    },
  },
  'F.2.14': {
    title: 'Gerätewagen Logistik der Betreuung',
    referenceAsset: 'F.2.14_Gerätewagen Logistik der Betreuung.svg',
    spec: {
      kind: 'vehicle-land',
      bodyVariant: 'foot-band',
      organization: 'hilfsorganisation',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['care'],
      labels: {
        topLeft: 'GwLog',
        topLeftMetrics: {
          capHeightMm: 2.432746,
          baselineFromBodyTopMm: 5.249923,
          anchorFromBodyLeftMm: 1.009024,
        },
      },
    },
  },
  'F.2.15': {
    title: 'Geräteanhänger Betreuung',
    referenceAsset: 'F.2.15_Geräteanhänger Betreuung.svg',
    spec: {
      kind: 'trailer',
      organization: 'hilfsorganisation',
      vehicleCategory: 'anhaenger-ein-rad',
      bodyMarks: ['care'],
    },
  },
  'F.2.16': {
    title: 'Fahrzeug der Betreuung, Transport 40 Betroffene',
    referenceAsset: 'F.2.16_Fahrzeug der Betreuung_Transport 40 Betroffene.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'hilfsorganisation',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['care', 'ring-5mm-offset-down-3mm-eight-spokes'],
      labels: {
        topLeft: '40',
        topLeftMetrics: {
          capHeightMm: 2.749893,
          baselineFromBodyTopMm: 6.749576,
          anchorFromBodyLeftMm: 1.497298,
        },
      },
    },
  },
  'F.2.17': {
    title: 'Betreuungs-LKW Trinkwasserversorgung',
    referenceAsset: 'F.2.17_Betreuungs-LKW_Trinkwasserversorgung.svg',
    spec: {
      kind: 'vehicle-land',
      bodyVariant: 'foot-band',
      organization: 'hilfsorganisation',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['care', 'drinking-water'],
      labels: {
        topLeft: 'BtlLKW',
        topLeftMetrics: {
          capHeightMm: 2.432746,
          baselineFromBodyTopMm: 5.749807,
          anchorFromBodyLeftMm: 0.766269,
        },
      },
    },
  },
} as const satisfies Record<string, Recipe>;

export const ANHANG_F_D_FINDINGS: Readonly<Record<string, string>> = Object.freeze({
  'F.2.11':
    'Der Ring um (16|19) führt eine sichtbare Vierwegeform mit unterem Gabelsteg. Die Quelle ' +
    'benennt dafür keine Capability; die Umsetzung bleibt deshalb rein geometrisch.',
  'F.2.16':
    'Der Acht-Speichen-Ring liegt um (16|19) und damit 3 mm unter dem Fahrzeugring aus F-c. ' +
    'Die abweichende Fassung erhält eine eigene rein geometrische TechnicalBodyMarkId.',
  'F.2.17':
    'Die innere Rumpfkontur beginnt in der Referenz bei y 6,096 mm statt am gemeinsamen ' +
    'Fahrzeugwert. Dieser Quellenbefund begründet allein keine eigene Körpervariante.',
});

export const ANHANG_F_D_DEVIATIONS: Readonly<Record<string, string>> = Object.freeze({
  'F.2.17':
    'Der Katalog verwendet die gemeinsame vermessene Fahrzeughülle und führt für den ' +
    'quellenspezifischen Innenkonturwert keine eigene Rumpfvariante ein.',
});

/**
 * F.3.1 bis F.3.11: elf Platzzeichen auf dem separat vermessenen 12-mm-Kreis. F.3.5 ist die
 * einzige Giebelvariante dieses Teilslice. Die Zuordnung `hilfsorganisation` bleibt wie in F-a
 * eine technische Entscheidung für die ausschließlich weiße Quelle; keine Darstellung trägt
 * einen Stärkegrad.
 */
export const ANHANG_F_E_RECIPES = {
  'F.3.1': {
    title: 'Patientenablage',
    referenceAsset: 'F.3.1_Patientenablage.svg',
    spec: {
      kind: 'circle-12',
      organization: 'hilfsorganisation',
      bodyMarks: ['circle-patient-staging-arrows'],
    },
  },
  'F.3.2': {
    title: 'Patientenablage, arztbesetzt',
    referenceAsset: 'F.3.2_Patientenablage_arztbesetzt.svg',
    spec: {
      kind: 'circle-12',
      organization: 'hilfsorganisation',
      bodyMarks: ['circle-patient-staging-arrows', 'physician'],
    },
  },
  'F.3.3': {
    title: 'Unfallhilfsstelle / Sanitätsstation',
    referenceAsset: 'F.3.3_Unfallhilfsstelle_Sanitätsstation.svg',
    spec: {
      kind: 'circle-12',
      organization: 'hilfsorganisation',
      bodyMarks: ['medical-service'],
      labels: {
        topLeft: 'UHS',
        topLeftMetrics: {
          capHeightMm: 2.919225,
          baselineFromBodyTopMm: 1.000254,
          anchorFromBodyLeftMm: -2.984684,
        },
      },
    },
  },
  'F.3.4': {
    title: 'Unfallhilfsstelle / Sanitätsstation, arztbesetzt',
    referenceAsset: 'F.3.4_Unfallhilfsstelle_Sanitätsstation_arztbesetzt.svg',
    spec: {
      kind: 'circle-12',
      organization: 'hilfsorganisation',
      bodyMarks: ['medical-service', 'physician'],
      labels: {
        topLeft: 'UHS',
        topLeftMetrics: {
          capHeightMm: 2.919225,
          baselineFromBodyTopMm: 1.000254,
          anchorFromBodyLeftMm: -2.984684,
        },
      },
    },
  },
  'F.3.5': {
    title: 'Behandlungsplatz 50, ortsgebunden',
    referenceAsset: 'F.3.5_Behandlungsplatz 50_ortsgebunden.svg',
    spec: {
      kind: 'circle-12',
      bodyVariant: 'raised-gable',
      organization: 'hilfsorganisation',
      bodyMarks: ['medical-service', 'physician'],
      labels: {
        topLeft: '50',
        topLeftMetrics: {
          capHeightMm: 2.749893,
          baselineFromBodyTopMm: -0.999746,
          anchorFromBodyLeftMm: -2.974002,
        },
      },
    },
  },
  'F.3.6': {
    title: 'Sammelstelle allgemein',
    referenceAsset: 'F.3.6_Sammelstelle allgemein.svg',
    spec: {
      kind: 'circle-12',
      organization: 'hilfsorganisation',
      bodyMarks: ['circle-collection-arrow'],
    },
  },
  'F.3.7': {
    title: 'Sammelraum Einsatzfahrzeuge',
    referenceAsset: 'F.3.7_Sammelraum Einsatzfahrzeuge.svg',
    spec: {
      kind: 'circle-12',
      organization: 'hilfsorganisation',
      bodyMarks: ['circle-staging-frame-arrow'],
    },
  },
  'F.3.8': {
    title: 'Bereitstellungsraum',
    referenceAsset: 'F.3.8_Bereitstellungsraum.svg',
    spec: {
      kind: 'circle-12',
      organization: 'hilfsorganisation',
      bodyMarks: ['circle-staging-frame'],
    },
  },
  'F.3.9': {
    title: 'Pufferzone / Verfügungsraum Rettungsdienst',
    referenceAsset: 'F.3.9_Pufferzone_Verfügungsraum Rettungsdienst.svg',
    spec: {
      kind: 'circle-12',
      organization: 'hilfsorganisation',
      bodyMarks: ['circle-staging-frame-quadrants-arrows'],
    },
  },
  'F.3.10': {
    title: 'Ladezone',
    referenceAsset: 'F.3.10_Ladezone.svg',
    spec: {
      kind: 'circle-12',
      organization: 'hilfsorganisation',
      bodyMarks: ['circle-diamond-arrow'],
    },
  },
  'F.3.11': {
    title: 'Rettungsmittelhalteplatz',
    referenceAsset: 'F.3.11_Rettungsmittelhalteplatz.svg',
    spec: {
      kind: 'circle-12',
      organization: 'hilfsorganisation',
      bodyMarks: ['circle-cross-ring'],
    },
  },
} as const satisfies Record<string, Recipe>;

/** Quellenbefunde des am 26. August 2026 einzeln vermessenen F.3.1–F.3.11-Blocks. */
export const ANHANG_F_E_FINDINGS: Readonly<Record<string, string>> = Object.freeze({
  'F.3.1':
    'Die obere Doppelpfeilform steht auf der Kreis-Fachdienstteilung und erhält eine neutrale ' +
    'technische ID; die Quelle benennt für das Innenmotiv keine eigenständige Capability.',
  'F.3.2':
    'Die Arztleiste ergänzt dieselbe geteilte Doppelpfeilform wie F.3.1. Gemeinsame ' +
    'Teilungslinien werden als eine Schicht gezeichnet.',
  'F.3.3':
    'Der Lauf „UHS“ beginnt 2,984684 mm links der Kreis-Hüllenkante und ist deshalb nur mit ' +
    'seinem vollständigen, gegen die ViewBox geprüften Metriksatz belegt.',
  'F.3.4':
    'Die Arztleiste ergänzt Sanitätsteilung und denselben außerhalb beginnenden UHS-Lauf wie ' +
    'F.3.3; gemeinsame Teilungslinien werden nicht überzeichnet.',
  'F.3.5':
    'Der Kreis ist um 2 mm auf Mittelpunkt (16|18) abgesenkt. Der Giebel (3|11)–(16|1)–(29|11) ' +
    'und der teilweise oberhalb liegende Lauf „50“ sind separat vermessen.',
  'F.3.6':
    'Sammelpfeil und kleiner Ring sind als zusammengehörige, rein technische Kreisform ' +
    'vermessen; die Quelle ordnet ihnen keine CapabilityId zu.',
  'F.3.7':
    'Gewölbter Rahmen, Rechtspfeil und kleiner Ring bilden eine eigene technische Kreisform.',
  'F.3.8':
    'Der geschlossene gewölbte Rahmen unterscheidet sich sichtbar von der Pfeilfassung F.3.7 ' +
    'und bleibt deshalb eine eigene technische ID.',
  'F.3.9':
    'Der viergeteilte gewölbte Rahmen trägt einen unteren Doppelpfeil und ist separat von den ' +
    'Rahmenfassungen F.3.7/F.3.8 vermessen.',
  'F.3.10':
    'Raute, Mittelsteg, Anschlag und Rechtspfeil sind eine neutrale technische Form; die ' +
    'Zeichnung belegt weder Patiententransport noch Spezialrettung.',
  'F.3.11':
    'Der Kreuzring steht auf der Kreis-Fachdienstteilung. Die Darstellung wird nicht als ' +
    'Patiententransport fortgeschrieben, weil die Quelle diese Semantik hier nicht belegt.',
});

export const ANHANG_F_E_DEVIATIONS: Readonly<Record<string, string>> = Object.freeze({});

/**
 * F.3.12 bis F.3.19: die acht verbleibenden Platzzeichen. Sechs stehen auf dem bereits
 * vermessenen 12-mm-Kreis, F.3.14 in dessen abgesenkter Giebelfassung; Unterkunft und
 * Krankenhaus teilen die reduzierte Hauskontur. Alle Quellen führen ausschließlich die weiße
 * HiOrg-Fläche und keinen Stärkegrad.
 */
export const ANHANG_F_F_RECIPES = {
  'F.3.12': {
    title: 'Anlaufstelle für Betroffene',
    referenceAsset: 'F.3.12_Anlaufstelle für Betroffene.svg',
    spec: {
      kind: 'circle-12',
      organization: 'hilfsorganisation',
      bodyMarks: ['circle-double-arrow-lower-v'],
    },
  },
  'F.3.13': {
    title: 'Betreuungsstelle',
    referenceAsset: 'F.3.13_Betreuungsstelle.svg',
    spec: {
      kind: 'circle-12',
      organization: 'hilfsorganisation',
      bodyMarks: ['care'],
    },
  },
  'F.3.14': {
    title: 'Betreuungsplatz, ortsgebunden',
    referenceAsset: 'F.3.14_Betreuungsplatz_ortsgebunden.svg',
    spec: {
      kind: 'circle-12',
      bodyVariant: 'raised-gable',
      organization: 'hilfsorganisation',
      bodyMarks: ['care'],
      labels: {
        topLeft: '500',
        topLeftMetrics: {
          capHeightMm: 2.749893,
          baselineFromBodyTopMm: -0.999746,
          anchorFromBodyLeftMm: -2.974002,
        },
      },
    },
  },
  'F.3.15': {
    title: 'Unterkunft',
    referenceAsset: 'F.3.15_Unterkunft.svg',
    spec: {
      kind: 'reduced-house',
      organization: 'hilfsorganisation',
      bodyMarks: ['temporary-accommodation-resting'],
    },
  },
  'F.3.16': {
    title: 'Krankenhaus',
    referenceAsset: 'F.3.16_Krankenhaus.svg',
    spec: {
      kind: 'reduced-house',
      organization: 'hilfsorganisation',
      bodyMarks: ['hospital'],
    },
  },
  'F.3.17': {
    title: 'Notfallinformationspunkt / KatS-Leuchtturm',
    referenceAsset: 'F.3.17_Notfallinformationspunkt_KatS-Leuchtturm.svg',
    spec: {
      kind: 'circle-12',
      organization: 'hilfsorganisation',
      bodyMarks: ['circle-information-stem'],
    },
  },
  'F.3.18': {
    title: 'Ladezone Personentransport',
    referenceAsset: 'F.3.18_Ladezone Personentransport.svg',
    spec: {
      kind: 'circle-12',
      organization: 'hilfsorganisation',
      bodyMarks: ['circle-transport-diamond-arrows'],
    },
  },
  'F.3.19': {
    title: 'Ladezone Personentransport, besondere Bedarfe',
    referenceAsset: 'F.3.19_Ladezone Personentransport_besondere Bedarfe.svg',
    spec: {
      kind: 'circle-12',
      organization: 'hilfsorganisation',
      bodyMarks: ['circle-transport-diamond-wheels-arrows'],
    },
  },
} as const satisfies Record<string, Recipe>;

/** Quellenbefunde des am 26. August 2026 einzeln vermessenen F.3.12–F.3.19-Blocks. */
export const ANHANG_F_F_FINDINGS: Readonly<Record<string, string>> = Object.freeze({
  'F.3.12':
    'Doppelpfeil, Stamm und untere Gabel bilden eine rein technische Kreisform; die Quelle ' +
    'belegt dafür keine eigenständige Capability.',
  'F.3.13':
    'Der offene Zweischenkelzug ist die quellengetreue Kreisfassung der semantischen ' +
    'Capability Betreuung und keine skalierte Formation- oder Fahrzeugmarke.',
  'F.3.14':
    'Kreis, Giebel und Lauf „500“ verwenden dieselbe abgesenkte Fassung und denselben ' +
    'vollständigen Metriksatz wie der vermessene F.3.5-Beleg; die Betreuungsmarke liegt 2 mm tiefer.',
  'F.3.15':
    'Unterkunft belegt die semantische Marke temporary-accommodation-resting in einer eigenen ' +
    'quellengetreuen Hausfassung; die Liegekurve wurde zusätzlich gegen das Originalraster geprüft.',
  'F.3.16':
    'Die zusätzliche Outline-Angabe der Quelle ist die Strichhülle derselben reduzierten ' +
    'Hauskontur, kein zweiter Körper und keine abweichende Körpervariante.',
  'F.3.17':
    'Punkt und gefüllter Stamm sind eine rein technische Informationsform und werden nicht in ' +
    'die anders gezeichnete Capability information-communications umgedeutet.',
  'F.3.18':
    'Raute, unterer Stop/Pfeil und innere Diagonalen bilden eine technische Form; Titel und ' +
    'Geometrie belegen nicht das vorhandene patient-transport-Motiv.',
  'F.3.19':
    'Die beiden offenen Ringe ergänzen Raute und unteren Stop/Pfeil ohne die Diagonalen aus ' +
    'F.3.18; diese Topologie erhält deshalb eine eigene technische ID.',
});

export const ANHANG_F_F_DEVIATIONS: Readonly<Record<string, string>> = Object.freeze({});

export const ANHANG_F_B_FINDINGS: Readonly<Record<string, string>> = Object.freeze({
  'F.1.3':
    'Die Bettzeichnung ist bildgleich mit F.1.19; allein F.1.3 führt zusätzlich das schwarze ' +
    'Fußband. Der Lauf „5.000“ beginnt in der Quelle rund 0,48 mm weiter links als die vier ' +
    'Vergleichsläufe, die den gemeinsamen topLeft-Anker auf 2,5 mm belegen.',
  'F.1.16':
    'Die Körpermarke kombiniert die gefüllte Drohnenmarke aus 3.6 mit einer zweiten gefüllten ' +
    'Doppelkeilform. Sie wird als rein geometrische TechnicalBodyMarkId gebaut; der Katalog ' +
    'behauptet damit weder SymbolKind noch CapabilityId, denn ihre fachliche Benennung ist aus ' +
    'dem Bild allein nicht ableitbar.',
  'F.1.17':
    'Neben Zelt, Fußband und Lauf „250“ steht eine gegenüber 4.8.13 deutlich verkleinerte ' +
    'Verpflegungszeichnung. Sie bleibt dieselbe Capability `catering`, erhält aber eine eigene ' +
    'am F.1.17-Raster belegte randbündige Fassung statt eines Rückfalls auf die Boxfassung.',
  'F.1.13':
    'F.1.13 umschließt Teilung und Arztleiste mit einem Kreis r 7 mm um (16|17). F.1.21 trägt ' +
    'dagegen r 6,5 mm um (16|18) mit eigener Innenzeichnung; beide werden als getrennte rein ' +
    'geometrische TechnicalBodyMarkIds gebaut, ohne Capability-Semantik zu behaupten.',
  'F.1.21':
    'F.1.21 führt einen Kreis r 6,5 mm um (16|18), ein Dach (7|15–16|8–25|15) und ein ' +
    'eingeschriebenes Dreieck. Die sichtbare Verwandtschaft mit F.1.13 belegt wegen der ' +
    'abweichenden Maße keinen gemeinsamen Capability-Begriff.',
});
export const ANHANG_F_B_DEVIATIONS: Readonly<Record<string, string>> = Object.freeze({
  'F.1.3': 'Die zwei Kopfbalken werden ohne begrifflich belegte StrengthId nicht gezeichnet.',
  'F.1.13':
    'Der einzelne Kopfbalken wird ohne begrifflich belegte StrengthId nicht gezeichnet. Der ' +
    'Kreis ist als rein geometrische TechnicalBodyMarkId gebaut, nicht als CapabilityId.',
  'F.1.21':
    'Der einzelne Kopfbalken wird ohne begrifflich belegte StrengthId nicht gezeichnet. Die ' +
    'komplexe Innenform ist als rein geometrische TechnicalBodyMarkId gebaut, nicht als ' +
    'CapabilityId.',
});

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
    'Der waagerechte Arm der Teilung steht in der Quelle in zwei Bauformen: links als eigenes ' +
    'Rechteck (1,0…10,5 mm auf y 15,75…16,25) neben der Ebene, rechts als Zwischenraum zweier ' +
    'weisser Felder innerhalb desselben Pfades (21,7375…30,75 auf derselben Höhe). Beide Arme ' +
    'reichen von der Körperkante bis an den Ring und nicht durch ihn. Der Katalog zieht den Arm ' +
    'durch; im Bild ist das derselbe Strich, weil die acht Speichen im Ring auf den beiden ' +
    'Mittellinien und den beiden Diagonalen liegen — die Durchzeichnung deckt sich dort mit dem, ' +
    'was die Referenz als Feldgrenzen zeichnet.',
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
