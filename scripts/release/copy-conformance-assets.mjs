// Kopiert die Laufzeit-Assets des Prüfpakets neben den Build-Output.
// `packages/conformance/src/fonts.ts` lädt die Schrift über
// `new URL('../assets/…', import.meta.url)` — aus `dist/src/fonts.js` heraus
// muss `dist/assets/` also dieselben Dateien tragen wie `assets/`. Die Arimo-Metriken liegen seit
// LFH-570 in `packages/core/src/assets/` und landen über `tsc` in `core/dist/assets/`.
import { cpSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const conformanceRoot = fileURLToPath(new URL('../../packages/conformance/', import.meta.url));
mkdirSync(`${conformanceRoot}dist/assets`, { recursive: true });
cpSync(`${conformanceRoot}assets`, `${conformanceRoot}dist/assets`, { recursive: true });
console.log('conformance: assets nach dist/assets kopiert.');
