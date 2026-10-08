import { describe, expect, it } from 'vitest';
import type { Drawing, PictogramDefinition, Point, Primitive } from '@einsatzzeichen/schema';
import { boundsOfMm } from '../bounds.js';
import { ALL_PICTOGRAMS } from '../geometry/pictograms/index.js';
import { ARIMO_TEXT_METRICS } from '../geometry/text-metrics.js';
import { checkBox, checkCommands } from '../pictogram-gate.js';
import { checkTextMetrics } from '../text-metrics.js';
import {
  SKETCH_BLOCKS,
  SKETCH_BUS_BAR_MARGIN_MM,
  SKETCH_CONDITION_SIGN_HEIGHT_MM,
  SKETCH_NOTE_GAP_MM,
  SKETCH_PICTOGRAM_IDS,
  SKETCH_STROKE_WIDTH_MM,
  SKETCH_ZIGZAG_GROUND_MM,
  SKETCH_ZIGZAG_HEIGHT_MM,
  SKETCH_ZIGZAG_LENGTH_MM,
  busBar,
  busBarMinLength,
  commsArea,
  commsLink,
  conditionSign,
  conditionSignWidth,
  sketchPictogram,
} from './index.js';

/**
 * Gate der Kommunikationsskizze (LFH-1033): Bausteine der taktischen Fernmeldeskizze, die keine
 * Referenzdatei haben. Geprüft wird das Verhalten auf frei gesetzten Eingaben, nicht eine Ablesung
 * — jede Maßangabe steht in `SKETCH_BLOCKS` als vorgeschlagen.
 */

const EPS = 1e-9;

function texts(primitives: readonly Primitive[]): Extract<Primitive, { type: 'text' }>[] {
  return primitives.filter((p): p is Extract<Primitive, { type: 'text' }> => p.type === 'text');
}

function asDrawing(primitives: readonly Primitive[]): Drawing {
  return { viewBox: { width: 1000, height: 1000 }, children: primitives };
}

function strokes(primitives: readonly Primitive[]): Primitive[] {
  return primitives.filter((p) => p.style?.stroke !== undefined && p.style.stroke !== 'none');
}

function hull(primitives: readonly Primitive[]) {
  const all = primitives.map((p) => boundsOfMm(p));
  return {
    minX: Math.min(...all.map((b) => b.minX)),
    minY: Math.min(...all.map((b) => b.minY)),
    maxX: Math.max(...all.map((b) => b.maxX)),
    maxY: Math.max(...all.map((b) => b.maxY)),
  };
}

/** Summe der gezeichneten Strichlängen aller Polyzüge und Linien. */
function inkLength(primitives: readonly Primitive[]): number {
  let total = 0;
  for (const p of primitives) {
    if (p.type === 'line') total += Math.hypot(p.x2 - p.x1, p.y2 - p.y1);
    if (p.type === 'polyline') {
      for (let i = 1; i < p.points.length; i++) {
        const [ax, ay] = p.points[i - 1] as Point;
        const [bx, by] = p.points[i] as Point;
        total += Math.hypot(bx - ax, by - ay);
      }
    }
  }
  return total;
}

describe('Bedingungszeichen', () => {
  it('wächst um genau die Textbreite, die Höhe bleibt', () => {
    const kurz = conditionSign({ text: 'TMO 311', center: [0, 0] });
    const lang = conditionSign({ text: 'TMO BN_BOS Großschadenslage Nord', center: [0, 0] });
    expect(kurz.height).toBe(SKETCH_CONDITION_SIGN_HEIGHT_MM);
    expect(lang.height).toBe(SKETCH_CONDITION_SIGN_HEIGHT_MM);
    expect(lang.width).toBeGreaterThan(kurz.width + 20);
    expect(conditionSignWidth('TMO 311')).toBe(kurz.width);
  });

  it('ist ein Langsechseck mit Spitzen von halber Höhe, mittig um den Mittelpunkt', () => {
    const sign = conditionSign({ text: 'DMO 314_F*', center: [100, 50] });
    const outline = sign.outline.find((p) => p.type === 'polyline');
    expect(outline?.type).toBe('polyline');
    if (outline?.type !== 'polyline') return;
    expect(outline.closed).toBe(true);
    expect(outline.points).toHaveLength(6);
    const h = SKETCH_CONDITION_SIGN_HEIGHT_MM / 2;
    const [left, upperLeft, , right] = outline.points as Point[];
    expect(left?.[0]).toBeCloseTo(100 - sign.width / 2, 9);
    expect(left?.[1]).toBeCloseTo(50, 9);
    expect(right?.[0]).toBeCloseTo(100 + sign.width / 2, 9);
    expect(upperLeft?.[0]).toBeCloseTo(100 - sign.width / 2 + h, 9);
    expect(upperLeft?.[1]).toBeCloseTo(50 - h, 9);
    // Die Fläche deckt die Linie, auf der das Zeichen sitzt.
    expect(outline.style?.fill).toBe('weiss');
  });

  it('kürzt den Text nie: der Lauf passt in seine Box, die Box zwischen die Spitzenansätze', () => {
    for (const text of ['TMO 311', 'TMO BN_BOS Großschadenslage Nord', 'DMO 314_F*', 'Wjg']) {
      const sign = conditionSign({ text, center: [500, 500] });
      const [label] = texts(sign.label);
      expect(label?.content).toBe(text);
      expect(checkTextMetrics(asDrawing(sign.label), ARIMO_TEXT_METRICS), text).toEqual([]);
      const h = SKETCH_CONDITION_SIGN_HEIGHT_MM / 2;
      expect(label!.boxMm.xMm).toBeGreaterThanOrEqual(500 - sign.width / 2 + h - EPS);
      expect(label!.boxMm.xMm + label!.boxMm.widthMm).toBeLessThanOrEqual(500 + sign.width / 2 - h + EPS);
    }
  });

  it('setzt Strich und Text wie der Katalog', () => {
    const sign = conditionSign({ text: 'TMO 311', center: [0, 0] });
    for (const p of [...sign.outline, ...sign.label]) expect(p.role).toBe('pictogram');
    for (const p of strokes(sign.outline)) expect(p.style?.strokeWidth).toBe(SKETCH_STROKE_WIDTH_MM);
    expect(texts(sign.label)[0]?.fontWeight).toBe(500);
  });
});

describe('Sammelschiene', () => {
  it('ist nie kürzer als ihr Bedingungszeichen plus Überstand je Seite', () => {
    const min = busBarMinLength('TMO BN_BOS');
    expect(min).toBeCloseTo(conditionSignWidth('TMO BN_BOS') + 2 * SKETCH_BUS_BAR_MARGIN_MM, 9);
    const bar = busBar({ start: [10, 20], length: 5, text: 'TMO BN_BOS' });
    expect(bar.length).toBeCloseTo(min, 9);
    const [rail] = bar.rail;
    expect(rail?.type).toBe('line');
    if (rail?.type !== 'line') return;
    expect(rail.x2 - rail.x1).toBeCloseTo(min, 9);
    expect(rail.y1).toBe(20);
    expect(rail.y2).toBe(20);
  });

  it('behält eine längere Schiene und setzt das Zeichen in die Mitte', () => {
    const bar = busBar({ start: [0, 0], length: 200, text: 'DMO 314' });
    expect(bar.length).toBe(200);
    expect(bar.sign.center[0]).toBeCloseTo(100, 9);
    expect(bar.sign.center[1]).toBe(0);
  });

  it('hält das Zeichen in der Schiene, auch wenn die Mitte außerhalb verlangt wird', () => {
    const half = conditionSignWidth('DMO 314') / 2;
    const links = busBar({ start: [0, 0], length: 200, text: 'DMO 314', signCenterX: -50 });
    expect(links.sign.center[0]).toBeCloseTo(SKETCH_BUS_BAR_MARGIN_MM + half, 9);
    const rechts = busBar({ start: [0, 0], length: 200, text: 'DMO 314', signCenterX: 999 });
    expect(rechts.sign.center[0]).toBeCloseTo(200 - SKETCH_BUS_BAR_MARGIN_MM - half, 9);
  });
});

describe('Verbindungslinie', () => {
  it('leitergebunden und bestehend: ein glatter Polyzug ohne Marke und ohne Wort', () => {
    const link = commsLink({ path: [[0, 0], [100, 0]], medium: 'wire', status: 'existing' });
    expect(link.line).toHaveLength(1);
    expect(link.mark).toEqual([]);
    expect(link.word).toEqual([]);
    expect(inkLength(link.line)).toBeCloseTo(100, 9);
  });

  it('Funk trägt die Zickzack-Marke in der Mitte, gedreht und nie kopfstehend', () => {
    const link = commsLink({ path: [[0, 0], [-100, -100]], medium: 'radio', status: 'existing' });
    expect(link.anchor.point[0]).toBeCloseTo(-50, 9);
    expect(link.anchor.point[1]).toBeCloseTo(-50, 9);
    expect(link.anchor.angleDeg).toBeCloseTo(45, 9);
    const zigzag = link.mark.find((p) => p.type === 'polyline' && p.style?.stroke === 'schwarz');
    expect(zigzag?.type).toBe('polyline');
    if (zigzag?.type !== 'polyline') return;
    expect(zigzag.points).toHaveLength(7);
    const first = zigzag.points[0] as Point;
    const last = zigzag.points[6] as Point;
    expect(Math.hypot(last[0] - first[0], last[1] - first[1])).toBeCloseTo(SKETCH_ZIGZAG_LENGTH_MM, 9);
    // Mitte der Marke = Mitte des Verlaufs
    expect((first[0] + last[0]) / 2).toBeCloseTo(-50, 9);
    expect((first[1] + last[1]) / 2).toBeCloseTo(-50, 9);
    // Grund hinter der Marke unterbricht die Linie
    expect(link.mark.some((p) => p.style?.fill === 'weiss')).toBe(true);
  });

  it('legt den Winkel auf (−90°, 90°]', () => {
    const winkel = (to: Point) => commsLink({ path: [[0, 0], to], medium: 'radio', status: 'existing' }).anchor.angleDeg;
    expect(winkel([100, 0])).toBeCloseTo(0, 9);
    expect(winkel([-100, 0])).toBeCloseTo(0, 9);
    expect(winkel([0, 100])).toBeCloseTo(90, 9);
    expect(winkel([0, -100])).toBeCloseTo(90, 9);
    expect(winkel([100, -100])).toBeCloseTo(-45, 9);
  });

  it('setzt die Marke auf einem geknickten Verlauf in die Mitte des längsten Abschnitts, nie auf den Knick', () => {
    const link = commsLink({ path: [[0, 0], [0, 30], [70, 30]], medium: 'radio', status: 'existing' });
    expect(link.anchor.point[0]).toBeCloseTo(35, 9);
    expect(link.anchor.point[1]).toBeCloseTo(30, 9);
    expect(link.anchor.angleDeg).toBeCloseTo(0, 9);
    // Gesamtmitte läge genau auf dem Knick (30 von 60 mm)
    const knick = commsLink({ path: [[30, 20], [30, 50], [60, 50]], medium: 'radio', status: 'planned' });
    expect(knick.anchor.point[0]).toBeCloseTo(30, 9);
    expect(knick.anchor.point[1]).toBeCloseTo(35, 9);
    expect(knick.anchor.angleDeg).toBeCloseTo(90, 9);
  });

  it('„geplant“ hat einzelne Striche und das Wort, auch ohne Farbe unterscheidbar', () => {
    const link = commsLink({ path: [[0, 0], [100, 0]], medium: 'wire', status: 'planned' });
    expect(link.line.length).toBeGreaterThan(10);
    expect(inkLength(link.line)).toBeLessThan(100);
    expect(inkLength(link.line)).toBeGreaterThan(50);
    const [word] = texts(link.word);
    expect(word?.content).toBe('geplant');
    expect(checkTextMetrics(asDrawing(link.word), ARIMO_TEXT_METRICS)).toEqual([]);
    // unter der waagerechten Linie, mittig, 1,33 mm Luft zur Strichkante
    expect(word!.boxMm.yMm).toBeCloseTo(SKETCH_NOTE_GAP_MM + SKETCH_STROKE_WIDTH_MM / 2, 9);
    expect(word!.anchor).toBe('middle');
    expect(word!.x).toBeCloseTo(50, 9);
  });

  it('setzt das Wort neben eine senkrechte Linie, mit Abstand zur Marke', () => {
    const ohne = commsLink({ path: [[0, 0], [0, 100]], medium: 'wire', status: 'planned' });
    const mit = commsLink({ path: [[0, 0], [0, 100]], medium: 'radio', status: 'planned' });
    const [a] = texts(ohne.word);
    const [b] = texts(mit.word);
    // rechts der Linie, 1,33 mm Luft zur Strichkante
    expect(a!.boxMm.xMm).toBeCloseTo(SKETCH_NOTE_GAP_MM + SKETCH_STROKE_WIDTH_MM / 2, 9);
    // mit Marke: rechts neben Zickzack und Grund
    expect(b!.boxMm.xMm).toBeCloseTo(SKETCH_ZIGZAG_HEIGHT_MM / 2 + SKETCH_ZIGZAG_GROUND_MM + SKETCH_NOTE_GAP_MM + SKETCH_STROKE_WIDTH_MM / 2, 9);
    const breit = commsLink({ path: [[0, 0], [0, 100]], medium: 'wire', status: 'planned', clearanceMm: 16 / 3 });
    expect(texts(breit.word)[0]!.boxMm.xMm).toBeGreaterThan(b!.boxMm.xMm);
  });

  it.each([
    [[100, 100]],
    [[60, 100]],
    [[1, 100]],
    [[-100, 100]],
    [[100, 40]],
    [[-100, 40]],
    [[100, -40]],
    [[-1, -100]],
  ] as [Point][])('hält das Wort auch an einer schrägen Linie nach %j frei', (to) => {
    for (const medium of ['wire', 'radio'] as const) {
      const link = commsLink({ path: [[0, 0], to], medium, status: 'planned' });
      const { xMm, yMm, widthMm, heightMm } = texts(link.word)[0]!.boxMm;
      const corners: Point[] = [[xMm, yMm], [xMm + widthMm, yMm], [xMm, yMm + heightMm], [xMm + widthMm, yMm + heightMm]];
      const [nx, ny] = link.anchor.normal;
      const [px, py] = link.anchor.point;
      const signed = corners.map(([x, y]) => (x - px) * nx + (y - py) * ny);
      // alle Ecken auf derselben Seite, mindestens Luft + halber Strich (+ Marke) von der Linie
      const min = SKETCH_NOTE_GAP_MM + SKETCH_STROKE_WIDTH_MM / 2 + (medium === 'radio' ? SKETCH_ZIGZAG_HEIGHT_MM / 2 : 0);
      for (const d of signed) expect(d, `${medium} ${to.join('/')}`).toBeGreaterThanOrEqual(min - EPS);
      // Seite: rechts bei eher senkrechter, unten bei eher waagerechter Linie
      if (Math.abs(to[1]) > Math.abs(to[0])) expect(nx).toBeGreaterThan(0);
      else expect(ny).toBeGreaterThan(0);
    }
  });

  it('lässt den Grund der Marke längs nicht über den Zickzack hinausreichen, damit dessen Enden die Linie treffen', () => {
    const link = commsLink({ path: [[0, 0], [100, 0]], medium: 'radio', status: 'existing' });
    const ground = link.mark.find((p) => p.style?.fill === 'weiss');
    const zigzag = link.mark.find((p) => p.style?.stroke === 'schwarz');
    if (ground?.type !== 'polyline' || zigzag?.type !== 'polyline') throw new Error('Marke fehlt');
    const xs = ground.points.map(([x]) => x);
    expect(Math.min(...xs)).toBeCloseTo((zigzag.points[0] as Point)[0], 9);
    expect(Math.max(...xs)).toBeCloseTo((zigzag.points[6] as Point)[0], 9);
  });

  it.each([13, 26, 43 + 1 / 3, 52, 65, 156, 3, 100])('beginnt und endet „geplant“ mit einem Strich, ohne Splitter (%d mm)', (laenge) => {
    const link = commsLink({ path: [[0, 0], [laenge, 0]], medium: 'wire', status: 'planned' });
    const segments = link.line.map((p) => (p.type === 'polyline' ? p.points : []));
    expect((segments[0]![0] as Point)[0]).toBeCloseTo(0, 9);
    const last = segments.at(-1)!;
    expect((last.at(-1) as Point)[0]).toBeCloseTo(laenge, 9);
    for (const seg of segments) expect(inkLength([{ type: 'polyline', points: seg }])).toBeGreaterThan(0.5);
  });

  it.each([8 / 3, 4, 1])('zeigt auch auf einer kurzen geplanten Linie Strich und Lücke (%d mm)', (laenge) => {
    const link = commsLink({ path: [[0, 0], [laenge, 0]], medium: 'wire', status: 'planned' });
    expect(link.line.length).toBeGreaterThanOrEqual(2);
    expect(inkLength(link.line)).toBeLessThan(laenge);
  });

  it('lehnt nicht endliche Eingaben ab', () => {
    expect(() => commsArea({ x: 0, y: 0, width: Number.POSITIVE_INFINITY, height: 10, label: 'X' })).toThrow();
    expect(() => busBar({ start: [0, 0], length: Number.NaN, text: 'TMO 1' })).toThrow();
    expect(() => busBar({ start: [0, 0], length: 100, text: 'TMO 1', signCenterX: Number.NaN })).toThrow();
    expect(() => conditionSign({ text: 'TMO 1', center: [Number.NaN, 0] })).toThrow();
    expect(() => commsLink({ path: [[0, 0], [Number.POSITIVE_INFINITY, 0]], medium: 'wire', status: 'existing' })).toThrow();
  });

  it('lässt die Marke auf Wunsch weg (Zeichen der Verbindungsart sitzt dort)', () => {
    const link = commsLink({ path: [[0, 0], [100, 0]], medium: 'radio', status: 'existing', mark: false });
    expect(link.mark).toEqual([]);
  });

  it('lehnt einen Verlauf ohne Länge ab', () => {
    expect(() => commsLink({ path: [[0, 0], [0, 0]], medium: 'wire', status: 'existing' })).toThrow();
  });
});

describe('Bereich', () => {
  it('trägt eine Strich-Punkt-Grenze auf allen vier Seiten', () => {
    const area = commsArea({ x: 10, y: 20, width: 120, height: 80, label: 'Rückwärtiger Bereich' });
    const b = hull(area.boundary);
    expect(b.minX).toBeCloseTo(10, 9);
    expect(b.minY).toBeCloseTo(20, 9);
    expect(b.maxX).toBeCloseTo(130, 9);
    expect(b.maxY).toBeCloseTo(100, 9);
    const umfang = 2 * (120 + 80);
    expect(inkLength(area.boundary)).toBeLessThan(umfang * 0.9);
    expect(inkLength(area.boundary)).toBeGreaterThan(umfang * 0.5);
    // zwei Strichlängen: Strich und Punkt
    const laengen = new Set(
      area.boundary
        .filter((p) => p.type === 'polyline' && p.points.length === 2)
        .map((p) => (p.type === 'polyline' ? Math.round(inkLength([p]) * 100) / 100 : 0)),
    );
    expect(laengen.size).toBeGreaterThanOrEqual(2);
    for (const seite of ['oben', 'unten', 'links', 'rechts'] as const) {
      const auf = area.boundary.some((p) => {
        if (p.type !== 'polyline') return false;
        return p.points.every(([x, y]) =>
          seite === 'oben' ? Math.abs(y - 20) < EPS : seite === 'unten' ? Math.abs(y - 100) < EPS : seite === 'links' ? Math.abs(x - 10) < EPS : Math.abs(x - 130) < EPS,
        );
      });
      expect(auf, seite).toBe(true);
    }
  });

  it('setzt die Bezeichnung innen oben links', () => {
    const area = commsArea({ x: 10, y: 20, width: 120, height: 80, label: 'Rückwärtiger Bereich' });
    const [label] = texts(area.label);
    expect(label?.content).toBe('Rückwärtiger Bereich');
    expect(label!.anchor).toBe('start');
    expect(label!.boxMm.xMm).toBeGreaterThan(10);
    expect(label!.boxMm.yMm).toBeGreaterThan(20);
    expect(checkTextMetrics(asDrawing(area.label), ARIMO_TEXT_METRICS)).toEqual([]);
  });
});

describe('Zeichen außerhalb von J.1', () => {
  it('führt Melder, sonstige und Satellit, Melder und sonstige in beiden Darstellungen', () => {
    expect(SKETCH_PICTOGRAM_IDS).toEqual(['sketch.messenger', 'sketch.other', 'sketch.satellite']);
    for (const id of ['sketch.messenger', 'sketch.other'] as const) {
      const funk = sketchPictogram(id, 'primary');
      const leitung = sketchPictogram(id, 'alternative');
      // Funk = mit Zickzack, also mehr Striche
      expect(funk.primitives.length).toBeGreaterThan(leitung.primitives.length);
    }
    expect(() => sketchPictogram('sketch.satellite', 'alternative')).toThrow();
  });

  it('besteht die Piktogramm-Gates des Katalogs (Befehle, Box)', () => {
    for (const id of SKETCH_PICTOGRAM_IDS) {
      for (const variant of id === 'sketch.satellite' ? (['primary'] as const) : (['primary', 'alternative'] as const)) {
        const p = sketchPictogram(id, variant);
        const definition = p as unknown as PictogramDefinition;
        expect(checkCommands(definition), `${id} ${variant}`).toEqual([]);
        expect(checkBox(definition), `${id} ${variant}`).toEqual([]);
        expect(checkTextMetrics({ viewBox: p.viewBox, children: p.primitives }, ARIMO_TEXT_METRICS)).toEqual([]);
        for (const q of p.primitives) expect(q.role).toBe('pictogram');
        for (const q of strokes(p.primitives)) expect(q.style?.strokeWidth).toBe(SKETCH_STROKE_WIDTH_MM);
      }
    }
  });

  it('übernimmt die Satellitenschale aus J.1.12', () => {
    const satellit = sketchPictogram('sketch.satellite', 'primary');
    const sprache = ALL_PICTOGRAMS.find((p) => p.id === 'comms.satellite-voice');
    expect(sprache).toBeDefined();
    const schale = sprache!.primitives.slice(0, 2);
    expect(satellit.primitives.map((p) => ({ ...p }))).toEqual(schale.map((p) => ({ ...p })));
  });
});

describe('Kennzeichnung', () => {
  it('steht nicht im BBK-Katalog', () => {
    expect(ALL_PICTOGRAMS.some((p) => String(p.id).startsWith('sketch.'))).toBe(false);
  });

  it('führt je Baustein einen vorgeschlagenen Befund mit Herkunft', () => {
    expect(Object.keys(SKETCH_BLOCKS).sort()).toEqual(
      ['area', 'bus-bar', 'condition-sign', 'link-planned', 'link-radio', 'sketch.messenger', 'sketch.other', 'sketch.satellite'].sort(),
    );
    for (const [id, block] of Object.entries(SKETCH_BLOCKS)) {
      expect(block.geometry.status, id).toBe('proposed');
      expect(block.from.length, id).toBeGreaterThan(0);
      expect(['transferred', 'constructed']).toContain(block.basis);
    }
    expect(SKETCH_BLOCKS['sketch.satellite'].basis).toBe('transferred');
    expect(SKETCH_BLOCKS['link-radio'].basis).toBe('transferred');
  });
});
