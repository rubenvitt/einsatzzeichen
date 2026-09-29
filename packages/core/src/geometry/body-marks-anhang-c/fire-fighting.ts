import type { Primitive } from '@einsatzzeichen/schema';
import type { AnhangCContext, MarkTable } from './shared.js';
import { stroke } from './shared.js';

/*
 * C.2.4 bis C.2.13, C.2.29 und C.2.31: Brandbekämpfung (4.3.1) am Landfahrzeug, am Anhänger und am Kettenfahrzeug, dazu der Drohnenwinkel aus C.2.31 (LFH-786).
 *
 * Die Einzeldarstellung 4.3.1 verzweigt in der Mitte ihrer Box (16|16) und führt die Schenkel mit
 * 12 mm waagerecht auf 10 mm senkrecht bis (28|6) und (28|26); der Balken endet bei x = 30. Keine
 * der drei Körperfassungen hier ist eine Verkleinerung davon: in allen läuft die Waagerechte von
 * Körperkante zu Körperkante, die Verzweigung sitzt 9 oder 10 mm vor der rechten Kante statt in der
 * Mitte, und die Schenkel enden auf der rechten Körperkante. Die Körpermaße sind absolut 1 bzw. 4
 * bis 31 mm breit, die Waagerechte liegt in allen Dateien auf y = 16.
 */

function filledPolygon(points: readonly (readonly [number, number])[]): Primitive {
  return {
    type: 'polyline',
    role: 'pictogram',
    points,
    closed: true,
    style: { fill: 'schwarz', stroke: 'none' },
  };
}

/** Landfahrzeug ohne Variante (30 × 20,25 mm, Hülle 1 / 5,75 / 31 / 26). */
const VEHICLE_LAND_MARKS: MarkTable = {
  /**
   * C.2.4 bis C.2.13: 4.3.1 Brandbekämpfung am Landfahrzeug, randbündig. Alle zehn Dateien führen
   * die Marke bytegleich, mit zwei Rädern (x 3,75 / 28,25, Kategorie 1) wie mit dreien (C.2.10,
   * zusätzlich x 16, Kategorie 2); die Fassung gilt deshalb ohne Fahrwerksbedingung.
   *
   * | Kante (Referenz, Umriss) | Wert | Mittellinie |
   * |---|---|---|
   * | Waagerechte | y 15,7497…16,2496, ab x 1,2502 (Innenkante des Körperstrichs) | y 16,0 von x 1 bis 31 |
   * | oberer Schenkel, Unterkante | (21,6033\|15,7501) → (30,7498\|6,6036): x + y = 37,3534 | x + y = 37,0: (21\|16) → (31\|6) |
   * | unterer Schenkel, Oberkante | (21,6033\|16,2496) → (30,7501\|25,3964): x − y = 5,3537 | x − y = 5,0: (21\|16) → (31\|26) |
   *
   * Die Mittellinie liegt 0,25 · √2 = 0,3536 mm neben der Umrisskante. Konstruiert ist die
   * Formationsfassung der C.1-Löschmarke (`MARKS['fire-fighting']` in `body-marks.ts`) auf die
   * Fahrzeughülle übertragen: Waagerechte 10 mm über der geraden Unterkante (nicht auf halber
   * Hüllenhöhe 15,875 — die Oberkante 5,75 ist der Sehnenpunkt der gewölbten Deckkurve),
   * Verzweigung 10 mm vor der rechten Kante, beide Schenkel unter 45° um 10 mm senkrecht bis auf
   * die rechte Kante. Das Ende des oberen Schenkels bei (31|6) liegt im Körperstrich und ist nur
   * durch seine Richtung belegt.
   */
  'fire-fighting': (bounds) => {
    const cy = bounds.maxY - 10;
    const branchX = bounds.maxX - 10;
    return [
      stroke(bounds.minX, cy, bounds.maxX, cy),
      stroke(branchX, cy, bounds.maxX, cy - 10),
      stroke(branchX, cy, bounds.maxX, cy + 10),
    ];
  },
};

/** Anhänger ohne Variante (27 × 20,25 mm, Hülle 4 / 5,75 / 31 / 26). */
const TRAILER_MARKS: MarkTable = {
  /**
   * C.2.29: 4.3.1 Brandbekämpfung am Anhänger (`C.2.29_Tragkraftspritzenanhänger.svg`), randbündig.
   *
   * | Kante (Referenz, Umriss) | Wert | Mittellinie |
   * |---|---|---|
   * | Waagerechte | y 15,7501…16,2499, ab x 4,2499 (Innenkante des Körperstrichs) | y 16,0 von x 4 bis 31 |
   * | oberer Schenkel, Unterkante | (22,5615\|15,7501) → (30,7501\|6,6516), Richtung 0,6690 : −0,7433 | (22\|16) → (31\|6) |
   * | unterer Schenkel, Oberkante | (22,5615\|16,2499) → (30,7501\|25,3488), gespiegelt | (22\|16) → (31\|26) |
   *
   * Zurückgerechnet (0,25 mm senkrecht zur Kante) trifft die Mittellinie y = 16 bei x = 22,0003 und
   * x = 31 bei y = 6,0000. Die Schenkel stehen damit **nicht** unter 45° wie am Landfahrzeug:
   * Verzweigung 9 mm vor der rechten Kante, 10 mm senkrecht, Steigung 10 : 9. Das Bild entspricht
   * der Landfahrzeugfassung, waagerecht 0,9-fach um x = 31 gestaucht — genau so, wie der
   * Anhängerrumpf aus dem Landfahrzeugrumpf entsteht (`trailer` in `base-symbols.ts`). Gezeichnet
   * ist trotzdem das gemessene Bild und keine Stauchung: Waagerechte 10 mm über der Unterkante von
   * Kante zu Kante, Schenkel von (rechte Kante − 9 | 16) auf die rechte Kante ± 10 mm; der Strich
   * bleibt 0,5 mm.
   */
  'fire-fighting': (bounds) => {
    const cy = bounds.maxY - 10;
    const branchX = bounds.maxX - 9;
    return [
      stroke(bounds.minX, cy, bounds.maxX, cy),
      stroke(branchX, cy, bounds.maxX, cy - 10),
      stroke(branchX, cy, bounds.maxX, cy + 10),
    ];
  },
};

/** Kettenfahrzeug (`inverted-hull-track`, 30 × 19,75 mm, Hülle 1 / 6 / 31 / 25,75). */
const INVERTED_HULL_TRACK_MARKS: MarkTable = {
  /**
   * C.2.31: 4.3.1 Brandbekämpfung am Kettenfahrzeug (`C.2.31_geschützte Löschdrohne.svg`),
   * randbündig. Die Unterkante dieses Körpers ist nach oben gewölbt (Scheitel 23,56 in der Mitte,
   * Ecken 25,75); der untere Schenkel endet deshalb nicht in der Ecke.
   *
   * | Kante (Referenz, Umriss) | Wert | Mittellinie |
   * |---|---|---|
   * | Waagerechte | y 15,7497…16,2499, ab x 1,2499 | y 16,0 von x 1 bis 31 |
   * | oberer Schenkel, Unterkante | (21,6033\|15,7501) → (30,7501\|6,6036): x + y = 37,3534 | (21\|16) → (31\|6), die obere rechte Ecke |
   * | unterer Schenkel, Unterkante | (20,8999\|16,2499) → (30,4450\|25,3177), Richtung 9,5451 : 9,0678 | (21\|16) → (31\|25,5) |
   * | unterer Schenkel, Oberkante | (21,6259\|16,2499) → (30,7498\|24,9177), dieselbe Richtung | dieselbe Mittellinie |
   *
   * Zurückgerechnet trifft die Mittellinie des unteren Schenkels y = 16 bei x = 20,9998 und x = 31
   * bei y = 25,500. Der Schenkel ist also um 0,5 mm flacher als die 45° am Landfahrzeug (Steigung
   * 9,5 : 10) und endet 0,25 mm über der Hüllenecke, im Körperstrich. Waagerechte und oberer
   * Schenkel stimmen mit der Landfahrzeugfassung überein: y = Oberkante + 10 (die Oberkante dieses
   * Körpers ist gerade), Verzweigung 10 mm vor der rechten Kante.
   *
   * In C.2.31 steht die Marke zusammen mit `track-chevron-top`; eine Einzeldarstellung am
   * Kettenfahrzeug ohne den Winkel gibt es in der Quelle nicht. Beide Marken überdecken sich nicht:
   * am nächsten kommen sich die rechte Winkelspitze (23|9,2) und der obere Schenkel, der bei x 23
   * auf y 14 liegt. Die Fassung ist daher als Einzelfassung dieses Körpers eingetragen und nicht als
   * Kombinationsausnahme — ein Schluss aus Körperform und Überschneidungsfreiheit, keine Messung
   * einer Einzeldarstellung.
   */
  'fire-fighting': (bounds) => {
    const cy = bounds.minY + 10;
    const branchX = bounds.maxX - 10;
    return [
      stroke(bounds.minX, cy, bounds.maxX, cy),
      stroke(branchX, cy, bounds.maxX, bounds.minY),
      stroke(branchX, cy, bounds.maxX, bounds.maxY - 0.25),
    ];
  },

  /**
   * C.2.31: der gefüllte Winkel über der Löschmarke, die Drohnenkennzeichnung des Kettenfahrzeugs
   * (Motiv aus Kapitel 3.6). In der Referenz eine Vollfläche ohne Kontur mit den Ecken
   *
   * | Punkt | Referenz (mm) | relativ zur Hülle |
   * |---|---|---|
   * | untere Spitze | (15,9998\|13,9999) | (Mitte \| Oberkante + 8) |
   * | äußere Enden unten | (8,9997\|9,2001) / (22,9996\|9,2001) | (Mitte ∓ 7 \| Oberkante + 3,2) |
   * | äußere Enden oben | (8,9997\|7,9999) / (22,9996\|7,9999) | (Mitte ∓ 7 \| Oberkante + 2) |
   * | innere Spitze | (15,9998\|11,6000) | (Mitte \| Oberkante + 5,6) |
   *
   * In Punkt gerechnet sind das glatte Werte (19,843 pt = 7,0 mm, 13,606 = 4,8, 3,402 = 1,2,
   * 10,205 = 3,6). Der Winkel ist nicht der Formationswinkel `formation-chevron-top` (I.1.20:
   * halbe Breite 5,333, Schenkeldicke 1,0 bzw. 2,0 mm senkrecht, Spitzen bei Oberkante + 3,5 und
   * + 5,5): halbe Breite, Tiefe und Dicke sind je für sich anders gemessen.
   */
  'track-chevron-top': (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const top = bounds.minY;
    return [filledPolygon([
      [cx, top + 8],
      [cx - 7, top + 3.2],
      [cx - 7, top + 2],
      [cx, top + 5.6],
      [cx + 7, top + 2],
      [cx + 7, top + 3.2],
    ])];
  },
};

export const FIRE_FIGHTING_CONTEXTS: readonly AnhangCContext[] = [
  { kind: 'vehicle-land', marks: VEHICLE_LAND_MARKS },
  { kind: 'trailer', marks: TRAILER_MARKS },
  { kind: 'vehicle-land', bodyVariant: 'inverted-hull-track', marks: INVERTED_HULL_TRACK_MARKS },
];
