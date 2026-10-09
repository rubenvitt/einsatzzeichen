import { describe, expect, it } from 'vitest';
import type { BodyVariantId, Primitive, SymbolKind, SymbolSpec, VehicleCategoryId } from '@einsatzzeichen/schema';
import { VEHICLE_CATEGORY_IDS } from '@einsatzzeichen/schema';
import { boundsOfMm } from '../bounds.js';
import { drawSymbol } from '../default-ports.js';
import { checkViewBox } from '../index.js';
import { validateSpec } from '../validate.js';

/**
 * Fahrzeugkategorie an Wasser- und Luftfahrzeug. Seit dem Fachreview vom 05.10.2026 (LFH-1064)
 * steht am Wasserfahrzeug nur das Amphibienfahrzeug (5.1.1.4), abgeleitet; am Luftfahrzeug keine
 * Kategorie. Geprüft wird die Lage gegen die vermessene Regel der Landfahrzeuge: Zone an der
 * Unterkante des Grundzeichens, Markenmitte 2,25 mm darunter, Radplätze 3,75 / 28,25.
 */

const flat = (children: readonly Primitive[]): Primitive[] =>
  children.flatMap((child) => (child.type === 'group' ? [child, ...flat(child.children)] : [child]));

function draw(kind: SymbolKind, bodyVariant: BodyVariantId | undefined, vehicleCategory: VehicleCategoryId) {
  return drawSymbol(spec(kind, bodyVariant, vehicleCategory));
}

function spec(kind: SymbolKind, bodyVariant: BodyVariantId | undefined, vehicleCategory: VehicleCategoryId): SymbolSpec {
  return {
    kind,
    ...(bodyVariant === undefined ? {} : { bodyVariant }),
    vehicleCategory,
    ...(bodyVariant === 'inset-hull' ? { organization: 'hilfsorganisation' as const } : {}),
  };
}

const rules = (value: SymbolSpec) => validateSpec(value).map((issue) => issue.rule);

function partsOf(drawing: ReturnType<typeof drawSymbol>) {
  const primitives = flat(drawing.children);
  const body = primitives.find((p) => p.role === 'body')!;
  const chassis = primitives.filter((p) => p.role === 'chassis');
  return { body, chassis };
}

const WATER_FORMS: readonly (BodyVariantId | undefined)[] = [undefined, 'raised-hull', 'inset-hull'];
const AIR_FORMS: readonly (BodyVariantId | undefined)[] = [undefined, 'raised-hull', 'fixed-wing-hull'];

describe('Fahrzeugkategorie an Wasser- und Luftfahrzeug', () => {
  it('zeichnet das Amphibienfahrzeug an jeder Wasserfahrzeugform innerhalb der Grundfläche', () => {
    for (const variant of WATER_FORMS) {
      const drawing = draw('vehicle-water', variant, 'amphibienfahrzeug');
      const label = `vehicle-water/${variant ?? '-'}`;
      expect(checkViewBox(drawing), label).toEqual([]);
      const { body, chassis } = partsOf(drawing);
      // Die Räder hängen wie am Landfahrzeug an der Körperunterkante (Kategorie-1-Plätze).
      const bottom = boundsOfMm(body).maxY;
      expect(chassis.flatMap((mark) => (mark.type === 'circle' ? [[mark.cx, mark.cy]] : [])), label).toEqual([
        [3.75, bottom + 2.25],
        [28.25, bottom + 2.25],
      ]);
      for (const mark of chassis) expect(boundsOfMm(mark).maxY + 0.25, label).toBeLessThanOrEqual(31 + 1e-6);
      expect(drawing.derivations?.map((note) => note.dimension), label).toContain('vehicleCategory');
    }
  });

  it('lehnt jede andere Kategorie am Wasserfahrzeug ab (Fachreview 05.10.2026)', () => {
    for (const variant of WATER_FORMS) {
      for (const id of VEHICLE_CATEGORY_IDS) {
        if (id === 'amphibienfahrzeug') continue;
        expect(rules(spec('vehicle-water', variant, id)), `vehicle-water/${variant ?? '-'}/${id}`)
          .toEqual(['vehicle-category-requires-chassis-body']);
      }
    }
  });

  it('lehnt jede Kategorie am Luftfahrzeug ab, auch das Amphibienfahrzeug (Fachreview 05.10.2026)', () => {
    for (const variant of AIR_FORMS) {
      for (const id of VEHICLE_CATEGORY_IDS) {
        expect(rules(spec('vehicle-air', variant, id)), `vehicle-air/${variant ?? '-'}/${id}`)
          .toEqual(['vehicle-category-requires-chassis-body']);
      }
    }
  });

  it('lässt jede Kategorie an Landfahrzeug, Anhänger und Wechsellader zu', () => {
    for (const kind of ['vehicle-land', 'trailer', 'swap-loader-vehicle'] as const) {
      for (const id of VEHICLE_CATEGORY_IDS) {
        expect(rules({ kind, vehicleCategory: id }), `${kind}/${id}`).toEqual([]);
      }
    }
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

  it('hält Beschriftungen unterhalb des Körpers vom Fahrwerk fern (below-body-zone-conflict)', () => {
    expect(rules({ kind: 'vehicle-water', bodyVariant: 'raised-hull', organization: 'feuerwehr', vehicleCategory: 'amphibienfahrzeug', labels: { belowRight: 'FW' } }))
      .toContain('below-body-zone-conflict');
    expect(rules({ kind: 'vehicle-water', bodyVariant: 'raised-hull', vehicleCategory: 'amphibienfahrzeug', labels: { surfaceBelowRight: 'AB' } }))
      .toContain('below-body-zone-conflict');
    expect(rules({ kind: 'vehicle-water', bodyVariant: 'raised-hull', vehicleCategory: 'amphibienfahrzeug', labels: { surfaceBelowLeft: 'AB' } }))
      .toContain('below-body-zone-conflict');
    // Ohne Fahrwerk bleiben dieselben Zonen offen.
    expect(rules({ kind: 'vehicle-water', bodyVariant: 'raised-hull', labels: { surfaceBelowRight: 'AB' } }))
      .not.toContain('below-body-zone-conflict');
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
