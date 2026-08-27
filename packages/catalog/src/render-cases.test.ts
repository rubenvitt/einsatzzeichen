import { describe, expect, it } from 'vitest';
import { checkA11yMetadata, checkViewBox } from '@einsatzzeichen/core';
import { DEFAULT_VIEWBOX_MM } from '@einsatzzeichen/schema';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import { pictogramRenderId } from './pictograms/index.js';
import { ALL_PICTOGRAMS } from './pictograms/index.js';
import { RENDER_CASES } from './test-support/render-cases.js';

describe('vollständige Renderfallmenge', () => {
  it('bildet Piktogrammvarianten eindeutig auf Render-IDs ab', () => {
    expect(pictogramRenderId({ id: 'capability.fire-fighting', variant: 'primary' })).toBe(
      'capability.fire-fighting',
    );
    expect(pictogramRenderId({ id: 'capability.fire-fighting', variant: 'alternative' })).toBe(
      'capability.fire-fighting.alternative',
    );
  });

  it('ist nicht leer und über die Implementierungs-ID eindeutig', () => {
    const ids = RENDER_CASES.map((renderCase) => renderCase.id);
    // 497: der Hauptbestand mit I-d/I-g/I-j, fünf direkten I.5-Piktogrammen und den drei
    // komponierten I.5.1-bis-I.5.3-Rezepten.
    expect(ids).toHaveLength(497);
    // 3 Belegfälle des Kompositionsmotors (C.1.1, C.1.2, D.3.7) plus die 16 Zeichen aus E-a, die
    // zwölf aus E-b und die neun aus E-c — mit ihnen sind die 37 E.1-Abschnitte vollständig —,
    // dazu 21 aus E-d, fünf aus E-e und fünf aus E-f. Anhang F ergänzt 66, G 21, H, I-a und I-j
    // jeweils drei, I-d und I-g je vier, I.5.1 bis I.5.3 drei, C.1.3 einen, N neun und Anhang D
    // 26 Rezeptfälle.
    expect(ids.filter((id) => id.startsWith('recipe.'))).toHaveLength(214);
    expect(ids.filter((id) => id.startsWith('recipe.I.'))).toEqual([
      'recipe.I.1.17',
      'recipe.I.1.18',
      'recipe.I.1.19',
      'recipe.I.1.20',
      'recipe.I.1.5',
      'recipe.I.1.6',
      'recipe.I.1.7',
      'recipe.I.1.8',
      'recipe.I.3.5',
      'recipe.I.3.6',
      'recipe.I.3.7',
      'recipe.I.4.1',
      'recipe.I.4.2',
      'recipe.I.4.3',
      'recipe.I.5.1',
      'recipe.I.5.2',
      'recipe.I.5.3',
    ]);
    expect(ids.filter((id) => id.startsWith('recipe.G.'))).toHaveLength(21);
    expect(ids.filter((id) => id.startsWith('recipe.N.'))).toEqual([
      'recipe.N.1.1', 'recipe.N.1.2', 'recipe.N.1.3', 'recipe.N.1.4', 'recipe.N.1.5',
      'recipe.N.1.6', 'recipe.N.2.1', 'recipe.N.2.2', 'recipe.N.2.3',
    ]);
    expect(ids.filter((id) => id.startsWith('recipe.H.'))).toEqual([
      'recipe.H.1',
      'recipe.H.2',
      'recipe.H.3',
    ]);
    expect(ids.filter((id) => id.startsWith('recipe.I.4.'))).toEqual([
      'recipe.I.4.1',
      'recipe.I.4.2',
      'recipe.I.4.3',
    ]);
    expect(ids.filter((id) => id.startsWith('recipe.E.1.'))).toHaveLength(37);
    // Anhang F, Teilslice F-a: zehn Abschnitte in elf Renderfällen. Der elfte ist
    // `recipe.F.1.11#alternative` — der **erste Renderfall des Katalogs, dessen Darstellung im
    // Rezeptschlüssel steht** statt in einem Suffix aus `pictogramRenderId` (siehe die
    // Ableitung im Test darunter).
    const f1 = ids.filter((id) => id.startsWith('recipe.F.1.'));
    expect(f1).toHaveLength(25);
    expect(f1).toContain('recipe.F.1.11#alternative');
    expect(ids.filter((id) => id.startsWith('recipe.F.2.'))).toHaveLength(22);
    expect(ids.filter((id) => id.startsWith('recipe.F.3.'))).toHaveLength(19);
    // **31 und damit lückenlos**, seit E.2.6 am 18. August 2026 nachgezogen wurde. Diese Zeile
    // hielt vorher die Lücke fest (`not.toContain('recipe.E.2.6')`); sie hält jetzt die
    // Vollständigkeit fest, und zwar an den Renderfällen statt an einer Zahl — ein Zeichen ohne
    // Renderfall hätte keinen Snapshot, kein Raster- und kein Metadaten-Gate.
    const e2 = ids.filter((id) => id.startsWith('recipe.E.2.'));
    expect(e2).toHaveLength(31);
    expect(new Set(e2)).toEqual(
      new Set(Array.from({ length: 31 }, (_, index) => `recipe.E.2.${index + 1}`)),
    );
    expect(ids.filter((id) => id.startsWith('capability.'))).toHaveLength(92);
    expect(ids.filter((id) => id.startsWith('state.'))).toHaveLength(67);
    expect(ids.filter((id) => id.startsWith('comms.'))).toHaveLength(53);
    expect(ids.filter((id) => id.startsWith('damage.'))).toHaveLength(28);
    expect(ids.filter((id) => id.startsWith('wildfire.'))).toHaveLength(14);
    expect(ids.filter((id) => id.startsWith('leadership.'))).toEqual([
      'leadership.command-post-in-operation',
      'leadership.control-center',
      'leadership.guide-post',
      'leadership.helicopter-landing-site',
      'leadership.helicopter-landing-zone',
      'leadership.red-cross-commissioner',
      'leadership.reporting-head',
      'leadership.staging-area',
      'leadership.staging-area-with-reporting-head',
      'leadership.technical-advisor-thw',
    ]);
    // Was übrig bleibt, sind die vierzehn Grundzeichen aus Kapitel 1 — die einzigen
    // Renderfälle ohne Artpräfix. Seit LFH-424 ist das Kapitel vollständig.
    expect(
      ids.filter(
        (id) =>
          !id.startsWith('recipe.') &&
          !id.startsWith('capability.') &&
          !id.startsWith('state.') &&
          !id.startsWith('comms.') &&
          !id.startsWith('damage.') &&
          !id.startsWith('wildfire.') &&
          !id.startsWith('leadership.') &&
          !id.startsWith('water-rescue-personnel.'),
      ),
    ).toHaveLength(14);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('entspricht exakt allen Manifest-Einträgen mit SVG-Snapshot-Nachweis', () => {
    const cases = RENDER_CASES.map((renderCase) => renderCase.id).sort();
    const claimed = COVERAGE_MANIFEST.entries
      .filter((entry) => entry.testEvidence.includes('svg-snapshot'))
      // Zwei Ableitungen, weil es zwei Namensregeln gibt. Ein Piktogramm trägt seine ID ohne
      // Darstellung und bekommt das Suffix hier angehängt (`capability.x` +
      // `capability.x.alternative`). Ein Rezept trägt sie seit F-a **im Schlüssel** — die
      // Implementierungs-ID lautet `recipe.F.1.11#alternative`, weil `RECIPES` beide
      // Darstellungen als eigene Einträge führt und der Schlüssel deshalb eindeutig sein muss.
      // Beide durch `pictogramRenderId` zu schicken hinge dem Rezept die Darstellung ein
      // zweites Mal an (`…#alternative.alternative`) und vergliche eine ID, die es nirgends
      // gibt.
      .map((entry) =>
        entry.coverage === 'composition-recipe'
          ? entry.implementation
          : pictogramRenderId({ id: entry.implementation, variant: entry.variant }),
      )
      .sort();
    expect(cases).toEqual(claimed);
  });

  it.each(RENDER_CASES)('$id trägt vollständige semantische Metadaten', ({ drawing }) => {
    expect(checkA11yMetadata(drawing)).toEqual([]);
  });

  it.each(RENDER_CASES)('$id verwendet seine deklarierte ViewBox und clippt keine Geometrie', ({ drawing }) => {
    expect(checkViewBox(drawing)).toEqual([]);
  });

  it('hält nur D.1.1 rechteckig und alle übrigen Definitionen bei 32×32 mm', () => {
    const rectangular = ALL_PICTOGRAMS.filter(
      (definition) => definition.viewBox.width !== definition.viewBox.height,
    );
    expect(rectangular.map((definition) => [definition.id, definition.viewBox])).toEqual([
      ['leadership.command-post-in-operation', { width: 32, height: 46 }],
    ]);
    for (const definition of ALL_PICTOGRAMS.filter(
      (candidate) => !rectangular.includes(candidate),
    )) {
      expect(definition.viewBox).toEqual(DEFAULT_VIEWBOX_MM);
    }
  });
});
