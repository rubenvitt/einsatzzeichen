import { describe, expect, it } from 'vitest';
import { PALETTE, type OrganizationId, type SymbolSpec } from '@einsatzzeichen/schema';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import { CompositionError, ORGANIZATION_COLORS, organizationColor } from '@einsatzzeichen/core';
import { fingerprintFor, referenceInventoryAssets } from './fingerprint-index.js';
import { composeFromCatalog, RECIPES } from './recipes.js';

/** Organisationen aus Kapitel 2, deren Referenzdatei eine Füllfarbe trägt — per audit:reference belegt. */
const COLORED = [
  ['feuerwehr', '2.1_Feuerwehr.svg'],
  ['thw', '2.3_Technisches Hilfswerk.svg'],
  ['fuehrung-leitung', '2.4_Führung Leitung.svg'],
  ['polizei', '2.5_Polizei.svg'],
  ['bundeswehr', '2.6_Bundeswehr.svg'],
  ['sonstige-gefahrenabwehr', '2.7_Sonstige Gefahrenabwehr.svg'],
  ['zivile-einheiten', '2.8_Zivile Einheiten.svg'],
  // Seit LFH-424: 2.2 ist keine Legende, sondern der Fleck der Hilfsorganisationen — vollflächig
  // #ffffff wie 2.1 und 2.3 bis 2.8 gebaut, Typo-Ebene liest „HiOrg".
  ['hilfsorganisation', '2.2_Organisationen.svg'],
] as const satisfies ReadonlyArray<[keyof typeof ORGANIZATION_COLORS, string]>;

/**
 * Die drei Referenzzeichen mit hellgrüner Fläche (`#64dc32`). Seit LFH-586 (Entscheidung vom
 * 29.09.2026) zeichnet der Katalog sie bewusst im Polizei-Grün der Tafel 2.5: Die Bundespolizei
 * ist keine eigene Organisation, und die Polizei bleibt `gruen`.
 */
const LIGHT_GREEN_POLICE_REFERENCES = [
  ['D.4.4', 'D.4.4_Leiter Gefahrenabwehrkräfte Bundespolizei.svg'],
  ['G.3.2', 'G.3.2_Verpflegungszubereitungsstelle_betrieben durch Polizei.svg'],
  ['N.1.3', 'N.1.3_Einsatzfahrzeug_Bundespolizei.svg'],
] as const;

/**
 * Erzwingt zur Kompilierzeit, dass jede in `ORGANIZATION_COLORS` belegte Organisation auch in
 * `COLORED` einen Farbnachweis-Fall hat. `ReadonlyArray<[keyof typeof ORGANIZATION_COLORS, string]>`
 * oben prüft nur, dass jeder COLORED-Eintrag ein gültiger Schlüssel ist — nicht, dass jeder
 * Schlüssel referenziert wird. Ergänzt jemand `ORGANIZATION_COLORS` um eine Organisation, ohne
 * `COLORED` zu ergänzen, ist `ReferencedOrganization` nicht mehr deckungsgleich mit
 * `keyof typeof ORGANIZATION_COLORS`, und die Zuweisung unten wird zum Typfehler
 * ("Type 'false' does not satisfy the constraint 'true'").
 */
type ReferencedOrganization = (typeof COLORED)[number][0];
type Extends<Type, Constraint> = Type extends Constraint ? true : false;
type AssertTrue<Check extends true> = Check;
const referenceCoversAllOrganizationColors: AssertTrue<
  Extends<keyof typeof ORGANIZATION_COLORS, ReferencedOrganization>
> = true;
void referenceCoversAllOrganizationColors;

describe('Organisationsfarben Kapitel 2', () => {
  const measuredN2CircleSpecs = [
    {
      kind: 'circle-12',
      organization: 'zivile-einheiten',
      bodyMarks: ['spontaneous-helper-collection-arrow'],
    },
    {
      kind: 'circle-12',
      organization: 'feuerwehr',
      bodyMarks: ['spontaneous-helper-contact-double-arrow'],
    },
    {
      kind: 'circle-12',
      bodyVariant: 'raised-circle-1mm',
      organization: 'zivile-einheiten',
      bodyMarks: ['circle-information-stem'],
      labels: { surfaceBelowLeft: '291300', surfaceBelowRight: 'ZIV' },
    },
  ] as const satisfies readonly SymbolSpec[];

  it('komponiert die drei gemessenen N.2-Kreisverträge und lehnt vertauschte Organisationen nicht mehr ab', () => {
    for (const spec of measuredN2CircleSpecs) {
      expect(() => composeFromCatalog(spec), JSON.stringify(spec)).not.toThrow();
    }

    // Seit dem 2. Oktober 2026 füllt jede Organisation (auch keine) den 12-mm-Kreis. Was hier noch
    // abbricht, ist eine an dieser Fassung nicht vermessene Körpermarke, keine Regel.
    const crossed: readonly SymbolSpec[] = [
      ...measuredN2CircleSpecs.map(({ organization: _organization, ...spec }) => spec),
      {
        kind: 'circle-12', organization: 'feuerwehr',
        bodyMarks: ['spontaneous-helper-collection-arrow'],
      },
      {
        kind: 'circle-12', organization: 'zivile-einheiten',
        bodyMarks: ['spontaneous-helper-contact-double-arrow'],
      },
      {
        kind: 'circle-12', organization: 'zivile-einheiten',
        bodyMarks: ['circle-information-stem'],
      },
      {
        kind: 'circle-12', organization: 'hilfsorganisation',
        bodyMarks: ['spontaneous-helper-collection-arrow'],
      },
      {
        kind: 'circle-12', organization: 'hilfsorganisation',
        bodyMarks: ['spontaneous-helper-contact-double-arrow'],
      },
      {
        kind: 'circle-12', bodyVariant: 'raised-circle-1mm',
        organization: 'feuerwehr', bodyMarks: ['circle-information-stem'],
      },
      {
        kind: 'circle-12', bodyVariant: 'raised-circle-1mm',
        organization: 'zivile-einheiten', bodyMarks: ['spontaneous-helper-collection-arrow'],
      },
      {
        kind: 'circle-12', bodyVariant: 'raised-circle-1mm',
        organization: 'zivile-einheiten',
      },
    ];
    for (const spec of crossed) {
      let thrown: unknown;
      try {
        composeFromCatalog(spec);
      } catch (error) {
        thrown = error;
      }
      expect(thrown, JSON.stringify(spec)).not.toBeInstanceOf(CompositionError);
    }
  });

  it('bindet den Referenzfüllungs-Claim exakt an die ausgeführten Organisationsfälle', () => {
    const tested = COLORED.map(([id]) => `organization.${id}`).sort();
    const claimed = COVERAGE_MANIFEST.entries
      .filter((entry) => entry.testEvidence.includes('reference-fill'))
      .map((entry) => entry.implementation)
      .sort();
    expect(tested).toEqual(claimed);
  });

  it.each(COLORED)('trifft die Referenzfarbe von %s', (id, asset) => {
    const fills = fingerprintFor(asset).fills ?? [];
    expect(fills, `${asset} trägt keine Füllfarbe — stimmt der Eintrag noch mit dem Artefakt?`)
      .toContain(PALETTE[organizationColor(id)]);
  });

  it('belegt jede der acht Organisationen der Taxonomie', () => {
    // Bis LFH-424 sicherte diese Stelle das Gegenteil zu: `organizationColor('hilfsorganisation')`
    // warf, weil Kapitel 2 angeblich keine Referenzdatei dafür führte. 2.2_Organisationen.svg ist
    // die Datei — vollflächiger Fleck #ffffff, Typo-Ebene liest „HiOrg".
    const all: readonly OrganizationId[] = [
      'feuerwehr',
      'thw',
      'fuehrung-leitung',
      'polizei',
      'bundeswehr',
      'sonstige-gefahrenabwehr',
      'zivile-einheiten',
      'hilfsorganisation',
    ];
    for (const id of all) expect(() => organizationColor(id)).not.toThrow();
    expect(Object.keys(ORGANIZATION_COLORS)).toHaveLength(all.length);
  });

  it('hält fest, dass hilfsorganisation dieselbe Farbe trägt wie die neutrale Grundfüllung', () => {
    // Kein Umsetzungsfehler, sondern eine Eigenschaft der Quelle: ein Zeichen mit
    // `hilfsorganisation` ist von einem organisationslosen farblich nicht unterscheidbar. Genau
    // deshalb trägt die Kontursignatur hier mehr als bei den übrigen sieben.
    expect(PALETTE[organizationColor('hilfsorganisation')]).toBe('#ffffff');
  });

  it('zeichnet die drei hellgrünen Polizeizeichen bewusst im Grün der Tafel 2.5 (LFH-586)', () => {
    expect(organizationColor('polizei')).toBe('gruen');
    expect(PALETTE[organizationColor('polizei')]).toBe('#14a01e');
    expect(Object.values(ORGANIZATION_COLORS)).not.toContain('hellgruen');
    // Genau diese drei Dateien des Referenzbestands tragen das Hellgrün, keine weitere.
    const lightGreen = referenceInventoryAssets().filter((asset) =>
      (fingerprintFor(asset).fills ?? []).includes('#64dc32'));
    expect(lightGreen.sort()).toEqual(LIGHT_GREEN_POLICE_REFERENCES.map(([, asset]) => asset).sort());
    for (const [section, asset] of LIGHT_GREEN_POLICE_REFERENCES) {
      const recipe = RECIPES[section];
      expect(recipe?.referenceAsset, section).toBe(asset);
      expect(recipe?.spec.organization, section).toBe('polizei');
      expect(fingerprintFor(asset).fills, section).toContain('#64dc32');
      expect(fingerprintFor(asset).fills, section).not.toContain('#14a01e');
    }
  });

  it('definiert für jede belegte Organisation genau ein gültiges Palettentoken', () => {
    for (const token of Object.values(ORGANIZATION_COLORS)) {
      expect(PALETTE[token]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
