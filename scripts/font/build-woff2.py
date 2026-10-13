"""Erzeugt die Browser-Schriften von @einsatzzeichen/core (packages/core/fonts/) aus den
eingecheckten TTFs des Prüfpakets (LFH-832, seit LFH-790 „Einsatzzeichen Sans").

Verbraucher (Hub, Website) beziehen die Zeichenschrift über den exports-Subpfad
`@einsatzzeichen/core/fonts/*`, statt die TTFs samt OFL aus `conformance` zu kopieren. Die Dateien
tragen Rollennamen statt Schriftnamen (`text-medium.woff2` statt `EinsatzzeichenSans-Medium.woff2`),
damit Imports der Verbraucher einen Schriftwechsel überstehen: Jede Datei steht für genau eine
Stufe, die das Schema zulässt (`fontWeight` 400, 500, 700; kursiv nur 500).

- text-regular.woff2:       `EinsatzzeichenSans-Regular.ttf`, nur Container gewechselt
- text-medium.woff2:        `EinsatzzeichenSans-Medium.ttf`, nur Container gewechselt
- text-bold.woff2:          `EinsatzzeichenSans-Bold.ttf`, nur Container gewechselt
- text-medium-italic.woff2: `EinsatzzeichenSans-MediumItalic.ttf`, nur Container gewechselt
- OFL.txt:                  `EinsatzzeichenSans-OFL.txt`, byte-gleich

Warum statisch statt variabel: resvg rastert aus den statischen Instanzen. Browser und resvg
zeichnen so dieselben Dateien.

Reproduzierbar: `recalcTimestamp = False` lässt `head.modified` stehen, WOFF2 komprimiert mit
Brotli deterministisch. Zwei Läufe ergeben dieselben Bytes; die Prüfsummen stehen in
`packages/core/src/font-files.test.ts`.

Voraussetzungen: fontTools 4.66 oder neuer mit Brotli (`pipx install 'fonttools[woff]'`).
Aufruf: python3 scripts/font/build-woff2.py  (oder am Ende von scripts/font/derive-einsatzzeichen-sans.sh)
"""

import shutil
from pathlib import Path

from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "packages" / "conformance" / "assets"
FONTS = ROOT / "packages" / "core" / "fonts"


def save_woff2(font: TTFont, name: str) -> None:
    font.flavor = "woff2"
    font.recalcTimestamp = False  # head.modified bleibt, die Datei ist reproduzierbar
    font.save(FONTS / name)


FONTS.mkdir(parents=True, exist_ok=True)

save_woff2(TTFont(ASSETS / "EinsatzzeichenSans-Regular.ttf"), "text-regular.woff2")
save_woff2(TTFont(ASSETS / "EinsatzzeichenSans-Medium.ttf"), "text-medium.woff2")
save_woff2(TTFont(ASSETS / "EinsatzzeichenSans-Bold.ttf"), "text-bold.woff2")
save_woff2(TTFont(ASSETS / "EinsatzzeichenSans-MediumItalic.ttf"), "text-medium-italic.woff2")
shutil.copyfile(ASSETS / "EinsatzzeichenSans-OFL.txt", FONTS / "OFL.txt")

for path in sorted(FONTS.glob("*.woff2")):
    print(f"{path.relative_to(ROOT)}: {path.stat().st_size} Byte")
