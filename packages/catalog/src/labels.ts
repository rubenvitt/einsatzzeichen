import { TECHNICAL_BODY_MARK_IDS } from '@einsatzzeichen/schema';
import type {
  AdminLevelId,
  BodyMarkId,
  OrganizationId,
  PictogramDefinition,
  StrengthId,
  SymbolKind,
  SymbolSpec,
  TechnicalBodyMarkId,
  VehicleCategoryId,
} from '@einsatzzeichen/schema';
import { pictogram } from './pictograms/index.js';

const KIND_LABELS: Record<SymbolKind, string> = {
  formation: 'Taktische Formation',
  person: 'Person',
  'vehicle-land': 'Landfahrzeug',
  'vehicle-air': 'Luftfahrzeug',
  'vehicle-water': 'Wasserfahrzeug',
  post: 'Funktionsstelle',
  building: 'Gebäude',
  container: 'Behälter, Ressource, Raum oder Funkgerät',
  area: 'Fläche',
  measure: 'Maßnahme',
  hazard: 'Gefahr',
  point: 'Konkreter Punkt',
  event: 'Ereignis',
  'spontaneous-helper': 'Spontanhelfende',
  trailer: 'Anhänger',
  'swap-loader-vehicle': 'Wechselladerfahrzeug',
  // Nach der Zeichnung benannt und nicht nach der Trinkwasseraufbereitungsanlage, für die
  // `E.2.26` sie verwendet: was diese Form fachlich bezeichnet, sagt die Datei nicht.
  'upright-rectangle': 'Hochkantrechteck',
  'circle-12': '12-mm-Kreis',
  'reduced-house': 'Reduzierte Hauskontur',
};

const ORGANIZATION_LABELS: Record<OrganizationId, string> = {
  feuerwehr: 'Feuerwehr',
  thw: 'Technisches Hilfswerk',
  'fuehrung-leitung': 'Führung und Leitung',
  polizei: 'Polizei',
  bundeswehr: 'Bundeswehr',
  'sonstige-gefahrenabwehr': 'Sonstige Gefahrenabwehr',
  'zivile-einheiten': 'Zivile Einheiten',
  hilfsorganisation: 'Hilfsorganisation',
};

const STRENGTH_LABELS: Record<StrengthId, string> = {
  trupp: 'Trupp',
  staffel: 'Staffel',
  gruppe: 'Gruppe',
  zug: 'Zug',
};

const ADMIN_LEVEL_LABELS: Record<AdminLevelId, string> = {
  gemeinde: 'Gemeinde',
  kreis: 'Kreis',
  bezirk: 'Bezirk',
  bundesland: 'Bundesland',
  nationalstaat: 'Nationalstaat',
  'europaeische-union': 'Europäische Union',
};

const VEHICLE_CATEGORY_LABELS: Record<VehicleCategoryId, string> = {
  'kfz-kategorie-1': 'Kraftfahrzeugkategorie 1',
  'kfz-kategorie-2': 'Kraftfahrzeugkategorie 2',
  'kfz-kategorie-3': 'Kraftfahrzeugkategorie 3',
  amphibienfahrzeug: 'Amphibienfahrzeug',
  kettenfahrzeug: 'Kettenfahrzeug',
  schienenfahrzeug: 'Schienenfahrzeug',
  // Nach der Zeichnung benannt: „von PKW/LKW gezogen" wäre an drei der vier E.2-Anhänger falsch.
  'anhaenger-ein-rad': 'Anhänger mit einem Rad',
  'anhaenger-zwei-raeder': 'Anhänger mit zwei Rädern',
};

/**
 * Neutrale Vorlesetexte aller technischen Körpermarken. Der vollständige Record macht neue IDs
 * zum Typfehler, bis ihre nicht-semantische Beschreibung ausdrücklich ergänzt ist.
 */
export const TECHNICAL_BODY_MARK_LABELS = Object.freeze({
  'ring-7mm-offset-down-1mm': 'Ring 7 mm, Mittelpunkt 1 mm unter Körpermitte',
  'chevron-over-opposed-triangles': 'Winkel über gegenüberliegenden Dreiecken',
  'ring-6-5mm-offset-down-2mm-with-roof': 'Ring 6,5 mm mit Dach und eingeschriebenem Dreieck',
  'top-center-rect-0-5x0-6mm': 'Rechteck 0,5 × 0,6 mm oben mittig',
  'air-winch-chevron-diamond': 'Winschform aus Pfeilwinkel und Raute',
  'ring-6mm-offset-down-3mm-four-way-stem':
    'Ring 6 mm mit Vierwegeform und unterem Gabelsteg',
  'ring-5mm-offset-down-3mm-eight-spokes':
    'Ring 5 mm mit acht Speichen, 3 mm nach unten versetzt',
  'circle-patient-staging-arrows': 'Geteilter Kreis mit Doppelpfeil im oberen Feld',
  'circle-collection-arrow': 'Waagerechter Pfeil mit kleinem Ring',
  'circle-staging-frame-arrow': 'Oben gewölbter Rahmen mit Pfeil und kleinem Ring',
  'circle-staging-frame': 'Oben gewölbter geschlossener Rahmen',
  'circle-staging-frame-quadrants-arrows':
    'Viergeteilter gewölbter Rahmen mit unterem Doppelpfeil',
  'circle-diamond-arrow': 'Geteilte Raute mit Anschlag und Rechtspfeil',
  'circle-cross-ring': 'Geteilter Kreis mit Ring und Diagonalkreuz',
} satisfies Record<TechnicalBodyMarkId, string>);

const TECHNICAL_BODY_MARK_ID_SET = new Set<string>(TECHNICAL_BODY_MARK_IDS);

function isTechnicalBodyMarkId(mark: BodyMarkId): mark is TechnicalBodyMarkId {
  return TECHNICAL_BODY_MARK_ID_SET.has(mark);
}

export function symbolKindLabel(kind: SymbolKind): string {
  return KIND_LABELS[kind];
}

/** Semantische Langbeschreibung einer Komposition, unabhängig von ihrer Geometrie. */
export function describeSymbolSpec(spec: SymbolSpec): string {
  const parts = [`Grundzeichen: ${KIND_LABELS[spec.kind]}`];
  if (spec.organization !== undefined) {
    parts.push(`Organisation: ${ORGANIZATION_LABELS[spec.organization]}`);
  }
  if (spec.strength !== undefined) parts.push(`Stärke: ${STRENGTH_LABELS[spec.strength]}`);
  if (spec.administrativeLevel !== undefined) {
    parts.push(`Verwaltungsstufe: ${ADMIN_LEVEL_LABELS[spec.administrativeLevel]}`);
  }
  if (spec.vehicleCategory !== undefined) {
    parts.push(`Fahrzeugkategorie: ${VEHICLE_CATEGORY_LABELS[spec.vehicleCategory]}`);
  }
  for (const capability of spec.capabilities ?? []) {
    parts.push(`Fähigkeit: ${pictogram(`capability.${capability}`).title}`);
  }
  // Randbündige Fachdienstzeichen tragen denselben Begriff wie die Boxfassung und werden für eine
  // Vorlesestimme deshalb gleich benannt — der Unterschied ist die Zeichnung, nicht die Sache. Der
  // Titel kommt aus demselben Piktogrammregister, damit beide Fassungen nicht auseinanderlaufen.
  for (const mark of spec.bodyMarks ?? []) {
    if (isTechnicalBodyMarkId(mark)) {
      parts.push(`Technische Körpermarke: ${TECHNICAL_BODY_MARK_LABELS[mark]}`);
    } else {
      parts.push(`Fachdienst: ${pictogram(`capability.${mark}`).title}`);
    }
  }
  if (spec.designation !== undefined) parts.push(`Bezeichnung: ${spec.designation}`);
  // Die Beschriftungen tragen bei Anhang E die gesamte fachliche Unterscheidung — ohne sie sind
  // E.1.1 und E.1.7 dasselbe blaue Rechteck. Sie gehören deshalb in die Beschreibung, die
  // Bildschirmleser vorlesen, und nicht nur ins Bild. Die Zonennamen sind ausgeschrieben statt
  // als `center`/`bottomLeft` durchgereicht: eine Vorlesestimme sagt „Kürzel", nicht „center".
  //
  // `belowRight` steht hier gleichrangig neben `bottomRight`: die fünf Wasserfahrzeuge aus
  // Anhang E.2 setzen ihr Trägerkürzel unterhalb des Rumpfes statt in ihn hinein, und für eine
  // Vorlesestimme ist das derselbe Sachverhalt. Die Zone unterscheidet sich in der Lage und in
  // der Farbe, nicht in der Bedeutung — deshalb dasselbe Wort.
  //
  // Ausdrücklich **nicht** in der Liste: `centerCapHeightMm` und `topLeftMetrics`. Beides sind
  // Maßangaben und kein Text; Versalhöhe, Grundlinie oder Anker in der Vorlesebeschreibung wären
  // Rauschen. Die Liste ist deshalb explizit aufgezählt und nicht aus `Object.entries` erzeugt.
  const zones: Array<[keyof NonNullable<SymbolSpec['labels']>, string]> = [
    // Oben links steht in Anhang F dasselbe, was Anhang E mittig setzt: das Kürzel der Einheit.
    // Deshalb dasselbe Wort — und deshalb zuerst, weil eine Vorlesestimme das Bild von oben nach
    // unten liest. Ohne diese Zeile fiele bei elf F-Rezepten der einzige Text aus der
    // Beschreibung, den das Bild zeigt: `F.1.9` und `F.1.11` wären dort nicht mehr zu
    // unterscheiden, obwohl sie „SEG" gegen „RettD" tragen.
    ['topLeft', 'Kürzel'],
    ['center', 'Kürzel'],
    ['bottomLeft', 'Zusatzkennzeichnung'],
    ['bottomCenter', 'Zusatzkennzeichnung'],
    ['bottomRight', 'Trägerkürzel'],
    ['belowRight', 'Trägerkürzel'],
  ];
  for (const [zone, label] of zones) {
    const value = spec.labels?.[zone];
    if (typeof value === 'string') parts.push(`${label}: ${value}`);
  }
  if (spec.labels?.aboveLeft !== undefined) {
    parts.push(`Kürzel oberhalb: ${spec.labels.aboveLeft}`);
  }
  if (spec.labels?.topLeftLines !== undefined) {
    parts.push(`Kürzel zweizeilig: ${spec.labels.topLeftLines.join(' / ')}`);
  }
  return `${parts.join('. ')}.`;
}

export function describePictogram(definition: PictogramDefinition): string {
  return `Eigenständiges Piktogramm: ${definition.title}.`;
}
