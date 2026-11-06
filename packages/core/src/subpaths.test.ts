import { describe, expect, it } from 'vitest';
import packageJson from '../package.json' with { type: 'json' };
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Die Subpfade aus ESZ-149 und ESZ-151 im Publish-Umfang. Was an der Wurzel und in den Subpfaden steht,
 * prüft `conformance/src/core-subpaths.test.ts` über die Paketnamen.
 */
describe('Subpfade von core (ESZ-149, ESZ-151)', () => {
  it('veröffentlicht jeden Subpfad mit Quelle', () => {
    const exports = packageJson.publishConfig.exports as Record<string, string | { default: string }>;
    expect(Object.keys(exports)).toEqual(['.', './exact', './sketch', './blocks', './gates', './fonts/*']);
    for (const subpath of ['./exact', './sketch', './blocks', './gates']) {
      const target = exports[subpath] as { default: string };
      const source = target.default.replace('./dist/', './src/').replace(/\.js$/u, '.ts');
      expect(existsSync(fileURLToPath(new URL(`.${source}`, import.meta.url))), subpath).toBe(true);
    }
  });
});
