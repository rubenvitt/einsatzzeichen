import { noteDerivation } from '../derive/record.js';
import type { ChassisMark, ChassisShape, VehicleCategoryId } from '@einsatzzeichen/schema';

/**
 * Mittellinienradius jeder Radmarke und jedes Kettenendes. Vermessen an `5.1.1.1`, `5.1.1.2`,
 * `5.1.1.3`, `5.1.1.5` und `5.1.1.6`: Innenring 1,7501…5,7503 mm (also r 2,0001) bei Markenmitte
 * 28,2501 mm, Außenkante 30,7502 mm (also r 2,5001). Mittellinie damit 2,2501, Strich 0,5.
 */
const MARK_RADIUS_MM = 2.25;

/**
 * Abstand von der Körperunterkante zur Mittellinie der Fahrwerkszone. Gemessen als Differenz
 * zweier unabhängig abgelesener Zahlen und nicht aus dem Radius abgeleitet: Körperunterkante
 * (Mittellinie der Füllebene) 26,0004 mm, Markenmitte 28,2501 mm — Differenz 2,2497 mm. Dass sie
 * mit dem Markenradius zusammenfällt, ist ein Befund an der Referenz und keine Rechenregel; das
 * Fahrwerk sitzt genau so tief, dass es die Körperunterkante berührt.
 */
const MARK_CY_FROM_TOP_MM = 2.25;

/**
 * Volle Höhe der Zone: bis zur Außenkante der Marken. 2,25 + 2,5 = 4,75 mm, gegengeprüft an der
 * gemessenen Unterkante 30,7502 mm bei Körperunterkante 26,0004 mm (Differenz 4,7498).
 */
const ZONE_HEIGHT_MM = MARK_CY_FROM_TOP_MM + MARK_RADIUS_MM + 0.25;

/**
 * Die drei festen Radplätze der Kraftfahrzeugkategorien, links nach rechts. Vermessen an
 * `5.1.1.1` (äußere zwei: 3,7502 / 28,2499), `5.1.1.2` und `5.1.1.3` (alle drei: 3,7502 /
 * 16,0001 / 28,2499) — und an allen 20 E.2-Zeichen, die eine dieser **drei Kfz-Kategorien**
 * tragen (8 · 7 · 5). Mit dem Kettenfahrzeug E.2.9 sind es 21 mit Fahrzeugkategorie; 25 der 31
 * E.2-Zeichen tragen überhaupt ein Fahrwerk, die vier übrigen ein Anhängerfahrwerk ohne ID.
 *
 * Dieselbe Bauform wie `ROW_SLOTS_MM` in `strengths.ts`, und aus demselben Grund: die Belegung
 * ist das Datum, nicht die Zahl der Marken. Kategorie 1 lässt die Mitte frei, Kategorie 2 und 3
 * besetzen alle drei — Kategorie 3 unterscheidet sich von Kategorie 2 **ausschließlich** durch
 * den Verbindungsstrich. Eine Wertetabelle, die je ID nur eine Belegung führte, ließe die beiden
 * byteidentisch zusammenfallen.
 */
const KFZ_SLOTS_MM = [3.75, 16, 28.25] as const;

/**
 * Radplätze des Schienenfahrzeugs (`5.1.1.6`), vermessen: 3,7504 / 9,2505 / 22,7499 / 28,2501 mm.
 * Eigene Liste und keine Ableitung aus `KFZ_SLOTS_MM`: zwei der vier Plätze kommen dort nicht vor.
 * Der Abstand innerhalb eines Drehgestellpaars ist 5,5 mm und wiederholt sich beim Anhänger
 * `5.1.2.5` (14,2501 / 19,7503) — als Regel ist das nicht belegt, weil beide Fälle dieselbe
 * Zahl nur zweimal zeigen und kein Fall sie variiert.
 */
const RAIL_SLOTS_MM = [3.75, 9.25, 22.75, 28.25] as const;

/**
 * Radplatz des Anhängers mit **einem** Rad, vermessen an `5.1.2.4_Anhänger_von PKW gezogen.svg`
 * (Innenring 15,5000/26,2505/19,4998/30,2503 → cx 17,4999) und an `E.2.22`, `E.2.23`, `E.2.25`
 * zahlengleich wiedergefunden.
 *
 * Er fällt mit dem Scheitel der Anhängerdeckkurve zusammen (17,4999) — das ist ein Befund an der
 * Referenz und **keine** Rechenregel: es gibt im Bestand keine zweite Anhängerbreite, an der sich
 * eine Kopplung prüfen ließe.
 */
const TRAILER_SINGLE_SLOT_MM = [17.5] as const;

/**
 * Radplätze des Anhängers mit **zwei** Rädern, vermessen an
 * `5.1.2.5_Anhänger_von LKW gezogen.svg` (Innenringe 12,2502/26,2505/16,2500/30,2503 und
 * 17,7504/26,2505/21,7502/30,2503 → cx 14,2501 und 19,7503) und an `E.2.24` zahlengleich
 * wiedergefunden.
 *
 * Ihr Abstand 5,5 mm wiederholt den Abstand innerhalb eines Drehgestellpaars von `5.1.1.6`; als
 * Regel ist das weiterhin nicht belegt — beide Fälle zeigen dieselbe Zahl nur je einmal, und
 * keiner variiert sie (siehe `RAIL_SLOTS_MM`).
 */
const TRAILER_PAIR_SLOTS_MM = [14.25, 19.75] as const;

/**
 * Endmitten des Kettenstadions (`5.1.1.5`), vermessen am Innenstadion
 * 2,2500/26,2502/29,7501/30,2500: Innenradius 2,0001, Endmitten 4,2500 und 27,7500.
 *
 * Der Einzug gegenüber den Radplätzen beträgt 0,5 mm (4,25 gegen 3,75). Er ist gemessen und
 * **nicht** ableitbar: dieselbe Familie zieht ihre äußeren Radplätze nicht ein, und es gibt im
 * Bestand keine zweite Kette, an der sich eine Regel prüfen ließe.
 */
const TRACK_END_CX_MM = [4.25, 27.75] as const;

/**
 * Mittellinie der Wellenlinie von `5.1.1.4`, ab Zonenoberkante (Körperunterkante 26,0004 mm).
 *
 * **Konstruiert, nicht abgelesen.** Die Referenz führt die Welle nur als Umriss eines Strichs:
 * zwei parallele Kurvenzüge aus je acht Kubiken (Oberkante und Unterkante), an den Enden durch
 * gerade Stumpfkappen verbunden. Illustrator legt die Stützpunkte beider Kanten paarweise auf
 * dieselbe Normale — ihr Abstand misst an allen neun Paaren 0,4991 … 0,5005 mm, also genau die
 * Strichbreite. Die Mittellinie ist deshalb das punktweise Mittel beider Kanten (Kontrollpunkte
 * eingeschlossen), selbst nachgerechnet am 02.10.2026 aus `5.1.1.4_Amphibienfahrzeug.svg`.
 *
 * Das Ergebnis trifft die fünf waagerechten Stellen der Inventur auf 0,002 mm: Täler bei
 * x 7,5 / 16,0 / 24,5 auf y 29,55, Kuppen bei x 11,303 / 20,697 auf y 26,95 (Mitte 28,25,
 * Amplitude 1,30). Die beiden Hälften sind auf 0,002 mm spiegelgleich um x 16; gespeichert ist die
 * linke Hälfte, gespiegelt — die Radplätze 3,75 / 28,25 liegen ebenfalls symmetrisch um x 16.
 */
const AMPHIBIAN_WAVE_LEFT: readonly (readonly [number, number])[] = [
  [7.5, 3.55],
  [8.199, 3.333], [8.6, 2.823], [9.005, 2.309],
  [9.541, 1.629], [10.076, 0.95], [11.303, 0.95],
  [12.219, 0.95], [12.752, 1.521], [13.312, 2.122],
  [13.95, 2.807], [14.643, 3.55], [16, 3.55],
];

const AMPHIBIAN_WAVE: readonly (readonly [number, number])[] = Object.freeze([
  ...AMPHIBIAN_WAVE_LEFT,
  ...AMPHIBIAN_WAVE_LEFT.slice(0, -1).reverse().map(([x, y]) => [Math.round((32 - x) * 1000) / 1000, y] as const),
]);

/** Baut die Radreihe aus den belegten Plätzen von `KFZ_SLOTS_MM`. */
function wheels(slots: readonly number[]): ChassisMark[] {
  return slots.map((cxMm) => ({
    type: 'wheel' as const,
    cxMm,
    cyFromTopMm: MARK_CY_FROM_TOP_MM,
    rMm: MARK_RADIUS_MM,
  }));
}

/**
 * Der waagerechte Verbindungsstrich der Kategorie 3, je zwischen zwei **benachbarten** Rädern.
 *
 * **Die Endpunkte sind an der Referenz nicht direkt ablesbar — das gemessene Band, in dem sie
 * liegen müssen, ist es.** Der Umriss von `5.1.1.3` verschmilzt Strich und Ringe zu einer
 * Kontur; sichtbar bleiben nur die Kanten des Strichs zwischen den Ringen (gemessen: Oberkante
 * 28,0000, Unterkante 28,5002, Mittellinie damit 28,2501 — dieselbe Höhe wie die Radmitten — und
 * die Übergänge auf den Außenkreisen bei x 6,2375 und 13,5128). Zwei Zahlen grenzen die Lage
 * eines Endpunkts ein, beide selbst gemessen:
 *
 * - Er liegt **mindestens** 2,0 mm neben der Radmitte, sonst durchstieße der Strich die
 *   Radinnenfläche. Die ist in `5.1.1.3` ein vollständiger Kreis (gemessen: 14,0000/26,2502/
 *   18,0001/30,2500, sechs Segmente, unverletzt) — auch am mittleren Rad, das der Strich
 *   überquert.
 * - Er liegt **höchstens** 2,4875 mm neben der Radmitte, sonst risse die Kontur auf: so weit
 *   reicht der Außenkreis (r 2,5) auf der Höhe der Strichkante (Δy 0,25).
 *
 * Der Katalog setzt die Endpunkte auf die **Ringmittellinie** (Radmitte ± 2,25 mm). Das ist die
 * einzige Lage im Band, die von beiden Rändern denselben Abstand hat, und jede Lage im Band
 * erzeugt dasselbe Bild — die Stumpfkappe liegt in allen Fällen vollständig unter dem Ringstrich.
 * Belegt ist das Bild, nicht der Endpunkt. Beide Bandgrenzen sind in `vehicle-categories.test.ts`
 * festgehalten; die Rasterprüfung gegen `5.1.1.3` steht in
 * `docs/decisions/2026-08-18-grundlagen-restpunkte.md`, Abschnitt 1.6 — sie kann im Repo nicht
 * laufen, weil der Referenzordner nie eingecheckt wird.
 */
function bars(slots: readonly number[]): ChassisMark[] {
  const marks: ChassisMark[] = [];
  for (let index = 0; index + 1 < slots.length; index += 1) {
    const left = slots[index];
    const right = slots[index + 1];
    if (left === undefined || right === undefined) continue;
    marks.push({
      type: 'bar',
      fromXMm: left + MARK_RADIUS_MM,
      toXMm: right - MARK_RADIUS_MM,
      cyFromTopMm: MARK_CY_FROM_TOP_MM,
    });
  }
  return marks;
}

/**
 * Fahrwerkszone je Fahrzeugkategorie, nach Kapitel 5.1.1. Alle Kategorien außer
 * `amphibienfahrzeug` sind an der Referenz vollständig vermessen; dessen Wellenlinie ist aus der
 * Strichhülle konstruiert und meldet sich als Ableitung (`noteDerivation`). Keine Kategorie rät
 * eine Anordnung.
 */
export function vehicleChassis(id: VehicleCategoryId): ChassisShape {
  switch (id) {
    case 'kfz-kategorie-1':
      return {
        marks: wheels([KFZ_SLOTS_MM[0], KFZ_SLOTS_MM[2]]),
        heightMm: ZONE_HEIGHT_MM,
      };
    case 'kfz-kategorie-2':
      return { marks: wheels([...KFZ_SLOTS_MM]), heightMm: ZONE_HEIGHT_MM };
    case 'kfz-kategorie-3':
      return {
        // Striche zuerst: sie enden unter den Ringen, und der Ringstrich deckt die Stumpfkappe
        // nur dann sichtbar ab, wenn er nach ihnen gezeichnet wird. Bei gleicher Farbe ist das
        // heute folgenlos — in einem Theme mit anderer Konturfarbe wäre es sichtbar.
        marks: [...bars([...KFZ_SLOTS_MM]), ...wheels([...KFZ_SLOTS_MM])],
        heightMm: ZONE_HEIGHT_MM,
      };
    case 'kettenfahrzeug':
      return {
        marks: [
          {
            type: 'track',
            leftCxMm: TRACK_END_CX_MM[0],
            rightCxMm: TRACK_END_CX_MM[1],
            cyFromTopMm: MARK_CY_FROM_TOP_MM,
            rMm: MARK_RADIUS_MM,
          },
        ],
        heightMm: ZONE_HEIGHT_MM,
      };
    case 'schienenfahrzeug':
      return { marks: wheels([...RAIL_SLOTS_MM]), heightMm: ZONE_HEIGHT_MM };
    case 'anhaenger-ein-rad':
      return { marks: wheels([...TRAILER_SINGLE_SLOT_MM]), heightMm: ZONE_HEIGHT_MM };
    case 'anhaenger-zwei-raeder':
      return { marks: wheels([...TRAILER_PAIR_SLOTS_MM]), heightMm: ZONE_HEIGHT_MM };
    case 'amphibienfahrzeug':
      // `5.1.1.4` trägt dieselben zwei Radplätze wie Kategorie 1 (gemessen: 3,7502 / 28,2499)
      // **und** eine Wellenlinie, die den Unterschied ausmacht. Die Referenz zeichnet sie als
      // Umriss eines 0,5-mm-Strichs; die Mittellinie ist daraus konstruiert (`AMPHIBIAN_WAVE`).
      // Bis zum 02.10.2026 stand hier ein Wurf mit der Notiz „nicht nähern“ — der
      // Eigentümerentscheid vom 02.10.2026 hebt ihn auf, die Zeichnung trägt eine Notiz.
      noteDerivation({
        dimension: 'vehicleCategory',
        part: 'Wellenlinie des Amphibienfahrzeugs als Mittellinie der Strichhülle',
        basis: 'constructed',
        from: '5.1.1.4_Amphibienfahrzeug.svg (Strichumriss 7,4263/26,7000/24,5756/29,7998 mm)',
      });
      return {
        marks: [...wheels([KFZ_SLOTS_MM[0], KFZ_SLOTS_MM[2]]), { type: 'curve', points: AMPHIBIAN_WAVE }],
        heightMm: ZONE_HEIGHT_MM,
      };
  }
}

/**
 * Die Kategorien mit vollständig vermessener Fahrwerkszone. Als Datum lesbar und nicht aus einem
 * `try`/`catch` um `vehicleChassis` erschlossen: der Unterschied zwischen „vermessen" und „nicht
 * vermessen" ist eine Aussage über die Referenz und gehört als solche in den Katalog. Das
 * Amphibienfahrzeug fehlt weiter: gezeichnet wird es seit dem 02.10.2026, vermessen ist seine
 * Wellenlinie nicht.
 */
export const MEASURED_VEHICLE_CATEGORIES: readonly VehicleCategoryId[] = Object.freeze([
  'kfz-kategorie-1',
  'kfz-kategorie-2',
  'kfz-kategorie-3',
  'kettenfahrzeug',
  'schienenfahrzeug',
  'anhaenger-ein-rad',
  'anhaenger-zwei-raeder',
]);
