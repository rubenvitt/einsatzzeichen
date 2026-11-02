import { TYPICAL_BETREUUNG } from './betreuung.js';
import { TYPICAL_FACHDIENSTE } from './fachdienste.js';
import { TYPICAL_FEUERWEHR } from './feuerwehr.js';
import { TYPICAL_FUEHRUNG } from './fuehrung.js';
import { TYPICAL_RETTUNGSDIENST } from './rettungsdienst.js';
import { TYPICAL_SANITAET } from './sanitaet.js';
import { TYPICAL_THW } from './thw.js';
import type { TypicalSymbol } from './types.js';
import { TYPICAL_VERSORGUNG } from './versorgung.js';

export * from './types.js';

/**
 * Typische Einsatzmittel ohne Beispiel in der Baseline (ESZ-147): gängige Fahrzeuge, Einheiten und
 * Personen, vor allem des Katastrophenschutzes der Hilfsorganisationen, zusammengesetzt aus den
 * Bausteinen der Systematik. Getrennt von `RECIPES`, weil kein Eintrag eine Referenzdatei hat;
 * Entscheidung in `docs/decisions/2026-11-02-esz-147-typische-einsatzmittel.md`.
 */
export const TYPICAL_SYMBOLS: Readonly<Record<string, TypicalSymbol>> = Object.freeze({
  ...TYPICAL_SANITAET,
  ...TYPICAL_RETTUNGSDIENST,
  ...TYPICAL_BETREUUNG,
  ...TYPICAL_VERSORGUNG,
  ...TYPICAL_FUEHRUNG,
  ...TYPICAL_FACHDIENSTE,
  ...TYPICAL_FEUERWEHR,
  ...TYPICAL_THW,
});
