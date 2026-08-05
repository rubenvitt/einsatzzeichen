import { describe, expect, it } from 'vitest';
import { isDataVersion } from './profile.js';

describe('Datenversion', () => {
  it.each(['0.1.0', '1.0.0', '10.20.30'])('erkennt "%s" als gültige Version', (value) => {
    expect(isDataVersion(value)).toBe(true);
  });

  it.each(['0.1', '1.0.0.0', 'v1.0.0', '1.0.0-beta', '01.0.0', '', 'x.y.z'])(
    'weist "%s" zurück',
    (value) => {
      expect(isDataVersion(value)).toBe(false);
    },
  );
});
