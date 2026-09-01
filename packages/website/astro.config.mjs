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
  site: 'https://einsatzzeichen.rubeen.dev', // echter Host: Canonical, Sitemap und OG (LFH-501)
  // Die Dokumentation ist unter `/docs/…` gezogen; die Wurzel gehört der Landingpage. Alte
  // Pfade bleiben als Weiterleitung erreichbar, damit gemerkte Links nicht ins Leere führen.
  redirects: {
    ...Object.fromEntries(
      [
        'anleitungen',
        'anleitungen/zeichen-finden',
        'anleitungen/herunterladen',
        'anleitungen/karte',
        'anleitungen/qgis',
        'anleitungen/dokument-und-druck',
        'anleitungen/eigenes-zeichen',
        'anleitungen/software',
        ...PACKAGE_IDS.map((name) => `pakete/${name}`),
        'pakete/cli',
      ].map((path) => [`/${path}`, `/docs/${path}`]),
    ),
    '/grundlage': '/docs/grundlage',
    '/maplibre-lab': '/docs/maplibre-lab',
    '/coverage': '/docs/coverage',
    '/quickstart': '/docs/quickstart',
    '/explorer': '/docs/explorer',
    '/belege': '/docs/belege',
    '/sources-und-diffs': '/docs/sources-und-diffs',
  },
  integrations: [
    starlight({
      title: 'Einsatzzeichen',
      defaultLocale: 'root',
      locales: { root: { label: 'Deutsch', lang: 'de' } },
      customCss: ['./src/styles/theme.css'],
      // Eigener Seitenfuß: Starlights Vorgabefuß plus der KI-Hinweis aus Spec §3. Der frühere
      // Hero-Override ist mit der eigenständigen Landingpage (`src/pages/index.astro`) entfallen.
      components: {
        Footer: './src/components/Footer.astro',
      },
      sidebar: [
        { label: 'Überblick', link: '/docs/' },
        {
          label: 'Anleitungen',
          items: [
            { label: 'Anleitungen', link: '/docs/anleitungen/' },
            { label: 'Ein Zeichen finden', link: '/docs/anleitungen/zeichen-finden/' },
            { label: 'Ein Zeichen herunterladen', link: '/docs/anleitungen/herunterladen/' },
            { label: 'Ein Zeichen auf eine Karte legen', link: '/docs/anleitungen/karte/' },
            { label: 'Zeichen in QGIS verwenden', link: '/docs/anleitungen/qgis/' },
            { label: 'Ein Zeichen in ein Dokument setzen oder drucken', link: '/docs/anleitungen/dokument-und-druck/' },
            { label: 'Ein Zeichen selbst zusammensetzen', link: '/docs/anleitungen/eigenes-zeichen/' },
            { label: 'Zeichen in eigene Software einbauen', link: '/docs/anleitungen/software/' },
          ],
        },
        {
          label: 'Einstiege',
          items: [
            { label: 'Zeichen suchen', link: '/docs/explorer/' },
            { label: 'Baukasten', link: '/builder/' },
            { label: 'Karte', link: '/docs/maplibre-lab/' },
            { label: 'Quickstart', link: '/docs/quickstart/' },
          ],
        },
        { label: 'Zeichen', link: '/zeichen/' },
        {
          label: 'Hintergrund',
          items: [
            { label: 'Grundlage', link: '/docs/grundlage/' },
            { label: 'Stand der Prüfung', link: '/docs/coverage/' },
            { label: 'Belege', link: '/docs/belege/' },
            { label: 'Sources & Diffs', link: '/docs/sources-und-diffs/' },
          ],
        },
        {
          label: 'Pakete',
          items: [{ autogenerate: { directory: 'docs/pakete' } }],
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
