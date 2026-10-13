# Einsatzzeichen Sans

Die Katalogschrift. Sie ist aus **IBM Plex Sans** abgeleitet (Teilmenge, eine geeichte Breite,
vier statische Stufen) und umbenannt, weil „Plex" ein reservierter Name der OFL ist. Entscheidung,
Messung und Lizenzabwägung: `docs/decisions/2026-09-29-lfh-790-ersatzschrift-option-c.md`
(Abschnitt 10). Umgesetzt mit ESZ-114; bis dahin setzte der Katalog Arimo (LFH-585).

| Datei | Stufe | Byte | SHA-256 | Konstante in `src/fonts.ts` |
|---|---|---|---|---|
| `EinsatzzeichenSans-Regular.ttf` | 400 | 89.208 | `c6bc161fc5f493dc032a2f93930960cbe50afc0b7a689d18a493c2c87b832a3e` | `TEXT_FONT_SHA256` |
| `EinsatzzeichenSans-Medium.ttf` | 500, aller Katalogtext | 89.324 | `bbc9fd666da63061d9eee5d45b7be09a4e5e018fb51a739c2f82c180ac900573` | `TEXT_FONT_MEDIUM_SHA256` |
| `EinsatzzeichenSans-Bold.ttf` | 700 | 89.168 | `537adabfc02caa06f6a8d93b77d6ad11383d3c579d780f259fe37f08dc66a805` | `TEXT_FONT_BOLD_SHA256` |
| `EinsatzzeichenSans-MediumItalic.ttf` | 500 kursiv | 94.360 | `4f0476a9d3a73853264dd621b45124ba9c2a8b7e7b8ba14bcea7454010be0f50` | `TEXT_FONT_MEDIUM_ITALIC_SHA256` |
| `EinsatzzeichenSans-OFL.txt` | Lizenz | 4.456 | `7e6b2818edbd8f6a01ae80641cc8f16a51080d08fb4e532be3a0b6f74adb07da` | |

## Quelle

Beide Originale aus google/fonts, Verzeichnis `ofl/ibmplexsans/`, Version 3.201, Achsen
`wght` 100–700 und `wdth` 75–100. Sie liegen nicht im Repository; das Skript lädt sie nach
`out/font/` (gitignored) und prüft die Prüfsummen.

- `IBMPlexSans[wdth,wght].ttf`, 537.244 Byte, SHA-256
  `3b031aa4216174205bd8471f88a49b91f093169e9e87bd5262242bc5967fe2e3` (`TEXT_FONT_SOURCE_SHA256`)
- `IBMPlexSans-Italic[wdth,wght].ttf`, 599.624 Byte, SHA-256
  `0b94c5e981993764db32bf9c610ecc60cbd34ad77ec2f10ba03c64ab75124d8e`
  (`TEXT_FONT_ITALIC_SOURCE_SHA256`)
- `OFL.txt` aus demselben Verzeichnis, eingecheckt als `EinsatzzeichenSans-OFL.txt`

## Herleitung

`scripts/font/derive-einsatzzeichen-sans.sh` erzeugt alle vier Dateien, ihre Textmetriken und die
Browser-Schriften in einem Lauf (fontTools 4.66.1). Zwei Läufe ergeben dieselben Bytes.

1. **Teilmenge** mit `pyftsubset`, für aufrecht und kursiv mit denselben Argumenten:

   ```
   --unicodes='U+0000-00FF,U+0100-017F,U+0180-024F,U+2000-206F,U+20AC,U+2122,U+2212,U+FEFF,U+FFFD'
   --layout-features='*' --notdef-glyph --notdef-outline --recommended-glyphs
   --name-IDs='*' --name-legacy --name-languages='*' --glyph-names
   --no-prune-unicode-ranges --no-prune-codepage-ranges --no-recalc-bounds
   ```

   `designation` ist ein freier String (deutsche Freitexteingaben), daher nicht der heutige
   Zeichenbestand des Katalogs, sondern die Decke: Latin-1 (Umlaute, ß, §, °), Latin Extended-A/B
   (Ł, ć, š, ž für Namen und Orte), General Punctuation (Gedankenstrich, deutsche
   Anführungszeichen, geschützte Leerzeichen), €, ™, U+2212 Minus, BOM, U+FFFD. Jede Datei führt
   396 Codepoints in 486 Glyphen. Achsen und Hinting bleiben in der Teilmenge.
2. **Instanz** mit `scripts/font/derive_instance.py`: fontTools-Instancer bei **wdth 86** und der
   Stufe. Die Breite ist auf die Laufweite der Referenz geeicht (Median 1,000 bei wght 500, Notiz
   §10.3) und gilt für alle vier Stufen, damit Läufe verschiedener Stufen gleich laufen.
   `usWidthClass` 3.
3. **Namen.** Neu in den Einträgen 1–4, 6, 16 und 17; Namenseintrag 7 (Markenhinweis „IBM Plex")
   entfällt, weil die Schrift den Namen nicht mehr führt. Eintrag 0 (Copyright von IBM) und 13/14
   (OFL) bleiben, wie die Lizenz verlangt. `STAT` und verwaiste Namen entfallen, `head.modified`
   bleibt stehen.

   | Datei | Familie (1) | Stil (2) | Typogr. Familie (16) / Stil (17) | PostScript (6) | `usWeightClass` |
   |---|---|---|---|---|---|
   | Regular | Einsatzzeichen Sans | Regular | – | `EinsatzzeichenSans-Regular` | 400 |
   | Medium | Einsatzzeichen Sans Medium | Regular | Einsatzzeichen Sans / Medium | `EinsatzzeichenSans-Medium` | 500 |
   | Bold | Einsatzzeichen Sans | Bold | – | `EinsatzzeichenSans-Bold` | 700 |
   | MediumItalic | Einsatzzeichen Sans Medium | Italic | Einsatzzeichen Sans / Medium Italic | `EinsatzzeichenSans-MediumItalic` | 500 |

4. **Metriken** mit `scripts/font/export-metrics.py` nach `packages/core/src/assets/`
   (`einsatzzeichen-sans-metrics.json`, `-medium-`, `-bold-`, `-medium-italic-metrics.json`):
   Vorschübe, glyf-Tintenboxen `[xMin, yMin, xMax, yMax]` aller cmap-Einträge, Unterschneidung aus
   dem GPOS-Feature `kern` (nur Werte ≠ 0, verlustfrei in Klassen gefasst: Plex kernt über
   Klassenpaare, ausgerollt wären es je Stufe 25 000 bis 35 000 Paare), Kopfwerte und beide
   Prüfsummen. `src/fonts.test.ts`
   gleicht sie gegen die TTFs ab.

## Kopfwerte

Alle vier Dateien: `unitsPerEm` 1000, Ascender 1025, Descender −275, `sCapHeight` 698 (am „H"
gemessen ebenfalls 698). Daraus leitet core `TEXT_CAP_HEIGHT_FRACTION` = 0,698 ab; die vertikalen
Tintenanteile in `text-policy.ts` misst `scripts/font/measure-vertical.mts`. Eine `BASE`-Tabelle
und eine `fvar`-Tabelle gibt es nicht.

Die Kursive neigt laut `post.italicAngle` um 11,3°, die Referenz um 9,0° (hingenommen wie bei
Arimo). Ihre Vorschübe weichen anders als bei Arimo von der aufrechten Stufe ab, im Grundbestand
bis U+00FF bei 168 von 191 Codepoints; deshalb hat sie eigene Metriken.

## Warum statische Stufen

`@resvg/resvg-js` 2.6 wertet die Achsen einer variablen Datei nicht aus. Mit den vier statischen
Dateien in `fontFiles` wählt resvg (geprüft mit 2.6.2, Notiz §10.5):

- ohne Angabe und `font-weight="400"`: Regular;
- `font-weight="500"`: Medium (eine Zwischenstufe wie 480 nicht);
- `font-weight="700"`: Bold;
- **jeden** kursiven Lauf, gleich welches Gewicht: MediumItalic. Deshalb lässt das Schema
  `fontStyle: 'italic'` nur zusammen mit `fontWeight: 500` zu; das Textmetrik-Gate in core prüft
  das (`unsupported-font-style`).

Der Katalog setzt allen Text in 500 (`CATALOG_TEXT_FONT_WEIGHT`, LFH-585): Die Referenz kennt nur
eine Strichstärke (0,156 × Versalhöhe), Einsatzzeichen Sans 500 trifft sie genau. 400 bleibt für
fremde IR ohne `fontWeight` und die Lückenbeschriftungen aus Kapitel 2, 700 für fremde IR, die
Beschriftung von `visual-proof.ts` und die Bildunterschriften der Kontaktbögen (die über
`defaultFontFamily` Einsatzzeichen Sans Bold bekommen). Kursiv setzt der Katalog genau einen Lauf:
„Bezeichnung" in D.1.1.

## Browser-Schriften in core

Verbraucher im Browser können dieses Paket nicht laden (`node:url`), und die TTFs stehen in keinem
`exports`-Subpfad. Deshalb liefert `@einsatzzeichen/core` die vier Stufen als WOFF2 unter
`@einsatzzeichen/core/fonts/*` aus, samt `text.css` und `OFL.txt` (byte-gleich mit
`EinsatzzeichenSans-OFL.txt`). `scripts/font/build-woff2.py` erzeugt sie am Ende des Skripts oben;
nur der Container wechselt. Die Prüfsummen stehen in `packages/core/src/font-files.test.ts`. Die
TTFs hier bleiben die Quelle für resvg und die Prüfgates.

## Lizenz

SIL Open Font License 1.1, vollständiger Text in `EinsatzzeichenSans-OFL.txt` („Copyright © 2017
IBM Corp. with Reserved Font Name "Plex""). Die Dateien sind nach OFL §1 „Modified Versions" und
stehen unter derselben Lizenz. Sie führen den reservierten Namen „Plex" nicht; die Herkunft aus
IBM Plex Sans wird hier und im Quellenregister (`ibm-plex-sans-ofl` in `src/sources.ts`) genannt,
nicht als Werbung. Selbsteinschätzung, keine Rechtsauskunft (Notiz §10.1).
