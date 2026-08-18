import { describe, expect, it } from 'vitest';
import { boundsOfMm, matchFingerprint, type BodyGeometryMode } from '@einsatzzeichen/core';
import {
  TOLERANCE_UNITS,
  mmToUnits,
  type BodyVariantId,
  type SymbolKind,
} from '@einsatzzeichen/schema';
import { BASE_SYMBOLS, baseDrawing } from './base-symbols.js';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import { fingerprintFor } from './fingerprint-index.js';

/**
 * Die dreizehn Grundzeichen, deren Körper **am Kennwertartefakt** gegatet ist. Die dritte Spalte
 * sagt, welche Geometrie des Körpers dabei gegen den Kennwert steht.
 *
 * `1.13 Ereignis` ist der einzige `stroke-outline`-Fall des Bestands: sein Kennwert ist die Hülle
 * des zu einer Fläche umgewandelten Strichs (`kind: 'bounds'`, 3,792/6,862/28,207/25,451) und nicht
 * die Mittellinie 4/7/28/25. Die Einstellung steht hier je Zeile und wird ausdrücklich **nicht**
 * aus der Formklasse des Kennwerts abgeleitet — siehe `strokeBoundsOfMm`, das den Gegenfall
 * `1.10 Maßnahme` (Fase, 1,0 mm Strich) um 0,71 Einheiten verfehlte.
 *
 * **Die vier Kurvenkörper 1.3, 1.4, 1.5 und 1.9 stehen seit dem Teilslice E.2 hier und nicht mehr
 * in `UNGATED`.** Ihr Kennwertartefakt führte `shapes: []`, weil der Extraktor für einen
 * Kurvenpfad nichts ablegte; seit er die Körperfläche der Ebene `Flächige_Fülung` als
 * `kind: 'bounds'` erfasst, führt es eine Form, und `matchFingerprint` läuft. Alle vier stehen auf
 * `centerline`, und das ist gemessen und nicht analog geschlossen: ihre Füllebene trägt die
 * **Mittellinie verbatim** (bei 1.3 unabhängig bestätigt durch die Mittelung der Strichkonturen
 * 0,7497…1,2499 außen/innen, siehe `base-symbols.ts`). Größte Abweichung der vier gegen den
 * Kennwert: 0,0028 Einheiten bei 1.9 (maxX 31 gegen 30,999 mm) — die Rundung des Extraktors auf
 * drei Millimeterstellen, bei einer Toleranz von 0,01 Einheiten.
 */
const REFERENCE = [
  ['formation', '1.1_Taktische Formation.svg', 'centerline'],
  ['person', '1.2_Person.svg', 'centerline'],
  ['vehicle-land', '1.3_Landfahrzeug.svg', 'centerline'],
  ['vehicle-air', '1.4_Luftfahrzeug.svg', 'centerline'],
  ['vehicle-water', '1.5_Wasserfahrzeug.svg', 'centerline'],
  ['post', '1.6_Funktionsstelle.svg', 'centerline'],
  ['building', '1.7_Gebäude.svg', 'centerline'],
  ['container', '1.8_Behälter Ressource Raum Funkgerät.svg', 'centerline'],
  ['area', '1.9_Gebiet.svg', 'centerline'],
  ['measure', '1.10_Maßnahme.svg', 'centerline'],
  ['hazard', '1.11_Gefahr.svg', 'centerline'],
  ['point', '1.12_Konkreter Punkt.svg', 'centerline'],
  ['event', '1.13_Ereignis.svg', 'stroke-outline'],
] as const satisfies ReadonlyArray<[keyof typeof BASE_SYMBOLS, string, BodyGeometryMode]>;

/**
 * Der verbliebene ungegatete Körper. Sein Kennwertartefakt führt `shapes: []`, und
 * `matchFingerprint` bricht deshalb mit „Keine vergleichbare Form in den Kennzahlen zu …" ab,
 * bevor es den Körper ansieht.
 *
 * **Der Grund ist bei `1.14` ein anderer als bei den vier Kurvenkörpern, die diese Liste bis zum
 * Teilslice E.2 mitführte.** Bei denen lag es am Extraktor, der für einen Kurvenpfad nichts
 * ablegte; sie stehen jetzt in `REFERENCE`. `1.14 Spontanhelfer` führt dagegen — als einzige Datei
 * des Kapitels neben `1.13` — **überhaupt keine Ebene `Flächige_Fülung`**, es gibt dort also keine
 * Körperfläche zu erfassen. Das ist eine Eigenschaft der Quelle und wird von keinem
 * Extraktorausbau behoben.
 *
 * Der Sollwert unten stammt aus einer eigenen Vermessung der Referenzdatei vom 18. August 2026
 * (Ringpaar außen 1,7501/1,7498/30,2500/30,2500, innen 2,2500/2,2500/29,7497/29,7497 →
 * Mittellinie 2/2/30/30). Er steht hier und nicht im Artefakt — genau das ist der Unterschied
 * zwischen `body-geometry-regression` und `body-fingerprint`, und deshalb trägt diese Zeile im
 * Manifest die andere Nachweisart.
 *
 * Zusätzlich zur Hülle steht das **Formmerkmal** weiter unten je Zeichen: eine Hülle allein
 * bestimmt keine Form (Ruling 17 des Vorgängerslice), und bei `vehicle-air` gegen `vehicle-water`
 * wäre sie sogar zweideutig — die Referenzhüllen von `1.4` und den Wasserfahrzeugen aus E.2 sind
 * zufällig gleich. Diese Formmerkmalstests bleiben deshalb stehen, obwohl die vier Körper jetzt
 * zusätzlich gegatet sind.
 */
const UNGATED = [
  ['spontaneous-helper', '1.14_Spontanhelfer.svg', [2, 2, 30, 30]],
] as const satisfies ReadonlyArray<
  [keyof typeof BASE_SYMBOLS, string, readonly [number, number, number, number]]
>;

/**
 * Die vermessenen Hüllen der vier Kurvenkörper. Sie standen bis zum Teilslice E.2 als Sollwerte in
 * `UNGATED` und sind seither zusätzlich am Kennwertartefakt gegatet — die eigene Vermessung bleibt
 * trotzdem stehen, weil sie **feiner** ist als das Artefakt: der Extraktor rundet auf drei
 * Millimeterstellen, diese Zahlen stammen aus dem Pfadparser mit analytischen Kubik-Extrema
 * (18. August 2026, 1 mm = 72/25,4 Einheiten) und halten vier.
 */
const MEASURED_CURVED_BODIES = [
  ['vehicle-land', [0.9998, 5.7499, 31.0, 26.0001]],
  ['vehicle-air', [1.0001, 7.9999, 31.0003, 23.0001]],
  ['vehicle-water', [1.0001, 9.0001, 31.0, 24.0002]],
  ['area', [1.5199, 3.2298, 30.9993, 28.3237]],
] as const satisfies ReadonlyArray<
  [keyof typeof BASE_SYMBOLS, readonly [number, number, number, number]]
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
    // damit die Einordnung, statt sie still zu überleben. **Genau das ist im Teilslice E.2
    // passiert**: für 1.3, 1.4, 1.5 und 1.9 ist sie gefallen, und die vier sind nach `REFERENCE`
    // gewandert. Für 1.14 trägt sie weiter, weil die Datei keine Füllebene führt.
    expect(fingerprintFor(asset).shapes).toEqual([]);
  });

  it.each(MEASURED_CURVED_BODIES)(
    'hält die eigene Vermessung von %s neben dem gröber gerundeten Kennwert',
    (kind, expected) => {
      const bounds = boundsOfMm(bodyOf(kind));
      const [minX, minY, maxX, maxY] = expected;
      expectWithinTolerance(bounds.minX, minX, `${kind} minX`);
      expectWithinTolerance(bounds.minY, minY, `${kind} minY`);
      expectWithinTolerance(bounds.maxX, maxX, `${kind} maxX`);
      expectWithinTolerance(bounds.maxY, maxY, `${kind} maxY`);
    },
  );

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

/**
 * Die drei Körperformen ohne Kapitel-1-Abschnitt und die eine Körpervariante. Sie stehen bewusst
 * nicht in `BASE_SYMBOLS` (siehe dort) und deshalb auch nicht in `REFERENCE`/`UNGATED` — gegatet
 * sind sie trotzdem, und zwar gegen **ihre eigene** Belegdatei über dasselbe
 * `matchFingerprint`. Erst der Extraktorausbau dieses Teilslice macht das möglich: vorher führte
 * das Kennwertartefakt für drei der vier Dateien nur Glyphenhüllen.
 */
describe('Körperformen des Anhangs E.2', () => {
  /**
   * Körper aus `baseDrawing` statt aus `BASE_SYMBOLS` — die drei neuen Formen stehen dort
   * bewusst nicht (`bodyOf` griffe ins Leere).
   */
  function drawnBody(kind: SymbolKind, variant?: BodyVariantId) {
    const body = baseDrawing(kind, variant).children.find((child) => child.role === 'body');
    if (body === undefined) throw new Error(`${kind}: kein body-Primitiv.`);
    return body;
  }

  /**
   * Die vierte Spalte ist die **zweite** Belegdatei, wo es sie gibt. Beim Anhängerrumpf ist das
   * `5.1.2.1_Anhänger_allgemein.svg` — der Abschnitt, dessen Namen die Form trägt; beim
   * Wasserrumpf eine zweite der fünf byteidentischen E.2-Dateien.
   */
  const E2_BODIES = [
    ['trailer', undefined, 'E.2.22_Anhänger Grundzeichen.svg', '5.1.2.1_Anhänger_allgemein.svg'],
    [
      'swap-loader-vehicle',
      undefined,
      'E.2.15_Wechselladerfahrzeug_straßenfähig.svg',
      undefined,
    ],
    ['upright-rectangle', undefined, 'E.2.26_Trinkwasseraufbereitungsanlage.svg', undefined],
    [
      'vehicle-water',
      'raised-hull',
      'E.2.27_Wasserfahrzeug allgemein.svg',
      'E.2.31_Mehrzweckponton.svg',
    ],
  ] as const satisfies ReadonlyArray<
    [SymbolKind, BodyVariantId | undefined, string, string | undefined]
  >;

  it.each(E2_BODIES)('trifft die Referenzgeometrie von %s (%s)', (kind, variant, asset, second) => {
    for (const file of second === undefined ? [asset] : [asset, second]) {
      const result = matchFingerprint(baseDrawing(kind, variant), fingerprintFor(file));
      expect(result.problems, file).toEqual([]);
      expect(result.ok, file).toBe(true);
    }
  });

  /**
   * Die Ableitung selbst, an ihrem Ursprung festgenagelt: `deckCurveBody(1; 5,75; 26)` muss den
   * `d`-String von `1.3 Landfahrzeug` **zeichengenau** erzeugen. Fällt diese Zeile, ist die
   * Streckung, aus der Anhänger- und Wechselladerrumpf entstehen, keine Aussage über `1.3` mehr.
   *
   * Der Vergleichsstring ist die vermessene Zeichnung von `1.3` (Hülle
   * 0,9998/5,7499/31,0000/26,0001, Kontrollpunkte 4,9999/9,9998 links und 26,9998/21,9999
   * rechts, Scheitel 15,9999 — gerundet auf die vier Stellen, die `PATH_DECIMALS` zulässt).
   */
  it('erzeugt 1.3 Landfahrzeug zeichengenau aus der Deckkurvenableitung', () => {
    const body = bodyOf('vehicle-land');
    if (body.type !== 'path') throw new Error('unreachable');
    expect(body.d).toBe(
      'M 16 8 C 10 8, 5 7.089, 1 5.75 L 1 26 L 31 26 L 31 5.75 C 27 7.089, 22 8, 16 8 Z',
    );
  });

  /** Dieselbe Prüfung für die Halbkreiskonstruktion, aus der der E.2-Wasserrumpf entsteht. */
  it('erzeugt 1.5 Wasserfahrzeug zeichengenau aus der Halbkreisableitung', () => {
    const body = bodyOf('vehicle-water');
    if (body.type !== 'path') throw new Error('unreachable');
    expect(body.d).toBe(
      'M 1 9 L 31 9 C 31 17.2843, 24.2843 24, 16 24 C 7.7157 24, 1 17.2843, 1 9 Z',
    );
  });

  it('streckt Anhänger- und Wechselladerrumpf um 0,9 und 0,95 auf dieselbe rechte Kante', () => {
    // Gemessen an drei Dateien (siehe `deckCurveBody`): 1.3 linke Kante 0,9998, 5.1.2.1/E.2.22
    // 3,9998, E.2.15 2,5001 — bei rechter Kante 31,0000 in allen dreien. Die Faktoren folgen
    // daraus als 27/30 und 28,5/30 und sind an sechs x-Koordinaten je Datei bestätigt.
    for (const [kind, expectedLeft] of [
      ['vehicle-land', 1],
      ['trailer', 4],
      ['swap-loader-vehicle', 2.5],
    ] as const) {
      const bounds = boundsOfMm(drawnBody(kind));
      expect(bounds.minX, kind).toBeCloseTo(expectedLeft, 10);
      expect(bounds.maxX, kind).toBeCloseTo(31, 10);
    }
  });

  it('hält den E.2-Wasserrumpf und 1.5 auseinander', () => {
    // Der Grund, warum beide nebeneinander stehen müssen: sie liegen 2,8 Einheiten auseinander,
    // die Toleranz ist 0,01. Ein gemeinsamer Eintrag fiele gegen eine der beiden Belegdateien.
    const chapterOne = boundsOfMm(drawnBody('vehicle-water'));
    const raised = boundsOfMm(drawnBody('vehicle-water', 'raised-hull'));
    expect(chapterOne.minY - raised.minY).toBeCloseTo(1.0001, 4);
    expect(mmToUnits(chapterOne.maxY - raised.maxY)).toBeGreaterThan(TOLERANCE_UNITS);
  });

  it('wirft für eine Körpervariante, die die Art nicht führt', () => {
    // Der stille Rückfall auf die Kapitel-1-Zeichnung ist genau der Fehler, den dieser Teilslice
    // beseitigt — ein E.2-Wasserfahrzeug auf dem Rumpf von 1.5 läge 1,0 mm zu tief.
    expect(() => baseDrawing('vehicle-land', 'raised-hull')).toThrow(/Körpervariante/);
    expect(() => baseDrawing('formation', 'raised-hull')).toThrow(/Körpervariante/);
  });

  it('trägt die Zusatzprimitive der Grundzeichen mit', () => {
    // Deichsel und L-Rahmen gehören zum Grundzeichen. `5.1.2.1_Anhänger_allgemein.svg` trägt die
    // Deichsel ohne jedes Rad — ein Rumpf ohne sie wäre keine Darstellung dieses Abschnitts.
    const trailer = baseDrawing('trailer');
    expect(trailer.children).toHaveLength(2);
    const drawbar = trailer.children[1];
    expect(drawbar?.role).toBe('bodyExtra');
    if (drawbar?.type !== 'polyline') throw new Error('unreachable');
    expect(drawbar.closed).toBe(false);
    expect(drawbar.points).toEqual([
      [4, 14.5],
      [1, 14.5],
      [1, 15.5],
      [4, 15.5],
    ]);

    const swapLoader = baseDrawing('swap-loader-vehicle');
    expect(swapLoader.children).toHaveLength(2);
    const frame = swapLoader.children[1];
    expect(frame?.role).toBe('bodyExtra');
    if (frame?.type !== 'polyline') throw new Error('unreachable');
    expect(frame.closed).toBe(false);
    expect(frame.points).toEqual([
      [1, 6],
      [1, 26],
      [31, 26],
    ]);
    // Die Unterkante des L-Rahmens ist die Oberkante der Fahrwerkszone — 1,5 mm unter der
    // Körperunterkante. Ohne diese Zeile wäre die Fahrwerksverankerung in `compose()` ohne
    // Bezugspunkt.
    expect(boundsOfMm(frame).maxY).toBe(26);
    expect(boundsOfMm(drawnBody('swap-loader-vehicle')).maxY).toBe(24.5);
  });

  it('gibt den drei neuen Formen keinen erfundenen Quellabschnitt', () => {
    // `trailer` hat einen (5.1.2.1), die beiden anderen nicht. Eine Quellenangabe, die die Quelle
    // nicht macht, wäre schlimmer als keine.
    expect(baseDrawing('trailer').description).toContain('BABZ-Abschnitt 5.1.2.1');
    expect(baseDrawing('swap-loader-vehicle').description).toContain('Ohne eigenen BABZ-Abschnitt');
    expect(baseDrawing('upright-rectangle').description).toContain('Ohne eigenen BABZ-Abschnitt');
  });

  it('hält sie aus dem Kapitel-1-Register heraus', () => {
    // `BASE_SYMBOLS` ist das Register des Kapitels 1. Zwei der drei Formen könnten dort keinen
    // Quellenbezug tragen, und der dritte gehört zu Kapitel 5.1.2, das dieser Teilslice
    // ausdrücklich nicht beansprucht.
    expect(Object.keys(BASE_SYMBOLS)).not.toContain('trailer');
    expect(Object.keys(BASE_SYMBOLS)).not.toContain('swap-loader-vehicle');
    expect(Object.keys(BASE_SYMBOLS)).not.toContain('upright-rectangle');
  });
});
