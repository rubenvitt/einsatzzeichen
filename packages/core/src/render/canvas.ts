import {
  DEFAULT_STROKE_WIDTH_MM,
  mmToUnits,
  PALETTE,
  type ColorToken,
  type Drawing,
  type Primitive,
} from '@einsatzzeichen/schema';

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

function drawPrimitive(primitive: Primitive, ctx: CanvasRenderingContext2D): void {
  ctx.save();

  const rotate = primitive.transform?.rotate;
  if (rotate) {
    ctx.translate(mmToUnits(rotate.cx), mmToUnits(rotate.cy));
    ctx.rotate((rotate.angle * Math.PI) / 180);
    ctx.translate(-mmToUnits(rotate.cx), -mmToUnits(rotate.cy));
  }

  if (primitive.type === 'group') {
    for (const child of primitive.children) drawPrimitive(child, ctx);
    ctx.restore();
    return;
  }

  if (primitive.type === 'path') {
    const path = new Path2D(primitive.d);
    ctx.save();
    ctx.scale(mmToUnits(1), mmToUnits(1));
    if (primitive.style?.fill !== undefined && primitive.style.fill !== 'none') {
      ctx.fillStyle = color(primitive.style.fill);
      ctx.fill(path, primitive.style.fillRule ?? 'nonzero');
    }
    if (primitive.style?.stroke !== undefined && primitive.style.stroke !== 'none') {
      ctx.strokeStyle = color(primitive.style.stroke);
      ctx.lineWidth = primitive.style.strokeWidth ?? DEFAULT_STROKE_WIDTH_MM;
      ctx.stroke(path);
    }
    ctx.restore();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  tracePrimitive(primitive, ctx);

  const style = primitive.style;
  if (style?.fill !== undefined && style.fill !== 'none') {
    ctx.fillStyle = color(style.fill);
    ctx.fill();
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
