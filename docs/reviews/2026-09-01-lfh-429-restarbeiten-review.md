# Review der LFH-429-Restarbeiten (LFH-502, 503, 504, 510)

Stand: 01.09.2026 · Branch `feat/lfh-429-restarbeiten` · Basis `origin/main` = `c3dc3ba`

Sechs Prüfrichtungen über den Diff, jeder Rohbefund anschließend von drei unabhängigen
Skeptikern angegriffen — je einer auf Korrektheit (stimmt die Tatsachenbehauptung?),
Reproduktion (lässt sich der Fehlerfall auslösen?) und Absicht (ist das Verhalten im Code
begründet?). Ein Befund gilt als bestätigt, wenn ihn weniger als zwei der drei widerlegen.

**Ergebnis: 8 Rohbefunde, 6 bestätigt, 2 widerlegt.** Alle sechs lagen im Code dieses Diffs,
keiner im Bestand. Alle sechs sind behoben.

## Bestätigt und behoben

### 1. `blockedTooltip` mischte zwei Specs in einem Satz — mittel

`Builder.tsx` rechnete `probes` aus `probeSpec = useDeferredValue(spec)`, leitete `kindLabel`
aber aus dem aktuellen `spec.kind` ab. Beides floss in denselben Satz. Im aufgeschobenen Render
gehörte die Sperre zur vorigen Grundzeichenart, die Benennung schon zur neuen — der Satz
beschrieb damit eine Kombination, die in **keiner** der beiden Specs vorkam. Keine veraltete
Aussage, sondern eine erfundene, und zwar über die Referenz.

Reproduziert in einer echten Insel (happy-dom, React 19.2, `IS_REACT_ACT_ENVIRONMENT=false`):
Kachel „Person" → Kachel „Taktische Formation". Über drei Ereignisschleifen-Durchläufe trug
`option[value="cbrn-protection"]` den Titel „… ist als Körpermarke für die Grundzeichenart
‚Taktische Formation' nicht vermessen", obwohl
`allowedValues({kind:'formation'}, 'bodyMarks', ['cbrn-protection'])[0].ok === true` ist.
Umfang: 890 `(Feld, Wert, kindA→kindB)`-Paare, davon 146 an den Organisations-Kacheln, wo der
Satz zusätzlich in den sr-only-Text und über `onFocus`/`onClick` in die Live-Region geht.

**Behoben:** `kindLabel` kommt aus `probeSpec.kind`. Sperre und Satz gehören damit zur selben
Spec. Der `useDeferredValue`-Kommentarblock trägt jetzt den Absatz „Veraltet ist erlaubt,
gemischt nicht" — die alte Fassung räumte nur das Veralten ein und deckte die Mischung nicht ab.
Regressionstest verifiziert rot beim Rückbau.

### 2. Die aufgeschobene Probe brach „der gesetzte Wert wird nie gesperrt" — niedrig

`allowedValues()` sichert ausdrücklich zu, den gesetzten Wert nie zu sperren, und begründet das
damit, dass ein gesperrter *und* ausgewählter Eintrag von Browsern verschieden dargestellt wird.
Die Zusicherung gilt relativ zu der Spec, die hineingereicht wird — seit LFH-504b ist das die
aufgeschobene, während `value`/`selected` aus der aktuellen kommen. Bei einem Sprung über
mehrere Achsen (`loadFromCatalog`, Zufallsbeispiel, `decodeSpec` beim Mounten) konnte dieselbe
Kachel `aria-pressed="true"` und `aria-disabled="true"` zugleich tragen.

**Behoben:** `displayedBlock(probe, optionId, selected)` setzt die Zusicherung dort durch, wo sie
sichtbar wird — im Render, einheitlich über `SelectField`, `ListField` und `TileGroup`.
Regressionstest verifiziert rot beim Rückbau.

### 3. Der Feldhinweis wurde doppelt vorgelesen — niedrig

`FieldIssueNote` lag innerhalb des `<label htmlFor>` **und** war per `aria-describedby`
verknüpft: einmal als Teil des zugänglichen Namens, einmal als Beschreibung. `ListField` machte
es von Anfang an richtig.

**Behoben:** `SelectField` und das Beschriftungsfeld folgen jetzt dem Muster von `ListField`.
Dabei verlor `definition.hint` seine Label-Einbettung und hätte gar keinen Bezug mehr gehabt —
er bekommt eine eigene Kennung und hängt zusammen mit der Notiz in `aria-describedby`. Name
einmal, Beschreibungen je einmal.

### 4. Der Kommentar nannte die falsche Regel als Hauptfall — mittel

Der Dokblock zu `issuesByField()` gab an, unter den 134 Kombinationen, in denen eine Meldung auf
ein leeres Feld zeigt, stehe `circle-12-requires-organization` voran. Die Zahl 134 stimmt, die
Verteilung nicht: `reduced-house-requires-hilfsorganisation` 67, `circle-12-requires-hilfsorganisation`
66, `circle-12-requires-organization` **1**. Die genannte Regel ist der seltenste der drei Fälle.
Wer den Hinweis später auf fehlende Angaben ausweitet, hätte sich am Einzelfall orientiert.

**Behoben:** Der Kommentar nennt die gemessene Verteilung.

### 5. Dem Bildvergleich wurde ein Blocker zugeschrieben, der ihn nicht betrifft — niedrig

`sources-und-diffs.mdx` schrieb, der Vergleich Bild gegen Bild scheitere „zur einen Hälfte an
der Nutzungsgrundlage, zur anderen an der fehlenden Zuordnung". Das sind aber nicht zwei Hälften
einer Funktion, sondern zwei verschiedene: das Zeichen neben seiner Vorlage hängt allein an der
Nutzungsgrundlage, das Zeichen unter seinem alten Namen allein an der fehlenden Zuordnung.

**Behoben:** Der Satz trennt die beiden Gegenüberstellungen und ihre Gründe.

### 6. Tippfehler im neuen Modulkopf — niedrig

„dopplet" statt „doppelt" in `snapshot-axes.ts`. **Behoben.**

## Widerlegt

- **„Die Seite behauptet einen zurückgezogenen Auftrag, das verlinkte Dokument sagt das
  Gegenteil."** Das Scoping-Dokument empfiehlt eine Einschränkung des 1.0-Gates und stellt das
  Vollregister zurück; die Seite gibt das zutreffend wieder.
- **„Der neue Testblock in `review-summary.test.ts` sichert nichts von dieser Änderung ab."**
  Er prüft die drei Zahlbilder, die den 0/teils/alle-Zweig auswählen — genau den dritten Punkt
  von LFH-503.

## Bekannte, bewusst offene Punkte

- Die übrige Kehrseite des `useDeferredValue` bleibt: ein Klick auf eine für gesperrt gehaltene
  Kachel kann einmal zu Unrecht abgewiesen werden. Das ist der eingegangene Tausch und im Code
  dokumentiert.
- Der eager `import.meta.glob` in `snapshot.ts` wird nach der Testentkopplung von keinem Vitest
  mehr ausgeführt; bricht dort Pfad oder Glob-Option, meldet es erst `astro check` oder der
  Website-Build. Im Test kommentiert.
- Es gibt keinen Wächter gegen einen Rückfall der Seitengröße von `/zeichen/`. Ein
  Größenbudget-Test machte den Website-Build zur Testvoraussetzung — eigenes Ticket.
