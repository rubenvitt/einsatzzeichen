/**
 * `drawSymbol` aus `core` gegen die Referenzsnapshots (LFH-580).
 *
 * Der Einstieg von der Spec zur Zeichnung liegt seit LFH-580 in `core`; `composeFromCatalog` ist
 * nur noch eine Hülle darum. Ein Vergleich beider wäre deshalb zirkulär: er bliebe grün, auch wenn
 * die Standardbelegung einen Port falsch verdrahtet. Geprüft wird stattdessen gegen die
 * eingecheckten Snapshots unter `__snapshots__/` — sie sind mit der Handverdrahtung entstanden, die
 * `recipes.ts` bis LFH-580 führte, und so gerendert wie in `snapshots.test.ts` (64 px, Rezepttitel).
 * Der Test liegt im Prüfpaket, weil `core` `conformance` nicht importieren darf.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { drawSymbol, renderSvg } from '@einsatzzeichen/core';
import { RECIPES, composeFromCatalog } from './recipes.js';

/**
 * Je ein Fixture für die Achsen, die ein Port bedient: Innenfeld, Organisationsfarbe, Stärke und
 * Textlaufweiten (E.1.1), Fahrwerk und Körpermarke am Fahrzeug (N.1.1), Funktionsfassung mit
 * Verwaltungsstufe (D.3.1), Funktionsfassung ohne sie (D.1.2), technische Kopfmarke (I.1.4).
 * Den Piktogramm-Port über `capabilities` nutzt keine Fixture; die Vollprüfung unten deckt den
 * übrigen Bestand ab.
 */
const FIXTURES = ['E.1.1', 'N.1.1', 'D.3.1', 'D.1.2', 'I.1.4'] as const;

const SNAPSHOTS = fileURLToPath(new URL('./__snapshots__/', import.meta.url));

/** Über den Pfad und nicht als URL: Variantenschlüssel wie `I.1.9#alternative` enthielten sonst ein Fragment. */
function snapshot(section: string): string {
  return readFileSync(join(SNAPSHOTS, `${section}.svg`), 'utf8');
}

describe('drawSymbol aus core', () => {
  it.each(FIXTURES)('zeichnet %s byteweise wie der Referenzsnapshot', (section) => {
    const recipe = RECIPES[section];
    const svg = renderSvg(drawSymbol(recipe.spec, { title: recipe.title }), { size: 64 });
    expect(svg).toBe(snapshot(section));
  });

  it('zeichnet jede Fixture des Bestands wie ihr Referenzsnapshot', () => {
    const differing = Object.entries(RECIPES)
      .filter(([section, recipe]) =>
        renderSvg(drawSymbol(recipe.spec, { title: recipe.title }), { size: 64 }) !== snapshot(section))
      .map(([section]) => section);
    expect(differing).toEqual([]);
  });

  it('composeFromCatalog bleibt als Hülle erhalten und liefert dieselbe Zeichnung', () => {
    const recipe = RECIPES['E.1.1'];
    expect(composeFromCatalog(recipe.spec, recipe.title)).toEqual(
      drawSymbol(recipe.spec, { title: recipe.title }),
    );
    expect(composeFromCatalog(recipe.spec)).toEqual(drawSymbol(recipe.spec));
  });
});
