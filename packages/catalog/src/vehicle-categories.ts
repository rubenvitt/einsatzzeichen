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
 * Endmitten des Kettenstadions (`5.1.1.5`), vermessen am Innenstadion
 * 2,2500/26,2502/29,7501/30,2500: Innenradius 2,0001, Endmitten 4,2500 und 27,7500.
 *
 * Der Einzug gegenüber den Radplätzen beträgt 0,5 mm (4,25 gegen 3,75). Er ist gemessen und
 * **nicht** ableitbar: dieselbe Familie zieht ihre äußeren Radplätze nicht ein, und es gibt im
 * Bestand keine zweite Kette, an der sich eine Regel prüfen ließe.
 */
const TRACK_END_CX_MM = [4.25, 27.75] as const;

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
 * Fahrwerkszone je Fahrzeugkategorie, nach Kapitel 5.1.1. Fünf der sechs Kategorien sind an der
 * Referenz vollständig vermessen; `amphibienfahrzeug` wirft, weil seine Wellenlinie es nicht ist
 * (siehe dort). Keine der fünf rät eine Anordnung.
 *
 * **Warum eine Funktion mit einem Wurf und keine totale Abbildung:** dasselbe Muster wie
 * `organizationColor`, `circleBodyProfile.place` und die Ablehnung einer Organisationsfarbe am
 * offenen Polyzug von `1.13`. Eine erfundene Wellenlinie wäre die Attrappe, die dieses Projekt
 * verbietet; eine ausgelassene ID wäre eine stille Lücke.
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
    case 'amphibienfahrzeug':
      // `5.1.1.4` trägt dieselben zwei Radplätze wie Kategorie 1 (gemessen: 3,7502 / 28,2499)
      // **und** eine Wellenlinie, die den Unterschied ausmacht. Von ihr ist die Strichhülle
      // vermessen (7,4263/26,7000/24,5756/29,7998) und der Verlauf der Mittellinie durch ihre
      // fünf waagerechten Stellen — (7,5001|29,5501) (11,3032|26,9500) (16,0006|29,5501)
      // (20,6980|26,9500) (24,5013|29,5501), Mitte y 28,2500, Amplitude 1,3000 —, aber **nicht**
      // ihre Kurvenform: die Referenz zeichnet sie als Umriss eines Strichs, und aus einem
      // Umrisspaar folgt kein eindeutiger Kurvenzug. Ohne diese Form wäre ein Amphibienfahrzeug
      // von einem Kraftfahrzeug der Kategorie 1 nicht zu unterscheiden.
      throw new Error(
        'Die Fahrwerkszone von "amphibienfahrzeug" ist nicht vollständig vermessen: die zwei ' +
          'Radplätze sind es (3,75 / 28,25 mm wie Kategorie 1), die Wellenlinie von 5.1.1.4 ist ' +
          'es nur als Strichhülle 7,4263/26,7000/24,5756/29,7998 mm. Vor der Umsetzung ihre ' +
          'Kurvenform an der Referenz vermessen — nicht nähern.',
      );
  }
}

/**
 * Die Kategorien mit vollständig vermessener Fahrwerkszone. Als Datum lesbar und nicht aus einem
 * `try`/`catch` um `vehicleChassis` erschlossen: der Unterschied zwischen „vermessen" und „nicht
 * vermessen" ist eine Aussage über die Referenz und gehört als solche in den Katalog.
 */
export const MEASURED_VEHICLE_CATEGORIES: readonly VehicleCategoryId[] = Object.freeze([
  'kfz-kategorie-1',
  'kfz-kategorie-2',
  'kfz-kategorie-3',
  'kettenfahrzeug',
  'schienenfahrzeug',
]);
