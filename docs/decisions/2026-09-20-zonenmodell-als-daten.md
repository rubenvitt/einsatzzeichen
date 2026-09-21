# Zonenmodell als Daten: welche festen Werte werden Zonendaten?

> Stand: 20. September 2026, entschieden am 21. September 2026
> Status: **Entschieden.** Vorbereitet vom Koordinator zu LFH-562 (Initiative A,
> Zeichen-Grammatik), entschieden vom Projektinhaber, der allen acht Empfehlungen gefolgt ist.
> Der Umsetzungsstand steht je Wert unten; Abschnitt 5 fasst ihn zusammen.
> Bezug: `docs/decisions/2026-09-13-grammatik-motor-und-paketschnitt.md` (Scope),
> `docs/decisions/2026-09-19-masse-an-der-referenz-ablesen.md` §6 (offener Punkt)

## 1. Was bereits gebaut ist

Das Zonenmodell liegt als Daten vor und trifft **keine** der Entscheidungen dieser Notiz:

- `packages/schema/src/zones.ts` — `ZoneId` (16 Zonen), Zonenbeschreibung mit Lage, Bezugskante,
  Maß und Herkunft, sowie ein Typ für „an dieser Körperform nicht vermessen" mit Begründung.
- `packages/core/src/layout/zones.ts` — je Körperform belegt: 19 Körperformen und die 13
  Variantenzweige aus `profileFor()`, zusammen 32 Körperfassungen × 16 Zonen.
- `packages/core/src/layout/zones.test.ts` — Vollständigkeit, Herkunft je Maß, die festgenagelte
  Liste der 303 deklarierten Lücken.

Jede Zahl des Modells wird über `profileFor()` aus den Profilen **bezogen**, nicht kopiert.
Ausgenommen sind die sechs modulprivaten Konstanten aus `compose.ts`: sie sind wiederholt, weil
`compose.ts` sie nicht exportiert. Ein Quelltextscan im Test hält jede Wiederholung an ihrer
Deklaration fest. Der Umbau von `compose()` auf das Zonenmodell bleibt ein eigener Slice; der
einzige Eingriff dieser Entscheidung in `compose.ts` ist die eine Zeile der Fußzone (Punkt 2).

**Genau diese sechs Konstanten und zwei unvermessene Profilwerte waren der Gegenstand dieser
Notiz.** Sie sind heute Konstanten des Kompositionsmotors und gelten damit für **alle**
Körperformen gleich. Als Zonendatum könnten sie je Körperform verschieden sein — das ist die
Frage, und sie ist eine Eigentümerfrage, weil sie festlegt, was die Grammatik später überhaupt
unterscheiden kann.

## 2. Die acht strittigen Werte

| # | Wert | Heutiger Ort | Geltungsbereich heute | Messherkunft |
|---|---|---|---|---|
| 1 | `FOOT_TEXT_SIZE_MM = 4` | `core/src/compose.ts:78` | alle 19 Körperformen | **keine Messung.** Gespiegelt aus `placeHead`: `defaultAnchorMm 6 − HEAD_GAP_MM − HEAD_TOP_MARGIN_MM` am Rechteckkörper |
| 2 | Fußzone erbt `HEAD_GAP_MM` | vorher `core/src/compose.ts`, jetzt `FOOT_GAP_MM` in `profiles.ts:26` | alle 19 Körperformen | **keine eigene Messung.** Die 1 mm sind an C.1.1, C.1.2 und D.3.7 für die **Kopfzone** belegt |
| 3 | `CENTER_LABEL_BOX_MARGIN_MM = 1` / 28-mm-Box | `core/src/compose.ts:201` | alle Rechteckkörper | gemessen am weißen Innenfeld der Referenz (`rect` 2/7 bis 30/25) — aber nur am **Formationskörper** |
| 4 | `LABEL_SIDE_MARGIN_MM = 2` | `core/src/compose.ts:120` | alle 19 Körperformen | gemessen an E.1.1 bis E.1.16 (Tintenkanten 3,03 und 29,03) — nur am Formationskörper |
| 5 | `TOP_LEFT_LABEL_ANCHOR_FROM_BODY_LEFT_MM = 1.5` | `core/src/compose.ts:135` | alle Körperformen mit `topLeft`-Grundlinie | **zurückgerechnet, nicht abgelesen** (Rasterung 4096 px); vier der fünf F-a-Läufe, Ausreißer F.1.3 |
| 6 | `CENTER_LABEL_CAP_HEIGHT_MM = 4.87` / `BOTTOM_LABEL_CAP_HEIGHT_MM = 2.92` | `core/src/compose.ts:245–246` | alle Körperformen | gemessen an E.1.1 bis E.1.16, nur am Formationskörper |
| 7 | `rotatedSquareProfile.centerBaselineFromBodyBottomMm = 8` | `core/src/layout/profiles.ts:311–313` | `person` und die zwei I.5-Rauten | **unvermessen**, im Code so benannt: „keine Messung an dieser Körperform" |
| 8 | `circleBodyProfile.centerBaselineFromBodyBottomMm = 8` | `core/src/layout/profiles.ts:387–388` | `post`, `circle-12` und dessen drei Varianten | **unvermessen**, dito |

### 1 — `FOOT_TEXT_SIZE_MM = 4`

- **Option A (bleibt Konstante).** Ein Schriftgrad für alle Körperformen. Daran hängt: an Raute
  (`defaultAnchorMm` 1) und Kreiskörper (2) ragt die Fußbox über die Grundfläche hinaus. Das ist
  heute gewollt und erzeugt einen `outside-viewbox`-Befund statt einer lautlos verschwindenden
  Zone.
- **Option B (wird Zonendatum).** Je Körperform ein eigener Grad, gerechnet aus deren
  `defaultAnchorMm`. Daran hängt: für `person` und `post` ginge die Formel auf null oder negativ —
  Option B braucht also **zusätzlich** eine Entscheidung, was dort gilt, und verliert den
  Gate-Befund, der heute darauf hinweist.
- **Empfehlung des Koordinators:** A. Der Wert ist kein Messergebnis, sondern eine
  Platzrechnung; ihn je Körperform zu variieren, erzeugt sechs neue unvermessene Zahlen statt
  einer. Das Zonenmodell führt ihn deshalb heute als `foot / foot-text-size` mit der
  Herkunftsaussage „nicht an der Referenz abgelesen".
- **Entschieden am 21.09.2026: A.** Keine Codeänderung; der Wert bleibt Konstante in
  `compose.ts`.

### 2 — Die Fußzone erbt die Kopfzonenkonstante

- **Der Befund zuerst:** `footTopMm = bodyBoundsMm.maxY + HEAD_GAP_MM`. Die Fußzone rechnet mit
  der Konstante der Kopfzone. Ein eigener, an der Fußzone vermessener Abstand existiert im
  Repository nicht — auch nicht als Lücke benannt. Bis heute fällt das nicht auf, weil beide
  Zahlen 1 sind.
- **Option A (bleibt so).** Eine Konstante, zwei Bedeutungen. Daran hängt: wer `HEAD_GAP_MM`
  anfasst, verschiebt unbeabsichtigt jede Fußzeile.
- **Option B (eigenes Zonendatum `FOOT_GAP_MM`).** Gleicher Wert, eigener Name, eigene
  Herkunftsaussage — zunächst als **deklarierte Lücke** („nicht vermessen, übernimmt den Wert der
  Kopfzone").
- **Empfehlung des Koordinators:** B, und zwar unabhängig von allen übrigen Punkten. Es ist die
  billigste Änderung dieser Liste und die einzige, die einen stillen Kopplungsfehler beseitigt.
- **Entschieden am 21.09.2026: B — umgesetzt.** `FOOT_GAP_MM` steht in
  `core/src/layout/profiles.ts` neben `HEAD_GAP_MM`, trägt denselben Wert 1 und eine eigene
  Herkunftsaussage: **an der Fußzone nicht vermessen, Wert von der Kopfzone übernommen.**
  `compose()` rechnet die Fußzone seitdem mit `FOOT_GAP_MM`. Das Bild ändert sich nicht.
  `zones.test.ts` sichert drei Dinge: dass `compose.ts` die neue Konstante benutzt und die alte
  Zeile verschwunden ist, dass beide Werte heute gleich sind, und dass jede Körperform die
  Übernahme in ihrer Herkunftsaussage nennt. Ein Auseinanderlaufen ist damit eine bewusste
  Änderung und keine stille mehr.
- **Nebenbefund der Umsetzung, der den Punkt schärfer macht als die Vorlage:** Nach der Umstellung
  war `HEAD_GAP_MM` in `compose.ts` **unbenutzt**. Die Fußzone war dort seine einzige
  Verwendung — die Kopfzone rechnet damit in `placeHead()`, also in `profiles.ts`. Der
  Kopfzonenabstand wurde in `compose.ts` folglich ausschließlich für die Fußzone importiert.

### 3 — `CENTER_LABEL_BOX_MARGIN_MM = 1` und die 28-mm-Box

- **Geltungsbereich:** Die 1 mm sind am weißen Innenfeld der Referenz gemessen (`rect` 2/7 bis
  30/25 neben dem Körper 1/6 bis 31/26) — also am **Formationskörper**. Die 28 mm entstehen erst
  aus 30 mm Körperbreite minus zweimal 1 mm; sie sind eine Hüllengrenze, keine Referenzlaufgrenze
  (der längste mittige Lauf der Referenz ist `Log-MW` mit 25,13 mm).
- **Option A (bleibt Konstante).** Jeder Rechteckkörper bekommt 1 mm Rand. Daran hängt: am
  Anhänger (27 mm breit), am Wechselladerrumpf (24,5 mm) und am Hochkantrechteck (26 mm) ergibt
  dieselbe Marge eine andere Boxbreite — das ist heute unbemerkt und nirgends belegt.
- **Option B (wird Zonendatum `inner-field`).** Die Box folgt dem Innenfeld der jeweiligen
  Körperform. Daran hängt: das Innenfeld liegt für sechs Körperformen und eine Variante als
  Katalogzeichnung vor, aber **nur für `formation` als Hülle** (2/7 bis 30/25). Für die übrigen
  müsste die Hülle erst vermessen werden.
- **Empfehlung des Koordinators:** B, aber erst nach der Vermessung der übrigen Innenfelder. Bis
  dahin A mit der heutigen Herkunftsaussage. Dieser Punkt ist der teuerste der Liste und der
  einzige, der neue Messarbeit auslöst.
- **Entschieden am 21.09.2026: A bis zur Messung, danach B.** Keine Codeänderung heute. Die
  Vermessung der übrigen Innenfelder ist Voraussetzung und keine Nebenarbeit — sie gehört in ein
  eigenes Ticket, nicht in diesen Slice.

### 4 — `LABEL_SIDE_MARGIN_MM = 2`

- **Geltungsbereich:** an den **unteren** Läufen von E.1.1 bis E.1.16 gemessen, am
  Formationskörper. Gegen die Körperkante sind es 2 mm statt der 1 mm des Innenfelds; der
  sichtbare Abstand ist derselbe wie in der Referenz.
- **Option A (bleibt Konstante).** Daran hängt: die Zahl gilt heute auch an Raute und
  Kreiskörper, wo sie niemand nachgemessen hat.
- **Option B (wird Zonendatum je Körperform).** Daran hängt: für 18 der 19 Körperformen entstünde
  sofort eine deklarierte Lücke, und `compose()` müsste fail-closed abbrechen, wo es heute
  zeichnet. Das ist ein sichtbarer Funktionsverlust gegenüber heute.
- **Empfehlung des Koordinators:** A, mit der Herkunftsaussage im Zonendatum statt einer
  Verhaltensänderung. Die 2 mm sind ein **belegter** Wert mit engem Geltungsbereich, nicht eine
  erfundene Zahl; ihn fail-closed zu machen, kostet mehr, als er an Risiko trägt.
- **Entschieden am 21.09.2026: A.** Keine Codeänderung; der enge Geltungsbereich steht im
  Zonenmodell.

### 5 — `TOP_LEFT_LABEL_ANCHOR_FROM_BODY_LEFT_MM = 1.5`

- **Geltungsbereich:** an fünf F-a-Läufen der **Formation** zurückgerechnet (die linke Tintenkante
  ist an einer in Kurven umgewandelten Schrift nicht ablesbar). Vier der fünf treffen 2,5 mm;
  Ausreißer ist F.1.3. Benutzt wird die Zahl heute zusätzlich von `vehicle-land` (allen drei
  Varianten), von `vehicle-air/fixed-wing-hull` und von `circle-12` (beiden Kreisfassungen) —
  **ohne eigene Rückrechnung an diesen Körperformen**.
- **Option A (bleibt Konstante).** Daran hängt: eine zurückgerechnete Zahl gilt an sechs
  Körperfassungen, an denen sie nicht geprüft wurde.
- **Option B (wird Zonendatum neben `topLeftBaselineFromBodyTopMm`).** Die Grundlinie dieser Zone
  ist bereits ein Profilwert; der Anker gehörte daneben. Daran hängt: für die fünf übernommenen
  Fassungen wäre die Rückrechnung zu wiederholen oder die Lücke zu deklarieren.
- **Empfehlung des Koordinators:** B. Diese Zone führt ihre senkrechte Lage schon je Körperform;
  dass die waagerechte global ist, ist eine Inkonsistenz ohne Begründung. Der Aufwand ist gering,
  weil die Zone ohnehin nur an sechs Fassungen belegt ist.
- **Entschieden am 21.09.2026: B — beschlossen, Umsetzung im Umstellungsslice.** Bewusst **nicht**
  jetzt, und der Grund ist inhaltlich: Option B verlangt laut dieser Notiz „die Rückrechnung zu
  wiederholen oder die Lücke zu deklarieren". Die Rückrechnung braucht die Rasterung der
  Referenz und ist hier nicht durchführbar; die Lücke zu deklarieren würde `compose()` dort
  abbrechen lassen, wo es heute zeichnet — ein sichtbarer Funktionsverlust. Die Zahl mit dem
  Vermerk „übernommen, hier nicht zurückgerechnet" nach `profiles.ts` zu schieben, brächte nur
  Sichtbarkeit und keinen Beleg, und zwar um den Preis eines Eingriffs in genau die Datei, die
  dieser Slice unberührt lassen soll. Der Anker wandert deshalb zusammen mit der Umstellung von
  `compose()` — dort ist die Rückrechnung ohnehin fällig.

### 6 — Die beiden Versalhöhen 4,87 und 2,92

- **Geltungsbereich:** E.1.1 bis E.1.16 am Formationskörper. Der Schriftgrad ist daraus über
  `ARIMO_CAP_HEIGHT_FRACTION` abgeleitet und nicht gewählt — an der Referenz ist die Versalhöhe
  ablesbar, der Schriftgrad nicht.
- **Option A (bleibt Konstante).** Daran hängt: Anhang E.2 setzt seine mittigen Kürzel
  nachweislich **nicht** durchgehend im Normgrad (neun von 30 Läufen kleiner, ohne ableitbare
  Auslöseregel). Der Katalog trägt diese Fälle heute je Zeichen als `centerCapHeightMm`.
- **Option B (wird Zonendatum je Körperform).** Daran hängt: die Abweichungen sind je **Zeichen**
  gemessen, nicht je Körperform — ein Zonendatum träfe die falsche Ebene.
- **Empfehlung des Koordinators:** A. Hier ist die je-Zeichen-Ausnahme bereits die richtige
  Bauart; ein Zonendatum würde sie verdecken.
- **Entschieden am 21.09.2026: A.** Keine Codeänderung.

### 7 und 8 — Die zwei unvermessenen Achten

- **Der Befund:** `rotated-square-body` und `circle-body` tragen `centerBaselineFromBodyBottomMm:
  8` mit dem ausdrücklichen Kommentar, dass dies **keine Messung an dieser Körperform** ist. Kein
  Zeichen des Bestands beschriftet eine Raute oder einen Kreiskörper mittig.
- **Option A (bleibt Profilwert).** Daran hängt: ein Aufrufer, der die Zone benutzt, bekommt
  stillschweigend eine geratene Lage. Das Zonenmodell schließt das heute aus, indem es
  `label-center` für alle acht betroffenen Körperfassungen als **Lücke** führt — der Profilwert
  bleibt unberührt, wird aber nicht zum Zonendatum erhoben.
- **Option B (die 8 verschwindet, `compose()` wirft).** Daran hängt: `LayoutProfile` müsste
  `centerBaselineFromBodyBottomMm` optional machen, und jeder Leser des Felds bräuchte einen
  Zweig für „nicht vermessen". Das ist ein Eingriff in `compose.ts` und gehört in den Slice, der
  `compose()` auf das Zonenmodell umstellt.
- **Empfehlung des Koordinators:** A jetzt, B im Umstellungsslice. Die Lücke ist im Zonenmodell
  bereits deklariert und festgenagelt; ein zweiter Eingriff in `profiles.ts` brächte heute kein
  zusätzliches Sicherheitsnetz.
- **Entschieden am 21.09.2026: A jetzt, B im Umstellungsslice.** Keine Codeänderung heute.

## 3. Abweichungen zwischen den Körperformen, die beim Bauen aufgefallen sind

Alle Punkte sind Befunde am Bestand, keine Vorschläge.

1. **Die Fußzone hat keinen eigenen Abstand** (siehe Punkt 2 oben). Der einzige Fall im
   Repository, in dem zwei Zonen sich eine Konstante teilen, ohne dass es irgendwo steht.
2. **`vehicle-land/plain-wheel-pair` trägt zwei widersprüchliche obere Grundlinien.**
   `topLeftBaselineFromBodyTopMm` bleibt die vom Landfahrzeug geerbte 6,75; `topLeftLines`
   beginnen aber bei 5,79 (F.2.8). Ein einzeiliger Lauf säße an dieser Fassung 0,96 mm tiefer als
   die erste Zeile eines zweizeiligen. Vermutlich unbeabsichtigt, aber nicht belegt — deshalb
   bildet das Zonenmodell beide Zahlen ab, statt eine davon zu bevorzugen. **Am 21.09.2026 als
   LFH-597 erfasst**, nicht entschieden: beide Zahlen wählen hieße raten, solange die einzeilige
   Grundlinie an dieser Fassung nicht nachgemessen ist.
3. **Vier Zahlen ohne jede Herkunftsaussage am Fundort.** `fixedWingVehicleAirProfile` trägt
   `topLeftBaselineFromBodyTopMm: 7`, `aboveLeftBaselineFromBodyTopMm: -1`,
   `aboveLeftAnchorFromBodyLeftMm: -0.01`, `requiresTopLeftMetrics` und eine `measuredBodyBoundsMm`
   ohne einen einzigen Kommentar. Kein Abschnitt, kein Messdatum.
4. **Dasselbe bei `raisedCircleOneMmProfile`**: Grundlinie 4 und die Anker −3/+3 der
   Oberflächenläufe stehen ohne Kommentar.
5. **`circleBodyProfile.defaultAnchorMm = 2` ist unbelegt** — folgenlos, weil `place()` für jeden
   Kreiskörper mit Kopfzone wirft, aber unbelegt.
   Die Punkte 3 bis 5 stehen im Zonenmodell mit dem Präfix „Ohne Herkunftsaussage am Fundort" und
   sind im Test als Liste festgenagelt (13 Maße). Die Liste soll schrumpfen, wenn jemand nachmisst.
6. **Das Innenfeld ist für fünf der sechs Körperformen keine Hülle.** `innerField()` liefert für
   `formation`, `building`, `upright-rectangle`, `vehicle-land`, `trailer`,
   `swap-loader-vehicle` und `vehicle-water/raised-hull` eine Zeichnung, aber nur für `formation`
   ist die Hülle als Zahl bekannt (2/7 bis 30/25). **Damit hat die Fähigkeitsbox außerhalb der
   Formation keinen Bezugsrahmen** — genau die offene Frage aus §6 der Notiz vom 19. September.
7. **Die Fahrwerkszone gibt es an drei von 19 Körperformen.** Für die übrigen 16 ist das ein
   gemessenes Negativ mit eigener Regelkennung (`vehicle-category-requires-vehicle`), kein offener
   Platz.
8. **Die Kopfzone fehlt an acht Körperfassungen als gemessenes Negativ**, aus zwei ganz
   verschiedenen Gründen: am Kreiskörper wegen der 661-Dateien-Zählung (109 Marken im
   Kopfzonenraster, 36 Kreiskörper, Schnittmenge leer), an `trailer`, `swap-loader-vehicle` und
   `upright-rectangle`, weil kein Zeichen des Anhangs E.2 überhaupt eine Kopfzone trägt.
9. **`formation/foot-band` erbt die obere Grundlinie, verwirft aber die vermessene Hülle.** Das
   gebänderte Profil setzt `measuredBodyBoundsMm: undefined` und behält
   `topLeftBaselineFromBodyTopMm: 5`. Beides kann richtig sein; zusammen steht es nirgends
   begründet.
10. **Die Tendenz ist im Repository keine eigene Achse.** `tendency-rising`,
    `tendency-unchanged` und `tendency-falling` stehen als drei Werte **innerhalb** von
    `STATE_IDS`, also als Zustände. Das Zonenmodell führt `state-margin` und `tendency-margin`
    getrennt, wie die Systematik sie nennt, deklariert beide als unvermessen und hält in der
    Lückenbegründung fest, dass die Trennung heute keine Entsprechung in den Daten hat. **Ob die
    Tendenz eine eigene Randlage bekommt oder eine Lage der Zustandsrandlage bleibt, ist eine
    offene Fachfrage** und wird hier nicht entschieden.
11. **Kapitel 5.8 ist an keiner Kombination vermessen.** Die Lücke trägt deshalb `scope: 'value'`
    und nicht `'combination'`: eine andere Grundzeichenart hilft nicht. Alle übrigen Lücken des
    Modells sind `'combination'`.

## 4. Bekannte Grenze des heutigen Modells

`zonesFor(kind, variant)` erbt das Rückfallverhalten von `profileFor()`: Eine Variante, die es an
dieser Körperform gar nicht gibt — etwa `trailer` / `foot-band` —, liefert stillschweigend das
Modell der Körperform ohne Variante. Der Katalog lehnt genau das ab: `baseDrawing()` wirft dort
einen `NotMeasuredError`, weil „die Verwechslung sonst unsichtbar bliebe".

Das Modell ist darin mit sich selbst uneins. Die Zone `inner-field` bildet die Variantensemantik
korrekt ab (ist eine Variante angegeben, zählt nur die Variantentabelle); die übrigen 15 Zonen
folgen dem Profil und damit dessen Rückfall. Ein Abbruch für unbelegte Paare gehört in den Slice,
der `profileFor()` an das Zonenmodell bindet — er ändert das Verhalten von `compose()` und ist
deshalb hier bewusst nicht vorgenommen. Bis dahin ist die Grenze in `zones.test.ts` als solche
festgehalten, nicht als gewolltes Verhalten gebilligt.

## 5. Umsetzungsstand am 21. September 2026

| # | Wert | Entscheidung | Im Code |
|---|---|---|---|
| 1 | `FOOT_TEXT_SIZE_MM` | A — bleibt Konstante | unverändert |
| 2 | Fußzonenabstand | B | **umgesetzt**: `FOOT_GAP_MM` in `profiles.ts`, benutzt in `compose.ts`, drei Gates in `zones.test.ts` |
| 3 | 28-mm-Box | A bis zur Messung, danach B | unverändert; Messung als eigenes Ticket |
| 4 | `LABEL_SIDE_MARGIN_MM` | A | unverändert |
| 5 | Anker oben links | B, im Umstellungsslice | unverändert; Begründung der Verschiebung siehe §2 Punkt 5 |
| 6 | Die zwei Versalhöhen | A | unverändert |
| 7 | Raute, mittige Grundlinie | A jetzt, B im Umstellungsslice | unverändert; Lücke im Zonenmodell deklariert |
| 8 | Kreiskörper, mittige Grundlinie | A jetzt, B im Umstellungsslice | unverändert; Lücke im Zonenmodell deklariert |

Sechs der acht Werte bleiben damit, was sie waren — der Gewinn dieser Notiz liegt nicht in
Codeänderungen, sondern darin, dass ihr Geltungsbereich und ihre Messherkunft jetzt als
Zonendatum sichtbar sind statt als Zahl im Motor. Zwei Werte ändern sich, einer davon sofort.

**Aus Abschnitt 3 ist ein Ticket geworden:** Befund 2 (`vehicle-land/plain-wheel-pair` trägt zwei
obere Grundlinien, 0,96 mm auseinander) ist nicht entschieden worden, weil keine der beiden
Zahlen belegt ist und die Referenz hier nicht nachgemessen werden konnte. Eine Zahl zu wählen
hieße raten. Der Widerspruch ist als **LFH-597** auf der Liste „Einsatzzeichen" erfasst.

## 6. Was diese Notiz nicht entscheidet

- Die Umstellung von `compose()` auf das Zonenmodell. Das Modell entsteht **neben** `compose.ts`
  und `layout/profiles.ts`, nicht als deren Umbau. Der einzige Eingriff dieser Entscheidung ist
  der getrennte Fußzonenabstand aus Punkt 2 — eine Konstante und eine Zeile, ohne Änderung am
  Bild.
- Die Vermessung der Randlagen für Zustand und Tendenz. Sie bleiben deklarierte Lücken.
- Die Radienfrage zwischen 12 und 14 mm am Kreiskörper (eigenes Ticket, siehe `profiles.ts`).
- Ob `LayoutProfileId` (`rect-body` / `rotated-square-body` / `circle-body`) neben dem Zonenmodell
  bestehen bleibt. Es beschreibt nur Platzierungsverhalten und sagt das selbst; das Zonenmodell
  tritt daneben, nicht an seine Stelle.
