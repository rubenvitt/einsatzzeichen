# Anhang F hat drei Abschnitte, nicht zwei — und kein einziges Zeichen ist heute baubar

> Entscheidungsnotiz · 18. August 2026 · Zuschnitt für LFH-417

Die Aufgabe nennt zwei Untergruppen — „**F.1** Einheiten, **F.2** Fahrzeuge" — und den Schnitt
entlang dieser Grenze als naheliegend, aber ungeprüft. Diese Notiz prüft ihn. Das Ergebnis
widerspricht der Aufgabe an drei Stellen:

1. **Es gibt einen dritten Abschnitt.** `F.3` führt 19 Zeichen — Patientenablage, Behandlungsplatz,
   Sammelstelle, Bereitstellungsraum, Ladezone, Unterkunft, Krankenhaus. Ein knappes Drittel des
   Anhangs steht in der Aufgabenbeschreibung nicht.
2. **„66 Zeichen" sind 58 Abschnitte.** Die 66 Referenzdateien enthalten acht
   Alternativdarstellungen, die keinen eigenen Abschnitt eröffnen.
3. **Der Schnitt ist keine Abhängigkeitsgrenze wie bei Anhang E.** Bei E war die Hälfte sofort
   baubar. Bei F ist es **kein einziges Zeichen** — nicht wegen fehlender Grundzeichen, sondern
   wegen zweier Mechanismen, die die Fachdienstzeichen tragen und die der Katalog nicht hat.

Die Vorfrage der Aufgabe — „vor F sollte der Schlüsselumbau (LFH-408) erledigt sein" — ist dagegen
verneint (Abschnitt 6).

## 1. Was gemessen wurde

Wie bei Anhang E ist die Körperform die äußere Form der Ebene `Flächige_Fülung`. Sie wurde für alle
66 F-Dateien ausgelesen, auf Millimeter umgerechnet (1 mm = 72/25,4 Einheiten) und gegen den
gesamten Referenzbestand von 661 Dateien gehalten. Dazu kommen zwei Zählungen, die Anhang E in
dieser Form nicht brauchte: die Kopfmarken **einschließlich der `<rect>`- und `<circle>`-Elemente**
(Abschnitt 4) und die Organisationsfarbe der Füllebene (Abschnitt 7).

> **Die `<rect>`-Falle.** Die E-c-Notiz hält fest, dass drei THW-Zeichen ihre Kopfmarke als
> `<circle>` statt als Pfad führen und eine reine `<path>`-Suche sie übersieht. Anhang F fügt eine
> dritte Form hinzu: `F.1.13` und `F.1.21` tragen ihre Kopfmarke als `<rect>`. Eine Zählung über
> `<path>` **und** `<circle>` hält beide fälschlich für kopfzonenlos — genau das ist beim ersten
> Durchgang dieser Notiz passiert und erst am gerasterten Bild aufgefallen. Der Einzelbalken
> (Abschnitt 4) wäre sonst unbemerkt geblieben.

## 2. Die Zählung: 58 Abschnitte, 8 Alternativen, 66 Dateien

| Abschnitt | Abschnitte | Alternativdarstellungen | Dateien |
|---|---|---|---|
| **F.1** Einheiten | 22 | 3 — `F.1.11`, `F.1.12`, `F.1.15` | 25 |
| **F.2** Fahrzeuge | 17 | 5 — `F.2.1` bis `F.2.5` | 22 |
| **F.3** Orte und Einrichtungen | 19 | 0 | 19 |
| **Summe** | **58** | **8** | **66** |

```bash
cd taktische-zeichen
ls | grep -c "^F\."                          # 66  Dateien
ls | grep "^F\." | grep -c "_Alternative"    #  8  Alternativdarstellungen
```

Für Anhang E fielen Dateizahl und Abschnittszahl zusammen (68 = 68); die Tabelle in LFH-404 zählt
deshalb Dateien und nennt sie „Zeichen". Für F fallen sie auseinander. **Die „352 offen" aus
LFH-404 sind eine Dateizahl** — wer daraus Manifestzeilen ableitet, rechnet für F acht zu wenig
(jede Alternative bekommt ihre eigene Zeile) und zugleich acht Abschnitte zu viel.

## 3. Der Befund: sechs Körperformen, vier davon im Katalog

| Körperform | Dateien aus F | im Gesamtbestand | Grundzeichen | im Katalog |
|---|---|---|---|---|
| `formation` Rechteck 30 × 20 mm bei 1/6 | 25 — ganz F.1 | 48 | `1.1` | **ja** |
| `vehicle-land` Rumpf 30 mm | 18 — F.2.1–2.5 (+Alt), 2.8, 2.10–2.14, 2.16, 2.17 | 66 | `1.3` | **ja** |
| Kreis r 12,0 mm, Mitte 16/16 | 15 — F.3.1–3.4, 3.6–3.13, 3.17–3.19 | 23 | keins | **nein** |
| Kreis r 12,0 mm, Mitte 16/**18** | 2 — F.3.5, F.3.14 | 6 | keins | **nein** |
| `vehicle-air` | 2 — F.2.6, F.2.7 | 5 | `1.4` | **ja** |
| `trailer` Anhängerrumpf | 2 — F.2.9, F.2.15 | 17 | `5.1.2.1` | **ja** |
| Haus 30 × 22 mm, First bei 4,0 | 2 — F.3.15, F.3.16 | 3 | keins | **nein** |
| **Summe** | **66** | | | |

Belege, jede Zeile einzeln nachvollziehbar:

```bash
cd taktische-zeichen
grep -l 'rect x="2.834" y="17.008" width="85.04" height="56.693"' *.svg | wc -l          # 48
grep -l 'M45.355,22.678c-17.008,0-31.181-2.582-42.52-6.378v57.402h85.04V16.3' F.*.svg | wc -l  # 18
grep -l '<circle cx="45.356" cy="45.354" r="34.016"' *.svg | wc -l                       # 23
grep -l '<circle cx="45.356" cy="51.024" r="34.016"' *.svg | wc -l                       #  6
grep -l 'M87.845,59.499H2.863c0-23.467' *.svg | wc -l                                    #  5
grep -l 'M49.606,22.678c-15.307,0-28.063-2.582-38.268-6.378v57.402h76.536V16.3' *.svg | wc -l  # 17
grep -l 'polygon points="45.354 11.338 5.669 27.921' *.svg | wc -l                       #  3
```

**Der Rechteckkörper von F.1 steht auf `2.834`, der von Kapitel 1 auf `2.835`** — 0,001 Einheiten
= 0,00035 mm. Das ist dasselbe Rundungsrauschen, das die E-Notiz für `1.3`/E.2 und für
`1.7`/E.1.37 dokumentiert; im Bestand stehen 48 Dateien auf der einen und 44 auf der anderen
Schreibweise. Es ist eine Schreibweise, keine zweite Form.

### 3.1 Der Kreiskörper misst 12 mm, `post` misst 14

`1.6_Funktionsstelle.svg` — die Belegdatei des Katalogkörpers `post` — trägt `r="39.678"`
= 13,9975 mm. Die 17 Kreiszeichen aus F.3 tragen `r="34.016"` = 12,0001 mm. **Ein aus `post`
zusammengesetztes F.3-Zeichen läge um 2 mm zu groß.**

Das ist kein neuer Befund, sondern einer, den das Repository selbst schon notiert hat:
`packages/core/src/layout/profiles.ts` führt den Radienzensus über alle 661 Dateien — „32 Kreise
mit r 12,25 mm und sechs mit r 11,75 mm (Ringpaare zur Mittellinie r 12,0), dazu je einer mit
r 13,75 und 14,24 (Ringpaar zur Mittellinie r 14,0 — `1.6_Funktionsstelle.svg`, das `post` deckt)"
— und schließt: „**Die Regel zwischen 12 und 14 ist nicht vermessen; sie ist ein eigenes Ticket.**"
Dieses Ticket gibt es in der Liste nicht. Anhang F ist sein erster Anlass.

**Die Zeichnung liegt bereits vermessen im Katalog, nur nicht als Körper.** `J.4.1_Router` baut
seinen Kreiskörper als `commsCircle(16, 16, 12, COMMS_WHITE_BODY)`
(`packages/catalog/src/pictograms/comms/04-network.ts`) — dieselbe Mittellinie, die F.3 trägt. Was
fehlt, ist die Beförderung vom Piktogrammprimitiv zum Grundzeichen: ein `SymbolKind`, ein
`BODIES`-Eintrag, ein Layoutprofil. Das Layoutprofil `circle-body` steht schon und **wirft**, sobald
eine Kopfzone dazukommt; kein einziges F.3-Zeichen trägt eine Kopfzone (Abschnitt 4), der Wurf
bleibt also unerreichbar.

Die zweite Lage — Mitte auf y 18 statt 16 mm — ist der Fall „ortsgebunden": `F.3.5` und `F.3.14`
tragen über dem Kreis einen Giebel, und der Kreis weicht ihm um 2 mm nach unten aus. Das ist
strukturgleich mit `raised-hull` aus E.2 (dieselbe Form, um einen festen Betrag versetzt) und
zeichengleich mit der Giebelmarke von `J.3.2_Basisstation`, die im Katalog steht — dort allerdings
mit `stationBody(17, 11.5)`, also **anderen** Werten als F.3.5. Welche der beiden Fassungen trägt,
ist Messarbeit im Teilslice, nicht hier.

### 3.2 Der Hauskörper von F.3.15/F.3.16 ist nicht `building`

`building` steht auf den Maßen von `1.7_Gebäude.svg`: First 16/3, Traufe auf y 10, Sockel 1…31 ×
bis y 26. `F.3.15_Unterkunft.svg` und `F.3.16_Krankenhaus.svg` tragen First 16/4,0, Traufe auf
y 9,85 und Sockel 2…30 — ein um 1 mm schmaleres, um 1 mm niedrigeres Haus. Die Form kommt in genau
drei der 661 Dateien vor; die dritte ist `4.6.6_Krankenhaus.svg`, also ein **Piktogramm**, dessen
Katalogfassung `capability.hospital` eine eigene Millimeterkonstruktion ist und diese Maße nicht
führt.

Ob F.3.15/F.3.16 als Körper oder als Piktogramm zu modellieren sind, entscheidet diese Notiz
zugunsten des Körpers: es sind Ortszeichen wie die 17 Kreiszeichen daneben, keine Bildmarken. Die
Alternative — beide als Piktogramm auf einem anderen Körper — hätte kein Vorbild im Bestand, weil
die Referenz hier gar keinen Körper unter dem Haus zeichnet.

## 4. Kopfzonen: nur F.1, und zwei Formen ohne Begriff

Kopfmarken im Sinne der Stärkegrade trägt ausschließlich F.1. F.2 und F.3 tragen **keine einzige**
— die Giebelmarke über `F.3.5` und `F.3.14` steht zwar im Kopfzonenraum, ist aber nach ihrem
Vorbild `J.3.2_Basisstation` eine Standortmarke und kein Stärkegrad.

| Kopfform | Dateien | im Katalog |
|---|---|---|
| `zug` — drei Marken r 1,5 bei cx 11/16/21, cy 3,5 | 4 — F.1.2, F.1.4, F.1.5, F.1.22 | **ja** |
| `gruppe` — zwei Marken bei cx 11/21 | 11 — F.1.6–F.1.10, F.1.12 (+Alt), F.1.17–F.1.20 | **ja** |
| `trupp` — eine Marke bei cx 16 | 4 — F.1.14, F.1.15 (+Alt), F.1.16 | **ja** |
| **zwei senkrechte Balken** bei cx 12/20, je 1,5 × 4,0 mm, y 1…5 | 2 — F.1.1, F.1.3 | nein |
| **ein senkrechter Balken** bei cx 16, 1,5 × 4,0 mm, y 1…5 | 2 — F.1.13, F.1.21 | nein |
| keine | 2 — F.1.11 (+Alt) | — |

```bash
cd taktische-zeichen
grep -l 'M54.567,2.835h4.252v11.339h-4.252V2.835Z' *.svg | wc -l                    # 3  Doppelbalken
grep -l '<rect x="43.229" y="2.835" width="4.252" height="11.339"/>' *.svg | wc -l  # 2  Einzelbalken
ls | grep -c "^5\.4\."                                                              # 4  Stärkegrade
```

**Der Doppelbalken ist der Fall aus E-c, mit gestiegener Fallzahl.** Die E-c-Notiz hat ihn an
`E.1.31` als deklarierte Abweichung gebaut — Zeichen ohne Kopfzone — und dabei festgehalten: „Der
Balkenpfad kommt in genau drei von 661 Referenzdateien vor (E.1.31, `F.1.1`, `F.1.3`) … Was fehlt,
ist der **Begriff**, den diese Balken tragen — und den vergibt keine Messung." Diese Notiz
bestätigt die Zählung und fügt nichts hinzu: der Begriff fehlt weiterhin.

**Der Einzelbalken ist neu, und für ihn gibt es einen Anhaltspunkt.** Er kommt in genau zwei
Dateien des Bestands vor, und beide heißen `…-Bereitschaft` bzw. `…bereitschaft`
(`F.1.13_Behandlungsplatz-Bereitschaft`, `F.1.21_Betreuungsplatzbereitschaft 500`). Das ist mehr,
als der Doppelbalken hat — dessen drei Träger heißen „System Bereitstellungsraum 500",
„Medizinische Task Force" und „Mobiles Betreuungsmodul 5000" und teilen kein Wort. **Der
Anhaltspunkt liegt im Dateinamen, nicht in der Zeichnung**; Kapitel 5.4 führt nur vier Dateien
(Trupp, Staffel, Gruppe, Zug) und keinen Abschnitt für Balken. Ob daraus ein fünfter `StrengthId`
wird oder wieder eine Abweichung, entscheidet der Teilslice F-b — und die Entscheidung braucht
fachliche Zustimmung, nicht nur eine Messung.

## 5. Die eigentliche Sperre: zwei Mechanismen, die F.1 und F.2 tragen und die fehlen

Die Fachdienstteilung — das Kreuz, das den Körper viertelt — ist **das** Zeichen des Anhangs. Sie
steht in 25 der 66 Dateien im Rechteckkörper, in den F.2-Fahrzeugen und in den F.3-Kreisen.
Fachlich ist sie Kapitel 4.6: `4.6.1_Sanität Grundzeichen` ist genau dieses Kreuz,
`4.6.4_Arztwesen` dasselbe Kreuz mit einem waagerechten Balken darunter — dem „arztbesetzt"-Zusatz
von `F.1.7` und `F.1.15` —, und `4.6.3_Rettungswesen_Intensivmedizin` das Kreuz mit dem senkrechten
Balken, den die Alternativdarstellungen von `F.1.11` und `F.2.1` bis `F.2.5` anstelle des Kürzels
tragen. **Alle sechs 4.6er Piktogramme stehen im Katalog.**

Trotzdem lässt sich damit heute kein F-Zeichen bauen. Der Probelauf steht am Bild:
`composeFromCatalog({ kind: 'formation', organization: 'hilfsorganisation',
capabilities: ['medical-service'], labels: { center: 'RettD' } })` gegen
`F.1.11_Rettungsdienst allgemein.svg` gestellt, beide gerastert. Zwei Unterschiede, beide
strukturell:

**Erstens sitzt das Kreuz zu klein.** `STANDARD_CAPABILITY_BOX` misst 4/8/24/16 mm, die
Katalogfassung von `4.6.1` zeichnet `M 16 8 V 24 M 7 16 H 25`. Die Referenz zeichnet das Kreuz
**randbündig**: in `4.6.1` selbst über 2…30 mm (Außenkanten des 0,5-mm-Strichs), in `F.1.11` über
die volle Körperbreite (x 1…31) und -höhe (y 6…26). Der Unterschied ist bei Anhang C verkraftbar — die Löschmarke von `C.1.2` sitzt
ebenfalls eingerückt in einem roten Körper, und der Katalog liefert das seit dem Kernslice so aus.
Bei F ist er es nicht: das eingerückte Kreuz in einem weißen Rechteck **ist nicht das
Rettungsdienstzeichen**, sondern ein kleines Pluszeichen darin.

**Zweitens kollidiert die Beschriftung.** Die Referenz setzt ihr Kürzel — „RettD", „KTW", „MTF",
„50" — linksbündig in das **obere linke Viertel**. `BodyLabels` führt vier Zonen: `center`,
`bottomLeft`, `bottomRight`, `belowRight`. `center` legt den Lauf mittig über den waagerechten Arm
des Kreuzes; im Probebild überlagern sich beide bis zur Unlesbarkeit. Anhang F braucht eine
**fünfte Zone oben links**. (Ihre Maße sind hier abgelesen, nicht vermessen — das Vermessen gehört
in den ersten Teilslice.)

**Damit ist die Reihenfolge festgelegt, und sie ist nicht die der Abschnittsnummern.** Beide
Mechanismen entstehen im ersten Teilslice; alle übrigen stehen darauf. Ob die Fachdienstteilung als
randbündige zweite Darstellung der 4.6er Piktogramme entsteht oder als eigene Körpereigenschaft
neben `capabilities`, entscheidet dieser Teilslice — die Zeichnung ist in beiden Fällen dieselbe,
die Adressierbarkeit nicht.

## 6. Die Vorfrage der Aufgabe: LFH-408 ist keine Vorbedingung

Die Aufgabe hält fest: „Vor F sollte der Schlüsselumbau erledigt sein, sonst entstehen hier
dutzende Zeilen in der alten Form." Geprüft und verneint — aus zwei Gründen, von denen der zweite
Arbeit erzeugt.

**Der Titelzwang greift für F nicht.** Der Katalogvertrag verlangt identische Titel über alle
Varianten einer ID; an D.3 ist er deshalb aufgefallen. In der Schemaform steht `title` am
`CatalogEntry` und die Varianten stehen in `depictions` darunter — identische Titel sind also nicht
nur erlaubt, sondern strukturell erzwungen. **Und F will sie:** `F.2.1_KTW` und
`F.2.1_KTW_Alternative` sind derselbe KTW, einmal mit Kürzel und einmal mit dem 4.6.3-Zeichen. Der
Schlüssel `bbk-babz-2025:F.2.1#primary` gegen `#alternative` adressiert genau das, wofür er gebaut
ist. Der Umbau bleibt richtig und dringend; für F ist er eine Migration, die F mitnimmt — wie bei
Anhang E.

**Die Verrohrung fehlt trotzdem, und zwar in F selbst.** Bisher trägt **keine einzige**
Manifestzeile `variant: 'alternative'` — die vier Kapitel-4-Alternativen, die sechs aus 5.8 und die
fünf aus J stehen in den Piktogrammregistern, nicht in `coverage-manifest.ts`. Auf Rezeptebene gibt
es sie überhaupt nicht:

- `RECIPES` ist ein Record über den **bloßen Abschnittsschlüssel** (`'E.1.29'`). Zwei Darstellungen
  desselben Abschnitts haben dort keinen Platz.
- `catalogEntries` in `coverage-manifest.ts` erzeugt je Eintrag **genau eine** Zeile und liest
  ausdrücklich die `primary`-Darstellung.

Anhang F ist damit der erste Bestand, der Alternativdarstellungen auf Rezeptebene braucht — acht
Stück. Das ist Arbeit **in** F und keine Abhängigkeit **von** LFH-408.

## 7. Kein F-Zeichen trägt eine Organisationsfarbe

```bash
cd taktische-zeichen
grep -ho 'fill="#[0-9a-fA-F]*"' F.*.svg | sort -u   # nur fill="#fff"
grep -ho 'fill="#[0-9a-fA-F]*"' E.*.svg | sort -u   # #003296, #fa8c00, #fff
```

Alle 66 F-Dateien führen ausschließlich `#fff`. Anhang E führt 83-mal THW-Blau, `C.1.2` führt
Feuerwehr-Rot. **Anhang F ist der erste Bestand ohne Organisationsfarbe.**

Aus der Datei ist damit nicht entscheidbar, ob diese Zeichen `organization: 'hilfsorganisation'`
tragen oder gar keine Organisation. `ORGANIZATION_COLORS` bildet `hilfsorganisation` seit LFH-424
auf `weiss` ab, und die Begründung dort sagt den Fall bereits voraus: „Ein gerendertes Zeichen mit
`hilfsorganisation` ist von einem organisationslosen farblich nicht unterscheidbar. Das ist eine
Eigenschaft der Quelle, kein Umsetzungsfehler." Für F wird daraus eine Entscheidung mit 58
Wiederholungen. Ein Anhaltspunkt steht im Bestand — `F.1.5_Sanitätszug ASB` benennt eine
Hilfsorganisation im Titel —, ein Beweis ist er nicht.

Zwei Folgen, die der erste Teilslice mitprüfen muss: alle 71 bestehenden Rezepte führen
`organization`, F wäre der erste ohne; und das Kontrastpaar weiß-auf-weiß trifft das
A11y-Kontrastgate und die Kontursignatur aus `render-themes.ts` zum ersten Mal in einem
zusammengesetzten Zeichen.

## 8. Der Zuschnitt: sechs Teilslices

Die Grenzen folgen der Abschnittsnummer, liegen aber dort, wo ein Mechanismus dazukommt. Jeder
Teilslice trägt den seinen selbst — anders als bei E gibt es keinen Blocker außerhalb von F.

| Teilslice | Abschnitte | Abschnitte / Dateien | Was er einführt |
|---|---|---|---|
| **F-a** Sanitätsdienstliche Einheiten | F.1.1 – F.1.11 | 11 / 12 | Fachdienstteilung randbündig, Beschriftungszone oben links, Alternativdarstellung auf Rezeptebene, Organisationsfrage. Enthält die Doppelbalken (F.1.1, F.1.3). |
| **F-b** Betreuung und Transport | F.1.12 – F.1.22 | 11 / 13 | Der Einzelbalken (F.1.13, F.1.21) — fünfter Stärkegrad oder zweite Abweichung. |
| **F-c** Rettungsdienstfahrzeuge | F.2.1 – F.2.9 | 9 / 14 | Fünf der acht Alternativen; `vehicle-air` und `trailer` als Träger der Teilung. |
| **F-d** Betreuungsfahrzeuge | F.2.10 – F.2.17 | 8 / 8 | Nichts Neues — reine Anwendung. |
| **F-e** Orte des Rettungsdienstes | F.3.1 – F.3.11 | 11 / 11 | Der Kreiskörper r 12 mm in beiden Lagen, mit der Giebelmarke „ortsgebunden". |
| **F-f** Orte der Betreuung | F.3.12 – F.3.19 | 8 / 8 | Der verkleinerte Hauskörper (F.3.15, F.3.16). |
| **Summe** | | **58 / 66** | |

**F-a ist das Tor.** Fachdienstteilung und Zone oben links tragen F.1, F.2 und F.3 gleichermaßen;
ohne sie ist keiner der übrigen fünf Teilslices baubar. Danach ist die Reihenfolge weitgehend frei:
F-b hängt an F-a, F-c an F-a, F-d an F-c (nur der Bequemlichkeit halber), F-e an F-a, F-f an F-e
(Kreiskörper).

**Warum die drei fehlenden Körperformen in F liegen und nicht in einem eigenen Grundlagenposten.**
Bei Anhang E lagen sie in LFH-424, einem Geschwistertask. Hier gibt es keinen — der Kreiskörper ist
in `profiles.ts` als „eigenes Ticket" angekündigt und nie angelegt worden. Sie in F-e und F-f zu
legen, hält die Arbeit an ihrem ersten Verbraucher. **Sie nützen darüber hinaus:** derselbe
Kreiskörper trägt `D.2.1` bis `D.2.7`, `I.4.1` und `M.1` — 23 Dateien des Bestands, von denen nur
17 aus F stammen.

## 9. Was offen bleibt

- **Der Begriff der Balkenmarken.** Zwei Formen, vier Dateien in F plus `E.1.31`. Der Einzelbalken
  hat einen Namensanhaltspunkt („Bereitschaft"), der Doppelbalken keinen. Ohne fachliche Zuordnung
  bleibt es bei der Abweichung aus E-c — dann aber viermal statt einmal, und das ist eine
  Entscheidung, keine Fortschreibung. Zu klären in F-a und F-b.
- **Randbündig oder eingerückt.** Entscheidet F-a. Fällt die Entscheidung auf randbündig, steht
  damit zugleich die Frage im Raum, ob die 92 bestehenden Kapitel-4-Darstellungen ihre eingerückte
  Box behalten — diese Notiz beantwortet sie nicht und schlägt auch nicht vor, sie in F zu
  beantworten.
- **`F.2.17_Betreuungs-LKW_Trinkwasserversorgung`** zeichnet seinen Rumpf ab y 6,096 mm statt
  6,25 mm wie die übrigen 17 Landfahrzeuge des Anhangs. Ein Befund an der Referenzdatei, in der
  Bauart der `ANHANG_E_C_FILL_FINDINGS` zu behandeln. Vermessen in F-d.
- **Die zweite Kreislage.** `F.3.5`/`F.3.14` gegen `J.3.2_Basisstation`: gleiche Bildidee,
  unterschiedliche Zahlen im Katalog (`stationBody(17, 11.5)`). Welche Fassung die Referenz trägt,
  misst F-e.
- **Die Kürzel müssen am Bild abgelesen werden.** Wie bei D.3 und E liegen alle Glyphen als Pfade
  vor. Jeder Teilslice plant den Schritt vor der ersten Zeile Kode ein.

## 10. Reviewgrenze

Diese Notiz trifft **keine fachliche Aussage** über Anhang F. Sie stellt fest, welche Körperformen,
Kopfmarken, Farben und Mechanismen seine 58 Abschnitte tragen und welche davon der Katalog hat.
Bedeutung, Verwechslungsfreiheit und einsatztaktische Eignung — insbesondere die Zuordnung der
Balkenmarken zu einem Stärkebegriff und die Organisationszuordnung aus Abschnitt 7 — sind davon
unberührt und bleiben, wie die bereits offenen Fachreviews, einer entsprechend fachkundigen Person
vorbehalten.
