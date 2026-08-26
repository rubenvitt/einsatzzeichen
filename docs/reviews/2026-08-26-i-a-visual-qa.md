# Visual QA: Anhang I-a

Datum: 26. August 2026
Scope: I.3.5 bis I.3.7
Status: technische Semantik und output-only Sichtprüfung abgeschlossen; Domain-Review pending

## Prüfaufbau

Der ignorierte Generator bezieht Rezepttitel, Spezifikation und Label ausschließlich aus
`RECIPES`. Er validiert und komponiert jedes Rezept, rendert die direkte Katalogausgabe im
Referenztheme bei 900 px und rastert separat den eingecheckten, ebenfalls generierten
Mehrgrößen-Snapshot. Der Kontaktbogen enthält nur diese generierten Raster. Originalreferenzen,
deren Bilddaten und lokale Quellpfade sind keine Eingaben des Kontaktbogens.

Der aktuelle fokussierte Lauf von `recipes.test.ts`, `snapshots.test.ts` und
`multi-size-snapshots.test.ts` war vor der Erzeugung mit 857/857 Tests grün.

## Einzelprotokoll

| Rezept | erwartetes Label | Körpervariante | generierter direkter Snapshot | generierter Mehrgrößen-Snapshot | Semantiktest | Sichtprüfung | offene Domain-Frage |
|---|---|---|---|---|---|---|---|
| `I.3.5` | `MzB` | `inset-hull` | `packages/catalog/src/__snapshots__/I.3.5.svg` | `packages/catalog/src/__snapshots__/multi-size/recipe.I.3.5.svg` | grün: exakte Rezeptmatrix, Validator, Körperpfad, schwarzes Mittellabel und Grundlinie | bestanden: direkte und Mehrgrößenhülle stimmen überein; `MzB` ist mittig, schwarz, lesbar und ungeclippt | Ist die weiße Quelle fachlich `hilfsorganisation`, und ist sie dieselbe Einheit wie E.2.29? |
| `I.3.6` | `MzAB` | `inset-hull` | `packages/catalog/src/__snapshots__/I.3.6.svg` | `packages/catalog/src/__snapshots__/multi-size/recipe.I.3.6.svg` | grün: exakte Rezeptmatrix, Validator, Körperpfad, schwarzes Mittellabel und Grundlinie | bestanden: direkte und Mehrgrößenhülle stimmen überein; `MzAB` ist mittig, schwarz, lesbar und ungeclippt | Ist die weiße Quelle fachlich `hilfsorganisation`, und ist sie dieselbe Einheit wie E.2.30? |
| `I.3.7` | `MzPt` | `inset-hull` | `packages/catalog/src/__snapshots__/I.3.7.svg` | `packages/catalog/src/__snapshots__/multi-size/recipe.I.3.7.svg` | grün: exakte Rezeptmatrix, Validator, Körperpfad, schwarzes Mittellabel und Grundlinie | bestanden: direkte und Mehrgrößenhülle stimmen überein; `MzPt` ist mittig, schwarz, lesbar und ungeclippt | Ist die weiße Quelle fachlich `hilfsorganisation`, und ist sie dieselbe Einheit wie E.2.31? |

## Finaler output-only Kontaktbogen

Der Generatorlauf und der unmittelbar folgende `--verify`-Lauf erzeugten beziehungsweise
rekonstruierten bytegleich drei Zeilen. Die PNG-Datei misst **1712 × 3074 px** und hat SHA-256
`96827ffc0d7613897832ad2074f79df47c0bcc9afd224393104ffb7b0835eb05`. Der SHA-256 des
zugehörigen `manifest.json` ist
`be27d56b68021092d63ef09a0d82340d3f3760ce0cecb77b9442ffeea3cd600d`.

Die Datei wurde vollständig und zusätzlich zeilenweise in drei 1712 px breiten Ausschnitten bei
1:1-Pixelauflösung gesichtet. Alle drei Zeilen, Titel und Spaltenüberschriften sind lesbar. Die
Halbkreisgeometrie ist zwischen den drei direkten 900-px-Ausgaben konsistent; direkte Ausgabe
und eingecheckter Mehrgrößen-Snapshot stimmen jeweils in Körper, Labelinhalt und Labelposition
überein. Alle drei Labels sind mittig, schwarz und ungeclippt. Auch die kleinsten
Mehrgrößenstufen bleiben vorhanden; die 256-px- und Profilansichten bestätigen die Geometrie
ohne Randkontakt.

Der Kontaktbogen zeigt weder eine Originalreferenz noch einen Referenzdateinamen, eine lokale
Verzeichnisangabe oder einen Quellpfad. Die einzige sichtbare Identifikation besteht aus
Rezeptschlüssel, Titel, erwartetem Label, Ausgabeart und Pixelmaßen. Es wurde keine echte
visuelle Abweichung festgestellt. Die drei technischen Reviews bleiben damit `approved`; die
offenen Organisations- und E.2-Identitätsfragen bleiben unabhängig davon `domain: pending` und
sind kein visueller Fehler.
