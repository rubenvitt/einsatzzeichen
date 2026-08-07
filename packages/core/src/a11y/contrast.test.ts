import { describe, expect, it } from 'vitest';
import { PALETTE, type Primitive } from '@einsatzzeichen/schema';
import {
  checkContrast,
  contrastRatio,
  paintTokensOf,
  relativeLuminance,
} from './contrast.js';
import type { RenderTheme } from '../render/theme.js';

const theme: RenderTheme = { id: 'test', palette: PALETTE, surface: '#ffffff' };

describe('Kontrastrechnung', () => {
  it('berechnet die WCAG-Eckwerte Schwarz/Weiß und ist symmetrisch', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#ffffff')).toBe(1);
    expect(contrastRatio('#000000', '#ffffff')).toBe(21);
    expect(contrastRatio('#ffffff', '#000000')).toBe(21);
  });

  it('lehnt ungültige Hexwerte an der Vertrauensgrenze ab', () => {
    expect(() => relativeLuminance('#xyz' as `#${string}`)).toThrow(/Ungültige/);
  });

  it('meldet Anforderungen unterhalb und akzeptiert solche auf oder oberhalb des Minimums', () => {
    const issues = checkContrast(theme, [
      { foreground: 'schwarz', background: 'blau', context: 'Piktogramm auf THW', minimum: 3 },
      { foreground: 'schwarz', background: 'weiss', context: 'Kontur auf Fläche', minimum: 3 },
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.context).toBe('Piktogramm auf THW');
    expect(issues[0]?.ratio).toBeCloseTo(1.9, 1);
  });

  it('lehnt sinnlose Mindestwerte ab', () => {
    expect(() =>
      checkContrast(theme, [
        { foreground: 'schwarz', background: 'weiss', context: 'kaputt', minimum: 1 },
      ]),
    ).toThrow(/größer als 1/);
  });

  it('lehnt ein ungültiges surface am öffentlichen Theme-Rand ab', () => {
    const invalidTheme: RenderTheme = { ...theme, surface: '#fff' };

    expect(() =>
      checkContrast(invalidTheme, [
        { foreground: 'schwarz', background: 'weiss', context: 'Kontur auf Fläche', minimum: 3 },
      ]),
    ).toThrow(
      'RenderTheme "test": surface muss eine RGB-Hexfarbe im Format #RRGGBB sein (ist "#fff").',
    );
  });
});

describe('paintTokensOf', () => {
  it('löst Gruppenstil feldweise auf und ignoriert none', () => {
    const primitives: Primitive[] = [
      {
        type: 'group',
        style: { fill: 'blau', stroke: 'schwarz' },
        children: [
          { type: 'circle', cx: 5, cy: 5, r: 2 },
          { type: 'line', x1: 0, y1: 0, x2: 2, y2: 2, style: { stroke: 'rot', fill: 'none' } },
        ],
      },
    ];
    expect(new Set(paintTokensOf(primitives))).toEqual(new Set(['blau', 'schwarz', 'rot']));
  });
});
