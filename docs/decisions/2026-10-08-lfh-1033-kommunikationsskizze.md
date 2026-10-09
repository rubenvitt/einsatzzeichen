# Kommunikationsskizze: Bausteine nach J.5 außerhalb des Katalogs

> Stand: 8. Oktober 2026
> Status: **Entschieden am 8. Oktober 2026** (Ruben, §2). Die Maße in §4 sind vorgeschlagen.
> Bezug: LFH-1033 (Folgeticket aus der Fernmeldeskizze in Lifeline Hub),
> `docs/decisions/2026-08-10-anhang-j-iuk-d3.md`, `docs/decisions/2026-09-19-masse-an-der-referenz-ablesen.md`,
> `Vision.md` Punkt 8.

## 1. Auftrag

Die taktische Fernmeldeskizze in Lifeline Hub (BBK Anhang J.5, Musterskizze) zeichnet acht Zeichen
selbst, weil der Katalog sie nicht hat:

1. Bedingungszeichen: Langsechseck mit Text, wächst mit dem Text
2. Sammelschiene mit eingesetztem Bedingungszeichen
3. Funk-Zickzack als Marke auf einer beliebig langen, gedrehten Linie (J.3.12 hat nur ein festes Feld)
4. „geplant“: gestrichelte Linie mit Wort
5. Bereich mit Strich-Punkt-Grenze
6. Verbindungsart Melder (nicht in J.1)
7. Verbindungsart „sonstige“
8. Satellit ohne Unterscheidung Sprache/Daten (J.1 kennt nur J.1.12 und J.1.13)

## 2. Entscheidung

Keines der acht Zeichen hat eine Referenzdatei. J.5 ist eine Musterskizze und liegt nicht als
Einzeldateien im BABZ-Bestand; das Referenzinventar führt in J nur J.1 bis J.4. Eine Katalogzeile
verlangt aber eine Referenzdatei und eine Fachreview-Zeile (`comms-inventory.test.ts`,
`coverage-manifest.ts`, `coverage-gate.ts`).

Zur Wahl standen:

- **A · Eigener Teil „Kommunikationsskizze“** neben dem Katalog, eigener Namensraum, jedes Maß mit
  Befundstatus.
- B · Erst einen Profil-Mechanismus bauen und die Zeichen als Profil führen.
- C · Nur die übertragbaren Zeichen (Funk-Linie, Satellitenschale) aufnehmen.

**Ruben hat am 8. Oktober 2026 A gewählt.** Die Kennzeichnung nach Vision Punkt 8 tragen Namensraum
(`sketch.*`) und Befund (`SKETCH_BLOCKS`), nicht ein Profil. A lässt sich später verlustfrei in ein
Profil überführen.

## 3. Was gebaut ist

`packages/core/src/sketch/`, exportiert über `@einsatzzeichen/core`:

| Baustein | Funktion | Rückgabe |
|---|---|---|
| Bedingungszeichen | `conditionSign({ text, center })`, `conditionSignWidth(text)` | `outline`, `label`, `width`, `height` |
| Sammelschiene | `busBar({ start, length, text, signCenterX? })`, `busBarMinLength(text)` | `rail`, `sign`, `length` |
| Verbindungslinie | `commsLink({ path, medium, status, mark?, clearanceMm? })` | `line`, `mark`, `word`, `anchor` |
| Bereich | `commsArea({ x, y, width, height, label })` | `boundary`, `label` |
| Melder, sonstige, Satellit | `sketchPictogram('sketch.messenger' \| 'sketch.other' \| 'sketch.satellite', variant)` | 32 × 32 mm wie `pictogram()` |

- Die Bausteine liefern **Primitive in Teilen**, keine `Drawing`: Eine Skizze braucht Lage,
  Hervorhebung und Bedienung selbst. Wer ein Bild will, setzt die Teile in eine `Drawing` und ruft
  `renderSvg`.
- Strich 0,5 mm, `role: 'pictogram'`, Text in Arimo 500 wie der Katalog. Die Textbox ist hier eine
  Rechnung aus der Messung (`measureTextRun`), keine Zusicherung am Bild — der Text ist frei.
- Strichmuster sind geometrisch gebaut (einzelne Polyzüge), weil `Style` kein Strichmuster kennt.
- Nichts davon steht in `ALL_PICTOGRAMS`, im Coverage-Manifest oder im Referenzinventar; der Test
  `sketch.test.ts` hält das fest.

## 4. Maße (vorgeschlagen)

Abgeleitet aus der Fernmeldeskizze in Lifeline Hub (dort 3 Skizzeneinheiten = 1 mm), damit das Bild
gleich bleibt.

| Maß | Wert |
|---|---|
| Höhe Langsechseck, Spitzen | 8 mm, je 4 mm |
| Text im Bedingungszeichen | 4 mm, Innenabstand 1,33 mm je Seite |
| Überstand Sammelschiene | 5,33 mm je Seite |
| Zickzack-Marke | 8 × 2,67 mm, sechs Schenkel, Grund 0,67 mm, in der Mitte des längsten Abschnitts (nie auf einem Knick) |
| „geplant“ | Strich 2,67, Lücke 1,67 mm; Wort 3,33 mm, 1,33 mm neben Linie bzw. Marke |
| Bereichsgrenze | Strich 4,67, Lücke 1,33, Punkt 0,67, Lücke 1,33 mm; Bezeichnung 3,33 mm, 2,67 mm eingerückt |
| Melder, sonstige | Balken x 3 … 29 (J.1.1), Kürzel 7,1 mm (J.1.3), Zickzack wie J.1.8–J.1.11 |
| Satellit | Schale aus J.1.12/J.1.13 ohne Inhalt |

## 5. Offen

- Vermessung an der J.5-Musterskizze, sobald die Abbildung vorliegt; dann werden die Befunde
  `evidenced` und die Maße gegebenenfalls angepasst.
- Ein allgemeiner Profil-Mechanismus (Option B) bleibt ein eigenes Vorhaben.
