import type { BodyVariantId, SymbolKind } from '@einsatzzeichen/schema';
import { CIRCLE_VARIANT_PAIRS } from './circle.js';

/**
 * Zulassungstabelle der Körpervarianten: welche Variante an welcher Art gezeichnet wird.
 *
 * Seit der Entscheidung vom 2. Oktober 2026 trennt die Tabelle zwei Fragen, die vorher eine waren.
 * **Gesperrt bleibt, was die Systematik verbietet**: eine Variante, die eine artgebundene Form
 * benennt — einen Rumpf, einen Flügel, eine Personraute, einen Kreis. **Zugelassen ist jeder
 * übertragbare Modifikator** an jeder Art, deren Körper ihn trägt; wo kein Original das Paar
 * zeigt, leitet `derive/body-variants.ts` die Zeichnung aus der nächstliegenden vermessenen
 * Fassung ab und meldet sie per `noteDerivation`.
 *
 * Validierung, Geometrie (`baseDrawing`, `innerField`) und Layoutprofil (`variantProfile`) lesen
 * alle drei diese eine Tabelle, damit sie nicht auseinanderlaufen.
 */

/** Die vermessenen Paare: jede Zeichnung ist an mindestens einer Referenzdatei belegt. */
export const MEASURED_BODY_VARIANT_KINDS: Readonly<
  Record<BodyVariantId, ReadonlySet<SymbolKind>>
> = {
  'raised-hull': new Set<SymbolKind>(['vehicle-air', 'vehicle-water']),
  'inset-hull': new Set<SymbolKind>(['vehicle-water']),
  'foot-band': new Set<SymbolKind>(['formation', 'vehicle-land', 'trailer', 'circle-12']),
  'plain-wheel-pair': new Set<SymbolKind>(['vehicle-land']),
  'raised-gable': new Set<SymbolKind>(['circle-12']),
  'inverted-hull-track': new Set<SymbolKind>(['vehicle-land']),
  'fixed-wing-hull': new Set<SymbolKind>(['vehicle-air']),
  'raised-circle-1mm': new Set<SymbolKind>(['circle-12']),
  'compact-person-diamond-26mm': new Set<SymbolKind>(['person']),
  'compact-person-diamond-26mm-lowered-2mm': new Set<SymbolKind>(['person']),
};

/** Fahrzeugkörper mit Fahrgestell: Landfahrzeug, Anhänger- und Wechselladerrumpf. */
const CHASSIS_BODIES = ['trailer', 'swap-loader-vehicle'] as const satisfies readonly SymbolKind[];

/**
 * Die abgeleiteten Paare. Kein Original zeigt sie; gezeichnet werden sie trotzdem, weil die
 * Variante ein übertragbarer Modifikator ist.
 *
 * - `foot-band` — 3-mm-Schwarzband innen an der Körperunterkante. Ein Modifikator ohne
 *   Formbindung: an jeder Art der Schnitt des Körpers mit dem Streifen [maxY − 3, maxY].
 * - `plain-wheel-pair`, `inverted-hull-track` — Fahrgestell und Kettenrumpf gehören an jeden
 *   Fahrzeugkörper mit Fahrgestell, also auch an Anhänger und Wechsellader.
 * - `raised-gable` — der Giebel bedeutet „ortsfest" (3.9, temporär ortsfeste Strukturen). Die
 *   Inventur fand ihn nur über dem 12-mm-Kreis. Vom 02.10.2026 an stand er an jedem Grundzeichen;
 *   das Fachreview vom 05.10.2026 (LFH-1064) schränkt ihn auf Träger ein, an denen „ortsfest"
 *   etwas aussagt: Formation, Gebäude (mit der reduzierten Hauskontur), Container und die
 *   Fahrzeugkörper mit Fahrgestell (eine abgestellte mobile Führungsstelle). An Person, Gefahr,
 *   Ereignis, Maßnahme, Gebiet und Punkt ist „ortsfest" selbstverständlich oder sinnlos, an Luft-
 *   und Wasserfahrzeug widerspricht es der Art; dort lehnt `raised-gable-requires-stationary-kind`
 *   ab. Der Körper wird unter dem Giebel verkleinert wie der abgesenkte Kreis.
 *
 * **Gesperrt bleiben** (Systematik, artgebundene Form): `raised-hull` außer an Luft- und
 * Wasserfahrzeug, `inset-hull` außer am Wasserfahrzeug, `fixed-wing-hull` außer am Luftfahrzeug,
 * beide `compact-person-diamond-*` außer an der Person und `raised-circle-1mm` außer an
 * Kreiskörpern.
 *
 * **Kreiskörper fehlen hier mit Absicht:** die Paare für `post` (`foot-band`, `raised-gable`,
 * `raised-circle-1mm`) ergänzt Agent A in `CIRCLE_VARIANT_PAIRS` (`derive/circle.ts`).
 */
export const DERIVED_BODY_VARIANT_KINDS: Readonly<
  Partial<Record<BodyVariantId, ReadonlySet<SymbolKind>>>
> = {
  'foot-band': new Set<SymbolKind>([
    'person',
    'vehicle-air',
    'vehicle-water',
    'building',
    'container',
    'area',
    'measure',
    'hazard',
    'point',
    'event',
    'spontaneous-helper',
    'swap-loader-vehicle',
    'upright-rectangle',
    'reduced-house',
    // Kreiskörper (`post`): eigene Körper und Profile in `derive/circle.ts`, zugelassen über
    // `CIRCLE_VARIANT_PAIRS` in `isAllowedBodyVariant`.
  ]),
  'plain-wheel-pair': new Set<SymbolKind>(CHASSIS_BODIES),
  'inverted-hull-track': new Set<SymbolKind>(CHASSIS_BODIES),
  'raised-gable': new Set<SymbolKind>([
    'formation',
    'vehicle-land',
    'building',
    'container',
    'trailer',
    'swap-loader-vehicle',
    'reduced-house',
    // Kreiskörper (`post`): eigene Körper und Profile in `derive/circle.ts`, zugelassen über
    // `CIRCLE_VARIANT_PAIRS` in `isAllowedBodyVariant`.
  ]),
};

/**
 * Höhe des Fußbands, gemessen an `formation/foot-band` (G.1.2: Band y 23…26 bei Unterkante 26) und
 * gleich am Landfahrzeug und am Anhänger. Jede abgeleitete Fußbandfassung übernimmt sie.
 */
export const FOOT_BAND_HEIGHT_MM = 3;

/** Ob dieses Paar an einer Referenzdatei vermessen ist. */
export function isMeasuredBodyVariant(kind: SymbolKind, variant: BodyVariantId): boolean {
  return MEASURED_BODY_VARIANT_KINDS[variant].has(kind);
}

/** Ob dieses Paar nicht vermessen, aber abgeleitet zugelassen ist. */
export function isDerivedBodyVariant(kind: SymbolKind, variant: BodyVariantId): boolean {
  return !isMeasuredBodyVariant(kind, variant) &&
    DERIVED_BODY_VARIANT_KINDS[variant]?.has(kind) === true;
}

/** Ob die Systematik dieses Paar zulässt (vermessen oder abgeleitet). */
export function isAllowedBodyVariant(kind: SymbolKind, variant: BodyVariantId): boolean {
  return isMeasuredBodyVariant(kind, variant) || isDerivedBodyVariant(kind, variant) ||
    isCircleVariantPair(kind, variant);
}

/**
 * Die Varianten der Funktionsstelle (`post`) leitet `derive/circle.ts` selbst ab: Körper in
 * `VARIANT_BODIES`, eigene Profile, eigene Notizen. Sie laufen deshalb nicht über
 * `deriveBodyVariant` und zählen nicht als `isDerivedBodyVariant`.
 */
export function isCircleVariantPair(kind: SymbolKind, variant: BodyVariantId): boolean {
  return CIRCLE_VARIANT_PAIRS.some((pair) => pair.kind === kind && pair.bodyVariant === variant);
}
