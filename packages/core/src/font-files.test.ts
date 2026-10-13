import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

import { TEXT_FONT_FAMILY_ATTR } from './render/text-policy.js';

/**
 * Die Browser-Schriften unter `packages/core/fonts/` (LFH-832). Verbraucher beziehen sie über den
 * exports-Subpfad `@einsatzzeichen/core/fonts/*`, statt die TTFs aus dem Prüfpaket zu kopieren.
 * Erzeugt von `scripts/font/build-woff2.py` aus den TTFs in `packages/conformance/assets`; dass
 * Umrisse und Vorschübe dabei gleich bleiben, prüft das Skript nicht selbst, es wurde bei der
 * Erzeugung mit fontTools abgeglichen (0 abweichende Glyphen je Datei, `hmtx` gleich). Die
 * Prüfsummen hier halten fest, dass niemand die Dateien ohne das Skript ersetzt.
 */
const fontsDir = new URL('../fonts/', import.meta.url);
const read = (name: string): Buffer => readFileSync(new URL(name, fontsDir));
const sha256 = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex');

/**
 * Erzeugt mit fontTools 4.66.1 und Brotli am 13. Oktober 2026 aus „Einsatzzeichen Sans" (LFH-790);
 * zwei Läufe ergeben dieselben Bytes.
 */
const WOFF2_SHA256: Readonly<Record<string, string>> = {
  'text-regular.woff2': 'cd8d67d819c9e849ee6fb7271362ab51ffc57c16238fd332da030e798dd23f69',
  'text-medium.woff2': '9f23ae539018947a5f9a836d8bae75416ee665a1ddf2e0137350b978895c081c',
  'text-bold.woff2': 'b00f0b9493aaeb6c9d580ff86f2494abcc8ea3e4d13e1b465a01f15f5138e1c2',
  'text-medium-italic.woff2': 'c67ff75acdc361e8e36a2089b0a574795336f2948648294ba7a06ba49409bb38',
};

/** Die Stufen, die das Schema zulässt: `fontWeight` 400 | 500 | 700, kursiv nur in 500. */
const EXPECTED_FACES = [
  { file: 'text-regular.woff2', weight: '400', style: 'normal' },
  { file: 'text-medium.woff2', weight: '500', style: 'normal' },
  { file: 'text-bold.woff2', weight: '700', style: 'normal' },
  { file: 'text-medium-italic.woff2', weight: '500', style: 'italic' },
];

/** Liest die `@font-face`-Blöcke aus `text.css`. */
function fontFaces(css: string) {
  return [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, body]) => {
    const prop = (name: string) => new RegExp(`${name}:\\s*([^;]+);`).exec(body ?? '')?.[1]?.trim();
    return {
      family: prop('font-family'),
      src: prop('src'),
      weight: prop('font-weight'),
      style: prop('font-style'),
    };
  });
}

describe('Browser-Schriften in core/fonts (LFH-832)', () => {
  test.each(Object.entries(WOFF2_SHA256))('%s ist WOFF2 mit gepinnter Prüfsumme', (name, expected) => {
    const bytes = read(name);
    expect(bytes.subarray(0, 4).toString('latin1')).toBe('wOF2');
    expect(sha256(bytes)).toBe(expected);
  });

  test('text.css erklärt genau die vier Stufen in der Familie der Renderer', () => {
    const faces = fontFaces(read('text.css').toString('utf8'));
    expect(faces).toEqual(
      EXPECTED_FACES.map(({ file, weight, style }) => ({
        family: `'${TEXT_FONT_FAMILY_ATTR}'`,
        src: `url('./${file}') format('woff2')`,
        weight,
        style,
      })),
    );
    for (const { file } of EXPECTED_FACES) expect(existsSync(new URL(file, fontsDir))).toBe(true);
  });

  test('OFL.txt ist der Lizenztext der TTFs im Prüfpaket, byte-gleich', () => {
    const conformanceOfl = fileURLToPath(
      new URL('../../conformance/assets/EinsatzzeichenSans-OFL.txt', import.meta.url),
    );
    expect(read('OFL.txt').equals(readFileSync(conformanceOfl))).toBe(true);
  });

  test('package.json veröffentlicht fonts/ über den exports-Subpfad', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
      files: string[];
      publishConfig: { exports: Record<string, unknown> };
    };
    expect(pkg.files).toContain('fonts');
    expect(pkg.publishConfig.exports['./fonts/*']).toBe('./fonts/*');
  });
});
