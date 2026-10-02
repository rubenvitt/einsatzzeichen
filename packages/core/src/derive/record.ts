import type { DerivationNote, Drawing } from '@einsatzzeichen/schema';

/**
 * Sammelt die Ableitungen einer laufenden Komposition.
 *
 * **Warum ein Stapel und kein Parameter.** Ableitungen entstehen tief im Motor — in der
 * Körpermarke, in der Zustandslage, im Profil —, und jeden dieser Wege um einen Sammler zu
 * erweitern hieße, ein Dutzend öffentlicher Ports zu ändern. `compose()` läuft synchron; ein
 * Stapel offener Sammler ist deshalb eindeutig, auch wenn eine Komposition eine zweite anstößt.
 * Außerhalb einer Komposition (etwa ein Port, den ein Test direkt ruft) geht eine Notiz
 * verloren — das ist gewollt: ohne Zeichnung gibt es nichts, an dem sie stehen könnte.
 */
const open: DerivationNote[][] = [];

/** Meldet einen abgeleiteten Teil an die laufende Komposition. Doppelte Notizen fallen weg. */
export function noteDerivation(note: DerivationNote): void {
  const current = open.at(-1);
  if (current === undefined) return;
  const duplicate = current.some(
    (seen) =>
      seen.dimension === note.dimension &&
      seen.part === note.part &&
      seen.basis === note.basis &&
      seen.from === note.from,
  );
  if (!duplicate) current.push(note);
}

/**
 * Führt `draw` mit eigenem Sammler aus und hängt die gesammelten Notizen an die Zeichnung.
 * Ohne Notiz bleibt die Zeichnung unverändert, also auch ohne leeres Feld: vermessene Zeichen
 * behalten ihre Gestalt bis aufs Objekt.
 */
export function collectDerivations(draw: () => Drawing): Drawing {
  const notes: DerivationNote[] = [];
  open.push(notes);
  try {
    const drawing = draw();
    if (notes.length === 0) return drawing;
    const inherited = drawing.derivations ?? [];
    const merged = [...inherited];
    for (const note of notes) {
      if (
        !merged.some(
          (seen) =>
            seen.dimension === note.dimension &&
            seen.part === note.part &&
            seen.basis === note.basis &&
            seen.from === note.from,
        )
      ) {
        merged.push(note);
      }
    }
    return { ...drawing, derivations: Object.freeze(merged) };
  } finally {
    open.pop();
  }
}
