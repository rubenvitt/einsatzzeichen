# Anhang J — Informations- und Kommunikationstechnik (D.3)

> Design-Spec · 8. August 2026
> **Status: wieder aufgenommen (10. August 2026).** Die Pause nach Task 2 ist beendet: das
> Textprimitiv liegt vor (`docs/decisions/2026-08-09-textprimitiv-und-fusszone.md`), die
> deklarierbare Einsatzgrenze am Textlauf ebenfalls. **Abschnitt 2.3 ist überholt** — er behandelt
> Beschriftungsglyphen als Randfall zweier Zeichen und setzt das Fehlen eines Textprimitivs
> voraus; maßgeblich ist Abschnitt 2.4. Ebenfalls korrigiert: der Kontrastvertrag für Körper mit
> weißer Fläche — `weiss`/`surface` ist bei Verhältnis 1:1 unerfüllbar, richtig sind
> `schwarz`/`surface` für die Kontur auf der Ausgabeoberfläche und `schwarz`/`weiss` für die Marke
> auf dem Körper. Die Prüfung dafür steht seit demselben Slice als `contrastPairProblems` im Code.

## 1. Zweck und Abgrenzung

D.3 liefert den Bestand des Anhangs J der projektinternen BBK/BABZ-Baseline als eigenständige
Piktogramme im vorhandenen Katalog. Der ID-Raum `comms.` ist in
`packages/schema/src/pictogram.ts` bereits als `never` deklariert, mit dem ausdrücklichen
Vermerk „Literale entstehen in D.3". D.3 füllt diesen Vertrag; es erfindet ihn nicht neu.

D.3 ist ein **Katalog-Slice**, kein Kompositions-Slice. Wie D.2 für Kapitel 5.8 erweitert D.3
weder `SymbolSpec` noch `compose()`. Die Zeichen werden katalogisiert, aufgelöst und eigenständig
gerendert.

D.3 erteilt keine fachliche Freigabe. Jede neue Darstellung kommt mit `domain: pending` in den
Ledger.

## 2. Inventar

Der lokale Referenzbestand umfasst 56 Dateien mit `J`-Präfix. Daraus folgt das Inventar:

| Unterkapitel | Abschnitte | IDs | Darstellungen |
|---|---|---|---|
| J.1 Verbindungsarten | J.1.1 – J.1.14 (14) | 14 | 19 |
| J.2 Betriebsarten | J.2.1 – J.2.2 (2) | 2 | 2 |
| J.3 Fernmeldebetriebsmittel | J.3.1 – J.3.15 (15) | 15 | 15 |
| J.4 Netz- und Kabelzeichen | J.4.1 – J.4.17 (17) | 17 | 17 |
| **Summe** | **48** | **48** | **53** |

**53 Darstellungen auf 48 IDs.** Fünf IDs aus J.1 tragen neben ihrer `primary`-Darstellung eine
zweite in `variant: 'alternative'`. Alle übrigen 43 IDs tragen genau eine Darstellung.

### 2.1 Warum „leitergebunden" eine `alternative` ist und keine eigene ID

Fünf Abschnitte des Unterkapitels J.1 haben eine zweite Datei mit dem Zusatz `_leitergebunden`:
J.1.1, J.1.8, J.1.9, J.1.10 und J.1.11.

Der Vergleich der Referenzgeometrien zeigt einen bedeutungstragenden Unterschied.
`J.1.1_Sprache.svg` besteht aus einem waagerechten Balken **und** einer Wellenlinie;
`J.1.1_Sprache_leitergebunden.svg` besteht nur aus dem Balken. `J.1.8` verhält sich gleich: die
drahtlose Fassung trägt die Wellenlinie, die leitergebundene nicht. Die Wellenlinie ist der Marker
für „nicht leitergebunden".

Trotzdem bekommen die fünf Fassungen keine eigene ID, denn der Manifestschlüssel lässt es nicht
zu. `entryKey(sourceId, variant)` in `provenance.ts:72` bildet den Schlüssel aus
`bbk-babz-2025:${section}` und der Variante; `coverage-gate.ts:235` bindet die `section` über den
Dateinamenpräfix `${section}_` an die Belegdatei. Beide Fassungen eines Paares tragen damit
zwingend dieselbe `section`. Zwei `primary`-Zeilen auf `J.1.1` hätten denselben Ledger-Schlüssel,
würden dasselbe Reviewobjekt teilen und `domain-reviews.test.ts` in beide Richtungen brechen.

Die tragfähige Modellierung ist deshalb `variant: 'alternative'` — dieselbe Form, mit der `4.1.6`
und die sechs Doppeldarstellungen aus D.2 geführt werden. Der Manifestschlüssel ist bewusst der
Quellenabschnitt, und die Baseline führt beide Fassungen unter einer Abschnittsnummer.
`alternative` ist damit die getreue Abbildung der Quelle.

**Der Preis ist explizit:** Die Variante trägt keine Semantik im ID-Raum. Ein Konsument, der
„leitergebundene Sprache" ausdrücken will, bekommt `variant: 'alternative'` — also nur „die
andere". Wer das Übertragungsmedium semantisch adressieren will, braucht einen **Ledger-Schlüssel
auf Implementierungsebene** statt auf Abschnittsebene. Das ist ein Eingriff in alle 181
bestehenden Manifestzeilen und gehört in den Schemaform-Bereich der Reihenfolge vom 5. August,
nicht in einen Katalogausbau. Der Nachfolger ist hiermit benannt.

Ob die Baseline die beiden Fassungen fachlich als ein Zeichen mit zwei Medien oder als zwei Zeichen
versteht, entscheidet das Fachreview — der Geometriebefund oben ist der Grund, warum diese Frage
gestellt gehört, nicht der Grund, den ID-Raum jetzt zu spalten.

### 2.2 Was ausdrücklich nicht ins Inventar kommt

Drei Dateien sind keine Abschnittszeichen und erhalten weder Manifest- noch Dossierzeile:

- `J_Bedienungszeichen.svg` — viewBox `226.772 × 90.709` (80 × 32 mm). Ein Übersichtsblatt mit
  mehreren Zeichen nebeneinander, kein Einzelzeichen.
- `J.2.3._Beispiel Telefon.svg` und `J.2.3._Beispiel Wählbetrieb.svg` — zwei Beispielanwendungen.

Zum Abschnitt **J.2.3** existiert im lokalen Archiv **keine** Zeichendatei, nur die beiden
Beispiele. D.3 behauptet nicht, dass der Abschnitt nicht existiert; D.3 nimmt ihn nicht in den
beanspruchten Umfang auf, weil er lokal nicht belegt ist. Das ist dieselbe Behandlung, die D.2 den
sieben Kapitel-5.8-Beispielassets gegeben hat: benannt, zugeordnet, nicht still vergessen.

Die drei Dateien und der Abschnitt J.2.3 gehen an dieselbe spätere
**Rezept- und Conformance-Coverageaufgabe**, die schon die sieben 5.8-Beispielassets trägt.

### 2.3 Beschriftungsglyphen ~~(überholt, siehe 2.4)~~

> Dieser Abschnitt bleibt als Beleg dafür stehen, was am 8. August angenommen wurde. Er ist in
> zwei Punkten falsch: es sind nicht zwei Dateien, sondern zwanzig, und das Schema kennt seit dem
> 9. August ein `text`-Primitiv. Maßgeblich ist Abschnitt 2.4.

Zwei Referenzdateien enthalten Textglyphen als Teil des Zeichens:

- `J.4.8_Längenverbindung.svg` trägt ein „L".
- `J.4.17_Anzahl Doppeladern.svg` trägt eine „8".

Beide sind **Platzhalter für einen einzutragenden Wert**, kein fester Zeicheninhalt. Das Schema
kennt in `geometry.ts:86-97` sechs Primitivarten — `rect`, `circle`, `line`, `polyline`, `path`,
`group` — und **kein** `text`. Eine „8" als Pfad nachzuzeichnen würde einen Beispielwert zur
Zeichenbedeutung erklären.

D.3 zeichnet für beide IDs die Trägergeometrie ohne Glyphe. Die Wertbeschriftung wird an dieselbe
Stelle verwiesen wie die seit der Lückenanalyse vom 5. August offene Fußzone (`designation` im Typ,
`role: 'foot'` im IR, beide ohne Renderer). Sie ist keine D.3-Aufgabe.

`J.1.14_Richtfunkverbindung.svg` enthält grauen Fließtext in `#787878`. Das ist Beschriftung des
Referenzblatts, kein Zeichenbestandteil, und wird nicht übernommen.

### 2.4 Anhang J ist zu einem Drittel typografisch

**20 der 56 Referenzdateien** tragen Buchstaben- oder Ziffernglyphen als Pfade, bei **16 der 53
Darstellungen** ist die Glyphe der Bedeutungsträger und nicht Beiwerk. Belegt in
`docs/decisions/2026-08-09-anhang-j-ist-typografisch.md`: entfernt man aus den Referenzen alle
Pfade mit zehn oder mehr Kommandos, sind `J.3.6`, `J.3.7` und `J.3.8` geometrisch identisch —
dreimal dasselbe leere Quadrat. Ihre gesamte Unterscheidung liegt im Kürzel.

Die Referenzen halten die Glyphen sauber in einer eigenen Gruppe `Takt._Zeichen__x28_Typo_x29_`.
Daraus die Zuordnung von Abschnitt zu Kürzel und Schriftgrad:

| Abschnitt | Läufe | Kürzel | `sizeMm` |
|---|---|---|---|
| J.1.3 | 1 | DMO | ~6,8 |
| J.1.4 | 1 | TMO | ~6,8 |
| J.1.5 | 2 | SDS (im Körper), DMO (darunter) | ~6,8 / ~10,2 |
| J.1.6 | 2 | SDS, TMO | ~6,8 / ~10,2 |
| J.1.7 | 1 | DMO | ~10,2 |
| J.1.9 `primary` | 1 | Fax | ~10,2 |
| J.1.9 `alternative` | 1 | Fax — **sonst keine Geometrie** | ~10,2 |
| J.3.2 | 1 | BS | ~10,2 |
| J.3.3 | 1 | drei Glyphen | ~10,2 |
| J.3.4 | 2 | TMO (oben), DMO (unten) | ~6,8 |
| J.3.5 | 1 | DMO | ~6,8 |
| J.3.6 / J.3.7 / J.3.8 | 1 | HRT / MRT / FRT | ~10,2 |
| J.3.9 | 1 | APRT | ~10,2 |
| J.3.15 | 2 | VoIP, ein Großglyph | ~4,1 / ~14,4 |
| J.4.8 | 1 | L | ~6,8 |
| J.4.17 | 1 | 8 | ~6,7 |

Was das Textprimitiv **nicht** leisten muss: keiner dieser Läufe ist mehrzeilig, keiner sitzt auf
einem Pfad, keiner trägt Diakritika. Zwei Läufe an verschiedenen Stellen eines Zeichens sind zwei
eigenständige `text`-Primitive mit eigener `boxMm`, keine zwei Zeilen eines Primitivs.

**J.4.8 und J.4.17 fallen auseinander.** Abschnitt 2.3 hat beide gleich behandelt, weil beide als
Pfad problematisch waren. Mit dem Textprimitiv gilt das nur noch für eines: „L" (Länge) ist eine
feste Kennzeichnung, der Wert selbst steht in der Referenz gar nicht — als Text setzbar. Die „8"
in J.4.17 bleibt ein Beispielwert; sie als Text zu setzen erklärt denselben Wert zur
Zeichenbedeutung, den 2.3 als Pfad verboten hat. `content` ist ein festes `string`-Feld, einen
Platzhalterbegriff gibt es nicht. **Offene Fachfrage, vor Task 6 zu entscheiden.**

**Offene Zählfrage: 16 oder 17.** `J.3.14_Fernsprechvermittlung.svg` enthält ebenfalls genau ein
Glyph in der Typo-Gruppe; nach dessen Entfernung unterscheidet sich seine Geometrie von `J.3.15`
nur in Rundungsstellen (`28.346` gegen `28.347`). Die Tabelle in
`docs/decisions/2026-08-09-anhang-j-ist-typografisch.md` führt J.3.14 nicht und behauptet dort
einen „kleinen geometrischen Unterschied", der dem Dateivergleich nicht standhält. Vor Task 4 zu
klären.

**Untere Einsatzgrenze.** Kein Kürzel des Anhangs erreicht die kleinste Snapshotgröße lesbar: bei
`MINIMUM_TEXT_RENDER_PX = 8` verlangt eine 16-px-Rendergröße einen Schriftgrad von 16 mm, das
breiteste Kürzel misst ~10,3 mm. Jeder typografische Lauf deklariert deshalb sein `minRenderPx`
(Pixel, nicht Millimeter — das einzige solche Feld im IR). Oberhalb der Grenze gilt die Schwelle
unverändert; die Deklaration ist kein Freibrief.

## 3. Platzierung

Alle 53 Darstellungen sind `placement: { mode: 'standalone' }`. Der vorhandene diskriminierte
Platzierungsvertrag aus `catalog-definition.ts:20-38` reicht; D.3 erweitert `PictogramPlacement`
nicht.

Die Begründung ist prüfbar: Alle 53 Referenzdateien haben die kanonische viewBox
`0 0 90.709 90.709`, also 32 × 32 mm bei 2,8346 px/mm. Clipping und Box laufen gegen diese
ViewBox, nicht gegen einen Formation- oder sonstigen Hostkörper.

### 3.1 Die Verbindungszeichen und ihre Grenze

Ein Teil des Bestands stellt **Verbindungen** dar, nicht Geräte: alle 19 Zeichen aus J.1, beide
aus J.2 sowie J.4.8, J.4.11, J.4.14, J.4.15, J.4.16 und J.4.17. Ihre Geometrie läuft in der
Referenz von Rand zu Rand — `J.2.1_Wechselverkehr.svg` von x = 0 bis x = 90,709, die J.4-Zeichen
von x = 2,835 bis x = 87,874.

In einem echten Lagebild wird eine solche Verbindung als Linie zwischen zwei Punkten gezogen und
trägt diese Marken. Eine Kanten- oder Linienführungsgeometrie zwischen zwei Punkten ist **nicht
Teil von D.3**. D.3 liefert das Zeichen als eigenständige Kachel in der kanonischen ViewBox — genau
das, was `standalone` zusagt, und nicht mehr.

Der Nachfolger heißt **Verbindungs- und Kantengeometrie** und ist hiermit benannt. Er ist die
Entsprechung zu dem, was D.2 mit dem Ausschluss der `compose()`-Integration offengelassen hat.
`PictogramPlacement` um einen dritten Modus zu erweitern wäre eine größere Entwurfsentscheidung,
als dieser Slice tragen soll.

## 4. Kontrast

Der Kontrastvertrag folgt D.2 unverändert: Je Definition werden nur **tatsächlich benachbarte**
Farbflächen und Striche deklariert, kein kartesisches Produkt mit Organisationsfarben. Geprüft wird
in `accessible-light` und `print-monochrome` gegen mindestens 3:1.

Der Anhang-J-Bestand ist überwiegend schwarz auf der deklarierten Oberfläche. Weiße Füllflächen
treten auf, wo ein Körper eine Fläche belegt — etwa `J.3.1` (weißes Quadrat mit schwarzer Kontur),
`J.4.3` und `J.4.5`. Dort stellt die schwarze Kontur die Farbnachbarschaft her.

Semantische Unterschiede dürfen nicht ausschließlich von Farbe abhängen. Im J-Bestand tragen
Form, Anzahl und Anwesenheit der Wellenlinie die Bedeutung — der nichtfarbliche Kanal ist damit
strukturell gegeben und wird je Definition belegt.

## 5. Architektur

D.3 folgt der Bauform, die D.2 etabliert hat. Kein Modul wird umgebaut.

### 5.1 `packages/schema`

- `taxonomy.ts`: neue `COMMS_IDS`-Konstante mit 48 Literalen in Kapitelreihenfolge, dazu
  `export type CommsId = (typeof COMMS_IDS)[number]`.
- `pictogram.ts`: `CommsId` wird aus `taxonomy.ts` importiert; der `never`-Alias und sein
  Kommentar entfallen. `DamageId` und `WildfireId` bleiben unverändert `never`.

### 5.2 `packages/catalog`

- `pictograms/catalog-definition.ts`: `PictogramSection` wird um `` `J.${string}` `` erweitert.
  Neu ist `CommsDefinitionInput` und `defineComms()`, gebaut wie `defineState()`:
  `placement: { mode: 'standalone' }`, Pflicht-`contrastPairs`, `structuredClone` der Eingaben,
  `deepFreeze` des Ergebnisses.
- `pictograms/comms/`: ein Modul je Unterkapitel — `01-connections.ts`, `02-operating-modes.ts`,
  `03-devices.ts`, `04-network.ts` — plus `authoring.ts` und `index.ts`. `authoring.ts` spiegelt
  `states/authoring.ts` (`commsPath`, `commsLine`, `commsPolyline`, `commsCircle`, `commsRect`,
  gemeinsame Stilkonstanten).
- `pictograms/index.ts`: `COMMS_PICTOGRAMS` fließt in `ALL_PICTOGRAMS` ein.
- `coverage-manifest.ts`: `scope` wächst um `'J.1'`, `'J.2'`, `'J.3'`, `'J.4'`. Der Scope wächst
  **erst**, wenn das Inventar vollständig ist — das Scope-Gate in `coverage-gate.ts:541-544`
  verlangt je Präfix mindestens einen Eintrag, und ein leerer Anspruch wäre ein Blocker.
- `domain-reviews.ts`: 53 neue Reviewträger, je `domain: pending`, jeder ein eigenes Objekt.

### 5.3 Modulgrenzen

Ein Modul je Unterkapitel hält jede Datei bei 15 bis 19 Definitionen. Das ist die Größe, mit der
die `states/`-Module arbeiten, und sie hält jede Datei in einem Kontext lesbar. Ein einzelnes
`comms.ts` mit 53 Definitionen wäre die falsche Grenze.

Die Reihenfolge in `COMMS_IDS` ist die Kapitelreihenfolge und damit unabhängig von der
Modulaufteilung prüfbar.

## 6. Autorenschaft

Alle Geometrien sind eigenständige Millimeterkonstruktionen auf der kanonischen 32 × 32-mm-ViewBox
mit ausschließlich absoluten Pfadkommandos `M L H V C Q Z`.

Für die Kürzel aus Abschnitt 2.4 gilt das nicht, weil ein Textlauf kein Pfad ist und nicht durch
das Kommando-Gate läuft: er wird als `text`-Primitiv gesetzt, mit deklarierter `boxMm` und
deklariertem `minRenderPx`. Genau darin liegt sein Zweck — ein nachgezeichnetes „HRT" wäre eine
Schriftschnitt-Nachbildung ohne Lizenzgrundlage, eine erfundene Marke ein Zeichen, das die
Baseline nicht kennt.

Die lokalen Referenzdateien dienen der visuellen und semantischen Prüfung. Pfade, Koordinaten,
Transformationen und Geometrie werden weder kopiert noch extrahiert. `taktische-zeichen/` und das
zugehörige ZIP bleiben ignoriert und uncommitted; ihre Nutzungs- und Lizenzgrundlage ist weiterhin
ungeklärt.

## 7. Testevidenz

D.3 fügt **keine** neue Nachweisart hinzu. Die 53 Darstellungen binden ihre Claims an die
bestehenden Arten aus der Notiz vom 6. August — `pictogram-contract` und `svg-snapshot` — per
Set-Gleichheit an die tatsächlich iterierten Testfälle. Fehlende, doppelte und artfremde Claims
bleiben Gate-Befunde.

Die bestehenden Gates greifen weitgehend ohne Anpassung, weil D.3 nur neue Definitionen in ein
vorhandenes Register legt. Die 16 typografischen Darstellungen sind die Ausnahme: für sie messen
Box-Gate und Kontrast-Gate anders, und ein siebtes Gate kommt hinzu:

| Gate | Wirkung auf D.3 |
|---|---|
| Kommando-Gate | absolute Pfadkommandos in allen Pfaden; Textläufe laufen nicht hindurch |
| Box-Gate | deklarierte Hüllbox gegen tatsächliche Geometrie. **Bei Textdefinitionen entfällt die Gleichheitsforderung**: `checkBox` fordert Gleichheit von Hülle und Box nur noch ohne Pfad **und** ohne Text; für Textläufe bleibt die Enthaltungsprüfung gegen die deklarierte `boxMm`. Damit ist die Box der 16 Zeichen eine ungeprüfte Zusicherung — siehe Abschnitt 12 |
| Clipping-Gate (standalone) | Geometrie innerhalb der 32 × 32-mm-ViewBox; für Text die deklarierte `boxMm` |
| viewBox-Gate | einheitliches Ausgabeformat. Für Text ohne halbe Strichbreite, weil Text gefüllt und nicht gestrichen wird — die Randregel „mindestens 0,5 mm Abstand" gilt für Textboxen nicht |
| Kontrast-Gate | `accessible-light` und `print-monochrome`. **Für textmalende Token 4,5:1** (`MINIMUM_TEXT_CONTRAST`), sonst 3:1. Zusätzlich meldet `contrastPairProblems` jedes Paar, dessen Token in einem Theme dieselbe Farbe auflösen |
| **Text-Legibility-Gate** | `checkTextLegibility` über die sechs Snapshotgrößen, verdrahtet in `gate.test.ts` über `ALL_PICTOGRAMS`. Jeder Lauf deklariert sein `minRenderPx`; unterhalb davon beansprucht er keine Lesbarkeit, oberhalb gilt `MINIMUM_TEXT_RENDER_PX = 8` |
| Mehrgrößen-Snapshots | 16 bis 256 px, mit fest gebundener Schriftdatei (`resvgFontOptions()`, keine Systemschrift) |
| Metadaten-Gate | `<title>`, `<desc>`, `role="img"` |
| Scope-Gate | vier neue Präfixe, jedes belegt |

Ein eigenes Inventar-Testmodul (`comms-inventory.test.ts`) prüft nach dem Muster von
`state-inventory.test.ts`: 48 IDs und 53 Darstellungen, Kapitelreihenfolge, Eindeutigkeit je
`entryKey`, Abschnitt-zu-Datei-Zuordnung, Vollständigkeit gegenüber der deklarierten
Abschnittsliste sowie die namentliche Festlegung, dass genau die fünf Abschnitte J.1.1, J.1.8,
J.1.9, J.1.10 und J.1.11 eine `alternative` tragen und alle übrigen 43 IDs nicht.

## 8. Verifikation

Umgesetzt gilt D.3, wenn alle folgenden Punkte zutreffen:

- `pnpm test` grün, ohne übersprungene Tests
- `pnpm typecheck` ohne Fehler
- `pnpm cli coverage` meldet Coverage-Gate bestanden, `0` Testnachweislücken, `0` Scope-Lücken,
  `0` Abweichungen, Umfang enthält `J.1`, `J.2`, `J.3`, `J.4`
- Einträge steigen von 181 auf 234, offene Fachreviews von 195 auf 248. Beide Zahlen sind
  gegenüber dem 8. August nachgezogen: der Textslice hat `arimo-ofl` als 13. Quelle mit eigenem
  offenen Quellenreview eingeführt, deshalb 195 statt 194 als Ausgangswert
- `git diff --check` sauber
- Kontaktbogen: 53 von 53 Darstellungen in Referenz-, Accessible-Light- und
  Print-Monochrome-Ansicht visuell geprüft und protokolliert unter
  `docs/reviews/2026-08-08-d3-visual-qa.md`

## 9. Reviewgrenze

Alle 53 neuen Domainreviews bleiben `pending`. Nach D.3 sind 234 Manifestreviews, dreizehn
Quellenreviews und ein Profilreview offen — 248 fachliche Reviewträger.

Die technische Evidenz behauptet weder fachliche Bedeutung und Verwechslungsfreiheit noch normative
Geltung, Quellenfreigabe oder geklärte Lizenzrechte. Sie ersetzt kein Fachreview durch eine
benannte Person mit einsatztaktischer Fachkunde.

## 10. Ausdrücklich nicht in D.3

- Verbindungs- und Kantengeometrie zwischen zwei Punkten (Abschnitt 3.1)
- Ledger-Schlüssel auf Implementierungs- statt Abschnittsebene (Abschnitt 2.1)
- Wertbeschriftung für `J.4.17` — die „8" bleibt ein Beispielwert ohne Platzhalterbegriff im Typ
  (Abschnitt 2.4). `J.4.8` fällt **nicht** mehr darunter: „L" ist eine feste Kennzeichnung und als
  Text setzbar
- Die Fußzone. Sie ist seit dem Textslice implementiert, für D.3 aber ohne Bedeutung: alle 53
  Darstellungen sind standalone und keine `SymbolSpec`-Kompositionen
- Ein Textmetrik-Gate, das die deklarierte `boxMm` gegen die tatsächliche Tinte vermisst. Die
  Lücke ist in `docs/decisions/2026-08-09-textprimitiv-und-fusszone.md` benannt und bleibt offen;
  für die 16 Zeichen heißt das: die Box ist eine Zusicherung, die nur die visuelle Prüfung
  kontrolliert
- `J_Bedienungszeichen.svg`, die beiden J.2.3-Beispiele, Abschnitt J.2.3 (Abschnitt 2.2)
- `SymbolSpec`- oder `compose()`-Integration der `comms.`-Zeichen
- `DamageId` und `WildfireId` — Anhänge K, L, M bleiben D.4
- Jede fachliche Freigabe
