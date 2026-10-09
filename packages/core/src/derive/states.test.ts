/**
 * Abgeleitete Lagen der Zustände (Entscheidung des Eigentümers vom 02.10.2026). Jede Zahl ist aus
 * einer vermessenen Lage hergeleitet; die Herleitung steht im Kommentar am Test.
 */
import type { Drawing, Primitive, SymbolSpec, ZoneBoundsMm } from '@einsatzzeichen/schema';
import { describe, expect, it } from 'vitest';
import { boundsOfMm } from '../bounds.js';
import { drawSymbol } from '../default-ports.js';
import { HEAD_GAP_MM } from '../layout/profiles.js';
import { placeStates, type PlacedStatePart } from '../layout/state-placement.js';
import { checkViewBox } from '../viewbox-gate.js';

const round3 = (value: number): number => Math.round(value * 1000) / 1000;

function body(drawing: Drawing): Primitive {
  const bodies = drawing.children.filter((child) => child.role === 'body');
  expect(bodies).toHaveLength(1);
  return bodies[0] as Primitive;
}

function union(primitives: readonly Primitive[]): ZoneBoundsMm {
  return primitives.map((p) => boundsOfMm(p)).reduce((a, b) => ({
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  }));
}

/** Tinte: Mittellinie plus halber Strich. */
function ink(primitives: readonly Primitive[]): ZoneBoundsMm {
  return primitives
    .map((p) => {
      const b = boundsOfMm(p);
      const stroke = p.style?.stroke;
      const half = p.type === 'text' || stroke === undefined || stroke === 'none' ? 0 : (p.style?.strokeWidth ?? 0.5) / 2;
      return { minX: b.minX - half, minY: b.minY - half, maxX: b.maxX + half, maxY: b.maxY + half };
    })
    .reduce((a, b) => ({
      minX: Math.min(a.minX, b.minX),
      minY: Math.min(a.minY, b.minY),
      maxX: Math.max(a.maxX, b.maxX),
      maxY: Math.max(a.maxY, b.maxY),
    }));
}

function drawn(spec: SymbolSpec): Drawing {
  const drawing = drawSymbol(spec);
  const issues = checkViewBox(drawing).filter((issue) => {
    const index = /^children\[(\d+)\]/u.exec(issue.primitive);
    return index === null || drawing.children[Number(index[1])]?.role !== 'foot';
  });
  expect(issues, JSON.stringify(spec)).toEqual([]);
  expect(drawing.derivations?.length, JSON.stringify(spec)).toBeGreaterThan(0);
  return drawing;
}

function expectBounds(actual: ZoneBoundsMm, expected: ZoneBoundsMm): void {
  for (const key of ['minX', 'minY', 'maxX', 'maxY'] as const) {
    expect(actual[key], key).toBeCloseTo(expected[key], 2);
  }
}

function parts(placement: ReturnType<typeof placeStates>, zone: PlacedStatePart['zone']): PlacedStatePart[] {
  return placement.parts.filter((part) => part.zone === zone);
}

/** Die Verkleinerung aus `5.8.1_Beispiel 3`: um (16 | 16) auf (21 | 16), Faktor 20/26. */
const SHRINK = 10 / 13;
const shrinkX = (x: number, toX = 21): number => round3(toX + (x - 16) * SHRINK);
const shrinkY = (y: number): number => round3(16 + (y - 16) * SHRINK);

describe('Hinweis-Randlage an jedem Träger (übertragen von 5.8.1_Beispiel 3)', () => {
  it('verkleinert die Formation wie die Personenraute und setzt „?" 4,5 mm links der Hülle', () => {
    const drawing = drawn({ kind: 'formation', states: ['suspected-situation'] });
    expect(drawing.viewBox).toEqual({ width: 36, height: 32 });
    // Formation 1…31 × 6…26 mm.
    expectBounds(boundsOfMm(body(drawing)), {
      minX: shrinkX(1),
      minY: shrinkY(6),
      maxX: shrinkX(31),
      maxY: shrinkY(26),
    });
    const placement = placeStates({ carrier: { kind: 'formation' }, states: ['suspected-situation'] });
    const [hint] = parts(placement, 'state-margin');
    expect(hint?.basis).toBe('transferred');
    const dot = hint?.primitives.find((p) => p.type === 'circle');
    // Achse = linke Hülle − 4,5 mm; Punkt wie an der Person r = 0,45, y = 20,05, schwarz.
    expect(dot).toMatchObject({ cx: round3(shrinkX(1) - 4.5), cy: 20.05, r: 0.45 });
    expect(dot?.style?.fill).toBe('schwarz');
  });

  it('übernimmt die Strichfarbe des Trägers für die Marke', () => {
    const placement = placeStates({ carrier: { kind: 'measure' }, states: ['acute-situation'] });
    const [hint] = parts(placement, 'state-margin');
    const stroke = placement.carrier?.primitives[0]?.style?.stroke;
    expect(hint?.primitives.find((p) => p.type === 'line')?.style?.stroke).toBe(stroke);
  });

  // Bis zum Fachreview vom 05.10.2026 (LFH-1064) standen hier „?" und „!" zugleich; seitdem
  // schließen sie sich aus (`state-hint-limit-exceeded`). Gestapelt wird weiter ein Hinweis mit
  // einem Gefahrenhinweis.
  it('stellt einen Hinweis und einen Gefahrenhinweis untereinander, mittig um y = 16 mit 1 mm Fuge', () => {
    const drawing = drawn({ kind: 'person', states: ['suspected-situation', 'explosion-hazard'] });
    const placement = placeStates({ carrier: { kind: 'person' }, states: ['explosion-hazard', 'suspected-situation'] });
    const [first, second] = parts(placement, 'state-margin');
    // Die Randlage ordnet nach dem Katalog: 5.8.1.5 vor 5.8.1.13.
    expect([first?.value, second?.value]).toEqual(['explosion-hazard', 'suspected-situation']);
    const a = ink(first?.primitives ?? []);
    const b = ink(second?.primitives ?? []);
    // Hinweishöhe 9,6…20,5 mm = 10,9 mm je Zelle.
    expect(round3(a.maxY - a.minY)).toBeCloseTo(10.9, 2);
    expect(round3(b.maxY - b.minY)).toBe(10.9);
    expect(round3(a.maxY)).toBe(15.5);
    expect(round3(b.minY)).toBe(16.5);
    expect(drawing.viewBox.height).toBe(32);
  });

  it('setzt Gefahrenhinweise 5.8.1.5 bis 5.8.1.12 auf Hinweishöhe in die Randlage', () => {
    const placement = placeStates({ carrier: { kind: 'vehicle-land' }, states: ['explosion-hazard'] });
    const [warning] = parts(placement, 'state-margin');
    expect(warning?.group).toBe('tactics-hazards');
    const box = ink(warning?.primitives ?? []);
    expect(round3(box.minY)).toBe(9.6);
    expect(round3(box.maxY - box.minY)).toBeCloseTo(10.9, 2);
    // Lichter Abstand zur Trägerhülle wie zwischen „?" und Raute: 11 − 9,4 = 1,6 mm.
    const hull = union(placement.carrier?.primitives ?? []);
    expect(round3(hull.minX - box.maxX)).toBeCloseTo(1.6, 2);
    // Strich der verkleinerten Figur: 2/3 wie 0,8 zu 1,2 mm am Hinweis.
    const strokes = (warning?.primitives ?? []).map((p) => p.style?.strokeWidth).filter((w) => w !== undefined);
    expect(strokes.length).toBeGreaterThan(0);
    for (const width of strokes) expect(width).toBeLessThan(0.5);
  });

  it('lässt Aktivität, Brand und Zugang ihre Zeichnung behalten und verbreitert die Fläche nach Bedarf', () => {
    const drawing = drawn({
      kind: 'trailer',
      states: ['activity-strongly-increased-total-outage', 'fully-developed-fire', 'route-closed'],
    });
    expect(drawing.viewBox.width).toBeGreaterThan(36);
    const placement = placeStates({
      carrier: { kind: 'trailer' },
      states: ['activity-strongly-increased-total-outage', 'fully-developed-fire', 'route-closed'],
    });
    const margins = parts(placement, 'state-margin');
    expect(margins.map((part) => part.group)).toEqual(['activity', 'fire', 'access']);
    // Keine zwei Randlagenteile überdecken sich, keiner den Träger.
    const boxes = margins.map((part) => ink(part.primitives));
    const carrier = ink(placement.carrier?.primitives ?? []);
    for (const [index, box] of boxes.entries()) {
      expect(box.maxX < carrier.minX || box.minY > carrier.maxY, margins[index]?.value).toBe(true);
      for (const other of boxes.slice(index + 1)) {
        const apart = box.maxX <= other.minX || other.maxX <= box.minX || box.maxY <= other.minY || other.maxY <= box.minY;
        expect(apart).toBe(true);
      }
      expect(box.minX).toBeGreaterThanOrEqual(1 - 1e-3);
    }
    // Die Grundfläche wandert mit, die Zeichenfläche wächst um denselben Betrag.
    expect(round3(placement.baseAreaMm.maxX - placement.baseAreaMm.minX)).toBe(32);
  });

  it('setzt an der Gefahr die vermessene Lage des Dreiecks und daneben weitere Werte', () => {
    const drawing = drawn({ kind: 'hazard', states: ['acute-situation', 'radioactivity-hazard'] });
    // Dreieck 23 mm breit (7,5…30,5), verschoben um die Verbreiterung.
    const triangle = boundsOfMm(body(drawing));
    expect(round3(triangle.maxX - triangle.minX)).toBe(23);
    expect(round3(triangle.minY)).toBe(6);
    expect(body(drawing).style?.strokeWidth).toBe(0.5);
  });
});

describe('Tendenz rechts neben dem Träger (gespiegelt zur Hinweis-Randlage)', () => {
  it('verkleinert den Träger um (15 | 16) und setzt die Tendenz 1,6 mm rechts der Hülle', () => {
    const drawing = drawn({ kind: 'formation', tendency: 'tendency-rising' });
    expectBounds(boundsOfMm(body(drawing)), {
      minX: shrinkX(1, 15),
      minY: shrinkY(6),
      maxX: shrinkX(31, 15),
      maxY: shrinkY(26),
    });
    const placement = placeStates({ carrier: { kind: 'formation' }, states: [], tendency: 'tendency-rising' });
    const [tendency] = parts(placement, 'tendency-margin');
    expect(tendency?.value).toBe('tendency-rising');
    expect(tendency?.group).toBe('tendency');
    const box = ink(tendency?.primitives ?? []);
    expect(round3(box.minX - shrinkX(31, 15))).toBeCloseTo(1.6, 2);
    expect(round3(box.minY)).toBe(9.6);
    expect(drawing.viewBox.width).toBe(round3(box.maxX + 1));
    expect(drawing.derivations?.some((note) => note.dimension === 'tendency')).toBe(true);
  });

  it('steht neben Hinweis-Randlage und Personenzustand zugleich', () => {
    const drawing = drawn({ kind: 'person', states: ['person-injured', 'suspected-situation'], tendency: 'tendency-falling' });
    // Die Raute bleibt die aus 5.8.1_Beispiel 3.
    expect(boundsOfMm(body(drawing))).toEqual({ minX: 11, minY: 6, maxX: 31, maxY: 26 });
    expect(drawing.viewBox.width).toBeGreaterThan(36);
  });
});

describe('Schadensgrad auf dem Körper (übertragen von L.8 und L.9)', () => {
  it('legt das Kreuz um die Körpermitte und behält das Größenverhältnis der Stufen', () => {
    const sizes = (['damaged', 'partially-destroyed', 'destroyed'] as const).map((value) => {
      const placement = placeStates({ carrier: { kind: 'formation' }, states: [value] });
      expect(placement.canvasMm).toEqual({ width: 32, height: 32 });
      expect(placement.carrier?.frame).toBe('body-in-place');
      const [damage] = parts(placement, 'body');
      const box = union(damage?.primitives ?? []);
      // Mitte der Formation (16 | 16).
      expect(round3((box.minX + box.maxX) / 2)).toBe(16);
      expect(round3((box.minY + box.maxY) / 2)).toBe(16);
      return box.maxX - box.minX;
    });
    // 5.8.4.3 füllt die kleinere Körperseite (20 mm); die anderen stehen im Verhältnis davor.
    expect(round3(sizes[2] as number)).toBeCloseTo(20, 2);
    expect(sizes[0]).toBeLessThan(sizes[1] as number);
    expect(sizes[1]).toBeLessThan(sizes[2] as number);
  });

  it('lässt den Träger unverändert, auch mit Organisation', () => {
    const plain = drawSymbol({ kind: 'formation', organization: 'thw' });
    const drawing = drawn({ kind: 'formation', organization: 'thw', states: ['damaged'] });
    expect(drawing.children.slice(0, plain.children.length)).toEqual(plain.children);
  });
});

describe('Personenzustand mit weiteren Angaben (übertragen von 5.8.8)', () => {
  it('bildet den Kopf mit der Person auf die Raute ab, 1 mm × 26/30 über ihr', () => {
    const drawing = drawn({ kind: 'person', strength: 'trupp', states: ['person-injured'] });
    const head = union(drawing.children.filter((child) => child.role === 'head'));
    const diamond = boundsOfMm(body(drawing));
    expect(round3(diamond.minY - head.maxY)).toBeCloseTo(HEAD_GAP_MM * (26 / 30), 2);
    // Der Verletzungsstrich folgt der Raute.
    const line = drawing.children.find((child) => child.type === 'line');
    expect(line).toMatchObject({ x1: 16, y1: diamond.minY, x2: 16, y2: diamond.maxY });
  });

  it('hebt den Kopf über die Wellen der Wassergefahr', () => {
    const drawing = drawn({ kind: 'person', strength: 'trupp', states: ['person-in-water-danger'] });
    const head = union(drawing.children.filter((child) => child.role === 'head'));
    const waves = union(drawing.children.filter((child) => child.type === 'path'));
    expect(head.maxY).toBeLessThan(waves.minY);
    expect(head.minY).toBeGreaterThanOrEqual(0);
  });

  it('verkleinert ein Zeichen, das mit Kopf über die Fläche reichte (5.8.8.12 an der kompakten Raute)', () => {
    const drawing = drawn({
      kind: 'person',
      bodyVariant: 'compact-person-diamond-26mm',
      strength: 'trupp',
      states: ['person-to-be-transported'],
    });
    const all = union(drawing.children.filter((child) => child.role !== 'foot'));
    expect(all.minY).toBeGreaterThanOrEqual(0);
    expect(all.maxY).toBeLessThanOrEqual(32);
  });

  it('senkt die Fassung an der abgesenkten Personenvariante, höchstens bis an den Rand', () => {
    const injured = placeStates({
      carrier: { kind: 'person', variant: 'compact-person-diamond-26mm-lowered-2mm' },
      states: ['person-injured'],
    });
    expect(injured.carrier?.hullMm).toEqual({ minX: 3, minY: 5, maxX: 29, maxY: 31 });
    const water = placeStates({
      carrier: { kind: 'person', variant: 'compact-person-diamond-26mm-lowered-2mm' },
      states: ['person-in-water-danger'],
    });
    // Raute 10…31 mm, Strich 0,5: bis 32 bleiben 0,75 mm.
    expect(water.carrier?.hullMm).toEqual({ minX: 5.5, minY: 10.75, maxX: 26.5, maxY: 31.75 });
  });

  it('setzt einen Hinweis neben die Transportfassung: Raute und Pfeil verkleinert wie in Beispiel 3', () => {
    const placement = placeStates({ carrier: { kind: 'person' }, states: ['person-transported', 'acute-situation'] });
    expect(placement.canvasMm).toEqual({ width: 36, height: 32 });
    // Raute 26 mm um (16 | 14) → 20 mm um (21 | 14,462).
    expect(placement.carrier?.hullMm).toEqual({
      minX: 11,
      minY: shrinkY(1),
      maxX: 31,
      maxY: shrinkY(27),
    });
    expect(parts(placement, 'body')[0]?.basis).toBe('transferred');
  });
});

describe('Mehrfeldproben: Zustand × weitere Angabe × Träger', () => {
  // Der ausführliche Mini-Zensus (alle Werte, alle Grundformen, Überlappungsprüfung) lief als
  // Skript beim Umbau; hier eine feste Stichprobe als Gate.
  const values: Partial<SymbolSpec>[] = [
    { states: ['suspected-situation'] },
    { states: ['suspected-situation', 'explosion-hazard'] },
    { states: ['explosion-hazard'] },
    { states: ['activity-moderately-increased-outage-up-to-50-percent'] },
    { states: ['partially-destroyed'] },
    { states: ['developed-fire'] },
    { states: ['one-way-traffic'] },
    { tendency: 'tendency-falling' },
  ];
  const extras: Partial<SymbolSpec>[] = [
    { organization: 'feuerwehr' },
    { labels: { center: 'AB' } },
    { designation: 'ABC' },
  ];
  const carriers: SymbolSpec[] = [
    { kind: 'formation' },
    { kind: 'vehicle-land' },
    { kind: 'person' },
    { kind: 'hazard' },
    { kind: 'building' },
  ];

  it('zeichnet jede Kombination in der Fläche und mit Ableitungsnotiz', () => {
    for (const carrier of carriers) {
      for (const value of values) {
        for (const extra of extras) drawn({ ...carrier, ...extra, ...value } as SymbolSpec);
      }
    }
  });

  it('zeichnet Zustand mit Stärke und mit Fähigkeit an der Formation', () => {
    for (const value of values) {
      drawn({ kind: 'formation', strength: 'gruppe', ...value } as SymbolSpec);
      const drawing = drawn({ kind: 'formation', capabilities: ['foam-agent'], ...value } as SymbolSpec);
      // Die Fähigkeit bleibt in der (verkleinerten) Trägerhülle.
      const hull = boundsOfMm(body(drawing));
      const pictogram = drawing.children.find((child) => child.type === 'group' && child.role === 'pictogram');
      const box = boundsOfMm(pictogram as Primitive);
      expect(box.minX).toBeGreaterThanOrEqual(hull.minX);
      expect(box.maxX).toBeLessThanOrEqual(hull.maxX);
      expect(box.minY).toBeGreaterThanOrEqual(hull.minY);
      expect(box.maxY).toBeLessThanOrEqual(hull.maxY);
    }
  });
});
