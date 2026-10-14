import type { Primitive } from '@einsatzzeichen/schema';

/**
 * Ob ein Körper offen ist, also keine Fläche umschließt. Ein Polyzug ist offen, wenn die Zeichnung
 * ihn **nicht** schließt: `closed` ist optional, die Prüfung fragt deshalb nach `!== true` und
 * nicht nach `=== false` — ein weggelassenes Feld ist ein offener Polyzug (`1.13 Ereignis`). Ein
 * Pfad ist offen, wenn er kein `Z` trägt: so die beiden Zweiräder 3.7/3.8, Bogen und Stiel(e)
 * (ESZ-142).
 *
 * Ein offener Körper hat keine Fläche: die Farbe geht in den Strich (`open-body-tint.ts`), und es
 * gibt weder Innenfeld noch Platz im Körper.
 */
export function isOpenBody(primitive: Primitive): boolean {
  if (primitive.type === 'polyline') return primitive.closed !== true;
  return primitive.type === 'path' && !/[Zz]/.test(primitive.d);
}
