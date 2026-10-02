import type { BodyVariantId, SymbolKind } from '@einsatzzeichen/schema';
import { derivedBodyScale } from '../geometry/base-symbols.js';
import type { LayoutProfile } from '../layout/profiles.js';
import { FOOT_BAND_HEIGHT_MM, isDerivedBodyVariant } from './body-variant-pairs.js';

/**
 * Felder, die ein Profil nur führt, weil **dieses** Zeichen sie an einem Original vermessen hat:
 * erlaubte Einzelwerte, geschlossene Messlisten, die gemessene Hülle, die F.2.8-Zweizeilenzone.
 * Ein abgeleitetes Paar erbt sie nicht — es hätte sonst Messverträge, die keine Datei belegt.
 */
const MEASURED_ONLY_FIELDS = [
  'allowsCenterBaselineOverride',
  'measuredCenterBaselineOverridesMm',
  'allowsCenterAnchorOverride',
  'measuredCenterAnchorsFromBodyLeftMm',
  'measuredCenterAnchorFromBodyLeftMm',
  'allowsCenterBoxMarginOverride',
  'measuredBodyBoundsMm',
  'topLeftLines',
  'requiresTopLeftMetrics',
  'bottomRightMetricsBounds',
  'openTopWhenHeadlessAndUnlabelled',
] as const satisfies readonly (keyof LayoutProfile)[];

/** Versalhöhe des mittigen Laufs ohne eigene Angabe (`compose()`, E.1-Normgrad). */
const DEFAULT_CENTER_CAP_HEIGHT_MM = 4.87;

/** Die Zone oberhalb des Körpers; unter einem Giebel ist sie von ihm belegt. */
const ABOVE_BODY_FIELDS = [
  'aboveLeftBaselineFromBodyTopMm',
  'aboveLeftAnchorFromBodyLeftMm',
] as const satisfies readonly (keyof LayoutProfile)[];

function without(profile: LayoutProfile, fields: readonly (keyof LayoutProfile)[]): LayoutProfile {
  const copy: Partial<LayoutProfile> = { ...profile };
  for (const field of fields) delete copy[field];
  return copy as LayoutProfile;
}

/**
 * Das Layoutprofil eines abgeleiteten Art×Variante-Paars: die körperrelativen Zonenwerte der
 * Grundart, ohne deren Einzelmessungen, und mit dem, was die Variante am Körper ändert.
 *
 * - `foot-band`: die unteren Läufe stehen über dem Band — 2 mm Grundart plus 3 mm Band, also
 *   die 5 mm, die G.1.2 an der gebänderten Formation misst.
 * - `raised-gable`: keine Zone oberhalb des Körpers, dort steht der Giebel. Der Körper ist
 *   verkleinert; die mittige Grundlinie rückt so mit, dass die Mitte des Laufs (bei der
 *   Normversalhöhe 4,87 mm) auf derselben relativen Körperhöhe steht wie an der Grundart.
 * - `inverted-hull-track` am Anhänger: die Fahrwerkszone beginnt 0,25 mm unter den Rumpfecken
 *   wie an N.1.1. Am Wechsellader hängt sie am L-Rahmen und nicht am Rumpf.
 *
 * `undefined` für jedes Paar, das nicht abgeleitet ist.
 */
export function derivedVariantProfile(
  kind: SymbolKind,
  variant: BodyVariantId | undefined,
  base: LayoutProfile,
): LayoutProfile | undefined {
  if (variant === undefined || !isDerivedBodyVariant(kind, variant)) return undefined;
  const kept = without(base, MEASURED_ONLY_FIELDS);
  switch (variant) {
    case 'foot-band':
      return {
        ...kept,
        bottomLabelBaselineFromBodyBottomMm:
          kept.bottomLabelBaselineFromBodyBottomMm + FOOT_BAND_HEIGHT_MM,
      };
    case 'raised-gable': {
      const scale = derivedBodyScale(kind, variant);
      const middle = kept.centerBaselineFromBodyBottomMm + DEFAULT_CENTER_CAP_HEIGHT_MM / 2;
      return {
        ...without(kept, ABOVE_BODY_FIELDS),
        centerBaselineFromBodyBottomMm:
          Math.round((scale * middle - DEFAULT_CENTER_CAP_HEIGHT_MM / 2) * 1e4) / 1e4,
      };
    }
    case 'inverted-hull-track':
      return kind === 'trailer' ? { ...kept, chassisTopBelowBaseBottomMm: 0.25 } : kept;
    default:
      return kept;
  }
}
