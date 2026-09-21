import type { SymbolSpec } from '@einsatzzeichen/schema';

/**
 * Felder von `SymbolSpec`, deren Array-Reihenfolge **keine** Bedeutung für die Identität hat.
 *
 * Belegt am Code, nicht angenommen (Stand LFH-568, 21.09.2026):
 *
 * - `bodyMarks`: `validateSpec` liest die Liste nur als Menge (`some`, Länge, „genau eine Marke");
 *   die Kombinationsfassungen in `core/src/geometry/body-marks.ts` (`combinationBuild`) wählen über
 *   `candidate.marks.every((mark) => marks.includes(mark))` bei gleicher Länge — ebenfalls
 *   reihenfolgefrei.
 * - `capabilities`: `validateSpec` prüft nur, ob das Feld gesetzt ist; `compose` hängt die
 *   Piktogramme je Fähigkeit aneinander.
 *
 * **Was die Reihenfolge trotzdem ändert:** `compose` legt die Primitive in Listenreihenfolge ab,
 * zwei Specs mit gleichem Schlüssel können also Zeichnungen mit anderer Kindreihenfolge (und damit
 * anderer Übermalung) ergeben. Die Körperhülle — das Einzige, was `matchFingerprint` heute
 * vergleicht — hängt davon nicht ab. Wer den Schlüssel später für mehr als die Körperhülle nutzt,
 * muss diese Entscheidung neu prüfen.
 *
 * Doppelte Einträge bleiben erhalten (sortierte Multimenge, keine Menge): ob `['a', 'a']` dasselbe
 * Zeichen ist wie `['a']`, entscheidet kein Code des Motors ausdrücklich, und ein Schlüssel darf
 * zwei Specs nicht gleichsetzen, die der Motor womöglich verschieden zeichnet.
 */
const UNORDERED_ARRAY_FIELDS: ReadonlySet<string> = new Set(['bodyMarks', 'capabilities']);

function canonical(value: unknown, unorderedArray: boolean, topLevel: boolean): unknown {
  if (Array.isArray(value)) {
    const items = value.map((item) => canonical(item, false, false));
    if (!unorderedArray) return items;
    return items
      .map((item) => JSON.stringify(item))
      .sort()
      .map((text) => JSON.parse(text) as unknown);
  }
  if (typeof value === 'object' && value !== null) {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      const field = (value as Record<string, unknown>)[key];
      // Ein Feld mit `undefined` ist ein fehlendes Feld — so liest es auch `validateSpec`.
      if (field === undefined) continue;
      // Nur die Spec-Felder selbst sind Mengen, nicht gleichnamige Felder tiefer im Baum.
      result[key] = canonical(field, topLevel && UNORDERED_ARRAY_FIELDS.has(key), false);
    }
    return result;
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    // JSON.stringify machte aus NaN und ±Infinity stillschweigend `null` und setzte sie gleich.
    throw new Error(`specKey: nicht endliche Zahl ${String(value)} ist kein Spec-Wert.`);
  }
  return value;
}

/**
 * Kanonische, deterministische Identität einer `SymbolSpec` als Zeichenkette.
 *
 * - unabhängig von der Schlüsselreihenfolge, auch in verschachtelten Objekten (`labels`,
 *   `…Metrics`);
 * - unabhängig von der Reihenfolge in `bodyMarks` und `capabilities` (Begründung an
 *   `UNORDERED_ARRAY_FIELDS`);
 * - ein Feld mit Wert `undefined` zählt wie ein fehlendes Feld;
 * - gelesen werden nur **eigene, aufzählbare** Felder (`Object.keys`), geerbte Eigenschaften nie.
 *
 * Feiner als `reachSignature` (catalog/rule-coverage.ts), das nur die fünf Kernachsen der Stufe 1
 * trägt: hier geht jedes Feld der Spec ein, Beschriftung und Messwerte eingeschlossen. Rein und
 * ohne Abhängigkeit — nur der Typ kommt aus `schema`.
 */
export function specKey(spec: SymbolSpec): string {
  return JSON.stringify(canonical(spec, false, true));
}
