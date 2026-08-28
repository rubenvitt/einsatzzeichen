# Visual QA: Anhang I-f / LFH-484

Datum: 28. August 2026
Scope: I.1.13 bis I.1.16
Status: output-only Sichtprüfung und technischer Referenzabgleich bestanden; Domain-Reviews pending

## Prüfaufbau

Der ignorierte Generator `out/tools/generate-lfh484-contact-sheet.ts` liest nur die vier direkten
Katalog-Snapshots und die Titel aus `RECIPES`. Er erzeugt vier 900 × 900-px-Detailbilder sowie
einen 1200 × 1200-px-Überblick. Originalreferenzen, Referenzdateinamen und lokale Pfade sind weder
Eingabe noch sichtbarer Inhalt dieses output-only Kontaktbogens.

Die erste Sichtung fand, dass verschachtelte SVG-Schriften im Überblick nicht gerastert wurden:
`Öl` fehlte dort, obwohl es in Einzelbild und Katalogsnapshot vorhanden war. Der Generator wurde
daraufhin auf die bereits mit der gebundenen Arimo-Schrift gerasterten Einzel-PNGs umgestellt.
Erst der korrigierte Bogen zählt als Evidenz. Der anschließende Verify-Lauf meldete:

```text
rtk pnpm exec tsx out/tools/generate-lfh484-contact-sheet.ts --verify
verified 5 pixel-identical png outputs and manifest
```

Alle fünf PNG-Inhalte wurden aus einem temporären Verzeichnis pixelgleich reproduziert; das
stabil serialisierte Manifest war bytegleich.

## Einzelprotokoll

| Rezept | direkter Snapshot | sichtbarer Vertrag | Sichtprüfung |
|---|---|---|---|
| `I.1.13` | `packages/catalog/src/__snapshots__/I.1.13.svg` | Truppkopf, verschmolzene Scheiben-/Schaft-/Klammerkontur, zwei Wellen, untere Raute | bestanden: obere Kontur durchgehend gefüllt, keine Naht an Schaft oder Klammer, kein Clipping |
| `I.1.14` | `packages/catalog/src/__snapshots__/I.1.14.svg` | Gruppenkopf, sonst identische Composite-Geometrie | bestanden: beide Kopfpunkte vollständig und Innenzeichnung unverändert |
| `I.1.15` | `packages/catalog/src/__snapshots__/I.1.15.svg` | Truppkopf, `Öl`, untere Doppelwelle und Raute | bestanden: Umlautpunkte, kleines `l`, Grundlinie, Wellen und Raute klar getrennt |
| `I.1.16` | `packages/catalog/src/__snapshots__/I.1.16.svg` | Gruppenkopf, sonst identischer Öl-Vertrag | bestanden: beide Kopfpunkte vollständig, Text und Innenzeichnung ohne Randkontakt |

Zu jedem direkten Snapshot besteht außerdem ein Mehrgrößen-/Profil-Snapshot unter
`packages/catalog/src/__snapshots__/multi-size/recipe.I.1.13.svg` bis
`recipe.I.1.16.svg`.

## Lokaler Originalvergleich

Ein separater ignorierter Lauf rasterte die vier lokalen Original-SVGs bei 900 px auf weißem
Hintergrund. Die Sichtung in Originalauflösung bestätigte Kopfanzahl, Rahmen, Lage und Größe der
Innengeometrien. Bei I.1.13/I.1.14 bildet die obere Innenzeichnung wie in der Quelle genau eine
geschlossene, schwarz gefüllte Scheiben-/Schaft-/Klammerkontur. Ein unabhängiger Diff-Review
verwarf die erste Rekonstruktion aus sechs getrennten Primitiven; der Regressionstest verlangt
seitdem den einzelnen Pfad und dessen exakte sichtbare Bounds. Wellen und Even-odd-Raute treffen
die eigene, tiefer gesetzte Fassung. I.1.15/I.1.16 teilen die untere Wasser-/Rautengeometrie nicht nur
visuell, sondern als bytegleichen Quellenpfad mit I.1.17/I.1.18.

Die Form der Arimo-Glyphen ist erkennbar nicht pixelidentisch mit der in Pfade umgewandelten
Referenzschrift. Literaltext `Öl`, Mittelanker, Grundlinie, Versalhöhe, Umlautpunkte und
Lesbarkeit stimmen mit dem erklärten Katalogvertrag überein. Das ist eine dokumentierte
Typografiegrenze, keine offene Geometrie- oder Scopeabweichung. Die privaten Referenzraster und
Quell-SVGs werden nicht committed oder veröffentlicht.

## Output-only Artefakte

| Artefakt | Pixelmaß | Datei-SHA-256 |
|---|---:|---|
| `out/lfh-484/contact-sheet/LFH-484-anhang-i-f.png` | 1200 × 1200 | `1a1470f8af33751c034baff5dd89da1c6afd7bca1445ec79ca0981b02e15d47d` |
| `out/lfh-484/contact-sheet/I.1.13.png` | 900 × 900 | `d873883c08bb410ec0f73cd2b17c857363ad370cb4c969d81e95e3bd41ba0145` |
| `out/lfh-484/contact-sheet/I.1.14.png` | 900 × 900 | `b6fac77637cca833fea972b62dea181f37e47dcf919d77e6842ee0eb6d90249d` |
| `out/lfh-484/contact-sheet/I.1.15.png` | 900 × 900 | `efef1753d8f85737615e68419e9b84f3b59f155b62c69e0161cdf9092de3ede8` |
| `out/lfh-484/contact-sheet/I.1.16.png` | 900 × 900 | `928897410c60fb3463bddebacedb62a29817860df90ee72502eb9a331d82d57f` |

Der SHA-256 von `manifest.json` ist
`87b70fc8765cd13118230b2e8d8660d675c1c8ba27d407fbda47cdd9345936fb`; der Generator selbst hat
SHA-256 `ad6a513534cbb4a6b0208e55531fa4530a09c01324f42299aca30c94253a91a1`.

Überblick und alle vier Einzelbilder wurden in Originalauflösung gesichtet. Die fünf PNGs, ihr
Generator und der private Referenzlauf bleiben unter `out/` ignoriert; nur die acht SVG-Snapshots
und dieses Protokoll sind Teil der eingecheckten Regressionsevidenz.
