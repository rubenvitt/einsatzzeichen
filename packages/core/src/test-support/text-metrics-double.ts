import type { TextMetrics } from '../text-metrics.js';

/**
 * Metrikdoppel für Tests in `core`: jede Glyphe läuft gleich weit, optional mit Ausnahmen je
 * Zeichen. `core` kennt keine Schrift (siehe `text-metrics.ts`), also braucht jeder Test, der
 * `compose()` oder `checkTextMetrics()` aufruft, eine Laufweitenquelle — und die soll
 * **rechenbar** sein („zwölf Zeichen mal 0,25 em mal 4 mm = 12 mm"), nicht Arimo nachahmen.
 *
 * **Warum 0,25 em als Vorgabe und nicht ein Arimo-nahes Mittel (≈ 0,55 em):** die
 * `compose.test.ts`-Fälle prüfen Zonen- und Boxgeometrie und setzen dafür Inhalte, die in
 * der echten Schrift **nicht** in ihre Box passen würden (`center: 'Strömungsrettung'` bei
 * 7,08 mm in einer 29-mm-Box braucht in Arimo rund 56 mm). Diese Fälle sollen weiter die
 * Geometrie belegen, nicht am Breiten-Gate scheitern; die Breitenprüfung selbst hat ihre eigenen
 * Fälle, die das Doppel mit einem passenden `em` **absichtlich** über die Box treiben. Bei
 * 0,25 em passt der breiteste Bestandsfall (16 Zeichen × 0,25 × 7,08 mm = 28,3 mm in 29 mm)
 * gerade noch — der Wert ist damit aus dem Bestand hergeleitet, nicht geraten.
 *
 * `unknown` nennt Codepoints, die das Doppel **nicht** kennt (Tofu-Fall); alles andere gilt als
 * bekannt. Die Tinte füllt den Vorschub vollständig (`[0, advance]`, keine Seitenbreiten) — außer
 * beim Leerzeichen, das wie in jeder Schrift keine Kontur hat; `bearings` setzt für einzelne
 * Zeichen ein Paar aus linker und rechter Seitenbreite in em. Vertikal reicht jede Glyphe von
 * `vertical[0]` (unter der Grundlinie, negativ) bis `vertical[1]` (darüber) — die Vorgabe liegt
 * innerhalb der gemessenen Arimo-Anteile (`ALPHABETIC_ASCENT_FRACTION` 0,86 /
 * `ALPHABETIC_DESCENT_FRACTION` 0,212), damit `labelPrimitive`-Boxen im Bestand passen.
 */
export function uniformTextMetrics(
  em = 0.25,
  overrides: Readonly<Record<string, number>> = {},
  unknown: readonly string[] = [],
  bearings: Readonly<Record<string, readonly [number, number]>> = {},
  vertical: readonly [number, number] = [-0.2, 0.75],
): TextMetrics {
  const overrideByCodepoint = new Map<number, number>();
  for (const [character, width] of Object.entries(overrides)) {
    const codepoint = character.codePointAt(0);
    if (codepoint === undefined || [...character].length !== 1) {
      throw new Error(`uniformTextMetrics: "${character}" ist kein einzelnes Zeichen.`);
    }
    overrideByCodepoint.set(codepoint, width);
  }
  const bearingByCodepoint = new Map<number, readonly [number, number]>();
  for (const [character, pair] of Object.entries(bearings)) {
    bearingByCodepoint.set(character.codePointAt(0) ?? -1, pair);
  }
  const unknownCodepoints = new Set(unknown.map((character) => character.codePointAt(0)));
  const advanceEm = (codepoint: number): number | undefined =>
    unknownCodepoints.has(codepoint) ? undefined : (overrideByCodepoint.get(codepoint) ?? em);
  return {
    advanceEm,
    inkExtentEm: (codepoint) => {
      const advance = advanceEm(codepoint);
      if (advance === undefined) return undefined;
      if (codepoint === 0x20) return [0, 0, 0, 0];
      const [left, right] = bearingByCodepoint.get(codepoint) ?? [0, 0];
      return [left, vertical[0], advance - right, vertical[1]];
    },
  };
}
