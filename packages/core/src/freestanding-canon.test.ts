import {
  PICTOGRAM_IDS,
  STATE_IDS,
  type DepictionVariant,
  type FreestandingSpec,
  type PictogramId,
  type Primitive,
} from '@einsatzzeichen/schema';
import { describe, expect, it } from 'vitest';
import { drawAnySpec } from './draw-freestanding.js';
import { pictogramDrawing } from './geometry/standalone-pictogram.js';
import { PLACES } from './places.js';
import { freestandingRedirect, validateFreestandingSpec } from './validate-freestanding.js';

/**
 * „Eine Spec je Bild“ als Durchlauf (LFH-798, Entscheidung vom 10.10.2026, Punkt 3): Umgeleitet
 * wird nur, wo es für **genau dieses Bild** — Wert und Variante — schon eine Spec gibt, die es
 * zeichnet. Für jede Kennung beider Arten in beiden Varianten: Lehnt die Prüfung mit
 * `*-not-canonical` ab, muss die Umleitung zeichnen, und zwar dieselbe Geometrie wie die
 * Kapiteldatei aus dem Register.
 */

const VARIANTS: readonly DepictionVariant[] = ['primary', 'alternative'];

/**
 * Die eine benannte Ausnahme: die Leitstelle D.2.5. Der Eigentümer hat sie auf ihren Ort
 * (`PLACES['control-center']`) umgeleitet, obwohl die Geometrie nicht gleich ist — das Register
 * setzt „LtS“ mit 10 mm bei x 16,238, `drawPlace` mit 10,61 mm bei x 16 (Lauf aus der Grammatik).
 * Hier wird nur verlangt, dass die Umleitung ohne Wurf zeichnet.
 */
const PLACE_REDIRECTS: ReadonlySet<PictogramId> = new Set(['leadership.control-center']);

/** Geometrie ohne Rolle, Zahlen auf 0,01 mm, Schlüssel sortiert. */
function geometry(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(geometry);
  if (typeof value === 'number') return Math.round(value * 100) / 100;
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .filter((key) => key !== 'role')
        .sort()
        .map((key) => [key, geometry((value as Record<string, unknown>)[key])]),
    );
  }
  return value;
}

function shapeOf(drawing: { viewBox: unknown; children: readonly Primitive[] }): unknown {
  return geometry({ viewBox: drawing.viewBox, children: drawing.children });
}

const SPECS: readonly { spec: FreestandingSpec; id: PictogramId; variant: DepictionVariant }[] = [
  ...STATE_IDS.flatMap((state) =>
    VARIANTS.map((variant) => ({
      spec: { kind: 'state', state, ...(variant === 'primary' ? {} : { variant }) } as FreestandingSpec,
      id: `state.${state}` as PictogramId,
      variant,
    })),
  ),
  ...PICTOGRAM_IDS.flatMap((pictogram) =>
    VARIANTS.map((variant) => ({
      spec: { kind: 'pictogram', pictogram, ...(variant === 'primary' ? {} : { variant }) } as FreestandingSpec,
      id: pictogram,
      variant,
    })),
  ),
];

function isNotCanonical(spec: FreestandingSpec): boolean {
  return validateFreestandingSpec(spec).some((issue) => issue.rule.endsWith('-not-canonical'));
}

describe('Eine Spec je Bild: jede Umleitung zeichnet genau das Bild', () => {
  const redirected = SPECS.filter(({ spec }) => isNotCanonical(spec));

  it('findet umgeleitete Werte in beiden Arten', () => {
    expect(redirected.filter(({ spec }) => spec.kind === 'state').length).toBeGreaterThan(0);
    expect(redirected.filter(({ spec }) => spec.kind === 'pictogram').length).toBeGreaterThan(0);
  });

  it.each(redirected.map((entry) => [JSON.stringify(entry.spec), entry] as const))('%s', (_label, { spec, id, variant }) => {
    const target = freestandingRedirect(spec);
    expect(target).toBeDefined();
    if (target === undefined) return;
    const drawn = drawAnySpec(target);
    if (PLACE_REDIRECTS.has(id)) {
      expect(target).toEqual(PLACES['control-center'].spec);
      return;
    }
    expect(shapeOf(drawn)).toEqual(shapeOf(pictogramDrawing(id, variant)));
  });

  it('leitet nie um, wo die Prüfung nicht ablehnt', () => {
    for (const { spec } of SPECS) {
      if (!isNotCanonical(spec)) expect(freestandingRedirect(spec), JSON.stringify(spec)).toBeUndefined();
    }
  });
});

describe('Variante vor Kanonik', () => {
  it('meldet eine Variante, die das Register nicht führt, als Variantenregel, nicht als Kanonik', () => {
    const rules = (spec: FreestandingSpec) => validateFreestandingSpec(spec).map((issue) => issue.rule);
    expect(rules({ kind: 'state', state: 'sick-animal', variant: 'alternative' })).toEqual(['state-variant-not-available']);
    expect(rules({ kind: 'state', state: 'weather-sunny', variant: 'alternative' })).toEqual(['state-variant-not-available']);
    expect(rules({ kind: 'state', state: 'person-dead', variant: 'alternative' })).toEqual(['state-variant-not-available']);
    expect(rules({ kind: 'pictogram', pictogram: 'state.tactical-attack', variant: 'alternative' })).toEqual([
      'pictogram-variant-not-available',
    ]);
    expect(rules({ kind: 'pictogram', pictogram: 'leadership.control-center', variant: 'alternative' })).toEqual([
      'pictogram-variant-not-available',
    ]);
  });

  it('hält die zweite Darstellung von 5.8.8.6 im Zustand: die Person zeichnet nur die erste', () => {
    expect(validateFreestandingSpec({ kind: 'state', state: 'person-contaminated', variant: 'alternative' })).toEqual([]);
    expect(freestandingRedirect({ kind: 'pictogram', pictogram: 'state.person-contaminated', variant: 'alternative' })).toEqual({
      kind: 'state',
      state: 'person-contaminated',
      variant: 'alternative',
    });
    expect(freestandingRedirect({ kind: 'state', state: 'person-contaminated' })).toEqual({
      kind: 'person',
      states: ['person-contaminated'],
    });
  });
});

describe('Umleitung auf einen Ort', () => {
  it('gibt kein veränderbares geteiltes Objekt heraus', () => {
    const target = freestandingRedirect({ kind: 'pictogram', pictogram: 'leadership.control-center' }) as unknown as Record<string, unknown>;
    expect(Object.isFrozen(target)).toBe(true);
    expect(Object.isFrozen(target.labels)).toBe(true);
    expect(Object.isFrozen(target.bodyMarks)).toBe(true);
    expect(() => {
      (target.labels as Record<string, unknown>).center = 'X';
    }).toThrow(TypeError);
    expect(PLACES['control-center'].spec.labels?.center).toBe('LtS');
  });
});
