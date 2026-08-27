import { readdirSync } from 'node:fs';
import { Resvg, type RenderedImage } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';
import {
  rasterDimensionsForWidth,
  renderSvg,
  type RenderTheme,
} from '@einsatzzeichen/core';
import type { Drawing } from '@einsatzzeichen/schema';
import {
  ACCESSIBLE_LIGHT_THEME,
  PRINT_MONOCHROME_THEME,
  RENDER_THEMES,
} from './render-themes.js';
import { RENDER_CASES, type RenderCase } from './test-support/render-cases.js';
import { composeFromCatalog } from './recipes.js';
import { resvgFontOptions } from './fonts.js';

const SIZES = [16, 24, 32, 64, 128, 256] as const;
const GAP = 12;
const LARGE = 256;
const MEASURED_TOP_EDGE_HEADS = new Set([
  'recipe.D.3.1',
  'recipe.D.3.3',
  'recipe.D.3.4',
  'recipe.D.4.1',
  'recipe.D.4.2',
  'recipe.D.4.3',
  'recipe.D.4.4',
  'recipe.D.4.5',
]);

const RECTANGULAR_FIXTURE: Drawing = {
  viewBox: { width: 32, height: 46 },
  children: [
    {
      type: 'rect',
      x: 1,
      y: 1,
      width: 30,
      height: 44,
      style: { fill: 'schwarz' },
    },
  ],
};

interface Raster {
  width: number;
  height: number;
  pngBase64: string;
}

function rasterize(renderCase: RenderCase, size: number, theme: RenderTheme): Raster {
  const svg = renderSvg(renderCase.drawing, {
    size,
    theme,
    idPrefix: `${renderCase.id}-${theme.id}-${size}`,
  });
  const image = new Resvg(svg, {
    // Seit Task 9 ist die Schriftbindung verpflichtend (`resvgFontOptions()`, `fontFiles` +
    // `loadSystemFonts: false`): `@resvg/resvg-js` rastert Text ohne Fontdatei zu null Pixeln
    // (siehe `fonts.test.ts`, „rastert Text überhaupt"), Systemschriften wären dagegen
    // maschinenabhängig. Beide Konfigurationen würden hier stillschweigend bestehen — ein
    // Zeichen mit unsichtbarem oder rechnerabhängigem Text bliebe ein grüner Snapshot. Die
    // Zeichnungen in `RENDER_CASES` enthalten aktuell kein Textprimitiv; diese Umstellung
    // ändert die bestehenden Snapshots deshalb nicht.
    font: resvgFontOptions(),
  }).render();
  const expected = rasterDimensionsForWidth(renderCase.drawing.viewBox, size);
  expect(image.width, `${renderCase.id}/${theme.id}/${size}: Breite`).toBe(expected.widthPx);
  expect(image.height, `${renderCase.id}/${theme.id}/${size}: Höhe`).toBe(expected.heightPx);
  expect(hasVisiblePixel(image), `${renderCase.id}/${theme.id}/${size}: leere Rasterung`).toBe(true);
  if (size === LARGE) {
    expect(
      touchesOuterBorder(image, MEASURED_TOP_EDGE_HEADS.has(renderCase.id)),
      `${renderCase.id}/${theme.id}/${size}: sichtbare Tinte berührt den Außenrand`,
    ).toBe(false);
  }
  return {
    width: image.width,
    height: image.height,
    pngBase64: image.asPng().toString('base64'),
  };
}

// `image.pixels` einmal abgreifen — derselbe teure Getter wie in `fonts.test.ts`
// (`countDarkInkPixels`): jeder Zugriff kopiert den vollständigen RGBA-Puffer. In der
// Schleifenbedingung bzw. im Pixel-Zugriff aufgerufen wird daraus eine quadratische Laufzeit mit
// zweistelligen Gigabyte an Müll pro Bild; nachgemessen 592 s und 19,6 GB Spitzenspeicher für
// diese Datei gegenüber 1,6 s und 183 MB danach. Auf einem 16-GB-Runner wurde der Prozess dabei
// vom OOM-Killer beendet, was die gesamte CI-Maschine mitnahm.
function hasVisiblePixel(image: RenderedImage): boolean {
  const pixels = image.pixels;
  for (let index = 3; index < pixels.length; index += 4) {
    if ((pixels[index] ?? 0) > 0) return true;
  }
  return false;
}

function touchesOuterBorder(image: RenderedImage, allowTopBorder = false): boolean {
  const pixels = image.pixels;
  const alphaAt = (x: number, y: number): number => pixels[(y * image.width + x) * 4 + 3] ?? 0;
  for (let x = 0; x < image.width; x += 1) {
    // Die vermessenen Verwaltungssterne reichen bei D.3.1/.3/.4 und D.4.1–D.4.5 absichtlich bis
    // y=0. Nur dieser obere Rand ist zulässig; Seiten und Unterkante bleiben fail-closed.
    if ((!allowTopBorder && alphaAt(x, 0) > 0) || alphaAt(x, image.height - 1) > 0) return true;
  }
  for (let y = 0; y < image.height; y += 1) {
    if (alphaAt(0, y) > 0 || alphaAt(image.width - 1, y) > 0) return true;
  }
  return false;
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function imageTag(
  raster: Raster,
  cellX: number,
  cellWidth: number,
  y: number,
  label: string,
): string {
  const imageX = cellX + (cellWidth - raster.width) / 2;
  const labelX = cellX + cellWidth / 2;
  return (
    `<image x="${imageX}" y="${y}" width="${raster.width}" height="${raster.height}" ` +
    `href="data:image/png;base64,${raster.pngBase64}"/>` +
    `<text x="${labelX}" y="${y + raster.height + 16}" text-anchor="middle" ` +
    `font-family="sans-serif" font-size="11" fill="#000000">${escapeXml(label)}</text>`
  );
}

function contactSheet(renderCase: RenderCase): string {
  const operational = SIZES.map((size) =>
    rasterize(renderCase, size, RENDER_THEMES.reference),
  );
  const profiles = [
    rasterize(renderCase, LARGE, ACCESSIBLE_LIGHT_THEME),
    rasterize(renderCase, LARGE, PRINT_MONOCHROME_THEME),
  ];

  const operationalCellWidths = operational.map((raster) => Math.max(raster.width, 64));
  const operationalMaxHeight = Math.max(...operational.map((raster) => raster.height));
  const profileMaxHeight = Math.max(...profiles.map((raster) => raster.height));
  const operationalWidth = operationalCellWidths.reduce((sum, cellWidth) => sum + cellWidth, 0);
  const contentWidth = Math.max(
    operationalWidth + GAP * (operational.length - 1),
    profiles.reduce((sum, raster) => sum + raster.width, 0) + GAP,
  );
  const width = contentWidth + 24;
  const firstTop = 40;
  const firstBottom = firstTop + operationalMaxHeight;
  const secondTop = firstBottom + 48;
  const height = secondTop + profileMaxHeight + 34;

  let operationalX = 12;
  const operationalImages = operational
    .map((raster, index) => {
      const cellWidth = operationalCellWidths[index] ?? raster.width;
      const tag = imageTag(
        raster,
        operationalX,
        cellWidth,
        firstTop + operationalMaxHeight - raster.height,
        `${raster.width} px`,
      );
      operationalX += cellWidth + GAP;
      return tag;
    })
    .join('');

  let profileX = 12;
  const profileImages = profiles
    .map((raster, index) => {
      const label = index === 0 ? ACCESSIBLE_LIGHT_THEME.id : PRINT_MONOCHROME_THEME.id;
      const tag = imageTag(raster, profileX, raster.width, secondTop, label);
      profileX += raster.width + GAP;
      return tag;
    })
    .join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">` +
    `<rect width="${width}" height="${height}" fill="#ffffff"/>` +
    `<title>${escapeXml(renderCase.id)} — Mehrgrößen- und Profilregression</title>` +
    `<text x="12" y="20" font-family="sans-serif" font-size="14" ` +
    `font-weight="bold" fill="#000000">${escapeXml(renderCase.id)} · Referenztheme</text>` +
    operationalImages +
    `<text x="12" y="${secondTop - 14}" font-family="sans-serif" font-size="14" ` +
    `font-weight="bold" fill="#000000">Kontrast- und Druckprofile · 256px</text>` +
    profileImages +
    `</svg>`
  );
}

const ORGANIZATION_IDS = [
  'feuerwehr',
  'thw',
  'fuehrung-leitung',
  'polizei',
  'bundespolizei',
  'bundeswehr',
  'sonstige-gefahrenabwehr',
  'zivile-einheiten',
] as const;

const ORGANIZATION_CASES: readonly RenderCase[] = ORGANIZATION_IDS.map((organization) => ({
  id: `organization.${organization}`,
  drawing: composeFromCatalog(
    { kind: 'formation', organization, capabilities: ['fire-fighting'] },
    `Organisationsprofil ${organization}`,
  ),
}));

function organizationProfileSheet(): string {
  const size = 64;
  const cellWidth = 138;
  const left = 12;
  const rowGap = 42;
  const firstTop = 42;
  const rowStride = size + rowGap + 28;
  const themes = Object.values(RENDER_THEMES);
  const rowTops = themes.map((_theme, index) => firstTop + index * rowStride);
  const width = left * 2 + cellWidth * ORGANIZATION_CASES.length;
  const height = (rowTops.at(-1) ?? firstTop) + size + 30;

  function row(theme: RenderTheme, top: number): string {
    return ORGANIZATION_CASES.map((renderCase, index) => {
      const raster = rasterize(renderCase, size, theme);
      return imageTag(raster, left + index * cellWidth, cellWidth, top, renderCase.id.slice(13));
    }).join('');
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">` +
    `<rect width="${width}" height="${height}" fill="#ffffff"/>` +
    `<title>Organisationsprofile ohne alleinige Farbhue-Abhängigkeit</title>` +
    themes.map((theme, index) => {
      const top = rowTops[index] ?? firstTop;
      return (
        `<text x="12" y="${top - 14}" font-family="sans-serif" font-size="14" ` +
        `font-weight="bold">${escapeXml(theme.id)} · 64px</text>` +
        row(theme, top)
      );
    }).join('') +
    `</svg>`
  );
}

describe('echte Mehrgrößen- und Profilregression', () => {
  it('rastert eine rechteckige Testzeichnung proportional zur Pixelbreite', () => {
    const svg = renderSvg(RECTANGULAR_FIXTURE, { size: 64 });
    const image = new Resvg(svg).render();

    expect(image.width).toBe(64);
    expect(image.height).toBe(92);
  });

  it('schreibt exakt 498 Mehrgrößen-Snapshots', () => {
    const snapshots = readdirSync(new URL('./__snapshots__/multi-size/', import.meta.url), {
      withFileTypes: true,
    }).filter((entry) => entry.isFile() && entry.name.endsWith('.svg'));
    const names = snapshots.map((entry) => entry.name);
    expect(snapshots).toHaveLength(498);
    expect(names).toContain('recipe.C.1.3.svg');
    expect(names).toContain('recipe.G.1.svg');
    expect(names).toContain('recipe.G.8.svg');
    expect(names).toContain('recipe.I.1.5.svg');
    expect(names).toContain('recipe.I.1.6.svg');
    expect(names).toContain('recipe.I.1.7.svg');
    expect(names).toContain('recipe.I.1.8.svg');
    expect(names).toContain('recipe.I.1.17.svg');
    expect(names).toContain('recipe.I.1.18.svg');
    expect(names).toContain('recipe.I.1.19.svg');
    expect(names).toContain('recipe.I.1.20.svg');
    for (const section of Array.from({ length: 11 }, (_, index) => `I.3.${index + 1}`)) {
      expect(names).toContain(`recipe.${section}.svg`);
    }
    for (const section of Array.from({ length: 3 }, (_, index) => `I.4.${index + 1}`)) {
      expect(names).toContain(`recipe.${section}.svg`);
    }
    expect(names).toContain('recipe.N.1.1.svg');
    expect(names).toContain('recipe.N.2.3.svg');
  });

  it.each(RENDER_CASES)(
    '$id',
    async (renderCase) => {
      await expect(contactSheet(renderCase)).toMatchFileSnapshot(
        `./__snapshots__/multi-size/${renderCase.id}.svg`,
      );
    },
    15_000,
  );

  it(
    'rendert alle belegten Organisationen mit Farbe/Grauwert und eindeutiger Kontursignatur',
    async () => {
      await expect(organizationProfileSheet()).toMatchFileSnapshot(
        './__snapshots__/multi-size/organization-profiles.svg',
      );
    },
    20_000,
  );
});
