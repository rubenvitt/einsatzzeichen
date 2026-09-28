import type {
  BlockEntry,
  StateGroup,
  StateGroupEvidence,
  StateGroupId,
  StateGroupRuleIds,
} from '@einsatzzeichen/schema';

/**
 * Kapitel 5.8 als kombinierbare Bausteine (LFH-565): je Gruppe Form, Zone, Träger und Grenze.
 *
 * D.2 hat die 67 Darstellungen als eigenständige Zeichen gebaut (`placement: { mode:
 * 'standalone' }`, `docs/decisions/2026-08-07-kapitel-5-8-zustaende-d2.md` §2). Diese Tabelle sagt
 * je Gruppe, was der Bestand darüber hinaus belegt, wenn der Zustand an einem Zeichen sitzen soll:
 *
 * - **Form** ist für alle neun Gruppen belegt, und zwar an den Kopfkommentaren der Zeichnungen.
 *   Zwei Gruppen zeichnen ihren Träger selbst mit: die Tiersilhouette (5.8.6) und die
 *   Personenraute (5.8.8).
 * - **Zone und Träger** belegen nur die sieben Beispielzeichen der Referenz. Die drei Beispiele zu
 *   5.8.1 zeigen die Marke neben einer Raute; die vier zu 5.8.7 zeigen Schnee unter der Wolke. Für
 *   alle übrigen Gruppen gibt es kein Beispiel, und die Tabelle erfindet keines.
 * - **Grenze je Zeichen** belegt kein Beispiel. Wo die Werte Stufen einer Skala sind, ist „höchstens
 *   einer" **empfohlen**, weil zwei Stufen sich widersprechen — nicht, weil es in der Systematik
 *   steht.
 *
 * Alles, was `proposed` oder `open` ist, entscheidet der Eigentümer. Die Fragen stehen gesammelt in
 * `docs/decisions/2026-09-28-lfh-565-kapitel-5-8-bausteine.md`. Die Regelkennungen sind vorgemerkt
 * (`core/src/rules/planned-state-rules.ts`) und treten mit dem Spec-Feld aus LFH-577 in Kraft.
 *
 * Die Maße an den Beispielen stammen aus dem Kennzahlenartefakt, weil die Referenzdateien nicht
 * eingecheckt sind. Das Artefakt erfasst Hüllen gefüllter Flächen, aber keine umgewandelten
 * Pfade. Deshalb ist die Lage des **Trägers** im Beispiel ablesbar, die Lage der **Marke** nicht.
 * `conformance/src/state-group-fixtures.test.ts` hält jede Zahl gegen das Artefakt fest.
 */

const STATE_RULES: StateGroupRuleIds = Object.freeze({
  carrier: 'state-carrier-not-allowed',
  limit: 'state-group-limit-exceeded',
});

const TENDENCY_RULES: StateGroupRuleIds = Object.freeze({
  carrier: 'tendency-carrier-not-allowed',
  limit: 'tendency-limit-exceeded',
});

const TACTICS_EXAMPLES = [
  '5.8.1_Beispiel 1.svg',
  '5.8.1_Beispiel 2.svg',
  '5.8.1_Beispiel 3.svg',
] as const;

const WEATHER_EXAMPLES = [
  '5.8.7_Beispiel_Schneiend_schwach.svg',
  '5.8.7_Beispiel_Schneiend_mittel.svg',
  '5.8.7_Beispiel_Schneiend_stark.svg',
  '5.8.7_Beispiel_Schneiend_extrem.svg',
] as const;

function source(definedAt: string, note: string): StateGroupEvidence {
  return { definedAt, note };
}

function fixtures(
  assets: readonly `${string}.svg`[],
  note: string,
): readonly [StateGroupEvidence, ...StateGroupEvidence[]] {
  const [first, ...rest] = assets.map((asset) => ({ asset, note }));
  if (first === undefined) throw new Error('Beleg ohne Beispielzeichen');
  return [first, ...rest];
}

const SCALE_NOTE =
  'Aus der Wertestruktur hergeleitet, nicht in der Systematik abgelesen und von keinem Beispiel belegt.';

export const STATE_GROUPS: readonly StateGroup[] = Object.freeze([
  {
    id: 'tactics-hazards',
    section: '5.8.1',
    title: 'Einsatztaktik und Gefahrenhinweise',
    category: 'state',
    depictions: 18,
    form: {
      status: 'evidenced',
      value: 'mark',
      evidence: [
        source(
          'core/src/geometry/pictograms/states/01-tactics-hazards.ts:20–26',
          'Taktikbalken und Warndreiecke stehen ohne Träger in der 32-mm-Fläche.',
        ),
      ],
    },
    zone: {
      status: 'evidenced',
      value: 'state-margin',
      evidence: fixtures(
        TACTICS_EXAMPLES,
        'Die Zeichenfläche ist auf 36 × 32 mm verbreitert, der Träger auf eine 20-mm-Raute verkleinert und seitlich gesetzt. Die Marke steht neben dem Träger, nicht auf ihm.',
      ),
      remaining:
        'Lage und Größe der Marke selbst sind nicht abgelesen: das Kennzahlenartefakt erfasst sie als umgewandelten Pfad ohne Hülle. Der Träger steht in Beispiel 1 und 2 bei x 15…35, in Beispiel 3 bei x 11…31 — ob die Marke links oder rechts sitzt, hängt also vom Wert ab.',
    },
    carriers: {
      status: 'evidenced',
      value: ['base-symbol/person'],
      evidence: fixtures(
        TACTICS_EXAMPLES,
        'Träger ist eine weiß gefüllte, um 45° gedrehte Raute. Das ist die Körperform des Grundzeichens 1.2 Person, der einzigen Grundzeichenart mit Rautenkörper.',
      ),
      remaining: 'Ob weitere Grundzeichen Träger sein dürfen, belegt kein Beispiel.',
    },
    perSign: {
      status: 'open',
      question:
        'Die Taktiken 5.8.1.1 bis 5.8.1.4 schließen einander dem Sinn nach aus, die Gefahrenhinweise 5.8.1.5 bis 5.8.1.14 nicht. Gilt eine Grenze für die ganze Gruppe oder je Untergruppe, und wie viele Gefahrenhinweise darf ein Zeichen zugleich tragen?',
    },
    rules: STATE_RULES,
    fixtures: TACTICS_EXAMPLES,
  },
  {
    id: 'activity',
    section: '5.8.2',
    title: 'Aktivität und Ausfallgrad',
    category: 'state',
    depictions: 4,
    form: {
      status: 'evidenced',
      value: 'mark',
      evidence: [
        source(
          'core/src/geometry/pictograms/states/02-activity.ts:16–24',
          'Eigenes geviertes Quadrat 4…28 mm mit Stufenziffer, ohne Träger.',
        ),
      ],
    },
    zone: {
      status: 'open',
      question:
        'Kein Beispiel zeigt einen Aktivitätsgrad an einem Zeichen. Sitzt er in der Zustandsrandlage wie 5.8.1, und in welcher Größe — das eigene Quadrat misst 24 mm?',
    },
    carriers: {
      status: 'open',
      question: 'An welchen Grundzeichen darf ein Aktivitäts- oder Ausfallgrad stehen?',
    },
    perSign: {
      status: 'proposed',
      value: 1,
      reason: `Die vier Werte sind Stufen einer Skala (bis 25, 50, 75 und 100 Prozent Ausfall). ${SCALE_NOTE}`,
    },
    rules: STATE_RULES,
    fixtures: [],
  },
  {
    id: 'tendency',
    section: '5.8.3',
    title: 'Tendenz',
    category: 'tendency',
    depictions: 3,
    form: {
      status: 'evidenced',
      value: 'mark',
      evidence: [
        source(
          'core/src/geometry/pictograms/states/03-tendencies.ts:29–37',
          'Eigener weißer Rahmen 2…30 mm mit Pfeil, ohne Träger.',
        ),
      ],
    },
    zone: {
      status: 'open',
      question:
        'Kein Beispiel zeigt eine Tendenz an einem Zeichen. Bekommt die Tendenz eine eigene Randlage (`tendency-margin`) oder eine Lage innerhalb der Zustandsrandlage? Das ist die offene Frage aus der Zonenentscheidung vom 21. September 2026, §3 Punkt 10.',
    },
    carriers: {
      status: 'open',
      question:
        'An welchen Trägern darf eine Tendenz stehen — an Grundzeichen, an einem Zustand (etwa einem Aktivitätsgrad) oder an beidem?',
    },
    perSign: {
      status: 'proposed',
      value: 1,
      reason: `Steigend, unverändert und fallend sind drei Werte derselben Richtung. ${SCALE_NOTE}`,
    },
    rules: TENDENCY_RULES,
    fixtures: [],
  },
  {
    id: 'damage',
    section: '5.8.4',
    title: 'Schadensgrad',
    category: 'state',
    depictions: 3,
    form: {
      status: 'evidenced',
      value: 'mark',
      evidence: [
        source(
          'core/src/geometry/pictograms/states/04-damage.ts:6–14',
          'Rote Diagonalscharen ohne Rahmen und ohne Träger.',
        ),
      ],
    },
    zone: {
      status: 'proposed',
      value: 'body',
      reason:
        'Die Diagonalen haben keinen eigenen Rahmen, stehen mittig um (16 | 16) und sind 26 mm lang. Das ist die Form einer Überlagerung des Körpers, nicht die einer Randmarke. Kein Beispiel belegt es.',
    },
    carriers: {
      status: 'open',
      question:
        'An welchen Grundzeichen darf ein Schadensgrad stehen? Die Überlagerung setzt einen Körper voraus, der die 26-mm-Diagonalen aufnimmt.',
    },
    perSign: {
      status: 'proposed',
      value: 1,
      reason: `Angeschlagen, teilzerstört und total zerstört sind Stufen einer Skala. ${SCALE_NOTE}`,
    },
    rules: STATE_RULES,
    fixtures: [],
  },
  {
    id: 'fire',
    section: '5.8.5',
    title: 'Brandphase',
    category: 'state',
    depictions: 3,
    form: {
      status: 'evidenced',
      value: 'mark',
      evidence: [
        source(
          'core/src/geometry/pictograms/states/05-fire.ts:5–10',
          'Eine bis drei Flammen nebeneinander, ohne Träger.',
        ),
      ],
    },
    zone: {
      status: 'open',
      question:
        'Kein Beispiel zeigt eine Brandphase an einem Zeichen. Sitzt sie in der Zustandsrandlage oder auf dem Körper? Die drei Flammen der Phase 3 füllen die ganze Breite der 32-mm-Fläche.',
    },
    carriers: {
      status: 'open',
      question: 'An welchen Grundzeichen darf eine Brandphase stehen?',
    },
    perSign: {
      status: 'proposed',
      value: 1,
      reason: `Entstehungsbrand, fortentwickelter Brand und Vollbrand sind Stufen einer Skala. ${SCALE_NOTE}`,
    },
    rules: STATE_RULES,
    fixtures: [],
  },
  {
    id: 'animals',
    section: '5.8.6',
    title: 'Tierzustand',
    category: 'state',
    depictions: 4,
    form: {
      status: 'evidenced',
      value: 'carrier-included',
      evidence: [
        source(
          'core/src/geometry/pictograms/states/06-animals.ts:5–13',
          'Jede Darstellung zeichnet die Tiersilhouette mit; beim kontaminierten Tier rückt sie 5 mm nach unten, um dem Kontaminationszeichen Platz zu machen.',
        ),
      ],
    },
    zone: {
      status: 'evidenced',
      value: 'freestanding',
      evidence: [
        source(
          'core/src/geometry/pictograms/states/06-animals.ts:5–13',
          'Der Träger ist Teil der Darstellung, das Zeichen steht damit für sich.',
        ),
      ],
      remaining:
        'Die Tiersilhouette ist kein Grundzeichen aus `SYMBOL_KINDS` und hat keinen Baustein. Soll sie einer werden, ist das eine eigene Entscheidung.',
    },
    carriers: {
      status: 'open',
      question:
        'Der Tierzustand bringt seinen Träger mit. Darf er außerdem an einem Grundzeichen stehen, oder bleibt er ein eigenständiges Zeichen?',
    },
    perSign: {
      status: 'open',
      question:
        'Darf ein Tier zugleich erkrankt und kontaminiert sein? Die Werte sind keine Skala, „tot" schließt „erkrankt" aber dem Sinn nach aus.',
    },
    rules: STATE_RULES,
    fixtures: [],
  },
  {
    id: 'weather',
    section: '5.8.7',
    title: 'Wetter',
    category: 'state',
    depictions: 10,
    form: {
      status: 'evidenced',
      value: 'mark',
      evidence: [
        source(
          'core/src/geometry/pictograms/states/07-weather.ts:5–9',
          'Wolke, Bedeckungskreis, Niederschlag und Thermometer stehen ohne Träger.',
        ),
      ],
    },
    zone: {
      status: 'evidenced',
      value: 'freestanding',
      evidence: fixtures(
        WEATHER_EXAMPLES,
        'Die Beispiele kombinieren zwei Wetterwerte ohne Grundzeichen auf der 32-mm-Fläche: die Wolke steht um 3 mm angehoben (Hülle y 3…21 statt 6…24 in 5.8.7.2), der Schnee darunter.',
      ),
      remaining:
        'Die Lage des Schnees unter der Wolke ist nicht abgelesen, das Kennzahlenartefakt erfasst ihn nicht. Wie die vier Intensitätsstufen schwach, mittel, stark und extrem gezeichnet werden, ist ebenso wenig abgelesen; das Schema kennt keine Intensität.',
    },
    carriers: {
      status: 'evidenced',
      value: ['state/weather-cloudy'],
      evidence: fixtures(
        WEATHER_EXAMPLES,
        'Träger des Niederschlags ist die Wolke aus 5.8.7.2: weiß gefüllt, gleich breit (x 1…31) und gleich hoch (18 mm).',
      ),
      remaining:
        'Belegt ist nur Schnee an der Wolke. Ob Regen, Hagel und Gewitter ebenso an die Wolke gehen und ob Wetter an einem Grundzeichen stehen darf, ist offen.',
    },
    perSign: {
      status: 'open',
      question:
        'Die Beispiele zeigen zwei Wetterwerte zugleich (Wolke und Schnee). Wie viele sind höchstens zulässig, und welche Paare — etwa Sonne und Bedeckung — schließen einander aus?',
    },
    rules: STATE_RULES,
    fixtures: WEATHER_EXAMPLES,
  },
  {
    id: 'persons',
    section: '5.8.8',
    title: 'Personenzustand',
    category: 'state',
    depictions: 18,
    form: {
      status: 'evidenced',
      value: 'carrier-included',
      evidence: [
        source(
          'core/src/geometry/pictograms/states/08-persons.ts:9–16',
          'Grundform jeder Darstellung ist die Personenraute mit weißer Fläche.',
        ),
      ],
    },
    zone: {
      status: 'evidenced',
      value: 'body',
      evidence: [
        source(
          'core/src/geometry/pictograms/states/08-persons.ts:9–16',
          'Die Zustandsmarken liegen auf der Raute, der Verletzungsstrich etwa ist ihre senkrechte Diagonale.',
        ),
      ],
      remaining:
        'Drei Werte setzen zusätzlich Marken in die Ecken außerhalb der Raute: die Sichtungskategorie unten links (5.8.8.4), Transportpriorität und Kontamination oben rechts (5.8.8.5, 5.8.8.6). Diese Ecklagen kennt das Zonenmodell nicht.',
    },
    carriers: {
      status: 'evidenced',
      value: ['base-symbol/person'],
      evidence: [
        source(
          'core/src/geometry/pictograms/states/08-persons.ts:76–77',
          'Standardlage: 26-mm-Raute um die Zeichenmitte, Hülle 3…29.',
        ),
        source(
          'core/src/geometry/pictograms/states/08-persons.ts:181–182',
          'Um 2 mm angehobene 26-mm-Raute der Transportzeichen 5.8.8.12 bis 5.8.8.14.',
        ),
        source(
          'core/src/geometry/pictograms/states/08-persons.ts:279–281',
          'Um 4,5 mm abgesenkte 21-mm-Raute bei 5.8.8.9.',
        ),
      ],
      remaining:
        'Nur die zentrierte 26-mm-Raute entspricht einer vermessenen Körperfassung (`person/compact-person-diamond-26mm`, I.5.1). Die beiden anderen Lagen sind an keinem Grundzeichen vermessen.',
    },
    perSign: {
      status: 'open',
      question:
        'Darf eine Person zugleich mehrere Zustände tragen, etwa verletzt und kontaminiert? Die Darstellungen zeigen je einen Wert; 5.8.8.4 und 5.8.8.5 sind selbst schon Verfeinerungen von „verletzt".',
    },
    rules: STATE_RULES,
    fixtures: [],
  },
  {
    id: 'access',
    section: '5.8.9',
    title: 'Zugang',
    category: 'state',
    depictions: 4,
    form: {
      status: 'evidenced',
      value: 'mark',
      evidence: [
        source(
          'core/src/geometry/pictograms/states/09-access.ts:9–13',
          'Senkrechte Fahrbahnstriche über die volle Höhe 2…30 mm, ohne Träger.',
        ),
      ],
    },
    zone: {
      status: 'open',
      question:
        'Kein Beispiel zeigt einen Zugangszustand an einem Zeichen. Sitzt er in der Zustandsrandlage, oder gehört er an eine Linie aus Kapitel 2 (LFH-566)?',
    },
    carriers: {
      status: 'open',
      question: 'An welchen Trägern darf ein Zugangszustand stehen?',
    },
    perSign: {
      status: 'open',
      question:
        'Gesperrt, schwierig befahrbar und unbefahrbar sind Stufen der Befahrbarkeit, die Einbahnstraßenregelung ist keine. Gilt „höchstens einer" nur für die drei Stufen?',
    },
    rules: STATE_RULES,
    fixtures: [],
  },
] satisfies readonly StateGroup[]);

/** Nachschlag über die Kennung. Wirft, weil die Kennung eine geschlossene Union ist. */
export function stateGroup(id: StateGroupId): StateGroup {
  const found = STATE_GROUPS.find((group) => group.id === id);
  if (found === undefined) throw new Error(`Unbekannte Zustandsgruppe: ${id}`);
  return found;
}

/**
 * Die Gruppe eines Registereintrags aus `state` oder `tendency`, über den Abschnitt seiner
 * Zeichnung. `undefined` für jeden anderen Eintrag.
 */
export function stateGroupOf(entry: BlockEntry): StateGroup | undefined {
  if (entry.category !== 'state' && entry.category !== 'tendency') return undefined;
  if (entry.binding.status !== 'measured') return undefined;
  const section = entry.binding.geometry.sourceRefs?.[0]?.section;
  if (section === undefined) return undefined;
  return STATE_GROUPS.find((group) => section.startsWith(`${group.section}.`));
}
