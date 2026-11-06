import type { Sign } from '@einsatzzeichen/schema';
import { isFreestandingSign } from '@einsatzzeichen/schema';
import { describeFreestandingSpec } from '../draw-freestanding.js';
import { functionRole } from '../geometry/function-roles.js';
import { ORGANIZATION_LABELS, describeSymbolSpec, symbolKindLabel } from '../geometry/labels.js';
import { COLOR_LABELS, FREESTANDING_KIND_LABELS, headGroupOf, headLabel, taskLabel } from './labels.js';
import { resolveBody } from './resolve.js';

export interface SignDescription {
  /** Kurzer Name, etwa „Taktische Formation, Gruppe, Bergung, Technisches Hilfswerk“. */
  readonly title: string;
  /** Vorlesetext, derselbe wie in der Zeichnung (`describeSymbolSpec`, `describeFreestandingSpec`). */
  readonly description: string;
}

/**
 * Name und Vorlesetext einer Beschreibung. Der Vorlesetext beschreibt die ganze Beschreibung,
 * auch Teile, die `draw` weglassen müsste.
 */
export function describe(sign: Sign): SignDescription {
  if (isFreestandingSign(sign)) {
    return { title: FREESTANDING_KIND_LABELS[sign.kind], description: describeFreestandingSpec(sign) };
  }
  const parts: string[] = [sign.role === undefined ? symbolKindLabel(sign.kind) : functionRole(sign.role).title];
  if (sign.head !== undefined && headGroupOf(sign.head) !== undefined) parts.push(headLabel(sign.head));
  for (const task of sign.tasks ?? []) parts.push(taskLabel(task));
  if (sign.organization !== undefined) parts.push(ORGANIZATION_LABELS[sign.organization]);
  if (sign.color !== undefined) parts.push(COLOR_LABELS[sign.color]);
  const center = sign.text?.center;
  if (center !== undefined && center.trim() !== '') parts.push(`„${center}“`);
  return { title: parts.join(', '), description: describeSymbolSpec(resolveBody(sign).spec) };
}
