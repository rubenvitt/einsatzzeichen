import { describe, expect, it } from 'vitest';
import * as root from '@einsatzzeichen/core';
import * as blocks from '@einsatzzeichen/core/blocks';
import * as exact from '@einsatzzeichen/core/exact';
import * as sketch from '@einsatzzeichen/core/sketch';

/**
 * Die Subpfade aus ESZ-149. Bis 7.0 sind sie Teilmengen der Wurzel: jeder Name dort ist derselbe
 * Wert wie an der Wurzel, damit ein Umstieg auf den Subpfad nichts verändert.
 */
describe('Subpfade von core (ESZ-149)', () => {
  const subpaths = { exact, sketch, blocks } as const;

  it.each(Object.entries(subpaths))('%s ist eine Teilmenge der Wurzel', (_name, module) => {
    const names = Object.keys(module);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(root, name).toHaveProperty(name);
      expect((root as Record<string, unknown>)[name], name).toBe((module as Record<string, unknown>)[name]);
    }
  });

  it('führt den Bauplan-Einstieg unter exact', () => {
    for (const name of ['drawSymbol', 'compose', 'validateSpec', 'checkSpec', 'vocabulary', 'parseSpec', 'resolve', 'fromExact']) {
      expect(exact).toHaveProperty(name);
    }
  });
});
