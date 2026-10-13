#!/usr/bin/env python
"""Exportiert die Textmetriken einer Instanz von „Einsatzzeichen Sans" als deterministisches JSON.

Aufruf: export-metrics.py <instanz.ttf> <upstream-sha256> <ziel.json>

Die Datei ist der injizierbare Textmetrik-Anbieter für core (Laufweitenprüfung ohne Fontparser):
Vorschubbreiten (advances) aller cmap-Einträge in Font-Einheiten, die glyf-Bounding-Boxen
(inkExtents; leere Glyphen wie das Leerzeichen als [0, 0, 0, 0]), die Unterschneidung
(kerning) aus dem GPOS-Feature `kern` des Skripts `latn` (ohne eigenes Skript: alle
`kern`-Lookups) — PairPos Format 1 (Einzelpaare) und Format 2 (Klassenpaare), XAdvance-Anpassung
des linken Glyphs, nur Werte ≠ 0, Summe über die Lookups des Features (so wendet ein Shaper sie an,
einer nach dem anderen), nur Codepoint-Paare innerhalb der cmap — dazu die Kopfwerte, aus denen
core seine Konstanten ableitet.

Die Unterschneidung steht in Klassen, nicht als Paarliste (ESZ-114): Plex kernt über Klassenpaare,
ausgerollt wären es je Stufe 25 000 bis 35 000 Paare und rund 500 KB je Datei. `left` und `right`
sind Zeichenketten, deren Zeichen eine Klasse bilden; `values[l][r]` ist die Korrektur zwischen
linker Klasse l und rechter Klasse r. Zwei Codepoints stehen genau dann in derselben linken
(rechten) Klasse, wenn ihre Zeile (Spalte) der ausgerollten Paare gleich ist; die Faktorisierung ist
damit verlustfrei.
Keys sortiert, 2-Space-Indent, kein Zeitstempel — zweimal ausführen ergibt dieselbe Datei.
"""
import hashlib
import json
import sys

from fontTools.ttLib import TTFont


def kern_lookups(font: TTFont):
    """Liefert die PairPos-Lookups des Features `kern` in Lookup-Reihenfolge, Extension-Lookups
    (Typ 9) aufgelöst. Maßgeblich ist das Skript `latn` mit seiner Standardsprache: Katalogtext ist
    lateinisch, und ein Shaper wendet nur die Lookups an, die dieses Skript dem Feature zuordnet
    (Einsatzzeichen Sans führt für Kyrillisch und Griechisch eigene Satzzeichenpaare). Führt die
    Schrift kein Skript `latn`, gelten alle `kern`-Lookups. Andere Features (z. B. `mark`) sind für
    die Laufweite unerheblich."""
    if "GPOS" not in font:
        return []
    gpos = font["GPOS"].table
    features = gpos.FeatureList.FeatureRecord
    feature_indices = range(len(features))
    for script in gpos.ScriptList.ScriptRecord:
        if script.ScriptTag == "latn" and script.Script.DefaultLangSys is not None:
            feature_indices = script.Script.DefaultLangSys.FeatureIndex
    indices = []
    for index in feature_indices:
        if features[index].FeatureTag == "kern":
            indices.extend(features[index].Feature.LookupListIndex)
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
    """XAdvance-Anpassung für ein Glyphpaar innerhalb EINES Lookups, oder None. Das ist die
    OpenType-Semantik, nach der auch die Rasterer verfahren: Ein Subtable im Format 1 greift nur,
    wenn es das Paar führt, sonst ist das nächste dran; eines im Format 2 greift, sobald seine
    Coverage das linke Glyph enthält, auch mit dem Wert 0 der Klasse 0."""
    for st in subtables:
        coverage = st.Coverage.glyphs
        if left not in coverage:
            continue
        if st.Format == 1:
            pair_set = st.PairSet[coverage.index(left)]
            for record in pair_set.PairValueRecord:
                if record.SecondGlyph == right:
                    return x_advance(record.Value1)
            continue
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
            value = sum(pair_adjustment(subtables, left, right) or 0 for subtables in lookups)
            if not value:
                continue
            for left_cp in glyph_to_codepoints[left]:
                for right_cp in glyph_to_codepoints[right]:
                    kerning.setdefault(str(left_cp), {})[str(right_cp)] = value
    return kerning


def kerning_classes(pairs: dict) -> dict:
    """Faktorisiert die ausgerollten Paare `{links: {rechts: wert}}` verlustfrei in Klassen."""
    columns = {}
    for left, row in pairs.items():
        for right, value in row.items():
            columns.setdefault(right, {})[left] = value

    def classes(table: dict) -> list:
        groups = {}
        for codepoint, entries in table.items():
            groups.setdefault(json.dumps(sorted(entries.items())), []).append(int(codepoint))
        return sorted(sorted(members) for members in groups.values())

    left_classes = classes(pairs)
    right_classes = classes(columns)
    right_index = {cp: index for index, members in enumerate(right_classes) for cp in members}
    values = []
    for members in left_classes:
        row = pairs[str(members[0])]
        values.append({str(right_index[int(right)]): value for right, value in row.items()})
    as_text = lambda members: "".join(chr(cp) for cp in members)
    return {
        "left": [as_text(members) for members in left_classes],
        "right": [as_text(members) for members in right_classes],
        "values": values,
    }


def main(subset_path: str, source_sha256: str, target_path: str) -> None:
    font = TTFont(subset_path)
    head = font["head"]
    hhea = font["hhea"]
    os2 = font["OS/2"]
    # Eine statische Instanz trägt keine fvar-Tabelle; ihr Gewicht steht dann in
    # OS/2.usWeightClass.
    fvar = font["fvar"] if "fvar" in font else None
    hmtx = font["hmtx"]
    glyf = font["glyf"]
    cmap = font.getBestCmap()

    default_weight = (
        int(next(axis for axis in fvar.axes if axis.axisTag == "wght").defaultValue)
        if fvar is not None
        else os2.usWeightClass
    )
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
        # Typografische Familie (ID 16) vor der Familie (ID 1): Die Instanz wght 500 heißt in
        # ID 1 „Einsatzzeichen Sans Medium", gehört aber zur Familie „Einsatzzeichen Sans"
        # (ID 16). Regular und Bold führen keine ID 16; für sie gilt ID 1.
        "family": font["name"].getDebugName(16) or font["name"].getDebugName(1),
        "sourceSha256": source_sha256,
        "subsetSha256": subset_sha256,
        "unitsPerEm": head.unitsPerEm,
        "ascender": hhea.ascent,
        "descender": hhea.descent,
        "capHeight": os2.sCapHeight,
        "defaultWeight": default_weight,
        "advances": advances,
        "inkExtents": ink_extents,
        "kerning": kerning_classes(kerning_table(font, cmap)),
        "maxAdvance": max(advances.values()),
        "notdefAdvance": hmtx[".notdef"][0],
    }
    with open(target_path, "w", encoding="utf-8") as handle:
        json.dump(metrics, handle, indent=2, sort_keys=True, ensure_ascii=True)
        handle.write("\n")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3])
