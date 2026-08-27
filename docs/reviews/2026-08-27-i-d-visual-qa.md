# Visual QA: Anhang I-d

Datum: 27. August 2026
Scope: I.1.5 bis I.1.8
Status: technische Semantik, output-only Sichtprüfung und lokaler Originalvergleich abgeschlossen;
Domain-Review pending

## Prüfaufbau

Der ignorierte Generator `out/tools/generate-lfh482-contact-sheets.ts` akzeptiert ausschließlich
die vier explizit abgegrenzten I-d-Schlüssel der `ANHANG_I_RECIPES`-Matrix. Titel, Stärke und
Body-Marks stammen direkt aus `RECIPES`. Jedes Rezept wird validiert, im Referenztheme bei
900 × 900 px gerendert und
zusätzlich über seinen eingecheckten Mehrgrößen-Snapshot rasterisiert. Der Kontaktbogen enthält
nur diese generierten Katalograster; Originalreferenzen, Bilddaten und lokale Quellpfade sind
keine Eingaben des output-only Bogens.

Vor der Sichtprüfung bestanden das fokussierte Semantikgate 1.573/1.573 Tests und das direkte
beziehungsweise Mehrgrößen-Snapshotgate 718/718 Tests. Beim ersten Snapshotlauf erschienen
genau die erwarteten acht fehlenden Artefakte; hinzu kamen ausschließlich vier direkte und vier
Mehrgrößen-SVGs.

Für den privaten Originalvergleich wurden die vier lokalen Referenz-SVGs und die vier aktuellen
Katalogausgaben unabhängig mit Resvg bei 900 × 900 px gerastert. Je Abschnitt wurde eine
1.800 × 960-px-Paaransicht in Originalauflösung geöffnet. Diese Original- und Paarbilder bleiben
lokale Evidenz und sind weder Teil des Commits noch des öffentlichen Kontaktbogens.

## Einzelprotokoll

| Rezept | erwartete Geometrie | direkter Snapshot | Mehrgrößen-Snapshot | Ergebnis der Sichtprüfung | offene Domain-Frage |
|---|---|---|---|---|---|
| `I.1.5` | Truppkopf; 3,7-mm-Kappe mit genau drei negativen Kreisen; Doppelwelle und scharfkantige Raute | `packages/catalog/src/__snapshots__/I.1.5.svg` | `packages/catalog/src/__snapshots__/multi-size/recipe.I.1.5.svg` | `accepted`: Kopf, drei Kappenöffnungen, Wellen, Miter-Raute und Außenhülle stimmen in Anzahl und Lage; nichts clippt | Ist die weiße Formation fachlich als `hilfsorganisation` einzuordnen? |
| `I.1.6` | Truppkopf; geschlossene 3-mm-Kappe; Doppelwelle und Raute | `packages/catalog/src/__snapshots__/I.1.6.svg` | `packages/catalog/src/__snapshots__/multi-size/recipe.I.1.6.svg` | `accepted`: geschlossene Kappe und ein Kopf sind klar von I.1.5 getrennt; Innenmarke und Hülle stimmen | Ist die weiße Formation fachlich als `hilfsorganisation` einzuordnen? |
| `I.1.7` | zwei Gruppenköpfe; geschlossene 3-mm-Kappe; Doppelwelle und Raute | `packages/catalog/src/__snapshots__/I.1.7.svg` | `packages/catalog/src/__snapshots__/multi-size/recipe.I.1.7.svg` | `accepted`: beide Köpfe liegen symmetrisch; Kappe und Innenmarke bleiben vollständig und ungeclippt | Ist die weiße Formation fachlich als `hilfsorganisation` einzuordnen? |
| `I.1.8` | zwei senkrechte Staffelköpfe; Körper, Kappe und Innenmarke um 3 mm abgesenkt | `packages/catalog/src/__snapshots__/I.1.8.svg` | `packages/catalog/src/__snapshots__/multi-size/recipe.I.1.8.svg` | `accepted`: senkrechte Kopfzone und abgesenkter Körper entsprechen der Quelle; Doppelwelle und Raute bewahren ihre Körperabstände | Ist die weiße Formation fachlich als `hilfsorganisation` einzuordnen? |

## Separater lokaler Originalvergleich

Die sichtbaren Gesamtbounds stimmen bei 900 px für jedes Paar exakt überein:

| Rezept | Originalbounds | Katalogbounds | ImageMagick AE / normierte RMSE | Befund |
|---|---|---|---|---|
| `I.1.5` | `(21|56)–(878|738)`, 858 × 683 px | `(21|56)–(878|738)`, 858 × 683 px | `28,0206` / `0,00181137` | gleiche Kopf-, 3,7-mm-Kappen-, Körper- und Innenmarkenlage |
| `I.1.6` | `(21|56)–(878|738)`, 858 × 683 px | `(21|56)–(878|738)`, 858 × 683 px | `22,5118` / `0,00170608` | gleiche Kopf-, Kappen-, Körper- und Innenmarkenlage |
| `I.1.7` | `(21|56)–(878|738)`, 858 × 683 px | `(21|56)–(878|738)`, 858 × 683 px | `23,0422` / `0,00171802` | gleiche Kopf-, Kappen-, Körper- und Innenmarkenlage |
| `I.1.8` | `(21|28)–(878|822)`, 858 × 795 px | `(21|28)–(878|822)`, 858 × 795 px | `23,1804` / `0,00165919` | gleiche Staffelkopf-, Kappen-, Körper- und Innenmarkenlage |

Damit ist keine vollständige Pixelidentität behauptet. Die Quelle führt expandierte, gerundete
Konturen mit dreistellig exportierten Koordinaten, während der Katalog die zurückgerechneten
0,5-mm-Mittellinien parametrisch zeichnet. Die Quell-Raute wird als expandierter Füllpfad und
die Katalograute als äquivalenter Even-odd-Ring mit 0,353553-mm-Miter-Ausladung gezeichnet. In
der 1:1-Sicht sind Doppelwelle, scharfkantige geschlossene Raute, Kappen, Stärkezeichen und
Außenhülle deckungsgleich angeordnet; die dokumentierte
Quellenidealisierung beträgt höchstens 0,002 mm. Es gibt kein sichtbares Finding und keinen
technischen Blocker.

## Finaler output-only Kontaktbogen

Der Generatorlauf und der unmittelbar folgende `--verify`-Lauf rekonstruierten bytegleich vier
Zeilen sowie vier direkte Detail-PNGs. Der Kontaktbogen misst **1712 × 4098 px** und hat SHA-256
`8fb98c57755be20baa0022688210987a978c25635b31d5ac16c52b985f1b8f90`. Das ignorierte
`manifest.json` bindet die exakte Vierermenge an Rezept-, Direkt-SVG-, Direkt-PNG-,
Mehrgrößen-SVG- und Kontaktbogenhashes, Pixelmaße und den erzeugenden Git-Head.

Der Bogen wurde vollständig in Originalauflösung geöffnet. Alle vier Zeilen, Titel und
Spaltenüberschriften sind lesbar. Die direkten 900-px-Ausgaben und die eingecheckten
Mehrgrößen-Snapshots stimmen jeweils in Stärke, Kappenform, Körperhülle und Wasserrettungsmarke
überein. Auch 16, 24, 32, 64, 128 und 256 px sowie die beiden Profilthemes sind vorhanden; es
gibt keine Überdeckung oder Randabschneidung.

Das Ergebnis ist technisch für alle vier Darstellungen `accepted`. Die vier technischen Reviews
bleiben `approved`; die fachliche Organisationszuordnung bleibt davon unabhängig in jedem
Domain-Review `pending`.
