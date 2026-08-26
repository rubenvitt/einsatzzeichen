# Visual QA: Anhang N

Datum: 26. August 2026  
Scope: N.1.1 bis N.1.6 und N.2.1 bis N.2.3  
Status: technische Einzelprüfung abgeschlossen; Domain-Review pending

## Prüfaufbau

Alle neun lokalen Original-SVGs und die neun aktuellen direkten Katalog-Snapshots wurden jeweils
separat mit `@resvg/resvg-js` bei 880 × 880 px gerastert. Für die Katalogseite war die
eingecheckte variable Arimo-Datei über `resvgFontOptions()` gebunden; Systemschriften waren
deaktiviert. Je Abschnitt entstand nur für die Sichtprüfung ein separates 1840 × 960-px-Paarbild
unter `/tmp/lfh422-task2-pairs/`. Alle neun Paarbilder wurden in Originalauflösung betrachtet.
Sie sind weder eingecheckt noch ein Generator oder der finale Task-3-Kontaktbogen.

Bewertet wurden Körperhülle, Fahrwerk, Füllung, Innenmarken, Textfarbe, Textlage, Clipping und die
beiden außerhalb der Körperfläche liegenden Beschriftungszonen. Der erste Durchlauf deckte drei
Schnittstellenlücken auf: fehlende Räder an N.1.3, weiße statt schwarze Körperläufe und die rechts
außerhalb statt mittig in der Box gesetzte `7` von N.1.4. Nach dem eng begrenzten Task-1-Fix
wurden die Rezepte und Snapshots korrigiert und alle neun Paare neu erzeugt und geprüft.

## Einzelprotokoll

| Referenzdatei | Rezept | Beobachtung / Ergebnis |
|---|---|---|
| `N.1.1_Bergeräumpanzer_Bundeswehr.svg` | `N.1.1` | Braune umgekehrte Rumpfhülle, Kettenstadion und der waagerechte/abgeknickte technische Linienzug stimmen in Lage und Topologie; nichts clippt. |
| `N.1.2_Transportfahrzeug_kommunaler Bauhof_geländegängig.svg` | `N.1.2` | Orange Rumpfhülle, drei Kategorie-2-Ringe, Acht-Speichen-Ring und die beiden schwarzen Läufe `Kipper,`/`26 t` stimmen in Ankern und Grundlinien. Die Arimo-Glyphenkontur ist sichtbar etwas schmaler als die in Pfade umgewandelte Quellschrift; Versalhöhe und Lage bleiben gegatet. |
| `N.1.3_Einsatzfahrzeug_Bundespolizei.svg` | `N.1.3` | Hellgrüne Rumpfhülle, beide Kategorie-1-Ringe und der schwarze, mittige `BuPol`-Lauf stimmen nach der Korrektur. Der verbleibende Unterschied ist ausschließlich die Arimo- gegenüber der konturierten Quellglyphensilhouette. |
| `N.1.4_Drehflügler_Bundeswehr_CH-53_Außentraglast 7t.svg` | `N.1.4` | Brauner angehobener Luftrumpf, Rotordoppeldreieck, Teilung, Aufwärtspfeil und 5,5-mm-Rechteck stimmen. Die schwarze `7` steht nach der Korrektur mittig in dieser Box auf der gemessenen Grundlinie; `CH-53` und `BW` sitzen an den gemessenen Oberflächenankern. Nur die gebundene Arimo-Silhouette unterscheidet sich geringfügig von den Quellpfaden. |
| `N.1.5_Löschflugzeug_Beauftragter Dritter_5.000l.svg` | `N.1.5` | Orange Festflügelhülle, beide Flügelflächen, waagerechter Zug mit Linkswinkel und schwarzer `5.000`-Lauf stimmen sichtbar. Die Schriftkontur bleibt der erwartete Arimo-vs.-Quellpfad-Unterschied. |
| `N.1.6_Erkundungsflugzeug_Feuerwehr_Cessna 172.svg` | `N.1.6` | Rote Festflügelhülle, Flügelflächen und steigende Diagonale stimmen; `Cessna 172` steht ungeclippt am gemessenen Oberflächenanker. Nur die Schriftkontur unterscheidet sich geringfügig. |
| `N.2.1_Sammelraum_Spontanhelfer.svg` | `N.2.1` | Hellgrauer 12-mm-Kreis, Vierblattkontur, kleiner Ring und Rechtspfeil stimmen in Form, Lage und offenen Linienenden. |
| `N.2.2_Kontaktstelle_Spontanhelfer.svg` | `N.2.2` | Roter 12-mm-Kreis, Vierblattkontur und waagerechter Doppelpfeil stimmen; keine Sammelraum-Ringmarke erscheint. |
| `N.2.3_Notfallinformationspunkt.svg` | `N.2.3` | Um 1 mm angehobener hellgrauer Kreis, Punkt/Stamm und schwarze Oberflächenläufe `291300`/`ZIV` stimmen in Lage und bleiben vollständig sichtbar. Die Restdifferenz liegt in den Arimo-Glyphenkonturen. |

## Querschnittsergebnis

- 9/9 Referenzen sind genau einem `primary`-Rezept zugeordnet; es gibt keine Alternative und
  keine zusätzliche N-Rezept-ID.
- Alle fünf Organisationsfüllungen, drei tatsächlich belegten Fahrwerke, die belegten Körperprofile und
  acht Innenmarkenverträge sind im finalen Paarlauf sichtbar und durch Literaltests gebunden.
- Die vier schwarzen Körperläufe aus N.1.2 bis N.1.5 bestehen den Textkontrast in Referenz-,
  accessible-light- und Drucktheme. Es kam keine neue Kontrastausnahme hinzu; die bestehende
  weiss/orange-Ausnahme bleibt auf E.2.6 begrenzt.
- Es liegen 160 direkte und 415 Mehrgrößen-Snapshotdateien vor. Der Task-2-Diff enthält genau
  neun neue Dateien je Snapshotbaum und 0 geänderte oder gelöschte Alt-Snapshots.
- Der Katalog umfasst 146 Rezepte, 414 Renderfälle und 433 Manifestzeilen. Alle neun technischen
  Manifestreviews sind vom 26. August 2026; alle neun Domain-Reviews bleiben `pending`.

## Offene fachliche und visuelle Punkte

Die Quellen verwenden in Pfade umgewandelte Schrift, der Katalog die reproduzierbar gebundene
Arimo-Datei. Deshalb sind an den beschrifteten Paaren geringfügige Glyphensilhouetten- und
Laufbreitenunterschiede sichtbar, obwohl Kappenhöhe, Grundlinie, Anker und die vollständige
N.1.4-Textbox vermessen und gegatet sind. Diese technische Restgrenze wird weder durch Auto-Fit
noch durch rezeptabhängige Schriftpfade kaschiert.

Eine fachkundige Person muss weiterhin Organisation, Trägerzuordnung und Einsatzbedeutung der
neutral benannten Marken bestätigen. Die technische Einzelprüfung ist keine professionelle oder
fachliche Freigabe. Der deterministische LFH-422-Kontaktbogen, sein Hash und die abschließende
Originalauflösungsprüfung gehören zu Task 3 und sind hier ausdrücklich noch nicht behauptet.
