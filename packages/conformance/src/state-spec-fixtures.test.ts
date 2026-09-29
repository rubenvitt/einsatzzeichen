import { describe, expect, it } from 'vitest';
import { STATE_IDS, type StateId, type SymbolSpec } from '@einsatzzeichen/schema';
import { drawSymbol, matchFingerprint, pictogram, stateCarriersOf, strokeBoundsOfMm } from '@einsatzzeichen/core';
import fingerprints from './fingerprints.json' with { type: 'json' };

/**
 * Zustände als Spec gegen das Kennzahlenartefakt (LFH-577, Integrationsschritt).
 *
 * `state-group-fixtures.test.ts` hält die abgelesenen Zahlen der Lagen fest; hier geht derselbe
 * Bestand über den öffentlichen Weg: eine `SymbolSpec` mit `states`, gezeichnet mit
 * `drawSymbol()`, gegen den Eintrag der Referenzdatei. Verglichen werden die Zeichenfläche und die
 * Hülle des Trägers (`matchFingerprint`, Rolle `body`) — das Artefakt erfasst gefüllte Flächen,
 * nicht die umgewandelten Pfade der Marken.
 */

interface Fingerprint {
  readonly asset: string;
  readonly viewBox?: { readonly width: number; readonly height: number };
  readonly shapes: readonly {
    readonly kind: string;
    readonly boundsMm: { minXMm: number; minYMm: number; maxXMm: number; maxYMm: number };
  }[];
}

const FINGERPRINTS = fingerprints as readonly Fingerprint[];
/** Die Referenz misst in Punkt: 1 mm = 72 / 25,4 pt. */
const PT_PER_MM = 72 / 25.4;

function fingerprintOf(asset: string): Fingerprint {
  const found = FINGERPRINTS.find((candidate) => candidate.asset === asset);
  if (found === undefined) throw new Error(`Kein Eintrag im Kennzahlenartefakt: ${asset}`);
  return found;
}

/**
 * Referenzdateien, zu denen das Artefakt nur die Umrisshülle aller Tinte führt, und die Kanten
 * dieser Hülle, die allein der Strichumriss der Raute setzt:
 *
 * - 5.8.8.12 bis 5.8.8.14: rechts und unten reicht der Transportpfeil über die Raute hinaus
 *   (bis x 30 und unter y 27), links und oben begrenzt die angehobene Raute.
 * - 5.8.8.16: links steht ein senkrechter Balken (x 2,75…3,25 mm, 12 mm hoch), an dem die
 *   Referenz die Rautenecke kappt; oben, rechts und unten begrenzt die Raute.
 */
const OUTLINE_ONLY_EDGES: Readonly<Record<string, readonly ('minX' | 'minY' | 'maxX' | 'maxY')[]>> = {
  '5.8.8.12_Person zu transportieren.svg': ['minX', 'minY'],
  '5.8.8.13_Transport einer Person.svg': ['minX', 'minY'],
  '5.8.8.14_Person transportiert.svg': ['minX', 'minY'],
  '5.8.8.16_Person pflegebedürftig.svg': ['minY', 'maxX', 'maxY'],
};

function expectMatches(spec: SymbolSpec, asset: string): void {
  const drawing = drawSymbol(spec);
  const fingerprint = fingerprintOf(asset);
  expect(fingerprint.viewBox, asset).toBeDefined();
  expect(drawing.viewBox.width, asset).toBeCloseTo((fingerprint.viewBox?.width ?? 0) / PT_PER_MM, 2);
  expect(drawing.viewBox.height, asset).toBeCloseTo((fingerprint.viewBox?.height ?? 0) / PT_PER_MM, 2);
  const [outline, ...others] = fingerprint.shapes;
  if (outline?.kind === 'outline' && others.length === 0) {
    // Das Artefakt führt hier nur die Umrisshülle aller Tinte. Verglichen werden die Kanten, die
    // allein die Raute begrenzt (`OUTLINE_ONLY_EDGES`); die übrigen setzt eine zweite Figur.
    const edges = OUTLINE_ONLY_EDGES[asset];
    expect(edges, `${asset}: Umrisshülle ohne benannte Rautenkanten`).toBeDefined();
    const body = drawing.children.find((child) => child.role === 'body');
    expect(body, asset).toBeDefined();
    if (body === undefined || edges === undefined) return;
    const stroke = strokeBoundsOfMm(body);
    const reference = {
      minX: outline.boundsMm.minXMm,
      minY: outline.boundsMm.minYMm,
      maxX: outline.boundsMm.maxXMm,
      maxY: outline.boundsMm.maxYMm,
    };
    for (const edge of edges) expect(stroke[edge], `${asset} ${edge}`).toBeCloseTo(reference[edge], 2);
    return;
  }
  const result = matchFingerprint(drawing, fingerprint);
  expect(result.problems, asset).toEqual([]);
  expect(result.ok, asset).toBe(true);
}

describe('Zustände als Spec gegen das Kennzahlenartefakt', () => {
  it('Person, verletzt, mit „?": 5.8.1 Beispiel 3 auf der 36 mm breiten Fläche', () => {
    expectMatches({ kind: 'person', states: ['person-injured', 'suspected-situation'] }, '5.8.1_Beispiel 3.svg');
  });

  it('Gefahr mit „?" und mit „!": 5.8.1.13_2 und 5.8.1.14_2', () => {
    expectMatches({ kind: 'hazard', states: ['suspected-situation'] }, '5.8.1.13_Hinweis auf Vermutung_2.svg');
    expectMatches({ kind: 'hazard', states: ['acute-situation'] }, '5.8.1.14_Hinweis auf akute Situation_2.svg');
  });

  it('jeder Personenzustand aus 5.8.8 in seiner Rautenlage gegen seine eigene Referenzdatei', () => {
    const persons = STATE_IDS.filter((value): value is StateId => value.startsWith('person-'));
    expect(persons).toHaveLength(17);
    for (const value of persons) {
      expect(stateCarriersOf(value), value).toEqual(['base-symbol/person']);
      expectMatches({ kind: 'person', states: [value] }, pictogram(`state.${value}`).referenceAsset);
    }
  });
});
