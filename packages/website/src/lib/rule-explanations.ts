import type { ValidationIssue } from '@einsatzzeichen/core';

/**
 * Klartext zu jeder Regel, die `validateSpec()` melden kann.
 *
 * Der Builder und der Abschnitt „Zulässige Kombinationen“ der Symbolseiten zeigen nicht nur die
 * Meldung aus `validate.ts`, sondern auch, was die Regel verlangt, worauf sie sich stützt und
 * was sich an der Spec ändern lässt. Die Meldung bleibt dabei erhalten: sie nennt die konkreten
 * Werte, die Erklärung den Grund.
 *
 * Quellenangaben stehen nur dort, wo `validate.ts` oder `layout/profiles.ts` selbst eine nennen
 * (Anhangsabschnitt, Datei, Messung). Wo der Code keine Quelle führt, führt die Erklärung auch
 * keine — eine erfundene Fundstelle wäre schlimmer als keine.
 *
 * `rule-explanations.test.ts` gattert die Tabelle in beide Richtungen gegen
 * `VALIDATION_RULE_IDS`: jede Regel hat einen Eintrag, und kein Eintrag steht ohne Regel da.
 */
export interface RuleExplanation {
  readonly title: string;
  readonly explanation: string;
}

const EXPLANATIONS = {
  'above-left-label-requires-measured-body': {
    title: 'Zone oberhalb links braucht ein vermessenes Profil',
    explanation:
      'Ein Lauf in `labels.aboveLeft` steht über dem Körper, und seine Grundlinie führt nur, ' +
      'wessen Körperprofil sie vermessen hat; die Meldung nennt das Luftfahrzeug aus F.2.7. ' +
      'Andere Arten erben diesen Wert nicht, weil ihre Hülle anders verläuft. Entferne den Lauf ' +
      'oder wechsle auf eine Art und Variante, deren Profil diese Zone führt.',
  },
  'above-left-metrics-complete': {
    title: 'aboveLeft-Metriken nur vollständig',
    explanation:
      'Wer `labels.aboveLeftMetrics` setzt, muss den Lauf `labels.aboveLeft` und alle drei Maße ' +
      'zusammen angeben: Versalhöhe, Grundlinie und Anker, jeweils endlich und die Versalhöhe ' +
      'größer als null. Ein halber Satz mischte unbelegte Profilwerte in eine gemessene Lage. ' +
      'Ergänze die fehlenden Felder oder lass den Metriksatz ganz weg.',
  },
  'above-left-metrics-within-viewbox': {
    title: 'aboveLeft-Lauf muss in der ViewBox bleiben',
    explanation:
      'Aus Anker, Grundlinie und Versalhöhe berechnet die Komposition eine Textbox. Ihr Anker ' +
      'muss innerhalb der vermessenen Profilbox liegen, die Box selbst vollständig innerhalb der ' +
      '32-mm-ViewBox. Sonst stünde Text außerhalb der Zeichenfläche und wäre im Bild ' +
      'abgeschnitten. Rücke Anker oder Grundlinie nach innen oder verkleinere die Versalhöhe.',
  },
  'administrative-level-not-measured': {
    title: 'Verwaltungsstufe ohne vermessenen Kopf',
    explanation:
      'Eine Verwaltungsstufe wird nur akzeptiert, wenn ein gemessener Kopf aus D.3/D.4 aufgelöst ' +
      'ist und die Spec dazu die exakt passende Funktionsfassung führt. Die Abdeckung ist ' +
      'bewusst partiell: Gemeinde, Bezirk und Bundesland bleiben abgelehnt, statt einen Kopf zu ' +
      'raten. Setze eine Funktionsrolle, deren vermessener Kopf diese Stufe trägt, oder entferne ' +
      '`administrativeLevel`.',
  },
  'below-right-label-requires-measured-body': {
    title: 'Zone unterhalb rechts braucht ein vermessenes Profil',
    explanation:
      'Lage und Tinte von `labels.belowRight` hängen am Körperprofil und sind nur dort ' +
      'vermessen, wo es Werte führt: am angehobenen Wasserfahrzeugrumpf (E.2.27 bis E.2.31) und ' +
      'am gebänderten 12-mm-Kreis (G.3.5). An anderen Körperformen entstünde ein Lauf, den keine ' +
      'Referenzdatei zeigt und den auch kein Gate meldete. Entferne die Zone oder wähle eine Art ' +
      'und Variante, deren Profil sie führt.',
  },
  'below-right-label-requires-organization': {
    title: 'Lauf in Organisationsfarbe braucht eine Organisation',
    explanation:
      'Führt das Körperprofil diese Zone in der Organisationsfarbe (#003296 an E.2.27 bis ' +
      'E.2.31), braucht der Lauf eine Organisation, die diese Farbe liefert. Ohne sie hätte der ' +
      'Text keine gemessene Farbe. Setze `organization` oder entferne `labels.belowRight`.',
  },
  'body-variant-foot-conflict': {
    title: 'Körpervariante und Bezeichnung im selben Streifen',
    explanation:
      'Bei plain-wheel-pair am Landfahrzeug und bei raised-hull oder fixed-wing-hull am ' +
      'Luftfahrzeug belegt die sichtbare Zusatzgeometrie der Variante bereits den Streifen ' +
      'unterhalb des Körpers. Eine Bezeichnung in der Fußzone würde sie überlagern oder die ' +
      'viewBox verlassen. Entferne `designation` oder beschrifte im Körper, etwa über ' +
      '`labels.center`.',
  },
  'body-variant-requires-measured-kind': {
    title: 'Körpervariante nur an vermessener Art',
    explanation:
      'Jede Körpervariante gilt nur für die Arten, an denen sie vermessen wurde — inset-hull ' +
      'allein am Wasserfahrzeug, plain-wheel-pair allein am Landfahrzeug, raised-gable allein am ' +
      '12-mm-Kreis. Varianten fallen weder auf eine andere Körperart noch auf deren ' +
      'Normalfassung zurück. Wähle eine Art, für die die Variante vermessen ist, oder lass ' +
      '`bodyVariant` weg.',
  },
  'bottom-center-label-requires-measured-body': {
    title: 'Zone unten mittig braucht ein vermessenes Profil',
    explanation:
      '`labels.bottomCenter` verlangt ein Profil mit vermessener Grundlinie: die taktische ' +
      'Formation (2,0 mm über der Körperunterkante, F.1.18/F.1.20) und der gebänderte ' +
      '12-mm-Kreis (6,0 mm, G.3.5). Für andere Arten und Varianten gibt es keine Messung, aus ' +
      'der die Lage folgte. Entferne die Zone oder wechsle auf eines der beiden Profile.',
  },
  'bottom-right-metrics-complete': {
    title: 'bottomRight-Metriken nur vollständig',
    explanation:
      'Ein gemessener bottomRight-Satz muss alle fünf Felder gemeinsam führen: Versalhöhe, ' +
      'Grundlinie, Anker, Boxanfang und Boxbreite. Fehlt eines, mischte die Komposition ' +
      'unbelegte Werte in eine gemessene Lage. Ergänze die fehlenden Felder oder entferne ' +
      '`labels.bottomRightMetrics`.',
  },
  'bottom-right-metrics-require-bottom-right-label': {
    title: 'bottomRight-Metriken brauchen ihren Lauf',
    explanation:
      'Metriken ohne den zugehörigen Text hätten keine Wirkung — Versalhöhe, Grundlinie, Anker ' +
      'und Box würden still verschluckt. Deshalb verlangt `labels.bottomRightMetrics` einen ' +
      'nichtleeren `labels.bottomRight`. Setze den Lauf oder entferne den Metriksatz.',
  },
  'bottom-right-metrics-require-measured-body': {
    title: 'bottomRight-Metriken nur an vermessener Hülle',
    explanation:
      'Individuelle bottomRight-Metriken sind nur an einem Körperprofil zulässig, das eine ' +
      'vollständig vermessene relative Textbox führt; belegt ist das am angehobenen ' +
      'Luftfahrzeugrumpf. An anderen Profilen gäbe es keine Hülle, gegen die die Box geprüft ' +
      'würde. Wechsle Art und Variante oder verzichte auf den Metriksatz.',
  },
  'bottom-right-metrics-within-body': {
    title: 'bottomRight-Textbox muss im Körper liegen',
    explanation:
      'Die vollständige Textbox aus Boxanfang, Boxbreite und den abgeleiteten vertikalen ' +
      'Schriftmetriken muss innerhalb der vermessenen Körperhülle liegen, und der Anker ' +
      'innerhalb der Box. Sonst stünde der Lauf teilweise außerhalb des Körpers. Verschiebe Box ' +
      'oder Anker nach innen oder verkleinere Breite und Versalhöhe.',
  },
  'center-anchor-override-requires-measured-trailer': {
    title: 'Abweichender mittiger Anker nur am Anhänger',
    explanation:
      'Ein eigener x-Anker des mittigen Laufs ist allein am vermessenen Anhängerprofil belegt, ' +
      'und dort nur mit genau dessen gemessenem Wert; außerdem braucht er einen `labels.center`. ' +
      'Ein freier Wert wäre keine Messung, sondern eine Schätzung. Setze den gemessenen Wert am ' +
      'Anhänger oder entferne `labels.centerAnchorFromBodyLeftMm`.',
  },
  'center-baseline-not-measured': {
    title: 'Mittige Grundlinie nur mit vermessenem Wert',
    explanation:
      'Führt das Profil eine Liste vermessener Abweichungen, muss die angegebene mittige ' +
      'Grundlinie einem dieser Werte entsprechen; am Anhänger sind das die beiden Werte aus ' +
      'I.2.5/I.2.6. Zwischenwerte sind an keiner Referenzdatei belegt. Nimm einen der ' +
      'vermessenen Werte oder lass das Feld weg, dann gilt der Profilwert.',
  },
  'center-baseline-override-requires-measured-body': {
    title: 'Abweichende mittige Grundlinie nur an vermessenem Profil',
    explanation:
      'Eine eigene Grundlinie für den mittigen Lauf akzeptieren nur Profile, die das ' +
      'ausdrücklich erlauben — taktische Formation, Landfahrzeug in Normalfassung und Anhänger. ' +
      'Andere Körperprofile behalten ihren Wert, damit keine ungemessene Lage entsteht. ' +
      'Entferne `labels.centerBaselineFromBodyBottomMm` oder wechsle das Profil.',
  },
  'center-baseline-positive': {
    title: 'Mittige Grundlinie muss positiv sein',
    explanation:
      'Der Abstand der mittigen Grundlinie von der Körperunterkante muss eine endliche Zahl ' +
      'größer als null sein. Null, negative Werte, NaN oder Infinity ergäben keine Lage im ' +
      'Körper. Korrigiere `labels.centerBaselineFromBodyBottomMm` oder lass das Feld weg.',
  },
  'center-baseline-requires-center-label': {
    title: 'Mittige Grundlinie braucht ihren Lauf',
    explanation:
      'Eine gemessene mittige Grundlinie ohne mittigen Lauf hätte keine Wirkung und würde still ' +
      'verschluckt. Deshalb verlangt `labels.centerBaselineFromBodyBottomMm` ein gesetztes ' +
      '`labels.center`. Setze den Lauf oder entferne die Grundlinie.',
  },
  'center-box-margin-non-negative': {
    title: 'Rand der mittigen Textbox darf nicht negativ sein',
    explanation:
      'Der Rand der mittigen Textbox muss endlich und mindestens null sein. Negative Werte oder ' +
      'NaN ergäben keine Box, in der Text stehen könnte. Korrigiere `labels.centerBoxMarginMm` ' +
      'oder entferne das Feld.',
  },
  'center-box-margin-override-requires-measured-body': {
    title: 'Eigener Boxrand nur an vermessener Hülle',
    explanation:
      'Ein eigener Rand der mittigen Textbox ist nur an Profilen zulässig, die ihn erlauben und ' +
      'eine vermessene Körperhülle führen; belegt ist das an der taktischen Formation. Ohne ' +
      'Hülle gäbe es keine Breite, gegen die der Rand geprüft würde. Entferne ' +
      '`labels.centerBoxMarginMm` oder wechsle auf ein Profil mit vermessener Hülle.',
  },
  'center-box-margin-requires-center-label': {
    title: 'Boxrand braucht einen mittigen Lauf',
    explanation:
      'Ein Rand ohne mittigen Lauf hat keine Wirkung und würde still verschluckt. ' +
      '`labels.centerBoxMarginMm` verlangt deshalb ein gesetztes `labels.center`. Setze den ' +
      'Lauf oder entferne den Rand.',
  },
  'center-box-margin-within-body': {
    title: 'Boxrand muss Breite übrig lassen',
    explanation:
      'Der Rand wird links und rechts abgezogen; die doppelte Angabe muss kleiner bleiben als ' +
      'die vermessene Körperbreite, damit eine positive Boxbreite übrig bleibt. Sonst entstünde ' +
      'eine Box ohne Fläche, in der kein Text stünde. Verkleinere `labels.centerBoxMarginMm`.',
  },
  'center-cap-height-positive': {
    title: 'Mittige Versalhöhe muss positiv sein',
    explanation:
      'Die Versalhöhe des mittigen Laufs muss endlich und größer als null sein; sie ist eine ' +
      'Messung an der Referenzdatei und keine freie Größe. Null oder negative Werte ergäben ' +
      'keinen sichtbaren Text. Korrigiere `labels.centerCapHeightMm` oder lass das Feld weg.',
  },
  'center-cap-height-requires-center-label': {
    title: 'Mittige Versalhöhe braucht ihren Lauf',
    explanation:
      'Eine Versalhöhe ohne mittigen Lauf hätte keine Wirkung und würde still verschluckt — ' +
      'genau der lautlose Ausfall, den die Regeln an anderer Stelle abfangen. Setze ' +
      '`labels.center` oder entferne `labels.centerCapHeightMm`.',
  },
  'center-label-within-body': {
    title: 'Mittige Textbox muss im Körper liegen',
    explanation:
      'Erlaubt das Profil eine eigene mittige Grundlinie, prüft die Regel die daraus und aus der ' +
      'Versalhöhe abgeleitete Textbox gegen die vermessene Körperhülle. Sie muss vollständig ' +
      'darin liegen, sonst ragte der Lauf über den Körper hinaus. Rücke die Grundlinie näher an ' +
      'die Unterkante oder verkleinere die Versalhöhe.',
  },
  'chassis-foot-conflict': {
    title: 'Fahrwerkszone und Fußzone schließen sich aus',
    explanation:
      'Fahrzeugkategorie und Bezeichnung belegen beide den Streifen unterhalb des Körpers: das ' +
      'Fahrwerk reicht bis 4,75 mm unter die Körperunterkante, die Fußzone beginnt 1 mm ' +
      'darunter, die Überschneidung beträgt 3,75 mm bei 4 mm Zonenhöhe. Wohin die Fußzone ' +
      'auswiche, ist nicht belegt; Anhang E.2 beschriftet seine Fahrzeuge stattdessen im Körper. ' +
      'Nutze `labels.center` oder `labels.topLeft` statt `designation`, oder lass ' +
      '`vehicleCategory` weg.',
  },
  'circle-12-requires-hilfsorganisation': {
    title: '12-mm-Kreis braucht einen vermessenen Organisationsvertrag',
    explanation:
      'Der 12-mm-Kreis außerhalb der gebänderten Fassung verlangt einen vollständig vermessenen ' +
      'Organisationsvertrag: die weiße HiOrg-Fassung aus F.3 oder genau eine der drei farbigen ' +
      'Art-, Varianten- und Markenfassungen. Fehlende oder vertauschte Werte sind an keiner ' +
      'Datei belegt. Setze `organization` auf `hilfsorganisation` oder bilde eine der gemessenen ' +
      'farbigen Kombinationen genau nach.',
  },
  'circle-12-requires-organization': {
    title: 'Gebänderter Kreis braucht eine Organisation',
    explanation:
      'Der gebänderte 12-mm-Kreis füllt seine Körperfläche in der Organisationsfarbe und ' +
      'braucht deshalb eine Organisation. Ohne sie hätte die Fläche keine gemessene Farbe. ' +
      'Setze `organization` oder wechsle die Körpervariante.',
  },
  'circle-top-left-anchor-within-viewbox': {
    title: 'Kreislabel-Anker muss in der ViewBox bleiben',
    explanation:
      'Der Anker des topLeft-Laufs am 12-mm-Kreis wird relativ zur Kreisfläche angegeben und ' +
      'darf außerhalb davon beginnen; seine absolute Lage muss aber innerhalb der 32-mm-ViewBox ' +
      'bleiben und darf die rechte Kante der deklarierten Textbox bei 26 mm nicht ' +
      'überschreiten. Sonst liefe der Text aus der Zeichenfläche. Verkleinere ' +
      '`anchorFromBodyLeftMm` in `labels.topLeftMetrics`.',
  },
  'circle-top-left-baseline-within-viewbox': {
    title: 'Kreislabel-Grundlinie muss in der ViewBox bleiben',
    explanation:
      'Auch die Grundlinie darf außerhalb der Kreisfläche liegen, die daraus und aus der ' +
      'Versalhöhe berechnete Textbox muss aber vollständig innerhalb der 32-mm-ViewBox bleiben. ' +
      'Ein Lauf über der Oberkante wäre im Bild abgeschnitten. Verschiebe ' +
      '`baselineFromBodyTopMm` nach unten oder verkleinere die Versalhöhe.',
  },
  'circle-top-left-requires-metrics': {
    title: 'Kreislabel nur mit vollständigem Metriksatz',
    explanation:
      'Ein topLeft-Lauf an den beiden vermessenen Kreisfassungen verlangt immer den ' +
      'vollständigen Metriksatz aus Versalhöhe, Grundlinie und Anker. Die Kreisprofile führen ' +
      'keinen allgemeinen Default, aus dem sich die Lage ergäbe. Ergänze ' +
      '`labels.topLeftMetrics` oder entferne den Lauf.',
  },
  'colored-circle-top-left-not-measured': {
    title: 'Farbige Kreisverträge tragen kein topLeft-Label',
    explanation:
      'Die drei exakt vermessenen farbigen Kreisverträge führen weder einen topLeft-Lauf noch ' +
      'die zugehörigen F.3-Metriken; die weißen Kreislabelverträge werden nicht auf sie ' +
      'vererbt. Entferne `labels.topLeft` samt `labels.topLeftMetrics` oder wechsle auf die ' +
      'weiße HiOrg-Fassung.',
  },
  'designation-not-blank': {
    title: 'Bezeichnung darf nicht leer sein',
    explanation:
      'Eine Bezeichnung darf nicht leer sein und nicht nur aus Leerzeichen bestehen. Ein leerer ' +
      'Lauf erzeugte ein Textprimitiv ohne Tinte, das jedes Gate besteht und im Bild fehlt. ' +
      'Setze einen Text oder lass `designation` ganz weg.',
  },
  'foot-band-head-requires-measured-strength': {
    title: 'Fußband nur mit vermessener Stärke',
    explanation:
      'Am gebänderten Formationskörper sind nur Trupp, Gruppe und Zug vermessen. Die Staffel ' +
      'würde den Körper verschieben, und wie das Fußband dabei mitwandert, ist nicht belegt. ' +
      'Wähle eine der drei vermessenen Stärken oder eine andere Körpervariante.',
  },
  'function-role-body-mark-mismatch': {
    title: 'Körpermarke nicht zur Funktionsfassung vermessen',
    explanation:
      'Jede gemessene Funktionsfassung führt die Liste der Körpermarken, die zu ihr vermessen ' +
      'sind; `bodyMarks` darf nichts darüber hinaus enthalten. Andere Marken sind an dieser ' +
      'Fassung an keiner Datei belegt. Streiche die zusätzliche Marke oder wähle eine Funktion, ' +
      'die sie führt.',
  },
  'function-role-body-variant-not-measured': {
    title: 'Funktionsfassung ohne Körpervariante',
    explanation:
      'Körpervarianten und gemessene Funktionsfassungen sind in keiner Referenzdatei zusammen ' +
      'belegt. Die Kombination erzeugte eine Geometrie, die niemand vermessen hat. Entferne ' +
      '`bodyVariant` oder `functionRole`.',
  },
  'function-role-capabilities-not-measured': {
    title: 'Funktionsfassung ohne Standard-Piktogramme',
    explanation:
      'Standard-Piktogramme sind mit gemessenen Funktionsfassungen nicht kombiniert belegt; die ' +
      'Fassung bringt ihren eigenen, vollständig vermessenen Inhalt mit. Entferne ' +
      '`capabilities` oder `functionRole`.',
  },
  'function-role-head-mismatch': {
    title: 'Kopfzone passt nicht zur Funktionsfassung',
    explanation:
      'Die Kopfzone muss genau der Fassung entsprechen, die die Funktionsdefinition erwartet: ' +
      'gar keine Kopfangabe, genau die erwartete Stärke oder genau die erwartete ' +
      'Verwaltungsstufe samt aufgelöstem Kopf. Eine abweichende oder zusätzliche Angabe ergäbe ' +
      'eine Kopfzone, die zu dieser Funktion nicht vermessen ist. Setze `strength` ' +
      'beziehungsweise `administrativeLevel` auf den Wert der Fassung oder lass beide weg.',
  },
  'function-role-label-metrics-required': {
    title: 'Funktionsläufe brauchen vollständige Metriken',
    explanation:
      'Jeder Textlauf einer Funktionsfassung braucht vollständige sichtbare Metriken — Inhalt, ' +
      'Anker, Grundlinie, Schriftgröße, eine Box innerhalb der ViewBox, Tinte und ' +
      'Mindestrendergröße — und die Boxen dürfen sich nicht überlagern. Unvollständige oder ' +
      'überlappende Läufe ergäben unsichtbaren oder ineinanderlaufenden Text. Diese Werte ' +
      'stehen in der Funktionsdefinition; korrigiert wird sie, nicht die Spec.',
  },
  'function-role-organization-mismatch': {
    title: 'Organisation passt nicht zur Funktionsfassung',
    explanation:
      'Jede gemessene Funktionsfassung ist an genau eine Organisation gebunden, und ' +
      '`organization` muss diesen Wert tragen. Eine andere oder fehlende Zuordnung ist für die ' +
      'Fassung nicht vermessen. Setze die erwartete Organisation oder entferne `functionRole`.',
  },
  'function-role-requires-measured-kind': {
    title: 'Funktion nur an vermessener Art',
    explanation:
      'Eine gemessene Funktion ist nur an Formation und Person belegt, und jede einzelne ' +
      'Fassung gilt zusätzlich nur für die Art, für die sie vermessen wurde. Die Regel greift ' +
      'bei jeder anderen Art und ebenso, wenn Fassung und `kind` nicht zusammenpassen. Setze ' +
      '`kind` auf die Art der Fassung oder entferne `functionRole`.',
  },
  'function-role-requires-measured-layout': {
    title: 'Funktion braucht ihre aufgelöste Layoutdefinition',
    explanation:
      'Die Funktion verlangt ihre exakt aufgelöste Definition: dieselbe ID wie in ' +
      '`functionRole` und einen vollständigen, textfreien Geometrieplan aus Körperrechteck, ' +
      'Körperzusätzen, Dekorationen und höchstens zwei Textläufen. Fehlt die Definition oder ' +
      'ist der Plan unvollständig, gäbe es keine vermessene Zeichnung. Übergib die passende ' +
      'Definition im Validierungskontext oder entferne `functionRole`.',
  },
  'head-zone-conflict': {
    title: 'Mehrere Angaben in der Kopfzone',
    explanation:
      'Stärke, Verwaltungsstufe und technische Kopfmarke belegen dieselbe Kopfzone; höchstens ' +
      'eine davon darf gesetzt sein. Auch eine technische Kopfmarke zusammen mit einer ' +
      'Funktionsfassung ist ausgeschlossen, weil die Fassung ihre Kopfzone selbst bindet. Lass ' +
      'alle bis auf eine Angabe weg.',
  },
  'in-body-ink-requires-in-body-label': {
    title: 'Tintenoverride braucht einen Lauf im Körper',
    explanation:
      'Ein gemessener Tintenoverride wirkt nur auf Läufe im Körper: center, topLeft, ' +
      'bottomLeft, bottomCenter, bottomRight und die Zeilen aus topLeftLines. Läufe oberhalb ' +
      'des Körpers oder auf der Ausgabeoberfläche haben eigene Tintenverträge und werden nicht ' +
      'erfasst. Setze einen nichtleeren Lauf im Körper oder entferne `labels.inBodyInk`.',
  },
  'inset-hull-fire-fighting-requires-no-labels': {
    title: 'Feuerwehr-Rumpffassung trägt keine Beschriftung',
    explanation:
      'Der vermessene Feuerwehrvertrag der eingesenkten Wasserfahrzeughülle trägt keine ' +
      'Beschriftung. Ein Labelobjekt an dieser Fassung ist an keiner Datei belegt. Entferne ' +
      '`labels` oder wechsle auf die HiOrg-Fassung.',
  },
  'inset-hull-requires-center-label-only': {
    title: 'Eingesenkte Hülle nur mit mittigem Lauf',
    explanation:
      'Die eingesenkte Wasserfahrzeughülle belegt genau drei Labelfelder: `accessibilityMode`, ' +
      '`center` und `centerCapHeightMm`. Andere Felder, eine Bezeichnung oder ein Labelobjekt ' +
      'mit geerbten, nicht aufzählbaren oder über Accessoren gelieferten Werten werden ' +
      'abgelehnt, damit die geprüfte Datenansicht dieselbe bleibt, die gezeichnet wird. ' +
      'Beschränke `labels` auf diese drei Felder eines einfachen Objekts und entferne ' +
      '`designation`.',
  },
  'inset-hull-requires-measured-body-mark': {
    title: 'Körpermarken der eingesenkten Hülle',
    explanation:
      'An der eingesenkten Hülle sind die Körpermarken nur so belegt: für die ' +
      'Hilfsorganisation keine Marke oder genau `inset-hull-wheel-pair`, für die Feuerwehr ' +
      'genau `fire-fighting`. Andere Zusammenstellungen sind nicht vermessen. Passe `bodyMarks` ' +
      'an die gewählte Fassung an.',
  },
  'inset-hull-requires-measured-organization': {
    title: 'Eingesenkte Hülle nur für zwei Organisationen',
    explanation:
      'Die eingesenkte Wasserfahrzeughülle ist nur als Hilfsorganisations- und als ' +
      'Feuerwehrfassung vermessen. Eine andere oder fehlende Organisation ergäbe eine ' +
      'Körperfarbe, die keine Referenzdatei zeigt. Setze `organization` auf `hilfsorganisation` ' +
      'oder `feuerwehr`.',
  },
  'label-not-blank': {
    title: 'Beschriftungszone darf nicht leer sein',
    explanation:
      'Keine Beschriftungszone darf leer sein oder nur aus Leerzeichen bestehen; bei ' +
      'mehrzeiligen Zonen gilt das auch für jede einzelne Zeile. Ein leerer Lauf erzeugte ein ' +
      'Textprimitiv ohne Tinte, das jedes Gate besteht und im Bild fehlt. Setze einen Text oder ' +
      'entferne die Zone.',
  },
  'plain-wheel-pair-chassis-conflict': {
    title: 'plain-wheel-pair trägt schon ein Fahrwerk',
    explanation:
      'Die Variante plain-wheel-pair zeichnet bereits zwei vermessene Radringe. Eine ' +
      'Fahrzeugkategorie legte darüber eine zweite, nicht belegte Fahrwerksgeometrie. Entferne ' +
      '`vehicleCategory` oder wähle die Normalfassung des Landfahrzeugs.',
  },
  'reduced-house-requires-hilfsorganisation': {
    title: 'Reduzierte Hauskontur nur als HiOrg-Fläche',
    explanation:
      'Die reduzierte Hauskontur ist in beiden F.3-Belegen ausschließlich als weiße ' +
      'HiOrg-Körperfläche vermessen. Andere oder fehlende Organisationszuordnungen sind auch ' +
      'ohne Beschriftung nicht belegt. Setze `organization` auf `hilfsorganisation`.',
  },
  'strength-requires-unit': {
    title: 'Stärke nur an taktischen Einheiten',
    explanation:
      'Eine Stärkeangabe ist nur an taktischen Einheiten zulässig, also an Formation und ' +
      'Person. Fahrzeuge, Kreise und die übrigen Körperformen tragen in der Referenz keine ' +
      'Stärke. Entferne `strength` oder wechsle auf eine der beiden Einheitenarten.',
  },
  'surface-label-foot-conflict': {
    title: 'Oberflächenlauf und Bezeichnung im selben Streifen',
    explanation:
      'Bezeichnung und schwarze Oberflächenläufe belegen denselben Streifen unterhalb des ' +
      'Körpers. Eine vermessene Ausweichposition gibt es nicht, also schließen sie sich aus. ' +
      'Entferne `designation` oder die Läufe `labels.surfaceBelowLeft` und ' +
      '`labels.surfaceBelowRight`.',
  },
  'surface-label-requires-measured-body': {
    title: 'Oberflächenläufe nur an vermessenem Profil',
    explanation:
      'Schwarze Oberflächenläufe stehen außerhalb des Körpers auf der Ausgabefläche und sind ' +
      'nur an den Profilen vermessen, die dafür Werte führen — am angehobenen ' +
      'Luftfahrzeugrumpf und am um 1 mm angehobenen 12-mm-Kreis. Andere Profile haben für diese ' +
      'Zone keine gemessene Grundlinie. Entferne die Läufe oder wechsle Art und Variante.',
  },
  'surface-left-label-requires-measured-anchor': {
    title: 'Linker Oberflächenlauf braucht einen linken Anker',
    explanation:
      'Der linke schwarze Oberflächenlauf verlangt ein Profil, das einen links vermessenen ' +
      'Anker führt. Führt das Profil nur den rechten, bliebe die linke Lage geraten. Nutze ' +
      '`labels.surfaceBelowRight` oder wechsle auf ein Profil mit linkem Anker.',
  },
  'surface-right-label-requires-measured-anchor': {
    title: 'Rechter Oberflächenlauf braucht einen rechten Anker',
    explanation:
      'Der rechte schwarze Oberflächenlauf verlangt ein Profil, das einen rechts vermessenen ' +
      'Anker führt. Führt das Profil nur den linken, bliebe die rechte Lage geraten. Nutze ' +
      '`labels.surfaceBelowLeft` oder wechsle auf ein Profil mit rechtem Anker.',
  },
  'technical-fill-organization-conflict': {
    title: 'Technische Füllung und Organisation schließen sich aus',
    explanation:
      'Die Körperfläche bekommt ihre Farbe entweder aus der Organisation oder aus dem ' +
      'technischen Token, nicht aus beidem. Nur die Organisation trägt dabei eine ' +
      'nicht-farbliche Kontursignatur. Setze `technicalFill` oder `organization`, nicht beides.',
  },
  'technical-fill-token-invalid': {
    title: 'Technische Füllung braucht einen bekannten Farbtoken',
    explanation:
      'Eine technische Körperfüllung muss einen Token der Palette nennen. Freie Farbwerte gibt ' +
      'es nicht; sie umgingen die geprüften Kontrastverträge. Setze `technicalFill` auf einen ' +
      'Token aus `PALETTE`.',
  },
  'technical-head-mark-not-measured': {
    title: 'Technische Kopfmarke nicht vermessen',
    explanation:
      'Als technische Kopfmarke ist bisher nur `single-vertical-bar` vermessen. Jeder andere ' +
      'Wert hätte keine belegte Geometrie. Setze diesen Wert oder entferne `technicalHeadMark`.',
  },
  'technical-head-mark-requires-normal-formation': {
    title: 'Technische Kopfmarke nur an der normalen Formation',
    explanation:
      'Die technische Kopfmarke ist ausschließlich an der normalen Formation vermessen, also an ' +
      '`kind: formation` ohne Körpervariante. An anderen Arten oder Varianten ist ihre Lage ' +
      'nicht belegt. Entferne `bodyVariant` beziehungsweise `technicalHeadMark`.',
  },
  'top-left-anchor-within-body': {
    title: 'topLeft-Anker muss im Landfahrzeugkörper liegen',
    explanation:
      'Am Landfahrzeug muss der Anker des topLeft-Laufs endlich sein und zwischen 0 und 28 mm ' +
      'rechts der linken Körperkante liegen; das ist die vermessene Breite der Box. Größere ' +
      'Werte schöben den Text über die rechte Innenmarge hinaus. Korrigiere ' +
      '`anchorFromBodyLeftMm` in `labels.topLeftMetrics`.',
  },
  'top-left-baseline-within-body': {
    title: 'topLeft-Grundlinie muss im Körper liegen',
    explanation:
      'Am Landfahrzeug muss die topLeft-Grundlinie mindestens eine Versalhöhe unter der ' +
      'Körperoberkante und höchstens 20,25 mm darunter liegen, also innerhalb der vermessenen ' +
      'Hülle. Andernfalls ragte der Text oben oder unten aus dem Körper. Korrigiere ' +
      '`baselineFromBodyTopMm` oder die Versalhöhe.',
  },
  'top-left-cap-height-positive': {
    title: 'topLeft-Versalhöhe muss positiv sein',
    explanation:
      'Die Versalhöhe des topLeft-Laufs muss endlich und größer als null sein. Null oder ' +
      'negative Werte ergäben keinen sichtbaren Text. Korrigiere `capHeightMm` in ' +
      '`labels.topLeftMetrics`.',
  },
  'top-left-label-requires-measured-body': {
    title: 'Zone oben links braucht ein vermessenes Profil',
    explanation:
      'Die Grundlinie der Zone oben links ist an der taktischen Formation (5,0 mm unter der ' +
      'Körperoberkante), an den F.2-Landfahrzeugen (6,75 mm), am Festflügel-Luftfahrzeug und an ' +
      'den beiden Kreisfassungen vermessen. Andere Profile erben keinen dieser Werte, weil ihre ' +
      'Hülle anders verläuft; am Gebäudekörper liefe der Formationsanker aus dem Polygon ' +
      'heraus. Entferne `labels.topLeft` oder wechsle auf ein Profil mit gemessener Grundlinie.',
  },
  'top-left-lines-exactly-two': {
    title: 'Zweizeilige Zone braucht genau zwei Zeilen',
    explanation:
      'Die zweizeilige obere Beschriftungszone ist genau zweizeilig vermessen. Eine, drei oder ' +
      'mehr Zeilen hätten keine belegten Grundlinien. Gib in `labels.topLeftLines` genau zwei ' +
      'Zeilen an.',
  },
  'top-left-lines-require-measured-body': {
    title: 'Zweizeilige Zone nur am vermessenen Körper',
    explanation:
      'Die zweizeilige obere Zone ist am Landfahrzeug aus F.2.8 vermessen; sie verlangt ein ' +
      'Profil mit zwei Grundlinien und eine Körpervariante, die zu dieser Art gehört. Für ' +
      'andere Körperformen gibt es keine Messung, aus der ihre Lage folgte. Nutze ' +
      '`labels.topLeft` einzeilig oder wechsle auf das vermessene Landfahrzeugprofil.',
  },
  'top-left-metrics-complete': {
    title: 'topLeft-Metriken nur vollständig',
    explanation:
      'Ein gemessener topLeft-Satz muss Versalhöhe, Grundlinie und Anker gemeinsam führen. Ein ' +
      'partielles Objekt mischte unbelegte Profilwerte in eine gemessene Lage. Ergänze die ' +
      'fehlenden Felder oder entferne `labels.topLeftMetrics` ganz.',
  },
  'top-left-metrics-require-measured-vehicle-land': {
    title: 'Eigene topLeft-Metriken nur an vermessenen Fassungen',
    explanation:
      'Individuelle topLeft-Metriken sind nur am normalen und am gebänderten ' +
      'F.2-Landfahrzeug, an den beiden F.3-Kreisfassungen und am Festflügel-Luftfahrzeug ' +
      'vermessen. Andere Arten und Varianten behalten ihre eigenen Profilwerte, statt eine ' +
      'fremde Messung zu übernehmen. Entferne den Metriksatz oder wechsle Art und Variante.',
  },
  'top-left-metrics-require-top-left-label': {
    title: 'topLeft-Metriken brauchen ihren Lauf',
    explanation:
      'Metriken der oberen linken Zone ohne nichtleeren `labels.topLeft` hätten keine Wirkung; ' +
      'alle drei Maße würden still verschluckt. Setze den Lauf oder entferne ' +
      '`labels.topLeftMetrics`.',
  },
  'top-left-metrics-required-by-profile': {
    title: 'Profil verlangt den vollständigen topLeft-Satz',
    explanation:
      'Manche Körperprofile belegen den topLeft-Lauf ausschließlich mit einem vollständigen ' +
      'quellenspezifischen Metriksatz; belegt ist das am Festflügel-Luftfahrzeug. Ein ' +
      'Profildefault wäre dort nur eine Teilmessung. Ergänze `labels.topLeftMetrics` oder ' +
      'entferne den Lauf.',
  },
  'top-left-metrics-within-body': {
    title: 'topLeft-Lauf muss in der Körperhülle liegen',
    explanation:
      'Am Festflügel-Luftfahrzeug müssen der Anker und die aus Grundlinie und Versalhöhe ' +
      'abgeleitete vertikale Textbox innerhalb der vermessenen Körperhülle liegen, mit 2 mm ' +
      'Innenmarge an der rechten Kante. Sonst stünde der Lauf über dem Rumpf. Rücke Anker oder ' +
      'Grundlinie nach innen oder verkleinere die Versalhöhe.',
  },
  'vehicle-category-requires-vehicle': {
    title: 'Fahrzeugkategorie nur mit Fahrwerkszone',
    explanation:
      'Eine Fahrzeugkategorie ist nur am Landfahrzeug, am Anhängerrumpf und am ' +
      'Wechselladerrumpf belegt; nur diese drei Körperformen tragen in der Referenz eine ' +
      'Fahrwerkszone. Von den 31 Zeichen des Anhangs E.2 tragen 25 ein Fahrwerk, die fünf ' +
      'Wasserfahrzeuge und die Luftfahrzeugdateien keines. Entferne `vehicleCategory` oder ' +
      'wechsle auf eine der drei Arten.',
  },
} as const satisfies Readonly<Record<string, RuleExplanation>>;

/** Die Kennungen, für die diese Tabelle eine Erklärung führt. */
export type RuleId = keyof typeof EXPLANATIONS;

/**
 * Erklärung je Regelkennung. Bewusst über `string` indiziert: `VALIDATION_RULE_IDS` ist eine
 * `readonly string[]`, und die Vollständigkeit gegen diese Liste ist eine Laufzeiteigenschaft,
 * die der Test prüft — kein Typ, den ein zweiter Literaltyp doppelt behaupten müsste.
 */
export const RULE_EXPLANATIONS: Readonly<Record<string, RuleExplanation>> =
  Object.freeze(EXPLANATIONS);

export interface ExplainedIssue extends ValidationIssue, RuleExplanation {}

/**
 * Ergänzt eine Meldung aus `validateSpec()` um Titel und Erklärung ihrer Regel.
 *
 * Kein stiller Rückfall (Spec §7): eine unbekannte Kennung wirft, statt eine Erklärung zu
 * erfinden. Der Fall bedeutet, dass `core` eine Regel bekommen hat, die hier fehlt — und genau
 * das fängt `rule-explanations.test.ts` vor jedem Build ab.
 */
export function explainIssue(issue: ValidationIssue): ExplainedIssue {
  const entry: RuleExplanation | undefined = RULE_EXPLANATIONS[issue.rule];
  if (entry === undefined) {
    throw new Error(
      `Für die Regel "${issue.rule}" gibt es keine Erklärung in rule-explanations.ts.`,
    );
  }
  return {
    rule: issue.rule,
    message: issue.message,
    title: entry.title,
    explanation: entry.explanation,
  };
}
