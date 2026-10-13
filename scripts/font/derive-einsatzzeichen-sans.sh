#!/usr/bin/env bash
# Erzeugt die eingecheckte Katalogschrift „Einsatzzeichen Sans" reproduzierbar aus den
# Upstream-Originalen von IBM Plex Sans (LFH-790, Option C, Weg R): vier statische Instanzen in
# packages/conformance/assets/ (Regular 400, Medium 500, Bold 700, Medium Italic 500), je Datei die
# Textmetriken in packages/core/src/assets/ und am Ende die Browser-Schriften (WOFF2) in
# packages/core/fonts/.
#
# Warum eingecheckte Derivate statt eines Build-Schritts: Die CI hat kein Python, es gibt keine
# Build-Kette für Assets, und die Kontaktbögen unter __snapshots__/multi-size sind gerasterte PNGs —
# der Nachweis muss an genau der Datei geführt werden, die im Repository liegt. Das Skript ist die
# Provenienzkette, die Prüfgates in fonts.test.ts (Hash, Metrik-Invarianten, cmap-Abdeckung) sind
# das Sicherungsnetz.
#
# Ablauf je Original: nach out/font/ laden (out/ ist gitignored) → SHA-256 gegen den in fonts.ts
# gepinnten Wert prüfen → pyftsubset (Achsen bleiben) → Instanz bei wdth 86 und der Stufe,
# umbenannt (derive_instance.py) → Metriken exportieren.
#
# Die Quellen sind die variablen Dateien aus google/fonts (Achsen wght 100–700, wdth 75–100).
# Plex ist eine OFL-Schrift mit dem reservierten Namen „Plex"; eine veränderte Fassung (Teilmenge,
# Instanz) darf ihn nicht führen. Deshalb heißt die Ableitung „Einsatzzeichen Sans".
#
# Voraussetzungen: curl, shasum, fontTools 4.66 oder neuer mit Brotli
# (pipx install 'fonttools[woff]'). Die Python-Umgebung mit fontTools kann über FONTTOOLS_PYTHON
# überschrieben werden, pyftsubset über PYFTSUBSET; Standard ist die pipx-venv.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ASSETS="$ROOT/packages/conformance/assets"
METRICS_DIR="$ROOT/packages/core/src/assets"
OUT="$ROOT/out/font"
UPSTREAM='https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexsans'
SOURCE_URL="$UPSTREAM/IBMPlexSans%5Bwdth,wght%5D.ttf"
# Muss mit TEXT_FONT_SOURCE_SHA256 in packages/conformance/src/fonts.ts übereinstimmen.
SOURCE_SHA256='3b031aa4216174205bd8471f88a49b91f093169e9e87bd5262242bc5967fe2e3'
SOURCE_TTF="$OUT/IBMPlexSans[wdth,wght]-source.ttf"
SUBSET_TTF="$OUT/IBMPlexSans[wdth,wght]-subset.ttf"
ITALIC_SOURCE_URL="$UPSTREAM/IBMPlexSans-Italic%5Bwdth,wght%5D.ttf"
# Muss mit TEXT_FONT_ITALIC_SOURCE_SHA256 in packages/conformance/src/fonts.ts übereinstimmen.
ITALIC_SOURCE_SHA256='0b94c5e981993764db32bf9c610ecc60cbd34ad77ec2f10ba03c64ab75124d8e'
ITALIC_SOURCE_TTF="$OUT/IBMPlexSans-Italic[wdth,wght]-source.ttf"
ITALIC_SUBSET_TTF="$OUT/IBMPlexSans-Italic[wdth,wght]-subset.ttf"
LICENSE_URL="$UPSTREAM/OFL.txt"
LICENSE_SHA256='7e6b2818edbd8f6a01ae80641cc8f16a51080d08fb4e532be3a0b6f74adb07da'
LICENSE_TXT="$ASSETS/EinsatzzeichenSans-OFL.txt"
PYFTSUBSET="${PYFTSUBSET:-$HOME/.local/bin/pyftsubset}"
FONTTOOLS_PYTHON="${FONTTOOLS_PYTHON:-$HOME/.local/pipx/venvs/fonttools/bin/python}"

mkdir -p "$OUT"
# Lädt ein Upstream-Original, falls es noch nicht in out/font/ liegt, und prüft seine Prüfsumme.
fetch_source() {
  local url="$1" target="$2" expected="$3" actual
  if [[ ! -f "$target" ]]; then
    echo "Lade Upstream-Original von $url"
    curl -sSL --fail -o "$target" "$url"
  fi
  actual="$(shasum -a 256 "$target" | cut -d' ' -f1)"
  if [[ "$actual" != "$expected" ]]; then
    echo "Upstream-Original hat unerwartete Prüfsumme: $actual (erwartet $expected)" >&2
    echo "Datei liegt unter $target — nicht ersetzt, nichts erzeugt." >&2
    exit 1
  fi
}
fetch_source "$SOURCE_URL" "$SOURCE_TTF" "$SOURCE_SHA256"
fetch_source "$ITALIC_SOURCE_URL" "$ITALIC_SOURCE_TTF" "$ITALIC_SOURCE_SHA256"
fetch_source "$LICENSE_URL" "$OUT/OFL.txt" "$LICENSE_SHA256"
cp "$OUT/OFL.txt" "$LICENSE_TXT"

# Unicode-Range: `designation` ist ein freier String (deutsche Freitexteingaben), daher nicht
# der heutige Zeichenbestand, sondern die Decke: Latin-1, Latin Extended-A/B (Ł, ć, š, ž …),
# General Punctuation (Gedankenstrich, deutsche Anführungszeichen), €, ™, Minus, BOM, U+FFFD.
# Dieselben Argumente wie früher bei Arimo. Achsen und Hinting bleiben im Subset; instanziiert wird
# erst danach. --no-recalc-bounds / --no-prune-unicode-ranges: head/OS/2 bleiben unverändert —
# core leitet Konstanten aus unitsPerEm, ascender, descender und sCapHeight ab.
# Die Kursive bekommt genau dieselben Argumente: dieselbe Zeichendecke, damit ein freier kursiver
# Lauf dieselben Zeichen führt wie ein aufrechter.
subset_font() {
  "$PYFTSUBSET" "$1" \
    --output-file="$2" \
    --unicodes='U+0000-00FF,U+0100-017F,U+0180-024F,U+2000-206F,U+20AC,U+2122,U+2212,U+FEFF,U+FFFD' \
    --layout-features='*' \
    --notdef-glyph --notdef-outline --recommended-glyphs \
    --name-IDs='*' --name-legacy --name-languages='*' \
    --glyph-names \
    --no-prune-unicode-ranges --no-prune-codepage-ranges \
    --no-recalc-bounds
}
subset_font "$SOURCE_TTF" "$SUBSET_TTF"
subset_font "$ITALIC_SOURCE_TTF" "$ITALIC_SUBSET_TTF"

# derive <subset> <Dateistil> <wght> <upright|italic> <Metrikdatei> <Original-SHA-256>
derive() {
  local target="$ASSETS/EinsatzzeichenSans-$2.ttf"
  "$FONTTOOLS_PYTHON" "$ROOT/scripts/font/derive_instance.py" "$1" "$target" "$3" "$4"
  "$FONTTOOLS_PYTHON" "$ROOT/scripts/font/export-metrics.py" "$target" "$6" "$METRICS_DIR/$5"
  echo "$(basename "$target"): $(wc -c < "$target" | tr -d ' ') Byte, SHA-256 $(shasum -a 256 "$target" | cut -d' ' -f1)"
}
# 400: fremde IR ohne fontWeight und die Lückenbeschriftungen aus Kapitel 2.
derive "$SUBSET_TTF" Regular 400 upright einsatzzeichen-sans-metrics.json "$SOURCE_SHA256"
# 500: aller Katalogtext (CATALOG_TEXT_FONT_WEIGHT).
derive "$SUBSET_TTF" Medium 500 upright einsatzzeichen-sans-medium-metrics.json "$SOURCE_SHA256"
# 700: fremde IR mit 700, visual-proof.ts und die Bildunterschriften der Kontaktbögen.
derive "$SUBSET_TTF" Bold 700 upright einsatzzeichen-sans-bold-metrics.json "$SOURCE_SHA256"
# Kursiv 500: D.1.1 „Bezeichnung". resvg gibt jedem kursiven Lauf diese Datei.
derive "$ITALIC_SUBSET_TTF" MediumItalic 500 italic einsatzzeichen-sans-medium-italic-metrics.json "$ITALIC_SOURCE_SHA256"

echo "Original:  $(wc -c < "$SOURCE_TTF" | tr -d ' ') Byte, SHA-256 $SOURCE_SHA256"
echo "Kursiv:    $(wc -c < "$ITALIC_SOURCE_TTF" | tr -d ' ') Byte, SHA-256 $ITALIC_SOURCE_SHA256"

# Browser-Schriften für @einsatzzeichen/core/fonts (LFH-832): dieselben vier Stufen als WOFF2.
"$FONTTOOLS_PYTHON" "$ROOT/scripts/font/build-woff2.py"
