import { describe, expect, it } from 'vitest';
import { boundsOfMm, matchFingerprint, type BodyGeometryMode } from '@einsatzzeichen/core';
import { TOLERANCE_UNITS, mmToUnits } from '@einsatzzeichen/schema';
import { BASE_SYMBOLS } from './base-symbols.js';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import { fingerprintFor } from './fingerprint-index.js';

/**
 * Die neun Grundzeichen, deren Körper **am Kennwertartefakt** gegatet ist. Die dritte Spalte sagt,
 * welche Geometrie des Körpers dabei gegen den Kennwert steht.
 *
 * `1.13 Ereignis` ist der einzige `stroke-outline`-Fall des Bestands: sein Kennwert ist die Hülle
 * des zu einer Fläche umgewandelten Strichs (`kind: 'bounds'`, 3,792/6,862/28,207/25,451) und nicht
 * die Mittellinie 4/7/28/25. Die Einstellung steht hier je Zeile und wird ausdrücklich **nicht**
 * aus der Formklasse des Kennwerts abgeleitet — siehe `strokeBoundsOfMm`, das den Gegenfall
 * `1.10 Maßnahme` (Fase, 1,0 mm Strich) um 0,71 Einheiten verfehlte.
 */
const REFERENCE = [
  ['formation', '1.1_Taktische Formation.svg', 'centerline'],
  ['person', '1.2_Person.svg', 'centerline'],
  ['post', '1.6_Funktionsstelle.svg', 'centerline'],
  ['building', '1.7_Gebäude.svg', 'centerline'],
  ['container', '1.8_Behälter Ressource Raum Funkgerät.svg', 'centerline'],
  ['measure', '1.10_Maßnahme.svg', 'centerline'],
  ['hazard', '1.11_Gefahr.svg', 'centerline'],
  ['point', '1.12_Konkreter Punkt.svg', 'centerline'],
  ['event', '1.13_Ereignis.svg', 'stroke-outline'],
] as const satisfies ReadonlyArray<[keyof typeof BASE_SYMBOLS, string, BodyGeometryMode]>;

/**
 * Die fünf Kurvenkörper. Ihr Kennwertartefakt führt `shapes: []` — der Extraktor legt für einen
 * Kurvenpfad nichts ab und zählt nur `curvedPaths` hoch —, und `matchFingerprint` bricht deshalb
 * mit „Keine vergleichbare Form in den Kennzahlen zu …" ab, bevor es den Körper ansieht.
 *
 * Nicht die Quelle ist unvermessbar, sondern der Extraktor. Die Sollwerte unten stammen aus einer
 * eigenen Vermessung der Referenzdateien vom 18. August 2026 (eigener Pfadparser mit analytischen
 * Kubik-Extrema, 1 mm = 72/25,4 Einheiten). Sie stehen hier und nicht im Artefakt — genau das ist
 * der Unterschied zwischen `body-geometry-regression` und `body-fingerprint`, und deshalb tragen
 * diese fünf Zeilen im Manifest die andere Nachweisart.
 *
 * Zusätzlich zur Hülle steht je Zeichen ein **Formmerkmal**: eine Hülle allein bestimmt keine Form
 * (Ruling 17 des Vorgängerslice), und bei `vehicle-air` gegen `vehicle-water` wäre sie sogar
 * zweideutig — die Referenzhüllen von `1.4` und den Wasserfahrzeugen aus E.2 sind zufällig gleich.
 */
const UNGATED = [
  ['vehicle-land', '1.3_Landfahrzeug.svg', [0.9998, 5.7499, 31.0, 26.0001]],
  ['vehicle-air', '1.4_Luftfahrzeug.svg', [1.0001, 7.9999, 31.0003, 23.0001]],
  ['vehicle-water', '1.5_Wasserfahrzeug.svg', [1.0001, 9.0001, 31.0, 24.0002]],
  ['area', '1.9_Gebiet.svg', [1.5199, 3.2298, 30.9993, 28.3237]],
  ['spontaneous-helper', '1.14_Spontanhelfer.svg', [2, 2, 30, 30]],
] as const satisfies ReadonlyArray<
  [keyof typeof BASE_SYMBOLS, string, readonly [number, number, number, number]]
>;

/**
 * Erzwingt zur Kompilierzeit, dass jede Art in `BASE_SYMBOLS` in **einer der beiden** Listen
 * vorkommt. `ReadonlyArray<[keyof typeof BASE_SYMBOLS, …]>` prüft oben nur, dass jeder Eintrag
 * ein gültiger Schlüssel ist — nicht, dass jeder Schlüssel referenziert wird. Ergänzt jemand
 * `BASE_SYMBOLS` um eine Art, ohne eine der Listen zu ergänzen, ist `ReferencedKind` nicht mehr
 * deckungsgleich mit `keyof typeof BASE_SYMBOLS`, und die Zuweisung unten wird zum Typfehler
 * ("Type 'false' does not satisfy the constraint 'true'").
 */
type ReferencedKind = (typeof REFERENCE)[number][0] | (typeof UNGATED)[number][0];
type Extends<Type, Constraint> = Type extends Constraint ? true : false;
type AssertTrue<Check extends true> = Check;
const referenceCoversAllBaseSymbols: AssertTrue<Extends<keyof typeof BASE_SYMBOLS, ReferencedKind>> =
  true;
void referenceCoversAllBaseSymbols;

const ALL = [
  ...REFERENCE.map(([kind, asset]) => [kind, asset] as const),
  ...UNGATED.map(([kind, asset]) => [kind, asset] as const),
];

/** Erste Depiction eines Katalogeintrags — wirft aussagekräftig statt eines rohen Laufzeitfehlers. */
function primaryDepiction(kind: keyof typeof BASE_SYMBOLS) {
  const [depiction] = BASE_SYMBOLS[kind].depictions;
  if (depiction === undefined) {
    throw new Error(`${kind}: BASE_SYMBOLS enthält keine Depiction.`);
  }
  return depiction;
}

function bodyOf(kind: keyof typeof BASE_SYMBOLS) {
  const body = primaryDepiction(kind).drawing.children.find((child) => child.role === 'body');
  if (body === undefined) throw new Error(`${kind}: kein body-Primitiv.`);
  return body;
}

function expectWithinTolerance(actualMm: number, expectedMm: number, label: string): void {
  const differenceUnits = Math.abs(mmToUnits(actualMm) - mmToUnits(expectedMm));
  expect(
    differenceUnits,
    `${label}: ${actualMm} mm gegen ${expectedMm} mm (${differenceUnits.toFixed(4)} Einheiten)`,
  ).toBeLessThan(TOLERANCE_UNITS);
}

describe('Grundzeichen Kapitel 1', () => {
  it('führt alle vierzehn Abschnitte des Kapitels', () => {
    expect(Object.keys(BASE_SYMBOLS)).toHaveLength(14);
    const sections = ALL.map(([, asset]) => asset.slice(0, asset.indexOf('_'))).sort(
      (left, right) => Number(left.slice(2)) - Number(right.slice(2)),
    );
    expect(sections).toEqual([
      '1.1',
      '1.2',
      '1.3',
      '1.4',
      '1.5',
      '1.6',
      '1.7',
      '1.8',
      '1.9',
      '1.10',
      '1.11',
      '1.12',
      '1.13',
      '1.14',
    ]);
  });

  it('bindet den Körper-Fingerprint-Claim exakt an die ausgeführten Grundzeichenfälle', () => {
    const tested = REFERENCE.map(([kind]) => BASE_SYMBOLS[kind].id).sort();
    const claimed = COVERAGE_MANIFEST.entries
      .filter(
        (entry) =>
          entry.coverage === 'catalog-entry' && entry.testEvidence.includes('body-fingerprint'),
      )
      .map((entry) => entry.implementation)
      .sort();
    expect(tested).toEqual(claimed);
  });

  it('bindet den Geometrie-Regressionsclaim exakt an die ungegateten Grundzeichenfälle', () => {
    const tested = UNGATED.map(([kind]) => BASE_SYMBOLS[kind].id).sort();
    const claimed = COVERAGE_MANIFEST.entries
      .filter((entry) => entry.testEvidence.includes('body-geometry-regression'))
      .map((entry) => entry.implementation)
      .sort();
    expect(tested).toEqual(claimed);
  });

  it.each(UNGATED)('belegt, dass das Kennwertartefakt zu %s keine Form führt', (_kind, asset, _expected) => {
    // Der Grund für die zweite Gruppe ist eine Eigenschaft des Artefakts, keine Behauptung
    // dieser Datei. Füllt ein späterer Extraktorausbau die Formen nach, fällt diese Zeile — und
    // damit die Einordnung, statt sie still zu überleben.
    expect(fingerprintFor(asset).shapes).toEqual([]);
  });

  it.each(REFERENCE)('trifft die Referenzgeometrie von %s', (kind, asset, bodyGeometry) => {
    // Geprüft wird die Geometrie des Katalogeintrags selbst (depictions[0].drawing), nicht der
    // Rückgabewert von baseDrawing() — beides deckt sich nur, solange entry() intern baseDrawing()
    // aufruft, und ein künftiger Eintrag mit inline gebauter Geometrie darf das nicht umgehen.
    const drawing = primaryDepiction(kind).drawing;
    const result = matchFingerprint(drawing, fingerprintFor(asset), { bodyGeometry });
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it.each(UNGATED)('trifft die vermessene Hülle von %s', (kind, _asset, expected) => {
    const bounds = boundsOfMm(bodyOf(kind));
    const [minX, minY, maxX, maxY] = expected;
    expectWithinTolerance(bounds.minX, minX, `${kind} minX`);
    expectWithinTolerance(bounds.minY, minY, `${kind} minY`);
    expectWithinTolerance(bounds.maxX, maxX, `${kind} maxX`);
    expectWithinTolerance(bounds.maxY, maxY, `${kind} maxY`);
  });

  it('hält 1.13 Ereignis als offenen Polyzug fest', () => {
    // Die Offenheit ist seit LFH-424 gegatet (der Kennwert ist die Strichhülle, und die
    // unterscheidet offen von geschlossen um 0,73 Einheiten). Diese Zeile hält zusätzlich die
    // Darstellungsform selbst fest: `closed: true` würde den Renderer ein `<polygon>` statt eines
    // `<polyline>` ausgeben lassen.
    const body = bodyOf('event');
    expect(body.type).toBe('polyline');
    if (body.type !== 'polyline') throw new Error('unreachable');
    expect(body.closed).toBe(false);
    expect(body.points).toEqual([
      [4, 7],
      [16, 25],
      [28, 7],
    ]);
  });

  it('setzt die Halbkreise von 1.4 und 1.5 auf entgegengesetzte Seiten ihrer Sehne', () => {
    // Eine Hülle bestimmt keine Form: die Referenzhülle von 1.4 (1/8/31/23) ist zufällig
    // identisch mit der der Wasserfahrzeuge aus E.2.27 bis E.2.31, obwohl die den Bogen
    // andersherum ziehen. Geprüft wird deshalb die Bogenrichtung, nicht nur die Ausdehnung: bei
    // 1.4 liegt die Sehne unten (maxY) und der Bogen darüber, bei 1.5 umgekehrt.
    const air = bodyOf('vehicle-air');
    const water = bodyOf('vehicle-water');
    if (air.type !== 'path' || water.type !== 'path') throw new Error('unreachable');
    expect(air.d).toContain('M 31 23 L 1 23');
    expect(water.d).toContain('M 1 9 L 31 9');
    // Scheitel: 1.4 nach oben (y = 8 = 23 − 15), 1.5 nach unten (y = 24 = 9 + 15).
    expect(boundsOfMm(air).minY).toBeCloseTo(8, 6);
    expect(boundsOfMm(water).maxY).toBeCloseTo(24, 6);
  });

  it('leitet den Pfad von 1.9 Gebiet aus Ecken und Radien ab, nicht aus einem rohen d-String', () => {
    // Belegt sind die zehn Ecken (höchstens 0,00074 mm von ganzen Millimetern) und die zehn
    // Radien (höchstens 0,0003 mm vom 0,6-mm-Raster, gerechnet wie roundedPolygonPath sie setzt —
    // siehe AREA_RADII_MM) — nicht die Zeichen, die daraus folgen.
    // Zehn Kubiken (je eine Ecke) und neun Geraden plus Z.
    const area = bodyOf('area');
    if (area.type !== 'path') throw new Error('unreachable');
    expect(area.d.match(/C /g) ?? []).toHaveLength(10);
    expect(area.d.match(/L /g) ?? []).toHaveLength(9);
    expect(area.d.endsWith(' Z')).toBe(true);
  });

  it('setzt 1.14 Spontanhelfer auf d + R = 14 mit dem gemessenen, nicht dem glatten Paar', () => {
    // Der Scheitel jedes Lappens liegt bei 16 ± (d + R) = 2 bzw. 30 — das trifft das glatte Paar
    // 6,5/7,5 genauso, weil auch dort d + R = 14 ist. Unterschieden wird an der Fuge: die
    // Außenkontur der Referenz misst dort (8,3425|8,3425), das Modell 6,5066/7,4934 sagt 8,3426
    // voraus (0,0003 Einheiten), das glatte Paar 8,3377 (0,0137 Einheiten — über der Toleranz).
    // Die Mittellinienfuge des gewählten Modells liegt bei 8,5644.
    const helper = bodyOf('spontaneous-helper');
    if (helper.type !== 'path') throw new Error('unreachable');
    expect(helper.d.startsWith('M 8.5644 8.5644 ')).toBe(true);
    expect(helper.d).toContain('16 2');
    expect(helper.d).toContain('30 16');
  });

  it.each(ALL)('trägt Quellenbezug und Reviewstatus für %s', (kind, asset) => {
    const entry = BASE_SYMBOLS[kind];
    expect(entry.depictions).toHaveLength(1);
    const depiction = primaryDepiction(kind);
    expect(depiction.variant).toBe('primary');
    expect(depiction.sourceRefs.length).toBeGreaterThan(0);
    const [sourceRef] = depiction.sourceRefs;
    if (sourceRef === undefined) {
      throw new Error(`${kind}: Depiction enthält keinen Quellenbezug.`);
    }
    expect(sourceRef.source).toBe('babz-svg-2025');
    expect(sourceRef.status).toBe('verbatim');
    expect(sourceRef.asset).toBe(asset);
    expect(sourceRef.section).toBeTruthy();
  });

  it('markiert den Körper jedes Grundzeichens mit der Rolle body', () => {
    for (const [kind] of ALL) {
      expect(bodyOf(kind), `${kind} hat kein body-Primitiv`).toBeDefined();
    }
  });
});
