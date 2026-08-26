import { describe, expect, it } from 'vitest';
import { entryKey, LEADERSHIP_IDS } from '@einsatzzeichen/schema';
import { COVERAGE_MANIFEST } from '../coverage-manifest.js';
import { MANIFEST_DOMAIN_REVIEWS } from '../domain-reviews.js';
import { resolveElement } from '../elements.js';
import { RECIPES } from '../recipes.js';
import { RENDER_CASES } from '../test-support/render-cases.js';
import { ALL_PICTOGRAMS, pictogram, pictogramVariantKey } from './index.js';
import { LEADERSHIP_PICTOGRAMS } from './leadership/index.js';

const D2_CONTRAST_PAIRS = [
  {
    foreground: 'schwarz',
    background: 'gelb',
    context: 'schwarze Kontur und Innenmarke auf gelber Ortsfläche',
  },
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'schwarze Außenkontur auf der Ausgabeoberfläche',
  },
] as const;

const D2_EXPECTED = [
  {
    id: 'leadership.staging-area',
    section: 'D.2.1',
    title: 'Bereitstellungsraum',
    referenceAsset: 'D.2.1_Bereitstellungsraum.svg',
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
  },
  {
    id: 'leadership.staging-area-with-reporting-head',
    section: 'D.2.2',
    title: 'Bereitstellungsraum mit Meldekopf',
    referenceAsset: 'D.2.2_Bereitstellungsraum mit Meldekopf.svg',
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
  },
  {
    id: 'leadership.reporting-head',
    section: 'D.2.3',
    title: 'Meldekopf',
    referenceAsset: 'D.2.3_Meldekopf.svg',
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
  },
  {
    id: 'leadership.guide-post',
    section: 'D.2.4',
    title: 'Lotsenstelle',
    referenceAsset: 'D.2.4_Lotsenstelle.svg',
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
  },
  {
    id: 'leadership.control-center',
    section: 'D.2.5',
    title: 'Leitstelle',
    referenceAsset: 'D.2.5_Leitstelle.svg',
    box: { xMm: 3, yMm: 1, widthMm: 26, heightMm: 29 },
  },
  {
    id: 'leadership.helicopter-landing-zone',
    section: 'D.2.6',
    title: 'Hubschrauberlandezone',
    referenceAsset: 'D.2.6_Hubschrauberlandezone.svg',
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
  },
  {
    id: 'leadership.helicopter-landing-site',
    section: 'D.2.7',
    title: 'Hubschrauberlandeplatz',
    referenceAsset: 'D.2.7_Hubschrauberlandeplatz.svg',
    box: { xMm: 3, yMm: 1, widthMm: 26, heightMm: 29 },
  },
] as const;

describe('Leadership-Inventar nach D.2', () => {
  it('führt D.1.1 und exakt die sieben inkrementellen D.2-IDs', () => {
    expect(LEADERSHIP_IDS).toEqual([
      'command-post-in-operation',
      'staging-area',
      'staging-area-with-reporting-head',
      'reporting-head',
      'guide-post',
      'control-center',
      'helicopter-landing-zone',
      'helicopter-landing-site',
    ]);
    expect(LEADERSHIP_PICTOGRAMS).toHaveLength(8);
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

  it('bindet D.2.1 bis D.2.7 exakt als primäre 32×32-mm-Ortsdefinitionen', () => {
    expect(LEADERSHIP_PICTOGRAMS.slice(1)).toHaveLength(7);
    for (const [index, expected] of D2_EXPECTED.entries()) {
      expect(LEADERSHIP_PICTOGRAMS[index + 1]).toMatchObject({
        ...expected,
        variant: 'primary',
        viewBox: { width: 32, height: 32 },
        placement: { mode: 'standalone' },
        contrastPairs: D2_CONTRAST_PAIRS,
      });
    }
  });

  it('hält D.2 direkt und erfindet weder Recipe, State, circle-12 noch Organisation', () => {
    const definitions = LEADERSHIP_PICTOGRAMS.slice(1);
    const referenceAssets = new Set(definitions.map((definition) => definition.referenceAsset));
    expect(Object.keys(RECIPES).filter((section) => section.startsWith('D.2.'))).toEqual([]);
    expect(ALL_PICTOGRAMS.filter((definition) =>
      definition.id.startsWith('state.') && referenceAssets.has(definition.referenceAsset),
    )).toEqual([]);
    for (const definition of definitions) {
      expect(JSON.stringify(definition)).not.toContain('circle-12');
      expect('organization' in definition).toBe(false);
    }
  });

  it('hält Familie, Registry, Renderfall, Element, Manifest und Review bijektiv', () => {
    const familyKeys = LEADERSHIP_PICTOGRAMS.map(pictogramVariantKey);
    const allKeys = ALL_PICTOGRAMS
      .filter((candidate) => candidate.id.startsWith('leadership.'))
      .map(pictogramVariantKey);
    expect(allKeys).toEqual(familyKeys);

    expect(RENDER_CASES.filter((renderCase) => renderCase.id.startsWith('leadership.'))
      .map((renderCase) => renderCase.id)).toEqual(
        LEADERSHIP_IDS.map((id) => `leadership.${id}`).sort(),
      );

    for (const definition of LEADERSHIP_PICTOGRAMS) {
      expect(pictogram(definition.id)).toBe(definition);
      expect(resolveElement(definition.id)).toMatchObject({
        kind: 'leadership',
        title: definition.title,
        referenceAssets: [definition.referenceAsset],
      });

      const manifestKey = entryKey(`bbk-babz-2025:${definition.section}`, 'primary');
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
    }
  });
});
