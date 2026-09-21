import { readFileSync } from 'node:fs';

/**
 * Minimaler TrueType-Tabellenleser für die Prüfgates in fonts.test.ts — bewusst ohne neue
 * Abhängigkeit (kein opentype.js/fontkit): Gelesen werden nur die wenigen Feldoffsets, aus denen
 * core seine Konstanten ableitet (`head.unitsPerEm`, `hhea.ascender/descender`,
 * `OS/2.sCapHeight`) sowie die Achsen der `fvar`-Tabelle. Alle Werte sind Big-Endian, die
 * Offsets stammen aus der OpenType-Spezifikation (Tabellenverzeichnis, head, hhea, OS/2, fvar).
 */
export interface FontHeadMetrics {
  unitsPerEm: number;
  ascender: number;
  descender: number;
  capHeight: number;
  axes: Array<{ tag: string; min: number; default: number; max: number }>;
}

function tableDirectory(view: DataView): Map<string, { offset: number; length: number }> {
  const numTables = view.getUint16(4);
  const tables = new Map<string, { offset: number; length: number }>();
  for (let index = 0; index < numTables; index++) {
    const record = 12 + index * 16;
    const tag = String.fromCharCode(
      view.getUint8(record),
      view.getUint8(record + 1),
      view.getUint8(record + 2),
      view.getUint8(record + 3),
    );
    tables.set(tag, { offset: view.getUint32(record + 8), length: view.getUint32(record + 12) });
  }
  return tables;
}

function requireTable(
  tables: Map<string, { offset: number; length: number }>,
  tag: string,
): { offset: number; length: number } {
  const table = tables.get(tag);
  if (table === undefined) throw new Error(`Schriftdatei ohne Tabelle "${tag}".`);
  return table;
}

/** Fixed 16.16 → Zahl; fvar speichert Achsenwerte in diesem Format. */
function fixed(view: DataView, offset: number): number {
  return view.getInt32(offset) / 65536;
}

export function readFontHeadMetrics(fontPath: string): FontHeadMetrics {
  const bytes = readFileSync(fontPath);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tables = tableDirectory(view);
  const head = requireTable(tables, 'head');
  const hhea = requireTable(tables, 'hhea');
  const os2 = requireTable(tables, 'OS/2');
  const fvar = requireTable(tables, 'fvar');

  // fvar-Kopf: axesArrayOffset @4, axisCount @8, axisSize @10; je Achse: tag @0, min @4,
  // default @8, max @12 (Fixed).
  const axesOffset = fvar.offset + view.getUint16(fvar.offset + 4);
  const axisCount = view.getUint16(fvar.offset + 8);
  const axisSize = view.getUint16(fvar.offset + 10);
  const axes: FontHeadMetrics['axes'] = [];
  for (let index = 0; index < axisCount; index++) {
    const axis = axesOffset + index * axisSize;
    axes.push({
      tag: String.fromCharCode(
        view.getUint8(axis),
        view.getUint8(axis + 1),
        view.getUint8(axis + 2),
        view.getUint8(axis + 3),
      ),
      min: fixed(view, axis + 4),
      default: fixed(view, axis + 8),
      max: fixed(view, axis + 12),
    });
  }

  return {
    unitsPerEm: view.getUint16(head.offset + 18),
    ascender: view.getInt16(hhea.offset + 4),
    descender: view.getInt16(hhea.offset + 6),
    capHeight: view.getInt16(os2.offset + 88),
    axes,
  };
}
