import {
  bodyLabelInk,
  compose,
  profileFor,
  type CatalogPorts,
  type ContrastRequirement,
} from '@einsatzzeichen/core';
import type { Drawing, OrganizationId, SymbolSpec } from '@einsatzzeichen/schema';
import { baseDrawing } from './base-symbols.js';
import { bodyMark } from './body-marks.js';
import { organizationColor } from './organizations.js';
import { MINIMUM_TEXT_CONTRAST } from './pictograms/contrast-contract.js';
import { pictogram } from './pictograms/index.js';
import { strengthHead } from './strengths.js';
import { vehicleChassis } from './vehicle-categories.js';
import { describeSymbolSpec } from './labels.js';
import {
  ANHANG_E_A_RECIPES,
  ANHANG_E_B_RECIPES,
  ANHANG_E_C_RECIPES,
  ANHANG_E_D_RECIPES,
  ANHANG_E_E_RECIPES,
  ANHANG_E_F_RECIPES,
} from './recipes-anhang-e.js';
import {
  ANHANG_F_A_RECIPES,
  ANHANG_F_B_RECIPES,
  ANHANG_F_C_RECIPES,
  ANHANG_F_D_RECIPES,
  ANHANG_F_E_RECIPES,
  ANHANG_F_F_RECIPES,
} from './recipes-anhang-f.js';
import { ANHANG_G_RECIPES } from './recipes-anhang-g.js';

const PORTS: CatalogPorts = {
  baseDrawing,
  bodyMark,
  organizationColor,
  strengthHead,
  vehicleChassis,
  pictogram,
};

export function composeFromCatalog(spec: SymbolSpec, title?: string): Drawing {
  return compose(spec, PORTS, {
    ...(title !== undefined ? { title } : {}),
    description: describeSymbolSpec(spec),
  });
}

export interface Recipe {
  title: string;
  referenceAsset: string;
  spec: SymbolSpec;
}

/**
 * Zusammengesetzte Zeichen, die den Kompositionsmotor gegen die Referenz belegen.
 *
 * Die drei Einträge unten sind die Belegfälle des Motors aus dem Kernslice — je einer für
 * Kopfzone als Stapel (C.1.1), als Reihe (C.1.2) und am gedrehten Quadrat (D.3.7). Die 16
 * Einträge aus `ANHANG_E_A_RECIPES` sind der erste Bestand, der über Belegfälle hinausgeht:
 * ein vollständiger Abschnitt der Baseline, gebaut aus denselben Mechanismen. Die zwölf aus
 * `ANHANG_E_B_RECIPES` setzen ihn fort und belegen zusätzlich, dass die Zonenregel gegen alle
 * Kopfzonenbreiten trägt — E-a war ein Block aus `gruppe`, E-b bringt `zug` und `trupp` dazu.
 * Mit den neun aus `ANHANG_E_C_RECIPES` ist E.1 mit 37 Darstellungen vollständig; sie belegen
 * als erste, dass die Zonenregel auch gegen eine **zweite Körperform** trägt (E.1.37 auf
 * `building`).
 *
 * Die 31 aus `ANHANG_E_D_RECIPES`, `ANHANG_E_E_RECIPES` und `ANHANG_E_F_RECIPES` verlassen als
 * erste den Rechteckkörper der taktischen Formation. Sie tragen **fünf** Körperformen statt
 * zweier, drei davon ohne Kapitel-1-Abschnitt, dazu die Fahrwerkszone unterhalb des Körpers, eine
 * Zusatzgeometrie am Grundzeichen (Deichsel, L-Rahmen), die vierte Beschriftungszone außerhalb des
 * Körpers und einen je Zeichen gemessenen Schriftgrad des mittigen Laufs. Mit dem am 18. August
 * 2026 nachgezogenen E.2.6 sind damit **alle 68** Abschnitte des Anhangs E gebaut. Es ist zugleich
 * das einzige Zeichen des Katalogs, dessen Kontrastpaar eine erklärte Ausnahme trägt
 * (`CONTRAST_EXCEPTIONS`).
 */
export const RECIPES = {
  ...ANHANG_G_RECIPES,
  ...ANHANG_F_A_RECIPES,
  ...ANHANG_F_B_RECIPES,
  ...ANHANG_F_C_RECIPES,
  ...ANHANG_F_D_RECIPES,
  ...ANHANG_F_E_RECIPES,
  ...ANHANG_F_F_RECIPES,
  ...ANHANG_E_A_RECIPES,
  ...ANHANG_E_B_RECIPES,
  ...ANHANG_E_C_RECIPES,
  ...ANHANG_E_D_RECIPES,
  ...ANHANG_E_E_RECIPES,
  ...ANHANG_E_F_RECIPES,
  'C.1.1': {
    title: 'Löschstaffel',
    referenceAsset: 'C.1.1_Löschstaffel.svg',
    spec: {
      kind: 'formation',
      organization: 'feuerwehr',
      strength: 'staffel',
      capabilities: ['fire-fighting'],
    },
  },
  'C.1.2': {
    title: 'Löschgruppe',
    referenceAsset: 'C.1.2_Löschgruppe.svg',
    spec: {
      kind: 'formation',
      organization: 'feuerwehr',
      strength: 'gruppe',
      capabilities: ['fire-fighting'],
    },
  },
  'D.3.7': {
    title: 'Zugführer der Feuerwehr',
    referenceAsset: 'D.3.7_Zugführer der Feuerwehr.svg',
    spec: {
      kind: 'person',
      organization: 'feuerwehr',
      strength: 'zug',
    },
  },
} as const satisfies Record<string, Recipe>;

/**
 * Kontrastvertrag der Beschriftungszonen. Ein Piktogramm deklariert seine Paare selbst
 * (`contrastPairs`), eine Komposition kann das nicht: ihre Farben entstehen erst beim
 * Zusammensetzen aus Grundzeichen, Organisation und Beschriftung. Diese Funktion leitet die
 * Anforderung deshalb aus dem Bestand ab statt sie zu wiederholen — jede Organisation, für die
 * ein Rezept eine Beschriftung im Körper führt, bekommt eine Anforderung „Schriftfarbe auf ihrer
 * Körperfarbe" mit der **Textschwelle** 4,5:1, nicht mit den 3:1 für grafische Objekte.
 *
 * Ohne diese Ableitung wäre der weisse Text der einzige Ink im Katalog ohne Kontrastvertrag —
 * die Piktogrammpaare decken ihn nicht ab, weil er zu keinem Piktogramm gehört. Genau diese
 * Anforderung hat `blau` in beiden Alternativthemes nachgezogen (siehe `render-themes.ts`).
 *
 * **Seit dem Teilslice F-a steht der Vordergrund nicht mehr fest auf `weiss`.** Bis dahin
 * behauptete diese Ableitung „weiss auf Körperfarbe" für jede Organisation — eine Behauptung,
 * die für Anhang E zutraf und die die zwölf F-Zeichen widerlegen: ihr Körper ist weiss
 * (`hilfsorganisation`), und `compose.ts` zeichnet den Lauf darauf schwarz. Der Vertrag hätte
 * also „weiss auf weiss" verlangt — ein Paar mit dem Verhältnis 1:1, das kein Theme lösen kann
 * und das zugleich das Gegenteil dessen ist, was gezeichnet wird. Die Farbe kommt deshalb aus
 * derselben Funktion wie die Zeichnung selbst (`bodyLabelInk`); zwei Kopien derselben Regel
 * wären genau die Drift, die den Fehler erzeugt hat. Für `hilfsorganisation` ergibt das schwarz
 * auf weiss und damit 21:1 in allen drei Themes — die Anforderung entfällt nicht, sie ist
 * erfüllt.
 *
 * **Seit dem Teilslice E.2 gibt es eine zweite Richtung.** Die vierte Beschriftungszone steht
 * unter dem Körper auf der Ausgabeoberfläche. Ihre Tinte kommt wie beim Zeichnen aus dem
 * Körperprofil: E verwendet Organisationsfarbe, das G-Kreisband Schwarz. Selbst gerechnet,
 * damit es nicht übernommen ist: `blau` gegen `surface` erreicht 11,072:1 im Referenztheme,
 * 4,634:1 in `accessible-light` und 4,542:1 im Drucktheme — alle drei über der Textschwelle
 * 4,5:1, keine Palettenänderung nötig.
 *
 * **Seit dem 18. August 2026 leitet sie eine dritte Anforderung ab, die nicht besteht.** E.2.6
 * trägt als einziges Rezept `sonstige-gefahrenabwehr` mit Beschriftung; daraus entsteht „weiss
 * auf orange" mit 2,382:1 bzw. 2,323:1 gegen dieselbe Textschwelle. Die Ableitung bleibt
 * unverändert und meldet den Befund weiter — er wird nicht hier unterdrückt, sondern in
 * `CONTRAST_EXCEPTIONS` als entschiedene Ausnahme geführt und dort gezählt. Eine Ableitung, die
 * ihre eigene Ausnahme kennt, wäre die stillste Art, den Vertrag zu verlieren.
 *
 * Der Parameter ist da, damit die Ableitung selbst prüfbar ist: ohne ihn ließe sich nur
 * feststellen, was der heutige Bestand hergibt, nicht, was die Funktion aus einer Beschriftung
 * ableitet, die es noch nicht gibt.
 */
export function labelContrastRequirements(
  recipes: Iterable<Recipe> = Object.values<Recipe>(RECIPES),
): readonly ContrastRequirement[] {
  const inBody = new Set<OrganizationId>();
  const belowBody = new Set<OrganizationId>();
  let blackBelowBody = false;
  let aboveBody = false;
  let circleTopLeftOnSurface = false;
  for (const recipe of recipes) {
    const { labels, organization } = recipe.spec;
    if (labels === undefined) continue;
    // Körperbeschriftungen ohne Organisation bleiben außen vor: ohne Organisationsfarbe ist
    // kein belastbares Körperfarbenpaar ableitbar. Schwarzes `belowRight` ist davon unabhängig,
    // weil sein Profil Vorder- und Hintergrundtoken vollständig festlegt.
    if (organization !== undefined) {
      if (
        labels.center !== undefined ||
        labels.topLeft !== undefined ||
        labels.bottomLeft !== undefined ||
        labels.bottomCenter !== undefined ||
        labels.bottomRight !== undefined ||
        labels.topLeftLines !== undefined
      ) {
        inBody.add(organization);
      }
      if (labels.aboveLeft !== undefined) aboveBody = true;
      if (recipe.spec.kind === 'circle-12' && labels.topLeft !== undefined) {
        circleTopLeftOnSurface = true;
      }
    }
    if (labels.belowRight !== undefined) {
      const ink = profileFor(recipe.spec.kind, recipe.spec.bodyVariant).belowRight?.ink;
      if (ink === 'organization' && organization !== undefined) belowBody.add(organization);
      if (ink === 'black') blackBelowBody = true;
    }
  }
  return [
    ...[...inBody].map<ContrastRequirement>((organization) => ({
      // Dieselbe Ableitung, die `compose.ts` beim Zeichnen anwendet: schwarz auf weissem Körper,
      // sonst weiss. Aufgerufen und nicht nachgebaut, damit Vertrag und Zeichnung nicht
      // auseinanderlaufen können.
      foreground: bodyLabelInk(organizationColor(organization)),
      background: organizationColor(organization),
      context: `Beschriftung im Körper auf Organisation ${organization}`,
      minimum: MINIMUM_TEXT_CONTRAST,
    })),
    ...[...belowBody].map<ContrastRequirement>((organization) => ({
      foreground: organizationColor(organization),
      background: 'surface',
      context: `Trägerkürzel unterhalb des Körpers, Organisation ${organization}`,
      minimum: MINIMUM_TEXT_CONTRAST,
    })),
    ...(blackBelowBody ? [{
      foreground: 'schwarz' as const,
      background: 'surface' as const,
      context: 'Schwarze Beschriftung unterhalb des Körpers',
      minimum: MINIMUM_TEXT_CONTRAST,
    }] : []),
    ...(aboveBody ? [{
      foreground: 'schwarz' as const,
      background: 'surface' as const,
      context: 'Beschriftung oberhalb des Körpers auf der Ausgabeoberfläche',
      minimum: MINIMUM_TEXT_CONTRAST,
    }] : []),
    ...(circleTopLeftOnSurface ? [{
      foreground: 'schwarz' as const,
      background: 'surface' as const,
      context: 'Kreislabel teilweise außerhalb der Körperfläche',
      minimum: MINIMUM_TEXT_CONTRAST,
    }] : []),
  ];
}
