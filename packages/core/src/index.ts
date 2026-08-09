export * from './render/svg.js';
export * from './render/canvas.js';
export * from './render/theme.js';
export * from './bounds.js';
export * from './fingerprint.js';
export * from './layout/profiles.js';
export * from './validate.js';
export * from './compose.js';
export * from './path-commands.js';
export * from './pictogram-gate.js';
// Nur die beiden Teile der Textpolitik, die Task 6 als Schnittstelle nach außen führt (siehe
// Brief: "Produces"). Die übrigen Exporte von text-policy.ts (Baseline-/Anker-Abbildungen) bleiben
// bewusst intern — sie sind Renderdetail von svg.ts/canvas.ts, keine fremdpaketige Schnittstelle.
export { effectiveTextPx, MINIMUM_TEXT_RENDER_PX } from './render/text-policy.js';
export * from './a11y/contrast.js';
export * from './a11y/metadata.js';
export * from './viewbox-gate.js';
