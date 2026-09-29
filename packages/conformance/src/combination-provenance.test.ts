import { describe, expect, it } from 'vitest';
import { matchFingerprint, specKey, symbolProvenance } from '@einsatzzeichen/core';
import type { SymbolSpec } from '@einsatzzeichen/schema';
import {
  combinationProvenance,
  provenanceReview,
  verbatimFixtures,
  verbatimTableSource,
} from './combination-provenance.js';
import { comparableFingerprint } from './comparison-exceptions.js';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import { fingerprintFor, referenceLacksComparableShape } from './fingerprint-index.js';
import { RECIPES, composeFromCatalog } from './recipes.js';

const recipeEntries = Object.entries(RECIPES);
const fingerprintCases = recipeEntries.filter(([, recipe]) =>
  !referenceLacksComparableShape(recipe.referenceAsset));

describe('specKey() über den Rezeptbestand', () => {
  it('trägt für 280 Rezepte 280 verschiedene Schlüssel — keine Kollision', () => {
    // 242 bis LFH-786, dazu die 37 Anhang-C-Fixtures. C.2.24#alternative ist nicht darunter: sie
    // ergäbe dieselbe Spec und damit denselben Schlüssel wie C.2.20#alternative.
    const byKey = new Map<string, string[]>();
    for (const [section, recipe] of recipeEntries) {
      const key = specKey(recipe.spec);
      byKey.set(key, [...(byKey.get(key) ?? []), section]);
    }
    const collisions = [...byKey.values()].filter((sections) => sections.length > 1);

    expect(recipeEntries).toHaveLength(280);
    expect(byKey.size).toBe(280);
    expect(collisions).toEqual([]);
  });
});

describe('combinationProvenance()', () => {
  it('führt genau 279 verbatim-Fixtures: alle Rezepte mit vergleichbarer Form', () => {
    // 241 bis LFH-786; alle 37 Anhang-C-Referenzen führen eine vergleichbare Körperform, einzig
    // G.1.5 bleibt weiterhin ohne.
    expect(fingerprintCases).toHaveLength(279);
    expect(verbatimFixtures()).toHaveLength(279);
    expect(verbatimFixtures()).toEqual(fingerprintCases.map(([section]) => section));
  });

  it.each(fingerprintCases)('%s ist verbatim und nennt Fixture, Referenz und Review', (section, recipe) => {
    const manifestRow = COVERAGE_MANIFEST.entries.find(
      (entry) => entry.implementation === `recipe.${section}`,
    );
    expect(manifestRow, section).toBeDefined();
    expect(combinationProvenance(recipe.spec)).toEqual({
      status: 'verbatim',
      claim: 'body-hull',
      fixture: section,
      referenceAsset: recipe.referenceAsset,
      review: manifestRow?.review,
    });
  });

  it('G.1.5 ist derived: sein Kennwert führt keine vergleichbare Form (shapes: [])', () => {
    expect(fingerprintFor(RECIPES['G.1.5'].referenceAsset).shapes).toEqual([]);
    expect(combinationProvenance(RECIPES['G.1.5'].spec)).toEqual({ status: 'derived' });
  });

  it('ein erfundener Spec ist derived', () => {
    const invented: SymbolSpec = {
      kind: 'formation',
      organization: 'feuerwehr',
      strength: 'zug',
      bodyMarks: ['water-rescue'],
      labels: { topLeft: 'Erfunden' },
    };
    expect(recipeEntries.some(([, recipe]) => specKey(recipe.spec) === specKey(invented)))
      .toBe(false);
    expect(combinationProvenance(invented)).toEqual({ status: 'derived' });
  });

  it('bleibt verbatim bei anderer Reihenfolge der Körpermarken derselben Fixture', () => {
    const recipe = RECIPES['F.1.4'];
    expect(recipe.spec.bodyMarks).toEqual(['medical-service', 'care']);
    const reordered: SymbolSpec = { ...recipe.spec, bodyMarks: ['care', 'medical-service'] };
    expect(combinationProvenance(reordered)).toMatchObject({ status: 'verbatim', fixture: 'F.1.4' });
    // Die gleichgesetzte Spec besteht den Körpervergleich tatsächlich selbst, nicht nur per Schlüssel.
    expect(matchFingerprint(composeFromCatalog(reordered), fingerprintFor(recipe.referenceAsset)))
      .toEqual({ ok: true, problems: [] });
  });

  /**
   * **Die festgenagelte Einschränkung (LFH-568):** `verbatim` belegt heute nur die Körperhülle.
   * Eine Spec, die sich von einer Fixture nur in der Beschriftung unterscheidet, besteht denselben
   * Körpervergleich gegen dieselbe Referenz — der Vergleich sieht die Beschriftung nicht. Sie ist
   * trotzdem `derived`, weil ihr `specKey` keiner Fixture gleicht. Umgekehrt heißt das: auch ein
   * `verbatim` sagt über Beschriftung, Kopfzone und Marken nichts. Erweitert jemand den Vergleich
   * über die Körperhülle hinaus, muss dieser Test und `claim: 'body-hull'` mitziehen.
   */
  it('verbatim belegt nur die Körperhülle: der Vergleich übersieht eine geänderte Beschriftung', () => {
    const recipe = RECIPES['I.1.9'];
    expect(recipe.spec.labels).toEqual({ topLeft: 'Boot' });
    const relabelled: SymbolSpec = { ...recipe.spec, labels: { topLeft: 'Kahn' } };

    const comparable = comparableFingerprint(fingerprintFor(recipe.referenceAsset));
    expect(matchFingerprint(
      composeFromCatalog(relabelled),
      comparable.fingerprint,
      comparable.options,
    )).toEqual({ ok: true, problems: [] });

    expect(combinationProvenance(recipe.spec)).toMatchObject({
      status: 'verbatim',
      claim: 'body-hull',
    });
    expect(combinationProvenance(relabelled)).toEqual({ status: 'derived' });
  });
});

describe('verbatimTableSource() — Generator der core-Tabelle (LFH-581)', () => {
  const source = verbatimTableSource();
  const rows = source
    .split('\n')
    .filter((line) => line.startsWith('  ['))
    .map((line) => JSON.parse(line.trim().replace(/,$/, '')) as [string, string, string]);

  it('nennt den Generatorbefehl und exportiert VERBATIM_TABLE mit expliziter Typangabe', () => {
    expect(source).toContain('pnpm cli provenance:table');
    expect(source).toMatch(/^export const VERBATIM_TABLE: ReadonlyArray<$/m);
    expect(source).not.toMatch(/as const/);
    expect(source.endsWith('];\n')).toBe(true);
  });

  it('führt je verbatim-Fixture eine Zeile [specKey, Fixture, Referenz], nach Fixture sortiert', () => {
    const expected = verbatimFixtures()
      .slice()
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
      .map((fixture) => {
        const recipe = RECIPES[fixture as keyof typeof RECIPES];
        return [specKey(recipe.spec), fixture, recipe.referenceAsset];
      });
    expect(rows).toHaveLength(279);
    expect(rows).toEqual(expected);
  });

  it('enthält keine Fingerabdrücke — nur Schlüssel und Namen', () => {
    expect(source).not.toMatch(/fingerprint|shapes|edges/i);
  });
});

describe('Reviewstand optional aus conformance (LFH-581)', () => {
  it.each(fingerprintCases)('%s: core liefert die Herkunft, conformance den Reviewstand dazu', (section, recipe) => {
    const provenance = symbolProvenance(recipe.spec);
    const manifestRow = COVERAGE_MANIFEST.entries.find(
      (entry) => entry.implementation === `recipe.${section}`,
    );
    expect(provenance).toEqual({
      status: 'verbatim',
      claim: 'body-hull',
      fixture: section,
      referenceAsset: recipe.referenceAsset,
    });
    expect(provenanceReview(provenance)).toEqual(manifestRow?.review);
    expect(combinationProvenance(recipe.spec)).toEqual({ ...provenance, review: manifestRow?.review });
  });

  it('derived trägt keinen Reviewstand — ein abgeleitetes Zeichen behauptet keine Freigabe', () => {
    const derived = symbolProvenance(RECIPES['G.1.5'].spec);
    expect(derived).toEqual({ status: 'derived' });
    expect(provenanceReview(derived)).toBeUndefined();
  });
});
