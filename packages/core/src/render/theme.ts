import {
  PALETTE,
  type ColorPalette,
  type ColorToken,
  type PrimitiveRole,
  type RgbHex,
} from '@einsatzzeichen/schema';
import { assertValidRenderTheme } from './theme-validation.js';

/**
 * Farbvertrag am Rendererrand. `surface` ist der Untergrund, gegen den Kontrast zugesichert wird;
 * transparente SVGs können ihren späteren Untergrund nicht selbst erkennen.
 */
export interface RenderTheme {
  readonly id: string;
  readonly palette: ColorPalette;
  readonly surface: RgbHex;
  /**
   * Optionale, nicht-farbliche Organisationsmarke: Strich-/Lückenlängen in Millimetern für die
   * Körperkontur, adressiert über den expliziten `Style.bodyStrokeDashToken`. Die Körperfüllung
   * allein aktiviert keine Signatur, weil derselbe Farbtoken auch technisch verwendet werden kann.
   */
  readonly bodyStrokeDashes?: Readonly<Partial<Record<ColorToken, readonly number[]>>>;
  /**
   * Hinterlegung für dunkle Flächen (ESZ-119). Beide Renderer zeichnen jedes malende Blatt der
   * Zeichnung zuerst als Silhouette in `color`, um `widthMm` je Seite über seine sichtbare Kante
   * hinaus geweitet, und darüber die Zeichnung unverändert. Körperfüllungen decken die
   * Hinterlegung ihrer Innenzeichnung wieder zu; sichtbar bleibt sie nur dort, wo Tinte an den
   * Untergrund grenzt — an Konturen, Kopfmarken, Fahrwerken, Läufen außerhalb des Körpers und an
   * allem in einem ungefüllten Körper. Schwarze Schrift auf hellen Körpern bleibt schwarz.
   *
   * Mit Hinterlegung steht Tinte nie direkt auf `surface`, sondern auf `halo.color`; Kontrast
   * gegen die Oberfläche sichert deshalb `contrastSurface()` gegen diese Farbe zu.
   */
  readonly halo?: RenderHalo;
  /**
   * Eigene Tinte für Marken, die schon ihrer Rolle nach außerhalb jedes Körpers auf der Oberfläche
   * stehen (`SURFACE_MARK_ROLES`: Kopfmarken und Fahrwerk), je Farbmarke (ESZ-119). Auf dunklem
   * Grund werden Stärkepunkte, Verwaltungssterne und Räder damit hell statt schwarz gezeichnet, und
   * ein gefüllter Punkt bleibt ein gefüllter Punkt. Mit Hinterlegung umrandet wirkte er als Ring.
   * Marken, deren Farben alle hier ersetzt sind, bekommen keine Hinterlegung: Ihre Tinte steht für
   * sich auf dem Grund und hielte mit dem Rand ihr Maß nicht mehr. Innenzeichnung, Läufe und
   * Konturen behalten die Palette, weil dieselbe Rolle dort auf Körperfarbe stehen kann.
   */
  readonly surfaceMarkInk?: Readonly<Partial<Record<ColorToken, RgbHex>>>;
}

/** Rollen, deren Marken nie auf einem Körper liegen: die Kopfzone über, das Fahrwerk unter ihm. */
export const SURFACE_MARK_ROLES: ReadonlySet<PrimitiveRole> = new Set(['head', 'chassis']);

export interface RenderHalo {
  readonly color: RgbHex;
  /** Breite der Hinterlegung je Seite in Millimetern, gemessen ab der sichtbaren Kante. */
  readonly widthMm: number;
}

/** Unveränderte, aus dem BABZ-Referenzbestand extrahierte Darstellung. */
export const REFERENCE_THEME: RenderTheme = Object.freeze({
  id: 'reference',
  palette: PALETTE,
  surface: '#ffffff',
});

/**
 * Die Farbe, an die Tinte „auf der Oberfläche“ tatsächlich grenzt: die Hinterlegung, wenn das
 * Theme eine hat, sonst `surface`. Kontrastzusicherungen gegen `'surface'` rechnen hiermit.
 */
export function contrastSurface(theme: RenderTheme): RgbHex {
  assertValidRenderTheme(theme);
  return theme.halo === undefined ? theme.surface : theme.halo.color;
}

/**
 * Farbe, mit der ein Renderer eine Farbmarke an einem Blatt dieser Rolle malt: die Ersatztinte
 * für Oberflächenmarken, wenn das Theme eine hat, sonst die Palette.
 */
export function paintColor(
  theme: RenderTheme,
  token: ColorToken,
  role: PrimitiveRole | undefined,
): RgbHex {
  assertValidRenderTheme(theme);
  if (role !== undefined && SURFACE_MARK_ROLES.has(role)) {
    const ink = theme.surfaceMarkInk?.[token];
    if (ink !== undefined) return ink;
  }
  return theme.palette[token];
}

export function colorFor(theme: RenderTheme, token: ColorToken): RgbHex {
  assertValidRenderTheme(theme);
  return theme.palette[token];
}
