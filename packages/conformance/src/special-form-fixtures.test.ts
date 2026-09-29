import { describe, expect, it } from 'vitest';
import { SPECIAL_FORMS, specialForm, strokeBoundsOfMm } from '@einsatzzeichen/core';
import type { SpecialFormId, ZoneBoundsMm } from '@einsatzzeichen/schema';
import fingerprints from './fingerprints.json' with { type: 'json' };

/**
 * Gate der Sonderformen 3.6 bis 3.9 (LFH-567, vermessen in LFH-577) gegen das eingecheckte
 * Kennzahlenartefakt. Die Referenzdateien selbst sind nicht eingecheckt. Seit dem 29.09.2026 sind
 * die Formen an den Dateien abgelesen (`core/src/geometry/special-form-bodies.ts`); hier wird
 * gehalten, was das Artefakt davon erfasst: die Hüllen von 3.6 und 3.9. Dass die Zeichnung dieselben
 * Zahlen trägt wie `SPECIAL_FORMS`, prüft `core/src/layout/special-forms.test.ts`.
 */

interface Bounds {
  readonly minXMm: number;
  readonly minYMm: number;
  readonly maxXMm: number;
  readonly maxYMm: number;
}

interface Fingerprint {
  readonly asset: string;
  readonly viewBox?: { readonly width: number; readonly height: number };
  readonly layers?: readonly string[];
  readonly fills?: readonly string[];
  readonly shapes: readonly { readonly kind: string; readonly boundsMm: Bounds; readonly fill?: string }[];
  readonly curvedPaths?: number;
}

const FINGERPRINTS = fingerprints as readonly Fingerprint[];
const PT_PER_MM = 72 / 25.4;
const FILL_LAYER = 'Flächige_Fülung';

function fingerprintOf(asset: string): Fingerprint {
  const found = FINGERPRINTS.find((candidate) => candidate.asset === asset);
  if (found === undefined) throw new Error(`Kein Eintrag im Kennzahlenartefakt: ${asset}`);
  return found;
}

function fromArtifact(bounds: Bounds): ZoneBoundsMm {
  return { minX: bounds.minXMm, minY: bounds.minYMm, maxX: bounds.maxXMm, maxY: bounds.maxYMm };
}

/** Eine benannte Hülle der Körperzone aus `SPECIAL_FORMS`. */
function zoneBounds(id: SpecialFormId, measureId: string): ZoneBoundsMm {
  const body = specialForm(id).zones.body;
  if (body.status !== 'measured') throw new Error(`${id}: Körperzone nicht vermessen`);
  const measure = body.measures.find((candidate) => candidate.id === measureId);
  if (measure?.kind !== 'bounds') throw new Error(`${id}: keine Hülle "${measureId}"`);
  return measure.boundsMm;
}

describe('Sonderformen gegen das Kennzahlenartefakt', () => {
  it('führt für jede Sonderform genau eine Datei ihres Abschnitts, auf der 32-mm-Fläche', () => {
    for (const form of SPECIAL_FORMS) {
      const sameSection = FINGERPRINTS.filter((entry) => entry.asset.startsWith(`${form.section}_`));
      expect(sameSection.map((entry) => entry.asset), form.id).toEqual([form.asset]);
      const viewBox = fingerprintOf(form.asset).viewBox;
      expect((viewBox?.width ?? 0) / PT_PER_MM, form.id).toBeCloseTo(32, 2);
      expect((viewBox?.height ?? 0) / PT_PER_MM, form.id).toBeCloseTo(32, 2);
    }
  });

  it('findet an keiner der vier Dateien die Füllebene, in Kapitel 1 nur an den zwei Strichzeichen nicht', () => {
    for (const form of SPECIAL_FORMS) {
      expect(fingerprintOf(form.asset).layers, form.id).not.toContain(FILL_LAYER);
    }
    const chapterOne = FINGERPRINTS.filter((entry) => /^1\.\d+_/u.test(entry.asset));
    expect(chapterOne).toHaveLength(14);
    const withoutFill = chapterOne.filter((entry) => !(entry.layers ?? []).includes(FILL_LAYER));
    expect(withoutFill.map((entry) => entry.asset).sort()).toEqual([
      '1.13_Ereignis.svg',
      '1.14_Spontanhelfer.svg',
    ]);
    for (const entry of withoutFill) expect(entry.fills, entry.asset).toEqual([]);
  });

  it('3.6: das gefüllte Sechseck der Drohne trifft die einzige Hülle des Artefakts, ohne Füllebenenfarbe', () => {
    const drone = fingerprintOf(specialForm('drone').asset);
    // `fills: []` heißt: keine Farbe außer Schwarz. Das Sechseck ist Tinte, keine färbbare Fläche.
    expect(drone.fills).toEqual([]);
    expect(drone.curvedPaths).toBe(0);
    expect(drone.shapes).toHaveLength(1);
    const [hull] = drone.shapes;
    expect(hull?.kind).toBe('bounds');
    expect(hull?.fill).toBeUndefined();
    expect(zoneBounds('drone', 'reference-hull')).toEqual(fromArtifact(hull!.boundsMm));
  });

  /**
   * Das Artefakt erfasst Kurvenpfade nicht. Die Zahlen der Zweiräder (Halbbogen r 6 um (16|10),
   * Stiele bis y 28) sind an den Dateien selbst abgelesen und stehen nur in
   * `core/src/geometry/special-form-bodies.ts`; gegen das Artefakt lässt sich allein prüfen, dass es
   * keine andere Form behauptet.
   */
  it('3.7/3.8: das Artefakt führt keine Form, nur einen Kurvenpfad ohne Farbe', () => {
    for (const id of ['two-wheeler', 'motorized-two-wheeler'] as const) {
      const entry = fingerprintOf(specialForm(id).asset);
      expect(entry.shapes, id).toEqual([]);
      expect(entry.curvedPaths, id).toBe(1);
      expect(entry.fills, id).toEqual([]);
    }
  });

  /**
   * Die Vorlage vom 28.09. las hier „eine graue Fläche mit der Hülle 1,837/1,671/30,162/14,19". Die
   * Datei trennt das anders: die Hülle gehört zum **schwarzen** Giebel (ein Polygon ohne
   * Füllangabe, `kind: 'bounds'`), das Grau `#bebebe` zum gestrichelten Platzhalterkreis, einem
   * Kurvenpfad, den das Artefakt nur zählt.
   */
  it('3.9: die Hülle ist der schwarze Giebel, das Grau gehört zum Kurvenpfad des Platzhalters', () => {
    const structure = fingerprintOf(specialForm('temporary-fixed-structure').asset);
    expect(structure.fills).toEqual(['#bebebe']);
    expect(structure.curvedPaths).toBe(1);
    expect(structure.shapes).toHaveLength(1);
    const [roof] = structure.shapes;
    expect(roof?.kind).toBe('bounds');
    expect(roof?.fill).toBeUndefined();
    expect(zoneBounds('temporary-fixed-structure', 'ink-hull')).toEqual(fromArtifact(roof!.boundsMm));
  });

  it('3.9: derselbe Giebel steht am Körper über dem 12-mm-Kreis, dort auf (3|11) → (16|1) → (29|11)', () => {
    const roofAtBody = strokeBoundsOfMm({
      type: 'polyline',
      points: [[3, 11], [16, 1], [29, 11]],
      style: { strokeWidth: 0.5 },
    });
    const bounds = fingerprintOf('F.3.5_Behandlungsplatz 50_ortsgebunden.svg').shapes.find(
      (shape) => shape.kind === 'bounds',
    )?.boundsMm;
    expect(bounds).toBeDefined();
    expect(roofAtBody.minX).toBeCloseTo(bounds!.minXMm, 2);
    expect(roofAtBody.minY).toBeCloseTo(bounds!.minYMm, 2);
    expect(roofAtBody.maxX).toBeCloseTo(bounds!.maxXMm, 2);
    expect(roofAtBody.maxY).toBeCloseTo(bounds!.maxYMm, 2);
    const related = specialForm('temporary-fixed-structure').relatedKind;
    expect(related.status === 'evidenced' ? related.value : null).toBe('circle-12');
  });
});
