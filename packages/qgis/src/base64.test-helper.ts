/** Gegenstück zu `encodeBase64Utf8`, nur für Tests: dekodiert Base64 zurück in UTF-8-Text. */
export function decodeBase64Utf8(b64: string): string {
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
