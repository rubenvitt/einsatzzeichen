import type { FreestandingSpec, SymbolSpec, SourceReference } from '@einsatzzeichen/schema';
import type { CompositionError, ValidationIssue } from '../validate.js';
import {
  ruleCatalogEntry,
  type RuleDimension,
  type RuleKind,
  type RulePhase,
} from './rule-catalog.js';

/**
 * Klartext zu jeder Regel, die `validateSpec()` melden oder die Komposition werfen kann — die
 * erklärbare Ablehnung als API (LFH-579).
 *
 * Bis LFH-579 stand diese Tabelle in `packages/website/src/lib/rule-explanations.ts`. Die
 * Leitplanke aus LFH-561 hat sie hierher geholt: „Die Regeltexte gehören zur API, nicht zur
 * Website; der Baukasten wird ein Konsument." Eine UI, ein Skript oder ein QGIS-Plugin, das eine
 * Ablehnung zeigen will, braucht dieselben Sätze wie der Baukasten, und bekäme sie sonst nur,
 * indem es die Website kopiert. Die Einträge sind zeichengleich übernommen (Titel, Feld und
 * Erklärung aller 78 Regeln; beim Umzug per `diff` gegen die Website-Fassung geprüft).
 *
 * **Warum eine eigene Datei und keine Felder am Regelkatalog.** Der Katalog (`rule-catalog.ts`)
 * ordnet ein — Art, Dimension, Phase, Begründung in einem Satz, Quelle — und ist über die
 * Positionsfunktion `entry()` gebaut. Titel, Erklärung und das kuratierte Spec-Feld sind
 * Leserinnentext: mehrere Sätze je Regel, mit Handlungsanweisung am Ende. Beides in einen Eintrag
 * zu legen, hieße jeden der 78 Einträge umzubauen und Einordnung und Wortlaut zu vermischen, die
 * verschieden oft geändert werden. Zusammengeführt wird erst in `explainIssue()`; die Tests
 * halten beide Seiten in Deckung — jede Kennung aus `VALIDATION_RULE_IDS` und
 * `COMPOSITION_RULE_CATALOG` hat eine Erklärung, und keine Erklärung steht ohne Katalogeintrag da.
 *
 * Quellenangaben im Text stehen nur dort, wo `validate.ts` oder `layout/profiles.ts` selbst eine
 * nennen (Anhangsabschnitt, Datei, Messung). Wo der Code keine Quelle führt, führt die Erklärung
 * auch keine — eine erfundene Fundstelle wäre schlimmer als keine.
 *
 * **Bewusst ohne `as const`.** Die Tabellen sind als `Record<string, RuleExplanation>` getypt,
 * nicht als Literaltyp. Ein Literaltyp schriebe jeden Satz ein zweites Mal in die veröffentlichte
 * `.d.ts` und verdoppelte die Bytes, die diese Texte im Paket kosten.
 */

/**
 * Die Felder der freistehenden Spec-Art (LFH-577), über alle vier Arten. `kind` und `strength`
 * teilt sie mit `SymbolSpec`.
 */
type FreestandingField = FreestandingSpec extends infer S ? (S extends unknown ? keyof S : never) : never;

/**
 * Das Feld einer `SymbolSpec` oder einer freistehenden Spec, um das eine Regel geht — oder
 * `'composition'`, wenn sie über mehrere Achsen zugleich geht und kein einzelnes Feld benennt.
 */
export type RuleField = keyof SymbolSpec | FreestandingField | 'composition';

/**
 * Genau die Werte, die `RuleField` in den Tabellen annimmt, als Liste zur Laufzeit. Der Test
 * prüft jeden Eintrag der beiden Tabellen dagegen; ein Tippfehler im Feldnamen fiele sonst erst
 * in einer Oberfläche auf, als leere Spalte.
 */
export const RULE_FIELDS: readonly RuleField[] = Object.freeze([
  'kind',
  'functionRole',
  'bodyVariant',
  'organization',
  'technicalFill',
  'strength',
  'technicalHeadMark',
  'administrativeLevel',
  'unitGrouping',
  'vehicleCategory',
  'states',
  'tendency',
  'capabilities',
  'bodyMarks',
  'designation',
  'labels',
  // Die übrigen Felder der freistehenden Spec-Art (LFH-577).
  'movement',
  'line',
  'path',
  'canvasMm',
  'variant',
  'values',
  'intensity',
  'state',
  'composition',
] as const satisfies readonly RuleField[]);

export interface RuleExplanation {
  /**
   * Das Feld, an dem diese Regel hängt — kuratiert, nicht aus der Kennung geraten.
   *
   * **Warum kuratiert.** Der erste Versuch hat die Zuordnung aus dem Präfix der Kennung abgeleitet
   * (`functionRole` → `function-role-…`). Das war deterministisch, aber grob falsch: von 72 Regeln
   * fanden so nur 17 ein Feld, und `labels` — in 137 der 256 Zeichen gesetzt — stand mit „keine
   * Regelfamilie unter diesem Namen“ da, obwohl `label-not-blank`, `center-label-within-body`,
   * `top-left-label-requires-measured-body` und vierzig weitere genau dieses Feld prüfen. Ihre
   * Kennungen sind nach der **Zone** benannt, nicht nach dem Feld.
   *
   * **Wie zugeordnet wird.** Genommen wird das Feld, das die Leserin ändern müsste, damit die Regel
   * nicht mehr greift — also das, worauf der letzte Satz der Erklärung zeigt. Wo eine Regel zwei
   * Felder gegeneinander stellt, entscheidet der Name der Kennung: `chassis-foot-conflict` steht
   * unter `vehicleCategory`, `surface-label-foot-conflict` unter `labels`. `'composition'` bleibt
   * den Regeln vorbehalten, deren Auflösung überhaupt kein einzelnes Feld benennt — bislang genau
   * `head-zone-conflict` („lass alle bis auf eine Angabe weg“).
   *
   * Das Feld kommt aus dieser Tabelle, nicht aus `ValidationIssue`: die Meldung nennt die Regel
   * und die konkreten Werte, die Zuordnung zum Feld ist eine Eigenschaft der Regel.
   */
  readonly field: RuleField;
  readonly title: string;
  readonly explanation: string;
}

/** Friert Tabelle und Einträge ein; die Tabellen sind öffentliche, geteilte Daten. */
function freezeTable(
  table: Record<string, RuleExplanation>,
): Readonly<Record<string, RuleExplanation>> {
  for (const value of Object.values(table)) Object.freeze(value);
  return Object.freeze(table);
}

/**
 * Erklärung je Regel aus `validateSpec()`. Bewusst über `string` indiziert:
 * `VALIDATION_RULE_IDS` ist eine `readonly string[]`, und die Vollständigkeit gegen diese Liste
 * ist eine Laufzeiteigenschaft, die der Test prüft — kein Typ, den ein zweiter Literaltyp doppelt
 * behaupten müsste.
 */
export const RULE_EXPLANATIONS: Readonly<Record<string, RuleExplanation>> = freezeTable({
  'above-left-label-head-conflict': {
    field: 'labels',
    title: 'Lauf oberhalb links und Kopfzone schließen sich aus',
    explanation:
      'Ein Lauf in `labels.aboveLeft` steht über dem Körper, genau in dem Streifen, den die ' +
      'Kopfzone belegt: Stärke, technische Kopfmarke, Verband oder Verwaltungsstufe, oder den der ' +
      'Giebel einer ortsgebundenen Variante (`raised-gable`) einnimmt. Eine Zone ' +
      'trägt einen Baustein, und über der Kopfzone endet die 32-mm-Grundfläche, eine Ausweichlage ' +
      'gibt es nicht. Entferne `labels.aboveLeft`, die Angabe in der Kopfzone oder den Giebel, oder setze den ' +
      'Lauf in eine Zone im Körper wie `labels.topLeft`.',
  },
  'above-left-metrics-complete': {
    field: 'labels',
    title: 'aboveLeft-Metriken nur vollständig',
    explanation:
      'Wer `labels.aboveLeftMetrics` setzt, muss den Lauf `labels.aboveLeft` und alle drei Maße ' +
      'zusammen angeben: Versalhöhe, Grundlinie und Anker, jeweils endlich und die Versalhöhe ' +
      'größer als null. Ein halber Satz mischte unbelegte Profilwerte in eine gemessene Lage. ' +
      'Ergänze die fehlenden Felder oder lass den Metriksatz ganz weg.',
  },
  'above-left-metrics-within-viewbox': {
    field: 'labels',
    title: 'aboveLeft-Lauf muss in der ViewBox bleiben',
    explanation:
      'Aus Anker, Grundlinie und Versalhöhe berechnet die Komposition eine Textbox. Ihr Anker ' +
      'muss innerhalb der Profilbox der Körperhülle liegen, die Box selbst vollständig innerhalb ' +
      'der 32-mm-ViewBox. Sonst stünde Text außerhalb der Zeichenfläche und wäre im Bild ' +
      'abgeschnitten. Rücke Anker oder Grundlinie nach innen oder verkleinere die Versalhöhe.',
  },
  'below-body-zone-conflict': {
    field: 'labels',
    title: 'Fahrwerk und Läufe unter dem Körper schließen sich aus',
    explanation:
      'Unter dem Körper liegt ein Streifen, den das Fahrwerk (eine Fahrzeugkategorie oder das ' +
      'Radpaar der Variante `plain-wheel-pair`), die Bezeichnung, der Lauf `labels.belowRight` ' +
      'und die schwarzen Oberflächenläufe `labels.surfaceBelowLeft` und ' +
      '`labels.surfaceBelowRight` belegen. Je Seite trägt er einen davon: das Fahrwerk mit Rädern ' +
      'links und rechts schließt beide Läufe aus, und `belowRight` teilt seine Stelle mit ' +
      '`surfaceBelowRight` und mit der mittigen Bezeichnung. Unter dem Streifen endet die ' +
      '32-mm-Grundfläche. Entferne einen der Bausteine oder setze den Lauf in eine Zone im Körper.',
  },
  'body-mark-rendition-not-measured': {
    field: 'bodyMarks',
    title: 'Fassung der Körpermarke nicht vermessen',
    explanation:
      'Manche Körpermarken zeichnet die Referenz am selben Fahrzeug in mehr als einer Fassung, ' +
      'etwa weiter rechts oder größer. Eine solche Fassung gibt es nur für die Marke, an der sie ' +
      'abgelesen ist, und nur für eine Marke, die das Zeichen auch trägt; an einer anderen ' +
      'Körperform wird sie übertragen. Sonst würde etwas anderes gezeichnet als verlangt. Nimm ' +
      'die Marke in `bodyMarks` auf, wähle eine der genannten Fassungen oder entferne den Eintrag ' +
      'aus `bodyMarkRenditions`.',
  },
  'body-variant-foot-conflict': {
    field: 'bodyVariant',
    title: 'Körpervariante und Bezeichnung im selben Streifen',
    explanation:
      'Bei plain-wheel-pair am Landfahrzeug und bei raised-hull oder fixed-wing-hull am ' +
      'Luftfahrzeug belegt die sichtbare Zusatzgeometrie der Variante bereits den Streifen ' +
      'unterhalb des Körpers. Eine Bezeichnung in der Fußzone würde sie überlagern oder die ' +
      'viewBox verlassen. Entferne `designation` oder beschrifte im Körper, etwa über ' +
      '`labels.center`.',
  },
  'body-variant-requires-measured-kind': {
    field: 'bodyVariant',
    title: 'Körpervariante nur an der Art, deren Form sie benennt',
    explanation:
      'Manche Körpervarianten benennen die Form einer bestimmten Art: raised-hull einen Rumpf ' +
      '(Luft- und Wasserfahrzeug), inset-hull den Wasserrumpf, fixed-wing-hull den Flügelrumpf, ' +
      'die kompakten Rauten die Person, raised-circle-1mm einen Kreiskörper. An einer anderen ' +
      'Art gibt es diese Form nicht. Übertragbare Varianten — Fußband, Giebel, Radpaar, ' +
      'Kettenrumpf — zeichnet der Katalog an jeder passenden Art, wo nötig abgeleitet. Wähle die ' +
      'Art, deren Form die Variante benennt, oder lass `bodyVariant` weg.',
  },
  'bottom-right-metrics-complete': {
    field: 'labels',
    title: 'bottomRight-Metriken nur vollständig',
    explanation:
      'Ein gemessener bottomRight-Satz muss alle fünf Felder gemeinsam führen: Versalhöhe, ' +
      'Grundlinie, Anker, Boxanfang und Boxbreite. Fehlt eines, mischte die Komposition ' +
      'unbelegte Werte in eine gemessene Lage. Ergänze die fehlenden Felder oder entferne ' +
      '`labels.bottomRightMetrics`.',
  },
  'bottom-right-metrics-require-bottom-right-label': {
    field: 'labels',
    title: 'bottomRight-Metriken brauchen ihren Lauf',
    explanation:
      'Metriken ohne den zugehörigen Text hätten keine Wirkung — Versalhöhe, Grundlinie, Anker ' +
      'und Box würden still verschluckt. Deshalb verlangt `labels.bottomRightMetrics` einen ' +
      'nichtleeren `labels.bottomRight`. Setze den Lauf oder entferne den Metriksatz.',
  },
  'bottom-right-metrics-within-body': {
    field: 'labels',
    title: 'bottomRight-Textbox muss im Körper liegen',
    explanation:
      'Die vollständige Textbox aus Boxanfang, Boxbreite und den abgeleiteten vertikalen ' +
      'Schriftmetriken muss innerhalb der Körperhülle liegen, und der Anker innerhalb der Box. ' +
      'Sonst stünde der Lauf teilweise außerhalb des Körpers. Verschiebe Box oder Anker nach ' +
      'innen oder verkleinere Breite und Versalhöhe.',
  },
  'center-anchor-override-requires-measured-trailer': {
    field: 'labels',
    title: 'Abweichender mittiger Anker braucht Lauf und Platz in der Hülle',
    explanation:
      'Ein eigener x-Anker des mittigen Laufs ist am Anhänger (I.2.5) und am Landfahrzeug ' +
      '(C.2.25) vermessen; an anderen Körperformen und mit anderen Werten wird er übertragen und ' +
      'als abgeleitet gezeichnet. Er braucht einen `labels.center`, einen endlichen Wert und muss ' +
      'zwischen der linken und der rechten Kante der Körperhülle liegen. Setze einen solchen Wert ' +
      'oder entferne `labels.centerAnchorFromBodyLeftMm`.',
  },
  'center-baseline-positive': {
    field: 'labels',
    title: 'Mittige Grundlinie muss positiv sein',
    explanation:
      'Der Abstand der mittigen Grundlinie von der Körperunterkante muss eine endliche Zahl ' +
      'größer als null sein. Null, negative Werte, NaN oder Infinity ergäben keine Lage im ' +
      'Körper. Korrigiere `labels.centerBaselineFromBodyBottomMm` oder lass das Feld weg.',
  },
  'center-baseline-requires-center-label': {
    field: 'labels',
    title: 'Mittige Grundlinie braucht ihren Lauf',
    explanation:
      'Eine gemessene mittige Grundlinie ohne mittigen Lauf hätte keine Wirkung und würde still ' +
      'verschluckt. Deshalb verlangt `labels.centerBaselineFromBodyBottomMm` ein gesetztes ' +
      '`labels.center`. Setze den Lauf oder entferne die Grundlinie.',
  },
  'center-box-margin-non-negative': {
    field: 'labels',
    title: 'Rand der mittigen Textbox darf nicht negativ sein',
    explanation:
      'Der Rand der mittigen Textbox muss endlich und mindestens null sein. Negative Werte oder ' +
      'NaN ergäben keine Box, in der Text stehen könnte. Korrigiere `labels.centerBoxMarginMm` ' +
      'oder entferne das Feld.',
  },
  'center-box-margin-requires-center-label': {
    field: 'labels',
    title: 'Boxrand braucht einen mittigen Lauf',
    explanation:
      'Ein Rand ohne mittigen Lauf hat keine Wirkung und würde still verschluckt. ' +
      '`labels.centerBoxMarginMm` verlangt deshalb ein gesetztes `labels.center`. Setze den ' +
      'Lauf oder entferne den Rand.',
  },
  'center-box-margin-within-body': {
    field: 'labels',
    title: 'Boxrand muss Breite übrig lassen',
    explanation:
      'Der Rand wird links und rechts abgezogen; die doppelte Angabe muss kleiner bleiben als ' +
      'die Breite der Körperhülle, damit eine positive Boxbreite übrig bleibt. Sonst entstünde ' +
      'eine Box ohne Fläche, in der kein Text stünde. Verkleinere `labels.centerBoxMarginMm`.',
  },
  'center-cap-height-positive': {
    field: 'labels',
    title: 'Mittige Versalhöhe muss positiv sein',
    explanation:
      'Die Versalhöhe des mittigen Laufs muss endlich und größer als null sein; sie ist eine ' +
      'Messung an der Referenzdatei und keine freie Größe. Null oder negative Werte ergäben ' +
      'keinen sichtbaren Text. Korrigiere `labels.centerCapHeightMm` oder lass das Feld weg.',
  },
  'center-cap-height-requires-center-label': {
    field: 'labels',
    title: 'Mittige Versalhöhe braucht ihren Lauf',
    explanation:
      'Eine Versalhöhe ohne mittigen Lauf hätte keine Wirkung und würde still verschluckt — ' +
      'genau der lautlose Ausfall, den die Regeln an anderer Stelle abfangen. Setze ' +
      '`labels.center` oder entferne `labels.centerCapHeightMm`.',
  },
  'center-label-within-body': {
    field: 'labels',
    title: 'Mittige Textbox muss im Körper liegen',
    explanation:
      'Bei einer eigenen mittigen Grundlinie prüft die Regel die daraus und aus der Versalhöhe ' +
      'abgeleitete Textbox gegen die Körperhülle, vermessen oder aus dem Körperprimitiv. Sie muss ' +
      'vollständig darin liegen, sonst ragte der Lauf über den Körper hinaus. Rücke die ' +
      'Grundlinie näher an die Unterkante oder verkleinere die Versalhöhe.',
  },
  'chassis-foot-conflict': {
    field: 'vehicleCategory',
    title: 'Fahrwerkszone und Fußzone schließen sich aus',
    explanation:
      'Fahrzeugkategorie und Bezeichnung belegen beide den Streifen unterhalb des Körpers: das ' +
      'Fahrwerk reicht bis 4,75 mm unter die Körperunterkante, die Fußzone beginnt 1 mm ' +
      'darunter, die Überschneidung beträgt 3,75 mm bei 4 mm Zonenhöhe. Wohin die Fußzone ' +
      'auswiche, ist nicht belegt; Anhang E.2 beschriftet seine Fahrzeuge stattdessen im Körper. ' +
      'Nutze `labels.center` oder `labels.topLeft` statt `designation`, oder lass ' +
      '`vehicleCategory` weg.',
  },
  'circle-top-left-anchor-within-viewbox': {
    field: 'labels',
    title: 'Kreislabel-Anker muss in der ViewBox bleiben',
    explanation:
      'Der Anker des topLeft-Laufs am 12-mm-Kreis wird relativ zur Kreisfläche angegeben und ' +
      'darf außerhalb davon beginnen; seine absolute Lage muss aber innerhalb der 32-mm-ViewBox ' +
      'bleiben und darf die rechte Kante der deklarierten Textbox bei 26 mm nicht ' +
      'überschreiten. Sonst liefe der Text aus der Zeichenfläche. Verkleinere ' +
      '`anchorFromBodyLeftMm` in `labels.topLeftMetrics`.',
  },
  'circle-top-left-baseline-within-viewbox': {
    field: 'labels',
    title: 'Kreislabel-Grundlinie muss in der ViewBox bleiben',
    explanation:
      'Auch die Grundlinie darf außerhalb der Kreisfläche liegen, die daraus und aus der ' +
      'Versalhöhe berechnete Textbox muss aber vollständig innerhalb der 32-mm-ViewBox bleiben. ' +
      'Ein Lauf über der Oberkante wäre im Bild abgeschnitten. Verschiebe ' +
      '`baselineFromBodyTopMm` nach unten oder verkleinere die Versalhöhe.',
  },
  'designation-not-blank': {
    field: 'designation',
    title: 'Bezeichnung darf nicht leer sein',
    explanation:
      'Eine Bezeichnung darf nicht leer sein und nicht nur aus Leerzeichen bestehen. Ein leerer ' +
      'Lauf erzeugte ein Textprimitiv ohne Tinte, das jedes Gate besteht und im Bild fehlt. ' +
      'Setze einen Text oder lass `designation` ganz weg.',
  },
  'function-role-head-mismatch': {
    field: 'functionRole',
    title: 'Kopfzone widerspricht der Funktion',
    explanation:
      'Manche Funktionen nennen ihre Kopfzone im Titel: Zug- und Gruppenführer ihre Stärke, ' +
      'die Führungsgruppe ihre Gruppe, der Kreisbrandmeister und der Leiter der ' +
      'Kreisleitstelle ihren Kreis, der Leiter einer internationalen Hilfsaktion seine ' +
      'überstaatliche Ebene. Eine andere oder fehlende Angabe widerspräche dem Namen. Die ' +
      'übrigen Leitungsrollen sind kopffrei und werden mit jeder Kopfangabe abgeleitet ' +
      'gezeichnet. Setze `strength` beziehungsweise `administrativeLevel` auf den Wert der ' +
      'Funktion.',
  },
  'function-role-label-metrics-required': {
    field: 'functionRole',
    title: 'Funktionsläufe brauchen vollständige Metriken',
    explanation:
      'Jeder Textlauf einer Funktionsfassung braucht vollständige sichtbare Metriken — Inhalt, ' +
      'Anker, Grundlinie, Schriftgröße, eine Box innerhalb der ViewBox, Tinte und ' +
      'Mindestrendergröße — und die Boxen dürfen sich nicht überlagern. Unvollständige oder ' +
      'überlappende Läufe ergäben unsichtbaren oder ineinanderlaufenden Text. Diese Werte ' +
      'stehen in der Funktionsdefinition; korrigiert wird sie, nicht die Spec.',
  },
  'function-role-organization-mismatch': {
    field: 'functionRole',
    title: 'Organisation widerspricht der Funktion',
    explanation:
      'Manche Funktionen nennen ihre Organisation im Titel: der Zugführer der Feuerwehr, der ' +
      'Kreisbrandmeister, der Zugführer des Technischen Zugs, die Sanitäts- und ' +
      'Betreuungszugführer der Hilfsorganisationen. Für sie muss `organization` diesen Wert ' +
      'tragen. Die Rollen der Führung und Leitung (Einsatzleiter, EAL, TEL, LNA …) stehen ' +
      'dagegen in jeder Organisationsfarbe oder ohne Organisation. Setze die Organisation der ' +
      'Funktion oder wähle eine Leitungsrolle.',
  },
  'function-role-requires-measured-kind': {
    field: 'functionRole',
    title: 'Funktion nur an vermessener Art',
    explanation:
      'Eine gemessene Funktion ist nur an Formation und Person belegt, und jede einzelne ' +
      'Fassung gilt zusätzlich nur für die Art, für die sie vermessen wurde. Die Regel greift ' +
      'bei jeder anderen Art und ebenso, wenn Fassung und `kind` nicht zusammenpassen. Setze ' +
      '`kind` auf die Art der Fassung oder entferne `functionRole`.',
  },
  'function-role-requires-measured-layout': {
    field: 'functionRole',
    title: 'Funktion braucht ihre aufgelöste Layoutdefinition',
    explanation:
      'Die Funktion verlangt ihre exakt aufgelöste Definition: dieselbe ID wie in ' +
      '`functionRole` und einen vollständigen, textfreien Geometrieplan aus Körperrechteck, ' +
      'Körperzusätzen, Dekorationen und höchstens zwei Textläufen. Fehlt die Definition oder ' +
      'ist der Plan unvollständig, gäbe es keine vermessene Zeichnung. Übergib die passende ' +
      'Definition im Validierungskontext oder entferne `functionRole`.',
  },
  'head-zone-conflict': {
    field: 'composition',
    title: 'Mehrere Angaben in der Kopfzone',
    explanation:
      'Stärke, Verwaltungsstufe, technische Kopfmarke und Verband belegen dieselbe Kopfzone; ' +
      'höchstens eine davon darf gesetzt sein. Auch eine technische Kopfmarke oder ein Verband ' +
      'zusammen mit einer Funktionsfassung ist ausgeschlossen, weil die Fassung ihre Kopfzone ' +
      'selbst bindet. Lass alle bis auf eine Angabe weg.',
  },
  'in-body-ink-requires-in-body-label': {
    field: 'labels',
    title: 'Tintenoverride braucht einen Lauf im Körper',
    explanation:
      'Ein gemessener Tintenoverride wirkt nur auf Läufe im Körper: center, topLeft, ' +
      'bottomLeft, bottomCenter, bottomRight und die Zeilen aus topLeftLines. Läufe oberhalb ' +
      'des Körpers oder auf der Ausgabeoberfläche haben eigene Tintenverträge und werden nicht ' +
      'erfasst. Setze einen nichtleeren Lauf im Körper oder entferne `labels.inBodyInk`.',
  },
  'inset-hull-requires-center-label-only': {
    field: 'bodyVariant',
    title: 'Beschriftung der eingesenkten Hülle nur als einfache Daten',
    explanation:
      'An der eingesenkten Wasserfahrzeughülle ist allein der mittige Lauf vermessen; die übrigen ' +
      'Zonen und die Bezeichnung werden vom angehobenen Wasserrumpf übertragen und als abgeleitet ' +
      'gezeichnet. Das Labelobjekt wird dafür als Datenschnappschuss geprüft: unbekannte Felder ' +
      'und geerbte, nicht aufzählbare oder über Accessoren gelieferte Werte werden abgelehnt, ' +
      'damit die geprüfte Datenansicht dieselbe bleibt, die gezeichnet wird. Gib `labels` als ' +
      'einfaches Objekt mit eigenen Feldern der bekannten Zonen an.',
  },
  'label-not-blank': {
    field: 'labels',
    title: 'Beschriftungszone darf nicht leer sein',
    explanation:
      'Keine Beschriftungszone darf leer sein oder nur aus Leerzeichen bestehen; bei ' +
      'mehrzeiligen Zonen gilt das auch für jede einzelne Zeile. Ein leerer Lauf erzeugte ein ' +
      'Textprimitiv ohne Tinte, das jedes Gate besteht und im Bild fehlt. Setze einen Text oder ' +
      'entferne die Zone.',
  },
  'plain-wheel-pair-chassis-conflict': {
    field: 'bodyVariant',
    title: 'plain-wheel-pair trägt schon ein Fahrwerk',
    explanation:
      'Die Variante plain-wheel-pair zeichnet bereits zwei vermessene Radringe. Eine ' +
      'Fahrzeugkategorie legte darüber eine zweite, nicht belegte Fahrwerksgeometrie. Entferne ' +
      '`vehicleCategory` oder wähle die Normalfassung des Landfahrzeugs.',
  },
  'state-carrier-not-allowed': {
    field: 'states',
    title: 'Zustand passt nicht zu diesem Grundzeichen',
    explanation:
      'Ein Personenzustand wie „verletzt" oder „vermisst" sagt etwas über einen Menschen und ' +
      'gehört deshalb an das Grundzeichen Person. Alle anderen Zustände dürfen an jedem ' +
      'Grundzeichen stehen. Wechsle das Grundzeichen oder nimm den Zustand wieder heraus.',
  },
  'state-group-limit-exceeded': {
    field: 'states',
    title: 'Zwei Werte derselben Skala',
    explanation:
      'Ein Zeichen trägt höchstens einen Personenzustand und je einen Wert für Aktivität, ' +
      'Schadensgrad und Brandphase. Zwei Stufen derselben Skala ' +
      'widersprechen sich, etwa „beschädigt" und „zerstört". Behalte je Skala nur einen ' +
      'Zustand.',
  },
  'state-tactics-not-allowed': {
    field: 'states',
    title: 'Einsatztaktik steht nicht an einem Zeichen',
    explanation:
      'Retten, Angriff, Verteidigung und Rückzug (5.8.1.1 bis 5.8.1.4) sind eigene Zeichen und ' +
      'werden nicht an ein anderes Zeichen gehängt. Keine Vorlage zeigt sie an einem Träger, und ' +
      'so ist es für dieses Projekt am 29. September 2026 entschieden. Nimm die Taktik aus der ' +
      'Zustandsliste wieder heraus.',
  },
  'state-value-not-attachable': {
    field: 'states',
    title: 'Dieser Zustand gehört nicht in die Zustandsliste',
    explanation:
      'Wetter und der Zustand eines Tieres sind eigenständige Zeichen und stehen nicht an einem ' +
      'anderen Zeichen; sie werden als freistehendes Zeichen gezeichnet. Eine Tendenz (steigend, ' +
      'unverändert, fallend) gehört nicht in die Zustandsliste; zeichnen lässt sie sich bisher ' +
      'noch nicht. Entferne den Wert aus den Zuständen.',
  },
  'strength-requires-unit': {
    field: 'strength',
    title: 'Stärke nur an taktischen Einheiten',
    explanation:
      'Eine Stärkeangabe ist nur an taktischen Einheiten zulässig, also an Formation und ' +
      'Person. Fahrzeuge, Kreise und die übrigen Körperformen tragen in der Referenz keine ' +
      'Stärke. Entferne `strength` oder wechsle auf eine der beiden Einheitenarten.',
  },
  'surface-label-foot-conflict': {
    field: 'labels',
    title: 'Oberflächenlauf und Bezeichnung im selben Streifen',
    explanation:
      'Bezeichnung und schwarze Oberflächenläufe belegen denselben Streifen unterhalb des ' +
      'Körpers. Eine vermessene Ausweichposition gibt es nicht, also schließen sie sich aus. ' +
      'Entferne `designation` oder die Läufe `labels.surfaceBelowLeft` und ' +
      '`labels.surfaceBelowRight`.',
  },
  'technical-fill-organization-conflict': {
    field: 'technicalFill',
    title: 'Technische Füllung und Organisation schließen sich aus',
    explanation:
      'Die Körperfläche bekommt ihre Farbe entweder aus der Organisation oder aus dem ' +
      'technischen Token, nicht aus beidem. Nur die Organisation trägt dabei eine ' +
      'nicht-farbliche Kontursignatur. Setze `technicalFill` oder `organization`, nicht beides.',
  },
  'technical-fill-token-invalid': {
    field: 'technicalFill',
    title: 'Technische Füllung braucht einen bekannten Farbtoken',
    explanation:
      'Eine technische Körperfüllung muss einen Token der Palette nennen. Freie Farbwerte gibt ' +
      'es nicht; sie umgingen die geprüften Kontrastverträge. Setze `technicalFill` auf einen ' +
      'Token aus `PALETTE`.',
  },
  'technical-head-mark-not-measured': {
    field: 'technicalHeadMark',
    title: 'Technische Kopfmarke nicht vermessen',
    explanation:
      'Als technische Kopfmarken sind bisher nur `single-vertical-bar` und ' +
      '`double-vertical-bar` vermessen. Jeder andere Wert hätte keine belegte Geometrie. Setze ' +
      'einen dieser Werte oder entferne `technicalHeadMark`.',
  },
  'top-left-anchor-within-body': {
    field: 'labels',
    title: 'topLeft-Anker muss im Landfahrzeugkörper liegen',
    explanation:
      'Am Landfahrzeug muss der Anker des topLeft-Laufs endlich sein und zwischen 0 und 28 mm ' +
      'rechts der linken Körperkante liegen; das ist die vermessene Breite der Box. Größere ' +
      'Werte schöben den Text über die rechte Innenmarge hinaus. Korrigiere ' +
      '`anchorFromBodyLeftMm` in `labels.topLeftMetrics`.',
  },
  'top-left-baseline-within-body': {
    field: 'labels',
    title: 'topLeft-Grundlinie muss im Körper liegen',
    explanation:
      'Am Landfahrzeug muss die topLeft-Grundlinie mindestens eine Versalhöhe unter der ' +
      'Körperoberkante und höchstens 20,25 mm darunter liegen, also innerhalb der vermessenen ' +
      'Hülle. Andernfalls ragte der Text oben oder unten aus dem Körper. Korrigiere ' +
      '`baselineFromBodyTopMm` oder die Versalhöhe.',
  },
  'top-left-cap-height-positive': {
    field: 'labels',
    title: 'topLeft-Versalhöhe muss positiv sein',
    explanation:
      'Die Versalhöhe des topLeft-Laufs muss endlich und größer als null sein. Null oder ' +
      'negative Werte ergäben keinen sichtbaren Text. Korrigiere `capHeightMm` in ' +
      '`labels.topLeftMetrics`.',
  },
  'top-left-lines-exactly-two': {
    field: 'labels',
    title: 'Zweizeilige Zone braucht genau zwei Zeilen',
    explanation:
      'Die zweizeilige obere Beschriftungszone ist genau zweizeilig vermessen. Eine, drei oder ' +
      'mehr Zeilen hätten keine belegten Grundlinien. Gib in `labels.topLeftLines` genau zwei ' +
      'Zeilen an.',
  },
  'top-left-metrics-complete': {
    field: 'labels',
    title: 'topLeft-Metriken nur vollständig',
    explanation:
      'Ein gemessener topLeft-Satz muss Versalhöhe, Grundlinie und Anker gemeinsam führen. Ein ' +
      'partielles Objekt mischte unbelegte Profilwerte in eine gemessene Lage. Ergänze die ' +
      'fehlenden Felder oder entferne `labels.topLeftMetrics` ganz.',
  },
  'top-left-metrics-require-top-left-label': {
    field: 'labels',
    title: 'topLeft-Metriken brauchen ihren Lauf',
    explanation:
      'Metriken der oberen linken Zone ohne nichtleeren `labels.topLeft` hätten keine Wirkung; ' +
      'alle drei Maße würden still verschluckt. Setze den Lauf oder entferne ' +
      '`labels.topLeftMetrics`.',
  },
  'top-left-metrics-within-body': {
    field: 'labels',
    title: 'topLeft-Lauf muss in der Körperhülle liegen',
    explanation:
      'An jeder Körperform außer dem F.2-Landfahrzeug und den F.3-Kreisfassungen müssen der ' +
      'Anker und die aus Grundlinie und Versalhöhe abgeleitete vertikale Textbox innerhalb der ' +
      'Körperhülle liegen, mit 2 mm Innenmarge an der rechten Kante. Sonst stünde der Lauf über ' +
      'dem Körper. Rücke Anker oder Grundlinie nach innen oder verkleinere die Versalhöhe.',
  },
  'vehicle-category-requires-vehicle': {
    field: 'vehicleCategory',
    title: 'Fahrzeugkategorie nur an Fahrzeugen',
    explanation:
      'Eine Fahrzeugkategorie beschreibt das Fahrwerk eines Fahrzeugs (Kapitel 5.1) und steht ' +
      'deshalb nur an Land-, Wasser- und Luftfahrzeug, Anhänger und Wechsellader. An einer ' +
      'Einheit, einer Stelle oder einem Gebäude hat sie keine Bedeutung. Vermessen ist die ' +
      'Fahrwerkszone an Landfahrzeug, Anhänger und Wechsellader; an Wasser- und Luftfahrzeug ' +
      'überträgt der Motor sie und markiert sie als abgeleitet. Entferne `vehicleCategory` oder ' +
      'wechsle auf ein Fahrzeug.',
  },
});

/* --- Zweite Tabelle: Regeln, die erst beim Komponieren entstehen ------------------------- */

/**
 * Erklärung je Regel aus `assertTextRunsFit()` (`compose.ts`) — genau die Einträge von
 * `COMPOSITION_RULE_CATALOG`, die **nicht** in `VALIDATION_RULE_IDS` stehen.
 *
 * Warum eine zweite Tabelle statt eines Eintrags oben: `validateSpec()` prüft die Spec, bevor
 * irgendetwas gezeichnet ist, und `VALIDATION_RULE_IDS` ist die Liste genau dieser Regeln. Die
 * sechs hier entstehen erst, wenn die Komposition den Textlauf gesetzt und gegen seine Box
 * gemessen hat — sie brauchen Geometrie, die es zur Prüfzeit noch nicht gibt. Beide Listen in
 * einen Topf zu werfen, hieße den Mengengleichheits-Test aufzugeben, der belegt, dass keine
 * Prüfregel ohne Erklärung dasteht.
 */
const COMPOSITION_TABLE: Record<string, RuleExplanation> = {
  'designation-too-wide': {
    field: 'designation',
    title: 'Beschriftung passt nicht in die Fußzone',
    explanation:
      'Der Lauf aus `designation` steht mittig unter dem Körper, in 4 mm Schriftgrad ' +
      '(`FOOT_TEXT_SIZE_MM` in `compose.ts`), und seine Box ist so breit wie der Körper. Die ' +
      'Komposition bricht ab, statt umzubrechen oder den Schriftgrad zu senken: beides änderte ' +
      'die Geometrie und träfe eine gestalterische Entscheidung, die die Vorschrift nicht trifft ' +
      '— Anhang E setzt Kürzel, keine Fließtexte. Die Meldung nennt die gemessene Tinte und die ' +
      'Breite der Box; kürze die Beschriftung oder wähle eine breitere Grundzeichenart.',
  },
  'designation-unknown-glyph': {
    field: 'designation',
    title: 'Beschriftung enthält ein Zeichen ohne Vorschub',
    explanation:
      'Die Breite eines Laufs wird aus den Vorschubwerten von Arimo gerechnet ' +
      '(`assets/arimo-metrics.json`, erzeugt aus der Schriftdatei im Katalog). Für ein Zeichen, ' +
      'das die Schrift nicht führt, gibt es keinen Vorschub — die Prüfung müsste raten, und ein ' +
      'geratener Wert wäre zu klein. Die Meldung nennt jeden fehlenden Codepoint; ersetze ihn ' +
      'durch ein Zeichen, das die Schrift führt.',
  },
  'label-too-wide': {
    field: 'labels',
    title: 'Beschriftungslauf passt nicht in seine Zone',
    explanation:
      'Jede Zone in `labels` hat eine Box aus dem Körperprofil: Lage, Grundlinie und Breite sind ' +
      'je Grundzeichenart vermessen, nicht frei. Ein Lauf, dessen Tinte breiter ist als seine ' +
      'Box, stünde über der Kante. Die Meldung nennt Lauf, gemessene Tinte, Schriftgrad und ' +
      'Boxbreite; kürze den Lauf oder setze ihn in eine Zone, deren Box ihn trägt.',
  },
  'label-unknown-glyph': {
    field: 'labels',
    title: 'Beschriftungslauf enthält ein Zeichen ohne Vorschub',
    explanation:
      'Wie bei der Fußzone: die Laufweite kommt aus den Vorschubwerten von Arimo, und ein ' +
      'Zeichen ohne Eintrag hat keinen. Die Prüfung meldet es, statt mit einem Ersatzwert ' +
      'weiterzurechnen. Die Meldung nennt jeden fehlenden Codepoint; ersetze ihn durch ein ' +
      'Zeichen, das die Schrift führt.',
  },
  'function-role-run-too-wide': {
    field: 'functionRole',
    title: 'Lauf der Funktionsfassung passt nicht in seine Box',
    explanation:
      'Diese Läufe stammen aus der vermessenen Funktionsfassung im Katalog ' +
      '(`layout.roleRuns` und `layout.carrierRun`), nicht aus einer Eingabe im Builder. Kürzen ' +
      'lässt sich hier deshalb nichts; die einzige Änderung an der Spec ist eine andere ' +
      '`functionRole`. Tritt die Meldung auf, ist das ein Befund über die Fassung im Katalog und ' +
      'gehört dorthin gemeldet, nicht in die Spec.',
  },
  'function-role-run-unknown-glyph': {
    field: 'functionRole',
    title: 'Lauf der Funktionsfassung enthält ein Zeichen ohne Vorschub',
    explanation:
      'Auch dieser Lauf kommt aus der Funktionsfassung im Katalog, nicht aus einer Eingabe. Ein ' +
      'Zeichen ohne Vorschub in Arimo macht seine Breite unprüfbar. An der Spec lässt sich nur ' +
      'die `functionRole` wechseln; die Ursache liegt in der Fassung im Katalog und gehört ' +
      'dorthin gemeldet.',
  },
};

export const COMPOSITION_RULE_EXPLANATIONS: Readonly<Record<string, RuleExplanation>> =
  freezeTable(COMPOSITION_TABLE);

/**
 * Erklärung je Regel aus `validateFreestandingSpec()` (LFH-577): Linien, Wetter und
 * Tierzustand als freistehende Zeichen. Das Feld ist eines der freistehenden Spec-Art.
 */
export const FREESTANDING_RULE_EXPLANATIONS: Readonly<Record<string, RuleExplanation>> = freezeTable({
  'animal-state-variant-not-available': {
    field: 'variant',
    title: 'Zweite Darstellung nur beim kontaminierten Tier',
    explanation:
      'Unter den Tierzuständen zeigt die Referenz eine zweite Darstellung nur beim kontaminierten ' +
      'Tier: mit dem Buchstaben K statt des Zeichens aus Kreisen und Strichen (5.8.6.2). Das ' +
      'erkrankte und das tote Tier haben genau eine. Wähle die erste Darstellung oder das ' +
      'kontaminierte Tier.',
  },
  'line-strength-mismatch': {
    field: 'strength',
    title: 'Taktische Stärke nur an der Grenze mit Stärke',
    explanation:
      'Die Grenze mit taktischer Stärke (2.20) setzt die Stärke in die Lücken zwischen ihren ' +
      'Strichen; ohne Stärke fehlt ihr, was sie von der Grenze Einsatzabschnitt unterscheidet. ' +
      'An jeder anderen Linie hat die Stärke keinen Platz. Gib an der Grenze mit taktischer ' +
      'Stärke eine Stärke an und lass sie an jeder anderen Linie weg.',
  },
  'line-variant-not-available': {
    field: 'variant',
    title: 'Zweite Darstellung nur bei der Escape Route',
    explanation:
      'Unter den Linien zeigt die Referenz eine zweite Darstellung nur bei 2.14 Escape Route: ' +
      'Punkte und Pfeilköpfe im Wechsel statt Punkten allein. Jede andere Linie hat genau eine. ' +
      'Wähle die erste Darstellung oder die Escape Route.',
  },
  'weather-intensity-without-precipitation': {
    field: 'intensity',
    title: 'Intensität nur am Niederschlag unter der Wolke',
    explanation:
      'Die Intensität ist die Zahl der Niederschlagsmarken unter der Wolke: eine bis vier ' +
      'Flocken, Tropfen, Körner oder Blitze (5.8.7, Beispiele zum Schnee). Ein Wert allein oder ' +
      'ein Paar ohne Wolke und Niederschlag hat nichts, was sie zählte. Lass die Intensität weg ' +
      'oder wähle die Wolke mit einem Niederschlag.',
  },
  'weather-value-duplicate': {
    field: 'values',
    title: 'Wetterwert doppelt',
    explanation:
      'Jeder Wetterwert steht in einem Wetterzeichen höchstens einmal. Ein doppelter Wert ' +
      'beschreibt kein anderes Zeichen, er unterliefe nur die Grenze von zwei verschiedenen ' +
      'Werten. Streiche den doppelten Wert.',
  },
  'weather-values-exceed-limit': {
    field: 'values',
    title: 'Höchstens die Wolke und ein Niederschlag',
    explanation:
      'Ein Wetterzeichen trägt einen Wert allein oder die Wolke mit einem Niederschlag (Regen, ' +
      'Hagel, Gewitter oder Schnee). Mehr als zwei Werte zeigt kein Original, und der ' +
      'Eigentümer hat die Grenze am 29. September 2026 so entschieden. Verteile die Werte auf ' +
      'mehrere Wetterzeichen.',
  },
});

/**
 * Eine Meldung mit allem, was das Regelwerk über ihre Regel weiß: die Meldung selbst (mit den
 * konkreten Werten), Titel, Erklärung und kuratiertes Feld aus dieser Datei sowie Einordnung,
 * Begründung und Quellenbezug aus dem Regelkatalog.
 */
export interface ExplainedIssue extends ValidationIssue, RuleExplanation {
  /** Fachliche Regel der Systematik oder technische Grenze dieses Motors. */
  readonly kind: RuleKind;
  readonly dimension: RuleDimension;
  /** `'spec'` aus `validateSpec()`, `'composition'` aus der Komposition. */
  readonly phase: RulePhase;
  /** Warum es die Regel gibt, in einem Satz; `null`: Begründung nicht belegt. */
  readonly reason: string | null;
  /** Quellenbezug der Prüfstelle; `null`: keiner belegt. */
  readonly source: SourceReference | null;
}

/**
 * Ergänzt eine Meldung aus `validateSpec()`, aus der Komposition oder aus
 * `validateFreestandingSpec()` um Klartext und Katalogdaten ihrer Regel. Gefragt wird erst die
 * Prüftabelle, dann die Kompositionstabelle, dann die der freistehenden Zeichen; der Test hält
 * alle drei überschneidungsfrei, damit diese Reihenfolge nie eine Entscheidung trifft.
 *
 * Kein stiller Rückfall: eine unbekannte Kennung wirft, statt eine Erklärung zu erfinden. Ebenso,
 * wenn nur eine der beiden Hälften — Erklärung oder Katalogeintrag — die Kennung kennt; ein halber
 * Verbund sähe vollständig aus und wäre es nicht. Beides fangen die Tests vor jedem Release ab.
 */
export function explainIssue(issue: ValidationIssue): ExplainedIssue {
  const text: RuleExplanation | undefined =
    RULE_EXPLANATIONS[issue.rule] ??
    COMPOSITION_RULE_EXPLANATIONS[issue.rule] ??
    FREESTANDING_RULE_EXPLANATIONS[issue.rule];
  const catalog = ruleCatalogEntry(issue.rule);
  if (text === undefined || catalog === undefined) {
    throw new Error(
      `Für die Regel "${issue.rule}" gibt es keine Erklärung im Regelwerk von @einsatzzeichen/core.`,
    );
  }
  return {
    rule: issue.rule,
    message: issue.message,
    field: text.field,
    title: text.title,
    explanation: text.explanation,
    kind: catalog.kind,
    dimension: catalog.dimension,
    phase: catalog.phase,
    reason: catalog.reason,
    source: catalog.source,
  };
}

/**
 * Erklärt alle Meldungen einer abgelehnten Komposition, in ihrer Reihenfolge.
 *
 * Fail-closed wie `explainIssue()`: die erste Meldung ohne Erklärung wirft und nimmt die übrigen
 * mit. Wer die erklärbaren Meldungen trotzdem zeigen will — etwa eine Oberfläche, die eine
 * unbekannte Regel gesondert mit ihrer Kennung ausweist —, ruft `explainIssue()` je Meldung auf
 * und fängt den Wurf dort.
 */
export function explainRejection(error: CompositionError): ExplainedIssue[] {
  return error.issues.map(explainIssue);
}
