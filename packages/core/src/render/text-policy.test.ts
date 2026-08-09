import { describe, expect, it } from 'vitest';
import { MINIMUM_TEXT_RENDER_PX, effectiveTextPx } from './text-policy.js';

describe('Mindestgröße für Text', () => {
  it('rechnet den Schriftgrad auf die Rendergröße um', () => {
    expect(effectiveTextPx(10, 32, 32)).toBe(10);
    expect(effectiveTextPx(10, 16, 32)).toBe(5);
    expect(effectiveTextPx(10, 256, 32)).toBe(80);
  });

  it('hält die Schwelle als benannte Konstante', () => {
    expect(MINIMUM_TEXT_RENDER_PX).toBeGreaterThan(0);
  });
});
