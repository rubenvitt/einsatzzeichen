import type {
  BodyVariantId,
  ColorToken,
  Primitive,
  StateGroupId,
  StateId,
  SymbolKind,
  TendencyId,
  ZoneBoundsMm,
} from '@einsatzzeichen/schema';
import { boundsOfMm } from '../bounds.js';
import { deriveStatePlacement } from '../derive/states.js';
import type { CatalogPictogramDefinition } from '../geometry/pictograms/catalog-definition.js';
import { STATE_PICTOGRAMS } from '../geometry/pictograms/states/index.js';
import { NotMeasuredError } from '../not-measured.js';
import { tokenizePath } from '../path-commands.js';
import {
  BASE_AREA_32,
  CANVAS_32,
  PERSON_STATE_CORNERS_MM,
  PERSON_STATE_FRAMES,
  STATE_HINT_LAYOUTS,
  type PersonStateCorner,
  type StateCarrierFrameId,
  type StateHintId,
  type StateHintLayout,
} from './state-frames.js';

// Die Lagen stehen als reine Daten in `state-frames.ts`; hier weitergereicht, damit bestehende
// Aufrufer (Prüfpaket, Tests) ihren Importpfad behalten.
export {
  PERSON_STATE_CORNERS_MM,
  PERSON_STATE_FRAMES,
  STATE_HINT_LAYOUTS,
  type PersonStateCorner,
  type PersonStateFrame,
  type StateCarrierFrameId,
  type StateHintId,
  type StateHintLayout,
} from './state-frames.js';

/**
 * Lage der Zustände aus Kapitel 5.8 an einem Grundzeichen (LFH-577). Maße an den Referenzdateien
 * abgelesen am 29. September 2026, Geometrie eigenständig konstruiert; Befunde und Fragen in
 * `docs/decisions/2026-09-28-lfh-565-kapitel-5-8-bausteine.md`, Nachtrag vom 29. September 2026.
 *
 * **Was die 661 Referenzdateien an einem Träger zeigen — das ist vermessen:**
 *
 * - 5.8.8 an der Personenraute: jede Darstellung bringt ihre Raute mit, in einer von drei Lagen
 *   (`PERSON_STATE_FRAMES`). Die Raute ersetzt den 30-mm-Körper des Grundzeichens 1.2.
 * - Die Hinweise 5.8.1.13 „?" und 5.8.1.14 „!" links neben einem verkleinerten Träger: an der
 *   Person in `5.8.1_Beispiel 1` bis `3`, an der Gefahr in `5.8.1.13_…_2`, `5.8.1.14_…_2` und
 *   `M.6` (`STATE_HINT_LAYOUTS`).
 *
 * Alles andere — Gefahrenhinweise 5.8.1.5 bis 5.8.1.12, Aktivität 5.8.2, Tendenz 5.8.3,
 * Schadensgrad 5.8.4 an einem Grundzeichen, Brandphase 5.8.5, Zugang 5.8.9, jeder andere
 * Träger — zeigt kein Original an einem Träger. Zwei Hinweise zugleich lehnt seit dem Fachreview
 * vom 05.10.2026 `state-hint-limit-exceeded` ab. Seit der Entscheidung des Eigentümers vom
 * 02.10.2026 wird es aus den belegten Lagen abgeleitet (`derive/states.ts`) und als abgeleitet
 * gekennzeichnet; die Zeichnung des Zustands bleibt dabei die vermessene, nur ihre Lage ist
 * übertragen.
 *
 * **Die Funktion prüft Lagen, nicht Zulässigkeit.** Ob ein Zustand an einem Träger stehen darf und
 * wie viele zugleich, prüft seit LFH-577 `validateSpec` an `SymbolSpec.states` (Regeln
 * `state-carrier-not-allowed`, `state-group-limit-exceeded`, `state-tactics-not-allowed`,
 * `state-value-not-attachable`); `compose()` ruft danach diese Funktion.
 */

/**
 * Die drei Tendenzen aus 5.8.3. Seit LFH-577 derselbe Typ wie `TendencyId` im Schema, dem
 * Wertevorrat von `SymbolSpec.tendency`; der Name bleibt für bestehende Aufrufer.
 */
export type StateTendencyId = TendencyId;

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
  /**
   * `body` auf oder um den Träger, `state-margin` in der Randlage links daneben,
   * `tendency-margin` in der (abgeleiteten) Randlage der Tendenz rechts daneben.
   */
  readonly zone: 'body' | 'state-margin' | 'tendency-margin';
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

export function definitionOf(value: StateId, variant: 'primary' | 'alternative'): CatalogPictogramDefinition {
  const found = STATE_PICTOGRAMS.find(
    (definition) => definition.id === `state.${value}` && definition.variant === variant,
  );
  if (found === undefined) throw new Error(`Zustand ohne Zeichnung (${variant}): ${value}`);
  return found;
}

export function groupOf(value: StateId): StateGroupId {
  const section = definitionOf(value, 'primary').section.split('.').slice(0, 3).join('.');
  const group = GROUP_OF_SECTION[section];
  if (group === undefined) throw new Error(`Zustand ohne Gruppe: ${value} (${section})`);
  return group;
}

export const HINTS: readonly StateId[] = ['suspected-situation', 'acute-situation'];

// ---------------------------------------------------------------------------------------------
// Abbildung von Primitiven: verschieben, verkleinern, umfärben
// ---------------------------------------------------------------------------------------------

const round3 = (value: number): number => Math.round(value * 1000) / 1000;

export interface Mapping {
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

export function mapStyle(m: Mapping, style: Primitive['style']): Primitive['style'] {
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
export function mapPrimitive(m: Mapping, primitive: Primitive): Primitive {
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

export type PersonFrameId = keyof typeof PERSON_STATE_FRAMES;

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

export interface PersonDrawing {
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
export function personDrawing(value: StateId): PersonDrawing {
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

export function personParts(
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

export const IDENTITY: Mapping = { originX: 0, originY: 0, scale: 1, toX: 0, toY: 0, strokeScale: 1 };

// ---------------------------------------------------------------------------------------------
// Hinweis 5.8.1.13 / 5.8.1.14
// ---------------------------------------------------------------------------------------------

/**
 * Die Hinweismarke aus der Alternativdarstellung (5.8.1.13_2 bzw. 5.8.1.14_2): alles außer dem
 * Dreieck, das dort das erste Primitiv ist. An der Person verschoben und schwarz gefärbt.
 */
export function hintMark(hint: StateHintId, layout: StateHintLayout): readonly Primitive[] {
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

export function hazardTriangle(hint: StateHintId): Primitive {
  const [triangle] = definitionOf(hint, 'alternative').primitives;
  if (triangle === undefined) throw new Error(`5.8.1-Alternative ohne Dreieck: ${hint}`);
  return triangle;
}

// ---------------------------------------------------------------------------------------------
// Einstieg
// ---------------------------------------------------------------------------------------------

export function isPersonCarrier(carrier: StateCarrierInput): boolean {
  return (
    carrier.kind === 'person' &&
    (carrier.variant === undefined || carrier.variant === 'compact-person-diamond-26mm')
  );
}

function carrierName(carrier: StateCarrierInput): string {
  return carrier.variant === undefined ? carrier.kind : `${carrier.kind}/${carrier.variant}`;
}

/**
 * Prüft, was keine Lage, sondern eine falsche Eingabe oder eine Doppelung der Systematik ist.
 * `validateSpec` lehnt dieselben Fälle vorher mit Regel ab; wer `placeStates()` unmittelbar ruft,
 * bekommt hier denselben Befund als Wurf.
 */
function assertPlaceable(input: StatePlacementInput): void {
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
    if (group === 'tactics-hazards' && TACTICS.includes(value)) {
      throw new NotMeasuredError(
        `${value}: Die Einsatztaktik 5.8.1.1 bis 5.8.1.4 steht an keinem Träger; sie ist ein ` +
          'eigenes Zeichen (Regel `state-tactics-not-allowed`).',
        'value',
      );
    }
  }
  if (tendency !== undefined && !TENDENCY_IDS.includes(tendency)) {
    throw new Error(`"${String(tendency)}" ist keine Tendenz aus 5.8.3.`);
  }
  const persons = states.filter((value) => groupOf(value) === 'persons');
  if (persons.length > 1) {
    throw new NotMeasuredError(
      `${persons.join(' + ')}: Zwei Personenzustände widersprechen sich; die Verbindungen ` +
        '„verletzt und …" sind in 5.8.8 eigene Werte (Regel `state-group-limit-exceeded`).',
      'combination',
    );
  }
  if (carrier.kind !== 'person' && persons.length > 0) {
    throw new NotMeasuredError(
      `${persons[0]} an ${carrierName(carrier)}: Ein Personenzustand aus 5.8.8 steht nur an der ` +
        'Person (Regel `state-carrier-not-allowed`).',
      'combination',
    );
  }
}

const TACTICS: readonly StateId[] = [
  'tactical-rescue',
  'tactical-attack',
  'tactical-defense',
  'tactical-retreat',
];

/**
 * Platziert Zustände und Tendenz an einem Träger.
 *
 * Gibt die vermessene Lage, wo eine Referenzdatei genau diese Zusammenstellung zeigt
 * (`measuredStatePlacement`), und sonst die aus ihr abgeleitete (`deriveStatePlacement` in
 * `derive/states.ts`, Teile mit `basis: 'transferred'`). Ohne weitere Angaben der Spec gilt dabei
 * das Grundzeichen aus `baseDrawing()`; `compose()` legt dieselbe Ableitung an das fertig
 * komponierte Zeichen, das bei Formen wie dem Fußband vom bloßen Grundzeichen abweichen kann.
 *
 * Wirft nur noch, wo keine Lage fehlt, sondern die Eingabe falsch ist: Wetter (5.8.7) und Tier
 * (5.8.6) gehören in die eigene Spec-Art, eine Tendenz ins Feld `tendency` (gewöhnliches
 * `Error`); Einsatztaktik, zwei Personenzustände und ein Personenzustand an einer Nicht-Person
 * widersprechen der Systematik (`NotMeasuredError`, den Befund stellt `validateSpec` vorher).
 * Die Randlage `tendency-margin` ist nicht vermessen; ihre Lage ist gespiegelt abgeleitet.
 */
export function placeStates(input: StatePlacementInput): StatePlacement {
  assertPlaceable(input);
  if (input.states.length === 0 && input.tendency === undefined) {
    return { canvasMm: CANVAS_32, baseAreaMm: BASE_AREA_32, carrier: null, parts: [] };
  }
  return measuredStatePlacement(input) ?? deriveStatePlacement(input);
}

/**
 * Die Lage, wenn genau diese Zusammenstellung an einer Referenzdatei abgelesen ist, sonst
 * `undefined`. Belegt sind ein Personenzustand an der Personenraute, ein Hinweis an der Gefahr
 * und ein Hinweis neben der Personenraute der Standardlage (mit oder ohne Personenzustand).
 */
export function measuredStatePlacement(input: StatePlacementInput): StatePlacement | undefined {
  const { carrier, states, tendency } = input;
  if (tendency !== undefined || states.length === 0) return undefined;
  const hints = states.filter((value): value is StateHintId => HINTS.includes(value));
  const persons = states.filter((value) => groupOf(value) === 'persons');
  if (hints.length + persons.length !== states.length) return undefined;
  if (hints.length > 1 || persons.length > 1) return undefined;
  if (persons.length > 0 && !isPersonCarrier(carrier)) return undefined;

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

  // Nur die Gefahr ohne Körpervariante: die Zustandsfassung ersetzt den Körper und zeichnete ein
  // Fußband oder einen Giebel nicht mit.
  if (carrier.kind === 'hazard' && carrier.variant === undefined) {
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

  if (!isPersonCarrier(carrier)) return undefined;

  // Hinweis an der Person: Raute auf 20 mm verkleinert, 36 mm breite Fläche.
  const layout = STATE_HINT_LAYOUTS.person;
  const target = PERSON_STATE_FRAMES['person-diamond-20mm-beside-hint'];
  const drawing = personDrawing(personValue ?? 'person-uninjured');
  if (drawing.frame !== 'person-diamond-26mm') return undefined;
  const map = (primitive: Primitive): Primitive => mapPrimitive(PERSON_HINT_SHRINK, primitive);
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

/**
 * Die Verkleinerung der 26-mm-Personenraute auf die 20-mm-Raute neben einem Hinweis
 * (`5.8.1_Beispiel 3`): um die Mitte (16 | 16) auf (21 | 16), Strich 0,5 → 0,4 mm gemessen.
 * Dieselbe Abbildung trägt `derive/states.ts` auf jeden anderen Träger neben einer Randlage über.
 */
export const PERSON_HINT_SHRINK: Mapping = (() => {
  const source = PERSON_STATE_FRAMES['person-diamond-26mm'];
  const target = PERSON_STATE_FRAMES['person-diamond-20mm-beside-hint'];
  return {
    originX: source.centerXMm,
    originY: source.centerYMm,
    scale: target.halfDiagonalMm / source.halfDiagonalMm,
    toX: target.centerXMm,
    toY: target.centerYMm,
    strokeScale: target.strokeWidthMm / source.strokeWidthMm,
  };
})();
