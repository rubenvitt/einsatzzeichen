import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SYMBOL_KINDS, type SpecialFormId, type ZoneMeasure } from '@einsatzzeichen/schema';
import { boundsOfMm, strokeBoundsOfMm } from '../bounds.js';
import { specialFormDrawing } from '../geometry/special-form-bodies.js';
import { SPECIAL_FORMS, specialForm } from './special-forms.js';
import { ZONE_IDS, ZONE_MODEL_FORMS } from './zones.js';

/**
 * Gate der Sonderformen 3.6 bis 3.9 im Zonenmodell (LFH-567, vermessen in LFH-577). Die
 * Tintenhüllen gegen das Kennzahlenartefakt prüft `conformance/src/special-form-fixtures.test.ts`;
 * hier wird gehalten, dass die Zonen dieselben Zahlen tragen wie die Zeichnung in
 * `geometry/special-form-bodies.ts`.
 */

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

function bodyMeasure(id: SpecialFormId, measureId: string): ZoneMeasure {
  const body = specialForm(id).zones.body;
  if (body.status !== 'measured') throw new Error(`${id}: Körperzone nicht vermessen`);
  const found = body.measures.find((measure) => measure.id === measureId);
  if (found === undefined) throw new Error(`${id}: kein Maß "${measureId}"`);
  return found;
}

function boundsMeasure(id: SpecialFormId, measureId: string) {
  const measure = bodyMeasure(id, measureId);
  if (measure.kind !== 'bounds') throw new Error(`${id}/${measureId}: keine Hülle`);
  return measure.boundsMm;
}

describe('Sonderformen im Zonenmodell', () => {
  it('führt die vier Abschnitte 3.6 bis 3.9 in Kapitelreihenfolge', () => {
    expect(SPECIAL_FORMS.map((form) => [form.section, form.id])).toEqual([
      ['3.6', 'drone'],
      ['3.7', 'two-wheeler'],
      ['3.8', 'motorized-two-wheeler'],
      ['3.9', 'temporary-fixed-structure'],
    ]);
    for (const form of SPECIAL_FORMS) {
      expect(form.asset.startsWith(`${form.section}_`), form.id).toBe(true);
      expect(specialForm(form.id)).toBe(form);
    }
  });

  it('ist keine Körperart: weder in SYMBOL_KINDS noch in den Fassungen des Zonenmodells', () => {
    for (const form of SPECIAL_FORMS) {
      expect(SYMBOL_KINDS as readonly string[], form.id).not.toContain(form.id);
      expect(ZONE_MODEL_FORMS.map((entry) => entry.kind) as readonly string[], form.id)
        .not.toContain(form.id);
    }
  });

  it('trägt alle 16 Zonen, jede mit Maß oder mit begründeter Lücke', () => {
    for (const form of SPECIAL_FORMS) {
      expect(Object.keys(form.zones).sort(), form.id).toEqual([...ZONE_IDS].sort());
      for (const zone of ZONE_IDS) {
        const binding = form.zones[zone];
        if (binding.status === 'measured') {
          expect(binding.measures.length, `${form.id}/${zone}`).toBeGreaterThan(0);
          for (const measure of binding.measures) {
            const file = measure.provenance.definedAt.replace(/:\d+(?:–\d+)?$/u, '');
            expect(existsSync(resolve(REPO, 'packages', file)), measure.provenance.definedAt).toBe(true);
          }
          continue;
        }
        expect(binding.gap.reason.length, `${form.id}/${zone}`).toBeGreaterThan(60);
        expect(existsSync(resolve(REPO, binding.gap.definedAt)), binding.gap.definedAt).toBe(true);
      }
    }
  });

  it('vermisst die Körperzone aller vier Formen und sonst keine Zone', () => {
    const measured = SPECIAL_FORMS.flatMap((form) =>
      ZONE_IDS.filter((zone) => form.zones[zone].status === 'measured').map((zone) => `${form.id}/${zone}`));
    expect(measured).toEqual([
      'drone/body',
      'two-wheeler/body',
      'motorized-two-wheeler/body',
      'temporary-fixed-structure/body',
    ]);
  });

  it('führt das Innenfeld als gemessen leer: keine der vier Dateien hat eine Füllebene', () => {
    for (const form of SPECIAL_FORMS) {
      const binding = form.zones['inner-field'];
      expect(binding.status, form.id).toBe('measured-absent');
      if (binding.status === 'measured') continue;
      expect(binding.gap.reason, form.id).toContain('Flächige_Fülung');
    }
  });

  it('führt jede übrige Lücke als value: kein Original setzt eine Sonderform als Körper mit Zonen ein', () => {
    for (const form of SPECIAL_FORMS) {
      for (const zone of ZONE_IDS) {
        const binding = form.zones[zone];
        if (binding.status === 'measured') continue;
        expect(binding.gap.scope, `${form.id}/${zone}`).toBe('value');
        if (zone === 'inner-field') continue;
        expect(binding.status, `${form.id}/${zone}`).toBe('not-measured');
      }
    }
  });

  it('trägt dieselben Zahlen wie die Zeichnung', () => {
    const [drone] = specialFormDrawing('drone').children;
    expect(boundsMeasure('drone', 'reference-hull')).toEqual(boundsOfMm(drone!));

    for (const id of ['two-wheeler', 'motorized-two-wheeler'] as const) {
      const [wheel] = specialFormDrawing(id).children;
      const centerline = boundsMeasure(id, 'centerline-hull');
      const actual = boundsOfMm(wheel!);
      expect(actual.minX, id).toBeCloseTo(centerline.minX, 4);
      expect(actual.minY, id).toBeCloseTo(centerline.minY, 4);
      expect(actual.maxX, id).toBeCloseTo(centerline.maxX, 4);
      expect(actual.maxY, id).toBeCloseTo(centerline.maxY, 4);
      expect(boundsMeasure(id, 'ink-hull'), id).toEqual({ minX: 9.75, minY: 3.75, maxX: 22.25, maxY: 28 });
    }

    const [roof] = specialFormDrawing('temporary-fixed-structure').children;
    expect(boundsMeasure('temporary-fixed-structure', 'roof-centerline')).toEqual(boundsOfMm(roof!));
    const ink = boundsMeasure('temporary-fixed-structure', 'ink-hull');
    const stroke = strokeBoundsOfMm(roof!);
    expect(stroke.minX).toBeCloseTo(ink.minX, 2);
    expect(stroke.minY).toBeCloseTo(ink.minY, 2);
    expect(stroke.maxX).toBeCloseTo(ink.maxX, 2);
    expect(stroke.maxY).toBeCloseTo(ink.maxY, 2);
    expect(boundsMeasure('temporary-fixed-structure', 'carrier-placeholder'))
      .toEqual({ minX: 6, minY: 10, maxX: 26, maxY: 30 });
  });

  it('nennt verwandte Körperformen nur aus SYMBOL_KINDS; belegt ist allein der Träger des Giebels', () => {
    expect(SPECIAL_FORMS.map((form) => [form.id, form.relatedKind.status])).toEqual([
      ['drone', 'proposed'],
      ['two-wheeler', 'proposed'],
      ['motorized-two-wheeler', 'proposed'],
      ['temporary-fixed-structure', 'evidenced'],
    ]);
    for (const form of SPECIAL_FORMS) {
      if (form.relatedKind.status === 'open' || form.relatedKind.value === null) continue;
      expect(SYMBOL_KINDS, form.id).toContain(form.relatedKind.value);
    }
    const carrier = specialForm('temporary-fixed-structure').relatedKind;
    expect(carrier.status === 'evidenced' ? carrier.value : null).toBe('circle-12');
  });

  it('belegt Drohne und Giebel als Marke; die Zweiräder bleiben Fragen an den Eigentümer', () => {
    expect(SPECIAL_FORMS.map((form) => [
      form.id,
      form.role.status,
      form.role.status === 'open' ? null : form.role.value,
    ])).toEqual([
      ['drone', 'evidenced', 'mark'],
      ['two-wheeler', 'open', null],
      ['motorized-two-wheeler', 'open', null],
      ['temporary-fixed-structure', 'evidenced', 'mark'],
    ]);
    for (const form of SPECIAL_FORMS) {
      if (form.role.status === 'open') expect(form.role.question, form.id).toMatch(/\?$/u);
    }
    const drone = specialForm('drone').role;
    if (drone.status !== 'evidenced') throw new Error('Drohne nicht belegt');
    expect(drone.evidence.map((item) => ('asset' in item ? item.asset.slice(0, 6) : item.definedAt)))
      .toEqual(['C.1.13', 'C.1.14', 'F.1.16', 'I.1.20', 'C.2.31']);
  });
});
