import { describe, expect, it } from 'vitest';
import {
  ALL_PICTOGRAMS,
  CAPABILITY_INSET_FORMS,
  CAPABILITY_INSET_REDUCED_UNIFORMITY_LIMIT,
  CAPABILITY_UNSCALED_FIT,
  baseDrawing,
  boundsOfMm,
  checkClipping,
  pictogram,
} from '@einsatzzeichen/core';
import { DEFAULT_STROKE_WIDTH_MM, type Primitive } from '@einsatzzeichen/schema';
import { STANDARD_CAPABILITY_BOX } from '@einsatzzeichen/core/src/geometry/pictograms/authoring.js';
import { CAPABILITY_INSET_EVIDENCE, type CapabilityInsetEvidence } from './capability-inset-evidence.js';

/**
 * Gate von LFH-587: die Regel des Innenfelds für Kapitel-4-Piktogramme gegen den Motor.
 *
 * `CAPABILITY_INSET_FORMS` und `CAPABILITY_INSET_RULE` in `core` sind Daten. Dieser Test rechnet sie
 * aus den Fixtures nach (`CAPABILITY_INSET_EVIDENCE`: jede Körperfassung, die `compose()` für eine
 * Fixture zeichnet, gegen die Einzeldarstellung) und hält jede Aussage der Regel an den Zahlen
 * fest. Eine neue Körperfassung, eine geänderte Zeichnung oder eine neue Fixture wird hier rot,
 * bis die Daten nachgezogen sind.
 */

const key = (entry: { capability: string; kind: string; variant?: string }): string =>
  `${entry.capability} ${entry.kind}/${entry.variant ?? '-'}`;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function hull(primitives: readonly Primitive[]) {
  return primitives.map((primitive) => boundsOfMm(primitive)).reduce((a, b) => ({
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  }));
}

function leaves(primitive: Primitive): readonly Primitive[] {
  return primitive.type === 'group' ? primitive.children.flatMap(leaves) : [primitive];
}

const evidenceByKey = new Map<string, CapabilityInsetEvidence[]>();
for (const entry of CAPABILITY_INSET_EVIDENCE) {
  evidenceByKey.set(key(entry), [...(evidenceByKey.get(key(entry)) ?? []), entry]);
}

const single = CAPABILITY_INSET_EVIDENCE.filter((entry) => !entry.combination);
const nonFlush = CAPABILITY_INSET_EVIDENCE.filter(
  (entry) => entry.measurement.treatment !== 'flush',
);
const reduced = CAPABILITY_INSET_EVIDENCE.filter(
  (entry) => entry.measurement.treatment === 'reduced',
);

describe('Körperfassungen der Kapitel-4-Piktogramme gegen den Motor', () => {
  it('findet in den Fixtures Messpunkte', () => {
    expect(CAPABILITY_INSET_EVIDENCE.length).toBeGreaterThan(100);
  });

  it('führt genau die Paare aus Fähigkeit und Körperfassung, die Fixtures zeichnen', () => {
    expect(CAPABILITY_INSET_FORMS.map(key).sort()).toEqual([...evidenceByKey.keys()].sort());
  });

  it.each(CAPABILITY_INSET_FORMS.map((form) => [key(form), form] as const))(
    '%s: Behandlung, Faktoren und Fixtures stimmen mit der Messung überein',
    (label, form) => {
      const evidence = evidenceByKey.get(label) ?? [];
      const fixtures = [...new Set(evidence.map((entry) => entry.fixture))];
      expect([...form.fixtures, ...form.exceptions].sort()).toEqual(fixtures.sort());

      const regular = evidence.filter((entry) => form.fixtures.includes(entry.fixture));
      for (const entry of regular) {
        expect(entry.measurement.treatment, entry.fixture).toBe(form.treatment);
      }
      const scaleX = regular.map((entry) => entry.measurement.scaleX);
      const scaleY = regular.map((entry) => entry.measurement.scaleY);
      expect({ min: Math.min(...scaleX), max: Math.max(...scaleX) }).toEqual(form.scaleX);
      expect({ min: Math.min(...scaleY), max: Math.max(...scaleY) }).toEqual(form.scaleY);

      for (const entry of evidence.filter((candidate) => form.exceptions.includes(candidate.fixture))) {
        expect(entry.combination, entry.fixture).toBe(true);
        expect(entry.measurement.treatment, entry.fixture).not.toBe(form.treatment);
      }
    },
  );
});

describe('Die Regel des Innenfelds, Aussage für Aussage', () => {
  it('strokeWidthKept: jeder Strich jeder Körperfassung hat die Strichstärke der Einzeldarstellung', () => {
    for (const entry of CAPABILITY_INSET_EVIDENCE) {
      const standalone = [
        ...new Set(
          pictogram(`capability.${entry.capability}`).primitives
            .flatMap(leaves)
            .map((primitive) => primitive.style?.strokeWidth)
            .filter((width) => width !== undefined),
        ),
      ];
      expect(standalone, entry.capability).toEqual([DEFAULT_STROKE_WIDTH_MM]);
      expect(
        entry.measurement.strokeWidthsMm.filter((width) => width !== DEFAULT_STROKE_WIDTH_MM),
        `${entry.fixture} ${entry.capability}`,
      ).toEqual([]);
    }
    // Die eine Fassung ohne Strich zeichnet nur Flächen.
    expect(
      CAPABILITY_INSET_EVIDENCE
        .filter((entry) => entry.measurement.strokeWidthsMm.length === 0)
        .map((entry) => `${entry.fixture} ${entry.capability}`),
    ).toEqual(['G.4 power-supply']);
  });

  it('die Grenze zwischen reduced und reshaped liegt in einer leeren Lücke der Messwerte', () => {
    const reducedMax = Math.max(...reduced.map((entry) => entry.measurement.uniformity));
    const reshapedMin = Math.min(
      ...nonFlush
        .filter((entry) => entry.measurement.treatment === 'reshaped')
        .map((entry) => entry.measurement.uniformity),
    );
    expect(reducedMax).toBe(0.22);
    expect(reshapedMin).toBe(0.37);
    expect(reducedMax).toBeLessThan(CAPABILITY_INSET_REDUCED_UNIFORMITY_LIMIT);
    expect(reshapedMin).toBeGreaterThan(CAPABILITY_INSET_REDUCED_UNIFORMITY_LIMIT);
  });

  it('commonScale: die verkleinerten Fassungen haben keinen gemeinsamen Faktor', () => {
    const scaleX = reduced.map((entry) => entry.measurement.scaleX);
    expect([Math.min(...scaleX), Math.max(...scaleX)]).toEqual([0.3, 0.93]);
    // Dasselbe Zelt an drei Körperformen, drei Faktorpaare.
    const care = (kind: string) =>
      CAPABILITY_INSET_FORMS.find((form) => form.capability === 'care' && form.kind === kind && form.variant === undefined);
    expect([care('formation'), care('circle-12'), care('person')].map((form) => [form?.scaleX.min, form?.scaleY.min]))
      .toEqual([[1, 0.8], [0.53, 0.84], [0.43, 0.26]]);
  });

  it('fitToBox: eingepasst in die Fähigkeitsbox ergäbe sich je Fähigkeit ein anderes Verhältnis zur Referenz', () => {
    const ratios = single
      .filter((entry) => entry.measurement.treatment === 'reduced')
      .map((entry) => {
        const standalone = hull(pictogram(`capability.${entry.capability}`).primitives);
        const fit = Math.min(
          STANDARD_CAPABILITY_BOX.widthMm / (standalone.maxX - standalone.minX),
          STANDARD_CAPABILITY_BOX.heightMm / (standalone.maxY - standalone.minY),
        );
        return round2(Math.max(entry.measurement.scaleX, entry.measurement.scaleY) / fit);
      });
    expect([Math.min(...ratios), Math.max(...ratios)]).toEqual([0.62, 1.17]);
    // Unter 1 zeichnet die Referenz kleiner als die Box, über 1 größer: die Box ist nicht einmal Hülle.
    // Die Verpflegung: gezeichnet 0,42, eingepasst wären es 0,67.
    const catering = hull(pictogram('capability.catering').primitives);
    expect(round2(Math.min(24 / (catering.maxX - catering.minX), 16 / (catering.maxY - catering.minY)))).toBe(0.67);
  });

  it('unscaledWhereFits: keine Fähigkeit, die unskaliert passt, setzt die Referenz unverändert ein', () => {
    const fitting = CAPABILITY_INSET_FORMS.filter((form) =>
      CAPABILITY_UNSCALED_FIT.some(
        (entry) => entry.kind === form.kind && entry.capabilities.includes(form.capability),
      ));
    expect([...new Set(fitting.map((form) => form.capability))].sort()).toEqual([
      'drinking-water',
      'fire-fighting',
      'maintenance',
      'temporary-accommodation-resting',
      'waste-disposal',
      'water-conveyance',
    ]);
    for (const form of fitting) {
      expect(form.scaleX.min === 1 && form.scaleY.min === 1, key(form)).toBe(false);
    }
  });

  it('reducedSizeBodyInvariant: eine verkleinerte Einzelmarke hat in jeder Körperform dieselbe Breite', () => {
    const byCapability = new Map<string, CapabilityInsetEvidence[]>();
    for (const entry of single.filter((candidate) => candidate.measurement.treatment === 'reduced')) {
      byCapability.set(entry.capability, [...(byCapability.get(entry.capability) ?? []), entry]);
    }
    const heightYields: string[] = [];
    for (const [capability, entries] of byCapability) {
      const scaleX = entries.map((entry) => entry.measurement.scaleX);
      expect(Math.max(...scaleX) - Math.min(...scaleX), capability).toBeLessThanOrEqual(0.01);
      const scaleY = entries.map((entry) => entry.measurement.scaleY);
      const usual = scaleY.sort((a, b) =>
        scaleY.filter((value) => value === b).length - scaleY.filter((value) => value === a).length)[0];
      heightYields.push(
        ...entries.filter((entry) => entry.measurement.scaleY !== usual).map((entry) => entry.fixture),
      );
    }
    expect(heightYields.sort()).toEqual(['G.3.5', 'I.2.1', 'I.2.2', 'I.2.3']);
    // Belegt über mehrere Körperformen, nicht nur an einer.
    const kinds = (capability: string) =>
      new Set((byCapability.get(capability) ?? []).map((entry) => `${entry.kind}/${entry.variant ?? '-'}`)).size;
    expect([kinds('maintenance'), kinds('meal-preparation'), kinds('catering'), kinds('fuels-consumables')])
      .toEqual([4, 3, 2, 2]);
  });
});

describe('Unskalierte Einsetzbarkeit der 92 Einzeldarstellungen', () => {
  const capabilityPictograms = ALL_PICTOGRAMS.filter((definition) =>
    definition.id.startsWith('capability.'));

  it('umfasst alle 92 Kapitel-4-Darstellungen', () => {
    expect(capabilityPictograms).toHaveLength(92);
  });

  it.each(CAPABILITY_UNSCALED_FIT.map((entry) => [entry.kind, entry] as const))(
    '%s: genau die geführten Piktogramme bestehen das Clipping-Gate, und nur Hauptdarstellungen',
    (kind, entry) => {
      const body = baseDrawing(kind).children.find((child) => child.role === 'body');
      if (body === undefined) throw new Error(`Grundzeichen "${kind}" ohne Körper`);
      const passing = capabilityPictograms.filter((definition) =>
        checkClipping(definition, body).length === 0);
      expect(passing.filter((definition) => definition.variant !== 'primary')).toEqual([]);
      expect(passing.map((definition) => definition.id.replace(/^capability\./u, '')).sort())
        .toEqual([...entry.capabilities].sort());
    },
  );
});
