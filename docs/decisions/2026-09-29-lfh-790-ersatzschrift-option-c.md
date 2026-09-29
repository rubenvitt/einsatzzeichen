# LFH-790: Ersatzschrift näher an der Referenz (Option C) — Entscheidungsvorlage

> Stand: 29. September 2026
> Status: **Offen. Die Entscheidung liegt beim Projektinhaber.**
> Bezug: `docs/decisions/2026-09-29-lfh-585-ersatzschrift-und-kursiv.md` (Option C, §7 und §8),
> `docs/reviews/2026-09-29-lfh-585-schriftmessung.md` (Messung der Kandidaten); Parent LFH-582
> Diese Notiz ändert keinen Code und keine Schriftdatei. Neu geladen wurde nichts. Die Messwerte
> stammen aus der Schriftmessung, eine Abschätzung (Abschnitt 3.2) aus der dort schon geladenen
> Plex-Datei.

## Kurzfassung

Zu entscheiden sind vier Fragen. Die ersten beiden bestimmen den Aufwand, die dritte die Güte, die
vierte folgt daraus.

1. **Jetzt oder nach dem Fachreview?**
   - LFH-585 hatte empfohlen, C erst anzugehen, wenn das Fachreview nach B weiter „falsche
     Schrift" meldet (§8.5).
   - Am 29.09. wurde C als eigene Aufgabe angelegt, aber noch nicht beauftragt.
   - **Vorschlag:** die Familie jetzt festlegen und den Umbau nach dem erneuten Fachreview
     beginnen. Kommt das Review ohne Schriftbefund zurück, bleibt C liegen.
2. **Welche Familie?**
   - Die Messung kehrt die Vorliebe aus LFH-585 §8.5 um: Dort hießen die bevorzugten Kandidaten
     „ohne reservierten Namen (Fira Sans, Open Sans)". Beide treffen die Formen schlecht (Open
     Sans 1 von 3) oder die Strichstärke nicht (Fira Sans Medium 22 % zu kräftig).
   - Am besten passt **IBM Plex Sans**: alle drei Formmerkmale, mit geeichter Breite 2,7–2,8 %
     Laufweitenfehler statt 10,7 %.
   - **Vorschlag:** IBM Plex Sans.
3. **Umbenennen oder Originaldateien?**
   - Der reservierte Name „Plex" bindet nur *veränderte* Fassungen.
   - **Weg R** leitet ab und benennt um: Teilmenge, geeichte Breite, eigener Familienname.
   - **Weg U** nimmt unveränderte Originaldateien und behält den Namen: keine Teilmenge, keine
     Eichung. Bei Plex hieße das **IBM Plex Sans Condensed**, nach Abschätzung rund 4,7 % zu
     schmal. Bei Source Sans 3 verliert Weg U nichts, weil die Familie ohnehin keine Breitenachse
     hat.
   - **Vorschlag:** Weg R, Plex in Stufe 500 und Breite um 87 unter eigenem Namen. Das Ergebnis
     ist das genaueste, der Weg ist derselbe wie heute bei Arimo.
4. **Versionssprung.** Jeder Weg ändert das `font-family` in jedem SVG mit Text und den
   exportierten Namen `ARIMO_CAP_HEIGHT_FRACTION`. C ist ein **Major-Release (3.0.0)**.

Vor dem Umbau stehen Prüfungen aus (Abschnitt 7):

- Download nötig: die Kursive von Plex (Neigung, Breite, g) und, falls Weg U, die Originaldateien
  von Plex Condensed;
- ohne Download möglich: bei Weg R die Wahl der Datei durch resvg und der Formvergleich aufrecht.
  Die variable Plex-Datei aus der Schriftmessung genügt dafür.

## 1. Anlass und Auftrag

LFH-585 hat Option B umgesetzt: Arimo in der statischen Stufe 500. B trifft die Strichstärke (3 %),
nicht die Laufweite. Ein Lauf ist im Median 10,7 % breiter als in der Referenz.

Zwei Zählweisen kommen vor:

- **21 Läufe im Katalog** waren vor B verkleinert (LFH-585 §3.4). Davon sind 8 zurückgewachsen,
  sieben in §10.4 und das große „DMO" per Nachtrag. Es bleiben **13**. Neu verkleinert sind die drei
  Läufe „Strömungsrettung" (I.1.17, I.1.18, I.2.6).
- **17 verschiedene Läufe** zählt die Schriftmessung, weil wortgleiche Läufe nur einmal zählen. Auf
  diese Basis beziehen sich alle Angaben „x von 17" unten. Sie schätzen, wie viele in die Tinte
  passen würden, die Arimo dort vor B belegte. Gegen diese Tinte kehrt mit B keiner zurück; die acht
  sind über ihre Boxen gewachsen.

LFH-790 verlangt:

- einen Kandidaten wählen, unter Berücksichtigung der Umbenennung wegen des reservierten Namens,
  des `font-family` in allen SVGs und der Lizenz;
- danach den vollen Umbau planen: Metriken, alle Textläufe, `boxMm`, Gates, Snapshots.

Diese Notiz bereitet die Wahl vor. Der Umbauplan folgt nach der Wahl, für den gewählten Weg. Den
Umfang, den jeder Weg hat, nennt Abschnitt 5.

## 2. Die Kandidaten, nach der Messung

Aus der Schriftmessung, Abschnitt 3 und 5. Gemessen wurde die Stufe, deren Strichstärke der
Referenz am nächsten kommt. **|1−r|** ist der Median der Abweichung der Laufweite je Lauf.
**Verkleinerte Läufe** zählt, wie viele der 17 in voller Referenzgröße in die Tinte passen, die
Arimo dort heute belegt. Die Zahl ist eine untere Grenze.

| Schrift und Stufe | Strich (Ref. 0,156) | Laufweite (Median) | \|1−r\| | x-Höhe (Ref. 0,700) | Formen I / l / g | verkl. Läufe | reservierter Name |
|---|---|---|---|---|---|---|---|
| Arimo 500 (heute, B) | 0,160 | 0,893 | 10,7 % | 0,768 | 0 von 3 | 0 von 17 | – |
| **IBM Plex Sans** wght 487, wdth 86,9 (geeicht) | 0,152 | 1,000 | 2,8 % | 0,744 | **3 von 3** | 14 von 17 | „Plex" |
| IBM Plex Sans 500, wdth 100 | 0,162 | 0,947 | 5,3 % | 0,745 | 3 von 3 | 11 von 17 | „Plex" |
| Source Sans 3 Medium 500 | 0,153 | 0,986 | 3,8 % | 0,746 | 2 von 3 (I fehlt) | 13 von 17 | „Source" |
| Open Sans wght 566, wdth 95,3 (geeicht) | 0,154 | 1,000 | 2,6 % | 0,756 | 1 von 3 (nur g) | 14 von 17 | – |
| Fira Sans Medium (statisch) | **0,191** | 0,994 | 3,9 % | 0,766 | 2 von 3 (I fehlt) | 13 von 17 | – |

Was die Tabelle für die Wahl heißt:

- **Laufweite.** Gleich gut sind Plex (geeicht), Open Sans (geeicht) und Source Sans 3 (ungeeicht,
  3,8 %). Die Streuung je Lauf ist bei allen gleich groß (p10–p90 rund 0,11). Keine Familie trifft
  einzelne Wörter gleichmäßiger als Arimo.
- **Formen.** Nur Plex hat das I mit Serifen. Das I steht in sechs Referenzzeichen (E.1.7, E.2.13,
  I.3.3, J.3.15, N.2.3, 5.8.8.4). Das Fachreview urteilt nach Augenschein, und die Formen sind
  das, was man zuerst sieht.
- **Open Sans** ist der einzige gut passende Kandidat ohne reservierten Namen. Er trifft nur das g,
  sieht also weiter nach einer anderen Schrift aus.
- **Fira Sans** gibt es bei Google Fonts nur statisch. Medium ist 22 % zu kräftig. Die leichtere
  Stufe Book (450) gibt es nur in der Ausgabe von Mozilla bzw. bBox Type. Sie ist ungemessen, ebenso
  Fira Regular.
- **x-Höhe.** Plex liegt mit 0,744 am nächsten an der Referenz (+6 %), Arimo bei +10 %.

**Zwischenergebnis:** Plex ist der einzige Kandidat, der Formen und Laufweite zugleich trifft.
Source Sans 3 ist die Rückfalloption: ohne I-Serifen, aber ohne Eichung schon bei 3,8 %.

## 3. Umbenennen oder Originaldateien

### 3.1 Was die Lizenz verlangt (Selbsteinschätzung, keine Rechtsauskunft)

- Beide Familien stehen unter der OFL 1.1 mit reserviertem Namen:
  - „Copyright © 2017 IBM Corp. with Reserved Font Name "Plex"" (`OFL.txt` in google/fonts und
    `LICENSE.txt` in IBM/plex);
  - „… Adobe …, with Reserved Font Name 'Source'" (`LICENSE.md` in adobe-fonts/source-sans).
- Nach OFL Bedingung 3 darf eine **veränderte Fassung** den reservierten Namen nicht als
  Schriftnamen führen. Teilmenge und abgeleitete Stufe sind Veränderungen, so steht es auch im
  README unter `packages/conformance/assets/`.
- Eine **unveränderte** Datei darf ihren Namen behalten. Weitergabe im npm-Paket und im
  Review-Server ist erlaubt, wenn der Lizenztext beiliegt. Das ist heute bei Arimo so gelöst.
- Die Herkunft („abgeleitet aus IBM Plex Sans") darf in README und Quellenführung stehen. Die
  Namen der Rechteinhaber dürfen nicht zur Werbung für die veränderte Fassung dienen
  (Bedingung 4).

### 3.2 Die zwei Wege

**Weg R: ableiten und umbenennen.** So wie heute bei Arimo:

- Teilmenge mit `pyftsubset`;
- statische Stufe mit dem fontTools-Instancer, bei Plex auch die Breite;
- zusätzlich neue Namen in allen Namenseinträgen, darunter Familie, typografische Familie,
  vollständiger Name und PostScript-Name.

**Weg U: Originaldateien, Name bleibt.** Statische Dateien, so wie der Rechteinhaber sie
veröffentlicht. Keine Teilmenge, keine Eichung.

Welche Originaldateien es gibt, ermittelt über die GitHub-API, ohne Download:

| Familie | Quelle | Datei (Beispiel Medium) | Größe | Breite |
|---|---|---|---|---|
| IBM Plex Sans | IBM/plex, `packages/plex-sans/fonts/complete/ttf/` | `IBMPlexSans-Medium.ttf` | 202.460 Byte | normal (wdth 100) |
| IBM Plex Sans Condensed | google/fonts, `ofl/ibmplexsanscondensed/` | `IBMPlexSansCondensed-Medium.ttf` | 111.176 Byte | schmal |
| IBM Plex Sans Condensed | IBM/plex, `packages/plex-sans-condensed/fonts/complete/ttf/` | `IBMPlexSansCondensed-Medium.ttf` | 202.500 Byte | schmal |
| Source Sans 3 | adobe-fonts/source-sans, Zweig `release`, `TTF/` | `SourceSans3-Medium.ttf` | 424.748 Byte | normal |

- Zu jeder Datei gibt es Regular, Bold und Medium Italic.
- Google Fonts führt Plex Sans und Source Sans 3 nur variabel. resvg wertet die Achsen nicht aus
  (LFH-585 §4). Für Weg U kommen also nur die statischen Dateien oben in Frage.

**Was Weg U bei Plex kostet: Die Breite ist nicht wählbar.** Statisch gibt es nur „normal" (5,3 %
zu breit) und „Condensed". Die Achse der variablen Datei nennt Condensed bei wdth 75 (STAT-Tabelle).
Abschätzung mit der Methode der Schriftmessung an der variablen Datei:

| Plex, Stufe und Breite | Strich | Laufweite | \|1−r\| | verkl. Läufe |
|---|---|---|---|---|
| 500, wdth 86,9 (Weg R) | 0,157 | 0,996 | 2,7 % | 14 von 17 |
| 500, wdth 75 (≈ Condensed Medium, Weg U) | 0,153 | 1,047 | 4,8 % | 15 von 17 |
| 500, wdth 100 (≈ Sans Medium, Weg U) | 0,162 | 0,947 | 5,3 % | 11 von 17 |

- Condensed läuft rund 4,7 % **schmaler** als die Referenz. Der Fehler dreht die Richtung, ist aber
  nur halb so groß wie heute bei Arimo.
- Die statische Condensed-Datei ist ein eigener Build. Ob sie der variablen Datei bei wdth 75
  gleicht, ist ungeprüft. Das klärt erst ein Download.
- **Stufe 500 statt 487 reicht.** Mit geeichter Breite trifft Plex 500 den Strich auf 0,6 %. Weg R
  kann also die benannte Stufe Medium ableiten. Dann wählt resvg die Datei über
  `font-weight="500"` wie heute bei Arimo.

### 3.3 Vergleich der Wege

| | Weg R (Plex, umbenannt) | Weg U (Plex Condensed, Original) | Weg U (Source Sans 3, Original) |
|---|---|---|---|
| Laufweitenfehler | **2,7 %** | ≈ 4,8 % (zu schmal) | 3,8 % |
| Formen | 3 von 3 | 3 von 3 (angenommen, gemessen nur bei wdth 100) | 2 von 3 |
| `font-family` im SVG | eigener Name, z. B. „Einsatzzeichen Sans" | „IBM Plex Sans Condensed" | „Source Sans 3" |
| Teilmenge | ja, wie heute (Arimo: −83 %) | nein | nein |
| vier Schnitte im Paket (400, 500, 700, 500 kursiv) | geschätzt 4 × 50–60 KB (wie die Arimo-Ableitungen) | 4 × 111–117 KB (google/fonts) | 4 × 318–431 KB |
| Pinning | Prüfsumme des Originals und der abgeleiteten Datei, wie heute | nur die Prüfsumme des Originals | nur die Prüfsumme des Originals |
| Nutzer mit eigener Darstellung | müssen unsere Datei laden, der Name ist nirgends sonst installiert | können Plex auch aus anderer Quelle laden, dann womöglich eine andere Version | wie links |
| Lizenzpflicht | Umbenennung in allen Namenseinträgen; OFL-Text beilegen | OFL-Text beilegen | OFL-Text beilegen |

Zu „Nutzer mit eigener Darstellung":

- Ein eigener Name bindet die Darstellung eindeutig an die gepinnte Datei. Ein installiertes
  „IBM Plex Sans Condensed" in anderer Version kann dann nicht still einspringen.
- Heute mit „Arimo" besteht dieselbe Lücke wie bei Weg U. Weg R schließt sie nebenbei.

### 3.4 Vorschlag zum Namen (nur bei Weg R)

- **„Einsatzzeichen Sans"**, Dateien `EinsatzzeichenSans-Medium.ttf` usw. Der Name enthält weder
  „Plex" noch „IBM".
- Herkunft, Version und Prüfsumme des Originals stehen in `packages/conformance/assets/README.md`
  und in der Quellenführung (`packages/conformance/src/sources.ts`,
  `packages/schema/src/provenance.ts`). So wird es heute für Arimo gemacht.

## 4. Kursiv (D.1.1) je Kandidat

Die Referenz neigt „Bezeichnung" um 9,0°. Ihre Kursive ist echt: e und g ändern die Form, das g
wird einstöckig (Schriftmessung §2.2).

| Kandidat | Datei | Neigung | Stand |
|---|---|---|---|
| Arimo (heute) | `Arimo-MediumItalic.ttf`, abgeleitet | 11,0° | umgesetzt |
| IBM Plex Sans | `IBMPlexSans-Italic[wdth,wght].ttf` (google/fonts, 599.624 Byte); statisch `IBMPlexSans-MediumItalic.ttf` (IBM/plex, 210.220 Byte) | **ungemessen** | Download nötig |
| IBM Plex Sans Condensed | `IBMPlexSansCondensed-MediumItalic.ttf` (google/fonts, 115.728 Byte) | ungemessen | Download nötig |
| Source Sans 3 | `SourceSans3-Italic[wght].ttf` (geladen), statisch `SourceSans3-MediumIt.ttf` (318.204 Byte) | 11,3° | gemessen |

- Für Weg R bei Plex wird die Kursive wie die Aufrechte abgeleitet: Stufe 500, dieselbe
  geeichte Breite, umbenannt.
- Die Einschränkung aus LFH-585 §11.2 bleibt bestehen: kursiv nur zusammen mit 500. resvg setzt
  jede kursive Anfrage mit der einen Kursivdatei.

## 5. Was der Umbau berührt (Stand `98d1c468`)

§6 der LFH-585-Notiz stammt aus der Zeit vor B und vor Kursiv. Neu gezählt am aktuellen Stand, ohne
`node_modules`, `dist` und Snapshots:

**Schriftabhängige Konstanten.**

| Symbol | Vorkommen | Dateien | Hinweis |
|---|---|---|---|
| `ARIMO_CAP_HEIGHT_FRACTION` | 44 | 12 | davon 20 Schriftgrade, die aus einer Versalhöhe abgeleitet sind (`/ ARIMO_CAP_HEIGHT_FRACTION`), in 6 Dateien; **von core exportiert** |
| `ARIMO_TEXT_METRICS` | 29 | 12 | |
| `DIACRITIC_HEADROOM_FRACTION` | 11 | 5 | an Arimo gemessen (`render/text-policy.ts`) |
| `ALPHABETIC_ASCENT_FRACTION` | 10 | 4 | ebenso |
| `boxMm:` | 37 im Quellcode, 54 in Tests | 36 | LFH-585 zählte 82 handvermessene Boxen, teils über Konstanten gesetzt (`LARGE_DMO_BOX`); die genaue Zahl liefert der Umbauplan |
| „Arimo" als Wort | 275 | 62 | Code, Kommentare, Skripte, Dokumentation |

**Seit LFH-585 §6 hinzugekommen.**

- `Arimo-Medium.ttf` und `Arimo-MediumItalic.ttf` mit zwei weiteren Metrikdateien. Das sind jetzt
  vier: `arimo(-bold|-medium|-medium-italic)-metrics.json` in `packages/core/src/assets/`.
- `CATALOG_TEXT_FONT_WEIGHT` (39 Vorkommen) und `catalog-text-weight.test.ts`. Beide bleiben: Der
  Wert 500 gilt auch für die neue Familie.
- Handmaße, die mit den Laufweiten von Arimo 500 bestimmt wurden:
  - die fünf verbreiterten Boxen aus §10.4 („KatSL", „Bezeichnung", „L", „LtS", „stv OB");
  - `LARGE_DMO_BOX`;
  - die zwei benannten Ausnahmen für „Strömungsrettung" in `named-exceptions.ts`.
- Anhang C (LFH-786) hat Text hinzugebracht.

**Snapshots.**

- 190 von 293 Katalog-SVGs (conformance) und 43 von 269 Piktogramm-SVGs (core) tragen
  `font-family="Arimo"`, zusammen 331 Läufe. In LFH-585 waren es 203 Dateien mit 298 Läufen.
- Die Kontaktbögen dieser Zeichen unter `multi-size` rastern neu.

**Welche Schnitte die neue Familie liefern muss.** Ein Wechsel betrifft alle vier heutigen Dateien,
nicht nur Medium:

| Schnitt | wer ihn heute braucht |
|---|---|
| 400 | fremde IR ohne `fontWeight` (dokumentierter Standard); Kapitel 2, `gapLabel` in `geometry/parametric.ts` |
| 500 | aller Katalogtext (`CATALOG_TEXT_FONT_WEIGHT`) |
| 700 | fremde IR mit 700; `packages/cli/src/commands/visual-proof.ts`; die Bildunterschriften der Kontaktbögen (`sans-serif`, fett, über `defaultFontFamily`) |
| 500 kursiv | D.1.1 |

Bei Weg R ist jeder Schnitt eine eigene abgeleitete und umbenannte Datei. Offen ist, ob die
Bildunterschriften der Kontaktbögen bei Arimo Bold bleiben. Dann bliebe Arimo als zweite Familie
im Paket. Einfacher ist es, sie mitzuwechseln. Sie zeigen nur Größenangaben, keinen Katalogtext.

**Übrige Stellen.** Sie sind in LFH-585 §6 benannt und gelten weiter:

- Metrikanbieter in `packages/core/src/text-metrics.ts` und
  `packages/core/src/geometry/text-metrics.ts`;
- `packages/conformance/src/fonts.ts` (Prüfsummen, `resvgFontOptions()`) und
  `packages/conformance/assets/`;
- `scripts/font/subset-arimo.sh` und `scripts/font/export-metrics.py`;
- Website: PNG-Route mit Prüfsummenabgleich, `theme.css`, `MapLibreLab.tsx` wartet auf „Arimo",
  `SymbolPreview.astro`, die Dokuseiten;
- Review-Server (`embedTextFont`);
- Release und Gates: `scripts/release/copy-conformance-assets.mjs` und
  `scripts/gates/core-package.mjs` mit der Grenze von 6.900.000 Byte für das entpackte Paket
  core;
- Quellenführung (`arimo-ofl`) und die Tests.

**Versionssprung.**

- `TEXT_FONT_FAMILY_ATTR` ist das nackte Literal `'Arimo'`, ohne Ausweichliste. Jeder Weg
  ändert also das `font-family` jedes SVG-Laufs und die Canvas-Schriftangabe.
- `ARIMO_CAP_HEIGHT_FRACTION` ist aus core exportiert (`packages/core/src/index.ts`). Umbenennen
  oder ändern bricht die Schnittstelle.
- Die Schriftgrade abgeleiteter Läufe ändern sich, weil die Versalhöhe je Schriftgrad eine andere
  ist.
- Das ist ein **Major-Release**. Der letzte war 2.0.0 (29.09.2026, Wegfall von `bundespolizei`).

## 6. Optionen

### (C0) Zurückstellen bis zum erneuten Fachreview

- Die Familie wird nicht festgelegt, nichts wird umgebaut. Zuerst prüft das erneute Fachreview
  (LFH-583) den Stand nach B.
- Meldet es „falsche Schrift" nicht mehr, entfällt C.
- **Dafür:** Es gibt kein Release 3.0.0 ohne fachlichen Anlass. Die Empfehlung aus LFH-585 §8.5
  gilt weiter.
- **Dagegen:** Laufweite und Formen sind messbar falsch, auch wenn das Review sie nicht nennt. Die
  13 verkleinerten Läufe (Katalogzählung) und die drei neu verkleinerten bleiben.

### (C1) Familie jetzt festlegen, Umbau nach dem Fachreview (Vorschlag)

- Jetzt: IBM Plex Sans und Weg R, die ausstehenden Prüfungen aus Abschnitt 7 durchführen.
- Nach dem Review: den Umbauplan schreiben und umsetzen.
- **Dafür:** Die Wahl ist vorbereitet und belegt. Das Review sieht, ob noch etwas fehlt. Der Umbau
  läuft nicht gegen einen Stand, den das Review ohnehin ändert.
- **Dagegen:** Der Umbau wartet. Was das Review an Boxen und Schriftgraden bestätigt, wird nach C
  noch einmal geprüft.

### (C2) Familie jetzt festlegen und sofort umbauen

- **Dafür:** Das Review sieht gleich die neue Schrift, eine zweite Runde entfällt.
- **Dagegen:** Der Umbau landet vor dem Review. Jede Rückmeldung zu einzelnen Zeichen trifft auf
  frisch geänderte Handmaße.

### Innerhalb von C1 und C2: Familie und Weg

| Wahl | Ergebnis | Aufwand zusätzlich zum Grundumbau |
|---|---|---|
| **Plex, Weg R** (Vorschlag) | am genauesten: 2,7 %, 3 von 3 Formen, 14 von 17 Läufen | Umbenennung; Eichung der Breite im Skript |
| Plex Condensed, Weg U | ≈ 4,8 % zu schmal, 3 von 3 Formen (angenommen), 15 von 17 Läufen | keine Umbenennung; größere Dateien; Condensed-Datei erst prüfen |
| Source Sans 3, Weg U | 3,8 %, 2 von 3 Formen, 13 von 17 Läufen | keine Umbenennung; Dateien je 318–431 KB |
| Open Sans, abgeleitet | 2,6 %, nur 1 von 3 Formen | keine Umbenennung nötig |

## 7. Ausstehende Prüfungen und Downloads

Keine Datei ist geladen. Jede Zeile braucht die Freigabe des Projektinhabers.

| Zweck | Datei | Quelle | Größe |
|---|---|---|---|
| Kursive von Plex messen (Neigung, Breite, g), für Weg R | `IBMPlexSans-Italic[wdth,wght].ttf` | google/fonts, `ofl/ibmplexsans/` | 599.624 Byte |
| Plex Condensed prüfen: Breite und Strich der Originaldatei, Abgleich mit der Abschätzung (nur Weg U) | `IBMPlexSansCondensed-Medium.ttf`, `IBMPlexSansCondensed-MediumItalic.ttf`, `OFL.txt` | google/fonts, `ofl/ibmplexsanscondensed/` | 111.176 und 115.728 Byte, OFL etwa 4 KB |
| Fira Sans Regular als Gegenprobe zur Strichstärke (optional) | `FiraSans-Regular.ttf` | google/fonts, `ofl/firasans/` | 456.996 Byte |

Für die aufrechten Schnitte bei Weg R ist kein neuer Download nötig: `IBMPlexSans[wdth,wght].ttf`
(537.244 Byte, SHA-256 `3b031aa4216174205bd8471f88a49b91f093169e9e87bd5262242bc5967fe2e3`,
Schriftmessung §1) ist schon freigegeben und geladen worden. Daraus lassen sich 400, 500 und 700 in
geeichter Breite ableiten, der resvg-Test und der Formvergleich laufen damit. Das Skript lädt die
Datei später wie heute bei Arimo und prüft sie gegen diese Prüfsumme. Die Wahl durch resvg wird
kaum scheitern: Eine abgeleitete Arimo-Medium mit denselben Namenseinträgen wählt resvg schon
heute.

**Was die Prüfung zeigen muss, bevor umgebaut wird:**

- **resvg wählt die Datei richtig.** Die umbenannte (Weg R) oder die originale Datei (Weg U) muss
  für `font-weight="500"` gewählt werden. Läufe in 400 und 700 müssen dabei bit-gleich bleiben.
  Der Test läuft wie in der Schriftmessung, §2.5.
- **Die Kursive passt.** Neigung und Laufweite von Plex Italic in 500 werden an „Bezeichnung"
  gemessen, gegen die Box 25,15 mm.
- **Die Formen stimmen im Bild.** Ein Vergleichsbogen zeigt Referenz, Arimo 500 und den Kandidaten
  an den Läufen mit I, l und g.

## 8. Was danach kommt

Nach der Wahl wird ein Umbauplan geschrieben (`docs/superpowers/plans/`), für den gewählten Weg.
Er folgt den Punkten aus Abschnitt 5:

1. Schriftdateien und Skript (`scripts/font/`): Ableitung, Umbenennung, Prüfsummen, README und
   Lizenztext.
2. Metrikdateien und Anbieter; neue Konstante für die Versalhöhe, und `ARIMO_*` umbenennen.
3. Alle abgeleiteten Schriftgrade neu herleiten.
4. Diakritik- und Grundlinienanteile neu messen.
5. Gate-Lauf gegen die bestehenden Boxen; jede Box, die anschlägt, einzeln an der Referenztinte
   nachmessen; die verkleinerten Läufe neu bewerten.
6. Website, Review-Server, CLI, Release-Skripte.
7. Snapshots und ein Kontaktbogen zur Sichtprüfung.
8. Dokumentation und Changelog für 3.0.0.

## 9. Zu entscheiden

1. **Zeitpunkt:** C0, C1 oder C2.
2. **Familie:** IBM Plex Sans, Source Sans 3 oder Open Sans.
3. **Weg:** R (umbenennen, geeicht) oder U (Originaldateien).
4. **Name**, falls Weg R: „Einsatzzeichen Sans" oder ein anderer.
5. **Downloads** aus Abschnitt 7 freigeben.
