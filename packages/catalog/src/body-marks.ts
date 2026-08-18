import type { BoundsMm } from '@einsatzzeichen/core';
import {
  DEFAULT_STROKE_WIDTH_MM,
  type CapabilityId,
  type Primitive,
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
const MEASURED_BODY_WIDTH_MM = 30;
const MEASURED_BODY_HEIGHT_MM = 20;
const BODY_TOLERANCE_MM = 0.01;

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
 * Die Zusatzstriche zur Teilung, je Fähigkeit. Alle Zahlen sind an den F-Dateien gemessen und
 * gegen die Hülle formuliert; die Herleitungen stehen an der jeweiligen Zeile.
 */
const MARKS: Partial<Record<CapabilityId, (bounds: BoundsMm) => Primitive[]>> = {
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
};

export function bodyMark(id: CapabilityId, bodyBoundsMm: BoundsMm): readonly Primitive[] {
  const build = MARKS[id];
  if (build === undefined) {
    throw new Error(
      `Für die Fähigkeit "${id}" ist keine randbündige Fassung vermessen. Sie fällt nicht auf ` +
        'die Boxfassung zurück: beide Zeichnungen unterscheiden sich in ihren Maßen und nicht ' +
        'nur in ihrer Größe.',
    );
  }

  const widthMm = bodyBoundsMm.maxX - bodyBoundsMm.minX;
  const heightMm = bodyBoundsMm.maxY - bodyBoundsMm.minY;
  if (
    Math.abs(widthMm - MEASURED_BODY_WIDTH_MM) > BODY_TOLERANCE_MM ||
    Math.abs(heightMm - MEASURED_BODY_HEIGHT_MM) > BODY_TOLERANCE_MM
  ) {
    throw new Error(
      `Randbündige Fachdienstzeichen sind bisher nur am Rechteckkörper 30 × 20 mm der taktischen ` +
        `Formation vermessen (Anhang F.1). Diese Hülle misst ${widthMm.toFixed(3)} × ` +
        `${heightMm.toFixed(3)} mm; ihre Leisten- und Ringmaße sind eigene Messungen und werden ` +
        'nicht aus den F.1-Zahlen fortgeschrieben.',
    );
  }

  return build(bodyBoundsMm);
}

/** Die Fähigkeiten mit vermessener randbündiger Fassung, in Kapitelreihenfolge. */
export const BODY_MARK_IDS: readonly CapabilityId[] = Object.freeze(
  Object.keys(MARKS) as CapabilityId[],
);
