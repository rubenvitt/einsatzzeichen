// Legt das Änderungsprotokoll des Repos in jedes publizierbare Paket, bevor `publish.mjs` den
// Workspace auf npm schiebt (ESZ-133).
//
// Warum eine Kopie des Wurzel-CHANGELOG statt eines eigenen je Paket: Alle Pakete tragen dieselbe
// Version (`set-version.mjs`), und semantic-release schreibt ein gemeinsames CHANGELOG.md fort.
// Ein Verbraucher von `core` braucht dieselben Breaking Changes wie einer von `react` — die
// Regel-IDs und Exporte stehen ohnehin paketübergreifend in einem Eintrag. Begründung und
// verworfene Alternativen: docs/decisions/2026-10-18-esz-133-changelog-in-den-paketen.md.
//
// Warum erst beim Publish und nicht im Build: `pnpm build` läuft im Release-Workflow VOR
// semantic-release; der Eintrag der neuen Version entsteht erst im prepare-Schritt von
// `@semantic-release/changelog`. Eine Kopie im Build trüge also immer die Vorversion.
//
// Die Kopien sind per .gitignore ausgeschlossen; `files` in jeder package.json nimmt sie auf.
import { copyFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { paketverzeichnisse } from './changed-packages.mjs';

/**
 * Prüft, ob ein Änderungsprotokoll eine Versionsüberschrift für `version` trägt — so, wie der
 * konventionelle Generator sie schreibt: `## [6.4.0](…/compare/v6.3.1...v6.4.0) (2026-10-14)`.
 *
 * @param {string} changelog Inhalt von CHANGELOG.md
 * @param {string} version z. B. `6.4.0`
 * @returns {boolean}
 */
export function hasVersionEntry(changelog, version) {
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^#{1,3} \\[${escaped}\\]`, 'm').test(changelog);
}

/**
 * Kopiert `CHANGELOG.md` aus der Wurzel in jedes publizierbare Paket. Bricht ab, wenn der
 * Eintrag der aktuellen Version fehlt — ein Paket ohne ihn soll gar nicht erst auf npm landen.
 *
 * @param {object} input
 * @param {string} input.cwd Wurzel des Workspaces
 * @param {string} input.version Version des Releases (aus der Wurzel-package.json)
 * @returns {string[]} Verzeichnisnamen der Pakete, die eine Kopie bekommen haben
 */
export function copyChangelog({ cwd, version }) {
  const quelle = join(cwd, 'CHANGELOG.md');
  const changelog = readFileSync(quelle, 'utf8');
  if (!hasVersionEntry(changelog, version)) {
    throw new Error(
      `CHANGELOG.md hat keinen Eintrag für ${version} — die Pakete würden ohne ihn publiziert.`,
    );
  }
  const { publishable } = paketverzeichnisse(cwd);
  for (const name of publishable) {
    copyFileSync(quelle, join(cwd, 'packages', name, 'CHANGELOG.md'));
  }
  return publishable;
}
