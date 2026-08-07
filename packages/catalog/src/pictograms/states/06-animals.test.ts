import { describe, expect, it } from 'vitest';
import { checkBox, checkClipping, checkCommands } from '@einsatzzeichen/core';
import {
  DEFAULT_VIEWBOX_MM,
  type DepictionVariant,
  type Primitive,
} from '@einsatzzeichen/schema';
import { ANIMAL_STATES } from './06-animals.js';

const VIEWBOX_BODY: Primitive = {
  type: 'rect',
  role: 'body',
  x: 0,
  y: 0,
  width: DEFAULT_VIEWBOX_MM.width,
  height: DEFAULT_VIEWBOX_MM.height,
};

function animal(id: string, variant: DepictionVariant = 'primary') {
  const definition = ANIMAL_STATES.find(
    (candidate) => candidate.id === `state.${id}` && candidate.variant === variant,
  );
  if (definition === undefined) throw new Error(`Tierzustand ${id}#${variant} fehlt.`);
  return definition;
}

describe('5.8.6 Tierzustände', () => {
  it('registriert drei Semantiken und genau zwei Kontaminationsdarstellungen', () => {
    expect(ANIMAL_STATES.map(({ id, variant }) => [id, variant])).toEqual([
      ['state.sick-animal', 'primary'],
      ['state.contaminated-animal', 'primary'],
      ['state.contaminated-animal', 'alternative'],
      ['state.dead-animal', 'primary'],
    ]);
    expect(animal('contaminated-animal').title).toBe('Kontaminiertes Tier');
    expect(animal('contaminated-animal', 'alternative').title).toBe('Kontaminiertes Tier');
  });

  it('verwendet in allen vier Definitionen dieselbe lokale Tiersilhouette', () => {
    const serialized = ANIMAL_STATES.map((definition) =>
      JSON.stringify(definition.primitives[0]),
    );
    expect(new Set(serialized).size).toBe(1);
    const silhouette = ANIMAL_STATES[0]?.primitives[0];
    expect(silhouette).toMatchObject({ type: 'polyline', role: 'pictogram', closed: false });
  });

  it('trennt Krankheit, Kontamination, K-Alternative und Tod geometrisch', () => {
    expect(animal('sick-animal').primitives.slice(1).map((item) => item.type)).toEqual(['line']);
    expect(animal('contaminated-animal').primitives.slice(1).map((item) => item.type)).toEqual([
      'circle',
      'circle',
      'line',
      'line',
    ]);
    expect(
      animal('contaminated-animal', 'alternative').primitives.slice(1).map((item) => item.type),
    ).toEqual(['line', 'line', 'line']);
    expect(animal('dead-animal').primitives.slice(1).map((item) => item.type)).toEqual([
      'line',
      'line',
    ]);
    expect(new Set(ANIMAL_STATES.map((item) => JSON.stringify(item.primitives))).size).toBe(4);
  });

  it('trägt nur schwarze Blätter auf der Ausgabeoberfläche', () => {
    for (const definition of ANIMAL_STATES) {
      expect(definition.contrastPairs).toEqual([
        {
          foreground: 'schwarz',
          background: 'surface',
          context: 'Tiersilhouette und Zustandsmarke auf Ausgabeoberfläche',
        },
      ]);
      for (const primitive of definition.primitives) {
        expect(primitive.role).toBe('pictogram');
      }
    }
  });

  it('besteht Kommando, exakte Box und Standalone-Clipping vor Snapshots', () => {
    for (const definition of ANIMAL_STATES) {
      expect(checkCommands(definition)).toEqual([]);
      expect(checkBox(definition)).toEqual([]);
      expect(checkClipping(definition, VIEWBOX_BODY)).toEqual([]);
    }
  });
});
