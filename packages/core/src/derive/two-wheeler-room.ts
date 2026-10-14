import type { SymbolSpec } from '@einsatzzeichen/schema';
import { TWO_WHEELER_KINDS } from '../geometry/special-form-bodies.js';
import { NotMeasuredError } from '../not-measured.js';

/**
 * Was am Zweirad keinen Platz hat (ESZ-142). Die Zweiräder 3.7/3.8 sind Bogen und Stiel(e), ein
 * offener Pfad ohne Fläche: Was das Zeichen sonst **im** Körper trägt — Läufe im Körper,
 * Fähigkeiten, Körpermarken, ein Innenfeld —, läge auf dem Stiel. Abgeleitet wird außen
 * (oberhalb links, unterhalb rechts, Oberflächenläufe, Fußzeile, Kopfzone, Randlage der Zustände).
 *
 * Das ist eine Grenze der Form, keine Regel der Systematik; deshalb `NotMeasuredError` und keine
 * Regelkennung, wie an den übrigen Lagen, die auf der Fläche keinen Platz finden
 * (`derive/label-zones.ts`).
 */
const IN_BODY_LABELS = ['center', 'topLeft', 'topLeftLines', 'bottomLeft', 'bottomCenter', 'bottomRight'] as const;

export function assertTwoWheelerRoom(spec: SymbolSpec): void {
  if (!(TWO_WHEELER_KINDS as readonly string[]).includes(spec.kind)) return;
  const inBody: string[] = [];
  for (const zone of IN_BODY_LABELS) if (spec.labels?.[zone] !== undefined) inBody.push(`labels.${zone}`);
  if ((spec.capabilities?.length ?? 0) > 0) inBody.push('capabilities');
  if ((spec.bodyMarks?.length ?? 0) > 0) inBody.push('bodyMarks');
  if (spec.whiteInnerContour === true) inBody.push('whiteInnerContour');
  if (inBody.length === 0) return;
  throw new NotMeasuredError(
    `"${spec.kind}" hat keine Fläche: Bogen und Stiel umschließen nichts, ${inBody.join(', ')} ` +
      'läge auf dem Stiel. Am Zweirad stehen Läufe außen (oberhalb links, unterhalb rechts, ' +
      'Oberflächenläufe, Fußzeile).',
    'combination',
  );
}
