/**
 * Die Erkennung eines **Wertimports** auf `snapshot.js` — als eigenes Modul, weil zwei Wächter sie
 * brauchen: `island-snapshot-imports.test.ts` (keine Insel zieht die 1,3-MB-JSON ins Browserbündel)
 * und `snapshot-load.test.ts` (kein Test zieht die erzeugte Datei in den Testlauf, während
 * `pnpm generate` sie gerade neu schreibt).
 *
 * Warum nicht die eine Testdatei aus der anderen importieren: Vitest registrierte deren Suiten
 * dann ein zweites Mal, unter falschem Dateinamen. Deshalb steht die Prüflogik hier, testfrei, und
 * ihre Gegenproben bleiben in `island-snapshot-imports.test.ts`, wo sie entstanden sind.
 */

/**
 * Ein Import auf `…/snapshot.js` — der bauzeitliche Lader, nicht `snapshot-schema`/`-client`.
 * Verankert am Zeilenanfang (`m`): ohne den Anker beginnt der Treffer beim Wort „import" in einem
 * darüberstehenden Kommentar und läuft bis zum echten `from`, womit das `type`-Schlüsselwort aus
 * dem Treffer fällt und jede saubere Datei als Verstoß gälte. Genau das ist beim ersten Entwurf
 * dieses Wächters passiert.
 */
const SNAPSHOT_IMPORT = /^\s*import\s+(type\s+)?([^;]*?)\s+from\s+['"]([^'"]*\/snapshot\.js)['"]/gm;

/** Kommentare vorab entfernen, damit auskommentierte Beispiele keinen Verstoß vortäuschen. */
function withoutComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
}

/**
 * Verstöße als Klartextzeilen statt als bloßes `true`/`false`: schlägt der Test an, soll die
 * Meldung die Datei und die verbotene Zeile nennen, nicht nur „erwartet false".
 */
export function snapshotValueImports(text: string): string[] {
  const offences: string[] = [];
  for (const [statement, typeKeyword, bindings] of withoutComments(text).matchAll(SNAPSHOT_IMPORT)) {
    if (typeKeyword !== undefined) continue; // `import type { … }` — beim Bauen entfernt.
    // Auch `import { type A, type B }` ist reiner Typimport: jede Bindung trägt `type`.
    const named = bindings
      .replace(/[{}]/g, '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    if (named.length > 0 && named.every((part) => part.startsWith('type '))) continue;
    offences.push(statement.trim().replace(/\s+/g, ' '));
  }
  return offences;
}
