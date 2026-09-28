import { describe, expect, it } from 'vitest';
import {
  BODY_MARK_COMBINATION_OVERRIDES,
  CAPABILITY_COMBINATION_EXCEPTIONS,
  bodyMark,
  boundsOfMm,
  capabilityCombinationRule,
} from '@einsatzzeichen/core';
import { CAPABILITY_IDS, type BodyMarkId, type SymbolSpec } from '@einsatzzeichen/schema';
import { GRAMMAR_FIXTURES, composeFromCatalog } from './recipes.js';

/**
 * Gate der Mehrfachfähigkeiten (LFH-567) gegen die Fixtures: die Zählung in
 * `CAPABILITY_COMBINATION_RULES` gegen die Rezepte in beide Richtungen, und die Überlagerungsregel
 * gegen den Motor.
 *
 * **Was „Überlagerung" hier prüfbar heißt.** Eine Marke folgt der Regel, wenn ihre Zeichnung in der
 * Kombination dieselbe ist wie allein an derselben Körperhülle. Das prüft der Test je Marke und je
 * Fixture, mit genau dem Kontext, den `compose()` an `bodyMark()` gibt. Eine benannte Ausnahme muss
 * umgekehrt genau an ihren `overrides` abweichen, sonst ist sie überflüssig oder unvollständig.
 */

const CAPABILITIES = new Set<string>(CAPABILITY_IDS);
const entries = Object.entries(GRAMMAR_FIXTURES) as [string, { spec: SymbolSpec; referenceAsset: string }][];

function capabilityCount(spec: SymbolSpec): number {
  return (spec.bodyMarks ?? []).filter((mark) => CAPABILITIES.has(mark)).length;
}

function formKey(kind: string, variant: string | undefined): string {
  return `${kind}/${variant ?? '-'}`;
}

/** Die Körperhülle, gegen die `compose()` die randbündigen Marken rechnet. */
function placedBodyBounds(spec: SymbolSpec) {
  const body = composeFromCatalog(spec).children.find((child) => child.role === 'body');
  if (body === undefined) throw new Error('Komposition ohne Körper');
  return boundsOfMm(body);
}

/** Der Kontext aus `compose.ts`, mit oder ohne die vollständige Markenmenge. */
function contextOf(spec: SymbolSpec, withCombination: boolean): Parameters<typeof bodyMark>[1] {
  const occupiedLabelZones = (['bottomCenter', 'bottomRight', 'belowRight'] as const)
    .filter((zone) => spec.labels?.[zone] !== undefined);
  return {
    kind: spec.kind,
    ...(spec.bodyVariant === undefined ? {} : { bodyVariant: spec.bodyVariant }),
    ...(spec.vehicleCategory === undefined ? {} : { vehicleCategory: spec.vehicleCategory }),
    ...(spec.strength === undefined ? {} : { strength: spec.strength }),
    ...(withCombination ? { bodyMarks: spec.bodyMarks } : {}),
    ...(occupiedLabelZones.length === 0 ? {} : { occupiedLabelZones }),
  };
}

/** Die Marken, deren Zeichnung in der Kombination von der Einzelfassung abweicht. */
function divergingMarks(spec: SymbolSpec): BodyMarkId[] {
  const bounds = placedBodyBounds(spec);
  return (spec.bodyMarks ?? []).filter((id) => {
    const combined = bodyMark(id, contextOf(spec, true), bounds);
    const alone = bodyMark(id, contextOf(spec, false), bounds);
    return JSON.stringify(combined) !== JSON.stringify(alone);
  });
}

const flush = capabilityCombinationRule('flush');
const exceptionFixtures = new Set(CAPABILITY_COMBINATION_EXCEPTIONS.map((entry) => entry.fixture));

describe('Mehrfachfähigkeiten gegen die Fixtures', () => {
  it('führt genau die Fixtures mit zwei oder mehr Fähigkeiten, an ihrer Körperfassung', () => {
    const fromRecipes = entries
      .filter(([, recipe]) => capabilityCount(recipe.spec) >= 2)
      .map(([key, recipe]) => `${formKey(recipe.spec.kind, recipe.spec.bodyVariant)} ${key}`)
      .sort();
    const fromRule = flush.forms
      .flatMap((entry) =>
        [...entry.fixtures, ...entry.exceptions].map((key) => `${formKey(entry.kind, entry.variant)} ${key}`))
      .sort();
    expect(fromRule).toEqual(fromRecipes);
  });

  it('belegt die größte Zahl randbündiger Fähigkeiten an den genannten Originalen', () => {
    const counts = entries.map(([, recipe]) => capabilityCount(recipe.spec));
    const max = Math.max(...counts);
    expect(flush.maxObserved).toMatchObject({ status: 'evidenced', value: max });
    if (flush.maxObserved.status !== 'evidenced') return;
    const withMax = new Set(
      entries.filter(([, recipe]) => capabilityCount(recipe.spec) === max)
        .map(([, recipe]) => recipe.referenceAsset),
    );
    for (const evidence of flush.maxObserved.evidence) {
      if ('asset' in evidence) expect(withMax, evidence.asset).toContain(evidence.asset);
    }
  });

  it('findet keine Fixture mit Boxfähigkeiten', () => {
    const withBox = entries.filter(([, recipe]) => (recipe.spec.capabilities?.length ?? 0) > 0);
    expect(withBox.map(([key]) => key)).toEqual([]);
    expect(capabilityCombinationRule('box').maxObserved).toMatchObject({ status: 'evidenced', value: 0 });
  });

  it('nennt an jeder Ausnahme das Original und die Markenmenge ihrer Fixture', () => {
    for (const exception of CAPABILITY_COMBINATION_EXCEPTIONS) {
      const recipe = GRAMMAR_FIXTURES[exception.fixture as keyof typeof GRAMMAR_FIXTURES] as
        | { spec: SymbolSpec; referenceAsset: string }
        | undefined;
      expect(recipe, exception.fixture).toBeDefined();
      if (recipe === undefined) continue;
      expect(recipe.referenceAsset, exception.fixture).toBe(exception.asset);
      expect(recipe.spec.bodyMarks, exception.fixture).toEqual(exception.marks);
      expect(formKey(recipe.spec.kind, recipe.spec.bodyVariant), exception.fixture)
        .toBe(formKey(exception.kind, exception.variant));
    }
  });
});

describe('Die Überlagerungsregel gegen den Motor', () => {
  const multiMark = entries.filter(([, recipe]) => (recipe.spec.bodyMarks?.length ?? 0) >= 2);

  it('prüft alle 28 Fixtures mit mehreren Körpermarken, auch mit rein technischen Marken', () => {
    expect(multiMark).toHaveLength(28);
  });

  it('zeichnet in jeder regelgemäßen Fixture jede Marke wie allein', () => {
    const violations = multiMark
      .filter(([key]) => !exceptionFixtures.has(key))
      .map(([key, recipe]) => [key, divergingMarks(recipe.spec)] as const)
      .filter(([, marks]) => marks.length > 0);
    expect(violations).toEqual([]);
  });

  it('weicht in jeder Ausnahme genau an den benannten Marken ab', () => {
    for (const exception of CAPABILITY_COMBINATION_EXCEPTIONS) {
      const recipe = GRAMMAR_FIXTURES[exception.fixture as keyof typeof GRAMMAR_FIXTURES] as
        { spec: SymbolSpec };
      expect(divergingMarks(recipe.spec).sort(), exception.fixture)
        .toEqual([...exception.overrides].sort());
    }
  });

  it('hat für jede Kombinationsfassung des Motors eine Fixture', () => {
    expect(BODY_MARK_COMBINATION_OVERRIDES).toHaveLength(CAPABILITY_COMBINATION_EXCEPTIONS.length);
  });
});
