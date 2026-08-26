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
SHA-256: `1b98d0bc96eb2d8527c438bae0dd9d1621514ea494c6c9e4a441c1e31ad43125`<br>
Manifest: `out/lfh-423/contact-sheets/manifest.json` (ignoriert, enthält Eingabe- und Panelhashes)

Der PNG-Bogen wurde einzeln bei seiner Originalauflösung `980 × 1454 px` gesichtet. Die
Panelbeschriftungen, Dateinamen und Hashpräfixe sind vollständig lesbar; keine Kopf-, Körper-
oder Innenmarke wird abgeschnitten.

## Paarprotokoll

| Referenzdatei | Rezept | Sichtprüfung |
|---|---|---|
| `H.1_Veterinärzug.svg` | `H.1` | Orange Formationskörper, drei Kopfkreise und das zentrale Veterinär-V sind vollständig sichtbar. Die obere V-Mittellinie liegt wie in der Quelle auf `y = 9 mm`; die Knicke liegen auf `x = 10/22 mm`, nicht auf den früher übernommenen Konturpunkten `x = 11/21 mm`. Kein Text oder ungeprüfte Zusatzmarke erscheint. |
| `H.2_Tier-Dekontaminationsgruppe.svg` | `H.2` | Orange Gruppenformation mit zwei Kopfkreisen, dem Veterinär-V `(9|9)–(12|9)–(18|23,6)–(24|9)–(27|9)` und einer vollständig links unten liegenden Kompaktmarke. Die Punkte `(4,583|18)` und `(10,417|18)`, zwei **kurze gekreuzte** Diagonalen und die entgegengesetzten unteren Pfeilspitzen bleiben in `x = 3,75…11,25 mm`, `y = 16,75…23,25 mm`; nichts berührt oder kreuzt das Veterinär-V. |
| `H.3_Schlacht- und Untersuchungsgruppe.svg` | `H.3` | Orange Gruppenformation mit zwei Kopfkreisen und derselben vermessenen V-Fassung wie H.2. Unten links ist der schwarze Balken `x = 3…15 mm`, `y = 20,75…21,25 mm` mit dem hohlen Hängedreieck **zu einer Kontur verbunden**; nur `(6|21,4)–(7,5|23,25)–(4,5|23,25)` bleibt als Negativraum orange. Es gibt keine Anschlusslücke und kein separates verkleinertes Dreieck mehr. |

## Ergebnis und Grenze

- Drei von drei Original-/Rezeptpaaren sind zugeordnet, beschriftet und bei gleicher
  `420 × 420 px`-Rastergröße nebeneinander gesichtet.
- Frühere Sichtprüfungen hatten neben den bereits korrigierten H.2-/H.3-Zusatzmarken zwei
  lasttragende Restfehler übersehen: alle drei Veterinär-Vs verwendeten Konturkanten statt der
  rekonstruierten Mittellinien, und H.3 zeichnete Balken und inneren Negativraum als getrennte
  Strichprimitive. Vier literal vermessene Regressionen wurden gegen die vorherige Produktion
  RED und nach der unabhängigen Rekonstruktion GREEN beobachtet: vollständiges H.1-V, erstes
  V-Primitive von H.2 und H.3 sowie H.3s einzelne verbundene Even-Odd-Kontur.
- Das PNG, Manifest und Generator bleiben unter dem ignorierten `out/`-Pfad und sind für den
  PR-Anhang verfügbar, aber keine eingecheckten Referenzassets.
- Diese technische Sichtprüfung ersetzt weder eine normative Aussage, Lizenzfreigabe noch die
  fachliche Prüfung: `bbk-babz-2025:H.1#primary`, `H.2#primary` und `H.3#primary` bleiben
  Domain-Review `pending`.
