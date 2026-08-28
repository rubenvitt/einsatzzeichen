import { describe, expect, it } from 'vitest';
import { axisByLabel } from './coverage-axes.js';
import type { CoverageAxis } from './snapshot.js';

const axes: CoverageAxis[] = [
  { label: 'Referenzabdeckung', value: 550, of: 661, detail: '111 nicht' },
  { label: 'Regelabdeckung', value: 14, of: 16 },
  { label: 'Generative Reichweite', value: 894, of: 225720 },
];

describe('axisByLabel', () => {
  it('liefert die Achse mit dem gesuchten Label', () => {
    expect(axisByLabel(axes, 'Regelabdeckung')).toEqual({ label: 'Regelabdeckung', value: 14, of: 16 });
  });

  it('wirft mit dem gesuchten und den vorhandenen Labels, statt still undefined zu liefern', () => {
    expect(() => axisByLabel(axes, 'Nicht vorhanden')).toThrow(/Nicht vorhanden/);
    expect(() => axisByLabel(axes, 'Nicht vorhanden')).toThrow(/Referenzabdeckung/);
  });
});
