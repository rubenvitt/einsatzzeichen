# D.4 — Anhänge K, L und M: Abschlussentscheidung

10.08.2026

## Entscheidung

Die Anhänge K (Bauwerksschäden, 18), L (Deichverteidigung, 10) und M (Vegetationsbrand, 14) sind
mit **42 Darstellungen technisch vollständig** umgesetzt. Damit tragen alle fünf Piktogrammarten
der Baseline Literale; `DamageId` und `WildfireId` sind seit D.0 als `never` vorbereitet gewesen
und lösen sich hier auf, ohne dass die Aufteilung neu entschieden werden musste.

Der Katalog enthält jetzt 254 Piktogrammdarstellungen: 92 Capabilities, 67 States, 53 IuK-Zeichen,
28 Schadens- und 14 Vegetationsbrandzeichen.

## Der angekündigte Risikofall trat nicht ein

Die Aufgabe hielt Anhang L für den Punkt, an dem aus einem Hinzufügeschritt ein Mechanismusschritt
werden könnte: Zeichen wie „Angabe der Sickerlinie" seien womöglich Linien- und Verlaufsangaben
statt 32×32-mm-Standalone-Piktogramme.

Das ließ sich vor der ersten Zeile Code widerlegen. Alle zehn L-Dateien tragen dieselbe
32×32-mm-ViewBox wie jedes andere Zeichen des Bestands, alle zehn zeigen dieselbe schwarze
Deichfigur mit einer roten Marke darauf, und auch L.10 ist ein gewöhnliches Standalone-Piktogramm
aus Deichfigur, roter Linie und Ziffern.

## Ein Mechanismusschritt wurde trotzdem nötig — an anderer Stelle

L.1 unterscheidet sich von L.2 **allein durch eine gestrichelte Linie**. `Style` kennt keine
Strichelung: es trägt `fill`, `stroke`, `strokeWidth` und `fillRule`. Die Wahl stand zwischen

- Schema und beide Renderer um Strichelung erweitern — ein echter Mechanismusschritt samt Gates,
  für ein einziges Zeichen, oder
- die Strichelung als Geometrie bauen.

**Gewählt: Geometrie.** `dashedCubic` zerlegt die Kurve nach De Casteljau in echte Teilstücke.
Das ist kein Notbehelf, sondern passt zur Linie des Projekts: der Katalog beschreibt, *was*
dargestellt wird, und eine gestrichelte Linie ist eine Folge kurzer Linien — keine Eigenschaft
einer langen. Sollte Strichelung später in mehr Zeichen auftreten, ist die Erweiterung des Schemas
die dann richtige Antwort; bei n = 1 wäre sie verfrüht gewesen.

## Zwei Farbentscheidungen

Anders als K, das ohne eine einzige Füllangabe auskommt, sind L und M farbig. Zwei gemessene
Befunde erzwangen eine Entscheidung; beide sind behoben und nicht umgangen.

**Die Ziffern in L.10 stehen schwarz statt rot.** Rot erreicht auf der Ausgabeoberfläche 4,02:1
und verfehlt damit die Textschwelle von 4,5:1. Die Alternative wäre gewesen, `rot` in
`accessible-light` abzudunkeln — technisch tragfähig, aber `rot` ist die Organisationsfarbe der
Feuerwehr, und für einen einzigen Ziffernlauf wäre jeder Feuerwehrkörper umgefärbt und die
Snapshots aus D.1 und D.2 mitgezogen worden. Die gewählte Lösung deckt sich mit der bereits
etablierten Textbehandlung: alle 19 vorhandenen Textprimitive des Katalogs sind schwarz.

**`hellblau` trägt im Druckmonochrom `#808080` statt `#eeeeee`.** M.12 bis M.14 setzen blaue
Geometrie ohne schwarze Kontur direkt auf die Oberfläche — anders als die Wasserzeichen aus D.2,
wo Schwarz an blauer Geometrie anliegt. Ein Paar „Schwarz auf Hellblau" zu deklarieren wäre hier
eine Falschaussage über die Geometrie gewesen; der Grauwert selbst musste tragen. Er ist
zweiseitig gebunden — hell genug für 3:1 gegen Schwarz (das fordern die bestehenden Paare der
Zustandszeichen), dunkel genug für 3:1 gegen die weiße Oberfläche (das fordert M.12 bis M.14).

Diese zweite Entscheidung ist die einzige des Slice, die über die neuen Zeichen hinauswirkt. Ihr
Umfang wurde vor der Umsetzung aufgezählt und der Diff danach dagegen gehalten.

## Die Sichtprüfung hat sich erneut gelohnt

Acht Fehler bestanden sämtliche Gates und fielen erst im Vergleich mit der Referenz auf — darunter
zwei Zeichen, die vollständig, geometrisch korrekt und in der falschen Farbe waren, eines, das von
seinem Nachbarn nicht zu unterscheiden war, und vier, in denen eine Marke aus ihrer Trägerform
herausragte oder quer durch sie lief. Die Lehre aus der zweiten Gruppe ist schlicht: was aus dem
Kontaktbogen geschätzt und nicht an der Referenzdatei gemessen wurde, war falsch. Die Einzelheiten stehen in
[`docs/reviews/2026-08-10-d4-visual-qa.md`](../reviews/2026-08-10-d4-visual-qa.md).

Die Gates haben ihrerseits drei Fehler gefangen, die am Bild kaum aufgefallen wären: relative
Pfadkommandos, Bézier-Kontrollpunkte außerhalb der zugesicherten Hülle und eine Pfeilspitze, die
mit Strichzuschlag über die ViewBox reichte. Beide Prüfebenen sind nötig, und keine ersetzt die
andere.

## Was das nicht ist

Diese technische Abdeckung ist **keine fachliche Freigabe** und keine Aussage über normative
Geltung oder die Nutzungs- und Lizenzgrundlage der Quellen. Alle 42 fachlichen Reviews bleiben
`pending`; der Bestand offener Fachreviews steigt damit auf 290. Bedeutung,
Verwechslungsfreiheit, Profilzuordnung und einsatztaktische Eignung jedes einzelnen Zeichens
müssen weiterhin durch eine entsprechend fachkundige Person geprüft werden.
