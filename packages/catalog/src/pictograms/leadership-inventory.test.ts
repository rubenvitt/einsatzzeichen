import { describe, expect, it } from 'vitest';
import { entryKey, LEADERSHIP_IDS } from '@einsatzzeichen/schema';
import { COVERAGE_MANIFEST } from '../coverage-manifest.js';
import { MANIFEST_DOMAIN_REVIEWS } from '../domain-reviews.js';
import { resolveElement } from '../elements.js';
import { RENDER_CASES } from '../test-support/render-cases.js';
import { ALL_PICTOGRAMS, pictogram, pictogramVariantKey } from './index.js';
import { LEADERSHIP_PICTOGRAMS } from './leadership/index.js';

describe('Leadership-Inventar nach D.1', () => {
  it('führt exakt die erste inkrementelle Leadership-ID', () => {
    expect(LEADERSHIP_IDS).toEqual(['command-post-in-operation']);
    expect(LEADERSHIP_PICTOGRAMS).toHaveLength(1);
    expect(Object.isFrozen(LEADERSHIP_PICTOGRAMS)).toBe(true);
  });

  it('bindet D.1.1 vollständig und rechteckig an seine Referenz', () => {
    expect(LEADERSHIP_PICTOGRAMS[0]).toMatchObject({
      id: 'leadership.command-post-in-operation',
      section: 'D.1.1',
      title: 'Befehlsstelle im Einsatz',
      referenceAsset: 'D.1.1_Befehlsstelle im Einsatz.svg',
      variant: 'primary',
      viewBox: { width: 32, height: 46 },
      placement: { mode: 'standalone' },
    });
  });

  it('bewahrt den Bezeichnungslauf der Quelle mit der gemessenen Arimo-Tinthülle', () => {
    const text = LEADERSHIP_PICTOGRAMS[0]?.primitives.find(
      (primitive) => primitive.type === 'text',
    );
    expect(text).toMatchObject({
      type: 'text',
      role: 'pictogram',
      content: 'Bezeichnung',
      x: 2.673,
      y: 13,
      sizeMm: 4.243,
      anchor: 'start',
      baseline: 'alphabetic',
      boxMm: { xMm: 2.673, yMm: 9.971, widthMm: 24.3, heightMm: 3.927 },
      minRenderPx: 61,
      style: { fill: 'schwarz', stroke: 'none' },
    });
  });

  it('bewahrt Anschluss, vierzehn Teilstriche und das vollständige Außenkreuz', () => {
    const lines = LEADERSHIP_PICTOGRAMS[0]?.primitives.filter(
      (primitive) => primitive.type === 'line',
    );
    expect(lines).toHaveLength(17);
    expect(lines?.[0]).toMatchObject({ x1: 1, y1: 21, x2: 1.75, y2: 21.59 });
    expect(lines?.[1]).toMatchObject({ x1: 2.173, y1: 21.921, x2: 3.339, y2: 22.838 });
    expect(lines?.[14]).toMatchObject({ x1: 24.91, y1: 39.784, x2: 26.076, y2: 40.701 });
    expect(lines?.slice(-2)).toEqual([
      expect.objectContaining({ x1: 26.879, y1: 40.879, x2: 31.121, y2: 45.121 }),
      expect.objectContaining({ x1: 31.121, y1: 40.879, x2: 26.879, y2: 45.121 }),
    ]);
  });

  it('hält Familie, Registry, Renderfall, Element, Manifest und Review bijektiv', () => {
    const definition = LEADERSHIP_PICTOGRAMS[0];
    const familyKeys = LEADERSHIP_PICTOGRAMS.map(pictogramVariantKey);
    const allKeys = ALL_PICTOGRAMS
      .filter((candidate) => candidate.id.startsWith('leadership.'))
      .map(pictogramVariantKey);
    expect(allKeys).toEqual(familyKeys);
    expect(pictogram('leadership.command-post-in-operation')).toBe(definition);

    expect(RENDER_CASES.filter((renderCase) => renderCase.id.startsWith('leadership.'))
      .map((renderCase) => renderCase.id)).toEqual(['leadership.command-post-in-operation']);
    expect(resolveElement(definition.id)).toMatchObject({
      kind: 'leadership',
      title: definition.title,
      referenceAssets: [definition.referenceAsset],
    });

    const manifestKey = entryKey('bbk-babz-2025:D.1.1', 'primary');
    const rows = COVERAGE_MANIFEST.entries.filter(
      (entry) => entryKey(entry.sourceId, entry.variant) === manifestKey,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      implementation: definition.id,
      referenceAsset: definition.referenceAsset,
      testEvidence: ['svg-snapshot', 'pictogram-contract'],
      review: { domain: { status: 'pending' } },
    });
    expect(rows[0]?.review.domain).toBe(
      MANIFEST_DOMAIN_REVIEWS[manifestKey as keyof typeof MANIFEST_DOMAIN_REVIEWS],
    );
  });
});
