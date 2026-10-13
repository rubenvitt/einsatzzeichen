import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderSvg } from '../../render/svg.js';
import { type Drawing } from '@einsatzzeichen/schema';
import { ALL_PICTOGRAMS, LEGACY_PICTOGRAMS, pictogramRenderId } from './index.js';
import { describePictogram } from '../labels.js';

/**
 * Ein Piktogramm allein als Zeichnung — ohne Grundzeichen, ohne Kopfzone, ohne Verschiebung.
 * Das ist der Regressionsschutz, den `matchFingerprint` für Piktogramme strukturell nicht leisten
 * kann: es vergleicht ausschließlich `role: 'body'`. Der Snapshot ist damit die dritte der vier
 * Bedingungen, die für Piktogramme an die Stelle von `technical: approved` treten
 * (Slice-3-Spec, Abschnitt 7).
 */
describe('Piktogramm-Snapshots', () => {
  it('schreibt exakt 269 eigenständige Piktogramm-Snapshots', () => {
    const snapshots = readdirSync(new URL('./__snapshots__/', import.meta.url), {
      withFileTypes: true,
    }).filter((entry) => entry.isFile() && entry.name.endsWith('.svg'));
    const names = snapshots.map((entry) => entry.name);
    expect(snapshots).toHaveLength(269);
    for (const id of [
      'team-leader',
      'group-leader',
      'platoon-leader',
      'formation-leader',
      'technical-advisor',
    ]) {
      expect(names).toContain(`water-rescue-personnel.${id}.svg`);
    }
  });

  it.each(ALL_PICTOGRAMS.map((definition) => [pictogramRenderId(definition), definition] as const))(
    'rendert %s unverändert',
    async (id, definition) => {
      const drawing: Drawing = {
        viewBox: definition.viewBox,
        children: definition.primitives,
        title: definition.title,
        description: describePictogram(definition),
      };
      await expect(renderSvg(drawing, { size: 64 })).toMatchFileSnapshot(
        `./__snapshots__/${id}.svg`,
      );
    },
  );
});

/**
 * Die Altzeichen (ESZ-137) in einem eigenen Unterordner: Der Hauptordner zählt die Piktogramme der
 * Baseline, und dort bleibt die Zahl eine Aussage über `ALL_PICTOGRAMS`.
 */
describe('Snapshots der Altzeichen (DV 102, Kapitel 8 und 10.3)', () => {
  it('schreibt genau einen Snapshot je Altzeichen', () => {
    const snapshots = readdirSync(new URL('./__snapshots__/legacy/', import.meta.url)).filter((name) =>
      name.endsWith('.svg'),
    );
    expect(snapshots.sort()).toEqual(
      LEGACY_PICTOGRAMS.map((definition) => `${pictogramRenderId(definition)}.svg`).sort(),
    );
  });

  it.each(LEGACY_PICTOGRAMS.map((definition) => [pictogramRenderId(definition), definition] as const))(
    'rendert %s unverändert',
    async (id, definition) => {
      const drawing: Drawing = {
        viewBox: definition.viewBox,
        children: definition.primitives,
        title: definition.title,
        description: describePictogram(definition),
      };
      await expect(renderSvg(drawing, { size: 64 })).toMatchFileSnapshot(
        `./__snapshots__/legacy/${id}.svg`,
      );
    },
  );
});
