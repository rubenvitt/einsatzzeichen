import { createElement, useMemo, type CSSProperties, type ReactElement } from 'react';
import type { Drawing, Sign } from '@einsatzzeichen/schema';
import { drawingOf, renderSvg, type SvgOptions } from '@einsatzzeichen/core';
import { splitSvgMarkup } from './split-svg-markup.js';

/**
 * Memoisiert das `renderSvg`-Markup. Die Optionen werden einzeln als Abhängigkeiten geführt,
 * damit ein bei jedem Render neu erzeugtes Options-Objekt die Memoisierung nicht aushebelt.
 */
export function useEinsatzzeichenSvg(drawing: Drawing, options: SvgOptions = {}): string {
  const { size, idPrefix, theme, minStrokeWidthPx } = options;
  return useMemo(
    () => renderSvg(drawing, { size, idPrefix, theme, minStrokeWidthPx }),
    [drawing, size, idPrefix, theme, minStrokeWidthPx],
  );
}

/**
 * Bildet einen SVG-Attributnamen auf den React-Prop-Namen ab. `aria-*` und `data-*` kennt React
 * mit Bindestrich; Namensraumpräfixe (`xmlns:xlink`, `xlink:href`) und alle übrigen
 * Bindestrich-Namen (`stroke-width`) erwartet React in camelCase.
 */
export function svgAttributeToReactProp(name: string): string {
  if (name === 'class') return 'className';
  if (name.startsWith('aria-') || name.startsWith('data-')) return name;
  return name.replace(/[:-]([a-z])/gu, (_, letter: string) => letter.toUpperCase());
}

/**
 * Die Zeichnung zu einer Beschreibung (ESZ-149), memoisiert über ihren Inhalt: eine bei jedem
 * Render neu geschriebene Beschreibung mit gleichem Inhalt zeichnet nicht neu.
 */
export function useSignDrawing(input: Drawing | Sign): Drawing {
  const contentKey = 'viewBox' in input ? input : JSON.stringify(input);
  // Abhängig vom Inhalt, nicht von der Objektidentität der Beschreibung.
  return useMemo(() => drawingOf(input), [contentKey]);
}

interface EinsatzzeichenBaseProps extends SvgOptions {
  className?: string;
  style?: CSSProperties;
}

/**
 * Entweder eine fertige Zeichnung (`drawing`) oder eine Beschreibung (`sign`, ESZ-149), die über
 * `draw` gezeichnet wird und deshalb immer ein Bild ergibt.
 */
export type EinsatzzeichenProps = EinsatzzeichenBaseProps &
  ({ drawing: Drawing; sign?: never } | { sign: Sign; drawing?: never });

/**
 * Rendert ein Einsatzzeichen als `<svg>`-Element. Die Wurzelattribute werden zu React-Props,
 * damit `className`/`style` regulär auf ihr landen; der Inhalt wird als fertiges Markup
 * eingesetzt — core bleibt der einzige Renderer, React reproduziert es nur.
 */
export function Einsatzzeichen({
  drawing: givenDrawing,
  sign,
  size,
  idPrefix,
  theme,
  minStrokeWidthPx,
  className,
  style,
}: EinsatzzeichenProps): ReactElement {
  const drawing = useSignDrawing((givenDrawing ?? sign) as Drawing | Sign);
  const svg = useEinsatzzeichenSvg(drawing, { size, idPrefix, theme, minStrokeWidthPx });
  // Zerlegung und Prop-Abbildung hängen nur vom Markup ab und werden deshalb mit ihm
  // memoisiert — sonst liefe der Split bei jedem Render erneut, auch ohne neues SVG.
  const svgProps = useMemo(() => {
    const { attributes, innerHtml } = splitSvgMarkup(svg);
    const props: Record<string, unknown> = {};
    for (const [name, value] of Object.entries(attributes)) {
      props[svgAttributeToReactProp(name)] = value;
    }
    props.dangerouslySetInnerHTML = { __html: innerHtml };
    return props;
  }, [svg]);
  const props: Record<string, unknown> = { ...svgProps };
  if (className !== undefined) props.className = className;
  if (style !== undefined) props.style = style;
  return createElement('svg', props);
}
