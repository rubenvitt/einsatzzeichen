import type { BoundsMm } from '@einsatzzeichen/core';
import {
  CAPABILITY_IDS,
  DEFAULT_STROKE_WIDTH_MM,
  TECHNICAL_BODY_MARK_IDS,
  type BodyMarkId,
  type BodyVariantId,
  type Primitive,
  type StrengthId,
  type SymbolKind,
  type VehicleCategoryId,
} from '@einsatzzeichen/schema';

/**
 * Die **randbündigen** Fassungen der Fähigkeitszeichen aus Kapitel 4 — die Fachdienstteilung des
 * Anhangs F und ihre Zusätze. Sie stehen neben den Piktogrammen aus `pictograms/` und nicht in
 * ihnen: ein Piktogramm trägt eine feste Box (4/8/24/16 mm), diese Zeichnungen tragen die
 * Körperfläche.
 *
 * **Die beiden Fassungen sind nicht ineinander umrechenbar.** Gegenüberstellung der eigenen
 * Vermessung vom 18. August 2026 (Referenzdateien `4.6.x` gegen die zwölf Dateien aus F.1.1 bis
 * F.1.11):
 *
 * | Zeichnung | eigenständig (Kapitel 4) | randbündig (Anhang F) |
 * |---|---|---|
 * | Kreuz | beide Arme 2…30 mm | senkrecht 6…26, waagerecht 1…31 — die Körperkanten |
 * | Arztleiste (4.6.4) | 10 mm breit auf y 24 | **8 mm** breit auf y 22 |
 * | Intensivbalken (4.6.3) | 10 mm hoch auf x 24 | **8 mm** hoch auf x 23,5 |
 * | Transportring (4.6.5) | r ≈ 7 mm | **r 5,5 mm** |
 *
 * Weder ein gemeinsamer Faktor noch eine gemeinsame Marge bildet die linke Spalte auf die rechte
 * ab. Die Zeichnungen sind deshalb aus der Körperhülle gerechnet und nicht aus einer Box
 * skaliert.
 *
 * **Gegen die Mittellinien, nicht gegen die Füllflächen.** Die Referenz zeichnet ihre Striche als
 * Umrisse: die vier weißen Felder von `F.1.11` stehen auf 1,25…15,75 und 16,25…30,75 mm, das ist
 * die Innenkante des 0,5-mm-Strichs auf der Mittellinie 16,0. Wer aus den Feldern autoriert,
 * liegt überall eine Viertelmillimeter daneben.
 */

/**
 * Die vermessene Körperform: das Rechteck 30 × 20 mm der taktischen Formation. Alle Maße dieser
 * Datei stammen von ihr.
 *
 * **Der Wurf ist der Punkt.** Anhang F trägt dieselbe Teilung auf dem Landfahrzeugrumpf (F.2),
 * dem Anhängerrumpf, dem Luftfahrzeug und dem Kreiskörper (F.3) — dort mit **eigenen** Maßen für
 * Leisten und Ring, und mit einer Kante, die keine Hüllenkante ist (der Rumpf ist oben gewölbt).
 * Ein stilles Weiterrechnen dieser Zahlen auf eine andere Hülle behauptete eine Messung, die es
 * nicht gibt.
 */
const BODY_TOLERANCE_MM = 0.01;

const VEHICLE_WATER_INSET_HULL_EXACT_BODY_BOUNDS: Partial<Record<BodyMarkId, BoundsMm>> = {
  'inset-hull-wheel-pair': { minX: 1.01, minY: 9.0001, maxX: 30.9894, maxY: 23.9898 },
  'fire-fighting': { minX: 1.01, minY: 9.0001, maxX: 30.9894, maxY: 23.9898 },
};

const LFH488_EXACT_BODY_BOUNDS: Partial<Record<BodyMarkId, BoundsMm>> = {
  'circle-two-waves-diamond': { minX: 4, minY: 6, maxX: 28, maxY: 30 },
  'circle-diagonal-double-arrow-offset-bowl': { minX: 4, minY: 4, maxX: 28, maxY: 28 },
  'circle-wide-bowl': { minX: 4, minY: 4, maxX: 28, maxY: 28 },
};

function stroke(x1: number, y1: number, x2: number, y2: number): Primitive {
  return {
    type: 'line',
    role: 'pictogram',
    x1,
    y1,
    x2,
    y2,
    style: { stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  };
}

function filledPolygon(points: readonly (readonly [number, number])[]): Primitive {
  return {
    type: 'polyline',
    role: 'pictogram',
    points,
    closed: true,
    style: { fill: 'schwarz', stroke: 'none' },
  };
}

function waterWave(centerXMm: number, baselineYMm: number): Primitive {
  const x = (offsetMm: number) => Number((centerXMm + offsetMm).toFixed(3));
  const y = (offsetMm: number) => Number((baselineYMm + offsetMm).toFixed(3));
  return {
    type: 'path',
    role: 'pictogram',
    d:
      `M ${x(4)} ${y(0)} C ${x(3.604)} ${y(0)} ${x(3.416)} ${y(-0.188)} ` +
      `${x(3.178)} ${y(-0.427)} C ${x(2.923)} ${y(-0.682)} ` +
      `${x(2.605)} ${y(-1)} ${x(2.002)} ${y(-1)} ` +
      `C ${x(1.399)} ${y(-1)} ${x(1.081)} ${y(-0.682)} ` +
      `${x(0.826)} ${y(-0.427)} C ${x(0.587)} ${y(-0.188)} ` +
      `${x(0.399)} ${y(0)} ${x(0.003)} ${y(0)} ` +
      `C ${x(-0.394)} ${y(0)} ${x(-0.583)} ${y(-0.188)} ` +
      `${x(-0.821)} ${y(-0.427)} C ${x(-1.076)} ${y(-0.682)} ` +
      `${x(-1.395)} ${y(-1)} ${x(-1.998)} ${y(-1)} ` +
      `C ${x(-2.602)} ${y(-1)} ${x(-2.92)} ${y(-0.682)} ` +
      `${x(-3.176)} ${y(-0.427)} C ${x(-3.414)} ${y(-0.188)} ` +
      `${x(-3.602)} ${y(0)} ${x(-3.999)} ${y(0)}`,
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  };
}

/**
 * Die Wasserrettungsmarke aus I.1.1 bis I.1.4, als Mittellinienrekonstruktion der beiden
 * 0,5-mm-Wellenbänder und der Rautenkontur. Die Zahlen sind gegen die platzierte Hülle
 * formuliert; sie stammen nicht aus einer Skalierung der Kapitel-4-Standardbox.
 */
function formationTwoWavesDiamond(bounds: BoundsMm): Primitive[] {
  const left = bounds.minX + 11;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const style = {
    fill: 'none',
    stroke: 'schwarz',
    strokeWidth: DEFAULT_STROKE_WIDTH_MM,
  } as const;

  const wave = (startY: number, crestY: number): Primitive => ({
    type: 'path',
    role: 'pictogram',
    d:
      `M ${left} ${startY} C ${left + 1} ${startY} ${left + 1} ${crestY} ${left + 2} ${crestY} ` +
      `C ${left + 3} ${crestY} ${left + 3} ${startY} ${left + 4} ${startY} ` +
      `C ${left + 5} ${startY} ${left + 5} ${crestY} ${left + 6} ${crestY} ` +
      `C ${left + 7} ${crestY} ${left + 7} ${startY} ${left + 8} ${startY}`,
    style,
  });

  return [
    wave(bounds.minY + 5.5, bounds.minY + 4.5),
    wave(bounds.minY + 7.5, bounds.minY + 6.5),
    {
      type: 'polyline',
      role: 'pictogram',
      points: [
        [centerX, bounds.minY + 9],
        [centerX + 4, bounds.minY + 13],
        [centerX, bounds.minY + 17],
        [centerX - 4, bounds.minY + 13],
      ],
      closed: true,
      style,
    },
  ];
}

/**
 * Die Fachdienstteilung: die beiden Mittellinien der Körperhülle, von Kante zu Kante. Gemessen an
 * `F.1.11_Rettungsdienst allgemein.svg` (senkrechter Arm 15,75…16,25 mm um die Mittellinie 16,0
 * über die volle Körperhöhe, waagerechter Arm 15,75…16,25 um 16,0 über die volle Körperbreite)
 * und in derselben Form an allen zehn weiteren geteilten Dateien aus F.1.1 bis F.1.11.
 */
function quartering(bounds: BoundsMm): Primitive[] {
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  return [
    stroke(cx, bounds.minY, cx, bounds.maxY),
    stroke(bounds.minX, cy, bounds.maxX, cy),
  ];
}

/**
 * I.1.9, I.1.10, I.1.11 und I.1.12: Wasserrettung auf der normalen 30 × 20-mm-Formation.
 *
 * Die beiden Wellen wechseln auf den durch die Konturkanten zurückgerechneten Mittellinien
 * zwischen y=12…13 und y=14…15. Das acht Millimeter hohe Rautensignal ist mittig bei (16|20).
 * Die Quelle speichert seine 0,5-mm-Kontur bereits expandiert mit Miter-Spitzen. Der Renderer
 * zeichnet dagegen projektweit Round-Joins; deshalb werden die vier Mittellinienspitzen um
 * 0,1036 mm nach außen kompensiert. So bleiben die sichtbaren Ink-Bounds 11,646…20,354 bzw.
 * 15,646…24,354 mm erhalten. Das unterscheidet sich grundlegend von 4.5.8: dessen 24 × 16-mm-
 * Box führt die Wellen über fast die gesamte Breite und setzt die Raute tiefer.
 */
function formationWaterRescue(bounds: BoundsMm): Primitive[] {
  const dx = bounds.minX - 1;
  const dy = bounds.minY - 6;
  const point = (x: number, y: number) => `${x + dx} ${y + dy}`;
  const outlineStyle = {
    fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM,
  } as const;
  const wave = (middleY: number): Primitive => ({
    type: 'path', role: 'pictogram',
    d: `M ${point(12, middleY + 0.5)} ` +
      `C ${point(13, middleY + 0.5)} ${point(13, middleY - 0.5)} ${point(14, middleY - 0.5)} ` +
      `C ${point(15, middleY - 0.5)} ${point(15, middleY + 0.5)} ${point(16, middleY + 0.5)} ` +
      `C ${point(17, middleY + 0.5)} ${point(17, middleY - 0.5)} ${point(18, middleY - 0.5)} ` +
      `C ${point(19, middleY - 0.5)} ${point(19, middleY + 0.5)} ${point(20, middleY + 0.5)}`,
    style: outlineStyle,
  });
  const roundJoinTipCompensationMm = DEFAULT_STROKE_WIDTH_MM * (Math.SQRT2 - 1) / 2;
  return [
    wave(12.5),
    wave(14.5),
    {
      type: 'polyline', role: 'pictogram',
      points: [
        [12 - roundJoinTipCompensationMm, 20],
        [16, 16 - roundJoinTipCompensationMm],
        [20 + roundJoinTipCompensationMm, 20],
        [16, 24 + roundJoinTipCompensationMm],
        [12 - roundJoinTipCompensationMm, 20],
      ].map(
        ([x, y]) => [x + dx, y + dy] as const,
      ),
      style: outlineStyle,
    },
  ];
}

/**
 * I.1.9 Alternative: Einsatz von Wasserfahrzeugen auf derselben Formation.
 *
 * Der Bootsrumpf misst auf seiner zurückgerechneten Mittellinie 11…21 mm × 15…20 mm; seine
 * expandierten Quell-Ink-Bounds liegen bei 10,75…21,25 mm × 14,75…20,25 mm. Je zwei Wellen
 * stehen links (2…10 mm) und rechts (22…30 mm), zentriert bei y=16 und y=18. Zwischen den
 * fertigen 0,5-mm-Konturen bleiben dadurch je 0,75 mm sichtbar frei; die 4.5.5-Box würde
 * stattdessen Boot und Wellen in eine 24 × 16-mm-Fassung zusammendrängen.
 */
function formationWatercraftOperations(bounds: BoundsMm): Primitive[] {
  const dx = bounds.minX - 1;
  const dy = bounds.minY - 6;
  const point = (x: number, y: number) => `${x + dx} ${y + dy}`;
  const outlineStyle = {
    fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM,
  } as const;
  const wave = (x: number, middleY: number): Primitive => ({
    type: 'path', role: 'pictogram',
    d: `M ${point(x, middleY + 0.5)} ` +
      `C ${point(x + 1, middleY + 0.5)} ${point(x + 1, middleY - 0.5)} ${point(x + 2, middleY - 0.5)} ` +
      `C ${point(x + 3, middleY - 0.5)} ${point(x + 3, middleY + 0.5)} ${point(x + 4, middleY + 0.5)} ` +
      `C ${point(x + 5, middleY + 0.5)} ${point(x + 5, middleY - 0.5)} ${point(x + 6, middleY - 0.5)} ` +
      `C ${point(x + 7, middleY - 0.5)} ${point(x + 7, middleY + 0.5)} ${point(x + 8, middleY + 0.5)}`,
    style: outlineStyle,
  });
  return [
    {
      type: 'path', role: 'pictogram',
      d: `M ${point(11, 15)} C ${point(11, 18)} ${point(13, 20)} ` +
        `${point(16, 20)} C ${point(19, 20)} ${point(21, 18)} ` +
        `${point(21, 15)} Z`,
      style: outlineStyle,
    },
    wave(2, 16), wave(22, 16), wave(2, 18), wave(22, 18),
  ];
}

/**
 * Das Innenzeichen von `cbrn-protection`: zwei gekreuzte „Wattestäbchen" — je ein gerader Schaft
 * mit einem ausgefüllten Kopf am oberen Ende, wobei der Kopf **seitlich** am Schaft hängt und
 * nicht auf dessen Ende sitzt.
 *
 * **Die Bauart stammt aus 4.1.1 und ist dort dieselbe.** Gemessen an
 * `4.1.1_ABC_CBRN-Schutz.svg` (32-mm-Fassung): Köpfe r 3,75 mm um (7,4997|8,4998) und
 * (24,5001|8,4998), Schaftspitzen (7,0002|26,9951) und (25,0004|26,9951), Kreuzungspunkt
 * (16,0002|14,387). Der Lotabstand vom Kopfmittelpunkt auf die Schaftmittellinie ist dort
 * 3,5025 mm gegen r − 0,25 = 3,5, also **die Außenkante des 0,5-mm-Schafts berührt den
 * Kopfkreis** — daran
 * ist die Zeichnung erkennbar, und genau dieselbe Beziehung misst sich in F.1.2 (1,4942 bzw.
 * 1,4977 gegen r − 0,25 = 1,5).
 *
 * **Die F-Fassung ist keine Verkleinerung der 32-mm-Fassung.** Drei Verhältnisse, die eine
 * gemeinsame Skalierung teilen müssten, tun es nicht: r/Kopfabstand 0,2206 gegen 0,2333,
 * Spitzenabstand/Kopfabstand 1,0588 gegen 0,9333, Höhe/Kopfabstand 1,0879 gegen 0,8. Das Zeichen
 * ist für die flache Körperhülle neu gezeichnet worden; die Zahlen unten sind deshalb an F.1.2
 * gemessen und nicht aus Kapitel 4 fortgeschrieben.
 *
 * Gemessen an `F.1.2_Dekontaminationseinheit für Verletzte.svg` (Umriss zurückgerechnet, siehe
 * Herleitung an `cbrn-protection`) und auf die Körpermitte idealisiert:
 *
 * | Größe | gemessen | hier gezeichnet |
 * |---|---|---|
 * | Kopfradius | 1,7500 / 1,7491 | 1,75 |
 * | Kopfmittelpunkte | (12,4139\|14,0586) / (19,9136\|14,0586) | (12,25\|14) / (19,75\|14) |
 * | Schaftspitzen | (12,4137\|20,0587) / (19,4137\|20,0586) | (12,5\|20) / (19,5\|20) |
 * | Kreuzungspunkt | (16,0551\|16,0658) | (16\|16) |
 * | Schaftneigung dx/dy | 0,8412 / 0,9120 | 0,875 |
 *
 * **Die Idealisierung ist eine Entscheidung und steht als Abweichung an der Manifestzeile.** Die
 * Referenz zeichnet ihre beiden Schäfte mit **verschiedener** Neigung — 0,8412 gegen 0,9120, das
 * sind 2,3° —, und aus dieser einen Schiefe folgt jede weitere: die Kopf- und Spitzenlagen
 * ergeben sich aus Neigung, Berührbedingung und den Abständen 2,0 bzw. 4,0 mm zur Kreuzung. Mit
 * der mittleren Neigung 0,8766 ≈ 7/8 fallen die drei Abstände auf runde Zahlen — Kopfabstand
 * 7,5 (gemessen 7,4997), Spitzenabstand 7,0 (gemessen 7,0000), Höhe Kopf → Spitze 6,0 (gemessen
 * 6,0001). Das ist die Zeichnung, die die Quelle meint; der Rest ist ihr Setzfehler von bis zu
 * 0,164 mm. Zum Vergleich: der Näherungsfehler, den `patient-transport` als Exportfehler abtut,
 * ist 0,0124 mm — dreizehnmal kleiner.
 *
 * Der Schaft endet am **Lotfuß** des Kopfmittelpunktes, also genau dort, wo die Außenkante den
 * Kreis berührt: kürzer risse eine Lücke in die Außenkante, länger stünde sie über den Kopf
 * hinaus. Bei Kopfmittelpunkt ±3,75 statt der exakt berührenden ±3,7431 bleibt ein Überstand von
 * 0,0052 mm — bei 420 px auf 32 mm sieben Hundertstel Pixel. Die 3,75 sind gewählt, weil sie den
 * gemessenen Kopfabstand 7,4997 treffen; die exakte Berührung wäre die schlechtere Zahl.
 */
function crossedSwabs(cx: number, cy: number): Primitive[] {
  const headRadiusMm = 1.75;
  const headOffsetXMm = 3.75;
  const headOffsetYMm = 2;
  const tipOffsetXMm = 3.5;
  const tipOffsetYMm = 4;

  return [-1, 1].flatMap((side) => {
    // Gekreuzt: der Kopf links oben gehört zur Spitze rechts unten.
    const headXMm = cx - side * headOffsetXMm;
    const headYMm = cy - headOffsetYMm;
    const tipXMm = cx + side * tipOffsetXMm;
    const tipYMm = cy + tipOffsetYMm;

    const lengthMm = Math.hypot(cx - tipXMm, cy - tipYMm);
    const uX = (cx - tipXMm) / lengthMm;
    const uY = (cy - tipYMm) / lengthMm;
    const alongMm = (headXMm - tipXMm) * uX + (headYMm - tipYMm) * uY;

    return [
      stroke(tipXMm, tipYMm, tipXMm + alongMm * uX, tipYMm + alongMm * uY),
      {
        type: 'circle',
        role: 'pictogram',
        cx: headXMm,
        cy: headYMm,
        r: headRadiusMm,
        style: { fill: 'schwarz', stroke: 'none' },
      } satisfies Primitive,
    ];
  });
}

/**
 * Die Zusatzstriche zur Teilung, je Fähigkeit. Jede Marke ist an den jeweils an ihrer Zeile
 * genannten Anhangsreferenzen gemessen und gegen die Hülle formuliert: die bestehenden F-Marken
 * an den F-Dateien, `fire-fighting` an C.1.1 bis C.1.3.
 */
const MARKS: Partial<Record<BodyMarkId, (bounds: BoundsMm) => Primitive[]>> = {
  'water-rescue': formationWaterRescue,
  'watercraft-operations': formationWatercraftOperations,
  'formation-solid-cap-3mm': (bounds) => [{
    type: 'rect',
    role: 'pictogram',
    x: bounds.minX,
    y: bounds.minY,
    width: bounds.maxX - bounds.minX,
    height: 3,
    style: { fill: 'schwarz', stroke: 'none' },
  }],
  'formation-solid-cap-3.7mm-three-hole-row': (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    return [{
      type: 'rect',
      role: 'pictogram',
      x: bounds.minX,
      y: bounds.minY,
      width: bounds.maxX - bounds.minX,
      height: 3.7,
      style: { fill: 'schwarz', stroke: 'none' },
    }, ...[cx - 5, cx, cx + 5].map((holeCx) => ({
      type: 'circle' as const,
      role: 'pictogram' as const,
      cx: holeCx,
      cy: bounds.minY + 1.75,
      r: 1.5,
      style: { fill: 'weiss' as const, stroke: 'none' as const },
    }))];
  },
  'formation-solid-cap-4mm-three-hole-row': (bounds) => [{
    type: 'rect',
    role: 'pictogram',
    x: bounds.minX,
    y: bounds.minY,
    width: bounds.maxX - bounds.minX,
    height: 4,
    style: { fill: 'schwarz', stroke: 'none' },
  }, ...[11, 16, 21].map((cx) => ({
    type: 'circle' as const,
    role: 'pictogram' as const,
    cx,
    cy: bounds.minY + 1.75,
    r: 1.5,
    style: { fill: 'weiss' as const, stroke: 'none' as const },
  }))],

  /**
   * I.1.5 bis I.1.8: die kompakte, körperbezogene Wasserrettungsfassung — ausdrücklich nicht
   * die 23 mm breite Boxfassung aus 4.5.8. Aus den expandierten 0,5-mm-Konturen ergeben sich
   * zwei 8 mm breite Kubikwellen und die Raute auf den Ankern ±4 mm um die Körpermitte.
   *
   * Die Quellenkoordinaten sind auf drei SVG-Dezimalstellen exportiert. Nach Umrechnung auf
   * 32 mm liegen die zurückgerechneten Mittellinien höchstens 0,002 mm von den hier verwendeten
   * ganzen bzw. halben Millimetern entfernt; diese Exportabweichung wird nicht fortgeschrieben.
   */
  'formation-water-rescue-compact': (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    const miterOffsetMm = 0.353553;
    const wave = (baselineY: number, crestY: number): Primitive => ({
      type: 'path',
      role: 'pictogram',
      d:
        `M ${cx - 4} ${baselineY} ` +
        `C ${cx - 3} ${baselineY} ${cx - 3} ${crestY} ${cx - 2} ${crestY} ` +
        `C ${cx - 1} ${crestY} ${cx - 1} ${baselineY} ${cx} ${baselineY} ` +
        `C ${cx + 1} ${baselineY} ${cx + 1} ${crestY} ${cx + 2} ${crestY} ` +
        `C ${cx + 3} ${crestY} ${cx + 3} ${baselineY} ${cx + 4} ${baselineY}`,
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    });
    return [
      wave(cy - 3.5, cy - 4.5),
      wave(cy - 1.5, cy - 2.5),
      {
        type: 'path',
        role: 'pictogram',
        d:
          `M ${cx - 4 - miterOffsetMm} ${cy + 4} ` +
          `L ${cx} ${cy + 8 + miterOffsetMm} ` +
          `L ${cx + 4 + miterOffsetMm} ${cy + 4} ` +
          `L ${cx} ${cy - miterOffsetMm} Z ` +
          `M ${cx} ${cy + 8 - miterOffsetMm} ` +
          `L ${cx - 4 + miterOffsetMm} ${cy + 4} ` +
          `L ${cx} ${cy + miterOffsetMm} ` +
          `L ${cx + 4 - miterOffsetMm} ${cy + 4} Z`,
        style: { fill: 'schwarz', fillRule: 'evenodd', stroke: 'none' },
      },
    ];
  },

  /** C.1.1 bis C.1.3: die an der Formation vermessene Löschmarke mit zwei rechten Diagonalen. */
  'fire-fighting': (bounds) => {
    const cy = (bounds.minY + bounds.maxY) / 2;
    const branchX = bounds.maxX - 10;
    return [
      stroke(bounds.minX, cy, branchX, cy),
      stroke(branchX, cy, bounds.maxX, bounds.minY),
      stroke(branchX, cy, bounds.maxX, bounds.maxY),
    ];
  },
  /** I.1.1 bis I.1.4: zwei Wellen über einer Raute auf der normalen Formationshülle. */
  'formation-two-waves-diamond': formationTwoWavesDiamond,

  /**
   * I.1.17 bis I.1.20: die kompakte Wasserrettungsmarke der Formation. Gegenüber der
   * eigenständigen Kapitel-4-Fassung bleiben Wellen und Raute bewusst in der unteren
   * Inhaltszone; die Maße sind an den vier I-g-Dateien separat vermessen.
   */
  'formation-water-rescue-lower-zone': (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    return [
      waterWave(cx, bounds.minY + 7.25),
      waterWave(cx, bounds.minY + 9.25),
      {
        ...outline([
          [cx, bounds.minY + 10.646],
          [cx + 3.854, bounds.minY + 14.5],
          [cx, bounds.minY + 18.354],
          [cx - 3.854, bounds.minY + 14.5],
        ]),
        closed: true,
      },
    ];
  },

  /**
   * I.1.13 und I.1.14: eine eigene technische Composite-Marke. Die obere verschmolzene
   * Scheiben-/Schaft-/Klammerkontur und der tiefer gesetzte Wasser-/Rautenteil sind gemeinsam
   * an genau diesen beiden normalen Formationskörpern vermessen. Weder die Kapitel-4-Box noch
   * die höher stehenden Wasserrettungsfassungen aus I-c, I-e oder I-g werden fortgeschrieben.
   */
  'formation-hooked-crossed-disks-over-lowered-wave-diamond': (bounds) => {
    const dx = bounds.minX - 1;
    const dy = bounds.minY - 6;
    const point = (x: number, y: number): string => `${x + dx} ${y + dy}`;
    const ink = { fill: 'schwarz', stroke: 'none' } as const;
    const upperContour = [
      `M ${point(11.83565, 8.150195)}`,
      `C ${point(11.83565, 7.460869)} ${point(12.396212, 6.899955)} ${point(13.085537, 6.899955)}`,
      `C ${point(13.4302, 6.899955)} ${point(13.74276, 7.040007)} ${point(13.96889, 7.26649)}`,
      `L ${point(15.999471, 9.296365)} L ${point(18.030052, 7.26649)}`,
      `C ${point(18.256535, 7.040007)} ${point(18.568742, 6.899955)} ${point(18.913404, 6.899955)}`,
      `C ${point(19.60273, 6.899955)} ${point(20.163291, 7.460869)} ${point(20.163291, 8.150195)}`,
      `C ${point(20.163291, 8.83952)} ${point(19.60273, 9.400434)} ${point(18.913404, 9.400434)}`,
      `C ${point(18.282993, 9.400434)} ${point(17.76547, 8.929478)} ${point(17.680803, 8.321644)}`,
      `L ${point(16.3526, 9.649847)} L ${point(19.249248, 12.546495)} L ${point(19.249248, 11.150206)}`,
      `L ${point(19.749132, 11.150206)} L ${point(19.749132, 13.400214)} L ${point(17.499124, 13.400214)}`,
      `L ${point(17.499124, 12.899977)} L ${point(18.895413, 12.899977)} L ${point(15.999118, 10.003329)}`,
      `L ${point(13.102823, 12.899977)} L ${point(14.499113, 12.899977)} L ${point(14.499113, 13.400214)}`,
      `L ${point(12.249104, 13.400214)} L ${point(12.249104, 11.150206)} L ${point(12.748989, 11.150206)}`,
      `L ${point(12.748989, 12.546495)} L ${point(15.645636, 9.649847)} L ${point(14.317785, 8.321997)}`,
      `C ${point(14.233119, 8.929478)} ${point(13.715596, 9.400434)} ${point(13.085184, 9.400434)}`,
      `C ${point(12.395859, 9.400434)} ${point(11.835297, 8.83952)} ${point(11.835297, 8.150195)} Z`,
    ].join(' ');
    return [
      { type: 'path', role: 'pictogram', d: upperContour, style: ink },
      waterWave(16 + dx, 16 + dy),
      waterWave(16 + dx, 17.6 + dy),
      {
        type: 'path',
        role: 'pictogram',
        d:
          `M ${16 + dx} ${18.283 + dy} L ${19.535 + dx} ${21.818 + dy} ` +
          `L ${16 + dx} ${25.354 + dy} L ${12.464 + dx} ${21.818 + dy} Z ` +
          `M ${16 + dx} ${18.99 + dy} L ${13.171 + dx} ${21.818 + dy} ` +
          `L ${16 + dx} ${24.647 + dy} L ${18.828 + dx} ${21.818 + dy} Z`,
        style: { fill: 'schwarz', fillRule: 'evenodd', stroke: 'none' },
      },
    ];
  },

  /** H.1: die separat vermessene, randbündige Veterinärmarke. */
  veterinary: (bounds) => {
    const { minX, minY, maxX, maxY } = bounds;
    const cx = (minX + maxX) / 2;
    return [outline([
      [minX + 6, minY + 3],
      [minX + 9, minY + 3],
      [cx, maxY - 2.4],
      [maxX - 9, minY + 3],
      [maxX - 6, minY + 3],
    ])];
  },

  /**
   * H.2: Veterinär- und Tierdekontaminationsmarke. Die kompakte linke Anordnung wurde für
   * Anhang H neu konstruiert; sie ist keine Übernahme der Human-Dekontaminationsmarke.
   */
  'h-veterinary-decontamination': (bounds) => {
    const { minX, minY, maxX, maxY } = bounds;
    const cx = (minX + maxX) / 2;
    const ink = { fill: 'schwarz', stroke: 'none' } as const;
    return [
      outline([
        [minX + 8, minY + 3],
        [minX + 11, minY + 3],
        [cx + 2, maxY - 2.4],
        [maxX - 7, minY + 3],
        [maxX - 4, minY + 3],
      ]),
      { type: 'circle', role: 'pictogram', cx: minX + 3.583, cy: maxY - 8, r: 1.25, style: ink },
      { type: 'circle', role: 'pictogram', cx: minX + 9.417, cy: maxY - 8, r: 1.25, style: ink },
      outline([[minX + 4.818, maxY - 7.833], [minX + 9.75, maxY - 3.6]]),
      outline([[minX + 2.75, maxY - 5.25], [minX + 2.75, maxY - 2.75], [minX + 5, maxY - 2.75]]),
      outline([[minX + 8.182, maxY - 7.833], [minX + 3.25, maxY - 3.6]]),
      outline([[minX + 8, maxY - 2.75], [minX + 10.25, maxY - 2.75], [minX + 10.25, maxY - 5.25]]),
    ];
  },

  /** H.3: Veterinär-V mit der eigenständig vermessenen Schlacht-/Untersuchungsmarke links. */
  'h-veterinary-slaughter': (bounds) => {
    const { minX, minY, maxX, maxY } = bounds;
    const cx = (minX + maxX) / 2;
    return [
      outline([
        [minX + 8, minY + 3],
        [minX + 11, minY + 3],
        [cx + 2, maxY - 2.4],
        [maxX - 7, minY + 3],
        [maxX - 4, minY + 3],
      ]),
      {
        type: 'path',
        role: 'pictogram',
        d:
          `M ${minX + 2} ${maxY - 5.25} H ${minX + 14} V ${maxY - 4.75} ` +
          `H ${minX + 5.525} L ${minX + 7.25} ${maxY - 2.64} V ${maxY - 2.25} ` +
          `H ${minX + 2.75} V ${maxY - 2.64} L ${minX + 4.475} ${maxY - 4.75} ` +
          `H ${minX + 2} Z M ${minX + 5} ${maxY - 4.6} ` +
          `L ${minX + 6.5} ${maxY - 2.75} H ${minX + 3.5} Z`,
        style: { fill: 'schwarz', fillRule: 'evenodd', stroke: 'none' },
      },
    ];
  },

  /** 4.6.1 Sanität, Grundzeichen — die Teilung allein. F.1.5, F.1.6, F.1.9, F.1.11. */
  'medical-service': (bounds) => quartering(bounds),

  /**
   * 4.6.4 Arztwesen — Teilung mit waagerechter Leiste im unteren Feld. Gemessen an
   * `F.1.7_Sanitätsgruppe_arztbesetzt.svg`: Leiste 12,0…20,0 mm auf der Mittellinie y 22,0
   * (Strichband 21,75…22,25), also 8 mm breit, mittig zur Körpermitte, 4 mm über der
   * Körperunterkante. `F.1.1` trägt dieselbe Leiste auf denselben Zahlen.
   */
  physician: (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const yMm = bounds.maxY - 4;
    return [...quartering(bounds), stroke(cx - 4, yMm, cx + 4, yMm)];
  },

  /**
   * 4.6.3 Rettungswesen / Intensivmedizin — Teilung mit senkrechtem Balken in der rechten Hälfte.
   * Gemessen an `F.1.10_Schnelleinsatzgruppe Rettungsdienst.svg` und
   * `F.1.11_Rettungsdienst allgemein_Alternative.svg`: Balken 12,0…20,0 mm auf der Mittellinie
   * x 23,5 (Strichband 23,25…23,75), also 8 mm hoch, mittig zur Körpermitte, auf der Mittellinie
   * der rechten Körperhälfte.
   *
   * **Die eigenständige Katalogfassung von 4.6.3 zeigt ein anderes Bild** — zwei Balken bei x 10
   * und x 22 —, und sie weicht damit von ihrer eigenen Referenzdatei ab, die genau **einen**
   * Balken führt (`4.6.3_Rettungswesen_Intensivmedizin.svg`, Balken 23,75…24,25 mm über
   * y 11…21). Dieser Befund gehört zu Kapitel 4 und nicht zu F; er ist hier notiert, damit der
   * eine Balken dieser Fassung nicht für den Fehler gehalten wird.
   */
  'intensive-care': (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    const xMm = (cx + bounds.maxX) / 2;
    return [...quartering(bounds), stroke(xMm, cy - 4, xMm, cy + 4)];
  },

  /**
   * 4.2.1 Betreuung, Grundzeichen — das Zelt: ein Giebel von der Mitte der Körperoberkante zu den
   * beiden unteren Ecken. Gemessen an `F.1.4_Einsatzeinheit.svg`, wo es **neben** der Teilung
   * steht und deren Felder zerschneidet: der linke Schenkel läuft durch (1,5|25,75) und (9,0|15,75),
   * beides Innenkanten des 0,5-mm-Strichs. Zurückgerechnet auf die Mittellinie (waagerechter
   * Versatz 0,25 · sqrt(1 + 0,75²) = 0,3125 mm) sind das (1,1875|25,75) und (8,6875|15,75) — die
   * Gerade durch (1|26) und (16|6), also von der unteren linken Körperecke zur Mitte der
   * Oberkante.
   *
   * **Diese Marke trägt die Teilung nicht mit.** `F.1.3` zeigt das Zelt ohne Kreuz, `F.1.4` mit —
   * ein Zeichen führt beide Marken nebeneinander, statt dass eine die andere enthielte. Jede
   * Marke ist genau ihr Kapitel-4-Zeichen, randbündig; dass `physician` das Kreuz mitbringt,
   * liegt an 4.6.4 und nicht an dieser Datei.
   */
  care: (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    return [
      {
        type: 'polyline',
        role: 'pictogram',
        points: [
          [bounds.minX, bounds.maxY],
          [cx, bounds.minY],
          [bounds.maxX, bounds.maxY],
        ],
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
      },
    ];
  },
  'temporary-accommodation-resting': (bounds) => [
    stroke(bounds.minX + 10, bounds.minY + 8.5, bounds.minX + 10, bounds.minY + 14),
    stroke(bounds.minX + 20, bounds.minY + 8.5, bounds.minX + 20, bounds.minY + 14),
    {
      type: 'path',
      role: 'pictogram',
      d:
        `M ${bounds.minX + 10} ${bounds.minY + 12.75} ` +
        `C ${bounds.minX + 12} ${bounds.minY + 10.5}, ` +
        `${bounds.minX + 18} ${bounds.minY + 10.5}, ` +
        `${bounds.minX + 20} ${bounds.minY + 12.75}`,
      style: {
        fill: 'none',
        stroke: 'schwarz',
        strokeWidth: DEFAULT_STROKE_WIDTH_MM,
      },
    },
    stroke(bounds.minX + 10, bounds.minY + 12.75, bounds.minX + 20, bounds.minY + 12.75),
  ],

  /**
   * 4.6.5 Patiententransport — Teilung mit Ring und Diagonalkreuz um die Körpermitte. Gemessen an
   * `F.1.8_Patiententransportgruppe.svg`: die weißen Viertelfelder enden auf r 5,75 mm um
   * (16|16), die acht Tortenstücke im Ring beginnen auf r 5,2376 — Mittellinie **r 5,5** bei
   * 0,5 mm Strich. Die 0,0124 mm Unterschied zur erwarteten Innenkante 5,25 sind der Fehler der
   * kubischen Kreisnäherung des Exports und keine zweite Zahl.
   *
   * Die acht Speichen sind vier Linien: die beiden Arme der Teilung und zwei Diagonalen unter
   * ±45°. Die Referenz zeichnet den waagerechten Arm links nur bis zum Ring (Rechteck 1,0…10,5 mm
   * auf y 15,75…16,25) — durchgezogen ergibt dasselbe Bild, weil die Speichen im Ring auf
   * derselben Linie liegen.
   */
  'patient-transport': (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    const rMm = 5.5;
    const diagonalMm = (rMm * Math.SQRT2) / 2;
    return [
      ...quartering(bounds),
      {
        type: 'circle',
        role: 'pictogram',
        cx,
        cy,
        r: rMm,
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
      },
      stroke(cx - diagonalMm, cy - diagonalMm, cx + diagonalMm, cy + diagonalMm),
      stroke(cx + diagonalMm, cy - diagonalMm, cx - diagonalMm, cy + diagonalMm),
    ];
  },

  /**
   * 4.1.1 ABC-/CBRN-Schutz, randbündig — **und mit ihm die unterbrochene Fachdienstteilung und
   * die Arztleiste in einem Zug.** Gemessen an
   * `F.1.2_Dekontaminationseinheit für Verletzte.svg`, dem einzigen Zeichen aus F.1.1 bis F.1.11
   * mit dieser Bauart.
   *
   * **Warum das ein Eintrag ist und keine Komposition.** Die drei Bestandteile stehen nicht
   * nebeneinander wie Teilung und Zelt in `F.1.4`, sondern greifen ineinander: die Teilung ist an
   * beiden Armen **unterbrochen**, damit das Innenzeichen frei steht. `physician` zöge beide Arme
   * von Kante zu Kante durch (das ist an F.1.7 und F.1.1 gemessen), und die vier Fenstergrenzen
   * stehen in keiner der beiden Zeichnungen — sie sind eine dritte, eigene Messung. Eine künftige
   * Datei, die dasselbe Innenzeichen **ohne** Teilung führt, muss diesen Eintrag aufteilen; aus
   * ihm herausrechnen lässt es sich nicht.
   *
   * **Die vier Fenstergrenzen**, gemessen am Umriss der Ebene `Takt_Zeichen` (Strichbänder
   * 15,75…16,25 um beide Mittellinien 16,0):
   *
   * | Arm | gezeichnet | Fenster |
   * |---|---|---|
   * | waagerecht, y 16 | x 1…10 und x 22…31 | 10…22, also Mitte ± 6,0 |
   * | senkrecht, x 16 | y 6…14 und y 18…26 | 14…18, also Mitte ± 2,0 |
   *
   * Die beiden Fenster sind verschieden groß, und nur eine der beiden Grenzen folgt der Tinte des
   * Innenzeichens: waagerecht reicht die Tinte von 10,5 bis 21,5, das Fenster steht 0,5 mm — eine
   * Strichbreite — außerhalb davon. Senkrecht steht das Fenster 14…18 **innerhalb** der Tinte
   * (12,25…20,25): der Arm ist deutlich weiter zurückgenommen, als das Zeichen es verlangt.
   * Ableitbar sind die vier Zahlen deshalb nicht.
   *
   * Die Arztleiste ist dieselbe wie bei `physician`: 8 mm breit auf der Mittellinie y 22,0
   * (Strichband 21,75…22,25), x 12,0…20,0. Sie ist an dieser Datei nachgemessen und nicht aus
   * F.1.7 übernommen.
   *
   * **Die Zurückrechnung des Innenzeichens.** Die Referenz führt es als Umriss der Vereinigung
   * von zwei Schäften und zwei Köpfen. Die Kopfkreise stehen als vier kubische Viertelbögen mit
   * Endpunkten auf den 45°-Lagen — nicht auf den Achsenlagen; erkennbar an den Griffen
   * (0,6823|0,6823), die unter 45° und nicht tangential zu einer Achsenlage stehen. Aus zwei
   * gegenüberliegenden Bogenenden (21,1511|12,821) und (21,1511|15,2961) folgt r/√2 = 1,23755 und
   * damit **r = 1,7500**; der tiefste Umrisspunkt (19,9136|15,8076) bestätigt es unabhängig mit
   * 1,7491. Die Griffe messen 0,6823·√2 = 0,9649 gegen die 0,55228·r = 0,9665 der
   * Viertelkreisnäherung — 0,17 % Abweichung, der Fehler des Exports.
   *
   * Die Schaftspitzen liegen als Stumpfkappen der Breite 0,5000 mm vor; ihre Mitten sind
   * (12,4137|20,0587) und (19,4137|20,0586). Die Schaftneigungen folgen aus den langen Kanten
   * (dx/dy 0,8412 bzw. 0,9120), der Kreuzungspunkt (16,0551|16,0658) aus den vier Innenecken der
   * Kreuzung. Die Idealisierung auf die Körpermitte steht an `crossedSwabs`.
   *
   * **Befund an der Quelle:** die Datei heißt „Dekontaminationseinheit", zeigt aber 4.1.1
   * (ABC-/CBRN-Schutz) und nicht 4.1.3 (Dekontaminieren). Der Unterschied der beiden
   * Kapitel-4-Zeichnungen ist das Häkchenpaar an den unteren Schaftenden; in
   * `4.1.3_Dekontaminieren.svg` steht es als `V 20,9998 H 6,5003 V 27,2496 H 12,2506` im Umriss,
   * in F.1.2 fehlt es ersatzlos — dort läuft der Schaft mit einer Stumpfkappe aus. Der Befund
   * steht an der Manifestzeile (`ANHANG_F_A_FINDINGS`).
   */
  'cbrn-protection': (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    const horizontalWindowHalfMm = 6;
    const verticalWindowHalfMm = 2;
    const barYMm = bounds.maxY - 4;
    return [
      stroke(bounds.minX, cy, cx - horizontalWindowHalfMm, cy),
      stroke(cx + horizontalWindowHalfMm, cy, bounds.maxX, cy),
      stroke(cx, bounds.minY, cx, cy - verticalWindowHalfMm),
      stroke(cx, cy + verticalWindowHalfMm, cx, bounds.maxY),
      stroke(cx - 4, barYMm, cx + 4, barYMm),
      ...crossedSwabs(cx, cy),
    ];
  },

  /**
   * F.1.17: gegenüber der Boxfassung 4.8.13 verkleinerte, nach unten versetzte
   * Verpflegungskontur. Die expandierten Quellkonturen belegen eine schwarze 0,5-mm-Linie um
   * die Mittellinienbox 11…20,5 × 11,5…21,5 mm und einen weißen Innenraum. Die lesbaren
   * Kontrollpunkte konstruieren diese C-/Ringtopologie neu; Pfaddaten der Referenzdatei werden
   * nicht übernommen.
   */
  catering: (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2 + 0.5;
    return [
      {
        type: 'path',
        role: 'pictogram',
        d:
          `M ${cx} ${cy - 5} C ${cx - 2.75} ${cy - 5} ${cx - 5} ${cy - 2.75} ` +
          `${cx - 5} ${cy} C ${cx - 5} ${cy + 2.75} ${cx - 2.75} ${cy + 5} ${cx} ${cy + 5} ` +
          `C ${cx + 2} ${cy + 5} ${cx + 3.5} ${cy + 4} ${cx + 4.5} ${cy + 2.25} ` +
          `L ${cx} ${cy} L ${cx + 4.5} ${cy - 2.25} C ${cx + 3.5} ${cy - 4} ` +
          `${cx + 2} ${cy - 5} ${cx} ${cy - 5} Z`,
        style: {
          fill: 'none',
          stroke: 'schwarz',
          strokeWidth: DEFAULT_STROKE_WIDTH_MM,
        },
      },
    ];
  },

  /** F.1.13: Kreis r 7 mm, Mittelpunkt 1 mm unter der Körpermitte. */
  'ring-7mm-offset-down-1mm': (bounds) => [
    {
      type: 'circle',
      role: 'pictogram',
      cx: (bounds.minX + bounds.maxX) / 2,
      cy: (bounds.minY + bounds.maxY) / 2 + 1,
      r: 7,
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    },
  ],

  /** F.1.16: ein gefüllter Winkel über zwei zur Körpermitte gerichteten Dreiecken. */
  'chevron-over-opposed-triangles': (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    const filled = (points: readonly (readonly [number, number])[]): Primitive => ({
      type: 'polyline',
      role: 'pictogram',
      points,
      closed: true,
      style: { fill: 'schwarz', stroke: 'none' },
    });
    return [
      filled([
        [cx, cy],
        [cx - 8, cy - 6],
        [cx - 8, cy - 7.5],
        [cx, cy - 3],
        [cx + 8, cy - 7.5],
        [cx + 8, cy - 6],
      ]),
      filled([[cx, cy + 4], [cx - 8, cy + 6.667], [cx - 8, cy + 1.333]]),
      filled([[cx, cy + 4], [cx + 8, cy + 1.333], [cx + 8, cy + 6.667]]),
    ];
  },

  /**
   * I.1.19: zwei gefüllte, zur Mitte gerichtete Dreiecke in der oberen Inhaltszone. Diese
   * geometrische ID übernimmt ausdrücklich weder die zusätzliche Winkelmarke noch eine
   * fachliche Drohnenbedeutung aus F.1.16.
   */
  'formation-opposed-triangles-top': (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    return [
      filledPolygon([
        [cx, bounds.minY + 3.5],
        [cx - 6.5, bounds.minY + 5.5],
        [cx - 6.5, bounds.minY + 1.5],
      ]),
      filledPolygon([
        [cx + 6.5, bounds.minY + 5.5],
        [cx, bounds.minY + 3.5],
        [cx + 6.5, bounds.minY + 1.5],
      ]),
    ];
  },

  /**
   * I.1.20: ein einzelner gefüllter Winkel in der oberen Inhaltszone. Die getrennte ID hält
   * ihn von der kombinierten F.1.16-Geometrie und deren ungeklärter Fachsemantik fern.
   */
  'formation-chevron-top': (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    return [filledPolygon([
      [cx, bounds.minY + 3.5],
      [cx - 5.333, bounds.minY + 1.25],
      [cx - 5.333, bounds.minY + 2.25],
      [cx, bounds.minY + 5.5],
      [cx + 5.333, bounds.minY + 2.25],
      [cx + 5.333, bounds.minY + 1.25],
    ])];
  },

  /** F.1.21: eigener Ring r 6,5 mm, Dach und eingeschriebenes Dreieck. */
  'ring-6-5mm-offset-down-2mm-with-roof': (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    const outline = (points: readonly (readonly [number, number])[]): Primitive => ({
      type: 'polyline',
      role: 'pictogram',
      points,
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    });
    return [
      outline([[cx - 9, cy - 1], [cx, cy - 8], [cx + 9, cy - 1]]),
      {
        type: 'circle',
        role: 'pictogram',
        cx,
        cy: cy + 2,
        r: 6.5,
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
      },
      outline([[cx - 4.5, cy + 6.5], [cx, cy - 4.5], [cx + 4.5, cy + 6.5]]),
    ];
  },
};

/**
 * Eigenstaendige randbuendige Fassungen am 26 x 26-mm-Personenkoerper aus D.3.
 * Die uebergebene Huelle behaelt die getrennt vermessene Lage: D.3.9 bis D.3.11 liegen auf
 * y=5…31, D.3.12 auf y=3…29. Gleiche Breite und Hoehe sind kein Grund, den Mittelpunkt zu
 * vereinheitlichen.
 */
const PERSON_MARKS: Partial<Record<BodyMarkId, (bounds: BoundsMm) => Primitive[]>> = {
  'fire-fighting': (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    return [
      stroke(bounds.minX, cy, bounds.maxX, cy),
      {
        ...outline([[cx + 9, cy - 4], [cx + 13, cy], [cx + 9, cy + 4], [cx + 5, cy]]),
        closed: true,
      },
    ];
  },
  'medical-service': (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    return [
      stroke(cx, bounds.minY + 5, cx, bounds.maxY),
      stroke(bounds.minX, cy, bounds.maxX, cy),
    ];
  },
  care: (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    return [outline([[cx - 6.5, cy + 6.5], [cx, cy], [cx + 6.5, cy + 6.5]])];
  },
};

/**
 * I.5.1 bis I.5.3: zwei gefüllte, 0,500237-mm hohe Bézier-Wellenbänder und die innere Raute.
 * Die absoluten Exportwerte sind gegen den Mittelpunkt der übergebenen 26-mm-Raute zerlegt;
 * dadurch verschiebt I.5.2/I.5.3 die vollständige Markierung ausschließlich mit ihrer Hülle.
 */
function i5Wave(cxMm: number, cyMm: number, startYFromCenterMm: number): Primitive {
  const coordinate = (value: number): number => Number(value.toFixed(9));
  let xMm = coordinate(cxMm + 3.999955903);
  let yMm = coordinate(cyMm + startYFromCenterMm);
  let previousControlXMm = xMm;
  let previousControlYMm = yMm;
  const commands = [`M ${xMm} ${yMm}`];
  const cubic = (
    control1DxMm: number,
    control1DyMm: number,
    control2DxMm: number,
    control2DyMm: number,
    endDxMm: number,
    endDyMm: number,
  ): void => {
    const control1XMm = coordinate(xMm + control1DxMm);
    const control1YMm = coordinate(yMm + control1DyMm);
    const control2XMm = coordinate(xMm + control2DxMm);
    const control2YMm = coordinate(yMm + control2DyMm);
    xMm = coordinate(xMm + endDxMm);
    yMm = coordinate(yMm + endDyMm);
    previousControlXMm = control2XMm;
    previousControlYMm = control2YMm;
    commands.push(`C ${control1XMm} ${control1YMm} ${control2XMm} ${control2YMm} ${xMm} ${yMm}`);
  };
  const smoothCubic = (
    control2DxMm: number,
    control2DyMm: number,
    endDxMm: number,
    endDyMm: number,
  ): void => {
    const control1XMm = coordinate(2 * xMm - previousControlXMm);
    const control1YMm = coordinate(2 * yMm - previousControlYMm);
    const control2XMm = coordinate(xMm + control2DxMm);
    const control2YMm = coordinate(yMm + control2DyMm);
    xMm = coordinate(xMm + endDxMm);
    yMm = coordinate(yMm + endDyMm);
    previousControlXMm = control2XMm;
    previousControlYMm = control2YMm;
    commands.push(`C ${control1XMm} ${control1YMm} ${control2XMm} ${control2YMm} ${xMm} ${yMm}`);
  };
  const vertical = (dyMm: number): void => {
    yMm = coordinate(yMm + dyMm);
    commands.push(`L ${xMm} ${yMm}`);
  };

  cubic(-0.395815189, 0, -0.583845043, -0.188029854, -0.821969154, -0.426506741);
  cubic(-0.255057381, -0.255762934, -0.572908973, -0.573614526, -1.175803944, -0.573614526);
  smoothCubic(-0.921452116, 0.317851591, -1.176509497, 0.573261749);
  cubic(-0.238476888, 0.238829664, -0.426506741, 0.426859518, -0.823027483, 0.426859518);
  smoothCubic(-0.585256149, -0.188029854, -0.823733036, -0.426859518);
  cubic(-0.255410158, -0.255410158, -0.573614526, -0.573261749, -1.17721505, -0.573261749);
  smoothCubic(-0.921804893, 0.317851591, -1.17721505, 0.573261749);
  cubic(-0.238476888, 0.238829664, -0.426859518, 0.426859518, -0.823733036, 0.426859518);
  vertical(0.500237022);
  cubic(0.603600525, 0, 0.921804893, -0.317851591, 1.17721505, -0.573261749);
  cubic(0.238476888, -0.238829664, 0.426859518, -0.426859518, 0.823733036, -0.426859518);
  smoothCubic(0.585256149, 0.188029854, 0.823733036, 0.426859518);
  cubic(0.255410158, 0.255410158, 0.573614526, 0.573261749, 1.17721505, 0.573261749);
  smoothCubic(0.921452116, -0.317851591, 1.176862274, -0.573261749);
  cubic(0.238476888, -0.238829664, 0.426506741, -0.426859518, 0.823027483, -0.426859518);
  smoothCubic(0.583845043, 0.188029854, 0.821969154, 0.426506741);
  cubic(0.255057381, 0.255762934, 0.572908973, 0.573614526, 1.175803944, 0.573614526);
  vertical(-0.500237022);

  return {
    type: 'path',
    role: 'pictogram',
    d: `${commands.join(' ')} Z`,
    style: { fill: 'schwarz', stroke: 'none' },
  };
}

const PERSON_I5_MARKS: Partial<Record<BodyMarkId, (bounds: BoundsMm) => Primitive[]>> = {
  'double-wave-inner-diamond-8mm': (bounds) => {
    const cxMm = (bounds.minX + bounds.maxX) / 2;
    const cyMm = (bounds.minY + bounds.maxY) / 2;
    return [
      i5Wave(cxMm, cyMm, -5.249842904),
      i5Wave(cxMm, cyMm, -3.250305923),
      {
        type: 'polyline',
        role: 'pictogram',
        closed: true,
        points: [
          [cxMm, cyMm - 1.5],
          [cxMm + 4, cyMm + 2.5],
          [cxMm, cyMm + 6.5],
          [cxMm - 4, cyMm + 2.5],
        ],
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
      },
    ];
  },
};

function outline(points: readonly (readonly [number, number])[]): Primitive {
  return {
    type: 'polyline',
    role: 'pictogram',
    points,
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  };
}

function circleOutline(
  points: readonly (readonly [number, number])[],
  closed = false,
): Primitive {
  return {
    type: 'polyline',
    role: 'pictogram',
    points,
    closed,
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  };
}

function circleRing(cx: number, cy: number, r: number): Primitive {
  return {
    type: 'circle',
    role: 'pictogram',
    cx,
    cy,
    r,
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  };
}

function circlePath(d: string): Primitive {
  return {
    type: 'path',
    role: 'pictogram',
    d,
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  };
}

/**
 * Das Betreuungsmotiv der beiden Kreisfassungen, ausschließlich gegen ihre jeweilige Hülle.
 * Die gleichnamigen Formation-/Fahrzeugfassungen haben andere Maße und rufen diesen Helper nie
 * auf; die Registrygrenze darunter hält diese semantische ID kontextspezifisch fail-closed.
 */
function circleCare(bounds: BoundsMm): Primitive[] {
  const cx = (bounds.minX + bounds.maxX) / 2;
  return [circleOutline([
    [bounds.minX + 4, bounds.minY + 21],
    [cx, bounds.minY],
    [bounds.maxX - 4, bounds.minY + 21],
  ])];
}

/**
 * Die quellenidentische Teilgeometrie aus F.3.10/F.3.18/F.3.19: Raute, unterer Anschlag,
 * Schaft und offene Rechtspfeilspitze. F.3.10 setzt seinen eigenen senkrechten Stamm zwischen
 * Raute und Anschlag ein; dadurch bleiben seine Reihenfolge und sein SVG bytegleich.
 */
function circleDiamondAndLowerArrow(bounds: BoundsMm): Primitive[] {
  const dx = bounds.minX - 4;
  const dy = bounds.minY - 4;
  return [
    circleOutline(
      [
        [16 + dx, 6 + dy],
        [22.5 + dx, 12.5 + dy],
        [16 + dx, 19 + dy],
        [9.5 + dx, 12.5 + dy],
      ],
      true,
    ),
    stroke(9 + dx, 20 + dy, 9 + dx, 24 + dy),
    stroke(9 + dx, 22 + dy, 24 + dx, 22 + dy),
    circleOutline([[22 + dx, 20 + dy], [24 + dx, 22 + dy], [22 + dx, 24 + dy]]),
  ];
}

// `compose()` dedupliziert nur identische Primitive-Referenzen zwischen Markengruppen. Die
// Teilung ist an F.3.2/F.3.4/F.3.5 eine gemeinsame Schicht mehrerer Marken; dieser Cache hält
// genau diese beiden Linien für dieselbe vermessene Körperhülle referenzidentisch.
const CIRCLE_QUARTERING_BY_BOUNDS = new WeakMap<BoundsMm, Primitive[]>();

function circleQuartering(bounds: BoundsMm): Primitive[] {
  const cached = CIRCLE_QUARTERING_BY_BOUNDS.get(bounds);
  if (cached !== undefined) return cached;
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  const primitives = [
    stroke(cx, bounds.minY, cx, bounds.maxY),
    stroke(bounds.minX, cy, bounds.maxX, cy),
  ];
  CIRCLE_QUARTERING_BY_BOUNDS.set(bounds, primitives);
  return primitives;
}

function circleInformationStem(bounds: BoundsMm): Primitive[] {
  const dx = bounds.minX - 4;
  const dy = bounds.minY - 4;
  return [
    {
      type: 'circle', role: 'pictogram', cx: 16 + dx, cy: 10.5 + dy, r: 1.5,
      style: { fill: 'schwarz', stroke: 'none' },
    },
    {
      type: 'rect', role: 'pictogram', x: 15 + dx, y: 14 + dy, width: 2, height: 8,
      style: { fill: 'schwarz', stroke: 'none' },
    },
  ];
}

/**
 * F.3.1 bis F.3.14 und F.3.17 bis F.3.19, am 26. August 2026 je Quelle separat vermessen;
 * I.4.2 und I.4.3 wurden am 27. August 2026 unabhängig ergänzt. Die F.3-Koordinaten werden gegen
 * die 24 × 24-mm-Hülle gerechnet. Die beiden I.4-Marken sind zusätzlich auf die exakte Lage
 * `(4|4)–(28|28)` begrenzt. Keine dieser Geometrien ist aus Formation oder Fahrzeug skaliert;
 * die technischen IDs benennen nur das sichtbare Motiv und behaupten keine zusätzliche
 * Fachsemantik.
 */
const CIRCLE_NORMAL_MARKS: Partial<Record<BodyMarkId, (bounds: BoundsMm) => Primitive[]>> = {
  'medical-service': circleQuartering,
  care: circleCare,
  physician: (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    return [
      ...circleQuartering(bounds),
      stroke(cx - 4, bounds.maxY - 6, cx + 4, bounds.maxY - 6),
    ];
  },
  'circle-patient-staging-arrows': (bounds) => {
    const dx = bounds.minX - 4;
    const dy = bounds.minY - 4;
    return [
      ...circleQuartering(bounds),
      stroke(10 + dx, 10 + dy, 22 + dx, 10 + dy),
      circleOutline([[13 + dx, 7 + dy], [10 + dx, 10 + dy], [13 + dx, 13 + dy]]),
      circleOutline([[19 + dx, 7 + dy], [22 + dx, 10 + dy], [19 + dx, 13 + dy]]),
    ];
  },
  'circle-collection-arrow': (bounds) => {
    const dx = bounds.minX - 4;
    const dy = bounds.minY - 4;
    return [
      stroke(6 + dx, 16 + dy, 21 + dx, 16 + dy),
      circleOutline([[18 + dx, 13 + dy], [21 + dx, 16 + dy], [18 + dx, 19 + dy]]),
      circleRing(23 + dx, 16 + dy, 2),
    ];
  },
  'circle-staging-frame-arrow': (bounds) => {
    const dx = bounds.minX - 4;
    const dy = bounds.minY - 4;
    return [
      circlePath(
        `M ${8 + dx} ${9.5 + dy} C ${10 + dx} ${10.25 + dy}, ` +
        `${13 + dx} ${11 + dy}, ${16 + dx} ${11 + dy} C ${19 + dx} ${11 + dy}, ` +
        `${22 + dx} ${10.25 + dy}, ${24 + dx} ${9.5 + dy} L ${24 + dx} ${19 + dy} ` +
        `L ${8 + dx} ${19 + dy} Z`,
      ),
      stroke(8 + dx, 22 + dy, 20 + dx, 22 + dy),
      circleOutline([[18 + dx, 20 + dy], [20 + dx, 22 + dy], [18 + dx, 24 + dy]]),
      circleRing(21.5 + dx, 22 + dy, 1.5),
    ];
  },
  'circle-staging-frame': (bounds) => {
    const dx = bounds.minX - 4;
    const dy = bounds.minY - 4;
    return [circlePath(
      `M ${8 + dx} ${11 + dy} C ${10 + dx} ${11.75 + dy}, ` +
      `${13 + dx} ${12.5 + dy}, ${16 + dx} ${12.5 + dy} C ${19 + dx} ${12.5 + dy}, ` +
      `${22 + dx} ${11.75 + dy}, ${24 + dx} ${11 + dy} L ${24 + dx} ${21 + dy} ` +
      `L ${8 + dx} ${21 + dy} Z`,
    )];
  },
  'circle-staging-frame-quadrants-arrows': (bounds) => {
    const dx = bounds.minX - 4;
    const dy = bounds.minY - 4;
    return [
      circlePath(
        `M ${8 + dx} ${9.5 + dy} C ${10 + dx} ${10.25 + dy}, ` +
        `${13 + dx} ${11 + dy}, ${16 + dx} ${11 + dy} C ${19 + dx} ${11 + dy}, ` +
        `${22 + dx} ${10.25 + dy}, ${24 + dx} ${9.5 + dy} L ${24 + dx} ${19 + dy} ` +
        `L ${8 + dx} ${19 + dy} Z`,
      ),
      stroke(16 + dx, 11 + dy, 16 + dx, 19 + dy),
      stroke(8 + dx, 14.5 + dy, 24 + dx, 14.5 + dy),
      stroke(8 + dx, 22 + dy, 24 + dx, 22 + dy),
      circleOutline([[10 + dx, 20 + dy], [8 + dx, 22 + dy], [10 + dx, 24 + dy]]),
      circleOutline([[22 + dx, 20 + dy], [24 + dx, 22 + dy], [22 + dx, 24 + dy]]),
    ];
  },
  'circle-diamond-arrow': (bounds) => {
    const dx = bounds.minX - 4;
    const dy = bounds.minY - 4;
    const shared = circleDiamondAndLowerArrow(bounds);
    return [
      // F.3.10: Aus den jeweils gegenüberliegenden Konturseiten des 0,5-mm-Umrisses gemittelt
      // folgen die vier Mittellinienpunkte (16|6), (22,5|12,5), (16|19), (9,5|12,5). Die
      // bequemeren Ganzzahlen 23/13/20/9 lägen auf wechselnden Außenkanten und vergrößerten die
      // Raute um bis zu 1 mm; Anschlag und Pfeil darunter sind davon getrennt vermessen.
      shared[0]!,
      stroke(16 + dx, 6 + dy, 16 + dx, 19 + dy),
      ...shared.slice(1),
    ];
  },
  'circle-cross-ring': (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    const radiusMm = 5.5;
    const diagonalMm = radiusMm / Math.SQRT2;
    return [
      ...circleQuartering(bounds),
      circleRing(cx, cy, radiusMm),
      stroke(cx - diagonalMm, cy - diagonalMm, cx + diagonalMm, cy + diagonalMm),
      stroke(cx + diagonalMm, cy - diagonalMm, cx - diagonalMm, cy + diagonalMm),
    ];
  },
  'circle-double-arrow-lower-v': (bounds) => {
    const dx = bounds.minX - 4;
    const dy = bounds.minY - 4;
    return [
      stroke(16 + dx, 4 + dy, 16 + dx, 22 + dy),
      stroke(9 + dx, 11 + dy, 23 + dx, 11 + dy),
      circleOutline([[11.5 + dx, 8.5 + dy], [9 + dx, 11 + dy], [11.5 + dx, 13.5 + dy]]),
      circleOutline([[20.5 + dx, 8.5 + dy], [23 + dx, 11 + dy], [20.5 + dx, 13.5 + dy]]),
      circleOutline([[9 + dx, 25.75 + dy], [16 + dx, 22 + dy], [23 + dx, 25.75 + dy]]),
    ];
  },
  'circle-information-stem': circleInformationStem,
  'circle-transport-diamond-arrows': (bounds) => {
    const dx = bounds.minX - 4;
    const dy = bounds.minY - 4;
    return [
      ...circleDiamondAndLowerArrow(bounds),
      stroke(16 + dx, 6 + dy, 12 + dx, 19 + dy),
      stroke(16 + dx, 6 + dy, 20 + dx, 19 + dy),
    ];
  },
  'circle-transport-diamond-wheels-arrows': (bounds) => {
    const dx = bounds.minX - 4;
    const dy = bounds.minY - 4;
    return [
      ...circleDiamondAndLowerArrow(bounds),
      circleRing(10.5 + dx, 17.5 + dy, 1.5),
      circleRing(21.5 + dx, 17.5 + dy, 1.5),
    ];
  },
  'circle-diagonal-double-arrow-offset-bowl': (bounds) => {
    const dx = bounds.minX - 4;
    const dy = bounds.minY - 4;
    return [
      stroke(7 + dx, 14 + dy, 18 + dx, 25 + dy),
      circleOutline([[7 + dx, 17 + dy], [7 + dx, 14 + dy], [10 + dx, 14 + dy]]),
      circleOutline([[15 + dx, 25 + dy], [18 + dx, 25 + dy], [18 + dx, 22 + dy]]),
      circlePath(
        `M ${12 + dx} ${13.5 + dy} H ${24 + dx} ` +
        `C ${24 + dx} ${17.5 + dy}, ${22 + dx} ${19.5 + dy}, ${18 + dx} ${19.5 + dy} ` +
        `C ${14 + dx} ${19.5 + dy}, ${12 + dx} ${17.5 + dy}, ` +
        `${12 + dx} ${13.5 + dy} Z`,
      ),
    ];
  },
  'circle-wide-bowl': (bounds) => {
    const dx = bounds.minX - 4;
    const dy = bounds.minY - 4;
    return [circlePath(
      `M ${8 + dx} ${13.5 + dy} H ${24 + dx} ` +
      `C ${24 + dx} ${18.5 + dy}, ${21 + dx} ${21.5 + dy}, ${16 + dx} ${21.5 + dy} ` +
      `C ${11 + dx} ${21.5 + dy}, ${8 + dx} ${18.5 + dy}, ${8 + dx} ${13.5 + dy} Z`,
    )];
  },
};

/** N.2.3: am um 1 mm angehobenen Kreis ist ausschließlich diese eine Marke vermessen. */
const CIRCLE_RAISED_ONE_MM_MARKS: Partial<
  Record<BodyMarkId, (bounds: BoundsMm) => Primitive[]>
> = {
  'circle-information-stem': circleInformationStem,
};

/**
 * F.3.5/F.3.14: semantische Marken, separat gegen den abgesenkten Kreis vermessen. I.4.1 ergänzt
 * seit der unabhängigen Messung vom 27. August 2026 eine technische Marke ausschließlich an der
 * exakten raised-gable-Hülle `(4|6)–(28|30)`.
 */
const CIRCLE_RAISED_GABLE_MARKS: Partial<
  Record<BodyMarkId, (bounds: BoundsMm) => Primitive[]>
> = {
  'medical-service': circleQuartering,
  care: circleCare,
  physician: (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    return [
      ...circleQuartering(bounds),
      stroke(cx - 4, bounds.maxY - 6, cx + 4, bounds.maxY - 6),
    ];
  },
  'circle-two-waves-diamond': (bounds) => {
    const dx = bounds.minX - 4;
    const dy = bounds.minY - 6;
    const wave = (baselineY: number) => circlePath(
      `M ${12 + dx} ${baselineY + dy} ` +
      `C ${13.25 + dx} ${baselineY + dy}, ${13.25 + dx} ${baselineY - 1 + dy}, ` +
      `${14 + dx} ${baselineY - 1 + dy} ` +
      `C ${14.75 + dx} ${baselineY - 1 + dy}, ${14.75 + dx} ${baselineY + dy}, ` +
      `${16 + dx} ${baselineY + dy} ` +
      `C ${17.25 + dx} ${baselineY + dy}, ${17.25 + dx} ${baselineY - 1 + dy}, ` +
      `${18 + dx} ${baselineY - 1 + dy} ` +
      `C ${18.75 + dx} ${baselineY - 1 + dy}, ${18.75 + dx} ${baselineY + dy}, ` +
      `${20 + dx} ${baselineY + dy}`,
    );
    return [
      wave(12.5),
      wave(14.5),
      circleOutline([
        [16 + dx, 16 + dy],
        [20 + dx, 20 + dy],
        [16 + dx, 24 + dy],
        [12 + dx, 20 + dy],
      ], true),
    ];
  },
};

/** F.3.15/F.3.16: ausschließlich an der 28 × 22-mm-Hülle des reduzierten Hauses. */
const REDUCED_HOUSE_MARKS: Partial<Record<BodyMarkId, (bounds: BoundsMm) => Primitive[]>> = {
  'temporary-accommodation-resting': (bounds) => {
    const dx = bounds.minX - 2;
    const dy = bounds.minY - 4;
    return [
      stroke(6 + dx, 12 + dy, 6 + dx, 24 + dy),
      stroke(26 + dx, 12 + dy, 26 + dx, 24 + dy),
      // Die Anker 6/19, 16/14 und 26/19 sind die Mittellinie. Die beiden äußeren Kontrollen
      // treffen die expandierte Originalkontur bei 2048 px mit Alpha-RMSE 0,004656; 15,67 aus
      // dem ersten Anker-Entwurf verfehlte denselben unabhängigen Vergleich mit 0,012109.
      circlePath(
        `M ${6 + dx} ${19 + dy} C ${6 + dx} ${15.708 + dy}, ` +
        `${9.7 + dx} ${14 + dy}, ${16 + dx} ${14 + dy} ` +
        `C ${22.3 + dx} ${14 + dy}, ${26 + dx} ${15.708 + dy}, ${26 + dx} ${19 + dy}`,
      ),
      stroke(6 + dx, 20 + dy, 26 + dx, 20 + dy),
    ];
  },
  hospital: (bounds) => {
    const dx = bounds.minX - 2;
    const dy = bounds.minY - 4;
    return [
      stroke(16 + dx, 10 + dy, 16 + dx, 26 + dy),
      stroke(9 + dx, 14 + dy, 9 + dx, 22 + dy),
      stroke(23 + dx, 14 + dy, 23 + dx, 22 + dy),
      stroke(2 + dx, 18 + dy, 30 + dx, 18 + dy),
    ];
  },
};

// `compose()` behandelt dieselbe Primitive-Referenz in mehreren Markengruppen als bewusst
// gemeinsam genutzte Schicht. Der Cache macht genau die zwei Linien der Landteilung für dieselbe
// platzierte Körperhülle zu solchen Referenzen; separat erzeugte, nur geometrisch gleiche Linien
// bleiben davon unberührt.
const LAND_QUARTERING_BY_BOUNDS = new WeakMap<BoundsMm, Primitive[]>();

function landQuartering(bounds: BoundsMm): Primitive[] {
  const cached = LAND_QUARTERING_BY_BOUNDS.get(bounds);
  if (cached !== undefined) return cached;

  const cx = (bounds.minX + bounds.maxX) / 2;
  const primitives = [
    stroke(cx, bounds.minY + 2.25, cx, bounds.maxY),
    stroke(bounds.minX, bounds.maxY - 10, bounds.maxX, bounds.maxY - 10),
  ];
  LAND_QUARTERING_BY_BOUNDS.set(bounds, primitives);
  return primitives;
}

function landPatientTransport(bounds: BoundsMm): Primitive[] {
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = bounds.maxY - 10;
  const radiusMm = 5;
  const diagonalMm = radiusMm / Math.SQRT2;
  return [
    ...landQuartering(bounds),
    {
      type: 'circle',
      role: 'pictogram',
      cx,
      cy,
      r: radiusMm,
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    },
    stroke(cx - diagonalMm, cy - diagonalMm, cx + diagonalMm, cy + diagonalMm),
    stroke(cx + diagonalMm, cy - diagonalMm, cx - diagonalMm, cy + diagonalMm),
  ];
}

const VEHICLE_LAND_PLAIN_WHEEL_PAIR_MARKS: Partial<
  Record<BodyMarkId, (bounds: BoundsMm) => Primitive[]>
> = {
  'medical-service': landQuartering,
  physician: (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    return [...landQuartering(bounds), stroke(cx - 4, bounds.maxY - 4, cx + 4, bounds.maxY - 4)];
  },
  'intensive-care': (bounds) => {
    const cy = bounds.maxY - 10;
    return [...landQuartering(bounds), stroke(bounds.maxX - 5.5, cy - 4, bounds.maxX - 5.5, cy + 4)];
  },
  'patient-transport': landPatientTransport,
  'top-center-rect-0-5x0-6mm': (bounds) => [{
    type: 'rect',
    role: 'pictogram',
    x: (bounds.minX + bounds.maxX) / 2 - 0.25,
    y: bounds.minY + 2.5,
    width: 0.5,
    height: 0.6,
    style: { fill: 'schwarz', stroke: 'none' },
  }],
};

function landCare(bounds: BoundsMm, bottomYMm: number): Primitive[] {
  const cx = (bounds.minX + bounds.maxX) / 2;
  return [outline([
    [bounds.minX, bottomYMm],
    [cx, bounds.minY + 2.25],
    [bounds.maxX, bottomYMm],
  ])];
}

function landFourWayStem(bounds: BoundsMm): Primitive[] {
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = bounds.maxY - 7;
  return [
    {
      type: 'circle',
      role: 'pictogram',
      cx,
      cy,
      r: 6,
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    },
    stroke(cx - 4, cy - 2, cx + 4, cy - 2),
    stroke(cx, cy - 4, cx, cy + 4),
    outline([[cx - 2, cy - 4], [cx - 4, cy - 2], [cx - 2, cy]]),
    outline([[cx + 2, cy - 4], [cx + 4, cy - 2], [cx + 2, cy]]),
    outline([[cx - 2, cy + 5], [cx, cy + 4], [cx + 2, cy + 5]]),
  ];
}

function landShiftedEightSpokes(bounds: BoundsMm): Primitive[] {
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = bounds.maxY - 7;
  const radiusMm = 5;
  const diagonalMm = radiusMm / Math.SQRT2;
  return [
    {
      type: 'circle',
      role: 'pictogram',
      cx,
      cy,
      r: radiusMm,
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    },
    stroke(cx - radiusMm, cy, cx + radiusMm, cy),
    stroke(cx, cy - radiusMm, cx, cy + radiusMm),
    stroke(cx - diagonalMm, cy - diagonalMm, cx + diagonalMm, cy + diagonalMm),
    stroke(cx + diagonalMm, cy - diagonalMm, cx - diagonalMm, cy + diagonalMm),
  ];
}

function landMealPreparation(bounds: BoundsMm): Primitive[] {
  const dxMm = bounds.minX - 1;
  const dyMm = bounds.minY - 5.75;
  return [
    {
      // Die Quelle führt keine Kreis-plus-Rechteck-Abkürzung, sondern eine asymmetrische
      // Löffelsilhouette. Ihre vier Tintenkanten sind 12,113991/14,2678/13,886340/21,600150 mm.
      type: 'path', role: 'pictogram',
      d:
        `M ${13.88634 + dxMm} ${15.563792 + dyMm} ` +
        `C ${13.88634 + dxMm} ${15.965957 + dyMm}, ` +
        `${13.646805 + dxMm} ${16.24712 + dyMm}, ` +
        `${13.391747 + dxMm} ${16.400225 + dyMm} ` +
        `L ${13.391747 + dxMm} ${21.200101 + dyMm} ` +
        `C ${13.391747 + dxMm} ${21.442812 + dyMm}, ` +
        `${13.214653 + dxMm} ${21.60015 + dyMm}, ` +
        `${13.000165 + dxMm} ${21.60015 + dyMm} ` +
        `L ${13.000165 + dxMm} ${14.2678 + dyMm} ` +
        `C ${13.510986 + dxMm} ${14.2678 + dyMm}, ` +
        `${13.88634 + dxMm} ${14.680792 + dyMm}, ` +
        `${13.88634 + dxMm} ${15.563792 + dyMm} Z ` +
        `M ${13.000165 + dxMm} ${14.2678 + dyMm} ` +
        `L ${13.000165 + dxMm} ${21.60015 + dyMm} ` +
        `C ${12.785677 + dxMm} ${21.60015 + dyMm}, ` +
        `${12.608583 + dxMm} ${21.442459 + dyMm}, ` +
        `${12.608583 + dxMm} ${21.200101 + dyMm} ` +
        `L ${12.608583 + dxMm} ${16.400225 + dyMm} ` +
        `C ${12.353879 + dxMm} ${16.24712 + dyMm}, ` +
        `${12.113991 + dxMm} ${15.965957 + dyMm}, ` +
        `${12.113991 + dxMm} ${15.563792 + dyMm} ` +
        `C ${12.113991 + dxMm} ${14.681145 + dyMm}, ` +
        `${12.488992 + dxMm} ${14.2678 + dyMm}, ` +
        `${13.000165 + dxMm} ${14.2678 + dyMm} Z`,
      style: { fill: 'schwarz', stroke: 'none' },
    },
    {
      // Mittelpunkt (18|18), Außen-/Innenradius 3,7496/3,2501 mm: die Mittellinie ist r 3,5.
      // Die vier Kubiken und beide Keilübergänge sind Punkt für Punkt aus dem arithmetischen
      // Mittel der äußeren und inneren Quellkontur rekonstruiert, nicht aus dem alten r=3,75-Pfad.
      type: 'path', role: 'pictogram',
      d:
        `M ${21.068339 + dxMm} ${16.327377 + dyMm} ` +
        `C ${20.454508 + dxMm} ${15.197434 + dyMm}, ` +
        `${19.289464 + dxMm} ${14.500347 + dyMm}, ` +
        `${18.000243 + dxMm} ${14.500347 + dyMm} ` +
        `C ${16.070379 + dxMm} ${14.500347 + dyMm}, ` +
        `${14.500171 + dxMm} ${16.070732 + dyMm}, ` +
        `${14.500171 + dxMm} ${18.000419 + dyMm} ` +
        `C ${14.500171 + dxMm} ${19.930106 + dyMm}, ` +
        `${16.070379 + dxMm} ${21.500138 + dyMm}, ` +
        `${18.000243 + dxMm} ${21.500138 + dyMm} ` +
        `C ${19.269532 + dxMm} ${21.500138 + dyMm}, ` +
        `${20.425404 + dxMm} ${20.819808 + dyMm}, ` +
        `${21.045233 + dxMm} ${19.716853 + dyMm} ` +
        `L ${18 + dxMm} ${18 + dyMm} Z`,
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    },
  ];
}

function landDrinkingWater(bounds: BoundsMm): Primitive[] {
  const dxMm = bounds.minX - 1;
  const dyMm = bounds.minY - 5.75;
  return [
    stroke(18 + dxMm, 15.5 + dyMm, 18 + dxMm, 18.5 + dyMm),
    stroke(16.5 + dxMm, 15.5 + dyMm, 19.5 + dxMm, 15.5 + dyMm),
    {
      type: 'path', role: 'pictogram',
      d:
        `M ${11 + dxMm} ${17.5 + dyMm} L ${19.1 + dxMm} ${17.5 + dyMm} ` +
        `C ${20.995 + dxMm} ${17.5 + dyMm}, ${22 + dxMm} ${18.505 + dyMm}, ` +
        `${22 + dxMm} ${20.4 + dyMm} L ${22 + dxMm} ${20.5 + dyMm}`,
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    },
  ];
}

const VEHICLE_LAND_NORMAL_MARKS: Partial<
  Record<BodyMarkId, (bounds: BoundsMm) => Primitive[]>
> = {
  care: (bounds) => landCare(bounds, bounds.maxY),
  'ring-6mm-offset-down-3mm-four-way-stem': landFourWayStem,
  'ring-5mm-offset-down-3mm-eight-spokes': landShiftedEightSpokes,
  'ring-5mm-offset-down-3-5mm-eight-spokes': (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = bounds.maxY - 6.5;
    const rMm = 5;
    const diagonalMm = rMm / Math.SQRT2;
    return [
      circleRing(cx, cy, rMm),
      stroke(cx - rMm, cy, cx + rMm, cy),
      stroke(cx, cy - rMm, cx, cy + rMm),
      stroke(cx - diagonalMm, cy - diagonalMm, cx + diagonalMm, cy + diagonalMm),
      stroke(cx + diagonalMm, cy - diagonalMm, cx - diagonalMm, cy + diagonalMm),
    ];
  },
};

function waterRescueWave(d: string): Primitive {
  return {
    type: 'path', role: 'pictogram', d,
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  };
}

function waterRescueDiamond(
  points: readonly (readonly [number, number])[],
): Primitive {
  return {
    type: 'polyline', role: 'pictogram', points, closed: true,
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  };
}

/**
 * I.2.1 bis I.2.3: zwei getrennt vermessene Wasserrettungsfassungen auf derselben normalen
 * Landfahrzeughülle. Die drei sichtbaren Räder von I.2.1 wählen Kategorie 2; die beiden äußeren
 * Räder von I.2.2/I.2.3 Kategorie 1. Die Kategorie ist hier kein Größenfaktor: sie ist der
 * vorhandene semantische Kontext, der die beiden konkret belegten Zeichnungen fail-closed trennt.
 */
const VEHICLE_LAND_WATER_RESCUE_MARKS: Partial<
  Record<VehicleCategoryId, (bounds: BoundsMm) => Primitive[]>
> = {
  'kfz-kategorie-2': (bounds) => {
    const dx = bounds.minX - 1;
    const dy = bounds.minY - 5.75;
    return [
      waterRescueWave(
        `M ${12 + dx} ${12 + dy} C ${13 + dx} ${11 + dy}, ${14 + dx} ${13 + dy}, ` +
        `${15 + dx} ${12 + dy} C ${16 + dx} ${11 + dy}, ${17 + dx} ${13 + dy}, ` +
        `${18 + dx} ${12 + dy} C ${18.667 + dx} ${11.333 + dy}, ` +
        `${19.333 + dx} ${11.333 + dy}, ${20 + dx} ${12 + dy}`,
      ),
      waterRescueWave(
        `M ${12 + dx} ${14 + dy} C ${13 + dx} ${13 + dy}, ${14 + dx} ${15 + dy}, ` +
        `${15 + dx} ${14 + dy} C ${16 + dx} ${13 + dy}, ${17 + dx} ${15 + dy}, ` +
        `${18 + dx} ${14 + dy} C ${18.667 + dx} ${13.333 + dy}, ` +
        `${19.333 + dx} ${13.333 + dy}, ${20 + dx} ${14 + dy}`,
      ),
      waterRescueDiamond([
        [16 + dx, 16 + dy], [20 + dx, 20 + dy],
        [16 + dx, 24 + dy], [12 + dx, 20 + dy],
      ]),
    ];
  },
  'kfz-kategorie-1': (bounds) => {
    const dx = bounds.minX - 1;
    const dy = bounds.minY - 5.75;
    return [
      waterRescueWave(
        `M ${12.818 + dx} ${14.5 + dy} C ${13.614 + dx} ${13.704 + dy}, ` +
        `${14.409 + dx} ${15.296 + dy}, ${15.205 + dx} ${14.5 + dy} ` +
        `C ${16 + dx} ${13.704 + dy}, ${16.796 + dx} ${15.296 + dy}, ` +
        `${17.591 + dx} ${14.5 + dy} C ${18.121 + dx} ${13.97 + dy}, ` +
        `${18.652 + dx} ${13.97 + dy}, ${19.182 + dx} ${14.5 + dy}`,
      ),
      waterRescueWave(
        `M ${12.818 + dx} ${16.25 + dy} C ${13.614 + dx} ${15.454 + dy}, ` +
        `${14.409 + dx} ${17.046 + dy}, ${15.205 + dx} ${16.25 + dy} ` +
        `C ${16 + dx} ${15.454 + dy}, ${16.796 + dx} ${17.046 + dy}, ` +
        `${17.591 + dx} ${16.25 + dy} C ${18.121 + dx} ${15.72 + dy}, ` +
        `${18.652 + dx} ${15.72 + dy}, ${19.182 + dx} ${16.25 + dy}`,
      ),
      waterRescueDiamond([
        [16 + dx, 17.636 + dy], [19.182 + dx, 20.818 + dy],
        [16 + dx, 24 + dy], [12.818 + dx, 20.818 + dy],
      ]),
    ];
  },
};

const VEHICLE_LAND_INVERTED_HULL_MARKS: Partial<
  Record<BodyMarkId, (bounds: BoundsMm) => Primitive[]>
> = {
  'land-horizontal-blade-bent-upright': (bounds) => {
    const dxMm = bounds.minX - 1;
    const dyMm = bounds.minY - 6;
    return [
      stroke(6 + dxMm, 14.75 + dyMm, 20.75 + dxMm, 14.75 + dyMm),
      outline([
        [20.75 + dxMm, 9.5 + dyMm],
        [20.75 + dxMm, 18.5 + dyMm],
        [26 + dxMm, 19.5 + dyMm],
      ]),
    ];
  },
};

const VEHICLE_LAND_FOOT_BAND_MARKS: Partial<
  Record<BodyMarkId, (bounds: BoundsMm) => Primitive[]>
> = {
  care: (bounds) => landCare(bounds, bounds.maxY - 3),
  'meal-preparation': landMealPreparation,
  'drinking-water': landDrinkingWater,
};

function logisticsFuels(bounds: BoundsMm, topYMm = 9, bottomYMm = 21): Primitive[] {
  const cx = (bounds.minX + bounds.maxX) / 2;
  return [{
    type: 'path', role: 'pictogram',
    d:
      `M ${cx - 5} ${topYMm} H ${cx + 5} L ${cx + 1.5} ${topYMm + 5} ` +
      `V ${bottomYMm} M ${cx - 1.5} ${bottomYMm} V ${topYMm + 5} ` +
      `L ${cx - 5} ${topYMm}`,
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  }];
}

/** G.2: eigener Logistik-Wasserhahn; die kleinere F.2.15-Fahrzeugfassung bleibt separat. */
function logisticsDrinkingWater(): Primitive[] {
  return [
    stroke(20, 11, 20, 16),
    stroke(18, 11, 22, 11),
    {
      type: 'path',
      role: 'pictogram',
      d: 'M 7 14 H 23 C 24.657 14 26 15.343 26 17 V 18',
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    },
  ];
}

function logisticsCatering(bounds: BoundsMm, shiftYMm = 0, shiftXMm = 0): Primitive[] {
  const cx = (bounds.minX + bounds.maxX) / 2 + shiftXMm;
  const cy = 15 + shiftYMm;
  return [{
    type: 'path', role: 'pictogram',
    d:
      `M ${cx} ${cy - 5} C ${cx - 2.75} ${cy - 5} ${cx - 5} ${cy - 2.75} ` +
      `${cx - 5} ${cy} C ${cx - 5} ${cy + 2.75} ${cx - 2.75} ${cy + 5} ${cx} ${cy + 5} ` +
      `C ${cx + 2} ${cy + 5} ${cx + 3.5} ${cy + 4} ${cx + 4.5} ${cy + 2.25} ` +
      `L ${cx} ${cy} L ${cx + 4.5} ${cy - 2.25} C ${cx + 3.5} ${cy - 4} ` +
      `${cx + 2} ${cy - 5} ${cx} ${cy - 5} Z`,
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  }];
}

/**
 * G.7/G.2.1/G.2.2/G.3.4: durchgehende Mittellinie zwischen zwei offenen 3-mm-Endbögen. Der
 * Kreis-Kontext liegt 0,5 mm tiefer; die übrigen Profile teilen y=15.
 */
function logisticsMaintenance(bounds: BoundsMm, centerYMm = 15): Primitive[] {
  const cx = (bounds.minX + bounds.maxX) / 2;
  return [{
    type: 'path', role: 'pictogram',
    d:
      `M ${cx - 9} ${centerYMm - 3} ` +
      `C ${cx - 7.343} ${centerYMm - 3} ${cx - 6} ${centerYMm - 1.657} ${cx - 6} ${centerYMm} ` +
      `H ${cx + 6} ` +
      `C ${cx + 6} ${centerYMm - 1.657} ${cx + 7.343} ${centerYMm - 3} ${cx + 9} ${centerYMm - 3} ` +
      `M ${cx - 9} ${centerYMm + 3} ` +
      `C ${cx - 7.343} ${centerYMm + 3} ${cx - 6} ${centerYMm + 1.657} ${cx - 6} ${centerYMm} ` +
      `M ${cx + 6} ${centerYMm} ` +
      `C ${cx + 6} ${centerYMm + 1.657} ${cx + 7.343} ${centerYMm + 3} ${cx + 9} ${centerYMm + 3}`,
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  }];
}

/**
 * G.8: Mülltonne aus sechs getrennten Mittellinien-Primitiven. Griff y=7 und Deckel y=8 stehen
 * oberhalb des Behälters; die frühere Trapezabkürzung ab y=11 ließ beide sichtbaren Teile aus.
 */
function logisticsWasteDisposal(): Primitive[] {
  return [
    stroke(14, 7, 18, 7),
    stroke(10, 8, 22, 8),
    {
      type: 'path',
      role: 'pictogram',
      d: 'M 11.5 8 V 19 C 11.5 19.552 11.948 20 12.5 20 H 19.5 ' +
        'C 20.052 20 20.5 19.552 20.5 19 V 8',
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    },
    stroke(13.5, 10, 13.5, 18),
    stroke(16, 10, 16, 18),
    stroke(18.5, 10, 18.5, 18),
  ];
}

/**
 * Die große G-Löffelsilhouette, rekonstruiert aus G.6/G.3.2/G.2.3. Sie ist nicht die kleinere
 * F.2.13-Silhouette: Kopfbreite 3 mm statt 1,772 mm, Unterkante y=20 statt y=21,60015.
 */
function logisticsSpoon(cx: number): Primitive {
  return {
    type: 'path',
    role: 'pictogram',
    d:
      `M ${cx - 0.7} 12.86 C ${cx - 0.573} 12.953 ${cx - 0.5} 13.103 ${cx - 0.5} 13.26 ` +
      `V 19.5 C ${cx - 0.5} 19.776 ${cx - 0.276} 20 ${cx} 20 ` +
      `C ${cx + 0.276} 20 ${cx + 0.5} 19.776 ${cx + 0.5} 19.5 V 13.26 ` +
      `C ${cx + 0.5} 13.103 ${cx + 0.573} 12.953 ${cx + 0.7} 12.86 ` +
      `C ${cx + 1.164} 12.521 ${cx + 1.5} 12.139 ${cx + 1.5} 11.5 ` +
      `C ${cx + 1.5} 10.262 ${cx + 0.846} 9.5 ${cx} 9.5 ` +
      `C ${cx - 0.846} 9.5 ${cx - 1.5} 10.262 ${cx - 1.5} 11.5 ` +
      `C ${cx - 1.5} 12.139 ${cx - 1.164} 12.521 ${cx - 0.7} 12.86 Z`,
    style: { fill: 'schwarz', stroke: 'none' },
  };
}

/**
 * Löffel und Schüssel behalten ihre je Körperprofil vermessenen horizontalen Abstände zur
 * Körpermitte. Formation und Kreis teilen -5/+3 mm; der Anhänger führt -5,5/+2,5 mm.
 */
function logisticsMealPreparation(
  bounds: BoundsMm,
  spoonCenterFromBodyCenterMm: number,
  bowlCenterFromBodyCenterMm: number,
): Primitive[] {
  const bodyCenterXMm = (bounds.minX + bounds.maxX) / 2;
  return [
    logisticsSpoon(bodyCenterXMm + spoonCenterFromBodyCenterMm),
    ...logisticsCatering(bounds, 0, bowlCenterFromBodyCenterMm),
  ];
}

const FORMATION_FOOT_BAND_LOGISTICS_MARKS: Partial<
  Record<BodyMarkId, (bounds: BoundsMm) => Primitive[]>
> = {
  'fuels-consumables': logisticsFuels,
  'drinking-water': logisticsDrinkingWater,
  'water-conveyance': () => [{
      type: 'path', role: 'pictogram',
      d:
        'M 5 16 C 7.125 16 8.375 12 10.5 12 C 12.625 12 13.875 16 16 16 ' +
        'C 18.125 16 19.375 12 21.5 12 C 23.625 12 24.875 16 27 16',
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    }],
  'power-supply': () => [{
    type: 'polyline',
    role: 'pictogram',
    points: [
      [17.083, 13.387], [14.027, 19.394], [13.232, 17.406], [12.768, 17.592],
      [13.861, 20.324], [16.593, 19.231], [16.407, 18.767], [14.524, 19.52],
      [17.762, 13.152], [17.49, 12.794], [13.417, 13.612], [16.222, 8.113],
      [15.777, 7.886], [12.737, 13.846], [13.009, 14.205], [17.083, 13.387],
    ],
    style: { fill: 'schwarz', stroke: 'none' },
  }],
  catering: (bounds) => logisticsCatering(bounds),
  'meal-preparation': (bounds) => logisticsMealPreparation(bounds, -5, 3),
  maintenance: logisticsMaintenance,
  'waste-disposal': logisticsWasteDisposal,
};

const TRAILER_FOOT_BAND_LOGISTICS_MARKS: Partial<
  Record<BodyMarkId, (bounds: BoundsMm) => Primitive[]>
> = {
  maintenance: logisticsMaintenance,
  'meal-preparation': (bounds) => logisticsMealPreparation(bounds, -5.5, 2.5),
};

const CIRCLE_FOOT_BAND_LOGISTICS_MARKS: Partial<
  Record<BodyMarkId, (bounds: BoundsMm) => Primitive[]>
> = {
  catering: (bounds) => logisticsCatering(bounds),
  'meal-preparation': (bounds) => logisticsMealPreparation(bounds, -5, 3),
  'fuels-consumables': logisticsFuels,
  maintenance: (bounds) => logisticsMaintenance(bounds, 15.5),
};

function airQuartering(bounds: BoundsMm): Primitive[] {
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = bounds.maxY;
  const radiusMm = (bounds.maxX - bounds.minX) / 2;
  const horizontalYMm = bounds.minY + 8;
  const halfChordMm = Math.sqrt(radiusMm ** 2 - (horizontalYMm - cy) ** 2);
  return [
    stroke(cx, bounds.minY, cx, bounds.maxY),
    stroke(
      Number((cx - halfChordMm).toFixed(2)),
      horizontalYMm,
      Number((cx + halfChordMm).toFixed(2)),
      horizontalYMm,
    ),
  ];
}

const VEHICLE_AIR_MARKS: Partial<Record<BodyMarkId, (bounds: BoundsMm) => Primitive[]>> = {
  'medical-service': airQuartering,
  physician: (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    return [...airQuartering(bounds), stroke(cx - 4, bounds.minY + 11.75, cx + 4, bounds.minY + 11.75)];
  },
  'air-winch-chevron-diamond': (bounds) => {
    const dxMm = bounds.minX - 1.01;
    const dyMm = bounds.minY - 6;
    const shifted = (points: readonly (readonly [number, number])[]) =>
      points.map(([xMm, yMm]) => [xMm + dxMm, yMm + dyMm] as const);
    return [
      stroke(24 + dxMm, 9.65 + dyMm, 24 + dxMm, 15.9 + dyMm),
      outline(shifted([[21.82, 11.82], [24, 9.65], [26.18, 11.82]])),
      outline(shifted([[24, 15.9], [26.35, 18], [24, 19.65], [21.65, 18], [24, 15.9]])),
    ];
  },
  'air-quartering-up-arrow-box': (bounds) => {
    const dxMm = bounds.minX - 1.01;
    const dyMm = bounds.minY - 6;
    return [
      ...airQuartering(bounds),
      stroke(23 + dxMm, 14 + dyMm, 23 + dxMm, 9.5 + dyMm),
      outline([[21.5 + dxMm, 11 + dyMm], [23 + dxMm, 9.5 + dyMm], [24.5 + dxMm, 11 + dyMm]]),
      {
        type: 'rect', role: 'pictogram', x: 20.25 + dxMm, y: 15 + dyMm,
        width: 5.5, height: 5.5,
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
      },
    ];
  },
};

const VEHICLE_AIR_FIXED_WING_MARKS: Partial<
  Record<BodyMarkId, (bounds: BoundsMm) => Primitive[]>
> = {
  'air-horizontal-left-chevron': (bounds) => {
    const dxMm = bounds.minX - 1.01;
    const dyMm = bounds.minY - 6;
    return [
      stroke(7 + dxMm, 15 + dyMm, 25 + dxMm, 15 + dyMm),
      outline([[24 + dxMm, 11 + dyMm], [20 + dxMm, 15 + dyMm], [24 + dxMm, 19 + dyMm]]),
    ];
  },
  'air-rising-diagonal': (bounds) => {
    const dxMm = bounds.minX - 1.01;
    const dyMm = bounds.minY - 6;
    return [stroke(2.07 + dxMm, 20.74 + dyMm, 24.96 + dxMm, 9.3 + dyMm)];
  },
};

function spontaneousHelperClover(dxMm = 0, dyMm = 0): Primitive {
  return {
    type: 'path', role: 'pictogram',
    d: `M ${13 + dxMm} ${10 + dyMm} C ${13 + dxMm} ${8.3431 + dyMm}, ${14.3431 + dxMm} ${7 + dyMm}, ${16 + dxMm} ${7 + dyMm} C ${17.6569 + dxMm} ${7 + dyMm}, ${19 + dxMm} ${8.3431 + dyMm}, ${19 + dxMm} ${10 + dyMm} C ${20.6569 + dxMm} ${10 + dyMm}, ${22 + dxMm} ${11.3431 + dyMm}, ${22 + dxMm} ${13 + dyMm} C ${22 + dxMm} ${14.6569 + dyMm}, ${20.6569 + dxMm} ${16 + dyMm}, ${19 + dxMm} ${16 + dyMm} C ${19 + dxMm} ${17.6569 + dyMm}, ${17.6569 + dxMm} ${19 + dyMm}, ${16 + dxMm} ${19 + dyMm} C ${14.3431 + dxMm} ${19 + dyMm}, ${13 + dxMm} ${17.6569 + dyMm}, ${13 + dxMm} ${16 + dyMm} C ${11.3431 + dxMm} ${16 + dyMm}, ${10 + dxMm} ${14.6569 + dyMm}, ${10 + dxMm} ${13 + dyMm} C ${10 + dxMm} ${11.3431 + dyMm}, ${11.3431 + dxMm} ${10 + dyMm}, ${13 + dxMm} ${10 + dyMm} Z`,
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  };
}

/** N.2.1/N.2.2: Innenmarken ausschließlich auf dem normalen 12-mm-Kreis (Hülle 4…28). */
const CIRCLE_NORMAL_ANHANG_N_MARKS: Partial<
  Record<BodyMarkId, (bounds: BoundsMm) => Primitive[]>
> = {
  'spontaneous-helper-collection-arrow': (bounds) => {
    const dxMm = bounds.minX - 4;
    const dyMm = bounds.minY - 4;
    return [
      spontaneousHelperClover(dxMm, dyMm),
      circleRing(10.5 + dxMm, 22 + dyMm, 1.5),
      stroke(12 + dxMm, 22 + dyMm, 23 + dxMm, 22 + dyMm),
      outline([[21 + dxMm, 20 + dyMm], [23 + dxMm, 22 + dyMm], [21 + dxMm, 24 + dyMm]]),
    ];
  },
  'spontaneous-helper-contact-double-arrow': (bounds) => {
    const dxMm = bounds.minX - 4;
    const dyMm = bounds.minY - 4;
    return [
      spontaneousHelperClover(dxMm, dyMm),
      stroke(9 + dxMm, 22 + dyMm, 23 + dxMm, 22 + dyMm),
      outline([[11 + dxMm, 20 + dyMm], [9 + dxMm, 22 + dyMm], [11 + dxMm, 24 + dyMm]]),
      outline([[21 + dxMm, 20 + dyMm], [23 + dxMm, 22 + dyMm], [21 + dxMm, 24 + dyMm]]),
    ];
  },
};

const TRAILER_MARKS: Partial<Record<BodyMarkId, (bounds: BoundsMm) => Primitive[]>> = {
  /** I.2.4: zwei 0,5-mm-Wellen über der 8,207-mm-Raute, nur am normalen Anhängerrumpf. */
  'trailer-water-rescue': () => [
    {
      type: 'path', role: 'pictogram',
      d:
        'M 13.5 12.427 C 14.5 12.427 14.5 11.427 15.5 11.427 ' +
        'C 16.5 11.427 16.5 12.427 17.5 12.427 C 18.5 12.427 18.5 11.427 19.5 11.427 ' +
        'C 20.5 11.427 20.5 12.427 21.5 12.427',
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    },
    {
      type: 'path', role: 'pictogram',
      d:
        'M 13.5 14.427 C 14.5 14.427 14.5 13.427 15.5 13.427 ' +
        'C 16.5 13.427 16.5 14.427 17.5 14.427 C 18.5 14.427 18.5 13.427 19.5 13.427 ' +
        'C 20.5 13.427 20.5 14.427 21.5 14.427',
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    },
    {
      type: 'polyline', role: 'pictogram', closed: true,
      points: [[17.5, 15.146], [21.604, 19.25], [17.5, 23.354], [13.396, 19.25]],
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    },
  ],
  /** I.2.5/I.2.6: kompaktere Wellen-Rauten-Fassung, getrennt von I.2.4 vermessen. */
  'trailer-diving': () => [
    {
      type: 'path', role: 'pictogram',
      d:
        'M 13.5 15.247 C 14.5 15.247 14.5 14.247 15.5 14.247 ' +
        'C 16.5 14.247 16.5 15.247 17.5 15.247 C 18.5 15.247 18.5 14.247 19.5 14.247 ' +
        'C 20.5 14.247 20.5 15.247 21.5 15.247',
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    },
    {
      type: 'path', role: 'pictogram',
      d:
        'M 13.5 16.847 C 14.5 16.847 14.5 15.847 15.5 15.847 ' +
        'C 16.5 15.847 16.5 16.847 17.5 16.847 C 18.5 16.847 18.5 15.847 19.5 15.847 ' +
        'C 20.5 15.847 20.5 16.847 21.5 16.847',
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    },
    {
      type: 'polyline', role: 'pictogram', closed: true,
      points: [[17.5, 17.533], [20.785, 20.818], [17.5, 24.103], [14.215, 20.818]],
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    },
  ],
  /** I.2.7: der 12,5-mm-Bootsrumpf mit 0,5-mm-Innenkontur. */
  'trailer-boat-hull': () => [
    {
      type: 'path', role: 'pictogram',
      d:
        'M 11.25 13.765 H 23.75 V 14.015 C 23.75 17.86 21.355 20.25 17.5 20.25 ' +
        'C 13.645 20.25 11.25 17.86 11.25 14.015 Z',
      style: { fill: 'schwarz', stroke: 'none' },
    },
    {
      type: 'path', role: 'pictogram',
      d:
        'M 11.753 14.265 H 23.247 C 23.149 17.706 20.991 19.75 17.5 19.75 ' +
        'C 14.009 19.75 11.851 17.706 11.753 14.265 Z',
      style: { fill: 'weiss', stroke: 'none' },
    },
  ],
  'medical-service': (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = bounds.maxY - 9;
    return [
      stroke(cx, bounds.minY + 2.25, cx, bounds.maxY),
      stroke(bounds.minX, cy, bounds.maxX, cy),
      {
        type: 'circle',
        role: 'pictogram',
        cx,
        cy,
        r: 5.5,
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
      },
    ];
  },
  care: (bounds) => landCare(bounds, bounds.maxY),
};

const LFH_487_TRAILER_MARK_IDS = new Set<BodyMarkId>([
  'trailer-water-rescue',
  'trailer-diving',
  'trailer-boat-hull',
]);

/** I.3.4 und I.3.11: eigenständig vermessene Marken des eingesenkten Wasserrumpfs. */
const VEHICLE_WATER_INSET_HULL_MARKS: Partial<Record<BodyMarkId, (bounds: BoundsMm) => Primitive[]>> = {
  'inset-hull-wheel-pair': () => [
    {
      type: 'circle', role: 'pictogram', cx: 6.75, cy: 23.75, r: 2.25,
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    },
    {
      type: 'circle', role: 'pictogram', cx: 25.25, cy: 23.75, r: 2.25,
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    },
  ],
  'fire-fighting': () => [
    stroke(2.263209, 15.000055, 21.249843, 15.000055),
    stroke(21.249843, 15.000055, 29.736438, 15.000055),
    stroke(21.249843, 15.000055, 26.749628, 9.250152),
    stroke(21.249843, 15.000055, 25.901906, 19.901884),
  ],
};
export function bodyMark(
  id: BodyMarkId,
  context: {
    kind: SymbolKind;
    bodyVariant?: BodyVariantId;
    vehicleCategory?: VehicleCategoryId;
    strength?: StrengthId;
    occupiedLabelZones?: readonly ('bottomCenter' | 'bottomRight' | 'belowRight')[];
  },
  bodyBoundsMm: BoundsMm,
): readonly Primitive[] {
  const build = context.kind === 'formation' && context.bodyVariant === 'foot-band' &&
      id === 'catering' && context.strength === 'trupp' &&
      context.occupiedLabelZones?.includes('bottomRight')
    ? (bounds: BoundsMm) => logisticsCatering(bounds, -2)
    : context.kind === 'circle-12' && context.bodyVariant === 'foot-band' &&
        id === 'fuels-consumables' && context.occupiedLabelZones?.includes('bottomCenter')
      ? (bounds: BoundsMm) => logisticsFuels(bounds, 7, 18)
    : context.kind === 'formation'
    ? context.bodyVariant === undefined && id !== 'catering'
      ? MARKS[id]
      : context.bodyVariant === 'foot-band'
        ? id === 'catering'
          ? context.strength === 'gruppe'
            ? MARKS[id]
            : context.strength === undefined || context.strength === 'zug'
              ? FORMATION_FOOT_BAND_LOGISTICS_MARKS[id]
              : undefined
          : FORMATION_FOOT_BAND_LOGISTICS_MARKS[id] ?? (
              id === 'care' || id === 'temporary-accommodation-resting' ? MARKS[id] : undefined
            )
        : undefined
    : context.kind === 'person'
      ? context.bodyVariant === undefined
        ? PERSON_MARKS[id]
        : context.bodyVariant === 'compact-person-diamond-26mm' ||
            context.bodyVariant === 'compact-person-diamond-26mm-lowered-2mm'
          ? PERSON_I5_MARKS[id]
          : undefined
    : context.kind === 'vehicle-land' && context.bodyVariant === undefined
      ? id === 'water-rescue' && context.vehicleCategory !== undefined
        ? VEHICLE_LAND_WATER_RESCUE_MARKS[context.vehicleCategory]
        : VEHICLE_LAND_NORMAL_MARKS[id]
      : context.kind === 'vehicle-land' && context.bodyVariant === 'foot-band'
        ? VEHICLE_LAND_FOOT_BAND_MARKS[id] ?? (id === 'maintenance' ? logisticsMaintenance : undefined)
        : context.kind === 'vehicle-land' && context.bodyVariant === 'plain-wheel-pair'
          ? VEHICLE_LAND_PLAIN_WHEEL_PAIR_MARKS[id]
        : context.kind === 'vehicle-land' && context.bodyVariant === 'inverted-hull-track'
          ? VEHICLE_LAND_INVERTED_HULL_MARKS[id]
      : context.kind === 'vehicle-air' && context.bodyVariant === 'raised-hull'
        ? VEHICLE_AIR_MARKS[id]
      : context.kind === 'vehicle-air' && context.bodyVariant === 'fixed-wing-hull'
        ? VEHICLE_AIR_FIXED_WING_MARKS[id]
      : context.kind === 'vehicle-water' && context.bodyVariant === 'inset-hull'
        ? VEHICLE_WATER_INSET_HULL_MARKS[id]
        : context.kind === 'trailer' && context.bodyVariant === undefined
          ? TRAILER_MARKS[id]
          : context.kind === 'trailer' && context.bodyVariant === 'foot-band'
            ? TRAILER_FOOT_BAND_LOGISTICS_MARKS[id]
          : context.kind === 'circle-12' && context.bodyVariant === undefined
            ? CIRCLE_NORMAL_MARKS[id] ?? CIRCLE_NORMAL_ANHANG_N_MARKS[id]
            : context.kind === 'circle-12' && context.bodyVariant === 'raised-circle-1mm'
              ? CIRCLE_RAISED_ONE_MM_MARKS[id]
            : context.kind === 'circle-12' && context.bodyVariant === 'raised-gable'
              ? CIRCLE_RAISED_GABLE_MARKS[id]
              : context.kind === 'circle-12' && context.bodyVariant === 'foot-band'
                ? CIRCLE_FOOT_BAND_LOGISTICS_MARKS[id]
              : context.kind === 'reduced-house' && context.bodyVariant === undefined
                ? REDUCED_HOUSE_MARKS[id]
          : undefined;
  const hasAnyBuild = id === 'water-rescue' || (
    context.kind === 'person'
      ? [PERSON_MARKS, PERSON_I5_MARKS]
      : [
          MARKS,
          VEHICLE_LAND_NORMAL_MARKS,
          VEHICLE_LAND_FOOT_BAND_MARKS,
          FORMATION_FOOT_BAND_LOGISTICS_MARKS,
          TRAILER_FOOT_BAND_LOGISTICS_MARKS,
          CIRCLE_FOOT_BAND_LOGISTICS_MARKS,
          VEHICLE_LAND_PLAIN_WHEEL_PAIR_MARKS,
          VEHICLE_LAND_INVERTED_HULL_MARKS,
          VEHICLE_AIR_MARKS,
          VEHICLE_AIR_FIXED_WING_MARKS,
          VEHICLE_WATER_INSET_HULL_MARKS,
          TRAILER_MARKS,
          CIRCLE_NORMAL_MARKS,
          CIRCLE_NORMAL_ANHANG_N_MARKS,
          CIRCLE_RAISED_ONE_MM_MARKS,
          CIRCLE_RAISED_GABLE_MARKS,
          REDUCED_HOUSE_MARKS,
        ]
  )
    .some((candidate) => Object.hasOwn(candidate, id));
  if (!hasAnyBuild) {
    throw new Error(
      `Für die Fähigkeit "${id}" ist keine randbündige Fassung vermessen. Sie fällt nicht auf ` +
        'die Boxfassung zurück: beide Zeichnungen unterscheiden sich in ihren Maßen und nicht ' +
        'nur in ihrer Größe.',
    );
  }

  if (build === undefined) {
    const variant = context.bodyVariant ?? 'normal';
    throw new Error(
      `Das Art-/Varianten-/Fähigkeitspaar ${context.kind}/${variant}/${id} ist nicht vermessen. ` +
        'Randbündige Fachdienstzeichen fallen nicht auf eine andere Körperform oder Variante zurück.',
    );
  }

  const isMeasuredTrailerTechnicalMark =
    context.kind === 'trailer' && context.bodyVariant === undefined &&
    LFH_487_TRAILER_MARK_IDS.has(id);
  if (
    isMeasuredTrailerTechnicalMark &&
    ![bodyBoundsMm.minX, bodyBoundsMm.minY, bodyBoundsMm.maxX, bodyBoundsMm.maxY]
      .every(Number.isFinite)
  ) {
    throw new Error(
      `Die technische Anhängermarke "${id}" verlangt vier endliche absolute Hüllengrenzen ` +
        '(minX, minY, maxX, maxY).',
    );
  }
  if (
    isMeasuredTrailerTechnicalMark && (
      Math.abs(bodyBoundsMm.minX - 4) > BODY_TOLERANCE_MM ||
      Math.abs(bodyBoundsMm.minY - 5.75) > BODY_TOLERANCE_MM ||
      Math.abs(bodyBoundsMm.maxX - 31) > BODY_TOLERANCE_MM ||
      Math.abs(bodyBoundsMm.maxY - 26) > BODY_TOLERANCE_MM
    )
  ) {
    throw new Error(
      `Die technische Anhängermarke "${id}" ist ausschließlich an der absolut vermessenen ` +
        'Hülle 4 / 5,75 / 31 / 26 mm belegt; gleich große verschobene Anhängerhüllen sind nicht vermessen.',
    );
  }
  const widthMm = bodyBoundsMm.maxX - bodyBoundsMm.minX;
  const heightMm = bodyBoundsMm.maxY - bodyBoundsMm.minY;
  const expected = context.kind === 'formation'
    ? { width: 30, height: 20, label: '30 × 20 mm' }
    : context.kind === 'person'
      ? { width: 26, height: 26, label: '26 × 26 mm' }
    : context.kind === 'vehicle-land'
      ? context.bodyVariant === 'inverted-hull-track'
        ? { width: 30, height: 19.75, label: '30 × 19,75 mm' }
        : { width: 30, height: 20.25, label: '30 × 20,25 mm' }
    : context.kind === 'vehicle-air'
        ? { width: 29.98, height: 14.99, label: '29,98 × 14,99 mm' }
        : context.kind === 'vehicle-water' && context.bodyVariant === 'inset-hull'
          ? { width: 29.9794, height: 14.9897, label: '29,9794 × 14,9897 mm' }
        : context.kind === 'circle-12'
          ? { width: 24, height: 24, label: '24 × 24 mm' }
          : context.kind === 'reduced-house'
            ? { width: 28, height: 22, label: '28 × 22 mm' }
          : context.kind === 'spontaneous-helper'
            ? { width: 28, height: 28, label: '28 × 28 mm' }
            : { width: 27, height: 20.25, label: '27 × 20,25 mm' };
  if (
    Math.abs(widthMm - expected.width) > BODY_TOLERANCE_MM ||
    Math.abs(heightMm - expected.height) > BODY_TOLERANCE_MM
  ) {
    throw new Error(
      `Randbündige Fachdienstzeichen für "${context.kind}" sind nur an der Hülle ` +
        `${expected.label} vermessen. Diese Hülle misst ${widthMm.toFixed(3)} × ` +
        `${heightMm.toFixed(3)} mm; ihre Leisten- und Ringmaße sind eigene Messungen und werden ` +
        'nicht aus einer anderen Körperart fortgeschrieben.',
    );
  }

  const exactBounds = context.kind === 'vehicle-water' && context.bodyVariant === 'inset-hull'
    ? VEHICLE_WATER_INSET_HULL_EXACT_BODY_BOUNDS[id]
    : LFH488_EXACT_BODY_BOUNDS[id];
  if (
    exactBounds !== undefined && (
      Math.abs(bodyBoundsMm.minX - exactBounds.minX) > BODY_TOLERANCE_MM ||
      Math.abs(bodyBoundsMm.minY - exactBounds.minY) > BODY_TOLERANCE_MM ||
      Math.abs(bodyBoundsMm.maxX - exactBounds.maxX) > BODY_TOLERANCE_MM ||
      Math.abs(bodyBoundsMm.maxY - exactBounds.maxY) > BODY_TOLERANCE_MM
    )
  ) {
    throw new Error(
      `Die technische Körpermarke "${id}" ist nur an der exakten Hülle ` +
        `${exactBounds.minX}/${exactBounds.minY}/${exactBounds.maxX}/${exactBounds.maxY} mm ` +
        'vermessen; gleich große verschobene Hüllen werden nicht fortgeschrieben.',
    );
  }

  const marks = build(bodyBoundsMm);
  if (id === 'care' && context.kind === 'formation' && context.bodyVariant === 'foot-band') {
    return [
      {
        type: 'polyline',
        role: 'pictogram',
        points: [
          [bodyBoundsMm.minX, bodyBoundsMm.maxY - 3],
          [(bodyBoundsMm.minX + bodyBoundsMm.maxX) / 2, bodyBoundsMm.minY],
          [bodyBoundsMm.maxX, bodyBoundsMm.maxY - 3],
        ],
        style: {
          fill: 'none',
          stroke: 'schwarz',
          strokeWidth: DEFAULT_STROKE_WIDTH_MM,
        },
      },
    ];
  }
  return marks;
}

/**
 * Die Fähigkeiten mit vermessener randbündiger Fassung, in **Kapitelreihenfolge**.
 *
 * Aus `CAPABILITY_IDS` gefiltert und nicht aus `Object.keys(MARKS)` gelesen: die Einträge oben
 * stehen in der Reihenfolge, in der die Teilslices sie vermessen haben (erst 4.6, dann 4.2, dann
 * 4.1), und das ist nicht die Kapitelreihenfolge. Die Zusage „in Kapitelreihenfolge" wäre damit
 * eine Behauptung über eine Deklarationsreihenfolge, die niemand pflegt — so ist sie strukturell
 * erzwungen und überlebt jede weitere Marke, an welcher Stelle der Datei sie auch landet.
 */
export const BODY_MARK_IDS: readonly BodyMarkId[] = Object.freeze(
  [...CAPABILITY_IDS, ...TECHNICAL_BODY_MARK_IDS].filter((id) =>
    id === 'water-rescue' || [
      MARKS,
      VEHICLE_LAND_NORMAL_MARKS,
      VEHICLE_LAND_FOOT_BAND_MARKS,
      FORMATION_FOOT_BAND_LOGISTICS_MARKS,
      TRAILER_FOOT_BAND_LOGISTICS_MARKS,
      CIRCLE_FOOT_BAND_LOGISTICS_MARKS,
      VEHICLE_LAND_PLAIN_WHEEL_PAIR_MARKS,
      VEHICLE_LAND_INVERTED_HULL_MARKS,
      VEHICLE_AIR_MARKS,
      VEHICLE_AIR_FIXED_WING_MARKS,
      VEHICLE_WATER_INSET_HULL_MARKS,
      TRAILER_MARKS,
      CIRCLE_NORMAL_MARKS,
      CIRCLE_NORMAL_ANHANG_N_MARKS,
      CIRCLE_RAISED_ONE_MM_MARKS,
      CIRCLE_RAISED_GABLE_MARKS,
      REDUCED_HOUSE_MARKS,
      PERSON_I5_MARKS,
    ]
      .some((registry) => Object.hasOwn(registry, id))),
);
