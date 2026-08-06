import { describe, expect, it } from 'vitest';
import { checkContrast, paintTokensOf, relativeLuminance, type ContrastRequirement } from '@einsatzzeichen/core';
import { ORGANIZATION_COLORS } from './organizations.js';
import { ALL_PICTOGRAMS } from './pictograms/index.js';
import {
  ACCESSIBLE_LIGHT_THEME,
  PRINT_MONOCHROME_THEME,
  RENDER_THEMES,
  ORGANIZATION_BODY_DASHES,
} from './render-themes.js';

const MINIMUM_NON_TEXT_CONTRAST = 3;

function requirements(): ContrastRequirement[] {
  const result: ContrastRequirement[] = [
    {
      foreground: 'schwarz',
      background: 'surface',
      context: 'schwarze Kontur und Kopfmarke auf der Ausgabeoberfläche',
      minimum: MINIMUM_NON_TEXT_CONTRAST,
    },
  ];
  for (const definition of ALL_PICTOGRAMS) {
    for (const foreground of paintTokensOf(definition.primitives)) {
      result.push({
        foreground,
        background: 'surface',
        context: `${definition.id} ohne Organisationsfüllung`,
        minimum: MINIMUM_NON_TEXT_CONTRAST,
      });
      for (const [organization, background] of Object.entries(ORGANIZATION_COLORS)) {
        result.push({
          foreground,
          background,
          context: `${definition.id} auf Organisation ${organization}`,
          minimum: MINIMUM_NON_TEXT_CONTRAST,
        });
      }
    }
  }
  return result;
}

describe('A11y-Kontrast-Gate über den Katalogbestand', () => {
  it('hat echte Piktogramm-Nachbarschaften zu prüfen', () => {
    expect(ALL_PICTOGRAMS.length).toBeGreaterThan(0);
    expect(requirements().length).toBeGreaterThan(1);
  });

  it.each([ACCESSIBLE_LIGHT_THEME, PRINT_MONOCHROME_THEME])(
    '$id besteht alle expliziten 3:1-Anforderungen',
    (theme) => {
      expect(checkContrast(theme, requirements())).toEqual([]);
    },
  );

  it('hält Schwarz auf BABZ-Blau im Referenztheme als bekannten Negativbefund fest', () => {
    const issues = checkContrast(RENDER_THEMES.reference, requirements());
    const blue = issues.filter(
      (issue) => issue.foreground === 'schwarz' && issue.background === 'blau',
    );
    expect(blue).toHaveLength(ALL_PICTOGRAMS.length);
    expect(blue.every((issue) => issue.ratio < MINIMUM_NON_TEXT_CONTRAST)).toBe(true);
  });

  it('bildet das Drucktheme vollständig achromatisch ab', () => {
    for (const color of Object.values(PRINT_MONOCHROME_THEME.palette)) {
      expect(color).toMatch(/^#([0-9a-f]{2})\1\1$/);
    }
  });

  it('gibt jeder belegten Organisation einen eigenen Grauwert mit sichtbarem Helligkeitsabstand', () => {
    const colors = Object.values(ORGANIZATION_COLORS).map(
      (token) => PRINT_MONOCHROME_THEME.palette[token],
    );
    expect(new Set(colors).size).toBe(colors.length);
    const luminances = colors.map(relativeLuminance).sort((a, b) => a - b);
    const gaps = luminances.slice(1).map((value, index) => value - (luminances[index] ?? value));
    expect(Math.min(...gaps)).toBeGreaterThan(0.045);
  });

  it('gibt jeder belegten Organisation zusätzlich eine eindeutige Kontursignatur', () => {
    const signatures = Object.values(ORGANIZATION_COLORS).map((token) =>
      JSON.stringify(ORGANIZATION_BODY_DASHES[token]),
    );
    expect(new Set(signatures).size).toBe(signatures.length);
    for (const dash of Object.values(ORGANIZATION_BODY_DASHES)) {
      expect(dash.every((length) => Number.isFinite(length) && length > 0)).toBe(true);
    }
  });
});
