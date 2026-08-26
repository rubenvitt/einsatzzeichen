import { ALL_PICTOGRAMS, pictogramVariantKey } from './pictograms/index.js';
import { deepFreeze, type DeepReadonly } from './readonly-data.js';

/**
 * Die Arten von Einzelelementen. Die vier Piktogrammarten neben `capability` haben in D.0 noch
 * keine Einträge und kommen mit D.2 bis D.4 dazu — sie stehen hier, weil
 * `PICTOGRAM_ELEMENT_KINDS` sie für renderbare Elementarten ausweist.
 */
export type ElementKind =
  | 'organization'
  | 'strength'
  | 'vehicle-category'
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
  readonly id: string;
  readonly kind: ElementKind;
  readonly title: string;
  /**
   * Alle Referenzdateien, an denen dieses Element belegt ist. Mindestens eine. Mehrwertig, weil
   * ein Stärkegrad an mehreren Dateien vermessen ist — ein Einzelwert wäre eine willkürliche
   * Auswahl aus gleichwertigen Belegen.
   */
  readonly referenceAssets: readonly string[];
}

/**
 * Die statisch belegten Organisations- und Stärkeelemente. Seit LFH-424 führt Kapitel 2 hier alle
 * **acht** dortigen Organisationen: `2.2_Organisationen.svg` trägt entgegen seinem generischen Namen den
 * Fleck der Hilfsorganisationen (vollflächig `#ffffff` wie 2.1 und 2.3 bis 2.8, Typo-Ebene liest
 * gerastert „HiOrg"). Die frühere Annahme, aus dem Namen folge keine Zuordnung, ist damit
 * widerlegt — nachgezählt: genau acht Dateien des Kapitels tragen Fleck **und** Typo-Ebene.
 * Anhang N.1.3 ergänzt als neunte Organisation die Bundespolizei mit hellgrünem Fleck.
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
  'organization.bundespolizei': {
    id: 'organization.bundespolizei',
    kind: 'organization',
    title: 'Bundespolizei',
    referenceAssets: ['N.1.3_Einsatzfahrzeug_Bundespolizei.svg'],
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
  'organization.hilfsorganisation': {
    id: 'organization.hilfsorganisation',
    kind: 'organization',
    title: 'Hilfsorganisation',
    referenceAssets: ['2.2_Organisationen.svg'],
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
  // Fahrzeugkategorien nach Kapitel 5.1.1. `referenceAssets` führt die namensgebende Datei zuerst
  // und danach die Zeichen aus Anhang E.2, an denen dieselbe Zone unabhängig vermessen ist —
  // dieselbe Begründung wie bei den Stärkegraden. Genannt sind je Kategorie die ersten beiden
  // E.2-Träger in Abschnittsreihenfolge; die vollständige Zuordnung aller 21 E.2-Zeichen mit
  // Fahrzeugkategorie (und der vier Anhänger ohne ID)
  // steht in `docs/decisions/2026-08-18-grundlagen-restpunkte.md`.
  //
  // `amphibienfahrzeug` steht **nicht** hier: seine Wellenlinie ist nur als Strichhülle vermessen,
  // `vehicleChassis` wirft dafür. Ein Elementeintrag behauptete eine Umsetzung, die es nicht gibt.
  'vehicle-category.kfz-kategorie-1': {
    id: 'vehicle-category.kfz-kategorie-1',
    kind: 'vehicle-category',
    title: 'Kraftfahrzeug Kategorie 1 (straßenfähig)',
    referenceAssets: [
      '5.1.1.1_Kfz_Kategorie 1.svg',
      'E.2.1_Personenkraftwagen_straßenfähig.svg',
      'E.2.2_Mannschaftstransportwagen_straßenfähig.svg',
    ],
  },
  'vehicle-category.kfz-kategorie-2': {
    id: 'vehicle-category.kfz-kategorie-2',
    kind: 'vehicle-category',
    title: 'Kraftfahrzeug Kategorie 2 (geländefähig)',
    referenceAssets: [
      '5.1.1.2_Kfz_Kategorie 2.svg',
      'E.2.3_Gerätekraftwagen_geländefähig.svg',
      'E.2.10_Bergungsräumgerät Bagger_Radantrieb.svg',
    ],
  },
  'vehicle-category.kfz-kategorie-3': {
    id: 'vehicle-category.kfz-kategorie-3',
    kind: 'vehicle-category',
    title: 'Kraftfahrzeug Kategorie 3 (geländegängig)',
    referenceAssets: [
      '5.1.1.3_Kfz_Kategorie 3.svg',
      'E.2.4_All Terrain Vehicle_geländegängig.svg',
      'E.2.7_Teleskopstapler_geländegängig.svg',
    ],
  },
  'vehicle-category.kettenfahrzeug': {
    id: 'vehicle-category.kettenfahrzeug',
    kind: 'vehicle-category',
    title: 'Kettenfahrzeug',
    referenceAssets: [
      '5.1.1.5_Kettenfahrzeug.svg',
      'E.2.9_Bergungsräumgerät Bagger_Kettenantrieb.svg',
    ],
  },
  // Der einzige Eintrag mit **einer** Belegstelle, und das ist die wahre Aussage: kein Zeichen des
  // Bestands außerhalb von 5.1.1.6 stellt ein Schienenfahrzeug dar.
  // `5.1.1.7_Kraftfahrzeug_aufgleisbar.svg` zeigt dieselben vier Radplätze plus einen fünften bei
  // cx 16 und bestätigt sie damit; es steht trotzdem **nicht** hier, weil `referenceAssets` liest
  // wie „diese Datei stellt dieses Element dar" und ein aufgleisbares Kraftfahrzeug kein
  // Schienenfahrzeug ist. Die Gegenmessung steht in
  // `docs/decisions/2026-08-18-grundlagen-restpunkte.md`, Abschnitt 1.2.
  'vehicle-category.schienenfahrzeug': {
    id: 'vehicle-category.schienenfahrzeug',
    kind: 'vehicle-category',
    title: 'Schienenfahrzeug',
    referenceAssets: ['5.1.1.6_Schienenfahrzeug.svg'],
  },
  // Die beiden Anhängerfahrwerke. **Titel und ID nennen die Räder, nicht das Zugfahrzeug** — die
  // Quelle nennt `5.1.2.4` „von PKW gezogen" und `5.1.2.5` „von LKW gezogen", und beides ist an
  // den E.2-Trägern widerlegt: `E.2.22` („Grundzeichen") und `E.2.23` („von LKW gezogen") tragen
  // beide die Ein-Rad-Form, und `5.1.2.1_Anhänger_allgemein.svg` trägt gar kein Rad (alle drei
  // selbst nachgemessen). Die Begründung steht ausführlich an `VehicleCategoryId`.
  'vehicle-category.anhaenger-ein-rad': {
    id: 'vehicle-category.anhaenger-ein-rad',
    kind: 'vehicle-category',
    title: 'Anhänger mit einem Rad',
    referenceAssets: [
      '5.1.2.4_Anhänger_von PKW gezogen.svg',
      'E.2.22_Anhänger Grundzeichen.svg',
      'E.2.23_Anhänger Netzersatzanlage_von LKW gezogen.svg',
    ],
  },
  'vehicle-category.anhaenger-zwei-raeder': {
    id: 'vehicle-category.anhaenger-zwei-raeder',
    kind: 'vehicle-category',
    title: 'Anhänger mit zwei Rädern',
    referenceAssets: [
      '5.1.2.5_Anhänger_von LKW gezogen.svg',
      'E.2.24_Anhänger Führung und Lage_von LKW gezogen.svg',
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
        const leftIsPrimary = left.variant === 'primary';
        const rightIsPrimary = right.variant === 'primary';
        if (leftIsPrimary !== rightIsPrimary) return leftIsPrimary ? -1 : 1;
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
export const ELEMENTS: DeepReadonly<Record<string, ElementDescriptor>> = deepFreeze({
  ...STATIC_ELEMENTS,
  ...pictogramElements(),
});

/**
 * Blick auf `ELEMENTS` für die Suche über beliebige Zeichenketten — dasselbe Muster wie
 * `colorsByOrganization` in `organizations.ts`. Die abgeleiteten Piktogrammschlüssel machen
 * das öffentliche Register bewusst zu einem `Readonly<Record<string, ElementDescriptor>>`.
 */
const elementsById: DeepReadonly<Record<string, ElementDescriptor>> = ELEMENTS;

/**
 * Löst eine Element-ID auf und wirft bei unbekannter ID — dasselbe Muster wie `fingerprintFor`
 * und `organizationColor`. Erst damit ist ein Manifest-Eintrag mehr als eine Behauptung.
 */
export function resolveElement(id: string): DeepReadonly<ElementDescriptor> {
  const descriptor = elementsById[id];
  if (descriptor === undefined) {
    throw new Error(`Kein bekanntes Element "${id}" im Katalog.`);
  }
  return descriptor;
}
