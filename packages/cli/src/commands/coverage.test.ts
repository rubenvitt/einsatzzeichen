import { afterEach, describe, expect, it, vi } from 'vitest';
import { coverage } from './coverage.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('coverage CLI', () => {
  it('weist alle Reviewträger getrennt aus und meldet null technische Nachweislücken', () => {
    const lines: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((message?: unknown) => {
      lines.push(String(message));
    });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    coverage();

    expect(lines).toContain(
      'Offene fachliche Reviews: 103 (90 Manifestreviews, 12 Quellenreviews, 1 Profilreview)',
    );
    expect(lines).toContain(
      '1.0-Blocker: 90 Manifestreviews, 12 Quellenreviews und 1 Profilreview noch ohne abgeschlossenes fachliches Review; 0 Manifestabweichungen, 0 Quellenabweichungen und 0 Profilabweichungen mit domain: deviation; 0 ohne Testnachweis, 0 Kapitel im beanspruchten Umfang ohne Eintrag',
    );
    expect(lines.at(-1)).toBe('Coverage-Gate bestanden.');
  });
});
