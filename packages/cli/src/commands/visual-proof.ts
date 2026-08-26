import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { Resvg, type RenderedImage } from '@resvg/resvg-js';
import { RECIPES, composeFromCatalog, resvgFontOptions } from '@einsatzzeichen/catalog';
import { REFERENCE_THEME, renderSvg } from '@einsatzzeichen/core';

const COLUMNS = 3;
const CARD_WIDTH = 720;
const CARD_HEIGHT = 360;
const IMAGE_WIDTH = 300;
const IMAGE_HEIGHT = 276;
const IMAGE_RASTER_SIZE = 276;

export const ANHANG_G_PROOF_WIDTH = COLUMNS * CARD_WIDTH;
export const ANHANG_G_PROOF_HEIGHT = 7 * CARD_HEIGHT;
export const DEFAULT_ANHANG_G_PROOF_OUTPUT = 'out/lfh-421/anhang-g-reference-vs-catalog.png';

export interface AnhangGProofOptions {
  referenceRoot: string;
  outputFile?: string;
}

export interface AnhangGProofResult {
  outputFile: string;
  width: number;
  height: number;
  byteLength: number;
  sha256: string;
  sections: readonly string[];
}

export interface AnhangGProofInventoryEntry {
  section: string;
  referenceAsset: string;
}

function anhangGRecipes() {
  return Object.entries(RECIPES).filter(([section]) => /^G(?:\.|$)/u.test(section));
}

export function anhangGProofInventory(): readonly AnhangGProofInventoryEntry[] {
  return anhangGRecipes().map(([section, recipe]) => ({
    section,
    referenceAsset: recipe.referenceAsset,
  }));
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function pngDataUrl(png: Buffer): string {
  return `data:image/png;base64,${png.toString('base64')}`;
}

export function rasterizeVisualProofSvg(svg: string): RenderedImage {
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: IMAGE_RASTER_SIZE },
    font: resvgFontOptions(),
  }).render();
}

function proofSvg(referenceRoot: string): { svg: string; sections: readonly string[] } {
  const recipes = anhangGRecipes();
  if (recipes.length !== 21) {
    throw new Error(`Anhang-G-Proof benötigt exakt 21 Rezepte, fand ${recipes.length}.`);
  }

  const cards = recipes.map(([section, recipe], index) => {
    const column = index % COLUMNS;
    const row = Math.floor(index / COLUMNS);
    const x = column * CARD_WIDTH;
    const y = row * CARD_HEIGHT;
    const referenceSvg = readFileSync(join(referenceRoot, recipe.referenceAsset), 'utf8');
    const catalogSvg = renderSvg(composeFromCatalog(recipe.spec, recipe.title), {
      size: IMAGE_WIDTH,
      theme: REFERENCE_THEME,
      idPrefix: `visual-proof-${section.replaceAll('.', '-')}`,
    });
    const referencePng = rasterizeVisualProofSvg(referenceSvg).asPng();
    const catalogPng = rasterizeVisualProofSvg(catalogSvg).asPng();

    return (
      `<g data-section="${escapeXml(section)}">` +
      `<rect x="${x + 1}" y="${y + 1}" width="${CARD_WIDTH - 2}" ` +
      `height="${CARD_HEIGHT - 2}" rx="8" fill="#ffffff" stroke="#a8adb4" stroke-width="2"/>` +
      `<text x="${x + 20}" y="${y + 28}" font-family="Arimo" font-size="21" ` +
      `font-weight="700" fill="#111111">${escapeXml(section)}</text>` +
      `<text x="${x + 92}" y="${y + 28}" font-family="Arimo" font-size="15" ` +
      `fill="#30343a">${escapeXml(recipe.title)}</text>` +
      `<text x="${x + 170}" y="${y + 54}" text-anchor="middle" font-family="Arimo" ` +
      `font-size="14" font-weight="700" fill="#30343a">LOKALE REFERENZ</text>` +
      `<text x="${x + 550}" y="${y + 54}" text-anchor="middle" font-family="Arimo" ` +
      `font-size="14" font-weight="700" fill="#30343a">AKTUELLER KATALOG</text>` +
      `<image x="${x + 20 + (IMAGE_WIDTH - IMAGE_RASTER_SIZE) / 2}" y="${y + 66}" ` +
      `width="${IMAGE_RASTER_SIZE}" height="${IMAGE_HEIGHT}" ` +
      `href="${pngDataUrl(referencePng)}"/>` +
      `<image x="${x + 400 + (IMAGE_WIDTH - IMAGE_RASTER_SIZE) / 2}" y="${y + 66}" ` +
      `width="${IMAGE_RASTER_SIZE}" height="${IMAGE_HEIGHT}" ` +
      `href="${pngDataUrl(catalogPng)}"/>` +
      `</g>`
    );
  });

  return {
    svg:
      `<svg xmlns="http://www.w3.org/2000/svg" width="${ANHANG_G_PROOF_WIDTH}" ` +
      `height="${ANHANG_G_PROOF_HEIGHT}" viewBox="0 0 ${ANHANG_G_PROOF_WIDTH} ` +
      `${ANHANG_G_PROOF_HEIGHT}">` +
      `<rect width="100%" height="100%" fill="#f0f2f5"/>` +
      `<title>Anhang G — lokale Referenz und aktueller Katalog</title>` +
      cards.join('') +
      `</svg>`,
    sections: recipes.map(([section]) => section),
  };
}

export function generateAnhangGVisualProof(
  options: AnhangGProofOptions,
): AnhangGProofResult {
  const outputFile = options.outputFile ?? DEFAULT_ANHANG_G_PROOF_OUTPUT;
  const allowedOutputRoot = `${resolve('out/lfh-421')}${sep}`;
  if (!resolve(outputFile).startsWith(allowedOutputRoot)) {
    throw new Error('Visual-Proof-Ausgaben sind ausschließlich unter out/lfh-421 zulässig.');
  }
  const { svg, sections } = proofSvg(options.referenceRoot);
  const image = new Resvg(svg, {
    background: '#f0f2f5',
    font: resvgFontOptions(),
  }).render();
  if (image.width !== ANHANG_G_PROOF_WIDTH || image.height !== ANHANG_G_PROOF_HEIGHT) {
    throw new Error(
      `Unerwartete Proof-Abmessungen ${image.width}x${image.height}; erwartet ` +
        `${ANHANG_G_PROOF_WIDTH}x${ANHANG_G_PROOF_HEIGHT}.`,
    );
  }

  const png = image.asPng();
  mkdirSync(dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, png);

  return {
    outputFile,
    width: image.width,
    height: image.height,
    byteLength: png.byteLength,
    sha256: createHash('sha256').update(png).digest('hex'),
    sections,
  };
}
