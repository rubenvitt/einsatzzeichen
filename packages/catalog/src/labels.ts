import type {
  AdminLevelId,
  OrganizationId,
  PictogramDefinition,
  StrengthId,
  SymbolKind,
  SymbolSpec,
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
    parts.push(`Fachdienst: ${pictogram(`capability.${mark}`).title}`);
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
  // Ausdrücklich **nicht** in der Liste: `centerCapHeightMm`. Es ist eine Maßangabe und kein
  // Text; eine Zahl in der Vorlesebeschreibung wäre Rauschen. Die Liste ist deshalb explizit
  // aufgezählt und nicht aus `Object.entries(spec.labels)` erzeugt — sonst stünde sie dort seit
  // dem Teilslice E.2.
  const zones: Array<[keyof NonNullable<SymbolSpec['labels']>, string]> = [
    ['center', 'Kürzel'],
    ['bottomLeft', 'Zusatzkennzeichnung'],
    ['bottomRight', 'Trägerkürzel'],
    ['belowRight', 'Trägerkürzel'],
  ];
  for (const [zone, label] of zones) {
    const value = spec.labels?.[zone];
    if (typeof value === 'string') parts.push(`${label}: ${value}`);
  }
  return `${parts.join('. ')}.`;
}

export function describePictogram(definition: PictogramDefinition): string {
  return `Eigenständiges Piktogramm: ${definition.title}.`;
}
