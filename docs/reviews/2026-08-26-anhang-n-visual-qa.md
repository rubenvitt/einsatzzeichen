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
| `N.1.4_Drehflügler_Bundeswehr_CH-53_Außentraglast 7t.svg` | `N.1.4` | Brauner angehobener Luftrumpf, Rotordoppeldreieck, Teilung, Aufwärtspfeil und 5,5-mm-Rechteck stimmen. Die schwarze `7` steht nach der Korrektur mittig in dieser Box auf der gemessenen Grundlinie; `CH-53` und `BW` sitzen an den gemessenen Oberflächenankern. Die Quelle zeichnet die Boxecken scharf, während die globale Katalog-Linienverbindung sie leicht rundet; diese kleine Restabweichung bleibt bewusst bestehen. Zusätzlich unterscheidet sich die gebundene Arimo-Silhouette geringfügig von den Quellpfaden. |
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

Eine zweite kleine Restgrenze betrifft ausschließlich die Ecken der N.1.4-Textbox: Die Quelle
zeichnet sie scharf, die projektweit einheitliche Linienverbindung des Katalogs leicht gerundet.
Task 2 verändert dafür weder den globalen Renderer noch dessen Join-Policy.

Eine fachkundige Person muss weiterhin Organisation, Trägerzuordnung und Einsatzbedeutung der
neutral benannten Marken bestätigen. Die technische Einzelprüfung ist keine professionelle oder
fachliche Freigabe. Der deterministische LFH-422-Kontaktbogen, sein Hash und die abschließende
Originalauflösungsprüfung gehören zu Task 3 und sind hier ausdrücklich noch nicht behauptet.

## Finaler Task-3-Kontaktbogen

Der abschließende technische Kontaktbogen wurde aus den neun live in `RECIPES` registrierten
N-Schlüsseln erzeugt; Schlüssel, Titel und exakte Referenzdateinamen stammen nicht aus einer
zweiten, manuell gepflegten Matrix. Seine Katalogbasis ist
`bd3aad8df6b43f0976c94854a4ff3b4b28cb4341`. Generator und Ergebnis bleiben wie vorgesehen
ignoriert:

- Generator: `out/tools/generate-lfh-422-contact-sheet.ts`;
- PNG: `out/lfh-422/contact-sheets/LFH-422-anhang-n.png`;
- Manifest: `out/lfh-422/contact-sheets/manifest.json`.

Das PNG ist `2048 × 3208` px groß und hat den vollständigen SHA-256
`544ce198ec76c84eeeacc2f8522d24e945d8d4ee4b44bd315a65db61192875d7`. Das Raster besteht aus
fünf Zeilen und zwei Karten je Zeile: Die ersten neun Karten enthalten N.1.1 bis N.2.3 in
numerischer Reihenfolge, die zehnte Karte ist sichtbar und absichtlich leer. Jede befüllte Karte
enthält Abschnitt, kanonischen Titel, exakten Referenzdateinamen, die Bezeichnungen `Referenz`
und `Katalog` sowie kurze SVG- und PNG-SHA-256-Präfixe. Referenz und Katalog wurden vor der
Montage jeweils separat auf `420 × 420` px gerastert. Auch der Kataloglauf und die
Kontaktbogenbeschriftung binden die eingecheckte Arimo-Datei; `loadSystemFonts` ist `false`.

Der Generator beginnt jeden Lauf mit dem Entfernen genau der beiden bekannten Ausgabedateien und
führt anschließend zwei vollständige Erzeugungspässe aus. Beim finalen Lauf waren PNG und
Manifest zwischen Pass 1 und Pass 2 byteidentisch. Der Manifest-SHA-256 lautet
`7a411bcfb12ff30394329c8236ac49f7866aa8e0945e0691af9b8d6b5e38c673`; das Manifest enthält den
Ticketwert, die Katalogbasis, die Generatorversion, Layout und Schriftbindung sowie für alle neun
Paare Rezept-, Quellen-SVG-, Quellen-PNG-, Katalog-SVG- und Katalog-PNG-Hashes und den
vollständigen Ausgabehash.

Das finale PNG wurde mit `view_image` im Modus `original` geprüft. Ergebnis:

- 9/9 Referenz-Katalog-Paare sind vorhanden, richtig geordnet und sichtbar voneinander getrennt;
- Abschnitt, Titel, Dateiname, Seitenbezeichnungen und Hashpräfixe sind lesbar;
- weder Zeichen noch externe Beschriftungszonen sind abgeschnitten; zusätzlich weist der
  Generator jeden der 18 Einzelraster zurück, sobald sichtbare Tinte dessen Außenrand berührt;
- der leere zehnte Slot ist eindeutig als absichtlich leer gekennzeichnet;
- die im Einzelprotokoll beschriebenen Körper, Fahrwerke, Marken, Füllungen, Textanker und
  Textfarben sind auch im gemeinsamen Kontaktbogen erkennbar;
- sichtbar verbleiben ausschließlich die bereits dokumentierten geringfügigen
  Arimo-gegen-Quellpfad-Glyphenunterschiede und die scharfen Quellen- gegenüber den leicht
  gerundeten Katalogecken der N.1.4-Box.

Damit ist die technische Screenshot-Evidenz vollständig. Die neun fachlichen Domain-Reviews
bleiben unverändert `pending`; der Kontaktbogen ist keine professionelle oder fachliche
Freigabe.
