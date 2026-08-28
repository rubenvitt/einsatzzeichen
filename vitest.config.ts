import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const PACKAGE_IDS = ['schema', 'core', 'catalog', 'react', 'web-component', 'maplibre', 'qgis'];

const pkg = (name: string): string =>
  fileURLToPath(new URL(`./packages/${name}/src/index.ts`, import.meta.url));
const pkgSrc = (name: string): string =>
  fileURLToPath(new URL(`./packages/${name}/src/`, import.meta.url));

/**
 * Aliase in Listenform statt als Objekt — dieselbe Begründung wie in
 * `packages/website/astro.config.mjs`: ein Objektschlüssel vergleicht als Präfix, damit würde
 * `@einsatzzeichen/catalog/src/recipes.js` zu `…/catalog/src/index.ts/src/recipes.js`
 * verstümmelt. Die erste Regel bedient Subpfade auf die Paketquellen, die zweite den Paketindex
 * — exakt, nicht als Präfix. Den Subpfad braucht die Builder-Insel der Website: sie importiert
 * `composeFromCatalog` aus `@einsatzzeichen/catalog/src/recipes.js`, weil der Paketindex
 * `node:url` zieht (Spec §5.2).
 */
const workspaceAliases = [
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
    include: ['packages/*/src/**/*.test.ts'],
  },
});
