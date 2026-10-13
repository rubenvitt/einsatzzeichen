import {
  DEFAULT_STROKE_WIDTH_MM,
  type ColorToken,
  type Primitive,
  type RgbHex,
  type Style,
} from '@einsatzzeichen/schema';
import { effectiveStrokeWidthMm } from './min-stroke-width.js';
import { SURFACE_MARK_ROLES, type RenderTheme } from './theme.js';

/**
 * Hinterlegung, wie beide Renderer sie zeichnen (ESZ-119, siehe `RenderTheme.halo`). Beide rechnen
 * hier und nirgends sonst, damit SVG und Canvas aus derselben IR dieselbe Silhouette erzeugen.
 */
export interface ResolvedHalo {
  readonly color: RgbHex;
  /** Breite je Seite in Millimetern, schon auf die Mindeststrichbreite angehoben. */
  readonly sideMm: number;
}

/**
 * Löst die Hinterlegung eines Themes für eine Ausgabe auf. Mit Mindeststrichbreite
 * (`minStrokeWidthPx`) wird auch die Hinterlegung je Seite mindestens so breit: Bei 24 px wären
 * die 0,5 mm der dunklen Vorgabe nur 0,375 px, und eine Hinterlegung unter einem Pixel ist auf
 * dunklem Grund eine graue Spur statt einer Kante (dieselbe Begründung wie LFH-584).
 */
export function resolveHalo(
  theme: RenderTheme,
  strokeFloorMm: number | undefined,
): ResolvedHalo | undefined {
  const halo = theme.halo;
  if (halo === undefined) return undefined;
  return {
    color: halo.color,
    sideMm: strokeFloorMm === undefined ? halo.widthMm : Math.max(halo.widthMm, strokeFloorMm),
  };
}

/**
 * Strichstärke der Hinterlegung eines Blatts in Millimetern, oder `undefined`, wenn das Blatt
 * nichts malt und deshalb auch keine Hinterlegung bekommt. Eine Fläche wird gefüllt und um
 * `sideMm` je Seite umrandet; ein Strich wird um `sideMm` je Seite verbreitert. Text kennt keinen
 * Strich (`fillOnly`), seine Hinterlegung ist ein Strich von `2 × sideMm` um die Glyphen.
 */
export function haloStrokeWidthMm(
  style: Style | undefined,
  halo: ResolvedHalo,
  strokeFloorMm: number | undefined,
  options: { fillOnly?: boolean; role?: Primitive['role']; theme?: RenderTheme } = {},
): number | undefined {
  const filled = haloFilled(style);
  const stroked = !options.fillOnly && style?.stroke !== undefined && style.stroke !== 'none';
  const strokeMm = stroked
    ? effectiveStrokeWidthMm(style?.strokeWidth ?? DEFAULT_STROKE_WIDTH_MM, strokeFloorMm)
    : 0;
  if (!filled && strokeMm <= 0) return undefined;
  if (ownsSurfaceInk(style, filled, strokeMm > 0, options.role, options.theme)) return undefined;
  return strokeMm + 2 * halo.sideMm;
}

/**
 * Eine Oberflächenmarke, deren sämtliche Farben das Theme ersetzt (`surfaceMarkInk`), braucht
 * keine Hinterlegung (siehe `RenderTheme.surfaceMarkInk`).
 */
function ownsSurfaceInk(
  style: Style | undefined,
  filled: boolean,
  stroked: boolean,
  role: Primitive['role'],
  theme: RenderTheme | undefined,
): boolean {
  if (theme?.surfaceMarkInk === undefined || role === undefined) return false;
  if (!SURFACE_MARK_ROLES.has(role)) return false;
  const replaced = (token: ColorToken | 'none' | undefined): boolean =>
    token !== undefined && token !== 'none' && theme.surfaceMarkInk?.[token] !== undefined;
  return (!filled || replaced(style?.fill)) && (!stroked || replaced(style?.stroke));
}

/**
 * Eckenform der Hinterlegung. Sie folgt der Tinte: Eine gegehrte Spitze ragt um ein Vielfaches der
 * halben Strichstärke hinaus, eine runde Hinterlegung bliebe dahinter zurück und die Spitze stünde
 * ohne Rand auf dem Untergrund. Gleiche Gehrung bei breiterem Strich reicht dagegen immer
 * mindestens `sideMm` weiter, im selben Renderer auch unter derselben Gehrungsgrenze. Piktogramme
 * tragen runde Ecken (Vertrag des Clipping-Gates), Flächen ohne Strich und Text ebenfalls rund.
 */
export function haloLinejoin(
  style: Style | undefined,
  role: Primitive['role'],
  fillOnly = false,
): 'miter' | 'bevel' | 'round' {
  const stroked =
    !fillOnly && style?.stroke !== undefined && style.stroke !== 'none';
  if (!stroked || role === 'pictogram') return 'round';
  // Nur über den bekannten Wert, nie als Rohwert: svg.ts schreibt das Ergebnis ins Markup.
  return style?.strokeLinejoin === 'bevel' ? 'bevel' : 'miter';
}

export function haloFilled(style: Style | undefined): boolean {
  return style?.fill !== undefined && style.fill !== 'none';
}
