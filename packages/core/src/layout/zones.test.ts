import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  BODY_VARIANT_IDS,
  SYMBOL_KINDS,
  type BodyFormZones,
  type BodyVariantId,
  type SymbolKind,
  type ZoneId,
  type ZoneMeasure,
} from '@einsatzzeichen/schema';
import { FOOT_GAP_MM, HEAD_GAP_MM, profileFor } from './profiles.js';
import {
  COMPOSE_ZONE_CONSTANTS,
  NOT_A_CLAIM_AT_SOURCE,
  UNDOCUMENTED_AT_SOURCE,
  ZONE_IDS,
  ZONE_MODEL,
  ZONE_MODEL_BODY_VARIANTS,
  ZONE_MODEL_FORMS,
  zoneGaps,
  zonesFor,
  type ZoneGapScopeCheck,
} from './zones.js';

const here = dirname(fileURLToPath(import.meta.url));

function readPackageSource(relativePath: string): string {
  return readFileSync(join(here, '..', relativePath), 'utf8');
}

function formKey(kind: SymbolKind, variant?: BodyVariantId): string {
  return variant === undefined ? kind : `${kind}/${variant}`;
}

const FORMS_BY_KEY = new Map<string, BodyFormZones>(
  ZONE_MODEL_FORMS.map((form) => [formKey(form.kind, form.variant), form]),
);

function measureOf(key: string, zone: ZoneId, id: string): ZoneMeasure {
  const form = FORMS_BY_KEY.get(key);
  expect(form, `Körperfassung "${key}" fehlt im Modell`).toBeDefined();
  const binding = (form as BodyFormZones).zones[zone];
  expect(binding.status, `${key} / ${zone} ist nicht belegt`).toBe('measured');
  const measure =
    binding.status === 'measured' ? binding.measures.find((entry) => entry.id === id) : undefined;
  expect(measure, `${key} / ${zone} / ${id} fehlt`).toBeDefined();
  return measure as ZoneMeasure;
}

function valueMmOf(key: string, zone: ZoneId, id: string): number {
  const measure = measureOf(key, zone, id);
  expect(measure.kind, `${key} / ${zone} / ${id} trägt keinen Zahlenwert`).not.toBe('rule');
  return measure.kind === 'offset' || measure.kind === 'size' ? measure.valueMm : Number.NaN;
}

describe('Zonenmodell: Vollständigkeit', () => {
  it('hält `ZoneGapScope` und `NotMeasuredScope` aneinander', () => {
    // Löst der Typ zu `never` auf, sind die beiden Wertelisten auseinandergelaufen und diese
    // Zuweisung ist kein gültiges TypeScript mehr.
    const check: ZoneGapScopeCheck = true;
    expect(check).toBe(true);
  });

  it('belegt jede der 19 Körperformen', () => {
    expect(Object.keys(ZONE_MODEL).sort()).toEqual([...SYMBOL_KINDS].sort());
    expect(SYMBOL_KINDS).toHaveLength(19);
    for (const kind of SYMBOL_KINDS) {
      expect(ZONE_MODEL[kind].kind, `${kind} trägt den falschen Schlüssel`).toBe(kind);
      expect(ZONE_MODEL[kind].variant).toBeUndefined();
    }
  });

  it('belegt an jeder Körperfassung jede Zone', () => {
    expect(ZONE_IDS).toHaveLength(16);
    for (const form of ZONE_MODEL_FORMS) {
      expect(Object.keys(form.zones).sort(), formKey(form.kind, form.variant)).toEqual(
        [...ZONE_IDS].sort(),
      );
    }
  });

  it('führt jede Variante mit eigenem Profil als eigene Körperfassung', () => {
    // Gegenprobe über alle 190 Paare: `profileFor()` gibt seine Zweige nicht aus, also wird
    // geprüft, ob ein Paar ein anderes Profilobjekt liefert als die Körperform ohne Variante.
    const branches: string[] = [];
    for (const kind of SYMBOL_KINDS) {
      for (const variant of BODY_VARIANT_IDS) {
        if (profileFor(kind, variant) !== profileFor(kind)) branches.push(formKey(kind, variant));
      }
    }
    const modelled = ZONE_MODEL_BODY_VARIANTS.map((form) => formKey(form.kind, form.variant));
    expect(branches.sort()).toEqual([...modelled].sort());
    expect(ZONE_MODEL_BODY_VARIANTS).toHaveLength(13);
    expect(ZONE_MODEL_FORMS).toHaveLength(32);
  });

  it('trägt an jeder Zone entweder Herkunft oder eine Lückenbegründung', () => {
    for (const form of ZONE_MODEL_FORMS) {
      const key = formKey(form.kind, form.variant);
      for (const zone of ZONE_IDS) {
        const binding = form.zones[zone];
        const where = `${key} / ${zone}`;
        if (binding.status === 'measured') {
          expect(binding.measures.length, `${where}: belegt, aber ohne Maß`).toBeGreaterThan(0);
          for (const measure of binding.measures) {
            expect(measure.id, `${where}: Maß ohne Kennung`).toMatch(/^[a-z0-9-]+$/);
            expect(measure.provenance.definedAt, `${where} / ${measure.id}`).toMatch(/:\d/);
            expect(
              measure.provenance.note.length,
              `${where} / ${measure.id}: Herkunftsaussage fehlt`,
            ).toBeGreaterThan(20);
            if (measure.kind === 'offset' || measure.kind === 'size') {
              expect(
                Number.isFinite(measure.valueMm),
                `${where} / ${measure.id}: kein endlicher Wert`,
              ).toBe(true);
            }
          }
        } else {
          expect(binding.gap.reason.length, `${where}: Lücke ohne Begründung`).toBeGreaterThan(40);
          expect(binding.gap.definedAt, `${where}: Lücke ohne Fundort`).toMatch(/:\d/);
        }
      }
    }
  });
});

describe('Zonenmodell: Herkunft der Zahlen', () => {
  /**
   * Handgeschriebene Erwartungen und **kein** Vergleich gegen `profileFor()`: das Modell leitet
   * seine Werte aus den Profilen ab, ein Rückvergleich wäre deshalb tautologisch und ein Fehler
   * in der Ableitung käme grün durch. Diese Zahlen stehen hier unabhängig und stammen aus den
   * Herkunftskommentaren von `profiles.ts` und `compose.ts`.
   */
  const FIXTURES: readonly (readonly [string, ZoneId, string, number])[] = [
    ['formation', 'body', 'default-anchor', 6],
    ['person', 'body', 'default-anchor', 1],
    ['post', 'body', 'default-anchor', 2],
    ['formation', 'head', 'head-gap', 1],
    ['formation', 'head', 'head-top-margin', 1],
    ['formation', 'foot', 'foot-top', 1],
    ['formation', 'foot', 'foot-text-size', 4],
    ['formation', 'label-center', 'center-baseline', 8],
    ['formation', 'label-center', 'center-box-margin', 1],
    ['formation', 'label-center', 'center-cap-height', 4.87],
    ['formation', 'label-bottom-left', 'bottom-baseline', 2],
    ['formation', 'label-bottom-left', 'side-margin', 2],
    ['formation', 'label-bottom-right', 'bottom-cap-height', 2.92],
    ['formation', 'label-bottom-center', 'bottom-center-baseline', 2],
    ['formation', 'label-top-left', 'top-left-baseline', 5],
    ['formation', 'label-top-left', 'top-left-anchor', 1.5],
    ['formation/foot-band', 'label-bottom-left', 'bottom-baseline', 5],
    ['vehicle-land', 'label-top-left', 'top-left-baseline', 6.75],
    ['vehicle-land', 'chassis', 'chassis-top', 0],
    ['vehicle-land', 'chassis', 'chassis-height', 4.75],
    ['vehicle-land/inverted-hull-track', 'chassis', 'chassis-top', 0.25],
    ['vehicle-land/plain-wheel-pair', 'label-top-left', 'top-left-line-1-baseline', 5.79],
    ['vehicle-land/plain-wheel-pair', 'label-top-left', 'top-left-line-2-baseline', 9.32],
    ['vehicle-land/plain-wheel-pair', 'label-top-left', 'top-left-lines-cap-height', 2.43],
    ['vehicle-water', 'label-center', 'center-baseline', 6.9896],
    ['vehicle-water/inset-hull', 'label-center', 'center-baseline', 7.99],
    ['vehicle-water/raised-hull', 'label-below-right', 'below-right-baseline', 4.01],
    ['vehicle-water/raised-hull', 'label-below-right', 'below-right-anchor', 0.5618],
    ['swap-loader-vehicle', 'label-center', 'center-baseline', 7.5],
    ['upright-rectangle', 'label-center', 'center-baseline', 13],
    ['vehicle-air/raised-hull', 'label-surface-below-right', 'surface-baseline', 8.01],
    ['vehicle-air/raised-hull', 'label-surface-below-right', 'surface-anchor', 0.01],
    ['vehicle-air/raised-hull', 'label-above-left', 'above-left-baseline', 0],
    ['circle-12', 'label-top-left', 'top-left-baseline', 1.000254],
    ['circle-12/raised-gable', 'label-top-left', 'top-left-baseline', -0.999746],
    ['circle-12/foot-band', 'label-bottom-center', 'bottom-center-baseline', 6],
    ['circle-12/foot-band', 'label-below-right', 'below-right-baseline', 1],
    ['circle-12/foot-band', 'label-below-right', 'below-right-anchor', 3],
    ['person/compact-person-diamond-26mm-lowered-2mm', 'label-above-left', 'above-left-baseline', -1.5],
    ['person/compact-person-diamond-26mm-lowered-2mm', 'label-above-left', 'above-left-anchor', -2],
  ];

  it.each(FIXTURES)('%s / %s / %s trägt %d mm', (key, zone, id, expected) => {
    expect(valueMmOf(key, zone, id)).toBeCloseTo(expected, 6);
  });

  it('führt die vermessenen Hüllen als Zonendaten', () => {
    const formationHull = measureOf('formation', 'body', 'measured-body-hull');
    expect(formationHull.kind === 'bounds' ? formationHull.boundsMm : undefined).toEqual({
      minX: 1, minY: 6, maxX: 31, maxY: 26,
    });
    const innerField = measureOf('formation', 'inner-field', 'inner-field-hull');
    expect(innerField.kind === 'bounds' ? innerField.boundsMm : undefined).toEqual({
      minX: 2, minY: 7, maxX: 30, maxY: 25,
    });
    const trailerHull = measureOf('trailer', 'body', 'measured-body-hull');
    expect(trailerHull.kind === 'bounds' ? trailerHull.boundsMm : undefined).toEqual({
      minX: 4, minY: 5.75, maxX: 31, maxY: 26,
    });
  });

  it('bezieht seine Quellenangaben ausschließlich über SourceReference', () => {
    for (const form of ZONE_MODEL_FORMS) {
      for (const zone of ZONE_IDS) {
        const binding = form.zones[zone];
        if (binding.status !== 'measured') continue;
        for (const measure of binding.measures) {
          for (const ref of measure.provenance.sourceRefs ?? []) {
            expect(ref.source).toBe('babz-svg-2025');
            // `verbatim` ist in `provenance.ts` an einen Fingerprint gebunden; ein Zonenmaß
            // trägt keinen. `derived` ist die Autorschaftsaussage der Entscheidung vom
            // 19. September 2026 und die einzige zulässige hier.
            expect(ref.status, `${form.kind} / ${zone} / ${measure.id}`).toBe('derived');
            expect(ref.section).toBeTruthy();
          }
        }
      }
    }
  });
});

describe('Zonenmodell: Bindung an die bestehenden Fundorte', () => {
  it('hält die aus compose.ts wiederholten Konstanten an ihrer Deklaration fest', () => {
    const composeSource = readPackageSource('compose.ts');
    for (const [name, value] of Object.entries(COMPOSE_ZONE_CONSTANTS)) {
      const match = new RegExp(`\\bconst ${name} = (-?[0-9.]+);`).exec(composeSource);
      expect(match, `${name} steht nicht mehr so in compose.ts — Scan ins Leere gelaufen`)
        .not.toBeNull();
      expect(Number((match as RegExpExecArray)[1]), `${name} ist in compose.ts weggelaufen`)
        .toBeCloseTo(value, 6);
    }
    expect(Object.keys(COMPOSE_ZONE_CONSTANTS)).toHaveLength(6);
  });

  it('hält die Fahrwerks-Körperformen an CHASSIS_KINDS in validate.ts fest', () => {
    const validateSource = readPackageSource('validate.ts');
    const block = /const CHASSIS_KINDS = new Set<SymbolKind>\(\[([^\]]*)\]\)/.exec(validateSource);
    expect(block, 'CHASSIS_KINDS steht nicht mehr so in validate.ts').not.toBeNull();
    const kinds = [...(block as RegExpExecArray)[1].matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);
    expect(kinds.sort()).toEqual(['swap-loader-vehicle', 'trailer', 'vehicle-land']);

    for (const kind of SYMBOL_KINDS) {
      const binding = ZONE_MODEL[kind].zones.chassis;
      expect(binding.status, `${kind}: Fahrwerkszone`).toBe(
        kinds.includes(kind) ? 'measured' : 'measured-absent',
      );
    }
  });

  it('nennt jede Herkunft mit Datei und Zeile', () => {
    const files = new Set<string>();
    for (const form of ZONE_MODEL_FORMS) {
      for (const zone of ZONE_IDS) {
        const binding = form.zones[zone];
        const places =
          binding.status === 'measured'
            ? binding.measures.map((measure) => measure.provenance.definedAt)
            : [binding.gap.definedAt];
        for (const place of places) {
          for (const match of place.matchAll(/([a-z0-9/-]+\.ts):/g)) files.add(match[1] as string);
        }
      }
    }
    expect([...files].sort()).toEqual([
      'core/src/compose.ts',
      'core/src/geometry/base-symbols.ts',
      'core/src/layout/profiles.ts',
      'core/src/validate.ts',
      'schema/src/chassis.ts',
      'schema/src/taxonomy.ts',
    ]);
  });
});

describe('Zonenmodell: deklarierte Lücken', () => {
  it('nagelt die Liste der Lücken fest', () => {
    // Je Zone und Zustand eine Zeile mit allen betroffenen Körperfassungen. Dieselbe Aussage wie
    // 303 Einzelzeilen, nur lesbar: eine still geschlossene Lücke verschwindet aus ihrer Zeile,
    // eine neue erscheint darin, und eine Zone, die kippt, wechselt die Zeile.
    const byZone: Record<string, string[]> = {};
    for (const entry of zoneGaps()) {
      const key = `${entry.zone} | ${entry.status} | ${entry.scope}`;
      (byZone[key] ??= []).push(entry.form);
    }
    for (const forms of Object.values(byZone)) forms.sort();
    expect(byZone).toEqual(PINNED_GAPS);
    expect(zoneGaps()).toHaveLength(303);
  });

  it('führt Zustand und Tendenz an jeder Körperfassung als unvermessen', () => {
    for (const form of ZONE_MODEL_FORMS) {
      for (const zone of ['state-margin', 'tendency-margin'] as const) {
        const binding = form.zones[zone];
        expect(binding.status, `${formKey(form.kind, form.variant)} / ${zone}`)
          .toBe('not-measured');
        // `value` und nicht `combination`: Kapitel 5.8 ist an **keiner** Kombination vermessen,
        // eine andere Grundzeichenart hilft nicht.
        expect(binding.status === 'not-measured' ? binding.gap.scope : undefined).toBe('value');
      }
    }
    expect(ZONE_MODEL.formation.zones['tendency-margin'].status === 'not-measured'
      ? ZONE_MODEL.formation.zones['tendency-margin'].gap.reason
      : '').toContain('keine eigene Achse');
  });

  it('nagelt die Zahlen ohne Herkunftsaussage am Fundort fest', () => {
    const undocumented: string[] = [];
    const notAClaim: string[] = [];
    for (const form of ZONE_MODEL_FORMS) {
      const key = formKey(form.kind, form.variant);
      for (const zone of ZONE_IDS) {
        const binding = form.zones[zone];
        if (binding.status !== 'measured') continue;
        for (const measure of binding.measures) {
          if (measure.provenance.note.startsWith(UNDOCUMENTED_AT_SOURCE)) {
            undocumented.push(`${key} | ${zone} | ${measure.id}`);
          }
          if (measure.provenance.note.startsWith(NOT_A_CLAIM_AT_SOURCE)) {
            notAClaim.push(`${key} | ${zone} | ${measure.id}`);
          }
        }
      }
    }
    expect(undocumented.sort()).toEqual(PINNED_UNDOCUMENTED);
    expect(notAClaim.sort()).toEqual(PINNED_NOT_A_CLAIM);
  });

  it('fällt für eine unbelegte Variante auf die Körperform zurück — bekannte Grenze', () => {
    // **Dieser Test hält eine Schwäche fest, er billigt sie nicht.** `zonesFor()` erbt das
    // Rückfallverhalten von `profileFor()`: eine Variante, die es an dieser Körperform gar nicht
    // gibt, liefert das Profil der Körperform ohne Variante. `baseDrawing()` im Katalog lehnt
    // genau das ab — „der Katalog fällt nicht auf die Zeichnung aus Kapitel 1 zurück: die wäre
    // eine andere Geometrie, und die Verwechslung bliebe unsichtbar."
    //
    // Das Modell ist darin mit sich selbst uneins: `inner-field` bildet die Variantensemantik
    // korrekt ab (Variante angegeben → nur die Variantentabelle zählt), die übrigen Zonen folgen
    // dem Profil. Ein Abbruch gehört in den Slice, der `profileFor()` an das Zonenmodell bindet;
    // bis dahin steht die Grenze hier und in Abschnitt 4 der Entscheidungsvorlage.
    expect(zonesFor('trailer', 'foot-band').zones['label-center']).toEqual(
      ZONE_MODEL.trailer.zones['label-center'],
    );
    // Die Gegenprobe: die Variantenliste des Modells führt diese Fassung **nicht**.
    expect(ZONE_MODEL_BODY_VARIANTS.map((form) => formKey(form.kind, form.variant)))
      .not.toContain('trailer/foot-band');
  });
});

/**
 * Die deklarierten Lücken des Modells, je Zone, Zustand und Reichweite mit allen betroffenen
 * Körperfassungen. 303 Einzelbindungen, hier gruppiert — dieselbe Aussage, lesbar im Diff: eine
 * still geschlossene Lücke verschwindet aus ihrer Zeile, eine neue erscheint darin, und eine
 * Zone, deren Befund kippt, wechselt den Schlüssel.
 */
const PINNED_GAPS: Readonly<Record<string, readonly string[]>> = {
  'chassis | measured-absent | combination': [
    'area', 'building', 'circle-12', 'circle-12/foot-band', 'circle-12/raised-circle-1mm',
    'circle-12/raised-gable', 'container', 'event', 'formation', 'formation/foot-band', 'hazard',
    'measure', 'person', 'person/compact-person-diamond-26mm',
    'person/compact-person-diamond-26mm-lowered-2mm', 'point', 'post', 'reduced-house',
    'spontaneous-helper', 'upright-rectangle', 'vehicle-air', 'vehicle-air/fixed-wing-hull',
    'vehicle-air/raised-hull', 'vehicle-water', 'vehicle-water/inset-hull',
    'vehicle-water/raised-hull',
  ],
  'head | measured-absent | combination': [
    'circle-12', 'circle-12/foot-band', 'circle-12/raised-circle-1mm', 'circle-12/raised-gable',
    'post', 'swap-loader-vehicle', 'trailer', 'upright-rectangle',
  ],
  'inner-field | not-measured | combination': [
    'area', 'circle-12', 'circle-12/foot-band', 'circle-12/raised-circle-1mm',
    'circle-12/raised-gable', 'container', 'event', 'formation/foot-band', 'hazard', 'measure',
    'person', 'person/compact-person-diamond-26mm',
    'person/compact-person-diamond-26mm-lowered-2mm', 'point', 'post', 'reduced-house',
    'spontaneous-helper', 'vehicle-air', 'vehicle-air/fixed-wing-hull', 'vehicle-air/raised-hull',
    'vehicle-land/foot-band', 'vehicle-land/inverted-hull-track', 'vehicle-land/plain-wheel-pair',
    'vehicle-water', 'vehicle-water/inset-hull',
  ],
  'label-above-left | not-measured | combination': [
    'area', 'building', 'circle-12', 'circle-12/foot-band', 'circle-12/raised-circle-1mm',
    'circle-12/raised-gable', 'container', 'event', 'formation', 'formation/foot-band', 'hazard',
    'measure', 'person', 'person/compact-person-diamond-26mm', 'point', 'post', 'reduced-house',
    'spontaneous-helper', 'swap-loader-vehicle', 'trailer', 'upright-rectangle', 'vehicle-air',
    'vehicle-land', 'vehicle-land/foot-band', 'vehicle-land/inverted-hull-track',
    'vehicle-land/plain-wheel-pair', 'vehicle-water', 'vehicle-water/inset-hull',
    'vehicle-water/raised-hull',
  ],
  'label-below-right | not-measured | combination': [
    'area', 'building', 'circle-12', 'circle-12/raised-circle-1mm', 'circle-12/raised-gable',
    'container', 'event', 'formation', 'formation/foot-band', 'hazard', 'measure', 'person',
    'person/compact-person-diamond-26mm', 'person/compact-person-diamond-26mm-lowered-2mm',
    'point', 'post', 'reduced-house', 'spontaneous-helper', 'swap-loader-vehicle', 'trailer',
    'upright-rectangle', 'vehicle-air', 'vehicle-air/fixed-wing-hull', 'vehicle-air/raised-hull',
    'vehicle-land', 'vehicle-land/foot-band', 'vehicle-land/inverted-hull-track',
    'vehicle-land/plain-wheel-pair', 'vehicle-water', 'vehicle-water/inset-hull',
  ],
  'label-bottom-center | not-measured | combination': [
    'area', 'building', 'circle-12', 'circle-12/raised-circle-1mm', 'circle-12/raised-gable',
    'container', 'event', 'hazard', 'measure', 'person', 'person/compact-person-diamond-26mm',
    'person/compact-person-diamond-26mm-lowered-2mm', 'point', 'post', 'reduced-house',
    'spontaneous-helper', 'swap-loader-vehicle', 'trailer', 'upright-rectangle', 'vehicle-air',
    'vehicle-air/fixed-wing-hull', 'vehicle-air/raised-hull', 'vehicle-land',
    'vehicle-land/foot-band', 'vehicle-land/inverted-hull-track', 'vehicle-land/plain-wheel-pair',
    'vehicle-water', 'vehicle-water/inset-hull', 'vehicle-water/raised-hull',
  ],
  'label-center | not-measured | combination': [
    'circle-12', 'circle-12/foot-band', 'circle-12/raised-circle-1mm', 'circle-12/raised-gable',
    'person', 'person/compact-person-diamond-26mm',
    'person/compact-person-diamond-26mm-lowered-2mm', 'post',
  ],
  'label-surface-below-left | not-measured | combination': [
    'area', 'building', 'circle-12', 'circle-12/foot-band', 'circle-12/raised-gable', 'container',
    'event', 'formation', 'formation/foot-band', 'hazard', 'measure', 'person',
    'person/compact-person-diamond-26mm', 'person/compact-person-diamond-26mm-lowered-2mm',
    'point', 'post', 'reduced-house', 'spontaneous-helper', 'swap-loader-vehicle', 'trailer',
    'upright-rectangle', 'vehicle-air', 'vehicle-air/fixed-wing-hull', 'vehicle-air/raised-hull',
    'vehicle-land', 'vehicle-land/foot-band', 'vehicle-land/inverted-hull-track',
    'vehicle-land/plain-wheel-pair', 'vehicle-water', 'vehicle-water/inset-hull',
    'vehicle-water/raised-hull',
  ],
  'label-surface-below-right | not-measured | combination': [
    'area', 'building', 'circle-12', 'circle-12/foot-band', 'circle-12/raised-gable', 'container',
    'event', 'formation', 'formation/foot-band', 'hazard', 'measure', 'person',
    'person/compact-person-diamond-26mm', 'person/compact-person-diamond-26mm-lowered-2mm',
    'point', 'post', 'reduced-house', 'spontaneous-helper', 'swap-loader-vehicle', 'trailer',
    'upright-rectangle', 'vehicle-air', 'vehicle-air/fixed-wing-hull', 'vehicle-land',
    'vehicle-land/foot-band', 'vehicle-land/inverted-hull-track', 'vehicle-land/plain-wheel-pair',
    'vehicle-water', 'vehicle-water/inset-hull', 'vehicle-water/raised-hull',
  ],
  'label-top-left | not-measured | combination': [
    'area', 'building', 'circle-12/foot-band', 'circle-12/raised-circle-1mm', 'container',
    'event', 'hazard', 'measure', 'person', 'person/compact-person-diamond-26mm',
    'person/compact-person-diamond-26mm-lowered-2mm', 'point', 'post', 'reduced-house',
    'spontaneous-helper', 'swap-loader-vehicle', 'trailer', 'upright-rectangle', 'vehicle-air',
    'vehicle-air/raised-hull', 'vehicle-water', 'vehicle-water/inset-hull',
    'vehicle-water/raised-hull',
  ],
  'state-margin | not-measured | value': [
    'area', 'building', 'circle-12', 'circle-12/foot-band', 'circle-12/raised-circle-1mm',
    'circle-12/raised-gable', 'container', 'event', 'formation', 'formation/foot-band', 'hazard',
    'measure', 'person', 'person/compact-person-diamond-26mm',
    'person/compact-person-diamond-26mm-lowered-2mm', 'point', 'post', 'reduced-house',
    'spontaneous-helper', 'swap-loader-vehicle', 'trailer', 'upright-rectangle', 'vehicle-air',
    'vehicle-air/fixed-wing-hull', 'vehicle-air/raised-hull', 'vehicle-land',
    'vehicle-land/foot-band', 'vehicle-land/inverted-hull-track', 'vehicle-land/plain-wheel-pair',
    'vehicle-water', 'vehicle-water/inset-hull', 'vehicle-water/raised-hull',
  ],
  'tendency-margin | not-measured | value': [
    'area', 'building', 'circle-12', 'circle-12/foot-band', 'circle-12/raised-circle-1mm',
    'circle-12/raised-gable', 'container', 'event', 'formation', 'formation/foot-band', 'hazard',
    'measure', 'person', 'person/compact-person-diamond-26mm',
    'person/compact-person-diamond-26mm-lowered-2mm', 'point', 'post', 'reduced-house',
    'spontaneous-helper', 'swap-loader-vehicle', 'trailer', 'upright-rectangle', 'vehicle-air',
    'vehicle-air/fixed-wing-hull', 'vehicle-air/raised-hull', 'vehicle-land',
    'vehicle-land/foot-band', 'vehicle-land/inverted-hull-track', 'vehicle-land/plain-wheel-pair',
    'vehicle-water', 'vehicle-water/inset-hull', 'vehicle-water/raised-hull',
  ],
};

/**
 * Zahlen, die im Repository ohne Herkunftsaussage stehen. Sie sind in Gebrauch und wirksam, ihr
 * Fundort nennt aber weder Abschnitt noch Messdatum. Die Liste steht hier, damit sie schrumpft,
 * wenn jemand nachmisst, und auffällt, wenn sie wächst.
 */
const PINNED_UNDOCUMENTED: readonly string[] = [
  'circle-12 | body | default-anchor',
  'circle-12/foot-band | body | default-anchor',
  'circle-12/raised-circle-1mm | body | default-anchor',
  'circle-12/raised-circle-1mm | label-surface-below-left | surface-anchor',
  'circle-12/raised-circle-1mm | label-surface-below-left | surface-baseline',
  'circle-12/raised-circle-1mm | label-surface-below-right | surface-anchor',
  'circle-12/raised-circle-1mm | label-surface-below-right | surface-baseline',
  'circle-12/raised-gable | body | default-anchor',
  'post | body | default-anchor',
  'vehicle-air/fixed-wing-hull | label-above-left | above-left-anchor',
  'vehicle-air/fixed-wing-hull | label-above-left | above-left-baseline',
  'vehicle-air/fixed-wing-hull | label-top-left | top-left-baseline',
  'vehicle-air/fixed-wing-hull | label-top-left | top-left-requires-metrics',
];

/**
 * Zahlen, deren Fundort ausdrücklich sagt, dass sie an dieser Körperform keine Behauptung sind:
 * die drei E.2-Körperformen können keine Kopfzone tragen, ihr Standardanker ist damit
 * unerreichbar.
 */
const PINNED_NOT_A_CLAIM: readonly string[] = [
  'swap-loader-vehicle | body | default-anchor',
  'trailer | body | default-anchor',
  'upright-rectangle | body | default-anchor',
];

describe('Fußzonenabstand: eigene Konstante, übernommener Wert', () => {
  /**
   * Entscheidung vom 21. September 2026 zu LFH-562 (Befund 2 der Vorlage
   * `docs/decisions/2026-09-20-zonenmodell-als-daten.md`): Die Fußzone rechnete mit
   * `HEAD_GAP_MM` — eine Konstante für zwei Bedeutungen, nirgends niedergeschrieben. Sie hat
   * jetzt `FOOT_GAP_MM`, denselben Wert, eine eigene Herkunftsaussage.
   *
   * Die drei Fälle hier sichern genau das ab, was die Trennung wert ist: dass `compose()` die
   * neue Konstante tatsächlich benutzt, dass die Gleichheit der Werte heute gilt und dass ein
   * Auseinanderlaufen auffällt statt stillschweigend jede Fußzeile zu verschieben.
   */
  it('compose() rechnet die Fußzone mit FOOT_GAP_MM, nicht mit HEAD_GAP_MM', () => {
    const source = readPackageSource('compose.ts');
    expect(source).toContain('const footTopMm = bodyBoundsMm.maxY + FOOT_GAP_MM;');
    expect(source).not.toContain('const footTopMm = bodyBoundsMm.maxY + HEAD_GAP_MM;');
  });

  it('trägt heute denselben Wert wie die Kopfzone — als Übernahme, nicht als Zusicherung', () => {
    // Kein „muss gleich bleiben": sobald jemand die Fußzone eigens vermisst, gehört dieser Fall
    // geändert. Er steht hier, damit das eine bewusste Änderung ist.
    expect(FOOT_GAP_MM).toBe(HEAD_GAP_MM);
  });

  it('nennt die Übernahme in der Herkunftsaussage jeder Körperform', () => {
    for (const form of ZONE_MODEL_FORMS) {
      const foot = form.zones.foot;
      if (foot.status !== 'measured') continue;
      const footTop = foot.measures.find((measure) => measure.id === 'foot-top');
      expect(footTop, `${formKey(form.kind, form.variant)}: foot-top fehlt`).toBeDefined();
      expect(footTop?.provenance.note).toContain('nicht** vermessen');
      expect(footTop?.provenance.note).toContain('Kopfzone');
    }
  });
});
