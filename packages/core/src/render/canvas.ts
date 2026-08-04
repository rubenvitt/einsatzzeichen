import {
  DEFAULT_STROKE_WIDTH_MM,
  mmToUnits,
  PALETTE,
  type ColorToken,
  type Drawing,
  type Primitive,
  type Style,
} from '@einsatzzeichen/schema';
import { mergeStyle } from './style.js';

export interface CanvasOptions {
  /** Kantenlänge in Pixeln. Ohne Angabe wird in SVG-Einheiten gezeichnet. */
  size?: number;
}

function color(token: ColorToken | 'none'): string {
  return token === 'none' ? 'transparent' : PALETTE[token];
}

function tracePrimitive(primitive: Primitive, ctx: CanvasRenderingContext2D): void {
  const u = mmToUnits;
  switch (primitive.type) {
    case 'rect':
      ctx.rect(u(primitive.x), u(primitive.y), u(primitive.width), u(primitive.height));
      break;
    case 'circle':
      ctx.arc(u(primitive.cx), u(primitive.cy), u(primitive.r), 0, Math.PI * 2);
      break;
    case 'line':
      ctx.moveTo(u(primitive.x1), u(primitive.y1));
      ctx.lineTo(u(primitive.x2), u(primitive.y2));
      break;
    case 'polyline': {
      primitive.points.forEach(([x, y], index) => {
        if (index === 0) ctx.moveTo(u(x), u(y));
        else ctx.lineTo(u(x), u(y));
      });
      if (primitive.closed === true) ctx.closePath();
      break;
    }
    case 'path':
    case 'group':
      // Werden in drawPrimitive gesondert behandelt und erreichen tracePrimitive nie.
      break;
  }
}

function drawPrimitive(
  primitive: Primitive,
  ctx: CanvasRenderingContext2D,
  inheritedStyle?: Style,
): void {
  ctx.save();

  const rotate = primitive.transform?.rotate;
  if (rotate) {
    ctx.translate(mmToUnits(rotate.cx), mmToUnits(rotate.cy));
    ctx.rotate((rotate.angle * Math.PI) / 180);
    ctx.translate(-mmToUnits(rotate.cx), -mmToUnits(rotate.cy));
  }

  const style = mergeStyle(primitive.style, inheritedStyle);

  if (primitive.type === 'group') {
    for (const child of primitive.children) drawPrimitive(child, ctx, style);
    ctx.restore();
    return;
  }

  if (primitive.type === 'path') {
    const path = new Path2D(primitive.d);
    ctx.save();
    ctx.scale(mmToUnits(1), mmToUnits(1));
    if (style?.fill !== undefined && style.fill !== 'none') {
      ctx.fillStyle = color(style.fill);
      ctx.fill(path, style.fillRule ?? 'nonzero');
    }
    if (style?.stroke !== undefined && style.stroke !== 'none') {
      ctx.strokeStyle = color(style.stroke);
      // Rohes Millimetermaß: das umgebende scale(mmToUnits(1)) skaliert die Strichstärke
      // bereits mit. Eine zusätzliche mmToUnits-Umrechnung würde sie doppelt skalieren.
      ctx.lineWidth = style.strokeWidth ?? DEFAULT_STROKE_WIDTH_MM;
      ctx.stroke(path);
    }
    ctx.restore();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  tracePrimitive(primitive, ctx);

  if (style?.fill !== undefined && style.fill !== 'none') {
    ctx.fillStyle = color(style.fill);
    ctx.fill(style.fillRule ?? 'nonzero');
  }
  if (style?.stroke !== undefined && style.stroke !== 'none') {
    ctx.strokeStyle = color(style.stroke);
    ctx.lineWidth = mmToUnits(style.strokeWidth ?? DEFAULT_STROKE_WIDTH_MM);
    ctx.stroke();
  }

  ctx.restore();
}

export function renderCanvas(
  drawing: Drawing,
  ctx: CanvasRenderingContext2D,
  options: CanvasOptions = {},
): void {
  ctx.save();
  if (options.size !== undefined) {
    ctx.scale(options.size / mmToUnits(drawing.viewBox.width), options.size / mmToUnits(drawing.viewBox.height));
  }
  for (const child of drawing.children) drawPrimitive(child, ctx);
  ctx.restore();
}
