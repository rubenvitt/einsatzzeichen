import type { Drawing, Primitive, SymbolSpec } from '@einsatzzeichen/schema';
import { describe, expect, it } from 'vitest';
import { boundsOfMm, type BoundsMm } from '../bounds.js';
import { compose } from '../compose.js';
import { DEFAULT_PORTS, drawSymbol } from '../default-ports.js';
import { administrativeHead } from '../geometry/administrative-heads.js';
import { unitGroupingHead } from '../geometry/unit-groupings.js';
import { NotMeasuredError } from '../not-measured.js';
import { checkViewBox } from '../viewbox-gate.js';
import { administrativeHeadOrDerived, unitGroupingHeadOrDerived } from './head-zone.js';

const round = (bounds: BoundsMm): BoundsMm => ({
  minX: Math.round(bounds.minX * 1000) / 1000,
  minY: Math.round(bounds.minY * 1000) / 1000,
  maxX: Math.round(bounds.maxX * 1000) / 1000,
  maxY: Math.round(bounds.maxY * 1000) / 1000,
});

function part(drawing: Drawing, role: string): Primitive {
  const found = drawing.children.find((child) => child.role === role);
  if (found === undefined) throw new Error(`kein Primitiv mit Rolle "${role}"`);
  return found;
}

const bodyOf = (drawing: Drawing): BoundsMm => round(boundsOfMm(part(drawing, 'body')));
const headOf = (drawing: Drawing): BoundsMm => round(boundsOfMm(part(drawing, 'head')));

/** Mittelachsen der senkrechten Sternstrahlen bzw. Balken eines Kopfs, relativ zur Kopfzone. */
function verticalAxes(primitives: readonly Primitive[]): number[] {
  return primitives
    .filter((p): p is Extract<Primitive, { type: 'rect' }> => p.type === 'rect' && p.transform === undefined)
    .map((p) => Math.round((p.x + p.width / 2) * 1000) / 1000);
}

describe('Kopfzone: vermessene Lagen bleiben ohne Ableitungsnotiz', () => {
  const measured: SymbolSpec[] = [
    { kind: 'formation', unitGrouping: 'verband-i' },
    { kind: 'formation', unitGrouping: 'verband-ii' },
    { kind: 'formation', bodyVariant: 'foot-band', unitGrouping: 'verband-i' },
    { kind: 'formation', bodyVariant: 'foot-band', unitGrouping: 'verband-ii' },
    { kind: 'formation', technicalHeadMark: 'single-vertical-bar' },
    { kind: 'formation', bodyVariant: 'foot-band', technicalHeadMark: 'double-vertical-bar' },
    ...(['trupp', 'gruppe', 'zug'] as const).flatMap((strength): SymbolSpec[] => [
      { kind: 'formation', strength },
      { kind: 'formation', bodyVariant: 'foot-band', strength },
    ]),
    { kind: 'person', unitGrouping: 'verband-i' },
    { kind: 'person', administrativeLevel: 'nationalstaat' },
    { kind: 'person', administrativeLevel: 'europaeische-union' },
  ];
  it.each(measured.map((spec) => [JSON.stringify(spec), spec] as const))('%s', (_, spec) => {
    expect(drawSymbol(spec).derivations).toBeUndefined();
  });

  it('hält das Fußband der Formation bei Trupp, Gruppe und Zug auf y 23…26', () => {
    for (const strength of ['trupp', 'gruppe', 'zug'] as const) {
      const drawing = drawSymbol({ kind: 'formation', bodyVariant: 'foot-band', strength });
      expect(round(boundsOfMm(part(drawing, 'pictogram'))), strength)
        .toEqual({ minX: 1, minY: 23, maxX: 31, maxY: 26 });
    }
  });
});

describe('Kopfzone an der Person (I.5.7, D.4.4, D.4.5)', () => {
  it('setzt den Verbandsbalken auf y 0…4 und die Raute auf 5…31 (I.5.7)', () => {
    const drawing = drawSymbol({ kind: 'person', unitGrouping: 'verband-i' });
    expect(headOf(drawing)).toEqual({ minX: 15.25, minY: 0, maxX: 16.75, maxY: 4 });
    expect(bodyOf(drawing)).toEqual({ minX: 3, minY: 5, maxX: 29, maxY: 31 });
  });

  it('setzt den Nationalstaat auf y 0…4 über die Raute 5…31 (D.4.4: Mitte 18, halbe Diagonale 13)', () => {
    const drawing = drawSymbol({ kind: 'person', administrativeLevel: 'nationalstaat' });
    expect(headOf(drawing).minY).toBe(0);
    expect(headOf(drawing).maxY).toBe(4);
    expect(bodyOf(drawing)).toEqual({ minX: 3, minY: 5, maxX: 29, maxY: 31 });
  });

  it('setzt die Europäische Union auf y 0…9 über die Raute 10…31 (D.4.5: Mitte 20,5)', () => {
    const drawing = drawSymbol({ kind: 'person', administrativeLevel: 'europaeische-union' });
    expect(headOf(drawing).minY).toBe(0);
    expect(headOf(drawing).maxY).toBe(9);
    expect(bodyOf(drawing)).toEqual({ minX: 5.5, minY: 10, maxX: 26.5, maxY: 31 });
  });

  it('lässt die Stärke an der Person bei y 1 (D.3.7), auch die Staffel', () => {
    expect(headOf(drawSymbol({ kind: 'person', strength: 'zug' })).minY).toBe(1);
    expect(headOf(drawSymbol({ kind: 'person', strength: 'staffel' })).minY).toBe(1);
  });

  it('notiert den Kreis an der Person als übertragen: D.4.1 setzt ihn neben die Rautenspitze', () => {
    const drawing = drawSymbol({ kind: 'person', administrativeLevel: 'kreis' });
    expect(drawing.derivations).toEqual([
      expect.objectContaining({ dimension: 'administrativeLevel', basis: 'transferred' }),
    ]);
  });
});

describe('Verwaltungsstufe: abgeleitete Köpfe Gemeinde, Bezirk, Bundesland', () => {
  it('lässt die vermessene Tabelle unverändert und ergänzt nur im Standardport', () => {
    for (const id of ['gemeinde', 'bezirk', 'bundesland'] as const) {
      expect(administrativeHead(id), id).toBeUndefined();
      expect(administrativeHeadOrDerived(id), id).toBeDefined();
    }
    expect(administrativeHeadOrDerived('kreis')).toBe(administrativeHead('kreis'));
  });

  it.each([
    ['gemeinde', [16]],
    ['bezirk', [11, 16, 21]],
    ['bundesland', [8.5, 13.5, 18.5, 23.5]],
  ] as const)('setzt %s auf die Sternachsen %j (5/6 der Kapitelteilung)', (id, axes) => {
    const head = administrativeHeadOrDerived(id)!;
    expect(verticalAxes(head.primitives)).toEqual(axes);
    expect(head.primitives).toHaveLength(axes.length * 3);
    expect(head.heightMm).toBe(4);
    expect(head.box.xMm).toBeCloseTo(axes[0]! - 1.857, 6);
  });

  it('prüft die 5/6-Regel an den beiden vermessenen Köpfen nach', () => {
    // Kapitel 10/22 → Körper 11/21 (Kreis), 4…28 → 6…26 (Nationalstaat).
    expect(verticalAxes(administrativeHead('kreis')!.primitives)).toEqual([11, 21]);
    expect(verticalAxes(administrativeHead('nationalstaat')!.primitives)).toEqual([6, 11, 16, 21, 26]);
  });

  it('übernimmt den Stern verbatim aus dem Kreiskopf', () => {
    const kreisStar = administrativeHead('kreis')!.primitives.slice(0, 3);
    const gemeinde = administrativeHeadOrDerived('gemeinde')!.primitives;
    expect(gemeinde.map((ray) => ray.type === 'rect' && [ray.width, ray.height, ray.transform?.rotate?.angle]))
      .toEqual(kreisStar.map((ray) => ray.type === 'rect' && [ray.width, ray.height, ray.transform?.rotate?.angle]));
  });

  it('zeichnet den Bezirk über der Formation auf y 1…5 und notiert Kopf und Lage', () => {
    const drawing = drawSymbol({ kind: 'formation', administrativeLevel: 'bezirk' });
    expect(headOf(drawing)).toEqual({ minX: 9.143, minY: 1, maxX: 22.857, maxY: 5 });
    expect(bodyOf(drawing)).toEqual({ minX: 1, minY: 6, maxX: 31, maxY: 26 });
    expect(drawing.derivations).toEqual([
      expect.objectContaining({ dimension: 'administrativeLevel', basis: 'constructed' }),
      expect.objectContaining({ dimension: 'administrativeLevel', basis: 'transferred' }),
    ]);
  });
});

describe('Verwaltungsstufe ohne Funktionsfassung: kein stilles Weglassen mehr', () => {
  it('zeichnet den Kopf in der allgemeinen Kopfzone', () => {
    const drawing = drawSymbol({ kind: 'formation', administrativeLevel: 'kreis' });
    const head = part(drawing, 'head');
    expect(head).toMatchObject({ type: 'group', transform: { translate: { dxMm: 0, dyMm: 1 } } });
    expect(head.type === 'group' && head.children).toEqual(administrativeHead('kreis')!.primitives);
  });

  it('meldet einen Portsatz ohne Kopf als nicht vermessenen Wert', () => {
    const partial = { ...DEFAULT_PORTS, administrativeHead: () => undefined };
    expect(() => compose({ kind: 'formation', administrativeLevel: 'gemeinde' }, partial))
      .toThrow(expect.objectContaining({ name: 'NotMeasuredError', scope: 'value' }));
  });
});

describe('Verband III', () => {
  it('setzt drei Balken auf x 12/16/20 aus dem Balken von Verband I', () => {
    expect(unitGroupingHead('verband-iii')).toBeUndefined();
    const head = unitGroupingHeadOrDerived('verband-iii')!;
    expect(verticalAxes(head.primitives)).toEqual([12, 16, 20]);
    expect(head.primitives.map((bar) => bar.type === 'rect' && [bar.width, bar.height]))
      .toEqual([[1.5, 4], [1.5, 4], [1.5, 4]]);
  });

  it('notiert Verband III über der Formation nur als konstruierten Kopf', () => {
    const drawing = drawSymbol({ kind: 'formation', unitGrouping: 'verband-iii' });
    expect(headOf(drawing)).toEqual({ minX: 11.25, minY: 1, maxX: 20.75, maxY: 5 });
    expect(drawing.derivations?.map((note) => note.basis)).toEqual(['constructed', 'transferred']);
  });
});

describe('Kopfzone an Körpern mit Zusatzgeometrie', () => {
  it('schiebt das Fußband mit der Staffel um dieselben 3 mm wie den Körper', () => {
    const drawing = drawSymbol({ kind: 'formation', bodyVariant: 'foot-band', strength: 'staffel' });
    expect(bodyOf(drawing)).toEqual({ minX: 1, minY: 9, maxX: 31, maxY: 29 });
    expect(round(boundsOfMm(part(drawing, 'pictogram')))).toEqual({ minX: 1, minY: 26, maxX: 31, maxY: 29 });
    expect(drawing.derivations).toEqual([
      expect.objectContaining({ dimension: 'strength', basis: 'transferred' }),
    ]);
  });

  it('schiebt die Deichsel des Anhängers um dasselbe Δy wie den Rumpf', () => {
    const plain = drawSymbol({ kind: 'trailer' });
    const drawing = drawSymbol({ kind: 'trailer', unitGrouping: 'verband-i' });
    const dy = bodyOf(drawing).minY - bodyOf(plain).minY;
    expect(dy).toBeCloseTo(0.25, 6);
    expect(boundsOfMm(part(drawing, 'bodyExtra')).minY - boundsOfMm(part(plain, 'bodyExtra')).minY)
      .toBeCloseTo(dy, 6);
  });

  it('hält die Fahrwerkszone unter dem verschobenen Landfahrzeug in der Grundfläche', () => {
    const drawing = drawSymbol({
      kind: 'vehicle-land',
      vehicleCategory: 'kfz-kategorie-1',
      unitGrouping: 'verband-ii',
    });
    const chassis = drawing.children.filter((child) => child.role === 'chassis');
    expect(chassis.length).toBeGreaterThan(0);
    for (const mark of chassis) expect(boundsOfMm(mark).maxY).toBeLessThanOrEqual(31);
  });
});

describe('Kopfzone an anderen Körperformen', () => {
  it('lässt einen tiefer liegenden Körper stehen und hängt den Kopf 1 mm darüber', () => {
    const drawing = drawSymbol({ kind: 'vehicle-water', administrativeLevel: 'kreis' });
    expect(bodyOf(drawing)).toEqual(bodyOf(drawSymbol({ kind: 'vehicle-water' })));
    expect(headOf(drawing).minY).toBe(4);
    expect(headOf(drawing).maxY).toBe(8);
  });

  it('verkleinert einen Körper, der unter dem Kopf nicht mehr in die Grundfläche passt', () => {
    const drawing = drawSymbol({ kind: 'point', administrativeLevel: 'kreis' });
    expect(bodyOf(drawing)).toEqual({ minX: 9.333, minY: 6, maxX: 22.667, maxY: 31 });
    expect(drawing.derivations?.map((note) => note.part)).toContainEqual(
      expect.stringContaining('verkleinert'),
    );
  });

  it('verkleinert das Gebäude unter dem 9-mm-Kopf der Europäischen Union', () => {
    const drawing = drawSymbol({ kind: 'building', administrativeLevel: 'europaeische-union' });
    expect(headOf(drawing).maxY).toBe(10);
    expect(bodyOf(drawing).minY).toBe(11);
    expect(bodyOf(drawing).maxY).toBe(31);
  });

  it('hält mit abgeleitetem Kopf auch die Fußzone in der Grundfläche', () => {
    // Die Formation bleibt unverändert (Fuß 27…31); das Gebäude rückte sonst um 3 mm nach unten
    // und schöbe die Bezeichnung unter den Rand.
    const formation = drawSymbol({ kind: 'formation', administrativeLevel: 'kreis', designation: 'X' });
    expect(bodyOf(formation)).toEqual({ minX: 1, minY: 6, maxX: 31, maxY: 26 });
    expect(checkViewBox(formation)).toEqual([]);
    const building = drawSymbol({ kind: 'building', administrativeLevel: 'kreis', designation: 'X' });
    expect(bodyOf(building).maxY).toBe(26);
    expect(checkViewBox(building)).toEqual([]);
  });

  it('lehnt die Kopfzone über einem Lauf oberhalb links als Zonenkollision ab, statt zu überdecken', () => {
    for (const spec of [
      { kind: 'vehicle-air', bodyVariant: 'raised-hull', administrativeLevel: 'kreis', labels: { aboveLeft: 'ITH' } },
      { kind: 'vehicle-air', bodyVariant: 'fixed-wing-hull', unitGrouping: 'verband-ii', labels: { aboveLeft: 'A' } },
    ] satisfies SymbolSpec[]) {
      // Seit der Freigabe der Beschriftungszonen fängt das die Systematikregel ab.
      expect(() => drawSymbol(spec), spec.bodyVariant).toThrow(/above-left-label-head-conflict/);
    }
    // Ohne Überschneidung bleibt die Kombination zeichenbar.
    expect(() => drawSymbol({ kind: 'formation', unitGrouping: 'verband-i', labels: { center: 'AB' } }))
      .not.toThrow();
  });

  it('lehnt eine weiße Innenkontur am verkleinerten Körper ab, statt das Innenfeld zu verfehlen', () => {
    expect(() => drawSymbol({
      kind: 'building',
      technicalFill: 'rot',
      whiteInnerContour: true,
      administrativeLevel: 'europaeische-union',
    })).toThrow(NotMeasuredError);
  });
});

describe('Kopfzone über Zusatzgeometrie oberhalb des Körpers', () => {
  it('setzt die Verwaltungsstufe über den Giebel der ortsfesten Stelle, nicht hinein', () => {
    const drawing = drawSymbol({
      kind: 'circle-12',
      bodyVariant: 'raised-gable',
      organization: 'fuehrung-leitung',
      administrativeLevel: 'kreis',
    });
    const flatten = (children: readonly Primitive[]): Primitive[] =>
      children.flatMap((child) => (child.type === 'group' ? [child, ...flatten(child.children)] : [child]));
    const all = flatten(drawing.children);
    const headBottom = Math.max(
      ...all.filter((p) => p.role === 'head' && p.type !== 'group').map((p) => boundsOfMm(p).maxY),
    );
    const baseTop = Math.min(
      ...all.filter((p) => p.role === 'body' || p.role === 'bodyExtra').map((p) => boundsOfMm(p).minY),
    );
    expect(headBottom).toBeLessThanOrEqual(baseTop);
  });
});
