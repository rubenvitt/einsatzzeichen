import { colorFor, paintTokensOf, type ContrastRequirement, type RenderTheme } from '@einsatzzeichen/core';
import type { ColorToken, Primitive } from '@einsatzzeichen/schema';
import { ORGANIZATION_COLORS } from '../organizations.js';
import { RENDER_THEMES } from '../render-themes.js';
import type { CatalogPictogramDefinition, PictogramContrastPair } from './catalog-definition.js';

/**
 * WCAG unterscheidet zwei Kontrastschwellen: 3:1 für grafische Objekte (Nichttext), 4.5:1 für
 * Fließtext. `MINIMUM_NON_TEXT_CONTRAST` trug diese Unterscheidung schon im Namen — die Konstante
 * für Text war nur noch nicht geschrieben.
 */
export const MINIMUM_NON_TEXT_CONTRAST = 3;
export const MINIMUM_TEXT_CONTRAST = 4.5;

/**
 * Alle Farbtoken, die von Textprimitiven (auch verschachtelt in Gruppen) gemalt werden. Behält
 * Gruppen mit ihrem Stil bei, damit `paintTokensOf` die Stilvererbung wie gewohnt auflöst — nur
 * die nicht-textlichen Blattprimitive fallen weg. So bleibt die Vererbungslogik an einer Stelle
 * (`paintTokensOf`) statt hier ein zweites Mal nachgebaut zu werden.
 */
function textPrimitivesOnly(primitives: readonly Primitive[]): Primitive[] {
  const kept: Primitive[] = [];
  for (const primitive of primitives) {
    if (primitive.type === 'text') {
      kept.push(primitive);
    } else if (primitive.type === 'group') {
      const children = textPrimitivesOnly(primitive.children);
      if (children.length > 0) kept.push({ ...primitive, children });
    }
  }
  return kept;
}

/**
 * Bestimmt je Farbtoken die anzulegende Schwelle. Malt derselbe Token an einer Stelle Text und an
 * anderer Stelle desselben Zeichens Nichttext, gilt die strengere Textschwelle für alle seine
 * Anforderungen — eine Anforderung, die bei 3:1 besteht, wäre sonst ein falscher Erfolg für die
 * Textverwendung desselben Tokens.
 */
function contrastMinimumFor(token: ColorToken, textTokens: ReadonlySet<ColorToken>): number {
  return textTokens.has(token) ? MINIMUM_TEXT_CONTRAST : MINIMUM_NON_TEXT_CONTRAST;
}

export function contrastRequirementsFor(
  definition: CatalogPictogramDefinition,
): readonly ContrastRequirement[] {
  const textTokens = new Set(paintTokensOf(textPrimitivesOnly(definition.primitives)));

  if (definition.placement.mode === 'standalone') {
    if (!Array.isArray(definition.contrastPairs) || definition.contrastPairs.length === 0) {
      throw new Error(`Standalone-Piktogramm "${definition.id}" benötigt contrastPairs.`);
    }
    return definition.contrastPairs.map((pair) => ({
      ...pair,
      minimum: contrastMinimumFor(pair.foreground, textTokens),
    }));
  }

  const result: ContrastRequirement[] = [];
  for (const foreground of paintTokensOf(definition.primitives)) {
    const minimum = contrastMinimumFor(foreground, textTokens);
    result.push({
      foreground,
      background: 'surface',
      context: `${definition.id} ohne Organisationsfüllung`,
      minimum,
    });
    if (definition.variant !== 'primary') continue;
    for (const [organization, background] of Object.entries(ORGANIZATION_COLORS)) {
      result.push({
        foreground,
        background,
        context: `${definition.id} auf Organisation ${organization}`,
        minimum,
      });
    }
  }
  return result;
}

export interface ContrastPairProblem {
  readonly foreground: ColorToken;
  readonly background: ColorToken | 'surface';
  readonly context: string;
  /** Themes, in denen Vordergrund- und Hintergrundtoken auf dieselbe Farbe auflösen. */
  readonly themeIds: readonly string[];
}

/**
 * Meldet Kontrastpaare, deren Vordergrund- und Hintergrundtoken in mindestens einem Theme
 * dieselbe Farbe auflösen — etwa `weiss`/`surface`, die beide zu `#ffffff` werden. Das
 * Kontrastverhältnis wäre dann exakt 1:1, die Zusicherung damit unerfüllbar.
 *
 * `checkContrast` würde ein solches Paar zwar auch melden — als Ratio-1,0-Verstoß gegen die
 * Mindestschwelle. Das verschleiert aber die eigentliche Ursache: Es ist kein Renderingfehler,
 * den ein anderes Token oder Theme heilen könnte, sondern ein Autor, der zwei Bezeichner für
 * dieselbe Farbe deklariert und den Kontrastvertrag damit missverstanden hat. Diese Prüfung
 * meldet es als das, was es ist — einen Fehler am Vertrag selbst, nicht als Zahl, die man
 * ausrechnet und knapp verfehlt.
 *
 * Die Prüfung geht bewusst je Theme vor (nicht anhand der Tokennamen): ein monochromes Theme kann
 * zwei sonst unterschiedliche Farbtoken auf denselben Grauwert abbilden, ohne dass sie es in
 * jedem Theme tun — die Kollision ist dann eine Eigenschaft des Themes, nicht der Tokennamen.
 * `themes` ist parametrisiert, damit dieses theme-abhängige Verhalten unabhängig vom aktuellen
 * Bestand der Render-Themes testbar bleibt.
 */
export function contrastPairProblems(
  pairs: readonly PictogramContrastPair[],
  themes: readonly RenderTheme[] = Object.values(RENDER_THEMES),
): readonly ContrastPairProblem[] {
  const problems: ContrastPairProblem[] = [];
  for (const pair of pairs) {
    const collidingThemeIds = themes
      .filter((theme) => {
        const foreground = colorFor(theme, pair.foreground);
        const background =
          pair.background === 'surface' ? theme.surface : colorFor(theme, pair.background);
        return foreground === background;
      })
      .map((theme) => theme.id);
    if (collidingThemeIds.length > 0) {
      problems.push({ ...pair, themeIds: collidingThemeIds });
    }
  }
  return problems;
}
