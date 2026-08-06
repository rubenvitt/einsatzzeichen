import type { PictogramDefinition, Primitive } from '@einsatzzeichen/schema';
import { tokenizePath } from './path-commands.js';

/**
 * Ein Befund eines der drei Piktogramm-Gates. Eine gemeinsame Form statt dreier eigener: das
 * Coverage-Gate und die Katalogtests geben sie einheitlich aus, und ein viertes Gate kostet
 * keine Änderung an der Rückgabeform — dasselbe Muster wie `CoverageViolation` in `catalog`.
 *
 * Listen von Befunden statt Ausnahmen, wie `validateSpec`: ein Autor will alle Verstöße seines
 * Piktogramms auf einmal sehen, nicht den ersten.
 */
export interface PictogramIssue {
  gate: 'command' | 'box' | 'clipping';
  pictogramId: string;
  detail: string;
}

/** Alle Pfad-Primitive einer Definition, auch verschachtelte. */
function pathsOf(primitives: readonly Primitive[]): Array<Primitive & { type: 'path' }> {
  const paths: Array<Primitive & { type: 'path' }> = [];
  for (const primitive of primitives) {
    if (primitive.type === 'path') paths.push(primitive);
    else if (primitive.type === 'group') paths.push(...pathsOf(primitive.children));
  }
  return paths;
}

/**
 * Prüft, dass jeder `d`-String der Definition ausschließlich die sieben zugelassenen absoluten
 * Kommandos verwendet (Spec Abschnitt 5). Diese Beschränkung ist nicht stilistisch: sie ist die
 * Bedingung, unter der das Box-Gate beweisbar konservativ ist. Mit `A`, `S` oder `T` wäre es
 * nicht konservativ, sondern falsch.
 */
export function checkCommands(definition: PictogramDefinition): PictogramIssue[] {
  const issues: PictogramIssue[] = [];
  for (const path of pathsOf(definition.primitives)) {
    for (const problem of tokenizePath(path.d).problems) {
      issues.push({ gate: 'command', pictogramId: definition.id, detail: problem });
    }
  }
  return issues;
}
