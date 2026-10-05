/**
 * Vokabular je Stand der Spec und die erklärbare Ablehnung einer ganzen Spec (LFH-578).
 *
 * Die Beispiele stützen sich bevorzugt auf Regeln (`validate.ts`), weil die sich nicht unter den
 * Tests wegbewegen; Vermessungslücken nur dort, wo auch der Baukasten sie seit LFH-502 prüft.
 * Wie viele Werte gerade gesperrt sind, hält kein Test fest — die Vermessung wächst.
 */
import type {
  BodyMarkId,
  CapabilityId,
  ColorToken,
  StrengthId,
  SymbolKind,
} from '@einsatzzeichen/schema';
import {
  ADMIN_LEVEL_IDS,
  CAPABILITY_IDS,
  STATE_IDS,
  SYMBOL_KINDS,
  TECHNICAL_BODY_MARK_IDS,
  TECHNICAL_FILL_TOKENS,
  TENDENCY_IDS,
  UNIT_GROUPING_IDS,
  type SymbolSpec,
} from '@einsatzzeichen/schema';
import { describe, expect, expectTypeOf, test } from 'vitest';
import * as core from './index.js';
import { drawSymbol } from './default-ports.js';
import { BODY_MARK_IDS } from './geometry/body-marks.js';
import { parseSpec } from './spec-codec.js';
import {
  LIST_SPEC_FIELDS,
  SPEC_FIELD_VALUES,
  VOCABULARY_FIELDS,
  checkSpec,
  specFieldValues,
  vocabulary,
  type SpecFieldValue,
  type VocabularyOption,
} from './vocabulary.js';

function byValue(options: readonly VocabularyOption[]): Map<string, VocabularyOption> {
  return new Map(options.map((option) => [option.value, option]));
}

describe('SPEC_FIELD_VALUES', () => {
  test('führt jedes Feld der SymbolSpec genau einmal', () => {
    // Die Vollständigkeit sichert der Typ zu; hier steht die Laufzeitseite dazu.
    expect(Object.keys(SPEC_FIELD_VALUES).sort()).toEqual(
      [
        'administrativeLevel',
        'bodyMarkRenditions',
        'bodyMarks',
        'bodyVariant',
        'capabilities',
        'designation',
        'functionRole',
        'kind',
        'labels',
        'organization',
        'strength',
        'technicalFill',
        'technicalHeadMark',
        'vehicleCategory',
        'whiteInnerContour',
        'unitGrouping',
        'states',
        'tendency',
      ].sort(),
    );
  });

  test('zählt die geschlossenen Felder aus den Wertelisten des Schemas auf', () => {
    expect(SPEC_FIELD_VALUES.kind).toEqual({ shape: 'one-of', values: SYMBOL_KINDS });
    expect(SPEC_FIELD_VALUES.administrativeLevel).toEqual({
      shape: 'one-of',
      values: ADMIN_LEVEL_IDS,
    });
    expect(SPEC_FIELD_VALUES.technicalFill).toEqual({
      shape: 'one-of',
      values: TECHNICAL_FILL_TOKENS,
    });
    // LFH-990: die Tinten-Tokens sind Schriftfarben, keine Körperfüllung.
    expect(SPEC_FIELD_VALUES.technicalFill.values).not.toContain('funktionslauf-kontrast');
    expect(SPEC_FIELD_VALUES.technicalFill.values).not.toContain('koerperlauf-kontrast');
    expect(SPEC_FIELD_VALUES.capabilities).toEqual({ shape: 'list', values: CAPABILITY_IDS });
    expect(SPEC_FIELD_VALUES.bodyMarks).toEqual({
      shape: 'list',
      values: [...CAPABILITY_IDS, ...TECHNICAL_BODY_MARK_IDS],
    });
    expect(SPEC_FIELD_VALUES.unitGrouping).toEqual({ shape: 'one-of', values: UNIT_GROUPING_IDS });
    expect(SPEC_FIELD_VALUES.states).toEqual({ shape: 'list', values: STATE_IDS });
    expect(SPEC_FIELD_VALUES.tendency).toEqual({ shape: 'one-of', values: TENDENCY_IDS });
  });

  test('kennzeichnet Schalter, Freitext und Beschriftungen, statt sie aufzuzählen', () => {
    expect(SPEC_FIELD_VALUES.whiteInnerContour).toEqual({ shape: 'flag' });
    expect(SPEC_FIELD_VALUES.designation).toEqual({ shape: 'text' });
    expect(SPEC_FIELD_VALUES.labels).toEqual({ shape: 'structured' });
  });

  test('ist eingefroren, samt Einträgen', () => {
    expect(Object.isFrozen(SPEC_FIELD_VALUES)).toBe(true);
    for (const domain of Object.values(SPEC_FIELD_VALUES)) expect(Object.isFrozen(domain)).toBe(true);
  });

  test('liest jeder aufgezählte Wert parseSpec so, wie er hier steht', () => {
    // Gegenprobe zum kanonischen Leser (LFH-577): zwei Wertevorräte für dasselbe Feld liefen
    // sonst still auseinander, und das Vokabular böte Werte an, die kein Link transportiert.
    for (const field of VOCABULARY_FIELDS) {
      const domain = SPEC_FIELD_VALUES[field];
      for (const value of domain.values) {
        const spec =
          field === 'kind'
            ? { kind: value }
            : { kind: 'formation', [field]: domain.shape === 'list' ? [value] : value };
        expect(() => parseSpec(spec), `${field}=${value}`).not.toThrow();
      }
    }
  });

  test('enthält jede Körpermarke, für die überhaupt eine Fassung vermessen ist', () => {
    const domain = new Set(SPEC_FIELD_VALUES.bodyMarks.values);
    for (const id of BODY_MARK_IDS) expect(domain.has(id), id).toBe(true);
  });

  test('specFieldValues gibt den Eintrag der Tabelle', () => {
    expect(specFieldValues('strength')).toBe(SPEC_FIELD_VALUES.strength);
    expect(specFieldValues('labels')).toEqual({ shape: 'structured' });
  });

  test('leitet die Vokabular- und Listenfelder aus der Tabelle ab', () => {
    expect(LIST_SPEC_FIELDS).toEqual(['states', 'capabilities', 'bodyMarks']);
    expect(VOCABULARY_FIELDS).not.toContain('designation');
    expect(VOCABULARY_FIELDS).not.toContain('labels');
    expect(VOCABULARY_FIELDS).not.toContain('whiteInnerContour');
    expect(VOCABULARY_FIELDS).toContain('kind');
    expect(VOCABULARY_FIELDS).toContain('bodyMarks');
  });
});

describe('checkSpec', () => {
  test('liefert für eine tragende Spec dieselbe Zeichnung wie drawSymbol', () => {
    const spec: SymbolSpec = { kind: 'formation', organization: 'thw', strength: 'gruppe' };
    expect(checkSpec(spec)).toEqual({ ok: true, drawing: drawSymbol(spec) });
  });

  test('reicht Optionen an drawSymbol durch', () => {
    const result = checkSpec({ kind: 'formation' }, { title: 'Probe' });
    expect(result.ok && result.drawing.title).toBe('Probe');
  });

  test('erklärt eine Regelverletzung mit Titel, Erklärung und Feld', () => {
    const result = checkSpec({ kind: 'formation', organization: 'feuerwehr', technicalFill: 'weiss' });
    expect(result.ok).toBe(false);
    if (result.ok || result.reason !== 'rule') throw new Error('Regelablehnung erwartet');
    const conflict = result.issues.find((issue) => issue.rule === 'technical-fill-organization-conflict');
    expect(conflict?.field).toBe('technicalFill');
    expect(conflict?.title.length).toBeGreaterThan(0);
    expect(conflict?.explanation.length).toBeGreaterThan(40);
  });

  test('meldet eine Vermessungslücke als eigenes Ergebnis mit Reichweite', () => {
    // Bis zum 2. Oktober 2026 war Verband III das Beispiel mit `scope: 'value'`. Seit dem Ableiten
    // (docs/decisions/2026-10-02-ableiten-statt-messsperre.md) wirft der Standardkatalog keinen
    // Wert mehr, der an keiner Kombination trägt: die übrigen `'value'`-Würfe greifen nur bei
    // einem partiellen eigenen Portsatz, den checkSpec nicht nimmt. Belegt wird die Reichweite
    // deshalb an einer realen Kombinationslücke: das Fahrwerk unter dem Giebel des Landfahrzeugs.
    // Ohne Giebel trägt dieselbe Kategorie.
    const result = checkSpec({ kind: 'vehicle-land', bodyVariant: 'raised-gable', vehicleCategory: 'kfz-kategorie-1' });
    expect(result).toMatchObject({ ok: false, reason: 'not-measured', scope: 'combination' });
    expect(checkSpec({ kind: 'vehicle-land', vehicleCategory: 'kfz-kategorie-1' }).ok).toBe(true);
    if (!result.ok && result.reason === 'not-measured') expect(result.message.length).toBeGreaterThan(0);
  });

  test('prüft über den echten Weg, nicht über ein nacktes validateSpec', () => {
    // D.1.2 Katastrophenschutzstab: die Funktionsfassung verlangt ihre aufgelöste Definition, und
    // die reicht erst compose aus den Ports in die Prüfung. Ein nacktes validateSpec(spec) lehnt
    // die Spec deshalb ab, obwohl sie trägt.
    const spec: SymbolSpec = {
      kind: 'formation',
      organization: 'fuehrung-leitung',
      functionRole: 'disaster-control-command',
    };
    expect(core.validateSpec(spec).map((issue) => issue.rule)).toContain(
      'function-role-requires-measured-layout',
    );
    expect(checkSpec(spec).ok).toBe(true);
  });

  test('lässt einen Programmfehler fliegen, statt ihn als Befund auszugeben', () => {
    const broken = { kind: 'formation', designation: 123 } as unknown as SymbolSpec;
    expect(() => checkSpec(broken)).toThrow(TypeError);
  });
});

describe('vocabulary', () => {
  test('lässt zusammenpassende Werte offen', () => {
    const options = byValue(vocabulary({ kind: 'formation' }, 'strength'));
    expect([...options.keys()]).toEqual(['trupp', 'staffel', 'gruppe', 'zug']);
    expect(options.get('gruppe')).toEqual({ value: 'gruppe', selected: false, status: 'allowed' });
  });

  test('sperrt einen Wert über eine Regel und erklärt ihn', () => {
    const options = byValue(
      vocabulary({ kind: 'formation', organization: 'feuerwehr' }, 'technicalFill'),
    );
    const white = options.get('weiss');
    expect(white).toMatchObject({ status: 'blocked', reason: 'rule', selected: false });
    if (white?.status === 'blocked' && white.reason === 'rule') {
      expect(white.issues.map((issue) => issue.rule)).toContain('technical-fill-organization-conflict');
      expect(white.issues[0]?.explanation.length).toBeGreaterThan(40);
    }
  });

  test('sperrt einen nicht vermessenen Wert mit der Reichweite aus der Wurfstelle', () => {
    // Wie bei checkSpec: einen Wert mit `scope: 'value'` liefert der Standardkatalog seit dem
    // 2. Oktober 2026 nicht mehr. Die Reichweite kommt hier aus der Wurfstelle der Fahrwerkszone
    // unter dem Giebel und lautet `'combination'`.
    const [fixed] = vocabulary({ kind: 'vehicle-land', bodyVariant: 'raised-gable' }, 'vehicleCategory', {
      candidates: ['kfz-kategorie-1'],
    });
    expect(fixed).toMatchObject({ status: 'blocked', reason: 'not-measured', scope: 'combination' });
    // Verband III und das Amphibienfahrzeug waren bis zum 02.10.2026 die Beispiele hier: der
    // Verband steht jetzt nach dem Vorschlag x 12/16/20, die Wellenlinie ist aus der Strichhülle
    // konstruiert. Beide Werte sind offen und als abgeleitet markiert.
    const [verband] = vocabulary({ kind: 'formation' }, 'unitGrouping', {
      candidates: ['verband-iii'],
    });
    expect(verband).toEqual({ value: 'verband-iii', selected: false, status: 'allowed', derived: true });
    const [amphibian] = vocabulary({ kind: 'vehicle-land' }, 'vehicleCategory', {
      candidates: ['amphibienfahrzeug'],
    });
    expect(amphibian).toEqual({ value: 'amphibienfahrzeug', selected: false, status: 'allowed', derived: true });
  });

  test('gibt eine übertragene Körpermarke frei und kennzeichnet sie als abgeleitet', () => {
    // Bis zum 2. Oktober 2026 sperrte `bodyMark()` die Winde aus F.2.6 an der Formation als nicht
    // vermessene Kombination; seitdem überträgt es die Fassung vom angehobenen Luftrumpf.
    const [combination] = vocabulary({ kind: 'formation' }, 'bodyMarks', {
      candidates: ['air-winch-chevron-diamond'],
    });
    expect(combination).toMatchObject({ status: 'allowed', derived: true });
  });

  test('prüft über den echten Weg wie checkSpec', () => {
    // Dieselbe Falle wie bei checkSpec: ein nacktes validateSpec sperrte jede Funktionsfassung.
    const [role] = vocabulary({ kind: 'formation', organization: 'fuehrung-leitung' }, 'functionRole', {
      candidates: ['disaster-control-command'],
    });
    expect(role).toEqual({ value: 'disaster-control-command', selected: false, status: 'allowed' });
  });

  test('hängt bei Listenfeldern an die bestehende Auswahl an und kennzeichnet enthaltene Werte', () => {
    const spec: SymbolSpec = { kind: 'formation', bodyMarks: ['care'] };
    const options = byValue(vocabulary(spec, 'bodyMarks', { candidates: ['care', 'fire-fighting'] }));
    expect(options.get('care')).toEqual({ value: 'care', selected: true, status: 'allowed' });
    expect(options.get('fire-fighting')).toEqual({
      value: 'fire-fighting',
      selected: false,
      status: 'allowed',
    });
    expect(checkSpec({ ...spec, bodyMarks: ['care', 'fire-fighting'] }).ok).toBe(true);
  });

  test('gibt dem gesetzten Wert den Stand der Spec, wie sie ist', () => {
    // Die Spec trägt aus einem anderen Grund nicht; der gesetzte Wert teilt ihren Befund.
    const broken: SymbolSpec = {
      kind: 'formation',
      organization: 'feuerwehr',
      technicalFill: 'weiss',
      strength: 'gruppe',
    };
    const [selected] = vocabulary(broken, 'strength', { candidates: ['gruppe'] });
    expect(selected).toMatchObject({ value: 'gruppe', selected: true, status: 'blocked', reason: 'rule' });
  });

  test('ersetzt bei kind die Grundzeichenart und behält die übrige Auswahl', () => {
    const options = byValue(vocabulary({ kind: 'formation', strength: 'gruppe' }, 'kind'));
    expect(options.get('formation')).toMatchObject({ selected: true, status: 'allowed' });
    expect(options.get('person')).toMatchObject({ selected: false, status: 'allowed' });
    // Eine Stärke trägt nur eine taktische Einheit.
    expect(options.get('vehicle-land')).toMatchObject({ status: 'blocked', reason: 'rule' });
  });

  test('beginnt ein Skript bei einer leeren Beschreibung mit kind', () => {
    const options = byValue(vocabulary({}, 'kind'));
    expect([...options.keys()]).toEqual([...SYMBOL_KINDS]);
    expect(options.get('formation')).toEqual({ value: 'formation', selected: false, status: 'allowed' });
    // Seit dem 2. Oktober 2026 komponieren beide auch ohne Organisation (weiße Fläche).
    expect(options.get('circle-12')).toMatchObject({ status: 'allowed' });
    expect(options.get('reduced-house')).toMatchObject({ status: 'allowed' });
  });

  test('verlangt kind, bevor ein anderes Feld gefragt wird', () => {
    expect(() => vocabulary({} as SymbolSpec, 'strength')).toThrow(/kind/);
  });

  test('prüft nur die übergebenen Kandidaten, in ihrer Reihenfolge', () => {
    const options = vocabulary({ kind: 'formation' }, 'strength', { candidates: ['zug', 'trupp'] });
    expect(options.map((option) => option.value)).toEqual(['zug', 'trupp']);
  });

  test('lehnt einen Kandidaten außerhalb des Wertevorrats ab', () => {
    // Ein Aufrufer ohne Typprüfung (JavaScript, Werte aus einer Adresse) kommt trotzdem hierher.
    const foreign = ['verband'] as unknown as readonly StrengthId[];
    expect(() => vocabulary({ kind: 'formation' }, 'strength', { candidates: foreign })).toThrow(
      RangeError,
    );
  });

  test('lehnt ein Feld ohne Wertevorrat ab', () => {
    expect(() => vocabulary({ kind: 'formation' }, 'designation' as never)).toThrow(RangeError);
  });

  test('lässt einen Programmfehler fliegen, statt jeden Wert zu sperren', () => {
    const broken = { kind: 'formation', designation: 123 } as unknown as SymbolSpec;
    expect(() => vocabulary(broken, 'strength', { candidates: ['gruppe'] })).toThrow(TypeError);
  });

  test('gibt jedem Feld für die nackte Formation einen Befund', () => {
    for (const field of VOCABULARY_FIELDS) {
      const options = vocabulary({ kind: 'formation' }, field);
      expect(options.length, field).toBe(SPEC_FIELD_VALUES[field].values.length);
    }
  });
});

describe('Typen', () => {
  test('SpecFieldValue ist der Wertetyp des Feldes, bei Listen der Elementtyp', () => {
    expectTypeOf<SpecFieldValue<'kind'>>().toEqualTypeOf<SymbolKind>();
    expectTypeOf<SpecFieldValue<'strength'>>().toEqualTypeOf<StrengthId>();
    expectTypeOf<SpecFieldValue<'technicalFill'>>().toEqualTypeOf<ColorToken>();
    expectTypeOf<SpecFieldValue<'capabilities'>>().toEqualTypeOf<CapabilityId>();
    expectTypeOf<SpecFieldValue<'bodyMarks'>>().toEqualTypeOf<BodyMarkId>();
  });

  test('ein Befund lässt sich ohne Umwandlung in die Spec zurückschreiben', () => {
    const spec: SymbolSpec = { kind: 'formation' };
    const [strength] = vocabulary(spec, 'strength');
    expectTypeOf(strength!.value).toEqualTypeOf<StrengthId>();
    const next: SymbolSpec = { ...spec, strength: strength!.value };
    expect(checkSpec(next).ok).toBe(true);

    const [mark] = vocabulary(spec, 'bodyMarks', { candidates: ['care'] });
    const withMark: SymbolSpec = { ...spec, bodyMarks: [...(spec.bodyMarks ?? []), mark!.value] };
    expect(withMark.bodyMarks).toEqual(['care']);

    const [kind] = vocabulary({}, 'kind');
    expectTypeOf(kind!.value).toEqualTypeOf<SymbolKind>();
  });

  test('Kandidaten sind auf den Wertetyp des Feldes getypt', () => {
    // @ts-expect-error — „verband" ist keine Stärke.
    expect(() => vocabulary({ kind: 'formation' }, 'strength', { candidates: ['verband'] })).toThrow(
      RangeError,
    );
    expectTypeOf(SPEC_FIELD_VALUES.strength.values).toEqualTypeOf<readonly StrengthId[]>();
  });
});

describe('Index', () => {
  test('exportiert die Vokabular-API', () => {
    expect(core.vocabulary).toBe(vocabulary);
    expect(core.checkSpec).toBe(checkSpec);
    expect(core.specFieldValues).toBe(specFieldValues);
    expect(core.SPEC_FIELD_VALUES).toBe(SPEC_FIELD_VALUES);
    expect(core.VOCABULARY_FIELDS).toBe(VOCABULARY_FIELDS);
    expect(core.LIST_SPEC_FIELDS).toBe(LIST_SPEC_FIELDS);
  });
});
