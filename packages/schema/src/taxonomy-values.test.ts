import { describe, expect, it } from 'vitest';
import {
  ADMIN_LEVEL_IDS,
  BODY_VARIANT_IDS,
  ORGANIZATION_IDS,
  STRENGTH_IDS,
  SYMBOL_KINDS,
  VEHICLE_CATEGORY_IDS,
} from './taxonomy-values.js';

describe('Wertelisten der SymbolSpec-Achsen', () => {
  // Die Vollständigkeit gegenüber der Union erzwingt der Typ (`Record<X, true>`); hier stehen
  // nur die Zahlen, damit eine Erweiterung der Union sichtbar auch die Regelabdeckung ändert.
  it('trägt die Zahlen der Achsen aus taxonomy.ts', () => {
    expect(SYMBOL_KINDS).toHaveLength(19);
    expect(BODY_VARIANT_IDS).toHaveLength(10);
    expect(ORGANIZATION_IDS).toHaveLength(9);
    expect(STRENGTH_IDS).toHaveLength(4);
    expect(ADMIN_LEVEL_IDS).toHaveLength(6);
    expect(VEHICLE_CATEGORY_IDS).toHaveLength(8);
  });

  it('ist eingefroren', () => {
    expect(Object.isFrozen(SYMBOL_KINDS)).toBe(true);
    expect(Object.isFrozen(VEHICLE_CATEGORY_IDS)).toBe(true);
  });
});
