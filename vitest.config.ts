import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const PACKAGE_IDS = ['schema', 'core', 'conformance', 'react', 'web-component', 'maplibre', 'qgis'];

const pkg = (name: string): string =>
  fileURLToPath(new URL(`./packages/${name}/src/index.ts`, import.meta.url));
const pkgSrc = (name: string): string =>
  fileURLToPath(new URL(`./packages/${name}/src/`, import.meta.url));

/**
 * Aliase in Listenform statt als Objekt — dieselbe Begründung wie in
 * `packages/website/astro.config.mjs`: ein Objektschlüssel vergleicht als Präfix, damit würde
 * `@einsatzzeichen/conformance/src/recipes.js` zu `…/conformance/src/index.ts/src/recipes.js`
 * verstümmelt. Die erste Regel bedient Subpfade auf die Paketquellen, die zweite den Paketindex
 * — exakt, nicht als Präfix. Den Subpfad braucht die Builder-Insel der Website: sie importiert
 * `composeFromCatalog` aus `@einsatzzeichen/conformance/src/recipes.js`, weil der Paketindex
 * `node:url` zieht (Spec §5.2).
 */
/**
 * Die Subpfade von `core` (ESZ-149), wie sie `publishConfig.exports` im Paket führt. Exakt, nicht
 * als Präfix, wie der Paketindex.
 */
const CORE_SUBPATHS: Readonly<Record<string, string>> = {
  exact: 'exact.ts',
  sketch: 'sketch/index.ts',
  blocks: 'blocks/index.ts',
  gates: 'gates.ts',
};

const workspaceAliases = [
  ...Object.entries(CORE_SUBPATHS).map(([subpath, file]) => ({
    find: new RegExp(`^@einsatzzeichen/core/${subpath}$`),
    replacement: `${pkgSrc('core')}${file}`,
  })),
  ...PACKAGE_IDS.map((name) => ({
    find: new RegExp(`^@einsatzzeichen/${name}/src/(.*?)(?:\\.js)?$`),
    replacement: `${pkgSrc(name)}$1.ts`,
  })),
  ...PACKAGE_IDS.map((name) => ({
    find: new RegExp(`^@einsatzzeichen/${name}$`),
    replacement: pkg(name),
  })),
];

export default defineConfig({
  resolve: {
    alias: workspaceAliases,
  },
  test: {
    include: ['packages/*/src/**/*.test.ts', 'scripts/**/*.test.mjs'],
    // Sieben Testdateien der Website bauen den vollständigen Katalog-Snapshot. Seit dem 2. Oktober
    // 2026 zählt dessen generative Reichweite 22 644 statt 868 gültige Kompositionen; unter der
    // Last des Gesamtlaufs reichen die voreingestellten 5 s dafür nicht mehr.
    testTimeout: 30_000,
  },
});
