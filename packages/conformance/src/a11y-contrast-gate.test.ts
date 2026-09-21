import { describe, expect, it } from 'vitest';
import {
  checkContrast,
  contrastRatio,
  relativeLuminance,
  type ContrastIssue,
  type ContrastRequirement,
  type RenderTheme,
} from '@einsatzzeichen/core';
import {
  CONTRAST_EXCEPTIONS,
  contrastExceptionFor,
  knownContrastIssues,
  unexpectedContrastIssues,
} from '@einsatzzeichen/core';
import { ORGANIZATION_COLORS } from '@einsatzzeichen/core';
import { ALL_PICTOGRAMS } from '@einsatzzeichen/core';
import { RECIPES, labelContrastRequirements, type Recipe } from './recipes.js';
import {
  MINIMUM_NON_TEXT_CONTRAST,
  MINIMUM_TEXT_CONTRAST,
  contrastPairProblems,
  contrastRequirementsFor,
} from '@einsatzzeichen/core';
import {
  ACCESSIBLE_LIGHT_THEME,
  PRINT_MONOCHROME_THEME,
  RENDER_THEMES,
  ORGANIZATION_BODY_DASHES,
} from '@einsatzzeichen/core';

const PRIMARY_PICTOGRAMS = ALL_PICTOGRAMS.filter(
  (definition) => definition.variant === 'primary' && definition.placement.mode === 'in-body',
);

const BASE_CONTRAST_REQUIREMENT: ContrastRequirement = {
  foreground: 'schwarz',
  background: 'surface',
  context: 'schwarze Kontur und Kopfmarke auf der Ausgabeoberfläche',
  minimum: MINIMUM_NON_TEXT_CONTRAST,
};

const D3_14_CAP_CONTRAST_CONTEXT =
  'schwarze offene Kappenschulter auf der blauen Funktionsflaeche';

function requirements(): ContrastRequirement[] {
  return [
    BASE_CONTRAST_REQUIREMENT,
    ...ALL_PICTOGRAMS.flatMap(contrastRequirementsFor),
    ...labelContrastRequirements(),
  ];
}

/**
 * Alle Abschnitte, die für das Paar der Ausnahme in einem ihrer Themes tatsächlich einen Befund
 * erzeugen — aus Rezeptbeschriftungen **und** aus Piktogrammen. Die Piktogrammseite gehört dazu,
 * seit die roten Kennbuchstaben und Prozentwerte (19.09.2026) als Ausnahme geführt werden.
 */
function exceptionSections(
  exception: (typeof CONTRAST_EXCEPTIONS)[number],
  recipes: Readonly<Record<string, Recipe>> = RECIPES,
): string[] {
  const producesCoveredIssue = (candidates: readonly ContrastRequirement[]): boolean =>
    exception.themeIds.some((themeId) => {
      const theme = RENDER_THEMES[themeId as keyof typeof RENDER_THEMES];
      if (theme === undefined) throw new Error(`Unbekanntes Theme in Ausnahme: ${themeId}`);
      return checkContrast(theme, candidates).some(
        (issue) =>
          issue.foreground === exception.foreground &&
          issue.background === exception.background,
      );
    });
  const fromRecipes = Object.entries<Recipe>(recipes)
    .filter(([, recipe]) => producesCoveredIssue(labelContrastRequirements([recipe])))
    .map(([section]) => section);
  const fromPictograms = ALL_PICTOGRAMS
    .filter((definition) => producesCoveredIssue(contrastRequirementsFor(definition)))
    .map((definition) => definition.section);
  return [...new Set([...fromRecipes, ...fromPictograms])];
}

/**
 * Gedeckte Befunde je Theme, als Paar und Anzahl gepinnt. Roter Text (19.09.2026) fällt nur im
 * Referenz- und accessible-light-Theme auf: acht Warndreiecke mit roter Schrift auf Weiß
 * (4.1.6 bis 4.1.8 alternativ, 5.8.1.7 in beiden Darstellungen, 5.8.1.8, 5.8.1.10, 5.8.1.11) und
 * „50 %“ in L.10 auf der Oberfläche. Im Drucktheme besteht rot als Text.
 */
const EXPECTED_KNOWN_ISSUES: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  'accessible-light': { 'weiss:orange': 1, 'rot:weiss': 8, 'rot:surface': 1 },
  'print-monochrome': { 'weiss:orange': 1, 'schwarz:rot': 1 },
};

function countByPair(issues: readonly ContrastIssue[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const issue of issues) {
    const key = `${issue.foreground}:${issue.background}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

describe('A11y-Kontrast-Gate über den Katalogbestand', () => {
  it('leitet für den vollständigen I.3-Wasserfahrzeugsatz exakt Schwarz auf Weiß ab', () => {
    const i3Recipes = [
      RECIPES['I.3.1']!, RECIPES['I.3.2']!, RECIPES['I.3.3']!, RECIPES['I.3.4']!,
      RECIPES['I.3.5']!, RECIPES['I.3.6']!, RECIPES['I.3.7']!, RECIPES['I.3.8']!,
      RECIPES['I.3.9']!, RECIPES['I.3.10']!, RECIPES['I.3.11']!,
    ];

    expect(labelContrastRequirements(i3Recipes)).toEqual([{
      foreground: 'schwarz',
      background: 'weiss',
      context: 'Beschriftung im Körper auf Organisation hilfsorganisation',
      minimum: MINIMUM_TEXT_CONTRAST,
    }]);
  });

  it('hat echte Piktogramm-Nachbarschaften zu prüfen', () => {
    expect(ALL_PICTOGRAMS).toHaveLength(269);
    expect(requirements().length).toBeGreaterThan(1);
  });

  it.each([ACCESSIBLE_LIGHT_THEME, PRINT_MONOCHROME_THEME])(
    '$id besteht alle expliziten Anforderungen bis auf die entschiedene Ausnahme',
    (theme) => {
      const issues = checkContrast(theme, requirements());
      // Die Ausnahme wirkt paarweise und themeweise (`contrastExceptionFor`), nicht als
      // gelockerte Schwelle: jedes andere Paar und jedes andere Theme fällt weiter auf.
      expect(unexpectedContrastIssues(issues)).toEqual([]);
      // Und die Zahl der gedeckten Befunde ist **gepinnt**, nicht toleriert — je Theme und Paar:
      // weiss auf orange aus E.2.6 und der rote Text vom 19.09.2026. Die schwarzen N-Läufe und
      // Diesel bestehen regulär.
      const known = knownContrastIssues(issues);
      expect(countByPair(known)).toEqual(EXPECTED_KNOWN_ISSUES[theme.id]);
      expect(
        known
          .filter((issue) => issue.foreground === 'weiss' && issue.background === 'orange')
          .map((issue) => issue.context),
      ).toEqual(['Beschriftung im Körper auf Organisation sonstige-gefahrenabwehr']);
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
    expect(blue).toHaveLength(PRIMARY_PICTOGRAMS.length + 1);
    // Die Kappenschulter ist ein 0,5-mm-Strich, kein Text: seit der Kontrastvertrag die
    // Textschwelle am Textelement und seinem tatsächlichen Hintergrund anlegt, gilt für sie 3:1.
    // Der schwarze Trägerlauf „stv OB“ steht auf der Oberfläche, nicht auf Blau.
    expect(blue.filter((issue) => issue.context === D3_14_CAP_CONTRAST_CONTEXT)).toEqual([
      expect.objectContaining({ minimum: MINIMUM_NON_TEXT_CONTRAST }),
    ]);
    expect(blue.every((issue) => issue.ratio < MINIMUM_NON_TEXT_CONTRAST)).toBe(true);
  });

  it('deklariert und prüft die schwarze D.3.14-Kappenschulter gegen ihre blaue Fläche', () => {
    const definition = ALL_PICTOGRAMS.find(
      (candidate) => candidate.id === 'leadership.technical-advisor-thw',
    );
    expect(definition).toBeDefined();
    if (definition === undefined || definition.placement.mode !== 'standalone') return;

    expect(definition.contrastPairs).toContainEqual({
      foreground: 'schwarz',
      background: 'blau',
      context: D3_14_CAP_CONTRAST_CONTEXT,
    });

    const collidingTheme: RenderTheme = {
      ...RENDER_THEMES.reference,
      id: 'synthetic-d3.14-cap-collision',
      palette: {
        ...RENDER_THEMES.reference.palette,
        blau: RENDER_THEMES.reference.palette.schwarz,
      },
    };
    expect(checkContrast(collidingTheme, contrastRequirementsFor(definition))).toContainEqual({
      foreground: 'schwarz',
      background: 'blau',
      context: D3_14_CAP_CONTRAST_CONTEXT,
      minimum: MINIMUM_NON_TEXT_CONTRAST,
      themeId: 'synthetic-d3.14-cap-collision',
      ratio: 1,
    });
  });

  it('leitet belowRight profilabhängig auf der Oberfläche ab und dedupliziert schwarze Tinte', () => {
    // Die vierte Beschriftungszone liegt auf der Ausgabeoberfläche statt auf der Körperfläche.
    // E führt sie in Organisationsfarbe, das G-Kreisband dagegen schwarz. Zwei schwarze Rezepte
    // — darunter eines ohne Organisation — müssen genau eine schwarze Anforderung erzeugen.
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
      {
        title: 'Prüffall schwarzes Kreisband mit Organisation',
        referenceAsset: 'G.3.5_Versorgungsstelle Betriebsstoffe.svg',
        spec: {
          kind: 'circle-12',
          bodyVariant: 'foot-band',
          organization: 'bundeswehr',
          labels: { belowRight: 'Bw' },
        },
      },
      {
        title: 'Prüffall schwarzes Kreisband ohne Organisation',
        referenceAsset: 'G.3.5_Versorgungsstelle Betriebsstoffe.svg',
        spec: {
          kind: 'circle-12',
          bodyVariant: 'foot-band',
          labels: { belowRight: 'Bw' },
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
      {
        foreground: 'schwarz',
        background: 'surface',
        context: 'Schwarze Beschriftung unterhalb des Körpers',
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

  it('hält D.1.8 und D.4.2 quellentreu schwarz und invertiert nur ihre Funktionsläufe im Drucktheme', () => {
    const derived = labelContrastRequirements([RECIPES['D.1.8'], RECIPES['D.4.2']]);
    expect(derived).toEqual([
      {
        foreground: 'funktionslauf-kontrast',
        background: 'rot',
        context: 'Funktionslauf fire-service-readiness-command-group: Ber',
        minimum: MINIMUM_TEXT_CONTRAST,
      },
      {
        foreground: 'funktionslauf-kontrast',
        background: 'rot',
        context: 'Funktionslauf district-fire-chief: KBM',
        minimum: MINIMUM_TEXT_CONTRAST,
      },
      {
        foreground: 'schwarz',
        background: 'surface',
        context: 'Funktionslauf district-fire-chief: ME',
        minimum: MINIMUM_TEXT_CONTRAST,
      },
    ]);

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

  it('leitet N.2.3s schwarze Oberflächenläufe eigenständig und dedupliziert ab', () => {
    const derived = labelContrastRequirements([RECIPES['N.2.3']]);
    expect(derived).toEqual([
      {
        foreground: 'schwarz',
        background: 'surface',
        context: 'Beschriftung unterhalb des Körpers auf der Ausgabeoberfläche',
        minimum: MINIMUM_TEXT_CONTRAST,
      },
    ]);
    for (const theme of [RENDER_THEMES.reference, ACCESSIBLE_LIGHT_THEME, PRINT_MONOCHROME_THEME]) {
      expect(checkContrast(theme, derived), theme.id).toEqual([]);
    }
    // Die einzige Ausnahme für schwarz ist PSNV (4.2.2) auf Feuerwehr-Rot im Drucktheme; die
    // Beschriftungsläufe hier bestehen regulär.
    expect(
      CONTRAST_EXCEPTIONS.filter((exception) => exception.foreground === 'schwarz')
        .map((exception) => [exception.background, exception.sections]),
    ).toEqual([['rot', ['4.2.2']]]);
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
    expect(exception?.sections).toEqual(['E.2.6']);
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

  it('hält roten Text wie in der Referenz als delegiert entschiedene Ausnahme fest', () => {
    // Abgeleitet aus der Entscheidung vom 19.09.2026 (Maße und Farben wie in der Referenz), die
    // Folgeentscheidung hat der Projektinhaber an den Koordinator delegiert: rote Kennbuchstaben der
    // Warndreiecke und der rote Prozentwert von L.10 bleiben rot. Nachgerechnet: rot auf Weiß
    // bzw. Oberfläche 4,025:1 im Referenz- und accessible-light-Theme; im Drucktheme (#666666)
    // besteht rot als Text mit 5,742:1.
    for (const theme of [RENDER_THEMES.reference, ACCESSIBLE_LIGHT_THEME]) {
      expect(contrastRatio(theme.palette.rot, theme.palette.weiss), theme.id).toBeCloseTo(4.025, 3);
      expect(contrastRatio(theme.palette.rot, theme.surface), theme.id).toBeCloseTo(4.025, 3);
    }
    expect(contrastRatio(PRINT_MONOCHROME_THEME.palette.rot, PRINT_MONOCHROME_THEME.surface))
      .toBeGreaterThanOrEqual(MINIMUM_TEXT_CONTRAST);
    expect(
      contrastExceptionFor({ foreground: 'rot', background: 'surface', themeId: 'print-monochrome' }),
    ).toBeUndefined();
    // Die rote Sickerlinie an der schwarzen Deichfigur (L.10) ist kein Text. Im Drucktheme
    // erreicht sie 3,657:1 und besteht die Nichttextschwelle regulär — ohne Ausnahme.
    expect(contrastRatio(PRINT_MONOCHROME_THEME.palette.rot, PRINT_MONOCHROME_THEME.palette.schwarz))
      .toBeCloseTo(3.657, 3);
    expect(
      contrastExceptionFor({ foreground: 'rot', background: 'schwarz', themeId: 'print-monochrome' }),
    ).toBeUndefined();

    const redText = CONTRAST_EXCEPTIONS.filter((exception) => exception.foreground === 'rot');
    expect(redText.map((exception) => [exception.background, exception.themeIds])).toEqual([
      ['weiss', ['reference', 'accessible-light']],
      ['surface', ['reference', 'accessible-light']],
    ]);
    for (const exception of redText) {
      expect(exception.decidedOn).toBe('2026-09-19');
      // Abgeleitet, nicht vom Projektinhaber ausdrücklich bestätigt — und das steht im Text.
      expect(exception.decidedBy).toBe('Koordinator (delegiert)');
      expect(exception.rationale).toContain('docs/decisions/2026-09-19-masse-an-der-referenz-ablesen.md');
      expect(exception.rationale).toContain('an den Koordinator delegiert');
      expect(exception.rationale).toContain('4,5:1');
      // Schwarzer Text ist der naheliegende Ausweg und wurde verworfen, weil er vom Bild abweicht.
      expect(exception.rejected.some((text) => text.startsWith('Schwarzer statt roter Text')))
        .toBe(true);
      for (const rejected of exception.rejected) {
        expect(rejected.length, rejected).toBeGreaterThan(80);
      }
    }
  });

  it('hält schwarzen PSNV-Text auf Feuerwehr-Rot im Drucktheme als delegiert entschiedene Ausnahme fest', () => {
    // 4.2.2: „PSNV“ ist wie in der Referenz schwarz. Nur im Drucktheme (rot = #666666) liegt es
    // mit 3,657:1 unter der Textschwelle; in den farbigen Themes besteht es mit 5,218:1.
    expect(contrastRatio(PRINT_MONOCHROME_THEME.palette.schwarz, PRINT_MONOCHROME_THEME.palette.rot))
      .toBeCloseTo(3.657, 3);
    for (const theme of [RENDER_THEMES.reference, ACCESSIBLE_LIGHT_THEME]) {
      expect(contrastRatio(theme.palette.schwarz, theme.palette.rot), theme.id).toBeCloseTo(5.218, 3);
      expect(
        contrastExceptionFor({ foreground: 'schwarz', background: 'rot', themeId: theme.id }),
        theme.id,
      ).toBeUndefined();
    }
    const exception = contrastExceptionFor({
      foreground: 'schwarz', background: 'rot', themeId: 'print-monochrome',
    });
    expect(exception?.sections).toEqual(['4.2.2']);
    expect(exception?.decidedBy).toBe('Koordinator (delegiert)');
    expect(exception?.rationale).toContain('an den Koordinator delegiert');
    expect(exception?.rationale).toContain('kein Katalogrezept');
    expect(exception?.rationale).toContain('3,657:1');
    expect(exception?.rejected).toHaveLength(2);
    for (const rejected of exception?.rejected ?? []) {
      expect(rejected.length, rejected).toBeGreaterThan(80);
    }
  });

  it('leitet die quellenvermessene schwarze Tinte der N-Körperläufe ohne Ausnahme ab', () => {
    const nRecipes = Object.entries<Recipe>(RECIPES)
      .filter(([section]) => section.startsWith('N.'))
      .map(([, recipe]) => recipe);
    const inBody = labelContrastRequirements(nRecipes).filter(
      (requirement) => requirement.context.startsWith('Beschriftung im Körper'),
    );
    expect(inBody).toEqual([
      {
        foreground: 'schwarz',
        background: 'orange',
        context: 'Beschriftung im Körper auf Organisation sonstige-gefahrenabwehr',
        minimum: MINIMUM_TEXT_CONTRAST,
      },
      {
        foreground: 'schwarz',
        background: 'hellgruen',
        context: 'Beschriftung im Körper auf Organisation bundespolizei',
        minimum: MINIMUM_TEXT_CONTRAST,
      },
      {
        foreground: 'schwarz',
        background: 'braun',
        context: 'Beschriftung im Körper auf Organisation bundeswehr',
        minimum: MINIMUM_TEXT_CONTRAST,
      },
    ]);
    for (const theme of [RENDER_THEMES.reference, ACCESSIBLE_LIGHT_THEME, PRINT_MONOCHROME_THEME]) {
      expect(checkContrast(theme, inBody), theme.id).toEqual([]);
    }
    // Die einzige Ausnahme für schwarz ist PSNV (4.2.2) auf Feuerwehr-Rot im Drucktheme; die
    // Beschriftungsläufe hier bestehen regulär.
    expect(
      CONTRAST_EXCEPTIONS.filter((exception) => exception.foreground === 'schwarz')
        .map((exception) => [exception.background, exception.sections]),
    ).toEqual([['rot', ['4.2.2']]]);
  });

  it('leitet den schwarzen Diesel-Lauf profilabhängig als reguläre Kontrastanforderung ab', () => {
    const dieselRequirements = labelContrastRequirements([RECIPES['G.3.5']]);
    expect(dieselRequirements).toContainEqual({
      foreground: 'schwarz',
      background: 'braun',
      context: 'Schwarze Beschriftung im Körper auf Organisation bundeswehr',
      minimum: MINIMUM_TEXT_CONTRAST,
    });
    for (const theme of [RENDER_THEMES.reference, ACCESSIBLE_LIGHT_THEME, PRINT_MONOCHROME_THEME]) {
      expect(checkContrast(theme, dieselRequirements), theme.id).toEqual([]);
    }
    expect(
      contrastExceptionFor({ foreground: 'weiss', background: 'braun', themeId: 'reference' }),
    ).toBeUndefined();
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

  it('bindet jede Ausnahme exakt an alle aktuell erzeugenden Rezept- und Piktogrammabschnitte', () => {
    // Die Befundzahl kann diese Vollständigkeit nicht halten: `labelContrastRequirements`
    // dedupliziert je Organisation in einem `Set`, und `contrastExceptionFor` matcht danach nur
    // noch Paar plus Theme. Ein zweites Rezept mit demselben Paar erzeugte deshalb weder eine
    // zweite Anforderung noch einen zweiten bekannten Befund. Diese Zeile zählt die Abschnitte —
    // ein neues Zeichen mit rotem Text fiele hier auf, statt still unter die Ausnahme zu rutschen.
    const expectedByPair = {
      'weiss:orange': ['E.2.6'],
      'rot:weiss': ['4.1.6', '4.1.7', '4.1.8', '5.8.1.7', '5.8.1.8', '5.8.1.10', '5.8.1.11'],
      'rot:surface': ['L.10'],
      'schwarz:rot': ['4.2.2'],
    } as const;
    expect(CONTRAST_EXCEPTIONS).toHaveLength(Object.keys(expectedByPair).length);
    for (const exception of CONTRAST_EXCEPTIONS) {
      const pair =
        `${exception.foreground}:${exception.background}` as keyof typeof expectedByPair;
      const sections = exceptionSections(exception);
      expect(sections, pair).toEqual(expectedByPair[pair]);
      expect(exception.sections, pair).toEqual(sections);
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
