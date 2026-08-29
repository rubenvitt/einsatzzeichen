import { loadSnapshot, type SymbolSummary } from './snapshot';

/**
 * Das Beispielzeichen des Quickstart: dasselbe Kompositionsrezept wie im Seitenkopf der
 * Startseite und auf der Grundlage-Seite (`recipe.E.1.1`, Bergungsgruppe, Anhang E.1) — damit
 * Leserinnen es wiedererkennen, statt auf jeder Seite ein anderes Zeichen zu sehen.
 *
 * Wirft statt eines stillen Rückfalls auf ein beliebiges Zeichen (Spec §7): fehlt es im Snapshot,
 * soll der Build es sagen. In einer eigenen Funktion, weil MDX-Exportblöcke (anders als
 * `.astro`-Frontmatter) nur Import-/Export-Anweisungen zulassen, kein `if`/`throw` an Ort und
 * Stelle — `quickstart.mdx` ruft diese Funktion nur auf.
 */
export function getQuickstartExample(): SymbolSummary {
  const snapshot = loadSnapshot();
  const example = snapshot.symbols.find((symbol) => symbol.id === 'recipe.E.1.1');
  if (example === undefined) {
    throw new Error(
      'Das Quickstart-Beispielzeichen (recipe.E.1.1) steht nicht im Katalog-Snapshot. ' +
        'Snapshot neu erzeugen: pnpm --filter @einsatzzeichen/website generate',
    );
  }
  return example;
}
