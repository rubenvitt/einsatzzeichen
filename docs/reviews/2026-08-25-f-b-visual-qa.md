# Visual QA: Anhang F-b

Datum: 25. August 2026  
Scope: F.1.3, F.1.12 bis F.1.22 einschließlich zwei Alternativdarstellungen  
Status: technische Einzelprüfung abgeschlossen; Domain-Review pending

## Prüfaufbau

Alle 14 Original-SVGs wurden einzeln auf 900 px gerastert und gegen Rezept, direktes
64-px-Snapshot sowie die Mehrgrößenregression geprüft. Die Prüfung bewertet Zuordnung,
sichtbare Hauptgeometrie, Kopfzone, Beschriftung und Variante. Sie ist ausdrücklich **nicht**
der finale Task-6-Kontaktbogen; ein solcher wurde für diesen Bericht weder erzeugt noch als
gesehen behauptet.

## Paarprotokoll

| Referenzdatei | Rezept | Beobachtung / Ergebnis |
|---|---|---|
| `F.1.3_Mobiles Betreuungsmodul 5000.svg` | `F.1.3` | Zelt, Bett, Lauf `5.000` und schwarzes Fußband gebaut. Zwei unbegriffene Kopfbalken bleiben erklärte Abweichung. |
| `F.1.12_Nachbarschaftliche Soforthilfe.svg` | `F.1.12` | `gruppe`, Fachdienstteilung und `ÜMANV-S` bestätigt. Der lange Lauf überschreitet sichtbar die Mittellinie; die Textbox wurde entsprechend erweitert. |
| `F.1.12_Nachbarschaftliche Soforthilfe_Alternative.svg` | `F.1.12#alternative` | `gruppe` sowie `patient-transport + physician + intensive-care`, kein Textlauf. |
| `F.1.13_Behandlungsplatz-Bereitschaft.svg` | `F.1.13` | Zelt, Arztteilung, `50` und eigener Ring r 7 mm um (16|17) gebaut. Ein unbegriffener Kopfbalken bleibt Abweichung. |
| `F.1.14_Erstversorgungstrupp.svg` | `F.1.14` | `trupp`, Fachdienstteilung und `EVT` bestätigt. |
| `F.1.15_Arzttrupp.svg` | `F.1.15` | `trupp` und Arztteilung bestätigt. |
| `F.1.15_Arzttrupp_Alternative.svg` | `F.1.15#alternative` | `trupp`, Arztteilung und Intensivbalken bestätigt. |
| `F.1.16_Drohnentrupp.svg` | `F.1.16` | `trupp`; Winkel und beide gefüllten Dreiecke als technische Geometrie gebaut, nicht still ausgelassen. Keine Capability-Semantik behauptet. |
| `F.1.17_Gruppe Verpflegung.svg` | `F.1.17` | `gruppe`, Fußband, Lauf `250`, Zelt und reduzierte `catering`-Kontur bestätigt. |
| `F.1.18_Gruppe für soziale Betreuung.svg` | `F.1.18` | `gruppe`, Zelt, `100` oben links und `SOZ` unten mittig bestätigt; kein `bottomLeft`-Ersatz. |
| `F.1.19_Gruppe zur Herrichtung von Notunterkünften.svg` | `F.1.19` | `gruppe`, unverändertes normales Zelt, Bett und `120` bestätigt. |
| `F.1.20_Schnelleinsatzgruppe soziale Betreuung.svg` | `F.1.20` | `gruppe`, Zelt, `100` oben links und `SEG` unten mittig bestätigt; kein zweiter `topLeft`- oder `bottomLeft`-Lauf. |
| `F.1.21_Betreuungsplatzbereitschaft 500.svg` | `F.1.21` | `500`, Dach, Ring r 6,5 mm um (16|18) und eingeschriebenes Dreieck gebaut. Ein unbegriffener Kopfbalken bleibt Abweichung. |
| `F.1.22_Transportzug bis 50 Betroffene.svg` | `F.1.22` | `zug`, Zelt, Patiententransport und `50` bestätigt. |

## Querschnittsergebnis

- 14/14 Referenzen besitzen ein exakt zugeordnetes Rezept.
- 14/14 direkte und 14/14 Mehrgrößen-Snapshots wurden neu erzeugt; keine bestehende
  Snapshotdatei wurde ersetzt.
- `foot-band` ist auf F.1.3/F.1.17 begrenzt. `normal`, F.1.4 und F.1.19 bleiben unverändert.
- Technische Innenformen sind im Bild vorhanden und im Code geometrisch benannt; ihre fachliche
  Bedeutung bleibt offen.
- Die einzigen bewussten visuellen Auslassungen in F-b sind die semantisch unbelegten
  Kopfbalken von F.1.3, F.1.13 und F.1.21. Sie stehen als `deviation` im Manifest.

## Offene fachliche Punkte

Eine fachkundige Person muss weiterhin entscheiden, ob die technischen Innenformen von F.1.13,
F.1.16 und F.1.21 etablierte fachliche Begriffe tragen und ob die weißen F-Körper tatsächlich
`hilfsorganisation` ausdrücken. Bis dahin bleibt das Domain-Review jeder neuen Manifestzeile
`pending`.

## Finaler Task-6-Kontaktbogen

Am 26. August 2026 wurde
`out/lfh-417/contact-sheets/LFH-448-f-b.png` einzeln in Originalauflösung
2048 × 4800 px geprüft; der vollständige SHA-256 steht im deterministischen
`out/lfh-417/contact-sheets/manifest.json`. Alle 14 Karten und beide
Alternativen sind getrennt, vollständig beschriftet und ungeclippt. F.1.3 zeigt hier ausdrücklich
den echten gebauten Katalogstand mit Badge `DEFERRED CARRY-IN AUS F-a`; er ist damit nicht mit dem
historischen LFH-447-Platzhalter zu verwechseln. Kopf-, Fuß- und Innenmarken sowie die langen
Beschriftungen bleiben vollständig sichtbar. Kein neuer technischer Blocker; Domain-Reviews
bleiben `pending`.
