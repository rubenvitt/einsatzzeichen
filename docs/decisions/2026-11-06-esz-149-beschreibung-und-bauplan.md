# Beschreibung und Bauplan: zwei Ebenen statt einer

Stand: 06.11.2026 · ESZ-148 (Konzept), ESZ-149 (Schritt 1)

## Anlass

Die API war zu komplex, und der Baukasten war es aus demselben Grund: `SymbolSpec` ist zugleich die
fachliche Beschreibung („THW-Bergungsgruppe“) und der exakte Bauplan, mit dem die BABZ-Originale
millimetergenau nachgebaut werden. Wer ein Zeichen will, sah deshalb Millimeter-Overrides, 158
geometrisch benannte Körpermarken, zwei Felder für dieselbe Fähigkeit (`capabilities`,
`bodyMarks`) und vier Kopffelder, von denen nur eins gesetzt sein darf. `drawSymbol` wirft, und
jede Anwendung baute sich ihre eigene Rückfallkette (Lifeline Hub: `fachobjektZeichen.ts`).

Vorgabe des Eigentümers: einfacher, **ohne eine Funktion zu streichen**.

## Entscheidung

Der Eigentümer hat am 05.11.2026 die Richtung „zwei Ebenen“ gewählt.

1. **Beschreibung** (`Sign` in `schema`): was gemeint ist. `kind`, `variant`, `organization`
   oder `color` (im Typ ausschließend), `tasks`, `head` (eine Angabe aus vier disjunkten
   Listen), `role`, `chassis`, `states` (mit Tendenz), `text`, und `exact` als Ergänzung.
   Freistehende Zeichen gehen unverändert ein.
2. **Bauplan** (`SymbolSpec`, unverändert): für Rezepte, Prüfpaket und exakten Nachbau.

`resolve` macht aus der Beschreibung den Bauplan, `fromExact` den Rückweg. `draw`, `check`,
`choices`, `describe`, `serialize`/`parse` arbeiten auf der Beschreibung.

### Regeln der Auflösung

- **Keine Konventionen von selbst.** Die weiße Innenkontur am THW setzt `resolve` nicht; sie
  steht weiter in `exact.whiteInnerContour`, bis fachlich geklärt ist, ob sie Regel ist
  (Rückfrage 4 im Konzept).
- **Fassung der Fachaufgaben:** randbündig vermessen, Box vermessen, randbündig abgeleitet, Box
  abgeleitet. Zeichnet keine, stehen sie in der Box. Setzt `exact` selbst `capabilities` oder
  `bodyMarks`, kommen die Fachaufgaben ohne Wahl dazu.
- **Kennungen bleiben**, auch die Mischung aus deutschen und englischen (gespeicherte Daten hängen
  daran). Funktionsfassungen bleiben, wie sie sind.

### `draw` wirft nie wegen einer Regel

Trägt die Beschreibung als Ganzes nicht, baut `draw` das Zeichen vom nackten Körper her wieder
auf, in fester Reihenfolge: Organisation, Farbe, Variante, Fahrwerk, Kopf, Funktion, jede
Fachaufgabe, jede Textzone, jeder Zustand, jedes Feld aus `exact`. Ein Teil bleibt, wenn das
Zeichen mit ihm noch zeichnet; sonst steht es mit Grund in `omitted`, und `fidelity` ist
`simplified`. Zeichnet nicht einmal der Körper (oder ein freistehendes Zeichen), kommt der
konkrete Punkt. Das ersetzt die Kaskade, die Anwendungen bisher selbst gebaut haben, und lässt
weniger weg als eine feste Abbruchkette, weil jedes Teil einzeln geprüft wird.

### Nichts geht verloren: das Roundtrip-Gate

`conformance/src/sign-roundtrip.test.ts`: Für alle Rezepte und typischen Einsatzmittel (551 am
06.11.2026) gilt `renderSvg(draw(fromExact(spec)).drawing) === renderSvg(drawSymbol(spec))` und
`resolve(fromExact(spec))` hat denselben `specKey`. 465 davon kommen ohne `exact` für Fachaufgaben
aus; in `exact` bleiben vor allem technische Körpermarken, Messwerte der Beschriftung,
`whiteInnerContour` und Fassungen (`bodyMarkRenditions`). `fromExact` prüft seine Zusage selbst
und fällt notfalls auf „alles in `exact`“ zurück.

### Speicherformat

Neu `{"v":2,"sign":{…}}`: gespeichert wird die Absicht, nicht die Fassungswahl von heute. Wird
eine Fachaufgabe später vermessen, zeigt ein gespeichertes Zeichen sie in der besseren Fassung.
`{"v":1,"spec"|"freestanding":…}` und alte Baukasten-Links bleiben lesbar (`parse` → `fromExact`).

### Subpfade

`@einsatzzeichen/core/exact` (Bauplan-Welt), `/blocks` (Bausteine und Geometrie), `/sketch`
(Kommunikationsskizze). Bis 7.0 steht alles weiter auch an der Wurzel; ein Test hält jeden
Subpfad als Teilmenge der Wurzel mit denselben Werten.

## Migrationspfad

| Schritt | Inhalt | Bruch |
|---|---|---|
| 1 (ESZ-149) | Beschreibungsebene, Subpfade, Roundtrip-Gate, Kanäle nehmen `sign` | nein |
| 2 (ESZ-150) | Baukasten auf der Beschreibung | nein |
| 3 (Lifeline Hub) | Kaskade und Fassungswahl durch `draw`, Zeichenwahl auf `choices`; v2 erst nach Erweiterung der Serverprüfung | nein |
| 4 (ESZ-151, 7.0) | Wurzel nur noch die neue API, Bauplan über `core/exact`, Codemod | ja |

`@deprecated` an den alten Wurzelexporten kommt erst, wenn Schritt 3 durch ist: Vorher würde es
Konsumenten mit Lint auf veraltete APIs rot machen, ohne dass sie umsteigen könnten.

## Bewusst offen

- `choices` deckt die Felder mit Körper ab; für freistehende Zeichen bleibt
  `freestandingVocabulary` aus `core/exact`.
- `role` und `chassis` sind im Typ nicht an Arten gebunden (heute: Funktionsfassungen an
  Formation und Person, Fahrwerke an fünf Fahrzeugarten). Eine Typunion je Art machte
  `choices(sign, 'kind')` und jeden Wechsel der Art untypisierbar; die Regeln prüfen es wie
  bisher, `check` nennt das Feld.
