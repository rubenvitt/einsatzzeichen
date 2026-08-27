# Visual QA: Anhang I-b / LFH-487

Datum: 27. August 2026
Scope: I.2.4 bis I.2.7
Status: lokaler technischer Quellenvergleich und Ausgabeprüfung dokumentiert; Domain-,
Organisations- und Titelsemantik pending

## Prüfaufbau und Artefaktgrenze

Die lokale Paaransicht
`out/lfh-487/contact-sheet.png` zeigt vier nebeneinanderliegende Referenz-/Katalog-Paare, je eines
für I.2.4, I.2.5, I.2.6 und I.2.7. Das PNG hat `720 × 1440` px und SHA-256
`af00fc2a8f0064182959c9002c94d08356ad852e81238b5ca0ebff9aafb758bb`. Es liegt unter dem
ignorierten Verzeichnis `out/` und ist kein getracktes Artefakt.

Alle vier Paare wurden in Originalauflösung visuell geprüft. Körperkontur, Deichsel, Innenmarken
und die beiden Textläufe sind vollständig sichtbar; es wurde kein relevanter Clipping- oder
Randkontakt festgestellt. Der Bogen enthält die vier lokalen Referenzen nur in diesem privaten
Vergleich. Referenz-SVGs, Referenzpixel und weitere Vergleichsdaten bleiben ignoriert.

Weder Generator noch Manifest des Kontaktbogens werden vorgehalten. Die Sichtprüfung ist deshalb
kein Reproduzierbarkeitsnachweis und behauptet keine Pixelidentität; sie protokolliert ausschließlich
einen technischen Quellenvergleich.

## Einzelprotokoll

| Rezept / Referenzdatei | Katalogvertrag | Sichtprüfung |
|---|---|---|
| `I.2.4` / `I.2.4_Anhänger Wasserrettung.svg` | normaler Anhänger, `trailer-water-rescue`: zwei schwarze 0,5-mm-Wellen und die geschlossene große Raute; keine Textprimitive | bestanden: beide Wellen und alle vier Rautenecken sind getrennt sichtbar, ohne Clipping |
| `I.2.5` / `I.2.5_Anhänger Tauchen.svg` | normaler Anhänger, `trailer-diving`, `Tauchen` auf `x = 12,24`, `y = 11,5` mm, Versalhöhe `2.919` mm | bestanden: der links verankerte Text, beide kompakten Wellen und die kleine Raute bleiben vollständig sichtbar |
| `I.2.6` / `I.2.6_Anhänger Strömungsrettung.svg` | normaler Anhänger, dieselbe `trailer-diving`-Geometrie, `Strömungsrettung` auf `x = 17,5`, `y = 11,673` mm, Versalhöhe `2.191447` mm | bestanden: mittiger Text und Innenmarke sind vollständig sichtbar; die Vorlesebeschreibung verwendet keine Tauchen-Semantik |
| `I.2.7` / `I.2.7_Bootsanhänger.svg` | normaler Anhänger, schwarzer 12,5-mm-Bootsrumpf mit weißer Innenfläche; keine Textprimitive | bestanden: Außen- und Innenkontur sind glatt, geschlossen und vollständig sichtbar |

Die gemeinsame technische Basis ist die absolute Anhängerhülle `(4|5,75)–(31|26)` mm innerhalb
der `0 0 90.709 90.709`-ViewBox. Alle vier Specs sind `kind: 'trailer'`, besitzen keinen
`bodyVariant`, keine `vehicleCategory` und keine `chassis`-Primitive; ein Landfahrzeugvertrag wird
nicht verwendet. Die engen LFH-487-Marken sind an genau diese Hülle gebunden und lehnen verschobene
gleich große Hüllen sowie andere Arten oder Varianten fail-closed ab.

## Eingecheckte Regressionsevidenz

Die Ausgabe wird außerdem über die vier direkten und vier Mehrgrößen-Snapshots geregelt:

- `packages/catalog/src/__snapshots__/I.2.4.svg` bis `I.2.7.svg`
- `packages/catalog/src/__snapshots__/multi-size/recipe.I.2.4.svg` bis `recipe.I.2.7.svg`

Die direkten SVGs prüfen auch die neutralen Vorlesetexte, insbesondere
`Zwei Wellenlinien über einer Raute` für I.2.4. Die Mehrgrößen-Snapshots sichern die sichtbare
Ausgabe in allen getesteten Größen und Themes. Das ersetzt keine fachliche Einordnung: Domain,
Organisation und Titel der vier Darstellungen bleiben pending.
