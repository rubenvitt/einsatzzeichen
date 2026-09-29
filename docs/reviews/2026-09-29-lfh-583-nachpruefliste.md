# Nachprüfliste: die 93 überarbeiteten Darstellungen aus dem Fachreview vom 19.09. (LFH-583)

Stand: 29.09.2026 · Parent LFH-582 · gemessen auf `main` bei `9cead84` · Grundlage:
Entscheidungsnotiz `docs/decisions/2026-09-19-masse-an-der-referenz-ablesen.md`

Status: **Arbeitsliste, keine Entscheidung.** Die Liste bereitet die erneute fachliche Prüfung
vor. Sie ändert weder Code noch Reviewstatus. Freigaben entstehen nur im Fachreview-Werkzeug.

## Kurzfassung

Im ersten Fachreview am 19.09.2026 wurden 93 Darstellungen als „falsch“ markiert. PR #56 hat
alle 93 neu gebaut. Heute stehen sie wieder auf „offen“ (`pending`), und zwar ohne den alten
Befundtext. Diese Liste holt die alten Befunde zurück und vergleicht jede Darstellung
Pixel für Pixel mit der Referenz.

| | Anzahl |
|---|---|
| Darstellungen auf der Liste | **93** (91 aus Kapitel 4, 2 aus Anhang C.1) |
| heute im Werkzeug offen | 93 |
| seit PR #56 noch einmal verändert | **0**. Spätere Commits haben die Dateien nur verschoben (LFH-570/571). |
| **Gruppe A:** deckungsgleich, schnell freigebbar | **65** |
| **Gruppe B:** deckungsgleich, nur hauchfeine Kantenunterschiede an Kurven und Ecken | **24** |
| **Gruppe C:** sichtbar abweichend, und zwar nur in der Schrift | **4** (4.1.6, 4.1.7 und 4.1.8 jeweils Alternative, dazu 4.2.2) |
| unter der bisherigen Schwelle „deckungsgleich“ (höchstens 1 % der Bildfläche weicht ab) | vorher 2 von 93 (C.1.2/C.1.3, trotzdem zu Recht beanstandet, siehe Methode), heute **89 von 93** |

In den Gruppen A und B ist nach dem Pixelvergleich jeder Befund vom 19.09. behoben. Das gilt auch
für die Fälle „komplett falsche Darstellung“, „nicht ausgefüllt“, „falscher Winkel“ und „falsche
Maße“. Offen bleibt in Gruppe C die Schrift. Das Repo setzt Buchstaben in Arimo, die Referenz
verwendet eine schmalere, nicht bestimmbare Schrift. Das ist eine bekannte Grenze (Notiz §5.4
und §6), kein Fehler dieser Runde.

Deckungsgleich heißt nur: so gebaut wie die Referenz. Ob das Zeichen fachlich stimmt, entscheidet
weiterhin der Fachreviewer (Notiz §3).

## So benutzen Sie die Liste

1. Das Werkzeug im Hauptcheckout auf aktuellem `main` starten: `pnpm review` oder gleichwertig
   `pnpm --filter @einsatzzeichen/review dev`. Für die Ansicht „Referenz daneben“ muss der
   Ordner `taktische-zeichen/` im Wurzelverzeichnis des Repos liegen. Im Hauptcheckout ist das
   so, in einem Worktree fehlt er.
2. Den Haken **„nur offene Zeilen“** gesetzt lassen (Standard). Allein zeigt dieser Filter
   allerdings 476 offene Zeilen (462 Manifestzeilen plus Quellen und Profil), denn die 93 tragen
   keine eigene Markierung mehr.
3. Deshalb zusätzlich ins **Suchfeld** tippen:
   - `2025:4.` zeigt genau die 91 Zeilen aus Kapitel 4. Das sind alle offenen Zeilen des
     Kapitels, denn nur 4.4.1 ist dort schon freigegeben.
   - `2025:c.1.` zeigt genau C.1.2 und C.1.3.
   
   Alternativ die Bereiche **„4“** (92 Zeilen, davon 91 offen) und **„C“** (3 Zeilen, davon 2
   offen) aufklappen.
4. Zuerst Gruppe A abarbeiten, dann Gruppe B, zuletzt Gruppe C. Die Tabellen unten folgen
   innerhalb jeder Gruppe der Reihenfolge im Werkzeug.
5. Zur Bedeutung der Status (aus Commit `88041e6`): `approved` heißt „passt“, `deviation` heißt
   „geprüft, Abweichung bewusst hingenommen“. Ein „ist noch falsch“ ist also kein `deviation`.

Filter im Werkzeug (festgestellt, nichts gebaut): Der Navigator kennt nur zwei Filter, „nur
offene Zeilen“ und die Freitextsuche über Schlüssel und Titel (`packages/review/src/ui/rows.ts`,
`filterRows`; `Navigator.tsx`). Die Suche findet die Implementierungskennung nur bei Zeilen, die
schon einmal geöffnet waren. Einen Filter „war am 19.09. abweichend“ oder nach altem Befundtext
gibt es nicht. Die alten Notizen wurden beim Zurücksetzen auf `pending` gelöscht und stehen nur
noch in der Versionsgeschichte (`ebcb78d`). Für genau diese 93 reichen Suche und Haken trotzdem
aus, siehe Schritt 3.

## Worauf Sie achten sollten

- **Gruppe A (65):** Referenz und Darstellung sind praktisch identisch. Höchstens 3 % der
  Strichfläche weichen ab, und das ist Kantenglättung. Hier genügt ein kurzer Blick.
- **Gruppe B (24):** Bei Wellen, Bögen und spitzen Ecken weichen 3 bis 12 % der Strichfläche
  ab. Die Überlagerung zeigt, dass es nur um Bruchteile einer Strichbreite geht: Die Kurve ist
  minimal anders angenähert. Mit bloßem Auge ist davon bei normaler Größe nichts zu sehen. Der
  einzige Fall mit erkennbarem Versatz ist 4.7.18: Die Doppelwelle links sitzt etwa eine halbe
  Strichbreite (rund 0,25 mm) daneben.
- **Gruppe C (4):** Die Geometrie stimmt (Dreieck, weiße Füllung), die Buchstaben sind fett und
  aufrecht. Abweichend ist nur die Schriftart. Arimo Bold läuft breiter als die Referenzschrift,
  am deutlichsten beim Schriftzug „PSNV“ (4.2.2). Hier ist die fachliche Entscheidung gefragt:
  mit Arimo freigeben, `deviation` mit Befund „Schrift Arimo statt Referenzschrift (Notiz §5.4)“,
  oder offen lassen, bis die Schriftfrage als eigene Aufgabe gelöst ist.
- **Kleine Vorschaugrößen:** Bei 16 und 24 px wirken die 0,5-mm-Striche der Kapitel-4-Zeichen
  blassgrau. Das ist ein Thema der Rasterung und keine Frage der Geometrie. Es wird als eigene
  Aufgabe gelöst (Notiz §5.2).
- **Rote Schrift** in 4.1.6 bis 4.1.8 (Alternative) und **schwarze Schrift auf Rot** bei 4.2.2
  im Drucktheme sind als Kontrastausnahmen erfasst (Notiz §5.1). Sie sind kein neuer Befund.
- **Nicht geprüft** ist, wie ein Kapitel-4-Piktogramm *in einem Zeichenkörper* aussieht. Die
  Zeilen zeigen das Piktogramm allein, so wie die Referenz es zeichnet (Notiz §4 und §6).

## Hintergrund: 93, 96, 81 — was die Versionsgeschichte zeigt

- `ebcb78d` (19.09., 11:13) trägt die Befunde ins Ledger ein, damals
  `packages/catalog/src/domain-reviews.ts`, heute `packages/conformance/src/domain-reviews.ts`.
  Dort stehen genau **93** Einträge `deviation` und 5 `approved` (darunter 4.4.1, datiert auf
  den 04.09.). Das deckt sich mit Notiz §1: „93 von 98 geprüften Darstellungen“.
- `cbe92ab` (PR #56) baut alle 92 Kapitel-4-Piktogramme und die Marken in C.1 neu. Die
  Reviewstatus bleiben dabei unverändert.
- `88041e6` (19.09., 15:13, ebenfalls PR #56) setzt genau diese **93** Einträge von
  `deviation` auf `pending` und löscht dabei die Notizen. Die Commit-Nachricht spricht von
  „96“, im Diff sind es 93. Für die Differenz gibt es in der Versionsgeschichte keinen
  Beleg. Außerdem kommen 77 neue Freigaben dazu, zusammen sind es 82 `approved`. Die „81“
  der Nachricht passt dazu: 81 Freigaben tragen das Datum 19.09., die 82. ist 4.4.1 vom 04.09.
- Seitdem ist das Ledger für diese 93 Schlüssel unverändert: alle `pending`, ohne Notiz.
- Notiz §3 sagt „Überarbeitete Zeilen bleiben `deviation`, bis sie erneut geprüft sind“. Das
  Ledger sagt `pending`. Der Grund steht in `88041e6`: `deviation` hieße „bewusst
  hingenommen“ und war am 19.09. als „falsch“ gemeint.
- **Spätere Änderungen:** Die Snapshot-SVGs der 93 Darstellungen sind beim Merge von PR #56
  (`6558607`) und heute byte-gleich. Danach haben nur LFH-570 und LFH-571 die Dateien verschoben
  (`catalog` → `core`/`conformance`, 100 % Umbenennung). LFH-565, -566, -567 und -597 berühren
  diese Darstellungen nicht. LFH-567 ergänzt nur Regeln für Kombinationen mehrerer
  Fähigkeiten, die Einzelpiktogramme bleiben unverändert. Sie prüfen also denselben Stand, den
  PR #56 hinterlassen hat.

## Methode des Pixelvergleichs

- **Zeilen und Zeichnungen:** genau wie im Werkzeug über `buildRows()` aus
  `packages/review/src/data`. Referenzdatei ist das `referenceAsset` der Manifestzeile.
- **Eigene Darstellung:** `renderSvg(drawing, { theme: renderTheme('reference') })` aus
  `@einsatzzeichen/core`, also dasselbe Theme, das das Werkzeug standardmäßig zeigt.
- **Rasterung:** Referenz-SVG und eigenes SVG mit `@resvg/resvg-js` und `resvgFontOptions()`
  auf 512 px Breite, auf weißem Grund. Beide ViewBoxen sind 90,709 × 90,709 (32 × 32 mm).
- **Abweichendes Pixel:** Ein Farbkanal unterscheidet sich um mehr als 32 von 255.
- **Kennzahl „Fläche“:** abweichende Pixel geteilt durch alle Pixel des Bildes. Das ist die
  bisherige Kennzahl, „deckungsgleich“ heißt höchstens 1 %. Zur Eichung wurde sie über alle 544
  Manifestzeilen gerechnet: 361 liegen heute bei höchstens 1 %. PR #56 meldete 350, danach
  haben weitere PRs nachgebessert. Die Kennzahl ist also vergleichbar.
- **Kennzahl „Strichanteil“:** abweichende Pixel geteilt durch die Pixel, auf denen in
  mindestens einem der beiden Bilder etwas gezeichnet ist. Bei dünnen Piktogrammen auf viel
  weißem Grund ist sie strenger: Ein verrutschter Strich fällt in der Gesamtfläche kaum auf,
  im Strichanteil schon. Gruppe A: höchstens 3 %.
- **„Vorher“:** derselbe Vergleich mit dem Snapshot-SVG von `ebcb78d`, also dem Stand, der am
  19.09. geprüft wurde.
- **Gegenprobe weiße Füllungen:** Der Vergleich wurde zusätzlich auf grauem Grund gerechnet.
  So fiele eine fehlende weiße Fläche auf („Hintergrund fehlt“, „nicht weiß ausgefüllt“). Bei
  keiner Zeile stieg die Abweichung nennenswert.
- **Grenze der Kennzahlen:** Die Schwellen sind eine Sortierhilfe, kein Urteil. C.1.2 und C.1.3
  lagen schon am 19.09. unter beiden Schwellen (0,45 % Fläche, 0,7 % Strichanteil) und waren
  trotzdem zu Recht beanstandet: Der Strich endete an der Winkelspitze. Ein fehlendes schwarzes
  Stück in einer großen roten Fläche fällt in beiden Kennzahlen kaum ins Gewicht. Heute liegen
  beide bei 0. Ob ein Befund behoben ist, stammt deshalb aus der Sichtprüfung.
- **Sichtprüfung:** Alle 93 Zeilen wurden als Kontaktbogen angesehen (vorher, Referenz, heute,
  Überlagerung). Die Gruppen B und C wurden zusätzlich vergrößert angesehen. Die Beschreibungen
  in der Spalte „Änderung durch PR #56“ stammen aus diesem Sichtvergleich.
- **Skripte und Bilder** liegen außerhalb des Repos im Scratchpad der Sitzung:
  `/private/tmp/claude-501/-Users-rubeen-dev-personal-taktik--claude-worktrees-lfh-582-orchestrierung-b01e7a/9db83bf3-3e21-419a-aa04-fe88fba2715f/scratchpad/lfh-583/`.
  Dort liegen `compare.mts` (Vergleich), `snapshots.mts` (vorher/nachher), `sheets.mts` und
  `zoom.mts` (Bilder), `parse_reviews.py` (Ledger-Stände) und `tables.py` (Tabellen).
  Aufruf im Repo: `pnpm exec tsx <Pfad>/compare.mts <Pfad>`.

Lesehilfe für die Tabellen: **Fläche vorher → heute** ist der Anteil abweichender Pixel am
ganzen Bild am 19.09. und heute. **Strichanteil heute** ist der Anteil abweichender Pixel an der
gezeichneten Fläche.

## Gruppe A: deckungsgleich (65)

Schnell freigebbar. Referenz und heutige Darstellung decken sich, der Befund vom 19.09. ist behoben.

| Schlüssel | Titel | Befund vom 19.09. | Änderung durch PR #56 | Fläche vorher → heute | Strichanteil heute | Einschätzung |
|---|---|---|---|---|---|---|
| `4.1.1#primary` | ABC-/CBRN-Schutz | „Kreise nicht ausgefüllt, Dreieck falscher Winkel“ | Kreise ausgefüllt und größer, gekreuzte Striche im Winkel der Referenz. | 11,95 % → 0,01 % | 0,05 % | deckungsgleich, Befund behoben |
| `4.1.2#primary` | Messen, Spüren, Detektieren | „Kreise nicht ausgefüllt, falsche Winkel im Dreieck“ | Wie 4.1.1, dazu der Querstrich in Referenzlage. | 13,93 % → 0,01 % | 0,05 % | deckungsgleich, Befund behoben |
| `4.1.3#primary` | Dekontaminieren | „Kreise falsche Größe, Dreieck falscher Winkel, Kreise nicht ausgefüllt“ | Kreise ausgefüllt und größer, Winkel und Pfeilenden wie in der Referenz. | 13,97 % → 0,01 % | 0,04 % | deckungsgleich, Befund behoben |
| `4.1.4#primary` | Umweltschädenbeseitigung auf Gewässern | „Komplett falsche Darstellung“ | Neue Bildidee: gekreuzte Striche mit gefüllten Kreisen über zwei Wellen. | 15,84 % → 0,19 % | 1,48 % | deckungsgleich, Befund behoben |
| `4.1.6#primary` | Atomare Stoffe | „komplett falsche Darstellung“ | Gefülltes Strahlenzeichen (drei Sektoren, Mittelpunkt) statt Umrissdreiecken. | 23,27 % → 0,06 % | 0,26 % | deckungsgleich, Befund behoben |
| `4.1.7#primary` | Biologische Stoffe | „komplett daneben“ | Neue Bildidee: drei sich überlagernde Kreisbögen statt Blattform. | 9,69 % → 0,08 % | 1,17 % | deckungsgleich, Befund behoben |
| `4.1.8#primary` | Chemische Stoffe | „falsche Maße, inkorrekte Darstellung mit Strich im Symbol“ | Kolben in Referenzform, der Innenstrich ist entfallen. | 7,06 % → 0,02 % | 0,45 % | deckungsgleich, Befund behoben |
| `4.2.1#primary` | Betreuung | „Falsche Maße“ | Winkel größer, Maße aus der Referenz. | 5,11 % → 0,01 % | 0,19 % | deckungsgleich, Befund behoben |
| `4.2.3#primary` | Seelsorge | „inkorrekte Darstellung“ | Doppelkreuz (je zwei senkrechte und waagerechte Striche) statt einfachem Kreuz. | 6,30 % → 0,04 % | 0,79 % | deckungsgleich, Befund behoben |
| `4.2.5#primary` | Temporäre Unterbringung mit Sitzmöglichkeit | „falsche Maße“ | Stuhl größer, Maße aus der Referenz. | 3,10 % → 0,00 % | 0,00 % | deckungsgleich, Befund behoben |
| `4.3.1#primary` | Brandbekämpfung | „Strich nicht lang genug, falscher Winkel“ | Waagerechter Strich über die volle Breite, Schenkel länger und im Winkel der Referenz. | 2,64 % → 0,00 % | 0,00 % | deckungsgleich, Befund behoben |
| `4.3.4#primary` | Sonderlöschmittel, fest | „nicht ausgefüllt“ | Quadrat ausgefüllt. | 14,11 % → 0,00 % | 0,00 % | deckungsgleich, Befund behoben |
| `4.3.5#primary` | Sonderlöschmittel, gasförmig | „kein Kreis, nicht ausgefüllt“ | Gefüllter Kreis statt ungefülltem, abgerundetem Viereck. | 11,48 % → 0,00 % | 0,00 % | deckungsgleich, Befund behoben |
| `4.3.6#primary` | Atemschutz | „falsche Darstellung“ | Neue Bildidee: lange Flasche mit kleinem Ventilkreis darunter statt kurzer Flasche mit Fuß. | 3,96 % → 0,03 % | 0,84 % | deckungsgleich, Befund behoben |
| `4.4.2#primary` | Orten, biologisch | „falsche Darstellung“ | Neu gezeichnet nach der Referenz (Tier mit Zickzackbeinen), deutlich größer. | 8,72 % → 0,01 % | 0,24 % | deckungsgleich, Befund behoben |
| `4.4.3#primary` | Orten, technisch | „falsche Darstellung“ | Neu gezeichnet: Bogen mit Blitzpfeil in Referenzmaßen. | 5,84 % → 0,03 % | 0,87 % | deckungsgleich, Befund behoben |
| `4.5.1#primary` | Bergung | „falsche Darstellung“ | Mulde mit seitlichen Stegen; die Haken sind entfallen. | 4,42 % → 0,04 % | 1,75 % | deckungsgleich, Befund behoben |
| `4.5.2#primary` | Retten aus Höhen und Tiefen mit tragbaren Leitern | „falsche Darstellung“ | Leiter größer, drei statt vier Sprossen. | 9,01 % → 0,00 % | 0,00 % | deckungsgleich, Befund behoben |
| `4.5.3#primary` | Retten aus Höhen und Tiefen mit Drehleiter | „falsche Darstellung“ | Leiter als glatter Schrägstrich ohne Sprossen, Korb größer. | 5,52 % → 0,01 % | 0,18 % | deckungsgleich, Befund behoben |
| `4.5.4#primary` | Retten aus Höhen und Tiefen mit Teleskopgelenkmast | „falsche Darstellung“ | Mast mit Knick, Korb größer, Querstrich entfallen. | 4,37 % → 0,01 % | 0,20 % | deckungsgleich, Befund behoben |
| `4.5.6#primary` | Bergrettung | „falsche Darstellung“ | Raute über gefülltem Dreieck, größer. | 12,67 % → 0,01 % | 0,09 % | deckungsgleich, Befund behoben |
| `4.5.7#primary` | Spezielle Rettung aus Höhen und Tiefen | „falsche Darstellung“ | Raute mit Pfeilen nach oben und unten, größer. | 5,83 % → 0,03 % | 0,69 % | deckungsgleich, Befund behoben |
| `4.6.1#primary` | Sanität, Grundzeichen | „falsche Maße“ | Kreuz größer, Maße aus der Referenz. | 1,07 % → 0,00 % | 0,00 % | deckungsgleich, Befund behoben |
| `4.6.2#primary` | Pflege | „falsche Darstellung“ | Größer, Maße aus der Referenz. | 1,90 % → 0,00 % | 0,00 % | deckungsgleich, Befund behoben |
| `4.6.3#primary` | Rettungswesen / Intensivmedizin | „falsche Darstellung“ | Größer, Maße aus der Referenz. | 2,08 % → 0,00 % | 0,00 % | deckungsgleich, Befund behoben |
| `4.6.4#primary` | Arztwesen | „falsche Maße“ | Größer, Maße aus der Referenz. | 1,90 % → 0,00 % | 0,00 % | deckungsgleich, Befund behoben |
| `4.6.5#primary` | Patiententransport | „falsche Maße“ | Kreis statt Ellipse, Achsen länger. | 5,75 % → 0,03 % | 0,40 % | deckungsgleich, Befund behoben |
| `4.6.6#primary` | Krankenhaus | „falsche Darstellung, Hintergrund fehlt“ | Neue Bildidee: Gebäude mit Satteldach, zwei Felder, weiß gefüllt. | 12,26 % → 0,01 % | 0,08 % | deckungsgleich, Befund behoben |
| `4.7.1#primary` | Abwehr von Wassergefahren | „falsche Darstellung“ | Deich mit zwei Wellen links, Maße aus der Referenz. | 7,08 % → 0,03 % | 0,58 % | deckungsgleich, Befund behoben |
| `4.7.2#primary` | Baggerarbeiten | „falsche Darstellung, falsche Maße“ | Baggerarm größer, Schaufel als Halbkreis. | 4,83 % → 0,06 % | 2,32 % | deckungsgleich, Befund behoben |
| `4.7.6#primary` | Kampfmittelräumung | „falsche Darstellung“ | Kreis mit gefülltem Innenkreis und zwei Zündern statt Ellipsen. | 20,76 % → 0,09 % | 0,47 % | deckungsgleich, Befund behoben |
| `4.7.7#primary` | Einsatz von Handwerkzeugen | „falsche Darstellung“ | Gekreuzte Werkzeuge mit gefüllten Köpfen. | 11,51 % → 0,10 % | 0,97 % | deckungsgleich, Befund behoben |
| `4.7.8#primary` | Hebearbeit mit Gabelstapler | „falsche Darstellung“ | Mast mit Gabel, Maße aus der Referenz. | 4,73 % → 0,00 % | 0,07 % | deckungsgleich, Befund behoben |
| `4.7.9#primary` | Hebearbeit mit Kran | „falsche Darstellung“ | Kran größer, mit Haken. | 4,80 % → 0,05 % | 1,76 % | deckungsgleich, Befund behoben |
| `4.7.10#primary` | Heben von Lasten oder Personen | „falsche Darstellung“ | Raute größer, Pfeil länger. | 5,53 % → 0,02 % | 0,43 % | deckungsgleich, Befund behoben |
| `4.7.10#alternative` | Heben von Lasten oder Personen | „falsche Darstellung“ | Quadrat größer, Pfeil länger. | 5,64 % → 0,01 % | 0,39 % | deckungsgleich, Befund behoben |
| `4.7.11#primary` | Heben / Räumen | „falsche Darstellung“ | Neue Form: Schrägstrich mit Winkel oben rechts. | 3,99 % → 0,00 % | 0,08 % | deckungsgleich, Befund behoben |
| `4.7.12#primary` | Fernmanipulieren | „falsche Darstellung“ | Offener Winkel mit langem Stiel statt geschlossener Raute. | 4,82 % → 0,01 % | 0,22 % | deckungsgleich, Befund behoben |
| `4.7.13#primary` | Motorsägearbeiten | „falsche Darstellung“ | Säge aus zwei gerundeten Körpern. | 7,26 % → 0,05 % | 1,06 % | deckungsgleich, Befund behoben |
| `4.7.14#primary` | Pumpen | „falsche Darstellung“ | Kreis mit gebogenen Schaufeln statt geraden Strahlen. | 5,74 % → 0,04 % | 0,86 % | deckungsgleich, Befund behoben |
| `4.7.15#primary` | Räumarbeiten mit Maschine | „falsche Darstellung“ | Winkel mit Schaufel rechts, Maße aus der Referenz. | 3,33 % → 0,00 % | 0,10 % | deckungsgleich, Befund behoben |
| `4.7.16#primary` | Sicherheit | „falsche Darstellung“ | Schild größer, unten spitz. | 7,12 % → 0,02 % | 0,45 % | deckungsgleich, Befund behoben |
| `4.7.17#primary` | Sprengen | „falsche Darstellung“ | Ladung ausgefüllt. | 20,46 % → 0,06 % | 0,28 % | deckungsgleich, Befund behoben |
| `4.7.19#primary` | Transportieren | „falsche Maße“ | Rad als Kreis mit acht Speichen statt Ellipse. | 11,71 % → 0,09 % | 0,81 % | deckungsgleich, Befund behoben |
| `4.7.20#primary` | Türöffnung | „falsche Darstellung“ | Tür größer, Klinke entfallen. | 9,61 % → 0,01 % | 0,17 % | deckungsgleich, Befund behoben |
| `4.7.21#primary` | Höhenunterschiede überwinden | „falsche Darstellung“ | Doppelpfeil mit Stufenstrichen, Maße aus der Referenz. | 5,74 % → 0,00 % | 0,06 % | deckungsgleich, Befund behoben |
| `4.7.22#primary` | Absicherung | „falsche Darstellung“ | Leitkegel größer, zwei Streifen. | 8,39 % → 0,05 % | 0,96 % | deckungsgleich, Befund behoben |
| `4.7.23#primary` | Warnen mit optischen Anzeigen | „falscher font, falsche Maße, falsche Darstellung“ | Bildschirm größer, „i“ als gezeichneter Punkt und Balken statt Schrift. | 9,47 % → 0,00 % | 0,03 % | deckungsgleich, Befund behoben |
| `4.7.28#primary` | Ziehen von Lasten | „falsche Maße“ | Kasten und Pfeil größer. | 6,40 % → 0,01 % | 0,39 % | deckungsgleich, Befund behoben |
| `4.8.1#primary` | Behälter | „falsche Darstellung“ | Behälter größer. | 5,86 % → 0,00 % | 0,11 % | deckungsgleich, Befund behoben |
| `4.8.3#primary` | Brücke | „falsche Darstellung“ | Zwei Brückenprofile, weiter auseinander. | 5,30 % → 0,00 % | 0,08 % | deckungsgleich, Befund behoben |
| `4.8.4#primary` | Behelfsbrückenbau | „falsche Darstellung“ | Brückenprofile über einem gefüllten Kammzeichen. | 9,36 % → 0,00 % | 0,04 % | deckungsgleich, Befund behoben |
| `4.8.6#primary` | Instandhaltung | „wfalsche Darstellung“ | Zwei Halbkreise mit Verbindungsstrich statt Klammerform. | 5,73 % → 0,01 % | 0,40 % | deckungsgleich, Befund behoben |
| `4.8.9#primary` | Sanitäre Einrichtung / Waschmöglichkeit | „falsche Darstellung“ | Dusche größer, Maße aus der Referenz. | 5,89 % → 0,08 % | 2,34 % | deckungsgleich, Befund behoben |
| `4.8.12#primary` | Trinkwasser | „falsche Darstellung“ | Wasserhahn mit gebogenem Auslauf. | 2,11 % → 0,00 % | 0,10 % | deckungsgleich, Befund behoben |
| `4.8.13#primary` | Verpflegung | „falsche Darstellung“ | Angebissener Kreis größer. | 7,29 % → 0,11 % | 2,23 % | deckungsgleich, Befund behoben |
| `4.8.14#primary` | Verpflegung / Zubereitung | „falsche Darstellung“ | Gefüllter Löffel links statt Gabel. | 14,00 % → 0,12 % | 1,07 % | deckungsgleich, Befund behoben |
| `4.8.15#primary` | Schnelleinsatzzelt | „falsche Maße“ | Zelt größer, Dach abgeschrägt. | 5,52 % → 0,00 % | 0,05 % | deckungsgleich, Befund behoben |
| `4.8.16#primary` | Stangengerüstzelt | „falsche Darstellung“ | Ein großes Dreieck mit gekreuzten Stangen oben statt zwei überlagerter Dreiecke. | 9,15 % → 0,05 % | 1,06 % | deckungsgleich, Befund behoben |
| `4.9.1#primary` | Information und Kommunikation / Fernmeldewesen | „falsche Darstellung“ | Blitz flacher und breiter, Maße aus der Referenz. | 3,57 % → 0,01 % | 0,49 % | deckungsgleich, Befund behoben |
| `4.10.1#primary` | Veterinärwesen | „falsche Darstellung“ | „V“ größer. | 5,25 % → 0,04 % | 1,33 % | deckungsgleich, Befund behoben |
| `4.10.6#primary` | Schaf | „falsche Darstellung“ | Wolle als Wolkenform, größer. | 8,06 % → 0,07 % | 1,23 % | deckungsgleich, Befund behoben |
| `4.10.7#primary` | Schwein | „falsche Darstellung“ | Schweinenase größer. | 8,11 % → 0,05 % | 0,78 % | deckungsgleich, Befund behoben |
| `C.1.2#primary` | Löschgruppe | „Unvollständiges Rendering“ | Der waagerechte Strich im Fahrzeugkörper endete an der Spitze des Winkels; jetzt läuft er wie in der Referenz bis zum rechten Rand durch. | 0,45 % → 0,00 % | 0,00 % | deckungsgleich, Befund behoben |
| `C.1.3#primary` | Löschzug einer Feuerwehr | „unvollständig“ | Wie C.1.2: waagerechter Strich jetzt bis zum rechten Rand durchgezogen. | 0,45 % → 0,00 % | 0,00 % | deckungsgleich, Befund behoben |

## Gruppe B: deckungsgleich, nur Kantenunterschiede (24)

Auch hier ist der Befund behoben. Der höhere Strichanteil kommt von Kurven und spitzen Ecken, die um Bruchteile einer Strichbreite anders angenähert sind. Einzige erkennbare Ausnahme ist 4.7.18.

| Schlüssel | Titel | Befund vom 19.09. | Änderung durch PR #56 | Fläche vorher → heute | Strichanteil heute | Einschätzung |
|---|---|---|---|---|---|---|
| `4.1.5#primary` | Trinkwasseraufbereitung | „komplett falsche Darstellung“ | Neue Bildidee: Welle und Wasserhahn zwischen zwei Bogenpfeilen. | 8,26 % → 0,30 % | 5,09 % | deckungsgleich, Befund behoben. Bogen am Hahnauslauf mit minimal anderem Radius, sonst nur Kanten. |
| `4.2.4#primary` | Temporäre Unterbringung mit Ruhemöglichkeit | „falsche Maße“ | Bett breiter, Bogen flacher, Maße aus der Referenz. | 6,15 % → 0,45 % | 9,44 % | deckungsgleich, Befund behoben. Nur Kantenunterschiede am Bogen. |
| `4.3.2#primary` | Löschwasser, Brauchwasser | „Falsche Darstellung“ | Welle neu: dünner Strich (0,5 mm), zwei volle Bögen über die ganze Breite. | 4,39 % → 0,10 % | 4,62 % | deckungsgleich, Befund behoben. Nur Kantenunterschiede an der Welle. |
| `4.3.3#primary` | Schaummittel | „Dreieck nicht ausgefüllt, falsche Maße“ | Dreieck ausgefüllt und in Referenzgröße. | 10,14 % → 0,32 % | 3,06 % | deckungsgleich, Befund behoben. Nur Kantenunterschiede an den Dreieckspitzen. |
| `4.5.5#primary` | Einsatz von Wasserfahrzeugen | „falsche Darstellung“ | Boot mit je zwei Wellen links und rechts auf gleicher Höhe. | 6,43 % → 0,26 % | 6,42 % | deckungsgleich, Befund behoben. Nur Kantenunterschiede an den Wellen. |
| `4.5.8#primary` | Wasserrettung | „falsche Darstellung“ | Zwei Wellen über einer großen Raute statt Wellen über Dreieck. | 9,36 % → 0,54 % | 8,90 % | deckungsgleich, Befund behoben. Nur Kantenunterschiede an den Wellen. |
| `4.7.3#primary` | Beleuchten | „falsche Darstellung“ | Leuchte als Mast mit Bogen und Kreis statt Pfeil. | 4,64 % → 0,16 % | 4,90 % | deckungsgleich, Befund behoben. Nur Kantenunterschiede an Bogen und Kreis. |
| `4.7.4#primary` | Belüften | „falsche Darstellung“ | Neue Bildidee: zwei gebogene Pfeile durch eine Öffnung nach innen. | 6,23 % → 0,17 % | 4,65 % | deckungsgleich, Befund behoben. Nur Kantenunterschiede an Bögen und Pfeilspitzen. |
| `4.7.5#primary` | Entlüften | „falsche Darstellung“ | Neue Bildidee: Gegenstück zu 4.7.4, Pfeile nach außen. | 6,33 % → 0,16 % | 4,19 % | deckungsgleich, Befund behoben. Nur Kantenunterschiede an Bögen und Pfeilspitzen. |
| `4.7.18#primary` | Technische Hilfeleistung | „falsche Darstellung“ | Rechteck mit Doppelwelle links und Spreizer rechts, Maße aus der Referenz. | 6,10 % → 0,46 % | 12,00 % | deckungsgleich, Befund behoben. Doppelwelle links um etwa eine halbe Strichbreite versetzt (rund 0,25 mm). Beim Hinsehen kaum erkennbar. |
| `4.7.24#primary` | Warnen mit Lautsprecherdurchsagen | „falsche Darstellung“ | Lautsprecher mit drei Schallbögen. | 8,43 % → 0,36 % | 5,35 % | deckungsgleich, Befund behoben. Nur Kantenunterschiede an den Schallbögen. |
| `4.7.25#primary` | Warnen mit Sirenen | „falsche Darstellung“ | Flacher Schirm auf langem Mast. | 5,48 % → 0,19 % | 5,21 % | deckungsgleich, Befund behoben. Nur Kantenunterschiede am Schirmbogen. |
| `4.7.26#primary` | Wasserförderung | „falsche Darstellung“ | Welle über Pfeil mit Kreis am Anfang. | 4,70 % → 0,31 % | 8,21 % | deckungsgleich, Befund behoben. Nur Kantenunterschiede an der Welle. |
| `4.7.27#primary` | Wasserrückhaltung | „falsche Darstellung“ | Welle über Becken, Maße aus der Referenz. | 6,33 % → 0,30 % | 7,86 % | deckungsgleich, Befund behoben. Nur Kantenunterschiede an der Welle. |
| `4.8.2#primary` | Betriebsstoffe / Verbrauchsgüter | „falsche Darstellung“ | Trichter mit langem Hals. | 6,50 % → 0,18 % | 4,54 % | deckungsgleich, Befund behoben. Nur Kantenunterschiede an den Knicken. |
| `4.8.5#primary` | Entsorgung | „falsche Darstellung“ | Tonne größer, drei Striche, Deckel. | 6,20 % → 0,24 % | 4,40 % | deckungsgleich, Befund behoben. Nur Kantenunterschiede, linker Innenstrich minimal anders. |
| `4.8.7#primary` | Sandsack | „falsche Darstellung“ | Hoher Sack mit Knoten statt Glockenform. | 7,37 % → 0,27 % | 5,48 % | deckungsgleich, Befund behoben. Nur Kantenunterschiede am Umriss. |
| `4.8.8#primary` | Sandsackbefüllung | „falsche Darstellung“ | Trichter über Sack mit Gestell, größer. | 11,06 % → 0,22 % | 3,23 % | deckungsgleich, Befund behoben. Nur Kantenunterschiede an den Ecken. |
| `4.8.10#primary` | Sanitäre Einrichtung / WC | „Falsche Font“ | „WC“ als gezeichnete Striche in Referenzmaßen, keine Schrift. | 5,23 % → 0,30 % | 7,51 % | deckungsgleich, Befund behoben. Nur Kantenunterschiede an den Buchstabenstrichen. |
| `4.8.11#primary` | Stromversorgung | „falsche Darstellung“ | Blitz mit Pfeilspitze, größer. | 5,39 % → 0,34 % | 9,95 % | deckungsgleich, Befund behoben. Nur Kantenunterschiede an den Knicken. |
| `4.10.2#primary` | Schlachten / Keulen | „falsche Darstellung“ | Balken über Dreieck links statt Dreieck auf einer Linie. | 4,94 % → 0,22 % | 7,71 % | deckungsgleich, Befund behoben. Nur Kantenunterschiede am Dreieck. |
| `4.10.3#primary` | Huhn | „falsche Darstellung“ | Hühnerkopf mit Kamm neben dem „V“, größer. | 6,44 % → 0,20 % | 4,29 % | deckungsgleich, Befund behoben. Nur Kantenunterschiede am Kamm. |
| `4.10.4#primary` | Pferd | „falsche Darstellung“ | Hufeisen größer. | 6,60 % → 0,14 % | 3,06 % | deckungsgleich, Befund behoben. Nur Kantenunterschiede am Hufeisen. |
| `4.10.5#primary` | Rind | „falsche Darstellung“ | Rinderkopf als Zackenform. | 7,37 % → 0,23 % | 4,65 % | deckungsgleich, Befund behoben. Nur Kantenunterschiede an den Zacken. |

## Gruppe C: sichtbar abweichend, nur in der Schrift (4)

Die Geometrie ist deckungsgleich, abweichend ist nur die Schriftart (Arimo statt Referenzschrift, Notiz §5.4). Hier ist eine fachliche Entscheidung nötig, siehe „Worauf Sie achten sollten“.

| Schlüssel | Titel | Befund vom 19.09. | Änderung durch PR #56 | Fläche vorher → heute | Strichanteil heute | Einschätzung |
|---|---|---|---|---|---|---|
| `4.1.6#alternative` | Atomare Stoffe | „Falsche Schrift, A nicht fett genug, falsche Dreieckmaße, nicht weiß ausgefüllt“ | Dreieck größer und weiß gefüllt, „A“ jetzt fett (Arimo Bold). | 11,48 % → 1,53 % | 17,41 % | **sichtbar abweichend:** Dreieck, weiße Füllung und Fettung behoben. Das „A“ ist in Arimo Bold gesetzt, die Referenz verwendet eine andere, schmalere Schrift. Der Buchstabe wirkt dadurch etwas breiter. |
| `4.1.7#alternative` | Biologische Stoffe | „B nicht fett, falsche Maße Dreieck, falscher Hintergrund“ | Dreieck größer und weiß gefüllt, „B“ jetzt fett (Arimo Bold). | 12,18 % → 3,23 % | 30,20 % | **sichtbar abweichend:** Wie 4.1.6 Alternative: Dreieck und Füllung stimmen. Das „B“ in Arimo Bold ist breiter und sitzt etwas weiter links als in der Referenz. |
| `4.1.8#alternative` | Chemische Stoffe | „C kursiv, nicht fett, Dreieck ohne Hintergrund, falsche Maße“ | Dreieck größer und weiß gefüllt, „C“ jetzt fett und nicht mehr kursiv (Arimo Bold). | 10,86 % → 2,31 % | 25,87 % | **sichtbar abweichend:** Wie 4.1.6 Alternative: Dreieck und Füllung stimmen, das „C“ ist nicht mehr kursiv. In Arimo Bold ist es etwas breiter als in der Referenz. |
| `4.2.2#primary` | PSNV | „PW falsch - PSNV. Falsche Font“ | Text „PSNV“ statt „PW“, fett; Dreieck in Referenzmaßen. | 10,06 % → 4,90 % | 52,05 % | **sichtbar abweichend:** Das Dreieck ist deckungsgleich, „PSNV“ statt „PW“ ist behoben. Der Schriftzug in Arimo Bold läuft aber sichtbar breiter als in der Referenz (Befund „Falsche Font“ also nur zum Teil behoben). |
