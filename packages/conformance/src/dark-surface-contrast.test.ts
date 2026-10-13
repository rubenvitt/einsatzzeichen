import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';
import {
  ACCESSIBLE_LIGHT_THEME,
  DARK_THEME,
  REFERENCE_THEME,
  checkContrast,
  contrastRatio,
  drawSymbol,
  relativeLuminance,
  renderSvg,
  type RenderTheme,
} from '@einsatzzeichen/core';
import type { Drawing, RgbHex } from '@einsatzzeichen/schema';
import { RENDER_CASES } from './test-support/render-cases.js';
import { resvgFontOptions } from './fonts.js';

/**
 * Kontrast auf dunklen Flächen (ESZ-119). Der Lifeline Hub zeichnet im Nachtbetrieb auf
 * `#141414`; `renderSvg` zeichnet keinen Untergrund, schwarze Konturen und eine Formation ohne
 * Organisation (`fill="none"`) verschwanden dort. Das Theme `dark` legt jede Tinte auf eine
 * weiße Hinterlegung. Belegt wird das zweistufig:
 *
 * 1. **Farben.** Hinterlegung gegen dunklen Grund ≥ 7 : 1, und jede Kontrastzusicherung gegen
 *    die Oberfläche gilt im dunklen Theme wie in accessible-light, weil Tinte dort an die
 *    Hinterlegung grenzt, nicht an den Grund.
 * 2. **Pixel.** Gerastert auf transparentem Grund und auf `#141414` zusammengesetzt: Kein deckendes
 *    Pixel mit weniger als 7 : 1 gegen den Grund liegt näher als `RADIUS_PX` an blankem Grund.
 *    Jede dunkle oder mittlere Tinte ist also durch einen hellen Rand vom Grund getrennt. Dieselbe
 *    Prüfung schlägt mit dem Referenztheme an der ungefüllten Formation an — sie misst den Befund
 *    aus dem Ticket, nicht nur eine Eigenschaft des neuen Themes.
 */

const GROUND: RgbHex = '#141414';
const MINIMUM = 7;
/** 256 px: 0,5 mm Hinterlegung sind 4 px. Zwei Pixel Abstand lassen Kantenglättung Platz. */
const SIZE = 256;
const RADIUS_PX = 2;
const OPAQUE = 0.95;
const BARE = 0.05;

const FORMATION_WITHOUT_ORGANIZATION: Drawing = drawSymbol({ kind: 'formation' });

interface GroundRaster {
  readonly width: number;
  readonly height: number;
  readonly alpha: Float64Array;
  /** Kontrast jedes auf den Grund gesetzten Pixels gegen den Grund. */
  readonly contrast: Float64Array;
}

/** Lineare Kanalwerte für 0–255, einmal berechnet; dieselbe Formel wie `relativeLuminance`. */
const LINEAR = Array.from({ length: 256 }, (_, value) => {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
});

function rasterOnGround(drawing: Drawing, theme: RenderTheme): GroundRaster {
  const svg = renderSvg(drawing, { size: SIZE, theme });
  const image = new Resvg(svg, { font: resvgFontOptions() }).render();
  // `pixels` kopiert bei jedem Zugriff den ganzen Puffer (siehe multi-size-snapshots.test.ts).
  const pixels = image.pixels;
  const count = image.width * image.height;
  const alpha = new Float64Array(count);
  const contrast = new Float64Array(count);
  const ground = 0x14;
  const groundLuminance = relativeLuminance(GROUND);
  for (let index = 0; index < count; index += 1) {
    const a = (pixels[index * 4 + 3] ?? 0) / 255;
    alpha[index] = a;
    // resvg liefert unvormultipliziertes RGBA; über den Grund gelegt wie jeder Browser, auf
    // 8 bit gerundet wie ein Bildschirmpuffer.
    const linear = (offset: number): number =>
      LINEAR[Math.round((pixels[index * 4 + offset] ?? 0) * a + ground * (1 - a))] ?? 0;
    const luminance = 0.2126 * linear(0) + 0.7152 * linear(1) + 0.0722 * linear(2);
    contrast[index] = (Math.max(luminance, groundLuminance) + 0.05) /
      (Math.min(luminance, groundLuminance) + 0.05);
  }
  return { width: image.width, height: image.height, alpha, contrast };
}

/** Deckende Pixel unter 7 : 1, die näher als `RADIUS_PX` an blankem Grund liegen. */
function exposedInk(raster: GroundRaster): number {
  const { width, height, alpha, contrast } = raster;
  let exposed = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if ((alpha[index] ?? 0) < OPAQUE || (contrast[index] ?? 0) >= MINIMUM) continue;
      let nearGround = false;
      for (let dy = -RADIUS_PX; dy <= RADIUS_PX && !nearGround; dy += 1) {
        for (let dx = -RADIUS_PX; dx <= RADIUS_PX && !nearGround; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          // Außerhalb des Bildes liegt kein Grund dieses Zeichens: Was am ViewBox-Rand endet,
          // ist dort abgeschnitten, nicht freigestellt.
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          if ((alpha[ny * width + nx] ?? 0) <= BARE) nearGround = true;
        }
      }
      if (nearGround) exposed += 1;
    }
  }
  return exposed;
}

describe('Theme für dunkle Flächen (ESZ-119)', () => {
  it('trennt Tinte und dunklen Grund durch eine Hinterlegung mit mindestens 7 : 1', () => {
    const halo = DARK_THEME.halo;
    expect(halo).toBeDefined();
    if (halo === undefined) return;
    expect(DARK_THEME.surface).toBe(GROUND);
    expect(contrastRatio(halo.color, GROUND)).toBeGreaterThanOrEqual(MINIMUM);
    // „#141414-artig“: jeder Grund bis zur Helligkeit von #333333 hält die Schwelle.
    expect(relativeLuminance('#333333')).toBeGreaterThan(relativeLuminance(GROUND));
    expect(contrastRatio(halo.color, '#333333')).toBeGreaterThanOrEqual(MINIMUM);
    // Kopfmarken und Fahrwerk stehen ohne Hinterlegung in eigener Tinte auf dem Grund.
    for (const ink of Object.values(DARK_THEME.surfaceMarkInk ?? {})) {
      expect(contrastRatio(ink, GROUND)).toBeGreaterThanOrEqual(MINIMUM);
    }
    // Ohne Hinterlegung stünde Schwarz direkt auf dem Grund.
    expect(contrastRatio('#000000', GROUND)).toBeLessThan(1.5);
  });

  it('übernimmt jede Zusicherung gegen die Oberfläche unverändert von accessible-light', () => {
    const requirements = (['schwarz', 'rot', 'blau', 'gruen', 'hellblau'] as const).map(
      (foreground) => ({
        foreground,
        background: 'surface' as const,
        context: `${foreground} auf der Oberfläche`,
        minimum: 3,
      }),
    );
    const strip = (issues: ReturnType<typeof checkContrast>) =>
      issues.map(({ themeId: _themeId, ...rest }) => rest);
    expect(strip(checkContrast(DARK_THEME, requirements)))
      .toEqual(strip(checkContrast(ACCESSIBLE_LIGHT_THEME, requirements)));
    expect(DARK_THEME.palette).toBe(ACCESSIBLE_LIGHT_THEME.palette);
  });

  it('belegt den Befund: im Referenztheme grenzt die ungefüllte Formation schwarz an den Grund', () => {
    expect(exposedInk(rasterOnGround(FORMATION_WITHOUT_ORGANIZATION, REFERENCE_THEME)))
      .toBeGreaterThan(100);
  });

  it('stellt im dunklen Theme keine Tinte unter 7 : 1 ohne Rand auf den Grund', () => {
    expect(exposedInk(rasterOnGround(FORMATION_WITHOUT_ORGANIZATION, DARK_THEME))).toBe(0);
  });

  it(
    'hält das für jeden Renderfall: Grundzeichen, Rezepte und Piktogramme',
    () => {
      const offenders = RENDER_CASES
        .map((renderCase) => ({
          id: renderCase.id,
          exposed: exposedInk(rasterOnGround(renderCase.drawing, DARK_THEME)),
        }))
        .filter((entry) => entry.exposed > 0);
      expect(offenders).toEqual([]);
    },
    300_000,
  );
});
