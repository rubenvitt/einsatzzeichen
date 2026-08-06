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
  if (spec.designation !== undefined) parts.push(`Bezeichnung: ${spec.designation}`);
  return `${parts.join('. ')}.`;
}

export function describePictogram(definition: PictogramDefinition): string {
  return `Eigenständiges Piktogramm: ${definition.title}.`;
}

