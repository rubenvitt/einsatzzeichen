// Kopiert die Laufzeit-Assets des Katalogs neben den Build-Output.
// `packages/catalog/src/fonts.ts` lädt Schrift und Metriken über
// `new URL('../assets/…', import.meta.url)` — aus `dist/src/fonts.js` heraus
// muss `dist/assets/` also dieselben Dateien tragen wie `assets/`.
import { cpSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const catalogRoot = fileURLToPath(new URL('../../packages/catalog/', import.meta.url));
mkdirSync(`${catalogRoot}dist/assets`, { recursive: true });
cpSync(`${catalogRoot}assets`, `${catalogRoot}dist/assets`, { recursive: true });
console.log('catalog: assets nach dist/assets kopiert.');
