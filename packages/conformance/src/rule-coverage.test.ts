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
  it('führt 17 Achsen, davon 12 vollständig; Lücken bei Kopfmarke, Verband, Verwaltungsstufe, Fahrwerk und Körpermarke', () => {
    const axes = ruleCoverage();
    expect(axes.map((axis) => axis.id)).toEqual([
      'kind', 'bodyVariant', 'organization', 'strength', 'technicalHeadMark', 'unitGrouping', 'administrativeLevel',
      'functionRole', 'vehicleCategory', 'capabilities', 'bodyMarks',
      'state', 'comms', 'damage', 'wildfire', 'leadership', 'water-rescue-personnel',
    ]);
    const gaps = axes.filter((axis) => axis.missing.length > 0).map((axis) => [axis.id, axis.missing]);
    expect(gaps).toEqual([
      // Seit LFH-577 tragen die sechs Rezepte mit Kopfbalken den Verband im eigenen Feld; die
      // gleich gezeichneten technischen Kopfmarken nutzt kein Rezept mehr (Entscheidung 8 vom
      // 29.09.2026). Sie bleiben für Balken ohne belegten Verbandsbegriff.
      ['technicalHeadMark', ['single-vertical-bar', 'double-vertical-bar']],
      // Verband III zeigt kein Original am Körper (docs/decisions/2026-09-29-lfh-577-verband-5-5.md).
      ['unitGrouping', ['verband-iii']],
      // Drei der sechs Verwaltungsstufen haben in Kopfform keine Referenz
      // (`docs/decisions/2026-08-18-grundlagen-restpunkte.md`).
      ['administrativeLevel', ['gemeinde', 'bezirk', 'bundesland']],
      // Wellenlinie nur als Strichhülle vermessen; siehe `INVENTORY_EXCLUSIONS`.
      ['vehicleCategory', ['amphibienfahrzeug']],
      // Seit dem 2. Oktober 2026: die Kappe der Leitstelle (D.2.5) ist gezeichnet und gegen das
      // Original geprüft (`leitstelle-d25.test.ts`), aber noch in keinem Rezept verwendet.
      ['bodyMarks', ['circle-solid-cap-4mm']],
    ]);
    expect(axes.filter((axis) => axis.missing.length === 0)).toHaveLength(12);
  });

  it('zählt die Validierungsregeln aus core, ohne sie zu wiederholen', () => {
    expect(validationRuleCoverage()).toEqual({ total: VALIDATION_RULE_IDS.length });
    // Am 2. Oktober 2026 von 79 auf 50: die Messsperren sind dem Ableiten gewichen
    // (docs/decisions/2026-10-02-ableiten-statt-messsperre.md).
    expect(validationRuleCoverage().total).toBe(50);
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
  it('belegt 59 von 62 Regeln durch Auslösung; drei benannte Lücken, keine stille', () => {
    // Seit LFH-577 zählen die sechs Regeln der freistehenden Zeichen mit
    // (`FREESTANDING_RULE_CATALOG`, Fälle in `FREESTANDING_RULE_EVIDENCE`).
    // Am 2. Oktober 2026 von 91 auf 62 Regeln (Ableiten statt Messsperre,
    // docs/decisions/2026-10-02-ableiten-statt-messsperre.md): die Prüfphase führt 29 Kennungen
    // weniger, mit ihnen entfiel die Lücke `surface-right-label-requires-measured-anchor`. Die Dimensionen
    // `organization`, `administrative-level` und `capabilities` tragen keine Regel mehr.
    const coverage = ruleEvidenceCoverage();
    expect(coverage.total).toEqual({ total: 62, triggered: 59, gap: 3, untriggered: 0 });
    expect(coverage.byPhase).toEqual({
      spec: { total: 56, triggered: 55, gap: 1, untriggered: 0 },
      composition: { total: 6, triggered: 4, gap: 2, untriggered: 0 },
    });
    expect(coverage.byKind).toEqual({
      systematik: { total: 20, triggered: 20, gap: 0, untriggered: 0 },
      engine: { total: 42, triggered: 39, gap: 3, untriggered: 0 },
    });
    expect(coverage.byDimension.map((entry) => [entry.dimension, entry.total, entry.triggered, entry.gap])).toEqual([
      ['body-variant', 4, 4, 0],
      ['technical-fill', 2, 2, 0],
      ['strength', 1, 1, 0],
      ['technical-head-mark', 1, 1, 0],
      ['chassis', 2, 2, 0],
      ['body-marks', 1, 1, 0],
      ['function-role', 7, 4, 3],
      ['state', 4, 4, 0],
      ['lines-and-boundaries', 2, 2, 0],
      ['weather', 3, 3, 0],
      ['animal', 1, 1, 0],
      ['label', 33, 33, 0],
      ['composition', 1, 1, 0],
    ]);
    expect(coverage.rules.filter((row) => row.status === 'gap').map((row) => row.id)).toEqual([
      'function-role-label-metrics-required',
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
// 270 864 Kombinationen mit `validateSpec` und komponiert die 26 964, die bestehen. Seit dem
// 2. Oktober 2026 allein rund 3 s (vorher ~140 ms, weil fast alles schon an der Prüfung
// scheiterte), unter Vitest-Parallellast mehr — das Vitest-Standardlimit von 5 s wäre ein
// Lastflake, kein Befund.
const REACH_TIMEOUT_MS = 30_000;

describe('generativeReach (echter Bestand)', () => {
  it('enumeriert Stufe 1 mit echtem validateSpec und compose', () => {
    // 19 Arten × (∅+10) Varianten × (∅+8) Organisationen × (∅+4+2+3+6) Kopfzonen × (∅+8) Fahrwerke.
    // Seit LFH-586 (29.09.2026) acht statt neun Organisationen: `bundespolizei` entfiel; die
    // belegten Signaturen blieben davon unberührt.
    // Seit LFH-577 drei Verbände in der Kopfzone. `validateSpec` bindet den Verband an keine Art —
    // wo er nicht vermessen ist (jeder andere Körper, Verband III), lehnt erst die Komposition ab
    // (`NotMeasuredError`); daher der Sprung in validBySpec. Gültig sind Verband I und II an der
    // Formation ohne Variante und mit Fußband: +36 (2 × 2 × 9 Organisationswerte einschließlich ∅).
    // Seit dem 19.09.2026 zwei technische Kopfmarken (`double-vertical-bar` für E.1.31): +10 gültige
    // Kombinationen an der Formation, und E.1.31 bringt eine eigene Rezeptsignatur mit.
    // Die Reichweitenzahlen wachsen mit den vermessenen Verträgen (ein neues Fahrwerk, eine neue
    // Körpervariante); `referenced` wächst mit den Rezepten. Der Unterschied validBySpec − valid
    // sind Kombinationen, die die Regeln durchlassen und erst der Motor ablehnt — bis zum
    // 2. Oktober 2026 das Amphibienfahrzeug-Fahrwerk (60) und die Körperfüllung an `event` (9).
    // Seit dem Ableiten (docs/decisions/2026-10-02-ableiten-statt-messsperre.md) zeichnet der
    // Motor fast jede Kombination: 2955 → 26 964 bestehen die Prüfung, 868 → 22 644 komponieren.
    // Abgelehnt bleibt allein das Fahrwerk unter dem Giebel (4320 = 26 964 − 22 644,
    // `NotMeasuredError`: die Radplätze sind absolut vermessen, der Körper für den Giebel verkleinert).
    const reach = generativeReach();
    expect(reach.enumerated).toBe(19 * 11 * 9 * 16 * 9);
    expect(reach.validBySpec).toBe(26964);
    expect(reach.valid).toBe(22644);
    // F.1.1 und F.1.3 (Doppelbalken) sowie F.1.13 und F.1.21 (Einzelbalken) tragen seit dem
    // Fachreview ihre Kopfmarke; dazu +20 gültige Kombinationen, weil die technische Kopfmarke
    // jetzt auch an der Formation mit Fußband belegt ist (2 Marken × 10 Organisationen). Seit
    // LFH-577 tragen diese sechs Rezepte `unitGrouping`; die Zahl der Signaturen bleibt.
    // LFH-786 bringt sechs neue Signaturen, alle mit Feuerwehrfarbe: die Formation mit Trupp
    // (C.1.7), das Landfahrzeug mit Kategorie 1 und mit Kategorie 2, den Anhänger mit einem Rad
    // (C.2.29), denselben Anhänger mit Fußband (C.2.30) und das Kettenfahrzeug mit
    // inverted-hull-track (C.2.31). C.1.8 teilt seine Signatur mit C.1.1. Keine der sechs liegt
    // außerhalb der Reichweite; sie bleiben auch mit acht Organisationen (LFH-586) gültig.
    // Seit dem 2. Oktober 2026 85 statt 77: die acht Signaturen, die bis dahin außerhalb lagen,
    // sind jetzt für sich allein gültig.
    expect(reach.referenced).toBe(85);
    expect(reach.reachOnly).toBe(22644 - 85);
    // Bis zum 2. Oktober 2026 waren acht Rezeptsignaturen für sich allein nicht gültig: die
    // farbigen Kreisverträge brauchten ihre Körpermarke, die Personen mit Verwaltungsstufe ihre
    // Funktionsrolle, das eingesenkte Wasserfahrzeug seine Beschriftung. Seit dem Ableiten zeichnet
    // der Motor sie auch ohne diese Achsen; keine Rezeptsignatur liegt mehr außerhalb.
    expect(reach.referencedOutsideReach).toHaveLength(0);
    // `bodyMarks` = 88 Fähigkeiten + technische Marken; LFH-786 ergänzt mit `track-chevron-top`
    // (Drohnenwinkel der Löschdrohne C.2.31) genau eine technische Marke, die Leitstelle D.2.5
    // (2. Oktober 2026) mit `circle-solid-cap-4mm` eine weitere, daher 134.
    expect(reach.notEnumerated.map((axis) => [axis.id, axis.size])).toEqual([
      ['capabilities', 88],
      ['bodyMarks', 134],
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
