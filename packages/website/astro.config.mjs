import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';

const PACKAGE_IDS = ['schema', 'core', 'catalog', 'react', 'web-component', 'maplibre', 'qgis'];

const pkg = (name) => fileURLToPath(new URL(`../${name}/src/index.ts`, import.meta.url));
const pkgSrc = (name) => fileURLToPath(new URL(`../${name}/src/`, import.meta.url));

/**
 * Aliase in Listenform statt als Objekt: Vite/Rollup vergleicht Objektschlüssel als Präfix, damit
 * würde `@einsatzzeichen/catalog/src/recipes.js` zu `../catalog/src/index.ts/src/recipes.js`
 * verstümmelt (belegt im Setup-Spike, Spec §5.3). Die erste Regel bedient Subpfade auf die
 * Paketquellen, die zweite den Paketindex — exakt, nicht als Präfix.
 */
const workspaceAliases = [
  ...PACKAGE_IDS.map((name) => ({
    find: new RegExp(`^@einsatzzeichen/${name}/src/(.*)$`),
    replacement: `${pkgSrc(name)}$1`,
  })),
  ...PACKAGE_IDS.map((name) => ({
    find: new RegExp(`^@einsatzzeichen/${name}$`),
    replacement: pkg(name),
  })),
];

export default defineConfig({
  site: 'https://einsatzzeichen.invalid', // bewusst kein echter Host: kein Deploy (LFH-432)
  integrations: [
    starlight({
      title: 'Einsatzzeichen',
      defaultLocale: 'root',
      locales: { root: { label: 'Deutsch', lang: 'de' } },
      customCss: ['./src/styles/theme.css'],
      // Eigener Hero: das Bild der Startseite ist ein echtes Zeichen aus dem Snapshot, kein Asset.
      // Eigener Seitenfuß: Starlights Vorgabefuß plus der KI-Hinweis aus Spec §3.
      components: {
        Hero: './src/components/Hero.astro',
        Footer: './src/components/Footer.astro',
      },
      sidebar: [], // Task 11 füllt
    }),
    react(),
  ],
  vite: {
    resolve: {
      alias: workspaceAliases,
    },
  },
});
