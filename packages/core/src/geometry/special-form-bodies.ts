import {
  DEFAULT_STROKE_WIDTH_MM,
  DEFAULT_VIEWBOX_MM,
  type Drawing,
  type Point,
  type Primitive,
  type SpecialFormId,
  type Style,
} from '@einsatzzeichen/schema';

/**
 * Die Sonderformen aus Kapitel 3, Abschnitte 3.6 bis 3.9, als Zeichnung (LFH-577).
 *
 * Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert (Vermessung 29.09.2026,
 * 1 mm = 90,709/32 px). Jede Zeichnung ist die **Einzeldarstellung der Kapiteldatei** auf der
 * 32-mm-Fläche, nicht eine Form, die `compose()` kennt: keine der vier ist eine `SymbolKind`
 * (`schema/src/special-forms.ts`). Warum, steht in
 * `docs/decisions/2026-09-28-lfh-567-mehrfachfaehigkeiten-und-sonderformen.md` (Nachtrag vom
 * 29.09.2026).
 *
 * Bewusst eine eigene Datei neben `base-symbols.ts`: die Grundzeichen dort sind am Kennwertartefakt
 * gegatet und tragen Organisationsfarbe. Keine der vier Dateien führt die Ebene `Flächige_Fülung`;
 * die Drohne ist Tinte, keine färbbare Fläche.
 */

const OUTLINE: Style = { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM };

/** Nachkommastellen der erzeugten Pfadkoordinaten, wie `PATH_DECIMALS` in `base-symbols.ts`. */
function round(value: number): number {
  return Number(value.toFixed(4));
}

// ---------------------------------------------------------------------------------------------
// 3.6 Grundzeichen Drohne
// ---------------------------------------------------------------------------------------------

/**
 * `3.6_Grundzeichen Drohne.svg` führt ein einziges, schwarz gefülltes Sechseck: ein nach unten
 * offener Winkel. Abgelesen: Enden senkrecht bei x 4 und 28, Oberkante der Enden y 10, Endstärke
 * 3 mm (y 10…13), äußerer Scheitel (16|22), innerer Scheitel (16|17,273). Alle Werte liegen auf
 * dem Millimeterraster außer dem inneren Scheitel: 48,963 px = 17,2733 mm. Die Kanten sind nicht
 * parallel (außen Steigung 9/12 = 0,75, innen 7,273/12 = 0,606); ein gleich starker Strich ist
 * die Form also nicht.
 *
 * Das Kennzahlenartefakt führt dieselbe Hülle 4/10/28/22 (`kind: 'bounds'`). Die Drohne kommt in
 * fünf weiteren Dateien vor, aber nur als Innenzeichen und jedes Mal in eigenem Maß: C.1.13 und
 * C.1.14 18 mm breit, F.1.16 16 mm, C.2.31 14 mm, I.1.20 10,67 mm, mit Endstärken von 1 bis 1,5 mm.
 * Keine dieser Fassungen ist eine Verkleinerung von 3.6.
 */
const DRONE = {
  leftXMm: 4,
  rightXMm: 28,
  topYMm: 10,
  endThicknessMm: 3,
  innerApexYMm: 17.273,
  outerApexYMm: 22,
} as const;

function droneBody(): Primitive {
  const { leftXMm, rightXMm, topYMm, endThicknessMm, innerApexYMm, outerApexYMm } = DRONE;
  const cx = (leftXMm + rightXMm) / 2;
  const bottomYMm = topYMm + endThicknessMm;
  return {
    type: 'polyline',
    role: 'body',
    closed: true,
    points: [
      [rightXMm, topYMm],
      [cx, innerApexYMm],
      [leftXMm, topYMm],
      [leftXMm, bottomYMm],
      [cx, outerApexYMm],
      [rightXMm, bottomYMm],
    ],
    style: { fill: 'schwarz', stroke: 'none' },
  };
}

// ---------------------------------------------------------------------------------------------
// 3.7 Zweirad und 3.8 Zweirad motorgetrieben
// ---------------------------------------------------------------------------------------------

/**
 * Beide Dateien führen einen einzigen Kurvenpfad, 0,5-mm-Strich zur Fläche umgewandelt. Abgelesen:
 *
 * - Ein oberer Halbbogen um (16|10): Außenradius 6,25, Innenradius 5,75 mm, also Mittellinie r 6.
 *   Die Bogenenden sind waagerecht bei y 10 geschnitten (27,639…29,056 px = x 9,75…10,25 mm).
 * - 3.7: ein Stiel x 15,75…16,25 mm (Mittellinie x 16) vom Bogen bis y 28 (79,37 px).
 * - 3.8: zwei Stiele x 14,75…15,25 und 16,75…17,25 mm (Mittellinien x 15 und 17, lichter Abstand
 *   1,5 mm) vom Bogen bis y 28. Die Innenkanten treffen den Innenbogen bei y 4,30 und 4,387 mm
 *   (12,185 und 12,435 px), wie es r 5,75 verlangt.
 *
 * Tintenhülle beider: x 9,75…22,25, y 3,75…28. Das Kennzahlenartefakt erfasst Kurvenpfade nicht
 * (`shapes: []`, `curvedPaths: 1`); diese Zahlen stehen nur hier.
 */
const WHEEL = {
  arcCenter: [16, 10] as Point,
  arcRadiusMm: 6,
  stemBottomYMm: 28,
  singleStemXMm: [16],
  motorizedStemXMm: [15, 17],
} as const;

/** Kontrollpunktabstand der Viertelkreis-Kubik, wie `CIRCLE_CONTROL_FRACTION` in `base-symbols.ts`. */
const QUARTER_ARC_CONTROL = (4 * (Math.SQRT2 - 1)) / 3;

/** Oberer Halbkreis als zwei Viertelkubiken, von links nach rechts (nur M und C, das Kommando-Gate kennt kein A). */
function upperHalfArc([cx, cy]: Point, r: number): string {
  const k = r * QUARTER_ARC_CONTROL;
  return [
    `M ${round(cx - r)} ${round(cy)}`,
    `C ${round(cx - r)} ${round(cy - k)}, ${round(cx - k)} ${round(cy - r)}, ${round(cx)} ${round(cy - r)}`,
    `C ${round(cx + k)} ${round(cy - r)}, ${round(cx + r)} ${round(cy - k)}, ${round(cx + r)} ${round(cy)}`,
  ].join(' ');
}

/** Ein Stiel von der Bogenmittellinie senkrecht nach unten. */
function stem(xMm: number): string {
  const [cx, cy] = WHEEL.arcCenter;
  const topY = cy - Math.sqrt(WHEEL.arcRadiusMm ** 2 - (xMm - cx) ** 2);
  return `M ${round(xMm)} ${round(topY)} L ${round(xMm)} ${round(WHEEL.stemBottomYMm)}`;
}

function wheelBody(stemsXMm: readonly number[]): Primitive {
  return {
    type: 'path',
    role: 'body',
    d: [upperHalfArc(WHEEL.arcCenter, WHEEL.arcRadiusMm), ...stemsXMm.map(stem)].join(' '),
    style: OUTLINE,
  };
}

// ---------------------------------------------------------------------------------------------
// 3.9 temporär ortsfeste Strukturen
// ---------------------------------------------------------------------------------------------

/**
 * `3.9_temporär ortsfeste Strukturen.svg` führt zwei Dinge:
 *
 * - einen **schwarzen Giebel**, 0,5-mm-Strich mit Gehrung und Stumpfkappen, Mittellinie
 *   (2|14) → (16|2) → (30|14). Abgelesen am Umriss: Enden (1,837|13,81)/(2,163|14,19), Scheitel
 *   außen 1,671 und innen 2,329 mm. Die Tintenhülle 1,837/1,671/30,162/14,19 ist genau der Eintrag
 *   des Kennzahlenartefakts; sie gehört zum Giebel und **nicht** zur grauen Fläche, wie die
 *   Vorlage vom 28.09. las.
 * - einen **grauen Platzhalter** (`#bebebe`): Kreis um (16|20) mit Mittellinie r 10, Strich 0,4 mm,
 *   28 Striche zu 1,5 mm im Abstand 0,75 mm. Das ist die Platzhalterkonvention von Kapitel 3
 *   (3.1 zeigt denselben grau gestrichelten Rahmen): er steht für ein beliebiges Grundzeichen unter
 *   dem Giebel. Er gehört nicht ins Zeichen und wird nicht gezeichnet (vgl. J.1.14, Entscheidung
 *   vom 19.09.2026 §5 Punkt 5); seine Lage führt `SPECIAL_FORMS` als Maß.
 *
 * Derselbe Giebel steht am Körper über dem abgesenkten 12-mm-Kreis in D.2.5, D.2.7, F.3.5, F.3.14,
 * I.4.1 und J.3.2, dort mit der Mittellinie (3|11) → (16|1) → (29|11) (`circle-12`/`raised-gable`
 * in `base-symbols.ts`). Die Kapiteldatei ist also, wie bei 5.4 und 5.5, eine eigene Darstellung.
 */
const ROOF_POINTS: readonly Point[] = [
  [2, 14],
  [16, 2],
  [30, 14],
];

function roof(): Primitive {
  return { type: 'polyline', role: 'bodyExtra', closed: false, points: ROOF_POINTS, style: OUTLINE };
}

// ---------------------------------------------------------------------------------------------

const BODIES: Readonly<Record<SpecialFormId, () => readonly Primitive[]>> = {
  drone: () => [droneBody()],
  'two-wheeler': () => [wheelBody(WHEEL.singleStemXMm)],
  'motorized-two-wheeler': () => [wheelBody(WHEEL.motorizedStemXMm)],
  'temporary-fixed-structure': () => [roof()],
};

const TITLES: Readonly<Record<SpecialFormId, readonly [section: string, title: string]>> = {
  drone: ['3.6', 'Grundzeichen Drohne'],
  'two-wheeler': ['3.7', 'Zweirad'],
  'motorized-two-wheeler': ['3.8', 'Zweirad motorgetrieben'],
  'temporary-fixed-structure': ['3.9', 'temporär ortsfeste Strukturen'],
};

/** Die gezeichneten Sonderformen in Kapitelreihenfolge. */
export const SPECIAL_FORM_IDS_DRAWN: readonly SpecialFormId[] = Object.freeze([
  'drone',
  'two-wheeler',
  'motorized-two-wheeler',
  'temporary-fixed-structure',
]);

/**
 * Die Einzeldarstellung einer Sonderform auf der 32-mm-Fläche, wie die Kapiteldatei sie zeigt.
 * Ohne Organisationsfarbe und ohne Zonen: wo eine Sonderform am Körper sitzt, belegt die
 * Kapiteldatei nicht.
 */
export function specialFormDrawing(id: SpecialFormId): Drawing {
  const [section, title] = TITLES[id];
  return {
    viewBox: DEFAULT_VIEWBOX_MM,
    children: BODIES[id](),
    title,
    description: `Sonderform: ${title}. BABZ-Abschnitt ${section}.`,
  };
}
