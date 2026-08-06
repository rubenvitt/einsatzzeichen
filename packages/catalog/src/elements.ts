import { ALL_PICTOGRAMS, pictogramVariantKey } from './pictograms/index.js';

/**
 * Die Arten von Einzelelementen. Die vier Piktogrammarten neben `capability` haben in D.0 noch
 * keine Einträge und kommen mit D.2 bis D.4 dazu — sie stehen hier, weil
 * `PICTOGRAM_ELEMENT_KINDS` sie für renderbare Elementarten ausweist.
 */
export type ElementKind =
  | 'organization'
  | 'strength'
  | 'capability'
  | 'state'
  | 'comms'
  | 'damage'
  | 'wildfire';

/**
 * Die Elementarten, die eine eigene Geometrie tragen und deshalb einen Dateisnapshot haben können.
 * Eine Organisationsfarbe ist ein `ColorToken`, ein Stärkegrad eine `HeadShape` — beides keine
 * Zeichnung, die sich rendern ließe. Die Menge hält die Elementarten als Katalogvertrag fest,
 * statt eine Liste konkreter IDs mit jedem Unter-Slice nachziehen zu müssen.
 */
export const PICTOGRAM_ELEMENT_KINDS: ReadonlySet<ElementKind> = new Set<ElementKind>([
  'capability',
  'state',
  'comms',
  'damage',
  'wildfire',
]);

/**
 * Ein Einzelelement, das keine eigene Zeichnung ist, aber eine an der Referenz belegte Regel
 * trägt: eine Organisationsfarbe, ein Stärkegrad, ein Piktogramm. Die drei Elementarten sind
 * strukturell unvergleichbar — eine Organisationsfarbe ist ein `ColorToken`, ein Stärkegrad eine
 * `HeadShape`, ein Piktogramm ein `Primitive[]`. Der Deskriptor gibt deshalb keine Geometrie
 * zurück, sondern genau das, was das Coverage-Gate braucht: Existenz, Art und Belegstelle.
 */
export interface ElementDescriptor {
  id: string;
  kind: ElementKind;
  title: string;
  /**
   * Alle Referenzdateien, an denen dieses Element belegt ist. Mindestens eine. Mehrwertig, weil
   * ein Stärkegrad an mehreren Dateien vermessen ist — ein Einzelwert wäre eine willkürliche
   * Auswahl aus gleichwertigen Belegen.
   */
  referenceAssets: readonly string[];
}

/**
 * Die statisch belegten Organisations- und Stärkeelemente. `hilfsorganisation` fehlt bewusst:
 * Kapitel 2 enthält dafür keine Datei, `organizationColor` wirft, und das Manifest behauptet
 * nichts, was der Katalog nicht kann.
 * (`2.2_Organisationen.svg` existiert, trägt aber einen generischen Namen, aus dem keine Zuordnung
 * folgt. Diese Zuordnung zu vermessen ist eine eigene Aufgabe.)
 *
 * Bei den Stärkegraden enthält `referenceAssets` mehr als die namensgebende Datei: die
 * `5.4.x`-Dateien sind eigenständige Anzeigedarstellungen mit r = 4 und selbst keine Kopfzonen;
 * die Kopfzonengeometrie ist an den `C.1.x`- und `D.3.7`/`E.1.18`-Dateien vermessen
 * (Entscheidungsnotiz vom 4. August 2026, Abschnitt 5, und die Konstanten in `strengths.ts`).
 * Die namensgebende Datei steht jeweils zuerst.
 */
const STATIC_ELEMENTS = {
  'organization.feuerwehr': {
    id: 'organization.feuerwehr',
    kind: 'organization',
    title: 'Feuerwehr',
    referenceAssets: ['2.1_Feuerwehr.svg'],
  },
  'organization.thw': {
    id: 'organization.thw',
    kind: 'organization',
    title: 'Technisches Hilfswerk',
    referenceAssets: ['2.3_Technisches Hilfswerk.svg'],
  },
  'organization.fuehrung-leitung': {
    id: 'organization.fuehrung-leitung',
    kind: 'organization',
    title: 'Führung Leitung',
    referenceAssets: ['2.4_Führung Leitung.svg'],
  },
  'organization.polizei': {
    id: 'organization.polizei',
    kind: 'organization',
    title: 'Polizei',
    referenceAssets: ['2.5_Polizei.svg'],
  },
  'organization.bundeswehr': {
    id: 'organization.bundeswehr',
    kind: 'organization',
    title: 'Bundeswehr',
    referenceAssets: ['2.6_Bundeswehr.svg'],
  },
  'organization.sonstige-gefahrenabwehr': {
    id: 'organization.sonstige-gefahrenabwehr',
    kind: 'organization',
    title: 'Sonstige Gefahrenabwehr',
    referenceAssets: ['2.7_Sonstige Gefahrenabwehr.svg'],
  },
  'organization.zivile-einheiten': {
    id: 'organization.zivile-einheiten',
    kind: 'organization',
    title: 'Zivile Einheiten',
    referenceAssets: ['2.8_Zivile Einheiten.svg'],
  },
  'strength.trupp': {
    id: 'strength.trupp',
    kind: 'strength',
    title: 'Trupp',
    referenceAssets: [
      '5.4.1_Trupp.svg',
      'C.1.7_CBRN-Erkundungstrupp.svg',
      'C.1.13_Flugdrohnentrupp Feuerwehr.svg',
      'C.1.14_Drohnentrupp Feuerwehr.svg',
    ],
  },
  'strength.staffel': {
    id: 'strength.staffel',
    kind: 'strength',
    title: 'Staffel',
    referenceAssets: [
      '5.4.2_Staffel.svg',
      'C.1.1_Löschstaffel.svg',
      // Zwei Leerzeichen im Dateinamen — so steht er im Referenzbestand, nicht normalisieren.
      'C.1.8_Staffel Dekontamination  von Personal.svg',
    ],
  },
  'strength.gruppe': {
    id: 'strength.gruppe',
    kind: 'strength',
    title: 'Gruppe',
    referenceAssets: [
      '5.4.3_Gruppe.svg',
      'C.1.2_Löschgruppe.svg',
      'C.1.9_ABC-Erkundungsgruppe einer Feuerwehr.svg',
    ],
  },
  'strength.zug': {
    id: 'strength.zug',
    kind: 'strength',
    title: 'Zug',
    referenceAssets: [
      '5.4.4_Zug.svg',
      'C.1.3_Löschzug einer Feuerwehr.svg',
      'C.1.11_Gefahrstoffzug.svg',
      'D.3.7_Zugführer der Feuerwehr.svg',
      'E.1.18_Fachzug Führung-Kommunikation.svg',
    ],
  },
} as const satisfies Record<string, ElementDescriptor>;

function pictogramElements(): Readonly<Record<string, ElementDescriptor>> {
  const byId = new Map<string, typeof ALL_PICTOGRAMS>();
  for (const definition of ALL_PICTOGRAMS) {
    const definitions = byId.get(definition.id) ?? [];
    byId.set(definition.id, [...definitions, definition]);
  }

  return Object.fromEntries(
    [...byId.entries()].map(([id, definitions]) => {
      const primary = definitions.filter((definition) => definition.variant === 'primary');
      if (primary.length !== 1) {
        throw new Error(
          `Piktogramm "${id}" benötigt genau eine primary-Darstellung (erhalten: ${primary.length}).`,
        );
      }

      const titles = new Set(definitions.map((definition) => definition.title));
      if (titles.size !== 1) {
        throw new Error(`Piktogramm "${id}" hat Varianten mit unterschiedlichen Titeln.`);
      }

      const ordered = [...definitions].sort((left, right) => {
        if (left.variant === 'primary') return -1;
        if (right.variant === 'primary') return 1;
        return pictogramVariantKey(left).localeCompare(pictogramVariantKey(right));
      });
      const [primaryDefinition] = primary;
      return [
        id,
        {
          id,
          kind: id.slice(0, id.indexOf('.')) as ElementKind,
          title: primaryDefinition.title,
          referenceAssets: ordered.map((definition) => definition.referenceAsset),
        },
      ];
    }),
  );
}

/**
 * Alle belegten Elemente. Piktogramm-Metadaten stammen ausschließlich aus ihren Definitionen;
 * dadurch können Titel, Referenzdateien und Varianten nicht vom renderbaren Katalog abweichen.
 */
export const ELEMENTS: Readonly<Record<string, ElementDescriptor>> = {
  ...STATIC_ELEMENTS,
  ...pictogramElements(),
};

/**
 * Blick auf `ELEMENTS` für die Suche über beliebige Zeichenketten — dasselbe Muster wie
 * `colorsByOrganization` in `organizations.ts`. Die abgeleiteten Piktogrammschlüssel machen
 * das öffentliche Register bewusst zu einem `Readonly<Record<string, ElementDescriptor>>`.
 */
const elementsById: Record<string, ElementDescriptor> = ELEMENTS;

/**
 * Löst eine Element-ID auf und wirft bei unbekannter ID — dasselbe Muster wie `fingerprintFor`
 * und `organizationColor`. Erst damit ist ein Manifest-Eintrag mehr als eine Behauptung.
 */
export function resolveElement(id: string): ElementDescriptor {
  const descriptor = elementsById[id];
  if (descriptor === undefined) {
    throw new Error(`Kein bekanntes Element "${id}" im Katalog.`);
  }
  return descriptor;
}
