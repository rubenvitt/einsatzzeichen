import { describe, expect, it } from 'vitest';
import {
  checkBox,
  checkClipping,
  checkCommands,
  renderSvg,
} from '@einsatzzeichen/core';
import { type Drawing, type Primitive } from '@einsatzzeichen/schema';
import { PRINT_MONOCHROME_THEME } from '../../render-themes.js';
import type { CatalogPictogramDefinition } from '../catalog-definition.js';
import { TACTICS_HAZARDS_STATES } from './01-tactics-hazards.js';
import { ACTIVITY_STATES } from './02-activity.js';
import { TENDENCY_STATES } from './03-tendencies.js';

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

const FIRST_THREE_FAMILIES = [
  ...TACTICS_HAZARDS_STATES,
  ...ACTIVITY_STATES,
  ...TENDENCY_STATES,
] as const;

function leavesOf(primitives: readonly Primitive[]): readonly Primitive[] {
  const result: Primitive[] = [];
  const visit = (primitive: Primitive): void => {
    if (primitive.type === 'group') {
      for (const child of primitive.children) visit(child);
      return;
    }
    result.push(primitive);
  };
  for (const primitive of primitives) visit(primitive);
  return result;
}

function definition(
  id: string,
  variant: 'primary' | 'alternative' = 'primary',
): CatalogPictogramDefinition {
  const found = FIRST_THREE_FAMILIES.find(
    (candidate) => candidate.id === id && candidate.variant === variant,
  );
  if (found === undefined) throw new Error(`Testdefinition fehlt: ${id}#${variant}`);
  return found;
}

/** Entfernt nur Farbwerte; Geometrietyp, Koordinaten und Strichstaerken bleiben erhalten. */
function colorBlindGeometrySignature(definition: CatalogPictogramDefinition): string {
  return JSON.stringify(definition.primitives, (key, value: unknown) => {
    if (key !== 'fill' && key !== 'stroke') return value;
    return value === 'none' ? 'none' : 'paint';
  });
}

function monochromeSvg(definition: CatalogPictogramDefinition): string {
  const drawing: Drawing = {
    viewBox: definition.viewBox,
    children: definition.primitives,
  };
  return renderSvg(drawing, {
    size: 64,
    theme: PRINT_MONOCHROME_THEME,
    // Absichtlich fuer alle Definitionen gleich: Stringunterschiede muessen aus der Geometrie
    // kommen und duerfen nicht durch ID-Praefixe trivial erzeugt werden.
    idPrefix: 'state-family-test',
  });
}

/** Zählt die 12 × 12 mm großen Viertelsektoren (rect-Blätter) einer Füllfarbe. */
function filledSectorCount(
  definition: CatalogPictogramDefinition,
  fill: 'rot' | 'gruen',
): number {
  return leavesOf(definition.primitives).filter((primitive) =>
    primitive.type === 'rect' &&
    primitive.width === 12 &&
    primitive.height === 12 &&
    primitive.style?.fill === fill
  ).length;
}

function standalonePairs(definition: CatalogPictogramDefinition) {
  if (definition.placement.mode !== 'standalone') {
    throw new Error(`${definition.id} ist im State-Familientest nicht standalone.`);
  }
  const pairs = definition.contrastPairs;
  if (pairs === undefined) {
    throw new Error(`${definition.id} deklariert keine Kontrastpaare.`);
  }
  return pairs;
}

describe('5.8.1 bis 5.8.3: gemeinsamer Autorenvertrag', () => {
  it('enthaelt exakt 25 Darstellungen und 21 State-IDs', () => {
    expect(FIRST_THREE_FAMILIES).toHaveLength(25);
    expect(new Set(FIRST_THREE_FAMILIES.map((item) => item.id)).size).toBe(21);
    expect(new Set(
      FIRST_THREE_FAMILIES.map((item) => `${item.id}#${item.variant}`),
    ).size).toBe(25);
  });

  it('markiert jedes Blatt als pictogram und besteht Kommando-, Box- und ViewBox-Clipping-Gate', () => {
    for (const item of FIRST_THREE_FAMILIES) {
      expect(leavesOf(item.primitives).every((leaf) => leaf.role === 'pictogram')).toBe(true);
      expect(checkCommands(item), `${item.id}#${item.variant}: commands`).toEqual([]);
      expect(checkBox(item), `${item.id}#${item.variant}: box`).toEqual([]);
      expect(checkClipping(item, viewBoxBody(item)), `${item.id}#${item.variant}: clipping`).toEqual([]);
    }
  });
});

describe('5.8.1: Taktik und Gefahren', () => {
  const tactical = [
    definition('state.tactical-rescue'),
    definition('state.tactical-attack'),
    definition('state.tactical-defense'),
    definition('state.tactical-retreat'),
  ];

  it('kodiert Retten, Angriff, Verteidigung und Rueckzug geometrisch statt nur farblich', () => {
    const signatures = tactical.map(colorBlindGeometrySignature);
    expect(new Set(signatures).size).toBe(4);
    expect(new Set(tactical.map(monochromeSvg)).size).toBe(4);
  });

  it('deklariert bei Taktikzeichen kein nicht vorhandenes direktes Rot-Blau-Paar', () => {
    for (const item of tactical) {
      const directRedBlue = standalonePairs(item).some((pair) => {
        const colors = new Set([pair.foreground, pair.background]);
        return colors.has('rot') && colors.has('hellblau');
      });
      expect(directRedBlue, item.id).toBe(false);
      // Klammer (polyline) und Pfeil (path) sind reine 0,5-mm-Striche in Rot bzw. Hellblau;
      // ein schwarzer Strich existiert in der Referenz nicht.
      const leaves = leavesOf(item.primitives);
      expect(leaves.some((leaf) => leaf.style?.stroke === 'schwarz'), item.id).toBe(false);
      for (const color of ['rot', 'hellblau'] as const) {
        const strokes = leaves.filter((leaf) => leaf.style?.stroke === color);
        expect(strokes, `${item.id}: ${color}`).toHaveLength(1);
        expect(strokes[0]?.style?.strokeWidth, `${item.id}: ${color}`).toBe(0.5);
      }
    }
  });

  it.each([
    'state.hazardous-substances',
    'state.radioactivity-hazard',
    'state.suspected-situation',
    'state.acute-situation',
  ])('%s besitzt titelgleiche, geometrisch verschiedene Varianten', (id) => {
    const primary = definition(id);
    const alternative = definition(id, 'alternative');
    expect(primary.title).toBe(alternative.title);
    expect(colorBlindGeometrySignature(primary)).not.toBe(
      colorBlindGeometrySignature(alternative),
    );
    expect(monochromeSvg(primary)).not.toBe(monochromeSvg(alternative));
  });

  it('haelt alle zehn Gebiets- und Gefahrendarstellungen im Monochromprofil auseinander', () => {
    const hazards = [
      definition('state.flooded-area'),
      definition('state.water-ingress-hazard'),
      definition('state.hazardous-substances'),
      definition('state.hazardous-substances', 'alternative'),
      definition('state.radioactivity-hazard'),
      definition('state.radioactivity-hazard', 'alternative'),
      definition('state.electrical-energy-hazard'),
      definition('state.mineral-oil-hazard'),
      definition('state.explosion-hazard'),
      definition('state.explosive-ordnance-hazard'),
    ];
    expect(new Set(hazards.map(colorBlindGeometrySignature)).size).toBe(10);
    expect(new Set(hazards.map(monochromeSvg)).size).toBe(10);
  });
});

describe('5.8.2: Aktivitaets- und Ausfallgrade', () => {
  it('kodiert 25, 50, 75 und 100 Prozent als 1, 2, 3 und 4 rote Sektoren', () => {
    expect(ACTIVITY_STATES.map((item) => filledSectorCount(item, 'rot'))).toEqual([1, 2, 3, 4]);
    expect(ACTIVITY_STATES.map((item) => filledSectorCount(item, 'gruen'))).toEqual([3, 2, 1, 0]);
  });

  it('deklariert Gruen nur in den drei Definitionen, die Gruen wirklich zeichnen', () => {
    const backgrounds = ACTIVITY_STATES.map((item) =>
      standalonePairs(item).map((pair) => pair.background).sort(),
    );
    expect(backgrounds).toEqual([
      ['gruen', 'rot', 'surface', 'weiss'],
      ['gruen', 'rot', 'surface', 'weiss'],
      ['gruen', 'rot', 'surface', 'weiss'],
      ['rot', 'surface', 'weiss'],
    ]);
  });

  it('bleibt durch Sektorzahl und Ziffer im Monochromprofil vierstufig', () => {
    expect(new Set(ACTIVITY_STATES.map(colorBlindGeometrySignature)).size).toBe(4);
    expect(new Set(ACTIVITY_STATES.map(monochromeSvg)).size).toBe(4);
  });
});

describe('5.8.3: Tendenzen', () => {
  it('legt die drei Schaftrichtungen explizit fest', () => {
    const shafts = TENDENCY_STATES.map((item) =>
      leavesOf(item.primitives).filter((leaf) => leaf.type === 'line'),
    );
    expect(shafts).toEqual([
      [expect.objectContaining({ x1: 5, y1: 27, x2: 22.827, y2: 9.173 })],
      [expect.objectContaining({ x1: 5, y1: 16, x2: 21, y2: 16 })],
      [expect.objectContaining({ x1: 5, y1: 5, x2: 22.827, y2: 22.827 })],
    ]);
    for (const [shaft] of shafts) {
      expect(shaft?.style).toEqual({ fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 });
    }
  });

  it('setzt die Pfeilspitzen als gefüllte geschlossene Dreiecke an das Schaftende', () => {
    const heads = TENDENCY_STATES.map((item) =>
      leavesOf(item.primitives).filter((leaf) => leaf.type === 'polyline'),
    );
    expect(heads).toEqual([
      [expect.objectContaining({
        closed: true,
        points: [[19.999, 6.345], [27.07, 4.93], [25.655, 12.001]],
        style: { fill: 'schwarz', stroke: 'none' },
      })],
      [expect.objectContaining({
        closed: true,
        points: [[21, 12], [27, 16], [21, 20]],
        style: { fill: 'schwarz', stroke: 'none' },
      })],
      [expect.objectContaining({
        closed: true,
        points: [[25.655, 19.999], [27.07, 27.07], [19.999, 25.655]],
        style: { fill: 'schwarz', stroke: 'none' },
      })],
    ]);
  });

  it('besitzt je einen weißen Rahmen und drei monochrom verschiedene Pfeile', () => {
    for (const item of TENDENCY_STATES) {
      const frames = leavesOf(item.primitives).filter((leaf) => leaf.type === 'rect');
      expect(frames).toEqual([
        expect.objectContaining({
          x: 2,
          y: 2,
          width: 28,
          height: 28,
          style: { fill: 'weiss', stroke: 'schwarz', strokeWidth: 0.5 },
        }),
      ]);
    }
    expect(new Set(TENDENCY_STATES.map(colorBlindGeometrySignature)).size).toBe(3);
    expect(new Set(TENDENCY_STATES.map(monochromeSvg)).size).toBe(3);
  });
});
