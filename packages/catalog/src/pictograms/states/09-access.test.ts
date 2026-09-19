import { checkBox, checkClipping, checkCommands } from '@einsatzzeichen/core';
import { type Primitive } from '@einsatzzeichen/schema';
import { describe, expect, it } from 'vitest';
import type { CatalogPictogramDefinition } from '../catalog-definition.js';
import { ACCESS_STATES } from './09-access.js';

type Line = Extract<Primitive, { type: 'line' }>;

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

function definition(id: string): CatalogPictogramDefinition {
  const found = ACCESS_STATES.find((item) => item.id === id);
  if (found === undefined) throw new Error(`Fehlende Zugangsdarstellung ${id}`);
  return found;
}

function linesOf(item: CatalogPictogramDefinition): Line[] {
  return item.primitives.filter((primitive): primitive is Line => primitive.type === 'line');
}

function coordinatesOf(item: CatalogPictogramDefinition): number[][] {
  return linesOf(item).map(({ x1, y1, x2, y2 }) => [x1, y1, x2, y2]);
}

describe('ACCESS_STATES', () => {
  it('enthaelt die vier Darstellungen in Kapitelreihenfolge', () => {
    expect(ACCESS_STATES.map((item) => [
      item.section,
      item.id,
      item.variant,
      item.referenceAsset,
    ])).toEqual([
      ['5.8.9.1', 'state.route-closed', 'primary', '5.8.9.1_Gesperrt.svg'],
      ['5.8.9.2', 'state.one-way-traffic', 'primary', '5.8.9.2_Einbahnstraßenregelung.svg'],
      ['5.8.9.3', 'state.route-difficult-to-pass', 'primary', '5.8.9.3_Schwierig befahrbar_Teilblockiert.svg'],
      ['5.8.9.4', 'state.route-impassable', 'primary', '5.8.9.4_Unbefahrbar_Blockiert.svg'],
    ]);
  });

  it('ist tief eingefroren und besteht alle Autoren- und ViewBox-Gates', () => {
    expect(Object.isFrozen(ACCESS_STATES)).toBe(true);
    expect(Object.isFrozen(ACCESS_STATES[0]?.primitives)).toBe(true);
    for (const item of ACCESS_STATES) {
      expect(item.placement).toEqual({ mode: 'standalone' });
      expect(item.contrastPairs).toEqual([{
        foreground: 'schwarz',
        background: 'surface',
        context: 'Verkehrs- oder Zugangssymbol auf Ausgabeoberfläche',
      }]);
      expect(checkCommands(item)).toEqual([]);
      expect(checkBox(item)).toEqual([]);
      expect(checkClipping(item, viewBoxBody(item))).toEqual([]);
      expect(item.primitives.every((primitive) =>
        (primitive.type === 'line' || primitive.type === 'polyline') &&
        primitive.role === 'pictogram' &&
        primitive.style?.strokeWidth === 0.5 &&
        primitive.transform === undefined,
      )).toBe(true);
    }
  });

  it('zeichnet Gesperrt als Mittellinie mit zwei sich kreuzenden Sperrarmen', () => {
    expect(coordinatesOf(definition('state.route-closed'))).toEqual([
      [16, 2, 16, 30],
      [10, 11, 22, 21],
      [22, 11, 10, 21],
    ]);
  });

  it('zeichnet die Einbahnregelung als Fahrbahnstrich und Richtungsstrich mit Halbpfeil', () => {
    const item = definition('state.one-way-traffic');
    expect(coordinatesOf(item)).toEqual([[14, 2, 14, 30]]);
    expect(item.primitives[1]).toMatchObject({
      type: 'polyline',
      closed: false,
      points: [[18, 27], [18, 5], [22, 13]],
    });
  });

  it('unterscheidet Teil- und Vollblockade durch exakt zwei beziehungsweise vier Balken', () => {
    expect(coordinatesOf(definition('state.route-difficult-to-pass'))).toEqual([
      [14, 2, 14, 30],
      [18, 2, 18, 30],
    ]);
    expect(coordinatesOf(definition('state.route-impassable'))).toEqual([
      [10, 2, 10, 30],
      [14, 2, 14, 30],
      [18, 2, 18, 30],
      [22, 2, 22, 30],
    ]);
  });

  it('liefert die erwarteten Anzahlen und vier verschiedene Signaturen', () => {
    expect(ACCESS_STATES.map((item) => item.primitives.length)).toEqual([3, 2, 2, 4]);
    expect(new Set(ACCESS_STATES.map((item) => JSON.stringify(item.primitives))).size).toBe(4);
  });
});
