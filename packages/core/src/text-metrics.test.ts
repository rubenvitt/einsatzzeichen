import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWBOX_MM, type Drawing, type Primitive } from '@einsatzzeichen/schema';
import { uniformTextMetrics } from './test-support/text-metrics-double.js';
import {
  BOX_TOLERANCE_MM,
  checkTextMetrics,
  measureTextRun,
  textWidthMm,
  type TextMetrics,
} from './text-metrics.js';

type TextPrimitive = Extract<Primitive, { type: 'text' }>;

/** Jede Glyphe 0,5 em, „W" 1,0 em, „€" unbekannt — rechenbar, nicht Arimo. */
const metrics = uniformTextMetrics(0.5, { W: 1 }, ['€']);

function text(overrides: Partial<TextPrimitive>): TextPrimitive {
  return {
    type: 'text',
    content: 'ab',
    x: 10,
    y: 10,
    sizeMm: 4,
    anchor: 'start',
    baseline: 'alphabetic',
    boxMm: { xMm: 10, yMm: 6, widthMm: 10, heightMm: 6 },
    ...overrides,
  };
}

function drawing(...children: Primitive[]): Drawing {
  return { viewBox: DEFAULT_VIEWBOX_MM, children };
}

describe('textWidthMm()', () => {
  it('summiert ungekernte Laufweiten mal Schriftgrad', () => {
    expect(textWidthMm('abW', 4, metrics)).toEqual({ widthMm: 8, unknownCodepoints: [] });
  });

  it('meldet unbekannte Codepoints statt still eine Ersatzbreite anzunehmen', () => {
    const result = textWidthMm('a€b', 4, metrics);
    expect(result.unknownCodepoints).toEqual(['€']);
    // Die bekannten Glyphen werden trotzdem gezählt — der Aufrufer entscheidet, was er mit
    // dem Befund macht; die Breite allein ist ohne die unbekannte Glyphe aber nicht verlässlich.
    expect(result.widthMm).toBe(4);
  });

  it('zählt nach Codepoints, nicht nach UTF-16-Einheiten', () => {
    expect(textWidthMm('a\u{1F600}', 4, uniformTextMetrics(0.5)).widthMm).toBe(4);
  });
});

describe('measureTextRun()', () => {
  it('zieht Seitenbreiten der ersten und letzten Glyphe von der Tinte ab, nicht vom Vorschub', () => {
    // „a" mit 0,1 em links und 0,05 em rechts Seitenbreite: Tinte 0,35 em statt 0,5 em.
    const bearing = uniformTextMetrics(0.5, {}, [], { a: [0.1, 0.05] });
    const run = measureTextRun(text({ content: 'aba', anchor: 'start' }), bearing);
    expect(run.widthMm).toBeCloseTo(6, 9);
    expect(run.inkMinXMm).toBeCloseTo(10 + 0.4, 9);
    expect(run.inkMaxXMm).toBeCloseTo(16 - 0.2, 9);
    expect(run.inkWidthMm).toBeCloseTo(5.4, 9);
  });

  it('lässt Leerzeichen an den Enden keine Tinte beitragen', () => {
    const run = measureTextRun(text({ content: ' ab ', anchor: 'start' }), metrics);
    expect(run.widthMm).toBeCloseTo(8, 9);
    expect(run.inkMinXMm).toBeCloseTo(12, 9);
    expect(run.inkMaxXMm).toBeCloseTo(16, 9);
  });

  it('rechnet Kerning in Vorschub und Tinte ein, wenn die Quelle es kennt', () => {
    const kerned: TextMetrics = {
      ...metrics,
      kerningEm: (left, right) => (left === 0x61 && right === 0x62 ? -0.1 : undefined),
    };
    const run = measureTextRun(text({ content: 'abab', anchor: 'start' }), kerned);
    // 4 × 0,5 em − 2 × 0,1 em = 1,8 em × 4 mm.
    expect(run.widthMm).toBeCloseTo(7.2, 9);
    expect(run.inkMaxXMm).toBeCloseTo(17.2, 9);
  });

  it.each([
    ['start', 10, 14],
    ['middle', 8, 12],
    ['end', 6, 10],
  ] as const)('legt das Ink-Intervall nach anchor "%s" um x', (anchor, minMm, maxMm) => {
    const run = measureTextRun(text({ anchor }), metrics);
    expect(run.inkMinXMm).toBeCloseTo(minMm, 9);
    expect(run.inkMaxXMm).toBeCloseTo(maxMm, 9);
  });
});

describe('checkTextMetrics()', () => {
  it('liefert keinen Befund für einen passenden Lauf', () => {
    expect(checkTextMetrics(drawing(text({})), metrics)).toEqual([]);
  });

  it('meldet einen Lauf, der breiter ist als seine Box', () => {
    const issues = checkTextMetrics(drawing(text({ content: 'abcdef' })), metrics);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ rule: 'text-too-wide', primitive: 'children[0]' });
    expect(issues[0]?.detail).toContain('12 mm Tinte');
    expect(issues[0]?.detail).toContain('10 mm');
    expect(issues[0]?.detail).toContain('"abcdef"');
  });

  it('akzeptiert einen Lauf, der die Box bündig ausfüllt', () => {
    // 5 Glyphen × 0,5 em × 4 mm = 10 mm = Boxbreite.
    expect(checkTextMetrics(drawing(text({ content: 'abcde' })), metrics)).toEqual([]);
  });

  it('lässt genau einen Rasterpixel bei 8 px/mm über die Box hinaus, nicht mehr', () => {
    const withinTolerance = text({ content: 'abcde', boxMm: { xMm: 10, yMm: 6, widthMm: 10 - BOX_TOLERANCE_MM, heightMm: 6 } });
    expect(checkTextMetrics(drawing(withinTolerance), metrics)).toEqual([]);
    const beyond = text({ content: 'abcde', boxMm: { xMm: 10, yMm: 6, widthMm: 10 - BOX_TOLERANCE_MM - 0.001, heightMm: 6 } });
    expect(checkTextMetrics(drawing(beyond), metrics).map((issue) => issue.rule)).toEqual(['text-too-wide']);
  });

  it('meldet einen Lauf, der zwar passt, aber wegen seines Ankers aus der Box ragt', () => {
    // 4 mm breit, Anker end bei x = 10 → Tinte 6…10, Box beginnt bei 10.
    const issues = checkTextMetrics(drawing(text({ anchor: 'end' })), metrics);
    expect(issues.map((issue) => issue.rule)).toEqual(['text-outside-box']);
  });

  it.each(['start', 'middle', 'end'] as const)(
    'akzeptiert anchor "%s", wenn x zur Box passt',
    (anchor) => {
      const x = anchor === 'start' ? 10 : anchor === 'middle' ? 15 : 20;
      expect(checkTextMetrics(drawing(text({ anchor, x })), metrics)).toEqual([]);
    },
  );

  it('meldet unbekannte Glyphen als eigenen Befund (fail-closed)', () => {
    const issues = checkTextMetrics(drawing(text({ content: 'a€' })), metrics);
    expect(issues.map((issue) => issue.rule)).toEqual(['unknown-glyph']);
    expect(issues[0]?.detail).toContain('U+20AC');
  });

  it('meldet baseline "middle" als ungemessen statt zu werfen', () => {
    const issues = checkTextMetrics(drawing(text({ baseline: 'middle' })), metrics);
    expect(issues.map((issue) => issue.rule)).toEqual(['unmeasured-baseline']);
  });

  it('findet Läufe rekursiv in Gruppen und nennt ihren Pfad', () => {
    const group: Primitive = {
      type: 'group',
      transform: { translate: { dxMm: 5, dyMm: 5 } },
      children: [{ type: 'rect', x: 0, y: 0, width: 1, height: 1 }, text({ content: 'abcdef' })],
    };
    const issues = checkTextMetrics(drawing(group), metrics);
    expect(issues.map((issue) => [issue.rule, issue.primitive])).toEqual([
      ['text-too-wide', 'children[0].children[1]'],
    ]);
  });

  it('ist gegen Verschiebung und Drehung invariant — Box und Lauf teilen das Koordinatensystem', () => {
    // Anders als `boundsOfMm` (das eine gedrehte Textbox ablehnt) und `checkViewBox` (das sie
    // mitdreht) misst dieses Gate nur das Verhältnis von Lauf zu Box, und das ändert eine starre
    // Transformation nicht.
    const rotated = text({ transform: { rotate: { angle: 45, cx: 16, cy: 16 } } });
    expect(checkTextMetrics(drawing(rotated), metrics)).toEqual([]);
    const rotatedTooWide = text({
      content: 'abcdef',
      transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
    });
    expect(checkTextMetrics(drawing(rotatedTooWide), metrics).map((i) => i.rule)).toEqual([
      'text-too-wide',
    ]);
  });

  it('nennt die Rolle des Laufs im Befund, wenn er eine trägt', () => {
    const issues = checkTextMetrics(
      drawing(text({ role: 'foot', content: 'abcdef' })),
      metrics,
    );
    expect(issues[0]?.primitive).toBe('children[0] (foot)');
  });
});
