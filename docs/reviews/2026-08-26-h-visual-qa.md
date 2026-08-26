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
SHA-256: `fc1d8115544131f353ff175eea31f1b0a63853c7d93b9c514264e6ab740fede2`  
Manifest: `out/lfh-423/contact-sheets/manifest.json` (ignoriert, enthält Eingabe- und Panelhashes)

Der PNG-Bogen wurde einzeln bei seiner Originalauflösung `980 × 1454 px` gesichtet. Die
Panelbeschriftungen, Dateinamen und Hashpräfixe sind vollständig lesbar; keine Kopf-, Körper-
oder Innenmarke wird abgeschnitten.

## Paarprotokoll

| Referenzdatei | Rezept | Sichtprüfung |
|---|---|---|
| `H.1_Veterinärzug.svg` | `H.1` | Orange Formationskörper, drei Kopfkreise und das zentrale Veterinär-V sind vollständig sichtbar. Der breite, mittige V-Scheitel und beide kurzen oberen Arme entsprechen der vermessenen H.1-Fassung; kein Text oder ungeprüfte Zusatzmarke erscheint. |
| `H.2_Tier-Dekontaminationsgruppe.svg` | `H.2` | Orange Gruppenformation mit zwei Kopfkreisen, breitem Veterinär-V und der kompakten Tierdekontaminationsform links unten. Zwei Punkte, gegenläufige Züge und beide Seitenpfeile liegen innerhalb des Körpers; die linke Spitze bleibt bei `x = 3,75 mm`, nicht außerhalb bei `0,5 mm`. Die sichtbare, von Human-Dekontamination abweichende Topologie ist beabsichtigt. |
| `H.3_Schlacht- und Untersuchungsgruppe.svg` | `H.3` | Orange Gruppenformation mit zwei Kopfkreisen, Veterinär-V, unterer geschlossener Hülle und kleinem offenem Dreieck links. Die untere Marke bleibt getrennt lesbar, ohne die V-Spitze oder Körperkontur zu clippen. |

## Ergebnis und Grenze

- Drei von drei Original-/Rezeptpaaren sind zugeordnet, beschriftet und bei gleicher
  `420 × 420 px`-Rastergröße nebeneinander gesichtet.
- Die Prüfung fand keinen konkreten Produktionsdefekt. Deshalb war kein zusätzlicher
  RED/GREEN-Regressionstest nötig.
- Das PNG, Manifest und Generator bleiben unter dem ignorierten `out/`-Pfad und sind für den
  PR-Anhang verfügbar, aber keine eingecheckten Referenzassets.
- Diese technische Sichtprüfung ersetzt weder eine normative Aussage, Lizenzfreigabe noch die
  fachliche Prüfung: `bbk-babz-2025:H.1#primary`, `H.2#primary` und `H.3#primary` bleiben
  Domain-Review `pending`.
