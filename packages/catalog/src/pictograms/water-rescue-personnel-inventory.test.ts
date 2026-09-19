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

const EXPECTED = [
  {
    id: 'water-rescue-personnel.team-leader',
    section: 'I.5.4',
    title: 'Truppführer Wasserrettungstrupp',
    referenceAsset: 'I.5.4_Truppführer Wasserrettungstrupp.svg',
    box: { xMm: 2.75, yMm: 1, widthMm: 26.5, heightMm: 30.25 },
    head: [{ type: 'circle', cx: 16, cy: 2.5, r: 1.5 }],
  },
  {
    id: 'water-rescue-personnel.group-leader',
    section: 'I.5.5',
    title: 'Gruppenführer Wasserrettungsgruppe',
    referenceAsset: 'I.5.5_Gruppenführer Wasserrettungsgruppe.svg',
    box: { xMm: 2.75, yMm: 1, widthMm: 26.5, heightMm: 30.25 },
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
    box: { xMm: 2.75, yMm: 1, widthMm: 26.5, heightMm: 30.25 },
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
    box: { xMm: 2.75, yMm: 0.25, widthMm: 26.5, heightMm: 31 },
    head: [{ type: 'rect', x: 15.25, y: 0.25, width: 1.5, height: 3.75 }],
  },
  {
    id: 'water-rescue-personnel.technical-advisor',
    section: 'I.5.8',
    title: 'Fachberater Wasserrettung',
    referenceAsset: 'I.5.8_Fachberater Wasserrettung.svg',
    box: { xMm: 2.75, yMm: 2.75, widthMm: 26.5, heightMm: 26.5 },
    head: [],
  },
] as const;

/**
 * Rautenkörper nach der Neukonstruktion vom 19.09.2026: Raute als 0,5-mm-Strich mit weißer
 * Füllung (halbe Diagonale 13 mm), Führerkappe als gefülltes Dreieck bzw. Fachberater-Kappe als
 * 0,5-mm-Strich, zwei Wellen als offene 0,5-mm-Strichkubiken und die Innenraute als 0,5-mm-Strich.
 */
const STANDARD_BODY = {
  field: [[16, 4.978], [29, 17.978], [16, 30.978], [3, 17.978]],
  cap: {
    type: 'polyline', points: [[16, 4.978], [21, 10], [11, 10]], closed: true,
    style: { fill: 'schwarz', stroke: 'none' },
  },
  inner: [[16, 17], [20, 21], [16, 25], [12, 21]],
  waves: [
    'M 12 13.5 C 12.73 13.5 13.27 12.5 14 12.5 C 14.73 12.5 15.27 13.5 16 13.5 ' +
      'C 16.73 13.5 17.27 12.5 18 12.5 C 18.73 12.5 19.27 13.5 20 13.5',
    'M 12 15.5 C 12.73 15.5 13.27 14.5 14 14.5 C 14.73 14.5 15.27 15.5 16 15.5 ' +
      'C 16.73 15.5 17.27 14.5 18 14.5 C 18.73 14.5 19.27 15.5 20 15.5',
  ],
} as const;

const ADVISOR_BODY = {
  field: [[16, 2.978], [29, 15.978], [16, 28.978], [3, 15.978]],
  cap: {
    type: 'line', x1: 11, y1: 8, x2: 21, y2: 8,
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 },
  },
  inner: [[16, 15], [20, 19], [16, 23], [12, 19]],
  waves: [
    'M 12 11.5 C 12.73 11.5 13.27 10.5 14 10.5 C 14.73 10.5 15.27 11.5 16 11.5 ' +
      'C 16.73 11.5 17.27 10.5 18 10.5 C 18.73 10.5 19.27 11.5 20 11.5',
    'M 12 13.5 C 12.73 13.5 13.27 12.5 14 12.5 C 14.73 12.5 15.27 13.5 16 13.5 ' +
      'C 16.73 13.5 17.27 12.5 18 12.5 C 18.73 12.5 19.27 13.5 20 13.5',
  ],
} as const;

const HALF_MM_STROKE = { fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 } as const;

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

  it('konstruiert Raute, Kappe, Wellen und Innenraute aus 0,5-mm-Strichen und echten Füllungen', () => {
    const definitions = ALL_PICTOGRAMS.filter((definition) =>
      definition.id.startsWith('water-rescue-personnel.'),
    );

    expect(definitions).toHaveLength(5);
    for (const [index, definition] of definitions.entries()) {
      const expected = index === 4 ? ADVISOR_BODY : STANDARD_BODY;
      expect(definition?.primitives[0]).toEqual({
        type: 'polyline', role: 'pictogram', points: expected.field, closed: true,
        style: { ...HALF_MM_STROKE, fill: 'weiss' },
      });
      expect(definition?.primitives[1]).toEqual({ ...expected.cap, role: 'pictogram' });
      expect(definition?.primitives.slice(2, 4)).toEqual(expected.waves.map((d) => ({
        type: 'path', role: 'pictogram', d, style: HALF_MM_STROKE,
      })));
      expect(definition?.primitives[4]).toEqual({
        type: 'polyline', role: 'pictogram', points: expected.inner, closed: true,
        style: HALF_MM_STROKE,
      });
    }
  });

  it('liefert die Wellen als offene Kubiken nur mit absoluten M/C-Kommandos an die Pfad-Gates', () => {
    const wavePaths = WATER_RESCUE_PERSONNEL_PICTOGRAMS.flatMap((definition) =>
      definition.primitives.slice(2, 4),
    );

    expect(wavePaths).toHaveLength(10);
    for (const wave of wavePaths) {
      expect(wave.type).toBe('path');
      if (wave.type !== 'path') continue;
      const tokenized = tokenizePath(wave.d);
      expect(tokenized.problems, wave.d).toEqual([]);
      expect(new Set(tokenized.commands.map(({ command }) => command))).toEqual(
        new Set(['M', 'C']),
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
