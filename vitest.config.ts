import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const pkg = (name: string): string =>
  fileURLToPath(new URL(`./packages/${name}/src/index.ts`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@einsatzzeichen/schema': pkg('schema'),
      '@einsatzzeichen/core': pkg('core'),
      '@einsatzzeichen/catalog': pkg('catalog'),
      '@einsatzzeichen/react': pkg('react'),
      '@einsatzzeichen/web-component': pkg('web-component'),
      '@einsatzzeichen/maplibre': pkg('maplibre'),
      '@einsatzzeichen/qgis': pkg('qgis'),
    },
  },
  test: {
    include: ['packages/*/src/**/*.test.ts'],
  },
});
