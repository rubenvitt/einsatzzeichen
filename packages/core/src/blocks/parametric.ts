import type {
  BlockEntry,
  BlockId,
  LineId,
  MovementId,
  ParametricBlock,
  ParametricFinding,
  StateGroupEvidence,
} from '@einsatzzeichen/schema';
import { LINE_GEOMETRY, MOVEMENT_GEOMETRY } from '../geometry/parametric.js';
import { babz, block, measured, notMeasured } from './helpers.js';

/**
 * Bewegung und Maßnahmen aus 5.2 und Linien und Grenzen aus Kapitel 2 als Bausteine mit
 * Parametersatz, Zone und Regel (LFH-566).
 *
 * Zwei Sichten auf dieselben 13 Werte, wie bei Kapitel 5.8:
 *
 * - `ARROW_BLOCKS` und `LINE_BLOCKS` sind die Einträge im Bausteinregister. Sie sagen, ob es eine
 *   Zeichnung gibt, und zeigen auf die Stelle in `core/src/geometry/parametric.ts`.
 * - `PARAMETRIC_BLOCKS` sagt je Wert, welche Parameter er annimmt, wie weit seine Geometrie belegt
 *   ist, an welchen Trägern er sitzen darf und wie er mit Zustand und Tendenz zusammengeht. Jede
 *   Aussage ist `evidenced`, `proposed` oder `open`; die offenen Fragen stehen gesammelt in
 *   `docs/decisions/2026-09-28-lfh-566-bewegung-linien-grenzen.md`.
 *
 * Die Regelkennungen sind vorgemerkt (`core/src/rules/planned-parametric-rules.ts`) und treten mit
 * dem Spec-Feld aus LFH-577 in Kraft.
 */

const GEOMETRY_FILE = 'core/src/geometry/parametric.ts';

/** Fundort je Wert in `parametric.ts`, Zeilen des Eintrags samt Kommentar darüber. */
const MOVEMENT_AT: Readonly<Record<MovementId, string>> = {
  'direction-of-action': `${GEOMETRY_FILE}:102–108`,
  'start-of-action': `${GEOMETRY_FILE}:109–115`,
  'directed-movement': `${GEOMETRY_FILE}:116–121`,
  'movement-both-directions': `${GEOMETRY_FILE}:122–127`,
  'end-of-movement': `${GEOMETRY_FILE}:128–142`,
  gathering: `${GEOMETRY_FILE}:143–157`,
};

const LINE_AT: Readonly<Record<LineId, string>> = {
  'escape-route': `${GEOMETRY_FILE}:216–230`,
  'barrier-position': `${GEOMETRY_FILE}:231–236`,
  'fire-spread': `${GEOMETRY_FILE}:237–242`,
  'boundary-command-area': `${GEOMETRY_FILE}:243–248`,
  'boundary-section': `${GEOMETRY_FILE}:249–254`,
  'boundary-subsection': `${GEOMETRY_FILE}:255–261`,
  'boundary-with-strength': `${GEOMETRY_FILE}:262–267`,
};

const MOVEMENT_SECTION: Readonly<Record<MovementId, string>> = {
  'direction-of-action': '5.2.1',
  'start-of-action': '5.2.2',
  'directed-movement': '5.2.3',
  'movement-both-directions': '5.2.4',
  'end-of-movement': '5.2.5',
  gathering: '5.2.6',
};

const LINE_SECTION: Readonly<Record<LineId, string>> = {
  'escape-route': '2.14',
  'barrier-position': '2.15',
  'fire-spread': '2.16',
  'boundary-command-area': '2.17',
  'boundary-section': '2.18',
  'boundary-subsection': '2.19',
  'boundary-with-strength': '2.20',
};

function arrow(id: MovementId): BlockEntry {
  const geometry = MOVEMENT_GEOMETRY[id];
  return block(
    'arrow',
    id,
    'movement-anchor',
    geometry.status === 'measured'
      ? measured(MOVEMENT_AT[id], geometry.note, babz(MOVEMENT_SECTION[id]))
      : notMeasured(MOVEMENT_AT[id], geometry.reason),
  );
}

function line(id: LineId): BlockEntry {
  const geometry = LINE_GEOMETRY[id];
  return block(
    'line',
    id,
    'freestanding',
    geometry.status === 'measured'
      ? measured(LINE_AT[id], geometry.note, babz(LINE_SECTION[id]))
      : notMeasured(LINE_AT[id], geometry.reason),
  );
}

/** Die Pfeile aus 5.2 im Bausteinregister. Zone ist der Anbindungspunkt am Körper. */
export const ARROW_BLOCKS: readonly BlockEntry[] = Object.freeze(
  (Object.keys(MOVEMENT_SECTION) as MovementId[]).map(arrow),
);

/** Die Linien und Grenzen aus Kapitel 2 im Bausteinregister. Sie liegen frei auf der Lagekarte. */
export const LINE_BLOCKS: readonly BlockEntry[] = Object.freeze(
  (Object.keys(LINE_SECTION) as LineId[]).map(line),
);

const MOVEMENT_RULES = ['movement-carrier-not-allowed', 'movement-anchor-conflict'] as const;
const LINE_RULES = ['line-anchor-not-allowed', 'line-strength-mismatch'] as const;

function fixture(asset: `${string}.svg`, note: string): readonly [StateGroupEvidence] {
  return [{ asset, note }];
}

const DECISION_REF = 'docs/decisions/2026-09-28-lfh-566-bewegung-linien-grenzen.md §7';

/**
 * Entscheidung des Eigentümers vom 29.09.2026: freistehende Zeichen bekommen eine eigene Spec-Art,
 * und ein Pfeil bindet nur dort an einen Körper an, wo ein Original das belegt.
 */
function freestanding(decision: string): ParametricFinding<readonly BlockId[]> {
  return { status: 'decided', value: [], decision, decidedOn: '2026-09-29', by: 'owner', ref: DECISION_REF };
}

/** Wo `anchoredMovementPath` steht; die Zeilen hält `parametric.test.ts` fest. */
const ANCHOR_AT = `${GEOMETRY_FILE}:563–596`;

const MOVEMENT_AT_PERSON: ParametricFinding<readonly BlockId[]> = {
  status: 'evidenced',
  value: ['base-symbol/person'],
  evidence: [
    {
      definedAt: ANCHOR_AT,
      note: 'anchoredMovementPath: 5.8.8.12 bis 5.8.8.14 zeigen 5.2.2, 5.2.3 und 5.2.5 an der 26-mm-Personenraute (Hülle 3…29 × 1…27), Achse auf y 27 durch die untere Ecke, von x 3 bis 30.',
    },
  ],
  remaining:
    'Belegt ist nur die untere Kante der um 2 mm angehobenen Raute, und nur als Teil eines Personenzustands. Ob andere Grundzeichen, andere Kanten oder die übrigen drei Pfeile anbinden dürfen, zeigt kein Original.',
};

const MOVEMENT_FREE = freestanding(
  'Pfeile ohne Original am Körper stehen frei in der eigenen Spec-Art; eine Anbindung gibt es erst mit einem Beleg.',
);

const MOVEMENT_WITH_STATE: ParametricFinding<string> = {
  status: 'open',
  question:
    'Darf ein Zeichen zugleich einen Pfeil aus 5.2 und eine Tendenz aus 5.8.3 tragen? Die Tendenz ist selbst ein Pfeil, aber in eigenem Rahmen. Und darf der Pfeil an derselben Körperkante sitzen wie eine Zustands- oder Tendenzrandlage?',
};

const LINE_CARRIERS = freestanding(
  'Linien und Grenzen stehen frei auf der Lagekarte, in der eigenen Spec-Art und ohne Grundzeichen.',
);

const LINE_WITH_STATE: ParametricFinding<string> = {
  status: 'proposed',
  value: 'keine Kombination',
  reason:
    'Keine der sieben Linien ist ein Verkehrsweg. Der Zugang aus 5.8.9 (Befahrbarkeit, Einbahnstraße) ist deshalb kein Zustand dieser Linien, und für die übrigen Gruppen aus 5.8 gibt es keinen Anlass.',
};

function movement(
  id: MovementId,
  title: string,
  asset: `${string}.svg`,
  geometry: ParametricFinding<string>,
  carriers: ParametricFinding<readonly BlockId[]> = MOVEMENT_FREE,
): ParametricBlock {
  return {
    id: `arrow/${id}`,
    category: 'arrow',
    valueId: id,
    section: MOVEMENT_SECTION[id],
    title,
    parameters: ['path', 'anchor'],
    assets: [asset],
    geometry,
    carriers,
    withStateOrTendency: MOVEMENT_WITH_STATE,
    rules: MOVEMENT_RULES,
  };
}

function lineBlock(
  id: LineId,
  title: string,
  assets: readonly [`${string}.svg`, ...`${string}.svg`[]],
  geometry: ParametricFinding<string>,
): ParametricBlock {
  return {
    id: `line/${id}`,
    category: 'line',
    valueId: id,
    section: LINE_SECTION[id],
    title,
    parameters: id === 'boundary-with-strength' ? ['path', 'strength'] : ['path'],
    assets,
    geometry,
    carriers: LINE_CARRIERS,
    withStateOrTendency: LINE_WITH_STATE,
    rules: LINE_RULES,
  };
}

const ARROW_REMAINING =
  'Die Referenz zeigt jeden Pfeil nur auf einem geraden Verlauf. Wie er an einem Knick aussieht, ist gebaut, nicht belegt: der Schaft folgt den Stützpunkten, der Kopf dem letzten Abschnitt.';

const MARKED_REMAINING =
  'Die Referenz zeigt je einen gekrümmten Verlauf. Die Marken sind wiederholt, nicht gestreckt; die Regel dafür (feste Teilung, mittig, mindestens 3 mm vom Ende) ist vorgeschlagen und trifft an allen vier Darstellungen die Anzahl, die Lage auf höchstens 1,65 mm. Welche Seite die Querstriche meinen (Gefahr, Ausbreitung), zeigt kein Original; gebaut ist links der Fahrtrichtung. Gebaut ist der Verlauf als Polyzug, nicht als Kurve.';

const BOUNDARY_REMAINING =
  'Die Referenz zeigt eine Periode auf einem geraden Verlauf. Wie sich Strich und Lücke auf einem längeren Verlauf wiederholen, ist vorgeschlagen (`layoutDashes`: Lücke fest, Striche teilen den Rest). Ob die Beschriftung aufrecht bleibt oder sich mit dem Verlauf dreht und ob sie ein Parameter ist, zeigt kein Original; sie bleibt fest und aufrecht.';

function measuredAt(asset: `${string}.svg`, value: string, note: string, remaining: string): ParametricFinding<string> {
  return { status: 'evidenced', value, evidence: fixture(asset, note), remaining };
}

export const PARAMETRIC_BLOCKS: readonly ParametricBlock[] = Object.freeze([
  movement('direction-of-action', 'Richtung des Vortragens einer Maßnahme', '5.2.1_Richtung des Vortragens einer Maßnahme.svg', measuredAt(
    '5.2.1_Richtung des Vortragens einer Maßnahme.svg',
    'Zwei Schäfte 2 mm neben der Achse entlang der Stützpunkte, rechtwinkliger Kopf von 6 mm Tiefe am Ende.',
    'Schäfte bei y 14 und 18 ab x 2, Kopf mit Spitze bei 30; Hülle 2/9,823/30,354/22,177 auf dem Verlauf 2|16 → 30|16.',
    ARROW_REMAINING,
  )),
  movement('start-of-action', 'Beginn einer Maßnahme', '5.2.2_Beginn einer Maßnahme.svg', measuredAt(
    '5.2.2_Beginn einer Maßnahme.svg',
    'Querstrich von 8 mm quer zum Anfang, Schaft entlang der Stützpunkte, rechtwinkliger Kopf von 4 mm Tiefe am Ende.',
    'Querstrich bei x 2 von y 12 bis 20; Hülle 1,75/11,823/30,354/20,177 auf dem Verlauf 2|16 → 30|16.',
    ARROW_REMAINING,
  ), MOVEMENT_AT_PERSON),
  movement('directed-movement', 'Gerichtete Bewegung', '5.2.3_Gerichtete Bewegung.svg', measuredAt(
    '5.2.3_Gerichtete Bewegung.svg',
    'Schaft entlang der Stützpunkte, rechtwinkliger Kopf von 4 mm Tiefe am Ende.',
    'Hülle 2/11,823/30,354/20,177 auf dem Verlauf 2|16 → 30|16.',
    ARROW_REMAINING,
  ), MOVEMENT_AT_PERSON),
  movement('movement-both-directions', 'Bewegung in zwei Richtungen', '5.2.4_Bewegung in zwei Richtungen.svg', measuredAt(
    '5.2.4_Bewegung in zwei Richtungen.svg',
    'Schaft entlang der Stützpunkte, rechtwinklige Köpfe von 4 mm Tiefe an beiden Enden.',
    'Hülle 1,646/11,823/30,354/20,177 auf dem Verlauf 2|16 → 30|16.',
    ARROW_REMAINING,
  )),
  movement('end-of-movement', 'Ende einer Bewegung', '5.2.5_Ende einer Bewegung.svg', measuredAt(
    '5.2.5_Ende einer Bewegung.svg',
    'Querstrich von 8 mm quer zum Ende, Schaft bis zur Spitze, rechtwinkliger Kopf von 4 mm Tiefe 0,2 mm vor dem Querstrich.',
    'Querstrich bei x 30 von y 12 bis 20, Schenkelenden bei 25,977; Hülle 2/11,823/30,25/20,177 auf dem Verlauf 2|16 → 30|16.',
    ARROW_REMAINING,
  ), MOVEMENT_AT_PERSON),
  movement('gathering', 'Sammeln, Zusammenführen', '5.2.6_Sammeln_Zusammenführen.svg', measuredAt(
    '5.2.6_Sammeln_Zusammenführen.svg',
    'Ring mit Radius 4 mm um das Verlaufsende, Schaft entlang der Stützpunkte, rechtwinkliger Kopf von 4 mm Tiefe mit der Spitze 1 mm vor dem Ring.',
    'Ring um 26|16 mit Mittelradius 4 mm, Spitze bei x 21, Schaft ab x 2 auf dem Verlauf 2|16 → 26|16.',
    `Die Referenz zeigt genau einen Zulauf. Ob mehrere Pfeile auf denselben Ring zulaufen dürfen, zeigt kein Original. ${ARROW_REMAINING}`,
  )),
  lineBlock('escape-route', 'Escape Route', ['2.14_Escape Route.svg', '2.14_Escape Route_2.svg'], {
    status: 'evidenced',
    value: 'Grüner Strich mit gefüllten Punkten (Radius 1,5 mm) alle 8 mm; zweite Darstellung mit Punkten alle 12 mm und Pfeilköpfen (Schenkel 3 mm) dazwischen.',
    evidence: [
      { asset: '2.14_Escape Route.svg', note: 'Sieben Punkte, Radius 1,5 mm, Abstand 7,96…7,97 mm auf 60,36 mm Verlauf; Strich 0,5 mm, #14a01e.' },
      { asset: '2.14_Escape Route_2.svg', note: 'Fünf Punkte im Abstand 12,16…12,19 mm, vier rechtwinklige Pfeilköpfe mit 3 mm Schenkeln dazwischen, Spitze zum Verlaufsende.' },
    ],
    remaining: MARKED_REMAINING,
  }),
  lineBlock('barrier-position', 'Riegelstellung', ['2.15_Riegelstellung.svg'], measuredAt(
    '2.15_Riegelstellung.svg',
    'Hellblauer Strich mit Querstrichen links der Fahrtrichtung, 2,25 mm von der Achse, alle 4 mm.',
    'Zwölf Querstriche auf 52,11 mm Verlauf, Abstand 3,99 mm, Strichende 2,26…2,28 mm von der Achse; Strich 0,5 mm, #3264fa.',
    MARKED_REMAINING,
  )),
  lineBlock('fire-spread', 'Brandausbreitung', ['2.16_Brandausbreitung.svg'], measuredAt(
    '2.16_Brandausbreitung.svg',
    'Roter Strich mit Querstrichen links der Fahrtrichtung, 2,25 mm von der Achse, alle 4 mm.',
    'Vierzehn Querstriche auf 61,83 mm Verlauf, Abstand 4,15 mm, Strichende 2,26…2,28 mm von der Achse; Strich 0,5 mm, #fa1919.',
    MARKED_REMAINING,
  )),
  lineBlock('boundary-command-area', 'Grenze Einsatzraum TEL', ['2.17_Grenze Einsatzraum TEL.svg'], measuredAt(
    '2.17_Grenze Einsatzraum TEL.svg',
    'Striche von 16 mm, Lücke von 14 mm mit der Beschriftung „TEL“.',
    'Striche 1…17 und 31…47 bei y 15,75…16,25, drei Glyphen 13,531…17,914 hoch.',
    BOUNDARY_REMAINING,
  )),
  lineBlock('boundary-section', 'Grenze Einsatzabschnitt', ['2.18_Grenze Einsatzabschnitt.svg'], measuredAt(
    '2.18_Grenze Einsatzabschnitt.svg',
    'Striche von 16 mm, Lücke von 14 mm mit der Beschriftung „EA“.',
    'Striche 1…17 und 31…47, zwei Glyphen 13,531…17,914 hoch.',
    BOUNDARY_REMAINING,
  )),
  lineBlock('boundary-subsection', 'Grenze Unterabschnitt', ['2.19_Grenze Unterabschnitt.svg'], measuredAt(
    '2.19_Grenze Unterabschnitt.svg',
    'Striche von 15 mm, Lücke von 16 mm mit der Beschriftung „UEA“.',
    'Striche 1…16 und 32…47; U (Kurvenpfad, x 18,822…22,074), E und A gleich breit wie in 2.18.',
    BOUNDARY_REMAINING,
  )),
  lineBlock('boundary-with-strength', 'Grenze mit taktischer Stärke', ['2.20_Grenze mit taktischer Stärke.svg'], measuredAt(
    '2.20_Grenze mit taktischer Stärke.svg',
    'Striche von 17 mm, Lücke von 12 mm mit drei Marken der Stärke Zug.',
    'Striche 1…18 und 30…47, drei Kreise mit Radius 1 bei x 21, 24 und 27.',
    `Belegt sind nur drei Marken, also der Zug; Trupp, Staffel und Gruppe an einer Grenze zeigt kein Original. ${BOUNDARY_REMAINING}`,
  )),
] satisfies ParametricBlock[]);

/** Nachschlag über die Bausteinkennung, `undefined` statt Wurf. */
export function parametricBlock(id: string): ParametricBlock | undefined {
  return PARAMETRIC_BLOCKS.find((entry) => entry.id === id);
}
