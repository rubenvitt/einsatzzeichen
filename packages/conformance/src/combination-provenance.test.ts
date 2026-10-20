import { describe, expect, it } from 'vitest';
import {
  ALL_PICTOGRAMS,
  PLACES,
  anySpecProvenance,
  freestandingRedirect,
  matchFingerprint,
  specKey,
  symbolProvenance,
} from '@einsatzzeichen/core';
import { isFreestandingSpec, type FreestandingSpec, type StateId, type SymbolSpec } from '@einsatzzeichen/schema';
import {
  combinationProvenance,
  provenanceReview,
  referenceFileSections,
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
  it('trägt für 290 Rezepte 290 verschiedene Schlüssel — keine Kollision', () => {
    // 242 bis LFH-786, dazu die 37 Anhang-C-Fixtures, C.1.4, die acht aus Kapitel 5.1 und
    // C.1.13/C.1.14 (ESZ-143). C.2.24#alternative ist nicht darunter: sie
    // ergäbe dieselbe Spec und damit denselben Schlüssel wie C.2.20#alternative.
    const byKey = new Map<string, string[]>();
    for (const [section, recipe] of recipeEntries) {
      const key = specKey(recipe.spec);
      byKey.set(key, [...(byKey.get(key) ?? []), section]);
    }
    const collisions = [...byKey.values()].filter((sections) => sections.length > 1);

    expect(recipeEntries).toHaveLength(290);
    expect(byKey.size).toBe(290);
    expect(collisions).toEqual([]);
  });
});

describe('combinationProvenance()', () => {
  it('führt genau 290 verbatim-Fixtures: alle Rezepte mit vergleichbarer Form und die Leitstelle', () => {
    // 241 bis LFH-786; alle 37 Anhang-C-Referenzen führen eine vergleichbare Körperform, einzig
    // G.1.5 bleibt weiterhin ohne. Die acht aus Kapitel 5.1 (ESZ-117) und C.1.13/C.1.14
    // (ESZ-143) führen alle eine. Dazu der vermessene Ort D.2.5 (ESZ-136).
    expect(fingerprintCases).toHaveLength(289);
    expect(verbatimFixtures()).toHaveLength(290);
    expect(verbatimFixtures()).toEqual([...fingerprintCases.map(([section]) => section), 'D.2.5']);
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

describe('verbatimTableSource() — Generator der core-Tabellen (LFH-581, ESZ-136)', () => {
  const source = verbatimTableSource();
  const [bodyHullPart, referenceFilePart] = source.split('export const REFERENCE_FILE_TABLE');
  const rowsOf = (part: string | undefined) => (part ?? '')
    .split('\n')
    .filter((line) => line.startsWith('  ['))
    .map((line) => JSON.parse(line.trim().replace(/,$/, '')) as [string, string, string]);
  const byCodeUnit = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

  it('nennt den Generatorbefehl und exportiert beide Tabellen mit expliziter Typangabe', () => {
    expect(source).toContain('pnpm cli provenance:table');
    expect(source).toMatch(/^export const VERBATIM_TABLE: ReadonlyArray<$/m);
    expect(source).toMatch(/^export const REFERENCE_FILE_TABLE: ReadonlyArray<$/m);
    expect(source).not.toMatch(/as const/);
    expect(source.endsWith('];\n')).toBe(true);
  });

  it('führt je verbatim-Fixture eine Zeile [specKey, Fixture, Referenz], nach Fixture sortiert', () => {
    const control = PLACES['control-center'];
    const expected = verbatimFixtures()
      .slice()
      .sort(byCodeUnit)
      .map((fixture) => {
        if (fixture === 'D.2.5') return [specKey(control.spec), fixture, 'D.2.5_Leitstelle.svg'];
        const recipe = RECIPES[fixture as keyof typeof RECIPES];
        return [specKey(recipe.spec), fixture, recipe.referenceAsset];
      });
    expect(rowsOf(bodyHullPart)).toHaveLength(290);
    expect(rowsOf(bodyHullPart)).toEqual(expected);
  });

  it('führt je Spec mit Referenzdatei eine Zeile [specKey, Abschnitt, Referenz], nach Abschnitt sortiert', () => {
    const rows = rowsOf(referenceFilePart);
    expect(rows).toHaveLength(19);
    expect(rows.map(([, section]) => section)).toEqual(referenceFileSections().slice().sort(byCodeUnit));
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

/**
 * Specs, die genau eine Kapiteldatei zeichnen (ESZ-136): die kanonischen `SymbolSpec`-Ziele von
 * `freestandingRedirect`. Sie melden denselben Beleg wie das freistehende Zeichen, das auf sie
 * umgeleitet wird; einzig die Leitstelle D.2.5 belegt nur die Körperhülle, weil ihr Ort das Kürzel
 * aus der Grammatik setzt.
 */
describe('Specs mit Referenzdatei (ESZ-136)', () => {
  const redirected = ALL_PICTOGRAMS.flatMap((definition) => {
    const variant = definition.variant === 'primary' ? {} : { variant: definition.variant };
    const spec: FreestandingSpec = definition.id.startsWith('state.')
      ? { kind: 'state', state: definition.id.slice('state.'.length) as StateId, ...variant }
      : { kind: 'pictogram', pictogram: definition.id, ...variant };
    const target = freestandingRedirect(spec);
    return target !== undefined && !isFreestandingSpec(target) ? [{ definition, target }] : [];
  });

  it('nimmt die 17 Personenzustände und die beiden Hinweise an der Gefahr auf', () => {
    const sections = referenceFileSections();
    expect(sections).toHaveLength(19);
    expect(sections.filter((section) => section.startsWith('5.8.8.'))).toHaveLength(17);
    expect(sections.filter((section) => !section.startsWith('5.8.8.'))).toEqual(['5.8.1.13', '5.8.1.14']);
  });

  it('jedes kanonische Ziel ist verbatim: mit Referenzdatei, die Leitstelle mit Körperhülle', () => {
    expect(redirected).toHaveLength(20);
    for (const { definition, target } of redirected) {
      const expected = definition.id === 'leadership.control-center'
        ? { status: 'verbatim', claim: 'body-hull', fixture: 'D.2.5', referenceAsset: definition.referenceAsset }
        : {
          status: 'verbatim',
          claim: 'reference-file',
          section: definition.section,
          referenceAsset: definition.referenceAsset,
        };
      expect(symbolProvenance(target), definition.id).toEqual(expected);
      expect(anySpecProvenance(target), definition.id).toEqual(expected);
    }
  });

  it('trägt 5.8.8.12 bis 5.8.8.14 und 5.8.8.16, obwohl ihr Kennwert nur eine Umrisshülle führt', () => {
    for (const state of ['person-to-be-transported', 'person-in-transport', 'person-transported', 'person-care-dependent'] as const) {
      const spec: SymbolSpec = { kind: 'person', states: [state] };
      const provenance = symbolProvenance(spec);
      expect(provenance).toMatchObject({ status: 'verbatim', claim: 'reference-file' });
      const asset = provenance.status === 'verbatim' ? provenance.referenceAsset : '';
      const comparable = comparableFingerprint(fingerprintFor(asset));
      expect(matchFingerprint(composeFromCatalog(spec), comparable.fingerprint, comparable.options).ok).toBe(false);
    }
  });

  it('nennt den Reviewstand des Registerbilds', () => {
    for (const { definition, target } of redirected) {
      if (definition.id === 'leadership.control-center') continue;
      const manifestRow = COVERAGE_MANIFEST.entries.find((entry) => entry.implementation === definition.id &&
        entry.variant === definition.variant);
      expect(manifestRow?.review, definition.id).toBeDefined();
      expect(combinationProvenance(target)).toEqual({ ...symbolProvenance(target), review: manifestRow?.review });
    }
  });

  it('die Leitstelle als Ort hat keine Rezeptzeile und damit keinen Reviewstand', () => {
    const provenance = symbolProvenance(PLACES['control-center'].spec);
    expect(provenanceReview(provenance)).toBeUndefined();
    expect(combinationProvenance(PLACES['control-center'].spec)).toEqual(provenance);
  });

  it('bleibt derived für eine Person mit zwei Zuständen und für die Gefahr ohne Hinweis', () => {
    expect(symbolProvenance({ kind: 'person', states: ['person-injured', 'person-contaminated'] })).toEqual({ status: 'derived' });
    expect(symbolProvenance({ kind: 'hazard' })).toEqual({ status: 'derived' });
    expect(symbolProvenance({ kind: 'person', states: ['person-dead'], organization: 'feuerwehr' })).toEqual({ status: 'derived' });
  });
});
