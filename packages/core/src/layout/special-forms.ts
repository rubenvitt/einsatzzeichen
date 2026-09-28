import type {
  GrammarEvidence,
  SourceReference,
  SpecialForm,
  SpecialFormId,
  ZoneBinding,
  ZoneGapScope,
  ZoneId,
} from '@einsatzzeichen/schema';
import { ZONE_IDS } from './zones.js';

/**
 * Die Sonderformen aus Kapitel 3, Abschnitte 3.6 bis 3.9, im Zonenmodell (LFH-567).
 *
 * **Neben den Körperformen, nicht unter ihnen.** Jede Sonderform trägt dieselbe Zonenstruktur wie
 * ein Eintrag aus `ZONE_MODEL` — alle 16 Zonen, jede mit Maß oder mit begründeter Lücke. Sie ist aber
 * keine `SymbolKind` und damit für `compose()` unerreichbar: keine der vier Formen ist gezeichnet,
 * und ohne Zeichnung gäbe es nichts, wogegen die Zonen rechnen könnten. Warum das so bleibt, bis
 * der Eigentümer entscheidet, steht in `schema/src/special-forms.ts`.
 *
 * **Was belegt ist**, steht im Kennzahlenartefakt (`conformance/src/fingerprints.json`), denn die
 * Referenzdateien sind nicht eingecheckt. Die Zahlen hält
 * `conformance/src/special-form-fixtures.test.ts` gegen das Artefakt fest:
 *
 * - 3.6 Drohne: eine Hülle 4/10/28/22 mm, keine Form. Die Datei heißt „Grundzeichen Drohne".
 * - 3.7 und 3.8 Zweirad: ein einziger Kurvenpfad, keine vermessbare Form, keine Hülle.
 * - 3.9 temporär ortsfeste Strukturen: eine graue Fläche mit der Hülle 1,837/1,671/30,162/14,19 mm
 *   über der oberen Hälfte der Zeichenfläche.
 * - **Keine der vier Dateien führt die Ebene `Flächige_Fülung`.** Zwölf der vierzehn Grundzeichen
 *   aus Kapitel 1 tragen sie; ohne sie sind nur die beiden ungefüllten Strichzeichen 1.13 Ereignis
 *   und 1.14 Spontanhelfer. Eine Sonderform hätte damit, wie diese beiden, keine Fläche für die
 *   Organisationsfarbe.
 *
 * Diese Befunde stehen schon in `docs/decisions/2026-08-05-vermessung-kapitel-1-und-verwaltungsstufen.md`
 * (Abschnitt „Kapitel 3 ebenso"). Hier bekommen sie ihren Ort im Zonenmodell.
 */

const CHAPTER_3_SURVEY = 'docs/decisions/2026-08-05-vermessung-kapitel-1-und-verwaltungsstufen.md';
const FINGERPRINTS = 'conformance/src/fingerprints.json';

function babz(section: string): readonly SourceReference[] {
  return [{ source: 'babz-svg-2025', section, status: 'derived' }];
}

function gap(scope: ZoneGapScope, reason: string): ZoneBinding {
  return { status: 'not-measured', gap: { scope, definedAt: CHAPTER_3_SURVEY, reason } };
}

function asset(file: `${string}.svg`, note: string): GrammarEvidence {
  return { asset: file, note };
}

/**
 * Die Lückenbegründung jeder Zone ohne eigenen Befund. `scope: 'value'`: an keiner Kombination mit
 * dieser Sonderform ist etwas vermessen, und eine andere Grundzeichenart hilft nicht — sie liefert
 * Zahlen für ihren eigenen Körper, nicht für diesen.
 */
function unmeasuredZone(what: string): ZoneBinding {
  return gap(
    'value',
    `${what} Ohne Zeichnung der Sonderform hat keine Zone einen Bezugsrahmen. Maße einer ` +
      'verwandten Körperform werden nicht übertragen.',
  );
}

function zonesWith(
  body: ZoneBinding,
  what: string,
): Readonly<Record<ZoneId, ZoneBinding>> {
  const rest = unmeasuredZone(what);
  return Object.freeze(
    Object.fromEntries(ZONE_IDS.map((zone) => [zone, zone === 'body' ? body : rest])) as Record<
      ZoneId,
      ZoneBinding
    >,
  );
}

const DRONE_NOTE =
  'Die Referenz führt die Drohne als Hülle 4/10/28/22 mm ohne vermessbare Form (1 von 661 Dateien).';
const TWO_WHEELER_NOTE =
  'Die Referenz führt das Zweirad als einen einzigen Kurvenpfad ohne vermessbare Form und ohne Hülle im Kennzahlenartefakt.';
const STRUCTURE_NOTE =
  'Die Referenz führt die Struktur als graue Fläche mit der Hülle 1,837/1,671/30,162/14,19 mm, ohne glatte Entwurfsmaße.';

const TWO_WHEELER_ROLE_QUESTION =
  'Die Datei trägt nur einen Kurvenpfad und keine Füllebene. Ist das Zweirad eine eigene Körperform, oder eine Marke — etwa an Stelle des Fahrwerks am Landfahrzeug?';

export const SPECIAL_FORMS: readonly SpecialForm[] = Object.freeze([
  {
    id: 'drone',
    section: '3.6',
    title: 'Grundzeichen Drohne',
    asset: '3.6_Grundzeichen Drohne.svg',
    role: {
      status: 'evidenced',
      value: 'body-form',
      evidence: [
        asset(
          '3.6_Grundzeichen Drohne.svg',
          'Die Systematik nennt die Datei „Grundzeichen Drohne", wie die Grundzeichen aus Kapitel 1.',
        ),
      ],
      remaining:
        'Die Datei führt keine Füllebene. Das teilt sie mit den Strichzeichen 1.13 Ereignis und 1.14 Spontanhelfer: ein Körper ohne Fläche für die Organisationsfarbe. Außerdem setzt F.1.16 eine gefüllte Drohnenmarke in den Formationskörper (`ANHANG_F_B_FINDINGS`). Ob die Drohne zugleich Grundzeichen und Marke ist, ist offen.',
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
          {
            kind: 'bounds',
            id: 'reference-hull',
            boundsMm: { minX: 4, minY: 10, maxX: 28, maxY: 22 },
            provenance: {
              definedAt: FINGERPRINTS,
              note:
                `${DRONE_NOTE} Ob die Zahlen Mittellinie oder Tintenkante sind, sagt das Artefakt ` +
                'nicht; glatte Millimeter sprechen für die Mittellinie.',
              sourceRefs: babz('3.6'),
            },
          },
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
    zones: zonesWith(unmeasuredZone(TWO_WHEELER_NOTE), TWO_WHEELER_NOTE),
  },
  {
    id: 'motorized-two-wheeler',
    section: '3.8',
    title: 'Zweirad motorgetrieben',
    asset: '3.8_Zweirad motorgetrieben.svg',
    role: {
      status: 'open',
      question: `${TWO_WHEELER_ROLE_QUESTION} Und unterscheidet sich 3.8 von 3.7 als eigene Form oder als Zusatz am Zweirad?`,
    },
    relatedKind: {
      status: 'proposed',
      value: 'vehicle-land',
      reason: 'Wie 3.7: ein Landfahrzeug, ohne Beleg einer Fassung.',
    },
    zones: zonesWith(unmeasuredZone(TWO_WHEELER_NOTE), TWO_WHEELER_NOTE),
  },
  {
    id: 'temporary-fixed-structure',
    section: '3.9',
    title: 'temporär ortsfeste Strukturen',
    asset: '3.9_temporär ortsfeste Strukturen.svg',
    role: {
      status: 'open',
      question:
        'Die graue Fläche liegt über der oberen Hälfte der Zeichenfläche (y 1,671…14,19 mm) und reicht damit über die Oberkante jedes Rechteckkörpers hinaus. Ist 3.9 eine eigene Körperform, oder eine Marke, die über einem Grundzeichen steht — wie die Giebelmarke des ortsfesten Standorts in Anhang J?',
    },
    relatedKind: {
      status: 'proposed',
      value: 'building',
      reason:
        'Die Scoping-Notiz zur Legacy-Migration führt das alte Zeichen 1.19 „ortsgebunden, ortsfest" auf 1.7 Gebäude und 3.9 zurück: die Dauer der Ortsbindung ist neu unterschieden.',
    },
    zones: zonesWith(unmeasuredZone(STRUCTURE_NOTE), STRUCTURE_NOTE),
  },
] satisfies readonly SpecialForm[]);

/** Nachschlag je Sonderform. */
export function specialForm(id: SpecialFormId): SpecialForm {
  const found = SPECIAL_FORMS.find((candidate) => candidate.id === id);
  if (found === undefined) throw new Error(`Keine Sonderform "${id}"`);
  return found;
}
