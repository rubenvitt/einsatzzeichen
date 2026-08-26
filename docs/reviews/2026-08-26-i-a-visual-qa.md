# Visual QA: Anhang I-a

Datum: 26. August 2026
Scope: I.3.5 bis I.3.7
Status: technische Semantik, output-only Sichtprüfung und lokaler Originalvergleich abgeschlossen;
Domain-Review pending

## Prüfaufbau

Der ignorierte Generator bezieht Rezepttitel, Spezifikation und Label ausschließlich aus
`RECIPES`. Er validiert und komponiert jedes Rezept, rendert die direkte Katalogausgabe im
Referenztheme bei 900 px und rastert separat den eingecheckten, ebenfalls generierten
Mehrgrößen-Snapshot. Der Kontaktbogen enthält nur diese generierten Raster. Originalreferenzen,
deren Bilddaten und lokale Quellpfade sind keine Eingaben des Kontaktbogens.

Der aktuelle fokussierte Lauf von `recipes.test.ts`, `snapshots.test.ts` und
`multi-size-snapshots.test.ts` war vor der Erzeugung mit 857/857 Tests grün.

Zusätzlich wurde jede der drei unten benannten lokalen Originalreferenzen separat über ihren
vollständigen `90,709 × 90,709`-ViewBox mit der bestehenden Resvg-Konfiguration bei 900 px
gerastert. Die SVGs besitzen keine feste Pixelgröße; 900 px über den vollständigen ViewBox ist
deshalb die hier verwendete reproduzierbare Originaldetail-Ansicht. Die jeweilige aktuelle
900-px-Katalogausgabe wurde unabhängig direkt aus `RECIPES`, `composeFromCatalog` und
`renderSvg` erzeugt. Ihre SHA-256-Werte stimmen mit den drei `generated900Png`-Werten des
öffentlichen Output-Manifests überein.

Die drei privaten 1800 × 960-px-Paaransichten wurden bei 1:1-Pixelauflösung gesichtet. Für die
Messung wurden Körper und Label zusätzlich getrennt auf transparentem Grund gerastert; dadurch
sind Hüllengrenzen, Labeltinte und Ink-Bounds nicht durch die weiße Arbeitsfläche verfälscht. Die
Originale und Paarbilder bleiben ausschließlich lokale Evidenz und sind weder Bestandteil des
output-only Kontaktbogens noch des Commits.

## Einzelprotokoll

| Rezept | erwartetes Label | Körpervariante | generierter direkter Snapshot | generierter Mehrgrößen-Snapshot | Semantiktest | Sichtprüfung | offene Domain-Frage |
|---|---|---|---|---|---|---|---|
| `I.3.5` | `MzB` | `inset-hull` | `packages/catalog/src/__snapshots__/I.3.5.svg` | `packages/catalog/src/__snapshots__/multi-size/recipe.I.3.5.svg` | grün: exakte Rezeptmatrix, Validator, Körperpfad, schwarzes Mittellabel und Grundlinie | bestanden: direkte und Mehrgrößenhülle stimmen überein; `MzB` ist mittig, schwarz, lesbar und ungeclippt | Ist die weiße Quelle fachlich `hilfsorganisation`, und ist sie dieselbe Einheit wie E.2.29? |
| `I.3.6` | `MzAB` | `inset-hull` | `packages/catalog/src/__snapshots__/I.3.6.svg` | `packages/catalog/src/__snapshots__/multi-size/recipe.I.3.6.svg` | grün: exakte Rezeptmatrix, Validator, Körperpfad, schwarzes Mittellabel und Grundlinie | bestanden: direkte und Mehrgrößenhülle stimmen überein; `MzAB` ist mittig, schwarz, lesbar und ungeclippt | Ist die weiße Quelle fachlich `hilfsorganisation`, und ist sie dieselbe Einheit wie E.2.30? |
| `I.3.7` | `MzPt` | `inset-hull` | `packages/catalog/src/__snapshots__/I.3.7.svg` | `packages/catalog/src/__snapshots__/multi-size/recipe.I.3.7.svg` | grün: exakte Rezeptmatrix, Validator, Körperpfad, schwarzes Mittellabel und Grundlinie | bestanden: direkte und Mehrgrößenhülle stimmen überein; `MzPt` ist mittig, schwarz, lesbar und ungeclippt | Ist die weiße Quelle fachlich `hilfsorganisation`, und ist sie dieselbe Einheit wie E.2.31? |

## Separater lokaler Originalvergleich

Die drei Quelllabels sind in Pfade umgewandelt. Ihre wiederkehrende Grundlinienkoordinate
`45,354` im `90,709`-ViewBox entspricht `15,999824` mm; die erzeugten Textprimitive stehen auf
`15,9998` mm. Die Differenz beträgt rund `0,000024` mm. Beide isolierten Raster führen
ausschließlich schwarze Labelpixel (`RGB 0/0/0`; Kantenweichzeichnung entsteht über Alpha).

| Rezept / Originaldatei | Körpergeometrie bei 900 px | Labelinhalt und -farbe | Grundlinie | Zentrierung der Ink-Bounds | Fit und echte Abweichung |
|---|---|---|---|---|---|
| `I.3.5` / `I.3.5_Mehrzweckboot.svg` | Original und Erzeugung exakt `(21|246)–(878|681)`; Sehne, Rundung und Unterkante stimmen auch in der 1:1-Sicht überein | beidseits `MzB`, schwarz | Quelle `15,999824` mm; Erzeugung `15,9998` mm | Ink-Mitte Quelle `+3,5` px, Erzeugung `+3,0` px rechts der Bildmitte; Anker und optische Lage stimmen | Quelle `341 × 137` px, Arimo-Erzeugung `372 × 137` px: **31 px / 9,1 % breiter**; mit mindestens 240 px Abstand zur äußeren Körperhülle klar ungeclippt |
| `I.3.6` / `I.3.6_Mehrzweckarbeitsboot.svg` | Original und Erzeugung exakt `(21|246)–(878|681)`; keine sichtbare Körperabweichung | beidseits `MzAB`, schwarz | Quelle `15,999824` mm; Erzeugung `15,9998` mm | Ink-Mitte Quelle `+3,5` px, Erzeugung `+2,5` px rechts der Bildmitte; Unterschied 1 px | Quelle `463 × 137` px, Arimo-Erzeugung `505 × 137` px: **42 px / 9,1 % breiter**; mindestens 174 px Abstand zur äußeren Körperhülle, ungeclippt |
| `I.3.7` / `I.3.7_Mehrzweckponton.svg` | Original und Erzeugung exakt `(21|246)–(878|681)`; keine sichtbare Körperabweichung | beidseits `MzPt`, schwarz | Quelle `15,999824` mm; Erzeugung `15,9998` mm | Ink-Mitte Quelle `+6,0` px, Erzeugung `+7,5` px rechts der Bildmitte; Unterschied 1,5 px | Quelle `414 × 140` px, Arimo-Erzeugung `437 × 139` px: **23 px / 5,6 % breiter** und 1 px niedriger; mindestens 203 px Abstand zur äußeren Körperhülle, ungeclippt |

Damit ist keine Pixelidentität behauptet. Die sichtbare, reproduzierbare Abweichung liegt in der
breiteren Glyphensilhouette der projektweit gebundenen Arimo-Schrift gegenüber den in der Quelle
umgewandelten Konturen. Körper, Labelinhalt, Schwarz, Grundlinie, Zentrierung und Fit treffen den
belegten Vertrag; die Typografieabweichung erzeugt weder Clipping noch eine ungemessene
Verschiebung und ist im technischen Schriftvertrag akzeptiert.

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
Rezeptschlüssel, Titel, erwartetem Label, Ausgabeart und Pixelmaßen. Innerhalb der generierten
Direkt-/Mehrgrößen-Ausgaben wurde keine Abweichung festgestellt. Der separate lokale
Originalvergleich dokumentiert dagegen ausdrücklich die breitere Arimo-Glyphensilhouette; er
belegt keine Pixelidentität. Die drei technischen Reviews bleiben `approved`; die offenen
Organisations- und E.2-Identitätsfragen bleiben unabhängig davon `domain: pending` und sind kein
visueller Fehler.
