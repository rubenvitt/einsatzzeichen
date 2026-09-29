import { describe, expect, it } from 'vitest';
import { BLOCK_REGISTER, boundsOfMm, drawSymbol, technicalHeadMark } from '@einsatzzeichen/core';
import type { SourceReference, SymbolSpec, TechnicalHeadMarkId, UnitGroupingId } from '@einsatzzeichen/schema';
import fingerprints from './fingerprints.json' with { type: 'json' };
import { RECIPES } from './recipes.js';

/**
 * Gate der Verbandsmarken aus 5.5 gegen das Kennzahlenartefakt (LFH-577).
 *
 * `core/src/geometry/unit-groupings.test.ts` hält fest, dass Verband I und II dieselbe Zeichnung
 * wie `single-vertical-bar` und `double-vertical-bar` sind; hier wird diese Zeichnung, 1 mm unter
 * die Oberkante gesetzt wie `placeHead` es am Formationskörper tut, gegen jede im Register genannte
 * Anhangsdatei gehalten. Seit dem Integrationsschritt tragen die sechs Rezepte mit diesen Balken
 * das Feld `unitGrouping` (Entscheidung 8 des Eigentümers vom 29.09.2026); der letzte Block hält
 * fest, dass sich dabei nur die Beschreibung ändert und nicht das Bild.
 */

interface Bounds {
  readonly minXMm: number;
  readonly minYMm: number;
  readonly maxXMm: number;
  readonly maxYMm: number;
}

interface Fingerprint {
  readonly asset: string;
  readonly shapes: readonly { readonly kind: string; readonly boundsMm: Bounds; readonly fill?: string }[];
}

const FINGERPRINTS = fingerprints as readonly Fingerprint[];

/** Kopfzone am Formationskörper: Oberkante y 1 (Anker 6 − Abstand 1 − Höhe 4). */
const HEAD_TOP_ON_FORMATION_MM = 1;
/** I.5.7: der Balken reicht am Personenkörper bis y 0. */
const HEAD_TOP_ON_PERSON_MM = 0;

function fingerprintOfSection(section: string): Fingerprint {
  const found = FINGERPRINTS.filter((entry) => entry.asset.startsWith(`${section}_`));
  expect(found.map((entry) => entry.asset), section).toHaveLength(1);
  return found[0] as Fingerprint;
}

/** Die Hülle aller Balken einer Kopfmarke, auf die Kopfoberkante gesetzt. */
function hullAt(id: 'single-vertical-bar' | 'double-vertical-bar', topMm: number): Bounds {
  const boxes = technicalHeadMark(id).primitives.map(boundsOfMm);
  return {
    minXMm: Math.min(...boxes.map((box) => box.minX)),
    minYMm: Math.min(...boxes.map((box) => box.minY)) + topMm,
    maxXMm: Math.max(...boxes.map((box) => box.maxX)),
    maxYMm: Math.max(...boxes.map((box) => box.maxY)) + topMm,
  };
}

function annexSections(valueId: 'verband-i' | 'verband-ii'): readonly string[] {
  const entry = BLOCK_REGISTER['unit-grouping'].find((candidate) => candidate.valueId === valueId);
  if (entry?.binding.status !== 'measured') throw new Error(`${valueId} ist nicht vermessen`);
  const refs: readonly SourceReference[] = entry.binding.geometry.sourceRefs ?? [];
  return refs
    .map((ref) => ref.section)
    .filter((section): section is string => section !== undefined && !section.startsWith('5.5'));
}

describe('Verband gegen das Kennzahlenartefakt', () => {
  it('Verband I: jede genannte Anhangsdatei führt den Balken x 15,25…16,75 in der Kopfzone', () => {
    const sections = annexSections('verband-i');
    expect([...sections].sort()).toEqual(['C.1.6', 'F.1.13', 'F.1.21', 'I.1.4', 'I.5.7']);
    for (const section of sections) {
      const top = section === 'I.5.7' ? HEAD_TOP_ON_PERSON_MM : HEAD_TOP_ON_FORMATION_MM;
      const expected = hullAt('single-vertical-bar', top);
      const shapes = fingerprintOfSection(section).shapes.map((shape) => shape.boundsMm);
      expect(shapes, section).toContainEqual(expected);
    }
  });

  it('Verband II: jede genannte Anhangsdatei führt die zwei Balken x 11,25…20,75 in der Kopfzone', () => {
    const sections = annexSections('verband-ii');
    expect([...sections].sort()).toEqual(['E.1.31', 'F.1.1', 'F.1.3']);
    const expected = hullAt('double-vertical-bar', HEAD_TOP_ON_FORMATION_MM);
    for (const section of sections) {
      const shapes = fingerprintOfSection(section).shapes.map((shape) => shape.boundsMm);
      expect(shapes, section).toContainEqual(expected);
    }
  });

  it('die Kapiteldateien zeigen die Marke vergrößert: Balken 4 × 10 mm statt 1,5 × 4 mm', () => {
    expect(fingerprintOfSection('5.5.1').shapes.map((shape) => shape.boundsMm)).toEqual([
      { minXMm: 14, minYMm: 11, maxXMm: 18, maxYMm: 21 },
    ]);
    for (const section of ['5.5.2', '5.5.3']) {
      expect(fingerprintOfSection(section).shapes.map((shape) => shape.boundsMm), section).toEqual([
        { minXMm: 5, minYMm: 11, maxXMm: 27, maxYMm: 21 },
      ]);
    }
  });
});

/** Die Rezepte, die bis LFH-577 den Verband als technische Kopfmarke trugen. */
const UNIT_GROUPING_RECIPES: readonly (readonly [keyof typeof RECIPES, UnitGroupingId])[] = [
  ['I.1.4', 'verband-i'],
  ['F.1.13', 'verband-i'],
  ['F.1.21', 'verband-i'],
  ['F.1.1', 'verband-ii'],
  ['F.1.3', 'verband-ii'],
  ['E.1.31', 'verband-ii'],
];

const SAME_DRAWING: Readonly<Record<'verband-i' | 'verband-ii', TechnicalHeadMarkId>> = {
  'verband-i': 'single-vertical-bar',
  'verband-ii': 'double-vertical-bar',
};

describe('Rezepte mit Verband (LFH-577, Entscheidung 8)', () => {
  it('tragen den Verband im eigenen Feld und keine technische Kopfmarke mehr', () => {
    for (const [section, unitGrouping] of UNIT_GROUPING_RECIPES) {
      const spec: SymbolSpec = RECIPES[section].spec;
      expect(spec.unitGrouping, section).toBe(unitGrouping);
      expect(spec.technicalHeadMark, section).toBeUndefined();
    }
  });

  it('zeichnen dasselbe Bild wie mit der gleich gebauten technischen Kopfmarke', () => {
    for (const [section, unitGrouping] of UNIT_GROUPING_RECIPES) {
      const spec: SymbolSpec = RECIPES[section].spec;
      const { unitGrouping: _moved, ...rest } = spec;
      const before = drawSymbol({ ...rest, technicalHeadMark: SAME_DRAWING[unitGrouping as 'verband-i' | 'verband-ii'] });
      const after = drawSymbol(RECIPES[section].spec);
      expect(after.children, section).toEqual(before.children);
      expect(after.viewBox, section).toEqual(before.viewBox);
      // Nur die Beschreibung gewinnt die Bedeutung: dieselbe Stelle, der Verband statt der Marke.
      expect(after.description, section).toBe(
        before.description?.replace(
          /Technische Kopfmarke: (Einzelner Vertikalbalken|Zwei Vertikalbalken)/u,
          `Verband: ${unitGrouping === 'verband-i' ? 'Verband I' : 'Verband II'}`,
        ),
      );
    }
  });
});
