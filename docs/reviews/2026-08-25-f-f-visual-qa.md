# Visual QA: Anhang F-f

Datum: 26. August 2026
Scope: F.3.12 bis F.3.19
Status: technische Einzelprüfung abgeschlossen; Domain-Review pending

## Prüfaufbau

Jede der acht lokalen Originalreferenzen wurde separat mit `@resvg/resvg-js` bei 64 px und
900 px gerastert. Die jeweilige aktuelle direkte Katalogausgabe wurde mit derselben Rasterung und
der eingecheckten Arimo-Datei daneben geprüft. Bewertet wurden Körperhülle, Lage und Topologie der
Innenmarken, Überzeichnung gemeinsamer Linien, Beschriftung und Clipping. Die temporären
Paarbilder wurden nicht eingecheckt. Diese acht Einzelprüfungen sind kein Kontaktbogen und keine
Freigabe des finalen Task-6-Kontaktbogens.

## Einzelprotokoll

| Referenzdatei | Rezept | Beobachtung / Ergebnis |
|---|---|---|
| `F.3.12_Anlaufstelle für Betroffene.svg` | `F.3.12` | Kreis, senkrechter Stamm, waagerechter Doppelpfeil und unteres V stimmen bei 64/900 px in Lage und Topologie. Die offenen Linienenden bleiben sichtbar, nichts clippt. |
| `F.3.13_Betreuungsstelle.svg` | `F.3.13` | Der offene Care-Zweischenkelzug läuft vom Kreisboden zum Scheitel (16|4) und zurück; keine unbelegte Basislinie oder skalierte Formationgeometrie erscheint. |
| `F.3.14_Betreuungsplatz_ortsgebunden.svg` | `F.3.14` | Abgesenkter Kreis, Giebel und um 2 mm abgesenkte Care-Fassung stimmen mit der Quelle und dem bestehenden F.3.5-Körpervertrag. `500` liegt ungeclippt auf der gemessenen Grundlinie und am gemessenen Anker. Die Arimo-Glyphensilhouette ist erwartungsgemäß geringfügig anders als die konturierte Quellschrift; Kappenhöhe und Lage stimmen. |
| `F.3.15_Unterkunft.svg` | `F.3.15` | Reduzierte Hauskontur, genau eine Trauflinie, beide Pfosten, Liegekurve und waagerechte Linie stimmen sichtbar. Die große Ansicht bestätigt die Kurvenlage; zusätzlich liegt der unabhängige 2048-px-Subpfadvergleich mit RMSE 0,004655641803184315 unter 0,006. |
| `F.3.16_Krankenhaus.svg` | `F.3.16` | Dieselbe reduzierte Hauskontur trägt die zentrale und zwei seitliche Senkrechten sowie die Waagerechte y = 18. Die Traufe y = 10 wird nicht doppelt gezeichnet; die zusätzliche Quellen-Outline erscheint nicht als zweiter Körper. |
| `F.3.17_Notfallinformationspunkt_KatS-Leuchtturm.svg` | `F.3.17` | Gefüllter Punkt und gefüllter Stamm stimmen in Form, Lage und Abstand. Es erscheint weder Pfeil noch Raute; bei 64 px bleibt das Motiv klar und ungeclippt. |
| `F.3.18_Ladezone Personentransport.svg` | `F.3.18` | Raute, beide inneren Diagonalen und der untere Stop/Rechtspfeil stimmen. Die Diagonalen kreuzen die unteren Rautenkanten wie in der Quelle; kein senkrechter F.3.10-Mittelsteg wird übernommen. |
| `F.3.19_Ladezone Personentransport_besondere Bedarfe.svg` | `F.3.19` | Raute, zwei offene Ringe und unterer Stop/Rechtspfeil stimmen. Die bei F.3.18 sichtbaren Diagonalen fehlen ausdrücklich; beide Ringe bleiben auch bei 64 px getrennt erkennbar. |

## Querschnittsergebnis

- 8/8 Referenzen sind literal genau einem Rezept F.3.12 bis F.3.19 zugeordnet; keine Alternative
  und kein Stärkegrad kam hinzu.
- Normaler und abgesenkter Kreis sowie beide reduced-house-Marken sind bounds-relativ gegatet.
  Verschobene 24 × 24- beziehungsweise 28 × 22-mm-Hüllen bestehen; falsche Körper-, Varianten-
  und Markenkombinationen werfen.
- F.3.14 verwendet unverändert `circle-12/raised-gable` und den vollständigen `500`-Metriksatz.
  Der Kontrastvertrag deckt weiße Körperfläche und `surface` ab.
- F.3.15s Kurve besitzt neben den Ankerassertionen einen unabhängigen Rastervergleich gegen die
  verbatim aus der Quelle eingebetteten Marken-Subpfade. Die Grenze wurde nach dem wirksamen RED
  nicht gelockert.
- Es entstanden genau acht direkte und acht Mehrgrößen-Snapshots: 151 beziehungsweise 406
  insgesamt. Der Diff gegen `b22eac9` enthält unter den Snapshots 16 hinzugefügte, 0 geänderte und
  0 gelöschte Dateien. Alle 541 Baseline-Snapshots sind bytegleich; auch F.3.10 bleibt mit den
  Blobs `477d98d…` (direkt) und `04911ff…` (Mehrgrößen) unverändert.
- Der Katalog umfasst 137 Rezepte, 405 Renderfälle und 424 Manifestzeilen. Die 424 offenen
  Manifest-Domainreviews plus 13 Quellen- und ein Profilreview ergeben 438 fachlich offene
  Reviewobjekte; diese Zahl bezeichnet keine technische Testabdeckung.

## Offene fachliche Punkte

Eine fachkundige Person muss die HiOrg-Zuordnung der ausschließlich weißen Quellen und die
fachliche Benennung beziehungsweise Abgrenzung der vier neutralen technischen Kreisformen
bestätigen. Die technischen Reviews der acht Zeilen sind mit Datum 2026-08-26 freigegeben, alle
Domain-Reviews bleiben `pending`. Der spätere Task 6 muss seinen eigenen finalen Kontaktbogen
erzeugen und prüfen.
