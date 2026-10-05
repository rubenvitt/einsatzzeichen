import { DEFAULT_VIEWBOX_MM, type Primitive, type SymbolSpec } from '@einsatzzeichen/schema';
import { derivedBodyScaling } from '../geometry/base-symbols.js';
import {
  ARIMO_CAP_HEIGHT_FRACTION,
  MINIMUM_TEXT_RENDER_PX,
  verticalTextBoxMm,
} from '../render/text-policy.js';
import { IDENTITY_AFFINE, mapPrimitive, uniformAbout, type Affine } from './affine.js';
import { noteDerivation } from './record.js';

type Labels = NonNullable<SymbolSpec['labels']>;
type LabelZone = 'center' | 'topLeft' | 'topLeftLines' | 'bottomLeft' | 'bottomCenter' | 'bottomRight' |
  'aboveLeft' | 'belowRight' | 'surfaceBelowLeft' | 'surfaceBelowRight';

/** Zonen im Körper: sie folgen ihm. */
export const IN_BODY_LABEL_ZONES = [
  'center', 'topLeft', 'topLeftLines', 'bottomLeft', 'bottomCenter', 'bottomRight',
] as const satisfies readonly LabelZone[];
/** Zonen auf der Ausgabeoberfläche: sie bleiben am gezeichneten Körper. */
export const OUTSIDE_LABEL_ZONES = [
  'aboveLeft', 'belowRight', 'surfaceBelowLeft', 'surfaceBelowRight',
] as const satisfies readonly LabelZone[];
const ALL_LABEL_ZONES: readonly LabelZone[] = [...IN_BODY_LABEL_ZONES, ...OUTSIDE_LABEL_ZONES];

/**
 * Läufe im Körper folgen einem verkleinerten Körper (LFH-987, Entscheidung vom 5. Oktober 2026).
 *
 * Giebel (`body-variants.ts`) und Kopfzone (`placeBaseUnderHead`) verkleinern an abgeleiteten
 * Zusammenstellungen den Körper samt Zusatzgeometrie. Bis dahin behielten die Läufe im Körper
 * ihre Normgröße und ihre körperrelativen Abstände in Millimetern; die Platzprüfung
 * (`layout-guard.ts`) meldete das als Lücke. Jetzt rechnet `compose()` die Läufe gegen den
 * unverkleinerten Körper und bildet sie danach mit derselben Ähnlichkeitsabbildung ab wie den
 * Körper: Lage, Schriftgrad, Box und Einsatzgrenze. Vorbild sind die Piktogramme und die
 * Zusatzgeometrie, die dem Körper seit dem 2. Oktober 2026 ebenso folgen.
 *
 * Läufe außerhalb des Körpers (`aboveLeft`, `belowRight`, `surfaceBelow*`) und die Fußzone stehen
 * auf der Ausgabeoberfläche, nicht im Körper; sie folgen ihm nicht.
 */

/**
 * Kleinste Versalhöhe eines mitgeführten Laufs: der kleinste Lauf, den die Quelle in einen Körper
 * setzt — „Strömungsrettung“ in I.2.6 mit 2,12 mm (`recipes-anhang-i.ts`). Nach der Textpolitik
 * (`MINIMUM_TEXT_RENDER_PX`) ist ein Lauf dieses Grads ab 84 px lesbar, auf der Snapshot-Leiter
 * also ab 128 px. Kleiner wird ein mitgeführter Lauf nicht; reicht der Platz dann nicht, bleibt
 * es bei der benannten Lücke der Platzprüfung.
 */
export const MIN_SCALED_RUN_CAP_HEIGHT_MM = 2.12;

const MIN_SCALED_RUN_SIZE_MM = MIN_SCALED_RUN_CAP_HEIGHT_MM / ARIMO_CAP_HEIGHT_FRACTION;
const EPSILON = 1e-9;

/** `outer ∘ inner`: erst `inner`, dann `outer`. */
export function composeAffine(outer: Affine, inner: Affine): Affine {
  return {
    sx: outer.sx * inner.sx,
    sy: outer.sy * inner.sy,
    tx: outer.tx + outer.sx * inner.tx,
    ty: outer.ty + outer.sy * inner.ty,
  };
}

export function invertAffine(m: Affine): Affine {
  return { sx: 1 / m.sx, sy: 1 / m.sy, tx: -m.tx / m.sx, ty: -m.ty / m.sy };
}

export function isIdentityAffine(m: Affine): boolean {
  return Math.abs(m.sx - 1) < EPSILON && Math.abs(m.sy - 1) < EPSILON &&
    Math.abs(m.tx) < EPSILON && Math.abs(m.ty) < EPSILON;
}

/**
 * Die Abbildung vom unverkleinerten auf den gezeichneten Körper.
 *
 * Gezeichnet wird `shrink ∘ place ∘ gable` des Grundkörpers. Der unverkleinerte Körper ist
 * `place` des Grundkörpers, also ohne Giebel- und Kopfverkleinerung, aber mit der Platzierung
 * des Profils, deren Lagen vermessen sind. Daraus folgt `shrink ∘ place ∘ gable ∘ place⁻¹`.
 */
export function bodyShrinkMap(spec: SymbolSpec, place: Affine, shrink: Affine | undefined): Affine {
  const scaling = spec.bodyVariant === undefined ? undefined : derivedBodyScaling(spec.kind, spec.bodyVariant);
  const gable = scaling === undefined
    ? IDENTITY_AFFINE
    : composeAffine(
        place,
        composeAffine(
          uniformAbout([scaling.originX, scaling.originY], [scaling.originX, scaling.originY], scaling.factor),
          invertAffine(place),
        ),
      );
  return composeAffine(shrink ?? IDENTITY_AFFINE, gable);
}

/** Ob ein mitgeführter Lauf an der Untergrenze stünde. */
export function clampsRun(primitive: Primitive, m: Affine): boolean {
  return primitive.type === 'text' && primitive.sizeMm * Math.min(m.sx, m.sy) < MIN_SCALED_RUN_SIZE_MM;
}

/**
 * Bildet Läufe mit der Abbildung des Körpers ab. Fiele ein Lauf unter
 * `MIN_SCALED_RUN_CAP_HEIGHT_MM`, steht er in diesem Grad, mit der Versalmitte dort, wo sie
 * abgebildet stünde: er wächst nach oben und unten gleich, nicht von einer Kante weg. Die
 * waagerechte Box bleibt die abgebildete Zone; ein Lauf, der darin nicht Platz hat, fällt wie
 * jeder zu breite Lauf an `label-too-wide`.
 */
export function runsFollowingBody(runs: readonly Primitive[], m: Affine): Primitive[] {
  return runs.map((run) => {
    if (run.type !== 'text') return mapPrimitive(m, run);
    const mapped = mapPrimitive(m, run) as Extract<Primitive, { type: 'text' }>;
    const clamped = mapped.sizeMm < MIN_SCALED_RUN_SIZE_MM;
    const sizeMm = clamped ? MIN_SCALED_RUN_SIZE_MM : mapped.sizeMm;
    const y = clamped
      ? mapped.y - (mapped.sizeMm * ARIMO_CAP_HEIGHT_FRACTION) / 2 + MIN_SCALED_RUN_CAP_HEIGHT_MM / 2
      : mapped.y;
    const box = verticalTextBoxMm(y, sizeMm, run.baseline ?? 'alphabetic');
    return {
      ...mapped,
      y,
      sizeMm,
      boxMm: { ...mapped.boxMm, yMm: box.topMm, heightMm: box.heightMm },
      ...(run.minRenderPx === undefined
        ? {}
        : { minRenderPx: Math.ceil((MINIMUM_TEXT_RENDER_PX * DEFAULT_VIEWBOX_MM.width) / sizeMm) }),
    };
  });
}

/**
 * Die Beschriftung, beschränkt auf `zones`, samt allen Angaben, die keine Zone sind (Metriken,
 * Tinte, Grundlinie). `undefined`, wenn keine der Zonen belegt ist.
 */
export function labelsInZones(labels: Labels, zones: readonly LabelZone[]): Labels | undefined {
  if (!zones.some((zone) => labels[zone] !== undefined)) return undefined;
  const kept: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(labels)) {
    if (!ALL_LABEL_ZONES.includes(key as LabelZone) || zones.includes(key as LabelZone)) kept[key] = value;
  }
  return kept as Labels;
}

/** Notiert, dass die Läufe im Körper dem verkleinerten Körper folgen. */
export function noteRunsFollowingBody(runs: readonly Primitive[], m: Affine): void {
  const factor = Math.round(Math.min(m.sx, m.sy) * 1000) / 1000;
  noteDerivation({
    dimension: 'labels',
    part:
      `Läufe im Körper folgen dem verkleinerten Körper: Lage und Versalhöhe × ${factor}` +
      (runs.some((run) => clampsRun(run, m))
        ? `, Versalhöhe nicht unter ${MIN_SCALED_RUN_CAP_HEIGHT_MM} mm`
        : ''),
    basis: 'transferred',
    from:
      'Körperfaktor aus Giebel und Kopfzone (derive/body-variants.ts, placeBaseUnderHead); ' +
      'Untergrenze: kleinster vermessener Körperlauf I.2.6 (Versalhöhe 2,12 mm)',
  });
}
