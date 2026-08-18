import { describe, expect, it } from 'vitest';
import { mmToUnits } from '@einsatzzeichen/schema';
import { boundsOfMm } from '@einsatzzeichen/core';
import { BASE_SYMBOLS } from '@einsatzzeichen/catalog';
import type { Primitive } from '@einsatzzeichen/schema';
import { deriveRing, parsePathBounds, parseRectilinearPath } from './path-geometry.js';

/**
 * Konstruierte Testeingabe für „1.1 Taktische Formation" — enthält keine Bytes aus der
 * Referenzdatei. Die Sollgeometrie ist die Mittellinie x=1, y=6, w=30, h=20 mm bei
 * 0,5 mm Strichstärke; der Außenring liegt eine halbe Strichstärke außerhalb der
 * Mittellinie, der Innenring eine halbe innerhalb. Die Millimeterwerte werden über
 * `mmToUnits` in SVG-Einheiten umgerechnet und die `d`-Zeichenkette daraus zusammengebaut.
 * Die Kommandomischung entspricht der Referenz (zwei Teilpfade, absolutes M, absolute
 * H/V, relative h/v, jeweils mit Z geschlossen), damit der Tokenizer vollständig geprüft wird.
 */
const STROKE_WIDTH_MM = 0.5;
const HALF_STROKE_MM = STROKE_WIDTH_MM / 2;
const MIDLINE_MM = { minX: 1, minY: 6, maxX: 1 + 30, maxY: 6 + 20 };
const OUTER_MM = {
  minX: MIDLINE_MM.minX - HALF_STROKE_MM,
  minY: MIDLINE_MM.minY - HALF_STROKE_MM,
  maxX: MIDLINE_MM.maxX + HALF_STROKE_MM,
  maxY: MIDLINE_MM.maxY + HALF_STROKE_MM,
};
const INNER_MM = {
  minX: MIDLINE_MM.minX + HALF_STROKE_MM,
  minY: MIDLINE_MM.minY + HALF_STROKE_MM,
  maxX: MIDLINE_MM.maxX - HALF_STROKE_MM,
  maxY: MIDLINE_MM.maxY - HALF_STROKE_MM,
};

const outer = {
  minX: mmToUnits(OUTER_MM.minX),
  minY: mmToUnits(OUTER_MM.minY),
  maxX: mmToUnits(OUTER_MM.maxX),
  maxY: mmToUnits(OUTER_MM.maxY),
};
const inner = {
  minX: mmToUnits(INNER_MM.minX),
  minY: mmToUnits(INNER_MM.minY),
  maxX: mmToUnits(INNER_MM.maxX),
  maxY: mmToUnits(INNER_MM.maxY),
};
const outerWidth = mmToUnits(OUTER_MM.maxX - OUTER_MM.minX);
const outerHeight = mmToUnits(OUTER_MM.maxY - OUTER_MM.minY);
const innerWidth = mmToUnits(INNER_MM.maxX - INNER_MM.minX);
const innerHeight = mmToUnits(INNER_MM.maxY - INNER_MM.minY);

// Zwei Teilpfade, absolutes M, absolute H/V, relative h/v, jeweils mit Z geschlossen —
// wie im Doppelrahmen der Referenz.
const FORMATION =
  `M${outer.maxX},${outer.maxY}H${outer.minX}V${outer.minY}h${outerWidth}v${outerHeight}Z` +
  `M${inner.minX},${inner.maxY}h${innerWidth}V${inner.minY}H${inner.minX}v${innerHeight}Z`;

/**
 * Dreieckspaar (Rechtwinkel-Dreiecke, zwei Katheten achsparallel, die Hypotenuse ist
 * jeweils exakt das Schlusssegment von `Z`). Das prüft gezielt, dass das implizite
 * Segment von `Z` zum Startpunkt mitbewertet wird — sonst rutscht genau diese Form durch,
 * weil ihre einzige schräge Kante nicht als explizites Kommando auftaucht.
 *
 * Außen (mm): A=(0,0) → B=(20,0) [H] → C=(20,15) [V] → Z schließt C→A schräg.
 * Innen (mm): D=(5,5) → E=(15,5) [H] → F=(15,10) [V] → Z schließt F→D schräg, liegt
 * vollständig innerhalb der Außenhülle (0..20 / 0..15 mm).
 */
const TRIANGLE_OUTER_MM = { ax: 0, ay: 0, bx: 20, cy: 15 };
const TRIANGLE_INNER_MM = { ax: 5, ay: 5, bx: 15, cy: 10 };

function triangleD(mm: { ax: number; ay: number; bx: number; cy: number }): string {
  const ax = mmToUnits(mm.ax);
  const ay = mmToUnits(mm.ay);
  const bx = mmToUnits(mm.bx);
  const cy = mmToUnits(mm.cy);
  return `M${ax},${ay}H${bx}V${cy}Z`;
}

const TRIANGLES = triangleD(TRIANGLE_OUTER_MM) + triangleD(TRIANGLE_INNER_MM);

/**
 * Treppen-/L-Form als Außenteilpfad, einfaches Rechteck als Innenteilpfad. Alle
 * Segmente der L-Form sind achsparallel (nur H/V/Z) — die Form scheitert also nicht an
 * der Achsparallelität einzelner Segmente, sondern daran, dass die besuchten Punkte
 * mehr sind als die vier Hüllenecken und eine Hüllenecke (20,20) nie besucht wird.
 *
 * Außen (mm), im Uhrzeigersinn: (0,0) → (0,20) [V] → (8,20) [H] → (8,8) [V] →
 * (20,8) [H] → (20,0) [V] → Z schließt (20,0)→(0,0) [horizontal]. Hülle: 0..20 / 0..20 mm,
 * Ecken (0,0) (0,20) (20,20) (20,0) — (20,20) wird nie besucht, sechs Punkte statt vier.
 * Innen (mm): einfaches Rechteck 2..6 / 2..6 mm, vollständig innerhalb der Außenhülle.
 */
const STAIRCASE_OUTER_MM = { minX: 0, minY: 0, stepX: 8, stepY: 8, maxX: 20, maxY: 20 };
const STAIRCASE_INNER_MM = { minX: 2, minY: 2, maxX: 6, maxY: 6 };

function staircaseD(mm: typeof STAIRCASE_OUTER_MM): string {
  const minX = mmToUnits(mm.minX);
  const minY = mmToUnits(mm.minY);
  const stepX = mmToUnits(mm.stepX);
  const stepY = mmToUnits(mm.stepY);
  const maxX = mmToUnits(mm.maxX);
  const maxY = mmToUnits(mm.maxY);
  return `M${minX},${minY}V${maxY}H${stepX}V${stepY}H${maxX}V${minY}Z`;
}

function rectD(mm: { minX: number; minY: number; maxX: number; maxY: number }): string {
  const minX = mmToUnits(mm.minX);
  const minY = mmToUnits(mm.minY);
  const maxX = mmToUnits(mm.maxX);
  const maxY = mmToUnits(mm.maxY);
  return `M${minX},${minY}H${maxX}V${maxY}H${minX}Z`;
}

const STAIRCASE_PAIR = staircaseD(STAIRCASE_OUTER_MM) + rectD(STAIRCASE_INNER_MM);

/**
 * Um 45° gedrehtes Quadratpaar, als zwei ineinanderliegende Rauten gezeichnet — genau
 * die Form, die ein Ringpfad für ein gedrehtes Quadrat (1.2 Person) annimmt. Jede Kante
 * verändert x und y gleichzeitig, ist also nie achsparallel; die Form scheitert damit
 * schon an der Segmentprüfung, nicht erst an der Punktmenge.
 *
 * Außen (mm), Zentrum (15,15), Halbdiagonale 15: (15,0) → (30,15) → (15,30) → (0,15) → Z.
 * Innen (mm), Zentrum (15,15), Halbdiagonale 10: (15,5) → (25,15) → (15,25) → (5,15) → Z,
 * liegt innerhalb der Außenhülle (0..30 / 0..30 mm).
 */
function diamondD(mm: { cx: number; cy: number; r: number }): string {
  const top = { x: mmToUnits(mm.cx), y: mmToUnits(mm.cy - mm.r) };
  const right = { x: mmToUnits(mm.cx + mm.r), y: mmToUnits(mm.cy) };
  const bottom = { x: mmToUnits(mm.cx), y: mmToUnits(mm.cy + mm.r) };
  const left = { x: mmToUnits(mm.cx - mm.r), y: mmToUnits(mm.cy) };
  return `M${top.x},${top.y}L${right.x},${right.y}L${bottom.x},${bottom.y}L${left.x},${left.y}Z`;
}

const DIAMONDS = diamondD({ cx: 15, cy: 15, r: 15 }) + diamondD({ cx: 15, cy: 15, r: 10 });

describe('parseRectilinearPath', () => {
  it('zerlegt einen Doppelrahmen in zwei Teilpfade', () => {
    const subpaths = parseRectilinearPath(FORMATION);
    expect(subpaths).toHaveLength(2);
    expect(subpaths?.[0]).toEqual({
      minX: 2.126,
      minY: 16.299,
      maxX: 88.583,
      maxY: 74.409,
      isAxisAlignedRect: true,
    });
    expect(subpaths?.[1]).toEqual({
      minX: 3.543,
      minY: 17.717,
      maxX: 87.165,
      maxY: 72.992,
      isAxisAlignedRect: true,
    });
  });

  it('verarbeitet relative Kommandos', () => {
    const subpaths = parseRectilinearPath('M10,10h20v10h-20Z');
    expect(subpaths?.[0]).toEqual({ minX: 10, minY: 10, maxX: 30, maxY: 20, isAxisAlignedRect: true });
  });

  it('gibt null zurück, sobald Kurven vorkommen', () => {
    expect(parseRectilinearPath('M10,10c1,1 2,2 3,3Z')).toBeNull();
    expect(parseRectilinearPath('M10,10A5,5 0 0 1 20,20Z')).toBeNull();
  });

  it('erkennt ein Dreieck nicht als achsparalleles Rechteck (Schrägkante im Z-Schluss)', () => {
    const subpaths = parseRectilinearPath(TRIANGLES);
    expect(subpaths?.[0]?.isAxisAlignedRect).toBe(false);
    expect(subpaths?.[1]?.isAxisAlignedRect).toBe(false);
  });

  it('erkennt eine Treppen-/L-Form nicht als Rechteck, obwohl alle Segmente achsparallel sind', () => {
    const subpaths = parseRectilinearPath(STAIRCASE_PAIR);
    expect(subpaths?.[0]?.isAxisAlignedRect).toBe(false);
    // Der Innenteilpfad ist ein echtes Rechteck und bleibt davon unberührt.
    expect(subpaths?.[1]?.isAxisAlignedRect).toBe(true);
  });

  it('erkennt ein um 45° gedrehtes Quadrat nicht als achsparalleles Rechteck', () => {
    const subpaths = parseRectilinearPath(DIAMONDS);
    expect(subpaths?.[0]?.isAxisAlignedRect).toBe(false);
    expect(subpaths?.[1]?.isAxisAlignedRect).toBe(false);
  });

  it('gibt null zurück, statt NaN aus einem abgeschnittenen Pfad in die Hülle zu übernehmen', () => {
    // "M 5" bricht nach der x-Koordinate ab: next() liest über das Tokenende hinaus,
    // Number(undefined) ist NaN. Ohne Wache würde Math.abs(NaN) > TOLERANCE_UNITS
    // stillschweigend false sein — die kaputte Hülle bestünde jeden Vergleich.
    expect(parseRectilinearPath('M 5')).toBeNull();
    expect(parseRectilinearPath('M10,10L20')).toBeNull();
  });
});

describe('deriveRing', () => {
  it('rechnet Mittellinie und Strichstärke aus einem Ringpaar zurück', () => {
    const ring = deriveRing(parseRectilinearPath(FORMATION) ?? []);
    expect(ring?.x).toBeCloseTo(2.8345, 4);
    expect(ring?.y).toBeCloseTo(17.008, 4);
    expect(ring?.width).toBeCloseTo(85.0395, 4);
    expect(ring?.height).toBeCloseTo(56.6925, 4);
    expect(ring?.strokeWidth).toBeCloseTo(1.4175, 4);
  });

  it('gibt null zurück, wenn kein Ringpaar vorliegt', () => {
    expect(
      deriveRing([{ minX: 0, minY: 0, maxX: 10, maxY: 10, isAxisAlignedRect: true }]),
    ).toBeNull();
  });

  it('gibt null zurück, wenn der zweite Teilpfad nicht im ersten liegt', () => {
    expect(
      deriveRing([
        { minX: 0, minY: 0, maxX: 10, maxY: 10, isAxisAlignedRect: true },
        { minX: 20, minY: 20, maxX: 30, maxY: 30, isAxisAlignedRect: true },
      ]),
    ).toBeNull();
  });

  it('gibt null zurück für ein Dreieckspaar', () => {
    expect(deriveRing(parseRectilinearPath(TRIANGLES) ?? [])).toBeNull();
  });

  it('gibt null zurück für ein Paar mit einer Treppen-/L-Form', () => {
    expect(deriveRing(parseRectilinearPath(STAIRCASE_PAIR) ?? [])).toBeNull();
  });

  it('gibt null zurück für ein um 45° gedrehtes Quadratpaar', () => {
    expect(deriveRing(parseRectilinearPath(DIAMONDS) ?? [])).toBeNull();
  });
});

/**
 * `parsePathBounds` — die Hülle eines Pfads **mit** Kurven. Sie ist die Voraussetzung dafür, dass
 * der Kennwertextraktor die Körperfläche der Ebene `Flächige_Fülung` überhaupt sehen kann; bis
 * zum Teilslice E.2 legte er für einen Kurvenpfad nichts ab.
 *
 * Auch hier stammt keine Zahl als Byte aus einer Referenzdatei: die Pfade unten sind die
 * **Katalogkörper** aus `base-symbols.ts` — dieselben `d`-Strings, die `boundsOfMm` in `core`
 * vermisst. Das macht die Prüfung schärfer als eine konstruierte Eingabe: sie stellt zwei
 * unabhängig geschriebene Implementierungen desselben Problems gegeneinander.
 */
describe('parsePathBounds', () => {
  /**
   * Die vier Kurvenkörper des Katalogs, als reine `d`-Strings. Sie sind hier **wörtlich
   * eingetragen und nicht aus `@einsatzzeichen/catalog` importiert**: `cli` hängt zwar von
   * `catalog` ab, aber ein Import machte den Test gegen eine spätere Änderung an `base-symbols.ts`
   * blind — er prüfte dann nur noch, dass zwei Implementierungen dasselbe rechnen, ohne dass
   * jemand merkt, wenn sich die Eingabe verschiebt.
   */
  const CURVED_BODIES: ReadonlyArray<readonly [string, string]> = [
    ['1.3 Landfahrzeug', 'M 16 8 C 10 8, 5 7.089, 1 5.75 L 1 26 L 31 26 L 31 5.75 C 27 7.089, 22 8, 16 8 Z'],
    ['1.4 Luftfahrzeug', 'M 31 23 L 1 23 C 1 14.7157, 7.7157 8, 16 8 C 24.2843 8, 31 14.7157, 31 23 Z'],
    ['1.5 Wasserfahrzeug', 'M 1 9 L 31 9 C 31 17.2843, 24.2843 24, 16 24 C 7.7157 24, 1 17.2843, 1 9 Z'],
    [
      '1.14 Spontanhelfer',
      'M 8.5644 8.5644 C 9.0329 4.8143, 12.2207 2, 16 2 C 19.7793 2, 22.9671 4.8143, ' +
        '23.4356 8.5644 C 27.1857 9.0329, 30 12.2207, 30 16 C 30 19.7793, 27.1857 22.9671, ' +
        '23.4356 23.4356 C 22.9671 27.1857, 19.7793 30, 16 30 C 12.2207 30, 9.0329 27.1857, ' +
        '8.5644 23.4356 C 4.8143 22.9671, 2 19.7793, 2 16 C 2 12.2207, 4.8143 9.0329, ' +
        '8.5644 8.5644 Z',
    ],
  ];

  it.each(CURVED_BODIES)('rechnet für %s dieselbe Hülle wie boundsOfMm', (_name, d) => {
    const primitive: Primitive = { type: 'path', role: 'body', d };
    const expected = boundsOfMm(primitive);
    const actual = parsePathBounds(d);
    expect(actual).not.toBeNull();
    if (actual === null) throw new Error('unreachable');
    // **Ziffernidentisch**, nicht „nah genug": beide Rechnungen setzen die Extrema analytisch an
    // und dürfen deshalb an keiner Stelle auseinandergehen. Eine Toleranz hier verdeckte genau
    // den Fehler, für den dieser Test da ist.
    expect(actual.minX).toBe(expected.minX);
    expect(actual.minY).toBe(expected.minY);
    expect(actual.maxX).toBe(expected.maxX);
    expect(actual.maxY).toBe(expected.maxY);
  });

  it('trifft ein Kurvenextremum, das auf keinem Ankerpunkt liegt', () => {
    // Kubik von (0|0) nach (10|0) mit Kontrollpunkten (0|-9) und (10|-9). Ihr Scheitel liegt bei
    // t = 0,5 auf y = -6,75 — die Ankerpunkte allein ergäben 0. Der Wert ist von Hand gerechnet:
    // y(0,5) = 3·0,25·0,5·(-9) + 3·0,5·0,25·(-9) = -6,75.
    const bounds = parsePathBounds('M 0 0 C 0 -9, 10 -9, 10 0 Z');
    expect(bounds).not.toBeNull();
    expect(bounds?.minY).toBeCloseTo(-6.75, 12);
    expect(bounds?.maxY).toBe(0);
    expect(bounds?.minX).toBe(0);
    expect(bounds?.maxX).toBe(10);
  });

  it('spiegelt den Kontrollpunkt eines S-Segments am aktuellen Punkt', () => {
    // `S` ohne Kurvenvorgänger setzt den ersten Kontrollpunkt auf den aktuellen Punkt; mit
    // Vorgänger spiegelt es dessen zweiten. Beide Fassungen beschreiben hier dieselbe Kurve:
    // die zweite Kubik hat (20|-9) als ersten Kontrollpunkt, weil (0|-9) am Punkt (10|0) liegt.
    const explicit = parsePathBounds('M 0 0 C 0 -9, 10 -9, 10 0 C 10 9, 20 9, 20 0');
    const smooth = parsePathBounds('M 0 0 C 0 -9, 10 -9, 10 0 S 20 9, 20 0');
    expect(smooth).toEqual(explicit);
    expect(smooth?.minY).toBeCloseTo(-6.75, 12);
    expect(smooth?.maxY).toBeCloseTo(6.75, 12);
  });

  it('überführt ein quadratisches Segment verlustfrei in eine Kubik', () => {
    // Quadrat mit Kontrollpunkt (5|-8) von (0|0) nach (10|0): Scheitel bei t = 0,5 auf y = -4.
    const bounds = parsePathBounds('M 0 0 Q 5 -8, 10 0');
    expect(bounds?.minY).toBeCloseTo(-4, 12);
    expect(bounds?.maxX).toBe(10);
  });

  it('lehnt einen Bogen ab, statt ihn zu nähern', () => {
    // `A`/`a` kommen im gesamten Referenzbestand nicht vor (gezählt über alle 661 Dateien und
    // alle vier Ebenen). Eine Bogenzerlegung wäre damit unbelegter Kode; `null` erzeugt
    // stattdessen denselben lauten Ausfall wie ein unbekanntes Kommando.
    expect(parsePathBounds('M 0 0 A 5 5 0 0 1 10 0 Z')).toBeNull();
  });

  it('liefert null für einen leeren Pfad', () => {
    expect(parsePathBounds('')).toBeNull();
    expect(parsePathBounds('Z')).toBeNull();
  });

  it('rundet nicht — die Eichung gegen boundsOfMm hängt an den hinteren Stellen', () => {
    // `parseRectilinearPath` rundet auf drei Einheitenstellen, weil seine Werte Ankerkoordinaten
    // aus der Datei sind. Ein Kurvenextremum ist eine gerechnete Zahl; gerundet verlöre sie die
    // Ziffernidentität mit `boundsOfMm`, und damit den einzigen Beleg dafür, dass zwei
    // unabhängige Implementierungen dasselbe rechnen.
    const bounds = parsePathBounds('M 0 0 C 0 -9, 10 -9, 10 0 Z');
    expect(bounds?.minY).toBe(-6.75);
    expect(String(parsePathBounds('M 0 0 C 0 -1, 10 -1, 10 0 Z')?.minY)).toBe('-0.75');
  });

  it('rechnet für jeden Pfadkörper des Katalogs dieselbe Hülle wie boundsOfMm', () => {
    // Die Gegenprobe zu den vier festgeschriebenen Körpern oben, und sie wächst mit: sie zieht
    // die Pfadkörper aus `BASE_SYMBOLS` und deckt damit auch `1.9 Gebiet` ab — den schärfsten
    // Fall des Bestands mit zehn Eckrundungen, also **zwanzig** Kurvenextrema, von denen keines
    // auf einem Ankerpunkt liegt. Sein `d`-String wird aus Ecken und Radien abgeleitet (629
    // Zeichen) und ließe sich hier nicht sinnvoll wörtlich eintragen.
    const paths = Object.values(BASE_SYMBOLS)
      .flatMap((entry) => entry.depictions)
      .flatMap((depiction) => depiction.drawing.children)
      .filter((child): child is Extract<Primitive, { type: 'path' }> => child.type === 'path');
    expect(paths.length).toBeGreaterThan(0);
    for (const path of paths) {
      const expected = boundsOfMm(path);
      const actual = parsePathBounds(path.d);
      expect(actual, path.d).not.toBeNull();
      expect({ ...actual }).toEqual({ ...expected } as unknown as Record<string, number>);
    }
  });
});
