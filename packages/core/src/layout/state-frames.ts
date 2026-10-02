import type { ColorToken, ZoneBoundsMm } from '@einsatzzeichen/schema';

/**
 * Die vermessenen Lagen der Zustände aus Kapitel 5.8 als reine Daten (LFH-577): die Rautenlagen
 * der Person, die Ecklagen der Zusatzkennungen aus 5.8.8 und die Hinweislagen an Person und
 * Gefahr. Maße an den Referenzdateien abgelesen am 29. September 2026; Befunde in
 * `docs/decisions/2026-09-28-lfh-565-kapitel-5-8-bausteine.md` §7.
 *
 * **Warum eine eigene Datei.** Bis zur Integration standen diese Konstanten in
 * `state-placement.ts`, neben der Funktion, die Zeichnungen verschiebt und verkleinert. Das
 * Zonenmodell (`zones.ts`) liest sie, importierte damit aber die Geometrie samt aller
 * Zustandszeichnungen — und das Zonenmodell soll Daten lesen, keine Geometrie. Hier stehen nur
 * Zahlen und Typen, kein Import aus `geometry/`. `state-placement.ts` importiert sie von hier und
 * reicht sie für bestehende Aufrufer unverändert weiter.
 */

/**
 * Die Fassung, in die ein Zustand den Träger setzt. Keine `BodyVariantId`: diese Liste gehört zum
 * Schema (`taxonomy.ts`), und die Lagen hier entstehen erst durch den Zustand.
 */
export type StateCarrierFrameId =
  | 'person-diamond-26mm'
  | 'person-diamond-26mm-raised-2mm'
  | 'person-diamond-21mm-lowered-4-5mm'
  | 'person-diamond-20mm-beside-hint'
  | 'hazard-triangle-23mm-beside-hint'
  // Abgeleitet (02.10.2026), an keiner Referenzdatei abgelesen: der Körper bleibt an seiner
  // Stelle (etwa unter einem Schadensgrad) bzw. steht verkleinert neben einer Randlage.
  | 'body-in-place'
  | 'body-beside-margin';

export const CANVAS_32 = Object.freeze({ width: 32, height: 32 });
export const BASE_AREA_32: ZoneBoundsMm = Object.freeze({ minX: 0, minY: 0, maxX: 32, maxY: 32 });

export interface PersonStateFrame {
  readonly centerXMm: number;
  readonly centerYMm: number;
  /** Halbe Diagonale der Raute, Mittellinie. */
  readonly halfDiagonalMm: number;
  readonly hullMm: ZoneBoundsMm;
  readonly strokeWidthMm: number;
  readonly reference: `${string}.svg`;
}

function personFrame(
  centerXMm: number,
  centerYMm: number,
  halfDiagonalMm: number,
  strokeWidthMm: number,
  reference: `${string}.svg`,
): PersonStateFrame {
  return Object.freeze({
    centerXMm,
    centerYMm,
    halfDiagonalMm,
    hullMm: Object.freeze({
      minX: centerXMm - halfDiagonalMm,
      minY: centerYMm - halfDiagonalMm,
      maxX: centerXMm + halfDiagonalMm,
      maxY: centerYMm + halfDiagonalMm,
    }),
    strokeWidthMm,
    reference,
  });
}

/**
 * Die vier Lagen der Personenraute, an den Referenzdateien abgelesen (Mittellinie, Strich 0,5 mm
 * außer beim Hinweis):
 *
 * - 26 mm um (16 | 16): Füllfläche 18,385 mm Kante, Umriss 2,647…29,353 mm (5.8.8.1 bis 5.8.8.8,
 *   5.8.8.10, 5.8.8.11, 5.8.8.15 bis 5.8.8.17). Dieselbe Raute ist `compact-person-diamond-26mm`.
 * - 26 mm um (16 | 14), also 2 mm angehoben: Füllpolygon (16 | 1) … (16 | 27) in 5.8.8.12 bis
 *   5.8.8.14, darunter der Transportpfeil auf y = 27.
 * - 21 mm um (16 | 20,5), also 4,5 mm abgesenkt: Füllfläche 14,849 mm Kante, Umriss
 *   5,146…26,853 × 9,646…31,353 mm in 5.8.8.9, darüber die Wellen.
 * - 20 mm um (21 | 16) auf der 36 mm breiten Fläche neben einem Hinweis: `5.8.1_Beispiel 3`,
 *   Füllfläche 14,142 mm Kante, Umriss 10,717…31,283 mm, innen 11,283 mm — Strich **0,4 mm**, nicht
 *   die 0,385 mm, die das bloße Verkleinern ergäbe. In Beispiel 1 und 2 steht dieselbe Raute um
 *   (25 | 16), weil dort zusätzlich eine Anzahl „3" vor oder hinter dem Fragezeichen steht.
 */
export const PERSON_STATE_FRAMES = Object.freeze({
  'person-diamond-26mm': personFrame(16, 16, 13, 0.5, '5.8.8.3_Person Verletzt.svg'),
  'person-diamond-26mm-raised-2mm': personFrame(
    16,
    14,
    13,
    0.5,
    '5.8.8.12_Person zu transportieren.svg',
  ),
  'person-diamond-21mm-lowered-4-5mm': personFrame(
    16,
    20.5,
    10.5,
    0.5,
    '5.8.8.9_Person in Wassergefahr.svg',
  ),
  'person-diamond-20mm-beside-hint': personFrame(21, 16, 10, 0.4, '5.8.1_Beispiel 3.svg'),
} satisfies Record<Exclude<StateCarrierFrameId, `hazard-${string}` | `body-${string}`>, PersonStateFrame>);

export type PersonStateCorner = 'top-right' | 'bottom-left';

/**
 * Die Ecklagen der Zusatzkennungen aus 5.8.8, Tintenhülle an der 26-mm-Raute:
 *
 * - oben rechts: „B" 25,572…28,669 × 2,131…7,0 (5.8.8.2), „TP" 22,126…29,768 (5.8.8.5), „K"
 *   25,494…29,149 (5.8.8.6 Alternative), Kontaminationsscheiben 20,75…31,75 × 0,25…3,75 mit
 *   Kreuzstrichen bis y = 8 (5.8.8.6). Grundlinie der Buchstaben y = 7,0.
 * - unten links: Sichtungskategorie „II" 2,533…7,112 × 25,13…30,0 (5.8.8.4).
 */
export const PERSON_STATE_CORNERS_MM = Object.freeze({
  'top-right': Object.freeze({ minX: 20.75, minY: 0.25, maxX: 31.75, maxY: 8 }),
  'bottom-left': Object.freeze({ minX: 2.533, minY: 25.13, maxX: 7.112, maxY: 30 }),
} satisfies Record<PersonStateCorner, ZoneBoundsMm>);

export type StateHintId = 'suspected-situation' | 'acute-situation';

export interface StateHintLayout {
  readonly canvasMm: { readonly width: number; readonly height: number };
  readonly baseAreaMm: ZoneBoundsMm;
  readonly frame: StateCarrierFrameId;
  /** Mittellinienhülle des verkleinerten Trägers. */
  readonly carrierHullMm: ZoneBoundsMm;
  /** Senkrechte Achse der Marke je Hinweis; `transferred` nennt die übertragenen Werte. */
  readonly markAxisXMm: Readonly<Record<StateHintId, number>>;
  readonly transferred: readonly StateHintId[];
  /** Die Marke übernimmt die Strichfarbe des Trägers. */
  readonly ink: ColorToken;
  readonly dotRadiusMm: number;
  readonly reference: Readonly<Record<StateHintId, `${string}.svg`>>;
}

/**
 * Die Hinweislagen je Träger. Senkrecht gilt an beiden Trägern dasselbe: Scheitel des Fragezeichens
 * bzw. Oberkante des Ausrufebalkens y = 10, Punktmitte y = 20,05 (Tinte 9,6…20,65 mm). Die Marke
 * ist die auf die Hälfte verkleinerte Figur aus 5.8.1.13 bzw. 5.8.1.14 mit 0,8 mm Strich.
 *
 * - Person (`5.8.1_Beispiel 3`): Fläche 36 × 32 mm, Grundfläche x 4…36, Raute 20 mm um (21 | 16),
 *   „?" schwarz mit Achse x = 6,5 (Tinte 3,642…9,4 mm), Punkt r = 0,45 mm. Die Achse liegt 4,5 mm
 *   links der linken Rautenspitze. „!" ist an der Person nicht gezeichnet; übertragen wird der
 *   Versatz von 1 mm, den 5.8.1.14_2 gegen 5.8.1.13_2 zeigt.
 * - Gefahr (5.8.1.13_2, 5.8.1.14_2): Fläche bleibt 32 × 32 mm, Dreieck (7,5 | 25), (19 | 6),
 *   (30,5 | 25) mit 0,5 mm Strich, „?" rot mit Achse x = 5 (Tinte 2,142…7,9 mm), „!" rot mit Achse
 *   x = 6, Punkt r = 0,6 mm. `M.6` zeigt „!" stattdessen am **unverkleinerten** Dreieck bei
 *   x = 1,5 — eine zweite Lage, die hier nicht gebaut ist (Eigentümerfrage im Nachtrag).
 */
export const STATE_HINT_LAYOUTS = Object.freeze({
  person: Object.freeze({
    canvasMm: Object.freeze({ width: 36, height: 32 }),
    baseAreaMm: Object.freeze({ minX: 4, minY: 0, maxX: 36, maxY: 32 }),
    frame: 'person-diamond-20mm-beside-hint',
    carrierHullMm: PERSON_STATE_FRAMES['person-diamond-20mm-beside-hint'].hullMm,
    markAxisXMm: Object.freeze({ 'suspected-situation': 6.5, 'acute-situation': 7.5 }),
    transferred: Object.freeze<StateHintId[]>(['acute-situation']),
    ink: 'schwarz',
    dotRadiusMm: 0.45,
    reference: Object.freeze({
      'suspected-situation': '5.8.1_Beispiel 3.svg',
      'acute-situation': '5.8.1.14_Hinweis auf akute Situation_2.svg',
    }),
  }),
  hazard: Object.freeze({
    canvasMm: CANVAS_32,
    baseAreaMm: BASE_AREA_32,
    frame: 'hazard-triangle-23mm-beside-hint',
    carrierHullMm: Object.freeze({ minX: 7.5, minY: 6, maxX: 30.5, maxY: 25 }),
    markAxisXMm: Object.freeze({ 'suspected-situation': 5, 'acute-situation': 6 }),
    transferred: Object.freeze<StateHintId[]>([]),
    ink: 'rot',
    dotRadiusMm: 0.6,
    reference: Object.freeze({
      'suspected-situation': '5.8.1.13_Hinweis auf Vermutung_2.svg',
      'acute-situation': '5.8.1.14_Hinweis auf akute Situation_2.svg',
    }),
  }),
} satisfies Record<'person' | 'hazard', StateHintLayout>);
