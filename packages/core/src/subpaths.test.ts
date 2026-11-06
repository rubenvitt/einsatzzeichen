import { describe, expect, it } from 'vitest';
import packageJson from '../package.json' with { type: 'json' };
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Die Subpfade aus ESZ-149 im Publish-Umfang. Dass jeder Subpfad eine Teilmenge der Wurzel ist,
 * prüft `conformance/src/core-subpaths.test.ts` über die Paketnamen.
 */
describe('Subpfade von core (ESZ-149)', () => {
  it('veröffentlicht jeden Subpfad mit Quelle', () => {
    const exports = packageJson.publishConfig.exports as Record<string, string | { default: string }>;
    expect(Object.keys(exports)).toEqual(['.', './exact', './sketch', './blocks', './fonts/*']);
    for (const subpath of ['./exact', './sketch', './blocks']) {
      const target = exports[subpath] as { default: string };
      const source = target.default.replace('./dist/', './src/').replace(/\.js$/u, '.ts');
      expect(existsSync(fileURLToPath(new URL(`.${source}`, import.meta.url))), subpath).toBe(true);
    }
  });
});
