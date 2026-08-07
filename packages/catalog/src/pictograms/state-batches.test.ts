import { describe, expect, it } from 'vitest';
import { pictogramVariantKey } from './index.js';
import { STATE_PICTOGRAMS } from './states/index.js';

const DELIVERED_BATCHES = [
  {
    batch: 'S0',
    keys: [
      'state.tendency-rising#primary',
      'state.tendency-unchanged#primary',
      'state.tendency-falling#primary',
    ],
  },
] as const;

describe('DELIVERED_BATCHES', () => {
  it('entspricht ohne doppelte Schlüssel exakt den ausgelieferten State-Darstellungen', () => {
    const batches = DELIVERED_BATCHES.map(({ batch }) => batch);
    const expectedKeys = DELIVERED_BATCHES.flatMap(({ keys }) => keys);
    const actualKeys = STATE_PICTOGRAMS.map(pictogramVariantKey);

    expect(new Set(batches).size).toBe(batches.length);
    expect(new Set(expectedKeys).size).toBe(expectedKeys.length);
    expect(new Set(actualKeys).size).toBe(actualKeys.length);
    expect([...actualKeys].sort()).toEqual([...expectedKeys].sort());
  });
});
