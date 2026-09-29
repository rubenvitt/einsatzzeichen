import { describe, expect, it } from 'vitest';
import type { SymbolSpec } from '@einsatzzeichen/schema';
import {
  SPEC_FORMAT_VERSION,
  SpecParseError,
  canonicalSpec,
  decodeSpecParam,
  encodeSpecParam,
  parseSpec,
  serializeSpec,
} from './spec-codec.js';

// Die Rundreise über alle Rezepte mit byte-gleichem SVG steht in
// conformance/src/spec-codec-roundtrip.test.ts: `core` darf das Prüfpaket nicht importieren.

const full: SymbolSpec = {
  kind: 'formation',
  organization: 'hilfsorganisation',
  strength: 'zug',
  bodyMarks: ['medical-service', 'care'],
  capabilities: ['fire-fighting'],
  designation: 'Wasserrettungszugführung',
  labels: {
    topLeft: 'ÜMANV-S',
    inBodyInk: 'weiss',
    topLeftLines: ['GW-San', '50'],
    aboveLeftMetrics: { capHeightMm: 2.919225, anchorFromBodyLeftMm: -2, baselineFromBodyTopMm: -1 },
    bottomRightMetrics: {
      capHeightMm: 2.9,
      baselineFromBodyTopMm: 18,
      anchorFromBodyLeftMm: 20,
      boxLeftFromBodyLeftMm: 15,
      boxWidthMm: 10,
    },
  },
};

/** Fängt den erwarteten `SpecParseError`, damit Pfad und Meldung prüfbar sind. */
function parseError(input: unknown): SpecParseError {
  try {
    parseSpec(input);
  } catch (error) {
    if (error instanceof SpecParseError) return error;
    throw error;
  }
  throw new Error('parseSpec hat nicht abgelehnt');
}

function base64url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

describe('serializeSpec()', () => {
  it('schreibt die Hülle mit Formatversion und sortierten Schlüsseln', () => {
    expect(SPEC_FORMAT_VERSION).toBe(1);
    expect(serializeSpec({ strength: 'trupp', kind: 'formation' })).toBe(
      '{"v":1,"spec":{"kind":"formation","strength":"trupp"}}',
    );
  });

  it('hängt nicht von der Schlüsselreihenfolge ab, auch nicht in verschachtelten Objekten', () => {
    const reordered: SymbolSpec = {
      labels: {
        bottomRightMetrics: {
          boxWidthMm: 10,
          boxLeftFromBodyLeftMm: 15,
          anchorFromBodyLeftMm: 20,
          baselineFromBodyTopMm: 18,
          capHeightMm: 2.9,
        },
        aboveLeftMetrics: { baselineFromBodyTopMm: -1, anchorFromBodyLeftMm: -2, capHeightMm: 2.919225 },
        topLeftLines: ['GW-San', '50'],
        inBodyInk: 'weiss',
        topLeft: 'ÜMANV-S',
      },
      designation: 'Wasserrettungszugführung',
      capabilities: ['fire-fighting'],
      bodyMarks: ['medical-service', 'care'],
      strength: 'zug',
      organization: 'hilfsorganisation',
      kind: 'formation',
    };
    expect(serializeSpec(reordered)).toBe(serializeSpec(full));
  });

  it('behält die Reihenfolge von bodyMarks und capabilities, weil sie die Zeichnung ändert', () => {
    const swapped: SymbolSpec = { ...full, bodyMarks: ['care', 'medical-service'] };
    expect(serializeSpec(swapped)).not.toBe(serializeSpec(full));
    expect(parseSpec(serializeSpec(swapped)).bodyMarks).toEqual(['care', 'medical-service']);
    const capabilities: SymbolSpec = { kind: 'formation', capabilities: ['reconnaissance', 'fire-fighting'] };
    expect(parseSpec(serializeSpec(capabilities)).capabilities).toEqual(['reconnaissance', 'fire-fighting']);
  });

  it('lässt Felder mit undefined weg', () => {
    const spec = { kind: 'formation', organization: undefined } as unknown as SymbolSpec;
    expect(serializeSpec(spec)).toBe('{"v":1,"spec":{"kind":"formation"}}');
  });

  it('serialisiert nur, was parseSpec wieder liest', () => {
    const invalid = { kind: 'formation', organization: 'feuerwehrr' } as unknown as SymbolSpec;
    expect(() => serializeSpec(invalid)).toThrow(SpecParseError);
  });

  it('ist idempotent über parseSpec', () => {
    const once = serializeSpec(full);
    expect(serializeSpec(parseSpec(once))).toBe(once);
  });
});

describe('canonicalSpec()', () => {
  it('liefert eine gleichwertige Spec mit sortierten Schlüsseln, ohne das Original zu teilen', () => {
    const canonical = canonicalSpec(full);
    expect(canonical).toEqual(full);
    expect(Object.keys(canonical)).toEqual([
      'bodyMarks',
      'capabilities',
      'designation',
      'kind',
      'labels',
      'organization',
      'strength',
    ]);
    expect(Object.keys(canonical.labels!)).toEqual([
      'aboveLeftMetrics',
      'bottomRightMetrics',
      'inBodyInk',
      'topLeft',
      'topLeftLines',
    ]);
    expect(canonical.bodyMarks).not.toBe(full.bodyMarks);
    expect(canonical.labels).not.toBe(full.labels);
  });
});

describe('parseSpec()', () => {
  it('liest die Hülle als Zeichenkette und als Objekt', () => {
    const text = serializeSpec(full);
    expect(parseSpec(text)).toEqual(full);
    expect(parseSpec(JSON.parse(text))).toEqual(full);
  });

  it('liest auch eine nackte SymbolSpec ohne Hülle', () => {
    expect(parseSpec({ kind: 'person', organization: 'thw' })).toEqual({ kind: 'person', organization: 'thw' });
    expect(parseSpec('{"kind":"person"}')).toEqual({ kind: 'person' });
  });

  it('lehnt kaputtes JSON mit Pfad der Wurzel ab', () => {
    const error = parseError('{"kind":');
    expect(error.path).toBe('$');
    expect(error.message).toMatch(/kein gültiges JSON/);
  });

  it('lehnt eine unbekannte Formatversion ab', () => {
    const error = parseError({ v: 2, spec: { kind: 'formation' } });
    expect(error.path).toBe('$.v');
    expect(error.message).toMatch(/Formatversion 2/);
  });

  it('lehnt eine Hülle ohne Spec und mit fremden Feldern ab', () => {
    expect(parseError({ v: 1 }).path).toBe('$.spec');
    expect(parseError(Object.assign(Object.create({ spec: { kind: 'formation' } }), { v: 1 })).path).toBe('$.spec');
    const extra = parseError({ v: 1, spec: { kind: 'formation' }, x: 1 });
    expect(extra.path).toBe('$.x');
    expect(extra.message).toMatch(/unbekanntes Feld/);
  });

  it('verlangt kind', () => {
    const error = parseError({ organization: 'thw' });
    expect(error.path).toBe('$.kind');
    expect(error.message).toMatch(/fehlt/);
    // Ein geerbtes `kind` zählt nicht: gelesen werden nur eigene Felder.
    expect(parseError(Object.create({ kind: 'formation' })).path).toBe('$.kind');
  });

  it('lehnt Nicht-Objekte ab', () => {
    expect(parseError(null).path).toBe('$');
    expect(parseError([]).path).toBe('$');
    expect(parseError('"formation"').path).toBe('$');
    expect(parseError({ v: 1, spec: [] }).path).toBe('$.spec');
  });

  it('lehnt unbekannte Felder mit Pfad ab, auch verschachtelt', () => {
    const top = parseError({ kind: 'formation', colour: 'rot' });
    expect(top.path).toBe('$.colour');
    expect(top.message).toMatch(/unbekanntes Feld „colour“/);
    expect(parseError({ v: 1, spec: { kind: 'formation', labels: { middle: 'B' } } }).path).toBe(
      '$.spec.labels.middle',
    );
    expect(
      parseError({
        kind: 'formation',
        labels: { topLeftMetrics: { capHeightMm: 1, baselineFromBodyTopMm: 1, anchorFromBodyLeftMm: 1, x: 1 } },
      }).path,
    ).toBe('$.labels.topLeftMetrics.x');
    // Geerbte Eigenschaften zählen nicht (wie bei `specKey`), ein eigenes `__proto__` aus JSON schon.
    expect(parseSpec({ kind: 'formation', __proto__: { a: 1 } })).toEqual({ kind: 'formation' });
    expect(parseError('{"kind":"formation","__proto__":{"a":1}}').path).toBe('$.__proto__');
  });

  it.each([
    ['kind', { kind: 'formationn' }, '$.kind'],
    ['functionRole', { kind: 'person', functionRole: 'chef' }, '$.functionRole'],
    ['bodyVariant', { kind: 'formation', bodyVariant: 'raised' }, '$.bodyVariant'],
    ['organization', { kind: 'formation', organization: 'Feuerwehr' }, '$.organization'],
    ['technicalFill', { kind: 'formation', technicalFill: 'lila' }, '$.technicalFill'],
    ['strength', { kind: 'formation', strength: 'kompanie' }, '$.strength'],
    ['technicalHeadMark', { kind: 'formation', technicalHeadMark: 'bar' }, '$.technicalHeadMark'],
    ['administrativeLevel', { kind: 'post', administrativeLevel: 'land' }, '$.administrativeLevel'],
    ['vehicleCategory', { kind: 'vehicle-land', vehicleCategory: 'kfz' }, '$.vehicleCategory'],
    ['capabilities[1]', { kind: 'formation', capabilities: ['reconnaissance', 'care-x'] }, '$.capabilities[1]'],
    ['bodyMarks[0]', { kind: 'formation', bodyMarks: ['nope'] }, '$.bodyMarks[0]'],
    ['labels.inBodyInk', { kind: 'formation', labels: { inBodyInk: 'rot' } }, '$.labels.inBodyInk'],
    [
      'labels.accessibilityMode',
      { kind: 'formation', labels: { accessibilityMode: 'zones' } },
      '$.labels.accessibilityMode',
    ],
  ])('lehnt einen unbekannten Wert in %s mit Pfad ab', (_field, input, path) => {
    const error = parseError(input);
    expect(error.path).toBe(path);
    expect(error.message).toMatch(/unbekannter Wert/);
  });

  it('akzeptiert jede Fähigkeit und jede technische Körpermarke als bodyMark', () => {
    expect(parseSpec({ kind: 'formation', bodyMarks: ['care', 'formation-solid-cap-3mm'] }).bodyMarks).toEqual([
      'care',
      'formation-solid-cap-3mm',
    ]);
  });

  it.each([
    [{ kind: 1 }, '$.kind', /Zeichenkette/],
    [{ kind: 'formation', whiteInnerContour: false }, '$.whiteInnerContour', /true/],
    [{ kind: 'formation', designation: 3 }, '$.designation', /Zeichenkette/],
    [{ kind: 'formation', organization: null }, '$.organization', /null/],
    [{ kind: 'formation', capabilities: 'rescue' }, '$.capabilities', /Liste/],
    [{ kind: 'formation', labels: 'B' }, '$.labels', /Objekt/],
    [{ kind: 'formation', labels: { center: 5 } }, '$.labels.center', /Zeichenkette/],
    [{ kind: 'formation', labels: { centerCapHeightMm: '4' } }, '$.labels.centerCapHeightMm', /Zahl/],
    [{ kind: 'formation', labels: { centerBoxMarginMm: Infinity } }, '$.labels.centerBoxMarginMm', /endlich/],
    [{ kind: 'formation', labels: { topLeftLines: ['A'] } }, '$.labels.topLeftLines', /genau zwei/],
    [{ kind: 'formation', labels: { topLeftLines: ['A', 2] } }, '$.labels.topLeftLines[1]', /Zeichenkette/],
    [
      { kind: 'formation', labels: { topLeftMetrics: { capHeightMm: 1, baselineFromBodyTopMm: 1 } } },
      '$.labels.topLeftMetrics.anchorFromBodyLeftMm',
      /fehlt/,
    ],
    [
      {
        kind: 'formation',
        labels: {
          bottomRightMetrics: {
            capHeightMm: 1,
            baselineFromBodyTopMm: 1,
            anchorFromBodyLeftMm: 1,
            boxLeftFromBodyLeftMm: 1,
          },
        },
      },
      '$.labels.bottomRightMetrics.boxWidthMm',
      /fehlt/,
    ],
    [{ kind: 'formation', designation: 'a\uD800b' }, '$.designation', /Unicode/],
  ])('lehnt die falsche Form %j mit Pfad ab', (input, path, message) => {
    const error = parseError(input);
    expect(error.path).toBe(path);
    expect(error.message).toMatch(message);
  });

  it('liest Verband, Zustände und Tendenz aus den Wertelisten des Schemas (LFH-577)', () => {
    const spec = {
      kind: 'person',
      unitGrouping: 'verband-ii',
      states: ['suspected-situation', 'person-injured'],
      tendency: 'tendency-rising',
    };
    expect(parseSpec(spec)).toEqual(spec);
    // Die Reihenfolge der Zustände bleibt, wie bei bodyMarks: der Leser sortiert nicht.
    expect(serializeSpec({ kind: 'person', states: ['person-injured', 'suspected-situation'] })).toBe(
      '{"v":1,"spec":{"kind":"person","states":["person-injured","suspected-situation"]}}',
    );
  });

  it('prüft in states nur den Wertevorrat: Wetter lehnt erst validateSpec ab', () => {
    expect(parseSpec({ kind: 'person', states: ['weather-sunny'] }).states).toEqual(['weather-sunny']);
  });

  it.each([
    [{ kind: 'formation', unitGrouping: 'verband-iv' }, '$.unitGrouping', /unbekannter Wert/],
    [{ kind: 'person', states: ['person-happy'] }, '$.states[0]', /unbekannter Wert/],
    [{ kind: 'person', states: 'person-injured' }, '$.states', /Liste/],
    // Die Tendenz ist ein Einzelwert: eine Liste ist schon der Form nach falsch.
    [{ kind: 'person', tendency: ['tendency-rising'] }, '$.tendency', /Zeichenkette/],
    // Ein Zustand, der keine Tendenz ist, gehört nicht in tendency.
    [{ kind: 'person', tendency: 'person-injured' }, '$.tendency', /unbekannter Wert/],
  ])('lehnt %j in den neuen Feldern mit Pfad ab', (input, path, message) => {
    const error = parseError(input);
    expect(error.path).toBe(path);
    expect(error.message).toMatch(message);
  });

  it('meldet einen Fehler als SpecParseError mit Pfad in der Meldung', () => {
    const error = parseError({ kind: 'formation', strength: 'kompanie' });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('SpecParseError');
    expect(error.message).toContain('$.strength');
  });

  it('prüft keine Kombinationsregeln: das bleibt validateSpec', () => {
    // Organisation und technische Füllung zugleich lehnt `validateSpec` ab, nicht der Parser.
    const spec = { kind: 'formation', organization: 'thw', technicalFill: 'rot' };
    expect(parseSpec(spec)).toEqual(spec);
  });

  it('liest jedes Beschriftungsfeld', () => {
    const labels = {
      accessibilityMode: 'neutral-zones',
      inBodyInk: 'schwarz',
      center: 'B',
      centerAnchorFromBodyLeftMm: 1,
      centerBaselineFromBodyBottomMm: 2,
      centerBoxMarginMm: 0.5,
      bottomLeft: 'A',
      bottomCenter: 'C',
      bottomRight: 'THW',
      bottomRightMetrics: {
        capHeightMm: 1,
        baselineFromBodyTopMm: 2,
        anchorFromBodyLeftMm: 3,
        boxLeftFromBodyLeftMm: 4,
        boxWidthMm: 5,
      },
      topLeft: 'MTF',
      topLeftMetrics: { capHeightMm: 1, baselineFromBodyTopMm: 2, anchorFromBodyLeftMm: 3 },
      aboveLeft: 'ITH',
      aboveLeftMetrics: { capHeightMm: 1, baselineFromBodyTopMm: -2, anchorFromBodyLeftMm: 3 },
      topLeftLines: ['GW-San', '50'],
      belowRight: 'THW',
      surfaceBelowLeft: 'L',
      surfaceBelowRight: 'R',
      centerCapHeightMm: 4.3829,
    };
    expect(parseSpec({ kind: 'formation', labels }).labels).toEqual(labels);
  });
});

describe('encodeSpecParam() / decodeSpecParam()', () => {
  it('ist base64url ohne Füllzeichen über das kanonische JSON', () => {
    const param = encodeSpecParam(full);
    expect(param).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(param).toBe(base64url(serializeSpec(full)));
    expect(decodeSpecParam(param)).toEqual(full);
  });

  it('kodiert jede Restlänge wie btoa in URL-sicherer Form', () => {
    for (const designation of ['', 'a', 'ab', 'abc', 'ä', 'äb', '€', '𝔘']) {
      const spec: SymbolSpec = { kind: 'formation', designation };
      expect(encodeSpecParam(spec)).toBe(base64url(serializeSpec(spec)));
      expect(decodeSpecParam(encodeSpecParam(spec))).toEqual(spec);
    }
  });

  it('trägt Umlaute über UTF-8', () => {
    const spec: SymbolSpec = { kind: 'formation', designation: 'Übergröße ß' };
    expect(decodeSpecParam(encodeSpecParam(spec))).toEqual(spec);
  });

  it('liest alte Baukasten-Links (base64url über das rohe JSON der Spec, ohne Hülle)', () => {
    const legacy = base64url(JSON.stringify({ strength: 'zug', kind: 'formation', designation: 'Zugführung' }));
    expect(decodeSpecParam(legacy)).toEqual({ kind: 'formation', strength: 'zug', designation: 'Zugführung' });
  });

  it('nimmt auch Füllzeichen an', () => {
    const padded = btoa('{"kind":"point"}').replaceAll('+', '-').replaceAll('/', '_');
    expect(padded.endsWith('=')).toBe(true);
    expect(decodeSpecParam(padded)).toEqual({ kind: 'point' });
  });

  it('lehnt kaputtes base64url und kaputtes UTF-8 verständlich ab', () => {
    for (const param of ['ab$c', 'a', '']) {
      expect(() => decodeSpecParam(param)).toThrow(SpecParseError);
    }
    const invalidUtf8 = btoa(String.fromCharCode(0xff, 0xfe)).replaceAll('/', '_').replaceAll('=', '');
    expect(() => decodeSpecParam(invalidUtf8)).toThrow(/UTF-8/);
  });

  it('meldet Formfehler der dekodierten Spec mit Pfad', () => {
    expect(() => decodeSpecParam(base64url('{"kind":"formation","x":1}'))).toThrow(
      expect.objectContaining({ path: '$.x' }),
    );
  });
});
