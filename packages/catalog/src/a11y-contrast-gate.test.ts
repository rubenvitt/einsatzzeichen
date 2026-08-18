import { describe, expect, it } from 'vitest';
import {
  checkContrast,
  contrastRatio,
  relativeLuminance,
  type ContrastRequirement,
} from '@einsatzzeichen/core';
import { ORGANIZATION_COLORS } from './organizations.js';
import { ALL_PICTOGRAMS } from './pictograms/index.js';
import { labelContrastRequirements } from './recipes.js';
import {
  MINIMUM_NON_TEXT_CONTRAST,
  MINIMUM_TEXT_CONTRAST,
  contrastPairProblems,
  contrastRequirementsFor,
} from './pictograms/contrast-contract.js';
import {
  ACCESSIBLE_LIGHT_THEME,
  PRINT_MONOCHROME_THEME,
  RENDER_THEMES,
  ORGANIZATION_BODY_DASHES,
} from './render-themes.js';

const PRIMARY_PICTOGRAMS = ALL_PICTOGRAMS.filter(
  (definition) => definition.variant === 'primary' && definition.placement.mode === 'in-body',
);

const BASE_CONTRAST_REQUIREMENT: ContrastRequirement = {
  foreground: 'schwarz',
  background: 'surface',
  context: 'schwarze Kontur und Kopfmarke auf der Ausgabeoberfläche',
  minimum: MINIMUM_NON_TEXT_CONTRAST,
};

function requirements(): ContrastRequirement[] {
  return [
    BASE_CONTRAST_REQUIREMENT,
    ...ALL_PICTOGRAMS.flatMap(contrastRequirementsFor),
    ...labelContrastRequirements(),
  ];
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

  it('deklariert kein Kontrastpaar mit zwei Token, die in irgendeinem Theme dieselbe Farbe ergeben', () => {
    // Deckt sowohl die von Standalone-Zeichen deklarierten contrastPairs als auch die für
    // In-Body-Zeichen synthetisierten (Ink, Organisationsfarbe)-Paare ab — ContrastRequirement
    // trägt foreground/background/context strukturell wie PictogramContrastPair, nur mit
    // zusätzlichem minimum, das contrastPairProblems nicht braucht und ignoriert.
    expect(contrastPairProblems(requirements())).toEqual([]);
  });

  it('hält Schwarz auf BABZ-Blau im Referenztheme als bekannten Negativbefund fest', () => {
    const issues = checkContrast(RENDER_THEMES.reference, requirements());
    const blue = issues.filter(
      (issue) => issue.foreground === 'schwarz' && issue.background === 'blau',
    );
    expect(blue).toHaveLength(PRIMARY_PICTOGRAMS.length);
    expect(blue.every((issue) => issue.ratio < MINIMUM_NON_TEXT_CONTRAST)).toBe(true);
  });

  it('leitet für ein Trägerkürzel unterhalb des Körpers die Organisationsfarbe auf der Oberfläche ab', () => {
    // Die vierte Beschriftungszone ist der **einzige** farbige Text des Katalogs, und ihr
    // Untergrund ist die Ausgabeoberfläche statt der Körperfläche. Die Ableitung „weiss auf
    // Körperfarbe" erzeugt dieses Paar nicht — ohne die zweite Richtung stünde es ohne Vertrag da.
    //
    // Geprüft an einem eigens gebauten Rezept und nicht am Bestand: `labelContrastRequirements`
    // liest die Rezepte, und die 31 Zeichen aus E.2 trägt erst die zweite Bauphase ein. Der
    // Mechanismus muss vorher stehen, sonst fiele das Gate genau dann, wenn niemand mehr damit
    // rechnet.
    const derived = labelContrastRequirements([
      {
        title: 'Prüffall vierte Zone',
        referenceAsset: 'E.2.27_Wasserfahrzeug allgemein.svg',
        spec: {
          kind: 'vehicle-water',
          bodyVariant: 'raised-hull',
          organization: 'thw',
          labels: { belowRight: 'THW' },
        },
      },
    ]);
    expect(derived).toEqual([
      {
        foreground: 'blau',
        background: 'surface',
        context: 'Trägerkürzel unterhalb des Körpers, Organisation thw',
        minimum: MINIMUM_TEXT_CONTRAST,
      },
    ]);

    // Und sie besteht in allen drei Themes. Selbst gerechnet: 11,072:1 / 4,634:1 / 4,542:1 gegen
    // eine Textschwelle von 4,5:1 — die beiden Alternativthemes liegen knapp darüber, das ist
    // der Grund, warum diese Zeile die Zahlen nennt und nicht nur „bestanden" behauptet.
    for (const theme of [RENDER_THEMES.reference, ACCESSIBLE_LIGHT_THEME, PRINT_MONOCHROME_THEME]) {
      expect(checkContrast(theme, derived), theme.id).toEqual([]);
    }
    expect(contrastRatio(RENDER_THEMES.reference.palette.blau, RENDER_THEMES.reference.surface))
      .toBeCloseTo(11.072, 3);
    expect(contrastRatio(ACCESSIBLE_LIGHT_THEME.palette.blau, ACCESSIBLE_LIGHT_THEME.surface))
      .toBeCloseTo(4.634, 3);
    expect(contrastRatio(PRINT_MONOCHROME_THEME.palette.blau, PRINT_MONOCHROME_THEME.surface))
      .toBeCloseTo(4.542, 3);
  });

  it('hält weiss auf orange als offenen Punkt fest, den kein Theme heute löst', () => {
    // `E.2.6` ist das einzige Zeichen des Anhangs E mit orangem Körper **und** weissem
    // Trägerkürzel. Sobald ein Rezept `organization: 'sonstige-gefahrenabwehr'` mit einer
    // Beschriftung führt, leitet `labelContrastRequirements` „weiss auf orange" ab — und das
    // fällt. Selbst gerechnet: 2,382:1 im Referenz- und im accessible-light-Theme, 2,323:1 im
    // Drucktheme, gefordert sind 4,5:1.
    //
    // Diese Zeile baut nichts und lockert nichts. Sie hält die Zahl fest, damit die zweite
    // Bauphase nicht in ein unerklärtes rotes Gate läuft.
    for (const [theme, expected] of [
      [RENDER_THEMES.reference, 2.382],
      [ACCESSIBLE_LIGHT_THEME, 2.382],
      [PRINT_MONOCHROME_THEME, 2.323],
    ] as const) {
      expect(contrastRatio(theme.palette.weiss, theme.palette.orange), theme.id).toBeCloseTo(
        expected,
        3,
      );
      expect(expected).toBeLessThan(MINIMUM_TEXT_CONTRAST);
    }
  });

  it('behält die feste Körper- und Kopf-Anforderung genau einmal', () => {
    expect(
      requirements().filter(
        (requirement) => requirement.context === BASE_CONTRAST_REQUIREMENT.context,
      ),
    ).toEqual([BASE_CONTRAST_REQUIREMENT]);
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
