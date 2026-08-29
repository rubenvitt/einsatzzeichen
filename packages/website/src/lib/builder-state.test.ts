import { describe, expect, it } from 'vitest';
import { RECIPES } from '@einsatzzeichen/catalog';
import type { SymbolSpec } from '@einsatzzeichen/schema';
import {
  allowedValues,
  decodeSpec,
  encodeSpec,
  evaluateSpec,
  reduceSpec,
} from './builder-state.js';

const RECIPE_SPEC: SymbolSpec = Object.values(RECIPES)[0]!.spec;

describe('evaluateSpec', () => {
  it('liefert für eine gültige Spec eine Zeichnung', () => {
    const result = evaluateSpec(RECIPE_SPEC);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.drawing.viewBox).toBeDefined();
      expect(result.drawing.children.length).toBeGreaterThan(0);
    }
  });

  it('erklärt organization + technicalFill, statt zu werfen', () => {
    const bad = reduceSpec({ ...RECIPE_SPEC, organization: 'feuerwehr' }, {
      field: 'technicalFill',
      value: 'weiss',
    });
    const result = evaluateSpec(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const conflict = result.issues.find(
        (issue) => issue.rule === 'technical-fill-organization-conflict',
      );
      expect(conflict).toBeDefined();
      expect(conflict?.title.length).toBeGreaterThan(0);
      expect(conflict?.explanation.length).toBeGreaterThan(40);
      // Die Originalmeldung aus `validate.ts` bleibt erhalten, nicht nur die Erklärung.
      expect(conflict?.message).toContain('Technische Körperfüllung');
      expect(result.unexplained).toEqual([]);
    }
  });

  it('erklärt jede Meldung einer mehrfach ungültigen Spec', () => {
    const bad: SymbolSpec = { ...RECIPE_SPEC, organization: 'feuerwehr', technicalFill: 'weiss' };
    const result = evaluateSpec(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.length).toBeGreaterThan(1);
      for (const issue of result.issues) expect(issue.explanation.length).toBeGreaterThan(40);
    }
  });

  it('reicht Fehler, die keine CompositionError sind, weiter', () => {
    // Eine Grundzeichenart, die der Katalog nicht führt — so kommt sie aus einem von Hand
    // veränderten `?spec=`-Parameter. `baseDrawing` wirft dafür einen gewöhnlichen `Error`,
    // keine `CompositionError`; Spec §7 verlangt dafür den sichtbaren Fehlerblock statt einer
    // Regelliste, also darf `evaluateSpec` ihn nicht in `issues` umdeuten.
    expect(() => evaluateSpec({ kind: 'gibt-es-nicht' } as unknown as SymbolSpec)).toThrow(
      /Kein Grundzeichen/,
    );
  });
});

describe('reduceSpec', () => {
  it('setzt einen Wert, ohne die Vorlage zu verändern', () => {
    const next = reduceSpec({ kind: 'formation' }, { field: 'strength', value: 'gruppe' });
    expect(next).toEqual({ kind: 'formation', strength: 'gruppe' });
  });

  it('entfernt das Feld bei undefined', () => {
    const withStrength: SymbolSpec = { kind: 'formation', strength: 'gruppe' };
    expect('strength' in reduceSpec(withStrength, { field: 'strength', value: undefined })).toBe(
      false,
    );
  });

  it('entfernt das Feld bei leerem Text und leerer Liste', () => {
    const spec: SymbolSpec = { kind: 'formation', designation: 'Zug 1', bodyMarks: ['care'] };
    expect('designation' in reduceSpec(spec, { field: 'designation', value: '' })).toBe(false);
    expect('bodyMarks' in reduceSpec(spec, { field: 'bodyMarks', value: [] })).toBe(false);
  });

  it('lässt die Vorlage unangetastet', () => {
    const spec: SymbolSpec = { kind: 'formation', strength: 'gruppe' };
    reduceSpec(spec, { field: 'strength', value: undefined });
    expect(spec.strength).toBe('gruppe');
  });
});

describe('encodeSpec/decodeSpec', () => {
  it('überlebt Umlaute in der Rundreise', () => {
    const spec: SymbolSpec = { kind: 'formation', designation: 'Löschzug Süß-Ärger' };
    const encoded = encodeSpec(spec);
    expect(encoded).not.toMatch(/[+/=]/);
    expect(decodeSpec(encoded)).toEqual(spec);
  });

  it('nimmt jedes Rezept aus dem Katalog auf', () => {
    for (const recipe of Object.values(RECIPES)) {
      expect(decodeSpec(encodeSpec(recipe.spec))).toEqual(recipe.spec);
    }
  });

  it('wirft mit Klartext bei kaputtem Parameter', () => {
    expect(() => decodeSpec('%%%kein-base64%%%')).toThrow(/spec/i);
  });

  it('wirft, wenn der Parameter keine Spec mit `kind` trägt', () => {
    expect(() => decodeSpec(encodeSpec({ designation: 'ohne kind' } as unknown as SymbolSpec))).toThrow(
      /kind/,
    );
  });
});

describe('allowedValues', () => {
  it('sperrt Werte, die mit der aktuellen Spec nicht zusammengehen, und begründet sie', () => {
    // `technicalFill` und `organization` schließen sich aus — bei gesetzter Organisation darf
    // also kein Füllwert mehr durchkommen.
    const spec: SymbolSpec = { kind: 'formation', organization: 'feuerwehr' };
    const result = allowedValues(spec, 'technicalFill', ['weiss', 'rot']);
    expect(result.map((entry) => entry.ok)).toEqual([false, false]);
    for (const entry of result) {
      expect(entry.issues.map((issue) => issue.rule)).toContain(
        'technical-fill-organization-conflict',
      );
      expect(entry.reason?.length ?? 0).toBeGreaterThan(40);
    }
  });

  it('lässt zusammenpassende Werte offen', () => {
    const result = allowedValues({ kind: 'formation' }, 'strength', ['gruppe', 'zug']);
    expect(result).toEqual([
      { value: 'gruppe', ok: true, issues: [] },
      { value: 'zug', ok: true, issues: [] },
    ]);
  });

  it('hängt bei Listenfeldern an die bestehende Auswahl an, statt sie zu ersetzen', () => {
    // `care` trägt an der Formation; `air-winch-chevron-diamond` ist dort nicht vermessen. Wäre
    // der Kandidat allein geprüft, bliebe `care` unbemerkt — geprüft wird aber `['care', …]`.
    const spec: SymbolSpec = { kind: 'formation', bodyMarks: ['care'] };
    const [added] = allowedValues(spec, 'bodyMarks', ['fire-fighting']);
    expect(added).toEqual({ value: 'fire-fighting', ok: true, issues: [] });
    expect(evaluateSpec({ ...spec, bodyMarks: ['care', 'fire-fighting'] }).ok).toBe(true);
  });

  it('sperrt einen Wert auch dann, wenn die Komposition abbricht statt eine Regel zu melden', () => {
    // Kennung ohne vermessene Fassung an dieser Grundzeichenart: `compose()` wirft einen
    // gewöhnlichen Fehler, keine CompositionError. Gesperrt gehört der Wert trotzdem.
    const [entry] = allowedValues({ kind: 'formation' }, 'bodyMarks', [
      'air-winch-chevron-diamond',
    ]);
    expect(entry.ok).toBe(false);
    expect(entry.issues).toEqual([]);
    expect(entry.reason).toMatch(/keine vermessene Fassung/);
    expect(entry.reason).toMatch(/ist nicht vermessen/);
  });

  it('sperrt nie den Wert, der schon gesetzt ist — auch nicht bei kaputter Spec', () => {
    // Diese Spec trägt zwei voneinander unabhängige Probleme; geprüft wird ein drittes Feld.
    const broken: SymbolSpec = {
      kind: 'formation',
      organization: 'feuerwehr',
      technicalFill: 'weiss',
      strength: 'gruppe',
    };
    expect(evaluateSpec(broken).ok).toBe(false);
    const [selected] = allowedValues(broken, 'strength', ['gruppe']);
    expect(selected).toEqual({ value: 'gruppe', ok: true, issues: [] });
    // Der bereits gesetzte Listenwert ebenso.
    const withMark: SymbolSpec = { ...broken, bodyMarks: ['care'] };
    expect(allowedValues(withMark, 'bodyMarks', ['care'])[0]?.ok).toBe(true);
  });
});
