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
import { rasterDimensionsForWidth } from './raster-dimensions.js';
import { effectiveStrokeWidthMm, strokeWidthFloorMm } from './min-stroke-width.js';
import { REFERENCE_THEME, paintColor, type RenderTheme } from './theme.js';
import { assertValidRenderTheme } from './theme-validation.js';
import {
  haloFilled,
  haloLinejoin,
  haloStrokeWidthMm,
  resolveHalo,
  type ResolvedHalo,
} from './halo.js';

export interface CanvasOptions {
  /** Pixelbreite. Ohne Angabe wird in SVG-Einheiten gezeichnet. */
  size?: number;
  /** Farbprofil der Ausgabe. Ohne Angabe wird die unveränderte Referenzpalette verwendet. */
  theme?: RenderTheme;
  /**
   * Mindeststrichbreite in Pixeln der Ausgabe (LFH-584), dieselbe Rechnung wie
   * `SvgOptions.minStrokeWidthPx`. Standardmäßig aus; verlangt `size`. Gemeint sind die Pixel der
   * Leinwand — bei HiDPI also Gerätepixel, nicht CSS-Pixel.
   */
  minStrokeWidthPx?: number;
}

function color(
  token: ColorToken | 'none',
  theme: RenderTheme,
  role: Primitive['role'],
): string {
  return token === 'none' ? 'transparent' : paintColor(theme, token, role);
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

function textFont(primitive: Extract<Primitive, { type: 'text' }>): string {
  // Gewicht wie in svg.ts: 400 bleibt ungeschrieben, 500 und 700 stehen vor dem Schriftgrad.
  // Der Stil steht nach CSS-Kurzschreibweise davor („italic 500 12px Einsatzzeichen Sans", LFH-585).
  const weight = primitive.fontWeight;
  return `${primitive.fontStyle === 'italic' ? 'italic ' : ''}` +
    `${weight === undefined || weight === 400 ? '' : `${weight} `}` +
    `${mmToUnits(primitive.sizeMm)}px ${TEXT_FONT_FAMILY_ATTR}`;
}

/**
 * Hinterlegung eines Blatts (ESZ-119), dieselbe Rechnung wie `haloAttrs` in svg.ts: Fläche in der
 * Hinterlegungsfarbe füllen, mit runden Kappen und den Ecken der Tinte (`haloLinejoin`) um
 * `sideMm` je Seite über die sichtbare Kante hinaus umranden, ohne Strichmuster. `lineWidth` steht
 * bei Pfaden im Rohmaß Millimeter (unter `scale(mmToUnits(1))`), sonst in Einheiten. Die
 * Transformation hat der Aufrufer gesetzt.
 */
function drawHalo(
  primitive: Exclude<Primitive, { type: 'group' }>,
  ctx: CanvasRenderingContext2D,
  style: Style | undefined,
  role: Primitive['role'],
  theme: RenderTheme,
  halo: ResolvedHalo,
  strokeFloorMm: number | undefined,
): void {
  const fillOnly = primitive.type === 'text';
  const widthMm = haloStrokeWidthMm(style, halo, strokeFloorMm, { fillOnly, role, theme });
  if (widthMm === undefined) return;
  ctx.fillStyle = halo.color;
  ctx.strokeStyle = halo.color;
  ctx.lineCap = 'round';
  ctx.lineJoin = haloLinejoin(style, role, fillOnly);
  ctx.setLineDash([]);

  if (primitive.type === 'text') {
    ctx.font = textFont(primitive);
    ctx.textAlign = canvasTextAlign(primitive.anchor);
    ctx.textBaseline = canvasBaseline(primitive.baseline);
    ctx.lineWidth = mmToUnits(widthMm);
    const x = mmToUnits(primitive.x);
    const y = mmToUnits(primitive.y);
    ctx.strokeText(primitive.content, x, y);
    ctx.fillText(primitive.content, x, y);
    return;
  }

  if (primitive.type === 'path') {
    const path = new Path2D(primitive.d);
    ctx.scale(mmToUnits(1), mmToUnits(1));
    if (haloFilled(style)) ctx.fill(path, style?.fillRule ?? 'nonzero');
    ctx.lineWidth = widthMm;
    ctx.stroke(path);
    return;
  }

  ctx.beginPath();
  tracePrimitive(primitive, ctx);
  if (haloFilled(style)) ctx.fill(style?.fillRule ?? 'nonzero');
  ctx.lineWidth = mmToUnits(widthMm);
  ctx.stroke();
}

function drawPrimitive(
  primitive: Primitive,
  ctx: CanvasRenderingContext2D,
  theme: RenderTheme,
  strokeFloorMm: number | undefined,
  inheritedStyle?: Style,
  inheritedRole?: Primitive['role'],
  halo?: ResolvedHalo,
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
    for (const child of primitive.children) {
      drawPrimitive(child, ctx, theme, strokeFloorMm, style, role, halo);
    }
    ctx.restore();
    return;
  }

  if (halo !== undefined) {
    drawHalo(primitive, ctx, style, role, theme, halo, strokeFloorMm);
    ctx.restore();
    return;
  }

  if (primitive.type === 'path') {
    const path = new Path2D(primitive.d);
    ctx.save();
    ctx.scale(mmToUnits(1), mmToUnits(1));
    if (style?.fill !== undefined && style.fill !== 'none') {
      ctx.fillStyle = color(style.fill, theme, role);
      ctx.fill(path, style.fillRule ?? 'nonzero');
    }
    if (style?.stroke !== undefined && style.stroke !== 'none') {
      // Untergrenze in mm wie in svg.ts (styleAttrs): unter scale(mmToUnits(1)) gilt sie damit
      // ohne weitere Umrechnung im tatsächlichen Pixelraum.
      const strokeWidth = effectiveStrokeWidthMm(
        style.strokeWidth ?? DEFAULT_STROKE_WIDTH_MM,
        strokeFloorMm,
      );
      if (strokeWidth > 0) {
        ctx.strokeStyle = color(style.stroke, theme, role);
        // Rohes Millimetermaß: das umgebende scale(mmToUnits(1)) skaliert die Strichstärke
        // bereits mit. Eine zusätzliche mmToUnits-Umrechnung würde sie doppelt skalieren.
        ctx.lineWidth = strokeWidth;
        if (role === 'pictogram') {
          // Entspricht SVGs Butt/Round-Vertrag für das Clipping-Gate: je Blatt ist die halbe
          // Strichstärke (bei Linien senkrecht zur Richtung) damit eine konservative sichtbare
          // Piktogrammausdehnung.
          ctx.lineCap = 'butt';
          ctx.lineJoin = 'round';
        } else if (style.strokeLinejoin !== undefined) {
          ctx.lineJoin = style.strokeLinejoin;
        }
        const dashToken = style.bodyStrokeDashToken;
        const dash = role === 'body' && dashToken !== undefined
          ? theme.bodyStrokeDashes?.[dashToken]
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
      ctx.fillStyle = color(style.fill, theme, role);
      ctx.font = textFont(primitive);
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
    ctx.fillStyle = color(style.fill, theme, role);
    ctx.fill(style.fillRule ?? 'nonzero');
  }
  if (style?.stroke !== undefined && style.stroke !== 'none') {
    const strokeWidth = effectiveStrokeWidthMm(
      style.strokeWidth ?? DEFAULT_STROKE_WIDTH_MM,
      strokeFloorMm,
    );
    if (strokeWidth > 0) {
      ctx.strokeStyle = color(style.stroke, theme, role);
      ctx.lineWidth = mmToUnits(strokeWidth);
      if (role === 'pictogram') {
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'round';
      } else if (style.strokeLinejoin !== undefined) {
        ctx.lineJoin = style.strokeLinejoin;
      }
      const dashToken = style.bodyStrokeDashToken;
      const dash = role === 'body' && dashToken !== undefined
        ? theme.bodyStrokeDashes?.[dashToken]
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
  const raster = rasterDimensionsForWidth(drawing.viewBox, options.size ?? 1);
  // Vor jeder Leinwandmutation: eine ungültige Untergrenze bricht ab, bevor etwas gezeichnet ist.
  const strokeFloorMm = strokeWidthFloorMm(
    drawing.viewBox,
    options.size,
    options.minStrokeWidthPx,
  );
  if (options.size !== undefined) {
    ctx.canvas.width = raster.widthPx;
    ctx.canvas.height = raster.heightPx;
  }
  ctx.save();
  if (options.size !== undefined) {
    const scale = raster.widthPx / mmToUnits(drawing.viewBox.width);
    ctx.scale(scale, scale);
  }
  // Mit Hinterlegung (ESZ-119) zuerst die ganze Zeichnung als Silhouette, darüber unverändert die
  // Zeichnung — dieselbe Reihenfolge wie in svg.ts.
  const halo = resolveHalo(theme, strokeFloorMm);
  if (halo !== undefined) {
    for (const child of drawing.children) {
      drawPrimitive(child, ctx, theme, strokeFloorMm, undefined, undefined, halo);
    }
  }
  for (const child of drawing.children) drawPrimitive(child, ctx, theme, strokeFloorMm);
  ctx.restore();
}
