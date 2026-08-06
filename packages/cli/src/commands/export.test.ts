import { describe, expect, it } from 'vitest';
import { InvalidExportSizeError, exportSvg, parseExportSize } from './export.js';

describe('Exportgröße', () => {
  it.each(['0', '-1', 'nope', 'Infinity', 'NaN'])(
    'lehnt den ungültigen CLI-Wert %s ab',
    (value) => {
      expect(() => parseExportSize(value)).toThrow(InvalidExportSizeError);
    },
  );

  it('akzeptiert eine positive endliche Pixelgröße', () => {
    expect(parseExportSize('64')).toBe(64);
    expect(parseExportSize('32.5')).toBe(32.5);
  });

  it('schützt auch direkte Aufrufer vor ungültiger Ausgabe', () => {
    expect(() => exportSvg('/does/not/matter', Number.NaN)).toThrow(InvalidExportSizeError);
    expect(() => exportSvg('/does/not/matter', 0)).toThrow(InvalidExportSizeError);
  });
});
