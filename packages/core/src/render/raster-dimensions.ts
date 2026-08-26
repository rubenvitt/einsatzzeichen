import type { Drawing } from '@einsatzzeichen/schema';

export interface RasterDimensions {
  readonly widthPx: number;
  readonly heightPx: number;
}

function assertPositiveFiniteInteger(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0 || !Number.isInteger(value)) {
    throw new Error(`${name} muss eine endliche, positive ganze Zahl sein (ist ${String(value)}).`);
  }
}

function assertPositiveFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} muss endlich und positiv sein (ist ${String(value)}).`);
  }
}

/** Leitet aus einer Pixelbreite die proportional aufgerundeten Rastermaße ab. */
export function rasterDimensionsForWidth(
  viewBox: Drawing['viewBox'],
  widthPx: number,
): RasterDimensions {
  assertPositiveFiniteInteger(widthPx, 'Rasterbreite in Pixeln');
  assertPositiveFinite(viewBox.width, 'ViewBox-Breite in Millimetern');
  assertPositiveFinite(viewBox.height, 'ViewBox-Höhe in Millimetern');

  return {
    widthPx,
    heightPx: Math.ceil((widthPx * viewBox.height) / viewBox.width),
  };
}
