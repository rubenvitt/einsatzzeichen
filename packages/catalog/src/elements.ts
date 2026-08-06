/**
 * Die Arten von Einzelelementen. Die vier Piktogrammarten neben `capability` haben in D.0 noch
 * keine Einträge und kommen mit D.2 bis D.4 dazu — sie stehen hier, weil `PICTOGRAM_ELEMENT_KINDS`
 * sie liest und das Manifest daraus den Snapshot-Nachweis ableitet.
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
 * Zeichnung, die sich rendern ließe. Das Manifest leitet die passende `testEvidence` daraus ab,
 * statt eine Liste von IDs zu führen, die mit jedem Unter-Slice nachgezogen werden müsste.
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
 * Die dreizehn belegten Elemente. `hilfsorganisation` fehlt bewusst: Kapitel 2 enthält dafür keine
 * Datei, `organizationColor` wirft, und das Manifest behauptet nichts, was der Katalog nicht kann.
 * (`2.2_Organisationen.svg` existiert, trägt aber einen generischen Namen, aus dem keine Zuordnung
 * folgt. Diese Zuordnung zu vermessen ist eine eigene Aufgabe.)
 *
 * Bei den Stärkegraden enthält `referenceAssets` mehr als die namensgebende Datei: die
 * `5.4.x`-Dateien sind eigenständige Anzeigedarstellungen mit r = 4 und selbst keine Kopfzonen;
 * die Kopfzonengeometrie ist an den `C.1.x`- und `D.3.7`/`E.1.18`-Dateien vermessen
 * (Entscheidungsnotiz vom 4. August 2026, Abschnitt 5, und die Konstanten in `strengths.ts`).
 * Die namensgebende Datei steht jeweils zuerst.
 */
export const ELEMENTS = {
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
  'capability.fire-fighting': {
    id: 'capability.fire-fighting',
    kind: 'capability',
    title: 'Brandbekämpfung',
    // Belegstelle der Bildidee. Die Geometrie ist eigenständig konstruiert (`capabilities.ts`),
    // die Quelle führt das als `reconstructed`.
    referenceAssets: ['4.3.1_Brandbekämpfung.svg'],
  },
  'capability.service-water': {
    id: 'capability.service-water',
    kind: 'capability',
    title: 'Löschwasser, Brauchwasser',
    // Belegstelle der Bildidee. Die Geometrie ist eigenständig konstruiert
    // (`pictograms/capabilities.ts`); der Fingerprint dieser Datei trägt curvedPaths: 1, die
    // Bildidee enthält also tatsächlich eine Kurve. Zwei Leerzeichen gibt es hier nicht, aber
    // ein Leerzeichen statt des Schrägstrichs der Kapitelüberschrift — so steht der Name im
    // Referenzbestand, nicht normalisieren.
    referenceAssets: ['4.3.2_Löschwasser Brauchwasser.svg'],
  },
} as const satisfies Record<string, ElementDescriptor>;

/**
 * Weit getypter Blick auf `ELEMENTS` für die Suche über beliebige Zeichenketten — dasselbe
 * Muster wie `colorsByOrganization` in `organizations.ts`. `ELEMENTS` selbst bleibt eng getypt,
 * damit die Tests an den Literalschlüsseln greifen.
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
