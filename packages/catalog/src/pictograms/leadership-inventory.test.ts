import { describe, expect, it } from 'vitest';
import { entryKey, LEADERSHIP_IDS } from '@einsatzzeichen/schema';
import { COVERAGE_MANIFEST } from '../coverage-manifest.js';
import { MANIFEST_DOMAIN_REVIEWS } from '../domain-reviews.js';
import { resolveElement } from '../elements.js';
import { RECIPES } from '../recipes.js';
import { erwarteZurechenbaresFachreview } from '../test-support/domain-review.js';
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
  it('führt D.1.1, die sieben D.2-IDs und die zwei direkten D.3-Funktionen', () => {
    expect(LEADERSHIP_IDS).toEqual([
      'command-post-in-operation',
      'staging-area',
      'staging-area-with-reporting-head',
      'reporting-head',
      'guide-post',
      'control-center',
      'helicopter-landing-zone',
      'helicopter-landing-site',
      'technical-advisor-thw',
      'red-cross-commissioner',
    ]);
    expect(LEADERSHIP_PICTOGRAMS).toHaveLength(10);
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
    const d2Definitions = LEADERSHIP_PICTOGRAMS.slice(1, 8);
    expect(d2Definitions).toHaveLength(7);
    for (const [index, expected] of D2_EXPECTED.entries()) {
      expect(d2Definitions[index]).toMatchObject({
        ...expected,
        variant: 'primary',
        viewBox: { width: 32, height: 32 },
        placement: { mode: 'standalone' },
        contrastPairs: D2_CONTRAST_PAIRS,
      });
    }
  });

  it('bewahrt die gemessene schwarze Kreiskappe nur an der Leitstelle D.2.5', () => {
    const controlCenter = LEADERSHIP_PICTOGRAMS.find(
      (definition) => definition.id === 'leadership.control-center',
    );
    const landingSite = LEADERSHIP_PICTOGRAMS.find(
      (definition) => definition.id === 'leadership.helicopter-landing-site',
    );
    const blackFillPaths = (definition: typeof controlCenter) =>
      definition?.primitives.filter(
        (primitive) => primitive.type === 'path' && primitive.style?.fill === 'schwarz',
      );

    expect(blackFillPaths(controlCenter)).toEqual([
      {
        type: 'path',
        role: 'pictogram',
        d:
          'M 6.724 10 H 25.277 C 22.95 7.302 19.564 5.75 16 5.75 ' +
          'C 12.436 5.75 9.05 7.302 6.724 10 Z',
        style: { fill: 'schwarz', stroke: 'none' },
      },
    ]);
    expect(blackFillPaths(landingSite)).toEqual([]);
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

  it('bindet D.3.14 und D.3.15 als getrennte offene Kappen ohne erfundene Funktionsrolle', () => {
    const expected = [
      {
        id: 'leadership.technical-advisor-thw',
        section: 'D.3.14',
        title: 'Fachberater THW',
        referenceAsset: 'D.3.14_Fachberater THW.svg',
        box: { xMm: 2.397, yMm: 2.397, widthMm: 29.105, heightMm: 27.207 },
        bodyFill: 'blau',
        role: ['THW', 'weiss', 16, 18.5, 7.08, 'middle'],
        carrier: ['stv OB', 'schwarz', 31.5, 29, 4.243, 'end'],
      },
      {
        id: 'leadership.red-cross-commissioner',
        section: 'D.3.15',
        title: 'Rotkreuzbeauftragter',
        referenceAsset: 'D.3.15_Rotkreuzbeauftragter.svg',
        box: { xMm: 2.397, yMm: 2.397, widthMm: 28.603, heightMm: 27.207 },
        bodyFill: 'weiss',
        role: ['RKB', 'schwarz', 16, 18.5, 7.08, 'middle'],
        carrier: ['DRK', 'schwarz', 31, 29, 4.243, 'end'],
      },
    ] as const;

    const definitions = LEADERSHIP_PICTOGRAMS.slice(8);
    expect(definitions).toHaveLength(2);
    for (const [index, contract] of expected.entries()) {
      const definition = definitions[index];
      expect(definition).toMatchObject({
        id: contract.id,
        section: contract.section,
        title: contract.title,
        referenceAsset: contract.referenceAsset,
        variant: 'primary',
        viewBox: { width: 32, height: 32 },
        placement: { mode: 'standalone' },
        box: contract.box,
      });
      expect(JSON.stringify(definition)).not.toContain('functionRole');
      expect(JSON.stringify(definition)).not.toContain('organization');

      const body = definition?.primitives[0];
      expect(body).toMatchObject({
        type: 'rect', role: 'pictogram',
        transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
        style: { fill: contract.bodyFill, stroke: 'none' },
      });
      const [outer, shoulder] = definition?.primitives.slice(1, 3) ?? [];
      expect(outer).toMatchObject({
        type: 'polyline', role: 'pictogram', closed: true,
        points: [[16, 2.647], [29.354, 16], [16, 29.354], [2.647, 16]],
      });
      expect(shoulder).toMatchObject({
        type: 'line', role: 'pictogram', x1: 11.603, y1: 7.75, x2: 20.396, y2: 7.75,
      });

      const texts = definition?.primitives.filter((primitive) => primitive.type === 'text') ?? [];
      expect(texts).toHaveLength(2);
      for (const [textIndex, [content, fill, x, y, sizeMm, anchor]] of [
        contract.role,
        contract.carrier,
      ].entries()) {
        expect(texts[textIndex]).toMatchObject({
          type: 'text', role: 'pictogram', content, x, y, sizeMm, anchor,
          baseline: 'alphabetic', style: { fill, stroke: 'none' },
        });
      }
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
      });
      // Das `review`-Feld ist aus dem `toMatchObject` heraus: dort hätte es den Statuswert
      // festgenagelt. Die beiden Aussagen darunter bleiben und sind die eigentlichen: die Zeile
      // holt ihr Fachreview als **dasselbe Objekt** aus dem Ledger (Verdrahtung), und dieses
      // Review ist, falls entschieden, zurechenbar.
      expect(rows[0]?.review.domain).toBe(
        MANIFEST_DOMAIN_REVIEWS[manifestKey as keyof typeof MANIFEST_DOMAIN_REVIEWS],
      );
      erwarteZurechenbaresFachreview(rows[0]!.review, manifestKey);
    }
  });
});
