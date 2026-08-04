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

function styleAttrs(style: Style | undefined): string {
  if (!style) return '';
  const parts: string[] = [];
  if (style.fill !== undefined) parts.push(`fill="${color(style.fill)}"`);
  if (style.stroke !== undefined && style.stroke !== 'none') {
    parts.push(`stroke="${color(style.stroke)}"`);
    parts.push(`stroke-width="${u(style.strokeWidth ?? DEFAULT_STROKE_WIDTH_MM)}"`);
  }
  if (style.fillRule !== undefined) parts.push(`fill-rule="${style.fillRule}"`);
  return parts.length > 0 ? ` ${parts.join(' ')}` : '';
}

function transformAttr(transform: Transform | undefined): string {
  const rotate = transform?.rotate;
  if (!rotate) return '';
  return ` transform="rotate(${formatUnits(rotate.angle)} ${u(rotate.cx)} ${u(rotate.cy)})"`;
}

function renderPrimitive(primitive: Primitive): string {
  const tail = `${styleAttrs(primitive.style)}${transformAttr(primitive.transform)}`;

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
    case 'path':
      return `<path d="${escapeXml(primitive.d)}"${tail}/>`;
    case 'group':
      return `<g${tail}>${primitive.children.map(renderPrimitive).join('')}</g>`;
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

  const body = drawing.children.map(renderPrimitive).join('');
  return `<svg ${attrs.join(' ')}>${metadata.join('')}${body}</svg>`;
}
