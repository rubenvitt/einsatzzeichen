import { describe, expect, it } from 'vitest';
import type { Primitive, StateId } from '@einsatzzeichen/schema';
import { boundsOfMm } from '../bounds.js';
import { PERSON_STATES } from '../geometry/pictograms/states/index.js';
import { NotMeasuredError } from '../not-measured.js';
import {
  PERSON_STATE_FRAMES,
  STATE_HINT_LAYOUTS,
  placeStates,
  type PlacedStatePart,
  type StatePlacement,
} from './state-placement.js';

/**
 * Gate der Zustandsplatzierung (LFH-577). Jede Zahl, die hier erwartet wird, ist an einer
 * Referenzdatei abgelesen; die Datei steht im Testnamen oder im Kommentar.
 */

function partsOf(placement: StatePlacement, zone: PlacedStatePart['zone']): PlacedStatePart[] {
  return placement.parts.filter((part) => part.zone === zone);
}

function onlyOfType<T extends Primitive['type']>(
  primitives: readonly Primitive[],
  type: T,
): Extract<Primitive, { type: T }>[] {
  return primitives.filter((primitive): primitive is Extract<Primitive, { type: T }> =>
    primitive.type === type,
  );
}

function expectNotMeasured(run: () => unknown, scope: 'value' | 'combination'): void {
  let caught: unknown;
  try {
    run();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(NotMeasuredError);
  expect((caught as NotMeasuredError).scope).toBe(scope);
}

const person = { kind: 'person' } as const;
const hazard = { kind: 'hazard' } as const;

describe('placeStates: ohne Zustand', () => {
  it('lässt Zeichenfläche und Körper unverändert', () => {
    const placement = placeStates({ carrier: person, states: [] });
    expect(placement.canvasMm).toEqual({ width: 32, height: 32 });
    expect(placement.baseAreaMm).toEqual({ minX: 0, minY: 0, maxX: 32, maxY: 32 });
    expect(placement.carrier).toBeNull();
    expect(placement.parts).toEqual([]);
  });
});

describe('placeStates: Personenzustand 5.8.8 am Grundzeichen person', () => {
  it('ersetzt den Körper durch die 26-mm-Raute um die Zeichenmitte (5.8.8.3)', () => {
    const placement = placeStates({ carrier: person, states: ['person-injured'] });
    expect(placement.canvasMm).toEqual({ width: 32, height: 32 });
    expect(placement.carrier?.frame).toBe('person-diamond-26mm');
    expect(placement.carrier?.hullMm).toEqual({ minX: 3, minY: 3, maxX: 29, maxY: 29 });
    expect(placement.carrier?.basis).toBe('measured');
    const [body] = partsOf(placement, 'body');
    expect(body?.value).toBe('person-injured');
    expect(body?.basis).toBe('measured');
    expect(body?.reference).toBe('5.8.8.3_Person Verletzt.svg');
    const [line] = onlyOfType(body?.primitives ?? [], 'line');
    expect(line).toMatchObject({ x1: 16, y1: 3, x2: 16, y2: 29 });
  });

  it('hebt die Raute bei den Transportzeichen um 2 mm an (5.8.8.12)', () => {
    const placement = placeStates({ carrier: person, states: ['person-to-be-transported'] });
    expect(placement.carrier?.frame).toBe('person-diamond-26mm-raised-2mm');
    expect(placement.carrier?.hullMm).toEqual({ minX: 3, minY: 1, maxX: 29, maxY: 27 });
  });

  it('senkt bei Wassergefahr eine 21-mm-Raute um 4,5 mm ab (5.8.8.9)', () => {
    const placement = placeStates({ carrier: person, states: ['person-in-water-danger'] });
    expect(placement.carrier?.frame).toBe('person-diamond-21mm-lowered-4-5mm');
    expect(placement.carrier?.hullMm).toEqual({ minX: 5.5, minY: 10, maxX: 26.5, maxY: 31 });
  });

  it('trennt die Eckmarken als Randlage ab: oben rechts B, TP, Kontamination, unten links II', () => {
    const affected = placeStates({ carrier: person, states: ['person-affected'] });
    expect(partsOf(affected, 'body')).toEqual([]);
    const [corner] = partsOf(affected, 'state-margin');
    expect(corner?.corner).toBe('top-right');
    expect(onlyOfType(corner?.primitives ?? [], 'text').map((text) => text.content)).toEqual(['B']);

    const contaminated = placeStates({ carrier: person, states: ['person-contaminated'] });
    const [dots] = partsOf(contaminated, 'state-margin');
    expect(dots?.corner).toBe('top-right');
    expect(dots?.primitives).toHaveLength(4);
    // Der Verletzungsstrich bleibt auf dem Körper: 5.8.8.6 zeichnet „kontaminiert" als verletzt.
    expect(onlyOfType(partsOf(contaminated, 'body')[0]?.primitives ?? [], 'line')).toHaveLength(1);

    const triage = placeStates({ carrier: person, states: ['person-injured-triage-category'] });
    const [roman] = partsOf(triage, 'state-margin');
    expect(roman?.corner).toBe('bottom-left');
    expect(roman?.primitives).toHaveLength(6);
  });

  it('trägt dieselbe Raute an der kompakten 26-mm-Fassung aus I.5.1', () => {
    const placement = placeStates({
      carrier: { kind: 'person', variant: 'compact-person-diamond-26mm' },
      states: ['person-dead'],
    });
    expect(placement.carrier?.frame).toBe('person-diamond-26mm');
  });

  it('hält die Rautenlage jeder 5.8.8-Zeichnung an ihrer Fassung fest', () => {
    for (const definition of PERSON_STATES) {
      const value = definition.id.replace(/^state\./u, '') as StateId;
      const frame = PERSON_STATE_FRAMES[PERSON_FRAME_OF[value] ?? 'person-diamond-26mm'];
      const diamond = definition.primitives[0];
      expect(diamond?.type, definition.referenceAsset).toBe('polyline');
      expect(boundsOfMm(diamond as Primitive), definition.referenceAsset).toEqual(frame.hullMm);
    }
  });
});

/** Die beiden Werte außerhalb der Standardlage; alle übrigen stehen in `person-diamond-26mm`. */
const PERSON_FRAME_OF: Partial<Record<StateId, keyof typeof PERSON_STATE_FRAMES>> = {
  'person-in-water-danger': 'person-diamond-21mm-lowered-4-5mm',
  'person-to-be-transported': 'person-diamond-26mm-raised-2mm',
  'person-in-transport': 'person-diamond-26mm-raised-2mm',
  'person-transported': 'person-diamond-26mm-raised-2mm',
};

describe('placeStates: Hinweis aus 5.8.1 an der Person (5.8.1_Beispiel 1–3)', () => {
  it('verbreitert die Fläche auf 36 × 32 mm und rückt die Grundfläche 4 mm nach rechts', () => {
    const placement = placeStates({
      carrier: person,
      states: ['person-injured', 'suspected-situation'],
    });
    expect(placement.canvasMm).toEqual({ width: 36, height: 32 });
    expect(placement.baseAreaMm).toEqual({ minX: 4, minY: 0, maxX: 36, maxY: 32 });
  });

  it('verkleinert den Träger auf eine 20-mm-Raute um (21 | 16) mit 0,4-mm-Strich (Beispiel 3)', () => {
    const placement = placeStates({
      carrier: person,
      states: ['person-injured', 'suspected-situation'],
    });
    expect(placement.carrier?.frame).toBe('person-diamond-20mm-beside-hint');
    expect(placement.carrier?.hullMm).toEqual({ minX: 11, minY: 6, maxX: 31, maxY: 26 });
    expect(placement.carrier?.primitives[0]?.style?.strokeWidth).toBe(0.4);
    const [body] = partsOf(placement, 'body');
    expect(body?.basis).toBe('measured');
    const [line] = onlyOfType(body?.primitives ?? [], 'line');
    // Beispiel 3: senkrechter Strich 20,8…21,2 mm, also Achse 21 und 0,4 mm stark.
    expect(line).toMatchObject({ x1: 21, y1: 6, x2: 21, y2: 26 });
    expect(line?.style?.strokeWidth).toBe(0.4);
  });

  it('setzt das Fragezeichen schwarz links neben die Raute, Achse x = 6,5 (Beispiel 3)', () => {
    const placement = placeStates({
      carrier: person,
      states: ['suspected-situation', 'person-injured'],
    });
    const [hint] = partsOf(placement, 'state-margin');
    expect(hint?.value).toBe('suspected-situation');
    expect(hint?.basis).toBe('measured');
    expect(hint?.reference).toBe('5.8.1_Beispiel 3.svg');
    const [dot] = onlyOfType(hint?.primitives ?? [], 'circle');
    // Punkt 6,05…6,95 × 19,6…20,5 mm.
    expect(dot).toMatchObject({ cx: 6.5, cy: 20.05, r: 0.45 });
    expect(dot?.style?.fill).toBe('schwarz');
    const [glyph] = onlyOfType(hint?.primitives ?? [], 'path');
    expect(glyph?.style?.stroke).toBe('schwarz');
    expect(glyph?.style?.strokeWidth).toBe(0.8);
    // Scheitel des Fragezeichens bei (6,5 | 10): erster Stützpunkt 2,5 mm links, 1,5 mm tiefer.
    expect(glyph?.d.startsWith('M 4 11.5 ')).toBe(true);
  });

  it('überträgt die Lage auf andere Werte derselben Rautenlage und kennzeichnet das', () => {
    const placement = placeStates({ carrier: person, states: ['person-dead', 'suspected-situation'] });
    expect(placement.carrier?.basis).toBe('transferred');
    expect(partsOf(placement, 'body')[0]?.basis).toBe('transferred');
    expect(partsOf(placement, 'state-margin')[0]?.basis).toBe('measured');
  });

  it('überträgt die Lage auf die Person ohne Personenzustand und kennzeichnet das', () => {
    const placement = placeStates({ carrier: person, states: ['suspected-situation'] });
    expect(placement.carrier?.frame).toBe('person-diamond-20mm-beside-hint');
    expect(placement.carrier?.basis).toBe('transferred');
    expect(partsOf(placement, 'body')).toEqual([]);
  });

  it('überträgt das Ausrufezeichen mit dem an 5.8.1.14_2 abgelesenen Versatz von 1 mm', () => {
    const placement = placeStates({ carrier: person, states: ['acute-situation', 'person-injured'] });
    const [hint] = partsOf(placement, 'state-margin');
    expect(hint?.basis).toBe('transferred');
    const [bar] = onlyOfType(hint?.primitives ?? [], 'line');
    expect(bar).toMatchObject({ x1: 7.5, y1: 10, x2: 7.5, y2: 18 });
    expect(bar?.style?.stroke).toBe('schwarz');
  });

  it('führt die Lagen als Daten, einmal je Träger', () => {
    expect(Object.keys(STATE_HINT_LAYOUTS).sort()).toEqual(['hazard', 'person']);
    expect(STATE_HINT_LAYOUTS.person.canvasMm).toEqual({ width: 36, height: 32 });
    expect(STATE_HINT_LAYOUTS.hazard.canvasMm).toEqual({ width: 32, height: 32 });
  });
});

describe('placeStates: Hinweis aus 5.8.1 an der Gefahr (5.8.1.13_2, 5.8.1.14_2)', () => {
  it('verkleinert das Dreieck auf (7,5 | 25), (19 | 6), (30,5 | 25) und setzt „!" rot bei x = 6', () => {
    const placement = placeStates({ carrier: hazard, states: ['acute-situation'] });
    expect(placement.canvasMm).toEqual({ width: 32, height: 32 });
    expect(placement.carrier?.frame).toBe('hazard-triangle-23mm-beside-hint');
    expect(placement.carrier?.hullMm).toEqual({ minX: 7.5, minY: 6, maxX: 30.5, maxY: 25 });
    expect(placement.carrier?.basis).toBe('measured');
    const [hint] = partsOf(placement, 'state-margin');
    expect(hint?.reference).toBe('5.8.1.14_Hinweis auf akute Situation_2.svg');
    const [bar] = onlyOfType(hint?.primitives ?? [], 'line');
    expect(bar).toMatchObject({ x1: 6, y1: 10, x2: 6, y2: 18 });
    expect(bar?.style).toMatchObject({ stroke: 'rot', strokeWidth: 0.8 });
    expect(onlyOfType(hint?.primitives ?? [], 'circle')[0]).toMatchObject({ cx: 6, cy: 20.05, r: 0.6 });
  });

  it('setzt „?" rot mit der Achse bei x = 5', () => {
    const placement = placeStates({ carrier: hazard, states: ['suspected-situation'] });
    const [hint] = partsOf(placement, 'state-margin');
    expect(hint?.basis).toBe('measured');
    expect(onlyOfType(hint?.primitives ?? [], 'circle')[0]).toMatchObject({ cx: 5, cy: 20.05, r: 0.6 });
    expect(onlyOfType(hint?.primitives ?? [], 'path')[0]?.style?.stroke).toBe('rot');
  });
});

describe('placeStates: abgeleitete Lagen (Entscheidung vom 02.10.2026)', () => {
  it('leitet Werte ohne Trägerbeleg ab, statt zu werfen, und kennzeichnet sie als übertragen', () => {
    const values: StateId[] = [
      'flooded-area',
      'explosion-hazard',
      'activity-slightly-increased-outage-up-to-25-percent',
      'damaged',
      'incipient-fire',
      'route-closed',
    ];
    for (const value of values) {
      const placement = placeStates({ carrier: person, states: [value] });
      const part = placement.parts.find((candidate) => candidate.value === value);
      expect(part?.basis, value).toBe('transferred');
      expect(part?.zone, value).toBe(value === 'damaged' ? 'body' : 'state-margin');
      expect(placement.carrier?.basis, value).toBe('transferred');
    }
  });

  it('leitet jede Tendenz in die Randlage rechts ab (`tendency-margin`)', () => {
    const placement = placeStates({ carrier: person, states: [], tendency: 'tendency-rising' });
    const [tendency] = partsOf(placement, 'tendency-margin');
    expect(tendency?.value).toBe('tendency-rising');
    expect(tendency?.basis).toBe('transferred');
  });

  it('leitet Zusammenstellungen ab, die kein Original zeigt', () => {
    const cases: { kind: 'person' | 'formation'; states: StateId[] }[] = [
      { kind: 'formation', states: ['suspected-situation'] },
      { kind: 'person', states: ['suspected-situation', 'acute-situation'] },
      { kind: 'person', states: ['person-in-water-danger', 'suspected-situation'] },
      { kind: 'person', states: ['person-transported', 'acute-situation'] },
    ];
    for (const { kind, states } of cases) {
      const placement = placeStates({ carrier: { kind }, states });
      expect(placement.carrier?.basis, states.join(' + ')).toBe('transferred');
      expect(partsOf(placement, 'state-margin').length, states.join(' + ')).toBeGreaterThan(0);
    }
    const lowered = placeStates({
      carrier: { kind: 'person', variant: 'compact-person-diamond-26mm-lowered-2mm' },
      states: ['person-injured'],
    });
    expect(lowered.carrier?.basis).toBe('transferred');
  });

  it('wirft weiter, wo die Systematik widerspricht: Personenzustand an Nicht-Person, zwei Personenzustände, Taktik', () => {
    expectNotMeasured(() => placeStates({ carrier: hazard, states: ['person-injured'] }), 'combination');
    expectNotMeasured(
      () => placeStates({ carrier: person, states: ['person-injured', 'person-rescued'] }),
      'combination',
    );
    expectNotMeasured(() => placeStates({ carrier: person, states: ['tactical-rescue'] }), 'value');
  });

  it('lehnt Werte ab, die nicht in `states` gehören, mit einem gewöhnlichen Fehler', () => {
    for (const value of ['weather-snowing', 'sick-animal', 'tendency-rising'] as StateId[]) {
      const run = () => placeStates({ carrier: person, states: [value] });
      expect(run).toThrow(Error);
      expect(run).not.toThrow(NotMeasuredError);
    }
    const wrongTendency = () =>
      placeStates({ carrier: person, states: [], tendency: 'person-injured' as never });
    expect(wrongTendency).toThrow(Error);
    expect(wrongTendency).not.toThrow(NotMeasuredError);
  });
});
