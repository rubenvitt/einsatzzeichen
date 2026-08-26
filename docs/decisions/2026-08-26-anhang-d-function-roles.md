# Anhang D: gemessene Funktionsträger

Datum: 26. August 2026
Status: technische Entscheidung; Fachreview weiterhin offen

## Entscheidung

Die 25 wiederkehrenden Funktionsträger aus D.1.2–D.1.8, D.3.1–D.3.13 und D.4.1–D.4.5
werden als totale, unveränderliche Rollenregistry modelliert. Eine Rolle liefert den bereits
endgültig platzierten Körper, Dekoration, eigene Textmetriken, die erwartete Organisation, die
erwartete Kopfart samt konkretem Stärke- oder Verwaltungswert und die zulässigen randbündigen
Körpermarken. `core` kennt nur den Port und keine Katalogdaten.

Ein Spec ohne `functionRole` behält den bisherigen Kompositionspfad byteidentisch. Ein Spec mit
Rolle fällt weder auf das normale Körperprofil noch auf Standardpiktogramme oder Körpervarianten
zurück. Nicht vermessene Kombinationen werden vor dem Zeichnen abgelehnt.

`functionRole`, `organization`, `strength` und `administrativeLevel` bleiben dabei semantisch
getrennte `SymbolSpec`-Achsen. Die Rollen-Definition bindet zur Laufzeit trotzdem exakt die eine
in ihrem genehmigten Quellrezept belegte Organisation und den konkreten Kopfwert. Fehlende oder
abweichende Organisationen sowie andere Stärke- oder Verwaltungswerte sind ungemessene
Kreuzprodukte und werden fail-closed abgelehnt.

## Messmethode und Bezugsrahmen

Gelesen wurden ausschließlich die lokalen Original-SVGs unter
`taktische-zeichen/D.1.2` bis `D.1.8`, `D.3.1` bis `D.3.13` und `D.4.1` bis `D.4.5`.
Die Quellansicht 90,709 × 90,709 Einheiten wurde mit `90,709 / 32 = 2,83465625` auf Millimeter
normiert. Körper, Kappen, Kopfzonen und in Pfade umgewandelte Typo wurden getrennt vermessen.

Die Tabellen verwenden:

- `B[x,y,w,h]` für die endgültige `boxMm`;
- `Text@x/y;s;m` für Inhalt, Anker x, Grundlinie y, Schriftgrad und `minRenderPx`;
- `S` für den Standard-Personenkörper, `L` für den abgesenkten und `C` für den kompakten;
- `—` für keine Körperzusätze beziehungsweise keine zulässige Körpermarke.

Alle Maße sind Millimeter. Alle Rollenläufe sind mittig verankert; alle Trägerläufe sind
rechtsbündig. `bodyAdditions` ist bei allen 25 Definitionen leer.

## Beobachtete und final verwendete Körper

| Familie | endgültiger Körper | Kopfoberkante | Dekoration |
|---|---|---:|---|
| Formation | Rechteck `x=1, y=6, w=30, h=20` | ohne Kopf keine; Gruppe `2` | schwarze Kappe `x=1, y=6, w=30, h=3` |
| Person S | Quadrat Seite `13√2`, Mittelpunkt `(16,16)`, Drehung 45°, Hülle `(3,3)…(29,29)` | Stärke `1`, Verwaltung `0`, sonst keine | schwarzes Dreieck `(16,3) (21,8) (11,8)` |
| Person L | Quadrat Seite `13√2`, Mittelpunkt `(16,18)`, Drehung 45°, Hülle `(3,5)…(29,31)` | Stärke `1`, Verwaltung `0` | schwarzes Dreieck `(16,5) (21,10) (11,10)` |
| Person C | Quadrat Seite `10.5√2`, Mittelpunkt `(16,20.5)`, Drehung 45°, Hülle `(5.5,10)…(26.5,31)` | Verwaltung `0` | schwarzes Dreieck `(16,10) (20,14) (12,14)` |

D.3.12 verwendet ausdrücklich S und nicht den abgesenkten Körper von D.3.7. D.4.4 verwendet L.
D.4.5 verwendet C. Diese drei Fälle wurden unabhängig gemessen; Sternzahl und Stärke leiten die
Körperlage nicht her.

## Formation: endgültige Rollenmetriken

| Abschnitt / Rolle | Kopf | Rollenläufe | Marken |
|---|---|---|---|
| D.1.2 `disaster-control-command` | none | `KatSL@16/20;10.61;25`, `B[2.2,12.3,28.1,8]` | — |
| D.1.3 `technical-incident-command-evacuation`† | none | `TEL@16/18;10.61;25`, `B[6.3,10.4,19.3,7.8]`; `Evakuierung@16/23;4.243;61`, `B[4.3,19.7,23.5,4.4]` | — |
| D.1.4 `incident-command` | none | `EL@16/20;10.61;25`, `B[10.2,12.4,12.1,7.8]` | — |
| D.1.5 `incident-section-command-north` | none | `EAL@16/18;10.61;25`, `B[6.5,10.4,19.5,7.8]`; `Nord@16/23;4.243;61`, `B[11.5,19.7,9.1,3.7]` | — |
| D.1.6 `incident-subsection-command` | none | `UEAL@16/20;10.61;25`, `B[2.6,12.4,27.1,7.9]` | — |
| D.1.7 `technical-incident-command-group` | Stärke `gruppe`, top `2` | `TEL@16/20;10.61;25`, `B[6.3,12.4,19.3,7.8]` | — |
| D.1.8 `fire-service-readiness-command-group`† | Stärke `gruppe`, top `2` | `Ber@16/20;10.61;25`, `B[8.4,12.4,16,7.9]` | — |

Die Quell-Tinthüllen der großen Formationstexte lagen beispielsweise für `KatSL` bei
`x=4,125015…28,604526`, `y=12,570836…20,126955` und für `UEAL` bei
`x=4,501075…28,165320`, `y=12,697836…20,126955`. Die finalen Boxen sind nicht enger als diese
Pfade, sondern decken zusätzlich die deterministische Arimo-Rastertinte ab.

Dasselbe gilt für den direkten Bezeichnungslauf von D.1.1: Seine Quellplatzierung bleibt bei
`x=2,673`, Grundlinie `13` und Schriftgrad `4,243` mm. Die gebundene Arimo-Rasterung belegt bei
512 px jedoch `x=3…26,9375` und `y=9,9375…13,875` mm. Deshalb sichert die deklarierte Box
`B[2.673,9.971,24.3,3.927]` die reale Tinte ab; die engere Quellpfadbreite `21,344` mm wäre für
den im Renderer verwendeten Font falsch.

## Personen: endgültige Rollenmetriken

| Abschnitt / Rolle | Familie / Kopf | Rollenlauf | Trägerlauf | erlaubte Marken |
|---|---|---|---|---|
| D.3.1 `technical-incident-commander` | S / Kreis | `TEL@16/18.5;7.08;37`, `B[9.4,13.4,13.1,5.4]` | `AW@30.5/29;4.243;61`, `B[23.5,25.8,7.2,3.5]` | — |
| D.3.2 `incident-commander` | S / none | `EL@16/18.5;7.08;37`, `B[12,13.4,8.3,5.4]` | — | — |
| D.3.3 `lead-emergency-physician` | S / Kreis | `LNA@16/18.5;7.08;37`, `B[9.4,13.4,13.7,5.4]` | — | — |
| D.3.4 `organizational-incident-commander`† | S / Kreis | `OrgL@16/18.5;7.08;37`, `B[8.1,13.3,15.8,6.9]` | — | — |
| D.3.5 `incident-section-commander` | S / none | `EAL@16/18.5;7.08;37`, `B[9.6,13.4,13.1,5.4]` | — | — |
| D.3.6 `incident-subsection-commander` | S / none | `UEAL@16/18.5;7.08;37`, `B[7,13.4,18.2,5.5]` | — | — |
| D.3.7 `fire-service-platoon-commander` | L / Stärke `zug` | — | — | `fire-fighting` |
| D.3.8 `technical-platoon-commander`† | L / Stärke `zug` | `TZ@16/20.5;7.08;37`, weiß, `B[11.5,15.4,8.8,5.3]` | — | — |
| D.3.9 `medical-platoon-commander` | L / Stärke `zug` | — | `ASB@30.5/31;4.243;61`, `B[21.75,27.8,8.8,3.5]` | `medical-service` |
| D.3.10 `operational-unit-platoon-commander`† | L / Stärke `zug` | — | `DRK@31/31;4.243;61`, `B[22.1,27.8,9.1,3.4]` | `medical-service`, `care` |
| D.3.11 `care-platoon-commander`† | L / Stärke `zug` | — | `ASB@30.5/31;4.243;61`, `B[21.75,27.8,8.8,3.5]` | `care` |
| D.3.12 `care-group-commander`† | S / Stärke `gruppe` | — | `MHD@31.5/29;4.243;61`, `B[22,25.8,9.55,3.4]` | `care` |
| D.3.13 `rapid-response-group-commander`† | S / Stärke `gruppe` | `SEG@16/18.5;7.08;37`, `B[8.5,13.3,14.75,5.5]` | `JUH@30.5/29;4.243;61`, `B[22.1,25.8,8.3,3.5]` | — |
| D.4.1 `district-control-center-director`† | S / Kreis | `LtS@16/18.5;7.08;37`, `B[11,13.3,10.25,5.5]` | `ST@29.5/29;4.243;61`, `B[24,25.8,5.65,3.5]` | — |
| D.4.2 `district-fire-chief`† | S / Kreis | `KBM@16/18.5;7.08;37`, `B[8.625,13.4,14.75,5.3]` | `ME@30/29;4.243;61`, `B[23.7,25.8,6.5,3.4]` | — |
| D.4.3 `hazard-response-director`† | S / Kreis | `LtrGA@16/18.5;7.08;37`, `B[7,13.3,18.5,5.5]` | `MG@30/29;4.243;61`, `B[23.25,25.8,6.7,3.5]` | — |
| D.4.4 `hazard-response-forces-director`† | L / Nationalstaat | — | `BuPol@31.75/31;4.243;61`, `B[20.5,27.7,11.375,3.6]` | — |
| D.4.5 `international-relief-operation-director`† | C / EU | — | — | — |

Schwarzer Rollenlauf auf der Körperfarbe ist der Standard. `TZ` ist die beobachtete weiße
Ausnahme. D.1.8 `Ber` und D.4.2 `KBM` verwenden den semantischen Token
`funktionslauf-kontrast`: Im Referenz- und im barrierearmen Farbtheme lösen beide Rollenläufe wie
die Quellen zu Schwarz auf Rot auf
(5,218:1), ausschließlich im monochromen Drucktheme zu Weiß auf `#666666` (5,742:1). Damit
bleiben alle drei Theme-Paare über der unveränderten Textschwelle von 4,5:1. Alle anderen
Rollenläufe behalten ihr bisheriges Ink. Trägerläufe stehen schwarz auf der Ausgabeoberfläche.
Ihre Hintergründe sind deshalb expliziter Vertragsbestandteil und werden für Zeichnung und
Kontrastgate aus derselben Definition gelesen.

Diese eng begrenzte Theme-Auflösung ist bewusst keine Kontrastausnahme. Verworfen wurden eine
neue `ContrastException` und eine Absenkung auf 3:1, weil `Ber` und `KBM` lesbarer Text bleiben;
als Glyphenpfade wären die Läufe nicht mehr die vermessenen Textverträge; ein global dunkleres
`rot` würde sämtliche bestehenden roten Zeichen verändern. Der eigene Token hält dagegen die
quellentreue Farbausgabe stabil und verändert nur die beiden problematischen Rollenläufe im
Drucktheme.

## Verwaltungsstufen

Gebaut werden nur die drei beobachteten Köpfe. Eine sechsstrahlige Marke besteht aus drei
schwarzen Rechtecken: `0,5 × 4` senkrecht und `4 × 0,5` bei `+30°` und `-30°` um das gemeinsame
Zentrum. Jedes Blatt trägt `role: head`.

| Stufe | Zentren | Box / Höhe |
|---|---|---|
| Kreis | `(11,2)`, `(21,2)` | `B[9.143,0,13.714,4]`, Höhe `4` |
| Nationalstaat | `(6,2)`, `(11,2)`, `(16,2)`, `(21,2)`, `(26,2)` | `B[4.143,0,23.714,4]`, Höhe `4` |
| Europäische Union | `(13.5,2)`, `(18.5,2)`, `(9,5)`, `(23,5)`, `(13.5,7)`, `(18.5,7)` | `B[7.143,0,17.714,9]`, Höhe `9` |

`gemeinde`, `bezirk` und `bundesland` liefern `undefined`. Für sie existiert im untersuchten
Bestand keine Kopfmarke; eine Interpolation aus der Anzahl wäre eine neue Zeichnung.

## D-spezifische Körpermarken

- D.3.7 `fire-fighting`: waagerechte Linie über die Personenhülle auf `y=18`; rechts eine
  geschlossene Raute `(25,14) (29,18) (25,22) (21,18)`.
- D.3.9/D.3.10 `medical-service`: senkrechter Arm ab fünf Millimeter unter der Rautenspitze bis
  zur Unterkante und waagerechter Arm über die Hüllenmitte.
- D.3.10/D.3.11/D.3.12 `care`: unteres V von `(cx-6.5,cy+6.5)` über `(cx,cy)` nach
  `(cx+6.5,cy+6.5)`.
- D.1.9 Primary bleibt rollenlos und verwendet die technische schwarze 3-mm-Kappe. Die
  Alternative verwendet eine 4-mm-Kappe mit weißen Löchern `r=1.5` um `(11,7.75)`, `(16,7.75)`
  und `(21,7.75)`. Beide bleiben im Legacy-Kompositionspfad.

## Bewusste Abweichungen und neutrale Verträge

1. Die Referenztypografie liegt nur als Pfad vor. Schriftgrade werden aus der gemessenen
   Versalhöhe auf die fest gebundene Arimo-Schrift übertragen (`10,61`, `7,08`, `4,243` mm).
   `boxMm` deckt zusätzlich die bei 256 px gerasterte reale Arimo-Tinte ab. Das ist eine bewusste
   Laufweitenabweichung vom Quellpfad, keine erfundene Auto-Fit-Regel.
2. Kleine Exportasymmetrien der gedrehten Quadrate werden als exakt 26-mm- beziehungsweise
   21-mm-Rauten neutralisiert. D.3.12, D.4.4 und D.4.5 behalten dabei ihre jeweils beobachtete
   Lage; es gibt keine gemeinsame Schrumpfregel.
3. Die Sternkontur wird aus den drei beobachteten Balkenachsen konstruiert. Sie ist kein
   `HeadMark`-Kreis und keine Ableitung unbekannter Verwaltungsstufen.
4. Die englischen Rollen-IDs sind technische, stabile Schlüssel. Sie behaupten keine bereits
   erfolgte fachliche Übersetzung.

## Offene Fachfragen (`†`)

Unverändert offen bleiben die englischen IDs
`technical-incident-command-evacuation`, `fire-service-readiness-command-group`,
`organizational-incident-commander`, `technical-platoon-commander`,
`operational-unit-platoon-commander`, `care-platoon-commander`, `care-group-commander`,
`rapid-response-group-commander`, `district-control-center-director`, `district-fire-chief`,
`hazard-response-director`, `hazard-response-forces-director` und
`international-relief-operation-director`.

Ebenfalls offen bleibt die Organisationszuordnung `hilfsorganisation` für D.1.9 und D.3.9 bis
D.3.13. Beobachtet ist dort eine weiße Körperfläche; ob diese technisch sichtbare Farbe die
fachliche Organisation vollständig belegt, entscheidet das Domainreview. Keine dieser Fragen
wurde durch die Implementierung umbenannt oder still freigegeben.
