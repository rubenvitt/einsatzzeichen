import { deepFreeze } from '../../readonly-data.js';
import {
  defineComms,
  type CatalogPictogramDefinition,
  type PictogramContrastPair,
} from '../catalog-definition.js';
import { arcPath, arcSegments, J_STROKE, J_WHITE_BODY } from './03-devices.js';
import {
  commsCircle,
  commsLine,
  commsPath,
  commsPolyline,
  commsRect,
  COMMS_BLACK_FILL,
  commsText,
  CONNECTION_CONTRAST,
} from './authoring.js';

/*
 * Anhang J.4 — Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert.
 *
 * Alle Striche sind 0,5 mm stark (1,417 pt in den BABZ-Dateien); die Koordinaten unten sind die
 * Mittellinien dieser Striche. Der Netzkörper ist das Quadrat 4 … 28 mm, die Verbindungslinie
 * der Leitungszeichen liegt auf y 16 mm von x 1 bis 31 mm.
 */

const NETWORK_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'Kontur des Netzkörpers auf der Ausgabeoberfläche',
  },
  {
    foreground: 'schwarz',
    background: 'weiss',
    context: 'Marke auf dem Netzkörper',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

const NETWORK_BOX = { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 } as const;

/** Weißes Quadrat 4 … 28 mm mit 0,5-mm-Kontur — der Körper der meisten Netzzeichen. */
function networkBody() {
  return commsRect(4, 4, 24, 24, J_WHITE_BODY);
}

/** Ein gerader Strich in Referenzstärke. */
function stroke(x1: number, y1: number, x2: number, y2: number) {
  return commsLine(x1, y1, x2, y2, J_STROKE);
}

/** Eine offene Linienfolge in Referenzstärke. */
function strokes(points: readonly (readonly [number, number])[]) {
  return commsPolyline(points, false, J_STROKE);
}

/** Eine gefüllte Pfeilspitze als geschlossene Polylinie ohne Kontur. */
function arrowhead(points: readonly (readonly [number, number])[]) {
  return commsPolyline(points, true, COMMS_BLACK_FILL);
}

/** Die Verbindungslinie der Leitungszeichen: y 16 mm von x 1 bis 31 mm. */
function connection() {
  return stroke(1, 16, 31, 16);
}

/**
 * Offener Pfeil nach oben mit Spitze (16|20): Schenkel von (14|22) und (18|22) im 45°-Winkel,
 * Schaft bis y 24 mm. Gemeinsam in J.4.8 und J.4.10.
 */
function openArrowUp() {
  return [
    strokes([
      [14, 22],
      [16, 20],
      [18, 22],
    ]),
    stroke(16, 20, 16, 24),
  ];
}

/** Die beiden Querstriche der temporär verlegten Leitungen: x 6 und x 26, je y 11 … 21 mm. */
function temporaryTicks() {
  return [stroke(6, 11, 6, 21), stroke(26, 11, 26, 21)];
}

function fmt(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

type Lobe = readonly [cx: number, cy: number, r: number];

/**
 * Die Wolke aus J.4.5 als Kette von Kreisbögen. Die Referenz setzt sie aus sieben Kreisen
 * zusammen; jeder Bogen läuft außen herum vom Schnittpunkt mit dem vorigen zum Schnittpunkt mit
 * dem nächsten Kreis. Die Schnittpunkte werden hier berechnet, nicht abgeschrieben: von zwei
 * Schnittpunkten gilt der, der weiter von der Wolkenmitte (16|16) entfernt liegt.
 */
function cloudPath(lobes: readonly Lobe[]): string {
  const outerIntersection = (a: Lobe, b: Lobe): readonly [number, number] => {
    const [ax, ay, ar] = a;
    const [bx, by, br] = b;
    const d = Math.hypot(bx - ax, by - ay);
    const along = (ar * ar - br * br + d * d) / (2 * d);
    const h = Math.sqrt(ar * ar - along * along);
    const mx = ax + (along * (bx - ax)) / d;
    const my = ay + (along * (by - ay)) / d;
    const candidates = [
      [mx + (h * (by - ay)) / d, my - (h * (bx - ax)) / d],
      [mx - (h * (by - ay)) / d, my + (h * (bx - ax)) / d],
    ] as const;
    const distance = ([x, y]: readonly [number, number]) => Math.hypot(x - 16, y - 16);
    return distance(candidates[0]) >= distance(candidates[1]) ? candidates[0] : candidates[1];
  };
  const angleOn = (lobe: Lobe, [x, y]: readonly [number, number]) =>
    (Math.atan2(y - lobe[1], x - lobe[0]) * 180) / Math.PI;

  const joints = lobes.map((lobe, index) =>
    outerIntersection(lobes[(index + lobes.length - 1) % lobes.length]!, lobe),
  );
  const [startX, startY] = joints[0]!;
  const parts = [`M ${fmt(startX)} ${fmt(startY)}`];
  lobes.forEach((lobe, index) => {
    const from = angleOn(lobe, joints[index]!);
    let to = angleOn(lobe, joints[(index + 1) % lobes.length]!);
    // Die Kette läuft gegen den Uhrzeigersinn, jeder Bogen also mit fallendem Winkel.
    while (to >= from) to -= 360;
    parts.push(arcSegments(lobe[0], lobe[1], lobe[2], from, to));
  });
  parts.push('Z');
  return parts.join(' ');
}

/**
 * Sinuswelle der Glasfaser (J.4.15): von (8|12) bis (24|12), drei volle Perioden (Wellenlänge
 * 16/3 mm), Amplitude 2 mm, beginnt steigend (nach oben). Jede Viertelperiode ist eine kubische
 * Näherung der Sinuskurve (Kontrollpunkte 0,5123 und 1,0023 im Bogenmaß, Fehler < 0,1 %).
 */
function sineWavePath(): string {
  const x0 = 8;
  const midY = 12;
  const amplitude = 2;
  const wavelength = 16 / 3;
  const quarters = 12;
  const px = (phase: number) => fmt(x0 + (phase * wavelength) / (2 * Math.PI));
  const py = (value: number) => fmt(midY - amplitude * value);
  const half = Math.PI / 2;
  const parts = [`M ${px(0)} ${py(0)}`];
  for (let q = 0; q < quarters; q += 1) {
    const start = q * half;
    const sign = q % 4 < 2 ? 1 : -1;
    if (q % 2 === 0) {
      parts.push(
        `C ${px(start + 0.5123)} ${py(sign * 0.5123)} ${px(start + 1.0023)} ${py(sign)} ` +
          `${px(start + half)} ${py(sign)}`,
      );
    } else {
      parts.push(
        `C ${px(start + half - 1.0023)} ${py(sign)} ${px(start + half - 0.5123)} ` +
          `${py(sign * 0.5123)} ${px(start + half)} ${py(0)}`,
      );
    }
  }
  return parts.join(' ');
}

/**
 * Die Netz- und Gerätezeichen aus J.4.1 bis J.4.7. Anders als J.3 ist hier keine Darstellung
 * typografisch — jede trägt eine eigene Marke, und die Marken unterscheiden sich deutlich
 * genug, dass kein Kürzel nötig ist.
 */
export const NETWORK_COMMS = deepFreeze([
  /**
   * Router: Kreis um (16|16) mit r 12, durch ein Achsenkreuz geviertelt. Die senkrechten Spitzen
   * (Basis 8 mm auf y 9 bzw. 23, Spitze am Kreis) zeigen nach außen, die waagerechten (Basis
   * 8 mm auf x 11 bzw. 21) zur Mitte — die Richtung ist die Aussage, nicht die Zahl der Pfeile.
   */
  defineComms({
    section: 'J.4.1',
    id: 'router',
    title: 'Router',
    referenceAsset: 'J.4.1_Router.svg',
    box: NETWORK_BOX,
    contrastPairs: NETWORK_CONTRAST,
    primitives: [
      commsCircle(16, 16, 12, J_WHITE_BODY),
      stroke(4, 16, 28, 16),
      stroke(16, 4, 16, 28),
      arrowhead([
        [12, 9],
        [16, 4],
        [20, 9],
      ]),
      arrowhead([
        [12, 23],
        [16, 28],
        [20, 23],
      ]),
      arrowhead([
        [11, 12],
        [16, 16],
        [11, 20],
      ]),
      arrowhead([
        [21, 12],
        [16, 16],
        [21, 20],
      ]),
    ],
  }),
  /**
   * Switch: vier gegenläufige Pfeile im Quadrat — Wege, die sich kreuzen, ohne sich zu treffen.
   * Links zeigende Pfeile auf y 9 und 18 (Spitze x 5, Basis x 10, Schaft bis x 17), rechts
   * zeigende auf y 14 und 23 (Schaft ab x 15, Basis x 22, Spitze x 27). Spitzen 8 mm hoch.
   */
  defineComms({
    section: 'J.4.2',
    id: 'switch',
    title: 'Switch',
    referenceAsset: 'J.4.2_Switch.svg',
    box: NETWORK_BOX,
    contrastPairs: NETWORK_CONTRAST,
    primitives: [
      // Der Körper steht zuerst: er ist weiß gefüllt und würde jede Marke überdecken, die vor
      // ihm in der Liste steht.
      networkBody(),
      ...[9, 18].flatMap((y) => [
        arrowhead([
          [10, y - 4],
          [10, y + 4],
          [5, y],
        ]),
        stroke(10, y, 17, y),
      ]),
      ...[14, 23].flatMap((y) => [
        arrowhead([
          [22, y - 4],
          [22, y + 4],
          [27, y],
        ]),
        stroke(15, y, 22, y),
      ]),
    ],
  }),
  /**
   * Server: vier gefüllte Riegel 9 × 3,5 mm ab x 6 in der Teilung 5,5 mm (y 6, 11,5, 17, 22,5)
   * neben einer gefüllten Spitze (17|6) → (27|16) → (17|26).
   */
  defineComms({
    section: 'J.4.3',
    id: 'server',
    title: 'Server',
    referenceAsset: 'J.4.3_Server.svg',
    box: NETWORK_BOX,
    contrastPairs: NETWORK_CONTRAST,
    primitives: [
      networkBody(),
      ...[6, 11.5, 17, 22.5].map((y) => commsRect(6, y, 9, 3.5, COMMS_BLACK_FILL)),
      arrowhead([
        [17, 6],
        [27, 16],
        [17, 26],
      ]),
    ],
  }),
  /**
   * Access Point: drei konzentrische Bögen um (16|22) mit r 14, 10 und 6 über einem gefüllten
   * Punkt r 2 im Mittelpunkt. Die Bögen liegen symmetrisch zur Senkrechten; ihre halben
   * Öffnungswinkel (44°, 46°, 50,5°) sind an den Endpunkten der Referenz abgelesen.
   */
  defineComms({
    section: 'J.4.4',
    id: 'access-point',
    title: 'Access Point',
    referenceAsset: 'J.4.4_Access Point.svg',
    box: NETWORK_BOX,
    contrastPairs: NETWORK_CONTRAST,
    primitives: [
      networkBody(),
      commsPath(arcPath(16, 22, 14, -90 - 44, -90 + 44), J_STROKE),
      commsPath(arcPath(16, 22, 10, -90 - 46, -90 + 46), J_STROKE),
      commsPath(arcPath(16, 22, 6, -90 - 50.5, -90 + 50.5), J_STROKE),
      commsCircle(16, 22, 2, COMMS_BLACK_FILL),
    ],
  }),
  /**
   * WAN: eine Wolke — der einzige Körper des Anhangs, der weder Quadrat noch Kreis ist. Sie ist
   * die Außenkontur von sieben Kreisen (Mittelpunkt, Radius): (23|12) 5, (16|12) 8, (6|14) 5,
   * (8|19) 5, (13|23) 5, (19|21) 6, (25|18) 6. Hülle 1 … 31 × 4 … 28 mm.
   */
  defineComms({
    section: 'J.4.5',
    id: 'wan',
    title: 'WAN',
    referenceAsset: 'J.4.5_WAN.svg',
    box: { xMm: 1, yMm: 4, widthMm: 30, heightMm: 24 },
    contrastPairs: NETWORK_CONTRAST,
    primitives: [
      commsPath(
        cloudPath([
          [23, 12, 5],
          [16, 12, 8],
          [6, 14, 5],
          [8, 19, 5],
          [13, 23, 5],
          [19, 21, 6],
          [25, 18, 6],
        ]),
        J_WHITE_BODY,
      ),
    ],
  }),
  /**
   * Firewall: ein Mauerwerk aus vier Ziegelreihen à 6 mm (Lagerfugen y 10, 16, 22). Stoßfugen
   * in Reihe 1 und 3 bei x 8, 16, 24, in Reihe 2 und 4 versetzt bei x 12 und 20.
   */
  defineComms({
    section: 'J.4.6',
    id: 'firewall',
    title: 'Firewall',
    referenceAsset: 'J.4.6_Firewall.svg',
    box: NETWORK_BOX,
    contrastPairs: NETWORK_CONTRAST,
    primitives: [
      networkBody(),
      ...[10, 16, 22].map((y) => stroke(4, y, 28, y)),
      ...[8, 16, 24].flatMap((x) => [stroke(x, 4, x, 10), stroke(x, 16, x, 22)]),
      ...[12, 20].flatMap((x) => [stroke(x, 10, x, 16), stroke(x, 22, x, 28)]),
    ],
  }),
  /**
   * Drucker: das Gehäuse 7 … 25 × 13 … 24 mm im Körper, das ausgeworfene Blatt als 45°-Schräge
   * von der Gehäuseoberkante (13|13) nach (19|7).
   */
  defineComms({
    section: 'J.4.7',
    id: 'printer',
    title: 'Drucker',
    referenceAsset: 'J.4.7_Drucker.svg',
    box: NETWORK_BOX,
    contrastPairs: NETWORK_CONTRAST,
    primitives: [networkBody(), commsRect(7, 13, 18, 11, J_STROKE), stroke(13, 13, 19, 7)],
  }),
  /**
   * Längenverbindung: die Verbindung, ein Teilungsstrich (16|13) → (16|19) und darunter ein
   * offener Pfeil, der auf ihn zeigt. Das „L" benennt die Größe Länge — es ist **kein**
   * Wertplatzhalter, die Referenz enthält keine Zahl. Damit fällt J.4.8 aus der Regel heraus,
   * die für J.4.17 weiter gilt. „L": Referenztinte 19,6 … 22,4 × 19,1 … 24 mm, Grundlinie 24 mm;
   * Arimo Bold mit 6,2 mm Schriftgrad (Mittel aus Höhen- und Breitenpassung wie in J.3).
   */
  defineComms({
    section: 'J.4.8',
    id: 'connection-length',
    title: 'Längenverbindung',
    referenceAsset: 'J.4.8_Längenverbindung.svg',
    box: { xMm: 1, yMm: 13, widthMm: 30, heightMm: 11.3 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [
      connection(),
      stroke(16, 13, 16, 19),
      ...openArrowUp(),
      commsText('L', {
        x: 19,
        y: 24,
        sizeMm: 6.2,
        anchor: 'start',
        boxMm: { xMm: 19.1, yMm: 19.4, widthMm: 3.8, heightMm: 4.9 },
        minRenderPx: 64,
        fontWeight: 700,
      }),
    ],
  }),
  /**
   * Abholpunkt: ein offenes Kästchen 1 … 7 × 13 … 19 mm mit gefülltem Punkt r 1 in der Mitte
   * (4|16); die Verbindung beginnt an seiner rechten Kante.
   */
  defineComms({
    section: 'J.4.9',
    id: 'pickup-point',
    title: 'Abholpunkt',
    referenceAsset: 'J.4.9_Abholpunkt.svg',
    box: { xMm: 1, yMm: 13, widthMm: 30, heightMm: 6 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [
      commsRect(1, 13, 6, 6, J_STROKE),
      commsCircle(4, 16, 1, COMMS_BLACK_FILL),
      stroke(7, 16, 31, 16),
    ],
  }),
  /**
   * Anschlusspunkt: dieselbe Verbindung, auf ihr ein Kreuz um (16|16) mit 3 mm langen Armen im
   * 45°-Winkel (±2,1 mm je Achse), darunter zwei Zeiger — der offene Pfeil wie in J.4.8 und eine
   * gefüllte Spitze (18|24) → (20|20) → (22|24).
   */
  defineComms({
    section: 'J.4.10',
    id: 'connection-point',
    title: 'Anschlusspunkt',
    referenceAsset: 'J.4.10_Anschlusspunkt.svg',
    box: { xMm: 1, yMm: 13.9, widthMm: 30, heightMm: 10.1 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [
      connection(),
      stroke(13.9, 13.9, 18.1, 18.1),
      stroke(18.1, 13.9, 13.9, 18.1),
      ...openArrowUp(),
      arrowhead([
        [18, 24],
        [20, 20],
        [22, 24],
      ]),
    ],
  }),
  /**
   * Kreuzung ohne Verbindung: die senkrechte Leitung weicht der waagerechten mit einem
   * Halbkreis r 4 um (16|16) nach links aus. Genau das unterscheidet sie von einer Verbindung,
   * die sich trifft.
   */
  defineComms({
    section: 'J.4.11',
    id: 'connection-crossing',
    title: 'Kreuzung von Verbindungen',
    referenceAsset: 'J.4.11_Kreuzung von Verbindungen.svg',
    box: { xMm: 1, yMm: 1, widthMm: 30, heightMm: 30 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [
      connection(),
      stroke(16, 1, 16, 12),
      commsPath(arcPath(16, 16, 4, 270, 90), J_STROKE),
      stroke(16, 20, 16, 31),
    ],
  }),
  /**
   * Verteiler: eine Verzweigung im Körper — ein Weg wird zu zweien. Schenkel von (10|7) und
   * (22|7) im 45°-Winkel zum Knoten (16|13), Stamm bis y 25 mm.
   */
  defineComms({
    section: 'J.4.12',
    id: 'distributor',
    title: 'Verteiler',
    referenceAsset: 'J.4.12_Verteiler.svg',
    box: NETWORK_BOX,
    contrastPairs: NETWORK_CONTRAST,
    primitives: [
      networkBody(),
      strokes([
        [10, 7],
        [16, 13],
        [22, 7],
      ]),
      stroke(16, 13, 16, 25),
    ],
  }),
  /**
   * Derselbe Verteiler mit einem Blitz rechts am Stamm — der Überspannungsschutz. Der Blitz
   * läuft von (22|16) über (18|19) und (20|20) zum Stamm bei (16|23).
   */
  defineComms({
    section: 'J.4.13',
    id: 'distributor-with-surge-protection',
    title: 'Verteiler mit Überspannungsschutz',
    referenceAsset: 'J.4.13_Verteiler mit Überspannschutz.svg',
    box: NETWORK_BOX,
    contrastPairs: NETWORK_CONTRAST,
    primitives: [
      networkBody(),
      strokes([
        [10, 7],
        [16, 13],
        [22, 7],
      ]),
      stroke(16, 13, 16, 25),
      strokes([
        [22, 16],
        [18, 19],
        [20, 20],
        [16, 23],
      ]),
    ],
  }),
  /** Temporär verlegtes Kabel: die Verbindung zwischen zwei Querstrichen. */
  defineComms({
    section: 'J.4.14',
    id: 'cable-temporary',
    title: 'Kabel, temporär verlegt',
    referenceAsset: 'J.4.14_Kabel_temporär verlegt.svg',
    box: { xMm: 1, yMm: 11, widthMm: 30, heightMm: 10 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [connection(), ...temporaryTicks()],
  }),
  /** Dieselbe Verlegung als Glasfaser: eine Sinuswelle über der Strecke. */
  defineComms({
    section: 'J.4.15',
    id: 'fiber-temporary',
    title: 'Glasfaser, temporär verlegt',
    referenceAsset: 'J.4.15_Glasfaser_temporär verlegt.svg',
    box: { xMm: 1, yMm: 10, widthMm: 30, heightMm: 11 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [connection(), ...temporaryTicks(), commsPath(sineWavePath(), J_STROKE)],
  }),
  /**
   * Und als Netzwerkkabel: eine Rechteckwelle statt der Sinuswelle — digital statt optisch.
   * Oberkante y 7, Senke y 13 zwischen x 12 und 20, Enden bei x 9 und 23.
   */
  defineComms({
    section: 'J.4.16',
    id: 'network-cable-temporary',
    title: 'Netzwerkkabel, temporär verlegt',
    referenceAsset: 'J.4.16_Netzwerkkabel_temporär verlegt.svg',
    box: { xMm: 1, yMm: 7, widthMm: 30, heightMm: 14 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [
      connection(),
      ...temporaryTicks(),
      strokes([
        [9, 7],
        [12, 7],
        [12, 13],
        [20, 13],
        [20, 7],
        [23, 7],
      ]),
    ],
  }),
  /**
   * Anzahl Doppeladern: die Verbindung mit einem 45°-Schrägstrich (11|21) → (20|12). Die „8" der
   * Referenz ist der einzutragende Wert und wird **nicht** gezeichnet — auch nicht als Text.
   * `content` ist ein festes Feld; eine gesetzte Ziffer erklärte einen Beispielwert zur
   * Zeichenbedeutung.
   */
  defineComms({
    section: 'J.4.17',
    id: 'twisted-pair-count',
    title: 'Anzahl Doppeladern',
    referenceAsset: 'J.4.17_Anzahl Doppeladern.svg',
    box: { xMm: 1, yMm: 12, widthMm: 30, heightMm: 9 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [connection(), stroke(11, 21, 20, 12)],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
