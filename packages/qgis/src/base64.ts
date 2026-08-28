/**
 * Base64 über UTF-8-Bytes ohne `Buffer` und ohne `btoa`: `Buffer` gibt es nur in Node, und `btoa`
 * arbeitet auf Latin-1-Zeichen, sodass Umlaute in SVG-Titeln vorher eigenhändig in Bytes umgesetzt
 * werden müssten. Eine eigene Tabelle hält das Paket in Node und im Browser gleich und ist für die
 * Größe eines taktischen Zeichens (wenige Kilobyte) schnell genug.
 */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const LOOKUP: ReadonlyMap<string, number> = new Map(
  [...ALPHABET].map((char, index) => [char, index] as const),
);

export function encodeBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i] ?? 0;
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    const triple = (b0 << 16) | ((b1 ?? 0) << 8) | (b2 ?? 0);
    out += ALPHABET[(triple >> 18) & 63];
    out += ALPHABET[(triple >> 12) & 63];
    out += b1 === undefined ? '=' : ALPHABET[(triple >> 6) & 63];
    out += b2 === undefined ? '=' : ALPHABET[triple & 63];
  }
  return out;
}

export function decodeBase64Utf8(b64: string): string {
  if (b64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(b64)) {
    throw new Error('Ungültige Base64-Eingabe.');
  }
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  const bytes = new Uint8Array((b64.length / 4) * 3 - padding);
  let offset = 0;
  for (let i = 0; i < b64.length; i += 4) {
    const values = [0, 1, 2, 3].map((k) => LOOKUP.get(b64[i + k] ?? '=') ?? 0);
    const triple =
      ((values[0] ?? 0) << 18) |
      ((values[1] ?? 0) << 12) |
      ((values[2] ?? 0) << 6) |
      (values[3] ?? 0);
    for (const byte of [(triple >> 16) & 255, (triple >> 8) & 255, triple & 255]) {
      if (offset < bytes.length) bytes[offset++] = byte;
    }
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
