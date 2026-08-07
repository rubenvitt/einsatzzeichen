import { checkBox, checkClipping, checkCommands } from '@einsatzzeichen/core';
import { DEFAULT_VIEWBOX_MM, type Primitive } from '@einsatzzeichen/schema';
import { describe, expect, it } from 'vitest';
import type { CatalogPictogramDefinition } from '../catalog-definition.js';
import { PERSON_STATES } from './08-persons.js';

type Line = Extract<Primitive, { type: 'line' }>;
type Circle = Extract<Primitive, { type: 'circle' }>;
type Path = Extract<Primitive, { type: 'path' }>;
type Polyline = Extract<Primitive, { type: 'polyline' }>;

const VIEWBOX_BODY: Primitive = {
  type: 'rect',
  role: 'body',
  x: 0,
  y: 0,
  width: DEFAULT_VIEWBOX_MM.width,
  height: DEFAULT_VIEWBOX_MM.height,
};

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

function boxMaxY(item: CatalogPictogramDefinition): number {
  return item.box.yMm + item.box.heightMm;
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
      expect(item.contrastPairs).toEqual([{
        foreground: 'schwarz',
        background: 'surface',
        context: 'Personendiamant und Zustandsmarke auf Ausgabeoberfläche',
      }]);
      expect(checkCommands(item)).toEqual([]);
      expect(checkBox(item)).toEqual([]);
      expect(checkClipping(item, VIEWBOX_BODY)).toEqual([]);
      for (const leaf of leavesOf(item.primitives)) {
        expect(leaf.role).toBe('pictogram');
        expect(leaf.role).not.toBe('foot');
        expect(leaf.transform).toBeUndefined();
      }
    }
  });

  it('setzt B, II und TP als Geometrie ausserhalb des Grunddiamanten um', () => {
    const affected = definition('state.person-affected');
    expect(pathsOf(affected)).toHaveLength(2);
    expect(pathsOf(affected).filter((path) => path.d.includes('C'))).toHaveLength(1);
    expect(boxMaxX(affected)).toBe(31);

    const triage = definition('state.person-injured-triage-category');
    const triageMark = linesOf(triage).filter((line) =>
      Math.max(line.x1, line.x2) <= 10.5 && Math.min(line.y1, line.y2) >= 23.5,
    );
    expect(triageMark).toHaveLength(6);
    expect(triage.box.xMm).toBe(1.5);
    expect(boxMaxY(triage)).toBe(31);
    expect(triage.box.xMm).toBeLessThan(5);
    expect(boxMaxY(triage)).toBeGreaterThan(26);

    const priority = definition('state.person-injured-transport-priority');
    expect(pathsOf(priority)).toHaveLength(3);
    expect(priority.box.yMm).toBe(2.5);
    expect(boxMaxX(priority)).toBe(31);
    expect(priority.box.yMm).toBeLessThan(4);
    expect(boxMaxX(priority)).toBeGreaterThan(27);
  });

  it('trennt beide Kontaminationsdarstellungen geometrisch', () => {
    const primary = definition('state.person-contaminated');
    const filledCircles = circlesOf(primary).filter((circle) =>
      circle.style?.fill === 'schwarz' && circle.style.stroke === 'none',
    );
    const crossedStems = linesOf(primary).filter((line) =>
      Math.min(line.x1, line.x2) >= 25.5 && Math.max(line.y1, line.y2) === 10.5,
    );
    expect(filledCircles.map(({ cx, cy, r }) => [cx, cy, r])).toEqual([
      [26.5, 4, 1.5],
      [30, 4, 1.5],
    ]);
    expect(crossedStems).toHaveLength(2);
    expect(boxMaxX(primary)).toBe(31.5);

    const alternative = definition('state.person-contaminated', 'alternative');
    expect(circlesOf(alternative)).toEqual([]);
    expect(pathsOf(alternative)).toHaveLength(2);
    expect(alternative.primitives).not.toEqual(primary.primitives);
  });

  it('kodiert Tod, Vermisstsein und Wassergefahr mit verschiedenen Formkanaelen', () => {
    const dead = definition('state.person-dead');
    expect(linesOf(dead).map(({ x1, y1, x2, y2 }) => [x1, y1, x2, y2])).toEqual([
      [16, 4, 16, 26],
      [10.5, 9.5, 21.5, 9.5],
    ]);

    const missing = definition('state.person-missing');
    expect(linesOf(missing).map(({ x1, y1, x2, y2 }) => [x1, y1, x2, y2])).toEqual([
      [3, 10, 10, 3],
      [22, 29, 29, 22],
    ]);
    expect(missing.box.xMm).toBeLessThan(5);
    expect(boxMaxX(missing)).toBeGreaterThan(27);
    expect(missing.box.yMm).toBeLessThan(4);
    expect(boxMaxY(missing)).toBeGreaterThan(26);

    const water = definition('state.person-in-water-danger');
    expect(pathsOf(water)).toHaveLength(3);
    expect(pathsOf(water).filter((path) => path.d.includes('C'))).toHaveLength(2);
    expect(water.box).toEqual({ xMm: 4, yMm: 1, widthMm: 27, heightMm: 30 });
  });

  it('stellt Zwangslage und Rettung an gegenueberliegenden Diamantseiten dar', () => {
    const horizontalOf = (id: string): Line[] => linesOf(definition(id)).filter(
      (line) => line.y1 === line.y2,
    );
    expect(horizontalOf('state.person-in-distress').map((line) => line.y1)).toEqual([4]);
    expect(horizontalOf('state.person-rescued').map((line) => line.y1)).toEqual([26]);
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
        arrows: polylinesOf(item).map((line) => line.points),
      };
    };

    expect(transportSignature('state.person-to-be-transported')).toEqual({
      baselines: [[3, 24, 30, 24]],
      terminals: [3],
      arrows: [[[26, 20], [30, 24], [26, 28]]],
    });
    expect(transportSignature('state.person-in-transport')).toEqual({
      baselines: [[3, 24, 30, 24]],
      terminals: [],
      arrows: [[[26, 20], [30, 24], [26, 28]]],
    });
    expect(transportSignature('state.person-transported')).toEqual({
      baselines: [[3, 24, 30, 24]],
      terminals: [30],
      arrows: [[[26, 20], [30, 24], [26, 28]]],
    });
  });

  it('haelt Betreuungs- und Mobilitaetsmarken ausserhalb der Diamantflaeche auseinander', () => {
    const specialCare = definition('state.person-needing-special-care');
    expect(linesOf(specialCare).map(({ x1, y1, x2, y2 }) => [x1, y1, x2, y2])).toEqual([
      [16, 4, 4, 31],
      [16, 4, 28, 31],
    ]);
    expect(boxMaxY(specialCare)).toBe(31);

    const careDependent = definition('state.person-care-dependent');
    expect(linesOf(careDependent).map(({ x1, y1, x2, y2 }) => [x1, y1, x2, y2])).toEqual([
      [5, 8, 5, 22],
    ]);

    const mobility = definition('state.person-mobility-impaired');
    expect(circlesOf(mobility).map(({ cx, cy, r }) => [cx, cy, r])).toEqual([
      [8, 28.5, 2],
      [24, 28.5, 2],
    ]);
    expect(circlesOf(mobility).every((circle) => circle.cy - circle.r > 26)).toBe(true);
    expect(boxMaxY(mobility)).toBe(30.5);
  });

  it('liefert 18 paarweise verschiedene Primitivsignaturen', () => {
    const signatures = PERSON_STATES.map((item) => JSON.stringify(item.primitives));
    expect(new Set(signatures).size).toBe(18);
  });
});
