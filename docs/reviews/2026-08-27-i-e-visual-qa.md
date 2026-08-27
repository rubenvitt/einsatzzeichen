# Visual QA: Anhang I-e

Datum: 27. August 2026
Scope: I.1.9 bis I.1.12, vier Abschnitte und fünf Darstellungen
Status: technische Semantik, output-only Sichtprüfung und lokaler Originalvergleich abgeschlossen;
Domain-Review pending

## Prüfaufbau

Der ignorierte Generator bezieht Schlüssel, Titel, Spezifikationen und Labels ausschließlich aus
`RECIPES`. Er validiert und komponiert jedes Rezept, rendert die direkte Katalogausgabe im
Referenztheme bei 900 × 900 px und rastert separat den eingecheckten Mehrgrößen-Snapshot. Der
Kontaktbogen und die kompakte Chat-Vorschau enthalten nur diese generierten Ausgaben.
Originalreferenzen, deren Bilddaten und lokale Quellpfade sind keine Eingaben dieser beiden
öffentlichen Artefakte.

Vor der Sichtprüfung waren die fünf fokussierten Integrationsdateien mit 524/524 Tests und die
direkten sowie Mehrgrößen-Snapshotdateien mit 706/706 Tests grün. Der Generatorlauf und der
unmittelbar folgende `--verify`-Lauf rekonstruierten fünf Zeilen bytegleich.

Der danach ausgeführte vollständige Repository-Lauf bestand mit 66/66 Testdateien und
4805/4805 Tests; der TypeScript-Check meldete keine Fehler.

Zusätzlich wurde jede der fünf lokalen Originalreferenzen separat über ihren vollständigen
`90,709 × 90,709`-ViewBox bei 900 px gerastert. Daneben stand jeweils eine unabhängig aus
`RECIPES`, `composeFromCatalog` und `renderSvg` erzeugte 900-px-Ausgabe. Die private
`1880 × 4920`-Paaransicht wurde vollständig gesichtet. Originale und Paaransicht bleiben lokale
Evidenz und sind weder Bestandteil des output-only Kontaktbogens noch des Commits.

## Einzelprotokoll

| Rezept | erwarteter sichtbarer Vertrag | direkte / Mehrgrößen-Snapshots | Sichtprüfung | offene Domain-Frage |
|---|---|---|---|---|
| `I.1.9` | ein Trupppunkt, `Boot`, zwei kompakte Wellen und Raute | `I.1.9.svg` / `multi-size/recipe.I.1.9.svg` | bestanden: Körper, Punkt, Label und Wasserrettungsmarke sind vollständig, lesbar und ungeclippt | Ist die weiße Formation fachlich `hilfsorganisation`, und welche Bedeutung grenzt sie gegen die Alternative ab? |
| `I.1.9#alternative` | ein Trupppunkt, `WRZ`, Boot zwischen je zwei seitlichen Wellen | `I.1.9#alternative.svg` / `multi-size/recipe.I.1.9#alternative.svg` | bestanden: Boot, vier Wellen und Zwischenräume sind sichtbar; die Darstellung ist gegenüber `I.1.9` klar unterscheidbar | Ist dies fachlich dieselbe Einheit in anderer Darstellung, und wofür steht `WRZ` verbindlich? |
| `I.1.10` | zwei Gruppenpunkte, `Boot`, kompakte Wasserrettungsmarke | `I.1.10.svg` / `multi-size/recipe.I.1.10.svg` | bestanden: beide Punkte und alle Innenkonturen bleiben auch in den kleinen Stufen vorhanden | Ist die weiße Gruppenfassung fachlich korrekt zugeordnet? |
| `I.1.11` | ein Trupppunkt, `Tauchen`, kompakte Wasserrettungsmarke | `I.1.11.svg` / `multi-size/recipe.I.1.11.svg` | bestanden: Label, Punkt, Wellen und Raute sind vollständig und ungeclippt | Bezeichnet die Kombination fachlich den Tauchtrupp in der erwarteten Organisationsklasse? |
| `I.1.12` | zwei Gruppenpunkte, `Tauchen`, kompakte Wasserrettungsmarke | `I.1.12.svg` / `multi-size/recipe.I.1.12.svg` | bestanden: die Quelle und die Erzeugung führen ausdrücklich zwei Punkte; kein Punkt fehlt | Bezeichnet die Kombination fachlich die Tauchgruppe in der erwarteten Organisationsklasse? |

## Separater lokaler Originalvergleich

Die Körpermittellinien, Stärkepunkte und Innenzeichnungen stehen in allen fünf Paaren an derselben
visuellen Position. Besonders gegengeprüft wurden die zwei Gruppenpunkte von I.1.12, die
Bootsöffnung und die freien Übergänge der I.1.9-Alternative sowie die Reihenfolge Wellen über
Raute in den vier `water-rescue`-Darstellungen.

Der erste unabhängige Sichtlauf fand zwei reproduzierbare Geometriefehler: Die seitlichen Wellen
der I.1.9-Alternative berührten den zu breit aus den Quell-Ink-Bounds statt aus der Mittellinie
rekonstruierten Bootsrumpf, und die Wasserrettungswellen waren zu flach und um 0,5 mm nach unten
versetzt. Beide Befunde wurden testgetrieben korrigiert, alle zehn Snapshots neu erzeugt und die
private Paaransicht wiederholt. Im finalen Stand bleiben zwischen Boot und Wellen je 0,75 mm
sichtbar frei; die Wasserrettungswellen und die round-join-kompensierten Rautenspitzen treffen die
gemessenen sichtbaren Hüllen.

Die Quelle speichert Labels und Innenkonturen als gefüllte Pfade. Der Katalog verwendet die
projektweit gebundene Arimo-Schrift sowie aus den Quellkonturen zurückgerechnete 0,5-mm-
Mittellinien. Die Paaransicht belegt deshalb keine Pixelidentität: Glyphensilhouetten und einzelne
Kurvensegmente können sich an geglätteten Kanten geringfügig unterscheiden. Sichtbarer Inhalt,
relative Lage, Körperfit, Strichstärke, Kopfanzahl und die charakteristische Alternative stimmen;
keine Abweichung erzeugt Clipping, Überdeckung oder eine Verwechslung zwischen den beiden
I.1.9-Fassungen.

## Finaler output-only Kontaktbogen

Der vollständige Kontaktbogen misst **1712 × 5050 px** und hat SHA-256
`7fc6515744653807959662ed1728932e29054ed7b412da349a977857ca421201`. Er zeigt je Rezept
links die generierte 900-px-Direktausgabe und rechts den gerasterten eingecheckten
Mehrgrößen-/Profil-Snapshot.

Die kompakte Chat-Vorschau misst **1320 × 1040 px** und hat SHA-256
`9dea96612cb98e6352623b329e2ab85400370bd3e33591731719eca280560449`. Sie zeigt alle fünf
Direktausgaben in einer output-only Übersicht und kennzeichnet die alternative I.1.9-Fassung
explizit.

Beide Artefakte wurden vollständig gesichtet. Titel, Schlüssel und Variantenhinweise sind lesbar;
die fünf Symbole besitzen weder Randkontakt noch abgeschnittene Labels oder Innenkonturen. Die
kleinen 16/24/32/64/128/256-px-Stufen sowie die beiden alternativen Profile sind im vollständigen
Kontaktbogen vorhanden. Fachliche Organisations- und Bedeutungsfreigaben bleiben unabhängig
davon in allen fünf Domain-Reviews `pending`.
