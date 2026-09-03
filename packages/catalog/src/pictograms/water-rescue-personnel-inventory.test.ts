import { describe, expect, it } from 'vitest';
import { tokenizePath } from '@einsatzzeichen/core';
import { WATER_RESCUE_PERSONNEL_IDS } from '@einsatzzeichen/schema';
import { PICTOGRAM_ELEMENT_KINDS, resolveElement } from '../elements.js';
import { MANIFEST_DOMAIN_REVIEWS } from '../domain-reviews.js';
import { COVERAGE_MANIFEST } from '../coverage-manifest.js';
import {
  erwarteZurechenbaresFachreview,
  erwarteZurechenbaresFachreviewImLedger,
} from '../test-support/domain-review.js';
import {
  ALL_PICTOGRAMS,
  pictogram,
  pictogramVariantKey,
} from './index.js';
import { WATER_RESCUE_PERSONNEL_PICTOGRAMS } from './water-rescue-personnel/index.js';

function sourceWave(startY: number): string {
  const y = (offset: number): number => Number((startY + offset).toFixed(3));
  return `M 13.177 ${y(0)} ` +
    `C 12.922 ${y(0.255)} 12.603 ${y(0.573)} 12 ${y(0.573)} ` +
    `V ${y(0.073)} ` +
    `C 12.397 ${y(0.073)} 12.585 ${y(-0.115)} 12.824 ${y(-0.354)} ` +
    `C 13.079 ${y(-0.609)} 13.398 ${y(-0.927)} 14.001 ${y(-0.927)} ` +
    `C 14.604 ${y(-0.927)} 14.923 ${y(-0.609)} 15.178 ${y(-0.354)} ` +
    `C 15.416 ${y(-0.115)} 15.605 ${y(0.073)} 16.002 ${y(0.073)} ` +
    `C 16.399 ${y(0.073)} 16.587 ${y(-0.115)} 16.825 ${y(-0.354)} ` +
    `C 17.08 ${y(-0.609)} 17.398 ${y(-0.927)} 18.002 ${y(-0.927)} ` +
    `C 18.606 ${y(-0.927)} 18.923 ${y(-0.609)} 19.178 ${y(-0.353)} ` +
    `C 19.416 ${y(-0.115)} 19.604 ${y(0.074)} 20 ${y(0.074)} ` +
    `V ${y(0.574)} ` +
    `C 19.397 ${y(0.574)} 19.079 ${y(0.256)} 18.824 ${y(0)} ` +
    `C 18.586 ${y(-0.238)} 18.398 ${y(-0.427)} 18.002 ${y(-0.427)} ` +
    `C 17.606 ${y(-0.427)} 17.417 ${y(-0.239)} 17.179 ${y(0)} ` +
    `C 16.924 ${y(0.255)} 16.606 ${y(0.573)} 16.002 ${y(0.573)} ` +
    `C 15.398 ${y(0.573)} 15.08 ${y(0.255)} 14.825 ${y(0)} ` +
    `C 14.587 ${y(-0.239)} 14.398 ${y(-0.427)} 14.001 ${y(-0.427)} ` +
    `C 13.604 ${y(-0.427)} 13.416 ${y(-0.239)} 13.177 ${y(0)} Z`;
}

const EXPECTED = [
  {
    id: 'water-rescue-personnel.team-leader',
    section: 'I.5.4',
    title: 'Truppführer Wasserrettungstrupp',
    referenceAsset: 'I.5.4_Truppführer Wasserrettungstrupp.svg',
    box: { xMm: 2.646529, yMm: 1, widthMm: 26.707295, heightMm: 30.331489 },
    head: [{ type: 'circle', cx: 16, cy: 2.5, r: 1.5 }],
  },
  {
    id: 'water-rescue-personnel.group-leader',
    section: 'I.5.5',
    title: 'Gruppenführer Wasserrettungsgruppe',
    referenceAsset: 'I.5.5_Gruppenführer Wasserrettungsgruppe.svg',
    box: { xMm: 2.646529, yMm: 1, widthMm: 26.707295, heightMm: 30.331489 },
    head: [
      { type: 'circle', cx: 11, cy: 2.5, r: 1.5 },
      { type: 'circle', cx: 21, cy: 2.5, r: 1.5 },
    ],
  },
  {
    id: 'water-rescue-personnel.platoon-leader',
    section: 'I.5.6',
    title: 'Zugführer Wasserrettungszug',
    referenceAsset: 'I.5.6_Zugführer Wasserrettungszug.svg',
    box: { xMm: 2.646529, yMm: 1, widthMm: 26.707295, heightMm: 30.331489 },
    head: [
      { type: 'circle', cx: 11, cy: 2.5, r: 1.5 },
      { type: 'circle', cx: 16, cy: 2.5, r: 1.5 },
      { type: 'circle', cx: 21, cy: 2.5, r: 1.5 },
    ],
  },
  {
    id: 'water-rescue-personnel.formation-leader',
    section: 'I.5.7',
    title: 'Verbandsführer Wasserrettungsverband',
    referenceAsset: 'I.5.7_Verbandsführer Wasserrettungsverband.svg',
    box: { xMm: 2.646529, yMm: 0, widthMm: 26.707295, heightMm: 31.331489 },
    head: [{ type: 'rect', x: 15.25, y: 0, width: 1.5, height: 4 }],
  },
  {
    id: 'water-rescue-personnel.technical-advisor',
    section: 'I.5.8',
    title: 'Fachberater Wasserrettung',
    referenceAsset: 'I.5.8_Fachberater Wasserrettung.svg',
    box: { xMm: 2.646529, yMm: 2.624304, widthMm: 26.706942, heightMm: 26.707295 },
    head: [],
  },
] as const;

const STANDARD_BODY = {
  field: [[16, 4.624547], [29.353824, 17.978], [16, 31.331489], [2.646529, 17.978]],
  cap:
    'M 2.646529 17.978 L 16 4.624547 L 29.353824 17.978 L 16 31.331489 Z ' +
    'M 3.354 17.978 L 11.332 10 L 20.668 10 L 28.646 17.978 L 16 30.624 Z',
  inner:
    'M 16 16.646 L 20.354 21 L 16 25.354 L 11.646 21 Z ' +
    'M 16 17.353 L 19.647 21 L 16 24.647 L 12.353 21 Z',
  waves: [
    sourceWave(13.177),
    sourceWave(15.177),
  ],
} as const;

const ADVISOR_BODY = {
  field: [[16, 2.624304], [29.353471, 16], [16, 29.331599], [2.646529, 16]],
  cap:
    'M 2.646529 16 L 16 2.624304 L 29.353471 16 L 16 29.331599 Z ' +
    'M 16 3.332 L 20.418 7.75 L 20.918 8.25 L 28.646 16 L 16 28.624 ' +
    'L 3.354 16 L 11.081 8.25 L 11.582 7.75 Z',
  inner:
    'M 16 14.646 L 20.354 19 L 16 23.354 L 11.646 19 Z ' +
    'M 16 15.353 L 19.647 19 L 16 22.647 L 12.353 19 Z',
  waves: [
    sourceWave(11.177),
    sourceWave(13.177),
  ],
} as const;

describe('Wasserrettungsführung I.5.4 bis I.5.8', () => {
  it('hält ID-Raum, Familie, Registry und Elementart bijektiv', () => {
    expect(WATER_RESCUE_PERSONNEL_IDS).toEqual([
      'team-leader',
      'group-leader',
      'platoon-leader',
      'formation-leader',
      'technical-advisor',
    ]);
    expect(WATER_RESCUE_PERSONNEL_PICTOGRAMS).toHaveLength(5);
    expect(Object.isFrozen(WATER_RESCUE_PERSONNEL_PICTOGRAMS)).toBe(true);
    expect(ALL_PICTOGRAMS
      .filter((definition) => definition.id.startsWith('water-rescue-personnel.'))
      .map(pictogramVariantKey)).toEqual(
        WATER_RESCUE_PERSONNEL_PICTOGRAMS.map(pictogramVariantKey),
      );
    expect(PICTOGRAM_ELEMENT_KINDS.has('water-rescue-personnel' as never)).toBe(true);

    for (const definition of WATER_RESCUE_PERSONNEL_PICTOGRAMS) {
      expect(pictogram(definition.id)).toBe(definition);
      expect(resolveElement(definition.id)).toMatchObject({
        kind: 'water-rescue-personnel',
        title: definition.title,
        referenceAssets: [definition.referenceAsset],
      });
    }
  });

  // Titel geändert: „weiterhin offene" war die Aussage über den Reviewstand vom Tag der Aufnahme.
  it('reserviert fünf getrennte Fachreviewplätze mit je eigenem, zurechenbarem Reviewobjekt', () => {
    const lfh490ReviewKeys: ReadonlySet<string> = new Set(
      EXPECTED.map(({ section }) => `bbk-babz-2025:${section}#primary`),
    );
    const keys = Object.keys(MANIFEST_DOMAIN_REVIEWS).filter((key) =>
      lfh490ReviewKeys.has(key),
    );
    expect(keys).toEqual([
      'bbk-babz-2025:I.5.4#primary',
      'bbk-babz-2025:I.5.5#primary',
      'bbk-babz-2025:I.5.6#primary',
      'bbk-babz-2025:I.5.7#primary',
      'bbk-babz-2025:I.5.8#primary',
    ]);
    // Vorher: `toEqual(keys.map(() => ({ status: 'pending' })))` — das nagelte den Statuswert
    // fest. Gegatet bleibt die **Struktur**: fünf Ledgerplätze, und zwar fünf verschiedene
    // Objekte. Genau darum geht es dem Test („getrennte"): über ein gemeinsam referenziertes
    // Sammelreview würde die Freigabe von I.5.4 die vier übrigen still mitfreigeben. Dazu die
    // Invariante je Platz — entschieden nur zurechenbar.
    const reviews = keys.map(
      (key) => MANIFEST_DOMAIN_REVIEWS[key as keyof typeof MANIFEST_DOMAIN_REVIEWS],
    );
    expect(new Set(reviews).size).toBe(5);
    for (const [index, review] of reviews.entries()) {
      erwarteZurechenbaresFachreviewImLedger(review, keys[index]!);
    }
  });

  it('führt nur I.5.4 bis I.5.8 mit technischem Direktnachweis im Manifest', () => {
    const lfh490SourceIds: ReadonlySet<string> = new Set(
      EXPECTED.map(({ section }) => `bbk-babz-2025:${section}`),
    );
    const directImplementations: ReadonlySet<string> = new Set(
      WATER_RESCUE_PERSONNEL_IDS.map((id) => `water-rescue-personnel.${id}`),
    );
    const rows = COVERAGE_MANIFEST.entries.filter(
      (entry) =>
        lfh490SourceIds.has(entry.sourceId) || directImplementations.has(entry.implementation),
    );
    expect(rows.map((entry) => [entry.sourceId, entry.implementation])).toEqual([
      ['bbk-babz-2025:I.5.4', 'water-rescue-personnel.team-leader'],
      ['bbk-babz-2025:I.5.5', 'water-rescue-personnel.group-leader'],
      ['bbk-babz-2025:I.5.6', 'water-rescue-personnel.platoon-leader'],
      ['bbk-babz-2025:I.5.7', 'water-rescue-personnel.formation-leader'],
      ['bbk-babz-2025:I.5.8', 'water-rescue-personnel.technical-advisor'],
    ]);
    for (const row of rows) {
      expect(row).toMatchObject({
        coverage: 'element',
        variant: 'primary',
        testEvidence: ['svg-snapshot', 'pictogram-contract'],
        review: {
          technical: { status: 'approved', reviewer: 'rv', date: '2026-08-27' },
        },
      });
      // `domain` ist aus dem `toMatchObject` heraus: dort hätte es den Statuswert festgenagelt.
      // Geprüft wird die Invariante — jede der fünf I.5-Zeilen trägt ein Fachreview, entschieden
      // nur zurechenbar.
      erwarteZurechenbaresFachreview(row.review, `${row.sourceId}#${row.variant}`);
      expect(row.review.technical.note).toContain('I.5.4 bis I.5.8');
      expect(row.review.technical.note).toContain('keine FunctionRole-, Strength- oder Organisationssemantik');
    }
    const lfh490Sections: ReadonlySet<string> = new Set(
      EXPECTED.map(({ section }) => section),
    );
    expect(COVERAGE_MANIFEST.scope.filter((section) => lfh490Sections.has(section))).toEqual([
      'I.5.4', 'I.5.5', 'I.5.6', 'I.5.7', 'I.5.8',
    ]);
    expect(COVERAGE_MANIFEST.scope).not.toContain('I');
    expect(COVERAGE_MANIFEST.scope).not.toContain('I.5');
  });

  it('inventarisiert exakt die fünf literalen 32×32-mm-Standalone-Zeichen', () => {
    const definitions = ALL_PICTOGRAMS.filter((definition) =>
      definition.id.startsWith('water-rescue-personnel.'),
    );

    expect(definitions).toHaveLength(5);
    for (const [index, expected] of EXPECTED.entries()) {
      expect(definitions[index]).toMatchObject({
        id: expected.id,
        section: expected.section,
        title: expected.title,
        referenceAsset: expected.referenceAsset,
        variant: 'primary',
        viewBox: { width: 32, height: 32 },
        placement: { mode: 'standalone' },
        box: expected.box,
      });
      expect(JSON.stringify(definitions[index])).not.toMatch(
        /functionRole|strength|organization/,
      );
    }
  });

  it('bewahrt Körper, Wasserlinien und Innenraute als handabgeleitete Literale', () => {
    const definitions = ALL_PICTOGRAMS.filter((definition) =>
      definition.id.startsWith('water-rescue-personnel.'),
    );

    expect(definitions).toHaveLength(5);
    for (const [index, definition] of definitions.entries()) {
      const expected = index === 4 ? ADVISOR_BODY : STANDARD_BODY;
      expect(definition?.primitives[0]).toMatchObject({
        type: 'polyline', role: 'pictogram', points: expected.field, closed: true,
        style: { fill: 'weiss', stroke: 'none' },
      });
      expect(definition?.primitives[1]).toMatchObject({
        type: 'path', role: 'pictogram', d: expected.cap,
        style: { fill: 'schwarz', stroke: 'none', fillRule: 'evenodd' },
      });
      expect(definition?.primitives.slice(2, 4)).toEqual(expected.waves.map((d) => ({
        type: 'path', role: 'pictogram', d,
        style: { fill: 'schwarz', stroke: 'none' },
      })));
      expect(definition?.primitives[4]).toMatchObject({
        type: 'path', role: 'pictogram', d: expected.inner,
        style: { fill: 'schwarz', stroke: 'none', fillRule: 'evenodd' },
      });
    }
  });

  it('liefert die Wellen verlustfrei nur mit absoluten M/C/V/Z-Kommandos an die Pfad-Gates', () => {
    const wavePaths = WATER_RESCUE_PERSONNEL_PICTOGRAMS.flatMap((definition) =>
      definition.primitives.slice(2, 4),
    );

    for (const wave of wavePaths) {
      expect(wave.type).toBe('path');
      if (wave.type !== 'path') continue;
      const tokenized = tokenizePath(wave.d);
      expect(tokenized.problems, wave.d).toEqual([]);
      expect(new Set(tokenized.commands.map(({ command }) => command))).toEqual(
        new Set(['M', 'C', 'V', 'Z']),
      );
    }
  });

  it('bewahrt die belegte 1/2/3-Kreis-Führung, den Verbandsbalken und den kopflosen Fachberater', () => {
    const definitions = ALL_PICTOGRAMS.filter((definition) =>
      definition.id.startsWith('water-rescue-personnel.'),
    );

    for (const [index, expected] of EXPECTED.entries()) {
      const head = definitions[index]?.primitives.slice(5) ?? [];
      expect(head).toHaveLength(expected.head.length);
      expect(head).toEqual(expected.head.map((primitive) => ({
        ...primitive,
        role: 'pictogram',
        style: { fill: 'schwarz', stroke: 'none' },
      })));
    }
  });
});
