import { describe, expect, it } from 'vitest';
import { slugForSymbolId } from './slug.js';

describe('slugForSymbolId', () => {
  it('bildet Rezept- und Katalogschlüssel auf URL-sichere Slugs ab', () => {
    expect(slugForSymbolId('recipe.E.1.1')).toBe('e-1-1');
    expect(slugForSymbolId('base.formation')).toBe('base-formation');
    expect(slugForSymbolId('recipe.F.1.11#alternative')).toBe('f-1-11-alternative');
  });

  it('lässt ausschließlich Kleinbuchstaben, Ziffern und Bindestriche zu', () => {
    for (const id of ['recipe.E.2.6', 'base.vehicle-land', 'recipe.D.1.9#alternative']) {
      expect(slugForSymbolId(id)).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('wirft bei einem Schlüssel ohne verwertbare Zeichen', () => {
    expect(() => slugForSymbolId('___')).toThrow(/Slug/);
  });
});
