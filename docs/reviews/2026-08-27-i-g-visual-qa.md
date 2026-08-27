# Visual QA: Anhang I-g / LFH-485

Datum: 27. August 2026
Scope: I.1.17 bis I.1.20
Status: output-only Sichtprüfung und technischer Referenzabgleich bestanden; Domain-Reviews pending

## Prüfaufbau

Der ignorierte Generator `out/tools/generate-lfh485-contact-sheet.ts` liest ausschließlich die
vier eingecheckten direkten Katalog-Snapshots und die Titel aus `RECIPES`. Er rastert daraus einen
1200 × 1200-px-Überblick und vier 1560 × 980-px-Detailansichten. Originalreferenzen, lokale
Quellpfade und private Vergleichsbilder sind weder Eingabe noch sichtbarer Inhalt dieser
Artefakte.

Der unmittelbar auf die Generierung folgende Verify-Lauf

```text
rtk mise exec -- pnpm exec tsx out/tools/generate-lfh485-contact-sheet.ts --verify
verified 5 png outputs
```

rekonstruierte alle fünf PNGs bytegleich und verglich sie zusammen mit dem stabil serialisierten
Manifest. Die direkten und Mehrgrößen-Snapshot-Gates sowie die vollständige Renderfallmenge waren
zuvor grün; das technische Manifestreview wurde erst nach dieser Sichtprüfung freigegeben.

## Einzelprotokoll

| Rezept | direkter Snapshot | Mehrgrößen-Snapshot | sichtbarer Vertrag | Sichtprüfung | offene Domain-Frage |
|---|---|---|---|---|---|
| `I.1.17` | `packages/catalog/src/__snapshots__/I.1.17.svg` | `packages/catalog/src/__snapshots__/multi-size/recipe.I.1.17.svg` | Truppkopf, `Strömungsrettung` oben mittig, zwei kompakte Wellen und untere Raute | bestanden: Text, Wellen und Raute getrennt lesbar; kein Clipping oder Randkontakt | Bestätigt eine fachkundige Person Einheit und Organisationszuordnung? |
| `I.1.18` | `packages/catalog/src/__snapshots__/I.1.18.svg` | `packages/catalog/src/__snapshots__/multi-size/recipe.I.1.18.svg` | Gruppenkopf bei ansonsten identischem Wasserrettungs-/Textvertrag | bestanden: beide Kopfpunkte vollständig; Text und Innenmarke unverändert lesbar | Bestätigt eine fachkundige Person Gruppe und Organisationszuordnung? |
| `I.1.19` | `packages/catalog/src/__snapshots__/I.1.19.svg` | `packages/catalog/src/__snapshots__/multi-size/recipe.I.1.19.svg` | Truppkopf, oberes Dreieckspaar, kompakte Wasserrettungsmarke | bestanden: Dreiecke berühren sich nur an der Spitze und bleiben klar von den Wellen getrennt | Bezeichnet die Geometrie fachlich luftunterstützte Wasserrettung? |
| `I.1.20` | `packages/catalog/src/__snapshots__/I.1.20.svg` | `packages/catalog/src/__snapshots__/multi-size/recipe.I.1.20.svg` | Truppkopf, einzelner oberer Winkel, kompakte Wasserrettungsmarke | bestanden: Winkel bleibt offen und klar von Wellen und Raute getrennt | Bezeichnet die Geometrie fachlich einen Drohnentrupp? |

Ein unabhängiger Spec-Review verglich die gerenderten I.1.17- bis I.1.20-Snapshots zusätzlich mit
den vier lokalen Referenz-SVGs. Er fand keine weitere Geometrie-, Semantik- oder Scopeabweichung.
Insbesondere werden weder die deutlich größere Kapitel-4-Wasserrettungsfassung noch die
kombinierte Winkel-/Dreiecksmarke aus F.1.16 übernommen. Das ist ein technischer Abgleich, keine
fachliche Freigabe und keine Behauptung von Pixelidentität der Typografie.

Die separat vermessene I-g-Geometrie ist unter der technischen ID
`formation-water-rescue-lower-zone` registriert. Dadurch kann sie weder die I-e-ID
`water-rescue` noch die I-d-ID `formation-water-rescue-compact` still überschreiben.

## Output-only Artefakte

| Artefakt | Pixelmaß | SHA-256 |
|---|---:|---|
| `out/lfh-485/contact-sheet/LFH-485-anhang-i-g.png` | 1200 × 1200 | `42b53dd6a8f4e22bb4335b09eb1a267d8c2cfa58d54e32060b664c7a50142b68` |
| `out/lfh-485/contact-sheet/I.1.17.png` | 1560 × 980 | `da8ce87b666b5952cc3dd7463827ad3fefefa3f52418a2dfacc6475a664e315e` |
| `out/lfh-485/contact-sheet/I.1.18.png` | 1560 × 980 | `92143871db99c8a486587778da8025e679943a885946107f7862d5fac44d518c` |
| `out/lfh-485/contact-sheet/I.1.19.png` | 1560 × 980 | `9b473a6d4eb68963d980c7b66cc0aeaace6c006b046df2aae58bdb9234c0adb5` |
| `out/lfh-485/contact-sheet/I.1.20.png` | 1560 × 980 | `b73d8fdfc6738dfc891df8816ffc712b32075bf314c1a231201538f1a3bd23a3` |

Der SHA-256 des zugehörigen `manifest.json` ist
`ac4d245af314e83020f652d93c6565a975b827c6b5d7626a938ac213635908db`; der Generator selbst hat
SHA-256 `b79462b49ba10f59eaefa71c49dd94489907cd14494b60eb0ef655f42c8b28d7`.

Überblick und alle vier Detailansichten wurden in Originalauflösung gesichtet. Kartenrahmen,
Überschriften, Titel und Erläuterungen überlagern die Zeichen nicht. Der Übersichtsbogen enthält
keine Originalreferenz, keinen Referenzdateinamen und keine lokale Verzeichnisangabe. Die fünf
PNG-Ausgaben und ihr Generator bleiben absichtlich unter `out/` ignoriert; die acht SVG-Snapshots
sind dagegen Teil der eingecheckten Regressionsevidenz.
