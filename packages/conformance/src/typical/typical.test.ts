import { describe, expect, it } from 'vitest';
import { renderSvg } from '@einsatzzeichen/core';
import { checkSpec, specKey } from '@einsatzzeichen/core/exact';
import { RECIPES } from '../recipes.js';
import { TYPICAL_BETREUUNG } from './betreuung.js';
import { TYPICAL_FACHDIENSTE } from './fachdienste.js';
import { TYPICAL_FEUERWEHR } from './feuerwehr.js';
import { TYPICAL_FUEHRUNG } from './fuehrung.js';
import { TYPICAL_SYMBOLS } from './index.js';
import { TYPICAL_RETTUNGSDIENST } from './rettungsdienst.js';
import { TYPICAL_SANITAET } from './sanitaet.js';
import { TYPICAL_THW } from './thw.js';
import { TYPICAL_GROUP_IDS, type TypicalGroupId, type TypicalSymbol } from './types.js';
import { TYPICAL_VERSORGUNG } from './versorgung.js';

const GROUPS: Record<TypicalGroupId, Readonly<Record<string, TypicalSymbol>>> = {
  sanitaet: TYPICAL_SANITAET,
  rettungsdienst: TYPICAL_RETTUNGSDIENST,
  betreuung: TYPICAL_BETREUUNG,
  versorgung: TYPICAL_VERSORGUNG,
  fuehrung: TYPICAL_FUEHRUNG,
  fachdienste: TYPICAL_FACHDIENSTE,
  feuerwehr: TYPICAL_FEUERWEHR,
  thw: TYPICAL_THW,
};

const KEY = /^[a-z]+\.[a-z0-9]+(?:-[a-z0-9]+)*$/;
const recipeKeys = new Map(Object.entries(RECIPES).map(([key, recipe]) => [specKey(recipe.spec), key]));
const recipeTitles = new Set(Object.values(RECIPES).map((recipe) => recipe.title.toLocaleLowerCase('de-DE')));

describe('typische Einsatzmittel (ESZ-147)', () => {
  it('führt jedes Sachgebiet und nichts außerhalb davon', () => {
    expect(Object.keys(GROUPS).sort()).toEqual([...TYPICAL_GROUP_IDS].sort());
    const total = Object.values(GROUPS).reduce((sum, group) => sum + Object.keys(group).length, 0);
    expect(Object.keys(TYPICAL_SYMBOLS)).toHaveLength(total);
  });

  it('trägt keinen Titel doppelt, auch nicht gegen die Rezepte', () => {
    const seen = new Map<string, string>();
    for (const [key, entry] of Object.entries(TYPICAL_SYMBOLS)) {
      const title = entry.title.toLocaleLowerCase('de-DE');
      expect(seen.get(title), `${key}: Titel „${entry.title}“ doppelt`).toBeUndefined();
      expect(recipeTitles.has(title), `${key}: Titel „${entry.title}“ steht schon in RECIPES`).toBe(false);
      seen.set(title, key);
    }
  });

  it('zeichnet kein Zeichen doppelt, auch nicht gegen die Rezepte', () => {
    const seen = new Map<string, string>();
    for (const [key, entry] of Object.entries(TYPICAL_SYMBOLS)) {
      const id = specKey(entry.spec);
      expect(recipeKeys.get(id), `${key}: dieselbe Spec wie das Rezept`).toBeUndefined();
      expect(seen.get(id), `${key}: dieselbe Spec wie`).toBeUndefined();
      seen.set(id, key);
    }
  });

  for (const groupId of TYPICAL_GROUP_IDS) {
    describe(groupId, () => {
      const entries = Object.entries(GROUPS[groupId]);

      it('führt Einträge', () => {
        expect(entries.length).toBeGreaterThan(0);
      });

      it.each(entries)('%s: Schlüssel, Sachgebiet und Muster', (key, entry) => {
        expect(key).toMatch(KEY);
        expect(key.startsWith(`${groupId}.`)).toBe(true);
        expect(entry.group).toBe(groupId);
        expect(entry.title.trim()).toBe(entry.title);
        expect(entry.title.length).toBeGreaterThan(0);
        expect(entry.context.trim().length).toBeGreaterThan(0);
        expect(entry.pattern.length).toBeGreaterThan(0);
        for (const pattern of entry.pattern) {
          expect(Object.hasOwn(RECIPES, pattern), `${key}: Muster ${pattern} fehlt in RECIPES`).toBe(true);
        }
      });

      it.each(entries)('%s: gültig und zeichnet', (key, entry) => {
        // checkSpec statt nacktem validateSpec: ohne den Kontext aus `compose()` lehnt validateSpec
        // jede Funktionsfassung ab, auch `leader` (siehe core/src/vocabulary.ts).
        const check = checkSpec(entry.spec, { title: entry.title });
        expect(check, key).toMatchObject({ ok: true });
        if (!check.ok) return;
        const svg = renderSvg(check.drawing, { size: 64 });
        expect(svg.startsWith('<svg')).toBe(true);
      });
    });
  }
});
