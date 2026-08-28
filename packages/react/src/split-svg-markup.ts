export interface SvgMarkupParts {
  /** Attribute des Wurzel-`<svg>`-Starttags, Namen unverändert (z. B. `aria-labelledby`, `xmlns:xlink`). */
  attributes: Record<string, string>;
  /** Alles zwischen dem Starttag und dem schließenden `</svg>`. */
  innerHtml: string;
}

/**
 * Attributname, dann optional `=` mit Wert in doppelten oder einfachen Anführungszeichen oder
 * unquotiert. Namen dürfen `:` (Namensraumpräfix) und `-` (`aria-*`, `stroke-width`) enthalten —
 * `renderSvg` erzeugt beides. Attribute ohne Wert (`hidden`) ergeben einen leeren String.
 */
const ATTRIBUTE_PATTERN = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/gu;

/**
 * Zerlegt ein vollständiges SVG-Markup (wie von `renderSvg`) in Wurzelattribute und Inhalt.
 * React kann Attribute nicht aus einem String übernehmen, sondern nur als Props; der Inhalt
 * geht per `dangerouslySetInnerHTML` unverändert weiter. Der Parser deckt bewusst nur das ab,
 * was ein serialisiertes Wurzel-Starttag braucht — kein allgemeiner XML-Parser.
 */
export function splitSvgMarkup(svg: string): SvgMarkupParts {
  const start = svg.search(/<svg[\s>]/u);
  if (start === -1) {
    throw new Error('splitSvgMarkup: Markup enthält kein Wurzel-<svg>-Starttag.');
  }
  const openEnd = svg.indexOf('>', start);
  if (openEnd === -1) {
    throw new Error('splitSvgMarkup: Das <svg>-Starttag ist nicht geschlossen.');
  }
  const close = svg.lastIndexOf('</svg>');
  if (close === -1 || close < openEnd) {
    throw new Error('splitSvgMarkup: Markup enthält kein schließendes </svg>.');
  }

  const attributeText = svg.slice(start + '<svg'.length, openEnd).replace(/\/$/u, '');
  const attributes: Record<string, string> = {};
  for (const match of attributeText.matchAll(ATTRIBUTE_PATTERN)) {
    const [, name, doubleQuoted, singleQuoted, bare] = match;
    if (name === undefined) continue;
    attributes[name] = decodeEntities(doubleQuoted ?? singleQuoted ?? bare ?? '');
  }

  return { attributes, innerHtml: svg.slice(openEnd + 1, close) };
}

/**
 * Attributwerte kommen XML-escaped an (`escapeXml` in core); als React-Prop müssen sie
 * unescaped sein, weil React beim Serialisieren selbst wieder escaped — sonst würde `&amp;`
 * zu `&amp;amp;`.
 */
function decodeEntities(value: string): string {
  return value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&');
}
