import {
  bodyLabelInk,
  compose,
  functionRoleTextInk,
  profileFor,
  type CatalogPorts,
  type ContrastRequirement,
} from '@einsatzzeichen/core';
import type { BodyLabelInk, Drawing, OrganizationId, SymbolSpec } from '@einsatzzeichen/schema';
import { baseDrawing } from './base-symbols.js';
import { bodyMark } from './body-marks.js';
import { administrativeHead } from './administrative-heads.js';
import { functionRole } from './function-roles.js';
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
import { ANHANG_D_TASK_6_RECIPES } from './recipes-anhang-d.js';
import { ANHANG_N_RECIPES } from './recipes-anhang-n.js';
import { ANHANG_G_RECIPES } from './recipes-anhang-g.js';
import { ANHANG_H_RECIPES } from './recipes-anhang-h.js';
import {
  ANHANG_I_D_RECIPES,
  ANHANG_I_E_RECIPES,
  ANHANG_I_G_RECIPES,
  ANHANG_I_B_RECIPES,
  ANHANG_I_A_RECIPES,
  ANHANG_I_J_RECIPES,
} from './recipes-anhang-i.js';

const PORTS: CatalogPorts = {
  baseDrawing,
  bodyMark,
  organizationColor,
  strengthHead,
  functionRole,
  administrativeHead,
  vehicleChassis,
  pictogram,
};

export function composeFromCatalog(spec: SymbolSpec, title?: string): Drawing {
  return compose(spec, PORTS, {
    ...(title !== undefined ? { title } : {}),
    descriptionFromSpec: describeSymbolSpec,
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
 * 2026 nachgezogenen E.2.6 sind damit **alle 68** Abschnitte des Anhangs E gebaut. E.2.6 ist
 * zugleich das einzige Zeichen des Anhangs E, dessen Kontrastpaar eine erklärte Ausnahme trägt
 * (`CONTRAST_EXCEPTIONS`).
 *
 * Anhang N ergänzt neun primary-Darstellungen weiterer Träger. Ihre Körper-, Fahrwerks-,
 * Marken- und Textgeometrien verwenden ausschließlich die davor separat vermessenen Verträge;
 * insbesondere entsteht aus „geländegängig“ keine neue fachliche oder technische ID.
 * Anhang I-e ergänzt vier Abschnitte mit fünf Wasserrettungsformationen. Die alternative
 * Darstellung von I.1.9 bleibt über ihren Varianten-Key eigenständig adressierbar; beide
 * Fachdienstbilder verwenden die vorhandenen CapabilityIds in einer für Formationen vermessenen
 * kompakten Geometrie statt der größeren Standard-Capability-Box.
 * Anhang I-j ergänzt drei einzeln vermessene Wasserrettungsorte mit eng gebundenen Kreisfassungen
 * und technischen Innenmarken; die fachliche Einordnung bleibt auch dort offen.
 * Anhang I-d und I-g ergänzen die Führungs- sowie Spezialformationen mit ihren jeweils eng
 * vermessenen Körpermarken; auch dort bleiben die Domain-Reviews separat offen.
 */
export const RECIPES = {
  ...ANHANG_D_TASK_6_RECIPES,
  ...ANHANG_G_RECIPES,
  ...ANHANG_F_A_RECIPES,
  ...ANHANG_F_B_RECIPES,
  ...ANHANG_F_C_RECIPES,
  ...ANHANG_F_D_RECIPES,
  ...ANHANG_F_E_RECIPES,
  ...ANHANG_F_F_RECIPES,
  ...ANHANG_I_D_RECIPES,
  ...ANHANG_I_E_RECIPES,
  ...ANHANG_I_G_RECIPES,
  ...ANHANG_I_B_RECIPES,
  ...ANHANG_I_A_RECIPES,
  ...ANHANG_I_J_RECIPES,
  ...ANHANG_E_A_RECIPES,
  ...ANHANG_E_B_RECIPES,
  ...ANHANG_E_C_RECIPES,
  ...ANHANG_E_D_RECIPES,
  ...ANHANG_E_E_RECIPES,
  ...ANHANG_E_F_RECIPES,
  ...ANHANG_N_RECIPES,
  ...ANHANG_H_RECIPES,
  'C.1.1': {
    title: 'Löschstaffel',
    referenceAsset: 'C.1.1_Löschstaffel.svg',
    spec: {
      kind: 'formation',
      organization: 'feuerwehr',
      strength: 'staffel',
      bodyMarks: ['fire-fighting'],
    },
  },
  'C.1.2': {
    title: 'Löschgruppe',
    referenceAsset: 'C.1.2_Löschgruppe.svg',
    spec: {
      kind: 'formation',
      organization: 'feuerwehr',
      strength: 'gruppe',
      bodyMarks: ['fire-fighting'],
    },
  },
  'C.1.3': {
    title: 'Löschzug einer Feuerwehr',
    referenceAsset: 'C.1.3_Löschzug einer Feuerwehr.svg',
    spec: {
      kind: 'formation',
      organization: 'feuerwehr',
      strength: 'zug',
      bodyMarks: ['fire-fighting'],
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
 * **Seit LFH-422 kann die Quelle diese Ableitung je Rezept überschreiben.** N.1.2 bis N.1.5
 * führen schwarze Körperläufe auf orange, hellgruen und braun. `bodyLabelInk()` nimmt denselben
 * optionalen `inBodyInk`-Wert entgegen wie die Zeichnung; der Kontrastvertrag pflegt keine
 * zweite Farblogik. Da E.2.6 auf derselben orangefarbenen Organisation weiterhin den weissen
 * Default trägt, wird die Körperanforderung nach Organisation **und** Vordergrund dedupliziert.
 * So bleiben weiss/orange und schwarz/orange zugleich sichtbar.
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
  const inBody = new Map<string, {
    organization: OrganizationId;
    foreground: BodyLabelInk;
  }>();
  const blackBottomCenter = new Set<OrganizationId>();
  const belowBody = new Set<OrganizationId>();
  const roleText = new Map<string, ContrastRequirement>();
  let blackBelowBody = false;
  let aboveBody = false;
  let surfaceBelowBody = false;
  const circleTopLeftOnSurface = new Set<BodyLabelInk>();
  for (const recipe of recipes) {
    const { labels, organization } = recipe.spec;
    if (recipe.spec.functionRole !== undefined) {
      const definition = functionRole(recipe.spec.functionRole);
      const bodyFill = organization === undefined ? 'weiss' : organizationColor(organization);
      for (const run of [
        ...definition.layout.roleRuns,
        ...(definition.layout.carrierRun === undefined ? [] : [definition.layout.carrierRun]),
      ]) {
        const foreground = functionRoleTextInk(run, bodyFill);
        const background = run.contrastBackground === 'body'
          ? bodyFill
          : run.contrastBackground;
        const context = `Funktionslauf ${definition.id}: ${run.content}`;
        roleText.set(`${foreground}/${background}/${context}`, {
          foreground,
          background,
          context,
          minimum: MINIMUM_TEXT_CONTRAST,
        });
      }
    }
    if (labels === undefined) continue;
    const profile = profileFor(recipe.spec.kind, recipe.spec.bodyVariant);
    // Körperbeschriftungen ohne Organisation bleiben außen vor: ohne Organisationsfarbe ist
    // kein belastbares Körperfarbenpaar ableitbar. Schwarzes `belowRight` ist davon unabhängig,
    // weil sein Profil Vorder- und Hintergrundtoken vollständig festlegt.
    if (organization !== undefined) {
      if (
        labels.center !== undefined ||
        labels.topLeft !== undefined ||
        labels.bottomLeft !== undefined ||
        (labels.bottomCenter !== undefined && profile.bottomCenterInk !== 'black') ||
        labels.bottomRight !== undefined ||
        labels.topLeftLines !== undefined
      ) {
        const foreground = bodyLabelInk(
          organizationColor(organization),
          labels.inBodyInk,
        );
        // Ein Organisationsprofil kann mehrere quellenvermessene Tinten führen: E.2.6 setzt auf
        // orange den bisherigen weissen Default, N.1.2/N.1.5 dagegen schwarz. Der Schlüssel muss
        // deshalb Farbe und Organisation tragen; ein Set nur aus Organisationen verschluckte eines
        // der beiden real gezeichneten Kontrastpaare.
        inBody.set(`${organization}:${foreground}`, { organization, foreground });
      }
      if (labels.bottomCenter !== undefined && profile.bottomCenterInk === 'black') {
        blackBottomCenter.add(organization);
      }
      if (recipe.spec.kind === 'circle-12' && labels.topLeft !== undefined) {
        circleTopLeftOnSurface.add(bodyLabelInk(
          organizationColor(organization),
          labels.inBodyInk,
        ));
      }
    }
    if (labels.aboveLeft !== undefined) aboveBody = true;
    if (labels.surfaceBelowLeft !== undefined || labels.surfaceBelowRight !== undefined) {
      // Beide Felder teilen Tinte und Untergrund. Ein boolescher Vertrag hält zwei sichtbare
      // Läufe wie bei N.2.3 dedupliziert, ohne sie mit `aboveLeft` oder Kreis-Clipping zu vermengen.
      surfaceBelowBody = true;
    }
    if (labels.belowRight !== undefined) {
      const ink = profile.belowRight?.ink;
      if (ink === 'organization' && organization !== undefined) belowBody.add(organization);
      if (ink === 'black') blackBelowBody = true;
    }
  }
  return [
    ...roleText.values(),
    ...[...inBody.values()].map<ContrastRequirement>(({ organization, foreground }) => ({
      // Derselbe Resolver, den `compose.ts` beim Zeichnen anwendet: quellenvermessener Override,
      // sonst schwarz auf weissem Körper und weiss auf jeder anderen Füllung. Aufgerufen und
      // nicht nachgebaut, damit Vertrag und Zeichnung nicht auseinanderlaufen können.
      foreground,
      background: organizationColor(organization),
      context: `Beschriftung im Körper auf Organisation ${organization}`,
      minimum: MINIMUM_TEXT_CONTRAST,
    })),
    ...[...blackBottomCenter].map<ContrastRequirement>((organization) => ({
      foreground: 'schwarz',
      background: organizationColor(organization),
      context: `Schwarze Beschriftung im Körper auf Organisation ${organization}`,
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
    ...(surfaceBelowBody ? [{
      foreground: 'schwarz' as const,
      background: 'surface' as const,
      context: 'Beschriftung unterhalb des Körpers auf der Ausgabeoberfläche',
      minimum: MINIMUM_TEXT_CONTRAST,
    }] : []),
    ...[...circleTopLeftOnSurface].map<ContrastRequirement>((foreground) => ({
      foreground,
      background: 'surface' as const,
      context: 'Kreislabel teilweise außerhalb der Körperfläche',
      minimum: MINIMUM_TEXT_CONTRAST,
    })),
  ];
}
