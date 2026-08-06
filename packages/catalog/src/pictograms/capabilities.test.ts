import { describe, expect, it } from 'vitest';
import { boundsOfMm } from '@einsatzzeichen/core';
import { capabilityPictogram } from './capabilities.js';

describe('Fähigkeitspiktogramme', () => {
  it('zeichnet Brandbekämpfung als Strahlrohr mit Sprühkegel', () => {
    const parts = capabilityPictogram('fire-fighting');
    expect(parts).toHaveLength(3);
    for (const part of parts) {
      expect(part.type).toBe('line');
      expect(part.role).toBe('pictogram');
      expect(part.style?.stroke).toBe('schwarz');
    }
  });

  it('bleibt innerhalb des Körpers der Taktischen Formation', () => {
    for (const part of capabilityPictogram('fire-fighting')) {
      const bounds = boundsOfMm(part);
      expect(bounds.minX).toBeGreaterThanOrEqual(1);
      expect(bounds.maxX).toBeLessThanOrEqual(31);
      expect(bounds.minY).toBeGreaterThanOrEqual(6);
      expect(bounds.maxY).toBeLessThanOrEqual(26);
    }
  });
});
