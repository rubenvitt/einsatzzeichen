# Textprimitiv und Fußzone

> Entscheidungsnotiz · 9. August 2026

## 1. Anlass

Zwei offene Punkte liefen auf dasselbe Schemaform-Defizit hinaus.

Anhang J ist zu einem Drittel typografisch: 16 der 53 D.3-Darstellungen tragen ihren
Bedeutungsträger nicht in der Geometrie, sondern in einem Buchstabenkürzel. Entfernt man aus den
Referenzen die Glyphenpfade, sind `J.3.6` (Handheld Radio Terminal), `J.3.7` (Mobile Radio
Terminal) und `J.3.8` (Fixed Radio Terminal) geometrisch identisch — dreimal dasselbe leere
Quadrat. Belegt in `docs/decisions/2026-08-09-anhang-j-ist-typografisch.md`. D.3 pausierte deshalb
nach Task 2 auf `d0532ee` (zwei J.2-Betriebsarten).

Die Fußzone war seit dem 5. August offen. `designation` steht in `packages/schema/src/taxonomy.ts`
(Zeile 219, im `SymbolSpec`), `validate.ts` prüft es auf „nicht leer", `labels.ts` nimmt es in die
Barrierefreiheitstexte auf — aber kein Renderer hat es je ausgegeben. `role: 'foot'` war in
`geometry.ts` deklariert und ungenutzt.

Ohne Textprimitiv gibt es für beides nur erfundene Auswege: Glyphen als Pfade nachzeichnen (eine
Schriftschnitt-Nachbildung ohne Lizenzgrundlage) oder eigene Marken erfinden, die die Baseline
nicht kennt — in einem Katalog, dessen Zweck belegte Quellentreue ist. Ein früherer D.3-Commit
(`1773316`) tat genau das für `J.3.4` bis `J.3.8` und wurde deshalb zurückgerollt (`d0532ee`).
Dieser Slice liefert stattdessen den einzig gangbaren Weg: ein Textprimitiv samt Renderer. Er ist
eine **Schemaform**, kein Katalogausbau — er liefert keine neuen Katalogzeichen.

## 2. Die Box kehrt ihre Rolle um

Bei den sechs vorhandenen Primitivarten (`rect`, `circle`, `line`, `polyline`, `path`, `group`) ist
`box` eine **Messung**: `boundsOfMm` berechnet die Hülle aus der Geometrie, `checkBox` prüft die
Zusicherung dagegen — bei pfadfreien Definitionen sogar auf Gleichheit.

Text lässt sich so nicht behandeln. Seine Ausdehnung hängt an Fontmetrik, Schriftgrad und
Laufweite; `boundsOfMm` kann sie nicht berechnen. Für ein Textprimitiv ist die Box deshalb keine
Messung, sondern eine **Vorgabe** — ein deklariertes Rechteck, in das der Text zu passen hat. Der
Kommentar am `text`-Zweig in `packages/schema/src/geometry.ts` hält das fest: „`boxMm` ist deshalb
keine Messung, sondern eine Zusicherung des Autors … die Gates prüfen gegen sie statt gegen die
Glyphen."

Das hält alle vier Gates kohärent, aber jedes davon anders als bei jeder anderen Primitivart:

| Gate | Regel für Text |
|---|---|
| `checkBox` | Die Gleichheitsprüfung ist auf `!hasPath && !hasText` erweitert. Für Text gilt Enthaltung in der deklarierten Box, keine Gleichheit gegen eine berechnete Hülle. |
| `checkClipping` | Geprüft wird die deklarierte Box gegen den Körper, nicht die Glyphen — Text hat keine messbare Fläche. |
| `viewbox-gate` | Textbounds sind die deklarierte Box, ohne Strichbreitenzuschlag: Text wird gefüllt, nicht gestrichen. |
| Kommando-Gate | Betrifft nur Pfade, bleibt für Text unberührt. |

**Der Preis ist benannt und in diesem Slice tatsächlich eingetreten:** Eine falsch deklarierte Box
wird von keinem dieser vier Gates mehr gefangen — nur eine Rasterprüfung des tatsächlichen Inks
könnte sie fangen. Genau das ist während Task 9 passiert (siehe Abschnitt 7, „Diakritika"): die
Fußzonen-Box für `baseline: 'hanging'` war deklariert, plausibel und bestand alle vier Gates — und
war trotzdem 0,5 mm zu knapp für deutsche Großbuchstaben-Umlaute. Kein Gate hat das gemeldet; erst
die Rasterprüfung aus Abschnitt 8 der Spec (`fonts.test.ts`) hat es gefunden.

## 3. Die Schrift

**Arimo**, SIL Open Font License 1.1, Version 1.341 (Variable Font, Achse `wght`), bezogen von
`https://raw.githubusercontent.com/google/fonts/main/ofl/arimo/Arimo%5Bwght%5D.ttf` am 9. August
2026. Datei `packages/catalog/assets/Arimo[wght].ttf`, 496.268 Byte, SHA-256
`e43898b143ec826ac8cb4034816458a7047fbe0836558de2a1f8c6223ae3e0ca` — verifiziert per `shasum` und
identisch mit dem in `packages/catalog/src/fonts.ts` (`TEXT_FONT_SHA256`) und
`packages/catalog/assets/README.md` festgehaltenen Wert. Der vollständige Lizenztext liegt in
`packages/catalog/assets/Arimo-OFL.txt` daneben; `sources.ts` führt die Schrift als eigenen
Quelleneintrag `arimo-ofl` mit `kind: 'typeface'` — ein eigener `SourceKind`, statt sie unter
`open-source-corpus` einzuordnen, wo sie nicht hingehört: die anderen Träger dieses `SourceKind`
sind Bestände fremder Piktogrammgeometrie, Arimo ist eine Schrift ohne Geometriebezug
(`geometryUse: ['none']`). Ein früherer Commit (`75c07c2`) hatte sie noch als
`open-source-corpus` eingetragen; korrigiert in `1328696`.

Nicht gewählt: **Liberation Sans**, der naheliegende Kandidat und ebenfalls metrisch
Arial-kompatibel unter derselben Lizenz. Grund: keine stabile TTF-Bezugsquelle — sein
GitHub-Release trägt keine Assets, geprüft am 9. August 2026 und in
`packages/catalog/assets/README.md` festgehalten. Arimo ist Liberation Sans' Nachfolger mit
identischer Metrikphilosophie und einer belegbaren, festen Raw-URL.

Warum überhaupt eine Datei im Repository, statt auf Systemschriften zu setzen: `@resvg/resvg-js`
rastert Text mit `loadSystemFonts: false` zu **null** Pixeln — und genau so war das
Mehrgrößengate laut eigenem Kommentar für Determinismus konfiguriert. Mit `loadSystemFonts: true`
rendert Text zwar, aber maschinenabhängig: ein Snapshot von macOS und einer aus einer Linux-CI
wären verschieden. `fontFiles` plus `loadSystemFonts: false` ist der einzige Weg, der Text
rendert und die vorhandene Snapshot-Evidenz nicht entwertet. `fonts.test.ts` belegt beides
technisch: einen Prüfsummentest der Schriftdatei und einen Byteidentitäts-Test zweier Rasterungen
derselben Zeichnung.

## 4. Mindestgröße

`MINIMUM_TEXT_RENDER_PX = 8` in `packages/core/src/render/text-policy.ts` — ein **visuell
geprüfter**, kein berechneter Wert, im selben Stil dokumentiert wie `MINIMUM_NON_TEXT_CONTRAST`.

Die Messreihe: „HRT", „FRT" und „VoIP" wurden bei 10 mm Schriftgrad auf der 32-mm-Standard-viewBox
in allen sechs Snapshotgrößen (16/24/32/64/128/256 px) mit Arimo gerastert und angesehen.

| Rendergröße | effektiver Schriftgrad | Befund |
|---|---|---|
| 16 px | 5,0 px | Buchstaben verschwimmen zu grauen Flächen ohne erkennbare Formen |
| 24 px | 7,5 px | bei „HRT" mit Mühe zu erraten; bei „VoIP" verschmelzen die vier schmalen Zeichen zu einem ununterscheidbaren Klecks |
| 32 px | 10,0 px | alle drei Kürzel scharf, schwarz, ohne Zweifel lesbar |

Die Schwelle 8 px liegt bewusst zwischen den beiden Messpunkten 7,5 und 10,0 px, nicht auf einem
von ihnen. Die eigene visuelle Nachprüfung in Abschnitt „Belegzeichen" unten reproduziert dieses
Bild an einem eigenen Beispiel.

Eine Unterschreitung ist ein **benannter Gate-Befund einer eigenen Klasse** — implementiert als
`checkTextLegibility()` in `packages/core/src/pictogram-gate.ts`, Befundtyp `gate:
'text-legibility'` — keine stille Ausnahme aus der Mehrgrößen-Regression und kein übersprungener
Testfall: die Regression fährt weiterhin alle sechs Größen für jedes Textzeichen. Der Kommentar an
der Funktion hält die Aussageart ausdrücklich von den anderen drei Gates ab: „Eine Unterschreitung
hier ist kein Fehler der Definition; „HRT" bei 10 mm ist bei jeder Rendergröße dieselbe korrekte
Definition." Ein Zeichen unterhalb der Schwelle bei 16 px ist damit nicht kaputt: es ist ein
Zeichen mit dokumentierter unterer Einsatzgrenze, eine fachlich relevante Aussage über ein
taktisches Zeichen und keine technische Ausrede.

## 5. Kontrast

`MINIMUM_NON_TEXT_CONTRAST = 3` (WCAG für grafische Objekte) bestand bereits, trug die
Unterscheidung aber nur im Namen. `MINIMUM_TEXT_CONTRAST = 4.5` (WCAG für Fließtext) ist neu, beide
in `packages/catalog/src/pictograms/contrast-contract.ts`. `contrastMinimumFor()` sammelt je
Piktogrammdefinition die Farbtoken, die ein Textprimitiv malt (auch verschachtelt in Gruppen,
über `textPrimitivesOnly()`), und legt für sie die strengere Schwelle an — malt derselbe Token an
anderer Stelle desselben Zeichens auch Nichttext, gilt die Textschwelle für alle seine
Anforderungen.

**Mitkorrigierter Nulltoken-Fehler aus D.3:** Das Paar `weiss`/`surface` ist unerfüllbar — beide
Token lösen in jedem Theme auf `#ffffff` auf, das Verhältnis ist exakt 1:1. `checkContrast` hätte
das zwar auch gemeldet, aber als Ratio-1,0-Verstoß gegen die Mindestschwelle — das verschleiert die
Ursache. `contrastPairProblems()` meldet es stattdessen als das, was es ist: ein Autor, der zwei
Bezeichner für dieselbe Farbe deklariert und den Kontrastvertrag missverstanden hat, kein
Renderingfehler, den ein anderes Token oder Theme heilen könnte. Die Prüfung geht **je Theme** vor,
nicht anhand der Tokennamen: ein monochromes Theme kann zwei sonst unterschiedliche Farbtoken auf
denselben Grauwert abbilden, ohne dass sie es in jedem Theme tun. Für Körper mit weißer Fläche ist
der richtige Vertrag `schwarz`/`surface` (Kontur auf Oberfläche) und `schwarz`/`weiss` (Marke auf
Körper) — so führt `states/07-weather.ts` es bereits.

## 6. Fußzone

`designation` wird jetzt gerendert: `compose()` erzeugt für ein `SymbolSpec` mit `designation` ein
Textprimitiv mit `role: 'foot'` unterhalb des Körpers, entlang des vorhandenen Layoutprofils, nicht
über eine neue Sonderregel. `validate.ts` bleibt unverändert für „nicht leer" zuständig, die
Barrierefreiheitstexte aus `labels.ts` sind unverändert — sie waren nie das Problem.

**Die harte Grenze, gemessen an der echten Katalog-Geometrie (nicht dem `rect(1,6,30,20)`-
Testdoppel aus `compose.test.ts`):** Von den sechs im Katalog implementierten Grundzeichen können
heute nur `formation` und `building` überhaupt eine Fußzone tragen. `person`, `post`, `container`,
`measure`, `hazard` und `point` scheitern am `outside-viewbox`-Gate — und zwar bereits **vor** dem
Diakritika-Zuschlag aus Abschnitt 7, also unabhängig davon. `vehicle-land`, `vehicle-air`,
`vehicle-water`, `area`, `event` und `spontaneous-helper` haben noch kein Grundzeichen im Katalog,
die Frage stellt sich für sie noch nicht. Das ist eine Eigenschaft der Baseline-Geometrie auf der
32-mm-viewBox — die genannten Körper reichen mit ihrer eigenen Ausdehnung bereits so nah an den
Rand, dass unterhalb kein Platz für eine zusätzliche Textzeile bleibt —, keine Nachlässigkeit
dieses Slice und keine Regression durch ihn: mit und ohne den Diakritika-Fix ist das Ergebnis
identisch (Task-9-Fix-Bericht).

**Diese Grenze gilt für das unbewegte Grundzeichen, nicht für jede Komposition darüber.** Trägt
ein `SymbolSpec` zusätzlich zu `designation` eine `strength`, verschiebt `rectBodyProfile.place()`
(`packages/core/src/layout/profiles.ts`) den Körper nach unten, sobald die Kopfzone auf dem
Standardanker (6 mm) keinen Platz hat — und die Fußzone hängt sich an die tatsächlich platzierte
Körperunterkante (`compose.ts`: `footTopMm = bodyBoundsMm.maxY + HEAD_GAP_MM`), nicht an die
Standardgeometrie. Für `formation` (`defaultAnchorMm: 6`) reichen die drei Reihen-Stärkegrade
(`trupp`, `gruppe`, `zug`; Kopfzonenhöhe 3 mm, `packages/catalog/src/strengths.ts`) nicht aus, um
diese Verschiebung auszulösen: `placeHead` hängt die Reihe so, dass ihre Unterkante bei 5 mm liegt
(`topMm = max(1, 6 − 1 − 3) = 2`, `bottomMm = 5`), `target = max(6, 5 + 1) = 6` entspricht bereits
`defaultAnchorMm` — der Körper bleibt auf `minY = 6` stehen, die Fußzone unverändert bei Boxunterkante
31 mm (wie ohne jede Stärkeangabe). Für `staffel` (Stapel, Kopfzonenhöhe 7 mm) dagegen: `placeHead`
ergibt `topMm = max(1, 6 − 1 − 7) = 1`, `bottomMm = 8`; `target = max(6, 8 + 1) = 9` > 6, der Körper
rutscht 3 mm nach unten (`minY` 6 → 9, `maxY` 26 → 29). `footTopMm` wandert von 27 auf 30 mm,
`verticalTextBoxMm(30, 4, 'hanging')` liefert `{ topMm: 29.5, heightMm: 4.5 }` — Boxunterkante
34 mm, mehr als die 32-mm-viewBox-Höhe: `outside-viewbox`. Das ist die Form des realen Rezepts
C.1.1 („Löschstaffel"), sobald es zusätzlich eine `designation` trägt; nachgerechnet und als Test
festgehalten in `compose.test.ts` („meldet einen viewBox-Gate-Befund für formation + staffel +
designation — Kopfzone verdrängt die Fußzone"). Das Verhalten ist **richtig** — ein lauter
`outside-viewbox`-Befund statt einer lautlos zu klein geratenen oder überlappenden Fußzone —, nur
die Beschreibung oben war zu eng: sie beschrieb ausschließlich das Grundzeichen ohne Kopfzone.

`building` kann diese Wechselwirkung gar nicht erst erreichen: `validate.ts`s
`strength-requires-unit`-Regel lässt `strength` nur an `formation` und `person` zu (`UNIT_KINDS`,
`packages/core/src/validate.ts`) — ein `SymbolSpec` mit `kind: 'building'` und `strength` ist
bereits keine gültige Komposition, unabhängig von der Fußzone. Für `person` stellt sich die Frage
ebenfalls nicht: Es scheitert, wie oben festgehalten, bereits im unbewegten Grundzustand ohne jede
Kopfzone am `outside-viewbox`-Gate. `formation` ist damit der einzige Katalogkörper, an dem sich
die Wechselwirkung Kopfzone × Fußzone heute überhaupt beobachten lässt.

`FOOT_TEXT_SIZE_MM = 4` (in `packages/core/src/compose.ts`) ist bewusst fix und nicht von der
verfügbaren Restfläche abhängig konzipiert: Ein Renderer, der die Fußzonenschrift bei knappem Platz
stillschweigend auf 0 verkleinert hätte, hätte eine Fußzone erzeugt, die lautlos verschwindet,
statt als `outside-viewbox`-Befund aufzufallen. Die feste Größe erzwingt stattdessen, dass ein
Körper, der keinen Platz für eine Fußzone hat, das als Gate-Befund zeigt — genau das Muster aus
Abschnitt 2.

## 7. Diakritika

Die Rasterprüfung aus Abschnitt 8 der Spec (`fonts.test.ts`) fand während Task 9 einen echten
Befund: Unterlängen (Buchstaben mit Ausläufern unter die Grundlinie, geprüft an „Zug jgpqy")
blieben vollständig innerhalb der deklarierten `boxMm`. Großbuchstaben-Diakritika dagegen
(Ä/Ö/Ü, geprüft an „Übung") ragten bei `baseline: 'hanging'` über die Boxoberkante hinaus —
gemessen bei der bindenden Testauflösung (256 px auf 32-mm-viewBox = 8 px/mm, `FOOT_TEXT_SIZE_MM =
4`): 24 von rund 1100 Ink-Pixeln außerhalb der Box, ein Überstand von 4 px = 0,5 mm.
`dominant-baseline="hanging"` positioniert den Textanker an Arimos Hanging-Metrik, die unterhalb
der tatsächlichen Diakritikaoberkante liegt.

**Das ist der Beleg dafür, dass Abschnitt 2 kein theoretisches Risiko beschreibt.** Die Box war
deklariert, plausibel und bestand alle vier Gates — die Rasterprüfung hat exakt die Messung
ersetzt, die die Umkehr von Messung zu Vorgabe gekostet hat, und einen realen Fehler gefunden, den
kein Gate hätte finden können.

Behoben über eine neue Konstante `DIACRITIC_HEADROOM_FRACTION = 0,125` (12,5 % von `sizeMm`) plus
Helferfunktion `verticalTextBoxMm()`, beide in `text-policy.ts`. Herleitung: Der asymptotische
Überstand (hochauflösend gerastert, Pixelraster-Rauschen herausgemittelt) konvergiert unabhängig
vom Schriftgrad auf 11,3–11,4 % von `sizeMm`. Bei der tatsächlich bindenden Testauflösung (4 mm,
8 px/mm) rundet das Pixelraster ungünstiger und braucht exakt 12,5 %; der 10-mm-Fall käme bei
derselben Auflösung mit 11,25 % aus. Der 4-mm-Fall ist der bindende, nicht der asymptotische Wert
— ein Zuschlag von nur 11,3 % hätte im Test bei 4 mm noch 1 Pixel außerhalb der Box gelassen.
`compose.ts` wendet den Zuschlag nur auf die **Oberkante** der Fußzonen-Box an; die Unterkante
bleibt unverändert, weil Unterlängen dort bereits ohne Zuschlag passten.

Implementiert **nur** für `baseline: 'hanging'` — der einzige von `compose.ts` erzeugte Fall.
`alphabetic`/`middle` werfen bewusst statt eine ungeprüfte Zahl zu raten: Kapitälchenhöhe bzw.
Über-/Unterlänge relativ zur Grundlinie sind andere, nicht gemessene Größen.

**Der Wert gilt für Arimo, nicht allgemein.** Eine andere Schrift hätte andere Akzenthöhen und
bräuchte eine eigene Messung — im Kommentar zur Konstante ausdrücklich festgehalten. Bei der
bindenden Auflösung liegt die neue Boxoberkante exakt auf der obersten Ink-Zeile, null Pixel
Spielraum: eine künftige Schrift mit höheren Akzenten lässt `fonts.test.ts` sofort wieder
anschlagen, was der Zweck ist, kein Grund, den Bruch vorsorglich höher zu setzen.

Der Charakterisierungstest in `fonts.test.ts` wurde umgedreht: er pinnte ursprünglich den
fehlerhaften Ist-Zustand (`outsideBoxCount: 24` für „Übung") und pinnt jetzt `outsideBoxCount: 0`
für „Übung" **und** „ÄÖÜ" — alle drei deutschen Großbuchstaben-Umlaute, nicht nur den in „Übung"
enthaltenen Ü-Fall, damit ein künftiger Schriftwechsel, der nur Ü korrigiert, aber Ä/Ö weiter
überstehen lässt, nicht unentdeckt bliebe.

**Unabhängig von diesem Fix, hier nicht behoben:** `footInkAgainstBox` prüft alle vier Seiten der
Box; eine lange `designation` kann die 30-mm-Körperbreite des `formation`-Körpers bei 4 mm
Schriftgrad seitlich überschreiten. Das hat mit Diakritika nichts zu tun, ist eine Breiten- statt
eine Höhengrenze und bleibt eine offene, dokumentierte Kante (siehe Abschnitt 9).

## 8. Evidenz

Gemessen am 9. August 2026, `HEAD 26e39ab`:

- `pnpm test`: **55 Testdateien / 1874 Tests grün**, keine übersprungenen Tests.
- `pnpm typecheck`: sauber, keine Fehler.
- `pnpm cli coverage`: `Einträge: 181`, `Quellen: 13`, `Offene fachliche Reviews: 195` (181
  Manifestreviews, 13 Quellenreviews, 1 Profilreview), Coverage-Gate bestanden. Dieser Slice
  liefert keine neuen Katalogzeichen — die Einträgezahl ist gegenüber dem letzten Stand
  unverändert; der Quellenzuwachs (12 → 13) kommt ausschließlich aus dem neuen `arimo-ofl`-
  Quelleneintrag und trägt ein eigenes offenes fachliches Review bei.
- `git diff --check`: sauber, keine Whitespace-Befunde.
- `git status --short`: sauber vor dieser Notiz.
- Prüfsummentest der Schriftdatei (`fonts.test.ts`) und Byteidentitäts-Test zweier Rasterungen
  derselben Textzeichnung: beide grün, Teil der 1874 Tests oben.

Diese Zahlen sind selbst gemessen, keine aus Spec oder Plan übernommenen Planwerte — der Plan
nannte „Einträge: 181, Quellen: 13, Offene fachliche Reviews: 195" und der tatsächlich gemessene
Lauf bestätigt diese Erwartung exakt. Die Design-Spec nannte dagegen noch „Einträge: 183",
„Offene fachliche Reviews: 196"; das reicht auf ein anderes Manifest zurück, keinen Rechenfehler:
Die Spec-Zahlen setzen die beiden `comms.`-Betriebsarten J.2.1/J.2.2 aus D.3 Task 2 voraus
(Commit `0e57b93`), die ausschließlich auf dem geparkten Worktree `worktree-anhang-j-d3` existieren
und **nicht** Vorfahre dieses Branches sind (`git merge-base --is-ancestor 0e57b93 HEAD` schlägt
fehl). Die Differenz reconciled exakt: 183 − 2 (comms-Manifesteinträge, nicht auf diesem Branch)
= 181 Einträge; 12 + 1 (`arimo-ofl`) = 13 Quellen; 196 − 2 (comms-Manifestreviews) + 1
(Arimo-Quellenreview) = 195 offene fachliche Reviews.

**Belegzeichen, visuell geprüft** (Wegwerf-Skript unter dem Scratchpad, nicht im Repo): ein
Textprimitiv „HRT" (`sizeMm: 10`, `baseline: 'alphabetic'`) auf einem einfachen Rechteckkörper,
gerastert in allen sechs Snapshotgrößen (16/24/32/64/128/256 px) und allen drei Themes
(`reference`, `accessible-light`, `print-monochrome`), plus eine über `compose()` erzeugte
Fußzone (`formation`-Körperdoppel, `designation: 'Übung'`) bei 256 px.

- **Größen:** Bei 16 px (effektiver Schriftgrad 5,0 px) und 24 px (7,5 px) — beide unterhalb
  `MINIMUM_TEXT_RENDER_PX = 8` — ist „HRT" bei genauem Hinsehen als Wort erratbar, aber deutlich
  weicher und unschärfer als ab 32 px (10,0 px), wo die drei Buchstaben scharf und ohne Zweifel
  lesbar sind. Das eigene Beispiel ist mit schwarzem Text auf weißem Grund ein günstigerer Fall als
  die drei- bis vierstelligen Kürzel in der Konstantenmessung; die eigene Beobachtung bestätigt
  damit dieselbe Richtung wie die dokumentierte Schwelle (unterhalb 8 px zunehmend unsicher lesbar,
  ab 32 px sicher), ohne den genauen Wortlaut „verschwimmen zu grauen Flächen" für dieses
  konkrete, freundlichere Beispiel zu wiederholen.
- **Themes:** Ein Textprimitiv mit `fill: 'schwarz'`/`weiss` sieht in allen drei Themes identisch
  aus (byteidentische PNGs, per `cmp` geprüft) — beide Token lösen in jeder Palette auf dieselbe
  Farbe auf, dieser Fall beweist also nur, dass sich nichts Unerwartetes ändert. Ein zweiter Lauf
  mit einem themenabhängigen Körperton (`blau`) und festem Text (`schwarz`) zeigt tatsächlich drei
  verschiedene Bilder (unterschiedliche PNG-Hashes): Referenzblau, das aufgehellte
  Accessible-Light-Blau (`#4a73d9`) und ein mittleres Print-Monochrome-Grau (`#777777`) — die
  Glyphenform selbst bleibt in allen drei identisch, nur die Körperfarbe wandert. Das bestätigt,
  dass die Textfarbauflösung genauso themeabhängig funktioniert wie bei jeder anderen Primitivart.
  Rechnerisch liegt Schwarz auf `#777777` bei ≈4,7:1 (WCAG-Relativluminanzformel), knapp über der
  `MINIMUM_TEXT_CONTRAST`-Schwelle von 4,5 — das ist aber kein Kontrastnachweis: `blau`/`schwarz`
  ist kein Paar aus dem offiziellen Kontrastvertrag eines Katalogzeichens, nur von Hand
  nachgerechnet an diesem Demonstrationsbeispiel.
- **Fußzone:** „Übung" unter dem `formation`-Körperdoppel bei 256 px zeigt beide Ü-Punkte
  vollständig und mit sichtbarem Abstand zur Körperunterkante — nicht angeschnitten, nicht mit dem
  Körper überlappend. Die PNG zeichnet `boxMm` nicht und der Renderer clippt nicht auf sie; das
  Bild belegt also „nichts abgeschnitten", nicht Enthaltung in der deklarierten Box. Die Enthaltung
  selbst — `outsideBoxCount: 0` für „Übung" und „ÄÖÜ" — kommt aus der Rasterprüfung in
  `fonts.test.ts` (Abschnitt 7), nicht aus diesem Bild.

## 9. Nicht in diesem Slice

- **Font-Subsetting.** Die Schriftdatei liegt bei rund 485 KiB unsubsettet. Braucht ein Werkzeug in
  der Build-Kette; benannter Nachfolger.
- **Weitere Schnitte.** `Arimo[wght].ttf` ist eine variable Schrift; der Renderer setzt keinen
  `font-weight` und nutzt ihre Standardinstanz. Fett oder kursiv sind kein Bedarf dieses Slice.
- **Mehrzeiligkeit.** Das Textprimitiv kennt genau eine Zeile.
- **Text auf Pfad.** Nicht Teil der Primitivform.
- **Ein Textmetrik-Gate, das die Box gegen die echte Tinte prüft statt sie zuzusichern.** Genau die
  in Abschnitt 2 benannte Lücke bleibt offen — die Rasterprüfungen in `fonts.test.ts` decken die
  konkret geprüften Fälle ab (Unterlängen, deutsche Großbuchstaben-Umlaute in der Fußzone), sind
  aber kein allgemeines Gate, das jede künftige Textverwendung automatisch gegen ihre deklarierte
  Box vermisst.
- **Die seitliche Box-Grenze aus Abschnitt 7.** Eine lange `designation` kann die Körperbreite bei
  4 mm Schriftgrad seitlich überschreiten; `footInkAgainstBox` prüft das zwar (alle vier Seiten),
  aber nichts gated es zur Kompositionszeit.

## 10. Nächster Schritt

D.3 nimmt seine Arbeit im geparkten Worktree `.claude/worktrees/anhang-j-d3` (Branch
`worktree-anhang-j-d3`, Stand `d0532ee`, zwei J.2-Betriebsarten) wieder auf. Die D.3-Spec
(`docs/superpowers/specs/2026-08-08-anhang-j-iuk-d3-design.md`) trägt bereits einen Statusvermerk
(„Status: pausiert nach Task 2 (9. August 2026)"), der auf
`docs/decisions/2026-08-09-anhang-j-ist-typografisch.md` und auf die Erwartung eines
Schemaform-Slice für Text verweist — dieser Slice ist diese Erwartung. Die 16 typografischen
Darstellungen aus Anhang J sind jetzt baubar, ohne dass jemand Geometrie erfinden oder Glyphen als
Pfade nachzeichnen muss: das Textprimitiv trägt ihre Kürzel, die Fußzone bleibt für D.3 ohne
Bedeutung (Anhang-J-Darstellungen sind eigenständige, standalone platzierte Zeichen wie D.2, keine
`SymbolSpec`-Kompositionen).
