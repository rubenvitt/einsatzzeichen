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
      sidebar: [
        {
          label: 'Anleitungen',
          items: [
            { label: 'Anleitungen', link: '/anleitungen/' },
            { label: 'Ein Zeichen finden', link: '/anleitungen/zeichen-finden/' },
            { label: 'Ein Zeichen herunterladen', link: '/anleitungen/herunterladen/' },
            { label: 'Ein Zeichen auf eine Karte legen', link: '/anleitungen/karte/' },
            { label: 'Zeichen in QGIS verwenden', link: '/anleitungen/qgis/' },
            { label: 'Ein Zeichen in ein Dokument setzen oder drucken', link: '/anleitungen/dokument-und-druck/' },
            { label: 'Ein Zeichen selbst zusammensetzen', link: '/anleitungen/eigenes-zeichen/' },
            { label: 'Zeichen in eigene Software einbauen', link: '/anleitungen/software/' },
          ],
        },
        {
          label: 'Einstiege',
          items: [
            { label: 'Zeichen suchen', link: '/explorer/' },
            { label: 'Baukasten', link: '/builder/' },
            { label: 'Karte', link: '/maplibre-lab/' },
            { label: 'Quickstart', link: '/quickstart/' },
          ],
        },
        { label: 'Zeichen', link: '/zeichen/' },
        {
          label: 'Hintergrund',
          items: [
            { label: 'Grundlage', link: '/grundlage/' },
            { label: 'Stand der Prüfung', link: '/coverage/' },
            { label: 'Belege', link: '/belege/' },
            { label: 'Sources & Diffs', link: '/sources-und-diffs/' },
          ],
        },
        {
          label: 'Pakete',
          items: [{ autogenerate: { directory: 'pakete' } }],
        },
      ],
    }),
    react(),
  ],
  vite: {
    resolve: {
      alias: workspaceAliases,
    },
  },
});
