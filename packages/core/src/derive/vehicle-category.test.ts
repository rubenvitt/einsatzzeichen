import { describe, expect, it } from 'vitest';
import type { BodyVariantId, Primitive, SymbolKind, SymbolSpec, VehicleCategoryId } from '@einsatzzeichen/schema';
import { VEHICLE_CATEGORY_IDS } from '@einsatzzeichen/schema';
import { boundsOfMm } from '../bounds.js';
import { drawSymbol } from '../default-ports.js';
import { checkViewBox } from '../index.js';
import { validateSpec } from '../validate.js';
import { chassisLiftForForm } from './vehicle-category.js';

/**
 * Fahrzeugkategorie an Wasser- und Luftfahrzeug (Eigentümerentscheid 02.10.2026: zulassen,
 * abgeleitet). Geprüft wird die Lage gegen die vermessene Regel der Landfahrzeuge: Zone an der
 * Unterkante des Grundzeichens, Markenmitte 2,25 mm darunter, Radplätze 3,75 / 16 / 28,25.
 */

const flat = (children: readonly Primitive[]): Primitive[] =>
  children.flatMap((child) => (child.type === 'group' ? [child, ...flat(child.children)] : [child]));

function draw(kind: SymbolKind, bodyVariant: BodyVariantId | undefined, vehicleCategory: VehicleCategoryId) {
  const spec: SymbolSpec = {
    kind,
    ...(bodyVariant === undefined ? {} : { bodyVariant }),
    vehicleCategory,
    ...(bodyVariant === 'inset-hull' ? { organization: 'hilfsorganisation' as const } : {}),
  };
  return drawSymbol(spec);
}

function partsOf(drawing: ReturnType<typeof drawSymbol>) {
  const primitives = flat(drawing.children);
  const body = primitives.find((p) => p.role === 'body')!;
  const extras = primitives.filter((p) => p.role === 'bodyExtra');
  const chassis = primitives.filter((p) => p.role === 'chassis');
  return { body, extras, chassis };
}

const FORMS: readonly [SymbolKind, BodyVariantId | undefined][] = [
  ['vehicle-water', undefined],
  ['vehicle-water', 'raised-hull'],
  ['vehicle-water', 'inset-hull'],
  ['vehicle-air', undefined],
  ['vehicle-air', 'raised-hull'],
  ['vehicle-air', 'fixed-wing-hull'],
];

describe('Fahrzeugkategorie an Wasser- und Luftfahrzeug', () => {
  it('zeichnet jede Kategorie an jeder Wasser- und Luftfahrzeugform innerhalb der Grundfläche', () => {
    for (const [kind, variant] of FORMS) {
      for (const id of VEHICLE_CATEGORY_IDS) {
        const drawing = draw(kind, variant, id);
        const label = `${kind}/${variant ?? '-'}/${id}`;
        expect(checkViewBox(drawing), label).toEqual([]);
        const { chassis } = partsOf(drawing);
        expect(chassis.length, label).toBeGreaterThan(0);
        // Die Zone endet 1 mm über dem Rand der Grundfläche oder höher (Außenkante = Mittellinie + 0,25).
        for (const mark of chassis) expect(boundsOfMm(mark).maxY + 0.25, label).toBeLessThanOrEqual(31 + 1e-6);
        expect(drawing.derivations?.map((note) => note.dimension), label).toContain('vehicleCategory');
      }
    }
  });

  it('hängt die Zone ohne Zusatzgeometrie an die Körperunterkante, wie an den Landfahrzeugen', () => {
    for (const [kind, variant] of [['vehicle-water', undefined], ['vehicle-water', 'raised-hull'], ['vehicle-water', 'inset-hull'], ['vehicle-air', undefined]] as const) {
      const { body, chassis } = partsOf(draw(kind, variant, 'kfz-kategorie-2'));
      const bottom = boundsOfMm(body).maxY;
      expect(chassis.map((mark) => (mark.type === 'circle' ? [mark.cx, mark.cy] : null))).toEqual([
        [3.75, bottom + 2.25],
        [16, bottom + 2.25],
        [28.25, bottom + 2.25],
      ]);
    }
  });

  it('weicht am Luftrumpf mit Zusatzgeometrie unter diese aus, statt sie zu überlagern', () => {
    for (const variant of ['raised-hull', 'fixed-wing-hull'] as const) {
      const { extras, chassis } = partsOf(draw('vehicle-air', variant, 'kettenfahrzeug'));
      const extrasBottom = Math.max(...extras.map((extra) => boundsOfMm(extra).maxY));
      const track = chassis[0]!;
      expect(track.type).toBe('rect');
      // Die Kettenmittellinie beginnt an der Unterkante der Zusatzgeometrie (Regel der Zone).
      expect(boundsOfMm(track).minY).toBeCloseTo(extrasBottom, 3);
    }
  });

  it('hebt das ganze Luftfahrzeug um den Überstand und hält Körper und Zusatzgeometrie zusammen', () => {
    const unlifted = drawSymbol({ kind: 'vehicle-air', bodyVariant: 'fixed-wing-hull' });
    const lifted = draw('vehicle-air', 'fixed-wing-hull', 'kfz-kategorie-1');
    const before = partsOf(unlifted);
    const after = partsOf(lifted);
    const dy = boundsOfMm(after.body).minY - boundsOfMm(before.body).minY;
    // Flügelunterkante 27,5297 + 4,75 Zone = 32,2797; Ziel 31 mm → 1,2797 mm Hub.
    expect(dy).toBeCloseTo(-1.2797, 4);
    after.extras.forEach((extra, index) => {
      expect(boundsOfMm(extra).minY - boundsOfMm(before.extras[index]!).minY).toBeCloseTo(dy, 4);
    });
    expect(lifted.derivations).toEqual(expect.arrayContaining([
      expect.objectContaining({ dimension: 'vehicleCategory', basis: 'constructed' }),
      expect.objectContaining({ dimension: 'vehicleCategory', basis: 'transferred' }),
    ]));
    // Der angehobene Rumpf mit Rotormarke steigt um 0,75 mm (Rotorunterkante 27 + 4,75 − 31).
    const raised = partsOf(draw('vehicle-air', 'raised-hull', 'kfz-kategorie-1'));
    expect(boundsOfMm(raised.body).minY).toBeCloseTo(6.0001 - 0.75, 3);
  });

  it('prüft die Beschriftung oberhalb gegen die angehobene Lage, nicht gegen die unverschobene', () => {
    // Der Hub, mit dem validate rechnet, ist der, den compose setzt.
    for (const [kind, variant] of FORMS) {
      const before = partsOf(drawSymbol({ kind, ...(variant === undefined ? {} : { bodyVariant: variant }), ...(variant === 'inset-hull' ? { organization: 'hilfsorganisation' as const } : {}) }));
      const after = partsOf(draw(kind, variant, 'kfz-kategorie-1'));
      expect(boundsOfMm(before.body).minY - boundsOfMm(after.body).minY, `${kind}/${variant ?? '-'}`)
        .toBeCloseTo(chassisLiftForForm(kind, variant, 'kfz-kategorie-1'), 6);
    }
    const aboveLeft = (capHeightMm: number): SymbolSpec => ({
      kind: 'vehicle-air', bodyVariant: 'fixed-wing-hull', vehicleCategory: 'kfz-kategorie-1',
      labels: { aboveLeft: 'ITH', aboveLeftMetrics: { capHeightMm, baselineFromBodyTopMm: -1, anchorFromBodyLeftMm: -0.01 } },
    });
    // Die gemessene F.2.7-Versalhöhe passt auch angehoben; 3,5 mm passten unangehoben, angehoben
    // ragten sie 0,65 mm über den oberen Rand — das lehnt die Regel jetzt ab, statt still zu zeichnen.
    const fits = drawSymbol(aboveLeft(2.919225));
    expect(checkViewBox(fits)).toEqual([]);
    const label = flat(fits.children).find((p) => p.type === 'text');
    expect(label?.type === 'text' ? label.boxMm.yMm : -1).toBeGreaterThanOrEqual(0);
    expect(validateSpec(aboveLeft(3.5)).map((issue) => issue.rule)).toContain('above-left-metrics-within-viewbox');
    const { vehicleCategory: _without, ...unlifted } = aboveLeft(3.5);
    expect(validateSpec(unlifted).map((issue) => issue.rule)).not.toContain('above-left-metrics-within-viewbox');
  });

  it('lässt die vermessenen Landfahrzeugfahrwerke bytegleich und ohne Notiz', () => {
    for (const kind of ['vehicle-land', 'trailer', 'swap-loader-vehicle'] as const) {
      for (const id of VEHICLE_CATEGORY_IDS) {
        if (id === 'amphibienfahrzeug') continue;
        expect(drawSymbol({ kind, vehicleCategory: id }).derivations, `${kind}/${id}`).toBeUndefined();
      }
    }
  });

  it('lehnt die Fahrzeugkategorie an Nichtfahrzeugen weiter ab (Systematik)', () => {
    for (const kind of ['formation', 'person', 'building', 'event', 'post'] as const) {
      expect(validateSpec({ kind, vehicleCategory: 'kfz-kategorie-1' }).map((issue) => issue.rule), kind)
        .toContain('vehicle-category-requires-vehicle');
    }
  });

  it('hält Beschriftungen unterhalb des Körpers vom Fahrwerk fern (chassis-foot-conflict)', () => {
    const rules = (spec: SymbolSpec) => validateSpec(spec).map((issue) => issue.rule);
    expect(rules({ kind: 'vehicle-water', bodyVariant: 'raised-hull', organization: 'feuerwehr', vehicleCategory: 'kfz-kategorie-1', labels: { belowRight: 'FW' } }))
      .toContain('chassis-foot-conflict');
    expect(rules({ kind: 'vehicle-air', bodyVariant: 'raised-hull', vehicleCategory: 'kfz-kategorie-1', labels: { surfaceBelowRight: 'AB' } }))
      .toContain('chassis-foot-conflict');
    expect(rules({ kind: 'vehicle-air', bodyVariant: 'raised-hull', vehicleCategory: 'kfz-kategorie-1', labels: { surfaceBelowLeft: 'AB' } }))
      .toContain('chassis-foot-conflict');
    // Ohne Fahrwerk bleiben dieselben Zonen offen.
    expect(rules({ kind: 'vehicle-air', bodyVariant: 'raised-hull', labels: { surfaceBelowRight: 'AB' } }))
      .not.toContain('chassis-foot-conflict');
  });

  it('zeichnet das Amphibienfahrzeug auch am Wasserfahrzeug mit Wellenlinie zwischen den Rädern', () => {
    const drawing = draw('vehicle-water', undefined, 'amphibienfahrzeug');
    const { body, chassis } = partsOf(drawing);
    const wave = chassis.find((mark) => mark.type === 'path')!;
    const top = boundsOfMm(body).maxY;
    // Mittellinie: Täler y + 3,55, Kuppen y + 0,95 ab Zonenoberkante, zwischen x 7,5 und 24,5.
    expect(wave.type === 'path' ? wave.d.startsWith(`M 7.5 ${top + 3.55} C `) : false).toBe(true);
    expect(drawing.derivations?.map((note) => note.basis).sort()).toEqual(['constructed', 'transferred']);
  });
});
