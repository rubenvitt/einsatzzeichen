import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BASE_SYMBOLS, RECIPES, baseDrawing, composeFromCatalog } from '@einsatzzeichen/catalog';
import { renderSvg } from '@einsatzzeichen/core';

export function exportSvg(outDir: string, size: number): void {
  mkdirSync(outDir, { recursive: true });
  let count = 0;

  for (const entry of Object.values(BASE_SYMBOLS)) {
    const svg = renderSvg(baseDrawing(entry.kind), { size });
    writeFileSync(join(outDir, `${entry.id}.svg`), svg, 'utf8');
    count += 1;
  }

  for (const [section, recipe] of Object.entries(RECIPES)) {
    const svg = renderSvg(composeFromCatalog(recipe.spec), { size });
    writeFileSync(join(outDir, `${section}.svg`), svg, 'utf8');
    count += 1;
  }

  console.log(`${count} Zeichen nach ${outDir} exportiert.`);
}
