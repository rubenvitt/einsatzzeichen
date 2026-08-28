# Arimo (Variable Font)

- **Schriftname:** Arimo
- **Version:** 1.341 (Variable Font, Achse `wght`) — gelesen aus `fontRevision` der `head`-Tabelle
  (Rohwert 87884 / 65536 = 1.34100…), bestätigt durch die Namenstabelle (`file(1)`).
- **Bezugsquelle:** https://raw.githubusercontent.com/google/fonts/main/ofl/arimo/Arimo%5Bwght%5D.ttf
- **Abrufdatum:** 2026-08-09
- **Upstream-Datei:** `Arimo[wght].ttf` (496.268 Byte),
  SHA-256 `e43898b143ec826ac8cb4034816458a7047fbe0836558de2a1f8c6223ae3e0ca`
  (nicht im Repository; `TEXT_FONT_SOURCE_SHA256` in `src/fonts.ts`)
- **Eingecheckte Datei:** `Arimo[wght].ttf` als Subset (82.756 Byte, −83,3 %),
  SHA-256 `e68be22b52529b0541129578216dab440cb00026114868370b6d34798b2ce5a3`
  (`TEXT_FONT_SHA256` in `src/fonts.ts`) — siehe Abschnitt „Subsetting" unten.
- **Lizenz:** SIL Open Font License, Version 1.1 — vollständiger Text in `Arimo-OFL.txt`
  (gleiche Bezugsquelle: https://raw.githubusercontent.com/google/fonts/main/ofl/arimo/OFL.txt,
  abgerufen 2026-08-09).

Hinweis: Die in der Schriftdatei eingebettete Copyright-Zeile nennt "Copyright 2020 The Arimo
Project Authors", `Arimo-OFL.txt` dagegen "Copyright 2026 The Arimo Project Authors" — Letzteres
ist vermutlich ein bei jedem Abruf aktualisierter Platzhalter im Google-Fonts-Repository, keine
inhaltliche Änderung der Lizenzbedingungen. Beide Stände sind hier unverändert dokumentiert.

## Warum Arimo

Arimo ist metrisch Arial-kompatibel und deckt damit dieselbe Zeichenbreitenlogik ab, die Anhang J
über die Buchstabenkürzel unterstellt. Der naheliegende Kandidat Liberation Sans — ebenfalls
metrisch Arial-kompatibel und unter derselben Lizenz — hat keine stabile TTF-Bezugsquelle: sein
GitHub-Release trägt keine Assets (geprüft am 2026-08-09).

## Subsetting (2026-08-28)

Die eingecheckte Datei ist eine nach OFL §1 zulässige „Modified Version" des Originals: ein
Glyphen-Subset, erzeugt mit **fontTools 4.63.0** (`pyftsubset`) durch
`scripts/font/subset-arimo.sh`. Das Skript lädt das Original nach `out/font/` (gitignored),
prüft dessen SHA-256 gegen den Upstream-Wert und ruft auf:

```
pyftsubset 'Arimo[wght].ttf' --output-file=packages/catalog/assets/Arimo[wght].ttf \
  --unicodes='U+0000-00FF,U+0100-017F,U+0180-024F,U+2000-206F,U+20AC,U+2122,U+2212,U+FEFF,U+FFFD' \
  --layout-features='*' --notdef-glyph --notdef-outline --recommended-glyphs \
  --name-IDs='*' --name-legacy --name-languages='*' --glyph-names \
  --no-prune-unicode-ranges --no-prune-codepage-ranges --no-recalc-bounds
```

- **Unicode-Range:** `designation` ist ein freier String (deutsche Freitexteingaben), daher nicht
  der heutige Zeichenbestand des Katalogs, sondern die Decke: Basic Latin + Latin-1 (Umlaute, ß,
  §, °), Latin Extended-A/B (Ł, ć, š, ž — Namen und Orte), General Punctuation (Gedankenstrich,
  deutsche Anführungszeichen, geschützte Leerzeichen), €, ™, U+2212 Minus, BOM, U+FFFD. 645 von
  3.301 Codepoints bleiben, 686 Glyphen (mit Komponenten und Layout-Zielen).
- **Achsenerhalt:** Die `wght`-Achse 400–700 wird **nicht** instanziiert (`fvar`, `gvar`, `HVAR`,
  `STAT` bleiben), weil `packages/cli/src/commands/visual-proof.ts` mit `font-weight="700"`
  beschriftet und die Kontaktbögen `font-weight="bold"` setzen.
- **Unverändert:** Hinting (`prep`, `gasp`), `head`/`hhea`/`OS/2` (kein Recalc der Grenzen, keine
  Kürzung der Unicode-/Codepage-Ranges) — core leitet seine Konstanten aus `unitsPerEm=2048`,
  `ascender=1854`, `descender=-434`, `sCapHeight=1409` ab. Die Namenstabelle bleibt vollständig;
  die OFL nennt keinen Reserved Font Name, der Familienname „Arimo" darf im Subset bleiben.
- **Größe / Prüfsummen:** 496.268 → 82.756 Byte;
  Original `e43898b1…3ae3e0ca`, Subset `e68be22b…8b2ce5a3` (vollständig oben und in `src/fonts.ts`).
- **Nachweis der Rasterungsgleichheit:** Mit dem Subset an Stelle des Originals blieben alle
  256 SVG-Snapshots (`src/__snapshots__/`) und 526 Kontaktbögen mit gerasterten PNGs
  (`src/__snapshots__/multi-size/`) unverändert (`git status` an `__snapshots__` leer;
  `snapshots.test.ts`, `multi-size-snapshots.test.ts`, `pictograms/text-ink.test.ts`,
  `body-marks.test.ts` grün). Der erste Flag-Satz war bereits bit-identisch; weitere Varianten
  (`--retain-gids`, `--passthrough-tables`) waren nicht nötig.
- **Metriken:** `arimo-metrics.json` (Vorschubbreiten `advances` und glyf-Tintenboxen
  `inkExtents` `[xMin, yMin, xMax, yMax]` aller 645 cmap-Einträge in Font-Einheiten der
  Default-Instanz wght 400, leere Glyphen als `[0, 0, 0, 0]`; Unterschneidung `kerning`
  `{ links: { rechts: XAdvance } }` aus dem GPOS-Feature `kern`, nur Werte ≠ 0; Kopfwerte;
  beide SHA-256) wird von `scripts/font/export-metrics.py`
  aus dem Subset exportiert; `src/fonts.test.ts` gleicht sie gegen die TTF ab.
