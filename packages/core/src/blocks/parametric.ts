import type {
  BlockEntry,
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
  'direction-of-action': `${GEOMETRY_FILE}:75–80`,
  'start-of-action': `${GEOMETRY_FILE}:81–85`,
  'directed-movement': `${GEOMETRY_FILE}:86–91`,
  'movement-both-directions': `${GEOMETRY_FILE}:92–97`,
  'end-of-movement': `${GEOMETRY_FILE}:98–102`,
  gathering: `${GEOMETRY_FILE}:103–107`,
};

const LINE_AT: Readonly<Record<LineId, string>> = {
  'escape-route': `${GEOMETRY_FILE}:133`,
  'barrier-position': `${GEOMETRY_FILE}:134`,
  'fire-spread': `${GEOMETRY_FILE}:135`,
  'boundary-command-area': `${GEOMETRY_FILE}:136–141`,
  'boundary-section': `${GEOMETRY_FILE}:142–147`,
  'boundary-subsection': `${GEOMETRY_FILE}:148–154`,
  'boundary-with-strength': `${GEOMETRY_FILE}:155–160`,
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

const MOVEMENT_CARRIERS: ParametricFinding<readonly never[]> = {
  status: 'open',
  question:
    'Kein Original zeigt einen Pfeil an einem Grundzeichen; alle sechs stehen frei in der 32-mm-Fläche. An welchen Grundzeichen darf ein Pfeil beginnen, und an welcher Körperkante?',
};

const MOVEMENT_WITH_STATE: ParametricFinding<string> = {
  status: 'open',
  question:
    'Darf ein Zeichen zugleich einen Pfeil aus 5.2 und eine Tendenz aus 5.8.3 tragen? Die Tendenz ist selbst ein Pfeil, aber in eigenem Rahmen. Und darf der Pfeil an derselben Körperkante sitzen wie eine Zustands- oder Tendenzrandlage?',
};

const LINE_CARRIERS: ParametricFinding<readonly never[]> = {
  status: 'proposed',
  value: [],
  reason:
    'Linien und Grenzen liegen auf der Lagekarte und nicht an einem Körper. Die Referenz zeigt sie in einer eigenen Fläche von 48 × 32 mm ohne Grundzeichen; dass es nie eines gibt, belegt das nicht.',
};

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
    carriers: MOVEMENT_CARRIERS,
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
  'Belegt ist die Hülle, nicht der Innenaufbau: ob der Schaft bis zur Spitze läuft oder am Kopf endet, ergibt dieselbe Hülle. Wie der Pfeil an einem Knick des Verlaufs aussieht, zeigt kein Original.';

const BOUNDARY_REMAINING =
  'Die Referenz zeigt eine Periode auf einem geraden Verlauf. Wie sich Strich und Lücke auf einem längeren Verlauf wiederholen, ist vorgeschlagen (`layoutDashes`: Lücke fest, Striche teilen den Rest). Ob die Beschriftung aufrecht bleibt oder sich mit dem Verlauf dreht, zeigt kein Original; sie bleibt aufrecht.';

function missing(question: string): ParametricFinding<string> {
  return { status: 'open', question };
}

export const PARAMETRIC_BLOCKS: readonly ParametricBlock[] = Object.freeze([
  movement('direction-of-action', 'Richtung des Vortragens einer Maßnahme', '5.2.1_Richtung des Vortragens einer Maßnahme.svg', {
    status: 'evidenced',
    value: 'Schaft entlang der Stützpunkte, rechtwinkliger Kopf von 6 mm Tiefe am Ende.',
    evidence: fixture('5.2.1_Richtung des Vortragens einer Maßnahme.svg', 'Hülle 2/9,823/30,354/22,177 auf dem Verlauf 2|16 → 30|16.'),
    remaining: ARROW_REMAINING,
  }),
  movement('start-of-action', 'Beginn einer Maßnahme', '5.2.2_Beginn einer Maßnahme.svg', missing(
    'Wie lang ist der Querstrich am Anfang? Die Hülle belegt seine Lage (x 2) und den Kopf von 4 mm, die Länge nur als höchstens 8,354 mm. Nötig ist eine Ablesung an der Referenzdatei.',
  )),
  movement('directed-movement', 'Gerichtete Bewegung', '5.2.3_Gerichtete Bewegung.svg', {
    status: 'evidenced',
    value: 'Schaft entlang der Stützpunkte, rechtwinkliger Kopf von 4 mm Tiefe am Ende.',
    evidence: fixture('5.2.3_Gerichtete Bewegung.svg', 'Hülle 2/11,823/30,354/20,177 auf dem Verlauf 2|16 → 30|16.'),
    remaining: ARROW_REMAINING,
  }),
  movement('movement-both-directions', 'Bewegung in zwei Richtungen', '5.2.4_Bewegung in zwei Richtungen.svg', {
    status: 'evidenced',
    value: 'Schaft entlang der Stützpunkte, rechtwinklige Köpfe von 4 mm Tiefe an beiden Enden.',
    evidence: fixture('5.2.4_Bewegung in zwei Richtungen.svg', 'Hülle 1,646/11,823/30,354/20,177 auf dem Verlauf 2|16 → 30|16.'),
    remaining: ARROW_REMAINING,
  }),
  movement('end-of-movement', 'Ende einer Bewegung', '5.2.5_Ende einer Bewegung.svg', missing(
    'Wo steht der Kopf vor dem Querstrich am Ende, und wie lang ist der Querstrich? Die Hülle belegt den Querstrich bei x 30 und einen Kopf von 4 mm Halbbreite. Nötig ist eine Ablesung an der Referenzdatei.',
  )),
  movement('gathering', 'Sammeln, Zusammenführen', '5.2.6_Sammeln_Zusammenführen.svg', missing(
    'Wie ist der Kurvenpfad gebaut, und welche Teile davon sind Parameter — laufen mehrere Verläufe auf einen Punkt zu? Das Kennzahlenartefakt erfasst Kurven nicht.',
  )),
  lineBlock('escape-route', 'Escape Route', ['2.14_Escape Route.svg', '2.14_Escape Route_2.svg'], missing(
    'Wie ist die grüne Fläche gebaut, und wie folgt sie einem Verlauf? Beide Darstellungen sind je ein gefüllter Kurvenpfad; worin sie sich unterscheiden, erfasst das Kennzahlenartefakt nicht.',
  )),
  lineBlock('barrier-position', 'Riegelstellung', ['2.15_Riegelstellung.svg'], missing(
    'Wie ist die hellblaue Fläche gebaut, und wie folgt sie einem Verlauf? Sie ist ein gefüllter Kurvenpfad.',
  )),
  lineBlock('fire-spread', 'Brandausbreitung', ['2.16_Brandausbreitung.svg'], missing(
    'Wie ist die rote Fläche gebaut, und wie folgt sie einem Verlauf? Sie ist ein gefüllter Kurvenpfad.',
  )),
  lineBlock('boundary-command-area', 'Grenze Einsatzraum TEL', ['2.17_Grenze Einsatzraum TEL.svg'], {
    status: 'evidenced',
    value: 'Striche von 16 mm, Lücke von 14 mm mit der Beschriftung „TEL“.',
    evidence: fixture('2.17_Grenze Einsatzraum TEL.svg', 'Striche 1…17 und 31…47 bei y 15,75…16,25, drei Glyphen 13,531…17,914 hoch.'),
    remaining: BOUNDARY_REMAINING,
  }),
  lineBlock('boundary-section', 'Grenze Einsatzabschnitt', ['2.18_Grenze Einsatzabschnitt.svg'], {
    status: 'evidenced',
    value: 'Striche von 16 mm, Lücke von 14 mm mit der Beschriftung „EA“.',
    evidence: fixture('2.18_Grenze Einsatzabschnitt.svg', 'Striche 1…17 und 31…47, zwei Glyphen 13,531…17,914 hoch.'),
    remaining: BOUNDARY_REMAINING,
  }),
  lineBlock('boundary-subsection', 'Grenze Unterabschnitt', ['2.19_Grenze Unterabschnitt.svg'], {
    status: 'evidenced',
    value: 'Striche von 15 mm, Lücke von 16 mm mit der Beschriftung „UEA“.',
    evidence: fixture('2.19_Grenze Unterabschnitt.svg', 'Striche 1…16 und 32…47; E und A gleich breit wie in 2.18, davor ein Glyph mit Rundung.'),
    remaining: `Das U ist aus dem Dateinamen gelesen, nicht vermessen. ${BOUNDARY_REMAINING}`,
  }),
  lineBlock('boundary-with-strength', 'Grenze mit taktischer Stärke', ['2.20_Grenze mit taktischer Stärke.svg'], {
    status: 'evidenced',
    value: 'Striche von 17 mm, Lücke von 12 mm mit drei Marken der Stärke Zug.',
    evidence: fixture('2.20_Grenze mit taktischer Stärke.svg', 'Striche 1…18 und 30…47, drei Kreise mit Radius 1 bei x 21, 24 und 27.'),
    remaining: `Belegt sind nur drei Marken, also der Zug; Trupp, Staffel und Gruppe an einer Grenze zeigt kein Original. ${BOUNDARY_REMAINING}`,
  }),
] satisfies ParametricBlock[]);

/** Nachschlag über die Bausteinkennung, `undefined` statt Wurf. */
export function parametricBlock(id: string): ParametricBlock | undefined {
  return PARAMETRIC_BLOCKS.find((entry) => entry.id === id);
}
