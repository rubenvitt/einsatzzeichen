import { describe, expect, it } from 'vitest';
import { CATALOG_TEXT_FONT_WEIGHT } from '@einsatzzeichen/core';
import type { Primitive } from '@einsatzzeichen/schema';
import { RENDER_CASES } from './test-support/render-cases.js';

/**
 * LFH-585, Option B: Die Referenz setzt allen Text in einer einzigen Strichstärke. Der Katalog
 * setzt ihn deshalb in Arimo 500 (`CATALOG_TEXT_FONT_WEIGHT`), jeden Lauf ausdrücklich am
 * Primitiv. Diese Prüfung hält fest, dass kein Grundzeichen, kein Rezept und kein Piktogramm
 * einen Lauf ohne dieses Gewicht trägt — ein neuer Lauf, der das Gewicht vergisst, fiele sonst
 * still in den Normalschnitt zurück.
 */
type TextPrimitive = Extract<Primitive, { type: 'text' }>;

function textsOf(primitives: readonly Primitive[]): TextPrimitive[] {
  return primitives.flatMap((primitive) =>
    primitive.type === 'text'
      ? [primitive]
      : primitive.type === 'group'
        ? textsOf(primitive.children)
        : [],
  );
}

describe('Schriftgewicht des Katalogtexts', () => {
  it('ist Arimo 500', () => {
    expect(CATALOG_TEXT_FONT_WEIGHT).toBe(500);
  });

  it('trägt Text in so vielen Fällen, dass die Prüfung etwas prüft', () => {
    const runs = RENDER_CASES.flatMap(({ drawing }) => textsOf(drawing.children));
    expect(runs.length).toBeGreaterThan(200);
  });

  it.each(RENDER_CASES)('$id: jeder Textlauf steht in Stufe 500', ({ drawing }) => {
    const offenders = textsOf(drawing.children)
      .filter((run) => run.fontWeight !== CATALOG_TEXT_FONT_WEIGHT)
      .map((run) => `"${run.content}" (${run.fontWeight ?? 'ohne Gewicht'})`);
    expect(offenders).toEqual([]);
  });
});
