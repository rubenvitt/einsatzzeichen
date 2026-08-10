# Anhang J (IuK) — D.3 abgeschlossen

> Entscheidungsnotiz · 10. August 2026

## 1. Anlass

D.3 pausierte am 9. August nach Task 2, weil ein Drittel des Anhangs J seine Bedeutung nicht in
der Geometrie trägt, sondern in einem Buchstabenkürzel — und das Schema kein Textprimitiv kannte
(`docs/decisions/2026-08-09-anhang-j-ist-typografisch.md`). Der Schemaform-Slice vom selben Tag hat
es geliefert (`docs/decisions/2026-08-09-textprimitiv-und-fusszone.md`). Diese Notiz schließt D.3
ab.

## 2. Es sind 17 typografische Darstellungen, nicht 16

Die Notiz vom 9. August zählte 16 und behauptete, `J.3.14` und `J.3.15` unterschieden sich nach
Entfernung der Glyphen noch geometrisch. Die visuelle Prüfung widerlegt das: Beide sind ein
Quadrat mit einem großen „C" unter einem waagerechten Überstrich, und `J.3.15` fügt nur das Wort
„VoIP" unten links hinzu. Der behauptete Unterschied sind Rundungsstellen (`28.346` gegen
`28.347`). Die Tabelle in der Notiz vom 9. August ist entsprechend berichtigt.

Der Überstrich über dem „C" liegt in der Referenz **außerhalb** der Typografiegruppe. Er ist
Geometrie, kein Makron der Glyphe, und wird als eigene `line` konstruiert.

## 3. Der Plan hatte die Formfamilien an drei Stellen falsch

Das ist der wichtigste Befund dieses Slice, weil er die Ursache des zurückgerollten Commits
`1773316` erklärt.

**Die „Marken"-Zahlen waren Glyphenzahlen.** Der Plan las aus den Referenzen „Körper + 2/3/6
Marken" und leitete daraus Konstruktionsaufträge wie „Antennenmarke" oder „Handsprechfunkgerät"
ab. Tatsächlich zählte er Buchstaben: J.3.2 = „BS" = 2, J.3.4 = „TMO" + „DMO" = 6, J.3.6 = „HRT"
= 3. Keine dieser Marken existiert in der Baseline. Ein früherer Implementer hat sie erfunden;
der Commit ist zurückgerollt und liegt als Tag `archiv/d3-erfundene-marken-zurueckgerollt`.

**J.1 folgt einer anderen Formsprache als angenommen.** Der Plan beschrieb J.1.3 als „wie J.1.2
mit DMO-Kennzeichnung". Das Bild zeigt: J.1.3 trägt **nur** den Verbindungsbalken und das Kürzel,
keinen Zickzack und keine Bögen. Die Betriebsart *ersetzt* die Wellenform, sie ergänzt sie nicht.
Und J.1.5/J.1.6 tragen überhaupt keinen Balken, sondern einen Rahmen um „SDS" mit der Betriebsart
darunter — der Kurzdienst ist kein Kanal, sondern eine Nachricht. Die tatsächliche Formsprache
steht als Modulkommentar in `01-connections.ts`.

**J.3.2 ist ein Kreis.** Der Plan behauptete für alle acht Gerätezeichen ein Quadrat; die Referenz
zeigt `<circle r="34.016">` mit einer Giebelmarke darüber, die den ortsfesten Standort bezeichnet
und J.3.2 von der mobilen Fassung J.3.3 unterscheidet.

Alle drei Korrekturen stehen im Plan und in der Spec.

## 4. Die Einsatzgrenze sitzt am Textlauf, nicht am Zeichen

`gate.test.ts` fordert für jeden Katalogeintrag eine leere Befundliste des Text-Legibility-Gates
über alle sechs Snapshotgrößen. Bei `MINIMUM_TEXT_RENDER_PX = 8` verlangt die 16-px-Größe einen
Schriftgrad von 16 mm — das breiteste Kürzel des Anhangs misst 10,3 mm, „HRT" bei 16 mm wäre
breiter als die viewBox. Ohne eine deklarierbare Untergrenze wäre **kein** typografisches Zeichen
baubar gewesen.

Die Lösung ist ein optionales `minRenderPx` am `text`-Primitiv. Es sitzt am Lauf und nicht an der
Definition, und der Bestand belegt, dass das nötig war: `J.3.15` trägt zwei Läufe mit
verschiedenen Grenzen — 32 px für das große „C", 64 px für das kleine „VoIP". Eine Grenze je
Zeichen hätte beide auf 64 gezwungen und damit die Aussage verloren, die sie festhalten soll.

Zwei Eigenschaften waren die Bedingung dafür, dass diese Lockerung keine Aufweichung ist:

- **Oberhalb der Grenze gilt die Schwelle unverändert.** Ein eigener Testfall pinnt das; ohne ihn
  könnte ein Autor jeden Befund wegdeklarieren.
- **Das Feld ist optional, und die Auslassung ist laut.** Wer es an einem typografischen Lauf
  vergisst, bekommt `gate.test.ts` bei 16 px rot. Deshalb blieb der Katalogtest unangetastet.

Es ist das einzige Feld im IR in Pixeln statt Millimetern — es beschreibt nicht die Zeichnung,
sondern ihre Ausgabe.

## 5. Die Textbox hat jetzt ein Gate

Die Textprimitiv-Notiz benannte eine Lücke als offen: `boxMm` ist bei Text eine Zusicherung, die
kein Gate nachrechnet. `boundsOfMm` gibt sie unverändert zurück, `checkBox` prüft nur ihre
Enthaltung in der Piktogrammbox. Eine zu klein deklarierte Box fiel durch alle vier Gates.

`packages/catalog/src/pictograms/text-ink.test.ts` schließt sie für den Katalogbestand: Er rastert
jeden Textlauf einzeln bei 512 px und zählt die dunklen Pixel außerhalb seiner deklarierten Box.
Verifiziert mit einer absichtlich zu kleinen Box, die 6118 Pixel außerhalb meldet. Der Test hat
sich sofort bezahlt gemacht — bei `J.3.9` („APRT") ragten zehn Pixel heraus, ein Fehler, den
Augenmaß nicht gefunden hätte.

Er ersetzt **kein** allgemeines Textmetrik-Gate in `core`: Er prüft die Zeichen, die es gibt,
nicht die Form an sich. Die Rasterung braucht eine Schriftbindung, und die liegt in `catalog` —
die Paketrichtung `catalog → core` bliebe sonst nicht erhalten.

## 6. Was die Gates gefangen haben

Vier Fehler, die ohne sie in den Katalog gelangt wären:

- **`J.4.10`** und die vier J.1-Übertragungspaare: Bei pfad- **und** textfreien Definitionen
  fordert `checkBox` exakte Gleichheit von Hülle und Box. Meine deklarierten Boxen wichen um
  Millimeter ab.
- **`J.1.1`**: Der Katalogvertrag verlangt identische Titel über die Varianten einer ID. „Sprache"
  und „Sprache, leitergebunden" ließ `gate.test.ts` schon beim Laden scheitern.
- **`J.1.5`/`J.1.6`**: Die Piktogrammbox war schmaler als das Textfeld darunter.
- **`J.3.9`**: Die Textbox war 1 mm zu schmal (siehe Abschnitt 5).

## 7. Was die Gates nicht fangen — und die Sichtprüfung schon

Drei Fehler waren für die gesamte Testsuite unsichtbar:

- **`J.4.2` rendete als leeres Quadrat.** Der weiße Körper stand am Ende der Primitivliste und
  überdeckte alle vier Pfeile. Box-, Clipping- und Kontrast-Gate prüfen die Primitive, nicht ihre
  Reihenfolge. Das Zeichen bestand jede Prüfung.
- **Die Wolke in `J.4.5`** hatte eine flache Unterseite, weil `Z` den Pfad gerade schließt.
- **`J.1.10` und `J.1.11`**: Rahmen und Zickzack berührten sich; die Gates prüfen Enthaltung,
  nicht Abstand zwischen Primitiven derselben Definition.

Das Protokoll steht in `docs/reviews/2026-08-08-d3-visual-qa.md`. Es hält auch einen
Werkzeugbefund fest: resvg rastert eingebettete SVG-Bilder ohne die Schriftbindung des äußeren
Laufs, weshalb der erste Kontaktbogen jedes Kürzel als fehlend zeigte.

## 8. Evidenz

Gemessen am 10. August 2026 auf `worktree-anhang-j-d3`:

- `pnpm test`: **58 Testdateien / 2505 Tests grün**, keine übersprungenen Tests.
- `pnpm typecheck`: sauber.
- `pnpm cli coverage`: `Einträge: 234`, `Quellen: 13`, `Offene fachliche Reviews: 248` (234
  Manifestreviews, 13 Quellenreviews, 1 Profilreview), Umfang `1, 2, 4, 5.4, 5.8, C.1.1, C.1.2,
  D.3.7, J.1, J.2, J.3, J.4`, Coverage-Gate bestanden, 0 Kapitel im beanspruchten Umfang ohne
  Eintrag.
- `git diff --check`: sauber.
- Snapshots gegen `main`: **106 neue Dateien, null geänderte** (`git diff --name-status` meldet
  ausschließlich `A`). Kein Bestandszeichen hat sich verschoben, in keinem der sechs Tasks. Die
  Snapshots von `J.1.10` und `J.1.11` wurden innerhalb des Branches einmal erneuert, nachdem die
  Sichtprüfung die Berührung zwischen Rahmen und Zickzack gefunden hatte — Zeichen dieses Slice,
  gegen `main` trotzdem Neuanlagen.

Die Zahlen treffen die Planerwartung exakt, Task für Task: 191/205, 198/212, 205/219, 215/229,
223/237, 234/248.

## 9. Nicht in diesem Slice

- **Ein allgemeines Textmetrik-Gate in `core`** (Abschnitt 5).
- **Die „8" in `J.4.17`.** Sie ist der einzutragende Wert selbst, kein fester Zeicheninhalt.
  `content` ist ein festes `string`-Feld; es gibt keinen Platzhalterbegriff. `J.4.8` fällt
  ausdrücklich **nicht** darunter: sein „L" benennt die Größe Länge, und die Referenz enthält
  keine Zahl.
- **`J_Bedienungszeichen.svg`, die beiden J.2.3-Beispiele und Abschnitt J.2.3.** Unverändert an
  die Rezept- und Conformance-Coverageaufgabe verwiesen.
- **`SymbolSpec`- oder `compose()`-Integration.** Alle 53 sind standalone, wie D.2.

## 10. Reviewgrenze

**D.3 erteilt keine fachliche Freigabe.** Alle 53 Darstellungen sind `domain: pending`; insgesamt
248 fachliche Reviewträger sind offen. Die technische Evidenz behauptet weder fachliche Bedeutung
und Verwechslungsfreiheit noch normative Geltung, Quellenfreigabe oder geklärte Lizenzrechte.

Ein Punkt verdient dabei besondere Aufmerksamkeit des Fachreviews: Die Sichtprüfung stellt fest,
dass die kritischen Paare **unterscheidbar** sind. Ob die Kürzel `HRT`, `MRT`, `FRT`, `mBS` und
`APRT` in der Baseline tatsächlich so lauten, ist eine Aussage über die Quelle, die nur eine
fachkundige Person treffen kann — sie wurden von den Umrissen der Referenzglyphen abgelesen.
