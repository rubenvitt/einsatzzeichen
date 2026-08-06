import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BASE_SYMBOLS, RECIPES, baseDrawing, composeFromCatalog } from '@einsatzzeichen/catalog';
import { REFERENCE_THEME, renderSvg, type RenderTheme } from '@einsatzzeichen/core';

export class InvalidExportSizeError extends Error {
  constructor(readonly value: string | number) {
    super(`--size muss eine endliche Zahl größer als 0 sein, ist aber "${value}".`);
    this.name = 'InvalidExportSizeError';
  }
}

function assertExportSize(size: number, original: string | number = size): void {
  if (!Number.isFinite(size) || size <= 0) throw new InvalidExportSizeError(original);
}

export function parseExportSize(value: string): number {
  const size = Number(value);
  assertExportSize(size, value);
  return size;
}

export function exportSvg(
  outDir: string,
  size: number,
  theme: RenderTheme = REFERENCE_THEME,
): void {
  assertExportSize(size);
  mkdirSync(outDir, { recursive: true });
  let count = 0;

  for (const entry of Object.values(BASE_SYMBOLS)) {
    const svg = renderSvg(baseDrawing(entry.kind), { size, theme });
    writeFileSync(join(outDir, `${entry.id}.svg`), svg, 'utf8');
    count += 1;
  }

  for (const [section, recipe] of Object.entries(RECIPES)) {
    const svg = renderSvg(composeFromCatalog(recipe.spec, recipe.title), { size, theme });
    writeFileSync(join(outDir, `${section}.svg`), svg, 'utf8');
    count += 1;
  }

  console.log(`${count} Zeichen mit Theme "${theme.id}" nach ${outDir} exportiert.`);
}
