#!/usr/bin/env bash
# Erzeugt das eingecheckte Arimo-Subset (packages/conformance/assets/Arimo[wght].ttf) und die
# daraus abgeleiteten statischen Instanzen Arimo-Bold.ttf (wght 700) und Arimo-Medium.ttf
# (wght 500) reproduzierbar aus dem Upstream-Original, dazu die kursive Instanz
# Arimo-MediumItalic.ttf (wght 500) aus dem Upstream-Original der Kursive, und exportiert je Datei
# die Textmetriken (arimo-metrics.json, arimo-bold-metrics.json, arimo-medium-metrics.json,
# arimo-medium-italic-metrics.json; seit LFH-570 in packages/core/src/assets/).
#
# Warum ein eingechecktes Derivat statt eines Build-Schritts: Die CI hat kein Python, es gibt
# keine Build-Kette für Assets, und die 526 Kontaktbögen unter __snapshots__/multi-size sind
# gerasterte PNGs — der Nachweis „Subset rastert bit-identisch" muss an genau der Datei geführt
# werden, die im Repository liegt. Das Skript ist die Provenienzkette, die Prüfgates in
# fonts.test.ts (Hash, Metrik-Invarianten, cmap-Abdeckung) sind das Sicherungsnetz.
#
# Ablauf: Original nach out/font/ laden (out/ ist gitignored) → SHA-256 gegen den in fonts.ts
# gepinnten Upstream-Wert prüfen → pyftsubset → Metriken exportieren → beide SHA-256 ausgeben.
# Für die Kursive dasselbe mit dem zweiten Original; ihr Subset bleibt in out/font/, eingecheckt
# wird nur die statische Instanz (resvg wertet die wght-Achse der Kursive ebenso wenig aus).
#
# Voraussetzungen: curl, shasum, fontTools 4.63.0 oder neuer (pipx install fonttools; 4.66.0
# erzeugt am 29.09.2026 bit-gleich dieselben Dateien). Die Python-Umgebung
# mit fontTools kann über FONTTOOLS_PYTHON überschrieben werden; Standard ist die pipx-venv.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ASSETS="$ROOT/packages/conformance/assets"
METRICS_DIR="$ROOT/packages/core/src/assets"
OUT="$ROOT/out/font"
SOURCE_URL='https://raw.githubusercontent.com/google/fonts/main/ofl/arimo/Arimo%5Bwght%5D.ttf'
# Muss mit TEXT_FONT_SOURCE_SHA256 in packages/conformance/src/fonts.ts übereinstimmen.
SOURCE_SHA256='e43898b143ec826ac8cb4034816458a7047fbe0836558de2a1f8c6223ae3e0ca'
SOURCE_TTF="$OUT/Arimo[wght]-source.ttf"
ITALIC_SOURCE_URL='https://raw.githubusercontent.com/google/fonts/main/ofl/arimo/Arimo-Italic%5Bwght%5D.ttf'
# Muss mit TEXT_FONT_ITALIC_SOURCE_SHA256 in packages/conformance/src/fonts.ts übereinstimmen.
ITALIC_SOURCE_SHA256='a80fc54fd0233c1dfe298577c4d00f5ae81d5bb83510975e473c47e699b7f4ed'
ITALIC_SOURCE_TTF="$OUT/Arimo-Italic[wght]-source.ttf"
ITALIC_SUBSET_TTF="$OUT/Arimo-Italic[wght]-subset.ttf"
SUBSET_TTF="$ASSETS/Arimo[wght].ttf"
METRICS_JSON="$METRICS_DIR/arimo-metrics.json"
BOLD_TTF="$ASSETS/Arimo-Bold.ttf"
BOLD_METRICS_JSON="$METRICS_DIR/arimo-bold-metrics.json"
MEDIUM_TTF="$ASSETS/Arimo-Medium.ttf"
MEDIUM_METRICS_JSON="$METRICS_DIR/arimo-medium-metrics.json"
MEDIUM_ITALIC_TTF="$ASSETS/Arimo-MediumItalic.ttf"
MEDIUM_ITALIC_METRICS_JSON="$METRICS_DIR/arimo-medium-italic-metrics.json"
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

# Unicode-Range: `designation` ist ein freier String (deutsche Freitexteingaben), daher nicht
# der heutige Zeichenbestand, sondern die Decke: Latin-1, Latin Extended-A/B (Ł, ć, š, ž …),
# General Punctuation (Gedankenstrich, deutsche Anführungszeichen), €, ™, Minus, BOM, U+FFFD.
# Bewusst KEIN --no-hinting und KEIN Instanziieren der wght-Achse: die Rasterung durch resvg
# muss bit-identisch bleiben, und visual-proof.ts nutzt font-weight 700 (Achse bleibt erhalten,
# fvar/gvar/HVAR/STAT nimmt pyftsubset für variable Schriften standardmäßig mit).
# --no-recalc-bounds / --no-prune-unicode-ranges: head/OS/2 bleiben unverändert — core leitet
# Konstanten aus unitsPerEm, ascender, descender und sCapHeight ab.
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

"$FONTTOOLS_PYTHON" "$ROOT/scripts/font/export-metrics.py" "$SUBSET_TTF" "$SOURCE_SHA256" "$METRICS_JSON"

# Statische Instanz wght 700 aus dem Subset. resvg (2.6) wertet die wght-Achse einer variablen
# Schrift nicht aus: font-weight="700" rastert mit der variablen Datei allein bit-identisch zu 400.
# Mit einer zweiten Datei der Familie „Arimo" und usWeightClass 700 wählt resvg für fett gesetzte
# Läufe diese Instanz; nicht fette Läufe rastern unverändert. Browser lesen weiterhin die Achse.
"$FONTTOOLS_PYTHON" - "$SUBSET_TTF" "$BOLD_TTF" <<'PY'
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
font = instancer.instantiateVariableFont(TTFont(sys.argv[1]), {"wght": 700}, updateFontNames=True)
font.recalcTimestamp = False  # head.modified bleibt, die Datei ist reproduzierbar
font.save(sys.argv[2])
PY
"$FONTTOOLS_PYTHON" "$ROOT/scripts/font/export-metrics.py" "$BOLD_TTF" "$SOURCE_SHA256" "$BOLD_METRICS_JSON"

# Statische Instanz wght 500 („Medium", LFH-585 Option B): die eine Strichstärke, in der der
# Katalog allen Text setzt. Die Referenz kennt nur eine Stärke (0,156 × Versalhöhe); Arimo 500
# trifft sie auf rund 3 %. Der Instancer benennt die Datei nach dem STAT-Eintrag: Familie
# „Arimo Medium" (ID 1), typografische Familie „Arimo" (ID 16), Stil „Medium" (ID 17),
# usWeightClass 500. Unter genau diesen Namen wählt resvg sie für font-weight="500"; eine Datei
# mit Zwischengewicht (etwa 480) wählt es nicht, dort fällt es auf die normale Datei zurück.
"$FONTTOOLS_PYTHON" - "$SUBSET_TTF" "$MEDIUM_TTF" <<'PY'
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
font = instancer.instantiateVariableFont(TTFont(sys.argv[1]), {"wght": 500}, updateFontNames=True)
font.recalcTimestamp = False  # head.modified bleibt, die Datei ist reproduzierbar
font.save(sys.argv[2])
PY
"$FONTTOOLS_PYTHON" "$ROOT/scripts/font/export-metrics.py" "$MEDIUM_TTF" "$SOURCE_SHA256" "$MEDIUM_METRICS_JSON"

# Statische Kursivinstanz wght 500 (LFH-585, D.1.1 „Bezeichnung"). Arimo Italic hat nur die
# Achse wght (400–700), keine Achse ital oder slnt; die Neigung (11,0°) steckt in den Umrissen.
# Der Instancer benennt die Datei nach dem STAT-Eintrag: Familie „Arimo Medium" (ID 1), Stil
# „Italic" (ID 2), typografische Familie „Arimo" (ID 16), Stil „Medium Italic" (ID 17),
# usWeightClass 500, Kursiv-Bit gesetzt. Den PostScript-Namen (ID 6) und die eindeutige Kennung
# (ID 3) übernimmt er aus der variablen Kursive („ArimoItalic-MediumItalic"); beide werden hier
# auf „Arimo-MediumItalic" gesetzt, passend zu „Arimo-Medium" und „Arimo-Bold". resvg gibt jedem kursiven Lauf diese Datei, gleich
# welches Gewicht er verlangt; deshalb lässt das Schema Kursiv nur in 500 zu.
subset_font "$ITALIC_SOURCE_TTF" "$ITALIC_SUBSET_TTF"
"$FONTTOOLS_PYTHON" - "$ITALIC_SUBSET_TTF" "$MEDIUM_ITALIC_TTF" <<'PY'
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
font = instancer.instantiateVariableFont(TTFont(sys.argv[1]), {"wght": 500}, updateFontNames=True)
for record in font["name"].names:
    if record.nameID in (3, 6):  # eindeutige Kennung und PostScript-Name
        record.string = record.toUnicode().replace("ArimoItalic-MediumItalic", "Arimo-MediumItalic")
font.recalcTimestamp = False  # head.modified bleibt, die Datei ist reproduzierbar
font.save(sys.argv[2])
PY
"$FONTTOOLS_PYTHON" "$ROOT/scripts/font/export-metrics.py" "$MEDIUM_ITALIC_TTF" "$ITALIC_SOURCE_SHA256" "$MEDIUM_ITALIC_METRICS_JSON"

echo "Original: $(wc -c < "$SOURCE_TTF" | tr -d ' ') Byte, SHA-256 $SOURCE_SHA256"
echo "Kursiv:   $(wc -c < "$ITALIC_SOURCE_TTF" | tr -d ' ') Byte, SHA-256 $ITALIC_SOURCE_SHA256 (Original)"
echo "Subset:   $(wc -c < "$SUBSET_TTF" | tr -d ' ') Byte, SHA-256 $(shasum -a 256 "$SUBSET_TTF" | cut -d' ' -f1)"
echo "Fett:     $(wc -c < "$BOLD_TTF" | tr -d ' ') Byte, SHA-256 $(shasum -a 256 "$BOLD_TTF" | cut -d' ' -f1)"
echo "Medium:   $(wc -c < "$MEDIUM_TTF" | tr -d ' ') Byte, SHA-256 $(shasum -a 256 "$MEDIUM_TTF" | cut -d' ' -f1)"
echo "MedItal.: $(wc -c < "$MEDIUM_ITALIC_TTF" | tr -d ' ') Byte, SHA-256 $(shasum -a 256 "$MEDIUM_ITALIC_TTF" | cut -d' ' -f1)"
echo "Metriken: $METRICS_JSON, $BOLD_METRICS_JSON, $MEDIUM_METRICS_JSON, $MEDIUM_ITALIC_METRICS_JSON"
