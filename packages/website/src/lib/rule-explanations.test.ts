import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  COMPOSITION_RULE_CATALOG,
  CompositionError,
  RULE_CATALOG,
  VALIDATION_RULE_IDS,
} from '@einsatzzeichen/core';
import { composeFromCatalog } from '@einsatzzeichen/conformance/src/recipes.js';
import type { SymbolSpec } from '@einsatzzeichen/schema';
import {
  COMPOSITION_RULE_EXPLANATIONS,
  RULE_EXPLANATIONS,
  RULE_FIELDS,
  explainIssue,
} from './rule-explanations.js';

/** Sätze zählen: Punkt, Frage- oder Ausrufezeichen gefolgt von Leerraum. */
function sentenceCount(text: string): number {
  return text.trim().split(/(?<=[.!?])\s+/).length;
}

describe('RULE_EXPLANATIONS', () => {
  it('erklärt jede Regel-ID und keine erfundene', () => {
    expect(Object.keys(RULE_EXPLANATIONS).sort()).toEqual([...VALIDATION_RULE_IDS].sort());
    for (const id of VALIDATION_RULE_IDS) {
      expect(RULE_EXPLANATIONS[id].explanation.length).toBeGreaterThan(40);
      expect(RULE_EXPLANATIONS[id].explanation).not.toMatch(/TODO|TBD/);
    }
  });

  it('ordnet jede Regel einem gültigen Feld zu', () => {
    for (const id of VALIDATION_RULE_IDS) {
      expect(RULE_FIELDS, id).toContain(RULE_EXPLANATIONS[id].field);
    }
  });

  /**
   * Der Grund, warum es diese Zuordnung überhaupt gibt: die Symbolseite listet Regeln je gesetztem
   * Feld, und `labels` ist in 137 der 256 Zeichen gesetzt. Die alte Zuordnung über das Präfix der
   * Kennung fand dafür null Regeln — die Spalte sagte „keine Regelfamilie unter diesem Namen“,
   * während vier Dutzend Zonenregeln genau dieses Feld prüfen. Ein Feld, das kein einziges Zeichen
   * setzt, darf leer bleiben; `labels` und `functionRole` dürfen es nicht.
   */
  it('lässt die stark belegten Felder nicht ohne Regeln', () => {
    const perField = new Map<string, number>();
    for (const id of VALIDATION_RULE_IDS) {
      const field = RULE_EXPLANATIONS[id].field;
      perField.set(field, (perField.get(field) ?? 0) + 1);
    }
    expect(perField.get('labels') ?? 0).toBeGreaterThanOrEqual(20);
    expect(perField.get('functionRole') ?? 0).toBeGreaterThanOrEqual(5);
    expect(perField.get('bodyVariant') ?? 0).toBeGreaterThanOrEqual(2);
  });

  it('führt zu jeder Regel einen Titel und zwei bis vier Sätze', () => {
    for (const id of VALIDATION_RULE_IDS) {
      const entry = RULE_EXPLANATIONS[id];
      expect(entry.title.trim(), id).not.toBe('');
      expect(sentenceCount(entry.explanation), id).toBeGreaterThanOrEqual(2);
      expect(sentenceCount(entry.explanation), id).toBeLessThanOrEqual(4);
    }
  });
});

describe('explainIssue', () => {
  it('gibt die Originalmeldung mit', () => {
    const id = VALIDATION_RULE_IDS[0];
    expect(explainIssue({ rule: id, message: 'x' })).toMatchObject({ rule: id, message: 'x' });
  });

  it('ergänzt Titel und Erklärung der Regel', () => {
    const id = 'strength-requires-unit';
    expect(explainIssue({ rule: id, message: 'y' })).toEqual({
      rule: id,
      message: 'y',
      field: RULE_EXPLANATIONS[id].field,
      title: RULE_EXPLANATIONS[id].title,
      explanation: RULE_EXPLANATIONS[id].explanation,
    });
  });

  it('wirft bei einer unbekannten Regel-ID statt eine Erklärung zu erfinden', () => {
    expect(() => explainIssue({ rule: 'gibt-es-nicht', message: 'z' }))
      .toThrow(/gibt-es-nicht/);
  });

  it('reicht konkrete Werte in der Meldung unverändert durch', () => {
    const id = VALIDATION_RULE_IDS[0];
    const message = 'Breite 14.5 mm überschreitet 14.327 mm';
    expect(explainIssue({ rule: id, message })).toMatchObject({ rule: id, message });
  });
});

/**
 * Die sechs Kennungen, die `assertTextRunsFit()` in `packages/core/src/compose.ts` bildet: drei
 * Präfixe × zwei Endungen. Aufgezählt, weil `core` sie nicht exportiert — gegengeprüft werden sie
 * unten über den echten Kompositionsweg, nicht gegen diese Liste.
 */
const COMPOSITION_RULE_IDS = ['designation', 'label', 'function-role-run'].flatMap((prefix) => [
  `${prefix}-too-wide`,
  `${prefix}-unknown-glyph`,
]);

/** Wirft die Komposition und gibt die Meldungen zurück; alles andere ist ein Testfehler. */
function issuesOf(spec: SymbolSpec) {
  try {
    composeFromCatalog(spec);
  } catch (error) {
    if (error instanceof CompositionError) return error.issues;
    throw error;
  }
  throw new Error(`Diese Spec komponierte, statt abzulehnen: ${JSON.stringify(spec)}`);
}

describe('COMPOSITION_RULE_EXPLANATIONS', () => {
  it('ordnet jede Kompositionsregel einem gültigen Feld zu', () => {
    for (const id of Object.keys(COMPOSITION_RULE_EXPLANATIONS)) {
      expect(RULE_FIELDS, id).toContain(COMPOSITION_RULE_EXPLANATIONS[id].field);
    }
  });


  it('erklärt genau die sechs Kennungen aus assertTextRunsFit', () => {
    expect(Object.keys(COMPOSITION_RULE_EXPLANATIONS).sort()).toEqual(
      [...COMPOSITION_RULE_IDS].sort(),
    );
  });

  it('führt zu jeder Regel einen Titel und zwei bis vier Sätze', () => {
    for (const id of COMPOSITION_RULE_IDS) {
      const entry = COMPOSITION_RULE_EXPLANATIONS[id];
      expect(entry.title.trim(), id).not.toBe('');
      expect(entry.explanation.length, id).toBeGreaterThan(40);
      expect(entry.explanation, id).not.toMatch(/TODO|TBD/);
      expect(sentenceCount(entry.explanation), id).toBeGreaterThanOrEqual(2);
      expect(sentenceCount(entry.explanation), id).toBeLessThanOrEqual(4);
    }
  });

  it('überschneidet sich nicht mit der Prüftabelle', () => {
    // Sonst antworteten zwei Einträge auf dieselbe Kennung, und die Reihenfolge in
    // `explainIssue` träfe stillschweigend eine Entscheidung.
    const validation = new Set(Object.keys(RULE_EXPLANATIONS));
    expect(Object.keys(COMPOSITION_RULE_EXPLANATIONS).filter((id) => validation.has(id))).toEqual(
      [],
    );
  });
});

/**
 * Der eigentliche Gattertest: nicht die Tabelle gegen die eigene Liste, sondern gegen die
 * Kennung, die `compose()` wirklich wirft. Benennt der Kern ein Präfix um, fällt das hier auf.
 *
 * Vier der sechs Kennungen sind so erreichbar. `function-role-run-too-wide` und
 * `function-role-run-unknown-glyph` sind es nicht: die Läufe stammen aus `layout.roleRuns` und
 * `layout.carrierRun` der vermessenen Funktionsfassung, also aus Katalogdaten, die die
 * Katalogtests bereits gegen dasselbe Gate halten. Ein Fall dafür ließe sich nur konstruieren,
 * indem der Test eine kaputte Fassung erfindet — das belegte dann die Erfindung, nicht den Kern.
 */
describe('Kompositionsregeln über den echten Weg', () => {
  const cases: [string, SymbolSpec, string][] = [
    ['zu breite Fußzone', { kind: 'formation', designation: 'x'.repeat(40) }, 'designation-too-wide'],
    ['Fußzone ohne Vorschub', { kind: 'formation', designation: '🚒' }, 'designation-unknown-glyph'],
    [
      'zu breiter Beschriftungslauf',
      { kind: 'formation', labels: { center: 'x'.repeat(40) } },
      'label-too-wide',
    ],
    [
      'Beschriftungslauf ohne Vorschub',
      { kind: 'formation', labels: { center: '🚒' } },
      'label-unknown-glyph',
    ],
  ];

  for (const [name, spec, expectedRule] of cases) {
    it(`${name} wirft ${expectedRule} und wird erklärt`, () => {
      const issues = issuesOf(spec);
      expect(issues.map((issue) => issue.rule)).toContain(expectedRule);
      for (const issue of issues) {
        const explained = explainIssue(issue);
        expect(explained.title.trim(), issue.rule).not.toBe('');
        expect(explained.explanation.length, issue.rule).toBeGreaterThan(40);
        expect(explained.message, issue.rule).toBe(issue.message);
      }
    });
  }
});

/**
 * Entscheidung vom 21. September 2026 zu LFH-563, Option 2 aus
 * `docs/decisions/2026-09-20-regelkatalog-als-daten.md` §8: **Der Kern besitzt die Begründung,
 * die Website den Klartext.**
 *
 * Der Anlass: 28 Einträge des Regelkatalogs tragen `reasonSource: 'website'`. Ihr Begründungssatz
 * ist aus der Erklärung dieser Datei von Hand gezogen, denn der Kern selbst wiederholt an diesen
 * Prüfstellen nur den Prüfausdruck in Worten. Ein Gate dafür kann nicht in `core` stehen —
 * `core` darf `website` nicht importieren. Hier läuft die Richtung `website → core`, und die ist
 * erlaubt (`@einsatzzeichen/core` steht in den Abhängigkeiten dieses Pakets, und dieselbe Datei
 * importiert `VALIDATION_RULE_IDS` schon).
 *
 * **Warum ein Fingerabdruck und kein Textvergleich.** Der Kernsatz ist eine Verdichtung der
 * Erklärung, kein Ausschnitt daraus; ein `toContain` fände ihn nicht. Festgenagelt wird deshalb
 * die Erklärung selbst. Wird sie umgeschrieben, bricht dieser Test — nicht weil die neue Fassung
 * falsch wäre, sondern damit jemand nachsieht, ob der Satz im Kern noch stimmt, und den
 * Fingerabdruck danach bewusst nachzieht. Genau dieses Nachsehen fehlte bisher.
 *
 * Die Liste schrumpft, sobald eine Begründung in den Kern wandert und der Eintrag dort auf
 * `reasonSource: 'core'` wechselt.
 */
describe('Begründungen, die der Kern aus dieser Datei bezieht', () => {
  const PINNED_EXPLANATIONS: readonly (readonly [string, string])[] = [
    ['above-left-metrics-complete', '90f03cde7bf2'],
    ['above-left-metrics-within-viewbox', 'f28eb0f932fe'],
    ['bottom-right-metrics-complete', '3f970828a7ac'],
    ['bottom-right-metrics-require-measured-body', '14897ad3dc2c'],
    ['bottom-right-metrics-within-body', '3f3166d30535'],
    ['center-anchor-override-requires-measured-trailer', '3b52c89707e8'],
    ['center-baseline-not-measured', '088776742708'],
    ['center-baseline-override-requires-measured-body', '9ccb785a44b3'],
    ['center-baseline-positive', '3d67d4f5ab20'],
    ['center-baseline-requires-center-label', '48f16a6d83c3'],
    ['center-box-margin-non-negative', '3df29823b3a3'],
    ['center-box-margin-override-requires-measured-body', 'ab673f2d2ecf'],
    ['center-box-margin-requires-center-label', 'fd69e63462b2'],
    ['center-box-margin-within-body', '77573c500fae'],
    ['center-label-within-body', '5856a1a3c172'],
    ['function-role-body-mark-mismatch', '86fc897d91d7'],
    ['function-role-head-mismatch', 'b893c10d0256'],
    ['function-role-label-metrics-required', '1115bcee6938'],
    ['function-role-organization-mismatch', '5e19981ea945'],
    ['function-role-run-too-wide', 'c8889df6b529'],
    ['surface-label-requires-measured-body', 'a52cc0d2579f'],
    ['surface-left-label-requires-measured-anchor', '854e4d9cc6f9'],
    ['surface-right-label-requires-measured-anchor', '7cc18ec84924'],
    ['technical-fill-token-invalid', 'd7fc65090809'],
    ['technical-head-mark-not-measured', '8734409f68a9'],
    ['top-left-anchor-within-body', '4c4cd1a7e212'],
    ['top-left-cap-height-positive', '8432d0f77f5a'],
    ['top-left-lines-exactly-two', 'df4f7cabac3f'],
  ];

  function explanationOf(id: string): string | undefined {
    const spec = (RULE_EXPLANATIONS as Record<string, { explanation: string } | undefined>)[id];
    const composed = (
      COMPOSITION_RULE_EXPLANATIONS as Record<string, { explanation: string } | undefined>
    )[id];
    return (spec ?? composed)?.explanation;
  }

  function fingerprint(text: string): string {
    return createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 12);
  }

  it('deckt genau die Einträge ab, die der Katalog als hier begründet führt', () => {
    const fromCatalog = [...RULE_CATALOG, ...COMPOSITION_RULE_CATALOG]
      .filter((entry) => entry.reasonSource === 'website')
      .map((entry) => entry.id)
      .sort();
    expect(PINNED_EXPLANATIONS.map(([id]) => id)).toEqual(fromCatalog);
  });

  it('trägt zu jeder dieser Regeln einen Kernsatz, der nicht leer ist', () => {
    for (const [id] of PINNED_EXPLANATIONS) {
      const entry = [...RULE_CATALOG, ...COMPOSITION_RULE_CATALOG].find((e) => e.id === id);
      expect(entry, `${id}: kein Katalogeintrag`).toBeDefined();
      expect(entry?.reason ?? '', `${id}: Kernsatz fehlt`).not.toBe('');
    }
  });

  it('hält die Erklärung fest, aus der der Kernsatz stammt', () => {
    for (const [id, pinned] of PINNED_EXPLANATIONS) {
      const explanation = explanationOf(id);
      expect(explanation, `${id}: keine Erklärung in dieser Datei`).toBeDefined();
      expect(
        fingerprint(explanation as string),
        `${id}: Erklärung geändert. Prüfe, ob "reason" im Regelkatalog (packages/core/src/` +
          'rules/rule-catalog.ts) noch stimmt, und trage den neuen Fingerabdruck danach hier ein.',
      ).toBe(pinned);
    }
  });
});
