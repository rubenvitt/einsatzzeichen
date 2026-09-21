import { describe, expect, it } from 'vitest';
import { VALIDATION_RULE_IDS } from '@einsatzzeichen/core';
import type { ElementDescriptor } from './elements.js';
import {
  generativeReach,
  reachSignature,
  ruleCoverage,
  ruleEvidenceCoverage,
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

describe('ruleEvidenceCoverage (Regelsicht)', () => {
  it('zählt einen Fall nur, wenn er seine Regel wirklich auslöst', () => {
    const catalog = [
      { id: 'strength-requires-unit', kind: 'systematik', dimension: 'strength', phase: 'spec', reason: null, reasonSource: null, source: null, sites: 1 },
      { id: 'head-zone-conflict', kind: 'systematik', dimension: 'composition', phase: 'spec', reason: null, reasonSource: null, source: null, sites: 1 },
      { id: 'label-too-wide', kind: 'engine', dimension: 'label', phase: 'composition', reason: null, reasonSource: null, source: null, sites: 1 },
    ] as const;
    const coverage = ruleEvidenceCoverage(
      [
        { rule: 'strength-requires-unit', spec: { kind: 'hazard', strength: 'gruppe' }, via: 'validateSpec', note: '' },
        // Gültige Spec: löst nichts aus und darf deshalb nicht als belegt zählen.
        { rule: 'head-zone-conflict', spec: { kind: 'formation', strength: 'gruppe' }, via: 'validateSpec', note: '' },
      ],
      [{ rule: 'label-too-wide', reason: 'x', location: 'packages/x' }],
      catalog,
    );
    expect(coverage.rules.map((row) => [row.id, row.status])).toEqual([
      ['strength-requires-unit', 'triggered'],
      ['head-zone-conflict', 'untriggered'],
      ['label-too-wide', 'gap'],
    ]);
    expect(coverage.total).toEqual({ total: 3, triggered: 1, gap: 1, untriggered: 1 });
  });

  // Seit LFH-568 (21.09.2026): „Eine Regel gilt als belegt, wenn ein Testfall sie auslöst." Die
  // Zahlen wachsen mit den Katalogen und schrumpfen nur, wenn eine Lücke einen Fall bekommt.
  it('belegt 74 von 78 Regeln durch Auslösung; vier benannte Lücken, keine stille', () => {
    const coverage = ruleEvidenceCoverage();
    expect(coverage.total).toEqual({ total: 78, triggered: 74, gap: 4, untriggered: 0 });
    expect(coverage.byPhase).toEqual({
      spec: { total: 72, triggered: 70, gap: 2, untriggered: 0 },
      composition: { total: 6, triggered: 4, gap: 2, untriggered: 0 },
    });
    expect(coverage.byKind).toEqual({
      systematik: { total: 8, triggered: 8, gap: 0, untriggered: 0 },
      engine: { total: 70, triggered: 66, gap: 4, untriggered: 0 },
    });
    expect(coverage.byDimension.map((entry) => [entry.dimension, entry.total, entry.triggered, entry.gap])).toEqual([
      ['body-variant', 7, 7, 0],
      ['organization', 3, 3, 0],
      ['technical-fill', 2, 2, 0],
      ['strength', 2, 2, 0],
      ['administrative-level', 1, 1, 0],
      ['technical-head-mark', 2, 2, 0],
      ['chassis', 2, 2, 0],
      ['function-role', 10, 7, 3],
      ['label', 48, 47, 1],
      ['composition', 1, 1, 0],
    ]);
    expect(coverage.rules.filter((row) => row.status === 'gap').map((row) => row.id)).toEqual([
      'function-role-label-metrics-required',
      'surface-right-label-requires-measured-anchor',
      'function-role-run-too-wide',
      'function-role-run-unknown-glyph',
    ]);
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

// Expliziter Timeout für jeden Test, der `generativeReach()` ausführt: die Enumeration prüft
// 225 720 Kombinationen mit `validateSpec` (963 bestehen) und komponiert 894 davon. Allein
// ~140 ms, unter Vitest-Parallellast bis ~4 s gemessen — das Vitest-Standardlimit von 5 s ist
// dann ein Lastflake, kein Befund.
const REACH_TIMEOUT_MS = 30_000;

describe('generativeReach (echter Bestand)', () => {
  it('enumeriert Stufe 1 mit echtem validateSpec und compose', () => {
    // 19 Arten × (∅+10) Varianten × (∅+9) Organisationen × (∅+4+2+6) Kopfzonen × (∅+8) Fahrwerke.
    // Seit dem 19.09.2026 zwei technische Kopfmarken (`double-vertical-bar` für E.1.31): +10 gültige
    // Kombinationen an der Formation, und E.1.31 bringt eine eigene Rezeptsignatur mit.
    // Die Reichweitenzahlen wachsen mit den vermessenen Verträgen (ein neues Fahrwerk, eine neue
    // Körpervariante); `referenced` wächst mit den Rezepten. Der Unterschied validBySpec − valid
    // sind Kombinationen, die die Regeln durchlassen und erst der Motor ablehnt — heute das
    // Amphibienfahrzeug-Fahrwerk (60) und die Körperfüllung an `event` (9).
    const reach = generativeReach();
    expect(reach.enumerated).toBe(19 * 11 * 10 * 13 * 9);
    expect(reach.validBySpec).toBe(993);
    expect(reach.valid).toBe(924);
    // F.1.1 und F.1.3 (Doppelbalken) sowie F.1.13 und F.1.21 (Einzelbalken) tragen seit dem
    // Fachreview ihre Kopfmarke; dazu +20 gültige Kombinationen, weil die technische Kopfmarke
    // jetzt auch an der Formation mit Fußband belegt ist (2 Marken × 10 Organisationen).
    expect(reach.referenced).toBe(71);
    expect(reach.reachOnly).toBe(924 - 71);
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
  }, REACH_TIMEOUT_MS);

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
  }, REACH_TIMEOUT_MS);
});
