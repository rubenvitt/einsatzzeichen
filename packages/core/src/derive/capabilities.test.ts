/**
 * Boxfähigkeiten an jeder Körperform (Entscheidung vom 2. Oktober 2026): vermessene Körperfassung
 * verbatim, unskaliert wo belegt, sonst ins Innenfeld eingepasst (`derive/capabilities.ts`).
 */
import type { Primitive, SymbolSpec } from '@einsatzzeichen/schema';
import { DEFAULT_STROKE_WIDTH_MM } from '@einsatzzeichen/schema';
import { describe, expect, it } from 'vitest';
import { boundsOfMm, type BoundsMm } from '../bounds.js';
import {
  CAPABILITY_INSET_FORMS,
  CAPABILITY_UNSCALED_FIT,
  capabilityInsetForm,
} from '../blocks/capability-inset.js';
import { drawSymbol } from '../default-ports.js';
import { pictogram } from '../geometry/pictograms/index.js';
import { unionBounds } from './affine.js';
import { CAPABILITY_FIT_MAX_SCALE } from './fit-pictogram.js';

const leaves = (primitives: readonly Primitive[]): Primitive[] =>
  primitives.flatMap((primitive) => (primitive.type === 'group' ? leaves(primitive.children) : [primitive]));

const groupOf = (spec: SymbolSpec): Primitive & { type: 'group' } => {
  const groups = drawSymbol(spec).children.filter(
    (child): child is Primitive & { type: 'group' } => child.type === 'group' && child.role === 'pictogram',
  );
  expect(groups).toHaveLength(1);
  return groups[0] as Primitive & { type: 'group' };
};

const bodyOf = (spec: SymbolSpec): BoundsMm => {
  const body = drawSymbol(spec).children.find((child) => child.role === 'body');
  expect(body).toBeDefined();
  return boundsOfMm(body as Primitive);
};

const hullOf = (primitives: readonly Primitive[]): BoundsMm =>
  unionBounds(leaves(primitives).map((primitive) => boundsOfMm(primitive)));

/** Körperformen, die eine Organisation verlangen; sonst lehnt `validateSpec` vorher ab. */
function withOrganization(spec: SymbolSpec): SymbolSpec {
  return spec.kind === 'circle-12' || spec.kind === 'reduced-house' || spec.bodyVariant === 'inset-hull'
    ? { ...spec, organization: spec.kind === 'vehicle-water' ? 'feuerwehr' : 'hilfsorganisation' }
    : spec;
}

describe('Boxfähigkeit an einem Paar mit vermessener Körperfassung', () => {
  const pairs = CAPABILITY_INSET_FORMS.filter((form) => form.rendition === undefined);

  it.each(pairs.map((form) => [`${form.capability} an ${form.kind}/${form.variant ?? 'normal'}`, form] as const))(
    'zeichnet %s bytegleich wie bodyMarks',
    (_label, form) => {
      const base = withOrganization({
        kind: form.kind,
        ...(form.variant === undefined ? {} : { bodyVariant: form.variant }),
      });
      const viaCapabilities = drawSymbol({ ...base, capabilities: [form.capability] });
      const viaBodyMarks = drawSymbol({ ...base, bodyMarks: [form.capability] });
      expect(viaCapabilities.children).toEqual(viaBodyMarks.children);
      // Dieselbe Herkunft wie unter `bodyMarks`: verbatim an der vermessenen Hülle, übertragen,
      // wo die Körperform dieselbe, die Hülle aber eine andere ist (die D.3-Fassungen der
      // 26-mm-Raute an der 30-mm-Person; die Wasserrettung I.2 ohne Fahrzeugkategorie).
      expect(viaCapabilities.derivations).toEqual(viaBodyMarks.derivations);
    },
  );

  it('zeichnet eine Fähigkeit in beiden Feldern nur einmal', () => {
    const spec: SymbolSpec = {
      kind: 'formation', organization: 'feuerwehr', strength: 'staffel',
      capabilities: ['fire-fighting'], bodyMarks: ['fire-fighting'],
    };
    expect(drawSymbol(spec).children).toEqual(
      drawSymbol({ ...spec, capabilities: undefined }).children,
    );
  });
});

describe('Boxfähigkeit, die unskaliert im Körper bleibt', () => {
  it('bleibt die unveränderte Einzeldarstellung mit der Körperverschiebung als Gruppe', () => {
    // Formation mit Staffel: der Körper rückt für die Kopfzone nach unten, die Gruppe folgt.
    const spec: SymbolSpec = { kind: 'formation', organization: 'feuerwehr', strength: 'staffel', capabilities: ['service-water'] };
    const group = groupOf(spec);
    expect(group.children).toEqual(pictogram('capability.service-water').primitives);
    const body = bodyOf(spec);
    expect(group.transform).toEqual({ translate: { dxMm: 0, dyMm: (body.minY + body.maxY) / 2 - 16 } });
    expect(drawSymbol(spec).derivations).toBeUndefined();
  });

  it('passt ein, sobald die Komposition den Körper verkleinert', () => {
    // Unter einer Kopfzone schrumpft die Personenraute; der Nachweis aus CAPABILITY_UNSCALED_FIT
    // gilt nur in Grundgröße. Bis zum 2. Oktober 2026 ragte das Schaummittel hier still über.
    const spec: SymbolSpec = { kind: 'person', strength: 'trupp', capabilities: ['foam-agent'] };
    const hull = hullOf(groupOf(spec).children);
    const body = bodyOf(spec);
    expect(body.maxX - body.minX).toBeLessThan(30);
    expect(hull.minX).toBeGreaterThanOrEqual(body.minX);
    expect(hull.maxX).toBeLessThanOrEqual(body.maxX);
    expect(hull.minY).toBeGreaterThanOrEqual(body.minY);
    expect(hull.maxY).toBeLessThanOrEqual(body.maxY);
    expect(drawSymbol(spec).derivations?.[0]).toMatchObject({ dimension: 'capabilities' });
  });

  it('gilt an jeder Körperform aus CAPABILITY_UNSCALED_FIT für jede dort geführte Fähigkeit', () => {
    for (const { kind, capabilities } of CAPABILITY_UNSCALED_FIT) {
      // Wo das Paar eine vermessene Körperfassung hat, gilt diese (siehe oben).
      for (const id of capabilities.filter((candidate) => capabilityInsetForm(candidate, kind) === undefined)) {
        const spec: SymbolSpec = { kind, capabilities: [id] };
        expect(groupOf(spec).children, `${kind}/${id}`).toEqual(pictogram(`capability.${id}`).primitives);
      }
    }
  });
});

describe('Boxfähigkeit ohne Fassung, eingepasst ins Innenfeld', () => {
  it('passt das Sprengen an der Formation in die Fähigkeitsbox 24 × 16 mm ein', () => {
    // 4.7.24 misst 12,1 × 24 mm; die Box begrenzt die Höhe: 16 / 24 = 0,667.
    const spec: SymbolSpec = { kind: 'formation', capabilities: ['blasting'] };
    const group = groupOf(spec);
    expect(group.transform).toBeUndefined();
    const hull = hullOf(group.children);
    expect(hull.minY).toBeCloseTo(8, 3);
    expect(hull.maxY).toBeCloseTo(24, 3);
    expect((hull.minX + hull.maxX) / 2).toBeCloseTo(16, 3);
    expect(hull.maxX - hull.minX).toBeCloseTo(12.1 * (16 / 24), 2);
    expect(drawSymbol(spec).derivations).toEqual([
      {
        dimension: 'capabilities',
        part: 'Einzeldarstellung blasting ins Innenfeld eingepasst',
        basis: 'transferred',
        from: 'Kapitel 4, capability.blasting',
      },
    ]);
  });

  it('behält den 0,5-mm-Strich, auch wo die Einzeldarstellung 0,4 mm zeichnet', () => {
    // 4.7.18 zeichnet als einzige Einzeldarstellung mit 0,4 mm (CAPABILITY_INSET_RULE).
    const widths = leaves(groupOf({ kind: 'container', capabilities: ['technical-assistance'] }).children)
      .map((leaf) => leaf.style?.strokeWidth)
      .filter((width): width is number => width !== undefined);
    expect(widths.length).toBeGreaterThan(0);
    expect(new Set(widths)).toEqual(new Set([DEFAULT_STROKE_WIDTH_MM]));
  });

  it('verkleinert nie über 0,93 und bleibt in jeder Körperform im Körper', () => {
    for (const kind of ['formation', 'person', 'vehicle-land', 'vehicle-air', 'vehicle-water', 'post', 'building', 'container', 'measure', 'hazard', 'point', 'event', 'area', 'spontaneous-helper', 'trailer', 'swap-loader-vehicle', 'upright-rectangle'] as const) {
      for (const id of ['respiratory-protection', 'care', 'service-water', 'horse'] as const) {
        const spec: SymbolSpec = { kind, capabilities: [id] };
        if (capabilityInsetForm(id, kind) !== undefined) continue; // vermessene Körperfassung
        const drawing = drawSymbol(spec);
        const group = groupOf(spec);
        const body = bodyOf(spec);
        const hull = hullOf(group.children);
        const single = hullOf(pictogram(`capability.${id}`).primitives);
        if (drawing.derivations === undefined) continue; // unskaliert belegt
        const k = (hull.maxX - hull.minX) / (single.maxX - single.minX);
        expect(k, `${kind}/${id}`).toBeLessThanOrEqual(CAPABILITY_FIT_MAX_SCALE + 1e-6);
        expect(hull.minX, `${kind}/${id}`).toBeGreaterThanOrEqual(body.minX);
        expect(hull.minY, `${kind}/${id}`).toBeGreaterThanOrEqual(body.minY);
        expect(hull.maxX, `${kind}/${id}`).toBeLessThanOrEqual(body.maxX);
        expect(hull.maxY, `${kind}/${id}`).toBeLessThanOrEqual(body.maxY);
      }
    }
  });

  it('meidet das Fußband: die Einpassung endet über seiner Oberkante', () => {
    const group = groupOf({ kind: 'formation', bodyVariant: 'foot-band', capabilities: ['respiratory-protection'] });
    // Fußband 3 mm an der Unterkante 26: freie Fläche 6…23.
    expect(hullOf(group.children).maxY).toBeLessThanOrEqual(23);
  });

  it('folgt dem platzierten Körper unter einer Kopfzone', () => {
    const plain = hullOf(groupOf({ kind: 'formation', capabilities: ['blasting'] }).children);
    const spec: SymbolSpec = { kind: 'formation', strength: 'staffel', capabilities: ['blasting'] };
    const shifted = hullOf(groupOf(spec).children);
    const body = bodyOf(spec);
    expect((shifted.minY + shifted.maxY) / 2).toBeCloseTo((body.minY + body.maxY) / 2, 3);
    expect(shifted.maxX - shifted.minX).toBeCloseTo(plain.maxX - plain.minX, 3);
  });
});

describe('Mehrere Boxfähigkeiten', () => {
  it('stellt sie mit gemeinsamem Faktor nebeneinander, ohne Überdeckung', () => {
    const spec: SymbolSpec = { kind: 'formation', organization: 'feuerwehr', strength: 'staffel', capabilities: ['foam-agent', 'service-water'] };
    const drawing = drawSymbol(spec);
    const group = groupOf(spec);
    // Zwei Primitive wie die Einzeldarstellungen: ein Polyzug (Schaummittel) und ein Pfad.
    expect(group.children.map((child) => child.type).sort()).toEqual(['path', 'polyline']);
    const [foam, water] = group.children.map((child) => boundsOfMm(child));
    expect(foam!.maxX).toBeLessThan(water!.minX);
    const kFoam = (foam!.maxX - foam!.minX) / 16;
    const kWater = (water!.maxX - water!.minX) / 30;
    expect(kFoam).toBeCloseTo(kWater, 3);
    expect(drawing.derivations).toContainEqual({
      dimension: 'capabilities',
      part: '2 Boxpiktogramme nebeneinander',
      basis: 'constructed',
      from: 'Teilung des Innenfelds',
    });
  });
});
