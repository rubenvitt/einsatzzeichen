import { describe, expect, it } from 'vitest';
import { RECIPES } from '@einsatzzeichen/conformance';
import * as core from '@einsatzzeichen/core';
import { SpecParseError, checkSpec, encodeSpecParam } from '@einsatzzeichen/core';
import type { SymbolSpec } from '@einsatzzeichen/schema';
import {
  CENTER_LABEL_SIZES,
  LIST_SPEC_FIELDS,
  allowedValues,
  centerLabelSize,
  decodeSpec,
  encodeSpec,
  evaluateSpec,
  issuesByField,
  reduceCenterLabelSize,
  reduceLabel,
  reduceSpec,
} from './builder-state.js';

/**
 * So schrieb der Baukasten seine Links bis LFH-578: base64url über das rohe JSON der Spec, ohne
 * Hülle und ohne jede Prüfung. Solche Links sind geteilt und müssen lesbar bleiben.
 */
function legacyParam(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

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
    // Zwei voneinander unabhängige Systematikregeln: Füllung gegen Organisation, und eine Stärke
    // am Gebäude, das keine taktische Einheit ist.
    const bad: SymbolSpec = {
      kind: 'building',
      strength: 'gruppe',
      organization: 'feuerwehr',
      technicalFill: 'weiss',
    };
    const result = evaluateSpec(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.rule)).toEqual(
        expect.arrayContaining(['technical-fill-organization-conflict', 'strength-requires-unit']),
      );
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

  it('schreibt die kanonische Form aus core', () => {
    const spec: SymbolSpec = { strength: 'gruppe', kind: 'formation' };
    expect(encodeSpec(spec)).toBe(encodeSpecParam(spec));
  });

  it('liest alte Links ohne Hülle weiter', () => {
    expect(decodeSpec(legacyParam({ kind: 'person', organization: 'thw' }))).toEqual({
      kind: 'person',
      organization: 'thw',
    });
  });

  it('wirft einen SpecParseError bei kaputtem Parameter', () => {
    expect(() => decodeSpec('%%%kein-base64%%%')).toThrow(SpecParseError);
  });

  it('wirft, wenn der Parameter keine Spec mit `kind` trägt', () => {
    expect(() => decodeSpec(legacyParam({ designation: 'ohne kind' }))).toThrow(/kind/);
  });

  it('lehnt ein unbekanntes Feld ab, statt es still zu übergehen', () => {
    // Bis LFH-578 rutschte der Tippfehler durch, und das Zeichen stand ohne Organisation da.
    const param = legacyParam({ kind: 'formation', organisation: 'thw' });
    expect(() => decodeSpec(param)).toThrow(SpecParseError);
    try {
      decodeSpec(param);
    } catch (error) {
      expect((error as SpecParseError).path).toBe('$.organisation');
    }
  });
});

describe('allowedValues', () => {
  it('rechnet über das Vokabular aus core und lehnt fremde Kandidaten ab', () => {
    expect(() => allowedValues({ kind: 'formation' }, 'strength', ['verband'])).toThrow(RangeError);
  });

  it('führt die Listenfelder aus core', () => {
    expect(LIST_SPEC_FIELDS).toBe(core.LIST_SPEC_FIELDS);
  });

  it('gibt für eine leere Kandidatenliste eine leere Liste', () => {
    expect(allowedValues({ kind: 'formation' }, 'strength', [])).toEqual([]);
  });

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
    // Geprüft wird `['care', 'fire-fighting']` und nicht der Kandidat allein — beide Marken sind
    // an der Formation vermessen, also kommt der Kandidat ohne Ableitung zurück.
    const spec: SymbolSpec = { kind: 'formation', bodyMarks: ['care'] };
    const [added] = allowedValues(spec, 'bodyMarks', ['fire-fighting']);
    expect(added).toEqual({ value: 'fire-fighting', ok: true, issues: [] });
    expect(evaluateSpec({ ...spec, bodyMarks: ['care', 'fire-fighting'] }).ok).toBe(true);
  });

  it('sperrt einen Wert auch dann, wenn die Komposition abbricht statt eine Regel zu melden', () => {
    // Eine der Lücken, die nach dem 2. Oktober 2026 bleiben: ein Fähigkeitspiktogramm an einem
    // Körper, den die Kopfzone verkleinert, lässt sich auch abgeleitet nicht zeichnen
    // (`derive/head-zone.ts`). `compose()` wirft dafür eine `NotMeasuredError`, keine
    // CompositionError. Gesperrt gehört der Wert trotzdem. Die Kopfzone belegt die technische
    // Kopfmarke: eine Verwaltungsstufe an der Fläche lehnt seit dem Fachreview vom
    // 5. Oktober 2026 eine Regel ab.
    const [entry] = allowedValues({ kind: 'area', technicalHeadMark: 'single-vertical-bar' }, 'capabilities', [
      'meal-preparation',
    ]);
    expect(entry.ok).toBe(false);
    expect(entry.issues).toEqual([]);
    expect(entry.blocked?.because).toBe('not-measured');
    if (entry.blocked?.because === 'not-measured') {
      // Die Rohmeldung bleibt erhalten, wandert aber nach `detail` — der Tooltip baut sich
      // aus den Bezeichnungen, nicht aus dieser Zeile.
      expect(entry.blocked.detail).toMatch(/nicht abgeleitet/);
      // An der Formation mit derselben Kopfmarke lässt sich das Piktogramm zeichnen; der
      // Rat „wähle eine andere Grundzeichenart" ist hier also richtig.
      expect(entry.blocked.scope).toBe('combination');
    }
    expect(
      allowedValues({ kind: 'formation', technicalHeadMark: 'single-vertical-bar' }, 'capabilities', [
        'meal-preparation',
      ])[0]?.ok,
    ).toBe(true);
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
    // Gegenprobe zum Vorigen: hier ist der Abbruch eine echte Aussage über die Referenz — der
    // Giebel über der Fahrwerkszone ist nicht abgeleitet, weil ihre Radplätze absolut vermessen
    // sind (`derive/body-variants.ts`) — und sperrt deshalb, statt zu fliegen. Seit LFH-502 hängt
    // die Unterscheidung an der Klasse und nicht mehr am Wortlaut.
    const [entry] = allowedValues(
      { kind: 'vehicle-land', vehicleCategory: 'kfz-kategorie-1' },
      'bodyVariant',
      ['raised-gable'],
    );
    expect(entry.ok).toBe(false);
    expect(entry.blocked?.because).toBe('not-measured');
  });

  it('gibt die Reichweite einer Lücke unverändert aus der Wurfstelle weiter', () => {
    // `scope` wird nicht erraten: dieselbe Spec über `checkSpec()` gezeichnet nennt dieselbe
    // Reichweite wie die Sperre. Eine feste Lücke (`scope: 'value'`) erreicht der Baukasten seit
    // dem 2. Oktober 2026 nicht mehr — das Amphibienfahrzeug, bis dahin die einzige, wird
    // abgeleitet gezeichnet. Den Fall `'value'` prüfen die Tests der Insel mit gestellten Werten.
    const spec: SymbolSpec = { kind: 'area', technicalHeadMark: 'single-vertical-bar' };
    const [entry] = allowedValues(spec, 'capabilities', ['meal-preparation']);
    const check = checkSpec({ ...spec, capabilities: ['meal-preparation'] });
    expect(check.ok).toBe(false);
    if (!check.ok && check.reason === 'not-measured' && entry.blocked?.because === 'not-measured') {
      expect(entry.blocked.scope).toBe(check.scope);
      expect(entry.blocked.detail).toBe(check.message);
    } else {
      throw new Error('Beide Wege sollten eine Vermessungslücke melden.');
    }
  });

  it('kennzeichnet einen abgeleiteten Wert, ohne ihn zu sperren', () => {
    // Das Amphibienfahrzeug: bis zum 2. Oktober 2026 eine feste Lücke, seitdem aus der
    // Strichhülle konstruiert und deshalb frei, aber abgeleitet.
    const [amphibian] = allowedValues({ kind: 'vehicle-land' }, 'vehicleCategory', [
      'amphibienfahrzeug',
    ]);
    expect(amphibian).toEqual({ value: 'amphibienfahrzeug', ok: true, issues: [], derived: true });
    // Ein vermessener Wert behält genau die Form von vorher — ohne `derived`-Schlüssel.
    const [measured] = allowedValues({ kind: 'formation' }, 'unitGrouping', ['verband-ii']);
    expect(measured).toEqual({ value: 'verband-ii', ok: true, issues: [] });
    expect('derived' in measured!).toBe(false);
  });

  it('sperrt auch die Vermessungslücken des Kompositionsmotors, statt abzustürzen', () => {
    // Der Wächter für Wurfstellen außerhalb des Katalogs, die der Baukasten erreicht. Bis zum
    // 2. Oktober 2026 war das die Organisationsfarbe am offenen Polyzug von `1.13 Ereignis`
    // (heute abgeleitet); seitdem sind es die Ableitungen selbst, die eine Lage nicht finden —
    // hier der Giebel über der Fahrwerkszone aus `derive/body-variants.ts`. Bliebe ein solcher
    // Wurf ein gewöhnliches `Error`, flöge er hier durch und die Insel zeigte statt eines
    // gesperrten Wertes ihren Fehlerblock.
    const [entry] = allowedValues(
      { kind: 'vehicle-land', vehicleCategory: 'kfz-kategorie-1' },
      'bodyVariant',
      ['raised-gable'],
    );
    expect(entry.ok).toBe(false);
    expect(entry.blocked?.because).toBe('not-measured');
    if (entry.blocked?.because === 'not-measured') {
      expect(entry.blocked.scope).toBe('combination');
      expect(entry.blocked.detail).toMatch(/Fahrwerkszone/);
    }
    // Und das frühere Beispiel zeichnet jetzt, abgeleitet.
    const [event] = allowedValues({ kind: 'event' }, 'organization', ['feuerwehr']);
    expect(event).toMatchObject({ ok: true, derived: true });
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
    // Diese Spec meldet zweierlei: `vehicle-category-requires-vehicle` zeigt auf ihr Feld,
    // `head-zone-conflict` (Stärke und Verwaltungsstufe teilen sich die Kopfzone) trägt
    // `field: 'composition'` und benennt keines.
    const spec: SymbolSpec = {
      kind: 'formation',
      strength: 'gruppe',
      administrativeLevel: 'kreis',
      vehicleCategory: 'kfz-kategorie-1',
    };
    const rules = issuesOf(spec).issues.map((issue) => issue.rule);
    expect(rules).toContain('head-zone-conflict');
    const map = issuesByField(issuesOf(spec).issues, spec);
    expect([...map.values()].flat().map((issue) => issue.rule)).not.toContain('head-zone-conflict');
    expect(rulesAt(spec, 'vehicleCategory')).toEqual(['vehicle-category-requires-vehicle']);
  });

  it('lässt ein Feld weg, das die Spec gar nicht gesetzt hat', () => {
    // Seit dem 2. Oktober 2026 zeigt keine Regel an einer Einzelfeld-Kombination mehr auf ein
    // leeres Feld (bis dahin `circle-12-requires-organization` und Verwandte). Die Grenze gilt
    // trotzdem, und geprüft wird sie mit echten Meldungen an einer Spec ohne dieses Feld: ein
    // Hinweis am leeren Auswahlfeld müsste raten, ob die Regel eine Angabe verlangt oder die
    // gesetzte ablehnt — die Erklärung dazu steht in der Regelliste unter der Vorschau.
    const withCategory: SymbolSpec = { kind: 'formation', vehicleCategory: 'kfz-kategorie-1' };
    const { issues } = issuesOf(withCategory);
    expect(issues.map((issue) => issue.field)).toContain('vehicleCategory');
    expect(issuesByField(issues, withCategory).has('vehicleCategory')).toBe(true);
    expect(issuesByField(issues, { kind: 'formation' }).has('vehicleCategory')).toBe(false);
  });

  it('gibt für eine gültige Spec nichts aus', () => {
    const spec: SymbolSpec = { kind: 'formation', strength: 'gruppe' };
    const result = evaluateSpec(spec);
    expect(result.ok).toBe(true);
    expect(issuesByField([], spec).size).toBe(0);
  });
});

describe('reduceLabel', () => {
  const base = { kind: 'circle-12', organization: 'fuehrung-leitung' } as const satisfies SymbolSpec;

  it('setzt Läufe in labels und lässt die Spec sonst unverändert', () => {
    const withCenter = reduceLabel(base, 'center', 'LST');
    const withBoth = reduceLabel(withCenter, 'bottomRight', 'UEL');
    expect(withBoth).toEqual({ ...base, labels: { center: 'LST', bottomRight: 'UEL' } });
    expect(evaluateSpec(withBoth).ok).toBe(true);
  });

  it('entfernt eine geleerte Zone und ohne Zone das ganze Feld', () => {
    const one = reduceLabel(reduceLabel(base, 'center', 'LST'), 'bottomRight', 'UEL');
    expect(reduceLabel(one, 'center', '')).toEqual({ ...base, labels: { bottomRight: 'UEL' } });
    expect(reduceLabel(reduceLabel(one, 'center', ''), 'bottomRight', '')).toEqual(base);
  });

  it('lässt Metriken eines geladenen Rezepts stehen, solange ein Lauf bleibt', () => {
    const recipe = {
      ...base,
      labels: { center: 'LtS', centerCapHeightMm: 7.3 },
    } as unknown as SymbolSpec;
    expect(reduceLabel(recipe, 'bottomRight', 'UEL').labels).toEqual({
      center: 'LtS',
      centerCapHeightMm: 7.3,
      bottomRight: 'UEL',
    });
  });
});

describe('Größe des mittigen Laufs (LFH-992)', () => {
  const d25 = {
    kind: 'circle-12',
    bodyVariant: 'raised-gable',
    organization: 'fuehrung-leitung',
    bodyMarks: ['circle-solid-cap-4mm'],
    labels: { center: 'LtS' },
  } as const satisfies SymbolSpec;

  it('bietet Normal und Groß an; Groß ist die Versalhöhe von D.2.5', () => {
    expect(CENTER_LABEL_SIZES.map(({ id, label }) => [id, label])).toEqual([
      ['normal', 'Normal'],
      ['gross', 'Groß'],
    ]);
    expect(CENTER_LABEL_SIZES[1].capHeightMm).toBe(core.LARGE_CENTER_CAP_HEIGHT_MM);
    expect(core.LARGE_CENTER_CAP_HEIGHT_MM).toBe(7.3);
  });

  it('setzt „Groß“ als Versalhöhe und „Normal“ als keinen Wert', () => {
    const large = reduceCenterLabelSize(d25, 'gross');
    expect(large.labels).toEqual({ center: 'LtS', centerCapHeightMm: 7.3 });
    expect(centerLabelSize(large)).toBe('gross');
    const normal = reduceCenterLabelSize(large, 'normal');
    expect(normal).toEqual(d25);
    expect(centerLabelSize(normal)).toBe('normal');
  });

  it('deckt sich mit „LtS“ und „Groß“ mit der Leitstelle D.2.5', () => {
    const result = evaluateSpec(reduceCenterLabelSize(d25, 'gross'));
    if (!result.ok) throw new Error('Die Leitstelle zeichnet nicht.');
    const original = evaluateSpec({
      ...d25,
      labels: { center: 'LtS', centerCapHeightMm: 7.3, centerBaselineFromBodyBottomMm: 8 },
    });
    if (!original.ok) throw new Error('D.2.5 zeichnet nicht.');
    expect(result.drawing.children).toEqual(original.drawing.children);
    expect(result.drawing.derivations).toBeUndefined();
  });

  it('nennt eine Versalhöhe aus einem geladenen Rezept als eigene Größe', () => {
    expect(centerLabelSize({ kind: 'vehicle-land', labels: { center: 'MastKW', centerCapHeightMm: 4.3826 } }))
      .toBe('recipe');
  });

  it('nimmt die Größe mit dem mittigen Text weg, damit keine Höhe ohne Lauf stehen bleibt', () => {
    const large = reduceCenterLabelSize(reduceLabel(d25, 'bottomRight', 'UEL'), 'gross');
    const cleared = reduceLabel(large, 'center', '');
    expect(cleared.labels).toEqual({ bottomRight: 'UEL' });
    expect(evaluateSpec(cleared).ok).toBe(true);
  });

  it('meldet einen Text, der in „Groß“ zu breit ist, als Regel', () => {
    const result = evaluateSpec(reduceCenterLabelSize({ ...d25, labels: { center: 'Leitstelle' } }, 'gross'));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((issue) => issue.rule)).toContain('label-too-wide');
  });
});
