# LFH-585: Ersatzschrift und kursiver Schnitt — Prüfnotiz und Entscheidungsvorlage

> Stand: 29. September 2026
> Status: **Entschieden (Option B, Ruben, 29.09.2026).** Gate-Lauf und Umsetzung stehen in
> Abschnitt 10. Kursiv (Abschnitt 5) ist als eigener Schritt umgesetzt, siehe Abschnitt 11.
> Bezug: `docs/decisions/2026-09-19-masse-an-der-referenz-ablesen.md` §4 („Schriftgewicht"),
> §5.4 und §6; Parent LFH-582

## Kurzfassung

- **Die Referenzschrift läuft nur wenig schmaler als Arimo.** Bei gleicher Buchstabenhöhe ist
  ein Wort der Referenz im Mittel 9 % schmaler als in Arimo. Eine echte Schmalschrift („Narrow",
  „Condensed") wäre zu schmal. An lokal vorhandenen Stellvertretern gemessen, liegt der Fehler
  dann bei 10 bis 21 %, bei DIN Condensed sogar bei 32 %, also in der Gegenrichtung.
- **Die Referenz kennt nur eine Strichstärke.** Sie liegt zwischen Arimo normal und Arimo fett.
  Arimo normal ist 13 % zu dünn, Arimo fett 34 % zu dick. Eine Zwischenstufe von Arimo, die sich
  aus der vorhandenen Datei ableiten lässt, trifft die Referenz: bei Stufe 480 auf 1 %, bei der
  Stufe 500 („Medium"), die der Renderer sauber ansprechen kann, auf 3 %. Die Aufteilung in
  normal und fett aus der Notiz vom 19. September (§4) hat in der Referenz kein Gegenstück.
- **Die Buchstabenformen verraten eine humanistische Grotesk**, also eine serifenlose Schrift mit
  handschriftlich geprägten Formen. Das große I trägt Serifen, das kleine l einen Fuß, das g ist
  aufrecht zweistöckig (korrigiert, siehe Abschnitt 3.5). Welche Schrift es genau ist, bleibt eine Vermutung (Abschnitt 3.5). Frei verfügbar
  ist sie in keinem Fall.
- **Kursiv betrifft einen einzigen Lauf:** „Bezeichnung" in D.1.1. Arimo hat einen freien
  Kursivschnitt unter derselben Lizenz. Ob er dieselben Breiten hat, lässt sich erst nach einem
  Download belegen. Die Indizien sprechen dafür (Abschnitt 5).
- **Empfehlung:** Option B, also Arimo behalten und die Stufe „Medium" (500) für allen
  Katalogtext einführen. Kursiv als eigener kleiner Schritt mit Arimo Italic, nach einer Prüfmessung. Keine
  Schmalschrift. Ein Familienwechsel (Option C) nur dann, wenn das Fachreview nach B weiter
  „falsche Schrift" meldet, und erst nach einer Messung heruntergeladener Kandidaten.

## 1. Anlass

Die Notiz vom 19. September hat die Schrift ausdrücklich offen gelassen. In §5.4 heißt es:
„Arimo bleibt … eine schmal laufende Ersatzschrift bräuchte eine Lizenzprüfung und neue Metriken
für alle Textläufe. Kursiv (D.1.1) entfällt aus demselben Grund." In §6 steht: „Die Referenzschrift
ist eine halbfette, schmal laufende Grotesk, nicht Arimo. Sie ist der größte verbleibende
Unterschied in allen Familien mit Text."

Beide Aussagen beruhten auf Augenschein. Diese Notiz misst nach, prüft Kandidaten samt Lizenz,
beziffert den Aufwand eines Wechsels und prüft Kursiv getrennt davon.

## 2. Wie gemessen wurde

**Begriffe.**

- **Versalhöhe:** die Höhe eines Großbuchstabens mit flacher Ober- und Unterkante, etwa H, E
  oder T. Alle anderen Maße sind durch sie geteilt. So lassen sich große und kleine Schrift
  vergleichen.
- **Laufweite:** wie breit ein Wort wird, wenn die Buchstaben gleich hoch sind.
- **Strichstärke:** wie dick ein senkrechter Strich ist, etwa der linke Balken des H.
- **Median:** der mittlere Wert einer Messreihe; die Hälfte der Werte liegt darüber, die Hälfte
  darunter. **p10–p90** nennt den Bereich, in dem die mittleren 80 % der Werte liegen.
- **x-Höhe:** die Höhe der Kleinbuchstaben ohne Ober- und Unterlänge (x, z, v, w, u).

**Datenbasis.** Von den 661 Referenzdateien tragen 260 eine eigene Textebene. Sie heißt
„Takt. Zeichen (Typo)" und enthält 1.286 Buchstaben, jeden als eigene Umrissfläche. Unsere
Snapshots liegen im selben Koordinatensystem wie die Referenz. Jede Referenzfläche ließ sich daher
dem Textlauf zuordnen, den wir an derselben Stelle setzen. Wenn die Zahl der Flächen mit der Zahl
der Zeichen übereinstimmte, wurde jede Fläche ihrem Buchstaben zugeordnet.

- Zugeordnet wurden 265 von 287 Läufen mit 936 Buchstaben aus 180 Referenzdateien.
- Viele Läufe stehen wortgleich in mehreren Dateien, etwa „SEG" in F.1.9, F.1.10 und F.1.20.
  Gezählt wurde jeder solche Lauf nur einmal. Übrig bleiben **132 verschiedene Läufe** mit
  Großbuchstaben, zusammen 476 Buchstaben aus 120 Dateien. Alle Zahlen unten beziehen sich auf
  diese bereinigte Menge.
- Die 80 Textebenen ohne Zuordnung wurden einzeln angesehen. Rund die Hälfte gehört zu Anhang C
  (im Katalog noch kaum vertreten). Der Rest verteilt sich auf Kapitel 2, 5.8 und die
  THW-Unterschriften in Anhang E.

**Grenzen der Methode.**

- Umrisse zeigen nur die Tinte, nicht den Platz, den eine Schrift jedem Buchstaben zuteilt. Die
  Laufweite wird deshalb als Tintenbreite des ganzen Laufs gemessen: vom linken Rand des ersten
  bis zum rechten Rand des letzten Buchstabens.
- Die Vergleichsschrift wird an denselben Wörtern gemessen, bei gleicher Versalhöhe. Arimo wird
  mit Unterschneidung gerechnet, also mit den Korrekturen für enge Buchstabenpaare wie „Ta". Für
  die anderen Schriften fehlen diese Daten; sie werden ohne gerechnet. Für Arimo macht das 1 %
  aus.
- Die Strichstärke wird mit einer waagerechten Messlinie bei 30 % der Versalhöhe bestimmt, an
  I und l bei 50 %.

**Stellvertreter.** Schriften, die nicht auf dem Rechner liegen, wurden nicht heruntergeladen.
Gemessen wurde an lokal installierten Schriften, die als Stellvertreter taugen:

- Arial Narrow steht für Liberation Sans Narrow. Beide haben dieselben Zeichenbreiten.
- PT Sans und PT Sans Narrow stammen aus der macOS-Ausstattung. Sie können sich in Einzelheiten
  von den Web-Dateien bei Google Fonts unterscheiden.

## 3. Befund

### 3.1 Laufweite: rund 9 % schmaler als Arimo, nicht „schmal laufend"

Das Verhältnis ist die Breite der Referenz geteilt durch die Breite der Schrift, bei gleicher
Versalhöhe. Die Messung umfasst 120 Läufe mit mindestens zwei Zeichen. Werte unter 1 heißen:
Die Schrift ist breiter als die Referenz. Werte über 1 heißen: Sie ist schmaler.

| Schrift | Verhältnis (Median) | Bedeutung |
|---|---|---|
| Arimo normal (400) | **0,906** (p10–p90: 0,84–0,95) | Arimo ist rund 10 % zu breit |
| Arimo fett (700) | 0,860 | 16 % zu breit |
| PT Sans (normal breit, Stellvertreter) | 1,021 | 2 % zu schmal |
| PT Sans fett | 1,001 | gleich breit |
| SF Pro Condensed Semibold | 1,107 | 10 % zu schmal |
| Helvetica Neue Condensed Bold | 1,118 | 11 % zu schmal |
| Arial Narrow (≈ Liberation Sans Narrow) | 1,137 | 12 % zu schmal |
| Avenir Next Condensed Demi Bold | 1,192 | 16 % zu schmal |
| PT Sans Narrow fett | 1,203 | 17 % zu schmal |
| PT Sans Narrow | 1,264 | 21 % zu schmal |
| DIN Condensed Bold | 1,468 | 32 % zu schmal |

Beispiele bei gleicher Versalhöhe, als Breite des Laufs:

| Lauf | Referenz | Arimo 400 | Verhältnis |
|---|---|---|---|
| „Evakuierung" (D.1.3) | 21,09 mm | 22,97 mm | 0,918 |
| „GW Tauchen" (I.2.2) | 21,42 mm | 23,96 mm | 0,894 |
| „MLW IV Lbw" (E.2.13) | 25,57 mm | 27,33 mm | 0,935 |
| „TEL" (D.1.3) | 16,59 mm | 18,87 mm | 0,879 |
| „SEG" (D.3.13) | 11,10 mm | 14,10 mm | 0,787 |

Die einzelnen Buchstaben unterscheiden sich stärker als die Wörter. E, S, a und R sind in der
Referenz 20 bis 30 % schmaler als in Arimo. t, l und I sind breiter, weil sie Fuß oder Serifen
tragen. Im Wort gleicht sich das großenteils aus: Der Median je Buchstabe (0,900) und der
Median je Wort (0,906) liegen fast gleich. Einen Unterschied im Abstand zwischen den Buchstaben
zeigen die Zahlen nicht.

Ein Vergleich Buchstabe für Buchstabe führt deshalb in die Irre. SF Pro Condensed trifft die
einzelnen Buchstaben am besten, ist als Wort aber 10 % zu schmal. Maßgeblich ist die Wortbreite.

### 3.2 Strichstärke: eine einzige Stufe, zwischen Arimo normal und fett

| Messung | Referenz | Arimo 400 | Arimo 480 | Arimo 500 | Arimo 700 |
|---|---|---|---|---|---|
| Senkrechter Strich eines Großbuchstabens ÷ Versalhöhe | **0,156** (196 Striche, alle 0,156–0,157) | 0,136 | 0,155 | 0,160 | 0,209 |
| Senkrechter Strich eines Kleinbuchstabens (n, h, m, u) ÷ Versalhöhe | 0,146 | 0,128 | – | – | 0,199 |
| Querbalken des H ÷ Versalhöhe | 0,130 | 0,114 | – | – | 0,173 |
| Laufweite Referenz ÷ Arimo, ohne Unterschneidung | – | 0,897 | 0,891 | 0,889 | 0,858 |

- **Kein Unterschied zwischen den Läufen, die wir fett setzen, und den übrigen.** Die 28 senkrechten
  Striche aus Läufen, die bei uns fett stehen (Anhang J, 4.1.7, 4.2.2, 5.8.1.x), messen ebenfalls
  0,156–0,157. Diese Zählung ist nicht um wortgleiche Läufe bereinigt.
- **Arimo trifft die Referenz bei etwa 480.** Die Zahl ist die Stärkestufe auf der Skala der
  variablen Schriftdatei, die von 400 (normal) bis 700 (fett) reicht. Bei 500, der Stufe mit dem
  üblichen Namen „Medium", liegt Arimo 3 % darüber. Bei 480 liegt Arimo 1 % neben
  der Referenz. Im Schriftsatz heißt das etwa „medium", nicht „halbfett" wie in §6 angenommen.
- **Kapitel 2 ist die einzige Ausnahme.** Die Beschriftungen in 2.3, 2.17, 2.18 und 2.19 messen
  0,126 und damit fast Arimo normal. Der Katalog setzt dort heute keinen Text.

### 3.3 x-Höhe

Die Kleinbuchstaben der Referenz sind im Verhältnis kleiner: x-Höhe ÷ Versalhöhe = 0,700,
gemessen an 18 verschiedenen Läufen. Arimo kommt auf 0,768, PT Sans auf 0,714.

### 3.4 Die sichtbare Folge heute: 21 Läufe sind kleiner als in der Referenz

Unsere Schriftgrade sind so gewählt, dass die Versalhöhe von Arimo der Referenz gleicht. Der
Median der Abweichung ist 0,0 %. Wo Arimo zu breit für den verfügbaren Platz ist, wurde der Lauf
verkleinert. Das betrifft **21 Läufe**. Ihre Versalhöhe liegt 2,5 bis 22 % unter der Referenz.

- 18 der 21 sind fett gesetzte Läufe, vor allem in Anhang J.
- Die größten Abweichungen: „Ex" (5.8.1.11) −22 %, „APRT" (J.3.9) −18 %, „BS" (J.3.2) und
  „mBS" (J.3.3) je −14 %, „L" (J.4.8) −12 %, „Fax" (J.1.9) −11 %, „SDS" (J.1.5/J.1.6) −10 %.
- Die übrigen: „FRT", „HRT", „MRT", „VoIP", die DMO-/TMO-Läufe in J.1.3–J.1.6, J.3.4 und J.3.5,
  dazu „LtS" (D.2.5) und „L" (D.2.4) mit −2,5 bis −9 %.

Das ist die unmittelbare Folge von „zu breit und zu fett": Der Text passt nur verkleinert in den
Platz, den die Referenz ihm gibt.

### 3.5 Welche Schrift ist es? (Vermutung, nicht belegt)

Die Formmerkmale, gesehen an gerenderten Textebenen:

- humanistische Grotesk
- großes I mit Serifen (E.1.7, E.2.13, I.3.3, J.3.15, N.2.3, 5.8.8.4)
- kleines l mit Fuß nach rechts
- t mit schräg angeschnittenem Kopf
- zweistöckiges g (aufrecht; alle sechs Vorkommen haben drei Konturen). Einstöckig ist nur das
  kursive g in D.1.1. Korrigiert nach `docs/reviews/2026-09-29-lfh-585-schriftmessung.md`,
  Abschnitt 3.2; die erste Fassung dieser Notiz nannte es einstöckig.
- Ziffer 1 mit Fähnchen
- x-Höhe 0,70 der Versalhöhe, Stärke „medium"

**Vermutung: BundesSans**, die Hausschrift des Corporate Designs der Bundesregierung. Dafür
spricht:

- Das BBK ist eine Bundesbehörde.
- Der Styleguide der Bundesregierung beschreibt die BundesSans als humanistische Grotesk nach den
  Lesbarkeitsempfehlungen des DBSV (Deutscher Blinden- und Sehbehindertenverband). Gut
  unterscheidbare I, l und 1 passen dazu.

Dagegen spricht oder ungeklärt ist:

- Eine Zusammenfassung eines Interviews zur Entstehung der Schrift (typografie.info) nannte ein I
  ohne Serifen.
- An einem Schriftmuster ist nichts geprüft.

Für die Entscheidung spielt die Frage keine Rolle. Laut Styleguide darf die BundesSans „nur von
Bundesbehörden verwendet werden, die dem CD der Bundesregierung folgen". Den Download gibt es nur
für deren Beschäftigte. Für ein offenes npm-Paket kommt sie nicht in Frage.

### 3.6 Was das an den Annahmen vom 19. September ändert

- **„Schmal laufend" (§6) trifft nur schwach zu.** Die Referenz ist eine normal breite
  humanistische Grotesk und damit von Natur aus etwas schmaler als Arimo, das auf Arial-Breiten
  gebaut ist. Die Suche nach einer Schmalschrift (§5.4) zielt in die falsche Richtung.
- **„Halbfett" (§6) trifft nicht zu. Richtig ist eine einzige mittlere Stärke.** Die Einführung
  von `fontWeight: 700` (§4) bringt die betroffenen Läufe näher an die Referenz. Sie überschießt
  aber: 34 % zu dick statt 13 % zu dünn.

## 4. Kandidaten und Lizenzen

Die Lizenzangaben stammen aus `METADATA.pb` und `OFL.txt` im Repository google/fonts, abgerufen
am 29. September 2026. Eine Schriftdatei wurde nicht geladen.

| Kandidat | Lizenz | Reservierter Name | Schnitte | Variabel | Kursiv | Breite gegenüber Referenz |
|---|---|---|---|---|---|---|
| **Arimo** (heute) | OFL 1.1 | keiner | 400–700 | wght 400–700, **keine Breitenachse** | Arimo-Italic[wght] | 10 % zu breit (gemessen) |
| PT Sans | OFL 1.1 | **„PT Sans", „ParaType"** | Regular, Bold, nur statisch | nein | ja | ±2 % (Stellvertreter); Stärke 0,119 bzw. 0,196, **kein Medium** |
| PT Sans Narrow | OFL 1.1 | „PT Sans" | Regular, Bold | nein | nein | 17–21 % zu schmal (Stellvertreter) |
| Liberation Sans Narrow | nicht belastbar geklärt: Narrow nur im älteren Zweig belegt, dort GPLv2 mit Font Exception; der OFL-Zweig 2.1.x hat keine Release-Dateien | – | – | nein | – | ≈ Arial Narrow: 12 % zu schmal |
| Archivo | OFL 1.1 | keiner | 100–900 | wght 100–900, **wdth 62–125** | ja (variabel) | nicht gemessen (Download nötig) |
| Archivo Narrow | OFL 1.1 | keiner | 400–700 | wght | ja | nicht gemessen |
| Roboto Condensed | OFL 1.1 | nicht geprüft | 100–900 | wght | ja | nicht gemessen |
| IBM Plex Sans | OFL 1.1 | **„Plex"** | 100–700 | wght 100–700, **wdth 75–100** | ja (variabel) | nicht gemessen |
| IBM Plex Sans Condensed | OFL 1.1 | „Plex" | 100–700, statisch | nein | ja | nicht gemessen |
| Open Sans | OFL 1.1 | keiner | 300–800 | wght 300–800, **wdth 75–100** | ja (variabel) | nicht gemessen |
| Barlow Semi Condensed | OFL 1.1 | nicht geprüft | 100–900, statisch | nein | ja | nicht gemessen |
| Fira Sans | OFL 1.1 | keiner | 100–900 inkl. **Medium**, statisch | nein | ja | nicht gemessen |
| Source Sans 3 | OFL 1.1 | **„Source"** | 200–900 | wght | ja (variabel) | nicht gemessen |

Die Tabelle ist nach dem Suchauftrag geordnet. Aus dem Befund ergibt sich ein anderes Suchbild
als in §5.4: eine **normal breite humanistische Grotesk mit Medium-Stufe und Kursive**. Fira Sans,
Source Sans 3, Open Sans (mit leicht verringerter Breite), IBM Plex Sans und PT Sans passen
dazu besser als die Schmalschriften. Ob eine davon das I mit Serifen **und** das l mit Fuß
hat, ist ungeprüft. Das müsste ein Blick in die heruntergeladenen Dateien klären.

**Was die Lizenz für die Auslieferung heißt (Selbsteinschätzung, keine Rechtsauskunft).**

- **Schriftdatei im npm-Paket** (heute in `@einsatzzeichen/conformance`): Die OFL erlaubt die
  Weitergabe, auch gebündelt mit Software, solange der Lizenztext beiliegt und die Schrift nicht
  allein verkauft wird. Das ist heute bei Arimo so gelöst (`Arimo-OFL.txt`).
- **Teilmenge oder Zwischenstufe:** Das Repository reduziert die Schrift auf eine Teilmenge der
  Zeichen und leitet eine Fettstufe ab. Nach der OFL ist beides eine „veränderte Fassung". Hat eine
  Familie einen reservierten Namen (PT Sans, IBM Plex, Source Sans 3), **muss die veränderte Datei
  umbenannt werden**. Mit ihr ändert sich `TEXT_FONT_FAMILY_ATTR` und damit das `font-family` in
  jedem ausgelieferten SVG. Arimo, Archivo, Open Sans und Fira Sans haben keinen reservierten
  Namen. Diese Folge entfällt bei ihnen.
- **Gerasterte Bilder (PNG):** Sie enthalten keine Schrift, nur Pixel. Aus der Schriftlizenz
  folgt für sie keine Pflicht.
- **SVG mit `<text>`:** Die Katalog-SVGs nennen die Schrift nur beim Namen und enthalten sie
  nicht. Der Review-Server bettet die Schriftdatei als `data:`-URI in jedes SVG mit Text ein
  (`embedTextFont` in `packages/review/src/server/render.ts`). Das ist eine Weitergabe der Schrift.
  Die OFL erlaubt sie, der Lizenzhinweis muss aber auffindbar sein.

**Was der Renderer auswertet.** Auf dem Rechner geprüft mit `@resvg/resvg-js` 2.6.2 und der
variablen Datei `SF-Pro.ttf`:

- Normal, `font-weight="700"`, `font-stretch="condensed"` und `font-variation-settings: 'wdth' 75`
  ergeben bit-gleich dieselbe Tinte (2.245 Pixel).
- resvg wertet also weder die Stärkeachse noch die Breitenachse aus.
- Jede Stufe, auch eine Breite aus Archivo, Open Sans oder IBM Plex Sans, braucht deshalb wie
  `Arimo-Bold.ttf` eine eigene statische Datei. Sie wird mit fontTools aus der variablen Datei
  abgeleitet.

## 5. Kursiv, getrennt geprüft

**Prüfpunkt, keine Entscheidung.** D.1.1 setzt „Bezeichnung" kursiv. In den 260 Textebenen der
Referenz ist das der **einzige** geneigte Lauf:

- In den zugeordneten Läufen messen alle senkrechten Striche einheitlich 0,156. Ein geneigter Lauf
  würde dort breiter messen.
- Die 80 nicht zugeordneten Ebenen wurden einzeln angesehen.

**Maße der Referenz.**

- Versalhöhe 2,92 mm, Laufbreite 21,34 mm. Das sind 0,892 der Arimo-Breite, genauso schmal wie
  bei den aufrechten Läufen.
- Neigung 9,0°, gemessen am Stamm des B: 1,307 seitwärts auf 8,275 Höhe.
- Heute setzt der Katalog den Lauf aufrecht in Arimo 400 (`leadership.command-post-in-operation`).

**Was für Arimo Italic spricht.**

- Gleiche Familie, gleiche Lizenz (OFL, kein reservierter Name). Die Datei liegt im selben
  Verzeichnis wie die heute gepinnte Quelle: `ofl/arimo/Arimo-Italic[wght].ttf`, 543.196 Byte,
  variabel 400–700.
- Arimo ist auf die Zeichenbreiten von Arial gebaut. Geprüft: 583 von 585 Zeichen haben exakt
  dieselben Vorschübe (den Platz je Buchstabe).
- Arial Italic hat für alle Zeichen von U+0020 bis U+00FF dieselben Vorschübe wie Arial normal.
  Abweichungen gibt es nur bei 53 selteneren Zeichen aus Latin Extended, etwa ď, ľ, Ĳ. Das gilt
  entsprechend für den fetten Schnitt.
- Daraus folgt **indirekt**: Arimo Italic hat sehr wahrscheinlich dieselben Vorschübe wie Arimo.
  Der Lauf bliebe gleich breit.
- resvg wählt eine Kursivdatei, wenn sie vorliegt. Geprüft mit Arial und Arial Italic: Mit beiden
  Dateien ergibt `font-style="italic"` eine andere Tinte. Mit nur der aufrechten Datei bleibt der
  Lauf bit-gleich aufrecht. resvg neigt also nicht künstlich.

**Was offen bleibt, bis die Datei geladen ist.**

- Der Neigungswinkel von Arimo Italic. Arial Italic neigt um 12°, die Referenz um 9°.
- Die Tintenränder der kursiven Buchstaben. Das Textmetrik-Gate schneidet an der Tinte ab, und
  kursive Buchstaben ragen seitlich über.
- Ob die Vorschübe tatsächlich übereinstimmen.

**Was Kursiv berühren würde, unabhängig von der Schriftfrage.**

- das Textprimitiv: ein neues Feld `fontStyle`; das Schema kennt heute nur `fontWeight: 400 | 700`
  (`packages/schema/src/geometry.ts`)
- SVG- und Canvas-Renderer: das Attribut schreiben
- ein Kursiv-Metrikanbieter nach dem Muster von `TextMetrics.bold`, mit eigener Metrikdatei aus
  `scripts/font/export-metrics.py`
- `scripts/font/subset-arimo.sh`: Teilmenge und statische Stufe
- SHA-Pinning und `resvgFontOptions()` in `packages/conformance/src/fonts.ts`
- das `@font-face` des Review-Servers: Es erklärt heute nur `font-style:normal`
- die PNG-Route der Website und `packages/website/src/styles/theme.css`

Wird Option B gewählt, gehört die Kursive in dieselbe Stärke (500). Sie wird wie die Fettstufe als
statische Datei aus der variablen Kursivdatei abgeleitet.

**Einschätzung.** Kursiv allein ist deutlich billiger als ein Schriftwechsel. Es geht um einen
Lauf, eine Datei derselben Familie und dieselben Breiten. Der Aufwand steckt im Schema und in den
Renderern, nicht in der Lizenz.

## 6. Was ein Wechsel berühren würde

**Textbestand.**

- 160 von 257 Katalog-Snapshots und 43 von 269 Piktogramm-Snapshots enthalten Text, zusammen
  **298 Textläufe**. 30 davon sind fett gesetzt, alle in Piktogrammen.
- Das Coverage-Manifest hat 544 Zeilen. 526 davon haben einen Snapshot, 203 dieser Snapshots
  tragen Text. Die 18 Zeilen ohne Snapshot sind nicht mitgezählt.
- Die Kontaktbögen unter `__snapshots__/multi-size` derselben rund 203 Zeichen rastern neu. Ihre
  Bildunterschriften sind nicht in Arimo gesetzt und bleiben gleich.

**Schriftabhängige Konstanten und Handmaße.**

- `ARIMO_CAP_HEIGHT_FRACTION` kommt 41-mal vor. Aus ihm werden Schriftgrade aus gemessenen
  Versalhöhen abgeleitet, unter anderem in `validate.ts` und `layout/zones.ts`.
- `ARIMO_TEXT_METRICS` kommt 23-mal vor.
- Zusammen stehen Arimo-Konstanten in 24 Dateien.
- Dazu kommen 82 handvermessene Textboxen (`boxMm`) in core und conformance. Sie sind an der
  Referenztinte mit Arimo-Laufweiten nachgerechnet.
- An Arimo gemessen sind außerdem `DIACRITIC_HEADROOM_FRACTION` und die Anteile oberhalb der
  Grundlinie in `packages/core/src/render/text-policy.ts`.
- Zwei benannte Ausnahmen rechnen mit Arimo-Seitenrändern (`named-exceptions.ts`).

**Dateien und Stellen.**

- `packages/core/src/text-metrics.ts`, `packages/core/src/geometry/text-metrics.ts` und die
  Metrikdateien `packages/core/src/assets/arimo(-bold)-metrics.json`
- `packages/conformance/src/fonts.ts` (SHA-Pinning und `resvgFontOptions()`),
  `packages/conformance/assets/` (Datei, Lizenztext, README)
- `scripts/font/subset-arimo.sh` und `scripts/font/export-metrics.py`
- die Website:
  - PNG-Route `packages/website/src/pages/zeichen/[slug].png.ts` mit eigenem Hash-Abgleich
  - `theme.css` liefert Arimo selbst aus
  - `MapLibreLab.tsx` wartet auf „Arimo"
  - `SymbolPreview.astro`
  - fünf Dokuseiten nennen Arimo
- der Review-Server: `embedTextFont`
- `packages/cli/src/commands/visual-proof.ts`
- Release und Gates: `scripts/release/copy-conformance-assets.mjs` und
  `scripts/gates/core-package.mjs`, das die Dateinamen `arimo(-bold)-metrics.json` erwartet
- die Quellenführung: `arimo-ofl` in `packages/schema/src/provenance.ts` und
  `packages/conformance/src/sources.ts`
- die Tests `fonts.test.ts`, `text-metrics.test.ts` (core und conformance),
  `pictograms/text-ink.test.ts`, `body-marks.test.ts`, die Snapshot-Tests und
  `a11y-contrast-gate.test.ts`

**Unterschied nach Weg.**

- **Zwischenstufe von Arimo:** Die Versalhöhe je Schriftgrad bleibt gleich
  (`ARIMO_CAP_HEIGHT_FRACTION` gilt weiter). Die Schriftgrade und die 82 Boxen bleiben stehen und
  werden nur neu geprüft.
  - Die Vorschübe ändern sich leicht: Normale Läufe werden knapp 1 % breiter, bisher fette rund
    4 % schmaler.
  - Ob alle Boxen im Toleranzpixel bleiben, zeigt erst ein Gate-Lauf. Das ist hier nicht
    behauptet.
  - Das Schema muss die neue Stufe kennen (`fontWeight` heute 400 | 700).
  - Wie resvg die Stufe wählt, ist auf dem Rechner geprüft, mit einer aus der eingecheckten Datei
    abgeleiteten Stufe im Scratchpad. `font-weight="480"` fällt auf die normale Datei zurück, auch
    wenn eine 480er-Datei vorliegt. Eine Datei, die als „Medium" mit Gewichtsklasse 500 benannt
    ist, wählt resvg im Test für `font-weight="500"`; normale und fette Läufe bleiben
    unverändert. Deshalb ist B mit der Stufe 500 beschrieben. Browser mit der variablen Datei
    setzen dieselbe Stufe.
- **Andere Familie:** Die Versalhöhe je Schriftgrad ändert sich. Alle 41 abgeleiteten Schriftgrade,
  alle 82 Boxen, die Diakritik- und Grundlinienanteile und beide Metrikdateien sind neu
  herzuleiten. Hat die Familie einen reservierten Namen, ändert sich zusätzlich der Schriftname in
  jedem SVG.

## 7. Optionen

### (A) Arimo bleibt, wie es ist

- **Vorteile:** kein Aufwand, kein Risiko, keine Snapshot-Änderung.
- **Nachteile:**
  - Text bleibt 13 % zu dünn (normal) oder 34 % zu dick (fett) und rund 10 % zu breit.
  - 21 Läufe bleiben verkleinert.
  - Die Formen (I, l, t, g) bleiben andere.
  - D.1.1 bleibt aufrecht.
  - Das Fachreview wird „falsche Schrift" weiter melden.

### (B) Arimo bleibt, eine Zwischenstärke ersetzt normal und fett

Eine statische Arimo-Stufe „Medium" (500) wird für allen Katalogtext gesetzt. Sie wird aus der
eingecheckten Datei abgeleitet, wie `Arimo-Bold.ttf`. Kursiv folgt als eigener Schritt in derselben
Stärke (siehe Abschnitt 5).

- **Vorteile:**
  - Die Strichstärke trifft die Referenz auf 3 %, in allen Familien gleich.
  - Die fetten Läufe werden rund 4 % schmaler. Schätzung: Die etwa acht Läufe in Anhang J, die
    heute um höchstens 3,5 % verkleinert sind (VoIP, die DMO-/TMO-Läufe), könnten auf
    Referenzgröße zurück. Die übrigen zehn fetten gewinnen rund 4 Prozentpunkte. Die drei
    normalen („mBS", „LtS", „L" in D.2.4) werden knapp 1 % breiter und passen noch knapper. Ob
    ein Lauf wirklich wachsen darf, hängt zusätzlich an seiner Box.
    *Korrektur nach dem Gate-Lauf (Abschnitt 10):* Bei reinen Versalien ist 500 nur 0,5–1 %
    schmaler als 700, bis 4,3 % nur mit Kleinbuchstaben. Normal gesetzte Läufe werden in 500 um
    2,3–5,4 % breiter, nicht um knapp 1 %. Sieben der acht Läufe kehren trotzdem zurück, weil
    ihre Boxen mehr Platz ließen als ihre Tinte in 700 (Abschnitt 10.4).
  - Kein Download, keine neue Lizenz, kein neuer Schriftname.
  - Schriftgrade und Handmaße bleiben gültig.
  - Die Unterscheidung normal/fett ohne Gegenstück in der Referenz entfällt.
- **Nachteile:**
  - Die Laufweite bleibt rund 11 % zu breit, und damit bleibt der größere Teil der
    Verkleinerungen.
  - Die Formen bleiben Arial-artig.
  - Alle 298 Läufe und 526 Kontaktbögen rastern neu.
  - Das Schema bekommt eine dritte Stärke.
  - Einzelne Boxen könnten um Bruchteile eines Millimeters nachzuziehen sein.

### (C) Wechsel auf eine normal breite humanistische Grotesk mit Medium und Kursive

Beispiele: Fira Sans, Source Sans 3, Open Sans, IBM Plex Sans. Die Wahl erst nach einer Messung.

- **Vorteile:** Laufweite, x-Höhe und Buchstabenformen können der Referenz deutlich näherkommen.
  Kursiv liegt in derselben Familie vor.
- **Nachteile:**
  - Voller Umbau: 41 Schriftgrade, 82 Boxen, zwei Metrikdateien, Diakritik- und
    Grundlinienmessungen, alle Snapshots, Website, Review-Server.
  - Download und Lizenzprüfung je Kandidat.
  - Bei reserviertem Namen wird umbenannt, und der Schriftname in jedem SVG ändert sich.
  - Heute ist kein Kandidat gemessen. Die Nähe zur Referenz ist nicht belegt.

### (D) Schmal laufende Ersatzschrift, wie in §5.4 angedacht

Beispiele: Archivo Narrow, Roboto Condensed, PT Sans Narrow, Liberation Sans Narrow.

- **Vorteile:** Keine, die der Befund stützt.
- **Nachteile:**
  - Alle gemessenen Schmalschriften sind 10–32 % schmaler als die Referenz. Der Fehler dreht sich
    nur um.
  - Dazu kommt der volle Umbau wie bei C.

## 8. Empfehlung

**B, mit Kursiv als eigenem Schritt. D nicht verfolgen. C nur nach Messung und nur, wenn nötig.**

Begründung:

1. **Die Stärke ist der größte messbare Unterschied, den das Projekt ohne Familienwechsel beheben
   kann.** Die Abweichung schrumpft von −13 % bzw. +34 % auf rund 3 %. Die Laufweite (rund 10 %)
   kann nur eine andere Familie beheben.
2. **B braucht weder Download noch Lizenzprüfung noch Umbenennung.** Die Versalhöhe je
   Schriftgrad bleibt, und damit bleiben die 41 abgeleiteten Schriftgrade und die 82 Handmaße
   gültig. Der Weg ist erprobt: Die Fettstufe vom 19. September entstand genauso.
3. **B behebt einen Fehler der letzten Runde.** Die Fettsetzung in Anhang J und Teilen von
   Kapitel 4/5.8 ist in der Referenz nicht begründet. Sie verschärft die Verkleinerungen: Ein
   fetter Lauf ist rund 4 % breiter als derselbe Lauf in Stufe 500. Die Hauptursache bleibt die
   Breite von Arimo.
4. **Kursiv ist ein Lauf.** Der Weg über Arimo Italic ist billig, sobald eine Prüfmessung Neigung,
   Vorschübe und Tintenränder bestätigt.
5. **C lohnt erst, wenn das Fachreview nach B weiter „falsche Schrift" meldet.** Dann gilt:
   - drei Kandidaten laden und mit derselben Methode messen;
   - Kandidaten ohne reservierten Namen bevorzugen (Fira Sans, Open Sans);
   - die Formen I, l, t und g prüfen.

## 9. Offene Punkte und nächste Schritte

**Downloads für eine belastbare Messung** (Freigabe des Nutzers nötig; alle aus dem Repository
google/fonts, Größen laut GitHub-API):

| Zweck | Datei | Pfad | Größe |
|---|---|---|---|
| Kursiv-Prüfpunkt (B) | `Arimo-Italic[wght].ttf` | `ofl/arimo/` | 543.196 Byte |
| Kandidat C, ohne reservierten Namen | `FiraSans-Medium.ttf`, `FiraSans-MediumItalic.ttf` | `ofl/firasans/` | 457.248 und 472.624 Byte |
| Kandidat C, ohne reservierten Namen | `OpenSans[wdth,wght].ttf`, `OpenSans-Italic[wdth,wght].ttf` | `ofl/opensans/` | 532.636 und 583.992 Byte |
| Kandidat C, reservierter Name „Source" | `SourceSans3[wght].ttf`, `SourceSans3-Italic[wght].ttf` | `ofl/sourcesans3/` | 646.340 und 395.372 Byte |
| Kandidat C, reservierter Name „Plex" | `IBMPlexSans[wdth,wght].ttf` | `ofl/ibmplexsans/` | 537.244 Byte |
| Gegenprobe Stellvertreter | `PT_Sans-Web-Regular.ttf`, `PT_Sans-Web-Bold.ttf` | `ofl/ptsans/` | 442.960 und 470.240 Byte |
| Breitenachse prüfen | `Archivo[wdth,wght].ttf` | `ofl/archivo/` | 658.596 Byte |

Die Stufe 500 für B braucht keinen Download. Sie wird aus der eingecheckten
`Arimo[wght].ttf` abgeleitet.

**Offene Punkte.**

- Gate-Lauf mit der Stufe 500, bevor B umgesetzt wird. Zu klären:
  - welche der 82 Boxen und der Textmetrik-Prüfungen anschlagen;
  - wie Browser (Website, Review-Server) die Stufe aus der variablen Datei setzen.
- Welche der 21 verkleinerten Läufe nach B auf die Referenzgröße zurückkehren können.
- Kapitel 2 setzt in der Referenz eine leichtere Stufe (0,126). Sollte der Katalog dort je Text
  setzen, gilt die Stufe 500 dort nicht.
- Die Schriftbestimmung (BundesSans) bleibt Vermutung. Eine Anfrage beim BBK wäre möglich, ist für
  die Entscheidung aber nicht nötig: Die Schrift ist nicht frei.
- Die Messskripte liegen außerhalb des Repositorys, im Sitzungs-Scratchpad. Die Methode ist in
  Abschnitt 2 beschrieben. Wird C verfolgt, gehört ein Messskript nach `scripts/font/`.

## 10. Entscheidung, Gate-Lauf und Umsetzung (29. September 2026)

**Entscheidung.** Der Projektinhaber hat am 29. September 2026 Option B gewählt: Arimo bleibt, eine
statische Stufe 500 („Medium") ersetzt normal und fett für allen Katalogtext. Kursiv ist ein
eigener Schritt; Abschnitt 5 gilt unverändert.

### 10.1 Die Datei

- `packages/conformance/assets/Arimo-Medium.ttf`, 53.080 Byte, SHA-256 `0eb23f01…b0f8bdd35`
  (`TEXT_FONT_MEDIUM_SHA256`). `scripts/font/subset-arimo.sh` leitet sie wie `Arimo-Bold.ttf` aus
  dem eingecheckten Subset ab (fontTools-Instancer, wght 500) und exportiert
  `packages/core/src/assets/arimo-medium-metrics.json`.
- Das Upstream-Original wurde neu geladen und gegen `TEXT_FONT_SOURCE_SHA256` geprüft. fontTools
  4.66.0 erzeugt Subset, Fett- und Medium-Instanz bit-gleich zu den eingecheckten Dateien. Die
  unabhängige Ableitung der Schriftmessung (`docs/reviews/2026-09-29-lfh-585-schriftmessung.md`)
  ist byte-gleich.
- Namen: Familie „Arimo Medium" (Eintrag 1), typografische Familie „Arimo" (16), Stil „Medium"
  (17), `usWeightClass` 500. Damit wählt resvg die Datei für `font-weight="500"`. Läufe in 400 und
  700 rastern mit ihr bit-gleich wie ohne sie, auch die Bildunterschriften der Kontaktbögen
  (`sans-serif`, fett). Das prüft `fonts.test.ts`.
- Die Kopfwerte sind unverändert, die Versalhöhe ist 1409/2048 wie in 400.
  `ARIMO_CAP_HEIGHT_FRACTION` und alle daraus abgeleiteten Schriftgrade gelten weiter. Die Akzente
  reichen in 500 um 12/2048 em höher (Ä 1726 statt 1714). Die Rasterbelege für Fußzone und
  Beschriftungen laufen jetzt in 500 und bestehen mit `DIACRITIC_HEADROOM_FRACTION` und
  `ALPHABETIC_ASCENT_FRACTION` unverändert.
- Browser (Website, Review-Server) liefern weiter die variable Datei aus und setzen 500 aus der
  Achse.

### 10.2 Gate-Lauf

Alle 298 Textläufe aus 525 Renderfällen (Grundzeichen, Rezepte, Piktogramme) wurden in 500 gegen
ihre unveränderten Boxen gerechnet. Danach liefen Textmetrik-Gate, Rasterbelege (`fonts.test.ts`,
`pictograms/text-ink.test.ts`), Clipping- und Kontrast-Gates.

- **B scheitert nicht grundsätzlich.** Kein bisher fetter Lauf überschreitet seine Box.
- **Acht bisher normale Läufe** überschreiten ihre Box um 0,1–0,8 mm:
  - „KatSL" (D.1.2), „Bezeichnung" (D.1.1), „L" (D.2.4), „LtS" (D.2.5), „stv OB" (D.3.14);
  - „Strömungsrettung" in I.1.17, I.1.18 und I.2.6.
- **Korrektur der Schätzungen aus Abschnitt 6 und 7.**
  - Normal gesetzte Läufe werden in 500 um 2,3–5,4 % breiter, nicht um knapp 1 %. Maßgeblich
    sind die Kleinbuchstaben: a, g, x und ähnliche haben in 500 größere Vorschübe.
  - Bisher fette Läufe werden 0,6–4,3 % schmaler. Bei reinen Versalien (DMO, TMO, VoIP) sind es
    nur 0,5–1 %. Die „rund 4 %" gelten nur für Läufe mit Kleinbuchstaben.
  - Gegen die heutige Tintenbreite gemessen, wächst deshalb kein Lauf zurück. Das steht so in
    der Schriftmessung, Abschnitt 4. Entscheidend ist aber die Box: Viele Boxen in Anhang J
    ließen mehr Platz als die Tinte in 700.

### 10.3 Umsetzungsentscheidung: Schema erweitert, Rezepte setzen 500 ausdrücklich

- `fontWeight` im Textprimitiv kennt jetzt `400 | 500 | 700`. Die Erweiterung ist abwärts
  verträglich.
- Fehlt der Wert, gilt weiter 400. Die Ausgabe bleibt dann bytegleich. Eigene IR anderer Nutzer
  ändert sich also nicht.
- Jede Stelle in core, die Katalogtext erzeugt, setzt `fontWeight: CATALOG_TEXT_FONT_WEIGHT`
  (500, `render/text-policy.ts`). Das sind Kompositionsläufe samt Fußzone, Piktogramm-Hilfen und
  Funktionsrollen. Die Hilfen `commsText` und `stateText` nehmen kein Gewicht mehr entgegen.
- `conformance/src/catalog-text-weight.test.ts` prüft, dass kein Katalogfall einen Lauf ohne 500
  trägt.
- **Verworfen wurde die Abbildung „400/700 bedeuten im Katalog 500".** Dann stünde in der IR ein
  anderes Gewicht, als gerendert wird. Die Textmetrik müsste raten, welchen Schnitt sie misst.
  SVG, Canvas und Browser müssten dieselbe versteckte Umdeutung kennen.
- **Verworfen wurde auch „ohne Angabe heißt 500".** Das hätte jede fremde IR ohne Gewicht
  verändert und den dokumentierten Default gebrochen.
- SVG schreibt `font-weight="500"`, Canvas setzt `500 <px>px Arimo`. 400 schreibt in beiden
  Renderern nichts.
- Der Textmetrik-Anbieter hat einen Schnitt `medium`. Ein Lauf in 500 ohne diesen Schnitt wirft,
  wie ein fetter Lauf ohne `bold`.
- **Ausnahme Kapitel 2.** Die Lückenbeschriftungen der Grenzlinien (`gapLabel` in
  `geometry/parametric.ts`) bleiben ohne Gewicht, also 400. Die Referenz misst dort 0,126 ×
  Versalhöhe (Abschnitt 3.2).
- `Arimo-Bold.ttf` bleibt im Paket. Sie dient eigener IR mit 700, `visual-proof.ts` und den
  Bildunterschriften der Kontaktbögen.

### 10.4 Was mit den Läufen geschah

**Zurückgewachsen auf Referenzversalhöhe**: 7 Läufe, alle aus der Liste in Abschnitt 3.4. Ihre
Tinte passt in 500 bei voller Höhe in die bestehende, unveränderte Box.

| Lauf | Zeichen | Schriftgrad vorher → nachher | Versalhöhe nachher / Referenz |
|---|---|---|---|
| „DMO", „TMO" (klein) | J.1.3, J.1.4 (`SMALL`) | 6,9 → 7,1 mm | 4,885 / 4,869 mm |
| „TMO" (groß) | J.1.6 (`LARGE`) | 10,3 → 10,6 mm | 7,293 / 7,302 mm |
| „TMO", „DMO" | J.3.4 (`smallLabel`) | 6,9 → 7,1 mm | 4,885 / 4,869 mm |
| „DMO" | J.3.5 (`smallLabel`) | 6,9 → 7,1 mm | 4,885 / 4,869 mm |
| „VoIP" | J.3.15 | 4,1 → 4,243 mm | 2,919 / 2,919 mm |

- Das große „DMO" in J.1.5 und J.1.7 bleibt bei 10,3 mm (eigene Konstante `LARGE_DMO`). Bei
  10,6 mm reichte seine Tinte rechts 0,13 mm über die 23,5-mm-Box, knapp über der Toleranz von
  0,125 mm. Mit einer Box von 23,8 mm bestünde es alle Gates. Die Box läge weiter innerhalb der
  Piktogrammbox. Das ist eine Entscheidung, die offen bleibt: Ein Lauf soll nicht zugleich
  wachsen und seine Box vergrößern, ohne dass jemand das bestätigt.
- Nicht zurückgewachsen: „Ex", „APRT", „BS", „mBS", „Fax", „FRT", „HRT", „MRT", „L" (J.4.8),
  „SDS" (J.1.5, J.1.6), „LtS" (D.2.5), „L" (D.2.4). In voller Höhe passen sie nicht in ihre Box
  (MRT um 0,06 mm). „L" in J.4.8 bräuchte eine höhere Box. Bei „SDS" ist die Box der Rahmen
  selbst. Ihre Schriftgrade bleiben, wie sie mit den Metriken von 700 bzw. 400 bestimmt wurden.
  Die Kommentare nennen das.
- Nicht zurückgewachsen ist außerdem das große „DMO" in J.1.5 (siehe oben).
- Von 21 verkleinerten Läufen bleiben damit 14. Neu verkleinert sind 3 (unten).

**Box verbreitert, Schriftgrad unverändert.** Die Tinte in 500 bleibt dabei innerhalb der
Körperkontur.

| Lauf | Zeichen | Box vorher → nachher |
|---|---|---|
| „KatSL" | D.1.2 | 2,2 … 30,3 → 2,0 … 30,45 mm |
| „Bezeichnung" | D.1.1 | Breite 24,3 → 25,15 mm |
| „L" | D.2.4 | Breite 4,4375 → 4,6875 mm |
| „LtS" | D.2.5 | Breite 13,75 → 14,1875 mm |
| „stv OB" | D.3.14 | 18,8 … 31,5 → 18,55 … 31,5 mm |

Die Breite 25,15 mm bei D.1.1 lässt schon Platz für den kursiven Lauf in 500. Laut Schriftmessung
endet er bei 27,779 mm und braucht mindestens 25,11 mm.

**Neu verkleinert**: „Strömungsrettung".

- In I.1.17 und I.1.18 sinkt die Versalhöhe von 2,5 auf 2,45 mm (−2 %). Bei 2,5 mm reichte die
  Tinte in 500 bis 1,24 mm, also in die Körperkontur (Innenkante 1,25 mm).
- In I.2.6 sinkt sie von 2,191447 auf 2,12 mm (−3,3 %). Ein eigener Boxrand ist am Anhängerkörper
  nicht zulässig (`center-box-margin-override-requires-measured-body`).
- Beide Werte stehen in `named-exceptions.ts`.

### 10.5 Snapshots

406 Snapshot-Dateien ändern sich (Stand nach allen Änderungen gegenüber `b2a8697f`):

- 160 Katalog-SVGs und 43 Piktogramm-SVGs mit Text. Dort ändern sich nur `font-weight`
  (neu 500, bisher fehlend oder 700) und die Schriftgrade aus 10.4.
- 203 Kontaktbögen unter `__snapshots__/multi-size`, die neu rastern.

Ein Kontaktbogen mit Referenz, Stand vorher und Stand nachher für 15 Zeichen wurde angesehen. Die
Stichprobe umfasst die Läufe aus 10.4 sowie 4.2.2 und 5.8.1.11. Die Strichstärke liegt sichtbar
näher an der Referenz. „Strömungsrettung" und „KatSL" füllen ihren Körper so knapp wie vorher.
„stv OB" (D.3.14) berührt mit dem s die Rautenkontur, wie vorher und wie in der Referenz; in 500
reicht es 0,2 mm weiter nach links. Sonst berührt kein Lauf fremde Geometrie.

### 10.6 Offen

- Kursiv in D.1.1 (Abschnitt 5, Vorschlag in der Schriftmessung, Abschnitt 2.6). Umgesetzt,
  siehe Abschnitt 11.
- Laufweite und Formen: Sie kann nur Option C beheben. Die Schriftmessung beziffert den Gewinn.

## 11. Kursiv in D.1.1 umgesetzt (29. September 2026)

Umgesetzt ist der Vorschlag aus der Schriftmessung
(`docs/reviews/2026-09-29-lfh-585-schriftmessung.md`, Abschnitt 2.6). „Bezeichnung" in D.1.1
steht jetzt kursiv in Stufe 500, wie in der Referenz. Der Download des kursiven Originals war
freigegeben.

### 11.1 Die Datei

- **Original:** `ofl/arimo/Arimo-Italic[wght].ttf` aus google/fonts, 543.196 Byte, SHA-256
  `a80fc54fd0233c1dfe298577c4d00f5ae81d5bb83510975e473c47e699b7f4ed`
  (`TEXT_FONT_ITALIC_SOURCE_SHA256`). Die Datei liegt nicht im Repository.
- **Abgeleitet:** `packages/conformance/assets/Arimo-MediumItalic.ttf`, 57.632 Byte, SHA-256
  `72cdd3f0395bf0bf3752dcf6d92fb4d5b3559323aa0dc4bde95acff94eb03bd1`
  (`TEXT_FONT_MEDIUM_ITALIC_SHA256`). Die Schriftmessung nannte 57.656 Byte; die 24 Byte
  Unterschied sind die kürzeren Namen in den Einträgen 3 und 6 (unten).
- **Herleitung:** `scripts/font/subset-arimo.sh` reduziert das Original mit denselben
  `pyftsubset`-Argumenten wie die aufrechte Datei und leitet mit dem fontTools-Instancer die
  Stufe 500 ab.
  - Den PostScript-Namen und die eindeutige Kennung setzt das Skript auf `Arimo-MediumItalic`.
    Der Instancer hätte `ArimoItalic-MediumItalic` übernommen.
  - Zwei Läufe ergeben dieselbe Datei. Subset, Fett- und Medium-Instanz bleiben dabei bit-gleich.
- **Lizenz:** `Arimo-OFL.txt` deckt die Datei. Die Quellenführung (`arimo-ofl` in
  `packages/conformance/src/sources.ts`) und `packages/conformance/assets/README.md` nennen sie.
- **Kopfwerte:** wie aufrecht, Versalhöhe 1409/2048. `ARIMO_CAP_HEIGHT_FRACTION` gilt auch für den
  kursiven Lauf. Der Schriftgrad von D.1.1 (4,243 mm) bleibt.

### 11.2 Schema, Gate und Renderer

- **Schema:** Das Textprimitiv kennt `fontStyle?: 'italic'`, zulässig nur zusammen mit
  `fontWeight: 500` (`packages/schema/src/geometry.ts`).
  - Der Grund: resvg zeichnet jeden kursiven Lauf aus der einen Kursivdatei, auch einen, der 400
    oder 700 verlangt. Ein Browser setzte dort eine andere Stufe. Aus derselben IR entstünden zwei
    verschiedene Bilder.
  - Fehlt das Feld, bleibt die Ausgabe bytegleich.
  - **Die Regel steht nicht im Typ.** Versucht war eine Vereinigung (kursiv nur mit 500). Die
    Deklarationen der Piktogrammtabellen falten jedes Primitiv aus. Mit einer zweiten
    Textvariante brach der Build an `capabilities/07-technical-assistance.ts` ab (TS7056: Typ zu
    lang zum Schreiben). Schon ohne diese Datei maß das entpackte Paket `core` im abgebrochenen
    Build über 7,0 MB, über der Grenze von 6.500.000 Byte. Das Feld ist deshalb ein einfaches
    optionales Feld.
  - Folge: IR, die nur `renderSvg` durchläuft, prüft niemand. Der Katalog ist abgedeckt, weil das
    Textmetrik-Gate über alle Renderfälle läuft.
- **Gate:** Die Regel prüft das Textmetrik-Gate in core.
  - Ein anderer Schnitt, etwa kursiv in 400, in 700 oder ohne Gewicht, ist ein Befund
    `unsupported-font-style` in `checkTextMetrics`. `measureTextRun` wirft dafür.
  - Gemessen wird ein kursiver Lauf mit einem eigenen Metrikanbieter `TextMetrics.mediumItalic`
    aus `packages/core/src/assets/arimo-medium-italic-metrics.json`. Ohne diesen Anbieter wirft
    die Messung, wie ein Lauf in 500 ohne `medium`.
- **Renderer:** SVG schreibt `font-style="italic"` nach `font-weight="500"`. Canvas setzt
  `italic 500 <px>px Arimo`. Ein Test prüft, dass beide aus derselben IR denselben Schnitt
  verlangen.
- **Browser:** Website (`theme.css`) und Review-Server (`embedTextFont`) erklären ein zweites
  `@font-face` mit `font-style: italic; font-weight: 500` auf dieselbe statische Datei. Der
  Review-Server bettet es nur in SVGs mit kursivem Lauf ein. Alle anderen bleiben bytegleich. Die
  PNG-Route der Website pinnt die Datei mit ihrer Prüfsumme.

### 11.3 Zahlen

**Metrikdatei und Paketgröße.**

- Die Metrikdatei führt dieselben 645 Zeichen wie die aufrechten.
- `tsc` schreibt JSON neu formatiert nach `dist`. Dort misst die Datei 78.551 Byte.
- Eine Teilmenge bis U+00FF samt Satzzeichen (309 Zeichen) hätte 39.351 Byte gemessen, also
  39.200 Byte weniger. Verworfen, weil ein kursiver Lauf mit Ł, š oder ž dann als
  `unknown-glyph` gemeldet würde, obwohl die Schrift das Zeichen zeichnet.
- Das entpackte Paket `@einsatzzeichen/core` misst danach 6.352.522 Byte, vorher 6.245.354 Byte.
  Die Grenze liegt bei 6.500.000 Byte, es bleiben 147.478 Byte Luft.
- Vom Zuwachs (107.168 Byte) entfallen 78.552 Byte auf die Metrikdatei. Rund 27.000 Byte kommen
  aus den Deklarationen: Das neue Feld `fontStyle` steht 456-mal in den ausgefalteten
  Primitivtypen der Piktogrammtabellen.

**Arimo Italic gegen die Metrik aufrecht in 500.**

- Bis U+00FF gleiche Vorschübe, außer µ.
- Eigene Unterschneidung und eigene Tintenränder. Das f ragt kursiv um 175/2048 em über seinen
  Vorschub hinaus, aufrecht um 3/2048 em.

**„Bezeichnung" in D.1.1** (Schriftgrad 4,243 mm, Box 2,673 … 27,823 mm, Breite 25,15 mm):

| | Tinte links | Tinte rechts | Tintenbreite | Abstand zur Boxkante rechts |
|---|---|---|---|---|
| Arimo 500 aufrecht (Rechnung) | 3,000 mm | 27,551 mm | 24,551 mm | 0,272 mm |
| Arimo 500 kursiv (Rechnung) | 2,785 mm | 27,779 mm | 24,994 mm | 0,044 mm |
| kursiv gerastert, 8 px/mm | 2,750 mm | 27,875 mm | – | 0,052 mm darüber (weniger als 1 px) |
| kursiv gerastert, 16 px/mm | 2,750 mm | 27,813 mm | – | 0,010 mm |

- Die gerechneten Werte stimmen mit der Schriftmessung überein (Abschnitt 2.4 dort: 2,785 und
  27,779 mm).
- Das Textmetrik-Gate meldet für D.1.1 keinen Befund. Die Kalibrierung „gerechnet gegen
  gerastert" (`packages/conformance/src/text-metrics.test.ts`) läuft jetzt auch kursiv in 500,
  mit denselben Läufen wie aufrecht und zusätzlich „Bezeichnung" bei 4,243 mm. Alle liegen
  innerhalb eines Rasterpixels.
- Clipping-, Kontrast-, Tinten- und Snapshot-Gates sind grün.

**Neigung.** Arimo Italic neigt um 11,0°, die Referenz um 9,0°. An 2,92 mm Versalhöhe versetzt
das die Oberkante eines Stamms um 0,1 mm mehr als in der Referenz. Der Unterschied ist
hingenommen.

- Eine künstliche Neigung von Arimo 500 per Transformation (`skewX(-9)`) träfe den Winkel, ist
  aber verworfen, aus den Gründen in der Schriftmessung, Abschnitt 2.6.
- Die Kursivformen der Referenz (etwa das e) bildet Arimo nicht nach. Das einstöckige g passt.

### 11.4 Snapshots

Zwei Dateien ändern sich, beide D.1.1:

- `packages/core/src/geometry/pictograms/__snapshots__/leadership.command-post-in-operation.svg`:
  nur das neue Attribut `font-style="italic"`;
- der Kontaktbogen `packages/conformance/src/__snapshots__/multi-size/leadership.command-post-in-operation.svg`,
  der neu rastert.

Kein anderer Snapshot ändert sich. Aufrechte Läufe rastern mit der Kursivdatei bit-gleich wie
ohne sie (`fonts.test.ts`).

### 11.5 Offen

- Die Website-Insel `MapLibreLab.tsx` wartet vor dem Rastern nur auf die aufrechte Schrift
  (`16px Arimo`). Zeigte sie je D.1.1, stünde der Lauf dort bis zum Nachladen in der aufrechten
  Datei.
