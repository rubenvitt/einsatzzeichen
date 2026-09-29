import { describe, expect, it } from 'vitest';
import {
  decodeSpecParam,
  encodeSpecParam,
  parseSpec,
  renderSvg,
  serializeSpec,
} from '@einsatzzeichen/core';
import type { SymbolSpec } from '@einsatzzeichen/schema';
import { RECIPES, composeFromCatalog } from './recipes.js';

/**
 * Rundreise der kanonischen Serialisierung (LFH-577) über den ganzen Rezeptbestand. Hier und nicht
 * in `core`, weil die Rezepte im Prüfpaket liegen. Maßstab ist das gerenderte SVG, nicht die
 * Objektgleichheit: `decode(encode(x))` muss **byte-gleich** zeichnen wie `x`.
 */

const recipeEntries: [string, { title: string; spec: SymbolSpec }][] = Object.entries(RECIPES);

function svg(spec: SymbolSpec, title: string): string {
  return renderSvg(composeFromCatalog(spec, title), { size: 64 });
}

/** Baut jedes Objekt mit umgekehrter Schlüsselreihenfolge nach; Listen bleiben, wie sie sind. */
function reverseKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reverseKeys);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(
    Object.keys(value)
      .reverse()
      .map((key) => [key, reverseKeys((value as Record<string, unknown>)[key])]),
  );
}

/** So schrieb der Baukasten seine Links bis LFH-577 (`encodeSpec` in `builder-state.ts`). */
function legacyBuilderParam(spec: SymbolSpec): string {
  const bytes = new TextEncoder().encode(JSON.stringify(spec));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

describe('kanonische Serialisierung über den Rezeptbestand', () => {
  it('deckt alle 279 Rezepte ab, jedes mit eigener Serialisierung', () => {
    // 242 bis LFH-786, dazu die 37 Anhang-C-Fixtures; ihre Fassungskennungen (`bodyMarkRenditions`)
    // laufen durch dieselbe Rundreise.
    expect(recipeEntries).toHaveLength(279);
    expect(new Set(recipeEntries.map(([, recipe]) => serializeSpec(recipe.spec))).size).toBe(279);
  });

  it.each(recipeEntries)('%s: JSON-Rundreise liest dieselbe Spec und zeichnet byte-gleich', (_id, recipe) => {
    const text = serializeSpec(recipe.spec);
    const decoded = parseSpec(text);
    expect(decoded).toEqual(recipe.spec);
    expect(serializeSpec(decoded)).toBe(text);
    expect(svg(decoded, recipe.title)).toBe(svg(recipe.spec, recipe.title));
  });

  it.each(recipeEntries)('%s: URL-Rundreise zeichnet byte-gleich, auch aus alten Baukasten-Links', (_id, recipe) => {
    const expected = svg(recipe.spec, recipe.title);
    expect(svg(decodeSpecParam(encodeSpecParam(recipe.spec)), recipe.title)).toBe(expected);
    expect(svg(decodeSpecParam(legacyBuilderParam(recipe.spec)), recipe.title)).toBe(expected);
  });

  it.each(recipeEntries)('%s: die Schlüsselreihenfolge ändert die Serialisierung nicht', (_id, recipe) => {
    expect(serializeSpec(reverseKeys(recipe.spec) as SymbolSpec)).toBe(serializeSpec(recipe.spec));
  });
});

describe('Reihenfolge der Körpermarken', () => {
  /*
   * Befund aus LFH-577, Schritt 0: `compose` zeichnet die Körpermarken in Listenreihenfolge und
   * beschreibt sie in dieser Reihenfolge im `<desc>`. Die kanonische Form darf `bodyMarks` deshalb
   * nicht sortieren (anders als `specKey`). Wird `compose` eines Tages reihenfolgefrei, schlägt
   * dieser Test fehl — dann darf die Serialisierung neu entscheiden, muss es aber nicht.
   */
  const multiMark = recipeEntries.filter(([, recipe]) => (recipe.spec.bodyMarks?.length ?? 0) >= 2);

  it('betrifft 29 Rezepte mit mindestens zwei Körpermarken', () => {
    // 28 bis LFH-786; dazu C.2.31 (Löschdrohne: Brandbekämpfung und Drohnenwinkel).
    expect(multiMark.map(([id]) => id)).toHaveLength(29);
  });

  it.each(multiMark)('%s: umgekehrte Reihenfolge zeichnet anders und serialisiert anders', (_id, recipe) => {
    const reversed: SymbolSpec = { ...recipe.spec, bodyMarks: [...recipe.spec.bodyMarks!].reverse() };
    expect(svg(reversed, recipe.title)).not.toBe(svg(recipe.spec, recipe.title));
    expect(serializeSpec(reversed)).not.toBe(serializeSpec(recipe.spec));
    expect(parseSpec(serializeSpec(reversed)).bodyMarks).toEqual(reversed.bodyMarks);
  });
});
