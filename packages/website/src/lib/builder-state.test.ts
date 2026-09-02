import { describe, expect, it } from 'vitest';
import { RECIPES } from '@einsatzzeichen/catalog';
import type { SymbolSpec } from '@einsatzzeichen/schema';
import {
  allowedValues,
  decodeSpec,
  encodeSpec,
  evaluateSpec,
  issuesByField,
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
      expect(entry.blocked?.because).toBe('rule');
      if (entry.blocked?.because === 'rule') {
        expect(entry.blocked.explanation.length).toBeGreaterThan(40);
      }
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
    expect(entry.blocked?.because).toBe('not-measured');
    if (entry.blocked?.because === 'not-measured') {
      // Die Rohmeldung bleibt erhalten, wandert aber nach `detail` — der Tooltip baut sich
      // aus den Bezeichnungen, nicht aus dieser Zeile.
      expect(entry.blocked.detail).toMatch(/ist nicht vermessen/);
      // An einer anderen Grundzeichenart ist dieselbe Marke vermessen; der Rat „wähle eine
      // andere Grundzeichenart" ist hier also richtig.
      expect(entry.blocked.scope).toBe('combination');
    }
  });

  it('reicht einen Programmfehler weiter, statt ihn als Vermessungslücke auszugeben', () => {
    // Eine Zahl in `designation` — so kommt sie aus einer von Hand veränderten Adresszeile.
    // `compose()` wirft dafür einen `TypeError` („spec.designation.trim is not a function"),
    // und der ist kein Befund über die Referenz. Würde er gefangen, käme **jeder** Kandidat in
    // **jedem** Feld als „nicht vermessen" zurück und behauptete eine Datenlücke, die es nicht
    // gibt.
    const broken = { kind: 'formation', designation: 123 } as unknown as SymbolSpec;
    expect(() => evaluateSpec(broken)).toThrow(TypeError);
    expect(() => allowedValues(broken, 'strength', ['gruppe'])).toThrow(TypeError);
  });

  it('sperrt nur bei einer NotMeasuredError', () => {
    // Gegenprobe zum Vorigen an derselben Achse: hier ist der Abbruch eine echte Aussage über
    // die Referenz — der Katalog wirft `NotMeasuredError` — und sperrt deshalb, statt zu fliegen.
    // Seit LFH-502 hängt die Unterscheidung an der Klasse und nicht mehr am Wortlaut.
    const [entry] = allowedValues({ kind: 'formation' }, 'bodyMarks', ['hospital']);
    expect(entry.ok).toBe(false);
    expect(entry.blocked?.because).toBe('not-measured');
  });

  it('unterscheidet die feste Lücke von der Lücke dieser Zusammenstellung', () => {
    // `amphibienfahrzeug` ist die einzige Kategorie ohne vollständig vermessene Fahrwerkszone,
    // und die Lücke hängt an keiner Grundzeichenart: `scope: 'value'`. Der Baukasten darf hier
    // nicht auf eine andere Grundzeichenart verweisen — das wäre eine erfundene Aussage über die
    // Referenz.
    const [fixed] = allowedValues({ kind: 'vehicle-land' }, 'vehicleCategory', [
      'amphibienfahrzeug',
    ]);
    expect(fixed.blocked?.because).toBe('not-measured');
    if (fixed.blocked?.because === 'not-measured') expect(fixed.blocked.scope).toBe('value');
  });

  it('sperrt auch die Vermessungslücken des Kompositionsmotors, statt abzustürzen', () => {
    // Der Wächter für die eine Wurfstelle außerhalb des Katalogs, die der Baukasten erreicht:
    // eine Organisationsfarbe am offenen Polyzug von `1.13 Ereignis` (compose.ts). Bliebe sie ein
    // gewöhnliches `Error`, flöge sie hier durch und die Insel zeigte statt eines gesperrten
    // Wertes ihren Fehlerblock — eine stille Verschlechterung gegenüber dem Wortlaut-Behelf, den
    // LFH-502 abgelöst hat.
    const [entry] = allowedValues({ kind: 'event' }, 'organization', ['feuerwehr']);
    expect(entry.ok).toBe(false);
    expect(entry.blocked?.because).toBe('not-measured');
    if (entry.blocked?.because === 'not-measured') {
      expect(entry.blocked.scope).toBe('combination');
      expect(entry.blocked.detail).toMatch(/offener/);
    }
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

describe('issuesByField', () => {
  /** Nur ungültige Specs kommen hier vor; eine gültige hätte nichts zuzuordnen. */
  function issuesOf(spec: SymbolSpec) {
    const result = evaluateSpec(spec);
    if (result.ok) throw new Error('Diese Spec sollte für den Test ungültig sein.');
    return result;
  }

  function rulesAt(spec: SymbolSpec, field: keyof SymbolSpec): string[] {
    const map = issuesByField(issuesOf(spec).issues, spec);
    return (map.get(field) ?? []).map((issue) => issue.rule);
  }

  it('hängt beide Meldungen zur technischen Füllung an dieses eine Feld', () => {
    // Beide Regeln zeigen auf `technicalFill`, obwohl die zweite `organization` gegen sie
    // stellt: `rule-explanations.ts` ordnet dem Feld zu, das die Leserin ändern müsste.
    // `'water'` ist absichtlich kein `ColorToken` — nur so meldet `validateSpec` beide Regeln
    // zugleich. Der Cast ist das Idiom des Bestands für eine bewusst ungültige Spec
    // (`compose.test.ts`, `validate.test.ts`); eine gültige Farbe träfe nur die zweite Regel.
    const spec = {
      kind: 'formation',
      organization: 'feuerwehr',
      technicalFill: 'water',
    } as unknown as SymbolSpec;
    expect(rulesAt(spec, 'technicalFill')).toEqual([
      'technical-fill-token-invalid',
      'technical-fill-organization-conflict',
    ]);
    // Und ausdrücklich nicht an der anderen Seite des Konflikts — das ist die bekannte Grenze.
    expect(issuesByField(issuesOf(spec).issues, spec).has('organization')).toBe(false);
  });

  it('hängt die Fahrzeugkategorie an ihr Feld', () => {
    // Eine gültige Kategorie: die Regel greift an `kind: 'formation'`, das keine Fahrwerkszone
    // trägt — nicht an der Kategorie selbst.
    const spec: SymbolSpec = {
      kind: 'formation',
      strength: 'zug',
      vehicleCategory: 'kfz-kategorie-1',
    };
    expect(rulesAt(spec, 'vehicleCategory')).toEqual(['vehicle-category-requires-vehicle']);
  });

  it('hängt die zu breite Beschriftung an die Beschriftung', () => {
    const spec: SymbolSpec = { kind: 'formation', designation: 'Sehr lange Beschriftung ohne Ende' };
    expect(rulesAt(spec, 'designation')).toEqual(['designation-too-wide']);
  });

  it('lässt eine Regel ohne einzelnes Feld weg', () => {
    // Diese Spec meldet zweierlei: `administrative-level-not-measured` zeigt auf ihr Feld,
    // `head-zone-conflict` trägt `field: 'composition'` und benennt keines.
    const spec: SymbolSpec = { kind: 'formation', strength: 'gruppe', administrativeLevel: 'kreis' };
    const rules = issuesOf(spec).issues.map((issue) => issue.rule);
    expect(rules).toContain('head-zone-conflict');
    const map = issuesByField(issuesOf(spec).issues, spec);
    expect([...map.values()].flat().map((issue) => issue.rule)).not.toContain('head-zone-conflict');
    expect(rulesAt(spec, 'administrativeLevel')).toEqual(['administrative-level-not-measured']);
  });

  it('lässt ein Feld weg, das die Spec gar nicht gesetzt hat', () => {
    // `circle-12-requires-organization` zeigt auf `organization`, und genau die fehlt. Ein
    // Hinweis am leeren Auswahlfeld müsste raten, ob die Regel eine Angabe verlangt oder die
    // gesetzte ablehnt — die Erklärung dazu steht in der Regelliste unter der Vorschau.
    const spec: SymbolSpec = { kind: 'circle-12', bodyVariant: 'foot-band' };
    const rules = issuesOf(spec).issues.map((issue) => issue.rule);
    expect(rules).toContain('circle-12-requires-organization');
    expect(issuesByField(issuesOf(spec).issues, spec).has('organization')).toBe(false);
  });

  it('gibt für eine gültige Spec nichts aus', () => {
    const spec: SymbolSpec = { kind: 'formation', strength: 'gruppe' };
    const result = evaluateSpec(spec);
    expect(result.ok).toBe(true);
    expect(issuesByField([], spec).size).toBe(0);
  });
});
