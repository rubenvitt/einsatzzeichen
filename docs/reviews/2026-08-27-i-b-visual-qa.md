# Visual QA: Anhang I-b

Datum: 27. August 2026
Scope: I.2.1 bis I.2.3
Status: technische Semantik und output-only Sichtprüfung abgeschlossen; Domain-Review pending

## Prüfaufbau

Der ignorierte Generator liest die exakte I.2-Rezeptmenge, Titel, Spezifikationen und Labels
ausschließlich aus `RECIPES`. Er validiert und komponiert jedes Rezept, rendert die direkte
Katalogausgabe im Referenztheme bei 900 px und rastert separat den eingecheckten
Mehrgrößen-Snapshot. Der Kontaktbogen enthält nur diese erzeugten Raster.

Originalreferenzen, deren Bilddaten, Referenzdateinamen und lokale Quellpfade sind keine Eingaben
des Kontaktbogens. Die drei generierten Direkt- und Mehrgrößenpaare bleiben eine technische
Katalogprüfung; sie behaupten weder Pixelidentität mit einem Original noch eine fachliche oder
lizenzrechtliche Freigabe.

Vor der Sichtprüfung liefen die vollständigen direkten und Mehrgrößen-Snapshotdateien mit
`702/702` Tests grün. Der finale integrierte Anhang-I-Stand enthält exakt `224` direkte und
`489` Mehrgrößen-Snapshots.

## Einzelprotokoll

| Rezept | erwarteter sichtbarer Vertrag | direkter Snapshot | Mehrgrößen-Snapshot | Ergebnis der Sichtprüfung | offene Domain-Frage |
|---|---|---|---|---|---|
| `I.2.1` | weiße Normalhülle, drei einzelne Räder, `GW`, große Wellen-/Rautenfassung | `packages/catalog/src/__snapshots__/I.2.1.svg` | `packages/catalog/src/__snapshots__/multi-size/recipe.I.2.1.svg` | bestanden: Label, zwei Wellen und große Raute sind getrennt und ungeclippt; drei Räder bleiben in Direkt-, Größen- und Profilansichten sichtbar | Belegen Titel, Geländegängigkeit und weiße Fläche fachlich Kategorie und Organisation? |
| `I.2.2` | weiße Normalhülle, zwei äußere Räder, `GW Tauchen`, kleine tiefe Wellen-/Rautenfassung | `packages/catalog/src/__snapshots__/I.2.2.svg` | `packages/catalog/src/__snapshots__/multi-size/recipe.I.2.2.svg` | bestanden: der lange obere Lauf bleibt mit Luft zur rechten Kontur lesbar; die kleinere Fassung sitzt tiefer als bei I.2.1 und clippt nicht | Sind Tauchaufgabe, Kürzel und Organisationszuordnung fachlich zutreffend? |
| `I.2.3` | weiße Normalhülle, zwei äußere Räder, `GW SR`, kleine tiefe Wellen-/Rautenfassung | `packages/catalog/src/__snapshots__/I.2.3.svg` | `packages/catalog/src/__snapshots__/multi-size/recipe.I.2.3.svg` | bestanden: Label und kompakte Innenzeichnung sind klar getrennt; Direkt-, Größen- und Profilansichten stimmen geometrisch überein | Ist `SR` fachlich eindeutig Strömungsrettung, und ist die sichtbare Organisation richtig zugeordnet? |

## Finaler output-only Kontaktbogen

Der deterministische Kontaktbogen liegt ignoriert unter
`out/lfh-486/contact-sheet/LFH-486-i-b-generated.png`. Er misst **1600 × 2160 px** und hat
SHA-256 `e0dc8861c588a1606914229eded6606ec331e342aa2845423d17b763142d3bb9`.
Das zugehörige `manifest.json` hat SHA-256
`751b7381f56fb2660c28b2c9974e86debe8c6d79abf58a4e74019f959ae64c08`.

Der Bogen wurde vollständig in Originalauflösung gesichtet. Alle drei Zeilen, Titel und
Spaltenüberschriften sind lesbar. Direkte Ausgabe und Mehrgrößen-Referenztheme stimmen je Rezept
in Hülle, Radzahl, Labelinhalt und Innenzeichnung überein. Die große Kategorie-2-Fassung von
I.2.1 ist sichtbar von der kleineren, tieferen Kategorie-1-Fassung von I.2.2/I.2.3 getrennt.
Diese Sichtaussage gilt nur für den I.2-`vehicle-land`-Dispatch. Die separat vermessene
LFH-485/I.1.17-I.1.20-Formationsfassung ist nicht Teil dieses Kontaktbogens und wird nicht aus
einer der beiden I.2-Fassungen abgeleitet.

Auch `accessible-light` und `print-monochrome` behalten Label, zwei Wellen, Raute und Radzahl;
die gestrichelte Körperkontur folgt der vorhandenen Theme-Konvention. Kein Text und keine
Geometrie berührt den äußeren Bildrand. Die kleinen Stufen 16, 24 und 32 px sind im
Mehrgrößen-Snapshot vorhanden; 64, 128 und 256 px bestätigen Lage und Proportionen klar.

Der Kontaktbogen enthält keine Originalreferenz, keine Referenzpfaddaten und keine
Referenzdateinamen. Die drei technischen Reviews bleiben `approved`; alle drei Domain-Reviews
bleiben unabhängig davon `pending`.
