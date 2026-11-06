import { describe, expect, it } from 'vitest';
import {
  draw,
  drawAnySpec,
  drawSymbol,
  fromExact,
  parse,
  renderSvg,
  resolve,
  serialize,
  specKey,
} from '@einsatzzeichen/core';
import type { SymbolSpec } from '@einsatzzeichen/schema';
import { FREESTANDING_SPEC_FIXTURES } from './freestanding-spec-fixtures.js';
import { RECIPES } from './recipes.js';
import { TYPICAL_SYMBOLS } from './typical/index.js';

/**
 * Das Roundtrip-Gate der Beschreibungsebene (ESZ-149): Für jedes Rezept und jedes typische
 * Einsatzmittel zeichnet `draw(fromExact(spec))` bytegleich dasselbe SVG wie `drawSymbol(spec)`.
 * Das ist der Beleg, dass die Beschreibung keine Funktion des Bauplans verliert.
 */
const BODY_SPECS: readonly (readonly [string, SymbolSpec])[] = [
  ...Object.entries(RECIPES).map(([key, recipe]) => [`recipe:${key}`, recipe.spec] as const),
  ...Object.entries(TYPICAL_SYMBOLS).map(([key, typical]) => [`typical:${key}`, typical.spec] as const),
];

describe('Beschreibung ↔ Bauplan (ESZ-149)', () => {
  it('deckt Rezepte und typische Einsatzmittel ab', () => {
    expect(BODY_SPECS.length).toBeGreaterThan(500);
  });

  it('zeichnet jeden Bauplan über die Beschreibung bytegleich', () => {
    const mismatches: string[] = [];
    for (const [key, spec] of BODY_SPECS) {
      const sign = fromExact(spec);
      if (specKey(resolve(sign)) !== specKey(spec)) mismatches.push(`${key}: resolve`);
      const drawn = draw(sign);
      if (drawn.omitted.length > 0) mismatches.push(`${key}: omitted`);
      if (renderSvg(drawn.drawing) !== renderSvg(drawSymbol(spec))) mismatches.push(`${key}: svg`);
    }
    expect(mismatches).toEqual([]);
  });

  it('bringt jeden Bauplan über die Hülle v2 unverändert zurück', () => {
    const mismatches = BODY_SPECS.filter(([, spec]) => {
      const sign = fromExact(spec);
      return specKey(resolve(parse(serialize(sign)) as typeof sign)) !== specKey(spec);
    }).map(([key]) => key);
    expect(mismatches).toEqual([]);
  });

  it('drückt die meisten Baupläne ohne Bauplan-Ergänzung für Fachaufgaben aus', () => {
    // Kein Zielwert, sondern eine Wache: kippt die Fassungswahl, wandern Fachaufgaben in `exact`.
    const inSign = BODY_SPECS.filter(([, spec]) => {
      const sign = fromExact(spec);
      return 'kind' in sign && !('exact' in sign && sign.exact !== undefined && ('capabilities' in sign.exact || 'bodyMarks' in sign.exact));
    });
    expect(inSign.length / BODY_SPECS.length).toBeGreaterThan(0.8);
  });

  it('zeichnet freistehende Zeichen unverändert', () => {
    for (const { spec } of FREESTANDING_SPEC_FIXTURES) {
      const drawn = draw(fromExact(spec));
      expect(drawn.omitted).toEqual([]);
      expect(renderSvg(drawn.drawing)).toBe(renderSvg(drawAnySpec(spec)));
    }
  });
});
