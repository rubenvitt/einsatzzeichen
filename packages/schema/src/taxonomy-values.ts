import type {
  AdminLevelId,
  BodyVariantId,
  OrganizationId,
  StrengthId,
  SymbolKind,
  VehicleCategoryId,
} from './taxonomy.js';

/**
 * Wertelisten zu den Achsen von `SymbolSpec`, die in `taxonomy.ts` nur als Typ-Union stehen.
 * `FUNCTION_ROLE_IDS`, `CAPABILITY_IDS`, `TECHNICAL_BODY_MARK_IDS` und die Piktogrammräume
 * sind dort bereits Konstanten, aus denen der Typ abgeleitet wird; für `SymbolKind`,
 * `BodyVariantId`, `OrganizationId`, `StrengthId`, `AdminLevelId` und `VehicleCategoryId` ist es
 * umgekehrt: der Typ ist die Quelle, weil ihn Dokumentationskommentare je Wert tragen, die in
 * einer Array-Konstante keinen Platz hätten.
 *
 * **Vollständigkeit per Typ, nicht per Test.** Jede Liste entsteht als Schlüssel eines
 * `Record<X, true>`-Objekts. Fehlt ein Wert der Union, ist das Objekt kein `Record<X, true>`
 * mehr und der Compiler lehnt es ab; ein überzähliger Schlüssel scheitert genauso. Ein Test
 * hält daneben nur die Zahlen fest, damit sie in der Regelabdeckung (LFH-413) lesbar sind.
 */
function keysOf<T extends string>(record: Record<T, true>): readonly T[] {
  return Object.freeze(Object.keys(record) as T[]);
}

export const SYMBOL_KINDS: readonly SymbolKind[] = keysOf<SymbolKind>({
  formation: true,
  person: true,
  'vehicle-land': true,
  'vehicle-air': true,
  'vehicle-water': true,
  post: true,
  building: true,
  container: true,
  area: true,
  measure: true,
  hazard: true,
  point: true,
  event: true,
  'spontaneous-helper': true,
  trailer: true,
  'swap-loader-vehicle': true,
  'upright-rectangle': true,
  'circle-12': true,
  'reduced-house': true,
});

export const BODY_VARIANT_IDS: readonly BodyVariantId[] = keysOf<BodyVariantId>({
  'raised-hull': true,
  'inset-hull': true,
  'foot-band': true,
  'plain-wheel-pair': true,
  'raised-gable': true,
  'inverted-hull-track': true,
  'fixed-wing-hull': true,
  'raised-circle-1mm': true,
  'compact-person-diamond-26mm': true,
  'compact-person-diamond-26mm-lowered-2mm': true,
});

export const ORGANIZATION_IDS: readonly OrganizationId[] = keysOf<OrganizationId>({
  feuerwehr: true,
  thw: true,
  'fuehrung-leitung': true,
  polizei: true,
  bundespolizei: true,
  bundeswehr: true,
  'sonstige-gefahrenabwehr': true,
  'zivile-einheiten': true,
  hilfsorganisation: true,
});

export const STRENGTH_IDS: readonly StrengthId[] = keysOf<StrengthId>({
  trupp: true,
  staffel: true,
  gruppe: true,
  zug: true,
});

export const ADMIN_LEVEL_IDS: readonly AdminLevelId[] = keysOf<AdminLevelId>({
  gemeinde: true,
  kreis: true,
  bezirk: true,
  bundesland: true,
  nationalstaat: true,
  'europaeische-union': true,
});

export const VEHICLE_CATEGORY_IDS: readonly VehicleCategoryId[] = keysOf<VehicleCategoryId>({
  'kfz-kategorie-1': true,
  'kfz-kategorie-2': true,
  'kfz-kategorie-3': true,
  amphibienfahrzeug: true,
  kettenfahrzeug: true,
  schienenfahrzeug: true,
  'anhaenger-ein-rad': true,
  'anhaenger-zwei-raeder': true,
});
