import { deepFreeze } from '../../readonly-data.js';
import {
  defineComms,
  type CatalogPictogramDefinition,
  type PictogramContrastPair,
} from '../catalog-definition.js';
import {
  commsCircle,
  commsLine,
  commsPath,
  commsPolyline,
  commsRect,
  commsText,
  COMMS_REFERENCE_STROKE,
  COMMS_REFERENCE_WHITE_BODY,
  CONNECTION_CONTRAST,
} from './authoring.js';

/*
 * Anhang J.3 — Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert.
 *
 * Alle Striche sind 0,5 mm stark (1,417 pt in den BABZ-Dateien); die Koordinaten unten sind die
 * Mittellinien dieser Striche. Der Gerätekörper ist das Quadrat 4 … 28 mm.
 */

/** Schwarzer Strich in Referenzstärke (0,5 mm), ohne Füllung. */
export const J_STROKE = COMMS_REFERENCE_STROKE;

/** Weiße Fläche mit 0,5-mm-Kontur — Körper der Geräte- und Netzzeichen. */
export const J_WHITE_BODY = COMMS_REFERENCE_WHITE_BODY;

/** Drei Nachkommastellen reichen für jede Pfadkoordinate (1 µm). */
function fmt(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

/**
 * Kubische Segmente eines Kreisbogens, ohne einleitendes `M`. Das Kommando-Gate lässt `A` nicht
 * zu; der Bogen wird deshalb in Teilstücke zerlegt, die an jeder Achsenrichtung (0°, 90°, 180°,
 * 270°) enden. So liegt jedes Teilstück in einem Quadranten, seine Kontrollpunkte bleiben
 * innerhalb der Bogenhülle, und das Box-Gate misst nichts, was nicht gezeichnet ist.
 *
 * Winkel in Grad im Bildschirmsinn: 0° zeigt nach rechts, 90° nach unten. `fromDeg > toDeg`
 * läuft gegen den Uhrzeigersinn.
 */
export function arcSegments(
  cx: number,
  cy: number,
  r: number,
  fromDeg: number,
  toDeg: number,
): string {
  const direction = toDeg >= fromDeg ? 1 : -1;
  const stops = [fromDeg];
  let next = direction > 0 ? Math.floor(fromDeg / 90) * 90 + 90 : Math.ceil(fromDeg / 90) * 90 - 90;
  while (direction > 0 ? next < toDeg : next > toDeg) {
    stops.push(next);
    next += 90 * direction;
  }
  stops.push(toDeg);

  const point = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const;
  };
  const tangent = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return [-Math.sin(rad), Math.cos(rad)] as const;
  };

  const parts: string[] = [];
  for (let index = 1; index < stops.length; index += 1) {
    const a = stops[index - 1]!;
    const b = stops[index]!;
    if (a === b) continue;
    const span = ((b - a) * Math.PI) / 180;
    const k = (4 / 3) * Math.tan(span / 4) * r;
    const [x0, y0] = point(a);
    const [x3, y3] = point(b);
    const [tx0, ty0] = tangent(a);
    const [tx3, ty3] = tangent(b);
    parts.push(
      `C ${fmt(x0 + k * tx0)} ${fmt(y0 + k * ty0)} ${fmt(x3 - k * tx3)} ${fmt(y3 - k * ty3)} ` +
        `${fmt(x3)} ${fmt(y3)}`,
    );
  }
  return parts.join(' ');
}

/** Ein offener Kreisbogen als eigenständiger Pfad. */
export function arcPath(
  cx: number,
  cy: number,
  r: number,
  fromDeg: number,
  toDeg: number,
): string {
  const rad = (fromDeg * Math.PI) / 180;
  return (
    `M ${fmt(cx + r * Math.cos(rad))} ${fmt(cy + r * Math.sin(rad))} ` +
    arcSegments(cx, cy, r, fromDeg, toDeg)
  );
}

/*
 * Kürzel: Die Referenz setzt sie halbfett in einer schmaleren Schrift als Arimo. Gesetzt wird
 * Arimo Bold (`fontWeight: 700`, Ausnahme „mBS"). Der Schriftgrad ist das geometrische Mittel
 * aus Passung auf die Referenzhöhe und auf die Referenzbreite der Tinte, auf 0,05 mm gerundet; die
 * Tintenmitte liegt auf der Referenzmitte. Wo Arimo auf Referenzhöhe den Körper berühren würde
 * („mBS", „APRT"), gilt allein die Referenzbreite.
 */

const DEVICE_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'Kontur des Gerätekörpers auf der Ausgabeoberfläche',
  },
  {
    foreground: 'schwarz',
    background: 'weiss',
    context: 'Kürzel auf dem Gerätekörper',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

/** Weißes Quadrat 4 … 28 mm mit 0,5-mm-Kontur — gemeinsamer Körper der J.3-Gerätezeichen. */
function deviceBody() {
  return commsRect(4, 4, 24, 24, J_WHITE_BODY);
}

/** Die Hülle des Körpers. Die Kürzel liegen innerhalb und erweitern sie nicht. */
const DEVICE_BOX = { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 } as const;

/**
 * Ein dreistelliges Kürzel in Referenzlage: Versalhöhe 7,3 mm (11,7 … 19,0 mm), Grundlinie
 * 19 mm, Tintenmitte x ≈ 16,5 mm. Der Schriftgrad (9,65 … 10,05 mm) hängt von der
 * Referenzbreite des jeweiligen Kürzels ab.
 *
 * `minRenderPx: 32`: unter 10,67 mm Schriftgrad bleibt ein Lauf bei 24 px unter
 * `MINIMUM_TEXT_RENDER_PX`; bei 32 px trägt er rund 10 px.
 */
function deviceLabel(
  content: string,
  sizeMm: number,
  boxMm: { xMm: number; yMm: number; widthMm: number; heightMm: number },
) {
  return commsText(content, {
    x: 16.25,
    y: 19,
    sizeMm,
    boxMm,
    minRenderPx: 32,
    fontWeight: 700,
  });
}

/**
 * Das große „C" der beiden Fernsprechvermittlungen: Referenztinte 12,5 … 19,8 × 11,1 … 21,2 mm,
 * also rund 10 mm Buchstabenhöhe mit Überschwingern; 12,55 mm Schriftgrad, Grundlinie 21,05 mm.
 */
function exchangeLabel() {
  return commsText('C', {
    x: 16.05,
    y: 21.05,
    sizeMm: 12.55,
    boxMm: { xMm: 11.7, yMm: 11.95, widthMm: 8.85, heightMm: 9.55 },
    minRenderPx: 32,
    fontWeight: 700,
  });
}

/** Überstrich der Vermittlungen: 11 … 21 mm auf der Höhe 9 mm. */
function exchangeBar() {
  return commsLine(11, 9, 21, 9, J_STROKE);
}

/**
 * Kleines Kürzel (Gateway, Repeater): Referenzversalhöhe 4,9 mm, daraus 6,9 mm Schriftgrad.
 * `minRenderPx: 64`, weil 6,9 mm bei 32 px nur 6,9 px effektiv tragen.
 */
function smallLabel(
  content: string,
  xMm: number,
  baselineMm: number,
  boxMm: { xMm: number; yMm: number; widthMm: number; heightMm: number },
) {
  return commsText(content, {
    x: xMm,
    y: baselineMm,
    sizeMm: 6.9,
    boxMm,
    minRenderPx: 64,
    fontWeight: 700,
  });
}

/**
 * Die Gerätezeichen aus J.3 unterscheiden sich vom Grundzeichen J.3.1 **durch ihr Kürzel**, nicht
 * durch Marken. Entfernt man aus den Referenzen die Glyphen, sind `J.3.6`, `J.3.7` und `J.3.8`
 * geometrisch identisch — dreimal dasselbe leere Quadrat. Ein früherer Anlauf hat hier Marken
 * erfunden und wurde deshalb zurückgerollt; belegt in
 * `docs/decisions/2026-08-09-anhang-j-ist-typografisch.md`.
 */
export const DEVICE_COMMS = deepFreeze([
  defineComms({
    section: 'J.3.1',
    id: 'telecom-device',
    title: 'Fernmeldegerät (Grundzeichen)',
    referenceAsset: 'J.3.1_Fernmeldegerät Grundzeichen.svg',
    box: DEVICE_BOX,
    contrastPairs: [DEVICE_CONTRAST[0]],
    primitives: [deviceBody()],
  }),
  /**
   * Ortsfeste Basisstation: Kreis um (16|18) mit r 12 und darüber ein Giebel (3|11) → (16|1) →
   * (29|11) — der Giebel steht für den festen Standort und unterscheidet J.3.2 von der mobilen
   * Fassung J.3.3. Die Referenz führt hier **keinen** Quadratkörper wie die übrigen Gerätezeichen.
   * Kürzel „BS": Referenzhöhe 7,55 mm (13,6 … 21,1), 9,15 mm Schriftgrad, Grundlinie 21,05 mm.
   */
  defineComms({
    section: 'J.3.2',
    id: 'base-station',
    title: 'Basisstation',
    referenceAsset: 'J.3.2_Basisstation.svg',
    box: { xMm: 3, yMm: 1, widthMm: 26, heightMm: 29 },
    contrastPairs: DEVICE_CONTRAST,
    primitives: [
      commsCircle(16, 18, 12, J_WHITE_BODY),
      commsPolyline(
        [
          [3, 11],
          [16, 1],
          [29, 11],
        ],
        false,
        J_STROKE,
      ),
      commsText('BS', {
        x: 16.1,
        y: 21.05,
        sizeMm: 9.15,
        boxMm: { xMm: 10.05, yMm: 14.35, widthMm: 12.35, heightMm: 7.1 },
        minRenderPx: 32,
        fontWeight: 700,
      }),
    ],
  }),
  /**
   * Mobile Basisstation: Kreis um (16|16) mit r 12, ohne Giebel. „mBS" läuft in Arimo bei
   * Referenzhöhe in den Kreis hinein; der Schriftgrad (9,15 mm, Arimo Regular — fett lag hier im
   * Pixelvergleich knapp schlechter) folgt deshalb der
   * Referenzbreite 6,75 … 25,5 mm, Grundlinie 19 mm.
   */
  defineComms({
    section: 'J.3.3',
    id: 'mobile-base-station',
    title: 'Mobile Basisstation',
    referenceAsset: 'J.3.3_Mobile Basisstation.svg',
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
    contrastPairs: DEVICE_CONTRAST,
    primitives: [
      commsCircle(16, 16, 12, J_WHITE_BODY),
      commsText('mBS', {
        x: 16.05,
        y: 19.05,
        sizeMm: 9.15,
        boxMm: { xMm: 6.4, yMm: 12.35, widthMm: 19.45, heightMm: 7.1 },
        minRenderPx: 32,
      }),
    ],
  }),
  /**
   * Gateway: die Diagonale (28|4) → (4|28) teilt den Körper in zwei Hälften, je eine Betriebsart.
   * Sie ist echte Geometrie der Referenz und keine erfundene Übergangsmarke — die beiden Kürzel
   * benennen, was ineinander übergeht. „TMO" oben links (Grundlinie 11 mm), „DMO" unten rechts
   * (Grundlinie 26 mm).
   */
  defineComms({
    section: 'J.3.4',
    id: 'gateway',
    title: 'Gateway',
    referenceAsset: 'J.3.4_Gateway.svg',
    box: DEVICE_BOX,
    contrastPairs: DEVICE_CONTRAST,
    primitives: [
      deviceBody(),
      commsLine(28, 4, 4, 28, J_STROKE),
      smallLabel('TMO', 12.5, 11, { xMm: 4.6, yMm: 5.85, widthMm: 15.6, heightMm: 5.55 }),
      smallLabel('DMO', 19.15, 26, { xMm: 11.25, yMm: 20.85, widthMm: 16, heightMm: 5.55 }),
    ],
  }),
  /**
   * Repeater: das Kürzel „DMO" (Grundlinie 15 mm) nennt die Betriebsart, die Marke darunter das
   * Wiederholen — ein Zickzack zwischen zwei Halbkreisen r 2,5 um (8|20,5) und (24|20,5), die
   * sich zur Mitte wölben. Das Zickzack läuft mit Spitzen auf 19 und 22 mm im Raster 2 mm und
   * endet auf den Bögen.
   */
  defineComms({
    section: 'J.3.5',
    id: 'repeater',
    title: 'Repeater',
    referenceAsset: 'J.3.5_Repeater.svg',
    box: DEVICE_BOX,
    contrastPairs: DEVICE_CONTRAST,
    primitives: [
      deviceBody(),
      smallLabel('DMO', 16.05, 15, { xMm: 8.15, yMm: 9.85, widthMm: 16, heightMm: 5.55 }),
      commsPath(arcPath(8, 20.5, 2.5, -90, 90), J_STROKE),
      commsPolyline(
        [
          [10.1, 19.15],
          [12, 22],
          [14, 19],
          [16, 22],
          [18, 19],
          [20, 22],
          [21.9, 19.15],
        ],
        false,
        J_STROKE,
      ),
      commsPath(arcPath(24, 20.5, 2.5, 270, 90), J_STROKE),
    ],
  }),
  defineComms({
    section: 'J.3.6',
    id: 'handheld-radio-terminal',
    title: 'Handheld Radio Terminal',
    referenceAsset: 'J.3.6_Handheld Radio Terminal.svg',
    box: DEVICE_BOX,
    contrastPairs: DEVICE_CONTRAST,
    primitives: [
      deviceBody(),
      deviceLabel('HRT', 9.95, { xMm: 6.35, yMm: 11.85, widthMm: 20.35, heightMm: 7.45 }),
    ],
  }),
  defineComms({
    section: 'J.3.7',
    id: 'mobile-radio-terminal',
    title: 'Mobile Radio Terminal',
    referenceAsset: 'J.3.7_Mobile Radio Terminal.svg',
    box: DEVICE_BOX,
    contrastPairs: DEVICE_CONTRAST,
    primitives: [
      deviceBody(),
      deviceLabel('MRT', 10.05, { xMm: 5.7, yMm: 11.75, widthMm: 21.65, heightMm: 7.55 }),
    ],
  }),
  defineComms({
    section: 'J.3.8',
    id: 'fixed-radio-terminal',
    title: 'Fixed Radio Terminal',
    referenceAsset: 'J.3.8_Fixed Radio Terminal.svg',
    box: DEVICE_BOX,
    contrastPairs: DEVICE_CONTRAST,
    primitives: [
      deviceBody(),
      deviceLabel('FRT', 9.65, { xMm: 7.2, yMm: 12.05, widthMm: 18.65, heightMm: 7.25 }),
    ],
  }),
  /**
   * Vierstelliges Kürzel: „APRT" liefe bei Referenzhöhe in Arimo über den Körper hinaus. Der
   * Schriftgrad (8,7 mm) folgt deshalb der Referenzbreite 4,4 … 27,8 mm, Grundlinie 19 mm.
   * Bei 32 px trägt er 8,7 px effektiv — über `MINIMUM_TEXT_RENDER_PX`.
   */
  defineComms({
    section: 'J.3.9',
    id: 'active-paging-radio-terminal',
    title: 'Active Paging Radio Terminal',
    referenceAsset: 'J.3.9_Active Paging Radio Terminal.svg',
    box: DEVICE_BOX,
    contrastPairs: DEVICE_CONTRAST,
    primitives: [
      deviceBody(),
      commsText('APRT', {
        x: 16.05,
        y: 19,
        sizeMm: 8.7,
        boxMm: { xMm: 4.1, yMm: 12.7, widthMm: 23.9, heightMm: 6.6 },
        minRenderPx: 32,
        fontWeight: 700,
      }),
    ],
  }),
  /**
   * Antenne: Mast (16|2) → (16|30) mit zwei Schrägen, die von (6|2) und (26|2) im 45°-Winkel
   * zum Punkt (16|12) laufen. Kein Körper, kein Kürzel.
   */
  defineComms({
    section: 'J.3.10',
    id: 'antenna',
    title: 'Antenne',
    referenceAsset: 'J.3.10_Antenne.svg',
    box: { xMm: 6, yMm: 2, widthMm: 20, heightMm: 28 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [
      commsLine(16, 2, 16, 30, J_STROKE),
      commsLine(6, 2, 16, 12, J_STROKE),
      commsLine(26, 2, 16, 12, J_STROKE),
    ],
  }),
  /**
   * Kabelbau: Mast (16|11) → (16|30) unter einer nach oben offenen Halbkreisschale r 9 um
   * (16|2); die Schale reicht von (7|2) über (16|11) nach (25|2).
   */
  defineComms({
    section: 'J.3.11',
    id: 'cable-construction',
    title: 'Kabelbau',
    referenceAsset: 'J.3.11_Kabelbau.svg',
    box: { xMm: 7, yMm: 2, widthMm: 18, heightMm: 28 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [
      commsPath(arcPath(16, 2, 9, 180, 0), J_STROKE),
      commsLine(16, 11, 16, 30, J_STROKE),
    ],
  }),
  /**
   * Funk: eine waagerechte Zickzacklinie ohne Körper, von (2|12) bis (30|12) in sechs gleichen
   * Schenkeln (Teilung 28/6 mm), Spitzen abwechselnd auf 20 und 12 mm.
   */
  defineComms({
    section: 'J.3.12',
    id: 'radio',
    title: 'Funk',
    referenceAsset: 'J.3.12_Funk.svg',
    box: { xMm: 2, yMm: 12, widthMm: 28, heightMm: 8 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [
      commsPolyline(
        Array.from({ length: 7 }, (_, index) => [2 + (index * 28) / 6, index % 2 === 0 ? 12 : 20] as const),
        false,
        J_STROKE,
      ),
    ],
  }),
  /**
   * Übergänge: ein liegendes Rechteck 1 … 31 × 6 … 26 mm mit Diagonale (31|6) → (1|26) —
   * dieselbe Teilungsgeste wie im Gateway J.3.4, hier ohne Kürzel, weil kein Betriebsartenpaar
   * benannt wird.
   */
  defineComms({
    section: 'J.3.13',
    id: 'transitions',
    title: 'Übergänge',
    referenceAsset: 'J.3.13_Übergänge.svg',
    box: { xMm: 1, yMm: 6, widthMm: 30, heightMm: 20 },
    contrastPairs: DEVICE_CONTRAST,
    primitives: [commsRect(1, 6, 30, 20, J_WHITE_BODY), commsLine(31, 6, 1, 26, J_STROKE)],
  }),
  /**
   * Fernsprechvermittlung: ein großes „C" unter einem waagerechten Überstrich. Der Überstrich
   * liegt in der Referenz **außerhalb** der Typografiegruppe und ist deshalb eigene Geometrie —
   * eine Linie, kein Makron der Glyphe.
   */
  defineComms({
    section: 'J.3.14',
    id: 'telephone-exchange',
    title: 'Fernsprechvermittlung',
    referenceAsset: 'J.3.14_Fernsprechvermittlung.svg',
    box: DEVICE_BOX,
    contrastPairs: DEVICE_CONTRAST,
    primitives: [deviceBody(), exchangeBar(), exchangeLabel()],
  }),
  /**
   * Dieselbe Vermittlung als VoIP. Ohne das Wort unten links wäre dieses Zeichen von J.3.14 nicht
   * zu unterscheiden — die Referenzgeometrien sind bis auf Rundungsstellen identisch. „VoIP":
   * Versalhöhe 2,9 mm ab x 5,5 mm, Grundlinie 26 mm, daraus 4,1 mm Schriftgrad. Deshalb trägt
   * das Zeichen zwei Läufe mit sehr verschiedenen Einsatzgrenzen: 32 px für das „C", 64 px für
   * das kleine „VoIP".
   */
  defineComms({
    section: 'J.3.15',
    id: 'telephone-exchange-voip',
    title: 'Fernsprechvermittlung VoIP',
    referenceAsset: 'J.3.15_Fernsprechvermittlung VoIP.svg',
    box: DEVICE_BOX,
    contrastPairs: DEVICE_CONTRAST,
    primitives: [
      deviceBody(),
      exchangeBar(),
      exchangeLabel(),
      commsText('VoIP', {
        x: 5.35,
        y: 26,
        sizeMm: 4.1,
        anchor: 'start',
        boxMm: { xMm: 5.05, yMm: 22.85, widthMm: 9.3, heightMm: 3.5 },
        minRenderPx: 64,
        fontWeight: 700,
      }),
    ],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
