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
type ReferencedOrganization = (typeof COLORED)[number][0];
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

  it('wirft für eine im Referenzumfang nicht belegte Organisation', () => {
    const hilfsorganisation: OrganizationId = 'hilfsorganisation';
    expect(() => organizationColor(hilfsorganisation)).toThrow(/hilfsorganisation/);
  });

  it('definiert für jede belegte Organisation genau ein gültiges Palettentoken', () => {
    for (const token of Object.values(ORGANIZATION_COLORS)) {
      expect(PALETTE[token]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
