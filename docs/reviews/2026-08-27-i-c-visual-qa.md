# Visual QA: Anhang I-c

Datum: 27. August 2026  
Scope: I.1.1 bis I.1.4  
Status: technische Semantik, output-only Sichtprüfung und lokaler Originalvergleich abgeschlossen;
alle Domain-Reviews `pending`

## Prüfaufbau

Der ignorierte Generator `out/tools/generate-lfh481-output-only.ts` liest für den
veröffentlichbaren Nachweis ausschließlich die vier live registrierten Rezepte, die vier direkten
SVG-Snapshots und die vier eingecheckten Mehrgrößen-Snapshots. Er validiert die exakte
I.1.1-bis-I.1.4-Matrix, prüft die direkten 64-px-Snapshotbytes gegen eine frische Katalogausgabe,
rastert die direkte Ausgabe bei 900 px und bindet die projektweit festgelegte Arimo-Datei über
`resvgFontOptions()` mit deaktivierten Systemschriften.

Der Kontaktbogen enthält nur generierte Ausgaben. Der Generator liest keine Originalreferenz und
bricht ab, falls ein lokaler Quellpfad, ein Referenzfeld oder einer der Originaldateinamen in die
veröffentlichbare Ausgabe gelangt. Generator und PNGs bleiben unter `out/` ignoriert.

```text
rtk mise exec -- pnpm exec tsx out/tools/generate-lfh481-output-only.ts
rtk mise exec -- pnpm exec tsx out/tools/generate-lfh481-output-only.ts --verify
```

Der unmittelbar folgende Verify-Lauf rekonstruierte Screenshot und Manifest bytegleich. Der
fokussierte Provenienz-/Snapshot-Lauf war zuvor mit 1.760/1.760 Tests grün.

## Output-only Artefakte

Erzeuger-Commit: `6cd60807abbd262405981dd1d67cdc21abfe2c83`

| Artefakt | Abmessungen | SHA-256 |
|---|---:|---|
| `out/lfh-481/contact-sheet/LFH-481-i-c-direct.png` | 1500 × 1540 px | `91f26d6744d645f4bda755ec910470221508ad3af6e33068d387489d44e2d565` |
| `out/lfh-481/contact-sheet/LFH-481-i-c-generated.png` | 1600 × 3000 px | `4c6475f37b2edfbc4f28a79736d685346ac2a05d539177712e7648b76c792059` |
| `out/lfh-481/contact-sheet/manifest.json` | vier Rezeptzeilen und zwei Outputbindungen | `f3dfa356f71e78643d31d9ae2fca998557f46d9bf91666ef17e83abe96b5b9fa` |

Beide PNGs wurden in Originalauflösung vollständig gesichtet. Titel, Abschnitt und Spalten sind
lesbar. Kein Kopf, Rahmen oder Innenzeichen wird abgeschnitten. Der große Kontaktbogen zeigt alle
Stufen von 16 bis 256 px sowie `accessible-light` und `print-monochrome`; direkte Ausgabe und
Mehrgrößen-Snapshot stimmen in Kopfanzahl beziehungsweise Balken, Körper und Innenmarke überein.

## Lokaler Originalvergleich

Die vier Originale wurden getrennt vom output-only Generator bei 900 px auf weißem Canvas gegen
die aktuellen Katalogausgaben geprüft. Originalbytes, lokale Quellpfade und Paarbilder sind weder
eingecheckt noch im PR-Bild enthalten.

| Rezept | SHA-256 der lokalen Eingabe | Beobachtung |
|---|---|---|
| I.1.1 | `bd4906894897e337a9af8255f4763eade718dbefbd9de2fd8310820a1a0997d3` | ein Kreis bei `(16|3,5)`; Rahmen, zwei Wellen und Raute stimmen |
| I.1.2 | `172339e9c98ed1d862ded6fe499a5a63f4258a078121a72a6cb102ca0c55db04` | zwei Kreise bei `x = 11/21`; keine Zusatzmarke oder Verschiebung |
| I.1.3 | `d0b9f7bfa913b0b2b73a038b84189ed9d38789630d47659486e45d8bec716528` | drei Kreise bei `x = 11/16/21`; Abstände und Innenmarke stimmen |
| I.1.4 | `35e6b2fdafa2220074b770defb9457f278dc8b56ece737307331012bed12c73a` | einzelner Balken `15,25…16,75/1…5`; keine Kreis-, Verwaltungs- oder globale Verbandsstärke |

Im unabhängigen Rastervergleich waren die Körperrahmen pixelgleich. Über die vier Bilder wichen
`0,0619–0,0683 %` der Pixel ab; die RGBA-RMSE lag ungefähr bei `2,10/255`, die
Dark-Pixel-IoU der Innenmarke bei `99,33–99,37 %`. Die Restdifferenzen liegen an geglätteten
Innenkanten und wenigen pfadkonvertierten Kopfkreispixeln, nicht an Rahmen oder Platzierung.

Die Originale besitzen eine explizit weiße Füllung, während die organisationslosen
Katalogkörper transparent sind. Der Vergleich belegt deshalb die visuelle Übereinstimmung auf
weißem Canvas, nicht opakes Weiß auf jedem Hintergrund und ausdrücklich keine
Organisationszuordnung.

## Einzelprotokoll und Ergebnis

| Rezept | direkter Snapshot | Mehrgrößen-Snapshot | Semantik- und Sichtprüfung |
|---|---|---|---|
| `I.1.1` | `packages/catalog/src/__snapshots__/I.1.1.svg` | `packages/catalog/src/__snapshots__/multi-size/recipe.I.1.1.svg` | bestanden: Truppkreis, normale Hülle und Wasserrettungsmarke vollständig |
| `I.1.2` | `packages/catalog/src/__snapshots__/I.1.2.svg` | `packages/catalog/src/__snapshots__/multi-size/recipe.I.1.2.svg` | bestanden: zwei Gruppenkreise, gleiche Körper- und Innengeometrie |
| `I.1.3` | `packages/catalog/src/__snapshots__/I.1.3.svg` | `packages/catalog/src/__snapshots__/multi-size/recipe.I.1.3.svg` | bestanden: drei Zugkreise, gleichmäßige Abstände, keine Zusatzsemantik |
| `I.1.4` | `packages/catalog/src/__snapshots__/I.1.4.svg` | `packages/catalog/src/__snapshots__/multi-size/recipe.I.1.4.svg` | bestanden: technische Einzelmarke und barrierefreie Beschreibung ohne behauptete Verbandsstärke |

Alle vier technischen Sichtprüfungen sind bestanden. Die offene fachliche Einordnung bleibt davon
getrennt: Die vier Domain-Reviews bleiben `pending`.
