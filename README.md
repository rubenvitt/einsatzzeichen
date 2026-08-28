# einsatzzeichen

Regelbasierter Generator für taktische Zeichen der Gefahrenabwehr, nach der BBK/BABZ-Systematik.
Statt einzelner SVG-Dateien beschreibt eine Anwendung, **was** dargestellt werden soll
(`SymbolSpec`), und der Generator erzeugt daraus konsistent SVG und Canvas — aus einer
gemeinsamen internen Repräsentation (IR), nicht aus zwei parallel gepflegten Renderern.

Details zur Produktvision: [`Vision.md`](./Vision.md). Umfangs- und Messentscheidungen dieses
Slice (die vermessene Grundzeichen-, Kopfmarken- und Piktogrammgeometrie, welche Zonen belegt sind
und welche begründet offen bleiben, der Coverage-Manifest-Scope):
[`docs/decisions/`](./docs/decisions/).

## Pakete

Vier Pakete, mit einer festen, zyklenfreien Abhängigkeitsrichtung:

```
cli → catalog → core → schema
```

| Paket | Inhalt |
|---|---|
| `schema` | Typen der internen Repräsentation (IR), Einheiten, Farbpalette. Null Fremdabhängigkeiten. |
| `core` | Renderer (SVG, Canvas), Render-Theme-Vertrag, A11y-/Kontrast- und viewBox-Gates, Hüllenberechnung, Fingerprint-Vergleich, Layoutprofile, Kompositionsmotor, Regelvalidierung. Hängt **nie** von `catalog` ab. |
| `catalog` | Grundzeichen, Organisationsfarben, Stärkeangaben, Fähigkeiten, Kompositionsrezepte, konkrete Render-Themes, Quellenregister, Profilregister, Elementregister, Coverage-Manifest. |
| `cli` | Kennzahlenableitung aus der lokalen Referenz, Coverage-Gate, SVG-Export. |

`schema` und `core` haben **null Fremdabhängigkeiten** — beide sind reines TypeScript ohne
externe Pakete.

## Provenienz

Jeder Manifest-Eintrag, jede Quelle und jedes Profil trägt dieselbe Reviewform: ein
**technisches** und ein **fachliches** Review, beide Pflicht. Ein abgeschlossener Status ohne
Reviewer oder gültiges ISO-Datum lässt das Coverage-Gate für alle drei fehlschlagen; eine
fachliche Freigabe braucht zusätzlich eine Befundnotiz oder einen Protokollverweis, eine
`deviation` eine konkrete Begründung. Ein Katalogeintrag trägt kein eigenes Review: es steht auf
seiner Manifestzeile, die für `coverage: 'catalog-entry'` 1:1 zu ihm ist. Das fachliche Review
steht derzeit bei allen Einträgen offen; die Struktur macht das sichtbar, statt es zu verdecken.

`packages/catalog/src/sources.ts` führt elf Quellen der Referenzhierarchie plus `phjardas-tz` als
Vergleichsbestand und `arimo-ofl` als registrierten Schriftquellenträger (eigener `SourceKind
'typeface'`, kein Teil der Referenzhierarchie) — insgesamt 13 Quellen, jeweils mit
Nutzungsgrundlage, Beschaffungsstand und Umgang mit der Geometrie. Für die BABZ-Assets ist die
Lizenzlage `unclear`; die Konsequenz — abgeleitete Kennzahlen statt Dateien — steht damit
maschinenlesbar im Register und nicht nur in Prosa.

Kern und Profile tragen **eigene Datenversionen** (`CoverageManifest.coreVersion`,
`ProfileRecord.version`), unabhängig von den npm-Paketversionen. Der bundesweite Kern ist selbst
das erste registrierte Profil (`bund`); `CatalogEntry.profile` ist Pflichtfeld, damit „kein Profil
angegeben" nicht mit „gehört zum Kern" verwechselbar ist.

## Die Millimeter-Regel

**Alle Längen in der IR und im Katalog sind Millimeter.** Die Umrechnung geschriebener Geometrie
für die erzeugte SVG- und Canvas-Ausgabe geschieht an der Renderergrenze
(`packages/core/src/render/`):

```
1 mm = 72 / 25.4 SVG-Einheiten
```

Diese Konstante wird nie gerundet hart eingetragen, sondern immer über die zentralen Helfer
`mmToUnits` und `unitsToMm` aus `packages/schema` verwendet. Mess- und Vergleichscode im CLI und
in den Core-Gates darf damit Werte aus rohen SVG-Koordinaten normalisieren oder gegen die
Toleranz in SVG-Einheiten vergleichen; das ist keine zweite Ausgabeumrechnung. `SubpathBounds`
und `Ring` im CLI (`packages/cli/src/scan/path-geometry.ts`) tragen weiterhin SVG-Einheiten, weil
sie direkt aus den SVG-Koordinaten der Referenzdateien extrahiert werden.

Fingerprint- und koordinatenbasierte Geometriegates verwenden eine Toleranz von
**0,01 SVG-Einheiten**. Datei- und Rastersnapshots werden dagegen exakt verglichen.

## Status der fachlichen Grundlage

`bbk-babz-2025` ist die **projektinterne Coverage-Baseline**. Der Name bezeichnet den
versionierten Referenzstand des Projekts, keine geltende eigenständige Dienstvorschrift. Der AFKzV
hob in seiner 57. Sitzung am 13./14.03.2025 die vorläufige Anwendung der Empfehlungen auf. Die
BABZ führt das Ergebnis der Überarbeitungsgruppe bis zu einer künftigen FwDV 102/DV 102 als
Diskussionsgrundlage; weitere Veröffentlichung und Verbreitung sind bis zum Abschluss der
Beratungen ausgesetzt. Maßgeblich für diesen am 06.08.2026 geprüften Status ist die
[offizielle BABZ-Seite](https://lernplattform-babz-bund.de/goto.php?target=cat_109540).

TAKTIK verwendet den bereits lokal vorhandenen Arbeitsstand weiterhin reproduzierbar für Coverage
und Vergleiche, behauptet damit aber weder normative Geltung noch fachliche Freigabe. Die offenen
fachlichen Reviews sind in
[`docs/reviews/2026-08-06-domain-review-handoff.md`](./docs/reviews/2026-08-06-domain-review-handoff.md)
dokumentiert.

## D.1: Kapitel 4 technisch vollständig

D.1 deckt Kapitel 4 der projektinternen Coverage-Baseline technisch vollständig ab: 88
Abschnitte sind als 92 Darstellungen umgesetzt, darunter vier getrennt adressierbare
Alternativdarstellungen. Alle 92 Darstellungen bestehen ihre lokalen Kommando-, Box-, Clipping-
und Snapshot-Gates; die 92 zugehörigen Renderfälle bestehen zusätzlich die globalen Mehrgrößen-,
Theme-, Metadaten- und viewBox-Gates.

Diese technische Abdeckung ist weder eine fachliche Freigabe noch eine normative Behauptung. Alle
92 Kapitel-4-Domainreviews bleiben `pending`; ihre fachliche Bedeutung, Verwechslungsfreiheit,
Profilzuordnung und einsatztaktische Eignung müssen weiterhin einzeln durch eine entsprechend
fachkundige Person geprüft werden. Die Abschlussentscheidung für D.1 steht in
[`docs/decisions/2026-08-06-kapitel-4-faehigkeiten-d1.md`](./docs/decisions/2026-08-06-kapitel-4-faehigkeiten-d1.md).

## D.2: Kapitel 5.8 technisch vollständig

D.2 deckt Kapitel 5.8 der projektinternen Coverage-Baseline technisch mit 61 State-IDs und 67
Darstellungen ab, darunter sechs getrennt adressierbare Alternativdarstellungen. Damit enthält
der Katalog zusammen mit D.3 und D.4 insgesamt 254 Piktogrammdarstellungen: 92 Capabilities, 67
States, 53 IuK-, 28 Schadens- und 14 Vegetationsbrandzeichen. Die 339 globalen Renderfälle setzen
sich aus vierzehn Grundzeichen, 71 Rezepten und diesen 254 Piktogrammen zusammen — drei Rezepte
belegen den Kompositionsmotor, die übrigen 68 sind Anhang E, seit dem 18. August 2026 vollständig
(siehe unten).

Alle 67 State-Darstellungen sind eigenständige Zeichen mit kanonischer 32×32-mm-Platzierung und
Standalone-Clipping. D.2 führt weder eine allgemeine State-Komposition noch eine Integration in
`SymbolSpec.states` oder `compose()` ein. Die technische D.2-Evidenz einschließlich der 67/67-
Kontaktbogenprüfung wurde in Task 15 abgeschlossen und technisch freigegeben; die Sichtprüfung ist
in
[`docs/reviews/2026-08-07-d2-visual-qa.md`](./docs/reviews/2026-08-07-d2-visual-qa.md)
dokumentiert.

## D.4: Anhänge K, L und M technisch vollständig

D.4 deckt die Anhänge K (Bauwerksschäden, 18), L (Deichverteidigung, 10) und M (Vegetationsbrand,
14) mit 42 Darstellungen ab. Damit tragen alle fünf Piktogrammarten der Baseline Literale:
`DamageId` und `WildfireId` standen seit D.0 als `never` im Schema und lösen sich hier auf, ohne
dass die Aufteilung neu entschieden werden musste. K und L teilen sich einen ID-Raum — ein Deich
ist ein sehr langes Bauwerk, und getrennte Räume hätten eine Grenze behauptet, die die Zeichen
selbst nicht ziehen.

Zwei Entscheidungen wirken über die neuen Zeichen hinaus. L.1 unterscheidet sich von L.2 allein
durch eine gestrichelte Linie, die `Style` nicht kennt; statt Schema und beide Renderer zu
erweitern, zerlegt `dashedCubic` die Kurve in echte Teilstücke. Und `hellblau` trägt im
Druckmonochrom jetzt `#808080` statt `#eeeeee`, weil M.12 bis M.14 blaue Geometrie ohne schwarze
Kontur auf die Oberfläche setzen und dort mit dem alten Wert 1,16:1 erreichten. Beides steht in
[`docs/decisions/2026-08-10-anhaenge-k-l-m-d4.md`](./docs/decisions/2026-08-10-anhaenge-k-l-m-d4.md).

Die Sichtprüfung aller 42 fand vier Fehler, die sämtliche Gates bestanden hatten — darunter zwei
Zeichen in der falschen Farbe und eines, das von seinem Nachbarn nicht zu unterscheiden war:
[`docs/reviews/2026-08-10-d4-visual-qa.md`](./docs/reviews/2026-08-10-d4-visual-qa.md).

D.3 deckt Anhang J (Informations- und Kommunikationstechnik) mit 48 IDs und 53 Darstellungen ab,
darunter fünf leitergebundene Alternativdarstellungen. Rund ein Drittel der Zeichen trägt seine
Bedeutung in einem Buchstabenkürzel statt in der Geometrie — ohne ihre Kürzel sind `J.3.6`,
`J.3.7` und `J.3.8` dasselbe leere Quadrat. Möglich wurde das durch das `text`-Primitiv aus dem
Slice vom 9. August; die Sichtprüfung aller 53 steht in
[`docs/reviews/2026-08-08-d3-visual-qa.md`](./docs/reviews/2026-08-08-d3-visual-qa.md).

Diese technische Freigabe ist keine fachliche Einsatzfreigabe und keine Aussage normativer
Geltung oder zur Nutzungs- und Lizenzgrundlage der Quellen. Alle 67 getrennten fachlichen
State-Reviews, alle 53 IuK-Reviews und alle 42 Reviews aus K, L und M bleiben `pending`; ihre Bedeutung, Abgrenzung, Lesbarkeit und einsatztaktische
Eignung müssen weiterhin einzeln durch eine fachkundige Person geprüft werden.

## E-a: Anhang E, die ersten 16 THW-Zeichen

E.1.1 bis E.1.16 sind der erste Bestand, der als **Komposition** in den Katalog kommt statt als
Piktogramm: Grundzeichen `formation`, Körperfarbe des THW, Kopfzone `gruppe` aus `strengths.ts` —
und danach liegt ihre gesamte Unterscheidung in einem Buchstabenkürzel. Ohne sein Kürzel ist die
Bergungsgruppe von der Fachgruppe Infrastruktur nicht zu unterscheiden.

Dafür fehlte ein Mechanismus. Die Aufgabe erwartete keinen Schemaschritt, aber Anhang E setzt
seine Kürzel **im** Körper — mittig, dazu `THW` unten rechts und bei sieben Zeichen eine
Zusatzkennzeichnung unten links —, während `compose()` bis dahin nur die Fußzone *unterhalb* des
Körpers kannte. `SymbolSpec.labels` und die drei Zonen in `compose()` schließen diese Lücke; der
Renderer blieb unberührt. Nebenbei fiel auf, dass `blau` in beiden Alternativthemes gegen weißen
Text 4,5:1 knapp verfehlte — beide Werte sind nachgezogen. Alles in
[`docs/decisions/2026-08-12-beschriftungszonen-und-e-a.md`](./docs/decisions/2026-08-12-beschriftungszonen-und-e-a.md).

Die paarweise Sichtprüfung gegen die Referenz fand zwei Referenzdateien mit zu kurzer Füllfläche,
die jedes Gate bestanden hatten:
[`docs/reviews/2026-08-12-e-a-visual-qa.md`](./docs/reviews/2026-08-12-e-a-visual-qa.md).

## E-b: zwölf weitere THW-Zeichen, damit 28 von 37

E.1.17 bis E.1.28 — drei Fachzüge, zwei Zugtrupps, ein Stab, vier Fachgruppen, zwei Trupps. Sie
brauchten keinen neuen Stärkegrad und keine neue Farbe, aber zwei Entscheidungen, die über sie
hinausreichen.

**Die Box des mittigen Beschriftungslaufs ist jetzt 28 statt 26 mm breit.** `Log-MW` (E.1.26)
braucht in Arimo 26,156 mm, wo die Referenzschrift 25,13 mm setzt — der Lauf passte auch perfekt
zentriert nicht in seine Box. Die 2 mm Marge waren an den **unteren** Läufen gemessen (linke Kante
3,03 mm) und für die mittige Zone eine übernommene Annahme; deren vermessene Grenze ist das weiße
Innenfeld der Referenz. Die Box ist damit eine Hüllengrenze und keine Referenzlaufgrenze, und die
16 Zeichen aus E-a sind im Bild unberührt.

**Drei Zeichen weichen bewusst von ihrer Referenz ab** und tragen dafür ein technisches
`deviation`. E.1.19 und E.1.24 bilden je drei Marken *im* Körper nicht ab — die
Unterstellungsmarke des Zugtrupps —, weil der Bestand für eine Platzierungsregel keine vermessene
Konstante hergibt: drei Fälle über drei Kapitel, in drei verschiedenen Konstruktionen, und `D.1.9`
trägt bei gleichem Begriff keine. E.1.17 setzt sein Kürzel mittig, wo die Referenz 2,0 mm nach
links abweicht. Nebenbei widerlegt der Slice die Annahme seiner eigenen Aufgabenstellung: E.1.18
trägt keine Zusatzgeometrie, nur eine deckungsgleiche Rahmendublette. Alles in
[`docs/decisions/2026-08-17-anhang-e-b.md`](./docs/decisions/2026-08-17-anhang-e-b.md).

Zehn der zwölf Referenzdateien tragen Befunde an der Füllfläche; nur E.1.17 und E.1.22 sind
normgerecht. Die Sichtprüfung aller zwölf fand keinen Fehler an der Umsetzung und belegt, dass
`minRenderPx` auch bei den längsten Kürzeln des Bestands eine ehrliche Angabe ist:
[`docs/reviews/2026-08-17-e-b-visual-qa.md`](./docs/reviews/2026-08-17-e-b-visual-qa.md).

## E-c: die letzten neun THW-Zeichen, damit E.1 vollständig

E.1.29 bis E.1.37 schließen Anhang E.1: den 37 Referenzdateien stehen jetzt 37 Rezepte gegenüber,
lückenlos von E.1.1 bis E.1.37. Vier Trupps, eine Gruppe, zwei Züge — und zwei Zeichen, die im
Rezept keine Kopfzone tragen, aus zwei verschiedenen Gründen. Das Coverage-Manifest führt seither
die eine Umfangszeile `E.1` statt der 37 Einzelabschnitte; dass dahinter wirklich alle 37 stehen,
hält ein eigener Test fest, denn die Umfangsprüfung sieht Vollständigkeit nicht.

**Die mittige Grundlinie rechnet jetzt gegen die Körperunterkante.** E.1.37 („Ortsverband") ist das
einzige Zeichen des Anhangs auf dem Gebäudekörper — im Referenzbestand tragen zwei der 661 Dateien
diese Hülle. Am `formation`-Körper (Hülle 6…26 mm) sind „12 mm unter der Oberkante" und „8 mm über
der Unterkante" dieselbe Zahl, 18,0 mm; am Gebäudekörper (Hülle 3…26 mm) sind es 15,0 gegen
18,0 mm, und die Referenz steht bei 18,9999 mm. Die beiden anderen gegen die Unterkante gerechneten
Anker treffen die Referenz dort exakt — `THW`-Grundlinie 23,9995 mm, Füllfläche unten 24,9999 mm —,
der obere lag um 4 mm daneben und schob die Beschriftungsbox nach oben über die Traufe hinaus: sie
begann bei 8,9124 statt bei 11,9124 mm, während das blaue Rechteck der Referenz erst bei 11,0000 mm
anfängt. Kein Snapshot der 28 Bestandszeichen ändert sich dadurch; sie stehen alle auf `formation`.
Damit ist auch die Prognose der E-b-Notiz widerlegt, für E-c sei kein Kernschritt mehr in Sicht —
sie trägt dazu einen datierten Nachtrag.

**E.1.31 ist die vierte bewusste Abweichung des Katalogs**, nach E.1.17, E.1.19 und E.1.24.
„System Bereitstellungsraum 500" trägt an der Stelle der Kopfzone keinen Stärkegrad, sondern zwei
senkrechte Balken; der Katalog baut das Zeichen ohne Kopfzone und trägt dafür ein technisches
`deviation`. Nicht die Fallzahl ist der Grund — den Balkenpfad führen drei der 661 Referenzdateien
byteidentisch (E.1.31 sowie F.1.1 und F.1.3, die beide noch kein Rezept haben), die Geometrie ist
also eine vermessene Konstante. Es fehlt die Bedeutung: `StrengthId` ist ein Fachbegriff, und
welchen die Balken tragen, entscheidet die Datei nicht; eine ID zu vergeben hieße, einen Begriff zu
behaupten, den die Quelle nicht führt. E.1.37 hat dagegen wirklich keine Kopfzone — seine
Strichebene trägt nur den Rahmen, wie bei genau drei der 37 E.1-Dateien (E.1.3, E.1.21, E.1.37).

Sechs der neun Referenzdateien sind normgerecht. E.1.29 und E.1.31 haben eine unten verkürzte
Füllfläche (22,4998 bzw. 22,0003 statt 25,0 mm) und eine entsprechend nach oben gewanderte
Beschriftung; E.1.37 setzt seine mittige Grundlinie auf 18,9999 mm und damit den Grundlinienabstand
auf 5,0 mm, wo 30 der 37 E.1-Dateien 6,0 mm führen. Der Katalog folgt der Mehrheit und baut alle
drei wie die normgerechten Dateien — bei E.1.37 bleibt dadurch eine Differenz von 1,0 mm zur
Referenz stehen. Die Befunde sind Daten in `ANHANG_E_C_FILL_FINDINGS` und keine Abweichung der
Umsetzung. Die Entscheidungsnotiz steht in
[`2026-08-17-anhang-e-c.md`](./docs/decisions/2026-08-17-anhang-e-c.md), die paarweise Sichtprüfung
in [`2026-08-17-e-c-visual-qa.md`](./docs/reviews/2026-08-17-e-c-visual-qa.md). Nachgezogen sind die drei
Notizen, deren Aussagen dieser Slice widerlegt hat — der
[Zuschnitt](./docs/decisions/2026-08-11-anhang-e-zuschnitt.md) („zeichengleich" gilt nur für die
Füllebene), die [E-a-Notiz](./docs/decisions/2026-08-12-beschriftungszonen-und-e-a.md) und die
[E-b-Notiz](./docs/decisions/2026-08-17-anhang-e-b.md), alle drei mit datiertem Nachtrag.

## LFH-424: Kapitel 1 vollständig, sechs Grundzeichen mehr

Der Katalog führte acht der vierzehn Grundzeichen aus Kapitel 1; die sechs fehlenden — Landfahrzeug
(1.3), Luftfahrzeug (1.4), Wasserfahrzeug (1.5), Gebiet (1.9), Ereignis (1.13) und Spontanhelfer
(1.14) — galten als **nicht vermessbar**. Das war eine Aussage über das Werkzeug, nicht über die
Quelle: der Extraktor legte für Kurvenpfade keine Form ab, und `fingerprints.json` führte für 1.3,
1.4, 1.5, 1.9 und 1.14 `shapes: []` — seit dem Teilslice E.2 nur noch für 1.14, siehe unten.
Vermessen sind sie jetzt mit einem eigenen Pfadparser mit analytischen Kubik-Extrema, wie ihn E-c
für die 37 E.1-Dateien gebaut hat. Vier von
ihnen tragen ihre Mittellinie in der Ebene `Flächige_Fülung` verbatim — 1.3 mit
0,9998/5,7499/31,0000/26,0001, 1.4 mit 1,0001/7,9999/31,0003/23,0001, 1.5 mit
1,0001/9,0001/31,0000/24,0002 und 1.9 mit 1,5199/3,2298/30,9993/28,3237. 1.13 und 1.14 sind die
beiden einzigen Dateien des Kapitels ganz ohne Füllebene; bei 1.14 trägt stattdessen das Ringpaar
(außen 1,7501/1,7498/30,2500/30,2500, innen 2,2500/2,2500/29,7497/29,7497 → Mittellinie 2/2/30/30
bei Strich 0,5).

**Neun der vierzehn Grundzeichen standen damit am Fingerprint-Gate, fünf nicht** — heute sind es
dreizehn gegen eines. Für die fünf Kurvenkörper brach `matchFingerprint` ab, bevor es den Körper
ansah: ihr Artefakteintrag führte keine vergleichbare Form. Ihre Manifestzeile behauptete dieses
Gate deshalb nicht, sondern trug die Nachweisart `body-geometry-regression` neben dem Snapshot,
nach dem Vorbild von `head-shape-regression`. Die Unterscheidung fällt am Artefakt (`shapes: []`)
und nicht an einer gepflegten Liste, damit ein späterer Extraktorausbau sie von selbst auflöst —
**und genau das ist mit dem Teilslice E.2 eingetreten.** Seither trägt nur noch `1.14 Spontanhelfer`
diese Nachweisart, 1.3, 1.4, 1.5 und 1.9 stehen auf `body-fingerprint`. Bei 1.14 ist der Grund ein
anderer und von keinem Extraktorausbau zu beheben: die Datei führt als einzige des Kapitels neben
1.13 überhaupt keine Ebene `Flächige_Fülung`.

**1.13 Ereignis ist das erste Grundzeichen, das keine Organisationsfarbe annehmen darf.** Sein
Körper ist ein offener Polyzug, und SVG schließt einen gefüllten Polyzug implizit — aus dem Haken
würde eine volle Dreiecksfläche. Der Haken kommt in genau einer der 661 Referenzdateien vor, in
1.13 selbst, und in keinem zusammengesetzten Zeichen; es gibt also keinen Beleg für ein eingefärbtes
Ereignis, und `compose()` wirft statt zu füllen. Seine Offenheit ist dabei nicht nur am Snapshot
geprüft, sondern **gegatet**: die analytische Strichhülle des offenen Polyzugs liefert
3,7920/6,8613/28,2080/25,4507 gegen den eingecheckten Kennwert 3,792/6,862/28,207/25,451 (höchstens
0,0029 Einheiten), die des geschlossenen 3,5329/6,7500/28,4671/25,4507 und damit bis zu 0,7374
Einheiten daneben. Der Mechanismus ist bewusst eng gefasst: 1.10 Maßnahme ist derselbe Polyzugtyp,
wird aber mit Fase gezeichnet, und dieselbe Rechnung landet dort mit 0,5585/3,7500/31,4415/29,4859
gegen 0,571/3,5/31,428/29,257 um 0,7087 Einheiten daneben. Der Vergleichsmodus steht deshalb je
Zeile in der Prüftabelle und wird nicht aus der Formklasse abgeleitet.

**`hilfsorganisation` hat eine Farbe: Weiß.** Zwei Notizen und zwei Kodekommentare hielten fest, für
sie gebe es in Kapitel 2 keine Referenzdatei — `2.2_Organisationen.svg` ist sie. Genau acht der 21
Dateien aus Kapitel 2 tragen einen vollflächigen Fleck über 0/0/32/32 **und** eine Typo-Ebene,
nämlich 2.1 bis 2.8: acht Flecken für acht `OrganizationId`-Werte, und 2.2 trägt `#ffffff`. Der
Katalog kennt seither acht Organisationsfarben statt sieben. Was die Quelle mitliefert, ist ein
Vorbehalt: Weiß ist im Bestand zugleich die neutrale Grundfüllung, ein Körper mit dieser
Organisation ist farblich von einem organisationslosen nicht zu unterscheiden. Der nicht-farbliche
Kanal trägt hier deshalb mehr als bei den übrigen sieben — und `weiss` ist die einzige der acht
Kontursignaturen, die in keinem eingecheckten Bild vorkommt, weil kein Katalogeintrag diese
Organisation setzt.

Die Umfangszeile bleibt davon unberührt: sie führt seit jeher die ganzen Kapitel `1` und `2`, und
die sechs neuen Zeichen füllen diesen Anspruch, statt ihn zu erweitern. Was wächst, sind die
Manifestzeilen — Kapitel 1 trägt jetzt 14 statt acht, Kapitel 2 acht statt sieben. Die Messwerte,
die Berichtigungen an den älteren Notizen und die drei Posten, die begründet offen bleiben, stehen
in [`2026-08-18-grundlagen-restpunkte.md`](./docs/decisions/2026-08-18-grundlagen-restpunkte.md).

## LFH-424: die Fahrwerkszone aus Kapitel 5.1

Nach Kapitel 1 ist die zweite Hälfte von LFH-424 die **Fahrwerkszone** — die Räder, Ketten und
Verbindungsstriche, die ein Landfahrzeug in eine Kategorie einordnen. Sie ist die dritte Zone des
Kompositionsmotors neben Kopf- und Fußzone und die erste, die an der Körper**unterkante** hängt
statt an der Oberkante ihrer eigenen Zone: `ChassisShape` ist deshalb ein eigener Typ neben
`HeadShape` und kennt neben dem Kreis auch das Stadion (Kette) und den waagerechten Strich.

Fünf der damals sechs Fahrzeugkategorien waren vermessen und gebaut (5.1.1.1, .2, .3, .5 und .6);
`amphibienfahrzeug` wirft, weil von seiner Wellenlinie nur die Strichhülle ablesbar ist. Seit dem
Teilslice E.2 sind es **sieben der acht** — die beiden Anhängerfahrwerke sind dazugekommen, und
`amphibienfahrzeug` ist weiterhin das einzige, das wirft. Die Zone ist nicht auf die Musterblätter
beschränkt: 25 der 31 Zeichen aus Anhang E.2 tragen sie überhaupt, 21 davon in einer der fünf
damals gebauten Kategorien und 20 auf genau dem Landfahrzeugkörper aus 1.3 — ein E.2-Rezept
erreicht sie über `SymbolSpec` wie E.1 seine Kopfzone. Vollständig war E.2 damit nicht: neben dem
Landfahrzeug führen die 31 Dateien vier weitere Körperformen (der Wechsellader E.2.15, die vier
Anhänger, die Trinkwasseraufbereitungsanlage E.2.26 und der eigene Wasserfahrzeugkörper von E.2.27
bis E.2.31, der **nicht** der aus 1.5 ist), und für die Anhängerfahrwerke fehlten zwei
Taxonomie-IDs. Jeder dieser Posten ist mit E-d, E-e und E-f geschlossen (siehe unten).

Die Umfangszeile führt dafür seither `5.1.1` — bewusst den Unterabschnitt und nicht das ganze
Kapitel 5.1, von dem allein die Fahrzeugkategorien umgesetzt sind. Sie ist auch mit den beiden
Anhängerfahrwerken aus E.2 nicht gewachsen: `5.1.2.4` und `5.1.2.5` tragen seither eine
Manifestzeile, aber `5.1.2` steht nicht im Umfang, weil von dessen fünf Abschnitten nur diese
zwei umgesetzt sind.

Zwei Nebenbefunde gehören dazu. Eine Fahrzeugkategorie war seither nur am **Landfahrzeug** zulässig
(keine der drei Luftfahrzeugdateien und keines der fünf E.2-Wasserfahrzeuge trägt ein Fahrwerk) —
seit E.2 kommen der Anhänger- und der Wechselladerrumpf dazu, `CHASSIS_KINDS` führt drei Arten
statt einer. Und sie schließt eine Fußzone aus, weil beide denselben Streifen unterhalb des Körpers
belegen.
Die eigenständigen Verwaltungsstufen-Zeichen aus Kapitel 5.7 und das Kreiskörperprofil bleiben
begründet offen. Davon getrennt verwendet Anhang D inzwischen ausschließlich die drei in seinen
Funktionszeichen direkt belegten Sternköpfe `kreis`, `nationalstaat` und
`europaeische-union`; die drei unbelegten Stufen bleiben fail-closed. Beide Zuschnitte stehen mit
ihren Messwerten in
[`2026-08-18-grundlagen-restpunkte.md`](./docs/decisions/2026-08-18-grundlagen-restpunkte.md).

## E-d, E-e und E-f: Anhang E.2, damit alle 68 Zeichen des Anhangs E

E.2 ist die zweite Hälfte von Anhang E und der erste Rezeptblock, der Fahrzeuge führt: 21
Landfahrzeuge (E-d), fünf Anhänger und Sonderkörper (E-e), fünf Wasserfahrzeuge (E-f).
**Alle 31 sind gebaut** — den 68 Referenzdateien des Anhangs stehen damit 68 Rezepte gegenüber,
lückenlos von E.1.1 bis E.1.37 und von E.2.1 bis E.2.31. Der Katalog führt seither 71 Rezepte und
339 Renderfälle, 358 Manifestzeilen und 372 offene fachliche Reviews, davon 68 im Bereich E (eigener
Lauf `pnpm cli coverage`). `E.2.6` ist am 18. August 2026 nachgezogen worden und war bis dahin der
einzige offene Abschnitt; der Grund und seine Auflösung stehen weiter unten.

**E.2 ist der erste Block, dessen Zeichen nicht alle auf demselben Körper stehen.** Wo E.1 alle 37
Zeichen auf `formation` setzt und ihre ganze Unterscheidung in ein Kürzel legt, verteilen sich die 31
E.2-Rezepte auf **fünf Körperformen**: 20 Landfahrzeuge, fünf Wasserfahrzeuge, vier Anhänger, ein
Wechsellader und ein hochkantes Rechteck. Drei davon sind neu — `trailer`, `swap-loader-vehicle` und
`upright-rectangle` —, `SymbolKind` führt damit 17 Werte statt vierzehn. **`BASE_SYMBOLS` bleibt
trotzdem bei vierzehn**, und das ist die Absicht und kein Versäumnis: dieses Register ist Kapitel 1,
und zwei der drei neuen Formen haben dort keinen Abschnitt — ihre einzige Belegdatei ist das
E.2-Zeichen selbst. Ein erfundener Abschnitt wäre eine Quellenangabe, die die Quelle nicht macht.
Die drei Formen stehen deshalb ohne eigene Manifestzeile und sind stattdessen gegen ihre
E.2-Referenzdatei gegatet. Dazu kommt die erste **Körpervariante** des Schemas: `raised-hull`, der
Rumpf von E.2.27 bis E.2.31, gegenüber `1.5` angehoben und leicht verkleinert. Sie ist bewusst keine
zweite Grundzeichenart — es ist dasselbe Grundzeichen in einer zweiten, in der Quelle belegten
Zeichnung, und `vehicle-water` selbst darf nicht auf diese Maße wandern, weil es `1.5` als
Belegdatei beansprucht und seit diesem Slice dagegen gegatet ist.

**Der Kennwertextraktor erfasst jetzt gekrümmte Füllpfade, und das musste vor dem ersten Rezept
passieren.** Für einen Kurvenkörper legte er bisher keine Form ab; `matchFingerprint` griff im
Rezeptpfad deshalb die erste Form, die das Artefakt überhaupt führte — bei den meisten E.2-Dateien
eine Glyphenhülle statt des Körpers. Ein Rezept hätte damit seinen Körper gegen einen Buchstaben
verglichen, ohne dass ein Gate etwas gemeldet hätte. Der Ausbau ist am ganzen Bestand messbar: von
den 661 Kennwertsätzen ändern **151** ihre Formzahl, 60 wechseln von keiner Form auf eine, 91 wählen
eine andere erste Form als vorher, und die Zahl der Sätze ganz ohne Form fällt von 138 auf 78. Die
Auswahlregel ist dabei nicht „der erste", sondern „der einschließende" — in 27 der 31 E.2-Dateien
liegt das Farbfeld als zweiter gekrümmter Füllpfad neben dem Körper, und welcher davon zuerst käme,
wäre eine Aussage über die Exportreihenfolge des Zeichenprogramms. In Kapitel 1 löst der Ausbau
vier der fünf ungegateten Körper auf (siehe oben).

Drei Mechanismen kommen aus den Zeichen selbst. **Eine vierte Beschriftungszone** trägt das
Trägerkürzel *unterhalb* des Körpers in der Organisationsfarbe statt weiß darin — fünf Rezepte
nutzen sie, alle in E-f, und ohne sie setzte der Katalog ein Kürzel dorthin, wo die Referenz keines
hat. **Der Schriftgrad des mittigen Laufs ist jetzt ein Wert am Rezept**: neun der 31 Läufe sind in
der Referenz kleiner gesetzt und tragen ihre gemessene Kappenhöhe zwischen 3,40995 und 4,38290 mm,
die übrigen 20 den Normwert 4,87 (29 der 31 Zeichen tragen überhaupt einen mittigen Lauf — E.2.22
und E.2.27 führen keinen). Eine Auslöseregel dafür gibt es nicht, und der Katalog behauptet
auch keine — er trägt Werte. Und **die mittige Grundlinie ist eine Eigenschaft des Körperprofils**
geworden: die feste Vorgabe von 8 mm über der Körperunterkante trifft drei der fünf E.2-Formen
nicht (Wasserrumpf 6,9896, Wechsellader 7,5, Hochkantrechteck 13). Alle 68 beschrifteten Rezepte
halten damit ihre 28-mm-Box exakt ein.

Beim Fahrwerk wachsen die vermessenen Fahrzeugkategorien von fünf auf **sieben von acht**. Die
beiden neuen heißen `anhaenger-ein-rad` und `anhaenger-zwei-raeder` — **nach der Zeichnung benannt
und nicht nach dem Quellbegriff.** Die Quelle führt ihre beiden Anhängerfahrwerke als „von PKW
gezogen" (5.1.2.4) und „von LKW gezogen" (5.1.2.5). Der Teilpfadzensus der Strichebene sagt etwas
anderes: 5.1.2.1 „allgemein" führt drei Teilpfade und damit **kein** Rad, 5.1.2.4 vier und 5.1.2.5
fünf — und von den vier E.2-Anhängern tragen E.2.22 („Grundzeichen"), E.2.23 („von LKW gezogen")
und E.2.25 die Vier-Teilpfad-Form, allein E.2.24 die mit fünf. Eine ID aus dem Quellbegriff wäre an drei der vier E.2-Anhänger eine
Falschaussage gewesen — dieselbe Zurückhaltung, mit der E.1.31 seinen Stärkegrad verweigert hat. 25
der 31 Rezepte tragen ein Fahrwerk, und `CHASSIS_KINDS` lässt es seither an drei Körperarten zu.

**E.2.26 ist die fünfte bewusste Abweichung des Katalogs**, nach E.1.17, E.1.19, E.1.24 und E.1.31.
Die Trinkwasseraufbereitungsanlage setzt ihr `THW` 1,0 mm weiter links, als `LABEL_SIDE_MARGIN_MM`
ergibt — bei n = 1 und zwei gleich guten Lesarten. Dafür wird kein Mechanismus gebaut; die Zeile
trägt ein technisches `deviation` und die Messung in der Notiz, wie E.1.17 seine 2,0 mm trägt.

**`E.2.6` war der eine offene Abschnitt, und der Grund war kein Messproblem.** Der Gabelstapler der
öffentlichen Gefahrenabwehr ist das einzige Zeichen des Anhangs mit orangem Körper und trägt
zugleich ein weißes `Stapler` und `THW`. `labelContrastRequirements()` leitet daraus die Anforderung
„weiß auf orange" mit `MINIMUM_TEXT_CONTRAST` = 4,5:1 ab — erreicht werden 2,3820:1 im Referenz- und
im Accessible-Theme (`orange` = `#fa8c00`) und 2,3231:1 im Drucktheme (`#aaaaaa`), nachgerechnet aus
der Palette **und** aus den gerasterten Pixeln bei 256 px. Lösbar wäre das nur in
`accessible-light`: im Drucktheme ist die Palette achromatisch, und von allen 256 Grauwerten
erfüllt **keiner** zugleich 4,5:1 gegen Weiß, 3:1 gegen Schwarz und den geforderten
Helligkeitsabstand von mehr als 0,045 zu den sieben übrigen Organisationsfarben. Das Fenster ist
nicht eng, sondern leer.

**Entschieden am 18. August 2026 durch den Projektinhaber:** der Katalog baut das Zeichen so, wie
die Referenz es zeigt, und führt „weiß auf orange" als bekannten, begründeten Negativbefund. E.2.6
trägt deshalb **keine** `deviation` — abweichend ist nicht die Umsetzung von der Quelle, sondern
die eigene Kontrastschwelle des Katalogs vom Bild. Die Ausnahme steht als Datum im Paket
(`CONTRAST_EXCEPTIONS` mit Paar, Themes, Abschnitten, Entscheidungsdatum, Begründung und den
geprüften und verworfenen Wegen) und ist im Betrieb sichtbar. Die Ausnahme ist ausdrücklich
**kein** Freigabeblocker — ein Blocker ist ein offener Punkt, dieses Paar ist entschieden. Das
a11y-Gate bleibt scharf: die Ausnahme wirkt paarweise und themeweise, die Zahl der gedeckten
Befunde ist auf **genau einen je Theme** gepinnt, und ein
weiteres oranges Rezept fällt weiterhin an einer eigenen Zusage auf.

**Die Umfangszeile ist damit zusammengezogen: aus `E.1` plus 30 E.2-Einzelzeilen wird `E`**, 47
Einträge werden 17. Das ging vorher nicht: die Umfangsprüfung sieht Vollständigkeit nicht, sie
prüft an einem Präfix nur, ob *eine* Zeile existiert — `E` bestünde deshalb schon mit den 37
E.1-Zeilen allein. Getragen wird die Zeile jetzt von zwei Tests, die die Lückenlosigkeit aus zwei
verschiedenen Quellen ableiten: `recipes.test.ts` aus den Rezepten, `coverage-manifest.test.ts` aus
den Manifesteinträgen. Zwei Wege zu derselben 68, weil ein Rezept ohne Manifestzeile auf dem ersten
Weg allein nicht auffiele.

Die Befunde an der Quelle stehen als eigene Exporte im Katalog: 15 über die drei Blöcke, darunter
sieben Zeichen, deren Bild ein anderes Kürzel führt als ihr Dateiname: E.2.7 „Telelader" gegen
„Teleskopstapler", E.2.8 „Radlader" und E.2.9 „Bagger" jeweils ohne „BRmG", E.2.13 und E.2.14 mit
römischer statt arabischer Ziffer, E.2.15 „LKW" für das Wechselladerfahrzeug und E.2.25 „0,6 t" für
das Leergewicht. Die Begründungen stehen in
[`docs/decisions/2026-08-18-anhang-e2.md`](docs/decisions/2026-08-18-anhang-e2.md), im
Sichtprüfungsprotokoll
[`docs/reviews/2026-08-18-anhang-e2-visual-qa.md`](docs/reviews/2026-08-18-anhang-e2-visual-qa.md),
in `packages/catalog/src/recipes-anhang-e.ts` und im Coverage-Manifest.

## F-a: Anhang F, die sanitätsdienstlichen Einheiten

F-a ist der erste Teilslice des Anhangs F und sein **Tor**: die beiden Mechanismen, die er baut,
tragen auch F.1.12 bis F.1.22, alle 17 Fahrzeuge aus F.2 und alle 19 Orte aus F.3. Von den zwölf
Referenzdateien der Abschnitte F.1.1 bis F.1.11 sind **elf gebaut**; `F.1.3` ist vermessen und
bewusst nicht gebaut (siehe unten). Der Katalog führt seither 82 Rezepte, 350 Renderfälle und
369 Manifestzeilen.

**Der Zuschnitt nannte zwei fehlende Mechanismen, gemessen sind es drei.**

1. **Die Fachdienstteilung ist randbündig** — das Kreuz läuft über die volle Körperfläche, nicht
   in der Standardbox 4/8/24/16 mm der Kapitel-4-Piktogramme. Sie ist deshalb eine
   Körpereigenschaft (`SymbolSpec.bodyMarks`, Port `CatalogPorts.bodyMark`) und keine zweite
   Piktogrammdarstellung: die Maße der randbündigen Fassung sind aus der Boxfassung nicht
   skalierbar (Arztleiste 8 gegen 10 mm, Transportring r 5,5 gegen r 7). Die 92 bestehenden
   Kapitel-4-Darstellungen bleiben unberührt — belegt daran, dass dieser Teilslice **keine
   einzige** bestehende Snapshotdatei verändert.
2. **Eine fünfte Beschriftungszone oben links** (`BodyLabels.topLeft`). Ihr Anker ist
   zurückgerechnet und nicht abgelesen: dieselben Läufe mit bekanntem Anker gerastert und die
   Differenz abgezogen ergibt 2,5 mm bei vier der fünf F-a-Läufe. Ihre Grundlinie hängt am
   Körperprofil, wie die des mittigen Laufs seit E.2 — vermessen ist genau eine Zahl, und an jeder
   anderen Körperform wirft `validateSpec`.
3. **Die Schriftfarbe war ein Fehler im Bestand.** `compose()` setzte die Läufe im Körper fest auf
   Weiß, belegt an den 37 Zeichen aus E.1. Anhang F setzt sie schwarz auf weißem Körper — ein
   weißer Lauf wäre dort unsichtbar gewesen, und kein Gate hätte es gemeldet: das A11y-Gate prüft
   die Paare, die der Katalog selbst anmeldet, und ein Zeichen, das seinen eigenen Lauf verschluckt,
   meldet keines an. Die Farbe kommt jetzt aus einer Ableitung — **nicht** aus dem Kontrastverhältnis:
   das hätte `E.2.6` von Weiß auf Schwarz gekippt und damit die dort entschiedene Ausnahme still
   überschrieben. Aufgefallen ist der Unterschied an genau einer verschobenen Snapshotdatei.

Dazu kommt die erste **Alternativdarstellung auf Rezeptebene**: der Rezeptschlüssel
`F.1.11#alternative` erzeugt die Manifestzeile `bbk-babz-2025:F.1.11#alternative` neben `#primary`.
Bis dahin trug keine Manifestzeile außerhalb der Piktogrammregister `variant: 'alternative'`. Anhang
F braucht die Form acht Mal; LFH-408 ist dafür keine Vorbedingung.

**Die Organisation ist eine Entscheidung und keine Messung.** Alle 66 F-Dateien führen ausschließlich
`#fff`; ob das `hilfsorganisation` bedeutet oder gar keine Organisation, sagt die Quelle nicht. Der
Katalog trägt `hilfsorganisation` — im Referenztheme ist das Bild in beiden Lesarten dasselbe, und
`ORGANIZATION_COLORS` bildet die Organisation auf `weiss` ab. Damit hat die achte Organisationsfarbe
aus LFH-424 erstmals Katalogeinträge, die sie setzen.

**`F.1.3` ist vermessen und nicht gebaut.** Es bringt drei Zeichnungen mit, die kein anderes Zeichen
dieses Teilslice teilt: ein Zelt mit anderer Schenkelneigung als `F.1.4` (Mittellinie durch (16|6)
und (1|23) statt (1|26)), ein schwarzes Fußband ab y 23 und ein Bett in eigenen Maßen. Alle drei
treffen in F-b wieder auf — dort mit mehr als einer Belegdatei je Form, wo die Grenze belegbar ist
statt geraten. Die Maße stehen in der Entscheidungsnotiz, damit F-b sie nicht wiederholen muss.

**Drei Befunde an einer einzigen Datei** stehen an `F.1.2`: die Datei heißt
„Dekontaminationseinheit für Verletzte", zeichnet aber `4.1.1 ABC-/CBRN-Schutz` und nicht `4.1.3
Dekontaminieren` (der Unterschied ist allein das Häkchenpaar an den Schaftenden); ihr Kürzel `MTF`
ist mit dem von `F.1.1` zeichengleich; und ihr Innenzeichen steht um 2,3° schief. Der Katalog
zeichnet es symmetrisch und erklärt das als Abweichung — 0,164 mm sind dreizehnmal der
Näherungsfehler, den derselbe Teilslice andernorts als Exportartefakt abtut.

Die Begründungen stehen in
[`docs/decisions/2026-08-18-anhang-f-a.md`](docs/decisions/2026-08-18-anhang-f-a.md), die
Sichtprüfung aller gebauten Zeichen in
[`docs/reviews/2026-08-18-f-a-visual-qa.md`](docs/reviews/2026-08-18-f-a-visual-qa.md).

## F-b: F.1.3 und F.1.12 bis F.1.22

F-b ergänzt 14 Darstellungen und schließt damit die Rezeptlücke F.1.3 sowie F.1.12 bis F.1.22.
Der Katalog führt nun 96 Rezepte, 364 Renderfälle und 383 Manifestzeilen. Zu den bestehenden
randbündigen Fähigkeiten kommen drei eng begrenzte Mechanismen:

- `bodyVariant: foot-band` für das schwarze Fußband von F.1.3 und F.1.17;
- `BodyLabels.bottomCenter` für `SOZ` und `SEG` auf der vermessenen unteren Mitte der Formation;
- rein geometrische `TechnicalBodyMarkId`s für die zentralen, sichtbaren Innenformen von F.1.13,
  F.1.16 und F.1.21, ohne daraus eine neue Capability- oder Strength-Semantik abzuleiten.

Alle Varianten und technischen Marken sind fail-closed an den vermessenen Formationskontext
gebunden. F.1.17 nutzt die bestehende Capability `catering` in einer eigenen reduzierten
randbündigen Fassung; F.1.18 und F.1.20 missbrauchen weder `bottomLeft` noch `topLeft` für ihren
unteren mittigen Lauf. F.1.4 und F.1.19 sowie alle bisherigen Capability-IDs bleiben unverändert.

Die exakte Referenz-/Rezeptmatrix und die Messentscheidungen stehen in
[`docs/decisions/2026-08-25-anhang-f-b.md`](docs/decisions/2026-08-25-anhang-f-b.md), die
Einzelsichtung in
[`docs/reviews/2026-08-25-f-b-visual-qa.md`](docs/reviews/2026-08-25-f-b-visual-qa.md). Diese
Sichtung ist nicht der finale Kontaktbogen des späteren Task 6. Das Domain-Review bleibt offen.

## F-c: F.2.1 bis F.2.9

F-c ergänzt 14 Fahrzeugdarstellungen und führt den Katalog auf 110 Rezepte, 378 Renderfälle und
397 Manifestzeilen. Landfahrzeug, Luftfahrzeug und Anhänger verwenden getrennte, an ihrer eigenen
Hülle vermessene Body-Mark-Builder. Ein unbekanntes Tripel aus Art, Körpervariante und Marke wird
abgelehnt; die Formation, `foot-band` und F-b bleiben unverändert.

Die elf Landdarstellungen tragen die neutrale Variante `plain-wheel-pair`: zwei sichtbare
Radringe, aber ausdrücklich keine `vehicleCategory`. F.2.6 und F.2.7 verwenden die separat
vermessene Luftvariante `raised-hull` mit Rotor. Die Winschform aus F.2.6 bleibt eine geometrische
`TechnicalBodyMarkId`, weil die Quelle ihre Gleichheit mit einer Kapitel-4-Capability nicht
belegt. `ITH` steht schwarz oberhalb des Luftkörpers auf der Ausgabeoberfläche; `GW-San` und `50`
sind zwei explizite, nicht austauschbare Zeilen im Landkörper.

Die exakte Referenzmatrix und alle Messwerte stehen in
[`docs/decisions/2026-08-25-anhang-f-c.md`](docs/decisions/2026-08-25-anhang-f-c.md), die Sichtung
aller 14 Paare in
[`docs/reviews/2026-08-25-f-c-visual-qa.md`](docs/reviews/2026-08-25-f-c-visual-qa.md). Diese
Sichtung ist nicht der finale Kontaktbogen des späteren Task 6. Alle 14 Domain-Reviews bleiben
`pending`; der beanspruchte Gesamtscope bleibt vor Abschluss von Anhang F geschlossen.

## F-d: F.2.10 bis F.2.17

F-d ergänzt acht Betreuungsfahrzeuge und führt den Katalog auf 118 Rezepte, 386 Renderfälle und
405 Manifestzeilen. F.2.10 bis F.2.14 sowie F.2.16/F.2.17 sind Landfahrzeuge; F.2.15 verwendet
die eigene Anhängerhülle. Die Kategorien sind literal gebunden: sechsmal `kfz-kategorie-1`,
einmal `kfz-kategorie-2` und einmal `anhaenger-ein-rad`. F.2.13, F.2.14 und F.2.17 tragen das
separat am Fahrzeug vermessene schwarze `foot-band` x = 1…31 mm, y = 23…26 mm.

Die vorhandenen Semantiken `care`, `meal-preparation` und `drinking-water` erhalten ausschließlich
quellenvermessene Land-/Anhängerfassungen. Die Vierwegeform aus F.2.11 und der um 3 mm nach unten
versetzte Acht-Speichen-Ring aus F.2.16 bleiben neutrale `TechnicalBodyMarkId`s mit geometrischer
A11y-Beschreibung. Bei der mobilen Küche folgt die Löffeltinte den gemessenen Grenzen
x = 12,113991…13,886340 mm und y = 14,267800…21,600150 mm; die Schüssel verwendet die aus
Außen-/Innenkontur gemittelte Mittellinie r ≈ 3,5 mm. Die Trinkwasserarmatur aus F.2.17 setzt den
Stamm auf x = 18 mm, den oberen Balken auf x = 16,5…19,5 mm und erhält die sichtbare Bogenendkappe
bis y = 20,5 mm.

Sieben Beschriftungen widerlegen einen gemeinsamen Schriftgrad oder ein textabhängiges Auto-Fit.
Das optionale `topLeftMetrics` hält deshalb am vorhandenen Lauf genau die gemessene Versalhöhe,
Grundlinie ab Körperoberkante und den Anker ab linker Körperkante. Es ist nur für normalen und
gebänderten F.2-Landrumpf zulässig; partielle, nicht endliche oder hüllenfremde Werte sowie
`plain-wheel-pair`, Formation und andere Arten werden abgelehnt. Ohne Override bleiben die
bisherigen F-a-/F-c-Ausgaben bytegleich.

F.2.17 beginnt seine innere Quellkontur bei y = 6,096 mm. Das ist ein Manifest-Finding und keine
eigene Körpervariante; die gemeinsame Fahrzeughülle steht getrennt als Katalogabweichung. Die
exakte Acht-Rezept-Matrix, alle sieben Beschriftungsmessungen und die weiteren Geometriewerte
stehen in
[`docs/decisions/2026-08-25-anhang-f-d.md`](docs/decisions/2026-08-25-anhang-f-d.md), die
Einzelsichtung aller acht 900-px-Paare in
[`docs/reviews/2026-08-25-f-d-visual-qa.md`](docs/reviews/2026-08-25-f-d-visual-qa.md). Diese
Sichtung ist nicht der finale Task-6-Kontaktbogen; alle acht Domain-Reviews bleiben `pending`.

## F-e: F.3.1 bis F.3.11

F-e ergänzt elf Platzzeichen und führt den Katalog auf 129 Rezepte, 397 Renderfälle und
416 Manifestzeilen. Alle elf verwenden den separat vermessenen `circle-12` mit Radius 12 mm;
F.3.1 bis F.3.4 sowie F.3.6 bis F.3.11 liegen um (16|16), F.3.5 verwendet als einzige Fassung
`raised-gable` mit abgesenktem Kreis um (16|18) und dem unabhängig vermessenen Giebel
(3|11)–(16|1)–(29|11). Kein Platzzeichen trägt einen Stärkegrad, und weder Formations- noch
Fahrzeuggeometrie wird auf den Kreis skaliert. F.3.5 und J.3.2 sind in den Quellen geometrisch
gleich; die bestehende J.3.2-Katalogapproximation um (16|17) mit r = 11,5 wird hier nicht
wiederverwendet und bleibt außerhalb des LFH-451-Scopes.

`medical-service` und `physician` bleiben die belegten semantischen Marken. Die sieben nur
bildlich benannten Innenformen erhalten dagegen neutrale `TechnicalBodyMarkId`s mit vollständiger
geometrischer A11y-Beschreibung. Ihre Registry dispatcht exakt nach Art, Variante und Marke;
unbekannte Paare werfen. Gemeinsame Teilungslinien von kombinierter Sanitäts-/Arztmarke werden
referenzidentisch nur einmal gezeichnet. F.3.10 verwendet die aus gegenüberliegenden Konturseiten
gemittelte Raute (16|6)–(22,5|12,5)–(16|19)–(9,5|12,5), nicht eine auf ganze Außenkanten
vergrößerte Näherung.

Die Läufe `UHS` und `50` beginnen links der jeweiligen Kreisfläche. Der additive
`topLeftMetrics`-Vertrag akzeptiert deshalb am normalen und am Giebelkreis nur das vollständige
quellenvermessene Objekt. Negative Relativwerte bleiben erlaubt, solange die resultierende
Textbox vollständig in der ViewBox liegt und ihr Anker die deklarierte rechte Boxkante x = 26 mm
nicht überschreitet. Die Schriftfarbe folgt dem bestehenden `bodyLabelInk()`-Pfad und wird wegen
der zwingend weißen HiOrg-Körperfläche schwarz; der Kontrast wird gegen diese Fläche und gegen
`surface` geprüft. Jeder gemessene `circle-12` verlangt auch
ohne Label `organization: hilfsorganisation`; andere oder fehlende Zuordnungen bleiben
fail-closed.

Die exakte Elf-Rezept-Matrix, Messwerte und Vertragsgrenzen stehen in
[`docs/decisions/2026-08-25-anhang-f-e.md`](docs/decisions/2026-08-25-anhang-f-e.md), die
Einzelsichtung aller elf 900-px-Paare in
[`docs/reviews/2026-08-25-f-e-visual-qa.md`](docs/reviews/2026-08-25-f-e-visual-qa.md). Diese
Sichtung ist nicht der finale Task-6-Kontaktbogen; alle elf Domain-Reviews bleiben `pending`.

## F-f: F.3.12 bis F.3.19 und vollständiger Anhang F

F-f ergänzt die acht verbleibenden Platzzeichen und schließt Anhang F mit exakt 58 eindeutigen
Source-IDs, acht bekannten Alternativschlüsseln und 66 Rezeptschlüsseln ab. Erst dieses
mengenexakte Gate trägt das einzelne `F` im Manifest-Scope. Der Gesamtbestand umfasst nun 137
Rezepte, 405 Renderfälle und 424 Manifestzeilen; 424 offene Manifest-Domainreviews, 13 offene
Quellenreviews und ein offenes Profilreview ergeben 438 fachlich weiterhin `pending` stehende
Reviewobjekte. Technische Reviews der acht neuen Zeilen sind nach den lokalen Gates `approved`.

F.3.12, F.3.13 und F.3.17 bis F.3.19 verwenden den bestehenden `circle-12`; F.3.14 belegt den
zweiten Einsatz der vorhandenen `raised-gable`-Fassung. Die Capability `care` erhält dafür eigene,
bounds-relative Kreis-Builder. Das Label `500` verwendet den privaten `bodyLabelInk()`-Pfad und
den vollständig vermessenen Metriksatz (Kappenhöhe 2,749893 mm, Grundlinie relativ -0,999746 mm,
Anker relativ -2,974002 mm), ohne Profilfeld, Rezeptsonderfall oder Auto-Fit.

F.3.15 und F.3.16 stehen auf `reduced-house`: der geschlossenen Kontur
(16|4)–(2|10)–(2|26)–(30|26)–(30|10) plus genau einer Trauflinie (2|10)–(30|10). Die Form ist
weder das breitere/höhere `building` noch ein Kapitel-1-Grundzeichen. Unterkunft und Krankenhaus
verwenden die vorhandenen semantischen IDs `temporary-accommodation-resting` und `hospital`, aber
eigene, nur für diese 28 × 22-mm-Hülle vermessene Builder. F.3.16s zusätzlicher
Outline-Fingerprint bleibt die Strichhülle desselben Körpers und ändert die globale
Fingerprint-Präzedenz nicht.

Nur die vier bildlich belegten Kreisformen aus F.3.12 und F.3.17 bis F.3.19 erweitern die
`TechnicalBodyMarkId`s; ihre vollständigen A11y-Texte bleiben geometrisch. F.3.18 trägt zwei
innere Diagonalen, F.3.19 stattdessen zwei Ringe. Beide teilen mit F.3.10 ausschließlich den
quellenexakten Raute-/Unterpfeil-Teilhelper; die direkte und die Mehrgrößen-Ausgabe von F.3.10
bleiben bytegleich.

Die exakte Rezept- und Geometriematrix steht in
[`docs/decisions/2026-08-25-anhang-f-f.md`](docs/decisions/2026-08-25-anhang-f-f.md), die
Einzelsichtung aller acht Original-/Katalogpaare bei 64 und 900 px in
[`docs/reviews/2026-08-25-f-f-visual-qa.md`](docs/reviews/2026-08-25-f-f-visual-qa.md). Es kamen
genau acht direkte und acht Mehrgrößen-Snapshots hinzu (151 beziehungsweise 406 insgesamt);
alle 541 zuvor vorhandenen Snapshotdateien blieben bytegleich. Die Einzelsichtung ist nicht der
finale Task-6-Kontaktbogen, und sämtliche F-f-Domainreviews bleiben `pending`.

## Anhang D: Führung und Funktionen

Anhang D ist technisch mit exakt 37 Darstellungen vollständig: zehn aus D.1, sieben aus D.2,
fünfzehn aus D.3 und fünf aus D.4. Die Modellierung kombiniert quellenvermessene
Funktionsträgerrollen mit direkten `leadership`-Definitionen. D.1.1 bewahrt als einzige
nichtquadratische Darstellung ihre 32×46-mm-Fläche; die Funktionszeichen verwenden ausschließlich
die drei belegten Kopfprofile `kreis`, `nationalstaat` und `europaeische-union`.

Das Manifest beansprucht den Scope `D` erst durch das exakte 37/37-Vollständigkeitsgate. Die
Modellierungs- und Geometrieentscheidungen stehen in
[`docs/decisions/2026-08-26-anhang-d-function-roles.md`](docs/decisions/2026-08-26-anhang-d-function-roles.md),
die technische Sichtprüfung aller 37 Darstellungen in
[`docs/reviews/2026-08-26-lfh-420-visual-qa.md`](docs/reviews/2026-08-26-lfh-420-visual-qa.md).
Alle 37 Domainreviews bleiben `pending`; technische Vollständigkeit ist keine fachliche,
normative oder einsatztaktische Freigabe.

## Anhang G: 21 Logistikzeichen vollständig im Katalog

Anhang G ist mit allen 21 benannten Referenzen als eigenständige `primary`-Rezepte vertreten.
Formation, Landfahrzeug, Anhänger und 12-mm-Kreis verwenden die vermessene Variante
`foot-band`; Kopf- und Fahrwerkszonen, Logistikmarken sowie die Läufe `DLRG`, `Diesel` und `Bw`
bleiben datengetrieben. Weiße Zeichen werden einschließlich DLRG als
`hilfsorganisation` geführt, die farbigen Zeichen mit den bestehenden Organisationen
Feuerwehr, Polizei, Führung/Leitung und Bundeswehr. Diese fachlichen Zuordnungen sind nicht
freigegeben: alle 21 neuen Domain-Reviews stehen `pending`.

Der mengenexakte Vollständigkeitstest trägt `G` erst jetzt im Manifest-Scope. Zusammen mit den
inzwischen auf `main` hinzugekommenen Anhängen C, H und I umfasst der Katalog 165 Rezepte,
433 Renderfälle und 452 Manifestzeilen. Dazu gehören 179 direkte SVG-Snapshots und 434
Mehrgrößen-Snapshots. Alle 452 Manifest-Domainreviews sowie die 13 Quellen- und das eine
Profilreview bleiben offen, insgesamt 466 fachliche Reviewobjekte.

Zwanzig G-Rezepte besitzen den Körper-Fingerprint- plus Snapshot-Nachweis. `G.1.5` ist der
ehrliche Sonderfall: seine Referenz führt keine vergleichbare Füllfläche, deshalb trägt die
Manifestzeile `body-geometry-regression` plus `svg-snapshot` und keinen erfundenen
Fingerprint-Claim. Die Entscheidung und die abgeschlossene technische Sichtprüfung stehen
in [`docs/decisions/2026-08-26-anhang-g.md`](docs/decisions/2026-08-26-anhang-g.md) und
[`docs/reviews/2026-08-26-anhang-g-visual-qa.md`](docs/reviews/2026-08-26-anhang-g-visual-qa.md).
Der Task-3-Kontaktbogen stellt alle 21 Paare in Rezeptreihenfolge gegenüber. Die technische
Sichtprüfung ist abgeschlossen; die 21 fachlichen Domain-Reviews bleiben davon unberührt.

Der Task-3-Paarvergleich hat die Task-2-Annahme zum `Diesel`-Lauf widerlegt: die lokale Referenz
zeichnet ihn schwarz, nicht weiss. Das Profil `circle-12/foot-band` führt deshalb für seine
vermessene `bottomCenter`-Zone schwarze Tinte; die Formation behält die körperfarbenabhängige
Regel. `labelContrastRequirements()` liest dieselbe Profilangabe. Schwarz auf Bundeswehr-Braun
besteht die Textschwelle in allen Themes, daher gibt es für G.3.5 keine Kontrastausnahme mehr;
das außenliegende `Bw` bleibt wie vermessen schwarz.

Dieselbe Paarprüfung hat das vorläufige Task-1-Modell einer stets geschlossenen
`formation/foot-band`-Oberkante präzisiert: die acht kopflosen und unbeschrifteten
Logistikformationen G.1 bis G.8 sind in den Quellen oben offen. Das generische Profil öffnet die
Kontur deshalb nur ohne Kopf und ohne Labels. G.1.1 bis G.1.5 sowie F.1.3/F.1.17 und die übrigen
Körpervarianten behalten durch diese Oberkantenkorrektur ihre geschlossene Kontur und ihre
bestehenden Snapshotbytes.

## Anhang H: veterinärmedizinische Formationen

H.1 bis H.3 ergänzen drei orangefarbene Formationsrezepte für Veterinärzug,
Tier-Dekontaminationsgruppe sowie Schlacht- und Untersuchungsgruppe. H.2 hat bewusst eine eigene,
kompakte technische Tierdekontaminationsmarke links unten: Sie ist weder die rote C.1.10-Fassung
noch eine Wiederverwendung von `capability.decontamination`. Die drei Original-/Katalogpaare
wurden als beschrifteter `420 × 420 px`-Paarvergleich gerastert und in Originalauflösung
gesichtet; die lokalen, ignorierten PR-Evidenzdaten stehen in der QA-Notiz. Die technischen
Reviews sind freigegeben, während die drei Domain-Reviews ausdrücklich `pending` bleiben.

Messentscheidung und Provenienzgrenze: [`docs/decisions/2026-08-26-anhang-h.md`](docs/decisions/2026-08-26-anhang-h.md).
Visual QA und Artefakthash: [`docs/reviews/2026-08-26-h-visual-qa.md`](docs/reviews/2026-08-26-h-visual-qa.md).

## Anhang I-d: Wasserrettungs-Führungsformationen I.1.5 bis I.1.8

LFH-482 ergänzt genau vier weiße Formationsrezepte: Zugtrupp Wasserrettungszug,
Führungstrupp Wasserrettung, Führungsgruppe Wasserrettung und Führungsstaffel Wasserrettung.
Sie verwenden die separat vermessene technische Marke `formation-water-rescue-compact`; I.1.5 kombiniert sie mit der
eigenen 3,7-mm-Kappe und drei negativen Kreisen, I.1.6 bis I.1.8 mit der geschlossenen 3-mm-Kappe. Bei der
Staffel verschieben sich Körper, Kappe und Innenmarke gemeinsam um 3 mm.

Der Manifest-Scope bleibt abschnittsgenau bei `I.1.5`, `I.1.6`, `I.1.7` und `I.1.8`; weder
`I` noch `I.1` wird vorzeitig beansprucht. Mess- und Modellierungsentscheidung:
[`docs/decisions/2026-08-27-anhang-i-d.md`](docs/decisions/2026-08-27-anhang-i-d.md).
Output-only Sichtprüfung und lokaler Originalvergleich:
[`docs/reviews/2026-08-27-i-d-visual-qa.md`](docs/reviews/2026-08-27-i-d-visual-qa.md).
Die vier technischen Reviews sind freigegeben, alle vier fachlichen Domain-Reviews bleiben
`pending`.

## LFH-484: Umweltgefahren und Ölabwehr aus Anhang I-f

LFH-484 ergänzt genau `I.1.13` bis `I.1.16` als vier weiße Formationsrezepte, ohne aus der
sichtbaren Fläche eine Organisation abzuleiten. I.1.13/I.1.14 verwenden eine eigene technische
Composite-Marke aus zwei Scheiben, gekreuzten Schäften mit unteren Klammern, tiefer gesetzten
Wellen und einer Raute. I.1.15/I.1.16 verwenden die quellenbytegleiche bestehende untere
Wasserrettungsfassung und setzen den literal vermessenen Text `Öl` auf `y = 10,55 mm`.

Direkte und Mehrgrößen-Snapshots, Manifestzeilen sowie ein korrigierter und deterministisch
pixelverifizierter output-only Kontaktbogen belegen alle vier Darstellungen. Entscheidung und
Messgrenze stehen in
[`docs/decisions/2026-08-28-anhang-i-f.md`](docs/decisions/2026-08-28-anhang-i-f.md), das
Sichtprotokoll in
[`docs/reviews/2026-08-28-i-f-visual-qa.md`](docs/reviews/2026-08-28-i-f-visual-qa.md).
Alle vier Domain-Reviews bleiben `pending`; der Scope wächst nur um diese vier Abschnitte.

## LFH-418: C.1.3 als erster Anhang-C-Slice

Anhang C umfasst 59 Referenzdarstellungen; C.1.1 und C.1.2 waren bereits im Katalog.
Der erste ausführbare Restslice ergänzt ausschließlich C.1.3 „Löschzug einer Feuerwehr“ als
Komposition aus Formation, Feuerwehrfarbe, Stärke `zug` und der für C.1 vermessenen
randbündigen `fire-fighting`-Körpermarke. Der Scope bleibt abschnittsgenau bei `C.1.3`; weder
`C.1` noch `C` wird vor vollständiger, getesteter Abdeckung beansprucht. Das fachliche Review
bleibt `pending`.

Der damalige, nach dem finalen Rebase des C.1.3-Branches auf `origin/main` wiederholte Lauf
belegte 60 Testdateien mit 4.126 grünen Tests, einen fehlerfreien Typecheck und das Coverage-Gate
mit 431 Manifestzeilen und 445 offenen Fachreviews. Diese historischen Slice-Belege sind keine
aktuelle Gesamtbranch-Aussage und keine fachliche Freigabe.

Die visuelle QA steht in
[`docs/reviews/2026-08-26-c-1-3-visual-qa.md`](docs/reviews/2026-08-26-c-1-3-visual-qa.md).
Der dort verlinkte Screenshot zeigt ausschließlich generierte Katalogausgabe; die lokale
BABZ-Referenz wird wegen ungeklärter Nutzungsgrundlage weder committed noch veröffentlicht.

## LFH-485: Strömungsrettung und getrennte Luftmarken aus Anhang I-g

LFH-485 ergänzt genau `I.1.17` bis `I.1.20` als vier weiße Formationsrezepte. Die kompakte
Wasserrettungsmarke ist an diesen Dateien separat vermessen und als
`formation-water-rescue-lower-zone` klar von `water-rescue` (I-e) sowie
`formation-water-rescue-compact` (I-d) getrennt. Das Dreieckspaar der
luftunterstützten Wasserrettung und der einzelne Winkel des Drohnentrupps besitzen getrennte,
rein geometrische technische IDs; die kombinierte Darstellung aus F.1.16 wird nicht übernommen.

`Strömungsrettung` steht bei I.1.17 und I.1.18 auf der gemessenen Grundlinie `y = 10` mm mit
idealisierten `2,5` mm Versalhöhe. Direkte und Mehrgrößen-Snapshots, Manifestzeilen und ein
output-only Kontaktbogen belegen jede Darstellung einzeln. Die technische Entscheidung steht in
[`docs/decisions/2026-08-27-anhang-i-g.md`](docs/decisions/2026-08-27-anhang-i-g.md), das
Sichtprotokoll in
[`docs/reviews/2026-08-27-i-g-visual-qa.md`](docs/reviews/2026-08-27-i-g-visual-qa.md).
Alle vier Domain-Reviews bleiben `pending`; der Katalog beansprucht weder eine allgemeine
Drohnentaxonomie noch eine pauschale Abdeckung von `I.1` oder `I`.

## Der lokale Referenzbestand

`taktische-zeichen/` ist ein **lokaler Ordner mit 661 damals von der BABZ bereitgestellten
Referenz-SVGs**. Er wird **niemals eingecheckt** — die Nutzungs- und Lizenzgrundlage ist ungeklärt,
siehe `.gitignore`, und die weitere BABZ-Veröffentlichung und -Verbreitung des Arbeitsstands ist
ausgesetzt. Ohne diesen Ordner lässt sich der Katalog trotzdem bauen, testen und typprüfen: das
abgeleitete Kennzahlenartefakt `packages/catalog/src/fingerprints.json` ist eingecheckt und wird von
CI verwendet.

`pnpm cli audit:reference` braucht diesen Ordner — es liest die 661 SVGs, leitet daraus
Kennzahlen ab (Hüllen, Strichstärken, Füllfarben; **keine** Pfaddaten oder Geometrie) und
schreibt sie nach `packages/catalog/src/fingerprints.json`. Dieser Lauf überschreibt das
eingecheckte Artefakt — nur ausführen, wenn das ausdrücklich beabsichtigt ist.

## Aufruf

Das CLI wird **aus dem Repo-Root** aufgerufen, ohne `--`-Separator vor den Optionen:

```bash
pnpm typecheck
pnpm test

pnpm cli audit:reference [--filter <präfix>] [--print]
pnpm cli coverage
pnpm cli verify:repository
pnpm cli export --out <pfad> --size <px> \
  --theme <reference|accessible-light|print-monochrome>

REFERENCE_ROOT=/path/to/local/reference-root
rtk pnpm cli visual-proof --reference-root "$REFERENCE_ROOT" \
  --out out/lfh-421/anhang-g-reference-vs-catalog.png
```

- `audit:reference` — Referenzbestand einlesen, Kennzahlen ableiten. `--filter <präfix>` schränkt
  auf Dateinamen mit diesem Präfix ein (z. B. `"1."` oder `"C.1.1"`); `--print` gibt nur aus,
  schreibt nicht nach `fingerprints.json`.
- `coverage` — prüft das Coverage-Manifest gegen den Katalog (Coverage-Gate): Schlüssel,
  Vollständigkeit, Baseline-Präfix, Quellenbezug, Profil, Reviewzurechnung, Elementauflösung und
  Datenversionen. Gibt zusätzlich die Zahl offener fachlicher Reviews und die 1.0-Blocker aus —
  beides ohne Fehlerabbruch, weil CI sonst ab dem ersten Tag dauerhaft rot wäre. Seit dem
  18. August 2026 auch die Zeile `Kontrastausnahmen:` — entschiedene Kontrastpaare unterhalb der
  eigenen Schwelle, mit Abschnitt, Datum und Entscheider. Sie steht bewusst nicht bei den
  Blockern: ein Blocker ist ein offener Punkt, eine Ausnahme ein entschiedener.
- `verify:repository` — prüft Paketabhängigkeiten sowie statische Imports, Re-Exports,
  Inline-Importtypen, `import = require(...)`, dynamische Imports und direkte `require(...)`
  gegen `cli → catalog → core → schema`. Syntaxfehler, nicht statisch auflösbare Modulziele,
  relative Paketgrenzen-Umgehungen und Quell-Symlinks werden zurückgewiesen. Externe
  Produktionsimporte bleiben in `core` und `schema` verboten und müssen in `cli` und `catalog`
  im Paketmanifest deklariert sein. Per NUL-getrenntem Git-Index kontrolliert das Gate außerdem,
  dass weder `taktische-zeichen/` noch `taktische-zeichen.zip` eingecheckt sind, und lässt Git
  die Schutzwirkung der Rootregeln einschließlich späterer Negationen auswerten. Wirksam
  ignorierte lokale Originale bleiben ausdrücklich erlaubt.
- `export --out <pfad> --size <px> [--theme …]` — rendert alle Grundzeichen und
  Kompositionsrezepte als SVG nach `<pfad>`, mit `<px>` Kantenlänge. Ohne Theme gilt die
  unveränderte Referenzpalette. `accessible-light` hellt das kontrastkritische Blau auf;
  `print-monochrome` erzeugt eine achromatische Ausgabe mit getrennten Organisationsgrauwerten.
  Beide Alternativthemes ergänzen pro Organisation eine eindeutige Kontursignatur als
  nicht-farblichen visuellen Kanal.
- `visual-proof --reference-root <pfad> --out out/lfh-421/<datei>.png` — erzeugt den
  deterministischen Anhang-G-Kontaktbogen aus einem expliziten lokalen Referenzbestand. Die
  Ausgabe bleibt im ignorierten Verzeichnis `out/lfh-421/`; vorbestehende Symlinks und Hardlinks
  an den geprüften Ausgabepfaden werden abgewiesen. Der lokale Einzelprozess erwartet exklusiven
  Zugriff auf diesen Ausgabebaum. Reproduktionsdaten, Sicherheitsgrenze und Einzelprüfung stehen
  in der [Anhang-G-Visual-QA](./docs/reviews/2026-08-26-anhang-g-visual-qa.md).

## Globale Qualitätsgates vor D.1

Jede renderbare Manifest-Implementierung durchläuft echte PNG-Regressionen bei 16, 24, 32, 64,
128 und 256 Pixeln. Zusätzlich werden Accessible- und Schwarz-Weiß-Ausgabe gerastert,
semantischer Titel und Beschreibung verlangt und die sichtbare Geometrie gegen die kanonische
32×32-mm-viewBox geprüft. Die Rasterungen liegen als direkt sichtbare SVG-Kontaktbögen unter
`packages/catalog/src/__snapshots__/multi-size/`; ein eigener Profilbogen zeigt sieben der acht
Organisationen in beiden Alternativthemes bei 64 px. Die achte, `hilfsorganisation` aus LFH-424,
fehlt **auf dem Profilbogen** weiterhin — Katalogeinträge, die sie setzen, gibt es seit dem
Teilslice F-a allerdings: alle 66 F-Rezepte tragen sie, und mit ihnen steht ihre Punktsignatur in
den Mehrgrößenbögen dieser Zeichen.

Die unveränderte Referenzpalette wird nicht pauschal als barrierefrei bezeichnet: Schwarz auf dem
originalen BABZ-Blau unterschreitet 3:1. Für diesen Fall ist `accessible-light` das geprüfte
Darstellungsprofil. Details und Grenzen stehen in
[`docs/decisions/2026-08-06-gate-haertung-vor-d1.md`](./docs/decisions/2026-08-06-gate-haertung-vor-d1.md).
