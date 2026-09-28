# LFH-597: zwei obere Lagen an `vehicle-land/plain-wheel-pair`

> Stand: 28. September 2026
> Status: **Aufgelöst als benannte Ausnahme.** Keine Zahl ändert sich, kein Bild ändert sich.
> Bezug: `docs/decisions/2026-09-20-zonenmodell-als-daten.md` §3 Befund 2,
> `docs/decisions/2026-08-25-anhang-f-c.md` (Messwerte F.2.1–F.2.9),
> `docs/reviews/2026-08-25-f-c-visual-qa.md` (Sichtprüfung derselben Dateien)

## 1. Der Befund

`packages/core/src/layout/profiles.ts` führt an der Körperfassung `vehicle-land/plain-wheel-pair`
zwei obere Grundlinien, 0,96 mm auseinander:

| Feld | Wert | bisherige Herkunftsaussage |
|---|---|---|
| `topLeftBaselineFromBodyTopMm` | 6,75 | „geerbt vom Landfahrzeug" |
| `topLeftLines.baselinesFromBodyTopMm[0]` | 5,79 | gemessen an F.2.8 |

LFH-597 hielt die 6,75 für nie an dieser Fassung nachgemessen. Die Notiz vom 20. September ließ
den Punkt deshalb offen: eine der beiden Zahlen zu bevorzugen, hieße raten.

## 2. Was die Akten belegen

Die Prämisse stimmt nicht. Die 6,75 ist **an genau dieser Fassung** gemessen. Geerbt hat sie
umgekehrt das Landfahrzeugprofil.

- **Welche Zeichen die Fassung tragen.** Laut der Zuschnitttabelle in
  `2026-08-25-anhang-f-c.md` sind alle zehn Dateien aus F.2.1 bis F.2.5 (primary und alternative)
  `vehicle-land / plain-wheel-pair`, dazu F.2.8. Die Rezepte in
  `packages/conformance/src/recipes-anhang-f.ts` bauen sie genau so.
- **Wo die 6,75 gemessen ist.** Dieselbe Notiz, Abschnitt „Messwerte und Konstruktion":
  „Landlabel: `topLeft`-Grundlinie y = 12,5, also 6,75 mm unter der Körperoberkante". Grundlage
  waren die 14 Original-SVGs, einzeln bei 900 px gerastert. Einzeilige Läufe tragen sechs dieser
  Dateien: `KTW` (F.2.1), `N-KTW_B` (F.2.2), `2` (F.2.2 alternativ), `RTW` (F.2.3), `NEF` (F.2.4)
  und `NAW` (F.2.5).
- **Wo die 5,79 gemessen ist.** Ebenda: „F.2.8: Grundlinien y = 11,54/15,07, entsprechend
  5,79/9,32 mm unter der Körperoberkante; Versalhöhe 2,43 mm."
- **Unabhängige Bestätigung.** Die Sichtprüfung `2026-08-25-f-c-visual-qa.md` bestätigt beide
  Lagen getrennt: „`KTW` auf Grundlinie 12,5" für F.2.1 und „`GW-San`/`50` auf
  y = 11,54/15,07" für F.2.8.

Die Referenz führt an dieser Fassung also **zwei Lagen**. Der einzeilige Lauf steht auf 12,5, der
zweizeilige Satz beginnt 0,96 mm höher und setzt kleiner (Versalhöhe 2,43 statt 2,92). So passen
beide Zeilen über die waagerechte Teilung bei y = 16: mit der einzeiligen Lage und dem Normgrad
käme die zweite Zeile bei y = 16,5 zu liegen. Diese Begründung ist gedeutet, nicht belegt. Belegt
sind nur die beiden Messwerte.

Das Landfahrzeugprofil (normale und gebänderte Hülle) trägt die 6,75 übertragen. In ganz F.2 gibt
es keinen einzeiligen Lauf auf dieser Hülle ohne je-Spec-Metriksatz. F.2.10 bis F.2.17 belegen
ihre Läufe einzeln mit `topLeftMetrics`.

## 3. Entscheidung

Von den beiden Wegen aus dem Ticket gilt der zweite: **die Abweichung als benannte Ausnahme
festhalten.** Den geerbten Wert durch einen gemessenen zu ersetzen, entfällt. Er ist bereits der
gemessene.

Umgesetzt:

- `profiles.ts`: `plainWheelVehicleLandProfile` setzt `topLeftBaselineFromBodyTopMm: 6.75` jetzt
  ausdrücklich, mit Fundort F.2.1–F.2.5, statt ihn stumm vom Landfahrzeug zu übernehmen. Der
  Profilkommentar benennt die Ausnahme mit Ticketnummer. Der Kommentar am `vehicleLandProfile`
  sagt jetzt, dass die Messzeichen die Radpaar-Fassung tragen und der Wert an den übrigen Hüllen
  übertragen ist.
- `zones.ts`: `label-top-left` an `vehicle-land/plain-wheel-pair` bekommt für `top-left-baseline`
  eine eigene Herkunftsaussage („unmittelbar an dieser Fassung gemessen", F.2.1–F.2.5). Die
  Aussage der Zeilenlagen lautet statt „Abweichung … geerbte 6,75" jetzt „Benannte Ausnahme
  (LFH-597)". Das Zonenmodell führt weiter beide Werte, jetzt als belegten Doppelbefund und nicht
  mehr als offene Frage.
- Tests: `zones.test.ts` nagelt die 6,75 an der Fassung und die Herkunft beider Lagen fest,
  `profiles.test.ts` den Abstand von 0,96 mm.

## 4. Was diese Notiz nicht tut

- Die Original-SVGs wurden für diese Notiz nicht neu gerastert, denn das lokale Orakel
  `taktische-zeichen/` stand nicht zur Verfügung. Die Auflösung stützt sich auf die Vermessung vom
  25. August 2026 und die davon getrennte Sichtprüfung. Wer das Orakel zur Hand hat, prüft es
  schnell nach: `KTW` in F.2.1 auf y = 12,5, erste Zeile von F.2.8 auf y = 11,54.
- Die zweizeilige Lage des Landfahrzeugprofils (`[6.75, 10.75]`, Versalhöhe 2,919225) bleibt, wie
  sie ist. Ihr Fundort nennt für die zweite Zeile weiterhin keinen eigenen Abschnitt, und das
  Zonenmodell sagt das bereits.
- Die veralteten Zeilenangaben in anderen `definedAt`-Feldern von `zones.ts` werden nicht
  nachgezogen. Angepasst sind nur die beiden Einträge, die diese Notiz berührt.
