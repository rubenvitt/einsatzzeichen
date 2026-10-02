"""Erzeugt die Browser-Schriften von @einsatzzeichen/core (packages/core/fonts/) aus den
eingecheckten TTFs des Prüfpakets (LFH-832).

Verbraucher (Hub, Website) beziehen die Zeichenschrift über den exports-Subpfad
`@einsatzzeichen/core/fonts/*`, statt die TTFs samt OFL aus `conformance` zu kopieren. Die Dateien
tragen Rollennamen statt Schriftnamen (`text-medium.woff2` statt `Arimo-Medium.woff2`), damit
Imports der Verbraucher den Schriftwechsel (LFH-824) überstehen: Jede Datei steht für genau eine
Stufe, die das Schema zulässt (`fontWeight` 400, 500, 700; kursiv nur 500).

- text-regular.woff2:       statische Instanz wght 400 aus `Arimo[wght].ttf` (Default-Instanz,
                            Umrisse gleich der variablen Datei ohne Achse)
- text-medium.woff2:        `Arimo-Medium.ttf`, nur Container gewechselt
- text-bold.woff2:          `Arimo-Bold.ttf`, nur Container gewechselt
- text-medium-italic.woff2: `Arimo-MediumItalic.ttf`, nur Container gewechselt
- OFL.txt:                  `Arimo-OFL.txt`, byte-gleich

Warum statisch statt variabel: resvg rastert aus den statischen Instanzen, und LFH-824 liefert
„Einsatzzeichen Sans" ebenfalls in genau diesen vier statischen Stufen. Browser und resvg zeichnen
so dieselben Dateien, und `text.css` behält beim Wechsel ihre Gestalt.

Reproduzierbar: `recalcTimestamp = False` lässt `head.modified` stehen, WOFF2 komprimiert mit
Brotli deterministisch. Zwei Läufe ergeben dieselben Bytes; die Prüfsummen stehen in
`packages/core/src/fonts.test.ts`.

Voraussetzungen: fontTools 4.66 oder neuer mit Brotli (`pipx install 'fonttools[woff]'`).
Aufruf: python3 scripts/font/build-woff2.py  (oder am Ende von scripts/font/subset-arimo.sh)
"""

import shutil
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "packages" / "conformance" / "assets"
FONTS = ROOT / "packages" / "core" / "fonts"


def save_woff2(font: TTFont, name: str) -> None:
    font.flavor = "woff2"
    font.recalcTimestamp = False  # head.modified bleibt, die Datei ist reproduzierbar
    font.save(FONTS / name)


FONTS.mkdir(parents=True, exist_ok=True)

regular = instancer.instantiateVariableFont(
    TTFont(ASSETS / "Arimo[wght].ttf"), {"wght": 400}, updateFontNames=True
)
save_woff2(regular, "text-regular.woff2")
save_woff2(TTFont(ASSETS / "Arimo-Medium.ttf"), "text-medium.woff2")
save_woff2(TTFont(ASSETS / "Arimo-Bold.ttf"), "text-bold.woff2")
save_woff2(TTFont(ASSETS / "Arimo-MediumItalic.ttf"), "text-medium-italic.woff2")
shutil.copyfile(ASSETS / "Arimo-OFL.txt", FONTS / "OFL.txt")

for path in sorted(FONTS.glob("*.woff2")):
    print(f"{path.relative_to(ROOT)}: {path.stat().st_size} Byte")
