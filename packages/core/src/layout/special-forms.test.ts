import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SYMBOL_KINDS } from '@einsatzzeichen/schema';
import { SPECIAL_FORMS, specialForm } from './special-forms.js';
import { ZONE_IDS, ZONE_MODEL_FORMS } from './zones.js';

/**
 * Gate der Sonderformen 3.6 bis 3.9 im Zonenmodell (LFH-567). Die Zahlen gegen das
 * Kennzahlenartefakt prüft `conformance/src/special-form-fixtures.test.ts`.
 */

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

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
          continue;
        }
        expect(binding.gap.reason.length, `${form.id}/${zone}`).toBeGreaterThan(60);
        expect(existsSync(resolve(REPO, binding.gap.definedAt)), binding.gap.definedAt).toBe(true);
      }
    }
  });

  it('misst allein die Hülle der Drohne und erfindet sonst keine Zahl', () => {
    const measured = SPECIAL_FORMS.flatMap((form) =>
      ZONE_IDS.filter((zone) => form.zones[zone].status === 'measured').map((zone) => `${form.id}/${zone}`));
    expect(measured).toEqual(['drone/body']);

    const body = specialForm('drone').zones.body;
    expect(body.status).toBe('measured');
    if (body.status !== 'measured') return;
    expect(body.measures).toHaveLength(1);
    expect(body.measures[0]).toMatchObject({
      kind: 'bounds',
      id: 'reference-hull',
      boundsMm: { minX: 4, minY: 10, maxX: 28, maxY: 22 },
      provenance: { sourceRefs: [{ section: '3.6' }] },
    });
  });

  it('führt jede Lücke als value: keine andere Grundzeichenart liefert Zahlen für eine Sonderform', () => {
    for (const form of SPECIAL_FORMS) {
      for (const zone of ZONE_IDS) {
        const binding = form.zones[zone];
        if (binding.status === 'measured') continue;
        expect(binding.status, `${form.id}/${zone}`).toBe('not-measured');
        expect(binding.gap.scope, `${form.id}/${zone}`).toBe('value');
      }
    }
  });

  it('nennt verwandte Körperformen nur als Empfehlung und nur aus SYMBOL_KINDS', () => {
    for (const form of SPECIAL_FORMS) {
      expect(form.relatedKind.status, form.id).toBe('proposed');
      if (form.relatedKind.status !== 'proposed') continue;
      if (form.relatedKind.value !== null) {
        expect(SYMBOL_KINDS, form.id).toContain(form.relatedKind.value);
      }
    }
  });

  it('belegt die Rolle nur an der Drohne, die übrigen drei sind Fragen an den Eigentümer', () => {
    expect(SPECIAL_FORMS.map((form) => [form.id, form.role.status])).toEqual([
      ['drone', 'evidenced'],
      ['two-wheeler', 'open'],
      ['motorized-two-wheeler', 'open'],
      ['temporary-fixed-structure', 'open'],
    ]);
    for (const form of SPECIAL_FORMS) {
      if (form.role.status === 'open') expect(form.role.question, form.id).toMatch(/\?$/u);
    }
  });
});
