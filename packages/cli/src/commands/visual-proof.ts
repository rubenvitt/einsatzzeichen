import { createHash, randomBytes } from 'node:crypto';
import {
  closeSync,
  constants,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
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
  sourceSetDigest: string;
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

function proofSvg(referenceRoot: string): {
  svg: string;
  sections: readonly string[];
  sourceSetDigest: string;
} {
  const recipes = anhangGRecipes();
  if (recipes.length !== 21) {
    throw new Error(`Anhang-G-Proof benötigt exakt 21 Rezepte, fand ${recipes.length}.`);
  }

  const sourceSetRows: string[] = [];
  const cards = recipes.map(([section, recipe], index) => {
    const column = index % COLUMNS;
    const row = Math.floor(index / COLUMNS);
    const x = column * CARD_WIDTH;
    const y = row * CARD_HEIGHT;
    const referenceBytes = readFileSync(join(referenceRoot, recipe.referenceAsset));
    const referenceSvg = referenceBytes.toString('utf8');
    const contentDigest = createHash('sha256').update(referenceBytes).digest('hex');
    sourceSetRows.push(`${section}\t${recipe.referenceAsset}\t${contentDigest}\n`);
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
    sourceSetDigest: createHash('sha256').update(sourceSetRows.join('')).digest('hex'),
  };
}

function isErrorWithCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

function ensureRealDirectory(directory: string): void {
  try {
    mkdirSync(directory);
  } catch (error) {
    if (!isErrorWithCode(error, 'EEXIST')) throw error;
  }
  const stat = lstatSync(directory);
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new Error(`Visual-Proof-Ausgabepfad enthält kein echtes Verzeichnis: ${directory}.`);
  }
}

function safeOutputPath(outputFile: string): string {
  const outputRoot = resolve('out/lfh-421');
  const resolvedOutput = resolve(outputFile);
  const fromRoot = relative(outputRoot, resolvedOutput);
  if (
    fromRoot === '' ||
    fromRoot === '..' ||
    fromRoot.startsWith(`..${sep}`) ||
    isAbsolute(fromRoot)
  ) {
    throw new Error('Visual-Proof-Ausgaben sind ausschließlich unter out/lfh-421 zulässig.');
  }

  const outDirectory = dirname(outputRoot);
  ensureRealDirectory(outDirectory);
  ensureRealDirectory(outputRoot);
  let parent = outputRoot;
  const nestedParent = dirname(fromRoot);
  if (nestedParent !== '.') {
    for (const part of nestedParent.split(sep)) {
      parent = join(parent, part);
      ensureRealDirectory(parent);
    }
  }

  const realRoot = realpathSync(outputRoot);
  const realParent = realpathSync(parent);
  if (realParent !== realRoot && !realParent.startsWith(`${realRoot}${sep}`)) {
    throw new Error('Visual-Proof-Ausgabepfad verlässt die reale out/lfh-421-Grenze.');
  }
  return join(realParent, basename(resolvedOutput));
}

function writeProofPng(outputFile: string, png: Buffer): void {
  const destination = safeOutputPath(outputFile);
  let existingDescriptor: number | undefined;
  try {
    existingDescriptor = openSync(
      destination,
      constants.O_RDONLY | constants.O_NONBLOCK | constants.O_NOFOLLOW,
    );
    const existing = fstatSync(existingDescriptor);
    if (!existing.isFile() || existing.nlink !== 1) {
      throw new Error(
        'Visual-Proof-Ziel muss eine reguläre Datei mit genau einem Hardlink sein.',
      );
    }
  } catch (error) {
    if (!isErrorWithCode(error, 'ENOENT')) throw error;
  } finally {
    if (existingDescriptor !== undefined) closeSync(existingDescriptor);
  }

  // Die temporäre Datei entsteht im bereits verifizierten realen Parent. Der atomische Rename
  // ersetzt anschließend nur den Zielnamen; er dereferenziert weder einen später eingeschobenen
  // Symlink noch verändert er den Inode eines später eingeschobenen Hardlinks. Node stellt aber
  // kein portables openat/beneath bereit: ein gleichzeitig umbenannter/ersetzter Parent bleibt
  // außerhalb dieses lokalen CLI-Vertrags und verlangt exklusiven Zugriff auf den Outputbaum.
  const temporary = join(
    dirname(destination),
    `.${basename(destination)}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`,
  );
  let temporaryDescriptor: number | undefined;
  let renamed = false;
  try {
    temporaryDescriptor = openSync(
      temporary,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
      0o644,
    );
    writeFileSync(temporaryDescriptor, png);
    fsyncSync(temporaryDescriptor);
    closeSync(temporaryDescriptor);
    temporaryDescriptor = undefined;
    renameSync(temporary, destination);
    renamed = true;
  } finally {
    if (temporaryDescriptor !== undefined) closeSync(temporaryDescriptor);
    if (!renamed) {
      try {
        unlinkSync(temporary);
      } catch (error) {
        if (!isErrorWithCode(error, 'ENOENT')) throw error;
      }
    }
  }
}

export function generateAnhangGVisualProof(
  options: AnhangGProofOptions,
): AnhangGProofResult {
  const outputFile = options.outputFile ?? DEFAULT_ANHANG_G_PROOF_OUTPUT;
  const { svg, sections, sourceSetDigest } = proofSvg(options.referenceRoot);
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
  writeProofPng(outputFile, png);

  return {
    outputFile,
    width: image.width,
    height: image.height,
    byteLength: png.byteLength,
    sha256: createHash('sha256').update(png).digest('hex'),
    sourceSetDigest,
    sections,
  };
}
