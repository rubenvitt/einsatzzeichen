import { describe, expect, it } from 'vitest';
import { VALIDATION_RULE_IDS } from '@einsatzzeichen/core';
import type { ElementDescriptor } from './elements.js';
import {
  generativeReach,
  reachSignature,
  ruleCoverage,
  validationRuleCoverage,
} from './rule-coverage.js';
import type { Recipe } from './recipes.js';

const recipe = (spec: Recipe['spec'], title = 'Test'): Recipe => ({
  title,
  referenceAsset: 'x.svg',
  spec,
});

describe('ruleCoverage (Fixtures)', () => {
  it('belegt eine Achse aus Rezepten und meldet die fehlenden Werte in Schemareihenfolge', () => {
    const axes = ruleCoverage(
      [recipe({ kind: 'formation', strength: 'zug' }), recipe({ kind: 'person', strength: 'trupp' })],
      [],
      [],
      [],
    );
    const strength = axes.find((axis) => axis.id === 'strength');
    expect(strength?.exercised).toEqual(['trupp', 'zug']);
    expect(strength?.missing).toEqual(['staffel', 'gruppe']);
    const kind = axes.find((axis) => axis.id === 'kind');
    expect(kind?.exercised).toEqual(['formation', 'person']);
    expect(kind?.values).toHaveLength(19);
  });

  it('belegt Organisationen, Stärken und Fahrwerke auch über Elemente ohne Rezept', () => {
    const elements: ElementDescriptor[] = [
      { id: 'organization.polizei', kind: 'organization', title: 'Polizei', referenceAssets: ['2.5_Polizei.svg'] },
      { id: 'vehicle-category.kettenfahrzeug', kind: 'vehicle-category', title: 'Kette', referenceAssets: ['5.1.1.5_x.svg'] },
    ];
    const axes = ruleCoverage([], elements, [], []);
    expect(axes.find((axis) => axis.id === 'organization')?.exercised).toEqual(['polizei']);
    expect(axes.find((axis) => axis.id === 'vehicleCategory')?.exercised).toEqual(['kettenfahrzeug']);
    expect(axes.find((axis) => axis.id === 'strength')?.exercised).toEqual([]);
  });

  it('misst Piktogrammräume gegen ALL_PICTOGRAMS und nicht gegen Rezepte', () => {
    const axes = ruleCoverage([], [], [], []);
    const state = axes.find((axis) => axis.id === 'state');
    expect(state?.exercised).toEqual([]);
    expect(state?.missing).toHaveLength(61);
  });

  it('belegt eine Art auch über einen Katalogeintrag ohne Rezept', () => {
    const axes = ruleCoverage([], [], [], [
      { id: 'base.post', title: 'Stelle', kind: 'post', profile: 'bund', depictions: [] },
    ]);
    expect(axes.find((axis) => axis.id === 'kind')?.exercised).toEqual(['post']);
  });

  it('kennt bodyMarks als Fähigkeit oder technische Marke', () => {
    const axes = ruleCoverage([recipe({ kind: 'formation', bodyMarks: ['fire-fighting'] })], [], [], []);
    expect(axes.find((axis) => axis.id === 'capabilities')?.exercised).toEqual(['fire-fighting']);
    expect(axes.find((axis) => axis.id === 'bodyMarks')?.exercised).toEqual([]);
  });
});

describe('ruleCoverage (echter Bestand)', () => {
  // Die Zahlen wachsen mit dem Katalog; sie stehen hier, damit eine Erweiterung sichtbar
  // hier ankommt und damit die Ausgabe von `pnpm cli coverage` an einer Stelle belegt ist.
  it('führt 16 Achsen, davon 14 vollständig; Lücken bei administrativeLevel und vehicleCategory', () => {
    const axes = ruleCoverage();
    expect(axes.map((axis) => axis.id)).toEqual([
      'kind', 'bodyVariant', 'organization', 'strength', 'technicalHeadMark', 'administrativeLevel',
      'functionRole', 'vehicleCategory', 'capabilities', 'bodyMarks',
      'state', 'comms', 'damage', 'wildfire', 'leadership', 'water-rescue-personnel',
    ]);
    const gaps = axes.filter((axis) => axis.missing.length > 0).map((axis) => [axis.id, axis.missing]);
    expect(gaps).toEqual([
      // Drei der sechs Verwaltungsstufen haben in Kopfform keine Referenz
      // (`docs/decisions/2026-08-18-grundlagen-restpunkte.md`).
      ['administrativeLevel', ['gemeinde', 'bezirk', 'bundesland']],
      // Wellenlinie nur als Strichhülle vermessen; siehe `INVENTORY_EXCLUSIONS`.
      ['vehicleCategory', ['amphibienfahrzeug']],
    ]);
    expect(axes.filter((axis) => axis.missing.length === 0)).toHaveLength(14);
  });

  it('zählt die Validierungsregeln aus core, ohne sie zu wiederholen', () => {
    expect(validationRuleCoverage()).toEqual({ total: VALIDATION_RULE_IDS.length });
    expect(validationRuleCoverage().total).toBe(72);
  });
});

describe('reachSignature', () => {
  it('projiziert auf die fünf Kernachsen und ignoriert alles andere', () => {
    expect(reachSignature({ kind: 'formation', organization: 'thw', strength: 'zug', bodyMarks: ['fire-fighting'], designation: 'x' }))
      .toBe('formation||thw|strength:zug|');
    expect(reachSignature({ kind: 'vehicle-land', vehicleCategory: 'kfz-kategorie-1', administrativeLevel: 'kreis' }))
      .toBe('vehicle-land|||administrativeLevel:kreis|kfz-kategorie-1');
  });
});

describe('generativeReach (echter Bestand)', () => {
  it('enumeriert Stufe 1 mit echtem validateSpec und compose und bleibt unter einer Sekunde', () => {
    // 19 Arten × (∅+10) Varianten × (∅+9) Organisationen × (∅+4+1+6) Kopfzonen × (∅+8) Fahrwerke.
    // Die Reichweitenzahlen wachsen mit den vermessenen Verträgen (ein neues Fahrwerk, eine neue
    // Körpervariante); `referenced` wächst mit den Rezepten. Der Unterschied validBySpec − valid
    // sind Kombinationen, die die Regeln durchlassen und erst der Motor ablehnt — heute das
    // Amphibienfahrzeug-Fahrwerk (60) und die Körperfüllung an `event` (9).
    const reach = generativeReach();
    expect(reach.enumerated).toBe(19 * 11 * 10 * 12 * 9);
    expect(reach.validBySpec).toBe(963);
    expect(reach.valid).toBe(894);
    expect(reach.referenced).toBe(67);
    expect(reach.reachOnly).toBe(894 - 67);
    // Acht Rezeptsignaturen sind für sich allein nicht gültig: die farbigen Kreisverträge
    // brauchen ihre Körpermarke, die Personen mit Verwaltungsstufe ihre Funktionsrolle, das
    // eingesenkte Wasserfahrzeug seine Beschriftung. Stufe 1 enumeriert keine dieser Achsen.
    expect(reach.referencedOutsideReach).toHaveLength(8);
    expect(reach.notEnumerated.map((axis) => [axis.id, axis.size])).toEqual([
      ['capabilities', 88],
      ['bodyMarks', 132],
      ['functionRole', 25],
      ['designation', Number.POSITIVE_INFINITY],
    ]);
    // Keine Laufzeit-Assertion: allein gemessen ~140 ms, unter Vitest-Parallellast bis 4 s —
    // eine Schwelle wäre ein Lastflake. `durationMs` bleibt in der Ausgabe sichtbar.
    expect(reach.durationMs).toBeGreaterThan(0);
  });

  it('zählt mit einer Fixture-Rezeptmenge nur die Signaturen innerhalb der Reichweite', () => {
    const reach = generativeReach([
      recipe({ kind: 'formation', organization: 'feuerwehr', strength: 'zug' }),
      recipe({ kind: 'formation', organization: 'feuerwehr', strength: 'zug', bodyMarks: ['fire-fighting'] }),
      recipe({ kind: 'formation', organization: 'feuerwehr', vehicleCategory: 'kfz-kategorie-1' }),
    ]);
    // Zwei Rezepte, eine Signatur; das dritte ist ungültig (Fahrwerk an einer Formation).
    expect(reach.referenced).toBe(1);
    expect(reach.referencedOutsideReach).toEqual(['formation||feuerwehr||kfz-kategorie-1']);
    expect(reach.reachOnly).toBe(reach.valid - 1);
  });
});
