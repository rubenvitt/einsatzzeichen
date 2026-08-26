# Visual QA: Anhang F-e

Datum: 26. August 2026
Scope: F.3.1 bis F.3.11
Status: technische Einzelprüfung abgeschlossen; Domain-Review pending

## Prüfaufbau

Alle elf Original-SVGs wurden einzeln auf 900 px gerastert. Nach semantischem GREEN und dem
Snapshot-Update wurden auch die elf aktuellen Katalogausgaben einzeln auf 900 px gerastert und
jeweils gegen Original, direktes Snapshot und Mehrgrößen-Snapshot geprüft. Bewertet wurden
Kreishülle, Giebel, Innenmarken, Schichtendopplung und die sichtbaren Beschriftungen. Diese
Prüfung ist kein Kontaktbogen und nicht der finale Task-6-Kontaktbogen.

## Paarprotokoll

| Referenzdatei | Rezept | Beobachtung / Ergebnis |
|---|---|---|
| `F.3.1_Patientenablage.svg` | `F.3.1` | Kreis r 12 um (16|16), Teilung und obere Doppelpfeilform stimmen in Lage und Topologie. Die generierten Linienenden sind als Mittellinien idealisiert und nicht als Quellkonturen kopiert; kein Clipping. |
| `F.3.2_Patientenablage_arztbesetzt.svg` | `F.3.2` | Wie F.3.1 plus Arztleiste x = 12…20 auf y = 22. Die Teilung wird trotz zweier Marken nicht doppelt überzeichnet. |
| `F.3.3_Unfallhilfsstelle_Sanitätsstation.svg` | `F.3.3` | Kreis und Teilung stimmen; `UHS` steht schwarz mit gemessener Versalhöhe, Grundlinie y = 5,000254 und Anker x = 1,015316. Die Arimo-Laufbreite ist sichtbar etwas größer als die konturierte Quellschrift, Lage und Höhe bleiben korrekt und ungeclippt. |
| `F.3.4_Unfallhilfsstelle_Sanitätsstation_arztbesetzt.svg` | `F.3.4` | Wie F.3.3 plus Arztleiste; Teilung und Schrift bleiben jeweils eine Schicht. Derselbe erwartete Breitenunterschied der Arimo-Glyphen ist sichtbar, ohne Lageabweichung oder Clipping. |
| `F.3.5_Behandlungsplatz 50_ortsgebunden.svg` | `F.3.5` | Abgesenkter Kreis r 12 um (16|18), Giebel (3|11)–(16|1)–(29|11), Teilung und Arztleiste stimmen. Kreis und Giebel sind quellgleich mit J.3.2; nicht wiederverwendet wird nur dessen abweichende bestehende Katalogapproximation (16|17), r 11,5. `50` steht schwarz auf Grundlinie y = 5,000254 bei Anker x = 1,025998; die Schriftsilhouette unterscheidet sich leicht von den Quellpfaden, die gemessene Kappe und Lage stimmen. |
| `F.3.6_Sammelstelle allgemein.svg` | `F.3.6` | Sammelpfeil und Ring r 2 um (23|16) stimmen in Lage, Größe und Topologie; kein Clipping. |
| `F.3.7_Sammelraum Einsatzfahrzeuge.svg` | `F.3.7` | Gewölbter Rahmen, Rechtspfeil und kleiner Ring stimmen. Die Pfadlinien sind glatt und bleiben vollständig innerhalb der Kreisfassung. |
| `F.3.8_Bereitstellungsraum.svg` | `F.3.8` | Der eigenständige tiefere Rahmen trifft Oberkurve, Seiten und Boden der Quelle; er wird nicht auf die Pfeilfassung F.3.7 reduziert. |
| `F.3.9_Pufferzone_Verfügungsraum Rettungsdienst.svg` | `F.3.9` | Rahmen, zwei Innenteilungen und unterer Doppelpfeil stimmen in Lage und Ausdehnung; keine unbelegte Semantik wird ausgegeben. |
| `F.3.10_Ladezone.svg` | `F.3.10` | Die korrigierte Konturmittel-Raute endet bei (22,5|12,5), (16|19), (9,5|12,5); Mittelsteg, Anschlag und Rechtspfeil stimmen. Die frühere Ganzzahl-Außenkantennäherung ist nicht mehr enthalten. |
| `F.3.11_Rettungsmittelhalteplatz.svg` | `F.3.11` | Kreis-Teilung, Ring r 5,5 und beide Diagonaldurchmesser stimmen. Gemeinsame Achsen werden nicht doppelt gezeichnet; die Ausgabe behauptet keinen Patiententransport. |

## Querschnittsergebnis

- 11/11 Referenzen sind literal einem Rezept zugeordnet; F.3.1 bis F.3.11 sind lückenlos.
- 11/11 direkte und 11/11 Mehrgrößen-Snapshots sind vorhanden. Der Gesamtbestand umfasst
  143 direkte und 398 Mehrgrößen-Snapshots.
- Beim Snapshot-Update entstanden genau die 22 neuen F-e-Dateien. Ein Git-Blob-Hashvergleich
  prüfte 519 bereits vorhandene Snapshotdateien und fand 0 Abweichungen.
- Normaler Kreis und `raised-gable` verwenden getrennte, bounds-relative Registry-Zweige.
  Unbekannte Art-/Varianten-/Markenpaare sowie ungültige, partielle oder boxfremde
  `topLeftMetrics` werden abgelehnt.
- Ein Regressionstest hält den quellgleichen F.3.5-/J.3.2-Giebel und den allein im bestehenden
  J.3.2-Katalogkörper liegenden Unterschied fest. Die Korrektur dieser Approximation ist nicht
  Bestandteil von LFH-451.
- Die Kreislabels werden über den bestehenden `bodyLabelInk()`-Pfad aus der zwingend weißen
  HiOrg-Fläche schwarz abgeleitet. Ihr Kontrast ist gegen diese Fläche und gegen `surface`
  belegt; andere oder fehlende Organisationen werden für jede gemessene Kreisfassung auch ohne
  Label abgelehnt.
- Der Bestand erreicht 129 Rezepte, 397 Renderfälle und 416 Manifesteinträge. Der Coverage-CLI
  meldet 430 offene fachliche Reviews: 416 Manifestreviews, 13 Quellenreviews und 1 Profilreview.

## Offene fachliche Punkte

Eine fachkundige Person muss die Bedeutung der sieben rein geometrisch benannten Innenmotive und
die Organisationszuordnung der weißen F.3-Körper bestätigen. Die sichtbaren Breitenunterschiede
zwischen Arimo und den konturierten Quellglyphen von `UHS`/`50` werden nicht durch Auto-Fit oder
rezeptabhängige Schriftprofile kaschiert; belegt sind Kappe, Grundlinie und Anker. Bis zur
Fachentscheidung stehen alle elf Domain-Reviews auf `pending`.
