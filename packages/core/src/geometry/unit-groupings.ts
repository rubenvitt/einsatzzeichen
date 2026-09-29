import type { PrimitiveHeadShape, UnitGroupingId } from '@einsatzzeichen/schema';
import { deepFreeze, type DeepReadonly } from './readonly-data.js';

/**
 * Verbandsmarken aus Kapitel 5.5 am Körper (LFH-577). Maße an der Referenz abgelesen, Geometrie
 * eigenständig konstruiert (Vermessung 29.09.2026, 1 mm = 90,709/32 px).
 *
 * **Zwei Darstellungen, zwei Maßstäbe.** Die Kapiteldateien `5.5.1–5.5.3_Bereitschaft
 * (Verband I–III).svg` zeigen die Marke allein und vergrößert: Balken 4 × 10 mm, y 11…21, bei
 * I auf der Achse x 16, bei II auf x 7 und 25, bei III auf x 7, 16 und 25. Dasselbe gilt für die
 * Stärken aus 5.4: dort Kreise r 4 mm auf x 5/16/27, am Körper r 1,5 mm auf x 11/16/21. Das
 * Verhältnis stimmt überein: Kreisdurchmesser 8 → 3 mm und Balkenbreite 4 → 1,5 mm sind beide
 * 0,375. Maßgeblich für den Kopf ist deshalb die Marke **am Körper**, nicht die Kapiteldatei.
 *
 * **Am Körper vermessen** (Formationskörper, Kopfzone y 1…5, 1 mm über der Körperoberkante 6):
 *
 * - ein Balken x 15,25…16,75, y 1…5 an `I.1.4_Wasserrettungsverband`,
 *   `F.1.13_Behandlungsplatz-Bereitschaft`, `F.1.21_Betreuungsplatzbereitschaft 500` und
 *   `C.1.6_Fachdienst Brandschutz`. Am Personenkörper trägt `I.5.7_Verbandsführer
 *   Wasserrettungsverband` denselben Balken bei y 0…4.
 * - zwei Balken x 11,25…12,75 und 19,25…20,75, y 1…5 an `E.1.31_System Bereitstellungsraum 500`,
 *   `F.1.1_Medizinische Task Force` und `F.1.3_Mobiles Betreuungsmodul 5000`.
 *
 * Einheiten mit „Bereitschaft" oder „Verband" im Titel tragen einen Balken (die Führungsgruppe D.1.8
 * trägt die Punkte ihrer Gruppe), wie `5.5.1` die Bereitschaft als Verband I führt. Drei Balken am
 * Körper zeigt keine der 661 Referenzdateien.
 *
 * **Dieselbe Zeichnung wie die technischen Kopfmarken.** `single-vertical-bar` und
 * `double-vertical-bar` (`technical-head-marks.ts`) sind an denselben Dateien vermessen und
 * geometrisch identisch; `unit-groupings.test.ts` hält das fest. Die Kopfmarken bleiben bestehen,
 * weil die Rezepte sie tragen. Ob diese Rezepte auf den Verband umziehen, entscheidet der Eigentümer
 * (`docs/decisions/2026-09-29-lfh-577-verband-5-5.md`).
 */

/** Balkenbreite und -höhe am Körper, an allen acht Dateien oben gleich. */
const BAR_WIDTH_MM = 1.5;
const BAR_HEIGHT_MM = 4;

/** Ein Balken, mittig auf `cxMm`, bezogen auf die Oberkante der Kopfzone. */
function bar(cxMm: number) {
  return {
    type: 'rect' as const,
    role: 'head' as const,
    x: cxMm - BAR_WIDTH_MM / 2,
    y: 0,
    width: BAR_WIDTH_MM,
    height: BAR_HEIGHT_MM,
    style: { fill: 'schwarz' as const, stroke: 'none' as const },
  };
}

/** Verband I: ein Balken auf der Mittelachse x 16 (I.1.4, F.1.13, F.1.21, C.1.6; I.5.7). */
const VERBAND_I: PrimitiveHeadShape = {
  heightMm: BAR_HEIGHT_MM,
  primitives: [bar(16)],
};

/** Verband II: zwei Balken auf x 12 und 20 (E.1.31, F.1.1, F.1.3). */
const VERBAND_II: PrimitiveHeadShape = {
  heightMm: BAR_HEIGHT_MM,
  primitives: [bar(12), bar(20)],
};

/**
 * Vermessene Verbandsmarken. **Verband III fehlt absichtlich:** kein Original zeigt drei Balken am
 * Körper. Der Vorschlag steht als Datum in `UNIT_GROUPING_III_PROPOSAL_CX_MM`, nicht als Zeichnung.
 */
export const UNIT_GROUPING_HEADS: DeepReadonly<
  Partial<Record<UnitGroupingId, PrimitiveHeadShape>>
> = deepFreeze({
  'verband-i': VERBAND_I,
  'verband-ii': VERBAND_II,
});

/**
 * Vorschlag für Verband III, **nicht vermessen**: die Mittelachsen von I und II vereinigt, also
 * x 12, 16 und 20. Grundlage ist das Verhältnis der Kapiteldateien: `5.5.3` ist deckungsgleich die
 * Vereinigung von `5.5.1` (x 16) und `5.5.2` (x 7 und 25), so wie `5.4.4 Zug` die Vereinigung von
 * `5.4.1 Trupp` und `5.4.3 Gruppe` ist — und am Körper führt der Zug genau diese Vereinigung
 * (x 11/16/21). Zwischen den Balken blieben dann 2,5 mm Luft. Das entscheidet der Eigentümer.
 */
export const UNIT_GROUPING_III_PROPOSAL_CX_MM: readonly number[] = Object.freeze([12, 16, 20]);

/**
 * Kopfzone des Verbands, relativ zu ihrer Oberkante wie `technicalHeadMark`. `undefined` für
 * Verband III, solange kein Original ihn am Körper zeigt.
 */
export function unitGroupingHead(id: UnitGroupingId): PrimitiveHeadShape | undefined {
  return UNIT_GROUPING_HEADS[id];
}
