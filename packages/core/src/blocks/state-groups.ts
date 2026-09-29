import type {
  BlockEntry,
  BlockId,
  StateGroup,
  StateGroupEvidence,
  StateGroupFinding,
  StateGroupId,
  StateGroupRuleIds,
  StateId,
} from '@einsatzzeichen/schema';
import { STATE_BLOCKS, TENDENCY_BLOCKS } from './states.js';

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
 * `docs/decisions/2026-09-28-lfh-565-kapitel-5-8-bausteine.md`. Die Regelkennungen für Zustände sind
 * seit LFH-577 mit den Spec-Feldern `states` und `tendency` in Kraft (Regelkatalog); die
 * Trägerregel der Tendenz bleibt vorgemerkt, ihre Grenzregel ist gestrichen
 * (`core/src/rules/planned-state-rules.ts`).
 *
 * Die Maße an den Beispielen stammen aus dem Kennzahlenartefakt, weil die Referenzdateien nicht
 * eingecheckt sind. Das Artefakt erfasst Hüllen gefüllter Flächen, aber keine umgewandelten
 * Pfade. Deshalb ist die Lage des **Trägers** im Beispiel ablesbar, die Lage der **Marke** nicht.
 * `conformance/src/state-group-fixtures.test.ts` hält jede Zahl gegen das Artefakt fest.
 *
 * **Nachtrag 29. September 2026 (LFH-577).** Alle 661 Referenzdateien sind durchgesehen und die
 * Marken an den Dateien selbst vermessen, nicht nur am Kennzahlenartefakt. Neu belegt: die Hinweise
 * „?" und „!" aus 5.8.1 stehen links neben einem verkleinerten Träger — Person in den drei
 * Beispielen, Gefahr in 5.8.1.13_2, 5.8.1.14_2 und M.6; der Schadensgrad liegt als Überlagerung
 * über dem Deichprofil aus Anhang L (L.8, L.9). Die Lagen baut `layout/state-placement.ts`. Die
 * Entscheidungen des Eigentümers vom selben Tag stehen als eigener Stand `decided` — eine
 * Entscheidung ist keine Ablesung.
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

/** Die Vorlage, in der die Entscheidungen vom 29. September 2026 festgehalten sind. */
const DECISION_REF = 'docs/decisions/2026-09-28-lfh-565-kapitel-5-8-bausteine.md §8';

function decided<T>(value: T, decision: string): StateGroupFinding<T> {
  return { status: 'decided', value, decision, decidedOn: '2026-09-29', by: 'owner', ref: DECISION_REF };
}

const ONE_PER_SCALE =
  'Höchstens ein Wert je Skala und Zeichen: die Empfehlung aus der Vorlage vom 28.09.2026, Frage 1, ist angenommen.';

/**
 * Referenzdateien außerhalb der Beispielzeichen, die eine Gruppe an einem Träger zeigen. Ihre
 * Hüllen hält `conformance/src/state-group-fixtures.test.ts` gegen das Kennzahlenartefakt fest.
 */
const HINT_CARRIER_EVIDENCE = [
  '5.8.1.13_Hinweis auf Vermutung_2.svg',
  '5.8.1.14_Hinweis auf akute Situation_2.svg',
  'M.6_Akute Gefahr_Spotfeuer.svg',
] as const;

const DAMAGE_CARRIER_EVIDENCE = ['L.9_Deichbruch.svg', 'L.8_Schäden am Außendeich.svg'] as const;

const PERSON_FRAME_EVIDENCE = [
  '5.8.8.3_Person Verletzt.svg',
  '5.8.8.12_Person zu transportieren.svg',
  '5.8.8.9_Person in Wassergefahr.svg',
] as const;

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
      evidence: [
        ...fixtures(
          TACTICS_EXAMPLES,
          'Fläche 36 × 32 mm, Grundfläche x 4…36. Der Träger ist die auf 20 mm verkleinerte Raute von 5.8.8.3 „verletzt" (0,4-mm-Strich). Links daneben steht schwarz das halbgroße Fragezeichen aus 5.8.1.13 (Tinte y 9,6…20,5), in Beispiel 3 mit Achse x = 6,5 bei Raute um (21 | 16); in Beispiel 1 und 2 steht zusätzlich eine Anzahl „3", die Raute rückt auf (25 | 16).',
        ),
        ...fixtures(
          HINT_CARRIER_EVIDENCE,
          'An der Gefahr: Dreieck auf (7,5 | 25), (19 | 6), (30,5 | 25) verkleinert, rotes „?" mit Achse x = 5 bzw. „!" mit Achse x = 6 links daneben. M.6 zeigt „!" am unverkleinerten Dreieck bei x = 1,5.',
        ),
      ],
      remaining:
        'Belegt ist die Randlage nur für die Hinweise 5.8.1.13 und 5.8.1.14. Taktik 5.8.1.1 bis 5.8.1.4 und die Gefahrenhinweise 5.8.1.5 bis 5.8.1.12 zeigt kein Original an einem Träger. Dass der Träger in den Beispielen die Seite wechselt, liegt an der Anzahl „3", nicht am Wert.',
    },
    carriers: {
      status: 'evidenced',
      value: ['base-symbol/person', 'base-symbol/hazard'],
      evidence: [
        ...fixtures(
          TACTICS_EXAMPLES,
          'Träger ist eine weiß gefüllte, um 45° gedrehte 20-mm-Raute mit senkrechtem Strich: die Personenraute aus 1.2 mit dem Zustand 5.8.8.3.',
        ),
        ...fixtures(
          HINT_CARRIER_EVIDENCE,
          'Träger ist das weiß gefüllte rote Dreieck der Gefahr 1.11, in 5.8.1.13_2 und 5.8.1.14_2 auf 23 × 19 mm verkleinert.',
        ),
      ],
      remaining:
        'Die Gefahr ist nur für die Hinweise 5.8.1.13 und 5.8.1.14 belegt, alle übrigen Werte bleiben nach der Entscheidung vom 29.09.2026 an der Person (`stateCarriersOf`). Das Dreieck der Hinweise hat 0,5 mm Strich, der Körper von 1.11 1 mm mit Bevel-Ecken.',
    },
    perSign: {
      status: 'proposed',
      value: 1,
      reason:
        'Kein Original zeigt mehr als einen Hinweis an einem Zeichen, und keines zeigt eine Taktik an einem Träger. Beobachtet ist neben dem Hinweis höchstens ein Personenzustand (Beispiel 1 bis 3). Das ist eine Beobachtung in 661 Dateien, kein Verbot aus der Systematik; ob eine Taktik und mehrere Gefahrenhinweise zugleich zulässig sind, entscheidet der Eigentümer.',
    },
    rules: STATE_RULES,
    fixtures: [...TACTICS_EXAMPLES, ...HINT_CARRIER_EVIDENCE],
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
        'Keine der 661 Referenzdateien zeigt einen Aktivitätsgrad an einem Zeichen (Durchsicht vom 29.09.2026). Sitzt er in der Zustandsrandlage wie die Hinweise aus 5.8.1, und in welcher Größe — das eigene Quadrat misst 24 mm?',
    },
    carriers: {
      status: 'open',
      question: 'An welchen Grundzeichen darf ein Aktivitäts- oder Ausfallgrad stehen?',
    },
    perSign: decided(
      1,
      `${ONE_PER_SCALE} Die vier Werte sind Stufen einer Skala (bis 25, 50, 75 und 100 Prozent Ausfall).`,
    ),
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
    zone: decided(
      'tendency-margin',
      'Die Tendenz ist ein eigenes Spec-Feld `tendency` mit eigener Randlage, getrennt von `states`. Wo diese Randlage liegt, zeigt keine der 661 Referenzdateien; die Lage ist eine offene Frage an den Eigentümer.',
    ),
    carriers: {
      status: 'open',
      question:
        'An welchen Trägern darf eine Tendenz stehen — an Grundzeichen, an einem Zustand (etwa einem Aktivitätsgrad) oder an beidem? Kein Original zeigt eine; die Pfeile in M.9 und M.10 sind offene Winkelpfeile ohne Rahmen und keine Tendenz.',
    },
    perSign: decided(
      1,
      'Höchstens eine Tendenz je Zeichen: steigend, unverändert und fallend sind drei Werte derselben Richtung.',
    ),
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
      status: 'evidenced',
      value: 'body',
      evidence: fixtures(
        DAMAGE_CARRIER_EVIDENCE,
        'L.9 legt die Diagonalen von 5.8.4.2 unverändert (Umriss 4,156…27,844 mm) mittig über das Deichprofil; L.8 setzt das Kreuz von 5.8.4.1 auf 47 % verkleinert (8,84 mm, Strich weiter 0,5 mm) mittig auf die beschädigte Stelle der Böschungslinie bei (13,5 | 16).',
      ),
      remaining:
        'Belegt ist die Überlagerung nur am Deichprofil aus Anhang L, das kein Grundzeichen ist. An welchem Grundzeichen und in welcher Größe der Schadensgrad steht, zeigt kein Original.',
    },
    carriers: {
      status: 'open',
      question:
        'An welchen Grundzeichen darf ein Schadensgrad stehen? Die Überlagerung setzt einen Körper voraus, der die 26-mm-Diagonalen aufnimmt.',
    },
    perSign: decided(
      1,
      `${ONE_PER_SCALE} Angeschlagen, teilzerstört und total zerstört sind Stufen einer Skala.`,
    ),
    rules: STATE_RULES,
    fixtures: DAMAGE_CARRIER_EVIDENCE,
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
        'Keine der 661 Referenzdateien zeigt eine Brandphase an einem Zeichen. Die Flammen in Anhang M (M.4 bis M.10) sind eine eigene Figur (Seitenverhältnis 0,92 statt 0,85, Flammen 3,4 mm breit) und kein verkleinerter Wert aus 5.8.5. Sitzt die Brandphase in der Zustandsrandlage oder auf dem Körper? Die drei Flammen der Phase 3 füllen die ganze Breite der 32-mm-Fläche.',
    },
    carriers: {
      status: 'open',
      question: 'An welchen Grundzeichen darf eine Brandphase stehen?',
    },
    perSign: decided(
      1,
      `${ONE_PER_SCALE} Entstehungsbrand, fortentwickelter Brand und Vollbrand sind Stufen einer Skala.`,
    ),
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
          'core/src/geometry/pictograms/states/06-animals.ts:6–14',
          'Jede Darstellung zeichnet die Tiersilhouette mit; beim kontaminierten Tier rückt sie 5 mm nach unten, um dem Kontaminationszeichen Platz zu machen.',
        ),
      ],
    },
    zone: {
      status: 'evidenced',
      value: 'freestanding',
      evidence: [
        source(
          'core/src/geometry/pictograms/states/06-animals.ts:6–14',
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
        'Seit dem 29.09.2026 an den Dateien abgelesen: eine bis vier Flocken mit Radius 3 mm um y 26 in 8-mm-Teilung, mittig auf x 16; die Intensität (schwach, mittel, stark, extrem) ist ihre Anzahl (`WeatherIntensity`, `weatherDrawing`). Das Kennzahlenartefakt erfasst die Flocken nicht, ihre Lage prüft `core/src/geometry/weather.test.ts` an den abgelesenen Zahlen. Regen, Hagel und Gewitter an der Wolke sind übertragen, nicht abgelesen.',
    },
    carriers: {
      status: 'evidenced',
      value: ['state/weather-cloudy'],
      evidence: fixtures(
        WEATHER_EXAMPLES,
        'Träger des Niederschlags ist die Wolke aus 5.8.7.2: weiß gefüllt, gleich breit (x 1…31) und gleich hoch (18 mm).',
      ),
      remaining:
        'Belegt ist nur Schnee an der Wolke. Regen, Hagel und Gewitter gehen nach der Entscheidung vom 29.09.2026 ebenso an die Wolke, übertragen und nicht abgelesen (`WEATHER_CLOUD_PRECIPITATION` in `core/src/geometry/weather.ts`). Ob Wetter an einem Grundzeichen stehen darf, ist offen.',
    },
    perSign: {
      status: 'decided',
      value: 2,
      decision:
        'Höchstens die Wolke und ein Niederschlag (Regen, Hagel, Gewitter oder Schnee), dazu eine Intensität. Regen, Hagel und Gewitter werden wie der Schnee gebaut; das ist übertragen, nicht abgelesen.',
      decidedOn: '2026-09-29',
      by: 'owner',
      ref: 'docs/decisions/2026-09-28-lfh-565-kapitel-5-8-bausteine.md §10',
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
          'core/src/geometry/pictograms/states/08-persons.ts:10–17',
          'Grundform jeder Darstellung ist die Personenraute mit weißer Fläche.',
        ),
      ],
    },
    zone: {
      status: 'evidenced',
      value: 'body',
      evidence: [
        source(
          'core/src/geometry/pictograms/states/08-persons.ts:10–17',
          'Die Zustandsmarken liegen auf der Raute, der Verletzungsstrich etwa ist ihre senkrechte Diagonale.',
        ),
      ],
      remaining:
        'Vier Werte setzen Marken in die Ecken außerhalb der Raute: „B" (5.8.8.2), „TP" (5.8.8.5) und das Kontaminationszeichen bzw. „K" (5.8.8.6) oben rechts, die Sichtungskategorie (5.8.8.4) unten links. Das Zonenmodell führt sie seit dem 29.09.2026 als `corner-top-right` und `corner-bottom-left` der Zustandsrandlage an der Person.',
    },
    carriers: {
      status: 'evidenced',
      value: ['base-symbol/person'],
      evidence: fixtures(
        PERSON_FRAME_EVIDENCE,
        'Die Raute steht in drei Lagen: 26 mm um (16 | 16) mit der Hülle 3…29 wie `person/compact-person-diamond-26mm` (5.8.8.3), 26 mm um (16 | 14) bei den Transportzeichen (5.8.8.12, Füllpolygon (16 | 1) … (16 | 27), darunter der Pfeil) und 21 mm um (16 | 20,5) bei Wassergefahr (5.8.8.9, Hülle 5,5…26,5 × 10…31). Die Raute ersetzt den 30-mm-Körper des Grundzeichens 1.2.',
      ),
      remaining:
        'Die angehobene und die abgesenkte Lage sind keine `BodyVariantId`; `layout/state-placement.ts` führt sie als Fassungen des Zustands (`PERSON_STATE_FRAMES`). F.3.18 und F.3.19 zeigen 5.8.8.15 und 5.8.8.17 an einer auf 13 mm verkleinerten Raute im Kreis — die Marken wandern mit der Raute.',
    },
    perSign: {
      status: 'proposed',
      value: 1,
      reason:
        'Kein Original zeigt zwei Personenzustände an einer Raute. Die Verbindungen sind eigene Werte: 5.8.8.4, 5.8.8.5 und 5.8.8.6 zeichnen den Verletzungsstrich von 5.8.8.3 mit, „kontaminiert" ist also als „verletzt und kontaminiert" gezeichnet. Belegt ist neben einem Personenzustand nur ein Hinweis aus 5.8.1 (5.8.1_Beispiel 1 bis 3). Beobachtung, kein Verbot aus der Systematik.',
    },
    rules: STATE_RULES,
    fixtures: PERSON_FRAME_EVIDENCE,
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

const PERSON: readonly BlockId[] = Object.freeze(['base-symbol/person']);
const PERSON_OR_HAZARD: readonly BlockId[] = Object.freeze(['base-symbol/person', 'base-symbol/hazard']);

/**
 * Die Träger, an denen ein einzelner Wert stehen darf — der Inhalt der Regel
 * `state-carrier-not-allowed`, seit LFH-577 von `validateSpec` geprüft. Feiner als
 * `carriers` der Gruppe, weil 5.8.1 zwei Stände hat: die Hinweise 5.8.1.13 und 5.8.1.14 sind an
 * Person und Gefahr belegt, alle übrigen Werte der Gruppe bleiben nach der Entscheidung vom
 * 29.09.2026 an der Person, bis ein Original einen anderen Träger belegt.
 *
 * `undefined` heißt: für diesen Wert ist weder ein Träger belegt noch entschieden (5.8.2 bis 5.8.5,
 * 5.8.9 und die freistehenden Gruppen 5.8.6 und 5.8.7).
 */
export function stateCarriersOf(value: StateId): readonly BlockId[] | undefined {
  if (value === 'suspected-situation' || value === 'acute-situation') return PERSON_OR_HAZARD;
  const group = stateValueGroup(value);
  if (group === 'tactics-hazards' || group === 'persons') return PERSON;
  return undefined;
}

/**
 * Die Gruppe aus 5.8, zu der ein einzelner Wert gehört — über den Abschnitt seiner Zeichnung im
 * Register, wie `stateGroupOf`. `validateSpec` liest damit, ob ein Wert überhaupt in
 * `SymbolSpec.states` gehört und welche Skala er belegt (LFH-577). Wirft für einen Wert ohne
 * Registereintrag: das wäre ein Programmfehler, keine Eingabe.
 */
export function stateValueGroup(value: StateId): StateGroupId {
  const entry = [...STATE_BLOCKS, ...TENDENCY_BLOCKS].find((candidate) => candidate.valueId === value);
  if (entry === undefined) throw new Error(`Zustand ohne Registereintrag: ${value}`);
  const group = stateGroupOf(entry);
  if (group === undefined) throw new Error(`Zustand ohne Gruppe: ${value}`);
  return group.id;
}
