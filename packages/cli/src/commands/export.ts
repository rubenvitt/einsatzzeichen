import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BASE_SYMBOLS, baseDrawing } from '@einsatzzeichen/core';
import { REFERENCE_THEME, renderSvg, type RenderTheme } from '@einsatzzeichen/core';
import { exportRecipeDrawings } from './export-recipes.js';

/*
 * Export gehört zum Produkt: Geometrie, Themes und Renderer kommen aus `@einsatzzeichen/core`.
 * Die Rezeptliste liegt noch im Prüfpaket und ist in `export-recipes.ts` gekapselt (LFH-572,
 * Ablösung mit LFH-580). `cli-packages.test.ts` hält fest, dass dieses Modul `conformance` nicht
 * direkt importiert.
 */

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

  for (const { id, drawing } of exportRecipeDrawings()) {
    const svg = renderSvg(drawing, { size, theme });
    writeFileSync(join(outDir, `${id}.svg`), svg, 'utf8');
    count += 1;
  }

  console.log(`${count} Zeichen mit Theme "${theme.id}" nach ${outDir} exportiert.`);
}
