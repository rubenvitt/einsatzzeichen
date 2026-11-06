import { describe as suite, expect, it } from 'vitest';
import {
  FREESTANDING_KINDS,
  SYMBOL_KINDS,
  TECHNICAL_FILL_TOKENS,
  type BodySign,
  type SymbolSpec,
} from '@einsatzzeichen/schema';
import { drawSymbol } from '../default-ports.js';
import { renderSvg } from '../render/svg.js';
import { serializeAnySpec, serializeSpec, SpecParseError, encodeSpecParam } from '../spec-codec.js';
import { specKey } from '../spec-key.js';
import {
  COLOR_LABELS,
  KIND_FAMILIES,
  SIGN_HEAD_VALUES,
  check,
  choices,
  decodeSignParam,
  describe,
  draw,
  encodeSignParam,
  fromExact,
  headGroupOf,
  parse,
  resolve,
  serialize,
} from './index.js';

suite('resolve', () => {
  it('bildet die Felder der Beschreibung auf den Bauplan ab', () => {
    const spec = resolve({
      kind: 'formation',
      organization: 'thw',
      head: 'gruppe',
      states: ['tendency-rising'],
      text: { center: 'B', bottomRight: 'THW', below: 'Nord' },
    });
    expect(spec).toEqual({
      kind: 'formation',
      organization: 'thw',
      strength: 'gruppe',
      tendency: 'tendency-rising',
      designation: 'Nord',
      labels: { center: 'B', bottomRight: 'THW' },
    });
  });

  it('verteilt den Kopf nach seiner Liste', () => {
    expect(resolve({ kind: 'formation', head: 'verband-i' })).toEqual({ kind: 'formation', unitGrouping: 'verband-i' });
    expect(resolve({ kind: 'post', head: 'kreis' })).toEqual({ kind: 'post', administrativeLevel: 'kreis' });
    expect(resolve({ kind: 'formation', head: 'single-vertical-bar' })).toEqual({
      kind: 'formation',
      technicalHeadMark: 'single-vertical-bar',
    });
    for (const value of SIGN_HEAD_VALUES) expect(headGroupOf(value)).toBeDefined();
  });

  it('setzt Farbe ohne Organisation, Variante, Funktion und Fahrwerk unter ihre Bauplan-Namen', () => {
    expect(resolve({ kind: 'vehicle-land', color: 'gelb', variant: 'foot-band', chassis: 'kettenfahrzeug' })).toEqual({
      kind: 'vehicle-land',
      technicalFill: 'gelb',
      bodyVariant: 'foot-band',
      vehicleCategory: 'kettenfahrzeug',
    });
    expect(resolve({ kind: 'person', role: 'incident-commander' })).toEqual({ kind: 'person', functionRole: 'incident-commander' });
  });

  it('wählt für Fachaufgaben die vermessene Fassung', () => {
    // Bergung an der Formation ist nur in der Box vermessen, Sanität randbündig.
    expect(resolve({ kind: 'formation', tasks: ['recovery'] })).toMatchObject({ capabilities: ['recovery'] });
    const medical = resolve({ kind: 'formation', tasks: ['medical-service'] });
    expect(drawSymbol(medical).derivations ?? []).toEqual([]);
  });

  it('legt exact zuletzt darüber, Beschriftung Zone für Zone', () => {
    const spec = resolve({
      kind: 'formation',
      organization: 'thw',
      text: { center: 'B' },
      exact: { whiteInnerContour: true, labels: { bottomRight: 'THW' } },
    });
    expect(spec).toEqual({
      kind: 'formation',
      organization: 'thw',
      whiteInnerContour: true,
      labels: { center: 'B', bottomRight: 'THW' },
    });
  });

  it('setzt keine Konventionen von selbst', () => {
    expect(resolve({ kind: 'formation', organization: 'thw' })).toEqual({ kind: 'formation', organization: 'thw' });
  });

  it('lässt freistehende Zeichen unverändert', () => {
    const weather = { kind: 'weather', values: ['weather-sunny'] } as const;
    expect(resolve(weather as never)).toBe(weather);
  });
});

suite('fromExact', () => {
  it('drückt einen gewöhnlichen Bauplan ganz in der Beschreibung aus', () => {
    const spec: SymbolSpec = {
      kind: 'formation',
      organization: 'feuerwehr',
      strength: 'zug',
      labels: { center: 'B' },
      designation: 'Nord',
    };
    expect(fromExact(spec)).toEqual({
      kind: 'formation',
      organization: 'feuerwehr',
      head: 'zug',
      text: { center: 'B', below: 'Nord' },
    });
  });

  it('hält eine andere Fassungswahl der Fachaufgaben in exact', () => {
    // Randbündig an der Formation ist für Bergung nicht vermessen; der Bauplan will sie trotzdem so.
    const spec: SymbolSpec = { kind: 'formation', bodyMarks: ['recovery'] };
    const sign = fromExact(spec);
    expect(sign).toEqual({ kind: 'formation', exact: { bodyMarks: ['recovery'] } });
    expect(specKey(resolve(sign))).toBe(specKey(spec));
  });

  it('hält Messwerte und technische Körpermarken in exact', () => {
    const spec: SymbolSpec = {
      kind: 'vehicle-land',
      bodyMarks: ['ring-7mm-offset-down-1mm' as never],
      labels: { center: 'X', centerCapHeightMm: 4.3829 },
    };
    const sign = fromExact(spec) as BodySign;
    expect(sign.text).toEqual({ center: 'X' });
    expect(sign.exact).toMatchObject({ labels: { centerCapHeightMm: 4.3829 } });
    expect(specKey(resolve(sign))).toBe(specKey(spec));
  });

  it('macht aus mehreren Kopfangaben exact, statt eine zu wählen', () => {
    const spec: SymbolSpec = { kind: 'formation', strength: 'gruppe', administrativeLevel: 'kreis' };
    const sign = fromExact(spec) as BodySign;
    expect(sign.head).toBeUndefined();
    expect(specKey(resolve(sign))).toBe(specKey(spec));
  });
});

suite('draw', () => {
  it('zeichnet eine tragende Beschreibung wie den Bauplan', () => {
    const sign: BodySign = { kind: 'formation', organization: 'thw', head: 'gruppe', text: { center: 'B' } };
    const drawn = draw(sign, { title: 'Bergungsgruppe' });
    expect(drawn.fidelity).toBe('measured');
    expect(drawn.omitted).toEqual([]);
    expect(drawn.drawing.title).toBe('Bergungsgruppe');
    expect(renderSvg(drawn.drawing)).toBe(renderSvg(drawSymbol(resolve(sign), { title: 'Bergungsgruppe' })));
    expect(drawn.key).toBe(specKey(drawn.exact as SymbolSpec));
  });

  it('lässt weg, was nicht passt, und sagt warum', () => {
    const drawn = draw({ kind: 'vehicle-land', organization: 'feuerwehr', head: 'gruppe' });
    expect(drawn.fidelity).toBe('simplified');
    expect(drawn.omitted).toEqual([{ field: 'head', value: 'gruppe', why: expect.stringContaining('Einheit') }]);
    expect(drawn.exact).toEqual({ kind: 'vehicle-land', organization: 'feuerwehr' });
  });

  it('behält, was nach dem Weglassen noch passt', () => {
    const drawn = draw({
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      head: 'gruppe',
      text: { center: 'HLF' },
    });
    expect(drawn.omitted.map((o) => o.field)).toEqual(['head']);
    expect(drawn.exact).toMatchObject({ labels: { center: 'HLF' } });
  });

  it('meldet abgeleitete Teile als derived', () => {
    const drawn = draw({ kind: 'formation', exact: { bodyMarks: ['recovery'] } });
    expect(drawn.fidelity).toBe('derived');
    expect(drawn.drawing.derivations?.length).toBeGreaterThan(0);
  });

  it('zeichnet bei unbrauchbarer Art den konkreten Punkt', () => {
    const drawn = draw({ kind: 'keine-art' } as never);
    expect(drawn.exact).toEqual({ kind: 'point' });
    expect(drawn.omitted).toEqual([{ field: 'kind', value: 'keine-art', why: expect.any(String) }]);
  });

  it('wirft nie für eine freistehende Beschreibung, die nicht trägt', () => {
    const drawn = draw({ kind: 'weather', values: [] } as never);
    expect(drawn.fidelity).toBe('simplified');
    expect(drawn.exact).toEqual({ kind: 'point' });
  });
});

suite('check', () => {
  it('nennt das Feld der Beschreibung', () => {
    const result = check({ kind: 'vehicle-land', head: 'gruppe' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]).toMatchObject({ rule: 'strength-requires-unit', field: 'head', reason: 'rule' });
  });

  it('meldet mehr als eine Tendenz', () => {
    const result = check({ kind: 'formation', states: ['tendency-rising', 'tendency-falling'] });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]).toMatchObject({ rule: 'sign-one-tendency', field: 'states' });
  });

  it('verweist auf exact, wenn das Feld dort steht', () => {
    const result = check({ kind: 'vehicle-land', exact: { strength: 'gruppe' } });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]?.field).toBe('exact');
  });

  it('antwortet mit der Treue der Zeichnung', () => {
    expect(check({ kind: 'formation', organization: 'thw' })).toMatchObject({ ok: true, fidelity: 'measured' });
  });
});

suite('choices', () => {
  it('liefert Namen, Gruppen und Befund', () => {
    const heads = choices({ kind: 'formation', organization: 'thw' }, 'head');
    expect(heads.find((c) => c.value === 'gruppe')).toEqual({
      value: 'gruppe',
      label: 'Gruppe',
      group: 'Stärke',
      selected: false,
      status: 'measured',
    });
    const vehicleHeads = choices({ kind: 'vehicle-land' }, 'head');
    expect(vehicleHeads.find((c) => c.value === 'gruppe')).toMatchObject({ status: 'blocked', why: expect.any(String) });
  });

  it('ersetzt Organisation und Farbe gegenseitig', () => {
    const colors = choices({ kind: 'formation', organization: 'thw' }, 'color');
    expect(colors.map((c) => c.value)).toEqual([...TECHNICAL_FILL_TOKENS]);
    expect(colors.find((c) => c.value === 'gelb')?.label).toBe('Gelb');
  });

  it('hängt Listenwerte an und markiert gesetzte', () => {
    const tasks = choices({ kind: 'formation', tasks: ['medical-service'] }, 'tasks', {
      candidates: ['medical-service', 'recovery'],
    });
    expect(tasks.map((c) => [c.value, c.selected])).toEqual([
      ['medical-service', true],
      ['recovery', false],
    ]);
  });

  it('fragt die Art auch ohne gesetzte Art', () => {
    const kinds = choices({}, 'kind');
    expect(kinds).toHaveLength(SYMBOL_KINDS.length);
    expect(kinds[0]).toMatchObject({ value: 'formation', group: 'Einheit' });
  });

  it('wirft für unbekannte Felder und Werte', () => {
    expect(() => choices({ kind: 'formation' }, 'labels' as never)).toThrow(RangeError);
    expect(() => choices({ kind: 'formation' }, 'head', { candidates: ['riesig'] })).toThrow(RangeError);
    expect(() => choices({} as BodySign, 'head')).toThrow(TypeError);
  });
});

suite('describe', () => {
  it('benennt die Beschreibung und liest sie vor', () => {
    const result = describe({ kind: 'formation', organization: 'thw', head: 'gruppe', text: { center: 'B' } });
    expect(result.title).toBe('Taktische Formation, Gruppe, Technisches Hilfswerk, „B“');
    expect(result.description).toContain('Grundzeichen: Taktische Formation');
  });

  it('nimmt die Funktion vor die Art', () => {
    expect(describe({ kind: 'person', role: 'incident-commander' }).title).toBe('Einsatzleiter');
  });
});

suite('serialize und parse', () => {
  it('schreibt die Hülle v2 kanonisch', () => {
    const a = serialize({ text: { center: 'B' }, organization: 'thw', kind: 'formation' } as BodySign);
    const b = serialize({ kind: 'formation', organization: 'thw', text: { center: 'B' }, tasks: [] });
    expect(a).toBe('{"v":2,"sign":{"kind":"formation","organization":"thw","text":{"center":"B"}}}');
    expect(b).toBe(a);
  });

  it('liest v2, v1 und alte Links', () => {
    const sign: BodySign = { kind: 'formation', organization: 'thw', head: 'gruppe' };
    expect(parse(serialize(sign))).toEqual(sign);
    const spec: SymbolSpec = { kind: 'formation', organization: 'thw', strength: 'gruppe' };
    expect(parse(serializeSpec(spec))).toEqual(sign);
    expect(parse(spec)).toEqual(sign);
    expect(decodeSignParam(encodeSpecParam(spec))).toEqual(sign);
    expect(decodeSignParam(encodeSignParam(sign))).toEqual(sign);
    const weather = { kind: 'weather', values: ['weather-sunny'] } as never;
    expect(parse(serializeAnySpec(weather))).toEqual(weather);
    expect(parse(serialize(weather))).toEqual(weather);
  });

  it('lehnt Unbekanntes mit Pfad ab', () => {
    expect(() => parse('{"v":2,"sign":{"kind":"formation","tasks":["fliegen"]}}')).toThrow(SpecParseError);
    expect(() => parse('{"v":2,"sign":{"kind":"formation","farbe":"rot"}}')).toThrow(/\$\.sign\.farbe/);
    expect(() => parse('{"v":2,"sign":{"kind":"formation","organization":"thw","color":"rot"}}')).toThrow(/schließen sich aus/);
    expect(() => parse('{"v":2,"sign":{"kind":"formation","exact":{"strength":"riesig"}}}')).toThrow(/\$\.sign\.exact\.strength/);
    expect(() => parse('{"v":3,"sign":{"kind":"formation"}}')).toThrow(SpecParseError);
  });
});

suite('KIND_FAMILIES', () => {
  it('führt jede Art in genau einer Familie', () => {
    const listed = KIND_FAMILIES.flatMap((family) => family.kinds);
    expect([...listed].sort()).toEqual([...SYMBOL_KINDS, ...FREESTANDING_KINDS].sort());
    expect(new Set(listed).size).toBe(listed.length);
  });

  it('benennt jede Farbe ohne Organisation', () => {
    for (const token of TECHNICAL_FILL_TOKENS) expect(COLOR_LABELS[token]).toBeTruthy();
  });
});
