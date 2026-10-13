import { DEFAULT_STROKE_WIDTH_MM, type Primitive, type Style, type SymbolKind } from '@einsatzzeichen/schema';

/**
 * Die Behälter aus Kapitel 5.1.3 und ihre Träger aus 5.1.1.8/5.1.1.9 und 5.1.2.2/5.1.2.3 als
 * Körperformen (ESZ-117, Entscheidung des Eigentümers vom 13.10.2026: alle acht als Arten).
 *
 * Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert (Vermessung 13.10.2026,
 * 1 mm = 90,709/32 px). Die Ebene `Flächige_Fülung` trägt in allen acht Dateien die
 * **Mittellinie** des Körpers; die Strichebene bestätigt sie (Außen- und Innenkante je 0,25 mm
 * daneben). Alle Zahlen sind auf 0,001 mm gerundet, die Abweichung zur Ablesung liegt unter
 * 0,0005 mm. Die Begründung je Körper steht in
 * `docs/decisions/2026-10-13-esz-117-fehlende-fahrzeugkoerper.md`.
 *
 * **Keine Datei ist eine Verschiebung einer anderen.** Der Abrollbehälter hat dreimal eine
 * eigene Deckkurve (5.1.3.1, 5.1.1.8, 5.1.2.2), der Wechselbehälter dreimal eine eigene
 * Rechteckhülle und zwei verschiedene Eckbeschläge (r 1,8 in 5.1.3.2 und 5.1.1.9, r 2,0 in
 * 5.1.2.3). Jede Zahl gehört deshalb zu ihrer Datei; abgeleitet ist nur die Kreisnäherung der
 * Bögen.
 *
 * Was wiederkehrt, steht einmal: die Öse des Abrollbehälters (Ring r 2, Strich 0,5, außen an der
 * Körperecke), der L-Rahmen der Träger und die Deichsel des Anhängers (zahlengleich mit
 * `5.1.2.1`, siehe `EXTRA_PRIMITIVES` in `base-symbols.ts`).
 */

const OUTLINE: Style = { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM };

/** Kontrollpunktabstand der Viertelkreis-Kubik, wie `CIRCLE_CONTROL_FRACTION` in `base-symbols.ts`. */
const QUARTER_ARC_CONTROL = (4 * (Math.SQRT2 - 1)) / 3;

function round(value: number): number {
  return Number(value.toFixed(4));
}

/**
 * Halbkreis als zwei Viertelkubiken, nur `M` und `C` (das Kommando-Gate kennt kein `A`).
 * `side` ist die Seite, auf der der Bogen liegt: `left`/`right` von oben nach unten um eine
 * senkrechte Sehne, `up` von links nach rechts über einer waagerechten.
 */
function halfCircle(cx: number, cy: number, r: number, side: 'left' | 'right' | 'up'): string {
  const k = round(r * QUARTER_ARC_CONTROL);
  const f = round;
  switch (side) {
    case 'left':
      return (
        `M ${f(cx)} ${f(cy - r)} C ${f(cx - k)} ${f(cy - r)}, ${f(cx - r)} ${f(cy - k)}, ${f(cx - r)} ${f(cy)} ` +
        `C ${f(cx - r)} ${f(cy + k)}, ${f(cx - k)} ${f(cy + r)}, ${f(cx)} ${f(cy + r)}`
      );
    case 'right':
      return (
        `M ${f(cx)} ${f(cy - r)} C ${f(cx + k)} ${f(cy - r)}, ${f(cx + r)} ${f(cy - k)}, ${f(cx + r)} ${f(cy)} ` +
        `C ${f(cx + r)} ${f(cy + k)}, ${f(cx + k)} ${f(cy + r)}, ${f(cx)} ${f(cy + r)}`
      );
    case 'up':
      return (
        `M ${f(cx - r)} ${f(cy)} C ${f(cx - r)} ${f(cy - k)}, ${f(cx - k)} ${f(cy - r)}, ${f(cx)} ${f(cy - r)} ` +
        `C ${f(cx + k)} ${f(cy - r)}, ${f(cx + r)} ${f(cy - k)}, ${f(cx + r)} ${f(cy)}`
      );
  }
}

function extraPath(d: string): Primitive {
  return { type: 'path', role: 'bodyExtra', d, style: OUTLINE };
}

/**
 * Öse des Abrollbehälters: ein halber Ring außen an der oberen Körperecke. Abgelesen in allen
 * drei AB-Dateien gleich: Außenkante r 2,25, Innenkante r 1,75 um einen Mittelpunkt 2 mm unter
 * der Körperoberkante auf der Seitenwand (5.1.3.1 und 5.1.1.8 bei (4|8), 5.1.2.2 bei (7|8)), der
 * Ring also auf der Mittellinie r 2. Die innere Hälfte liegt im Körper und ist in der Referenz
 * nicht gezeichnet. Am Rollcontainer (5.1.3.4) sitzt dieselbe Öse rechts, bei (23|8).
 */
function eyelet(cx: number, side: 'left' | 'right'): Primitive {
  return extraPath(halfCircle(cx, 8, 2, side));
}

/**
 * Eckbeschlag des Wechselbehälters: ein Halbring über der Oberkante, mit dem äußeren Ende auf der
 * Seitenwand. Mittellinie aus Außen- und Innenkante gemittelt: 5.1.3.2 und 5.1.1.9 außen r 2,05,
 * innen r 1,55, also r 1,8; 5.1.2.3 außen r 2,25, innen r 1,75, also r 2,0.
 */
function cornerFitting(cx: number, r: number): Primitive {
  return extraPath(halfCircle(cx, 8, r, 'up'));
}

/**
 * L-Rahmen der beiden Kraftfahrzeugträger 5.1.1.8 und 5.1.1.9, zahlengleich in beiden Dateien:
 * senkrecht auf x 1,0 (Kanten 0,75/1,25) von y 6,0 (Stumpfkappe, die Referenz schließt dort
 * waagerecht bei 6,0) bis zur Ecke, waagerecht auf y 26,0 (Kanten 25,75/26,25) bis x 31,25.
 * Anders als am Wechselladerrumpf `E.2.15` schließt der Rahmen nicht an den Körper an: zwischen
 * Körperunterkante 25,0 und Rahmen bleibt die Aussparung offen, und die waagerechte Schiene reicht
 * 0,25 mm über die Körperkante 31 hinaus.
 */
const LOADER_FRAME: Primitive = {
  type: 'polyline',
  role: 'bodyExtra',
  closed: false,
  points: [
    [1, 6],
    [1, 26],
    [31.25, 26],
  ],
  style: OUTLINE,
};

/**
 * Rahmen der beiden Anhängerträger 5.1.2.2 und 5.1.2.3, zahlengleich in beiden Dateien:
 * senkrecht auf x 4,0 (Kanten 3,75/4,25) von y 6,0 bis zur Ecke, waagerecht auf y 26,0 bis x 31,0.
 * Die senkrechte Linie steht genau dort, wo am Anhänger `5.1.2.1` die linke Körperwand steht; an
 * ihr hängt dieselbe Deichsel.
 */
const TRAILER_FRAME: Primitive = {
  type: 'polyline',
  role: 'bodyExtra',
  closed: false,
  points: [
    [4, 6],
    [4, 26],
    [31, 26],
  ],
  style: OUTLINE,
};

/** Deichsel wie am Anhänger `5.1.2.1`, in 5.1.2.2 und 5.1.2.3 zahlengleich wiedergefunden. */
const DRAWBAR: Primitive = {
  type: 'polyline',
  role: 'bodyExtra',
  closed: false,
  points: [
    [4, 14.5],
    [1, 14.5],
    [1, 15.5],
    [4, 15.5],
  ],
  style: OUTLINE,
};

/** Die acht neuen Körperformen. Reihenfolge wie im Kapitel: 5.1.1, 5.1.2, 5.1.3. */
export const CONTAINER_KINDS = [
  'roll-off-loader',
  'swap-container-carrier',
  'roll-off-trailer',
  'swap-container-trailer',
  'roll-off-container',
  'swap-container',
  'swap-body',
  'wheeled-container',
] as const satisfies readonly SymbolKind[];

export type ContainerKind = (typeof CONTAINER_KINDS)[number];

/** Die vier Träger: sie tragen eine Fahrwerkszone unter ihrem Rahmen (y 26,0). */
export const CONTAINER_CARRIER_KINDS = [
  'roll-off-loader',
  'swap-container-carrier',
  'roll-off-trailer',
  'swap-container-trailer',
] as const satisfies readonly ContainerKind[];

export const CONTAINER_BODIES: Readonly<Record<ContainerKind, Primitive>> = {
  /**
   * `5.1.1.8_Kraftfahrzeug_straßenfähig_Wechsellader.svg` — Abrollbehälter auf dem
   * Wechselladerrahmen. Füllkörper x 4…31, Unterkante 25,0, Sehne beidseits 6,0, Scheitel
   * (17,5|8,0). Kontrollpunkte abgelesen 27,9999/7,0001 und 22,9993/7,9999 rechts,
   * 11,9997/7,9999 und 6,9998/6,9998 links — symmetrisch um 17,5 und **nicht** die Deckkurve von
   * `1.3` (deren Kontrollhöhe läge bei 7,339). Der Rumpf von `E.2.15` ist ein anderer Körper
   * (x 2,5…31, Unterkante 24,5).
   */
  'roll-off-loader': {
    type: 'path',
    role: 'body',
    d: 'M 17.5 8 C 12 8, 7 7, 4 6 L 4 25 L 31 25 L 31 6 C 28 7, 23 8, 17.5 8 Z',
    style: OUTLINE,
  },
  /**
   * `5.1.1.9_Kraftfahrzeug_straßenfähig_Wechselbehälter.svg` — Wechselbehälter auf dem
   * Wechselladerrahmen. Füllrechteck 3/8 bis 31/25 (abgelesen 3,0000/7,9999, 27,9999 × 16,9999).
   */
  'swap-container-carrier': { type: 'rect', role: 'body', x: 3, y: 8, width: 28, height: 17, style: OUTLINE },
  /**
   * `5.1.2.2_Anhänger_Abrollbehälter.svg` — Abrollbehälter auf dem Anhängerrahmen. Füllkörper
   * x 7…31, Unterkante 24,0, Sehne beidseits 6,0, Scheitel (19|8). Kontrollpunkte abgelesen
   * 28,0002/7,2227 und 23,0000/7,9999 rechts, 15,0004/7,9999 und 10,0002/7,1797 links — die
   * äußeren Kontrollhöhen unterscheiden sich um 0,043 mm, das ist mehr als Exportrundung und
   * bleibt stehen.
   */
  'roll-off-trailer': {
    type: 'path',
    role: 'body',
    d: 'M 19 8 C 15 8, 10 7.18, 7 6 L 7 24 L 31 24 L 31 6 C 28 7.223, 23 8, 19 8 Z',
    style: OUTLINE,
  },
  /**
   * `5.1.2.3_Anhänger_Wechselbehälter.svg` — Wechselbehälter auf dem Anhängerrahmen.
   * Füllrechteck 6/8 bis 31/24 (abgelesen 6,0000/7,9999, 24,9999 × 15,9998).
   */
  'swap-container-trailer': { type: 'rect', role: 'body', x: 6, y: 8, width: 25, height: 16, style: OUTLINE },
  /**
   * `5.1.3.1_Abrollbehälter.svg`. Füllkörper x 4…31, Unterkante 26,0. Die **rechte** Hälfte ist
   * die Deckkurve des Anhängers (Sehne 5,75, Kontrollpunkte 27,3998/7,0887 und 22,8998/8,0003,
   * Scheitel 17,4998/8,0003 — dieselben Zahlen wie `deckCurveBody(4, 5,75, 26)`), die **linke**
   * nicht: sie endet höher an der Öse, auf 6,0 statt 5,75, mit den Kontrollpunkten
   * 12,0999/8,0003 und 7,9999/7,2097.
   */
  'roll-off-container': {
    type: 'path',
    role: 'body',
    d: 'M 17.5 8 C 12.1 8, 8 7.21, 4 6 L 4 26 L 31 26 L 31 5.75 C 27.4 7.089, 22.9 8, 17.5 8 Z',
    style: OUTLINE,
  },
  /** `5.1.3.2_Wechselbehälter.svg`. Füllrechteck 1/8 bis 31/26 (abgelesen 1,0001/7,9999, 30,0001 × 18,0001). */
  'swap-container': { type: 'rect', role: 'body', x: 1, y: 8, width: 30, height: 18, style: OUTLINE },
  /** `5.1.3.3_Wechselbrücke.svg`. Füllrechteck wie am Wechselbehälter, 1/8 bis 31/26. */
  'swap-body': { type: 'rect', role: 'body', x: 1, y: 8, width: 30, height: 18, style: OUTLINE },
  /**
   * `5.1.3.4_Zieh- und schiebbar.svg`. Füllkörper x 9…23, Unterkante 26,0, Sehne beidseits 6,0,
   * Scheitel (16|8). Kontrollpunkte abgelesen 20,9997/7,5000 und 18,5000/8,0003 rechts,
   * 13,4997/8,0003 und 10,9999/7,5000 links.
   */
  'wheeled-container': {
    type: 'path',
    role: 'body',
    d: 'M 16 8 C 13.5 8, 11 7.5, 9 6 L 9 26 L 23 26 L 23 6 C 21 7.5, 18.5 8, 16 8 Z',
    style: OUTLINE,
  },
};

/**
 * Was zum Zeichen gehört, aber nicht Körper ist. Ohne diese Teile wäre jede der acht Formen ein
 * anderes Zeichen: der Abrollbehälter ohne Öse ein Landfahrzeugrumpf, die Wechselbrücke ohne
 * Stützbeine ein Wechselbehälter ohne Beschläge.
 */
export const CONTAINER_EXTRAS: Readonly<Record<ContainerKind, readonly Primitive[]>> = {
  'roll-off-loader': [LOADER_FRAME, eyelet(4, 'left')],
  'swap-container-carrier': [LOADER_FRAME, cornerFitting(4.8, 1.8), cornerFitting(29.2, 1.8)],
  'roll-off-trailer': [TRAILER_FRAME, DRAWBAR, eyelet(7, 'left')],
  'swap-container-trailer': [TRAILER_FRAME, DRAWBAR, cornerFitting(8, 2), cornerFitting(29, 2)],
  'roll-off-container': [eyelet(4, 'left')],
  'swap-container': [cornerFitting(2.8, 1.8), cornerFitting(29.2, 1.8)],
  /**
   * Zwei Stützbeine, je ein 0,5-mm-Strich (Kanten 5,75/6,25 und 25,75/26,25, Mittellinien x 6 und
   * 26) von der Körperunterkante bis y 29,0 mit Stumpfkappe.
   */
  'swap-body': [
    { type: 'line', role: 'bodyExtra', x1: 6, y1: 26, x2: 6, y2: 29, style: OUTLINE },
    { type: 'line', role: 'bodyExtra', x1: 26, y1: 26, x2: 26, y2: 29, style: OUTLINE },
  ],
  /**
   * Öse rechts und zwei Rollen. Die Rollen messen außen r 2,5 und innen r 2,0 um (13,25|28,25)
   * und (18,75|28,25), also dieselbe Radmarke wie die Fahrwerkszone (r 2,25, Mitte 2,25 unter der
   * Körperunterkante). Ihr Abstand 5,5 mm ist der des Anhängers mit zwei Rädern (14,25/19,75),
   * hier aber um x 16 zentriert. Sie gehören zur Form und sind kein Fahrwerk: zieh- und schiebbar
   * heißt, der Behälter hat Rollen.
   */
  'wheeled-container': [
    eyelet(23, 'right'),
    { type: 'circle', role: 'bodyExtra', cx: 13.25, cy: 28.25, r: 2.25, style: OUTLINE },
    { type: 'circle', role: 'bodyExtra', cx: 18.75, cy: 28.25, r: 2.25, style: OUTLINE },
  ],
};

export const CONTAINER_TITLES: Readonly<Record<ContainerKind, string>> = {
  'roll-off-loader': 'Wechsellader mit Abrollbehälter',
  'swap-container-carrier': 'Kraftfahrzeug mit Wechselbehälter',
  'roll-off-trailer': 'Anhänger mit Abrollbehälter',
  'swap-container-trailer': 'Anhänger mit Wechselbehälter',
  'roll-off-container': 'Abrollbehälter',
  'swap-container': 'Wechselbehälter',
  'swap-body': 'Wechselbrücke',
  'wheeled-container': 'Behälter, zieh- und schiebbar',
};

export const CONTAINER_SECTIONS: Readonly<Record<ContainerKind, { section: string; asset: string }>> = {
  'roll-off-loader': { section: '5.1.1.8', asset: '5.1.1.8_Kraftfahrzeug_straßenfähig_Wechsellader.svg' },
  'swap-container-carrier': {
    section: '5.1.1.9',
    asset: '5.1.1.9_Kraftfahrzeug_straßenfähig_Wechselbehälter.svg',
  },
  'roll-off-trailer': { section: '5.1.2.2', asset: '5.1.2.2_Anhänger_Abrollbehälter.svg' },
  'swap-container-trailer': { section: '5.1.2.3', asset: '5.1.2.3_Anhänger_Wechselbehälter.svg' },
  'roll-off-container': { section: '5.1.3.1', asset: '5.1.3.1_Abrollbehälter.svg' },
  'swap-container': { section: '5.1.3.2', asset: '5.1.3.2_Wechselbehälter.svg' },
  'swap-body': { section: '5.1.3.3', asset: '5.1.3.3_Wechselbrücke.svg' },
  'wheeled-container': { section: '5.1.3.4', asset: '5.1.3.4_Zieh- und schiebbar.svg' },
};
