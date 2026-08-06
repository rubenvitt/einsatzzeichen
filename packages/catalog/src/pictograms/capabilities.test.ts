import { describe, expect, it } from 'vitest';
import { boundsOfMm } from '@einsatzzeichen/core';
import { CAPABILITY_PICTOGRAMS } from './capabilities.js';
import { pictogram } from './index.js';

describe('Fähigkeitspiktogramme', () => {
  it('zeichnet Brandbekämpfung als Strahlrohr mit Sprühkegel', () => {
    const parts = pictogram('capability.fire-fighting').primitives;
    expect(parts).toHaveLength(3);
    for (const part of parts) {
      expect(part.type).toBe('line');
      expect(part.role).toBe('pictogram');
      expect(part.style?.stroke).toBe('schwarz');
    }
  });

  it('deklariert für Brandbekämpfung die Hülle, die die Geometrie tatsächlich hat', () => {
    const definition = pictogram('capability.fire-fighting');
    const hull = definition.primitives.map(boundsOfMm);
    expect(Math.min(...hull.map((b) => b.minX))).toBeCloseTo(definition.box.xMm, 6);
    expect(Math.min(...hull.map((b) => b.minY))).toBeCloseTo(definition.box.yMm, 6);
    expect(Math.max(...hull.map((b) => b.maxX))).toBeCloseTo(
      definition.box.xMm + definition.box.widthMm,
      6,
    );
    expect(Math.max(...hull.map((b) => b.maxY))).toBeCloseTo(
      definition.box.yMm + definition.box.heightMm,
      6,
    );
  });

  it('bleibt innerhalb des Körpers der Taktischen Formation', () => {
    for (const part of pictogram('capability.fire-fighting').primitives) {
      const bounds = boundsOfMm(part);
      expect(bounds.minX).toBeGreaterThanOrEqual(1);
      expect(bounds.maxX).toBeLessThanOrEqual(31);
      expect(bounds.minY).toBeGreaterThanOrEqual(6);
      expect(bounds.maxY).toBeLessThanOrEqual(26);
    }
  });

  it('wirft bei einer ID ohne Definition, statt undefined zu liefern', () => {
    // Dasselbe Muster wie `organizationColor`, `baseDrawing` und `resolveElement`: ein Register
    // mit Lücken ist Partial, und der Zugriff darauf wirft — ein stilles `undefined` würde als
    // leeres Piktogramm gerendert.
    expect(() => pictogram('capability.not-a-capability' as never)).toThrow(/Kein Piktogramm/);
  });

  it('trägt für jeden Eintrag die ID als Schlüssel und im Feld', () => {
    // Ohne diese Prüfung könnte ein Eintrag unter fremdem Schlüssel stehen, und jede Meldung
    // eines Gates nennte die falsche ID.
    for (const [key, definition] of Object.entries(CAPABILITY_PICTOGRAMS)) {
      expect(definition?.id).toBe(key);
    }
  });
});
