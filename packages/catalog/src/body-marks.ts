import { NotMeasuredError, type BoundsMm } from '@einsatzzeichen/core';
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

/**
 * Die Welle der Wasserrettungsmarken aus Anhang I (I.1.x, I.2.x, I.5.x), als Strich konstruiert.
 * Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert: 8 mm breit, 1 mm hoch, vier
 * Halbwellen zu je 2 mm. Sie beginnt und endet im Wellental `troughYMm` (x = links und links + 8),
 * die Kämme liegen bei links + 2 und links + 6, ein drittes Tal bei links + 4. Jede Halbwelle ist
 * ein kubischer Bogen mit waagerechten Tangenten und 1 mm Henkellänge; damit steht die Tangente
 * im Wendepunkt unter 45° — so, wie die Konturkanten der Referenz verlaufen.
 */
function iWave(leftXMm: number, troughYMm: number): Primitive {
  // Auf 1 µm gerundet, damit z. B. 16,6 − 1 nicht als 15.600000000000001 im Pfad landet.
  const round = (valueMm: number): number => Math.round(valueMm * 1e6) / 1e6;
  const crestYMm = round(troughYMm - 1);
  const troughMm = round(troughYMm);
  const halfWaves = [0, 2, 4, 6].map((offsetMm, index) => {
    const handleX = round(leftXMm + offsetMm + 1);
    const endX = round(leftXMm + offsetMm + 2);
    const fromY = index % 2 === 0 ? troughMm : crestYMm;
    const toY = index % 2 === 0 ? crestYMm : troughMm;
    return `C ${handleX} ${fromY} ${handleX} ${toY} ${endX} ${toY}`;
  });
  return {
    type: 'path',
    role: 'pictogram',
    d: `M ${round(leftXMm)} ${troughMm} ${halfWaves.join(' ')}`,
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  };
}

/**
 * Die Raute der Wasserrettungsmarken aus Anhang I: Mittelpunkt und halbe Diagonale der
 * Strichmitte, an den Referenzkonturen abgelesen. Die Referenz hat Gehrungsecken, der Renderer
 * zeichnet runde Ecken. Die Spitzen werden bewusst nicht nach außen verschoben: das hielte die
 * Tintenspitze, versetzte aber alle vier Kanten um 0,07 mm — im Rasterbild die größere
 * Abweichung als die um 0,1 mm abgerundete Spitze.
 */
function iDiamond(cxMm: number, cyMm: number, halfDiagonalMm: number): Primitive {
  const round = (valueMm: number): number => Math.round(valueMm * 1e6) / 1e6;
  const [x, y, h] = [round(cxMm), round(cyMm), halfDiagonalMm];
  return {
    type: 'polyline',
    role: 'pictogram',
    closed: true,
    points: [
      [x, round(y - h)],
      [round(x + h), y],
      [x, round(y + h)],
      [round(x - h), y],
    ],
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
 * Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert: Wellentäler bei y = 13
 * und 15 (die Wellen schwingen zwischen 12…13 und 14…15), Raute um (16 | 20) mit halber
 * Diagonale 4 mm. Das unterscheidet sich grundlegend von 4.5.8: dessen 24 × 16-mm-Box führt die
 * Wellen über fast die gesamte Breite und setzt die Raute tiefer.
 */
function formationWaterRescue(bounds: BoundsMm): Primitive[] {
  const dx = bounds.minX - 1;
  const dy = bounds.minY - 6;
  return [iWave(12 + dx, 13 + dy), iWave(12 + dx, 15 + dy), iDiamond(16 + dx, 20 + dy, 4)];
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
/**
 * Liege der Notunterkunft (`temporary-accommodation-resting`) in der Formation. Maße an F.1.19
 * und F.1.3 abgelesen, Geometrie eigenständig konstruiert: Beine auf x = Mitte ± 5, von 4 mm
 * über der Leiste bis `bed.legBelowBarMm` darunter; der Bogen erreicht 3 mm über der Leiste
 * seinen Scheitel. Die beiden Dateien führen verschiedene Bögen, deshalb stehen Ansatzhöhe und
 * Griffe je Datei (als Kubik an Außen- und Innenkante der Referenz angeglichen, Abweichung
 * ≤ 0,009 mm):
 *
 * | Datei | Leiste | Bogenansatz | erster Griff | Scheitelgriff |
 * |---|---|---|---|---|
 * | F.1.19 | y 22 | auf der Leiste | 0,15 einwärts, 2,0 hoch | 2,8 |
 * | F.1.3 | y 19 | 0,5 über der Leiste | 0,05 einwärts, 2,3 hoch | 1,6 |
 */
function formationRestingBed(
  cx: number,
  barYMm: number,
  bed: {
    readonly legBelowBarMm: number;
    readonly arcStartAboveBarMm: number;
    readonly startHandle: readonly [number, number];
    readonly apexHandleMm: number;
  },
): Primitive[] {
  const legBelowBarMm = bed.legBelowBarMm;
  const endY = barYMm - bed.arcStartAboveBarMm;
  const apexY = barYMm - 3;
  const [inward, up] = bed.startHandle;
  const h = bed.apexHandleMm;
  return [
    stroke(cx - 5, barYMm - 4, cx - 5, barYMm + legBelowBarMm),
    stroke(cx + 5, barYMm - 4, cx + 5, barYMm + legBelowBarMm),
    {
      type: 'path',
      role: 'pictogram',
      d:
        `M ${cx - 5} ${endY} C ${cx - 5 + inward} ${endY - up}, ${cx - h} ${apexY}, ${cx} ${apexY} ` +
        `C ${cx + h} ${apexY}, ${cx + 5 - inward} ${endY - up}, ${cx + 5} ${endY}`,
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    },
    stroke(cx - 5, barYMm, cx + 5, barYMm),
  ];
}

/** Ring mit acht Speichen (Mittellinien und Diagonalen), die Speichen enden auf dem Ring. */
function formationEightSpokeRing(cx: number, cy: number, rMm: number): Primitive[] {
  const diagonalMm = rMm / Math.SQRT2;
  return [
    {
      type: 'circle',
      role: 'pictogram',
      cx,
      cy,
      r: rMm,
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    },
    stroke(cx - rMm, cy, cx + rMm, cy),
    stroke(cx, cy - rMm, cx, cy + rMm),
    stroke(cx - diagonalMm, cy - diagonalMm, cx + diagonalMm, cy + diagonalMm),
    stroke(cx + diagonalMm, cy - diagonalMm, cx - diagonalMm, cy + diagonalMm),
  ];
}

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

  /**
   * C.1.1 bis C.1.3: die an der Formation vermessene Löschmarke mit zwei rechten Diagonalen. Die
   * Mittellinie läuft von Kante zu Kante durch den Verzweigungspunkt; in der Referenz endet sie
   * nicht an der Verzweigung (Befund im Fachreview vom 19.09.2026: „unvollständig").
   */
  'fire-fighting': (bounds) => {
    const cy = (bounds.minY + bounds.maxY) / 2;
    const branchX = bounds.maxX - 10;
    return [
      stroke(bounds.minX, cy, bounds.maxX, cy),
      stroke(branchX, cy, bounds.maxX, bounds.minY),
      stroke(branchX, cy, bounds.maxX, bounds.maxY),
    ];
  },
  /** I.1.1 bis I.1.4: zwei Wellen über einer Raute auf der normalen Formationshülle. */
  'formation-two-waves-diamond': formationTwoWavesDiamond,

  /**
   * I.1.15 bis I.1.20: die kompakte Wasserrettungsmarke der Formation. Gegenüber der
   * eigenständigen Kapitel-4-Fassung bleiben Wellen und Raute bewusst in der unteren
   * Inhaltszone. Maße an der Referenz abgelesen (I.1.15, I.1.17, I.1.19), Geometrie
   * eigenständig konstruiert: Wellentäler 7,5 und 9,5 mm unter der Körperoberkante, Raute um
   * (Mitte | Oberkante + 14,5) mit halber Diagonale 3,5 mm.
   */
  'formation-water-rescue-lower-zone': (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    return [
      iWave(cx - 4, bounds.minY + 7.5),
      iWave(cx - 4, bounds.minY + 9.5),
      iDiamond(cx, bounds.minY + 14.5, 3.5),
    ];
  },

  /**
   * I.1.13 und I.1.14: eine eigene technische Composite-Marke. Die obere verschmolzene
   * Scheiben-/Schaft-/Klammerkontur und der tiefer gesetzte Wasser-/Rautenteil sind gemeinsam
   * an genau diesen beiden normalen Formationskörpern vermessen. Weder die Kapitel-4-Box noch
   * die höher stehenden Wasserrettungsfassungen aus I-c, I-e oder I-g werden fortgeschrieben.
   *
   * Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert (Koordinaten für die
   * Formation mit Oberkante y = 6):
   *
   * - zwei gefüllte Scheiben r = 1,25 mm um (13,1 | 8,15) und (18,9 | 8,15);
   * - zwei Schäfte unter 45°, die sich bei (16 | 9,65) kreuzen. Jeder Schaft läuft 1 mm neben
   *   dem Scheibenmittelpunkt vorbei und endet am Lotfuß, also innerhalb der Scheibe;
   * - an den unteren Enden je ein rechtwinkliger Haken mit 2 mm Schenkeln, Ecke bei
   *   (12,5 | 13,15) bzw. (19,5 | 13,15);
   * - Wellentäler bei y = 16 und 17,6, Raute um (16 | 21,82) mit halber Diagonale 3,18 mm.
   */
  'formation-hooked-crossed-disks-over-lowered-wave-diamond': (bounds) => {
    const dx = bounds.minX - 1;
    const dy = bounds.minY - 6;
    const disk = (cx: number): Primitive => ({
      type: 'circle',
      role: 'pictogram',
      cx: cx + dx,
      cy: 8.15 + dy,
      r: 1.25,
      style: { fill: 'schwarz', stroke: 'none' },
    });
    const hook = (cornerX: number, legX: number): Primitive =>
      outline([
        [cornerX + dx, 11.15 + dy],
        [cornerX + dx, 13.15 + dy],
        [legX + dx, 13.15 + dy],
      ]);
    return [
      disk(13.1),
      disk(18.9),
      stroke(19.5 + dx, 13.15 + dy, 13.8 + dx, 7.45 + dy),
      stroke(12.5 + dx, 13.15 + dy, 18.2 + dx, 7.45 + dy),
      hook(19.5, 17.5),
      hook(12.5, 14.5),
      iWave(12 + dx, 16 + dy),
      iWave(12 + dx, 17.6 + dy),
      iDiamond(16 + dx, 21.82 + dy, 3.18),
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
    // H.2, Maße an der Referenz abgelesen (Fachreview 19.09.2026): V-Scheitel (18|23,5) —
    // Innenkante 22,846 bei Gehrung 0,65; Scheiben r 1,25 um (4,586|18) und (10,414|18);
    // zwei Diagonalen unter 45° mit Kreuzung (7,5|19,5), die in den Winkelecken (11|23) und (4|23)
    // enden; Winkel mit Schenkeln von y 21 bis 23 und 2 mm waagerecht.
    return [
      outline([
        [minX + 8, minY + 3],
        [minX + 11, minY + 3],
        [cx + 2, maxY - 2.5],
        [maxX - 7, minY + 3],
        [maxX - 4, minY + 3],
      ]),
      { type: 'circle', role: 'pictogram', cx: minX + 3.586, cy: maxY - 8, r: 1.25, style: ink },
      { type: 'circle', role: 'pictogram', cx: minX + 9.414, cy: maxY - 8, r: 1.25, style: ink },
      outline([[minX + 4.293, maxY - 8.707], [minX + 10, maxY - 3]]),
      outline([[minX + 3, maxY - 5], [minX + 3, maxY - 3], [minX + 5, maxY - 3]]),
      outline([[minX + 8.707, maxY - 8.707], [minX + 3, maxY - 3]]),
      outline([[minX + 8, maxY - 3], [minX + 10, maxY - 3], [minX + 10, maxY - 5]]),
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
        // Derselbe V wie in H.2 (Innenkante des Scheitels 22,846): Scheitel y 23,5.
        [cx + 2, maxY - 2.5],
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
  /** F.1.19: Liege mit Leiste auf y 22 (Körperunterkante − 4), Beine 18…24 mm. */
  'temporary-accommodation-resting': (bounds) =>
    formationRestingBed((bounds.minX + bounds.maxX) / 2, bounds.minY + 16, {
      legBelowBarMm: 2, arcStartAboveBarMm: 0, startHandle: [0.15, 2], apexHandleMm: 2.8,
    }),

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
      // Dem Ring eingeschriebenes Dreieck, Maße an F.1.21 abgelesen: Spitze im Scheitel des Rings
      // (16|11,5), Fußpunkte auf dem Ring unter ±45° unterhalb der Mitte (Schenkelmitte der
      // Referenz trifft den Ring bei 11,39|22,58).
      outline([
        [cx - 6.5 / Math.SQRT2, cy + 2 + 6.5 / Math.SQRT2],
        [cx, cy - 4.5],
        [cx + 6.5 / Math.SQRT2, cy + 2 + 6.5 / Math.SQRT2],
      ]),
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
 * I.5.1 bis I.5.3: zwei Wellen und die innere Raute, relativ zum Mittelpunkt der übergebenen
 * 26-mm-Raute — I.5.2/I.5.3 verschieben die Markierung dadurch ausschließlich mit ihrer Hülle.
 * Maße an der Referenz abgelesen (I.5.1, I.5.2): Wellentäler 5 und 3 mm über der Mitte, Raute
 * 2,5 mm unter der Mitte mit halber Diagonale 4 mm.
 */
const PERSON_I5_MARKS: Partial<Record<BodyMarkId, (bounds: BoundsMm) => Primitive[]>> = {
  'double-wave-inner-diamond-8mm': (bounds) => {
    const cxMm = (bounds.minX + bounds.maxX) / 2;
    const cyMm = (bounds.minY + bounds.maxY) / 2;
    return [
      iWave(cxMm - 4, cyMm - 5),
      iWave(cxMm - 4, cyMm - 3),
      iDiamond(cxMm, cyMm + 2.5, 4),
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
    // Fuß an F.2.11 nachgemessen: Scheitel (16|22,85), Enden (14|23,85) und (18|23,85) —
    // Oberkante des linken Schenkels (15,75|22,689) → (13,888|23,62), Steigung 1 : 2.
    stroke(cx, cy - 4, cx, cy + 3.85),
    outline([[cx - 2, cy - 4], [cx - 4, cy - 2], [cx - 2, cy]]),
    outline([[cx + 2, cy - 4], [cx + 4, cy - 2], [cx + 2, cy]]),
    outline([[cx - 2, cy + 4.85], [cx, cy + 3.85], [cx + 2, cy + 4.85]]),
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

/**
 * Kreisbogen um (cx|cy) mit Radius r von `fromDeg` nach `toDeg` (Grad, y nach unten, wachsend im
 * Uhrzeigersinn), als Folge kubischer Viertel-oder-kleiner-Bögen mit dem Griff (4/3)·tan(φ/4)·r.
 * Liefert nur die Segmente ab dem Startpunkt (`C …`), ohne `M`.
 */
function arcSegments(cx: number, cy: number, r: number, fromDeg: number, toDeg: number): string {
  const count = Math.ceil(Math.abs(toDeg - fromDeg) / 90);
  const step = ((toDeg - fromDeg) / count) * (Math.PI / 180);
  const k = (4 / 3) * Math.tan(step / 4) * r;
  const n = (value: number): number => Number(value.toFixed(4));
  const parts: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const a0 = fromDeg * (Math.PI / 180) + i * step;
    const a1 = a0 + step;
    parts.push(
      `C ${n(cx + r * Math.cos(a0) - k * Math.sin(a0))} ${n(cy + r * Math.sin(a0) + k * Math.cos(a0))}, ` +
        `${n(cx + r * Math.cos(a1) + k * Math.sin(a1))} ${n(cy + r * Math.sin(a1) - k * Math.cos(a1))}, ` +
        `${n(cx + r * Math.cos(a1))} ${n(cy + r * Math.sin(a1))}`,
    );
  }
  return parts.join(' ');
}

/**
 * F.2.13: Löffel und Schüssel der Einsatzküche am Landfahrzeug mit Fußband. Maße an der Referenz
 * abgelesen, Geometrie eigenständig konstruiert (die frühere Fassung trug die Stützpunkte der
 * Referenzkontur mit sechs Nachkommastellen):
 *
 * - Löffel, gefüllt, Achse x 13: Kopf 1,78 mm breit von y 14,27 bis zum Hals bei y 16,4, Stiel
 *   0,78 mm breit bis y 21,6 mit runder Spitze.
 * - Schüssel: Kreis r 3,5 um (18|18) (Strichband 3,25…3,75), rechts offen; die Mundschenkel
 *   laufen mit Steigung 1 : 2 vom Mittelpunkt auf den Kreis (Außenecke der Referenz 18,55|18,03).
 */
function landMealPreparation(bounds: BoundsMm): Primitive[] {
  const dxMm = bounds.minX - 1;
  const dyMm = bounds.minY - 5.75;
  const sx = 13 + dxMm;
  const y = (value: number): number => Number((value + dyMm).toFixed(4));
  const x = (offset: number): number => Number((sx + offset).toFixed(4));
  const bowlX = 18 + dxMm;
  const bowlY = 18 + dyMm;
  const mouthDeg = (Math.atan(0.5) * 180) / Math.PI;
  const r = 3.5;
  const start = (deg: number): string =>
    `${Number((bowlX + r * Math.cos((deg * Math.PI) / 180)).toFixed(4))} ` +
    `${Number((bowlY + r * Math.sin((deg * Math.PI) / 180)).toFixed(4))}`;
  return [
    {
      type: 'path', role: 'pictogram',
      d:
        `M ${x(-0.39)} ${y(16.4)} C ${x(-0.64)} ${y(16.25)}, ${x(-0.89)} ${y(15.97)}, ` +
        `${x(-0.89)} ${y(15.56)} C ${x(-0.89)} ${y(14.68)}, ${x(-0.51)} ${y(14.27)}, ` +
        `${x(0)} ${y(14.27)} C ${x(0.51)} ${y(14.27)}, ${x(0.89)} ${y(14.68)}, ` +
        `${x(0.89)} ${y(15.56)} C ${x(0.89)} ${y(15.97)}, ${x(0.64)} ${y(16.25)}, ` +
        `${x(0.39)} ${y(16.4)} V ${y(21.21)} C ${x(0.39)} ${y(21.44)}, ${x(0.21)} ${y(21.6)}, ` +
        `${x(0)} ${y(21.6)} C ${x(-0.21)} ${y(21.6)}, ${x(-0.39)} ${y(21.44)}, ` +
        `${x(-0.39)} ${y(21.21)} Z`,
      style: { fill: 'schwarz', stroke: 'none' },
    },
    {
      type: 'path', role: 'pictogram',
      d:
        `M ${start(-mouthDeg)} ${arcSegments(bowlX, bowlY, r, -mouthDeg, -360 + mouthDeg)} ` +
        `L ${bowlX} ${bowlY} Z`,
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
    // I.2.1, Maße an der Referenz abgelesen: Wellentäler bei y = 12,5 und 14,5, Raute um
    // (16 | 20) mit halber Diagonale 4 mm.
    return [
      iWave(12 + dx, 12.5 + dy),
      iWave(12 + dx, 14.5 + dy),
      iDiamond(16 + dx, 20 + dy, 4),
    ];
  },
  'kfz-kategorie-1': (bounds) => {
    const dx = bounds.minX - 1;
    const dy = bounds.minY - 5.75;
    // I.2.2/I.2.3, Maße an der Referenz abgelesen: Wellentäler bei y = 15 und 16,6 (die
    // Wellen rücken enger zusammen als in I.2.1), Raute um (16 | 20,82) mit halber Diagonale
    // 3,18 mm; ihre untere Spitze liegt wie in I.2.1 auf y = 24.
    return [
      iWave(12 + dx, 15 + dy),
      iWave(12 + dx, 16.6 + dy),
      iDiamond(16 + dx, 20.82 + dy, 3.18),
    ];
  },
};

const VEHICLE_LAND_INVERTED_HULL_MARKS: Partial<
  Record<BodyMarkId, (bounds: BoundsMm) => Primitive[]>
> = {
  'land-horizontal-blade-bent-upright': (bounds) => {
    const dxMm = bounds.minX - 1;
    const dyMm = bounds.minY - 6;
    // N.1.1, Maße an der Referenz abgelesen: Schild waagerecht auf y 14,5 (Strich 14,25…14,75)
    // von x 6 bis an den senkrechten Strich x 21 (20,75…21,25), dieser von y 9,5 bis zum Knick
    // (21|18,5), dann schräg mit Steigung 1 : 5 bis (26|19,5).
    return [
      stroke(6 + dxMm, 14.5 + dyMm, 21 + dxMm, 14.5 + dyMm),
      outline([
        [21 + dxMm, 9.5 + dyMm],
        [21 + dxMm, 18.5 + dyMm],
        [26 + dxMm, 19.5 + dyMm],
      ]),
    ];
  },
};

const VEHICLE_LAND_FOOT_BAND_MARKS: Partial<
  Record<BodyMarkId, (bounds: BoundsMm) => Primitive[]>
> = {
  // F.2.13/F.2.14/F.2.17: Die Zeltschenkel laufen vom Deckscheitel (16|8) auf (1|23,5) und
  // (31|23,5) — ihr Ende liegt im Fußband (23…26), sichtbar bleibt die Schnittkante bei y 23.
  // Maße an F.2.14 abgelesen (Innenkante 1,831|23 und 16|8,359, Strich 0,5).
  care: (bounds) => landCare(bounds, bounds.maxY - 2.5),
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
 * G.7/G.2.1/G.2.2/G.3.4: durchgehende Mittellinie zwischen zwei offenen 3-mm-Endbögen. Fahrzeug
 * und Anhänger liegen auf y=15, der Kreis-Kontext 0,5 mm tiefer, die Formation mit Fußband 0,5 mm
 * höher (y=14,5).
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
function logisticsSpoon(cx: number, dy = 0): Primitive {
  const y = (value: number): number => Number((value + dy).toFixed(4));
  return {
    type: 'path',
    role: 'pictogram',
    d:
      `M ${cx - 0.7} ${y(12.86)} C ${cx - 0.573} ${y(12.953)} ${cx - 0.5} ${y(13.103)} ${cx - 0.5} ${y(13.26)} ` +
      `V ${y(19.5)} C ${cx - 0.5} ${y(19.776)} ${cx - 0.276} ${y(20)} ${cx} ${y(20)} ` +
      `C ${cx + 0.276} ${y(20)} ${cx + 0.5} ${y(19.776)} ${cx + 0.5} ${y(19.5)} V ${y(13.26)} ` +
      `C ${cx + 0.5} ${y(13.103)} ${cx + 0.573} ${y(12.953)} ${cx + 0.7} ${y(12.86)} ` +
      `C ${cx + 1.164} ${y(12.521)} ${cx + 1.5} ${y(12.139)} ${cx + 1.5} ${y(11.5)} ` +
      `C ${cx + 1.5} ${y(10.262)} ${cx + 0.846} ${y(9.5)} ${cx} ${y(9.5)} ` +
      `C ${cx - 0.846} ${y(9.5)} ${cx - 1.5} ${y(10.262)} ${cx - 1.5} ${y(11.5)} ` +
      `C ${cx - 1.5} ${y(12.139)} ${cx - 1.164} ${y(12.521)} ${cx - 0.7} ${y(12.86)} Z`,
    style: { fill: 'schwarz', stroke: 'none' },
  };
}

/**
 * Löffel und Schüssel behalten ihre je Körperprofil vermessenen horizontalen Abstände zur
 * Körpermitte. Formation und Kreis teilen -5/+3 mm; der Anhänger führt -5,5/+2,5 mm und liegt
 * zusätzlich 0,5 mm tiefer.
 */
function logisticsMealPreparation(
  bounds: BoundsMm,
  spoonCenterFromBodyCenterMm: number,
  bowlCenterFromBodyCenterMm: number,
  shiftYMm = 0,
): Primitive[] {
  const bodyCenterXMm = (bounds.minX + bounds.maxX) / 2;
  return [
    logisticsSpoon(bodyCenterXMm + spoonCenterFromBodyCenterMm, shiftYMm),
    ...logisticsCatering(bounds, shiftYMm, bowlCenterFromBodyCenterMm),
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
  // Auf der Formation mit Fußband liegt die Mittellinie bei y 14,5 mm (G.7, G.1.1, G.1.5: Strich
  // 14,25…14,75 mm, Bogenmitten ebenda) — 0,5 mm höher als auf Fahrzeug und Anhänger.
  maintenance: (bounds) => logisticsMaintenance(bounds, 14.5),
  'waste-disposal': logisticsWasteDisposal,
  /** F.1.3: Liege über dem Fußband, Leiste auf y 19, Beine 15…20,5 mm. */
  'temporary-accommodation-resting': (bounds) =>
    formationRestingBed((bounds.minX + bounds.maxX) / 2, bounds.minY + 13, {
      legBelowBarMm: 1.5, arcStartAboveBarMm: 0.5, startHandle: [0.05, 2.3], apexHandleMm: 1.6,
    }),
};

const TRAILER_FOOT_BAND_LOGISTICS_MARKS: Partial<
  Record<BodyMarkId, (bounds: BoundsMm) => Primitive[]>
> = {
  maintenance: logisticsMaintenance,
  // G.2.3: Löffel 10,0…20,5 mm und Schüsselmitte y 15,5 mm — 0,5 mm tiefer als auf der Formation.
  'meal-preparation': (bounds) => logisticsMealPreparation(bounds, -5.5, 2.5, 0.5),
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
    // Arztleiste auf y 18 (F.2.6/F.2.7: Strichband 17,75…18,25), x 12…20.
    return [...airQuartering(bounds), stroke(cx - 4, bounds.minY + 12, cx + 4, bounds.minY + 12)];
  },
  /**
   * F.2.6: Winde. Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert (Mittellinien
   * statt der Außenkonturpunkte der früheren Fassung): senkrechter Schaft x 24 von der Pfeilspitze
   * (24|10) bis zur oberen Rautenecke (24|16), Pfeilschenkel bis (22|12) und (26|12), Raute mit
   * halber Diagonale 2 um (24|18).
   */
  'air-winch-chevron-diamond': (bounds) => {
    const dxMm = bounds.minX - 1.01;
    const dyMm = bounds.minY - 6;
    const shifted = (points: readonly (readonly [number, number])[]) =>
      points.map(([xMm, yMm]) => [xMm + dxMm, yMm + dyMm] as const);
    return [
      stroke(24 + dxMm, 10 + dyMm, 24 + dxMm, 16 + dyMm),
      outline(shifted([[22, 12], [24, 10], [26, 12]])),
      outline(shifted([[24, 16], [26, 18], [24, 20], [22, 18], [24, 16]])),
    ];
  },
  'air-quartering-up-arrow-box': (bounds) => {
    const dxMm = bounds.minX - 1.01;
    const dyMm = bounds.minY - 6;
    return [
      ...airQuartering(bounds),
      // N.1.4, Maße an der Referenz abgelesen: Schaft x 23 von der Kastenoberkante y 15 bis zur
      // Spitze (23|9), Schenkel bis (21|11) und (25|11); Kasten 5 × 5 mm ab (20,5|15)
      // (Außen-/Innenkante 20,25/20,75 und 14,75/15,25).
      stroke(23 + dxMm, 15 + dyMm, 23 + dxMm, 9 + dyMm),
      outline([[21 + dxMm, 11 + dyMm], [23 + dxMm, 9 + dyMm], [25 + dxMm, 11 + dyMm]]),
      {
        type: 'rect', role: 'pictogram', x: 20.5 + dxMm, y: 15 + dyMm,
        width: 5, height: 5,
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
    // N.1.6, Maße an der Referenz abgelesen: Die Diagonale steigt mit 1 : 2 aus der linken
    // Rumpfecke (1,01|20,9898) bis auf den Bogen (r 14,9897 um 15,9997|20,9898), den sie bei
    // (24,994|8,998) trifft. Beide Enden liegen auf Mittellinien des Rumpfstrichs, der Überstand
    // der Strichenden verschwindet darin.
    return [stroke(1.01 + dxMm, 20.9898 + dyMm, 24.994 + dxMm, 8.998 + dyMm)];
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
  /**
   * I.2.4: zwei Wellen über der Raute, nur am normalen Anhängerrumpf (Mittelachse x = 17,5).
   * Maße an der Referenz abgelesen: Wellentäler bei y = 11,75 und 13,75, Raute um (17,5 | 19,25)
   * mit halber Diagonale 4 mm.
   */
  'trailer-water-rescue': () => [
    iWave(13.5, 11.75),
    iWave(13.5, 13.75),
    iDiamond(17.5, 19.25, 4),
  ],
  /**
   * I.2.5/I.2.6: kompaktere Fassung, getrennt von I.2.4 abgelesen — dieselben Maße wie I.2.2 auf
   * der Anhängerachse: Wellentäler bei y = 15 und 16,6, Raute um (17,5 | 20,82) mit halber
   * Diagonale 3,18 mm.
   */
  'trailer-diving': () => [
    iWave(13.5, 15),
    iWave(13.5, 16.6),
    iDiamond(17.5, 20.82, 3.18),
  ],
  /**
   * I.2.7: der Bootsrumpf, als Strich konstruiert. Maße an der Referenz abgelesen: Deckkante
   * auf y = 14 von x = 11,5 bis 23,5, Kiel bei (17,5 | 20). Die beiden Rumpfbögen sind
   * kubische Viertelbögen mit Henkeln von 3,75 mm (0,625 × Halbmesser) — voller als eine
   * Ellipse, wie der Rumpf der Referenz.
   */
  'trailer-boat-hull': () => [
    {
      type: 'path', role: 'pictogram',
      d:
        'M 11.5 14 H 23.5 C 23.5 17.75 21.25 20 17.5 20 ' +
        'C 13.75 20 11.5 17.75 11.5 14 Z',
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
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
  /**
   * I.3.11, Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert: die Waagerechte
   * auf y = 15 läuft von Rumpfbogen zu Rumpfbogen (Bogen r ≈ 15 mm um (16 | 9) schneidet y = 15
   * bei x ≈ 2,26 und 29,74; die Enden liegen im Rumpfstrich). Vom Abzweig (21 | 15) gehen
   * zwei Schrägen unter 45° ab: nach oben bis auf die Mittellinie des Deckstrichs (27 | 9),
   * nach unten bis in den Rumpfstrich (25,9 | 19,9).
   */
  'fire-fighting': () => [
    stroke(2.25, 15, 29.75, 15),
    stroke(21, 15, 27, 9),
    stroke(21, 15, 25.9, 19.9),
  ],
};
/**
 * Kombinationsfassungen: Fachmarken, die in einer bestimmten Kombination an anderer, eigens
 * vermessener Stelle stehen als allein. Maße an der Referenz abgelesen, Geometrie eigenständig
 * konstruiert (Fachreview 19.09.2026). Das Rezept behält die Fachbegriffe; welche Lage gilt,
 * entscheidet die vollständige Markenmenge der Komposition (`context.bodyMarks`) zusammen mit
 * Körperart und -variante. Nur exakt diese Mengen sind belegt, jede andere fällt auf die
 * Einzelfassung zurück.
 */
interface CombinationMark {
  readonly kind: SymbolKind;
  readonly bodyVariant: BodyVariantId | undefined;
  readonly marks: readonly BodyMarkId[];
  readonly builds: Partial<Record<BodyMarkId, (bounds: BoundsMm) => Primitive[]>>;
}

const COMBINATION_MARKS: readonly CombinationMark[] = [
  /**
   * F.1.12#alternative: Ring r 5 statt 5,5 (Band 4,75…5,25 um 16|16), Arztleiste auf y 24
   * (2 mm über der Unterkante) statt 22, Intensivbalken auf x 25,5 (5,5 mm von rechts) statt 23,5.
   */
  {
    kind: 'formation',
    bodyVariant: undefined,
    marks: ['patient-transport', 'physician', 'intensive-care'],
    builds: {
      'patient-transport': (b) => [
        ...quartering(b),
        ...formationEightSpokeRing((b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2, 5),
      ],
      physician: (b) => {
        const cx = (b.minX + b.maxX) / 2;
        return [...quartering(b), stroke(cx - 4, b.maxY - 2, cx + 4, b.maxY - 2)];
      },
      'intensive-care': (b) => {
        const cy = (b.minY + b.maxY) / 2;
        return [...quartering(b), stroke(b.maxX - 5.5, cy - 4, b.maxX - 5.5, cy + 4)];
      },
    },
  },
  /**
   * F.1.13: Das Zelt ist ein Dach unter 45° (Mittellinie (3|20) → (16|7) → (29|20), Bänder
   * zwischen x + y = 22,65 und 23,35, stumpfe Enden), die Arztleiste steht auf y 21 (5 mm über der
   * Unterkante).
   */
  {
    kind: 'formation',
    bodyVariant: undefined,
    marks: ['care', 'physician', 'ring-7mm-offset-down-1mm'],
    builds: {
      care: (b) => {
        const cx = (b.minX + b.maxX) / 2;
        const apexY = b.minY + 1;
        return [outline([[cx - 13, apexY + 13], [cx, apexY], [cx + 13, apexY + 13]])];
      },
      physician: (b) => {
        const cx = (b.minX + b.maxX) / 2;
        return [...quartering(b), stroke(cx - 4, b.maxY - 5, cx + 4, b.maxY - 5)];
      },
    },
  },
  /**
   * F.1.22: Unter dem Zelt steht der Ring r 5 mit acht Speichen um (16|18,5), 2,5 mm unter der
   * Körpermitte, und **ohne** Fachdienstteilung.
   */
  {
    kind: 'formation',
    bodyVariant: undefined,
    marks: ['care', 'patient-transport'],
    builds: {
      'patient-transport': (b) =>
        formationEightSpokeRing((b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2 + 2.5, 5),
    },
  },
  /** F.2.5#alternative: Arztleiste auf y 23 (3 mm über der Unterkante) statt 22 wie in F.2.4#alt. */
  {
    kind: 'vehicle-land',
    bodyVariant: 'plain-wheel-pair',
    marks: ['patient-transport', 'intensive-care', 'physician'],
    builds: {
      physician: (b) => {
        const cx = (b.minX + b.maxX) / 2;
        return [...landQuartering(b), stroke(cx - 4, b.maxY - 3, cx + 4, b.maxY - 3)];
      },
    },
  },
];

function combinationBuild(
  id: BodyMarkId,
  context: { kind: SymbolKind; bodyVariant?: BodyVariantId; bodyMarks?: readonly BodyMarkId[] },
): ((bounds: BoundsMm) => Primitive[]) | undefined {
  const marks = context.bodyMarks;
  if (marks === undefined || marks.length < 2) return undefined;
  const entry = COMBINATION_MARKS.find((candidate) =>
    candidate.kind === context.kind &&
    candidate.bodyVariant === context.bodyVariant &&
    candidate.marks.length === marks.length &&
    candidate.marks.every((mark) => marks.includes(mark)));
  return entry?.builds[id];
}

export function bodyMark(
  id: BodyMarkId,
  context: {
    kind: SymbolKind;
    bodyVariant?: BodyVariantId;
    vehicleCategory?: VehicleCategoryId;
    strength?: StrengthId;
    occupiedLabelZones?: readonly ('bottomCenter' | 'bottomRight' | 'belowRight')[];
    /** Alle Marken derselben Komposition; wählt die Kombinationsfassung (`COMBINATION_MARKS`). */
    bodyMarks?: readonly BodyMarkId[];
  },
  bodyBoundsMm: BoundsMm,
): readonly Primitive[] {
  const combination = combinationBuild(id, context);
  if (combination !== undefined) return combination(bodyBoundsMm);
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
    throw new NotMeasuredError(
      `Für die Fähigkeit "${id}" ist keine randbündige Fassung vermessen. Sie fällt nicht auf ` +
        'die Boxfassung zurück: beide Zeichnungen unterscheiden sich in ihren Maßen und nicht ' +
        'nur in ihrer Größe.',
      'combination',
    );
  }

  if (build === undefined) {
    const variant = context.bodyVariant ?? 'normal';
    throw new NotMeasuredError(
      `Das Art-/Varianten-/Fähigkeitspaar ${context.kind}/${variant}/${id} ist nicht vermessen. ` +
        'Randbündige Fachdienstzeichen fallen nicht auf eine andere Körperform oder Variante zurück.',
      'combination',
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
    // Bewusst ein gewöhnliches `Error` und keine `NotMeasuredError`: eine nicht endliche
    // Hüllengrenze ist eine ungültige Eingabe des Aufrufers, keine Aussage über die Referenz.
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
    throw new NotMeasuredError(
      `Die technische Anhängermarke "${id}" ist ausschließlich an der absolut vermessenen ` +
        'Hülle 4 / 5,75 / 31 / 26 mm belegt; gleich große verschobene Anhängerhüllen sind nicht vermessen.',
      'combination',
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
    throw new NotMeasuredError(
      `Randbündige Fachdienstzeichen für "${context.kind}" sind nur an der Hülle ` +
        `${expected.label} vermessen. Diese Hülle misst ${widthMm.toFixed(3)} × ` +
        `${heightMm.toFixed(3)} mm; ihre Leisten- und Ringmaße sind eigene Messungen und werden ` +
        'nicht aus einer anderen Körperart fortgeschrieben.',
      'combination',
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
    throw new NotMeasuredError(
      `Die technische Körpermarke "${id}" ist nur an der exakten Hülle ` +
        `${exactBounds.minX}/${exactBounds.minY}/${exactBounds.maxX}/${exactBounds.maxY} mm ` +
        'vermessen; gleich große verschobene Hüllen werden nicht fortgeschrieben.',
      'combination',
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
