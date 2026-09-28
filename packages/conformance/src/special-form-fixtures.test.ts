import { describe, expect, it } from 'vitest';
import { SPECIAL_FORMS, specialForm } from '@einsatzzeichen/core';
import fingerprints from './fingerprints.json' with { type: 'json' };

/**
 * Gate der Sonderformen 3.6 bis 3.9 (LFH-567) gegen das eingecheckte Kennzahlenartefakt. Die
 * Referenzdateien selbst sind nicht eingecheckt; jede Zahl in `SPECIAL_FORMS` und jede Aussage über
 * die Dateien stammt aus dem Artefakt und wird hier dagegen gehalten.
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

  it('liest die Hülle der Drohne als einzige Form, ohne Füllung', () => {
    const drone = fingerprintOf(specialForm('drone').asset);
    expect(drone.fills).toEqual([]);
    expect(drone.shapes).toHaveLength(1);
    const [hull] = drone.shapes;
    expect(hull?.kind).toBe('bounds');

    const body = specialForm('drone').zones.body;
    expect(body.status).toBe('measured');
    if (body.status !== 'measured' || hull === undefined) return;
    const measure = body.measures[0];
    expect(measure?.kind).toBe('bounds');
    if (measure?.kind !== 'bounds') return;
    expect(measure.boundsMm).toEqual({
      minX: hull.boundsMm.minXMm,
      minY: hull.boundsMm.minYMm,
      maxX: hull.boundsMm.maxXMm,
      maxY: hull.boundsMm.maxYMm,
    });
  });

  it('findet an beiden Zweirädern keine Form, nur einen Kurvenpfad', () => {
    for (const id of ['two-wheeler', 'motorized-two-wheeler'] as const) {
      const entry = fingerprintOf(specialForm(id).asset);
      expect(entry.shapes, id).toEqual([]);
      expect(entry.curvedPaths, id).toBe(1);
    }
  });

  it('liest an 3.9 eine graue Fläche über der oberen Hälfte, ohne glatte Maße', () => {
    const structure = fingerprintOf(specialForm('temporary-fixed-structure').asset);
    expect(structure.fills).toEqual(['#bebebe']);
    expect(structure.shapes).toHaveLength(1);
    expect(structure.shapes[0]?.boundsMm).toEqual({
      minXMm: 1.837,
      minYMm: 1.671,
      maxXMm: 30.162,
      maxYMm: 14.19,
    });
  });
});
