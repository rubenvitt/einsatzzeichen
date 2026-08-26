import { describe, expect, it } from 'vitest';
import { PALETTE, type OrganizationId } from '@einsatzzeichen/schema';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import { ORGANIZATION_COLORS, organizationColor } from './organizations.js';
import { fingerprintFor } from './fingerprint-index.js';

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

/** Zusätzlicher Farbbeleg außerhalb Kapitel 2; gehört deshalb nicht in dessen Coverage-Claim. */
const ANHANG_N_COLORED = [
  ['bundespolizei', 'N.1.3_Einsatzfahrzeug_Bundespolizei.svg'],
] as const satisfies ReadonlyArray<[keyof typeof ORGANIZATION_COLORS, string]>;

/**
 * Erzwingt zur Kompilierzeit, dass jede in `ORGANIZATION_COLORS` belegte Organisation auch in
 * `COLORED` einen Farbnachweis-Fall hat. `ReadonlyArray<[keyof typeof ORGANIZATION_COLORS, string]>`
 * oben prüft nur, dass jeder COLORED-Eintrag ein gültiger Schlüssel ist — nicht, dass jeder
 * Schlüssel referenziert wird. Ergänzt jemand `ORGANIZATION_COLORS` um eine Organisation, ohne
 * `COLORED` zu ergänzen, ist `ReferencedOrganization` nicht mehr deckungsgleich mit
 * `keyof typeof ORGANIZATION_COLORS`, und die Zuweisung unten wird zum Typfehler
 * ("Type 'false' does not satisfy the constraint 'true'").
 */
type ReferencedOrganization =
  | (typeof COLORED)[number][0]
  | (typeof ANHANG_N_COLORED)[number][0];
type Extends<Type, Constraint> = Type extends Constraint ? true : false;
type AssertTrue<Check extends true> = Check;
const referenceCoversAllOrganizationColors: AssertTrue<
  Extends<keyof typeof ORGANIZATION_COLORS, ReferencedOrganization>
> = true;
void referenceCoversAllOrganizationColors;

describe('Organisationsfarben Kapitel 2', () => {
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

  it('belegt jede der neun Organisationen der Taxonomie', () => {
    // Bis LFH-424 sicherte diese Stelle das Gegenteil zu: `organizationColor('hilfsorganisation')`
    // warf, weil Kapitel 2 angeblich keine Referenzdatei dafür führte. 2.2_Organisationen.svg ist
    // die Datei — vollflächiger Fleck #ffffff, Typo-Ebene liest „HiOrg".
    const all: readonly OrganizationId[] = [
      'feuerwehr',
      'thw',
      'fuehrung-leitung',
      'polizei',
      'bundespolizei',
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

  it('trennt die hellgrüne Bundespolizei von der grünen Polizei', () => {
    const [[, asset]] = ANHANG_N_COLORED;
    expect(fingerprintFor(asset).fills).toContain('#64dc32');
    expect(PALETTE[organizationColor('bundespolizei')]).toBe('#64dc32');
    expect(organizationColor('bundespolizei')).toBe('hellgruen');
    expect(organizationColor('polizei')).toBe('gruen');
  });

  it('definiert für jede belegte Organisation genau ein gültiges Palettentoken', () => {
    for (const token of Object.values(ORGANIZATION_COLORS)) {
      expect(PALETTE[token]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
