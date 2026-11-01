import { describe, expect, it } from 'vitest';
import { ANIMAL_STATES } from './pictograms/states/06-animals.js';
import { collectDerivations } from '../derive/record.js';
import { animalStateDrawing } from './animal-state.js';

/**
 * Tierzustand aus 5.8.6 als freistehendes Zeichen (LFH-577): die Tiersilhouette ist der Träger und
 * gehört zu jeder Darstellung; das Zeichen ist das Katalogpiktogramm des Zustands.
 */

describe('Tierzustand', () => {
  it('zeichnet jeden Zustand als sein Katalogpiktogramm in 32 × 32 mm', () => {
    for (const state of ['sick-animal', 'contaminated-animal', 'dead-animal'] as const) {
      const drawing = animalStateDrawing({ state });
      const definition = ANIMAL_STATES.find((candidate) => candidate.id === `state.${state}` && candidate.variant === 'primary');
      expect(drawing.viewBox).toEqual({ width: 32, height: 32 });
      expect(drawing.children, state).toEqual(definition?.primitives);
      expect(drawing.title).toBe(definition?.title);
    }
  });

  it('trägt die Silhouette in jeder Darstellung als ersten Polyzug mit Ohren von x 2 bis 6 und 26 bis 30', () => {
    for (const state of ['sick-animal', 'contaminated-animal', 'dead-animal'] as const) {
      const [silhouette] = animalStateDrawing({ state }).children;
      expect(silhouette?.type, state).toBe('polyline');
      if (silhouette?.type !== 'polyline') continue;
      expect(silhouette.points.map(([x]) => x)).toEqual([2, 6, 16, 26, 30]);
    }
  });

  it('zeichnet ohne Zustand nur die Silhouette, als Ableitung gemeldet (LLH-1343)', () => {
    let drawing: ReturnType<typeof animalStateDrawing> | undefined;
    const collected = collectDerivations(() => (drawing = animalStateDrawing({})));
    expect(drawing?.title).toBe('Tier');
    expect(collected.children).toHaveLength(1);
    const [silhouette] = collected.children;
    const sick = animalStateDrawing({ state: 'sick-animal' }).children[0];
    // Dieselbe Silhouette wie am erkrankten und toten Tier, ohne Strich und Kreuz.
    expect(silhouette).toEqual(sick);
    expect(collected.derivations).toEqual([
      expect.objectContaining({ dimension: 'state', basis: 'transferred' }),
    ]);
    expect(() => animalStateDrawing({ variant: 'alternative' })).toThrow(/Darstellung/);
  });

  it('führt die Darstellung mit „K“ nur beim kontaminierten Tier', () => {
    const letter = animalStateDrawing({ state: 'contaminated-animal', variant: 'alternative' });
    expect(letter.children.some((child) => child.type === 'text' && child.content === 'K')).toBe(true);
    expect(() => animalStateDrawing({ state: 'sick-animal', variant: 'alternative' })).toThrow(/Darstellung/);
    expect(() => animalStateDrawing({ state: 'dead-animal', variant: 'alternative' })).toThrow(/Darstellung/);
  });
});
