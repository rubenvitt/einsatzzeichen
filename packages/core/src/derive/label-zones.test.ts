import { describe, expect, it } from 'vitest';
import type { Drawing, Primitive, SymbolSpec } from '@einsatzzeichen/schema';
import { boundsOfMm } from '../bounds.js';
import { drawSymbol } from '../default-ports.js';
import { NotMeasuredError } from '../not-measured.js';
import { ARIMO_CAP_HEIGHT_FRACTION, verticalTextBoxMm } from '../render/text-policy.js';
import { CompositionError } from '../validate.js';
import { checkViewBox } from '../viewbox-gate.js';

type Text = Extract<Primitive, { type: 'text' }>;

function runs(drawing: Drawing): Text[] {
  return drawing.children.filter((child): child is Text => child.type === 'text' && child.role === 'label');
}

function run(spec: SymbolSpec, content: string): { drawing: Drawing; text: Text } {
  const drawing = drawSymbol(spec);
  const text = runs(drawing).find((candidate) => candidate.content === content);
  if (text === undefined) throw new Error(`Lauf "${content}" fehlt.`);
  return { drawing, text };
}

function bodyOf(drawing: Drawing) {
  const body = drawing.children.find((child) => child.role === 'body');
  if (body === undefined) throw new Error('Körper fehlt.');
  return boundsOfMm(body);
}

const BOTTOM_SIZE_MM = 2.92 / ARIMO_CAP_HEIGHT_FRACTION;

describe('abgeleitete Beschriftungszonen: Übertragung der vermessenen Lagen', () => {
  it('überträgt die Formationslage oben links auf Rechteckkörper (F.1.1–F.1.11)', () => {
    const { drawing, text } = run({ kind: 'container', labels: { topLeft: 'MTF' } }, 'MTF');
    const body = bodyOf(drawing);
    expect(text.y).toBe(body.minY + 5);
    expect(text.x).toBe(body.minX + 1.5);
    expect(text.boxMm.xMm + text.boxMm.widthMm).toBe(body.maxX - 2);
    expect(drawing.derivations).toEqual([
      expect.objectContaining({ dimension: 'labels.topLeft', basis: 'transferred', from: expect.stringContaining('F.1.1') }),
    ]);
  });

  it('überträgt die F.2-Lage (6,75 mm) auf Anhänger- und Wechselladerrumpf', () => {
    for (const kind of ['trailer', 'swap-loader-vehicle'] as const) {
      const { drawing, text } = run({ kind, labels: { topLeft: 'BT' } }, 'BT');
      const body = bodyOf(drawing);
      expect(text.y, kind).toBeCloseTo(body.minY + 6.75, 10);
      expect(text.x, kind).toBeCloseTo(body.minX + 1.5, 10);
    }
  });

  it('setzt den Luftrumpf ohne Metriksatz auf den N.1.6-Anker (7,0 / 5,99 mm)', () => {
    for (const bodyVariant of [undefined, 'raised-hull', 'fixed-wing-hull'] as const) {
      const { drawing, text } = run({ kind: 'vehicle-air', ...(bodyVariant === undefined ? {} : { bodyVariant }), labels: { topLeft: '5.000' } }, '5.000');
      const body = bodyOf(drawing);
      expect(text.y, bodyVariant).toBeCloseTo(body.minY + 7, 10);
      expect(text.x, bodyVariant).toBeCloseTo(body.minX + 5.99, 10);
    }
  });

  it('legt die Lage oben links an der Raute in ihr Inneres', () => {
    const { drawing, text } = run({ kind: 'person', labels: { topLeft: 'MTF' } }, 'MTF');
    // Raute 1…31 um (16|16): an der Oberkante der Box reicht sie links bis 16 − (y − 1).
    const edgeAtBoxTop = 16 - (text.boxMm.yMm - 1);
    expect(text.x).toBeCloseTo(edgeAtBoxTop + 1.5, 2);
    // Die Box reicht mindestens vom Anker bis zur Körpermitte (F-a-Viertelzone).
    expect(text.boxMm.xMm + text.boxMm.widthMm).toBeGreaterThanOrEqual(16);
    expect(drawing.derivations?.[0]).toMatchObject({ dimension: 'labels.topLeft', basis: 'constructed' });
  });

  it('weicht oben links dem mittigen Lauf aus, wo der Körper es zulässt', () => {
    const alone = run({ kind: 'hazard', labels: { topLeft: '1' } }, '1').text;
    const { drawing, text } = run({ kind: 'hazard', labels: { center: 'AB', topLeft: '1' } }, '1');
    const center = runs(drawing).find((candidate) => candidate.content === 'AB');
    if (center === undefined) throw new Error('mittiger Lauf fehlt.');
    expect(text.boxMm.yMm + text.boxMm.heightMm).toBeLessThanOrEqual(center.boxMm.yMm);
    expect(text.y).toBeLessThan(alone.y);
  });

  it('setzt unten mittig 2,0 mm über die Unterkante, mit Fußband über das Band (G.1.2)', () => {
    const plain = run({ kind: 'vehicle-land', labels: { bottomCenter: 'SOZ' } }, 'SOZ');
    expect(plain.text.y).toBeCloseTo(bodyOf(plain.drawing).maxY - 2, 10);
    const banded = run({ kind: 'vehicle-land', bodyVariant: 'foot-band', organization: 'feuerwehr', labels: { bottomCenter: 'SEG' } }, 'SEG');
    expect(banded.text.y).toBeCloseTo(bodyOf(banded.drawing).maxY - 5, 10);
    expect(banded.drawing.derivations?.[0]).toMatchObject({ part: 'Lage unten mittig über dem Fußband' });
    // Die Formation mit Fußband erbte die 2,0 mm ungemessen und setzte den Lauf ins Band.
    const formation = run({ kind: 'formation', bodyVariant: 'foot-band', organization: 'feuerwehr', labels: { bottomCenter: 'SEG' } }, 'SEG');
    expect(formation.text.y).toBe(21);
  });

  it('lässt unten mittig den oberen Läufen ausweichen', () => {
    const { drawing, text } = run({ kind: 'event', labels: { topLeft: 'MTF', bottomCenter: 'BC' } }, 'BC');
    const top = runs(drawing).find((candidate) => candidate.content === 'MTF');
    if (top === undefined) throw new Error('oberer Lauf fehlt.');
    expect(text.boxMm.yMm).toBeGreaterThanOrEqual(top.boxMm.yMm + top.boxMm.heightMm);
  });

  it('überträgt die zweizeilige Zone mit dem F.2-Zeilenabstand von 4,0 mm', () => {
    const drawing = drawSymbol({ kind: 'formation', labels: { topLeftLines: ['GW', '50'] } });
    const [first, second] = runs(drawing);
    expect(first?.y).toBe(11);
    expect(second?.y).toBe(15);
    expect(first?.sizeMm).toBeCloseTo(2.919225 / ARIMO_CAP_HEIGHT_FRACTION, 10);
  });

  it('setzt oberhalb links 1 mm über die Oberkante (Festflügelprofil)', () => {
    const { drawing, text } = run({ kind: 'formation', labels: { aboveLeft: 'ITH' } }, 'ITH');
    expect(text.y).toBe(5);
    expect(text.x).toBeCloseTo(0.99, 10);
    expect(text.style?.fill).toBe('schwarz');
    expect(drawing.derivations?.[0]).toMatchObject({ dimension: 'labels.aboveLeft', basis: 'transferred' });
  });

  it('weicht oberhalb links neben die Körperspitze in die Ecke der Grundfläche aus', () => {
    for (const kind of ['person', 'building', 'hazard', 'point'] as const) {
      const { drawing, text } = run({ kind, labels: { aboveLeft: 'AL' } }, 'AL');
      expect(text.x, kind).toBe(1);
      expect(text.boxMm.yMm, kind).toBeGreaterThanOrEqual(0);
      // Die Box endet 1 mm vor dem Körper, der im Streifen der Versalhöhe liegt.
      expect(text.boxMm.xMm + text.boxMm.widthMm, kind).toBeLessThan(bodyOf(drawing).maxX - 2);
      expect(drawing.derivations?.[0], kind).toMatchObject({ basis: 'constructed' });
    }
  });

  it('wirft, wo oberhalb links kein Platz auf der Grundfläche bleibt', () => {
    expect(() => drawSymbol({ kind: 'measure', labels: { aboveLeft: 'AL' } })).toThrow(NotMeasuredError);
  });

  it('setzt unterhalb rechts 4,01 mm unter die Unterkante, in der Organisationsfarbe', () => {
    const { drawing, text } = run({ kind: 'formation', organization: 'thw', labels: { belowRight: 'THW' } }, 'THW');
    expect(text.x).toBeCloseTo(31.5618, 10);
    expect(text.y).toBeCloseTo(30.01, 10);
    expect(text.style?.fill).toBe('blau');
    expect(checkViewBox(drawing)).toEqual([]);
  });

  it('setzt unterhalb rechts ohne oder mit weißer Organisation schwarz (G.3.5)', () => {
    for (const organization of [undefined, 'hilfsorganisation'] as const) {
      const { text } = run({ kind: 'formation', ...(organization === undefined ? {} : { organization }), labels: { belowRight: 'X' } }, 'X');
      expect(text.style?.fill, organization).toBe('schwarz');
    }
    // Auch am vermessenen Wasserrumpf, wenn die Organisationsfarbe fehlt.
    const raised = run({ kind: 'vehicle-water', bodyVariant: 'raised-hull', labels: { belowRight: 'X' } }, 'X');
    expect(raised.text.style?.fill).toBe('schwarz');
    expect(raised.text.y).toBeCloseTo(bodyOf(raised.drawing).maxY + 4.01, 10);
  });

  it('setzt unterhalb rechts unter die Zusatzgeometrie und sonst neben den Körper', () => {
    const wings = run({ kind: 'vehicle-air', bodyVariant: 'raised-hull', labels: { belowRight: 'X' } }, 'X');
    // Flügel bis 27,0 mm: Grundlinie 4,01 mm darunter.
    expect(wings.text.y).toBeCloseTo(27 + 4.01, 3);
    const diamond = run({ kind: 'person', labels: { belowRight: 'BR' } }, 'BR');
    const box = verticalTextBoxMm(diamond.text.y, BOTTOM_SIZE_MM, 'alphabetic');
    expect(box.topMm + box.heightMm).toBeLessThanOrEqual(32);
    expect(diamond.text.x).toBe(31);
    // Rechts der Raute im Streifen: Kante 16 + (31 − Oberkante der Versalhöhe) plus 1 mm.
    expect(diamond.text.boxMm.xMm).toBeGreaterThan(16 + (31 - (diamond.text.y - 3.3)) + 0.9);
  });

  it('setzt die Oberflächenläufe 4,0 mm unter das Grundzeichen, Anker ±0,01 mm', () => {
    const drawing = drawSymbol({ kind: 'formation', labels: { surfaceBelowLeft: 'SL', surfaceBelowRight: 'SR' } });
    const [left, right] = runs(drawing);
    expect(left).toMatchObject({ content: 'SL', anchor: 'start', y: 30 });
    expect(right).toMatchObject({ content: 'SR', anchor: 'end', y: 30 });
    expect(left?.x).toBeCloseTo(0.99, 10);
    expect(right?.x).toBeCloseTo(31.01, 10);
  });

  it('setzt die Oberflächenläufe am Festflügel unter die Flügel', () => {
    const { text } = run({ kind: 'vehicle-air', bodyVariant: 'fixed-wing-hull', organization: 'feuerwehr', labels: { surfaceBelowRight: 'BW' } }, 'BW');
    // Flügelunterkante 27,53 mm: die Versalhöhe beginnt darunter.
    expect(text.y - 2.92).toBeGreaterThan(27.53);
    expect(verticalTextBoxMm(text.y, BOTTOM_SIZE_MM, 'alphabetic').topMm +
      verticalTextBoxMm(text.y, BOTTOM_SIZE_MM, 'alphabetic').heightMm).toBeLessThanOrEqual(32);
  });

  it('trägt an der eingesenkten Hülle die Zonen des angehobenen Wasserrumpfs und die Bezeichnung', () => {
    const drawing = drawSymbol({
      kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'hilfsorganisation',
      labels: { topLeft: 'MzB', aboveLeft: 'AL' }, designation: 'Boot 1',
    });
    expect(runs(drawing).map((text) => text.content)).toEqual(['AL', 'MzB']);
    expect(drawing.children.some((child) => child.type === 'text' && child.role === 'foot')).toBe(true);
    const fire = drawSymbol({
      kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'feuerwehr',
      bodyMarks: ['fire-fighting'], labels: { center: 'LF' },
    });
    expect(runs(fire).map((text) => text.content)).toEqual(['LF']);
  });
});

describe('abgeleitete Beschriftungszonen: vermessene Lagen bleiben ohne Notiz', () => {
  it.each([
    { kind: 'formation', labels: { topLeft: 'MTF', bottomCenter: 'SOZ' } },
    { kind: 'vehicle-land', labels: { topLeft: 'BTKombi', topLeftLines: ['Kipper,', '26 t'] } },
    { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', labels: { topLeftLines: ['GW-San', '50'] } },
    { kind: 'vehicle-air', bodyVariant: 'raised-hull', labels: { aboveLeft: 'ITH', surfaceBelowRight: 'BW' } },
    { kind: 'vehicle-water', bodyVariant: 'raised-hull', organization: 'thw', labels: { belowRight: 'THW' } },
    {
      kind: 'trailer',
      labels: { center: 'Tauchen', centerAnchorFromBodyLeftMm: 8.24, centerBaselineFromBodyBottomMm: 14.5, centerCapHeightMm: 2.919 },
    },
    { kind: 'trailer', labels: { center: 'X', centerBaselineFromBodyBottomMm: 14.5, centerCapHeightMm: 2.919 } },
  ] as SymbolSpec[])('%o', (spec) => {
    expect(drawSymbol(spec).derivations).toBeUndefined();
  });
});

describe('abgeleitete Beschriftungszonen: je-Spec-Maße an unvermessenen Hüllen', () => {
  it('zeichnet abweichende Grundlinie, Anker und Rand des mittigen Laufs an jeder Hülle', () => {
    const baseline = run({ kind: 'vehicle-air', labels: { center: 'X', centerBaselineFromBodyBottomMm: 6.5 } }, 'X');
    expect(baseline.text.y).toBeCloseTo(bodyOf(baseline.drawing).maxY - 6.5, 10);
    expect(baseline.drawing.derivations?.[0]).toMatchObject({ dimension: 'labels.centerBaselineFromBodyBottomMm' });

    const anchor = run({ kind: 'formation', labels: { center: 'T', centerAnchorFromBodyLeftMm: 8.24 } }, 'T');
    expect(anchor.text.x).toBeCloseTo(1 + 8.24, 10);
    expect(anchor.drawing.derivations?.[0]).toMatchObject({ dimension: 'labels.centerAnchorFromBodyLeftMm' });

    const margin = run({ kind: 'vehicle-land', labels: { center: 'X', centerBoxMarginMm: 0.5 } }, 'X');
    expect(margin.text.boxMm.xMm).toBeCloseTo(1.5, 10);
    expect(margin.drawing.derivations?.[0]).toMatchObject({ dimension: 'labels.centerBoxMarginMm' });
  });

  it('zeichnet Metriksätze oben links und unten rechts an jeder Hülle', () => {
    const topLeft = run({
      kind: 'trailer',
      labels: { topLeft: 'BT', topLeftMetrics: { capHeightMm: 2.191447, baselineFromBodyTopMm: 6.25, anchorFromBodyLeftMm: 1.5 } },
    }, 'BT');
    expect(topLeft.text.y).toBeCloseTo(5.75 + 6.25, 10);
    expect(topLeft.text.sizeMm).toBeCloseTo(2.191447 / ARIMO_CAP_HEIGHT_FRACTION, 10);
    expect(topLeft.drawing.derivations?.[0]).toMatchObject({ dimension: 'labels.topLeftMetrics' });

    const bottomRight = run({
      kind: 'formation',
      labels: { bottomRight: '7', bottomRightMetrics: { capHeightMm: 2.750245, baselineFromBodyTopMm: 13, anchorFromBodyLeftMm: 22, boxLeftFromBodyLeftMm: 19, boxWidthMm: 6 } },
    }, '7');
    expect(bottomRight.text).toMatchObject({ x: 23, y: 19, anchor: 'middle' });
    expect(bottomRight.drawing.derivations?.[0]).toMatchObject({ dimension: 'labels.bottomRightMetrics' });
  });
});

describe('abgeleitete Beschriftungszonen: Zonenkollisionen', () => {
  function rulesOf(spec: SymbolSpec): string[] {
    try {
      drawSymbol(spec);
      return [];
    } catch (error) {
      if (!(error instanceof CompositionError)) throw error;
      return error.issues.map((issue) => issue.rule);
    }
  }

  it('lehnt den Lauf oberhalb links neben einer Kopfzone ab', () => {
    expect(rulesOf({ kind: 'formation', strength: 'trupp', labels: { aboveLeft: 'ITH' } }))
      .toContain('above-left-label-head-conflict');
  });

  it.each([
    { kind: 'vehicle-land', vehicleCategory: 'kfz-kategorie-1', labels: { belowRight: 'THW' } },
    { kind: 'trailer', vehicleCategory: 'anhaenger-zwei-raeder', labels: { surfaceBelowLeft: 'X' } },
    { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', labels: { surfaceBelowRight: 'X' } },
    { kind: 'formation', labels: { belowRight: 'X', surfaceBelowRight: 'Y' } },
    { kind: 'vehicle-water', bodyVariant: 'raised-hull', organization: 'thw', labels: { belowRight: 'THW' }, designation: 'MzB' },
  ] as SymbolSpec[])('lehnt den geteilten Streifen unter dem Körper ab: %o', (spec) => {
    expect(rulesOf(spec)).toContain('below-body-zone-conflict');
  });

  it('lässt unterhalb rechts und den linken Oberflächenlauf nebeneinander zu', () => {
    expect(rulesOf({ kind: 'formation', labels: { belowRight: 'X', surfaceBelowLeft: 'Y' } })).toEqual([]);
  });
});

describe('vergrößerter mittiger Lauf (Versalhöhe über der Norm)', () => {
  // Vermessen ist eine Versalhöhe über 4,87 mm nur am 12-mm-Kreis (D.2.3 bis D.2.5, 7,3 mm). An
  // jeder anderen Hülle ist der große Lauf abgeleitet, damit die Platzprüfung ihn sieht: bis
  // zum 5. Oktober 2026 zeichnete der Motor „AB“ in 7,3 mm am Luftfahrzeug als vermessen und
  // ragte dabei aus dem Rumpf.
  it('notiert den großen Lauf an der Formation und zeichnet ihn', () => {
    const { drawing, text } = run({ kind: 'formation', labels: { center: 'LtS', centerCapHeightMm: 7.3 } }, 'LtS');
    expect(text.sizeMm * ARIMO_CAP_HEIGHT_FRACTION).toBeCloseTo(7.3, 10);
    expect(drawing.derivations).toEqual([
      expect.objectContaining({ dimension: 'labels.centerCapHeightMm', basis: 'transferred', from: expect.stringContaining('D.2.5') }),
    ]);
  });

  it('lehnt den großen Lauf ab, wo er nicht in den Körper passt', () => {
    expect(() => drawSymbol({ kind: 'vehicle-air', labels: { center: 'AB', centerCapHeightMm: 7.3 } }))
      .toThrow(NotMeasuredError);
    expect(() => drawSymbol({
      kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'feuerwehr',
      labels: { center: 'AB', centerCapHeightMm: 7.3 },
    })).toThrow(/breiter oder höher als der Körper/);
  });

  it('lässt kleinere vermessene Versalhöhen und den Kreis ohne Notiz', () => {
    expect(drawSymbol({ kind: 'formation', labels: { center: 'X', centerCapHeightMm: 3 } }).derivations)
      .toBeUndefined();
    const circle = drawSymbol({ kind: 'circle-12', labels: { center: 'M', centerCapHeightMm: 7.3 } });
    expect(circle.derivations?.map((note) => note.dimension) ?? []).not.toContain('labels.centerCapHeightMm');
  });
});
