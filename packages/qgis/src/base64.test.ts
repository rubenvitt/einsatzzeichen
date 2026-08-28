import { describe, expect, it } from 'vitest';
import { encodeBase64Utf8 } from './base64.js';
import { decodeBase64Utf8 } from './base64.test-helper.js';

describe('encodeBase64Utf8', () => {
  it('kodiert ASCII wie die Standard-Base64-Tabelle', () => {
    expect(encodeBase64Utf8('')).toBe('');
    expect(encodeBase64Utf8('f')).toBe('Zg==');
    expect(encodeBase64Utf8('fo')).toBe('Zm8=');
    expect(encodeBase64Utf8('foo')).toBe('Zm9v');
    expect(encodeBase64Utf8('foobar')).toBe('Zm9vYmFy');
  });

  it('kodiert Nicht-ASCII als UTF-8-Bytes', () => {
    // "ä" = C3 A4, "€" = E2 82 AC
    expect(encodeBase64Utf8('ä')).toBe('w6Q=');
    expect(encodeBase64Utf8('€')).toBe('4oKs');
  });

  it.each(['', 'Löschzug 1', '<svg>„Zeichen“ – €</svg>', '𝄞 Notenschlüssel'])(
    'überlebt die Rundreise für %j',
    (text) => {
      expect(decodeBase64Utf8(encodeBase64Utf8(text))).toBe(text);
    },
  );

  it('verarbeitet Eingaben oberhalb der Blockgrenze byteweise korrekt', () => {
    const text = 'ä€x'.repeat(50_000);
    expect(decodeBase64Utf8(encodeBase64Utf8(text))).toBe(text);
  });
});
