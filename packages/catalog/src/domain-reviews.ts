import type { ProfileId, Review, SourceId } from '@einsatzzeichen/schema';
import { deepFreeze, type DeepReadonly } from './readonly-data.js';

/**
 * Fachreview-Ledger des aktuellen Manifests, absichtlich mit genau einem eigenen Objekt je
 * Manifestschlüssel. Dadurch kann ein menschlicher Fachreviewer Einträge schrittweise freigeben,
 * ohne über ein gemeinsam referenziertes `Review` versehentlich weitere Einträge mitzuändern.
 *
 * Die Vollständigkeit und die identische Verdrahtung zum Manifest werden in
 * `domain-reviews.test.ts` in beide Richtungen geprüft. Ein neuer Manifest-Eintrag muss deshalb
 * hier bewusst als `pending` aufgenommen werden, bevor das Gate wieder grün wird.
 */
export const MANIFEST_DOMAIN_REVIEWS = deepFreeze({
  'bbk-babz-2025:1.1#primary': { status: 'pending' },
  'bbk-babz-2025:1.2#primary': { status: 'pending' },
  // Die sechs Grundzeichen aus LFH-424. Bei ihnen steht über die übliche fachliche Prüfung hinaus
  // je eine eigene Frage aus: ob `1.13 Ereignis` fachlich zu Recht als einziges Grundzeichen keine
  // Organisation annehmen darf (der Katalog wirft dafür, belegt allein daraus, dass die Referenz
  // den Haken in keinem zusammengesetzten Zeichen führt), und ob `1.3` bis `1.5` ohne die
  // Fahrwerksmarken aus Kapitel 5.1 als vollständige Zeichen gelten — sie sind vermessen, aber
  // nicht umgesetzt, und `validateSpec` lehnt eine Fahrzeugkategorie deshalb ab.
  'bbk-babz-2025:1.3#primary': { status: 'pending' },
  'bbk-babz-2025:1.4#primary': { status: 'pending' },
  'bbk-babz-2025:1.5#primary': { status: 'pending' },
  'bbk-babz-2025:1.6#primary': { status: 'pending' },
  'bbk-babz-2025:1.7#primary': { status: 'pending' },
  'bbk-babz-2025:1.8#primary': { status: 'pending' },
  'bbk-babz-2025:1.9#primary': { status: 'pending' },
  'bbk-babz-2025:1.10#primary': { status: 'pending' },
  'bbk-babz-2025:1.11#primary': { status: 'pending' },
  'bbk-babz-2025:1.12#primary': { status: 'pending' },
  'bbk-babz-2025:1.13#primary': { status: 'pending' },
  'bbk-babz-2025:1.14#primary': { status: 'pending' },
  'bbk-babz-2025:C.1.1#primary': { status: 'pending' },
  'bbk-babz-2025:C.1.2#primary': { status: 'pending' },
  // Anhang D.1: alle zehn Darstellungen bleiben fachlich offen. Insbesondere behauptet die
  // technische ID von D.1.1 keine freigegebene Übersetzung des Führungsbegriffs; D.1.3 und
  // D.1.8 tragen die im Design markierten englischen Arbeitsnamen weiter.
  'bbk-babz-2025:D.1.1#primary': { status: 'pending' },
  'bbk-babz-2025:D.1.2#primary': { status: 'pending' },
  'bbk-babz-2025:D.1.3#primary': { status: 'pending' },
  'bbk-babz-2025:D.1.4#primary': { status: 'pending' },
  'bbk-babz-2025:D.1.5#primary': { status: 'pending' },
  'bbk-babz-2025:D.1.6#primary': { status: 'pending' },
  'bbk-babz-2025:D.1.7#primary': { status: 'pending' },
  'bbk-babz-2025:D.1.8#primary': { status: 'pending' },
  // Die Quelle belegt an D.1.9 zunächst nur einen weißen Körper. Ob daraus die Organisation
  // hilfsorganisation folgt, ist für beide Darstellungen eine offene Fachfrage, keine durch die
  // sichtbare Farbe erledigte Freigabe.
  'bbk-babz-2025:D.1.9#primary': {
    status: 'pending',
    note: 'Organisationszuordnung hilfsorganisation ist aus der weißen Fläche abgeleitet.',
  },
  'bbk-babz-2025:D.1.9#alternative': {
    status: 'pending',
    note: 'Organisationszuordnung hilfsorganisation ist aus der weißen Fläche abgeleitet.',
  },
  // Anhang D.2: sieben vollständige Ortszeichen. Die gelbe Kreisfläche belegt keine
  // Organisation, und die technischen englischen IDs behaupten keine fachlich freigegebene
  // Übersetzung der Ortsbegriffe. Alle sieben Darstellungen bleiben deshalb einzeln offen.
  'bbk-babz-2025:D.2.1#primary': { status: 'pending' },
  'bbk-babz-2025:D.2.2#primary': { status: 'pending' },
  'bbk-babz-2025:D.2.3#primary': { status: 'pending' },
  'bbk-babz-2025:D.2.4#primary': { status: 'pending' },
  'bbk-babz-2025:D.2.5#primary': { status: 'pending' },
  'bbk-babz-2025:D.2.6#primary': { status: 'pending' },
  'bbk-babz-2025:D.2.7#primary': { status: 'pending' },
  // D.3.7 ist technisch auf die gemessene Funktionsfassung migriert. Ob die Rolle
  // „Zugführer der Feuerwehr" und die innere Brandbekämpfungsmarke fachlich genau diese
  // Semantik tragen, bleibt ausdrücklich der Fachprüfung vorbehalten.
  'bbk-babz-2025:D.3.7#primary': { status: 'pending' },
  // Anhang E, Teilslice E-a: die 16 Bergungs- und Fachgruppen des THW. Ihre Bedeutung liegt
  // vollständig in einem Buchstabenkürzel, das am Referenzbild abgelesen wurde — die fachliche
  // Prüfung, ob „B" tatsächlich die Bergungsgruppe und nicht etwa den Bergungstrupp bezeichnet,
  // steht damit besonders aus.
  'bbk-babz-2025:E.1.1#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.2#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.3#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.4#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.5#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.6#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.7#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.8#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.9#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.10#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.11#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.12#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.13#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.14#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.15#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.16#primary': { status: 'pending' },
  // Anhang E, Teilslice E-b: Fachzüge, Zugtrupps, Stab und die Logistikeinheiten des THW. Ein
  // eigener Block und keine erweiterte Zahl oben, weil der E-a-Satz „Bergungs- und Fachgruppen"
  // diese Einheiten fachlich nicht deckt: hier stehen Führungs- und Unterstellungsverhältnisse
  // zur Prüfung, nicht nur die Zuordnung eines Kürzels zu einer Gruppe. Drei Fragen sind
  // ausdrücklich offen und in keinem technischen Gate beantwortbar — ob „FZ-" als Kürzel eines
  // Musterblatts überhaupt eine Einheit bezeichnet (E.1.17), ob ein Zugtrupp ohne die
  // Unterstellungsmarke seiner Referenz noch dieselbe Einheit bezeichnet (E.1.19, E.1.24), und
  // ob „Stab" ohne Stärkeangabe von einem Fachzug unterscheidbar bleibt (E.1.21).
  'bbk-babz-2025:E.1.17#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.18#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.19#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.20#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.21#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.22#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.23#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.24#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.25#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.26#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.27#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.28#primary': { status: 'pending' },
  // Anhang E, Teilslice E-c: Trupps, Teams und der Ortsverband. Wieder ein eigener Block, weil
  // die offenen Fragen andere sind als in E-a und E-b: bei E.1.30 und E.1.36 trägt der Dateiname
  // kein Stärkewort und die Einordnung als Gruppe bzw. Zug ruht allein auf der Kopfgeometrie; bei
  // E.1.31 baut der Katalog die Balkenkopfzone der Referenz nicht, und ob „SysBR" ohne die Zahl
  // 500 des Dateinamens dieselbe Einheit bezeichnet, entscheidet keine Messung; bei E.1.37 steht
  // mit dem Ortsverband erstmals eine Einrichtung statt einer Einheit im Anhang. Dazu bei allen
  // neun die Frage, ob die runde Versalie in „VOST" und „OV" ein O ist — im gesamten E.1-Bestand
  // kommt keine Ziffer vor, es gibt also keine Negativkontrolle gegen die Null.
  'bbk-babz-2025:E.1.29#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.30#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.31#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.32#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.33#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.34#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.35#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.36#primary': { status: 'pending' },
  'bbk-babz-2025:E.1.37#primary': { status: 'pending' },
  // Anhang E, Teilslice E-d: die 21 Landfahrzeuge E.2.1 bis E.2.21, davon 20 des THW. Ein
  // eigener Block, weil die offenen Fragen hier zum ersten Mal nicht die Einheit betreffen,
  // sondern das **Gerät** und seine Benennung. Fünf stehen ausdrücklich aus und sind in keinem
  // technischen Gate beantwortbar: ob „Telelader" (Bild) oder „Teleskopstapler" (Dateiname) das fachlich
  // tragende Kürzel für E.2.7 ist; ob „Bagger" ohne die Kurzform „BRmG" die
  // Bergungsräumgeräte E.2.9 und E.2.10 hinreichend bezeichnet (im Bild kommt „BRmG" in keinem
  // der drei vor); ob die Zuordnung „Kategorie 1/2/3 = straßenfähig/geländefähig/geländegängig"
  // trägt, die aus der Mehrheit der Dateinamen abgeleitet ist und der E.2.12, E.2.13 und E.2.18
  // widersprechen; und ob E.2.9 und E.2.10, die dasselbe Kürzel und verschiedene Fahrwerke
  // führen, im Einsatz verwechslungsfrei bleiben; und — die fünfte, seit E.2.6 am 18. August 2026
  // nachgezogen wurde — ob der orange Körper der `sonstige-gefahrenabwehr` bei zugleich
  // gezeichnetem Trägerkürzel `THW` die Zuordnung oder den Betreiber bezeichnet. Der Dateiname
  // („öffentliche Gefahrenabwehr, THW betrieben") legt das Zweite nahe, entschieden ist es von
  // keiner Messung.
  //
  // Die **Kontrastlage** von E.2.6 gehört ausdrücklich nicht hierher: weiss auf orange verfehlt
  // die Textschwelle in jedem Theme, das ist gemessen und als Ausnahme in `CONTRAST_EXCEPTIONS`
  // entschieden — keine fachliche Frage an ein Review.
  'bbk-babz-2025:E.2.1#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.2#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.3#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.4#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.5#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.6#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.7#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.8#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.9#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.10#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.11#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.12#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.13#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.14#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.15#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.16#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.17#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.18#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.19#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.20#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.21#primary': { status: 'pending' },
  // Anhang E, Teilslice E-e: Anhänger und Sonderkörper. Wieder ein eigener Block, weil hier zwei
  // Fragen zusammenkommen, die es in E.1 nicht gab. Erstens: **bezeichnet ein Anhänger mit einem
  // Rad etwas anderes als einer mit zweien?** Die Zeichnung unterscheidet sie, die Quelle
  // benennt sie widersprüchlich (E.2.22 „Grundzeichen" und E.2.23 „von LKW gezogen" tragen beide
  // ein Rad, E.2.24 mit demselben Namenszusatz zwei), und der Katalog benennt deshalb die Räder
  // statt des Zugfahrzeugs — dieselbe Frage steht an 5.1.2.4 und 5.1.2.5. Zweitens: ob die
  // Trinkwasseraufbereitungsanlage (E.2.26) mit ihrem hochkanten Rechteck ein eigenes
  // Grundzeichen verdient; ihre Körperform kommt in genau einer der 661 Referenzdateien vor, und
  // was sie fachlich bezeichnet, sagt die Datei nicht. Dazu bei E.2.22 die Frage, ob ein Zeichen
  // ohne mittiges Kürzel — das einzige des Anhangs — überhaupt eine Einheit bezeichnet oder wie
  // E.1.17 ein Musterblatt ist.
  'bbk-babz-2025:E.2.22#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.23#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.24#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.25#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.26#primary': { status: 'pending' },
  // Anhang E, Teilslice E-f: die Wasserfahrzeuge. Eigener Block wegen einer Frage, die keine der
  // 66 übrigen E-Zeilen stellt: **sind E.2.29 bis E.2.31 dieselben Einheiten wie I.3.5 bis
  // I.3.7?** Ihre mittigen Läufe sind bis auf 0,00035 mm deckungsgleich, sie tragen dieselben
  // Namen, und sie unterscheiden sich allein in der Farbe. Heute kollidiert nichts, weil Anhang
  // I nicht im beanspruchten Umfang steht — die Antwort entscheidet aber, ob dort
  // Alternativdarstellungen entstehen oder eigene IDs. Dazu bei E.2.27 die Frage, ob ein
  // Wasserfahrzeug ohne jedes Kürzel im Körper mehr bezeichnet als das Grundzeichen 1.5 selbst.
  'bbk-babz-2025:E.2.27#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.28#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.29#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.30#primary': { status: 'pending' },
  'bbk-babz-2025:E.2.31#primary': { status: 'pending' },
  // Anhang F, Teilslice F-a: die sanitätsdienstlichen Einheiten F.1.1 bis F.1.11 — elf Zeilen
  // für zehn Abschnitte, weil F.1.11 als erster Abschnitt des Katalogs eine Alternativdarstellung
  // führt. Der Zuschnitt (`docs/decisions/2026-08-18-anhang-f-zuschnitt.md`) rechnet F-a elf
  // Abschnitte zu; im damaligen F-a-Stand hatte F.1.3 noch kein Rezept und deshalb in diesem
  // Block keinen Platz. F-b hat es später als aufgeschobenen Carry-in ergänzt. Der Ledger ist
  // mit dem **Manifest** deckungsgleich und nicht mit dem historischen Zuschnitt, und diese
  // Deckungsgleichheit prüft `domain-reviews.test.ts` in beide Richtungen. Eigener Block, weil hier zum ersten Mal
  // die **Organisation selbst** zur Frage steht: alle 66 F-Dateien führen ausschliesslich `#fff`,
  // und ob das `hilfsorganisation` bedeutet oder gar keine Organisation, sagt die Quelle nicht —
  // der Katalog hat sich für `hilfsorganisation` entschieden (Begründung in
  // `recipes-anhang-f.ts`), und diese Entscheidung ist genau das, was ein Fachreview bestätigen
  // oder umstossen muss. Sie wiegt schwerer als bei E, weil sie in den beiden Alternativthemes
  // sichtbar wird: `weiss` trägt dort die Punktsignatur aus `ORGANIZATION_BODY_DASHES`.
  //
  // Vier weitere Fragen, die keine Messung beantwortet: ob die am Bild abgelesenen Kürzel „MTF",
  // „SEG" und „RettD" fachlich tragen; ob die beiden Kopfbalken von F.1.1 einen fünften
  // Stärkegrad bezeichnen, den Kapitel 5.4 nicht führt (der Katalog zeichnet sie nicht, siehe
  // `ANHANG_F_A_DEVIATIONS`); ob F.1.9 und F.1.10 — beide „SEG", verschieden allein in der
  // Fachdienstteilung — im Einsatz verwechslungsfrei bleiben; und ob `F.1.11#alternative`
  // wirklich dasselbe bezeichnet wie `F.1.11` und deshalb zu Recht dessen Abschnitt teilt statt
  // einen eigenen zu bekommen.
  'bbk-babz-2025:F.1.1#primary': { status: 'pending' },
  // F.1.2 zeichnet als einziges Zeichen des Teilslices ein Fähigkeitszeichen aus Kapitel 4.1 im
  // Körper — und die Datei zeigt dabei 4.1.1 (ABC-/CBRN-Schutz), obwohl sie
  // „Dekontaminationseinheit" heißt; 4.1.3 (Dekontaminieren) trüge zusätzlich das Häkchenpaar an
  // den Schaftenden. Fachlich zu prüfen ist, welche der beiden Lesarten gilt: eine Einheit, die
  // ABC-Schutz leistet, oder eine, die dekontaminiert. Dazu die Frage, ob „MTF" hier richtig
  // steht — der Lauf ist zeichengleich mit dem von F.1.1, die Einheit trägt also das Kürzel
  // ihrer Task Force und kein eigenes.
  'bbk-babz-2025:F.1.2#primary': { status: 'pending' },
  // F.1.4 führt zwei randbündige Fachdienstzeichen zugleich — Teilung und Zelt, Sanitätsdienst
  // und Betreuung. Fachlich zu prüfen ist, ob die Nebeneinanderstellung dasselbe aussagt wie der
  // eine Umriss, den die Referenz zeichnet.
  'bbk-babz-2025:F.1.4#primary': { status: 'pending' },
  'bbk-babz-2025:F.1.5#primary': { status: 'pending' },
  'bbk-babz-2025:F.1.6#primary': { status: 'pending' },
  'bbk-babz-2025:F.1.7#primary': { status: 'pending' },
  'bbk-babz-2025:F.1.8#primary': { status: 'pending' },
  'bbk-babz-2025:F.1.9#primary': { status: 'pending' },
  'bbk-babz-2025:F.1.10#primary': { status: 'pending' },
  'bbk-babz-2025:F.1.11#primary': { status: 'pending' },
  // Die erste Ledgerzeile des Katalogs, die keine `primary`-Darstellung führt.
  'bbk-babz-2025:F.1.11#alternative': { status: 'pending' },
  'bbk-babz-2025:F.1.3#primary': { status: 'pending' },
  'bbk-babz-2025:F.1.12#primary': { status: 'pending' },
  'bbk-babz-2025:F.1.12#alternative': { status: 'pending' },
  'bbk-babz-2025:F.1.13#primary': { status: 'pending' },
  'bbk-babz-2025:F.1.14#primary': { status: 'pending' },
  'bbk-babz-2025:F.1.15#primary': { status: 'pending' },
  'bbk-babz-2025:F.1.15#alternative': { status: 'pending' },
  'bbk-babz-2025:F.1.16#primary': { status: 'pending' },
  'bbk-babz-2025:F.1.17#primary': { status: 'pending' },
  'bbk-babz-2025:F.1.18#primary': { status: 'pending' },
  'bbk-babz-2025:F.1.19#primary': { status: 'pending' },
  'bbk-babz-2025:F.1.20#primary': { status: 'pending' },
  'bbk-babz-2025:F.1.21#primary': { status: 'pending' },
  'bbk-babz-2025:F.1.22#primary': { status: 'pending' },
  // Anhang F, Teilslice F-c: Fahrzeuge und Anhänger des Sanitätsdienstes. Fachlich offen ist,
  // ob die rein aus der Grafik abgelesenen Fähigkeitskombinationen der fünf direkten
  // Alternativdarstellungen tatsächlich dieselben Fahrzeuge bezeichnen; insbesondere darf aus
  // dem Ring der Referenz nicht pauschal Intensivtransport abgeleitet werden. Ebenfalls zu
  // bestätigen sind die kleine obere Marke von F.2.2, die Hebe-/Winschform von F.2.6 und die
  // Bedeutung der oberhalb gesetzten Abkürzung ITH. Alle 14 bleiben deshalb einzeln pending.
  'bbk-babz-2025:F.2.1#primary': { status: 'pending' },
  'bbk-babz-2025:F.2.1#alternative': { status: 'pending' },
  'bbk-babz-2025:F.2.2#primary': { status: 'pending' },
  'bbk-babz-2025:F.2.2#alternative': { status: 'pending' },
  'bbk-babz-2025:F.2.3#primary': { status: 'pending' },
  'bbk-babz-2025:F.2.3#alternative': { status: 'pending' },
  'bbk-babz-2025:F.2.4#primary': { status: 'pending' },
  'bbk-babz-2025:F.2.4#alternative': { status: 'pending' },
  'bbk-babz-2025:F.2.5#primary': { status: 'pending' },
  'bbk-babz-2025:F.2.5#alternative': { status: 'pending' },
  'bbk-babz-2025:F.2.6#primary': { status: 'pending' },
  'bbk-babz-2025:F.2.7#primary': { status: 'pending' },
  'bbk-babz-2025:F.2.8#primary': { status: 'pending' },
  'bbk-babz-2025:F.2.9#primary': { status: 'pending' },
  // Anhang F, Teilslice F-d: Die acht Betreuungsfahrzeuge verwenden die technisch vermessenen
  // Fassungen aus F.2.10 bis F.2.17. Offen bleiben insbesondere die fachliche Bedeutung der
  // Vierwegeform aus F.2.11, die Einordnung des verschobenen Rings aus F.2.16 und weiterhin die
  // organisationssemantische Aussage der ausschließlich weißen Quelle.
  'bbk-babz-2025:F.2.10#primary': { status: 'pending' },
  'bbk-babz-2025:F.2.11#primary': { status: 'pending' },
  'bbk-babz-2025:F.2.12#primary': { status: 'pending' },
  'bbk-babz-2025:F.2.13#primary': { status: 'pending' },
  'bbk-babz-2025:F.2.14#primary': { status: 'pending' },
  'bbk-babz-2025:F.2.15#primary': { status: 'pending' },
  'bbk-babz-2025:F.2.16#primary': { status: 'pending' },
  'bbk-babz-2025:F.2.17#primary': { status: 'pending' },
  // Anhang F, Teilslice F-e: elf Platzzeichen auf dem 12-mm-Kreis. Fachlich offen bleiben die
  // organisationssemantische Zuordnung der ausschließlich weißen Körper, die Begriffe hinter
  // den neutral benannten Pfeil-/Rahmen-/Rautenformen sowie insbesondere die Frage, ob F.3.10
  // und F.3.11 tatsächlich von Patiententransport- oder Spezialrettungszeichen abzugrenzen sind.
  // Die technische Umsetzung behauptet diese Semantik ausdrücklich nicht.
  'bbk-babz-2025:F.3.1#primary': { status: 'pending' },
  'bbk-babz-2025:F.3.2#primary': { status: 'pending' },
  'bbk-babz-2025:F.3.3#primary': { status: 'pending' },
  'bbk-babz-2025:F.3.4#primary': { status: 'pending' },
  'bbk-babz-2025:F.3.5#primary': { status: 'pending' },
  'bbk-babz-2025:F.3.6#primary': { status: 'pending' },
  'bbk-babz-2025:F.3.7#primary': { status: 'pending' },
  'bbk-babz-2025:F.3.8#primary': { status: 'pending' },
  'bbk-babz-2025:F.3.9#primary': { status: 'pending' },
  'bbk-babz-2025:F.3.10#primary': { status: 'pending' },
  'bbk-babz-2025:F.3.11#primary': { status: 'pending' },
  // Anhang F, Teilslice F-f: die acht verbleibenden Platzzeichen. Fachlich offen bleiben die
  // HiOrg-Zuordnung der weißen Quellen und die Benennung der vier rein technischen Kreisformen;
  // die geometrischen Gates entscheiden weder deren Einsatzbedeutung noch die Abgrenzung von
  // Ladezone, Personentransport und besonderen Bedarfen.
  'bbk-babz-2025:F.3.12#primary': { status: 'pending' },
  'bbk-babz-2025:F.3.13#primary': { status: 'pending' },
  'bbk-babz-2025:F.3.14#primary': { status: 'pending' },
  'bbk-babz-2025:F.3.15#primary': { status: 'pending' },
  'bbk-babz-2025:F.3.16#primary': { status: 'pending' },
  'bbk-babz-2025:F.3.17#primary': { status: 'pending' },
  'bbk-babz-2025:F.3.18#primary': { status: 'pending' },
  'bbk-babz-2025:F.3.19#primary': { status: 'pending' },
  'bbk-babz-2025:2.1#primary': { status: 'pending' },
  // 2.2 seit LFH-424. Fachlich besonders zu prüfen: die Zuordnung „HiOrg = Hilfsorganisation" ist
  // aus dem gerasterten Bild abgelesen, nicht aus dem Dateinamen — der ist generisch
  // („Organisationen") und hatte die Zuordnung bisher verdeckt. Dazu die Frage, ob eine
  // Organisation, deren Farbe mit der neutralen Grundfüllung zusammenfällt, im Einsatz
  // verwechslungsfrei bleibt.
  'bbk-babz-2025:2.2#primary': { status: 'pending' },
  'bbk-babz-2025:2.3#primary': { status: 'pending' },
  'bbk-babz-2025:2.4#primary': { status: 'pending' },
  'bbk-babz-2025:2.5#primary': { status: 'pending' },
  'bbk-babz-2025:2.6#primary': { status: 'pending' },
  'bbk-babz-2025:2.7#primary': { status: 'pending' },
  'bbk-babz-2025:2.8#primary': { status: 'pending' },
  'bbk-babz-2025:5.4.1#primary': { status: 'pending' },
  'bbk-babz-2025:5.4.2#primary': { status: 'pending' },
  'bbk-babz-2025:5.4.3#primary': { status: 'pending' },
  'bbk-babz-2025:5.4.4#primary': { status: 'pending' },
  // Die fünf Fahrzeugkategorien aus LFH-424. Über die übliche fachliche Prüfung hinaus stehen bei
  // ihnen zwei Fragen aus, die keine Messung beantwortet: ob die Zuordnung „Kategorie 1/2/3 =
  // straßenfähig/geländefähig/geländegängig" stimmt (sie ist aus der Mehrheit der E.2-Dateinamen
  // abgeleitet, und vier der 31 E.2-Dateien widersprechen ihrem eigenen Namen), und ob die
  // Endpunkte des Verbindungsstrichs der Kategorie 3 fachlich auf der Ringmittellinie liegen
  // sollen — vermessen ist nur das Band, in dem sie liegen müssen (siehe `vehicle-categories.ts`).
  'bbk-babz-2025:5.1.1.1#primary': { status: 'pending' },
  'bbk-babz-2025:5.1.1.2#primary': { status: 'pending' },
  'bbk-babz-2025:5.1.1.3#primary': { status: 'pending' },
  'bbk-babz-2025:5.1.1.5#primary': { status: 'pending' },
  'bbk-babz-2025:5.1.1.6#primary': { status: 'pending' },
  // Die beiden Anhängerfahrwerke aus Kapitel 5.1.2. Fachlich offen ist hier zusätzlich, **ob ein
  // Anhänger mit einem Rad etwas anderes bezeichnet als einer mit zweien** — die Zeichnung
  // unterscheidet sie, die Quelle benennt sie widersprüchlich: `5.1.2.4` heißt „von PKW gezogen"
  // und `5.1.2.5` „von LKW gezogen", aber `E.2.23` („von LKW gezogen") trägt ein Rad und
  // `5.1.2.1` („allgemein") gar keines. Der Katalog benennt deshalb die Räder und nicht das
  // Zugfahrzeug; welche der beiden Lesarten fachlich trägt, entscheidet dieses Review.
  'bbk-babz-2025:5.1.2.4#primary': { status: 'pending' },
  'bbk-babz-2025:5.1.2.5#primary': { status: 'pending' },
  'bbk-babz-2025:4.3.1#primary': { status: 'pending' },
  'bbk-babz-2025:4.3.2#primary': { status: 'pending' },
  'bbk-babz-2025:4.3.3#primary': { status: 'pending' },
  'bbk-babz-2025:4.3.4#primary': { status: 'pending' },
  'bbk-babz-2025:4.3.5#primary': { status: 'pending' },
  'bbk-babz-2025:4.3.6#primary': { status: 'pending' },
  'bbk-babz-2025:4.4.1#primary': { status: 'pending' },
  'bbk-babz-2025:4.4.2#primary': { status: 'pending' },
  'bbk-babz-2025:4.4.3#primary': { status: 'pending' },
  'bbk-babz-2025:4.1.1#primary': { status: 'pending' },
  'bbk-babz-2025:4.1.2#primary': { status: 'pending' },
  'bbk-babz-2025:4.1.3#primary': { status: 'pending' },
  'bbk-babz-2025:4.1.4#primary': { status: 'pending' },
  'bbk-babz-2025:4.1.5#primary': { status: 'pending' },
  'bbk-babz-2025:4.1.6#primary': { status: 'pending' },
  'bbk-babz-2025:4.1.6#alternative': { status: 'pending' },
  'bbk-babz-2025:4.1.7#primary': { status: 'pending' },
  'bbk-babz-2025:4.1.7#alternative': { status: 'pending' },
  'bbk-babz-2025:4.1.8#primary': { status: 'pending' },
  'bbk-babz-2025:4.1.8#alternative': { status: 'pending' },
  'bbk-babz-2025:4.2.1#primary': { status: 'pending' },
  'bbk-babz-2025:4.2.2#primary': { status: 'pending' },
  'bbk-babz-2025:4.2.3#primary': { status: 'pending' },
  'bbk-babz-2025:4.2.4#primary': { status: 'pending' },
  'bbk-babz-2025:4.2.5#primary': { status: 'pending' },
  'bbk-babz-2025:4.5.1#primary': { status: 'pending' },
  'bbk-babz-2025:4.5.2#primary': { status: 'pending' },
  'bbk-babz-2025:4.5.3#primary': { status: 'pending' },
  'bbk-babz-2025:4.5.4#primary': { status: 'pending' },
  'bbk-babz-2025:4.5.5#primary': { status: 'pending' },
  'bbk-babz-2025:4.5.6#primary': { status: 'pending' },
  'bbk-babz-2025:4.5.7#primary': { status: 'pending' },
  'bbk-babz-2025:4.5.8#primary': { status: 'pending' },
  'bbk-babz-2025:4.6.1#primary': { status: 'pending' },
  'bbk-babz-2025:4.6.2#primary': { status: 'pending' },
  'bbk-babz-2025:4.6.3#primary': { status: 'pending' },
  'bbk-babz-2025:4.6.4#primary': { status: 'pending' },
  'bbk-babz-2025:4.6.5#primary': { status: 'pending' },
  'bbk-babz-2025:4.6.6#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.1#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.2#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.3#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.4#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.5#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.6#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.7#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.8#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.9#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.10#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.10#alternative': { status: 'pending' },
  'bbk-babz-2025:4.7.11#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.12#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.13#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.14#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.15#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.16#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.17#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.18#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.19#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.20#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.21#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.22#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.23#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.24#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.25#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.26#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.27#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.28#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.1#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.2#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.3#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.4#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.5#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.6#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.7#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.8#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.9#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.10#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.11#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.12#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.13#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.14#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.15#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.16#primary': { status: 'pending' },
  'bbk-babz-2025:4.9.1#primary': { status: 'pending' },
  'bbk-babz-2025:4.10.1#primary': { status: 'pending' },
  'bbk-babz-2025:4.10.2#primary': { status: 'pending' },
  'bbk-babz-2025:4.10.3#primary': { status: 'pending' },
  'bbk-babz-2025:4.10.4#primary': { status: 'pending' },
  'bbk-babz-2025:4.10.5#primary': { status: 'pending' },
  'bbk-babz-2025:4.10.6#primary': { status: 'pending' },
  'bbk-babz-2025:4.10.7#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.1.1#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.1.2#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.1.3#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.1.4#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.1.5#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.1.6#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.1.7#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.1.7#alternative': { status: 'pending' },
  'bbk-babz-2025:5.8.1.8#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.1.8#alternative': { status: 'pending' },
  'bbk-babz-2025:5.8.1.9#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.1.10#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.1.11#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.1.12#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.1.13#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.1.13#alternative': { status: 'pending' },
  'bbk-babz-2025:5.8.1.14#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.1.14#alternative': { status: 'pending' },
  'bbk-babz-2025:5.8.2.1#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.2.2#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.2.3#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.2.4#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.3.1#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.3.2#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.3.3#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.4.1#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.4.2#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.4.3#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.5.1#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.5.2#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.5.3#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.6.1#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.6.2#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.6.2#alternative': { status: 'pending' },
  'bbk-babz-2025:5.8.6.3#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.7.1#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.7.2#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.7.3#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.7.4#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.7.5#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.7.6#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.7.7#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.7.8#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.7.9#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.7.10#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.8.1#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.8.2#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.8.3#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.8.4#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.8.5#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.8.6#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.8.6#alternative': { status: 'pending' },
  'bbk-babz-2025:5.8.8.7#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.8.8#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.8.9#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.8.10#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.8.11#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.8.12#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.8.13#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.8.14#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.8.15#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.8.16#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.8.17#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.9.1#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.9.2#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.9.3#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.9.4#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.1#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.1#alternative': { status: 'pending' },
  'bbk-babz-2025:J.1.2#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.3#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.4#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.5#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.6#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.7#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.8#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.8#alternative': { status: 'pending' },
  'bbk-babz-2025:J.1.9#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.9#alternative': { status: 'pending' },
  'bbk-babz-2025:J.1.10#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.10#alternative': { status: 'pending' },
  'bbk-babz-2025:J.1.11#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.11#alternative': { status: 'pending' },
  'bbk-babz-2025:J.1.12#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.13#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.14#primary': { status: 'pending' },
  'bbk-babz-2025:J.2.1#primary': { status: 'pending' },
  'bbk-babz-2025:J.2.2#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.1#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.2#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.3#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.4#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.5#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.6#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.7#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.8#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.9#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.10#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.11#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.12#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.13#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.14#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.15#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.1#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.2#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.3#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.4#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.5#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.6#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.7#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.8#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.9#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.10#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.11#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.12#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.13#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.14#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.15#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.16#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.17#primary': { status: 'pending' },
  'bbk-babz-2025:K.1#primary': { status: 'pending' },
  'bbk-babz-2025:K.2#primary': { status: 'pending' },
  'bbk-babz-2025:K.3#primary': { status: 'pending' },
  'bbk-babz-2025:K.4#primary': { status: 'pending' },
  'bbk-babz-2025:K.5#primary': { status: 'pending' },
  'bbk-babz-2025:K.6#primary': { status: 'pending' },
  'bbk-babz-2025:K.7#primary': { status: 'pending' },
  'bbk-babz-2025:K.8#primary': { status: 'pending' },
  'bbk-babz-2025:K.9#primary': { status: 'pending' },
  'bbk-babz-2025:K.10#primary': { status: 'pending' },
  'bbk-babz-2025:K.11#primary': { status: 'pending' },
  'bbk-babz-2025:K.12#primary': { status: 'pending' },
  'bbk-babz-2025:K.13#primary': { status: 'pending' },
  'bbk-babz-2025:K.14#primary': { status: 'pending' },
  'bbk-babz-2025:K.15#primary': { status: 'pending' },
  'bbk-babz-2025:K.16#primary': { status: 'pending' },
  'bbk-babz-2025:K.17#primary': { status: 'pending' },
  'bbk-babz-2025:K.18#primary': { status: 'pending' },
  'bbk-babz-2025:L.1#primary': { status: 'pending' },
  'bbk-babz-2025:L.2#primary': { status: 'pending' },
  'bbk-babz-2025:L.3#primary': { status: 'pending' },
  'bbk-babz-2025:L.4#primary': { status: 'pending' },
  'bbk-babz-2025:L.5#primary': { status: 'pending' },
  'bbk-babz-2025:L.6#primary': { status: 'pending' },
  'bbk-babz-2025:L.7#primary': { status: 'pending' },
  'bbk-babz-2025:L.8#primary': { status: 'pending' },
  'bbk-babz-2025:L.9#primary': { status: 'pending' },
  'bbk-babz-2025:L.10#primary': { status: 'pending' },
  'bbk-babz-2025:M.1#primary': { status: 'pending' },
  'bbk-babz-2025:M.2#primary': { status: 'pending' },
  'bbk-babz-2025:M.3#primary': { status: 'pending' },
  'bbk-babz-2025:M.4#primary': { status: 'pending' },
  'bbk-babz-2025:M.5#primary': { status: 'pending' },
  'bbk-babz-2025:M.6#primary': { status: 'pending' },
  'bbk-babz-2025:M.7#primary': { status: 'pending' },
  'bbk-babz-2025:M.8#primary': { status: 'pending' },
  'bbk-babz-2025:M.9#primary': { status: 'pending' },
  'bbk-babz-2025:M.10#primary': { status: 'pending' },
  'bbk-babz-2025:M.11#primary': { status: 'pending' },
  'bbk-babz-2025:M.12#primary': { status: 'pending' },
  'bbk-babz-2025:M.13#primary': { status: 'pending' },
  'bbk-babz-2025:M.14#primary': { status: 'pending' },
} satisfies Record<string, Review>);

export type ManifestDomainReviewKey = keyof typeof MANIFEST_DOMAIN_REVIEWS;

/** Wirft bei einer nicht inventarisierten Manifestzeile statt still ein Sammelreview zu nutzen. */
export function manifestDomainReviewFor(key: string): DeepReadonly<Review> {
  if (!Object.prototype.hasOwnProperty.call(MANIFEST_DOMAIN_REVIEWS, key)) {
    throw new Error(`Kein Fachreview-Ledger-Eintrag für "${key}".`);
  }
  return MANIFEST_DOMAIN_REVIEWS[key as ManifestDomainReviewKey];
}

/** Eigene fachliche Reviewentscheidung je Quelle; technische Reviews bleiben separat. */
export const SOURCE_DOMAIN_REVIEWS = deepFreeze({
  'bbk-babz-2025': { status: 'pending' },
  'babz-svg-2025': { status: 'pending' },
  'babz-hinweise-2024': { status: 'pending' },
  'skk-2010': { status: 'pending' },
  'fwdv-100': { status: 'pending' },
  'fwdv-800': { status: 'pending' },
  'thw-einheiten': { status: 'pending' },
  'phjardas-tz': { status: 'pending' },
  'din-14033': { status: 'pending' },
  'din-13050': { status: 'pending' },
  'din-14034-6': { status: 'pending' },
  'din-14095': { status: 'pending' },
  'arimo-ofl': { status: 'pending' },
} satisfies Record<SourceId, Review>);

export function sourceDomainReviewFor(id: SourceId): DeepReadonly<Review> {
  return SOURCE_DOMAIN_REVIEWS[id];
}

/** Auch Profile besitzen einen expliziten Ledgerplatz; heute existiert nur der Bundeskern. */
export const PROFILE_DOMAIN_REVIEWS = deepFreeze({
  bund: { status: 'pending' },
} satisfies Record<ProfileId, Review>);

export function profileDomainReviewFor(id: ProfileId): DeepReadonly<Review> {
  return PROFILE_DOMAIN_REVIEWS[id];
}
