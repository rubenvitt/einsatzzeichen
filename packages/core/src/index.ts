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
// Drei Teile der Textpolitik führen nach außen: effectiveTextPx/MINIMUM_TEXT_RENDER_PX, die
// Task 6 als Schnittstelle vorsieht (siehe Brief: "Produces"), sowie TEXT_FONT_FAMILY_ATTR — catalog
// bezieht darüber die Schriftfamilie für `resvgFontOptions()` (siehe fonts.ts), statt sie dort als
// eigenes Literal zu wiederholen. Die Abhängigkeitsrichtung ist ohnehin catalog → core (siehe
// package.json); ohne diesen Export müsste catalog das Literal duplizieren, und eine künftige
// Umbenennung könnte in den beiden Paketen auseinanderlaufen. Die übrigen Exporte von
// text-policy.ts (Baseline-/Anker-Abbildungen) bleiben bewusst intern — sie sind Renderdetail von
// svg.ts/canvas.ts, keine fremdpaketige Schnittstelle.
export {
  effectiveTextPx,
  MINIMUM_TEXT_RENDER_PX,
  TEXT_FONT_FAMILY_ATTR,
} from './render/text-policy.js';
export * from './a11y/contrast.js';
export * from './a11y/metadata.js';
export * from './viewbox-gate.js';
