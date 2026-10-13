#!/usr/bin/env python
"""Leitet eine statische, umbenannte Instanz von „Einsatzzeichen Sans" aus einem Subset von
IBM Plex Sans ab (LFH-790, Weg R).

Aufruf: derive_instance.py <subset.ttf> <ziel.ttf> <wght> <upright|italic>

Ablauf, wie in `docs/decisions/2026-09-29-lfh-790-ersatzschrift-option-c.md` §10.3 festgelegt:

- fontTools-Instancer bei **wdth 86** und der verlangten Stufe. Die Breite ist auf die Laufweite
  der Referenz geeicht (Median 1,000 bei wght 500); dieselbe Breite gilt für alle Stufen und die
  Kursive, damit Läufe verschiedener Stufen gleich laufen.
- Neue Namen in den Einträgen 1–4, 6, 16 und 17, nach dem Muster der früheren Arimo-Instanzen,
  unter dem resvg sie für `font-weight` 400/500/700 und kursiv 500 wählt (Notiz §10.5).
- Namenseintrag 7 (Markenhinweis „IBM Plex") entfällt: Die Schrift führt den Namen nicht mehr
  (Notiz §10.1). Eintrag 0 (Copyright von IBM) und 13/14 (OFL) bleiben, wie die OFL verlangt.
- `usWeightClass`, `usWidthClass`, `fsSelection` und `macStyle` passend gesetzt; `STAT` und alle
  Namen, auf die nach dem Instanziieren nichts mehr verweist, entfernt.
- `head.modified` bleibt stehen, damit die Datei reproduzierbar ist.
"""
import sys

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

FAMILY = "Einsatzzeichen Sans"
POSTSCRIPT_FAMILY = "EinsatzzeichenSans"
VENDOR = "Einsatzzeichen"
# Geeichte Breite (Notiz §10.3): wdth 86 trifft im Median die Laufweite der Referenz.
WIDTH = 86
# OS/2-Breitenklasse zu wdth 86: zwischen 87,5 % (3, Semi-condensed) und 75 % (2, Condensed),
# näher an Semi-condensed.
WIDTH_CLASS = 3

STYLE_NAMES = {
    (400, "upright"): "Regular",
    (500, "upright"): "Medium",
    (700, "upright"): "Bold",
    (500, "italic"): "Medium Italic",
}

# fsSelection-Bits: 0 ITALIC, 5 BOLD, 6 REGULAR, 7 USE_TYPO_METRICS (bleibt, wie es ist).
FS_ITALIC = 1 << 0
FS_BOLD = 1 << 5
FS_REGULAR = 1 << 6
# macStyle-Bits: 0 Bold, 1 Italic.
MAC_BOLD = 1 << 0
MAC_ITALIC = 1 << 1


def set_name(font: TTFont, name_id: int, value: str) -> None:
    font["name"].removeNames(nameID=name_id)
    font["name"].setName(value, name_id, 3, 1, 0x409)  # Windows, Unicode BMP, en-US
    font["name"].setName(value, name_id, 1, 0, 0)  # Macintosh, Roman, Englisch


def main(subset_path: str, target_path: str, weight: int, slope: str) -> None:
    style = STYLE_NAMES[(weight, slope)]
    font = instancer.instantiateVariableFont(
        TTFont(subset_path), {"wght": weight, "wdth": WIDTH}, updateFontNames=False
    )

    # Wie bei den früheren Arimo-Instanzen: 400 und 700 sind Regular/Bold der Familie selbst
    # (Eintrag 1 = Familie, 2 = Stil), 500 heißt „<Familie> Medium" mit der typografischen
    # Familie in 16 und dem Stil in 17. Die Kursive in 500 heißt in 1 ebenfalls „… Medium" mit
    # Stil „Italic" in 2.
    if weight == 500:
        legacy_family = f"{FAMILY} Medium"
        legacy_style = "Italic" if slope == "italic" else "Regular"
        set_name(font, 16, FAMILY)
        set_name(font, 17, style)
    else:
        legacy_family = FAMILY
        legacy_style = style
        font["name"].removeNames(nameID=16)
        font["name"].removeNames(nameID=17)
    postscript = f"{POSTSCRIPT_FAMILY}-{style.replace(' ', '')}"
    version = font["name"].getDebugName(5).removeprefix("Version ").strip()

    set_name(font, 1, legacy_family)
    set_name(font, 2, legacy_style)
    set_name(font, 3, f"{version};{VENDOR};{postscript}")
    set_name(font, 4, f"{FAMILY} {style}")
    set_name(font, 6, postscript)
    # 7: Markenhinweis auf „IBM Plex" — entfällt (Notiz §10.1). 25: Präfix für Instanznamen
    # einer variablen Schrift, ohne fvar bedeutungslos und mit „IBMPlexSans…" belegt.
    for name_id in (7, 25):
        font["name"].removeNames(nameID=name_id)

    os2 = font["OS/2"]
    os2.usWeightClass = weight
    os2.usWidthClass = WIDTH_CLASS
    selection = os2.fsSelection & ~(FS_ITALIC | FS_BOLD | FS_REGULAR)
    if slope == "italic":
        selection |= FS_ITALIC
    if weight == 700:
        selection |= FS_BOLD
    if weight != 700 and slope == "upright":
        # Wie bei der früheren Arimo-Medium: Stil „Regular" der Familie „… Medium".
        selection |= FS_REGULAR
    os2.fsSelection = selection
    font["head"].macStyle = (MAC_BOLD if weight == 700 else 0) | (
        MAC_ITALIC if slope == "italic" else 0
    )

    if "STAT" in font:
        del font["STAT"]
    font["name"].removeUnusedNames(font)

    for record in font["name"].names:
        text = record.toUnicode()
        if "Plex" in text and record.nameID != 0:
            raise SystemExit(
                f"Namenseintrag {record.nameID} nennt noch den reservierten Namen: {text!r}"
            )

    font.recalcTimestamp = False  # head.modified bleibt, die Datei ist reproduzierbar
    font.save(target_path)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4])
