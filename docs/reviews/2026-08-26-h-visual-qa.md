# Visual QA: Anhang H

Datum: 26. August 2026
Scope: H.1, H.2 und H.3
Status: technische Sichtprüfung abgeschlossen; alle Domain-Reviews `pending`

## Prüfaufbau und lokales Artefakt

Der ignorierte Generator `out/tools/generate-lfh423-contact-sheet.ts` liest die drei
Originale ausschließlich aus `/Users/rubeen/dev/personal/taktik/taktische-zeichen/`, rastert
Original und `composeFromCatalog(RECIPES[key].spec)` getrennt mit `@resvg/resvg-js` bei jeweils
`420 × 420 px` und setzt sie mit Beschriftung nebeneinander. Erzeugt wurde der Bogen mit:

```text
rtk pnpm exec tsx out/tools/generate-lfh423-contact-sheet.ts
```

Artefakt: `out/lfh-423/contact-sheets/LFH-423-anhang-h.png`  
Abmessungen: `980 × 1454 px` (drei beschriftete Zeilen mit jeweils zwei `420 × 420 px`-Panels)  
SHA-256: `560d29018eb0408738a1b5ed17301620177a385d28173b50477da78c68b5b54e`<br>
Manifest: `out/lfh-423/contact-sheets/manifest.json` (ignoriert, enthält Eingabe- und Panelhashes)

Der PNG-Bogen wurde einzeln bei seiner Originalauflösung `980 × 1454 px` gesichtet. Die
Panelbeschriftungen, Dateinamen und Hashpräfixe sind vollständig lesbar; keine Kopf-, Körper-
oder Innenmarke wird abgeschnitten.

## Paarprotokoll

| Referenzdatei | Rezept | Sichtprüfung |
|---|---|---|
| `H.1_Veterinärzug.svg` | `H.1` | Orange Formationskörper, drei Kopfkreise und das zentrale Veterinär-V sind vollständig sichtbar. Der breite, mittige V-Scheitel und beide kurzen oberen Arme entsprechen der vermessenen H.1-Fassung; kein Text oder ungeprüfte Zusatzmarke erscheint. |
| `H.2_Tier-Dekontaminationsgruppe.svg` | `H.2` | Orange Gruppenformation mit zwei Kopfkreisen, breitem Veterinär-V und einer vollständig links unten liegenden Kompaktmarke. Die Punkte `(4,583|18)` und `(10,417|18)`, zwei **kurze gekreuzte** Diagonalen und die entgegengesetzten unteren Pfeilspitzen bleiben in `x = 3,75…11,25 mm`, `y = 16,75…23,25 mm`; nichts berührt oder kreuzt das Veterinär-V. |
| `H.3_Schlacht- und Untersuchungsgruppe.svg` | `H.3` | Orange Gruppenformation mit zwei Kopfkreisen, Veterinär-V, einer einzelnen waagerechten Linie `x = 3…15 mm` auf `y = 20,75 mm` und einem kleinen **geschlossenen** Dreieck darunter. Die untere Marke bleibt getrennt lesbar, ohne die V-Spitze oder Körperkontur zu clippen. |

## Ergebnis und Grenze

- Drei von drei Original-/Rezeptpaaren sind zugeordnet, beschriftet und bei gleicher
  `420 × 420 px`-Rastergröße nebeneinander gesichtet.
- Die ursprüngliche Sichtprüfung hatte zwei Produktionsdefekte übersehen: H.2s Gruppe war zu
  groß und überdeckte das Veterinär-V; H.3 hatte fälschlich eine Bootform mit oberem Dreieck.
  Zwei literal vermessene Regressionstests wurden zuerst RED beobachtet und anschließend GREEN
  (H.2 erhielt danach einen zweiten RED/GREEN-Zyklus für die tatsächlich gekreuzten Diagonalen).
- Das PNG, Manifest und Generator bleiben unter dem ignorierten `out/`-Pfad und sind für den
  PR-Anhang verfügbar, aber keine eingecheckten Referenzassets.
- Diese technische Sichtprüfung ersetzt weder eine normative Aussage, Lizenzfreigabe noch die
  fachliche Prüfung: `bbk-babz-2025:H.1#primary`, `H.2#primary` und `H.3#primary` bleiben
  Domain-Review `pending`.
