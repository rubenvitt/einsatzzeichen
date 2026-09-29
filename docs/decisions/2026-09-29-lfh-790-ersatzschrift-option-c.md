# LFH-790: Ersatzschrift näher an der Referenz (Option C) — Entscheidungsvorlage

> Stand: 29. September 2026
> Status: **Entschieden (Ruben, 29.09.2026): C1, IBM Plex Sans auf Weg R, Name „Einsatzzeichen
> Sans".** Umbau nach dem erneuten Fachreview (LFH-583). Entscheidung und Prüfmessung in Abschnitt 10.
> Bezug: `docs/decisions/2026-09-29-lfh-585-ersatzschrift-und-kursiv.md` (Option C, §7 und §8),
> `docs/reviews/2026-09-29-lfh-585-schriftmessung.md` (Messung der Kandidaten); Parent LFH-582
> Diese Notiz ändert keinen Code und keine Schriftdatei. Abschnitte 1–9 sind die Vorlage, wie sie
> zur Entscheidung vorlag. Ihre Messwerte stammen aus der Schriftmessung, eine Abschätzung
> (Abschnitt 3.2) aus der dort schon geladenen Plex-Datei. Die nach der Freigabe geladenen Dateien
> und ihre Messung stehen in Abschnitt 10.

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

## 10. Entscheidung und Prüfmessung (29. September 2026)

**Entscheidung.** Der Projektinhaber hat am 29. September 2026 entschieden:

- **Zeitpunkt C1:** Die Familie steht jetzt fest. Umbauplan und Umsetzung folgen nach dem erneuten
  Fachreview (LFH-583).
- **Familie und Weg:** IBM Plex Sans auf Weg R, also abgeleitet (Teilmenge, Stufe, Breite) und
  umbenannt.
- **Name:** „Einsatzzeichen Sans".
- **Downloads:** alle drei aus Abschnitt 7 freigegeben.

### 10.1 Darf die abgeleitete Schrift „Einsatzzeichen Sans" heißen?

Ja (Selbsteinschätzung, keine Rechtsauskunft). Die OFL erlaubt, eine veränderte Fassung unter
einem anderen Namen weiterzugeben. Bei reserviertem Namen verlangt sie das sogar. Dabei gilt:

- **Der Name darf „Plex" nicht enthalten** (Bedingung 3). „Einsatzzeichen Sans" enthält weder
  „Plex" noch „IBM".
- **Die Lizenz bleibt die OFL** (Bedingung 5). Die Schrift darf nicht unter eine andere Lizenz
  gestellt werden. Der Copyright-Vermerk von IBM bleibt in der Datei und im Lizenztext. Ein
  eigener Vermerk für die Änderungen darf dazukommen.
- **Die Schrift wird nicht allein verkauft** (Bedingung 1). Das npm-Paket ist frei.
- **Keine Werbung mit IBM** (Bedingung 4). Die Herkunft „abgeleitet aus IBM Plex Sans" darf im
  README und in der Quellenführung stehen, als Nennung, nicht als Werbung.
- Namenseintrag 7 (Markenhinweis „IBM Plex™ is a trademark of IBM Corp.") ist nach der Ableitung
  der einzige Eintrag, der „Plex" noch nennt. Er ist ein Hinweis, kein Schriftname. Ob er bleibt
  oder entfällt, legt der Umbauplan fest. Vorschlag: entfernen, weil die Schrift den Namen nicht
  mehr führt.

### 10.2 Geladene Dateien

Alle aus google/fonts, Zweig `main`, Kopf `23e54b51ddff` (24. September 2026), abgerufen am
29. September 2026. Die Größen stimmen mit Abschnitt 7 überein.

| Datei | Byte | SHA-256 |
|---|---|---|
| `ofl/ibmplexsans/IBMPlexSans-Italic[wdth,wght].ttf` | 599.624 | `0b94c5e981993764db32bf9c610ecc60cbd34ad77ec2f10ba03c64ab75124d8e` |
| `ofl/ibmplexsanscondensed/IBMPlexSansCondensed-Medium.ttf` | 111.176 | `426350c298277f7f9d1a93956572799ca3d16e2d43e7f60eec8382bcd795ec30` |
| `ofl/ibmplexsanscondensed/IBMPlexSansCondensed-MediumItalic.ttf` | 115.728 | `ab8931c7274aff5b0315b798ac68149f92a667d9647cb9d6263f5f44403e5452` |
| `ofl/ibmplexsanscondensed/OFL.txt` | 4.456 | `7e6b2818edbd8f6a01ae80641cc8f16a51080d08fb4e532be3a0b6f74adb07da` |
| `ofl/firasans/FiraSans-Regular.ttf` | 456.996 | `c29556a2719bf613ef3d5e070e40d903a8965d9c081beca1375dc1e6e0f93c23` |

Die aufrechte Datei ist `IBMPlexSans[wdth,wght].ttf` aus der Schriftmessung (SHA-256
`3b031aa4…e2fe3`). `OFL.txt` von Plex Condensed ist byte-gleich mit dem von Plex Sans.

### 10.3 Probeableitung „Einsatzzeichen Sans"

Abgeleitet im Scratchpad, nicht im Repository. Die Schritte:

- Teilmenge mit denselben `pyftsubset`-Argumenten wie `scripts/font/subset-arimo.sh`;
- fontTools-Instancer bei **wdth 86** und wght 400, 500, 700 (aufrecht) bzw. 500 (kursiv);
- neue Namen in den Einträgen 1–4, 6, 16 und 17, wie bei Arimo:
  - Stufe 500: Familie „Einsatzzeichen Sans Medium" (1), typografische Familie
    „Einsatzzeichen Sans" (16), Stil „Medium" bzw. „Medium Italic" (17);
  - PostScript-Namen `EinsatzzeichenSans-Regular`, `-Medium`, `-Bold`, `-MediumItalic`;
- `usWeightClass`, `fsSelection` und `macStyle` passend gesetzt, STAT entfernt.

Die Breite: Geeicht auf den Median 1,000 liegt sie bei wght 500 bei wdth 86,14. Gewählt ist der
runde Wert 86. Er ergibt ebenfalls 1,000.

| Datei | Byte |
|---|---|
| `EinsatzzeichenSans-Regular.ttf` | 89.108 |
| `EinsatzzeichenSans-Medium.ttf` | 89.220 |
| `EinsatzzeichenSans-Bold.ttf` | 89.068 |
| `EinsatzzeichenSans-MediumItalic.ttf` | 94.256 |

Die vier Dateien sind rund 60 % größer als die Arimo-Ableitungen (53–58 KB). Die Teilmenge von
Plex hat bei denselben Zeichenbereichen mehr Glyphen. Die Metrikdateien in core bemessen sich
nach den Zeichen, nicht nach der Dateigröße. Ob sie größer werden, zeigt der Umbau am Gate
`core-package.mjs`.

### 10.4 Messung

Methode wie in der Schriftmessung, Abschnitt 1 und 3.2.

| Schrift | Strich (Ref. 0,156) | Laufweite (p10–p90) | \|1−r\| | x-Höhe (Ref. 0,700) | I / l (Ref. 2,58 / 1,60) | g | verkl. Läufe |
|---|---|---|---|---|---|---|---|
| Arimo 500 (heute) | 0,160 | 0,893 (0,825–0,944) | 10,7 % | 0,768 | 1,00 / 1,00 | einstöckig | 0 von 17 |
| **Einsatzzeichen Sans 500** | **0,156** | **1,000** (0,943–1,052) | **2,9 %** | 0,745 | 2,65 / 1,40 | zweistöckig | **14 von 17** |
| Einsatzzeichen Sans 400 | 0,117 | 1,025 | 3,3 % | 0,739 | 3,26 / 1,71 | zweistöckig | 14 von 17 |
| Einsatzzeichen Sans 700 | 0,211 | 0,964 | 3,8 % | 0,752 | 2,16 / 1,15 | zweistöckig | 12 von 17 |
| Plex Sans Condensed Medium (Original, Weg U) | 0,152 | 1,046 (0,988–1,102) | 4,8 % | 0,745 | 2,60 / 1,40 | zweistöckig | 15 von 17 |
| Fira Sans Regular | 0,138 | 1,018 | 4,1 % | 0,765 | 1,00 / 1,66 | zweistöckig (untere Schleife offen) | 14 von 17 |

- **Einsatzzeichen Sans 500 trifft die Strichstärke genau und die Laufweite im Median genau.** Alle
  drei Formmerkmale stimmen.
- **Die Abschätzung für Plex Condensed (Abschnitt 3.2) bestätigt sich.** Die Originaldatei misst
  1,046 statt geschätzt 1,047, die Formen stimmen auch dort.
- **Fira Sans Regular scheidet aus.** Sie ist 12 % zu dünn, Medium 22 % zu dick, und das I hat
  keine Serifen.
- **400 und 700** werden vom Katalog nicht gesetzt (Abschnitt 5). Für fremde IR und Kapitel 2
  reichen sie. Die Referenz misst in Kapitel 2 0,126. Einsatzzeichen Sans 400 liegt mit 0,117 um
  7 % darunter, Arimo 400 mit 0,136 um 8 % darüber.

**Kursiv, „Bezeichnung" in D.1.1** (Referenz: Versalhöhe 2,920 mm, Tinte 21,34 mm breit, Neigung
9,0°, g einstöckig):

| Schnitt | Neigung | Laufweite Ref. ÷ Schrift | Schriftgrad für 2,920 mm | Tinte (Box 2,673 … 27,823 mm) | g |
|---|---|---|---|---|---|
| Arimo 500 kursiv (heute) | 11,0° | 0,854 | 4,244 mm | 2,785 … 27,783 mm | einstöckig |
| **Einsatzzeichen Sans 500 kursiv** | 11,3° | 0,943 | 4,183 mm | 2,790 … 25,432 mm | zweistöckig |
| Plex Condensed Medium Italic (Original) | 11,4° | 0,981 | 4,183 mm | 2,778 … 24,537 mm | zweistöckig |

- **Der Lauf wird 2,35 mm kürzer** und passt mit Abstand in die Box. Die Laufweite weicht noch
  um 6 % ab statt um 15 %.
- **Die Neigung bleibt 2,3° zu stark**, wie bei Arimo.
- **Das g ist kursiv zweistöckig.** Die Referenz setzt es kursiv einstöckig. Arimo traf das
  zufällig, Plex trifft es nicht. Das betrifft einen Buchstaben in einem Lauf.

### 10.5 Wie resvg wählt

Geprüft mit `@resvg/resvg-js` 2.6.2 aus dem Repository, `loadSystemFonts: false`,
`defaultFontFamily: 'Einsatzzeichen Sans'`, Prüfsumme über die Pixel wie in der Schriftmessung,
Abschnitt 2.5.

| Dateien | ohne Angabe | 500 | 700 | italic | italic + 500 | italic + 700 |
|---|---|---|---|---|---|---|
| Regular + Bold | Regular | Regular | Bold | Regular | Regular | Bold |
| + Medium | Regular | **Medium** | Bold | Regular | **Medium** | Bold |
| + Medium + MediumItalic | Regular | Medium | Bold | **MediumItalic** | **MediumItalic** | **MediumItalic** |

- **Das Verhalten ist dasselbe wie bei Arimo.** 400 und 700 bleiben bit-gleich, wenn Medium und
  MediumItalic hinzukommen. Jede kursive Anfrage bekommt die eine Kursivdatei. Die Regel „kursiv
  nur mit 500" (LFH-585 §11.2) gilt unverändert.
- Die Bildunterschriften der Kontaktbögen (`sans-serif`, fett) bekommen über `defaultFontFamily`
  Einsatzzeichen Sans Bold. Arimo muss dafür nicht im Paket bleiben.

### 10.6 Formvergleich

Ein Vergleichsbogen zeigt Referenz, Arimo 500 und Einsatzzeichen Sans 500. Verwendet sind die
Läufe „MLW IV Lbw" (E.2.13), „BuPol" (D.4.4) und „Evakuierung" (D.1.3), dazu „Bezeichnung" kursiv.
Der Bogen liegt nicht im Repository. Er wurde dem Projektinhaber mit dieser Notiz übergeben.

Augenschein:

- Aufrecht liegt Einsatzzeichen Sans in Laufweite, I-Serifen, l-Fuß und g deutlich näher an der
  Referenz als Arimo.
- Einzelne Rundungen wirken straffer als in der Referenz.

### 10.7 Nächste Schritte

1. LFH-583 abwarten: das erneute Fachreview des Stands nach B.
2. Danach den Umbauplan schreiben (`docs/superpowers/plans/`), nach Abschnitt 8, mit diesen
   Festlegungen:
   - Quelle `IBMPlexSans[wdth,wght].ttf` und `IBMPlexSans-Italic[wdth,wght].ttf`, gepinnt mit den
     Prüfsummen oben;
   - wdth 86, Stufen 400, 500, 700 und 500 kursiv;
   - Name „Einsatzzeichen Sans";
   - Namenseintrag 7 entfernen (Vorschlag aus 10.1).
3. Das Messskript gehört dann nach `scripts/font/`, wie in LFH-585 §9 vorgesehen. Die Probeskripte
   dieser Notiz liegen im Scratchpad der Sitzung.

