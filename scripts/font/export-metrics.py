#!/usr/bin/env python
"""Exportiert die Textmetriken des Arimo-Subsets als deterministisches JSON.

Aufruf: export-metrics.py <subset.ttf> <upstream-sha256> <ziel.json>

Die Datei ist der injizierbare Textmetrik-Anbieter für core (Laufweitenprüfung ohne Fontparser):
Vorschubbreiten (advances) aller cmap-Einträge in Font-Einheiten der Default-Instanz (wght 400 —
`hmtx` einer variablen Schrift beschreibt genau diese Instanz; HVAR-Deltas kommen erst bei
anderen Achsenwerten dazu), die glyf-Bounding-Boxen (inkExtents, ebenfalls Default-Instanz:
`glyf` trägt die Umrisse bei wght 400, gvar-Deltas erst bei anderen Achsenwerten; leere Glyphen
wie das Leerzeichen als [0, 0, 0, 0]), die Unterschneidung (kerning) aus dem GPOS-Feature
`kern` — PairPos Format 1 (Einzelpaare) und Format 2 (Klassenpaare), XAdvance-Anpassung des
linken Glyphs in der Default-Instanz, nur Werte ≠ 0, erster anwendbarer Lookup gewinnt, nur
Codepoint-Paare innerhalb der cmap — dazu die Kopfwerte, aus denen core seine Konstanten
ableitet.
Keys sortiert, 2-Space-Indent, kein Zeitstempel — zweimal ausführen ergibt dieselbe Datei.
"""
import hashlib
import json
import sys

from fontTools.ttLib import TTFont


def kern_lookups(font: TTFont):
    """Liefert die PairPos-Lookups des Features `kern` in Lookup-Reihenfolge, Extension-Lookups
    (Typ 9) aufgelöst. Andere Features (z. B. `mark`) sind für die Laufweite unerheblich."""
    if "GPOS" not in font:
        return []
    gpos = font["GPOS"].table
    indices = []
    for record in gpos.FeatureList.FeatureRecord:
        if record.FeatureTag == "kern":
            indices.extend(record.Feature.LookupListIndex)
    lookups = []
    for index in sorted(set(indices)):
        lookup = gpos.LookupList.Lookup[index]
        subtables = [
            st.ExtSubTable if lookup.LookupType == 9 else st for st in lookup.SubTable
        ]
        lookups.append([st for st in subtables if getattr(st, "LookupType", 2) == 2])
    return lookups


def x_advance(value_record) -> int:
    return getattr(value_record, "XAdvance", 0) or 0 if value_record is not None else 0


def pair_adjustment(subtables, left: str, right: str):
    """XAdvance-Anpassung für ein Glyphpaar innerhalb EINES Lookups, oder None. Innerhalb eines
    Lookups zählt das erste Subtable, dessen Coverage das linke Glyph enthält — das ist die
    OpenType-Semantik, nach der auch die Rasterer verfahren."""
    for st in subtables:
        coverage = st.Coverage.glyphs
        if left not in coverage:
            continue
        if st.Format == 1:
            pair_set = st.PairSet[coverage.index(left)]
            for record in pair_set.PairValueRecord:
                if record.SecondGlyph == right:
                    return x_advance(record.Value1)
            return None
        if st.Format == 2:
            class1 = st.ClassDef1.classDefs.get(left, 0)
            class2 = st.ClassDef2.classDefs.get(right, 0)
            return x_advance(st.Class1Record[class1].Class2Record[class2].Value1)
    return None


def kerning_table(font: TTFont, cmap) -> dict:
    lookups = kern_lookups(font)
    glyph_to_codepoints = {}
    for codepoint, glyph_name in cmap.items():
        glyph_to_codepoints.setdefault(glyph_name, []).append(codepoint)
    glyph_names = sorted(glyph_to_codepoints)
    kerning = {}
    for left in glyph_names:
        for right in glyph_names:
            value = None
            for subtables in lookups:
                value = pair_adjustment(subtables, left, right)
                if value is not None:
                    break
            if not value:
                continue
            for left_cp in glyph_to_codepoints[left]:
                for right_cp in glyph_to_codepoints[right]:
                    kerning.setdefault(str(left_cp), {})[str(right_cp)] = value
    return kerning


def main(subset_path: str, source_sha256: str, target_path: str) -> None:
    font = TTFont(subset_path)
    head = font["head"]
    hhea = font["hhea"]
    os2 = font["OS/2"]
    fvar = font["fvar"]
    hmtx = font["hmtx"]
    glyf = font["glyf"]
    cmap = font.getBestCmap()

    wght = next(axis for axis in fvar.axes if axis.axisTag == "wght")
    advances = {
        str(codepoint): hmtx[glyph_name][0]
        for codepoint, glyph_name in cmap.items()
    }

    ink_extents = {}
    for codepoint, glyph_name in cmap.items():
        glyph = glyf[glyph_name]
        # Zusammengesetzte Glyphen (Umlaute = Basis + Komponente) tragen ihre Box erst nach
        # recalcBounds; einfache Glyphen bringen sie mit, leere haben keine Umrisse.
        if glyph.numberOfContours == 0:
            ink_extents[str(codepoint)] = [0, 0, 0, 0]
            continue
        glyph.recalcBounds(glyf)
        ink_extents[str(codepoint)] = [glyph.xMin, glyph.yMin, glyph.xMax, glyph.yMax]

    with open(subset_path, "rb") as handle:
        subset_sha256 = hashlib.sha256(handle.read()).hexdigest()

    metrics = {
        "family": font["name"].getDebugName(1),
        "sourceSha256": source_sha256,
        "subsetSha256": subset_sha256,
        "unitsPerEm": head.unitsPerEm,
        "ascender": hhea.ascent,
        "descender": hhea.descent,
        "capHeight": os2.sCapHeight,
        "defaultWeight": int(wght.defaultValue),
        "advances": advances,
        "inkExtents": ink_extents,
        "kerning": kerning_table(font, cmap),
        "maxAdvance": max(advances.values()),
        "notdefAdvance": hmtx[".notdef"][0],
    }
    with open(target_path, "w", encoding="utf-8") as handle:
        json.dump(metrics, handle, indent=2, sort_keys=True, ensure_ascii=True)
        handle.write("\n")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3])
