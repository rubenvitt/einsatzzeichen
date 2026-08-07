import {
  DEFAULT_STROKE_WIDTH_MM,
  type Drawing,
  type Primitive,
  type Style,
} from '@einsatzzeichen/schema';

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

/**
 * Prüft die tatsächlich gerenderten Blattstile nach vollständiger Gruppenvererbung. Eine
 * Strichstärke ist nur relevant, wenn am Blatt ein aktiver Stroke verbleibt; `stroke: none`
 * und ein fehlender Stroke machen selbst ungültige, ansonsten wirkungslose Breiten irrelevant.
 */
export function assertValidActiveStrokeWidths(drawing: Drawing): void {
  function visit(primitive: Primitive, path: string, inherited?: Style): void {
    const style = mergeStyle(primitive.style, inherited);
    if (primitive.type === 'group') {
      primitive.children.forEach((child, index) =>
        visit(child, `${path}.children[${index}]`, style),
      );
      return;
    }

    if (style?.stroke === undefined || style.stroke === 'none') return;
    const strokeWidth = style.strokeWidth ?? DEFAULT_STROKE_WIDTH_MM;
    if (!Number.isFinite(strokeWidth) || strokeWidth < 0) {
      throw new RangeError(
        `Aktive Strichstärke in ${path} muss endlich und nichtnegativ sein ` +
          `(ist ${String(strokeWidth)}).`,
      );
    }
  }

  drawing.children.forEach((primitive, index) => visit(primitive, `children[${index}]`));
}
