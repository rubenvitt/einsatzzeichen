import { DEFAULT_STROKE_WIDTH_MM, type Primitive, type Style } from '@einsatzzeichen/schema';
import type { AnhangCContext, MarkTable } from './shared.js';
import { stroke } from './shared.js';

/*
 * C.2.18 und C.2.30: Technische Hilfeleistung (4.7.18) am Landfahrzeug und Stromversorgung (4.8.11) am Anhänger mit Fußband (LFH-786).
 * Die Konstruktion der Technischen Hilfeleistung nutzt auch die Formation in C.1.4 (LFH-787, `formation.ts`).
 */

const STROKE: Style = { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM };

/** Auf 1 µm gerundet, damit keine Gleitkommareste wie 15.600000000000001 im Pfad landen. */
const um = (valueMm: number): number => Math.round(valueMm * 1e6) / 1e6;

/**
 * Die Marke der Technischen Hilfeleistung aus C.2.18 und C.1.4, konstruiert gegen die Körpermitte
 * `cx` und die senkrechte Mitte der Marke `cy` (Mitte des Geräts). Maße und Herleitung stehen an
 * der Fassung des Landfahrzeugs unten; C.1.4 setzt dieselbe Marke nur an ein anderes `cy`.
 */
export function technicalAssistanceMark(cx: number, cy: number): Primitive[] {
  const leftX = cx - 13;
  const deviceLeftX = cx - 6;
  const deviceRightX = cx + 7;
  const rayEndX = cx + 13;
  const deviceTopY = cy - 2.5;
  const deviceBottomY = cy + 2.5;

  const wave = (troughY: number): Primitive => {
    const crestY = um(troughY - 2);
    const midX = um((leftX + deviceLeftX) / 2);
    const half = (deviceLeftX - leftX) / 2;
    const lever = half / 2;
    return {
      type: 'path',
      role: 'pictogram',
      d:
        `M ${um(leftX)} ${um(troughY)} ` +
        `C ${um(leftX + lever)} ${um(troughY)} ${um(midX - lever)} ${crestY} ${midX} ${crestY} ` +
        `C ${um(midX + lever)} ${crestY} ${um(deviceLeftX - lever)} ${um(troughY)} ` +
        `${um(deviceLeftX)} ${um(troughY)}`,
      style: STROKE,
    };
  };

  return [
    {
      type: 'rect',
      role: 'pictogram',
      x: deviceLeftX,
      y: deviceTopY,
      width: deviceRightX - deviceLeftX,
      height: deviceBottomY - deviceTopY,
      style: STROKE,
    },
    wave(cy - 0.5),
    wave(cy + 1.5),
    stroke(deviceRightX, deviceTopY, rayEndX, cy - 5),
    stroke(deviceRightX, deviceBottomY, rayEndX, cy + 5),
  ];
}

/** Landfahrzeug ohne Variante (Hülle x 1…31, y 5,75…26). */
const VEHICLE_LAND_MARKS: MarkTable = {
  /**
   * C.2.18: 4.7.18 Technische Hilfeleistung am Landfahrzeug, umgebaut. Gemessen an
   * `C.2.18_Rüstwagen.svg`; Striche als Umriss gespeichert, Mittellinie = Umrisskante ± 0,25.
   *
   * | Teil | Referenz (Umriss) | Mittellinie |
   * |---|---|---|
   * | Gerät | außen x 9,75…23,25 / y 13,75…19,25, innen x 10,25…22,75 / y 14,25…18,75 | Rechteck 10…23 × 14…19 |
   * | Strahlen | Kappenmitte (29,0002\|11,5), (29,0\|21,5); Neigung 5/12 (dy/dx 0,41664) | (23\|14) → (29\|11,5), (23\|19) → (29\|21,5) |
   * | Wellen | Anfang x 3,0 bei y 15,75…16,25 / 17,75…18,25; Kamm außen 13,75, innen 14,25 bei x 6,5 | Tal (3\|16) → Kamm (6,5\|14) → Tal (10\|16), zweite 2 mm tiefer |
   * | Strich | Kappen- und Kantenabstände 0,4998…0,5004 | 0,5 |
   *
   * Konstruiert gegen die Körpermitte cx = 16 und die Mitte der Marke `maxY − 9,5` (16,5): Die
   * Marke reicht waagerecht von cx − 13 bis cx + 13 (x 3…29, je 2 mm vor der Körperkante), das
   * Gerät von cx − 6 bis cx + 7. Jede Halbwelle ist ein kubischer Bogen mit waagerechten
   * Tangenten und dem Hebel der halben Halbwellenbreite (1,75 mm); die Referenz speichert ihn in
   * zwei Hälften mit dem Wendepunkt (4,75\|15) und den inneren Kontrollpunkten (3,875\|16),
   * (4,3127\|15,5) — genau die Teilung dieses einen Bogens bei t = 0,5. Die Wellen enden in der
   * Mittellinie des Geräts (x 10), der Rechteckstrich deckt das Ende; die Strahlen beginnen in
   * dessen Ecken, ihre Kappen liegen ganz im Rechteckstrich (Umrisskante trifft die Oberkante bei
   * x 22,95).
   *
   * **Keine Verkleinerung der Einzeldarstellung.** 4.7.18 zeichnet das Gerät 14 × 8 mm ab (9|12),
   * die Strahlen nach (30|12) und (30|20) aus (23|15) und (23|17) (Neigung 3/7), die Wellen mit
   * Scheiteln bei x 1, 4,08 und 7,44 (Kamm, Tal, Kamm) und 0,4 mm Strich. Hier: Gerät 13 × 5 mm,
   * Strahlen aus den Geräteecken mit Neigung 5/12, Wellen mit der Phase Tal–Kamm–Tal und
   * 0,5 mm Strich. Die Hülle wächst in der Höhe (8 → 10 mm) und schrumpft in der Breite
   * (29 → 26 mm).
   *
   * C.1.4 (Rüstzug, Formation) trägt dieselbe Marke Maß für Maß, nur 0,5 mm höher: Gerät
   * y 13,5…18,5, also auf der Formationsmitte 16 statt auf `maxY − 9,5`. Diese Fassung steht als
   * eigenes Paar mit der Formation in `formation.ts` (LFH-787) und nutzt dieselbe Konstruktion
   * (`technicalAssistanceMark`).
   */
  'technical-assistance': (bounds) =>
    technicalAssistanceMark((bounds.minX + bounds.maxX) / 2, bounds.maxY - 9.5),
};

/** Anhänger mit Fußband (Hülle x 4…31, y 5,75…26; Band y 23…26). */
const TRAILER_FOOT_BAND_MARKS: MarkTable = {
  /**
   * C.2.30: 4.8.11 Stromversorgung am Anhänger mit Fußband, umgebaut. Gemessen an
   * `C.2.30_Feuerwehr Netzersatzanlage 120 kVA.svg`. Die Referenz speichert den Blitz als Umriss
   * eines **Strichs** von 0,5 mm (Kappe oben (17,7182|9,6216) – (17,2811|9,3779): 0,5004 mm;
   * Kantenabstände der Schenkel 0,4998…0,5004): im Zickzack mit abgeschrägten Ecken (je zwei
   * Umrisspunkte, z. B. (14,2412|14,8381) und (14,5044|15,2057), genau Ecke ± 0,25 senkrecht zu
   * beiden Schenkeln), an der Pfeilspitze gegehrt (ein Umrisspunkt (15,3101|20,8265)).
   *
   * Mittellinien, aus den Umrisskanten geschnitten:
   *
   * | Punkt | gemessen | gezeichnet |
   * |---|---|---|
   * | Anfang oben (Kappenmitte) | (17,4997\|9,4998) | (cx\|minY + 3,75) = (17,5\|9,5) |
   * | erste Ecke | (14,4598\|14,9600) | (cx − 3,04\|14,96) |
   * | zweite Ecke | (19,5396\|14,0401) | (cx + 2,04\|14,04) |
   * | Spitze (Schnitt beider Pfeilschenkel, liegt auf dem dritten Schenkel) | (15,5\|20,5) | (cx − 2\|maxY − 5,5) |
   * | Pfeilschenkel links (Kappenmitte) | (15,0001\|17,9997) | (cx − 2,5\|18) |
   * | Pfeilschenkel rechts (Kappenmitte) | (18,4999\|19,4999) | (cx + 1\|19,5) |
   *
   * Konstruiert gegen die Mitte der Hülle cx = 17,5 (die Blitzspitze oben steht genau darüber);
   * die Pfeilspitze endet 2,5 mm über dem Fußband. Gezeichnet mit dem runden Eckenvertrag der
   * Piktogramme statt der abgeschrägten und gegehrten Ecken der Referenz; der Unterschied bleibt
   * an jeder Ecke unter 0,13 mm.
   *
   * G.4 (`'power-supply'` an der Formation mit Fußband in `body-marks.ts`) zeichnet dieselbe
   * Fähigkeit als gefüllte Umrissfläche; auch dort ist die Referenz der Umriss eines 0,5-mm-Strichs.
   * Hier steht der Strich selbst, damit die Fassung ihre Strichstärke trägt.
   *
   * **Keine Verkleinerung der Einzeldarstellung.** 4.8.11 zeichnet (18|1) → (9,9|16,1) →
   * (22,1|13,9) → (13|31) mit den Pfeilschenkeln nach (12|25) und (19|28,5). Die Schenkel
   * schrumpfen hier ungleich: der obere auf 0,37 × 0,36, der mittlere auf 0,42 × 0,42, der untere
   * auf 0,44 × 0,38 (dx × dy); die Pfeilschenkel sind 2,55 und 3,16 mm lang statt 6,1 und 7,4 mm.
   */
  'power-supply': (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const tip: [number, number] = [um(cx - 2), bounds.maxY - 5.5];
    return [
      {
        type: 'polyline',
        role: 'pictogram',
        points: [
          [cx, bounds.minY + 3.75],
          [um(cx - 3.04), 14.96],
          [um(cx + 2.04), 14.04],
          tip,
        ],
        style: STROKE,
      },
      {
        type: 'polyline',
        role: 'pictogram',
        points: [[um(cx - 2.5), 18], tip, [um(cx + 1), 19.5]],
        style: STROKE,
      },
    ];
  },
};

export const ASSISTANCE_POWER_CONTEXTS: readonly AnhangCContext[] = [
  { kind: 'vehicle-land', marks: VEHICLE_LAND_MARKS },
  { kind: 'trailer', bodyVariant: 'foot-band', marks: TRAILER_FOOT_BAND_MARKS },
];
