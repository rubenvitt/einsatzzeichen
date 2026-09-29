import { describe, expect, it } from 'vitest';
import { CAPABILITY_IDS, type Primitive } from '@einsatzzeichen/schema';
import {
  CAPABILITY_INSET_FORMS,
  CAPABILITY_INSET_RULE,
  CAPABILITY_UNSCALED_FIT,
  capabilityInsetForm,
} from './capability-inset.js';
import {
  CAPABILITY_INSET_REDUCED_UNIFORMITY_LIMIT,
  measureCapabilityInset,
} from './capability-inset-measure.js';
import { CAPABILITY_COMBINATION_EXCEPTIONS } from './capability-combinations.js';

/**
 * Form der Daten von LFH-587 und das Messverfahren an künstlichen Fassungen. Ob die Daten mit dem
 * Motor übereinstimmen, prüft `conformance/src/capability-inset-fixtures.test.ts`: dort liegen
 * die Fixtures.
 */

function line(x1: number, y1: number, x2: number, y2: number, strokeWidth = 0.5): Primitive {
  return { type: 'line', role: 'pictogram', x1, y1, x2, y2, style: { stroke: 'schwarz', strokeWidth } };
}

/** Eine Diagonale über die angegebene Hülle: ihre Mittellinienhülle ist genau diese Hülle. */
function spanning(minX: number, minY: number, maxX: number, maxY: number): Primitive {
  return line(minX, minY, maxX, maxY);
}

const FORMATION = { minX: 1, minY: 6, maxX: 31, maxY: 26 };
const STANDALONE = [spanning(2, 2, 30, 30)];

describe('measureCapabilityInset', () => {
  it('erkennt eine randbündige Fassung an der Körperhülle, auch wenn sie ungleichmäßig ist', () => {
    const measured = measureCapabilityInset([spanning(1, 6, 31, 26)], STANDALONE, FORMATION);
    expect(measured).toMatchObject({ treatment: 'flush', flushAxis: 'both', scaleX: 1.07, scaleY: 0.71 });
  });

  it('nennt die Achse, auf der eine Fassung randbündig ist', () => {
    expect(measureCapabilityInset([spanning(1, 8, 31, 26)], STANDALONE, FORMATION).flushAxis).toBe('x');
    expect(measureCapabilityInset([spanning(3, 6, 29, 26)], STANDALONE, FORMATION).flushAxis).toBe('y');
  });

  it('nennt eine freistehende, gleichmäßig verkleinerte Fassung reduced', () => {
    const measured = measureCapabilityInset([spanning(9, 9, 23, 23)], STANDALONE, FORMATION);
    expect(measured).toMatchObject({ treatment: 'reduced', flushAxis: 'none', scaleX: 0.5, scaleY: 0.5, uniformity: 0 });
  });

  it('trennt reduced und reshaped an der Grenze aus der Messlücke', () => {
    expect(CAPABILITY_INSET_REDUCED_UNIFORMITY_LIMIT).toBe(0.3);
    // 14 × 10: Abweichung 0,29 — noch reduced.
    expect(measureCapabilityInset([spanning(9, 11, 23, 21)], STANDALONE, FORMATION).treatment)
      .toBe('reduced');
    // 14 × 9: Abweichung 0,36 — reshaped.
    expect(measureCapabilityInset([spanning(9, 11, 23, 20)], STANDALONE, FORMATION).treatment)
      .toBe('reshaped');
  });

  it('sammelt die Strichstärken der Fassung, auch in Gruppen', () => {
    const measured = measureCapabilityInset(
      [{ type: 'group', role: 'pictogram', children: [line(9, 9, 23, 23, 0.5), line(9, 23, 23, 9, 1)] }],
      STANDALONE,
      FORMATION,
    );
    expect(measured.strokeWidthsMm).toEqual([0.5, 1]);
  });

  it('lehnt eine leere Fassung ab, statt einen Faktor 0 zu melden', () => {
    expect(() => measureCapabilityInset([], STANDALONE, FORMATION)).toThrow(/Leere Fassung/u);
  });
});

describe('CAPABILITY_INSET_FORMS', () => {
  const key = (form: (typeof CAPABILITY_INSET_FORMS)[number]): string =>
    `${form.capability} ${form.kind}/${form.variant ?? '-'}` +
    (form.rendition === undefined ? '' : `#${form.rendition}`);

  it('führt jedes Paar aus Fähigkeit und Körperfassung genau einmal', () => {
    const keys = CAPABILITY_INSET_FORMS.map(key);
    expect(new Set(keys).size).toBe(keys.length);
    // 52 aus LFH-587, dazu 24 aus Anhang C (LFH-786), davon 8 zweite Fassungen.
    expect(keys).toHaveLength(76);
    expect(CAPABILITY_INSET_FORMS.filter((form) => form.rendition !== undefined)).toHaveLength(8);
  });

  it('nennt nur Fähigkeiten aus Kapitel 4', () => {
    for (const form of CAPABILITY_INSET_FORMS) {
      expect(CAPABILITY_IDS as readonly string[], key(form)).toContain(form.capability);
    }
  });

  it('hat je Fassung Fixtures, geordnete Spannen und getrennte Ausnahmen', () => {
    for (const form of CAPABILITY_INSET_FORMS) {
      expect(form.fixtures.length, key(form)).toBeGreaterThan(0);
      expect(form.scaleX.min, key(form)).toBeLessThanOrEqual(form.scaleX.max);
      expect(form.scaleY.min, key(form)).toBeLessThanOrEqual(form.scaleY.max);
      expect(form.fixtures.filter((fixture) => form.exceptions.includes(fixture)), key(form)).toEqual([]);
    }
  });

  it('führt als Ausnahme nur benannte Kombinationsausnahmen aus LFH-567', () => {
    const named = new Set(CAPABILITY_COMBINATION_EXCEPTIONS.map((entry) => entry.fixture));
    const listed = CAPABILITY_INSET_FORMS.flatMap((form) => form.exceptions);
    expect(listed.filter((fixture) => !named.has(fixture))).toEqual([]);
    expect(listed.sort()).toEqual(['F.1.13', 'F.1.22']);
  });

  it('zählt die drei Behandlungen', () => {
    const count = (treatment: string): number =>
      CAPABILITY_INSET_FORMS.filter((form) => form.treatment === treatment).length;
    expect([count('flush'), count('reduced'), count('reshaped')]).toEqual([28, 43, 5]);
  });

  it('findet eine Fassung über Fähigkeit, Körperform und Variante, und keine ohne Messung', () => {
    expect(capabilityInsetForm('care', 'formation')?.treatment).toBe('flush');
    expect(capabilityInsetForm('care', 'formation', 'foot-band')?.scaleY).toEqual({ min: 0.68, max: 0.68 });
    expect(capabilityInsetForm('service-water', 'formation')).toBeUndefined();
    expect(capabilityInsetForm('care', 'trailer', 'foot-band')).toBeUndefined();
  });
});

describe('CAPABILITY_UNSCALED_FIT', () => {
  it('führt die acht Körperformen mit Flächenmodell, jede Fähigkeit höchstens einmal', () => {
    expect(CAPABILITY_UNSCALED_FIT.map((entry) => entry.kind)).toEqual([
      'formation', 'person', 'post', 'building', 'container', 'measure', 'hazard', 'point',
    ]);
    for (const entry of CAPABILITY_UNSCALED_FIT) {
      expect(new Set(entry.capabilities).size, entry.kind).toBe(entry.capabilities.length);
      for (const capability of entry.capabilities) {
        expect(CAPABILITY_IDS as readonly string[], entry.kind).toContain(capability);
      }
    }
  });

  it('lässt in die Formation 27 der 92 Einzeldarstellungen unskaliert passen', () => {
    expect(CAPABILITY_UNSCALED_FIT.find((entry) => entry.kind === 'formation')?.capabilities)
      .toHaveLength(27);
  });
});

describe('CAPABILITY_INSET_RULE', () => {
  it('belegt jede Aussage und führt die Entscheidung für unvermessene Paare getrennt', () => {
    const { unmeasuredPairs, ...evidenced } = CAPABILITY_INSET_RULE;
    for (const [name, finding] of Object.entries(evidenced)) {
      expect(finding.status, name).toBe('evidenced');
      if (finding.status !== 'evidenced') continue;
      expect(finding.evidence.length, name).toBeGreaterThan(0);
    }
    expect(unmeasuredPairs).toEqual({
      target: 'measured-rendition-only',
      inForce: 'unscaled-if-fits',
      rule: 'capabilities-pictogram-overflows-body',
      decidedOn: '2026-09-29',
      decidedBy: 'Koordinator (delegiert)',
      decidedIn: 'docs/decisions/2026-09-29-lfh-587-kapitel-4-piktogramme-im-innenfeld.md',
    });
  });

  it('widerlegt die drei Rechenregeln und die körperunabhängige Breite, hält den Strich fest', () => {
    const value = (finding: { status: string; value?: string }): string | undefined => finding.value;
    expect(value(CAPABILITY_INSET_RULE.strokeWidthKept)).toBe('holds');
    expect(value(CAPABILITY_INSET_RULE.commonScale)).toBe('refuted');
    expect(value(CAPABILITY_INSET_RULE.fitToBox)).toBe('refuted');
    expect(value(CAPABILITY_INSET_RULE.unscaledWhereFits)).toBe('refuted');
    // Seit LFH-786 widerlegt: Anhang C führt dieselbe Fähigkeit am selben Körper verschieden breit.
    expect(value(CAPABILITY_INSET_RULE.reducedSizeBodyInvariant)).toBe('refuted');
  });
});
