# D.4 — Anhänge K, L, M: Vorabprüfungen und Designentscheidungen

Stand 10.08.2026. Diese Notiz hält die Befunde fest, die **vor** der ersten Definition erhoben
wurden. Sie sind die Evidenzgrundlage der Abschlussentscheidung; ohne sie müssten sie in der
Sichtprüfung erneut gemessen werden.

## Der angekündigte Vorbehalt ist widerlegt

Die Aufgabenstellung hielt Anhang L für den Risikofall: Zeichen wie „Angabe der Sickerlinie" seien
womöglich Linien- und Verlaufsangaben statt 32×32-mm-Standalone-Piktogramme, und dann würde aus
einem Hinzufügeschritt ein Mechanismusschritt.

**Das trifft nicht zu.** Alle zehn L-Dateien tragen `viewBox="0 0 90.709 90.709"` — dieselben
32×32 mm wie jedes andere Zeichen des Bestands. Alle zehn zeigen dieselbe schwarze Deichfigur als
Grundfläche, auf der eine rote Schadensmarke liegt. Auch `L.10_Angabe der Sickerlinie` ist ein
gewöhnliches Standalone-Piktogramm: Deichfigur, ein rotes Rechteck von 0,5 mm Höhe als Sickerlinie
und die Ziffernfolge „50 %" als Typo-Ebene. Kein Verlaufsprimitiv, keine Pfadgeometrie, kein neuer
Mechanismus.

Die Konsequenz: D.4 ist tatsächlich der Hinzufügeschritt, als der er geplant war. Der Vorbehalt
wird hier abgeschlossen und nicht erneut aufgemacht.

## Was die Referenz an Neuem mitbringt

Ausgezählt am lokalen Bestand, 42 Dateien:

| Anhang | Zeichen | Farben der Referenz |
|---|---|---|
| K (Bauwerksschäden) | 18 | ausschließlich Schwarz, keine einzige Füllangabe |
| L (Deichverteidigung) | 10 | Schwarz + `#fa1919`; nur L.10 trägt Text |
| M (Vegetationsbrand) | 14 | Schwarz + `#fff`, `#fa1919`, `#3264fa`, `#14a01e` |

Alle vier Füllfarben sind **bereits Palettentoken** (`rot`, `weiss`, `hellblau`, `gruen`). Die
Befürchtung, D.4 könnte am Farbraum zu einem Schemaschritt werden, bestätigt sich nicht.

Die Referenz liegt sauber auf einem 0,5-mm-Raster. `K.1` etwa ist ein Rahmen mit 0,5 mm Wandstärke,
dessen Mittellinien exakt auf 2/6/30/26 mm fallen. Konturen sind in der Referenz als **gefüllte
Umrisspfade** gezeichnet; der Katalog setzt sie wie schon in D.3 als Striche auf der Mittellinie um.

## Die vier Vorabprüfungen

1. **`fingerprints.json` trägt alle 42 K/L/M-Einträge** mit gemessenen Hüllen in Millimetern. Die
   deklarierten `box`-Werte lassen sich damit gegen eine Messung prüfen statt gegen den Augenschein
   — in D.3 war eine zu schmale Piktogrammbox ein Fehlerfall. `pnpm cli audit:reference` wird
   **nicht** ausgeführt: es überschriebe das eingecheckte Artefakt.
2. **Das Coverage-Gate verträgt flache Nummerierung.** `uncoveredScope` ankert auf
   `section === chapter || section.startsWith(chapter + '.')`, die Belegdateiprüfung auf
   `` `${section}_` ``. `K.1` ist damit kein Präfix von `K.10`, obwohl die Nummerierung anders als
   in Anhang J nur eine Ebene hat.
3. **`ElementKind` und `PICTOGRAM_ELEMENT_KINDS` führen `damage` und `wildfire` bereits.**
   `elements.ts` braucht keine Codeänderung.
4. **`DamageId` deckt K *und* L ab**, `WildfireId` allein M — so steht es im Schemakommentar. Drei
   Anhänge, zwei ID-Räume: `DAMAGE_IDS` führt K vor L in einer Liste, in zwei Kapitelmodulen.

## Gemessene Kontraste

Mit `contrastRatio` aus `@einsatzzeichen/core` erhoben, nicht geschätzt:

| Nachbarschaft | reference | accessible-light | print-monochrome |
|---|---|---|---|
| rot auf Oberfläche (Grafik, 3:1) | 4,02 ✓ | 4,02 ✓ | 5,74 ✓ |
| rot auf Oberfläche (**Text, 4,5:1**) | 4,02 ✗ | 4,02 ✗ | 5,74 ✓ |
| rot an schwarz | 5,22 ✓ | 5,22 ✓ | 3,66 ✓ |
| hellblau auf Oberfläche | 6,60 ✓ | 6,60 ✓ | **1,16 ✗** |
| gruen auf Oberfläche | ✓ | ✓ | ✓ |

Zwei Befunde, beide echt. Das harte Gate läuft nur über `accessible-light` und `print-monochrome`
(`a11y-contrast-gate.test.ts:38`); das Referenztheme wird ausschließlich als bekannter
Negativbefund für Schwarz auf BABZ-Blau geführt.

### Entscheidung 1 — die Ziffern in L.10 werden schwarz gesetzt

Rot verfehlt als **Text** die 4,5:1-Schwelle in `accessible-light`. Zwei Wege stünden offen:

- `accessible-light` ein abgedunkeltes Rot geben. Technisch tragfähig (bei L ≈ 0,183 bliebe
  Schwarz auf Rot bei ~4,67:1), aber `rot` ist die Organisationsfarbe der Feuerwehr. Für einen
  einzigen Ziffernlauf würde jeder Feuerwehrkörper umgefärbt und die Snapshots aus D.1 und D.2
  zögen mit. Falscher Wirkungsradius.
- Die Ziffern schwarz setzen. **Gewählt.** Alle 19 bereits vorhandenen Textprimitive des Katalogs
  sind schwarz (`COMMS_BLACK_FILL` als Vorgabe in `commsText`, nirgends überschrieben). Schwarze
  Ziffern sind damit die im Katalog etablierte Textbehandlung und weichen von der Referenz nur in
  der Farbe ab — eine `deviation` mit einem Satz Begründung statt eines themeweiten Eingriffs.

Die Sickerlinie selbst bleibt rot: als Grafik besteht sie alle drei Themes.

### Entscheidung 2 — `hellblau` wird im Druckmonochrom von `#eeeeee` auf `#808080` gezogen

Anders als bei den Wasserzeichen aus D.2, wo Schwarz an blauer Geometrie anliegt, sitzt die
hellblaue Figur in M.12 bis M.14 **ohne schwarze Kontur direkt auf der Oberfläche** — der
`#3264fa`-Pfad trägt den Dreiecksumriss und die Pfeile selbst. Ein Paar „Schwarz auf Hellblau" zu
deklarieren wäre hier eine Falschaussage über die Geometrie. Also muss der Grauwert selbst tragen.

Der neue Wert hat eine **zweiseitige** Schranke: hell genug für 3:1 gegen Schwarz — das fordern die
bereits bestehenden Paare in `states/01-tactics-hazards.ts` — und dunkel genug für 3:1 gegen die
weiße Oberfläche. `#808080` erreicht 3,95:1 gegen Weiß und 5,32:1 gegen Schwarz, ist achromatisch
und kollidiert mit keinem der belegten Organisationsgrauwerte (`5f 66 77 88 99 aa bb cc dd`).

Diese Änderung zieht die Druckmonochrom-Snapshots der D.2-Zustände nach, die `hellblau` führen. Der
erwartete Umfang wird vor dem Neuschreiben aufgezählt und der Diff danach dagegen gehalten: eine
unerwartete Datei darin hieße, dass sich etwas anderes bewegt hat.

### Der Fallstrick in allen 14 M-Zeichen

`weiss` und `surface` lösen in allen drei Themes auf `#ffffff` auf. Ein Paar
`foreground: 'weiss', background: 'surface'` wäre exakt der Fall, den `contrastPairProblems`
meldet — ein Vertrag mit Verhältnis 1:1, der nicht erfüllbar ist. Für die weiß gefüllten Körper
wird deshalb Schwarz auf Weiß deklariert, wie es `WATER_CONTRAST` in D.2 vormacht.

## Reihenfolge

K zuerst: 18 Zeichen, reines Schwarz, keine einzige Kontrastentscheidung — eine abschließbare
Gruppe, die auf keine der beiden Themefragen wartet. Dann L (ein einziges Grafikpaar in Rot), dann
M. Committet wird je Kapitelgruppe, wie in D.3.
