import { checkBox, checkClipping, checkCommands } from '@einsatzzeichen/core';
import { type Primitive } from '@einsatzzeichen/schema';
import { describe, expect, it } from 'vitest';
import type { CatalogPictogramDefinition } from '../catalog-definition.js';
import { PERSON_STATES } from './08-persons.js';

type Line = Extract<Primitive, { type: 'line' }>;
type Circle = Extract<Primitive, { type: 'circle' }>;
type Path = Extract<Primitive, { type: 'path' }>;
type Polyline = Extract<Primitive, { type: 'polyline' }>;

function viewBoxBody(item: CatalogPictogramDefinition): Primitive {
  return {
    type: 'rect',
    role: 'body',
    x: 0,
    y: 0,
    width: item.viewBox.width,
    height: item.viewBox.height,
  };
}

function definition(id: string, variant = 'primary'): CatalogPictogramDefinition {
  const found = PERSON_STATES.find((item) => item.id === id && item.variant === variant);
  if (found === undefined) throw new Error(`Fehlende Personendarstellung ${id}#${variant}`);
  return found;
}

function leavesOf(primitives: readonly Primitive[]): Primitive[] {
  const leaves: Primitive[] = [];
  for (const primitive of primitives) {
    if (primitive.type === 'group') leaves.push(...leavesOf(primitive.children));
    else leaves.push(primitive);
  }
  return leaves;
}

function linesOf(item: CatalogPictogramDefinition): Line[] {
  return leavesOf(item.primitives).filter((leaf): leaf is Line => leaf.type === 'line');
}

function circlesOf(item: CatalogPictogramDefinition): Circle[] {
  return leavesOf(item.primitives).filter((leaf): leaf is Circle => leaf.type === 'circle');
}

function pathsOf(item: CatalogPictogramDefinition): Path[] {
  return leavesOf(item.primitives).filter((leaf): leaf is Path => leaf.type === 'path');
}

function polylinesOf(item: CatalogPictogramDefinition): Polyline[] {
  return leavesOf(item.primitives).filter((leaf): leaf is Polyline => leaf.type === 'polyline');
}

function boxMaxX(item: CatalogPictogramDefinition): number {
  return item.box.xMm + item.box.widthMm;
}

describe('PERSON_STATES', () => {
  it('enthaelt 17 IDs und 18 Darstellungen in Kapitelreihenfolge', () => {
    expect(PERSON_STATES.map((item) => [
      item.section,
      item.id,
      item.variant,
      item.referenceAsset,
    ])).toEqual([
      ['5.8.8.1', 'state.person-uninjured', 'primary', '5.8.8.1_Person Unverletz.svg'],
      ['5.8.8.2', 'state.person-affected', 'primary', '5.8.8.2_Person Betroffen.svg'],
      ['5.8.8.3', 'state.person-injured', 'primary', '5.8.8.3_Person Verletzt.svg'],
      ['5.8.8.4', 'state.person-injured-triage-category', 'primary', '5.8.8.4_Person Verletzt_Sichtungskategorie.svg'],
      ['5.8.8.5', 'state.person-injured-transport-priority', 'primary', '5.8.8.5_Person Verletzt_Transportpriorität.svg'],
      ['5.8.8.6', 'state.person-contaminated', 'primary', '5.8.8.6_Person Kontaminiert.svg'],
      ['5.8.8.6', 'state.person-contaminated', 'alternative', '5.8.8.6_Person Kontaminiert_Alternative.svg'],
      ['5.8.8.7', 'state.person-dead', 'primary', '5.8.8.7_Person Tot.svg'],
      ['5.8.8.8', 'state.person-missing', 'primary', '5.8.8.8_Person Vermisst.svg'],
      ['5.8.8.9', 'state.person-in-water-danger', 'primary', '5.8.8.9_Person in Wassergefahr.svg'],
      ['5.8.8.10', 'state.person-in-distress', 'primary', '5.8.8.10_Person in Zwangslage.svg'],
      ['5.8.8.11', 'state.person-rescued', 'primary', '5.8.8.11_Person gerettet.svg'],
      ['5.8.8.12', 'state.person-to-be-transported', 'primary', '5.8.8.12_Person zu transportieren.svg'],
      ['5.8.8.13', 'state.person-in-transport', 'primary', '5.8.8.13_Transport einer Person.svg'],
      ['5.8.8.14', 'state.person-transported', 'primary', '5.8.8.14_Person transportiert.svg'],
      ['5.8.8.15', 'state.person-needing-special-care', 'primary', '5.8.8.15_Person besonders betreuungsbedürftig.svg'],
      ['5.8.8.16', 'state.person-care-dependent', 'primary', '5.8.8.16_Person pflegebedürftig.svg'],
      ['5.8.8.17', 'state.person-mobility-impaired', 'primary', '5.8.8.17_Person mobilitätseingeschränkt.svg'],
    ]);
    expect(new Set(PERSON_STATES.map((item) => item.id)).size).toBe(17);
    const contaminated = PERSON_STATES.filter((item) => item.id === 'state.person-contaminated');
    expect(contaminated.map((item) => item.variant).sort()).toEqual(['alternative', 'primary']);
    expect(new Set(contaminated.map((item) => item.title)).size).toBe(1);
  });

  it('ist tief eingefroren und jede Darstellung besteht Kommando-, Box- und ViewBox-Gate', () => {
    expect(Object.isFrozen(PERSON_STATES)).toBe(true);
    expect(Object.isFrozen(PERSON_STATES[0]?.primitives)).toBe(true);
    for (const item of PERSON_STATES) {
      expect(item.placement).toEqual({ mode: 'standalone' });
      expect(item.contrastPairs).toEqual([
        {
          foreground: 'schwarz',
          background: 'weiss',
          context: 'Zustandsmarke auf weißer Personenraute',
        },
        {
          foreground: 'schwarz',
          background: 'surface',
          context: 'Personendiamant und Zustandsmarke auf Ausgabeoberfläche',
        },
      ]);
      expect(checkCommands(item)).toEqual([]);
      expect(checkBox(item)).toEqual([]);
      expect(checkClipping(item, viewBoxBody(item))).toEqual([]);
      for (const leaf of leavesOf(item.primitives)) {
        expect(leaf.role).toBe('pictogram');
        expect(leaf.role).not.toBe('foot');
        expect(leaf.transform).toBeUndefined();
        if (leaf.style?.stroke !== undefined && leaf.style.stroke !== 'none') {
          expect(leaf.style.strokeWidth).toBe(0.5);
        }
      }
    }
  });

  it('zeichnet die Personenraute weiß gefüllt mit 13 mm halber Diagonale', () => {
    const diamond = polylinesOf(definition('state.person-uninjured'))[0];
    expect(diamond?.closed).toBe(true);
    expect(diamond?.points).toEqual([[16, 3], [29, 16], [16, 29], [3, 16]]);
    expect(diamond?.style).toEqual({ fill: 'weiss', stroke: 'schwarz', strokeWidth: 0.5 });
  });

  it('setzt B und TP als Text, II als gezeichnete Serifenziffern', () => {
    const textsOf = (id: string) =>
      leavesOf(definition(id).primitives).filter((leaf) => leaf.type === 'text');
    expect(textsOf('state.person-affected')).toMatchObject([
      { content: 'B', sizeMm: 7.1, y: 7, anchor: 'middle' },
    ]);
    expect(textsOf('state.person-injured-transport-priority')).toMatchObject([
      { content: 'TP', sizeMm: 7.1, y: 7, anchor: 'middle' },
    ]);

    const triage = definition('state.person-injured-triage-category');
    const rects = leavesOf(triage.primitives).filter((leaf) => leaf.type === 'rect');
    expect(rects).toHaveLength(6);
    expect(rects.every((rect) => rect.style?.fill === 'schwarz')).toBe(true);
    expect(triage.box).toEqual({ xMm: 2.55, yMm: 3, widthMm: 26.45, heightMm: 27 });
  });

  it('trennt beide Kontaminationsdarstellungen geometrisch', () => {
    const primary = definition('state.person-contaminated');
    expect(circlesOf(primary).map(({ cx, cy, r, style }) => [cx, cy, r, style?.fill])).toEqual([
      [22.5, 2, 1.75, 'schwarz'],
      [30, 2, 1.75, 'schwarz'],
    ]);
    const crossed = linesOf(primary).filter((line) => line.y1 === 8);
    expect(crossed.map(({ x1, y1, x2, y2 }) => [x1, y1, x2, y2])).toEqual([
      [22.5, 8, 28.939, 0.939],
      [29.5, 8, 23.561, 0.939],
    ]);
    expect(boxMaxX(primary)).toBe(31.75);

    const alternative = definition('state.person-contaminated', 'alternative');
    expect(circlesOf(alternative)).toEqual([]);
    expect(
      leavesOf(alternative.primitives).filter((leaf) => leaf.type === 'text'),
    ).toMatchObject([{ content: 'K' }]);
  });

  it('kodiert Tod, Vermisstsein und Wassergefahr mit verschiedenen Formkanaelen', () => {
    const dead = definition('state.person-dead');
    expect(linesOf(dead).map(({ x1, y1, x2, y2 }) => [x1, y1, x2, y2])).toEqual([
      [16, 3, 16, 29],
      [10, 10, 22, 10],
    ]);

    const missing = definition('state.person-missing');
    expect(linesOf(missing).map(({ x1, y1, x2, y2 }) => [x1, y1, x2, y2])).toEqual([
      [1, 14, 14, 1],
      [18, 31, 31, 18],
    ]);
    expect(missing.box).toEqual({ xMm: 1, yMm: 1, widthMm: 30, heightMm: 30 });

    const water = definition('state.person-in-water-danger');
    expect(polylinesOf(water)[0]?.points).toEqual([[16, 10], [26.5, 20.5], [16, 31], [5.5, 20.5]]);
    expect(pathsOf(water)).toHaveLength(2);
    expect(pathsOf(water).every((path) => path.d.startsWith('M 5 '))).toBe(true);
    expect(water.box).toEqual({ xMm: 5, yMm: 1, widthMm: 22, heightMm: 30 });
  });

  it('stellt Zwangslage und Rettung an gegenueberliegenden Diamantseiten dar', () => {
    const horizontalOf = (id: string): Line[] => linesOf(definition(id)).filter(
      (line) => line.y1 === line.y2,
    );
    expect(horizontalOf('state.person-in-distress').map((line) => line.y1)).toEqual([3]);
    expect(horizontalOf('state.person-rescued').map((line) => line.y1)).toEqual([29]);
  });

  it('kodiert die Transportfolge mit linker, keiner und rechter Abschlussmarke', () => {
    const transportSignature = (id: string) => {
      const item = definition(id);
      return {
        baselines: linesOf(item)
          .filter((line) => line.y1 === line.y2)
          .map(({ x1, y1, x2, y2 }) => [x1, y1, x2, y2]),
        terminals: linesOf(item)
          .filter((line) => line.x1 === line.x2)
          .map((line) => line.x1),
        arrows: polylinesOf(item)
          .filter((line) => line.closed !== true)
          .map((line) => line.points),
      };
    };

    expect(transportSignature('state.person-to-be-transported')).toEqual({
      baselines: [[3, 27, 30, 27]],
      terminals: [3],
      arrows: [[[26, 23], [30, 27], [26, 31]]],
    });
    expect(transportSignature('state.person-in-transport')).toEqual({
      baselines: [[3, 27, 30, 27]],
      terminals: [],
      arrows: [[[26, 23], [30, 27], [26, 31]]],
    });
    expect(transportSignature('state.person-transported')).toEqual({
      baselines: [[3, 27, 30, 27]],
      terminals: [30],
      arrows: [[[25.9, 23], [29.9, 27], [25.9, 31]]],
    });
  });

  it('haelt Betreuungs- und Mobilitaetsmarken auseinander', () => {
    const specialCare = definition('state.person-needing-special-care');
    expect(linesOf(specialCare).map(({ x1, y1, x2, y2 }) => [x1, y1, x2, y2])).toEqual([
      [16, 3, 5, 29],
      [16, 3, 27, 29],
    ]);

    const careDependent = definition('state.person-care-dependent');
    expect(linesOf(careDependent).map(({ x1, y1, x2, y2 }) => [x1, y1, x2, y2])).toEqual([
      [3, 10, 3, 22],
    ]);

    const mobility = definition('state.person-mobility-impaired');
    expect(circlesOf(mobility).map(({ cx, cy, r }) => [cx, cy, r])).toEqual([
      [7, 27, 2],
      [25, 27, 2],
    ]);
  });

  it('liefert 18 paarweise verschiedene Primitivsignaturen', () => {
    const signatures = PERSON_STATES.map((item) => JSON.stringify(item.primitives));
    expect(new Set(signatures).size).toBe(18);
  });
});
