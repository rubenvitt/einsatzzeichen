import { createElement, useMemo, type CSSProperties, type ReactElement } from 'react';
import type { Drawing } from '@einsatzzeichen/schema';
import { renderSvg, type SvgOptions } from '@einsatzzeichen/core';
import { splitSvgMarkup } from './split-svg-markup.js';

/**
 * Memoisiert das `renderSvg`-Markup. Die Optionen werden einzeln als Abhängigkeiten geführt,
 * damit ein bei jedem Render neu erzeugtes Options-Objekt die Memoisierung nicht aushebelt.
 */
export function useEinsatzzeichenSvg(drawing: Drawing, options: SvgOptions = {}): string {
  const { size, idPrefix, theme } = options;
  return useMemo(
    () => renderSvg(drawing, { size, idPrefix, theme }),
    [drawing, size, idPrefix, theme],
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

export interface EinsatzzeichenProps extends SvgOptions {
  drawing: Drawing;
  className?: string;
  style?: CSSProperties;
}

/**
 * Rendert ein Einsatzzeichen als `<svg>`-Element. Die Wurzelattribute werden zu React-Props,
 * damit `className`/`style` regulär auf ihr landen; der Inhalt wird als fertiges Markup
 * eingesetzt — core bleibt der einzige Renderer, React reproduziert es nur.
 */
export function Einsatzzeichen({
  drawing,
  size,
  idPrefix,
  theme,
  className,
  style,
}: EinsatzzeichenProps): ReactElement {
  const svg = useEinsatzzeichenSvg(drawing, { size, idPrefix, theme });
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
