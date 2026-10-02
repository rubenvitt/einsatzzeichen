import type {
  GrammarEvidence,
  SourceReference,
  SpecialForm,
  SpecialFormId,
  ZoneBinding,
  ZoneBoundsMm,
  ZoneGapScope,
  ZoneId,
  ZoneMeasure,
} from '@einsatzzeichen/schema';
import { ZONE_IDS } from './zones.js';

/**
 * Die Sonderformen aus Kapitel 3, Abschnitte 3.6 bis 3.9, im Zonenmodell (LFH-567, vermessen in
 * LFH-577 am 29.09.2026).
 *
 * **Neben den Körperformen, nicht unter ihnen.** Jede Sonderform trägt dieselbe Zonenstruktur wie
 * ein Eintrag aus `ZONE_MODEL` — alle 16 Zonen, jede mit Maß oder mit begründeter Lücke. Sie ist aber
 * keine `SymbolKind` und damit für `compose()` unerreichbar. Warum das so bleibt, steht in
 * `schema/src/special-forms.ts`.
 *
 * **Was belegt ist.** Die Zeichnungen stehen in `geometry/special-form-bodies.ts`, an den
 * Referenzdateien abgelesen; dort steht je Form Datei und Zahl. Hier stehen die Hüllen der
 * Körperzone. Wo das Kennzahlenartefakt (`conformance/src/fingerprints.json`) dieselbe Hülle führt
 * — 3.6 und 3.9 —, hält `conformance/src/special-form-fixtures.test.ts` sie dagegen:
 *
 * - 3.6 Drohne: ein schwarz gefülltes Sechseck mit der Hülle 4/10/28/22 mm.
 * - 3.7 und 3.8 Zweirad: Halbbogen r 6 um (16|10) mit einem bzw. zwei Stielen bis y 28, 0,5-mm-Strich.
 *   Das Artefakt erfasst Kurvenpfade nicht; die Zahlen stehen nur in der Zeichnung.
 * - 3.9: ein schwarzer Giebel (2|14) → (16|2) → (30|14) über einem grauen, gestrichelten
 *   Platzhalterkreis r 10 um (16|20). Die Hülle 1,837/1,671/30,162/14,19 des Artefakts ist die
 *   Tintenhülle des Giebels, **nicht** eine graue Fläche (so las es die Vorlage vom 28.09.).
 * - **Keine der vier Dateien führt die Ebene `Flächige_Fülung`.** Das Innenfeld ist deshalb
 *   gemessen leer.
 *
 * Alle übrigen Zonen bleiben Lücken mit `scope: 'value'`: keine der 661 Referenzdateien setzt eine
 * Sonderform als Körper mit Kopf, Fuß oder Beschriftung ein.
 */

const SURVEY = 'docs/decisions/2026-09-28-lfh-567-mehrfachfaehigkeiten-und-sonderformen.md';
const BODIES_AT = 'core/src/geometry/special-form-bodies.ts';
const FINGERPRINTS = 'conformance/src/fingerprints.json';

function babz(...sections: readonly string[]): readonly SourceReference[] {
  return sections.map((section) => ({ source: 'babz-svg-2025' as const, section, status: 'derived' as const }));
}

function gap(scope: ZoneGapScope, reason: string): ZoneBinding {
  return { status: 'not-measured', gap: { scope, definedAt: SURVEY, reason } };
}

function asset(file: `${string}.svg`, note: string): GrammarEvidence {
  return { asset: file, note };
}

function bounds(
  id: string,
  boundsMm: ZoneBoundsMm,
  definedAt: string,
  note: string,
  section: string,
): ZoneMeasure {
  return { kind: 'bounds', id, boundsMm, provenance: { definedAt, note, sourceRefs: babz(section) } };
}

/**
 * Das Innenfeld: nachgesehen und nicht vorhanden. Ein Innenfeld setzt eine Fläche mit weißer
 * Innenkontur voraus; ohne Füllebene hat die Form keine.
 */
function innerFieldAbsent(what: string): ZoneBinding {
  return {
    status: 'measured-absent',
    gap: {
      scope: 'value',
      definedAt: SURVEY,
      reason:
        `${what} Die Referenzdatei führt keine Ebene \`Flächige_Fülung\`; ohne Fläche gibt es ` +
        'keine weiße Innenkontur und damit kein Innenfeld.',
    },
  };
}

/**
 * Die Lückenbegründung jeder übrigen Zone. `scope: 'value'`: an keiner Kombination mit dieser
 * Sonderform ist etwas vermessen, und eine andere Grundzeichenart hilft nicht — sie liefert Zahlen
 * für ihren eigenen Körper, nicht für diesen.
 */
function unmeasuredZone(what: string): ZoneBinding {
  return gap(
    'value',
    `${what} Die Kapiteldatei zeigt die Form allein, und keine der 661 Referenzdateien setzt sie ` +
      'als Körper mit dieser Zone ein. Maße einer verwandten Körperform werden nicht übertragen.',
  );
}

function zonesWith(body: ZoneBinding, what: string): Readonly<Record<ZoneId, ZoneBinding>> {
  const rest = unmeasuredZone(what);
  const innerField = innerFieldAbsent(what);
  return Object.freeze(
    Object.fromEntries(
      ZONE_IDS.map((zone) => [zone, zone === 'body' ? body : zone === 'inner-field' ? innerField : rest]),
    ) as Record<ZoneId, ZoneBinding>,
  );
}

const DRONE_NOTE =
  'Die Drohne erscheint außer in 3.6 nur als Innenzeichen in einem anderen Körper (C.1.13, C.1.14, ' +
  'F.1.16, I.1.20, C.2.31), jedes Mal in eigenem Maß.';
const TWO_WHEELER_NOTE =
  'Das Zweirad kommt außer in 3.7 und 3.8 in keiner der 661 Referenzdateien vor.';
const STRUCTURE_NOTE =
  'Der Giebel ist eine Marke über einem Grundzeichen; die Zonen stellt der Träger. Am 12-mm-Kreis ' +
  'sind sie in `ZONE_MODEL` unter `circle-12`/`raised-gable` geführt.';

/** Die Zweiräder: Halbbogen und Stiel(e), Mittellinien- und Tintenhülle. */
function wheelBody(section: '3.7' | '3.8', stems: string): ZoneBinding {
  const at = `${BODIES_AT}:83–102`;
  return {
    status: 'measured',
    measures: [
      bounds(
        'centerline-hull',
        { minX: 10, minY: 4, maxX: 22, maxY: 28 },
        at,
        `Maße an der Referenz abgelesen: oberer Halbbogen um (16|10), Mittellinie r 6, ${stems} bis y 28.`,
        section,
      ),
      bounds(
        'ink-hull',
        { minX: 9.75, minY: 3.75, maxX: 22.25, maxY: 28 },
        at,
        'Tintenhülle der Referenz bei 0,5-mm-Strich: Bogen außen r 6,25, Bogenenden und Stielende ' +
          'stumpf. Das Kennzahlenartefakt erfasst den Kurvenpfad nicht (`shapes: []`).',
        section,
      ),
    ],
  };
}

const TWO_WHEELER_ROLE_QUESTION =
  'Die Datei zeigt eine vollständige Form ohne Füllebene und ohne Platzhalter, wie ein Grundzeichen; ' +
  'kein Original verwendet sie. Ist das Zweirad eine eigene Körperform (dann mit welchen Zonen), ' +
  'eine Marke — etwa an Stelle des Fahrwerks am Landfahrzeug — oder ein freistehendes Zeichen?';

export const SPECIAL_FORMS: readonly SpecialForm[] = Object.freeze([
  {
    id: 'drone',
    section: '3.6',
    title: 'Grundzeichen Drohne',
    asset: '3.6_Grundzeichen Drohne.svg',
    role: {
      status: 'evidenced',
      value: 'mark',
      evidence: [
        asset('C.1.13_Flugdrohnentrupp Feuerwehr.svg', 'Winkel 18 mm breit, Endstärke 1,5 mm, im Formationskörper.'),
        asset('C.1.14_Drohnentrupp Feuerwehr.svg', 'Winkel 18 mm breit, Endstärke 1,5 mm, im Formationskörper, andere Steigungen als C.1.13.'),
        asset('F.1.16_Drohnentrupp.svg', 'Winkel 16 mm breit, Endstärke 1,5 mm, über zwei Dreiecken im Formationskörper.'),
        asset('I.1.20_Trupp Drohne.svg', 'Winkel 10,67 mm breit, Endstärke 1 mm, in der oberen Formationszone.'),
        asset('C.2.31_geschützte Löschdrohne.svg', 'Winkel 14 mm breit, Endstärke 1,2 mm, im Fahrzeugkörper.'),
      ],
      remaining:
        'Die Kapiteldatei heißt „Grundzeichen Drohne" und zeigt den Winkel allein, 24 mm breit mit ' +
        'Endstärke 3 mm. Keine der fünf Verwendungen ist eine Verkleinerung davon, die Marke hat also ' +
        'kein einheitliches Maß. Ob 3.6 zusätzlich allein stehen darf (als freistehendes Zeichen), ' +
        'entscheidet der Eigentümer.',
    },
    relatedKind: {
      status: 'proposed',
      value: 'vehicle-air',
      reason:
        'Die Drohne ist ein unbemanntes Luftfahrzeug. Ihre Hülle (24 × 12 mm) ist aber kleiner als die von 1.4 Luftfahrzeug (30 × 15 mm); eine Variante mit übertragbaren Maßen ist sie nicht.',
    },
    zones: zonesWith(
      {
        status: 'measured',
        measures: [
          bounds(
            'reference-hull',
            { minX: 4, minY: 10, maxX: 28, maxY: 22 },
            `${BODIES_AT}:37–57`,
            'Maße an der Referenz abgelesen: schwarz gefülltes Sechseck, Enden x 4 und 28 bei y 10…13, ' +
              'Scheitel außen (16|22), innen (16|17,273). Dieselbe Hülle führt das Kennzahlenartefakt.',
            '3.6',
          ),
        ],
      },
      DRONE_NOTE,
    ),
  },
  {
    id: 'two-wheeler',
    section: '3.7',
    title: 'Zweirad',
    asset: '3.7_Zweirad.svg',
    role: { status: 'open', question: TWO_WHEELER_ROLE_QUESTION },
    relatedKind: {
      status: 'proposed',
      value: 'vehicle-land',
      reason: 'Ein Zweirad ist ein Landfahrzeug. Welche Fassung des Landfahrzeugs es berührt, belegt die Datei nicht.',
    },
    zones: zonesWith(wheelBody('3.7', 'ein Stiel auf x 16'), TWO_WHEELER_NOTE),
  },
  {
    id: 'motorized-two-wheeler',
    section: '3.8',
    title: 'Zweirad motorgetrieben',
    asset: '3.8_Zweirad motorgetrieben.svg',
    role: {
      status: 'open',
      question:
        `${TWO_WHEELER_ROLE_QUESTION} 3.8 unterscheidet sich von 3.7 nur durch den doppelten Stiel ` +
        '(x 15 und 17 statt x 16): eine Variante desselben Zeichens oder ein eigenes?',
    },
    relatedKind: {
      status: 'proposed',
      value: 'vehicle-land',
      reason: 'Wie 3.7: ein Landfahrzeug, ohne Beleg einer Fassung.',
    },
    zones: zonesWith(wheelBody('3.8', 'zwei Stiele auf x 15 und 17'), TWO_WHEELER_NOTE),
  },
  {
    id: 'temporary-fixed-structure',
    section: '3.9',
    title: 'temporär ortsfeste Strukturen',
    asset: '3.9_temporär ortsfeste Strukturen.svg',
    role: {
      status: 'evidenced',
      value: 'mark',
      evidence: [
        asset(
          '3.9_temporär ortsfeste Strukturen.svg',
          'Unter dem Giebel steht ein grau gestrichelter Platzhalterkreis, die Konvention von Kapitel 3 für ein beliebiges Grundzeichen (dieselbe wie in 3.1).',
        ),
        asset('F.3.5_Behandlungsplatz 50_ortsgebunden.svg', 'Derselbe Giebel, 0,5-mm-Strich, über dem abgesenkten 12-mm-Kreis.'),
        asset('F.3.14_Betreuungsplatz_ortsgebunden.svg', 'Wie F.3.5.'),
        asset('I.4.1_Wasserrettungsstation_ortsgebunden.svg', 'Wie F.3.5.'),
        asset('D.2.5_Leitstelle.svg', 'Wie F.3.5.'),
        asset('D.2.7_Hubschrauberlandeplatz.svg', 'Wie F.3.5.'),
        asset('J.3.2_Basisstation.svg', 'Wie F.3.5; die mobile Basisstation J.3.3 trägt keinen Giebel.'),
      ],
      remaining:
        'Am Körper liegt der Giebel auf (3|11) → (16|1) → (29|11), in der Kapiteldatei auf (2|14) → ' +
        '(16|2) → (30|14); F.1.21 führt ihn ein drittes Mal kleiner im Ring. Die Lage folgt also dem ' +
        'Träger, nicht der Kapiteldatei. Leitstelle und Basisstation sind dauerhaft ortsfest: die ' +
        'Originale belegen „ortsfest", nicht „temporär". Ob die Zeitdauer im Zeichen unterschieden ' +
        'wird, entscheidet der Eigentümer.',
    },
    relatedKind: {
      status: 'evidenced',
      value: 'circle-12',
      evidence: [
        {
          definedAt: 'core/src/geometry/base-symbols.ts:658–666',
          note: 'Die Variante `raised-gable` des 12-mm-Kreises ist dieser Giebel am Körper, vermessen an F.3.5/F.3.14/I.4.1.',
        },
      ],
      remaining:
        'Die Scoping-Notiz zur Legacy-Migration führt das alte Zeichen 1.19 „ortsgebunden, ortsfest" auf 1.7 Gebäude und 3.9 zurück. Ein Giebel über einem anderen Träger als dem 12-mm-Kreis ist nicht belegt.',
    },
    zones: zonesWith(
      {
        status: 'measured',
        measures: [
          bounds(
            'roof-centerline',
            { minX: 2, minY: 2, maxX: 30, maxY: 14 },
            `${BODIES_AT}:137–159`,
            'Maße an der Referenz abgelesen: Giebel (2|14) → (16|2) → (30|14), 0,5-mm-Strich mit Gehrung.',
            '3.9',
          ),
          bounds(
            'ink-hull',
            { minX: 1.837, minY: 1.671, maxX: 30.162, maxY: 14.19 },
            FINGERPRINTS,
            'Die Hülle des Kennzahlenartefakts. Sie ist die Tintenhülle des Giebels (Enden ' +
              '1,837|13,81 und 2,163|14,19, Scheitel außen 1,671), nicht eine graue Fläche.',
            '3.9',
          ),
          bounds(
            'carrier-placeholder',
            { minX: 6, minY: 10, maxX: 26, maxY: 30 },
            `${BODIES_AT}:137–159`,
            'Der graue Platzhalter (`#bebebe`): Kreis um (16|20), Mittellinie r 10, 0,4-mm-Strich, ' +
              '28 Striche zu 1,5 mm. Er steht für den Träger und wird nicht gezeichnet.',
            '3.9',
          ),
        ],
      },
      STRUCTURE_NOTE,
    ),
  },
] satisfies readonly SpecialForm[]);

/** Nachschlag je Sonderform. */
export function specialForm(id: SpecialFormId): SpecialForm {
  const found = SPECIAL_FORMS.find((candidate) => candidate.id === id);
  if (found === undefined) throw new Error(`Keine Sonderform "${id}"`);
  return found;
}
