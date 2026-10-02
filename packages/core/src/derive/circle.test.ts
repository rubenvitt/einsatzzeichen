import { describe, expect, it } from 'vitest';
import type { Primitive } from '@einsatzzeichen/schema';
import { bodyLabelInk } from '../compose.js';
import { drawSymbol } from '../default-ports.js';

function flat(children: readonly Primitive[]): Primitive[] {
  return children.flatMap((child) => (child.type === 'group' ? [child, ...flat(child.children)] : [child]));
}

function labelRuns(children: readonly Primitive[]) {
  return flat(children).filter(
    (child): child is Extract<Primitive, { type: 'text' }> => child.type === 'text' && child.role === 'label',
  );
}

describe('Schrifttinte auf Gelb (vermessene Korrektur, 02.10.2026)', () => {
  it('setzt Körperläufe auf Gelb schwarz wie alle 20 gelben Referenzen mit Typo', () => {
    expect(bodyLabelInk('gelb')).toBe('schwarz');
    expect(bodyLabelInk('weiss')).toBe('schwarz');
    expect(bodyLabelInk('rot')).toBe('weiss');
    expect(bodyLabelInk('gelb', 'weiss')).toBe('weiss');
  });

  it('zeichnet einen Lauf in der Führung-und-Leitung-Formation schwarz', () => {
    const drawing = drawSymbol({
      kind: 'formation',
      organization: 'fuehrung-leitung',
      labels: { center: 'TEL' },
    });
    expect(drawing.derivations).toBeUndefined();
    expect(labelRuns(drawing.children).map((run) => run.style?.fill)).toEqual(['schwarz']);
  });
});
