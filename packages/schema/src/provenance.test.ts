import { describe, expect, it } from 'vitest';
import { entryKey, type CatalogEntry } from './provenance.js';

describe('provenance', () => {
  it('bildet aus Quellen-ID und Variante einen eindeutigen Schlüssel', () => {
    expect(entryKey('bbk-babz-2025:4.1.6', 'primary')).toBe('bbk-babz-2025:4.1.6#primary');
    expect(entryKey('bbk-babz-2025:4.1.6', 'alternative')).toBe(
      'bbk-babz-2025:4.1.6#alternative',
    );
  });

  it('unterscheidet Basisdarstellung und Alternative derselben Quellen-ID', () => {
    const a = entryKey('bbk-babz-2025:4.1.6', 'primary');
    const b = entryKey('bbk-babz-2025:4.1.6', 'alternative');
    expect(a).not.toBe(b);
  });

  it('trägt mehrere Darstellungen an einem Katalogeintrag', () => {
    const entry: CatalogEntry = {
      id: 'hazard.atomic',
      title: 'Atomare Stoffe',
      kind: 'hazard',
      depictions: [
        {
          variant: 'primary',
          drawing: { viewBox: { width: 32, height: 32 }, children: [] },
          sourceRefs: [
            { source: 'babz-svg-2025', section: '4.1.6', status: 'derived' },
          ],
        },
        {
          variant: 'alternative',
          drawing: { viewBox: { width: 32, height: 32 }, children: [] },
          sourceRefs: [
            {
              source: 'babz-svg-2025',
              section: '4.1.6',
              asset: '4.1.6_Atomare Stoffe_Alternative.svg',
              status: 'derived',
            },
          ],
        },
      ],
    };
    expect(entry.depictions.map((d) => d.variant)).toEqual(['primary', 'alternative']);
    expect(
      entry.depictions.map((d) => entryKey(d.sourceRefs[0].source, d.variant)),
    ).toEqual(['babz-svg-2025#primary', 'babz-svg-2025#alternative']);
  });
});
