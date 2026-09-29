import type {
  BodyVariantId,
  ColorToken,
  Primitive,
  StateGroupId,
  StateId,
  SymbolKind,
  ZoneBoundsMm,
} from '@einsatzzeichen/schema';
import { boundsOfMm } from '../bounds.js';
import type { CatalogPictogramDefinition } from '../geometry/pictograms/catalog-definition.js';
import { STATE_PICTOGRAMS } from '../geometry/pictograms/states/index.js';
import { NotMeasuredError } from '../not-measured.js';
import { tokenizePath } from '../path-commands.js';

/**
 * Lage der Zustände aus Kapitel 5.8 an einem Grundzeichen (LFH-577). Maße an den Referenzdateien
 * abgelesen am 29. September 2026, Geometrie eigenständig konstruiert; Befunde und Fragen in
 * `docs/decisions/2026-09-28-lfh-565-kapitel-5-8-bausteine.md`, Nachtrag vom 29. September 2026.
 *
 * **Was die 661 Referenzdateien an einem Träger zeigen — und nur das wird hier gezeichnet:**
 *
 * - 5.8.8 an der Personenraute: jede Darstellung bringt ihre Raute mit, in einer von drei Lagen
 *   (`PERSON_STATE_FRAMES`). Die Raute ersetzt den 30-mm-Körper des Grundzeichens 1.2.
 * - Die Hinweise 5.8.1.13 „?" und 5.8.1.14 „!" links neben einem verkleinerten Träger: an der
 *   Person in `5.8.1_Beispiel 1` bis `3`, an der Gefahr in `5.8.1.13_…_2`, `5.8.1.14_…_2` und
 *   `M.6` (`STATE_HINT_LAYOUTS`).
 *
 * Alles andere — Taktik und Gefahrenhinweise 5.8.1.1 bis 5.8.1.12, Aktivität 5.8.2, Tendenz 5.8.3,
 * Schadensgrad 5.8.4 an einem Grundzeichen, Brandphase 5.8.5, Zugang 5.8.9 — zeigt kein Original an
 * einem Träger. `placeStates()` wirft dafür `NotMeasuredError` und rät keine Lage.
 *
 * **Die Funktion prüft Lagen, nicht Zulässigkeit.** Ob ein Zustand an einem Träger stehen darf und
 * wie viele zugleich, sind die Regeln aus `rules/planned-state-rules.ts`; sie prüft `validateSpec`,
 * sobald `SymbolSpec` die Felder `states` und `tendency` trägt. Hier wird nur gesagt, ob die
 * Zusammenstellung vermessen ist.
 */

/** Die drei Tendenzen aus 5.8.3. Im Schema stehen sie als Werte von `STATE_IDS`. */
export type StateTendencyId = 'tendency-rising' | 'tendency-unchanged' | 'tendency-falling';

const TENDENCY_IDS: readonly StateId[] = ['tendency-rising', 'tendency-unchanged', 'tendency-falling'];

export interface StateCarrierInput {
  readonly kind: SymbolKind;
  readonly variant?: BodyVariantId;
}

export interface StatePlacementInput {
  readonly carrier: StateCarrierInput;
  /** Zustände aus 5.8.1, 5.8.2, 5.8.4, 5.8.5, 5.8.8 und 5.8.9. Wetter und Tier sind freistehend. */
  readonly states: readonly StateId[];
  /** Höchstens eine Tendenz aus 5.8.3, eigenes Feld (Eigentümerentscheidung vom 29.09.2026). */
  readonly tendency?: StateTendencyId;
}

/**
 * Die Fassung, in die ein Zustand den Träger setzt. Keine `BodyVariantId`: diese Liste gehört zum
 * Schema (`taxonomy.ts`), und die Lagen hier entstehen erst durch den Zustand.
 */
export type StateCarrierFrameId =
  | 'person-diamond-26mm'
  | 'person-diamond-26mm-raised-2mm'
  | 'person-diamond-21mm-lowered-4-5mm'
  | 'person-diamond-20mm-beside-hint'
  | 'hazard-triangle-23mm-beside-hint';

/**
 * `measured`: genau diese Zusammenstellung ist an der genannten Referenzdatei abgelesen.
 * `transferred`: die Lage ist an einer anderen Zusammenstellung abgelesen und hierher übertragen;
 * `reference` nennt dann die Datei, von der übertragen wurde.
 */
export type StatePlacementBasis = 'measured' | 'transferred';

export interface PlacedStateCarrier {
  readonly frame: StateCarrierFrameId;
  /** Ersetzt den Körper des Grundzeichens. Rollen und Farben wie in der Referenz. */
  readonly primitives: readonly Primitive[];
  /** Hülle der Mittellinie in Koordinaten der Zeichenfläche. */
  readonly hullMm: ZoneBoundsMm;
  readonly basis: StatePlacementBasis;
  readonly reference: `${string}.svg`;
}

export interface PlacedStatePart {
  readonly value: StateId;
  readonly group: StateGroupId;
  /** `body` auf oder um den Träger, `state-margin` in der Randlage daneben. */
  readonly zone: 'body' | 'state-margin';
  /** Nur bei den Eckmarken aus 5.8.8. */
  readonly corner?: PersonStateCorner;
  readonly primitives: readonly Primitive[];
  readonly basis: StatePlacementBasis;
  readonly reference: `${string}.svg`;
}

export interface StatePlacement {
  /** Zeichenfläche. Ein Hinweis an der Person verbreitert sie auf 36 × 32 mm. */
  readonly canvasMm: { readonly width: number; readonly height: number };
  /** Lage der 32-mm-Grundfläche in der Zeichenfläche. */
  readonly baseAreaMm: ZoneBoundsMm;
  /** Der Träger in der Fassung, die der Zustand verlangt; `null`, wenn der Körper bleibt. */
  readonly carrier: PlacedStateCarrier | null;
  readonly parts: readonly PlacedStatePart[];
}

const CANVAS_32 = Object.freeze({ width: 32, height: 32 });
const BASE_AREA_32: ZoneBoundsMm = Object.freeze({ minX: 0, minY: 0, maxX: 32, maxY: 32 });

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
} satisfies Record<Exclude<StateCarrierFrameId, `hazard-${string}`>, PersonStateFrame>);

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

// ---------------------------------------------------------------------------------------------
// Nachschlagen in den Zeichnungen
// ---------------------------------------------------------------------------------------------

const GROUP_OF_SECTION: Readonly<Record<string, StateGroupId>> = {
  '5.8.1': 'tactics-hazards',
  '5.8.2': 'activity',
  '5.8.3': 'tendency',
  '5.8.4': 'damage',
  '5.8.5': 'fire',
  '5.8.6': 'animals',
  '5.8.7': 'weather',
  '5.8.8': 'persons',
  '5.8.9': 'access',
};

function definitionOf(value: StateId, variant: 'primary' | 'alternative'): CatalogPictogramDefinition {
  const found = STATE_PICTOGRAMS.find(
    (definition) => definition.id === `state.${value}` && definition.variant === variant,
  );
  if (found === undefined) throw new Error(`Zustand ohne Zeichnung (${variant}): ${value}`);
  return found;
}

function groupOf(value: StateId): StateGroupId {
  const section = definitionOf(value, 'primary').section.split('.').slice(0, 3).join('.');
  const group = GROUP_OF_SECTION[section];
  if (group === undefined) throw new Error(`Zustand ohne Gruppe: ${value} (${section})`);
  return group;
}

const HINTS: readonly StateId[] = ['suspected-situation', 'acute-situation'];

// ---------------------------------------------------------------------------------------------
// Abbildung von Primitiven: verschieben, verkleinern, umfärben
// ---------------------------------------------------------------------------------------------

const round3 = (value: number): number => Math.round(value * 1000) / 1000;

interface Mapping {
  /** Punkt, um den verkleinert wird. */
  readonly originX: number;
  readonly originY: number;
  readonly scale: number;
  /** Ziel des Ursprungs. */
  readonly toX: number;
  readonly toY: number;
  /** Faktor für Strichstärken; gemessen, nicht aus `scale` gerechnet. */
  readonly strokeScale: number;
  readonly recolor?: { readonly from: ColorToken; readonly to: ColorToken };
}

function mapX(m: Mapping, x: number): number {
  return round3(m.toX + (x - m.originX) * m.scale);
}

function mapY(m: Mapping, y: number): number {
  return round3(m.toY + (y - m.originY) * m.scale);
}

function mapStyle(m: Mapping, style: Primitive['style']): Primitive['style'] {
  if (style === undefined) return undefined;
  const swap = <T>(color: T): T =>
    m.recolor !== undefined && color === m.recolor.from ? (m.recolor.to as T) : color;
  return {
    ...style,
    ...(style.fill === undefined ? {} : { fill: swap(style.fill) }),
    ...(style.stroke === undefined ? {} : { stroke: swap(style.stroke) }),
    ...(style.strokeWidth === undefined
      ? {}
      : { strokeWidth: round3(style.strokeWidth * m.strokeScale) }),
  };
}

function mapPath(m: Mapping, d: string): string {
  const { commands, problems } = tokenizePath(d);
  if (problems.length > 0) throw new Error(`Pfad nicht abbildbar: ${problems.join('; ')}`);
  return commands
    .map(({ command, numbers }) => {
      if (command === 'Z') return 'Z';
      if (command === 'H') return `H ${mapX(m, numbers[0] as number)}`;
      if (command === 'V') return `V ${mapY(m, numbers[0] as number)}`;
      const mapped = numbers.map((value, index) => (index % 2 === 0 ? mapX(m, value) : mapY(m, value)));
      return `${command} ${mapped.join(' ')}`;
    })
    .join(' ');
}

/**
 * Bildet genau die Primitivarten ab, die die Hinweismarken und die Zeichnungen aus 5.8.8 benutzen.
 * Eine gedrehte Form oder eine Gruppe käme hier nur durch eine neue Zeichnung an; sie soll dann
 * sichtbar scheitern, statt still falsch zu stehen.
 */
function mapPrimitive(m: Mapping, primitive: Primitive): Primitive {
  if (primitive.transform !== undefined) {
    throw new Error(`Zustandsplatzierung: Primitiv mit transform nicht abbildbar (${primitive.type}).`);
  }
  const style = mapStyle(m, primitive.style);
  const base = { ...(primitive.role === undefined ? {} : { role: primitive.role }), ...(style ? { style } : {}) };
  switch (primitive.type) {
    case 'line':
      return {
        type: 'line',
        ...base,
        x1: mapX(m, primitive.x1),
        y1: mapY(m, primitive.y1),
        x2: mapX(m, primitive.x2),
        y2: mapY(m, primitive.y2),
      };
    case 'polyline':
      return {
        type: 'polyline',
        ...base,
        points: primitive.points.map(([x, y]) => [mapX(m, x), mapY(m, y)] as const),
        ...(primitive.closed === undefined ? {} : { closed: primitive.closed }),
      };
    case 'circle':
      return {
        type: 'circle',
        ...base,
        cx: mapX(m, primitive.cx),
        cy: mapY(m, primitive.cy),
        r: round3(primitive.r * m.scale),
      };
    case 'rect':
      return {
        type: 'rect',
        ...base,
        x: mapX(m, primitive.x),
        y: mapY(m, primitive.y),
        width: round3(primitive.width * m.scale),
        height: round3(primitive.height * m.scale),
        ...(primitive.rx === undefined ? {} : { rx: round3(primitive.rx * m.scale) }),
      };
    case 'path':
      return { type: 'path', ...base, d: mapPath(m, primitive.d) };
    case 'text': {
      const sizeMm = round3(primitive.sizeMm * m.scale);
      return {
        ...primitive,
        ...base,
        x: mapX(m, primitive.x),
        y: mapY(m, primitive.y),
        sizeMm,
        boxMm: {
          xMm: mapX(m, primitive.boxMm.xMm),
          yMm: mapY(m, primitive.boxMm.yMm),
          widthMm: round3(primitive.boxMm.widthMm * m.scale),
          heightMm: round3(primitive.boxMm.heightMm * m.scale),
        },
        ...(primitive.minRenderPx === undefined
          ? {}
          : { minRenderPx: Math.ceil(primitive.minRenderPx / m.scale) }),
      };
    }
    case 'group':
      throw new Error('Zustandsplatzierung: Gruppen sind nicht abbildbar.');
  }
}

// ---------------------------------------------------------------------------------------------
// Personenzustand 5.8.8
// ---------------------------------------------------------------------------------------------

type PersonFrameId = keyof typeof PERSON_STATE_FRAMES;

function sameHull(a: ZoneBoundsMm, b: ZoneBoundsMm): boolean {
  return (
    Math.abs(a.minX - b.minX) < 1e-9 &&
    Math.abs(a.minY - b.minY) < 1e-9 &&
    Math.abs(a.maxX - b.maxX) < 1e-9 &&
    Math.abs(a.maxY - b.maxY) < 1e-9
  );
}

function within(inner: ZoneBoundsMm, outer: ZoneBoundsMm): boolean {
  const tolerance = 0.02;
  return (
    inner.minX >= outer.minX - tolerance &&
    inner.minY >= outer.minY - tolerance &&
    inner.maxX <= outer.maxX + tolerance &&
    inner.maxY <= outer.maxY + tolerance
  );
}

interface PersonDrawing {
  readonly frame: PersonFrameId;
  readonly diamond: Primitive;
  readonly body: readonly Primitive[];
  readonly corners: readonly { readonly corner: PersonStateCorner; readonly primitives: readonly Primitive[] }[];
  readonly reference: `${string}.svg`;
}

/**
 * Zerlegt eine Zeichnung aus 5.8.8 in Raute, Marken auf und um die Raute und Eckmarken. Die Raute
 * ist in jeder Zeichnung das erste Primitiv; ihre Hülle bestimmt die Lage, und eine Hülle, die zu
 * keiner vermessenen Lage passt, ist ein Programmfehler.
 */
function personDrawing(value: StateId): PersonDrawing {
  const definition = definitionOf(value, 'primary');
  const [diamond, ...marks] = definition.primitives;
  if (diamond === undefined || diamond.type !== 'polyline') {
    throw new Error(`5.8.8 ohne Raute als erstes Primitiv: ${value}`);
  }
  const hull = boundsOfMm(diamond);
  const frame = (Object.keys(PERSON_STATE_FRAMES) as PersonFrameId[]).find((id) =>
    sameHull(PERSON_STATE_FRAMES[id].hullMm, hull),
  );
  if (frame === undefined) throw new Error(`5.8.8 in unvermessener Rautenlage: ${value}`);
  const body: Primitive[] = [];
  const byCorner = new Map<PersonStateCorner, Primitive[]>();
  for (const mark of marks) {
    const corner = (Object.keys(PERSON_STATE_CORNERS_MM) as PersonStateCorner[]).find((key) =>
      within(boundsOfMm(mark), PERSON_STATE_CORNERS_MM[key]),
    );
    if (corner === undefined) body.push(mark);
    else byCorner.set(corner, [...(byCorner.get(corner) ?? []), mark]);
  }
  return {
    frame,
    diamond,
    body,
    corners: [...byCorner].map(([corner, primitives]) => ({ corner, primitives })),
    reference: definition.referenceAsset,
  };
}

function personParts(
  value: StateId,
  drawing: PersonDrawing,
  map: (primitive: Primitive) => Primitive,
  basis: StatePlacementBasis,
  reference: `${string}.svg`,
): PlacedStatePart[] {
  const parts: PlacedStatePart[] = [];
  if (drawing.body.length > 0) {
    parts.push({ value, group: 'persons', zone: 'body', primitives: drawing.body.map(map), basis, reference });
  }
  for (const { corner, primitives } of drawing.corners) {
    parts.push({
      value,
      group: 'persons',
      zone: 'state-margin',
      corner,
      primitives: primitives.map(map),
      basis,
      reference,
    });
  }
  return parts;
}

const IDENTITY: Mapping = { originX: 0, originY: 0, scale: 1, toX: 0, toY: 0, strokeScale: 1 };

// ---------------------------------------------------------------------------------------------
// Hinweis 5.8.1.13 / 5.8.1.14
// ---------------------------------------------------------------------------------------------

/**
 * Die Hinweismarke aus der Alternativdarstellung (5.8.1.13_2 bzw. 5.8.1.14_2): alles außer dem
 * Dreieck, das dort das erste Primitiv ist. An der Person verschoben und schwarz gefärbt.
 */
function hintMark(hint: StateHintId, layout: StateHintLayout): readonly Primitive[] {
  const [, ...mark] = definitionOf(hint, 'alternative').primitives;
  const sourceAxis = STATE_HINT_LAYOUTS.hazard.markAxisXMm[hint];
  const shift: Mapping = {
    ...IDENTITY,
    toX: layout.markAxisXMm[hint] - sourceAxis,
    recolor: { from: 'rot', to: layout.ink },
  };
  return mark.map((primitive) => {
    const mapped = mapPrimitive(shift, primitive);
    return mapped.type === 'circle' ? { ...mapped, r: layout.dotRadiusMm } : mapped;
  });
}

function hazardTriangle(hint: StateHintId): Primitive {
  const [triangle] = definitionOf(hint, 'alternative').primitives;
  if (triangle === undefined) throw new Error(`5.8.1-Alternative ohne Dreieck: ${hint}`);
  return triangle;
}

// ---------------------------------------------------------------------------------------------
// Einstieg
// ---------------------------------------------------------------------------------------------

const NO_CARRIER_EVIDENCE: Partial<Record<StateGroupId, string>> = {
  activity: 'Kein Original zeigt einen Aktivitäts- oder Ausfallgrad (5.8.2) an einem Träger.',
  damage:
    'Kein Original zeigt einen Schadensgrad (5.8.4) an einem Grundzeichen; belegt ist er nur über ' +
    'dem Deichprofil aus Anhang L (L.8, L.9).',
  fire:
    'Kein Original zeigt eine Brandphase (5.8.5) an einem Träger; die Flammen in Anhang M sind ' +
    'eine eigene Figur.',
  access: 'Kein Original zeigt einen Zugangszustand (5.8.9) an einem Träger.',
};

function isPersonCarrier(carrier: StateCarrierInput): boolean {
  return (
    carrier.kind === 'person' &&
    (carrier.variant === undefined || carrier.variant === 'compact-person-diamond-26mm')
  );
}

function carrierName(carrier: StateCarrierInput): string {
  return carrier.variant === undefined ? carrier.kind : `${carrier.kind}/${carrier.variant}`;
}

/**
 * Platziert Zustände und Tendenz an einem Träger.
 *
 * Wirft `NotMeasuredError` mit `scope: 'value'`, wenn kein Original den Wert an irgendeinem Träger
 * zeigt, und mit `scope: 'combination'`, wenn die Zusammenstellung fehlt, ein anderer Träger oder
 * eine andere Auswahl sie aber trägt. Wetter (5.8.7) und Tier (5.8.6) sind freistehend und gehören
 * nicht in `states`; eine Tendenz gehört ins Feld `tendency` — beides ist eine ungültige Eingabe
 * und wirft ein gewöhnliches `Error`.
 */
export function placeStates(input: StatePlacementInput): StatePlacement {
  const { carrier, states, tendency } = input;

  for (const value of states) {
    const group = groupOf(value);
    if (group === 'tendency') {
      throw new Error(`"${value}" ist eine Tendenz und gehört ins Feld "tendency", nicht in "states".`);
    }
    if (group === 'weather' || group === 'animals') {
      throw new Error(
        `"${value}" (${group === 'weather' ? '5.8.7' : '5.8.6'}) ist freistehend und gehört in die ` +
          'eigene Spec-Art, nicht in "states".',
      );
    }
  }
  if (tendency !== undefined && !TENDENCY_IDS.includes(tendency)) {
    throw new Error(`"${String(tendency)}" ist keine Tendenz aus 5.8.3.`);
  }

  // Zuerst die Werte, die an keinem Träger vermessen sind: eine andere Auswahl hilft nicht.
  for (const value of states) {
    const group = groupOf(value);
    const reason = NO_CARRIER_EVIDENCE[group];
    if (reason !== undefined) throw new NotMeasuredError(`${value}: ${reason}`, 'value');
    if (group === 'tactics-hazards' && !HINTS.includes(value)) {
      throw new NotMeasuredError(
        `${value}: Kein Original zeigt Taktik oder Gefahrenhinweis 5.8.1.1 bis 5.8.1.12 an einem ` +
          'Träger; belegt sind nur die Hinweise „?" und „!".',
        'value',
      );
    }
  }
  if (tendency !== undefined) {
    throw new NotMeasuredError(
      `${tendency}: Keine der 661 Referenzdateien zeigt eine Tendenz (5.8.3) an einem Träger. ` +
        'Die Randlage `tendency-margin` ist nicht vermessen.',
      'value',
    );
  }

  if (states.length === 0) {
    return { canvasMm: CANVAS_32, baseAreaMm: BASE_AREA_32, carrier: null, parts: [] };
  }

  const hints = states.filter((value): value is StateHintId => HINTS.includes(value));
  const persons = states.filter((value) => groupOf(value) === 'persons');

  if (hints.length > 1) {
    throw new NotMeasuredError(
      `${hints.join(' + ')}: Kein Original zeigt zwei Hinweise aus 5.8.1 an einem Zeichen.`,
      'combination',
    );
  }
  if (persons.length > 1) {
    throw new NotMeasuredError(
      `${persons.join(' + ')}: Kein Original zeigt zwei Personenzustände an einer Raute; die ` +
        'Verbindungen „verletzt und …" sind in 5.8.8 eigene Werte.',
      'combination',
    );
  }
  if (!isPersonCarrier(carrier) && persons.length > 0) {
    throw new NotMeasuredError(
      `${persons[0]} an ${carrierName(carrier)}: 5.8.8 ist nur an der Personenraute gezeichnet.`,
      'combination',
    );
  }

  const hint = hints[0];
  const personValue = persons[0];

  if (hint === undefined) {
    // Nur ein Personenzustand: die Zeichnung aus 5.8.8 an ihrer Stelle.
    const value = personValue as StateId;
    const drawing = personDrawing(value);
    const map = (primitive: Primitive): Primitive => mapPrimitive(IDENTITY, primitive);
    return {
      canvasMm: CANVAS_32,
      baseAreaMm: BASE_AREA_32,
      carrier: {
        frame: drawing.frame,
        primitives: [map(drawing.diamond)],
        hullMm: PERSON_STATE_FRAMES[drawing.frame].hullMm,
        basis: 'measured',
        reference: drawing.reference,
      },
      parts: personParts(value, drawing, map, 'measured', drawing.reference),
    };
  }

  if (carrier.kind === 'hazard') {
    const layout = STATE_HINT_LAYOUTS.hazard;
    return {
      canvasMm: layout.canvasMm,
      baseAreaMm: layout.baseAreaMm,
      carrier: {
        frame: layout.frame,
        primitives: [hazardTriangle(hint)],
        hullMm: layout.carrierHullMm,
        basis: 'measured',
        reference: layout.reference[hint],
      },
      parts: [
        {
          value: hint,
          group: 'tactics-hazards',
          zone: 'state-margin',
          primitives: hintMark(hint, layout),
          basis: 'measured',
          reference: layout.reference[hint],
        },
      ],
    };
  }

  if (!isPersonCarrier(carrier)) {
    throw new NotMeasuredError(
      `${hint} an ${carrierName(carrier)}: Hinweise aus 5.8.1 sind nur an Person und Gefahr gezeichnet.`,
      'combination',
    );
  }

  // Hinweis an der Person: Raute auf 20 mm verkleinert, 36 mm breite Fläche.
  const layout = STATE_HINT_LAYOUTS.person;
  const target = PERSON_STATE_FRAMES['person-diamond-20mm-beside-hint'];
  const source = PERSON_STATE_FRAMES['person-diamond-26mm'];
  const drawing = personDrawing(personValue ?? 'person-uninjured');
  if (drawing.frame !== 'person-diamond-26mm') {
    throw new NotMeasuredError(
      `${personValue} + ${hint}: Neben einem Hinweis ist nur die Raute der Standardlage gezeichnet, ` +
        `nicht die Lage "${drawing.frame}".`,
      'combination',
    );
  }
  const shrink: Mapping = {
    originX: source.centerXMm,
    originY: source.centerYMm,
    scale: target.halfDiagonalMm / source.halfDiagonalMm,
    toX: target.centerXMm,
    toY: target.centerYMm,
    strokeScale: target.strokeWidthMm / source.strokeWidthMm,
  };
  const map = (primitive: Primitive): Primitive => mapPrimitive(shrink, primitive);
  // Abgelesen ist nur die verletzte Person (Beispiel 1 bis 3); jede andere Füllung der Raute ist
  // übertragen, auch die Person ohne Zustand.
  const personBasis: StatePlacementBasis = personValue === 'person-injured' ? 'measured' : 'transferred';
  const hintBasis: StatePlacementBasis = layout.transferred.includes(hint) ? 'transferred' : 'measured';
  return {
    canvasMm: layout.canvasMm,
    baseAreaMm: layout.baseAreaMm,
    carrier: {
      frame: layout.frame,
      primitives: [map(drawing.diamond)],
      hullMm: layout.carrierHullMm,
      basis: personBasis,
      reference: target.reference,
    },
    parts: [
      ...(personValue === undefined
        ? []
        : personParts(personValue, drawing, map, personBasis, target.reference)),
      {
        value: hint,
        group: 'tactics-hazards',
        zone: 'state-margin',
        primitives: hintMark(hint, layout),
        basis: hintBasis,
        reference: layout.reference[hint],
      },
    ],
  };
}
