import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BLOCK_REGISTER } from '@einsatzzeichen/core';
import type {
  AdminLevelId,
  BlockCategory,
  BlockEntry,
  StrengthId,
  TechnicalHeadMarkId,
} from '@einsatzzeichen/schema';
import { administrativeHead } from '@einsatzzeichen/core';
import { ALL_PICTOGRAMS } from '@einsatzzeichen/core';
import { RECIPES } from '../recipes.js';
import { strengthHead } from '@einsatzzeichen/core';
import { technicalHeadMark } from '@einsatzzeichen/core';

/**
 * Laufzeit-Gate des Bausteinregisters für die Kopfzone (LFH-564). Das Register nennt nur Fundorte
 * in `core/src/geometry/`; deshalb prüft erst dieser Test, ob sie wirklich zu Geometrie führen.
 * Er bleibt im Prüfpaket, weil er zusätzlich die Rezepte liest. Wird ein Wert neu vermessen oder
 * verschwindet eine Zeichnung, bricht er, und das Register muss nachgezogen werden.
 */

const packagesRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

/** `pfad.ts:12` oder `pfad.ts:12–30`, relativ zu `packages/`. */
const PLACE = /^([a-z0-9/.-]+\.ts):(\d+)(?:–(\d+))?$/;

/** Der Quelltext im Bereich eines Fundorts. */
function sourceAt(place: string): string {
  const match = PLACE.exec(place);
  if (match === null) throw new Error(`${place}: kein Fundort der Form pfad.ts:zeile[–zeile]`);
  const [, file, from, to] = match as unknown as [string, string, string, string | undefined];
  const lines = readFileSync(join(packagesRoot, file), 'utf8').split('\n');
  return lines.slice(Number(from) - 1, Number(to ?? from)).join('\n');
}

function entries(category: BlockCategory): readonly BlockEntry[] {
  return BLOCK_REGISTER[category];
}

function measuredEntries(category: BlockCategory): readonly BlockEntry[] {
  return entries(category).filter((entry) => entry.binding.status === 'measured');
}

function notMeasuredEntries(category: BlockCategory): readonly BlockEntry[] {
  return entries(category).filter((entry) => entry.binding.status === 'not-measured');
}

function definedAt(entry: BlockEntry): string {
  return entry.binding.status === 'measured'
    ? entry.binding.geometry.definedAt
    : entry.binding.gap.definedAt;
}

/**
 * Der Name, der im Fundort eines vermessenen Eintrags stehen muss. Die Konstanten heißen in
 * `catalog` nach dem Wert, aber in Großbuchstaben (`kreis` → `KREIS`,
 * `single-vertical-bar` → `SINGLE_VERTICAL_BAR`). Bei der Stärke gibt es keine Konstante je Wert:
 * `trupp`, `gruppe` und `zug` stehen als Schlüssel in `ROW_OCCUPANCY`, die Staffel als
 * `STACK_CY_FROM_TOP_MM`. Rutscht eine Zeile weg, fällt der Name aus dem Bereich.
 */
function expectedKey(entry: BlockEntry): string {
  if (entry.category === 'strength') {
    return entry.valueId === 'staffel' ? 'STACK_CY_FROM_TOP_MM' : `${entry.valueId}:`;
  }
  return `const ${entry.valueId.toUpperCase().replace(/-/g, '_')}`;
}

describe('Bausteinregister, Kopfzone: vermessene Einträge lösen sich zu Geometrie auf', () => {
  it('Stärke: strengthHead liefert je vermessenem Wert mindestens eine Marke', () => {
    expect(measuredEntries('strength').map((entry) => entry.valueId).sort()).toEqual(
      ['gruppe', 'staffel', 'trupp', 'zug'],
    );
    for (const entry of measuredEntries('strength')) {
      const shape = strengthHead(entry.valueId as StrengthId);
      expect(shape.marks.length, entry.id).toBeGreaterThan(0);
      expect(shape.heightMm, entry.id).toBeGreaterThan(0);
    }
  });

  it('Verwaltungsstufe: administrativeHead liefert je vermessenem Wert Primitive', () => {
    expect(measuredEntries('administrative-level').map((entry) => entry.valueId).sort()).toEqual(
      ['europaeische-union', 'kreis', 'nationalstaat'],
    );
    for (const entry of measuredEntries('administrative-level')) {
      const shape = administrativeHead(entry.valueId as AdminLevelId);
      expect(shape, entry.id).toBeDefined();
      expect(shape!.primitives.length, entry.id).toBeGreaterThan(0);
    }
  });

  it('Technische Kopfmarke: technicalHeadMark liefert je vermessenem Wert Primitive', () => {
    expect(measuredEntries('technical-head-mark').map((entry) => entry.valueId).sort()).toEqual(
      ['double-vertical-bar', 'single-vertical-bar'],
    );
    for (const entry of measuredEntries('technical-head-mark')) {
      const shape = technicalHeadMark(entry.valueId as TechnicalHeadMarkId);
      expect(shape.primitives.length, entry.id).toBeGreaterThan(0);
    }
  });

  it('nennt im Fundort jedes vermessenen Eintrags den Namen der Definition', () => {
    const categories: readonly BlockCategory[] = ['strength', 'administrative-level', 'technical-head-mark'];
    const problems = categories
      .flatMap(measuredEntries)
      .filter((entry) => !sourceAt(definedAt(entry)).includes(expectedKey(entry)))
      .map((entry) => `${entry.id}: "${expectedKey(entry)}" fehlt in ${definedAt(entry)}`);
    expect(problems).toEqual([]);
  });
});

describe('Bausteinregister, Kopfzone: Lücken lösen sich nicht auf', () => {
  it('Verwaltungsstufe: administrativeHead liefert für Gemeinde, Bezirk und Bundesland nichts', () => {
    expect(notMeasuredEntries('administrative-level').map((entry) => entry.valueId).sort()).toEqual(
      ['bezirk', 'bundesland', 'gemeinde'],
    );
    for (const entry of notMeasuredEntries('administrative-level')) {
      expect(administrativeHead(entry.valueId as AdminLevelId), entry.id).toBeUndefined();
    }
  });

  /**
   * Für den Verband gibt es keinen Resolver, gegen den man die Lücke laufen lassen könnte. Geprüft
   * wird, was sich ohne ihn prüfen lässt: kein Rezept und kein Piktogramm baut eine der drei
   * Referenzdateien 5.5.1–5.5.3 nach, und kein Katalogmodul außerhalb der Tests nennt eine der
   * Kennungen. **Grenze:** eine Verbandsgeometrie unter anderem Namen, etwa als Balkenmarke, fängt
   * das nicht. Die zwei Balken von `double-vertical-bar` sind laut Befund zu E.1.31 ausdrücklich
   * kein Verband.
   */
  it('Verband: der Katalog führt keine Geometrie unter den Verbandskennungen', () => {
    const gaps = notMeasuredEntries('unit-grouping');
    expect(gaps.map((entry) => entry.valueId).sort()).toEqual(['verband-i', 'verband-ii', 'verband-iii']);
    expect(measuredEntries('unit-grouping')).toEqual([]);

    const assets = [
      ...Object.values(RECIPES).map((recipe) => recipe.referenceAsset),
      ...ALL_PICTOGRAMS.map((pictogram) => pictogram.referenceAsset),
    ];
    expect(assets.filter((asset) => asset.startsWith('5.5.'))).toEqual([]);

    // Seit LFH-570 liegt die Geometrie in `core/src/geometry/`; geprüft werden sie und der Rest
    // des Katalogs. Das Register selbst (`core/src/blocks/`) nennt die Kennungen zwangsläufig.
    const roots = [join(packagesRoot, 'catalog', 'src'), join(packagesRoot, 'core', 'src', 'geometry')];
    const hits = roots.flatMap((root) =>
      (readdirSync(root, { recursive: true }) as string[])
        .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))
        .filter((file) => !file.startsWith('block-register'))
        .flatMap((file) => {
          const text = readFileSync(join(root, file), 'utf8');
          return gaps
            .filter((entry) => text.includes(`'${entry.valueId}'`))
            .map((entry) => `${file}: ${entry.valueId}`);
        }),
    );
    expect(hits).toEqual([]);
  });

  it('Verband: die Begründung nennt die Referenzdatei', () => {
    const files: Record<string, string> = {
      'verband-i': '5.5.1_Bereitschaft (Verband I).svg',
      'verband-ii': '5.5.2_Bereitschaft (Verband II).svg',
      'verband-iii': '5.5.3_Bereitschaft (Verband III).svg',
    };
    for (const entry of entries('unit-grouping')) {
      if (entry.binding.status === 'measured') throw new Error(`${entry.id} ist vermessen`);
      expect(entry.binding.gap.reason, entry.id).toContain(files[entry.valueId]);
    }
  });
});

describe('Bausteinregister, Kopfzone: benannte Ausnahmen', () => {
  it('bindet alle sechs Verwaltungsstufen über administrative-level-not-measured', () => {
    const bound = entries('administrative-level');
    expect(bound).toHaveLength(6);
    for (const entry of bound) {
      expect(entry.combinationBinding?.ruleId, entry.id).toBe('administrative-level-not-measured');
    }
  });

  it('führt Stärke, Verband und technische Kopfmarke ohne Kombinationsbindung', () => {
    const categories: readonly BlockCategory[] = ['strength', 'unit-grouping', 'technical-head-mark'];
    const bound = categories.flatMap(entries).filter((entry) => entry.combinationBinding !== undefined);
    expect(bound.map((entry) => entry.id)).toEqual([]);
  });

  it('nennt die Regel-ID jeder Kombinationsbindung im genannten Fundort', () => {
    const categories: readonly BlockCategory[] = [
      'strength',
      'unit-grouping',
      'administrative-level',
      'technical-head-mark',
    ];
    const problems = categories
      .flatMap(entries)
      .flatMap((entry) => (entry.combinationBinding === undefined ? [] : [{ entry, binding: entry.combinationBinding }]))
      .filter(({ binding }) => !sourceAt(binding.definedAt).includes(`'${binding.ruleId}'`))
      .map(({ entry, binding }) => `${entry.id}: '${binding.ruleId}' fehlt in ${binding.definedAt}`);
    expect(problems).toEqual([]);
  });

  it('zeigt mit der Bindung auf die Stelle, die Kopf und Funktionsfassung gemeinsam fordert', () => {
    for (const entry of entries('administrative-level')) {
      const text = sourceAt(entry.combinationBinding!.definedAt);
      expect(text, entry.id).toContain('context.administrativeHead === undefined');
      expect(text, entry.id).toContain('!resolvedFunctionRole');
    }
  });
});
