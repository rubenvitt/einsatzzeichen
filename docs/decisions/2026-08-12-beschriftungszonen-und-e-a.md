# Anhang E braucht eine Zone, die es nicht gab — Beschriftungen im Körper

> Entscheidungsnotiz · 12. August 2026 · Teilslice E-a (LFH-440)

## 1. Die Aufgabe rechnete mit einem Mechanismus, den sie nicht meinte

LFH-440 beschreibt die Bauart der 16 Zeichen so: „Grundzeichen `formation`, Körperfarbe `blau`,
Kopfzone aus `strengths.ts`, Kürzel über das Textprimitiv, **Fußzone `THW`**" und schließt: „Alle
Mechanismen stehen. Kein Schema- und kein Renderer-Schritt erwartet."

Die Vermessung der 16 Referenzdateien widerlegt die zweite Hälfte davon. **Anhang E setzt keinen
einzigen Textlauf unterhalb des Körpers.** Alle drei Läufe liegen *im* Körper, weiß auf der
Organisationsfarbe:

| Zone | Grundlinie | Versalhöhe | waagerechte Lage | belegt in |
|---|---|---|---|---|
| Kürzel | 18,00 mm | 4,87 mm | Mitte bei x = 16,00 | allen 16 |
| Zusatzkennzeichnung | 24,00 mm | 2,92 mm | linke Kante bei x = 3,03 | 7 von 16 |
| Trägerkürzel `THW` | 24,00 mm | 2,92 mm | rechte Kante bei x = 29,03 | allen 16 |

Alle Werte sind über alle 16 Dateien auf zwei Nachkommastellen identisch (Körperhülle 1/6 bis
31/26 mm). Was `compose()` bis heute konnte, ist etwas anderes: **einen** Lauf, `role: 'foot'`,
**unterhalb** des Körpers, schwarz auf der Ausgabeoberfläche, aus `SymbolSpec.designation` — der
Mechanismus des Slice vom 9. August. „Fußzone `THW`" in der Aufgabenbeschreibung bezeichnet die
Lage im Bild („unten im Zeichen"), nicht diesen Mechanismus.

**Die Aufgabe hatte trotzdem zur Hälfte recht:** ein Renderer-Schritt war tatsächlich nicht nötig.
Das Textprimitiv steht, `svg.ts` und `canvas.ts` geben es aus, und alle vier Gates haben ihre
Textzweige seit dem 9. August. Gefehlt haben genau zwei Dinge: Felder am `SymbolSpec` und die
Platzierungsregel in `compose()`.

## 2. Warum eine Layoutregel und nicht 16 platzierte Texte

Dass alle 16 Zeichen dieselben Zonenwerte tragen, ist der Grund, das als Mechanismus zu bauen und
nicht als 16-mal wiederholte Handarbeit. Die Zonen sind wie `placeHead` und die Fußzone gegen die
Hülle des **tatsächlich platzierten** Körpers gerechnet, nicht gegen absolute Koordinaten:
verschiebt eine Kopfzone den Körper, wandern die Beschriftungen mit. In E-a tritt dieser Fall
nicht ein — alle 15 Kopfzonen sind Reihen (`gruppe`), und die verschieben den Rechteckkörper
nicht —, aber die Regel ist dieselbe, die auch bei einem Stapel greifen würde.

Zwei Alternativen wurden verworfen:

**Die 16 als Piktogramme führen.** Ein Standalone-Piktogramm darf beliebige Primitive setzen,
einschließlich Text; K, L, M und J sind so gebaut. Für E hätte das bedeutet, Körper und Kopfzone
15-mal von Hand nachzuzeichnen — eine Kopfzone, die `strengths.ts` bereits als vermessenes Element
führt und deren Referenzbeleg ausgerechnet `E.1.18` ist (`elements.ts`). Und es hätte den
Fingerprint-Vergleich verloren: `matchFingerprint` vergleicht ausschließlich `role: 'body'`, das
ein Piktogramm nicht hat.

**`designation` umdeuten.** Das mittige Kürzel ist keine Fußzone unter anderem Namen: andere Lage,
andere Farbe, anderer Bezugspunkt. Der Slice vom 9. August ist eine ausdrückliche Entscheidung mit
Rasterevidenz dahinter; sie umzuwidmen hätte einen Mechanismus zerstört, um einen zweiten zu
sparen. `designation` und die Fußzone bleiben unverändert — und in E.1 unbenutzt. Ein Test hält
fest, dass keines der 16 Zeichen einen `foot`-Lauf trägt.

## 3. Was dazugekommen ist

**Schema.** `BodyLabels` mit `center`, `bottomLeft`, `bottomRight` und `SymbolSpec.labels`. Die
Zonen sind **nach ihrer Lage benannt, nicht nach einer Bedeutung** — vermessen ist die Position.
Dass Anhang E dort Einheitskürzel, Zusatzkennzeichnung und Trägerkürzel führt, steht im Kommentar
als Beobachtung an diesem Anhang, nicht als Typzusicherung. Dazu `PrimitiveRole` `'label'`, von
`'foot'` unterschieden: innen auf der Körperfläche statt außen unter ihr. `'innerField'` bleibt
weiter unbelegt; es bezeichnet die Fläche, nicht ihre Beschriftung.

**Textmetrik.** `verticalTextBoxMm` kannte bisher nur `baseline: 'hanging'` und warf für alles
andere — mit der ausdrücklichen Begründung, `alphabetic` brauche eine eigene Messreihe. Diese
Messreihe ist jetzt geführt: `ALPHABETIC_ASCENT_FRACTION` = 0,86 und
`ALPHABETIC_DESCENT_FRACTION` = 0,212, gemessen wie der Hanging-Zuschlag über die Ink-Hülle
gerasterter Läufe an beiden Schriftgraden dieses Slice.

| | asymptotisch (1024–4096 px) | bindend bei 8 px/mm | gesetzt | bindender Fall |
|---|---|---|---|---|
| über der Grundlinie | 0,838 | 0,8563 | 0,86 | „Öl" — der Umlautpunkt |
| unter der Grundlinie | 0,208 | 0,21186 | 0,212 | „Sp" — die Unterlänge |

Der Wert nach unten trifft dabei auf drei Nachkommastellen Arimos deklarierten hhea-Descender
(434/2048 = 0,21191). Das ist ein Befund der Messung, keine Übernahme der Tabelle — der Wert nach
oben liegt deutlich **unter** dem hhea-Ascender (0,9053), die Box ist also enger als die
Zeilenmetrik der Schrift.

`alphabetic` und nicht `hanging`, weil die Referenz an ihren **Grundlinien** vermessen ist: 18,00
und 24,00 in jeder der 16 Dateien. Jede andere Baseline hätte diese Messung erst über eine zweite
Metrik umrechnen müssen. `middle` bleibt ungemessen und wirft weiterhin.

**Schriftgrad statt Versalhöhe.** An der Referenz ist die Versalhöhe ablesbar, der Schriftgrad
nicht — die Kürzel liegen dort in Kurven umgewandelt vor, ohne Fontbindung. `compose()` rechnet
deshalb über `ARIMO_CAP_HEIGHT_FRACTION` (1409/2048, aus der Schriftdatei gelesen und gegen die
Rasterung geprüft) von den gemessenen 4,87 mm und 2,92 mm auf 7,08 mm und 4,24 mm. Ein direkt
hingeschriebener Schriftgrad wäre eine geratene Zahl, die zufällig ähnlich aussieht.

**Untere Einsatzgrenze.** Beide Schriftgrade unterschreiten `MINIMUM_TEXT_RENDER_PX` unterhalb von
37 px bzw. 61 px; jeder Lauf trägt seinen gerechneten Wert als `minRenderPx`. Auf der
Snapshot-Leiter heißt das: erst ab 64 px lesbar. Das ist eine deklarierte Aussage über die Zeichen,
kein Freibrief — die Größen stammen aus der Vermessung, nicht aus einer Platzabwägung.

## 4. Der Farbbefund: `blau` war in beiden Alternativthemes 0,07 zu hell

Die 16 Zeichen sind die ersten des Katalogs, die **weißen** Text auf die Organisationsfarbe
setzen. Damit gilt für diese Paarung `MINIMUM_TEXT_CONTRAST` (4,5:1) statt der 3:1 für grafische
Objekte — und beide Alternativthemes haben sie knapp verfehlt:

| Theme | vorher | weiß auf blau | nachher | weiß auf blau | schwarz auf blau |
|---|---|---|---|---|---|
| `accessible-light` | `#4a73d9` | 4,425:1 ✗ | `#4970d2` | 4,63:1 ✓ | 4,53:1 ✓ |
| `print-monochrome` | `#777777` | 4,478:1 ✗ | `#767676` | 4,54:1 ✓ | 4,62:1 ✓ |

Beide alten Werte waren allein auf **schwarzen** Ink hin gewählt (der Härtungsslice vom 6. August
nennt für `accessible-light` ausdrücklich „rund 4,75:1 zu Schwarz"). Solange kein Zeichen weiße
Schrift auf die Körperfarbe setzte, stellte niemand die andere Richtung.

Beide Richtungen zugleich lassen nur ein schmales Fenster: Weiß ≥ 4,5:1 verlangt eine
Relativluminanz ≤ 0,1833, Schwarz ≥ 3:1 eine ≥ 0,1. Beim Drucktheme kommt eine dritte Bedingung
hinzu — der geforderte Helligkeitsabstand von mehr als 0,045 zwischen den Organisationsgrauwerten.
`#767676` hält ihn mit 0,0483 zur Feuerwehr (`#666666`) ein; das ist der knappste der sechs
Abstände und der Grund, nicht weiter abzudunkeln. Der zweite visuelle Kanal — die Kontursignatur
je Organisation — trägt diese Unterscheidung ohnehin unabhängig von der Helligkeit.

Derselbe Befundtyp wie `hellblau` bei D.4: eine neue Zeichenklasse deckt eine Farbanforderung auf,
die vorher niemand stellte. Und derselbe Umgang: behoben statt umgangen.

**Der Vertrag steht jetzt maschinell.** `labelContrastRequirements()` leitet aus dem Rezeptbestand
ab, welche Organisationen Beschriftungen im Körper führen, und verlangt für jede „weiß auf ihrer
Körperfarbe" mit der Textschwelle. Ein Piktogramm deklariert seine Paare selbst; eine Komposition
kann das nicht, weil ihre Farben erst beim Zusammensetzen entstehen. Ohne diese Ableitung wäre der
weiße Text der einzige Ink im Katalog ohne Kontrastvertrag gewesen.

## 5. Was der Katalog jetzt behauptet — und was nicht

16 neue Manifestzeilen als `composition-recipe`, Umfang **abschnittsweise** `E.1.1` bis `E.1.16`
und ausdrücklich **nicht** `E.1`: E-a deckt 16 der 37 E.1-Abschnitte ab. `E.1` würde das Gate
bestehen — `uncoveredScope` prüft nur, ob zu jedem Präfix mindestens eine Zeile existiert, nicht
die Vollständigkeit — und wäre genau deshalb eine Behauptung, die kein Gate widerlegt. Sobald E-b
(LFH-441) und E-c (LFH-442) gelandet sind, treten die 16 Zeilen an `E.1` zurück.

Zwei Referenzdateien tragen eine zu kurze blaue Füllfläche (`E.1.6`: 3 mm, `E.1.14`: 2,5 mm) mit
entsprechend nach oben verschobener Beschriftung, bei normalem Rahmen und normaler Kopfzone. Der
Katalog baut beide wie die 14 fehlerfreien; der Befund steht in der `note` des technischen Reviews
ihrer Manifestzeilen — nicht als `deviation`, denn der Status bezeichnet eine bewusste Abweichung
der Umsetzung von ihrer Quelle, und hier weicht die Quelle von sich selbst ab. Dieselbe Einordnung
wie bei den beiden Farbbefunden aus D.4. Das Fingerprint-Gate hätte den Fehler nie gefunden: es
vergleicht die `ring`-Form, und die ist in allen 16 Dateien gleich.

**Keine fachliche Freigabe.** Alle 16 Zeichen sind `domain: pending`, und bei ihnen wiegt das
schwerer als sonst: ihre gesamte fachliche Unterscheidung liegt in einem Buchstabenkürzel, das am
Referenzbild abgelesen wurde. Ohne sein Kürzel ist E.1.1 von E.1.7 nicht zu unterscheiden.

## 6. Evidenz

Gemessen am 12. August 2026 auf `claude/lfh-440-3253b1`:

- `pnpm typecheck`: sauber.
- `pnpm test`: **58 Testdateien / 2966 Tests grün**, keine übersprungenen Tests (vorher 2922).
- `pnpm cli coverage`: `Einträge: 292` (vorher 276), `Quellen: 13`, `Offene fachliche Reviews: 306`
  (292 Manifest-, 13 Quellen-, 1 Profilreview), Coverage-Gate bestanden, `0 Kapitel im
  beanspruchten Umfang ohne Eintrag`.
- `git diff --check`: sauber.
- Fingerprint-Gate: alle 16 reproduzieren ihre Referenz mit Differenz 0 an allen vier Kanten.
- Rasterprüfung `fonts.test.ts`: für alle 16 Kürzelsätze, jeden Lauf einzeln isoliert,
  `outsideBoxCount: 0` bei nicht leerer Tinte.
- Sichtprüfung aller 16 gegen die Referenz: `docs/reviews/2026-08-12-e-a-visual-qa.md`.

## 7. Offene Kanten

- **Kein Lesbarkeits-Gate über Kompositionen.** `checkTextLegibility` läuft heute nur über
  Piktogrammdefinitionen. Die 16 Zeichen tragen ihr `minRenderPx` korrekt, aber nichts prüft es.
  Für die Piktogramme mit Kürzeln aus Anhang J tut es das — die Lücke ist die Kompositionsseite.
- **Nichts prüft, ob eine Beschriftungsbox im Körper liegt.** Die Rasterprüfung belegt Tinte ⊂ Box;
  dass Box ⊂ Körper gilt, folgt hier aus der Vermessung und nicht aus einem Gate. Ein Kürzel, dessen
  Box über die Körperkante hinausreichte, würde weder vom Clipping- noch vom viewBox-Gate gemeldet,
  solange es innerhalb der viewBox bleibt. Geschwisterlücke zur fehlenden Lesbarkeitsprüfung oben.
- **Kein allgemeines Textmetrik-Gate.** Unverändert die Lücke aus Abschnitt 2 des Slice vom
  9. August: `boxMm` bleibt bei Text eine Zusicherung. Die Rasterprüfungen decken die konkret
  geprüften Fälle ab — jetzt einschließlich aller 16 Kürzelsätze —, sind aber kein Gate, das jede
  künftige Textverwendung automatisch vermisst.
- **Das weiße Innenfeld der Referenz** bildet der Katalog weiterhin nicht ab (siehe
  Sichtprüfungsbericht, Abschnitt 5). Das ist keine Eigenschaft dieses Teilslice, sondern von
  `base-symbols.ts`, und trifft C.1.1/C.1.2 genauso.
- **E-b und E-c** (LFH-441, LFH-442) bauen auf demselben Mechanismus und brauchen keinen weiteren
  Schema- oder Kernschritt — mit einer Einschränkung: E-b enthält laut Zuschnitt drei Zeichen mit
  Zusatzgeometrie (E.1.18, E.1.19, E.1.24), die dieser Teilslice nicht berührt hat.

> **Nachtrag vom 17. August 2026 (Teilslice E-b, LFH-441).** Drei Angaben dieser Notiz sind
> nachzuziehen:
>
> 1. Die aus dem Zuschnitt übernommene Zahl **drei** Zeichen mit Zusatzgeometrie ist falsch. E.1.18
>    trägt keine: nur Rahmenpfad, eine deckungsgleiche Rahmendublette (Differenz 0,00035 mm) und
>    eine gewöhnliche `zug`-Kopfreihe. Es sind **zwei** — E.1.19 und E.1.24.
> 2. Die Einschätzung „brauchen keinen weiteren Schema- oder Kernschritt" hat für E-b **nicht**
>    gehalten, allerdings aus einem anderen Grund als der Zusatzgeometrie: `Log-MW` (E.1.26)
>    braucht in Arimo 26,156 mm, wo die Beschriftungsbox 26,000 mm breit war. Die Box des mittigen
>    Laufs rechnet seit E-b mit einer eigenen Marge von 1 mm (28 mm statt 26 mm); die Anker der
>    unteren Läufe sind unverändert. Die 16 Zeichen dieses Slice sind davon im Bild unberührt.
> 3. Abschnitt 5: E-a deckte 16 der 37 E.1-Abschnitte ab, mit E-b sind es **28**. Nur E-c
>    (LFH-442) fehlt noch, bevor die Einzelabschnitte an `E.1` zurücktreten.
>
> Die Messung und die Begründung stehen in
> [`2026-08-17-anhang-e-b.md`](./2026-08-17-anhang-e-b.md). Die Aussagen bleiben hier stehen, damit
> sichtbar ist, dass der Folgeslice sie berichtigt hat.

## 8. Reviewgrenze

Diese Notiz trifft **keine fachliche Aussage** über Anhang E. Sie hält fest, wie die 16 Zeichen
gebaut sind und welche Mechanismen dafür entstanden sind. Bedeutung, Verwechslungsfreiheit und
einsatztaktische Eignung bleiben — wie die 306 offenen Fachreviews insgesamt — einer entsprechend
fachkundigen Person vorbehalten.
