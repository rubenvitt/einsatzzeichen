/**
 * Druckt Objektliterale im Stil der Katalogdateien. Bewusst ein eigener, winziger Drucker statt
 * `ts.createPrinter`: der TypeScript-Drucker normalisiert Anführungszeichen, Einrückung und
 * Zeilenumbrüche nach eigenen Regeln, und ein Ledger, das sich bei jedem Schreibvorgang anders
 * formatiert, erzeugt Diffs, die niemand mehr liest.
 */

/** Zeilenbreite der Katalogdateien; darüber wird ein Literal mehrzeilig gedruckt. */
const MAX_LINE_LENGTH = 100;

/** Eine Einrückungsstufe der Katalogdateien. */
export const INDENT_STEP = '  ';

/** Ein gedrucktes Feld: Name und bereits fertig gedruckter Wert. */
export interface PrintedField {
  name: string;
  value: string;
}

/**
 * Setzt `value` in einfache Anführungszeichen, wie alle Zeichenketten der Katalogdateien.
 * Maskiert wird nur, was maskiert werden muss: Backslash, das schließende Anführungszeichen,
 * Zeilenumbrüche, Tabulatoren und Steuerzeichen. Umlaute und andere Nicht-ASCII-Zeichen bleiben
 * buchstäblich stehen — die Dateien sind UTF-8, und eine \u-Folge statt eines „ä" wäre für den
 * nächsten Leser eine Verschlechterung.
 */
export function quoteString(value: string): string {
  let out = "'";
  for (const character of value) {
    switch (character) {
      case '\\':
        out += '\\\\';
        break;
      case "'":
        out += "\\'";
        break;
      case '\n':
        out += '\\n';
        break;
      case '\r':
        out += '\\r';
        break;
      case '\t':
        out += '\\t';
        break;
      default: {
        const code = character.codePointAt(0) ?? 0;
        out +=
          code < 0x20 || code === 0x7f ? `\\u${code.toString(16).padStart(4, '0')}` : character;
      }
    }
  }
  return `${out}'`;
}

/**
 * Druckt `{ a: 1, b: 2 }` einzeilig, solange es zusammen mit der Startspalte und dem folgenden
 * Komma in die Zeilenbreite passt; sonst mehrzeilig mit hängendem Komma und der übergebenen
 * Einrückung. `column` ist die Spalte, in der das öffnende `{` zu stehen kommt.
 */
export function printObjectLiteral(
  fields: readonly PrintedField[],
  indent: string,
  column: number,
): string {
  if (fields.length === 0) return '{}';
  const singleLine = `{ ${fields.map((field) => `${field.name}: ${field.value}`).join(', ')} }`;
  if (column + singleLine.length + 1 <= MAX_LINE_LENGTH) return singleLine;

  const inner = indent + INDENT_STEP;
  const body = fields.map((field) => `${inner}${field.name}: ${field.value},\n`).join('');
  return `{\n${body}${indent}}`;
}

/**
 * Die führenden Leerzeichen der Zeile, in der `position` liegt. Grundlage für die Einrückung des
 * neu gedruckten Literals — so bleibt die Datei auch dann bündig, wenn sie später mit einer
 * anderen Einrückungsbreite formatiert wird.
 */
export function lineIndentAt(source: string, position: number): string {
  const lineStart = source.lastIndexOf('\n', Math.max(position - 1, 0)) + 1;
  const match = /^[\t ]*/.exec(source.slice(lineStart, position));
  return match === null ? '' : match[0];
}

/** Die Spalte (nullbasiert, in Zeichen) von `position` in seiner Zeile. */
export function columnAt(source: string, position: number): number {
  const lineStart = source.lastIndexOf('\n', Math.max(position - 1, 0)) + 1;
  return position - lineStart;
}
