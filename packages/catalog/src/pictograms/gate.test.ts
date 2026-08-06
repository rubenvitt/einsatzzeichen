import { describe, expect, it } from 'vitest';
import { checkBox, checkClipping, checkCommands } from '@einsatzzeichen/core';
import type { Primitive } from '@einsatzzeichen/schema';
import { baseDrawing } from '../base-symbols.js';
import { ALL_PICTOGRAMS } from './index.js';

/**
 * Die Körperfläche, gegen die alle Piktogramme in D.0 geprüft werden. Weitere Körperformen
 * kommen dazu, sobald ihre Fläche vermessen ist — das Clipping-Gate wirft für Polygone und
 * gedrehte Quadrate ausdrücklich, statt eine Hüllenprüfung als Flächenprüfung auszugeben.
 */
function formationBody(): Primitive {
  const body = baseDrawing('formation').children.find((child) => child.role === 'body');
  if (body === undefined) throw new Error('Grundzeichen "formation" hat kein body-Primitiv.');
  return body;
}

describe('Piktogramm-Gates über den Katalogbestand', () => {
  it('hat mindestens ein Piktogramm zu prüfen', () => {
    // Ohne diese Zusicherung wären die drei Tests unten bei leerem Bestand trivial grün.
    expect(ALL_PICTOGRAMS.length).toBeGreaterThan(0);
  });

  it.each(ALL_PICTOGRAMS.map((definition) => [definition.id, definition] as const))(
    'besteht für %s das Kommando-Gate',
    (_id, definition) => {
      expect(checkCommands(definition)).toEqual([]);
    },
  );

  it.each(ALL_PICTOGRAMS.map((definition) => [definition.id, definition] as const))(
    'besteht für %s das Box-Gate',
    (_id, definition) => {
      expect(checkBox(definition)).toEqual([]);
    },
  );

  it.each(ALL_PICTOGRAMS.map((definition) => [definition.id, definition] as const))(
    'besteht für %s das Clipping-Gate gegen die Taktische Formation',
    (_id, definition) => {
      expect(checkClipping(definition, formationBody())).toEqual([]);
    },
  );
});
