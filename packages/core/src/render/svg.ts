import {
  DEFAULT_STROKE_WIDTH_MM,
  mmToUnits,
  PALETTE,
  type ColorToken,
  type Drawing,
  type Primitive,
  type Style,
  type Transform,
} from '@einsatzzeichen/schema';
import { escapeXml, formatUnits } from './format.js';
import { mergeStyle } from './style.js';

export { formatUnits };

export interface SvgOptions {
  /** Kantenlänge in Pixeln. Ohne Angabe skaliert das SVG frei. */
  size?: number;
  /** Präfix für erzeugte Element-IDs. Erforderlich, wenn mehrere SVGs im selben DOM liegen. */
  idPrefix?: string;
}

function u(mm: number): string {
  return formatUnits(mmToUnits(mm));
}

function color(token: ColorToken | 'none'): string {
  return token === 'none' ? 'none' : PALETTE[token];
}

/**
 * `stroke-width` steht normalerweise in SVG-Einheiten (`u`). Bei skalierten Pfaden
 * (siehe `pathTransformAttr`) übernimmt bereits die `scale(...)`-Transformation die
 * Umrechnung; würde die Strichstärke zusätzlich über `u` laufen, würde sie doppelt
 * skaliert. Für diesen Fall bleibt sie im Rohmaß Millimeter (`rawStrokeWidth: true`).
 *
 * `style` ist hier immer schon der von `renderPrimitive` aufgelöste effektive Stil
 * (eigener Stil verschmolzen mit geerbtem, siehe `mergeStyle`) — nie die CSS-Kaskade.
 * `stroke="none"` wird deshalb wie `fill="none"` explizit ausgegeben statt weggelassen:
 * es gibt keine vererbende `<g>`-Elternattribute mehr, auf die sich ein Weglassen
 * verlassen könnte.
 */
function styleAttrs(style: Style | undefined, options: { rawStrokeWidth?: boolean } = {}): string {
  if (!style) return '';
  const parts: string[] = [];
  if (style.fill !== undefined) parts.push(`fill="${color(style.fill)}"`);
  if (style.stroke !== undefined) {
    parts.push(`stroke="${color(style.stroke)}"`);
    if (style.stroke !== 'none') {
      const strokeWidthMm = style.strokeWidth ?? DEFAULT_STROKE_WIDTH_MM;
      const strokeWidth = options.rawStrokeWidth ? formatUnits(strokeWidthMm) : u(strokeWidthMm);
      parts.push(`stroke-width="${strokeWidth}"`);
    }
  }
  if (style.fillRule !== undefined) parts.push(`fill-rule="${style.fillRule}"`);
  return parts.length > 0 ? ` ${parts.join(' ')}` : '';
}

function transformAttr(transform: Transform | undefined): string {
  const rotate = transform?.rotate;
  if (!rotate) return '';
  return ` transform="rotate(${formatUnits(rotate.angle)} ${u(rotate.cx)} ${u(rotate.cy)})"`;
}

/**
 * Nachkommastellen des Pfad-Skalierungsfaktors (siehe `pathTransformAttr`). Der Faktor
 * muss genauer sein als `formatUnits` (drei Nachkommastellen), weil er nicht auf einen
 * einzelnen umgerechneten Wert wirkt, sondern multiplikativ auf jede Koordinate im
 * unangetasteten `d`-String. Bei einer maximalen Kantenlänge von 32 mm
 * (`DEFAULT_VIEWBOX_MM`) und einer Vergleichstoleranz von 0.01 Einheiten
 * (`TOLERANCE_UNITS`) darf der Rundungsfehler des Faktors höchstens 0.01 / 32 ≈
 * 0.0003125 betragen. Drei Nachkommastellen (Fehler bis zu 0.0005) ergäben bei 32 mm
 * bis zu 0.016 Einheiten Abweichung — zu ungenau. Vier Nachkommastellen begrenzen den
 * Fehler auf 0.00005, also höchstens 0.0016 Einheiten bei 32 mm — innerhalb der Toleranz.
 */
const PATH_SCALE_DECIMALS = 4;

function pathScaleFactor(): string {
  return mmToUnits(1).toFixed(PATH_SCALE_DECIMALS);
}

/**
 * Pfad-Primitive tragen ihre Koordinaten unzerlegt im `d`-String (in Millimetern) und
 * werden deshalb nicht wie die anderen Primitive einzeln über `u` umgerechnet, sondern
 * per `scale(...)` skaliert. SVG-Transformationen wirken von rechts nach links auf die
 * Koordinaten: `scale` muss deshalb rechts stehen, damit es zuerst auf die
 * Millimeter-Koordinaten wirkt; `rotate` (mit bereits in Einheiten umgerechnetem
 * Mittelpunkt) wirkt danach auf das skalierte Ergebnis.
 */
function pathTransformAttr(transform: Transform | undefined): string {
  const scale = `scale(${pathScaleFactor()})`;
  const rotate = transform?.rotate;
  if (!rotate) return ` transform="${scale}"`;
  return ` transform="rotate(${formatUnits(rotate.angle)} ${u(rotate.cx)} ${u(rotate.cy)}) ${scale}"`;
}

/**
 * Löst den effektiven Stil eines Primitivs auf (eigener Stil überschreibt geerbten,
 * Feld für Feld — siehe `mergeStyle`) und gibt ihn selbst dort aus, wo SVG sich sonst
 * auf die CSS-Attributvererbung über `<g>` verlassen hätte. Grund: bei Pfaden würde die
 * geerbte `stroke-width` sonst durch die `scale(...)`-Transformation eines `<g>` und
 * erneut durch die des `<path>` doppelt skaliert (siehe `pathTransformAttr`). Damit
 * lösen SVG und Canvas (`drawPrimitive` in `canvas.ts`) die Vererbung strukturell
 * gleich auf: beide werten sie im Renderer aus, keiner verlässt sich auf die
 * Zielplattform. `<g>` trägt deshalb selbst keinen Stil mehr — nur noch Kinder tun das.
 */
function renderPrimitive(primitive: Primitive, inheritedStyle?: Style): string {
  const style = mergeStyle(primitive.style, inheritedStyle);

  if (primitive.type === 'path') {
    const styleStr = styleAttrs(style, { rawStrokeWidth: true });
    const transform = pathTransformAttr(primitive.transform);
    return `<path d="${escapeXml(primitive.d)}"${styleStr}${transform}/>`;
  }

  if (primitive.type === 'group') {
    const transform = transformAttr(primitive.transform);
    const children = primitive.children.map((child) => renderPrimitive(child, style)).join('');
    return `<g${transform}>${children}</g>`;
  }

  const tail = `${styleAttrs(style)}${transformAttr(primitive.transform)}`;

  switch (primitive.type) {
    case 'rect': {
      const rx = primitive.rx !== undefined ? ` rx="${u(primitive.rx)}"` : '';
      return `<rect x="${u(primitive.x)}" y="${u(primitive.y)}" width="${u(primitive.width)}" height="${u(primitive.height)}"${rx}${tail}/>`;
    }
    case 'circle':
      return `<circle cx="${u(primitive.cx)}" cy="${u(primitive.cy)}" r="${u(primitive.r)}"${tail}/>`;
    case 'line':
      return `<line x1="${u(primitive.x1)}" y1="${u(primitive.y1)}" x2="${u(primitive.x2)}" y2="${u(primitive.y2)}"${tail}/>`;
    case 'polyline': {
      const points = primitive.points.map(([x, y]) => `${u(x)},${u(y)}`).join(' ');
      const tag = primitive.closed === true ? 'polygon' : 'polyline';
      return `<${tag} points="${points}"${tail}/>`;
    }
  }
}

export function renderSvg(drawing: Drawing, options: SvgOptions = {}): string {
  const prefix = options.idPrefix ?? 'ez';
  const width = u(drawing.viewBox.width);
  const height = u(drawing.viewBox.height);

  const attrs = ['xmlns="http://www.w3.org/2000/svg"', `viewBox="0 0 ${width} ${height}"`];
  if (options.size !== undefined) {
    attrs.push(`width="${options.size}"`, `height="${options.size}"`);
  }

  const labelled: string[] = [];
  const metadata: string[] = [];
  if (drawing.title !== undefined) {
    labelled.push(`${prefix}-title`);
    metadata.push(`<title id="${prefix}-title">${escapeXml(drawing.title)}</title>`);
  }
  if (drawing.description !== undefined) {
    labelled.push(`${prefix}-desc`);
    metadata.push(`<desc id="${prefix}-desc">${escapeXml(drawing.description)}</desc>`);
  }

  if (labelled.length > 0) {
    attrs.push('role="img"', `aria-labelledby="${labelled.join(' ')}"`);
  } else {
    attrs.push('aria-hidden="true"');
  }

  const body = drawing.children.map((child) => renderPrimitive(child)).join('');
  return `<svg ${attrs.join(' ')}>${metadata.join('')}${body}</svg>`;
}
