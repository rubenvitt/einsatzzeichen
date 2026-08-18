import type { Length } from './geometry.js';

/**
 * Eine Marke der Fahrwerkszone, bezogen auf deren **Oberkante** — und die ist die Unterkante des
 * Körpers, nicht der obere Rand der Grundfläche. `cyFromTopMm` ist der Abstand von dort zur
 * Mittellinie der Marke.
 *
 * **Warum ein eigener Typ neben `HeadMark` und nicht dessen Wiederverwendung:** `HeadMark`
 * verankert ausdrücklich an der Oberkante der Kopfzone und kennt nur Kreise
 * (`{ cxMm, cyFromTopMm, rMm }`). Die Fahrwerkszone verankert an der Körperunterkante und braucht
 * drei Formen, die alle drei an der Referenz vermessen sind (18. August 2026, Kapitel 5.1):
 *
 * - `wheel` — Rad. Kreis, Mittellinienradius 2,25 mm, Strich 0,5 (gemessener Innenring
 *   1,7501…5,7503 an `5.1.1.1`, also r 2,0001; Außenkante 30,7502 bei Mitte 28,2501, also
 *   r 2,5001).
 * - `track` — Kette. Stadion, also ein Rechteck mit `rx` = halbe Höhe; Mittellinienradius 2,25,
 *   Endmitten 4,25 und 27,75 (gemessenes Innenstadion `5.1.1.5`: 2,2500/26,2502/29,7501/30,2500).
 * - `bar` — waagerechter Verbindungsstrich zwischen zwei benachbarten Rädern (`5.1.1.3`).
 *   Mittellinie auf derselben Höhe wie die Radmitten, Strich 0,5 (gemessene Ober- und Unterkante
 *   28,0000 und 28,5002).
 *
 * Eine Marke trägt keine Farbe: die Fahrwerkszone ist im gesamten vermessenen Bestand schwarze
 * Kontur ohne Füllung — die Radinnenflächen der Referenz sind Löcher, keine gefüllten Scheiben
 * (nachgemessen an den Umrissebenen von `5.1.1.1` bis `5.1.1.6`, `5.1.2.4`, `5.1.2.5` und allen
 * 25 E.2-Zeichen mit Fahrwerk — 21 mit einer Fahrzeugkategorie, vier mit einem
 * Anhängerfahrwerk, für das die Taxonomie keinen Wert kennt).
 */
export type ChassisMark =
  | { readonly type: 'wheel'; readonly cxMm: Length; readonly cyFromTopMm: Length; readonly rMm: Length }
  | {
      readonly type: 'track';
      readonly leftCxMm: Length;
      readonly rightCxMm: Length;
      readonly cyFromTopMm: Length;
      readonly rMm: Length;
    }
  | {
      readonly type: 'bar';
      readonly fromXMm: Length;
      readonly toXMm: Length;
      readonly cyFromTopMm: Length;
    };

/**
 * Fahrwerkszone eines Zeichens (Kapitel 5.1), relativ zu ihrer eigenen Oberkante. Wo diese
 * Oberkante absolut liegt, entscheidet der Kompositionsmotor aus der Hülle des **platzierten**
 * Körpers: die Zone hängt an dessen Unterkante, wie die Fußzone auch.
 *
 * `heightMm` ist die volle Höhe der Zone einschließlich der Strichbreite (gemessen 4,75 mm:
 * Körperunterkante 26,0004 bis Fahrwerksunterkante 30,7502 in allen 25 E.2-Zeichen mit Fahrwerk
 * und in `5.1.1.1` bis `5.1.1.6`). Sie wird gebraucht, um die Zone gegen andere Zonen unterhalb
 * des Körpers abzugrenzen — heute gegen die Fußzone, die bei `Körperunterkante + 1` beginnt und
 * sich mit ihr überschnitte.
 *
 * In `schema` deklariert, aus demselben Grund wie `HeadShape`: `catalog` erzeugt die Werte,
 * `core` verbraucht sie, beide hängen ohnehin von `schema` ab.
 */
export interface ChassisShape {
  readonly marks: readonly ChassisMark[];
  readonly heightMm: Length;
}
