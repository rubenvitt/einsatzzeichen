import { describe, expect, it } from 'vitest';
import * as root from '@einsatzzeichen/core';
import * as blocks from '@einsatzzeichen/core/blocks';
import * as exact from '@einsatzzeichen/core/exact';
import * as gates from '@einsatzzeichen/core/gates';
import * as sketch from '@einsatzzeichen/core/sketch';

/**
 * Die Einstiege von core ab 7.0 (ESZ-151). Die Wurzel ist die Beschreibung und ihre Ausgabe; alles
 * andere steht in einem Subpfad. Welcher Name von 6.x wohin gezogen ist, hält der Codemod fest
 * (`packages/cli/src/codemod/core-7-map.ts`, geprüft in `core-7-map.test.ts`).
 */
describe('Einstiege von core (ESZ-151)', () => {
  it('die Wurzel trägt nur die Beschreibung und die Ausgabe', () => {
    expect(Object.keys(root).sort()).toEqual(
      [
        // Beschreibung
        'COLOR_LABELS',
        'FREESTANDING_KIND_LABELS',
        'HEAD_GROUP_LABELS',
        'KIND_FAMILIES',
        'SIGN_CHOICE_FIELDS',
        'SIGN_FORMAT_VERSION',
        'SIGN_HEAD_VALUES',
        'canonicalSign',
        'check',
        'choices',
        'decodeSignParam',
        'describe',
        'draw',
        'drawingOf',
        'encodeSignParam',
        'fromExact',
        'headGroupOf',
        'kindFamilyOf',
        'parse',
        'resolve',
        'serialize',
        // Ausgabe
        'ACCESSIBLE_LIGHT_THEME',
        'DARK_THEME',
        'ID_PREFIX_PATTERN',
        'PRINT_MONOCHROME_THEME',
        'RASTER_MIN_STROKE_WIDTH_PX',
        'REFERENCE_THEME',
        'RENDER_THEMES',
        'TEXT_FONT_FAMILY_ATTR',
        'isRenderThemeId',
        'rasterDimensionsForWidth',
        'renderCanvas',
        'renderSvg',
        'renderTheme',
      ].sort(),
    );
  });

  it('ein Name in mehreren Einstiegen ist überall derselbe Wert', () => {
    const entries = { root, exact, blocks, sketch, gates } as Record<string, Record<string, unknown>>;
    const seen = new Map<string, unknown>();
    for (const module of Object.values(entries)) {
      for (const [name, value] of Object.entries(module)) {
        if (seen.has(name)) expect(value, name).toBe(seen.get(name));
        else seen.set(name, value);
      }
    }
  });

  it('führt den Bauplan unter exact, die Gates unter gates', () => {
    for (const name of ['drawSymbol', 'compose', 'validateSpec', 'checkSpec', 'vocabulary', 'parseSpec', 'resolve', 'fromExact']) {
      expect(exact).toHaveProperty(name);
      if (name !== 'resolve' && name !== 'fromExact') expect(root).not.toHaveProperty(name);
    }
    for (const name of ['RULE_CATALOG', 'checkViewBox', 'checkPictogram', 'matchFingerprint', 'checkContrast']) {
      expect(gates).toHaveProperty(name);
      expect(root).not.toHaveProperty(name);
    }
  });
});
