import { describe, expect, it } from 'vitest';
import {
  checkContrast,
  contrastRatio,
  relativeLuminance,
  type ContrastRequirement,
} from '@einsatzzeichen/core';
import {
  CONTRAST_EXCEPTIONS,
  contrastExceptionFor,
  knownContrastIssues,
  unexpectedContrastIssues,
} from './contrast-exceptions.js';
import { organizationColor, ORGANIZATION_COLORS } from './organizations.js';
import { ALL_PICTOGRAMS } from './pictograms/index.js';
import { RECIPES, labelContrastRequirements, type Recipe } from './recipes.js';
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
    expect(ALL_PICTOGRAMS).toHaveLength(262);
    expect(requirements().length).toBeGreaterThan(1);
  });

  it.each([ACCESSIBLE_LIGHT_THEME, PRINT_MONOCHROME_THEME])(
    '$id besteht alle expliziten Anforderungen bis auf die eine entschiedene Ausnahme',
    (theme) => {
      const issues = checkContrast(theme, requirements());
      // Die Ausnahme wirkt paarweise und themeweise (`contrastExceptionFor`), nicht als
      // gelockerte Schwelle: jedes andere Paar und jedes andere Theme fällt weiter auf.
      expect(unexpectedContrastIssues(issues)).toEqual([]);
      // Und die Zahl der gedeckten Befunde ist **gepinnt**, nicht toleriert — dasselbe Muster
      // wie beim blauen Negativbefund weiter unten. Genau einer je Theme: weiss auf orange aus
      // der Beschriftung von E.2.6.
      expect(knownContrastIssues(issues)).toHaveLength(1);
      expect(knownContrastIssues(issues).map((issue) => issue.context)).toEqual([
        'Beschriftung im Körper auf Organisation sonstige-gefahrenabwehr',
      ]);
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

  it('trennt den oberhalb liegenden F.2-Lauf von zweizeiligem Text im Körper', () => {
    const derived = labelContrastRequirements([
      {
        title: 'ITH',
        referenceAsset: 'F.2.7_Intensivtransporthubschrauber.svg',
        spec: { kind: 'vehicle-air', bodyVariant: 'raised-hull', organization: 'hilfsorganisation', labels: { aboveLeft: 'ITH' } },
      },
      {
        title: 'GW-San',
        referenceAsset: 'F.2.8_Gerätewagen Sanitätsdienst.svg',
        spec: { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', organization: 'hilfsorganisation', labels: { topLeftLines: ['GW-San', '50'] } },
      },
    ]);
    expect(derived).toContainEqual({
      foreground: 'schwarz',
      background: 'weiss',
      context: 'Beschriftung im Körper auf Organisation hilfsorganisation',
      minimum: MINIMUM_TEXT_CONTRAST,
    });
    expect(derived).toContainEqual({
      foreground: 'schwarz',
      background: 'surface',
      context: 'Beschriftung oberhalb des Körpers auf der Ausgabeoberfläche',
      minimum: MINIMUM_TEXT_CONTRAST,
    });
  });

  it('leitet Rollen- und Trägertext aus derselben Rollenfassung und Hintergrundangabe ab', () => {
    const derived = labelContrastRequirements([{
      title: 'Technischer Einsatzleiter',
      referenceAsset: 'D.3.1_Technischer Einsatzleiter LK Ahrweiler.svg',
      spec: {
        kind: 'person', organization: 'fuehrung-leitung', administrativeLevel: 'kreis',
        functionRole: 'technical-incident-commander',
      },
    }]);
    expect(derived).toEqual([
      {
        foreground: 'schwarz', background: 'gelb',
        context: 'Funktionslauf technical-incident-commander: TEL',
        minimum: MINIMUM_TEXT_CONTRAST,
      },
      {
        foreground: 'schwarz', background: 'surface',
        context: 'Funktionslauf technical-incident-commander: AW',
        minimum: MINIMUM_TEXT_CONTRAST,
      },
    ]);
  });

  it('hält D.1.8 quellentreu schwarz und invertiert nur den Funktionslauf im Drucktheme', () => {
    const derived = labelContrastRequirements([RECIPES['D.1.8']]);
    expect(derived).toEqual([{
      foreground: 'funktionslauf-kontrast',
      background: 'rot',
      context: 'Funktionslauf fire-service-readiness-command-group: Ber',
      minimum: MINIMUM_TEXT_CONTRAST,
    }]);

    const cases = [
      [RENDER_THEMES.reference, '#000000', 5.218],
      [ACCESSIBLE_LIGHT_THEME, '#000000', 5.218],
      [PRINT_MONOCHROME_THEME, '#ffffff', 5.742],
    ] as const;
    for (const [theme, expectedInk, expectedRatio] of cases) {
      const ink = (theme.palette as unknown as Readonly<
        Record<string, `#${string}` | undefined>
      >)['funktionslauf-kontrast'];
      expect(ink, theme.id).toBe(expectedInk);
      if (ink === undefined) continue;
      const ratio = contrastRatio(ink, theme.palette.rot);
      expect(ratio, theme.id).toBeCloseTo(expectedRatio, 3);
      expect(ratio, theme.id).toBeGreaterThanOrEqual(MINIMUM_TEXT_CONTRAST);
    }
  });

  it('hält weiss auf orange als entschiedene Ausnahme fest, die kein Theme löst', () => {
    // **Diese Zeile hat ihre Rolle gewechselt, nicht ihre Zahlen.** Bis zum 18. August 2026 hielt
    // sie einen offenen Punkt fest und E.2.6 blieb ungebaut. Seither ist entschieden (Nutzer,
    // 18.08.2026, Weg 1 von vier): der Katalog baut E.2.6 so, wie die Referenz es zeichnet —
    // oranger Körper, weisses Kürzel —, und führt „weiss auf orange" als bekannten, begründeten
    // Negativbefund. Keine `deviation`: die Umsetzung folgt der Quelle punktgenau, abweichend ist
    // die eigene Kontrastschwelle des Katalogs.
    //
    // Selbst nachgerechnet, unverändert gegenüber der offenen Fassung: 2,382:1 im Referenz- und
    // im accessible-light-Theme, 2,323:1 im Drucktheme, gefordert sind 4,5:1.
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
      expect(
        contrastExceptionFor({ foreground: 'weiss', background: 'orange', themeId: theme.id }),
        theme.id,
      ).toBeDefined();
    }

    const exception = CONTRAST_EXCEPTIONS[0];
    expect(CONTRAST_EXCEPTIONS).toHaveLength(1);
    expect(exception?.decidedOn).toBe('2026-08-18');
    expect(exception?.decidedBy).toBe('Projektinhaber');
    // Drei geprüfte und verworfene Wege, nicht einer: ohne sie wäre die Entscheidung eine
    // Behauptung ohne Alternative.
    expect(exception?.rejected).toHaveLength(3);

    // **Der Begründungstext selbst ist gegatet, nicht nur gezählt.** Ohne diese Zeilen ließe sich
    // `rationale` auf „geht nicht" eindampfen, ohne dass ein Gate zuckt — und dann stünde die
    // Ausnahme im Betrieb ohne die Zahlen da, die sie tragen. Geprüft wird, was ein späterer
    // Leser braucht, um die Entscheidung nachzurechnen: beide gemessenen Verhältnisse, die
    // Schwelle, und dass das leere Fenster des Drucktheme benannt ist.
    for (const fragment of ['2,382:1', '2,323:1', '4,5:1', 'Drucktheme', '0,1833', '0,1000']) {
      expect(exception?.rationale, fragment).toContain(fragment);
    }
    // Jeder verworfene Weg nennt seinen Grund und nicht nur seinen Namen. Die Schranke ist die
    // Länge des kürzesten Textes, der das leisten kann — sie hält die Aufzählung davon ab, zu
    // einer Liste von Stichworten zu verkommen.
    for (const rejected of exception?.rejected ?? []) {
      expect(rejected.length, rejected).toBeGreaterThan(80);
    }
  });

  it('belegt, dass das Fenster im Drucktheme leer ist, statt es zu behaupten', () => {
    // Die tragende Hälfte der Begründung. Für `accessible-light` wäre der Befund lösbar — ein
    // dunkleres Orange im Farbton von #fa8c00 erfüllt beide Richtungen (nachgerechnet: #b06300
    // erreicht 4,535:1 gegen Weiss und 4,631:1 gegen Schwarz). Im Drucktheme nicht, und das ist
    // hier ausgerechnet und nicht geglaubt: die Palette ist vollständig achromatisch, es gibt
    // also genau 256 mögliche Werte, und keiner erfüllt alle drei Bedingungen zugleich.
    const weissSchwelle = 1.05 / MINIMUM_TEXT_CONTRAST - 0.05;
    const schwarzSchwelle = MINIMUM_NON_TEXT_CONTRAST * 0.05 - 0.05;
    expect(weissSchwelle).toBeCloseTo(0.1833, 4);
    expect(schwarzSchwelle).toBeCloseTo(0.1, 4);

    // Die belegten Grauwerte der übrigen sieben Organisationen; zu ihnen fordert das Gate
    // „eigener Grauwert mit sichtbarem Helligkeitsabstand" mehr als 0,045 Abstand.
    const belegt = Object.values(ORGANIZATION_COLORS)
      .filter((token) => token !== 'orange')
      .map((token) => relativeLuminance(PRINT_MONOCHROME_THEME.palette[token]));
    // rot und blau liegen selbst im Band — deshalb ist es leer und nicht nur eng.
    expect(belegt.filter((l) => l >= schwarzSchwelle && l <= weissSchwelle)).toHaveLength(2);

    const moeglich = Array.from({ length: 256 }, (_, value) => {
      const channel = value.toString(16).padStart(2, '0');
      return `#${channel}${channel}${channel}` as `#${string}`;
    }).filter((grau) => {
      const luminanz = relativeLuminance(grau);
      return (
        contrastRatio(PRINT_MONOCHROME_THEME.palette.weiss, grau) >= MINIMUM_TEXT_CONTRAST &&
        contrastRatio(PRINT_MONOCHROME_THEME.palette.schwarz, grau) >= MINIMUM_NON_TEXT_CONTRAST &&
        belegt.every((andere) => Math.abs(andere - luminanz) > 0.045)
      );
    });
    expect(moeglich).toEqual([]);
  });

  it('nennt in der Ausnahme genau die Abschnitte, aus denen das Paar entsteht', () => {
    // Der Pin, der ein **zweites** oranges Zeichen auffallen lässt. Über die Befundzahl geht das
    // nicht: `labelContrastRequirements` sammelt je Organisation in ein `Set`, ein zweites
    // oranges Rezept erzeugte also keine zweite Anforderung und keinen zweiten Befund. Diese
    // Zeile zählt deshalb die Rezepte und nicht die Befunde.
    const orangeMitBeschriftung = Object.entries<Recipe>(RECIPES)
      .filter(([, recipe]) => {
        const { organization, labels } = recipe.spec;
        if (organization === undefined || labels === undefined) return false;
        if (organizationColor(organization) !== 'orange') return false;
        return (
          labels.center !== undefined ||
          labels.bottomLeft !== undefined ||
          labels.bottomCenter !== undefined ||
          labels.bottomRight !== undefined
        );
      })
      .map(([section]) => section);
    expect(orangeMitBeschriftung).toEqual(['E.2.6']);
    expect(CONTRAST_EXCEPTIONS[0]?.sections).toEqual(orangeMitBeschriftung);
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
