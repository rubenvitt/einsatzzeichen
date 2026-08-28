/**
 * `btoa` ist in Browsern und seit Node 16 global verfügbar, arbeitet aber auf Latin-1-Zeichen:
 * Umlaute in SVG-Titeln würden es zum Absturz bringen. Deshalb wird der Text zuerst per
 * `TextEncoder` in UTF-8-Bytes zerlegt und byteweise als Zeichenkette an `btoa` übergeben —
 * ohne `Buffer`, damit das Paket im Browser lauffähig bleibt.
 */
export function encodeBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  // `String.fromCharCode(...bytes)` in einem Rutsch würde bei großen SVGs die Argumentgrenze der
  // JS-Engine überschreiten; deshalb in Blöcken.
  const CHUNK = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}
