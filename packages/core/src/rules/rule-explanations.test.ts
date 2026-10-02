import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { CompositionError } from '../validate.js';
import { FREESTANDING_RULE_IDS } from '../freestanding-rules.js';
import { VALIDATION_RULE_IDS } from '../validation-rules.js';
import {
  COMPOSITION_RULE_CATALOG,
  FREESTANDING_RULE_CATALOG,
  RULE_CATALOG,
  ruleCatalogEntry,
} from './rule-catalog.js';
import {
  COMPOSITION_RULE_EXPLANATIONS,
  FREESTANDING_RULE_EXPLANATIONS,
  RULE_EXPLANATIONS,
  RULE_FIELDS,
  explainIssue,
  explainRejection,
} from './rule-explanations.js';

/** Sätze zählen: Punkt, Frage- oder Ausrufezeichen gefolgt von Leerraum. */
function sentenceCount(text: string): number {
  return text.trim().split(/(?<=[.!?])\s+/).length;
}

const COMPOSITION_RULE_IDS = COMPOSITION_RULE_CATALOG.map((entry) => entry.id);

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
   * Der Grund, warum es diese Zuordnung überhaupt gibt: die Symbolseite der Website listet Regeln
   * je gesetztem Feld, und `labels` ist in 137 der 256 Zeichen gesetzt. Die alte Zuordnung über
   * das Präfix der Kennung fand dafür null Regeln — während vier Dutzend Zonenregeln genau dieses
   * Feld prüfen. Ein Feld, das kein einziges Zeichen setzt, darf leer bleiben; `labels` und
   * `functionRole` dürfen es nicht.
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

  it('führt nur Regeln, die der Katalog als Prüfregel einordnet', () => {
    for (const id of Object.keys(RULE_EXPLANATIONS)) {
      expect(ruleCatalogEntry(id)?.phase, id).toBe('spec');
    }
  });
});

describe('COMPOSITION_RULE_EXPLANATIONS', () => {
  it('erklärt genau die Kompositionsregeln des Katalogs', () => {
    expect(Object.keys(COMPOSITION_RULE_EXPLANATIONS).sort()).toEqual(
      [...COMPOSITION_RULE_IDS].sort(),
    );
  });

  it('führt nur Regeln, die der Katalog als Kompositionsregel einordnet', () => {
    for (const id of Object.keys(COMPOSITION_RULE_EXPLANATIONS)) {
      expect(ruleCatalogEntry(id)?.phase, id).toBe('composition');
    }
  });

  it('ordnet jede Kompositionsregel einem gültigen Feld zu', () => {
    for (const id of Object.keys(COMPOSITION_RULE_EXPLANATIONS)) {
      expect(RULE_FIELDS, id).toContain(COMPOSITION_RULE_EXPLANATIONS[id].field);
    }
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

describe('FREESTANDING_RULE_EXPLANATIONS', () => {
  it('erklärt genau die Regeln der freistehenden Zeichen', () => {
    expect(Object.keys(FREESTANDING_RULE_EXPLANATIONS).sort()).toEqual([...FREESTANDING_RULE_IDS].sort());
  });

  it('führt zu jeder Regel ein Feld der freistehenden Spec, einen Titel und zwei bis vier Sätze', () => {
    for (const id of FREESTANDING_RULE_IDS) {
      const entry = FREESTANDING_RULE_EXPLANATIONS[id];
      expect(RULE_FIELDS, id).toContain(entry.field);
      expect(['strength', 'variant', 'values', 'intensity'], id).toContain(entry.field);
      expect(entry.title.trim(), id).not.toBe('');
      expect(entry.explanation.length, id).toBeGreaterThan(40);
      expect(entry.explanation, id).not.toMatch(/TODO|TBD/);
      expect(sentenceCount(entry.explanation), id).toBeGreaterThanOrEqual(2);
      expect(sentenceCount(entry.explanation), id).toBeLessThanOrEqual(4);
    }
  });

  it('überschneidet sich mit keiner anderen Tabelle', () => {
    const others = new Set([...Object.keys(RULE_EXPLANATIONS), ...Object.keys(COMPOSITION_RULE_EXPLANATIONS)]);
    expect(Object.keys(FREESTANDING_RULE_EXPLANATIONS).filter((id) => others.has(id))).toEqual([]);
  });
});

describe('explainIssue', () => {
  it('ergänzt Meldung um Klartext und Katalogdaten der Regel', () => {
    const id = 'strength-requires-unit';
    const catalog = ruleCatalogEntry(id);
    expect(explainIssue({ rule: id, message: 'y' })).toEqual({
      rule: id,
      message: 'y',
      field: RULE_EXPLANATIONS[id].field,
      title: RULE_EXPLANATIONS[id].title,
      explanation: RULE_EXPLANATIONS[id].explanation,
      kind: catalog?.kind,
      dimension: catalog?.dimension,
      phase: 'spec',
      reason: catalog?.reason,
      source: catalog?.source,
    });
  });

  it('erklärt auch Kompositionsregeln, mit Phase aus dem Katalog', () => {
    const explained = explainIssue({ rule: 'label-too-wide', message: 'z' });
    expect(explained).toMatchObject({
      rule: 'label-too-wide',
      message: 'z',
      field: 'labels',
      phase: 'composition',
      dimension: 'label',
    });
  });

  it('reicht konkrete Werte in der Meldung unverändert durch', () => {
    const id = VALIDATION_RULE_IDS[0];
    const message = 'Breite 14.5 mm überschreitet 14.327 mm';
    expect(explainIssue({ rule: id, message })).toMatchObject({ rule: id, message });
  });

  it('wirft bei einer unbekannten Regel-ID statt eine Erklärung zu erfinden', () => {
    expect(() => explainIssue({ rule: 'gibt-es-nicht', message: 'z' })).toThrow(/gibt-es-nicht/);
  });

  it('erklärt eine Regel der freistehenden Zeichen mit ihrer Dimension', () => {
    expect(explainIssue({ rule: 'weather-values-exceed-limit', message: 'w' })).toMatchObject({
      rule: 'weather-values-exceed-limit',
      message: 'w',
      field: 'values',
      phase: 'spec',
      dimension: 'weather',
      kind: 'systematik',
    });
  });

  it('erklärt jeden Katalogeintrag vollständig — kein halber Verbund', () => {
    for (const entry of [...RULE_CATALOG, ...COMPOSITION_RULE_CATALOG, ...FREESTANDING_RULE_CATALOG]) {
      const explained = explainIssue({ rule: entry.id, message: 'm' });
      expect(explained.title.trim(), entry.id).not.toBe('');
      expect(explained.phase, entry.id).toBe(entry.phase);
      expect(explained.dimension, entry.id).toBe(entry.dimension);
      expect(explained.reason, entry.id).toBe(entry.reason);
    }
  });
});

describe('explainRejection', () => {
  it('erklärt jede Meldung einer CompositionError in ihrer Reihenfolge', () => {
    const error = new CompositionError([
      { rule: 'strength-requires-unit', message: 'a' },
      { rule: 'label-too-wide', message: 'b' },
    ]);
    const explained = explainRejection(error);
    expect(explained.map((issue) => [issue.rule, issue.message])).toEqual([
      ['strength-requires-unit', 'a'],
      ['label-too-wide', 'b'],
    ]);
    expect(explained[0]).toEqual(explainIssue(error.issues[0]));
  });

  it('wirft, sobald eine Meldung keine Erklärung hat', () => {
    const error = new CompositionError([
      { rule: 'strength-requires-unit', message: 'a' },
      { rule: 'gibt-es-nicht', message: 'b' },
    ]);
    expect(() => explainRejection(error)).toThrow(/gibt-es-nicht/);
  });
});

/**
 * Entscheidung vom 21. September 2026 zu LFH-563, Option 2 aus
 * `docs/decisions/2026-09-20-regelkatalog-als-daten.md` §8, seit LFH-579 im Kern: 28 Einträge
 * des Regelkatalogs tragen `reasonSource: 'website'`. Ihr Begründungssatz ist aus der Erklärung
 * in `rule-explanations.ts` von Hand gezogen, denn an der Prüfstelle selbst steht nur der
 * Prüfausdruck in Worten. Bis LFH-579 lagen die Erklärungen in der Website, und das Gate musste
 * dort stehen; seit sie im Kern liegen, steht es neben beiden Hälften.
 *
 * **Warum ein Fingerabdruck und kein Textvergleich.** Der Kernsatz ist eine Verdichtung der
 * Erklärung, kein Ausschnitt daraus; ein `toContain` fände ihn nicht. Festgenagelt wird deshalb
 * die Erklärung selbst. Wird sie umgeschrieben, bricht dieser Test — nicht weil die neue Fassung
 * falsch wäre, sondern damit jemand nachsieht, ob `reason` im Katalog noch stimmt, und den
 * Fingerabdruck danach bewusst nachzieht. Die Abdrücke sind unverändert aus der Website
 * übernommen; für diese 28 Erklärungen belegen sie also auch, dass der Umzug sie nicht verändert
 * hat.
 */
describe('Begründungen, die der Katalog aus den Erklärungen bezieht', () => {
  const PINNED_EXPLANATIONS: readonly (readonly [string, string])[] = [
    ['above-left-metrics-complete', '90f03cde7bf2'],
    ['above-left-metrics-within-viewbox', '1a50a4f3eb61'],
    ['bottom-right-metrics-complete', '3f970828a7ac'],
    ['bottom-right-metrics-within-body', '9faa66659f42'],
    ['center-baseline-positive', '3d67d4f5ab20'],
    ['center-baseline-requires-center-label', '48f16a6d83c3'],
    ['center-box-margin-non-negative', '3df29823b3a3'],
    ['center-box-margin-requires-center-label', 'fd69e63462b2'],
    ['center-box-margin-within-body', '245991387834'],
    ['center-label-within-body', 'b8f58a6cf86b'],
    ['function-role-head-mismatch', '4f28bb497dd3'],
    ['function-role-label-metrics-required', '1115bcee6938'],
    ['function-role-organization-mismatch', 'c83dbbf8c4fc'],
    ['function-role-run-too-wide', 'c8889df6b529'],
    ['technical-fill-token-invalid', 'd7fc65090809'],
    ['technical-head-mark-not-measured', '8734409f68a9'],
    ['top-left-anchor-within-body', '4c4cd1a7e212'],
    ['top-left-cap-height-positive', '8432d0f77f5a'],
    ['top-left-lines-exactly-two', 'df4f7cabac3f'],
  ];

  function fingerprint(text: string): string {
    return createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 12);
  }

  it('deckt genau die Einträge ab, die der Katalog als so begründet führt', () => {
    const fromCatalog = [...RULE_CATALOG, ...COMPOSITION_RULE_CATALOG]
      .filter((entry) => entry.reasonSource === 'website')
      .map((entry) => entry.id)
      .sort();
    expect(PINNED_EXPLANATIONS.map(([id]) => id)).toEqual(fromCatalog);
  });

  it('trägt zu jeder dieser Regeln einen Kernsatz, der nicht leer ist', () => {
    for (const [id] of PINNED_EXPLANATIONS) {
      expect(ruleCatalogEntry(id)?.reason ?? '', `${id}: Kernsatz fehlt`).not.toBe('');
    }
  });

  it('hält die Erklärung fest, aus der der Kernsatz stammt', () => {
    for (const [id, pinned] of PINNED_EXPLANATIONS) {
      const explanation = (RULE_EXPLANATIONS[id] ?? COMPOSITION_RULE_EXPLANATIONS[id])
        ?.explanation;
      expect(explanation, `${id}: keine Erklärung`).toBeDefined();
      expect(
        fingerprint(explanation as string),
        `${id}: Erklärung geändert. Prüfe, ob "reason" im Regelkatalog (rule-catalog.ts) noch ` +
          'stimmt, und trage den neuen Fingerabdruck danach hier ein.',
      ).toBe(pinned);
    }
  });
});
