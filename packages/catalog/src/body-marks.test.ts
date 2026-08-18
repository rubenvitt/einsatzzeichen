import { describe, expect, it } from 'vitest';
import type { BoundsMm } from '@einsatzzeichen/core';
import { DEFAULT_STROKE_WIDTH_MM, type Primitive } from '@einsatzzeichen/schema';
import { BODY_MARK_IDS, bodyMark } from './body-marks.js';

/**
 * Die einzige vermessene Körperhülle dieser Zeichnungen: das Rechteck 30 × 20 mm der taktischen
 * Formation (1/6 bis 31/26 mm, Mitte 16|16), wie `base-symbols.ts` es führt und wie die zwölf
 * Dateien aus F.1.1 bis F.1.11 es zeigen.
 */
const formationBodyMm: BoundsMm = { minX: 1, minY: 6, maxX: 31, maxY: 26 };

/** Der Strichstil, den `body-marks.ts` an jede Linie schreibt — Kontur, keine Füllung. */
const strokeStyle = { stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM } as const;

function line(x1: number, y1: number, x2: number, y2: number): Primitive {
  return { type: 'line', role: 'pictogram', x1, y1, x2, y2, style: strokeStyle };
}

/** Die Fachdienstteilung, die jede der vier Fassungen als erste beiden Primitive trägt. */
const quartering: readonly Primitive[] = [line(16, 6, 16, 26), line(1, 16, 31, 16)];

describe('bodyMark() — die Fachdienstteilung', () => {
  it('legt beide Arme auf die Mittellinien und bis an die Körperkanten', () => {
    // Gemessen an `F.1.11_Rettungsdienst allgemein.svg`: senkrechter Arm 15,75…16,25 mm um die
    // Mittellinie 16,0 über die **volle** Körperhöhe 6…26, waagerechter Arm ebenso um 16,0 über
    // die volle Körperbreite 1…31. Das ist der Unterschied zur Boxfassung aus Kapitel 4, deren
    // beide Arme auf 2…30 mm enden — die randbündige Fassung stößt an die Hülle.
    expect(bodyMark('medical-service', formationBodyMm)).toEqual(quartering);
  });
});

describe('bodyMark() — die Zusätze je Fachdienst', () => {
  it('setzt die Arztleiste 8 mm breit auf 4 mm über der Körperunterkante', () => {
    // Gemessen an `F.1.7_Sanitätsgruppe_arztbesetzt.svg` (und gleichlautend an `F.1.1`): Leiste
    // 12,0…20,0 mm auf der Mittellinie y 22,0 (Strichband 21,75…22,25), also mittig zur
    // Körpermitte 16,0 und 4 mm über der Unterkante 26,0. Die Boxfassung von 4.6.4 trägt eine
    // **10 mm** breite Leiste auf y 24 — die beiden Zeichnungen sind nicht ineinander
    // umrechenbar, und dieser Test hält fest, welche der beiden hier gilt.
    expect(bodyMark('physician', formationBodyMm)).toEqual([...quartering, line(12, 22, 20, 22)]);
  });

  it('setzt den Intensivbalken 8 mm hoch auf die Mittellinie der rechten Körperhälfte', () => {
    // Gemessen an `F.1.10_Schnelleinsatzgruppe Rettungsdienst.svg` und
    // `F.1.11_Rettungsdienst allgemein_Alternative.svg`: Balken 12,0…20,0 mm auf der Mittellinie
    // x 23,5 (Strichband 23,25…23,75) — also mittig zur Körpermitte 16,0 und auf der halben
    // Strecke zwischen Mittellinie 16,0 und rechter Kante 31,0. Die Boxfassung von 4.6.3 setzt
    // ihn 10 mm hoch auf x 24.
    expect(bodyMark('intensive-care', formationBodyMm)).toEqual([
      ...quartering,
      line(23.5, 12, 23.5, 20),
    ]);
  });

  it('setzt den Transportring auf r 5,5 mm um die Körpermitte', () => {
    // Gemessen an `F.1.8_Patiententransportgruppe.svg`: die weißen Viertelfelder enden auf
    // r 5,75 mm um (16|16), die Tortenstücke im Ring beginnen auf r 5,2376 — Mittellinie r 5,5
    // bei 0,5 mm Strich. Die Boxfassung von 4.6.5 trägt r ≈ 7 mm.
    const marks = bodyMark('patient-transport', formationBodyMm);
    const ring = marks.find((primitive) => primitive.type === 'circle');
    expect(ring).toEqual({
      type: 'circle',
      role: 'pictogram',
      cx: 16,
      cy: 16,
      r: 5.5,
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    });
  });

  it('führt die beiden Diagonalen des Transportrings unter ±45° als Durchmesser', () => {
    // Die acht Speichen der Referenzdatei sind vier Linien: die beiden Arme der Teilung und zwei
    // Diagonalen. Geprüft wird die **Aussage** — durch die Körpermitte, Steigung ±1, Endpunkte
    // auf dem Ring — und nicht der Dezimalwert 3,8891, der nur ihre Folge ist. Endeten die
    // Diagonalen kürzer oder länger als r 5,5, träten die Speichen nicht bündig aus dem Ring.
    const diagonals = bodyMark('patient-transport', formationBodyMm)
      .filter((primitive) => primitive.type === 'line')
      .slice(2);
    expect(diagonals).toHaveLength(2);

    const slopes: number[] = [];
    for (const diagonal of diagonals) {
      if (diagonal.type !== 'line') throw new Error('unreachable');
      // Mittig zur Körpermitte: die beiden Endpunkte spiegeln sich an (16|16).
      expect((diagonal.x1 + diagonal.x2) / 2).toBeCloseTo(16, 9);
      expect((diagonal.y1 + diagonal.y2) / 2).toBeCloseTo(16, 9);
      // Beide Endpunkte liegen auf dem Ring r 5,5 — die Diagonale ist sein Durchmesser.
      expect(Math.hypot(diagonal.x1 - 16, diagonal.y1 - 16)).toBeCloseTo(5.5, 9);
      expect(Math.hypot(diagonal.x2 - 16, diagonal.y2 - 16)).toBeCloseTo(5.5, 9);
      slopes.push((diagonal.y2 - diagonal.y1) / (diagonal.x2 - diagonal.x1));
    }
    // Je einmal +45° und einmal −45°, nicht zweimal dieselbe Richtung.
    expect(slopes.map((slope) => Math.round(slope)).sort()).toEqual([-1, 1]);
  });
});

describe('bodyMark() — die Zeltmarke der Betreuung', () => {
  /** Das Zelt aus F.1.4: von der linken unteren Körperecke über die Mitte der Oberkante zurück. */
  const tent: Primitive = {
    type: 'polyline',
    role: 'pictogram',
    points: [
      [1, 26],
      [16, 6],
      [31, 26],
    ],
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  };

  it('spannt den Polyzug von Ecke zu Ecke über die Mitte der Oberkante', () => {
    // 4.2.1 Betreuung, randbündig. Gemessen an `F.1.4_Einsatzeinheit.svg`: die beiden Schenkel
    // laufen in die **Körperecken** unten und in die **Mitte der Oberkante**, nicht in eine
    // eingerückte Box — dasselbe Randbündigkeitsmerkmal wie beim Kreuz, das die Kanten 1…31 und
    // 6…26 nimmt statt der 2…30 der Boxfassung. Ohne Füllung: das Zelt ist eine Kontur, keine
    // Fläche, und eine Füllung deckte die Teilung darunter ab.
    expect(bodyMark('care', formationBodyMm)).toEqual([tent]);
  });

  it('trifft mit dem linken Schenkel die beiden vermessenen Innenkanten des Strichbands', () => {
    // Die eigentliche Herleitung, nachgerechnet statt geglaubt. Die Referenz gibt nicht die
    // Mittellinie, sondern die Kanten des 0,5-mm-Strichbands: der linke Schenkel läuft durch
    // (1,5|25,75) und (9,0|15,75). Bei der Steigung dieses Schenkels (15 mm waagerecht auf 20 mm
    // senkrecht) entspricht ein halber Strich von 0,25 mm einem waagerechten Versatz von
    // 0,25 · sqrt(1 + 0,75²) = 0,3125 mm. Auf die Mittellinie zurückgerechnet sind die beiden
    // gemessenen Punkte damit (1,1875|25,75) und (8,6875|15,75) — und genau die liefert der
    // Polyzug von (1|26) nach (16|6).
    //
    // Wer die Zahlen aus dem Bild direkt als Mittellinie nähme, legte das Zelt 0,3125 mm nach
    // rechts und verfehlte beide unteren Ecken; genau davor warnt der Dateikopf.
    const [leg] = bodyMark('care', formationBodyMm);
    if (leg?.type !== 'polyline') throw new Error('bodyMark("care") liefert keinen Polyzug.');
    const [[x0, y0], [x1, y1]] = leg.points as [[number, number], [number, number]];
    const xAt = (yMm: number): number => x0 + ((x1 - x0) * (yMm - y0)) / (y1 - y0);
    const halfStrokeOffsetMm = 0.25 * Math.sqrt(1 + 0.75 ** 2);
    expect(halfStrokeOffsetMm).toBeCloseTo(0.3125, 9);
    expect(xAt(25.75) + halfStrokeOffsetMm).toBeCloseTo(1.5, 9);
    expect(xAt(15.75) + halfStrokeOffsetMm).toBeCloseTo(9.0, 9);
  });

  it('trägt die Fachdienstteilung nicht mit', () => {
    // **Die Aussage dieses Blocks.** `physician` und `intensive-care` bringen das Kreuz mit, weil
    // ihre Kapitel-4-Zeichen (4.6.4, 4.6.3) es führen; `care` (4.2.1) führt es nicht. Belegt an
    // der Referenz selbst: `F.1.3` zeigt das Zelt **ohne** Kreuz, `F.1.4` zeigt beide. Jede Marke
    // ist genau ihr Kapitel-4-Zeichen, randbündig — und nicht „was auf dem Bild sonst noch steht".
    //
    // Ohne diesen Test zöge der nächste Bearbeiter das Kreuz der Bequemlichkeit halber in die
    // Zeltmarke (drei der fünf Fassungen führen es, das lädt dazu ein) — und `F.1.3` bekäme still
    // ein Kreuz, das seine Referenzdatei nicht zeigt. Kein Gate meldete das: der Fingerprint
    // sieht nur `role: 'body'`.
    const care = bodyMark('care', formationBodyMm);
    expect(care).toHaveLength(1);
    expect(care.some((primitive) => primitive.type === 'line')).toBe(false);
  });

  it('ergibt mit der Teilung zusammen das Bild von F.1.4 — zwei Marken nebeneinander', () => {
    // Die Gegenprobe zur Zusicherung darüber: `F.1.4` entsteht als **Liste zweier Marken**
    // (`bodyMarks: ['medical-service', 'care']`) und nicht dadurch, dass eine die andere
    // enthielte. Beide Fassungen bleiben dabei unverändert die, die ihr eigener Test festhält.
    const combined = [
      ...bodyMark('medical-service', formationBodyMm),
      ...bodyMark('care', formationBodyMm),
    ];
    expect(combined).toEqual([...quartering, tent]);
  });
});

/**
 * Die beiden Würfe dieser Datei werden **an ihrer Prosa** erkannt und nicht an einem Regelkode —
 * anders als die Ablehnungen in `validateSpec` (`top-left-label-requires-measured-body` und
 * ihresgleichen), die als Kode geprüft gehören. Das ist Absicht und keine Nachlässigkeit: die
 * Würfe sind katalogseitig, und im Katalog trägt kein Wurf einen Kode — `organizationColor` und
 * `baseDrawing` werfen genauso in Prosa. Ein einzelner Kode allein in `body-marks.ts` wäre eine
 * neue Bauart mit n = 1. Wer die Meldungen umformuliert, passt hier die Muster mit an.
 */
describe('bodyMark() — was nicht fortgeschrieben wird', () => {
  it('wirft für eine Fähigkeit ohne vermessene randbündige Fassung', () => {
    // `fire-fighting` steht in `CAPABILITY_IDS` und hat ein Boxpiktogramm, aber keine an einer
    // F-Datei vermessene randbündige Fassung. Ein stiller Rückfall auf die Boxfassung wäre der
    // eigentliche Fehler: die beiden Zeichnungen unterscheiden sich in ihren **Maßen** (Kreuz
    // 2…30 gegen 1…31, Leiste 10 gegen 8 mm) und nicht nur in ihrer Größe — das Ergebnis sähe
    // plausibel aus und wäre an keiner Referenzdatei belegt.
    expect(() => bodyMark('fire-fighting', formationBodyMm)).toThrow(
      /keine randbündige Fassung vermessen/,
    );
  });

  it('wirft für eine Körperhülle, die nicht 30 × 20 mm misst', () => {
    // Der Landfahrzeugrumpf (1/5,75 bis 31/26 mm = 30 × 20,25 mm) — genau die Hülle, auf die
    // Anhang F.2 dieselbe Teilung trägt, und genau der Fall, den ein Weiterrechnen erwischte:
    // 0,25 mm Unterschied, das Bild bliebe unauffällig. Anhang F misst dort **eigene** Zahlen
    // für Leiste, Balken und Ring; der Wurf hält fest, dass sie noch nicht vorliegen.
    expect(() =>
      bodyMark('medical-service', { minX: 1, minY: 5.75, maxX: 31, maxY: 26 }),
    ).toThrow(/nur am Rechteckkörper 30 × 20 mm/);
  });

  it('meldet die tatsächlichen Hüllenmaße im Wurf', () => {
    // Ohne die Zahlen im Text stünde der nächste Leser vor „passt nicht" ohne zu wissen, um
    // wie viel — bei 0,25 mm Unterschied ist das der ganze Befund.
    expect(() => bodyMark('medical-service', { minX: 1, minY: 5.75, maxX: 31, maxY: 26 })).toThrow(
      /30\.000 × 20\.250 mm/,
    );
  });
});

describe('BODY_MARK_IDS', () => {
  it('führt jede an Anhang F.1 vermessene Fähigkeit, und jede davon zeichnet auch', () => {
    // Enthaltensein und nicht Gleichheit — und der Zuwachs hat die Bauart schon bestätigt: mit
    // `care` (F.1.4) kam ein fünfter vermessener Fachdienst dazu, ohne dass dieser Test dafür
    // rot werden musste. Was er festhält, ist die Zusicherung, dass jede aufgeführte Kennung
    // auch tatsächlich eine Zeichnung liefert — eine Kennung in der Liste, die im Aufruf wirft
    // oder nichts liefert, wäre ein Katalog, der eine Fassung anmeldet, die er nicht hat.
    for (const id of [
      'medical-service',
      'physician',
      'intensive-care',
      'patient-transport',
      'care',
    ]) {
      expect(BODY_MARK_IDS).toContain(id);
    }
    for (const id of BODY_MARK_IDS) {
      // Kein Mindestmaß von zwei Primitiven: `care` steht mit **einem** Polyzug ohne Teilung da,
      // und genau das ist an F.1.3 belegt (siehe den Block zur Zeltmarke oben).
      expect(bodyMark(id, formationBodyMm).length).toBeGreaterThanOrEqual(1);
    }
  });
});
