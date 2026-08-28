import { renderSvg, type RenderTheme } from '@einsatzzeichen/core';
import type { Drawing } from '@einsatzzeichen/schema';
import { encodeBase64Utf8 } from './base64.js';

export interface QgisSymbolEntry {
  /** Anzeigename des Symbols in QGIS; muss innerhalb einer Bibliothek eindeutig sein. */
  readonly name: string;
  readonly drawing: Drawing;
}

export interface QgisLibraryOptions {
  readonly theme?: RenderTheme;
  /** Markergröße in Millimetern auf der Karte bzw. im Druck. Vorgabe 10. */
  readonly sizeMm?: number;
  readonly idPrefix?: string;
}

export interface QgisSvgFile {
  readonly path: string;
  readonly content: string;
}

const DEFAULT_SIZE_MM = 10;

/**
 * Anders als `escapeXml` in core wird hier auch das einfache Anführungszeichen ersetzt: der Name
 * landet in einem Attribut, und QGIS-Stildateien werden auch von Hand editiert — ein `'` im
 * Attributwert soll unabhängig vom umgebenden Anführungszeichen unverwechselbar bleiben.
 */
function escapeAttribute(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function assertUniqueNames(entries: readonly QgisSymbolEntry[]): void {
  const seen = new Set<string>();
  for (const entry of entries) {
    if (entry.name.trim() === '') {
      throw new Error('Symbolname darf nicht leer sein.');
    }
    if (seen.has(entry.name)) {
      throw new Error(`Symbolname "${entry.name}" ist mehrfach vergeben.`);
    }
    seen.add(entry.name);
  }
}

/**
 * Ohne `size`, damit das SVG keine Pixelmaße trägt: QGIS skaliert den Marker ausschließlich über
 * `size`/`size_unit` der Symbolebene; feste Breiten im SVG würden diese Angabe nur verzerren.
 */
function renderEntry(entry: QgisSymbolEntry, options: QgisLibraryOptions): string {
  const svgOptions: { theme?: RenderTheme; idPrefix?: string } = {};
  if (options.theme !== undefined) svgOptions.theme = options.theme;
  if (options.idPrefix !== undefined) svgOptions.idPrefix = options.idPrefix;
  return renderSvg(entry.drawing, svgOptions);
}

/**
 * Erzeugt eine QGIS-Stilbibliothek (`<!DOCTYPE qgis_style>`, Version 2) mit einem SVG-Marker je
 * Eintrag. Die SVG-Quelle liegt inline als `base64:` im `name`-Option des Layers, sodass die
 * Datei ohne Begleitdateien in QGIS ≥ 3 importierbar bleibt.
 *
 * Die SVGs sind bewusst fest eingefärbt und nicht über `param(fill)`/`param(outline)`
 * parametrisiert: Die Farben taktischer Zeichen sind semantisch festgelegt (Organisation,
 * Gefahr, Fachdienst) und dürfen im GIS nicht pro Ebene frei umgefärbt werden. Abweichende
 * Darstellungen laufen über ein `RenderTheme`, das die Palette als Ganzes ersetzt.
 */
export function qgisSymbolLibrary(
  entries: readonly QgisSymbolEntry[],
  options: QgisLibraryOptions = {},
): string {
  const sizeMm = options.sizeMm ?? DEFAULT_SIZE_MM;
  if (!Number.isFinite(sizeMm) || sizeMm <= 0) {
    throw new Error(`sizeMm muss eine endliche Zahl größer 0 sein (ist ${String(sizeMm)}).`);
  }
  assertUniqueNames(entries);

  const symbols = entries.map((entry) => {
    const svg = encodeBase64Utf8(renderEntry(entry, options));
    return [
      `    <symbol type="marker" name="${escapeAttribute(entry.name)}" alpha="1" clip_to_extent="1" force_rhr="0">`,
      '      <layer class="SvgMarker" enabled="1" locked="0" pass="0">',
      '        <Option type="Map">',
      `          <Option type="QString" name="name" value="base64:${svg}"/>`,
      `          <Option type="QString" name="size" value="${String(sizeMm)}"/>`,
      '          <Option type="QString" name="size_unit" value="MM"/>',
      '          <Option type="QString" name="angle" value="0"/>',
      '          <Option type="QString" name="offset" value="0,0"/>',
      '          <Option type="QString" name="offset_unit" value="MM"/>',
      '          <Option type="QString" name="vertical_anchor_point" value="1"/>',
      '          <Option type="QString" name="horizontal_anchor_point" value="1"/>',
      '        </Option>',
      '      </layer>',
      '    </symbol>',
    ].join('\n');
  });

  const symbolsBlock =
    symbols.length === 0 ? '  <symbols/>' : `  <symbols>\n${symbols.join('\n')}\n  </symbols>`;

  return [
    '<!DOCTYPE qgis_style>',
    '<qgis_style version="2">',
    symbolsBlock,
    '  <colorramps/>',
    '  <textformats/>',
    '  <labelsettings/>',
    '  <legendpatchshapes/>',
    '  <symbols3d/>',
    '</qgis_style>',
    '',
  ].join('\n');
}

/**
 * Dateinamen bleiben auf `[A-Za-z0-9._-]` beschränkt, damit sie auf jedem Dateisystem und in
 * QGIS-SVG-Suchpfaden ohne Anführungszeichen funktionieren. Die Ersetzung ist verlustbehaftet,
 * deshalb wird eine Kollision nach der Bereinigung als Fehler gemeldet statt still überschrieben.
 */
function safeFileName(name: string): string {
  return `${name.replace(/[^A-Za-z0-9._-]/g, '_')}.svg`;
}

/** Liefert die SVG-Dateien einer Bibliothek als Pfad/Inhalt-Paare; das Schreiben bleibt dem Aufrufer. */
export function qgisSvgFiles(
  entries: readonly QgisSymbolEntry[],
  options: QgisLibraryOptions = {},
): readonly QgisSvgFile[] {
  assertUniqueNames(entries);
  const sources = new Map<string, string>();
  return entries.map((entry) => {
    const path = safeFileName(entry.name);
    const previous = sources.get(path);
    if (previous !== undefined) {
      throw new Error(
        `Dateiname "${path}" ist mehrfach vergeben (aus "${previous}" und "${entry.name}").`,
      );
    }
    sources.set(path, entry.name);
    return { path, content: renderEntry(entry, options) };
  });
}
