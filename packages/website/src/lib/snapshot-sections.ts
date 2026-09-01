/**
 * Die vier Zerlegungen eines Manifestschlüssels (`bbk-babz-2025:E.1.1`): Quelle, Abschnitt,
 * Kapitel, Bereich.
 *
 * Steht ganz unten im Schnitt von LFH-503 und kennt deshalb weder Katalog noch Snapshot — die
 * Zerlegung ist reine Zeichenkettenarbeit, und wer sie prüfen will, braucht dafür keinen gebauten
 * Snapshot. Drei der vier Funktionen haben mehr als einen Aufrufer (`snapshot-symbols.ts`,
 * `snapshot-blockers.ts`); sie hier zusammenzuhalten verhindert, dass eine zweite, leicht andere
 * Zerlegung daneben entsteht.
 */

/** Abschnittsnummer eines Manifestschlüssels: `bbk-babz-2025:E.1.1` → `E.1.1`. */
export function sectionOf(sourceId: string): string {
  const separator = sourceId.indexOf(':');
  return separator === -1 ? sourceId : sourceId.slice(separator + 1);
}

/** Registrierte Quelle eines Manifestschlüssels: `bbk-babz-2025:E.1.1` → `bbk-babz-2025`. */
export function registryIdOf(sourceId: string): string {
  const separator = sourceId.indexOf(':');
  return separator === -1 ? sourceId : sourceId.slice(0, separator);
}

/**
 * Lesbare Kapitelbezeichnung einer Abschnittsnummer. Die letzte Stelle fällt weg — sie bezeichnet
 * das einzelne Zeichen, nicht sein Kapitel: `4.6.4` → „Kapitel 4.6", `E.1.1` → „Anhang E.1",
 * `C.2.14` → „Anhang C.2", `1.1` → „Kapitel 1".
 *
 * Kein Rückfall auf einen Platzhalter: eine Abschnittsnummer, die weder mit einer Ziffer noch mit
 * einem Buchstaben beginnt, ist ein Datenfehler und bricht die Erzeugung ab (Spec §7).
 */
export function chapterForSection(section: string): string {
  const segments = section.split('.');
  const chapter = segments.length === 1 ? section : segments.slice(0, -1).join('.');
  if (/^[0-9]/.test(chapter)) return `Kapitel ${chapter}`;
  if (/^[A-Za-z]/.test(chapter)) return `Anhang ${chapter}`;
  throw new Error(
    `Aus der Abschnittsnummer "${section}" lässt sich keine Kapitelbezeichnung ableiten.`,
  );
}

/** Bereich einer Abschnittsnummer: der Teil vor dem ersten Punkt — wie `blockersOf` ihn bildet. */
export function areaOf(section: string): string {
  const dot = section.indexOf('.');
  return dot === -1 ? section : section.slice(0, dot);
}
