import type { Style } from '@einsatzzeichen/schema';

/**
 * Verschmilzt den eigenen Stil eines Primitivs mit dem von einer Elterngruppe geerbten,
 * Feld für Feld: eigene Felder überschreiben geerbte, ungesetzte Felder übernehmen den
 * geerbten Wert. Beide Renderer lösen die Vererbung damit selbst auf, statt sich auf
 * eine Plattform-Kaskade zu verlassen — SVG kennt eine (CSS-Attributvererbung über
 * `<g>`), Canvas keine. Ohne diese gemeinsame Auflösung würden beide Renderer bei
 * geerbten Werten divergieren (siehe die geerbte `stroke-width` bei Pfaden, die SVGs
 * `scale(...)`-Transformation sonst ein zweites Mal skalieren würde).
 */
export function mergeStyle(own: Style | undefined, inherited: Style | undefined): Style | undefined {
  if (!own && !inherited) return undefined;
  return { ...inherited, ...own };
}
