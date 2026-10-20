# Baukasten-Modus für freistehende Zeichen (ESZ-135)

Stand: 20.10.2026

## Anlass

Der Baukasten baute nur `SymbolSpec`. Seit LFH-577 und LFH-798 gibt es sechs freistehende Arten
(`movement`, `line`, `weather`, `animal-state`, `state`, `pictogram`), seit LFH-804 ihr Vokabular.
Offen geblieben aus `2026-10-10-lfh-798-freistehende-zustaende-und-piktogramme.md`.

## Entscheidung

- **Ein Umschalter „Art des Zeichens“** zwischen „Mit Grundzeichen“ und „Freistehend“. Beide
  Modi behalten ihre eigene Spec; der Wechsel verliert nichts. Ein Link auf ein freistehendes
  Zeichen öffnet den Baukasten in diesem Modus, „Aus dem Katalog laden“ schaltet zurück.
- **Link über `encodeAnySpecParam`/`decodeAnySpecParam`.** Für eine `SymbolSpec` ist der Link
  Zeichen für Zeichen derselbe wie bisher (Test über alle Rezepte); alte Links ohne Hülle bleiben
  lesbar.
- **Vorschau, Regelliste, SVG, PNG und Codebeispiele über `drawAnySpec`.** Die Beispiele nennen
  bei einem freistehenden Zeichen `drawAnySpec` und den Typ `FreestandingSpec`.
- **Werte aus den Registern, nicht aus dem Snapshot.** `MOVEMENT_IDS`, `LINE_IDS`, `STATE_IDS`,
  `PICTOGRAM_IDS` usw. aus `schema`, Bezeichnungen aus `parametricBlock()` und `pictogram()` aus
  `core`. Die Register sind ohnehin im Browserbündel, weil der Baukasten mit ihnen zeichnet. Die
  Piktogramme stehen nach Raum gegliedert (`<optgroup>`).
- **Sperren durch `checkAnySpec` je Kandidat, nicht durch `freestandingVocabulary`.** Der Klick
  setzt mehr als ein Feld (`reduceFreestanding`): ein Pfeil bringt den Verlauf seiner Referenz mit
  (`referenceMovementSpec`, „Sammeln“ endet bei x 26), 2.20 die Stärke „Zug“, und Stärke wie
  zweite Darstellung fallen an Linien weg, die sie nicht tragen. `freestandingVocabulary` setzt
  nur das eine Feld und sperrte damit 2.20 (Stärke fehlt) und „Sammeln“ (Verlauf ragt aus der
  Fläche). Geprüft wird deshalb die Spec, die der Klick erzeugt, auf demselben Weg, den
  `freestandingVocabulary` intern nimmt. Ein Verlauf, der einen Kandidaten nicht trägt, sperrt
  ihn mit eigenem Grund (`because: 'path'`), statt die Probe abzubrechen.
- **Kein Verlaufseditor.** Pfeile stehen auf dem Verlauf der Vorlage, Linien auf dem geraden
  Verlauf 1|16 bis 47|16 (2.17 bis 2.19), auch die in der Referenz geschwungenen 2.14 bis 2.16.
  Ein eigener Verlauf aus einem Link bleibt erhalten. Den Verlauf zeichnet in der Anwendung die
  Karte; der Baukasten zeigt das Zeichen.
- **Wetter mit mindestens einem Wert.** Der letzte Wert lässt sich nicht entfernen.

## Nicht in diesem Schritt

- **Explorer-Facette „freistehend“.** Der Explorer zeigt die 308 Zeichen aus `snapshot.symbols`
  (Katalogeinträge, Rezepte, abgeleitete Orte), alle mit `SymbolSpec`. Freistehende Zeichen stehen
  dort gar nicht; die Piktogramme sind im Manifest nur Elementzeilen ohne Zeichenseite. Eine
  Facette setzt voraus, dass sie als eigene Zeichenart mit `AnySpec`, Zeichenseite, PNG und Slug
  in den Snapshot kommen. Das ist ein Umbau des Katalogs; Folgeaufgabe ESZ-146 (Entscheidung
  des Eigentümers vom 20.10.2026).

## Messung

Alle Felder aller sechs Arten an ihrer Ausgangsauswahl zusammen rund 13 ms, das Piktogramm mit
260 Kandidaten rund 5 ms (Node 22, tsx, 20.10.2026). Die Probe läuft deshalb ohne
`useDeferredValue`; im Modus gibt es kein Freitextfeld.
