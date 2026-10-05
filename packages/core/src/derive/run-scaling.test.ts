import { describe, expect, it } from 'vitest';
import type { Drawing, Primitive, SymbolSpec } from '@einsatzzeichen/schema';
import { boundsOfMm } from '../bounds.js';
import { drawSymbol } from '../default-ports.js';
import { ARIMO_CAP_HEIGHT_FRACTION } from '../render/text-policy.js';
import { uniformAbout } from './affine.js';
import {
  MIN_SCALED_RUN_CAP_HEIGHT_MM,
  composeAffine,
  invertAffine,
  isIdentityAffine,
  runsFollowingBody,
} from './run-scaling.js';

type Text = Extract<Primitive, { type: 'text' }>;

const run = (drawing: Drawing, content: string): Text => {
  const found = drawing.children.find(
    (child): child is Text => child.type === 'text' && child.content === content,
  );
  if (found === undefined) throw new Error(`Lauf „${content}“ fehlt.`);
  return found;
};
const cap = (text: Text): number => text.sizeMm * ARIMO_CAP_HEIGHT_FRACTION;
const capMiddle = (text: Text): number => text.y - cap(text) / 2;
const bodyOf = (drawing: Drawing) => boundsOfMm(drawing.children.find((child) => child.role === 'body')!);

describe('Ähnlichkeitsabbildungen', () => {
  it('verkettet und kehrt um', () => {
    const a = uniformAbout([16, 26], [16, 26], 0.5);
    const b = uniformAbout([0, 0], [3, 4], 2);
    const ab = composeAffine(a, b);
    expect(ab).toEqual({ sx: 1, sy: 1, tx: 16 * 0.5 + 0.5 * 3, ty: 26 * 0.5 + 0.5 * 4 });
    const back = composeAffine(invertAffine(a), a);
    expect(isIdentityAffine(back)).toBe(true);
    expect(isIdentityAffine(a)).toBe(false);
  });
});

describe('Läufe folgen dem verkleinerten Körper (LFH-987)', () => {
  const label = (content: string, sizeMm: number, y: number): Text => ({
    type: 'text', role: 'label', content, x: 16, y, sizeMm, anchor: 'middle', baseline: 'alphabetic',
    boxMm: { xMm: 2, yMm: y - sizeMm, widthMm: 28, heightMm: sizeMm * 1.2 }, minRenderPx: 37,
    style: { fill: 'weiss' },
  });

  it('bildet Lage, Grad, Box und Einsatzgrenze mit dem Körperfaktor ab', () => {
    const [mapped] = runsFollowingBody([label('AB', 7.0786, 18)], uniformAbout([16, 6], [16, 6], 0.75));
    const text = mapped as Text;
    expect(text.sizeMm).toBeCloseTo(7.0786 * 0.75, 3);
    expect(text.y).toBeCloseTo(6 + 12 * 0.75, 3);
    expect(text.boxMm.widthMm).toBeCloseTo(21, 3);
    expect(text.minRenderPx).toBe(Math.ceil((8 * 32) / text.sizeMm));
  });

  it('hält die Versalhöhe nicht unter dem kleinsten vermessenen Körperlauf, die Versalmitte bleibt', () => {
    const source = label('D', 4.2443, 24);
    const scale = uniformAbout([16, 6], [16, 6], 0.4);
    const [mapped] = runsFollowingBody([source], scale);
    const text = mapped as Text;
    expect(cap(text)).toBeCloseTo(MIN_SCALED_RUN_CAP_HEIGHT_MM, 4);
    const scaledMiddle = 6 + (capMiddle(source) - 6) * 0.4;
    expect(capMiddle(text)).toBeCloseTo(scaledMiddle, 3);
    expect(text.boxMm.yMm + text.boxMm.heightMm).toBeGreaterThan(text.y);
  });

  it('zeichnet Formation mit Giebel und Verwaltungsstufe samt mittigem Lauf', () => {
    const spec: SymbolSpec = {
      kind: 'formation', bodyVariant: 'raised-gable', administrativeLevel: 'gemeinde', labels: { center: 'AB' },
    };
    const drawing = drawSymbol(spec);
    const body = bodyOf(drawing);
    const text = run(drawing, 'AB');
    const k = (body.maxY - body.minY) / 20;
    expect(cap(text)).toBeCloseTo(Math.max(4.87 * k, MIN_SCALED_RUN_CAP_HEIGHT_MM), 2);
    // Die Versalmitte steht auf derselben relativen Körperhöhe wie an der Formation (C.1.2: 8 mm).
    expect((body.maxY - capMiddle(text)) / (body.maxY - body.minY)).toBeCloseTo((8 + 4.87 / 2) / 20, 2);
    expect(drawing.derivations).toContainEqual(expect.objectContaining({ dimension: 'labels', basis: 'transferred' }));
  });

  it('verkleinert den mittigen Lauf schon unter dem Giebel allein', () => {
    const drawing = drawSymbol({ kind: 'formation', bodyVariant: 'raised-gable', labels: { center: 'AB' } });
    const body = bodyOf(drawing);
    const k = (body.maxY - body.minY) / 20;
    expect(k).toBeLessThan(1);
    expect(cap(run(drawing, 'AB'))).toBeCloseTo(4.87 * k, 2);
  });

  it.each([
    { kind: 'formation', bodyVariant: 'raised-gable', strength: 'trupp', labels: { center: 'AB' } },
    { kind: 'formation', bodyVariant: 'raised-gable', administrativeLevel: 'gemeinde', labels: { center: 'AB', topLeft: 'C', bottomLeft: 'D', bottomRight: 'E' } },
    { kind: 'trailer', bodyVariant: 'raised-gable', unitGrouping: 'verband-i', labels: { center: 'AB' } },
  ] as const)('zeichnet %j, statt eine Lücke zu melden', (spec) => {
    const drawing = drawSymbol(spec as unknown as SymbolSpec);
    const body = bodyOf(drawing);
    for (const child of drawing.children) {
      if (child.type !== 'text') continue;
      expect(child.y).toBeLessThanOrEqual(body.maxY);
      expect(child.y - cap(child)).toBeGreaterThanOrEqual(body.minY);
    }
  });

  it('lässt Zeichnungen ohne verkleinerten Körper unberührt', () => {
    const plain = drawSymbol({ kind: 'formation', labels: { center: 'AB', bottomLeft: 'D' } });
    expect(run(plain, 'AB').sizeMm).toBeCloseTo(4.87 / ARIMO_CAP_HEIGHT_FRACTION, 6);
    expect(run(plain, 'D').sizeMm).toBeCloseTo(2.92 / ARIMO_CAP_HEIGHT_FRACTION, 6);
    expect(plain.derivations).toBeUndefined();
  });
});
