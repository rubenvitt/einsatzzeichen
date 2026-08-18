import {
  DEFAULT_STROKE_WIDTH_MM,
  mmToUnits,
  type ColorToken,
  type Drawing,
  type Primitive,
  type Style,
} from '@einsatzzeichen/schema';
import { assertValidActiveStrokeWidths, mergeStyle } from './style.js';
import { canvasBaseline, canvasTextAlign, TEXT_FONT_FAMILY_ATTR } from './text-policy.js';
import { REFERENCE_THEME, type RenderTheme } from './theme.js';
import { assertValidRenderTheme } from './theme-validation.js';

export interface CanvasOptions {
  /** Kantenlänge in Pixeln. Ohne Angabe wird in SVG-Einheiten gezeichnet. */
  size?: number;
  /** Farbprofil der Ausgabe. Ohne Angabe wird die unveränderte Referenzpalette verwendet. */
  theme?: RenderTheme;
}

function color(token: ColorToken | 'none', theme: RenderTheme): string {
  return token === 'none' ? 'transparent' : theme.palette[token];
}

function tracePrimitive(primitive: Primitive, ctx: CanvasRenderingContext2D): void {
  const u = mmToUnits;
  switch (primitive.type) {
    case 'rect':
      // `rx` gehört seit jeher zum IR und wird von `renderSvg` ausgegeben; hier fehlte es. Ein
      // Stadion (Rechteck mit `rx` = halbe Höhe, so trägt die Kette aus 5.1.1.5 ihre Form) wäre
      // auf der Leinwand still mit scharfen Ecken erschienen — dieselbe Zeichnung, zwei Bilder.
      // Kein Fall des Bestands war betroffen, solange kein Primitiv `rx` setzte.
      if (primitive.rx !== undefined) {
        ctx.roundRect(
          u(primitive.x),
          u(primitive.y),
          u(primitive.width),
          u(primitive.height),
          u(primitive.rx),
        );
      } else {
        ctx.rect(u(primitive.x), u(primitive.y), u(primitive.width), u(primitive.height));
      }
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
    case 'text':
      // Werden in drawPrimitive gesondert behandelt und erreichen tracePrimitive nie. Text
      // insbesondere braucht ctx.fillText() statt Pfadaufbau + ctx.fill() — es gibt keinen
      // Canvas-Pfadbefehl, der eine Glyphenkontur nachzeichnet.
      break;
  }
}

function drawPrimitive(
  primitive: Primitive,
  ctx: CanvasRenderingContext2D,
  theme: RenderTheme,
  inheritedStyle?: Style,
  inheritedRole?: Primitive['role'],
): void {
  ctx.save();

  // Reihenfolge ist tragend: Canvas-Transformationen wirken in Aufrufreihenfolge auf die CTM.
  // translate zuerst ergibt T·R und damit dieselbe Abbildung wie SVGs
  // transform="translate(...) rotate(...)" (siehe `transformAttr` in svg.ts). Nach der Drehung
  // aufgerufen ergäbe es R·T — aus derselben IR entstünden zwei verschiedene Bilder.
  const translate = primitive.transform?.translate;
  if (translate) {
    ctx.translate(mmToUnits(translate.dxMm), mmToUnits(translate.dyMm));
  }

  const rotate = primitive.transform?.rotate;
  if (rotate) {
    ctx.translate(mmToUnits(rotate.cx), mmToUnits(rotate.cy));
    ctx.rotate((rotate.angle * Math.PI) / 180);
    ctx.translate(-mmToUnits(rotate.cx), -mmToUnits(rotate.cy));
  }

  const style = mergeStyle(primitive.style, inheritedStyle);
  const role = primitive.role ?? inheritedRole;

  if (primitive.type === 'group') {
    for (const child of primitive.children) drawPrimitive(child, ctx, theme, style, role);
    ctx.restore();
    return;
  }

  if (primitive.type === 'path') {
    const path = new Path2D(primitive.d);
    ctx.save();
    ctx.scale(mmToUnits(1), mmToUnits(1));
    if (style?.fill !== undefined && style.fill !== 'none') {
      ctx.fillStyle = color(style.fill, theme);
      ctx.fill(path, style.fillRule ?? 'nonzero');
    }
    if (style?.stroke !== undefined && style.stroke !== 'none') {
      const strokeWidth = style.strokeWidth ?? DEFAULT_STROKE_WIDTH_MM;
      if (strokeWidth > 0) {
        ctx.strokeStyle = color(style.stroke, theme);
        // Rohes Millimetermaß: das umgebende scale(mmToUnits(1)) skaliert die Strichstärke
        // bereits mit. Eine zusätzliche mmToUnits-Umrechnung würde sie doppelt skalieren.
        ctx.lineWidth = strokeWidth;
        if (role === 'pictogram') {
          // Entspricht SVGs Butt/Round-Vertrag für das Clipping-Gate: die halbe Strichstärke ist
          // damit eine konservative sichtbare Piktogrammausdehnung.
          ctx.lineCap = 'butt';
          ctx.lineJoin = 'round';
        }
        const fillToken = style.fill;
        const dash =
          role === 'body' && fillToken !== undefined && fillToken !== 'none'
            ? theme.bodyStrokeDashes?.[fillToken]
            : undefined;
        ctx.setLineDash(dash === undefined ? [] : [...dash]);
        ctx.lineDashOffset = 0;
        ctx.stroke(path);
      }
    }
    ctx.restore();
    ctx.restore();
    return;
  }

  if (primitive.type === 'text') {
    // Text wird ausschließlich gefüllt, nie gestrichen (siehe TEXT_FONT_FAMILY_ATTR-Kommentar
    // in text-policy.ts) — deshalb kein Stroke-Zweig wie beim generischen Fall unten. ctx.fillText
    // ist ein eigenständiger Zeichenbefehl, kein Pfadaufbau: tracePrimitive() bleibt hier bewusst
    // ungenutzt, damit SVG und Canvas beide dieselbe Renderpolitik (text-policy.ts) für Anker und
    // Grundlinie auswerten statt eine Plattformkonvention zu erraten.
    if (style?.fill !== undefined && style.fill !== 'none') {
      ctx.fillStyle = color(style.fill, theme);
      ctx.font = `${mmToUnits(primitive.sizeMm)}px ${TEXT_FONT_FAMILY_ATTR}`;
      ctx.textAlign = canvasTextAlign(primitive.anchor);
      ctx.textBaseline = canvasBaseline(primitive.baseline);
      ctx.fillText(primitive.content, mmToUnits(primitive.x), mmToUnits(primitive.y));
    }
    ctx.restore();
    return;
  }

  ctx.beginPath();
  tracePrimitive(primitive, ctx);

  if (style?.fill !== undefined && style.fill !== 'none') {
    ctx.fillStyle = color(style.fill, theme);
    ctx.fill(style.fillRule ?? 'nonzero');
  }
  if (style?.stroke !== undefined && style.stroke !== 'none') {
    const strokeWidth = style.strokeWidth ?? DEFAULT_STROKE_WIDTH_MM;
    if (strokeWidth > 0) {
      ctx.strokeStyle = color(style.stroke, theme);
      ctx.lineWidth = mmToUnits(strokeWidth);
      if (role === 'pictogram') {
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'round';
      }
      const fillToken = style.fill;
      const dash =
        role === 'body' && fillToken !== undefined && fillToken !== 'none'
          ? theme.bodyStrokeDashes?.[fillToken]
          : undefined;
      ctx.setLineDash(dash === undefined ? [] : dash.map(mmToUnits));
      ctx.lineDashOffset = 0;
      ctx.stroke();
    }
  }

  ctx.restore();
}

export function renderCanvas(
  drawing: Drawing,
  ctx: CanvasRenderingContext2D,
  options: CanvasOptions = {},
): void {
  const theme = options.theme === undefined ? REFERENCE_THEME : options.theme;
  assertValidRenderTheme(theme);
  assertValidActiveStrokeWidths(drawing);
  ctx.save();
  if (options.size !== undefined) {
    ctx.scale(options.size / mmToUnits(drawing.viewBox.width), options.size / mmToUnits(drawing.viewBox.height));
  }
  for (const child of drawing.children) drawPrimitive(child, ctx, theme);
  ctx.restore();
}
