import { describe, expect, it } from 'vitest';
import { PLACE_IDS, type Primitive, type SymbolSpec } from '@einsatzzeichen/schema';
import { drawSymbol } from './default-ports.js';
import { functionRole } from './geometry/function-roles.js';
import { PLACES, drawPlace } from './places.js';
import { checkSpec } from './vocabulary.js';

const D25_FILE = 'D.2.5_Leitstelle.svg';

function runs(spec: SymbolSpec): string[] {
  return drawSymbol(spec).children
    .filter((child): child is Extract<Primitive, { type: 'text' }> => child.type === 'text')
    .map((run) => run.content);
}

describe('PLACES', () => {
  it('führt jede Ortskennung genau einmal, unter ihrer eigenen Kennung', () => {
    expect(Object.keys(PLACES)).toEqual([...PLACE_IDS]);
    for (const id of PLACE_IDS) expect(PLACES[id].id).toBe(id);
  });

  it('baut jeden Ort wie die Leitstelle: Kreis, Giebel, Kappe, Führung und Leitung', () => {
    for (const id of PLACE_IDS) {
      expect(PLACES[id].spec).toMatchObject({
        kind: 'circle-12',
        bodyVariant: 'raised-gable',
        organization: 'fuehrung-leitung',
        bodyMarks: ['circle-solid-cap-4mm'],
      });
    }
  });

  it('setzt an keinem Ort eine Funktion: die Sperre bleibt Systematik', () => {
    for (const id of PLACE_IDS) expect(PLACES[id].spec.functionRole).toBeUndefined();
    const check = checkSpec({ kind: 'circle-12', organization: 'fuehrung-leitung', functionRole: 'incident-command' });
    expect(check.ok).toBe(false);
    if (!check.ok && check.reason === 'rule') {
      expect(check.issues.map((issue) => issue.rule)).toContain('function-role-requires-measured-kind');
    }
  });

  it('ist nur an der Leitstelle vermessen', () => {
    expect(PLACE_IDS.filter((id) => PLACES[id].source.basis === 'measured')).toEqual(['control-center']);
  });

  it('nennt an jedem abgeleiteten Ort beide Gegenstücke mit demselben Kürzel', () => {
    for (const id of PLACE_IDS.filter((place) => PLACES[place].source.basis === 'derived')) {
      const entry = PLACES[id];
      const kinds = entry.counterparts.map((role) => functionRole(role).kind);
      expect(kinds, id).toContain('person');
      expect(kinds, id).toContain('formation');
      for (const role of entry.counterparts) {
        expect(functionRole(role).layout.roleRuns[0]?.content, `${id} ↔ ${role}`).toBe(entry.spec.labels?.center);
      }
    }
  });
});

describe('drawPlace', () => {
  it('zeichnet die Leitstelle wie ihre Spec und ohne Ableitungsnotiz', () => {
    const drawing = drawPlace('control-center');
    expect(drawing).toEqual(drawSymbol(PLACES['control-center'].spec, { title: 'Leitstelle' }));
    expect(drawing.derivations).toBeUndefined();
  });

  it('kennzeichnet jeden abgeleiteten Ort mit genau einer Ortsnotiz aus D.2.5', () => {
    for (const id of PLACE_IDS.filter((place) => PLACES[place].source.basis === 'derived')) {
      const drawing = drawPlace(id);
      const notes = (drawing.derivations ?? []).filter((note) => note.dimension === 'place');
      expect(notes, id).toEqual([
        { dimension: 'place', part: expect.stringContaining(PLACES[id].title), basis: 'transferred', from: D25_FILE },
      ]);
      expect(drawing.title).toBe(PLACES[id].title);
    }
  });

  it('zeichnet die Einsatzleitung sonst vollständig vermessen: Kürzel „EL“ in Leitstellengröße', () => {
    const drawing = drawPlace('incident-command');
    expect(drawing.derivations?.map((note) => note.dimension)).toEqual(['place']);
    expect(runs(PLACES['incident-command'].spec)).toEqual(['EL']);
    const run = drawing.children.find(
      (child): child is Extract<Primitive, { type: 'text' }> => child.type === 'text',
    );
    const leitstelle = drawPlace('control-center').children.find(
      (child): child is Extract<Primitive, { type: 'text' }> => child.type === 'text',
    );
    expect(run?.style?.fill).toBe('schwarz');
    expect(run?.sizeMm).toBe(leitstelle?.sizeMm);
    expect(run?.y).toBe(leitstelle?.y);
  });

  it('behält die Notizen des Motors vor der Ortsnotiz', () => {
    const drawing = drawPlace('incident-subsection-command');
    expect(drawing.derivations?.at(-1)?.dimension).toBe('place');
    expect(drawing.derivations?.length).toBeGreaterThan(1);
  });

  it('übernimmt einen eigenen Titel', () => {
    expect(drawPlace('incident-command', { title: 'EL Nord' }).title).toBe('EL Nord');
  });
});
