#!/usr/bin/env bash
# Erzeugt das eingecheckte Arimo-Subset (packages/catalog/assets/Arimo[wght].ttf) reproduzierbar
# aus dem Upstream-Original und exportiert die Textmetriken (arimo-metrics.json).
#
# Warum ein eingechecktes Derivat statt eines Build-Schritts: Die CI hat kein Python, es gibt
# keine Build-Kette für Assets, und die 526 Kontaktbögen unter __snapshots__/multi-size sind
# gerasterte PNGs — der Nachweis „Subset rastert bit-identisch" muss an genau der Datei geführt
# werden, die im Repository liegt. Das Skript ist die Provenienzkette, die Prüfgates in
# fonts.test.ts (Hash, Metrik-Invarianten, cmap-Abdeckung) sind das Sicherungsnetz.
#
# Ablauf: Original nach out/font/ laden (out/ ist gitignored) → SHA-256 gegen den in fonts.ts
# gepinnten Upstream-Wert prüfen → pyftsubset → Metriken exportieren → beide SHA-256 ausgeben.
#
# Voraussetzungen: curl, shasum, fontTools 4.63.0 (pipx install fonttools). Die Python-Umgebung
# mit fontTools kann über FONTTOOLS_PYTHON überschrieben werden; Standard ist die pipx-venv.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ASSETS="$ROOT/packages/catalog/assets"
OUT="$ROOT/out/font"
SOURCE_URL='https://raw.githubusercontent.com/google/fonts/main/ofl/arimo/Arimo%5Bwght%5D.ttf'
# Muss mit TEXT_FONT_SOURCE_SHA256 in packages/catalog/src/fonts.ts übereinstimmen.
SOURCE_SHA256='e43898b143ec826ac8cb4034816458a7047fbe0836558de2a1f8c6223ae3e0ca'
SOURCE_TTF="$OUT/Arimo[wght]-source.ttf"
SUBSET_TTF="$ASSETS/Arimo[wght].ttf"
METRICS_JSON="$ASSETS/arimo-metrics.json"
PYFTSUBSET="${PYFTSUBSET:-$HOME/.local/bin/pyftsubset}"
FONTTOOLS_PYTHON="${FONTTOOLS_PYTHON:-$HOME/.local/pipx/venvs/fonttools/bin/python}"

mkdir -p "$OUT"
if [[ ! -f "$SOURCE_TTF" ]]; then
  echo "Lade Upstream-Original von $SOURCE_URL"
  curl -sSL --fail -o "$SOURCE_TTF" "$SOURCE_URL"
fi
actual="$(shasum -a 256 "$SOURCE_TTF" | cut -d' ' -f1)"
if [[ "$actual" != "$SOURCE_SHA256" ]]; then
  echo "Upstream-Original hat unerwartete Prüfsumme: $actual (erwartet $SOURCE_SHA256)" >&2
  echo "Datei liegt unter $SOURCE_TTF — nicht ersetzt, nichts erzeugt." >&2
  exit 1
fi

# Unicode-Range: `designation` ist ein freier String (deutsche Freitexteingaben), daher nicht
# der heutige Zeichenbestand, sondern die Decke: Latin-1, Latin Extended-A/B (Ł, ć, š, ž …),
# General Punctuation (Gedankenstrich, deutsche Anführungszeichen), €, ™, Minus, BOM, U+FFFD.
# Bewusst KEIN --no-hinting und KEIN Instanziieren der wght-Achse: die Rasterung durch resvg
# muss bit-identisch bleiben, und visual-proof.ts nutzt font-weight 700 (Achse bleibt erhalten,
# fvar/gvar/HVAR/STAT nimmt pyftsubset für variable Schriften standardmäßig mit).
# --no-recalc-bounds / --no-prune-unicode-ranges: head/OS/2 bleiben unverändert — core leitet
# Konstanten aus unitsPerEm, ascender, descender und sCapHeight ab.
"$PYFTSUBSET" "$SOURCE_TTF" \
  --output-file="$SUBSET_TTF" \
  --unicodes='U+0000-00FF,U+0100-017F,U+0180-024F,U+2000-206F,U+20AC,U+2122,U+2212,U+FEFF,U+FFFD' \
  --layout-features='*' \
  --notdef-glyph --notdef-outline --recommended-glyphs \
  --name-IDs='*' --name-legacy --name-languages='*' \
  --glyph-names \
  --no-prune-unicode-ranges --no-prune-codepage-ranges \
  --no-recalc-bounds

"$FONTTOOLS_PYTHON" "$ROOT/scripts/font/export-metrics.py" "$SUBSET_TTF" "$SOURCE_SHA256" "$METRICS_JSON"

echo "Original: $(wc -c < "$SOURCE_TTF" | tr -d ' ') Byte, SHA-256 $SOURCE_SHA256"
echo "Subset:   $(wc -c < "$SUBSET_TTF" | tr -d ' ') Byte, SHA-256 $(shasum -a 256 "$SUBSET_TTF" | cut -d' ' -f1)"
echo "Metriken: $METRICS_JSON"
