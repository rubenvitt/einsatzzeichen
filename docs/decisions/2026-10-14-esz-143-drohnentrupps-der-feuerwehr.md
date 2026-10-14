# C.1.13 und C.1.14: die Drohnentrupps der Feuerwehr mit eigenen Körpermarken

> Stand: 14. Oktober 2026
> Status: Umsetzung zu ESZ-143 (Zunder), Nachzug aus ESZ-134
> („Was offen bleibt“ in `2026-10-13-esz-134-sonderformen-als-piktogramme.md`)

## Anlass

ESZ-134 hat die Drohne im Körper als Körpermarke festgelegt und `DRONE_BODY_MARKS` mit den drei
gebauten Originalen I.1.20, F.1.16 und C.2.31 eingeführt. C.1.13 Flugdrohnentrupp Feuerwehr und
C.1.14 Drohnentrupp Feuerwehr zeigen den Winkel ebenfalls, standen aber nicht im Umfang.

## Messung

Beide Referenzdateien vermessen (Methode `2026-09-19-masse-an-der-referenz-ablesen.md`,
mm = pt × 32 / 90,709). Körper, Stärke und Farbe sind die von C.1.7: Formation 30 × 20 mm,
`trupp` (ein Punkt in der Mitte der Kopfzeile), `feuerwehr`.

| | C.1.13 | C.1.14 |
|---|---|---|
| Winkel, Breite | 18 mm (x 7…25) | 18 mm (x 7…25) |
| Winkel, Endstärke senkrecht | 1,5 mm | 1,5 mm |
| Winkel, innere / äußere Spitze | Körpermitte − 1 / + 2 mm | Körpermitte + 1 / + 4 mm |
| Winkel, Enden oben | Körpermitte − 5,5 mm | Körpermitte − 4 mm |
| weiterer Inhalt | waagerechte Linie y = Mitte + 5, x 4…28, 0,5 mm, mit 45°-Kerbe 2 mm tief | keiner |

Der Winkel steigt in C.1.13 um 4,5 mm auf 9 mm, in C.1.14 um 5 mm. Er ist weder der Winkel aus
I.1.20 (10,67 mm) noch der aus F.1.16 (16 mm) und auch nicht derselbe in beiden Dateien.

## Entscheidung

1. **Zwei neue technische Körpermarken**, je an ihrem Original vermessen, in
   `core/src/geometry/body-marks-anhang-c/formation.ts`:
   - `formation-chevron-18mm-over-notched-line` (C.1.13): der Winkel über der Linie mit Kerbe.
     Die Linie gibt es an keinem anderen Original; sie gehört deshalb zur Marke und ist keine
     eigene Kennung.
   - `formation-chevron-18mm` (C.1.14): der Winkel allein.

   Die Kennungen beschreiben nur Gestalt und Maß, wie alle `TECHNICAL_BODY_MARK_IDS`.
2. **Zwei Rezepte** `C.1.13` und `C.1.14` mit Manifestzeile, eigenem technischem Review, offenem
   Fachreview, Snapshots und Zeile in der verbatim-Tabelle. Der Umfang nennt beide einzeln, weil
   C.1 weiterhin nicht lückenlos gebaut ist.
3. **`DRONE_BODY_MARKS` führt fünf Fassungen.** Für „Drohne in einer Formation“ ohne weiteren
   Inhalt bleibt `formation-chevron-top` (I.1.20) der Vorschlag aus ESZ-134; C.1.14 zeigt, dass
   die Feuerwehrfassung einen breiteren, tiefer gesetzten Winkel trägt. Ein einheitliches Maß
   bekommt die Drohne weiterhin nicht.
4. **Versionierung:** zwei neue Kennungen in `TECHNICAL_BODY_MARK_IDS`, ein Minor-Release. Das
   Format bleibt `{"v":1}`.

## Prüfung

Pixelvergleich (`pnpm cli reference-diff --filter C.1.1`): beide Zeilen deckungsgleich,
Fläche 0,00 %, Strichanteil 0,01 % (C.1.13) und 0,00 % (C.1.14).

## Was offen bleibt

- Die Fachfrage `Q-3-sonderformen` bleibt offen; beide Zeilen stehen fachlich auf `pending`.
- Was die Linie mit Kerbe in C.1.13 fachlich bedeutet (Abgrenzung „Flugdrohne“ gegen „Drohne“),
  belegt die Quelle nicht.
