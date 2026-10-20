# ESZ-132 — Dekontamination Personal und Gerät: „P“ und „G“ als Lauf an der Marke

Zunder: https://zunder.rubeen.dev/#/aufgabe/b0s2dsx7lo5v19ab5qkg8s7s

## Frage

Das Altpaket `taktische-zeichen-core` 0.10 unterscheidet `dekontamination`,
`dekontamination-personen` („P“) und `dekontamination-geraete` („G“). In `@einsatzzeichen` gibt es
nur die Fähigkeit `decontamination` (4.1.3). Personen- und Gerätedekontamination fielen damit auf
dasselbe Zeichen zusammen. Zu klären war, wie die Referenz die Zusätze führt, und ob sie eigene
Kennungen oder ein Zusatz an `decontamination` werden.

## Befund an der Referenz

| Datei | Zusatz | Ebene | Lage |
|---|---|---|---|
| `4.1.3_Dekontaminieren.svg` | keiner | — | Einzeldarstellung, keine Fassung mit „P“ oder „G“ |
| `C.1.8_Staffel Dekontamination  von Personal.svg` | „P“ | `Takt. Zeichen (Typo)` | mittig, Grundlinie 3 mm über der Körperunterkante, Versalhöhe 4,87 |
| `C.1.10_Dekontaminationsgruppe Gerät einer Feuerwehr.svg` | „G“ | `Takt. Zeichen (Typo)` | dieselbe Lage wie das „P“ aus C.1.8 |
| `C.2.25_Gerätewagen Dekontamination Personal.svg` | „P“ | `Takt. Zeichen (Typo)` | 21,3 mm ab links, 3 mm über der Unterkante, Versalhöhe 2,92 |
| `C.2.25_…_Alternative.svg` | „P“ | `Takt. Zeichen (Typo)` | 15,5 mm ab links, 2 mm über der Unterkante, Versalhöhe 4,87 |

Der Zusatz ist in jeder Datei Schrift, kein Teil der Marke, und steht zwischen den beiden Klammern
der Zange. Kapitel 4 kennt ihn nicht.

## Entscheidung

1. **Keine neuen Kennungen.** „P“ und „G“ sind ein mittiger Lauf (`labels.center`) an der Marke
   `decontamination`, wie in der Referenz. Eine Fähigkeits-ID je Buchstabe hätte eine Zeichnung
   erfunden, die Kapitel 4 nicht führt.
2. **Der Lauf steht an der Marke.** Trägt eine Spec `decontamination` als Körpermarke und einen
   mittigen Lauf ohne eigene Lage, steht er dort, wo die Referenz den Buchstaben setzt
   (`core/src/geometry/body-mark-runs.ts`). An Körpern ohne vermessene Fassung folgt er der
   übertragenen Marke mit derselben Abbildung (`bodyMarkRun` in `core/src/derive/body-marks.ts`)
   und ist als abgeleitet notiert (`labels.center`). Vorher stand er am Kreis 12 und an der Gefahr
   auf der Körpermitte und lag damit im Kreuz der Zange.
3. **Angaben der Spec gehen vor**, je Feld (`centerBaselineFromBodyBottomMm`,
   `centerAnchorFromBodyLeftMm`, `centerCapHeightMm`). C.1.8 und C.2.25 zeichnen unverändert.
4. **C.1.10 ist gebaut** (Formation, gruppe, feuerwehr, „G“). Rasterabgleich gegen die Referenz
   deckungsgleich (0,40 % Fläche, C.1.8 zum Vergleich 0,28 %). Die Spec nennt die Lage des „G“
   nicht; sie belegt damit die Regel aus Punkt 2.

## Für Lifeline Hub

`dekontamination-personen` wird `{ bodyMarks: ['decontamination'], labels: { center: 'P' } }`,
`dekontamination-geraete` dasselbe mit „G“, an jeder Grundform (Formation, Fahrzeug, Stelle,
Gefahr, Maßnahme). Die Notiz „Näherung: der Zusatz P/G wäre eine Beschriftung, die eine Spec nicht
trägt“ im Hub ist damit überholt.

## Offen

- Die Fachzuordnung von C.1.10 bleibt im Domain-Review pending.
- Die Platzprüfung (`derive/layout-guard.ts`) prüft Läufe weiterhin nicht gegen Körpermarken. Ein
  langer mittiger Lauf neben der Dekontamination kann die Klammern berühren; die Referenz zeigt dort
  nur einen Buchstaben.
